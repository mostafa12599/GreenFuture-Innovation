const Activity = require('../models/Activity');
const User = require('../models/User');

exports.getActivities = async (req, res) => {
  try {
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const activities = await Activity.find(filter)
      .populate('user', 'name avatar department')
      .sort('-timestamp')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Activity.countDocuments(filter);

    res.json({
      activities,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalActivities: count
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (req.user._id.toString() !== userId && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view these activities' });
    }

    const activities = await Activity.find({ user: userId })
      .populate('user', 'name avatar department')
      .sort('-timestamp')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Activity.countDocuments({ user: userId });

    res.json({
      activities,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalActivities: count
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getActivityAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const timeFilter = {};

    if (startDate || endDate) {
      timeFilter.timestamp = {};
      if (startDate) timeFilter.timestamp.$gte = new Date(startDate);
      if (endDate) timeFilter.timestamp.$lte = new Date(endDate);
    }

    const [typeDistribution, userActivity, timelineData] = await Promise.all([
      Activity.aggregate([
        { $match: timeFilter },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]),

      Activity.aggregate([
        { $match: timeFilter },
        {
          $group: {
            _id: '$user',
            activityCount: { $sum: 1 }
          }
        },
        { $sort: { activityCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $project: {
            name: { $arrayElemAt: ['$userInfo.name', 0] },
            department: { $arrayElemAt: ['$userInfo.department', 0] },
            activityCount: 1
          }
        }
      ]),

      Activity.aggregate([
        { $match: timeFilter },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$timestamp'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ])
    ]);

    res.json({
      typeDistribution,
      userActivity,
      timelineData
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getActivitiesByType = async (req, res) => {
  try {
    const activities = await Activity.find({ type: req.params.type })
      .populate('user', 'name')
      .sort('-timestamp');
    res.json(activities);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};