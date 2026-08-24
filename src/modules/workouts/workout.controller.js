import {
  getWorkouts,
  getWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
} from './workout.service.js';
import { NotFoundError } from '../../middlewares/error.middleware.js';

/**
 * Controller to fetch all workouts for the authenticated user with optional date filtering and pagination.
 * Route: GET /api/v1/workouts
 *
 * @param {import('express').Request} req - Express request object containing query params (`startDate`, `endDate`, `page`, `limit`).
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<import('express').Response | void>} HTTP response containing the list of workouts.
 */
export async function getAllWorkouts(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { startDate, endDate, page, limit } = req.query;

    const workouts = await getWorkouts({
      userId,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });

    return res.status(200).json({
      message: 'Workouts retrieved successfully',
      data: workouts,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to fetch a single workout by its ID.
 * Route: GET /api/v1/workouts/:workoutId (or :id)
 *
 * @param {import('express').Request} req - Express request object containing `workoutId` or `id` in `req.params`.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<import('express').Response | void>} HTTP response containing the workout details.
 */
export async function getWorkoutByIdController(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const workoutId = req.params.workoutId || req.params.id;

    const workout = await getWorkoutById({ workoutId, userId });

    if (!workout) {
      throw new NotFoundError('Workout not found');
    }

    return res.status(200).json({
      message: 'Workout retrieved successfully',
      data: workout,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to create a new workout session with optional nested exercises and sets.
 * Route: POST /api/v1/workouts
 *
 * @param {import('express').Request} req - Express request object containing `{ name, startedAt?, completedAt?, exercises? }` in `req.body`.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<import('express').Response | void>} HTTP response containing the created workout.
 */
export async function createWorkoutController(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { name, startedAt, completedAt, exercises } = req.body;

    const workout = await createWorkout({
      userId,
      name,
      startedAt,
      completedAt,
      exercises,
    });

    return res.status(201).json({
      message: 'Workout created successfully',
      data: workout,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to update an existing workout's basic details.
 * Route: PUT/PATCH /api/v1/workouts/:workoutId (or :id)
 *
 * @param {import('express').Request} req - Express request object containing updated fields in `req.body`.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<import('express').Response | void>} HTTP response containing the updated workout.
 */
export async function updateWorkoutController(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const workoutId = req.params.workoutId || req.params.id;
    const { name, startedAt, completedAt } = req.body;

    const workout = await updateWorkout({
      workoutId,
      userId,
      name,
      startedAt,
      completedAt,
    });

    return res.status(200).json({
      message: 'Workout updated successfully',
      data: workout,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to delete a workout session by ID.
 * Route: DELETE /api/v1/workouts/:workoutId (or :id)
 *
 * @param {import('express').Request} req - Express request object containing `workoutId` or `id` in `req.params`.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<import('express').Response | void>} HTTP response confirming workout deletion.
 */
export async function deleteWorkoutController(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const workoutId = req.params.workoutId || req.params.id;

    const workout = await deleteWorkout({ workoutId, userId });

    return res.status(200).json({
      message: 'Workout deleted successfully',
      data: workout,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getAllWorkouts,
  getWorkoutByIdController,
  createWorkoutController,
  updateWorkoutController,
  deleteWorkoutController,
};