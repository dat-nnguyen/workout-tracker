import { getVolumeMetrics, getExerciseProgression } from './metrics.service.js';

/**
 * Controller to fetch volume progression metrics for the authenticated user.
 * Route: GET /api/v1/metrics
 *
 * @param {import('express').Request} req - Express request object containing query params (`startDate`, `endDate`, `exerciseId`, `category`, `interval`).
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<import('express').Response | void>} HTTP response containing volume time-series data.
 */
export const getVolumeMetricsController = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { startDate, endDate, exerciseId, category, interval } = req.query;

    const metrics = await getVolumeMetrics({
      userId,
      startDate,
      endDate,
      exerciseId,
      category,
      interval,
    });

    return res.status(200).json({
      message: 'Volume metrics retrieved successfully',
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to fetch 1RM and volume progression history for a specific exercise.
 * Route: GET /api/v1/metrics/exercises/:exerciseId
 *
 * @param {import('express').Request} req - Express request object containing `exerciseId` in `req.params` and optional date bounds in `req.query`.
 * @param {import('express').Response} res - Express response object.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<import('express').Response | void>} HTTP response containing single-movement progression history.
 */
export const getExerciseProgressionController = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const { exerciseId } = req.params;
    const { startDate, endDate } = req.query;

    const metrics = await getExerciseProgression({
      userId,
      exerciseId,
      startDate,
      endDate,
    });

    return res.status(200).json({
      message: 'Exercise progression metrics retrieved successfully',
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getVolumeMetricsController,
  getExerciseProgressionController,
};
  