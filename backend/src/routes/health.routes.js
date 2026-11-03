import { Router } from 'express';
import { getHealthStatus } from '../controllers/health.controller.js';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Get API and Database connection health status
 * @access  Public
 */
router.get('/', getHealthStatus);

export default router;
