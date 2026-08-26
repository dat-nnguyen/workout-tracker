import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import YAML from 'yaml';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import authRoutes from './modules/auth/auth.routes.js';
import exerciseRoutes from './modules/exercises/exercise.routes.js';
import workoutRoutes from './modules/workouts/workout.routes.js';
import metricsRoutes from './modules/metrics/metrics.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load and parse OpenAPI specification YAML
const openApiPath = path.resolve(__dirname, '../docs/openapi.yaml');
const openApiFile = fs.readFileSync(openApiPath, 'utf8');
const swaggerDocument = YAML.parse(openApiFile);

/**
 * @type {import('express').Express} Express application.
 */
export const app = express();

// Standard Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'service is running',
    timestamp: new Date().toISOString(),
  });
});

// Swagger API Documentation UI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Route Mounts
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/exercises', exerciseRoutes);
app.use('/api/v1/workouts', workoutRoutes);
app.use('/api/v1/metrics', metricsRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;