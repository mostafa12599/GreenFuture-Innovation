const Campaign = require('../models/Campaign');
const CampaignMetric = require('../models/CampaignMetric');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.createCampaign = async (req, res) => {
  try {
    const campaign = new Campaign({
      ...req.body,
      createdBy: req.user._id
    });

    await campaign.save();

    const marketingTeam = await User.find({ role: 'marketing' });
    await Promise.all(marketingTeam.map(member => 
      Notification.create({
        user: member._id,
        title: 'New Marketing Campaign',
        message: `New campaign created: ${campaign.title}`,
        type: 'campaign',
        metadata: { campaignId: campaign._id }
      })
    ));

    res.status(201).json(campaign);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCampaigns = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;

    const campaigns = await Campaign.find(filter)
      .populate('createdBy', 'name')
      .sort('-startDate');

    res.json(campaigns);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const campaign = await Campaign.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    await Activity.create({
      user: req.user._id,
      type: 'campaign_update',
      action: 'Updated campaign',
      metadata: { campaignId: campaign._id }
    });

    res.json(campaign);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateCampaignMetrics = async (req, res) => {
  try {
    const { id } = req.params;
    const metrics = req.body;

    const campaignMetric = new CampaignMetric({
      campaign: id,
      ...metrics,
      recordedBy: req.user._id
    });

    await campaignMetric.save();

    await Campaign.findByIdAndUpdate(id, {
      $set: {
        'metrics.reach': metrics.reach,
        'metrics.engagement': metrics.engagement,
        'metrics.conversion': metrics.conversion,
        'metrics.roi': metrics.roi
      }
    });

    res.json(campaignMetric);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCampaignPerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const { timeframe } = req.query;

    let dateFilter = {};
    const now = new Date();

    switch (timeframe) {
      case 'week':
        dateFilter = { timestamp: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
        break;
      case 'month':
        dateFilter = { timestamp: { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) } };
        break;
      case 'quarter':
        dateFilter = { timestamp: { $gte: new Date(now - 90 * 24 * 60 * 60 * 1000) } };
        break;
      default:
        dateFilter = { timestamp: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } };
    }

    const metrics = await CampaignMetric.aggregate([
      {
        $match: {
          campaign: mongoose.Types.ObjectId(id),
          ...dateFilter
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" }
          },
          reach: { $avg: "$reach" },
          engagement: { $avg: "$engagement" },
          conversion: { $avg: "$conversion" },
          roi: { $avg: "$roi" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json(metrics);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const [campaignStats, typeStats, performanceMetrics] = await Promise.all([
      Campaign.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            totalBudget: { $sum: "$budget" }
          }
        }
      ]),

      Campaign.aggregate([
        {
          $group: {
            _id: "$type",
            averageROI: { $avg: "$metrics.roi" },
            totalReach: { $sum: "$metrics.reach" },
            count: { $sum: 1 }
          }
        }
      ]),

      Campaign.aggregate([
        {
          $match: { status: "active" }
        },
        {
          $group: {
            _id: null,
            totalReach: { $sum: "$metrics.reach" },
            averageEngagement: { $avg: "$metrics.engagement" },
            totalBudget: { $sum: "$budget" },
            averageROI: { $avg: "$metrics.roi" }
          }
        }
      ])
    ]);

    res.json({
      campaignStats,
      typeStats,
      performanceMetrics: performanceMetrics[0]
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('createdBy', 'name');
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCampaignMetrics = async (req, res) => {
  try {
    const metrics = await CampaignMetric.find({ campaign: req.params.id })
      .sort('-timestamp')
      .limit(30);
    res.json(metrics);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.shareReport = async (req, res) => {
  try {
    const { campaignId, recipients, message, format } = req.body;
    const campaign = await Campaign.findById(campaignId);
    
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const report = await generateReport(campaign, format);

    await Promise.all(recipients.map(recipientId => 
      Notification.create({
        user: recipientId,
        title: 'Campaign Report Shared',
        message: message || `Campaign report shared for: ${campaign.title}`,
        type: 'campaign',
        metadata: {
          campaignId,
          reportUrl: report.url
        }
      })
    ));

    res.json({ message: 'Report shared successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};