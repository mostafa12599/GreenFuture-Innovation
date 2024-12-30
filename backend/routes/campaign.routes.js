const router = require('express').Router();
const campaignController = require('../controllers/campaignController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('marketing'), campaignController.createCampaign);
router.get('/', protect, authorize('marketing'), campaignController.getCampaigns);
router.get('/:id', protect, authorize('marketing'), campaignController.getCampaignById);
router.put('/:id', protect, authorize('marketing'), campaignController.updateCampaign);
router.delete('/:id', protect, authorize('marketing'), campaignController.deleteCampaign);
router.get('/metrics', protect, authorize('marketing'), campaignController.getCampaignMetrics);
router.post('/:id/metrics', protect, authorize('marketing'), campaignController.updateCampaignMetrics);
router.get('/analytics', protect, authorize('marketing'), campaignController.getAnalytics);
router.get('/:id/performance', protect, authorize('marketing'), campaignController.getCampaignPerformance);
router.post('/share-report', protect, authorize('marketing'), campaignController.shareReport);

module.exports = router;