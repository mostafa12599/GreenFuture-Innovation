const mongoose = require('mongoose');

const performanceMetricSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    responseTime: Number,
    errorRate: Number,
    uptime: Number,
    activeUsers: Number,
    cpuUsage: Number,
    memoryUsage: Number,
    apiCalls: Number,
    slowQueries: Number
  });

  module.exports = mongoose.model('PerformanceMetric', performanceMetricSchema);