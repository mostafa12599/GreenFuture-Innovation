const SupportTicket = require('../models/SupportTicket');
const SystemStatus = require('../models/SystemStatus');
const PerformanceMetric = require('../models/PerformanceMetric');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.createTicket = async (req, res) => {
  try {
    const ticket = new SupportTicket({
      ...req.body,
      reportedBy: req.user._id,
      department: req.user.department
    });

    await ticket.save();

    const itSupport = await User.find({ role: 'it_support' });
    await Promise.all(itSupport.map(support => 
      Notification.create({
        user: support._id,
        title: 'New Support Ticket',
        message: `New support ticket: ${ticket.title}`,
        type: 'support',
        metadata: { ticketId: ticket._id }
      })
    ));

    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTickets = async (req, res) => {
  try {
    const { status, priority, department } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (department) filter.department = department;

    if (req.user.role !== 'it_support') {
      filter.reportedBy = req.user._id;
    }

    const tickets = await SupportTicket.find(filter)
      .populate('reportedBy', 'name department')
      .populate('assignedTo', 'name')
      .sort('-createdAt');

    res.json(tickets);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.respondToTicket = async (req, res) => {
  try {
    const { response, status, internalNotes } = req.body;
    console.log(req.body);
    
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.responses.push({
      respondedBy: req.user._id,
      message: response,
      timestamp: new Date()
    });

    if (status) {
      ticket.status = status;
    }

    if (internalNotes) {
      ticket.internalNotes.push({
        addedBy: req.user._id,
        note: internalNotes,
        timestamp: new Date()
      });
    }

    await ticket.save();

    await Notification.create({
      user: ticket.reportedBy,
      title: 'Support Ticket Updated',
      message: `Your ticket "${ticket.title}" has received a response`,
      type: 'support',
      metadata: { ticketId: ticket._id }
    });

    res.json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSystemStatus = async (req, res) => {
  try {
    const status = await SystemStatus.findOne().sort('-timestamp');
    const metrics = await PerformanceMetric.find()
      .sort('-timestamp')
      .limit(1);

    const response = {
      status: status?.status || 'operational',
      lastUpdated: status?.timestamp,
      metrics: {
        responseTime: metrics[0]?.responseTime,
        errorRate: metrics[0]?.errorRate,
        uptime: metrics[0]?.uptime,
        activeUsers: metrics[0]?.activeUsers
      },
      components: status?.components || {}
    };

    res.json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getPerformanceMetrics = async (req, res) => {
  try {
    const { timeframe } = req.query;
    let timeFilter = {};

    switch (timeframe) {
      case 'day':
        timeFilter = { 
          timestamp: { 
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
          } 
        };
        break;
      case 'week':
        timeFilter = { 
          timestamp: { 
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
          } 
        };
        break;
      case 'month':
        timeFilter = { 
          timestamp: { 
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
          } 
        };
        break;
      default:
        timeFilter = { 
          timestamp: { 
            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) 
          } 
        };
    }

    const metrics = await PerformanceMetric.aggregate([
      { $match: timeFilter },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: "%Y-%m-%d-%H", 
              date: "$timestamp" 
            }
          },
          avgResponseTime: { $avg: "$responseTime" },
          avgErrorRate: { $avg: "$errorRate" },
          avgUptime: { $avg: "$uptime" },
          avgActiveUsers: { $avg: "$activeUsers" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json(metrics);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.logSystemUpdate = async (req, res) => {
  try {
    const { status, components, message } = req.body;

    const systemStatus = new SystemStatus({
      status,
      components,
      message,
      updatedBy: req.user._id,
      timestamp: new Date()
    });

    await systemStatus.save();

    if (status !== 'operational') {
      const users = await User.find({});
      await Promise.all(users.map(user => 
        Notification.create({
          user: user._id,
          title: 'System Status Update',
          message: `System status: ${status}. ${message}`,
          type: 'system',
          priority: 'high'
        })
      ));
    }

    res.json(systemStatus);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('reportedBy', 'name')
      .populate('assignedTo', 'name');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getRealTimeMetrics = async (req, res) => {
  try {
    const metrics = {
      activeUsers: await User.countDocuments({ lastActive: { $gte: new Date(Date.now() - 5 * 60000) } }),
      openTickets: await SupportTicket.countDocuments({ status: 'open' }),
      systemLoad: Math.random() * 100  
    };
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTicketHistory = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('responses.respondedBy', 'name')
      .select('responses status history');
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getSystemLogs = async (req, res) => {
  try {
    const logs = await SystemLog.find()
      .sort('-timestamp')
      .limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};