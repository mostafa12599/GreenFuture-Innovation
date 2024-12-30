const router = require('express').Router();
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/profile', protect, userController.getProfile);
router.put('/profile', protect, userController.updateProfile);
router.put('/settings', protect, userController.updateSettings);
router.put('/avatar', protect, upload.single('avatar'), userController.updateAvatar);
router.post('/change-password', protect, userController.changePassword);
router.get('/statistics', protect, userController.getStatistics);
router.get('/activities', protect, userController.getActivities);
router.get('/achievements', protect, userController.getAchievements);
router.get('/team-members', protect, userController.getTeamMembers);

module.exports = router;