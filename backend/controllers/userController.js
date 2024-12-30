const User = require('../models/User');

exports.getProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user._id)
        .populate('activities')
        .populate('achievements');
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  exports.updateProfile = async (req, res) => {
    try {
      const allowedUpdates = ['name', 'bio', 'department', 'position'];
      const updates = Object.keys(req.body)
        .filter(key => allowedUpdates.includes(key))
        .reduce((obj, key) => {
          obj[key] = req.body[key];
          return obj;
        }, {});
  
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
      );
  
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  exports.getStatistics = async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      res.json(user.statistics);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  exports.getActivities = async (req, res) => {
    try {
      const activities = await Activity.find({ user: req.user._id })
        .sort('-timestamp')
        .limit(20);
      res.json(activities);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  exports.getAchievements = async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
      res.json(user.achievements);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  exports.updateAvatar = async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { avatar: avatarUrl } },
        { new: true }
      );
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  exports.changePassword = async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id).select('+password');
      
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
  
      user.password = newPassword;
      await user.save();
      
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  exports.updateSettings = async (req, res) => {
    try {
      const { emailNotifications, pushNotifications, language, darkMode, twoFactorAuth } = req.body;
      
      const user = await User.findByIdAndUpdate(
        req.user._id,
        {
          $set: {
            'settings.emailNotifications': emailNotifications,
            'settings.pushNotifications': pushNotifications,
            'settings.language': language,
            'settings.darkMode': darkMode,
            'settings.twoFactorAuth': twoFactorAuth
          }
        },
        { new: true }
      );
  
      res.json(user.settings);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  exports.getTeamMembers = async (req, res) => {
    try {
      const users = await User.find({ 
        department: req.user.department 
      }).select('name email role department');
      res.json(users);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };

  exports.getAchievements = async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('achievements');
      res.json(user.achievements);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };
  
  exports.getStatistics = async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('statistics');
      res.json(user.statistics);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  };