import { Router } from 'express';
import { authenticateStrict } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import workoutController from './workout.controller.js';
import {
  createWorkoutSchema,
  updateWorkoutSchema,
  getWorkoutQuerySchema,
  workoutIdParamSchema,
} from './workout.validation.js';

/**
 * Express router for workout endpoints.
 * Base path: /api/v1/workouts
 * @type {import('express').Router}
 */
const router = Router();

// Protect all workout routes with JWT authentication
router.use(authenticateStrict);

// GET /api/v1/workouts - Fetch all workouts with optional date filtering and pagination
router.get('/', validate(getWorkoutQuerySchema, 'query'), workoutController.getAllWorkouts);

// GET /api/v1/workouts/:workoutId - Fetch a single workout by its ID
router.get('/:workoutId', validate(workoutIdParamSchema, 'params'), workoutController.getWorkoutByIdController);

// POST /api/v1/workouts - Create a new workout session with optional nested exercises and sets
router.post('/', validate(createWorkoutSchema, 'body'), workoutController.createWorkoutController);

// PUT/PATCH /api/v1/workouts/:workoutId - Update an existing workout's basic details
router.put('/:workoutId', validate(workoutIdParamSchema, 'params'), validate(updateWorkoutSchema, 'body'), workoutController.updateWorkoutController);

// DELETE /api/v1/workouts/:workoutId - Delete a workout session by ID
router.delete('/:workoutId', validate(workoutIdParamSchema, 'params'), workoutController.deleteWorkoutController);

export default router;