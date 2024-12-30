const Training = require('../models/Training');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');

exports.createTraining = async (req, res) => {
  try {
    const training = new Training({
      ...req.body,
      createdBy: req.user._id
    });

    await training.save();

    const targetUsers = await User.find({ 
      department: training.department 
    });

    await Promise.all(targetUsers.map(user => 
      Notification.create({
        user: user._id,
        title: 'New Training Program',
        message: `New training program available: ${training.title}`,
        type: 'training',
        metadata: { trainingId: training._id }
      })
    ));

    res.status(201).json(training);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getMyTrainings = async (req, res) => {
  try {
    const trainings = await Training.find({
      'enrolledUsers.user': req.user._id
    }).populate('createdBy', 'name');

    res.json(trainings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.enrollInTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    
    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    const alreadyEnrolled = training.enrolledUsers.some(
      enrollment => enrollment.user.toString() === req.user._id.toString()
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ message: 'Already enrolled in this training' });
    }

    if (training.enrolledUsers.length >= training.capacity) {
      return res.status(400).json({ message: 'Training is at full capacity' });
    }

    training.enrolledUsers.push({
      user: req.user._id,
      status: 'enrolled',
      enrollmentDate: new Date()
    });

    await training.save();

    await Activity.create({
      user: req.user._id,
      type: 'training_enrollment',
      action: 'Enrolled in training',
      metadata: { trainingId: training._id }
    });

    res.json(training);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.completeTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    
    if (!training) {
      return res.status(404).json({ message: 'Training not found' });
    }

    const enrollmentIndex = training.enrolledUsers.findIndex(
      enrollment => enrollment.user.toString() === req.user._id.toString()
    );

    if (enrollmentIndex === -1) {
      return res.status(400).json({ message: 'Not enrolled in this training' });
    }

    training.enrolledUsers[enrollmentIndex].status = 'completed';
    training.enrolledUsers[enrollmentIndex].completionDate = new Date();

    await training.save();

    await Promise.all([
      Activity.create({
        user: req.user._id,
        type: 'training_completion',
        action: 'Completed training',
        metadata: { trainingId: training._id }
      }),
      User.findByIdAndUpdate(req.user._id, {
        $inc: { 'statistics.trainingsCompleted': 1 }
      })
    ]);

    res.json(training);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTrainingStatistics = async (req, res) => {
  try {
    const stats = await Training.aggregate([
      {
        $facet: {
          byDepartment: [
            {
              $group: {
                _id: '$department',
                totalTrainings: { $sum: 1 },
                avgCapacity: { $avg: '$capacity' },
                totalEnrolled: {
                  $sum: { $size: '$enrolledUsers' }
                }
              }
            }
          ],
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          completionRates: [
            {
              $unwind: '$enrolledUsers'
            },
            {
              $group: {
                _id: '$_id',
                totalEnrolled: { $sum: 1 },
                completed: {
                  $sum: {
                    $cond: [
                      { $eq: ['$enrolledUsers.status', 'completed'] },
                      1,
                      0
                    ]
                  }
                }
              }
            },
            {
              $project: {
                completionRate: {
                  $multiply: [
                    { $divide: ['$completed', '$totalEnrolled'] },
                    100
                  ]
                }
              }
            }
          ]
        }
      }
    ]);

    res.json(stats[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getAllTrainings = async (req, res) => {
  try {
    const trainings = await Training.find()
      .populate('createdBy', 'name')
      .sort('-startDate');
    res.json(trainings);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateTraining = async (req, res) => {
  try {
    const training = await Training.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!training) return res.status(404).json({ message: 'Training not found' });
    res.json(training);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTrainingById = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('enrolledUsers.user', 'name');
    if (!training) return res.status(404).json({ message: 'Training not found' });
    res.json(training);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteTraining = async (req, res) => {
  try {
    const training = await Training.findByIdAndDelete(req.params.id);
    if (!training) return res.status(404).json({ message: 'Training not found' });
    res.json({ message: 'Training deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getEnrollmentStatus = async (req, res) => {
  try {
    const enrollment = await Training.findOne({
      _id: req.params.id,
      'enrolledUsers.user': req.user._id
    }).select('enrolledUsers.$');
    res.json(enrollment?.enrolledUsers[0] || null);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getCompletionCertificate = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);
    const enrollment = training.enrolledUsers.find(
      e => e.user.toString() === req.user._id.toString() && e.status === 'completed'
    );
    
    if (!enrollment) {
      return res.status(400).json({ message: 'Training not completed' });
    }

    res.json({
      certificateUrl: `/certificates/${training._id}_${req.user._id}.pdf`,
      completionDate: enrollment.completionDate
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};