const router = require('express').Router();
const trainingController = require('../controllers/trainingController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('hr'), trainingController.createTraining);
router.get('/', protect, trainingController.getAllTrainings);
router.get('/my-trainings', protect, trainingController.getMyTrainings);
router.get('/:id', protect, trainingController.getTrainingById);
router.put('/:id', protect, authorize('hr'), trainingController.updateTraining);
router.delete('/:id', protect, authorize('hr'), trainingController.deleteTraining);
router.post('/:id/enroll', protect, trainingController.enrollInTraining);
router.post('/:id/complete', protect, trainingController.completeTraining);
router.get('/statistics', protect, authorize('hr'), trainingController.getTrainingStatistics);
router.get('/:id/enrollment-status', protect, trainingController.getEnrollmentStatus);
router.get('/:id/certificate', protect, trainingController.getCompletionCertificate);

module.exports = router;