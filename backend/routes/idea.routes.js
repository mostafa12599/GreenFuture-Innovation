const router = require('express').Router();
const ideaController = require('../controllers/ideaController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, ideaController.submitIdea);
router.get('/', protect, ideaController.getAllIdeas);
router.get('/pending', protect, authorize('innovation_manager'), ideaController.getPendingIdeas);
router.get('/:id', protect, ideaController.getIdeaById);
router.put('/:id', protect, ideaController.updateIdea);
router.post('/:id/vote', protect, ideaController.voteOnIdea);
router.post('/:id/feedback', protect, ideaController.provideFeedback);
router.put('/:id/status', protect, authorize('innovation_manager'), ideaController.updateStatus);
router.get('/analytics', protect, authorize('innovation_manager'), ideaController.getAnalytics);
router.get('/department-stats', protect, ideaController.getDepartmentStats);
router.get('/timeline-stats', protect, ideaController.getTimelineStats);
router.put('/:id/evaluate', protect, authorize('innovation_manager'), ideaController.evaluateIdea);

module.exports = router;