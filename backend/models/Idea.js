const mongoose = require('mongoose');

const ideaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'implemented'],
    default: 'pending'
  },
  implementationNotes: { type: String },
  category: { type: String, required: true },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  voteCount: { type: Number, default: 0 },
  feedback: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: String,
    type: { type: String, enum: ['employee', 'innovation_manager', 'hr', 'it_support', 'marketing'] },
    createdAt: { type: Date, default: Date.now }
  }],
  implementationDetails: {
    timeline: String,
    resources: String,
    budget: Number,
    status: String
  },
  marketingCampaign: {
    status: String,
    startDate: Date,
    endDate: Date,
    metrics: {
      reach: Number,
      engagement: Number,
      impact: String
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Idea', ideaSchema);