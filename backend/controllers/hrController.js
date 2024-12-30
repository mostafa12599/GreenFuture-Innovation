const Training = require('../models/Training');

exports.createTraining = async (req, res) => {
  try {
    const training = new Training(req.body);
    await training.save();
    res.status(201).json(training);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTrainingStats = async (req, res) => {
  try {
    const stats = await Training.aggregate([
      {
        $group: {
          _id: '$department',
          totalTrainings: { $sum: 1 },
          avgCapacity: { $avg: '$capacity' },
          totalEnrolled: { $sum: { $size: '$enrolledUsers' } }
        }
      }
    ]);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};