const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
 title: { type: String, required: true },
 description: { type: String, required: true },
 type: {
   type: String,
   enum: ['awareness', 'lead_generation', 'engagement', 'conversion'],
   required: true
 },
 status: {
   type: String,
   enum: ['draft', 'active', 'paused', 'completed'],
   default: 'draft'
 },
 startDate: { type: Date, required: true },
 endDate: { type: Date, required: true },
 budget: { type: Number, required: true },
 targetAudience: { type: String, required: true },
 channels: [{
   type: String,
   enum: ['social_media', 'email', 'website', 'paid_ads', 'events']
 }],
 goals: {
   reach: Number,
   engagement: Number,
   conversion: Number,
   roi: Number
 },
 metrics: {
   reach: { type: Number, default: 0 },
   engagement: { type: Number, default: 0 },
   conversion: { type: Number, default: 0 },
   roi: { type: Number, default: 0 }
 },
 createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
 team: [{
   user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
   role: String
 }],
 content: [{
   title: String,
   type: String,
   status: String,
   dueDate: Date,
   assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
 }]
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);