const router = require("express").Router();
const activityController = require("../controllers/activityController");
const { protect } = require("../middleware/auth");

router.get("/", protect, activityController.getActivities);
router.get("/user/:userId", protect, activityController.getUserActivities);
router.get("/type/:type", protect, activityController.getActivitiesByType);
router.get("/analytics", protect, activityController.getActivityAnalytics);

module.exports = router;
