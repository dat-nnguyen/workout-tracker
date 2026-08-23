import { Router } from 'express';
import { authenticateStrict } from '../../middlewares/auth.middleware.js';
import validate from '../../middlewares/validate.middleware.js';
import exerciseController from './exercise.controller.js';
import { getExerciseQuerySchema, createExerciseSchema } from './exercise.validation.js';

/**
 * Express router for exercise endpoints.
 * Base path: /api/v1/exercises
 * @type {import('express').Router}
 */
const router = Router();

// Protect all exercise routes with JWT authentication
router.use(authenticateStrict);

// GET /api/v1/exercises - Fetch exercises with optional query filtering
router.get('/', validate(getExerciseQuerySchema, 'query'), exerciseController.getAllExercise);

// POST /api/v1/exercises - Create custom exercise
router.post('/', validate(createExerciseSchema, 'body'), exerciseController.addExercise);

export default router;