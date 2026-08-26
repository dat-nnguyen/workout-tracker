import { Router } from 'express';
import { registerSchema, loginSchema } from './auth.validation.js';
import { register, login } from './auth.controller.js';
import validate from '../../middlewares/validate.middleware.js';
import { authRateLimiter } from '../../middlewares/rateLimiter.middleware.js';

/**
 * @type {import('express').Router}
 */
const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);

export default router;