import { getExercise, createExercise } from './exercise.service.js';

/**
 * Controller to fetch the exercise catalog for the authenticated user.
 * Route: GET /api/v1/exercises
 *
 * @param {import('express').Request} req - Express request object containing optional query params (`category`, `name`).
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<import('express').Response | void>} HTTP response containing the list of exercises.
 */
export async function getAllExercise(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { category, name } = req.query;

    const exercises = await getExercise({ userId, category, name });
    return res.status(200).json({
      message: 'Exercises fetched successfully',
      data: exercises,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Controller to create a custom exercise for the authenticated user.
 * Route: POST /api/v1/exercises
 *
 * @param {import('express').Request} req - Express request object containing `{ name, category, favorite? }` in `req.body`.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<import('express').Response | void>} HTTP response containing the created exercise.
 */
export async function addExercise(req, res, next) {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { name, category, favorite } = req.body;

    const exercise = await createExercise({ userId, name, category, favorite });
    return res.status(201).json({
      message: 'Exercise created successfully',
      data: exercise,
    });
  } catch (error) {
    next(error);
  }
}

export default {
  getAllExercise,
  addExercise,
};