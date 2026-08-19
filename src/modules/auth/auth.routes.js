import { Router } from 'express';
import { registerSchema, loginSchema } from './auth.validation.js';
import { register, login } from './auth.controller.js';
import validate from '../../middlewares/validate.middleware.js';

/**
 * @type {import('express').Router}
 */
const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

export default router;