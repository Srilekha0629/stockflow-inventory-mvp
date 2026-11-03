import { Router } from 'express';
import { signup, login } from '../controllers/auth.controller.js';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new tenant organization and its primary user account
 * @access  Public
 */
router.post('/signup', signup);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT with safe organization details
 * @access  Public
 */
router.post('/login', login);

export default router;
