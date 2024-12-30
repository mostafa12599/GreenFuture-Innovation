const router = require('express').Router();
const supportController = require('../controllers/supportController');
const { protect, authorize } = require('../middleware/auth');

router.post('/tickets', protect, supportController.createTicket);
router.get('/tickets', protect, supportController.getTickets);
router.get('/tickets/:id', protect, supportController.getTicketById);
router.put('/tickets/:id', protect, authorize('it_support'), supportController.updateTicket);
router.post('/tickets/:id/respond', protect, authorize('it_support'), supportController.respondToTicket);
router.get('/system-status', protect, supportController.getSystemStatus);
router.get('/performance-metrics', protect, authorize('it_support'), supportController.getPerformanceMetrics);
router.post('/system-update', protect, authorize('it_support'), supportController.logSystemUpdate);
router.get('/metrics/realtime', protect, supportController.getRealTimeMetrics);
router.get('/tickets/:id/history', protect, supportController.getTicketHistory);
router.get('/system/logs', protect, supportController.getSystemLogs);

module.exports = router;