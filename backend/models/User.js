const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ['employee', 'innovation_manager', 'hr', 'it_support', 'marketing'],
    required: true
  },
  department: { type: String, required: true },
  position: String,
  bio: String,
  avatar: String,
  statistics: {
    ideasSubmitted: { type: Number, default: 0 },
    ideasImplemented: { type: Number, default: 0 },
    votesReceived: { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 }
  },
  settings: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    darkMode: { type: Boolean, default: false },
    language: { type: String, default: 'en' },
    twoFactorAuth: { type: Boolean, default: false }
  },
  achievements: [{
    title: String,
    description: String,
    date: Date,
    icon: String
  }],
  activities: [{
    action: String,
    timestamp: { type: Date, default: Date.now },
    metadata: Object
  }]
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);