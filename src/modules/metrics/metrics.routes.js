import { Router } from 'express';
import { authenticateStrict } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import {
  getVolumeMetricsController,
  getExerciseProgressionController,
} from './metrics.controller.js';
import {
  analyticsQuerySchema,
  exerciseMetricsParamSchema,
} from './metrics.validation.js';

const router = Router();

// Protect all metrics routes with JWT authentication
router.use(authenticateStrict);

// 1. Static query routes first
router.get('/', validate(analyticsQuerySchema, 'query'), getVolumeMetricsController);
router.get('/volume', validate(analyticsQuerySchema, 'query'), getVolumeMetricsController);

// 2. Specific nested dynamic route (no collision)
router.get(
  '/exercises/:exerciseId',
  validate(exerciseMetricsParamSchema, 'params'),
  getExerciseProgressionController
);

export default router;
