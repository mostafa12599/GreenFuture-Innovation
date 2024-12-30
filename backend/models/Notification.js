const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['idea', 'comment', 'announcement', 'mention', 'support', 'campaign', 'system'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  read: { type: Boolean, default: false },
  metadata: {
    entityId: mongoose.Schema.Types.ObjectId,
    entityType: String,
    additionalData: mongoose.Schema.Types.Mixed
  },
  expiresAt: Date
}, { timestamps: true });

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

  module.exports = mongoose.model('Notification', notificationSchema);