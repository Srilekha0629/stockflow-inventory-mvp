import { Router } from 'express';
import { signup } from '../controllers/auth.controller.js';

const router = Router();

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new tenant organization and its primary user account
 * @access  Public
 */
router.post('/signup', signup);

export default router;
