const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'idea_submission',
      'idea_update',
      'comment',
      'vote',
      'profile_update',
      'training_enrollment',
      'training_completion',
      'support_ticket',
      'campaign_update'
    ],
    required: true
  },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metadata: {
    entityId: mongoose.Schema.Types.ObjectId,
    entityType: String,
    details: mongoose.Schema.Types.Mixed
  },
  public: { type: Boolean, default: true }
}, { timestamps: true });

activitySchema.index({ user: 1, timestamp: -1 });
activitySchema.index({ type: 1, timestamp: -1 });

  module.exports = mongoose.model('Activity', activitySchema);
