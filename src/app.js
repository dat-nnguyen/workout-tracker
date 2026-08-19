import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';

/**
 * @type {import('express').Express} Express application.
 */
export const app = express();

// Standard Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'success',
    message: 'service is running',
    timestamp: new Date().toISOString(),
  });
});

export default app;