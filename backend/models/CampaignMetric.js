const mongoose = require('mongoose');

const campaignMetricSchema = new mongoose.Schema({
 campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
 timestamp: { type: Date, default: Date.now },
 reach: Number,
 engagement: Number,
 conversion: Number,
 roi: Number,
 channelMetrics: {
   social_media: {
     reach: Number,
     engagement: Number,
     clicks: Number
   },
   email: {
     sent: Number,
     opened: Number,
     clicked: Number
   },
   website: {
     visits: Number,
     conversions: Number,
     bounceRate: Number
   },
   paid_ads: {
     impressions: Number,
     clicks: Number,
     cost: Number
   }
 },
 recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

campaignMetricSchema.index({ campaign: 1, timestamp: -1 });

module.exports = mongoose.model('CampaignMetric', campaignMetricSchema);