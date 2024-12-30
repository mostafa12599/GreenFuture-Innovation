const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/', protect, dashboardController.getDashboardData);
router.get('/department-stats', protect, dashboardController.getDepartmentStats);

module.exports = router;