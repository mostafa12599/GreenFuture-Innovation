const mongoose = require('mongoose');

const incentiveSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    points: { type: Number, required: true },
    reason: { type: String, required: true },
    idea: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  });

  module.exports = mongoose.model('Incentive', incentiveSchema);