import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import exerciseRoutes from './modules/exercises/exercise.routes.js';
import workoutRoutes from './modules/workouts/workout.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
/**
 * @type {import('express').Express} Express application.
 */
export const app = express();

// Standard Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes mounts
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/exercises', exerciseRoutes);
app.use('/api/v1/workouts', workoutRoutes);

// Error Handling Middleware
app.use(errorHandler);


app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'success',
    message: 'service is running',
    timestamp: new Date().toISOString(),
  });
});

export default app;