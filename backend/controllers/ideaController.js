const Idea = require('../models/Idea');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

exports.submitIdea = async (req, res) => {
  try {
    const idea = new Idea({
      ...req.body,
      submittedBy: req.user._id,
      department: req.user.department
    });

    await idea.save();

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'statistics.ideasSubmitted': 1 },
      $push: { ideas: idea._id }
    });

    await Activity.create({
      user: req.user._id,
      type: 'idea_submission',
      action: 'Submitted a new idea',
      metadata: { ideaId: idea._id }
    });

    const innovationManagers = await User.find({ role: 'innovation_manager' });
    await Promise.all(innovationManagers.map(manager => 
      Notification.create({
        user: manager._id,
        title: 'New Idea Submitted',
        message: `New idea submitted by ${req.user.name}`,
        type: 'idea',
        metadata: { ideaId: idea._id }
      })
    ));

    res.status(201).json(idea);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.voteOnIdea = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    if (idea.votes.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already voted' });
    }

    idea.votes.push(req.user._id);
    idea.voteCount = idea.votes.length;
    await idea.save();

    await User.findByIdAndUpdate(idea.submittedBy, {
      $inc: { 'statistics.votesReceived': 1 }
    });

    await Activity.create({
      user: req.user._id,
      type: 'vote',
      action: 'Voted on an idea',
      metadata: { ideaId: idea._id }
    });

    res.json(idea);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const ideaStats = await Idea.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          averageVotes: { $avg: '$voteCount' }
        }
      }
    ]);

    const departmentStats = await Idea.aggregate([
      {
        $group: {
          _id: '$department',
          totalIdeas: { $sum: 1 },
          implementedIdeas: {
            $sum: {
              $cond: [{ $eq: ['$status', 'implemented'] }, 1, 0]
            }
          },
          averageVotes: { $avg: '$voteCount' }
        }
      }
    ]);

    const monthlyTrends = await Idea.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          submissions: { $sum: 1 },
          approvals: {
            $sum: {
              $cond: [{ $eq: ['$status', 'approved'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      ideaStats,
      departmentStats,
      monthlyTrends
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, feedback } = req.body;
    const idea = await Idea.findById(req.params.id);

    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    idea.status = status;
    if (feedback) {
      idea.feedback.push({
        user: req.user._id,
        comment: feedback,
        type: 'status_update'
      });
    }

    await idea.save();

    await Notification.create({
      user: idea.submittedBy,
      title: 'Idea Status Updated',
      message: `Your idea "${idea.title}" has been ${status}`,
      type: 'idea',
      metadata: { ideaId: idea._id }
    });

    if (status === 'implemented') {
      await User.findByIdAndUpdate(idea.submittedBy, {
        $inc: { 'statistics.ideasImplemented': 1 }
      });
    }

    res.json(idea);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateIdea = async (req, res) => {
  try {
    const idea = await Idea.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!idea) return res.status(404).json({ message: 'Idea not found' });
    res.json(idea);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getIdeaById = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id)
      .populate('submittedBy', 'name')
      .populate('votes', 'name');
    if (!idea) return res.status(404).json({ message: 'Idea not found' });
    res.json(idea);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getPendingIdeas = async (req, res) => {
  try {
    const ideas = await Idea.find({ status: 'pending' })
      .populate('submittedBy', 'name')
      .sort('-createdAt');
    res.json(ideas);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllIdeas = async (req, res) => {
  try {
    const ideas = await Idea.find()
      .populate('submittedBy', 'name')
      .sort('-createdAt');
    res.json(ideas);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.provideFeedback = async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }
 
    const feedback = {
      user: req.user._id,
      comment: req.body.feedback,
      type: req.body.type || 'general',
      createdAt: new Date()
    };
 
    idea.feedback.push(feedback);
    await idea.save();
 
    await Notification.create({
      user: idea.submittedBy,
      title: 'New Feedback',
      message: `Your idea "${idea.title}" received new feedback`,
      type: 'idea',
      metadata: { ideaId: idea._id }
    });
 
    await Activity.create({
      user: req.user._id,
      type: 'idea_feedback',
      action: 'Provided feedback on idea',
      metadata: { ideaId: idea._id }
    });
 
    res.json(idea);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
 };

 exports.getDepartmentStats = async (req, res) => {
  try {
    const stats = await Idea.aggregate([
      {
        $group: {
          _id: '$department',
          totalIdeas: { $sum: 1 },
          implementedIdeas: {
            $sum: { $cond: [{ $eq: ['$status', 'implemented'] }, 1, 0] }
          },
          avgVotes: { $avg: '$voteCount' }
        }
      }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTimelineStats = async (req, res) => {
  try {
    const stats = await Idea.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          implemented: {
            $sum: { $cond: [{ $eq: ['$status', 'implemented'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.evaluateIdea = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(req.user)

    const { status, feedback, implementationNotes } = req.body;

    const idea = await Idea.findById(id);
    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }
    idea.status = status;
    console.log(idea.status);
    
    if (implementationNotes) {
      idea.implementationNotes = implementationNotes;
    }
    if (feedback) {
      idea.feedback.push({
        user: req.user._id,
        comment: feedback,
        type: req.user.role,
        createdAt: new Date()
      });
    }

    if (status === 'implemented') {
      await User.findByIdAndUpdate(idea.submittedBy, {
        $inc: { 'statistics.ideasImplemented': 1 }
      });

      await Activity.create({
        user: req.user._id,
        type: 'idea_implementation',
        action: 'Implemented idea',
        metadata: {
          ideaId: idea._id,
          ideaTitle: idea.title
        }
      });
    }
    console.log(idea);
    
    await idea.save();

    await Notification.create({
      user: idea.submittedBy,
      title: 'Idea Status Updated',
      message: `Your idea "${idea.title}" has been ${status}`,
      type: 'idea',
      metadata: {
        ideaId: idea._id,
        status: status
      }
    });
    const updatedIdea = await Idea.findById(id)
      .populate('submittedBy', 'name department')
      .populate('feedback.user', 'name');

    res.json(updatedIdea);
  } catch (error) {
    console.error('Error evaluating idea:', error);
    res.status(500).json({ message: 'Failed to evaluate idea', error: error.message });
  }
}