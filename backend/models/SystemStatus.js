const mongoose = require('mongoose');

const systemStatusSchema = new mongoose.Schema({
    status: {
      type: String,
      enum: ['operational', 'degraded', 'partial_outage', 'major_outage'],
      required: true
    },
    components: {
      database: {
        status: String,
        message: String
      },
      api: {
        status: String,
        message: String
      },
      fileStorage: {
        status: String,
        message: String
      }
    },
    message: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  });

  module.exports = mongoose.model('SystemStatus', systemStatusSchema);