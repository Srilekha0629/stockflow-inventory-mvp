import * as productService from '../services/product.service.js';

/**
 * Controller to list all products for the authenticated organization.
 * GET /api/products
 */
export const getProducts = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const search = req.query.search || '';

    const products = await productService.listProducts(organizationId, search);

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to fetch a single product by ID.
 * GET /api/products/:id
 */
export const getProduct = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const productId = parseInt(req.params.id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    const product = await productService.getProductById(organizationId, productId);

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * Controller to create a new product.
 * POST /api/products
 */
export const createProduct = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      name,
      sku,
      description,
      quantity,
      cost_price,
      selling_price,
      low_stock_threshold,
    } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required.',
      });
    }

    if (!sku || typeof sku !== 'string' || !sku.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product SKU is required.',
      });
    }

    // Validate numeric non-negative constraints
    if (quantity !== undefined && (isNaN(Number(quantity)) || Number(quantity) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative number.',
      });
    }

    if (cost_price !== undefined && (isNaN(Number(cost_price)) || Number(cost_price) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cost price must be a non-negative number.',
      });
    }

    if (selling_price !== undefined && (isNaN(Number(selling_price)) || Number(selling_price) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Selling price must be a non-negative number.',
      });
    }

    if (low_stock_threshold !== undefined && (isNaN(Number(low_stock_threshold)) || Number(low_stock_threshold) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Low stock threshold must be a non-negative number.',
      });
    }

    const createdProduct = await productService.createProduct(organizationId, {
      name,
      sku,
      description,
      quantity,
      cost_price,
      selling_price,
      low_stock_threshold,
    });

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: createdProduct,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * Controller to update an existing product.
 * PUT /api/products/:id
 */
export const updateProduct = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const productId = parseInt(req.params.id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    const {
      name,
      sku,
      description,
      quantity,
      cost_price,
      selling_price,
      low_stock_threshold,
    } = req.body;

    // Validate required fields
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required.',
      });
    }

    if (!sku || typeof sku !== 'string' || !sku.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product SKU is required.',
      });
    }

    // Validate numeric non-negative constraints
    if (quantity !== undefined && (isNaN(Number(quantity)) || Number(quantity) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a non-negative number.',
      });
    }

    if (cost_price !== undefined && (isNaN(Number(cost_price)) || Number(cost_price) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cost price must be a non-negative number.',
      });
    }

    if (selling_price !== undefined && (isNaN(Number(selling_price)) || Number(selling_price) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Selling price must be a non-negative number.',
      });
    }

    if (low_stock_threshold !== undefined && (isNaN(Number(low_stock_threshold)) || Number(low_stock_threshold) < 0)) {
      return res.status(400).json({
        success: false,
        message: 'Low stock threshold must be a non-negative number.',
      });
    }

    const updated = await productService.updateProduct(organizationId, productId, {
      name,
      sku,
      description,
      quantity,
      cost_price,
      selling_price,
      low_stock_threshold,
    });

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: updated,
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * Controller to delete a product.
 * DELETE /api/products/:id
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const productId = parseInt(req.params.id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID.',
      });
    }

    const result = await productService.deleteProduct(organizationId, productId);

    return res.status(200).json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * Controller to fetch dashboard metrics.
 * GET /api/products/summary or GET /api/dashboard/summary
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const summary = await productService.getDashboardSummary(organizationId);

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};
