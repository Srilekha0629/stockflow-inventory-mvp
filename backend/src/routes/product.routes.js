import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getDashboardStats,
} from '../controllers/product.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all product endpoints with JWT authentication middleware
router.use(authenticate);

/**
 * @route   GET /api/products/summary
 * @desc    Get dashboard metrics (total products, total quantity, low stock list)
 * @access  Private (Scoped to Tenant Organization)
 */
router.get('/summary', getDashboardStats);

/**
 * @route   GET /api/products
 * @desc    List products belonging to the authenticated tenant organization
 * @access  Private (Scoped to Tenant Organization)
 */
router.get('/', getProducts);

/**
 * @route   POST /api/products
 * @desc    Create a product for the authenticated tenant organization
 * @access  Private (Scoped to Tenant Organization)
 */
router.post('/', createProduct);

/**
 * @route   GET /api/products/:id
 * @desc    Get a single product by ID (scoped to tenant)
 * @access  Private (Scoped to Tenant Organization)
 */
router.get('/:id', getProduct);

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product (scoped to tenant)
 * @access  Private (Scoped to Tenant Organization)
 */
router.put('/:id', updateProduct);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product (scoped to tenant)
 * @access  Private (Scoped to Tenant Organization)
 */
router.delete('/:id', deleteProduct);

export default router;
