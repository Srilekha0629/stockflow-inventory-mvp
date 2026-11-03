import { pool } from '../config/db.js';

/**
 * Lists products belonging strictly to the specified tenant organization.
 *
 * @param {number} organizationId - Tenant organization ID from JWT
 * @param {string} [search] - Optional search filter for name or SKU
 * @returns {Promise<Array>} List of product records
 */
export async function listProducts(organizationId, search = '') {
let sql = `SELECT id, organization_id, name, sku, description, quantity, cost_price, selling_price, low_stock_threshold, created_at, updated_at
  FROM products
  WHERE organization_id = ?
  `;
  const params = [organizationId];

  if (search && search.trim()) {
    sql += ' AND (name LIKE ? OR sku LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  sql += ' ORDER BY updated_at DESC, id DESC';

  const [rows] = await pool.execute(sql, params);
  return rows.map(formatProduct);
}

/**
 * Retrieves a single product belonging to the specified organization.
 *
 * @param {number} organizationId - Tenant organization ID
 * @param {number} productId - Product ID
 * @returns {Promise<Object>} Product record
 */
export async function getProductById(organizationId, productId) {
  const [rows] = await pool.execute(
    `SELECT id, organization_id, name, sku, description, quantity,
            cost_price, selling_price, low_stock_threshold, created_at, updated_at
     FROM products
     WHERE id = ? AND organization_id = ?`,
    [productId, organizationId]
  );

  if (rows.length === 0) {
    const error = new Error('Product not found.');
    error.status = 404;
    throw error;
  }

  return formatProduct(rows[0]);
}

/**
 * Creates a new product scoped to the specified tenant organization.
 *
 * @param {number} organizationId - Tenant organization ID
 * @param {Object} productData
 * @returns {Promise<Object>} Created product
 */
export async function createProduct(organizationId, productData) {
  const {
    name,
    sku,
    description = '',
    quantity = 0,
    cost_price = 0,
    selling_price = 0,
    low_stock_threshold = 5,
  } = productData;

  const trimmedName = name.trim();
  const trimmedSku = sku.trim();
  const parsedQty = Math.max(0, parseInt(quantity, 10) || 0);
  const parsedCost = Math.max(0, parseFloat(cost_price) || 0);
  const parsedSelling = Math.max(0, parseFloat(selling_price) || 0);
  const parsedThreshold = Math.max(0, parseInt(low_stock_threshold, 10) || 5);
  // 1. Check if SKU already exists within this organization
  const [existing] = await pool.execute(
    'SELECT id FROM products WHERE organization_id = ? AND sku = ?',
    [organizationId, trimmedSku]
  );
  if (existing.length > 0) {
    const error = new Error(`A product with SKU "${trimmedSku}" already exists in your organization.`);
    error.status = 409;
    throw error;
  }
  try {
    const [result] = await pool.execute(
      `INSERT INTO products
        (organization_id, name, sku, description, quantity, cost_price, selling_price, low_stock_threshold)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        organizationId,
        trimmedName,
        trimmedSku,
        description ? description.trim() : null,
        parsedQty,
        parsedCost,
        parsedSelling,
        parsedThreshold,
      ]
    );
    return getProductById(organizationId, result.insertId);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
      const error = new Error(`A product with SKU "${trimmedSku}" already exists in your organization.`);
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

/**
 * Updates a product belonging to the specified tenant organization.
 *
 * @param {number} organizationId - Tenant organization ID
 * @param {number} productId - Product ID
 * @param {Object} updateData - Updated product fields
 * @returns {Promise<Object>} Updated product
 */
export async function updateProduct(organizationId, productId, updateData) {
  // 1. Verify existence and tenant ownership
  await getProductById(organizationId, productId);

  const {
    name,
    sku,
    description,
    quantity,
    cost_price,
    selling_price,
    low_stock_threshold,
  } = updateData;

  const trimmedName = name.trim();
  const trimmedSku = sku.trim();
  const parsedQty = Math.max(0, parseInt(quantity, 10) || 0);
  const parsedCost = Math.max(0, parseFloat(cost_price) || 0);
  const parsedSelling = Math.max(0, parseFloat(selling_price) || 0);
  const parsedThreshold = Math.max(0, parseInt(low_stock_threshold, 10) || 5);

  // 2. Check if new SKU is already taken by another product in this organization
  const [duplicate] = await pool.execute(
    'SELECT id FROM products WHERE organization_id = ? AND sku = ? AND id != ?',
    [organizationId, trimmedSku, productId]
  );

  if (duplicate.length > 0) {
    const error = new Error(`Another product with SKU "${trimmedSku}" already exists in your organization.`);
    error.status = 409;
    throw error;
  }

  try {
    await pool.execute(
      `UPDATE products
       SET name = ?, sku = ?, description = ?, quantity = ?, cost_price = ?, selling_price = ?, low_stock_threshold = ?
       WHERE id = ? AND organization_id = ?`,
      [
        trimmedName,
        trimmedSku,
        description ? description.trim() : null,
        parsedQty,
        parsedCost,
        parsedSelling,
        parsedThreshold,
        productId,
        organizationId,
      ]
    );

    return getProductById(organizationId, productId);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
      const error = new Error(`Another product with SKU "${trimmedSku}" already exists in your organization.`);
      error.status = 409;
      throw error;
    }
    throw err;
  }
}

/**
 * Deletes a product belonging to the specified tenant organization.
 *
 * @param {number} organizationId - Tenant organization ID
 * @param {number} productId - Product ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export async function deleteProduct(organizationId, productId) {
  const [result] = await pool.execute(
    'DELETE FROM products WHERE id = ? AND organization_id = ?',
    [productId, organizationId]
  );

  if (result.affectedRows === 0) {
    const error = new Error('Product not found.');
    error.status = 404;
    throw error;
  }

  return { success: true, message: 'Product deleted successfully.' };
}

/**
 * Computes dashboard metrics and low-stock products for the organization.
 * Low stock means quantity <= product threshold (default 5 if threshold is missing).
 *
 * @param {number} organizationId - Tenant organization ID
 * @returns {Promise<Object>} Dashboard metrics
 */
export async function getDashboardSummary(organizationId) {
  // 1. Total products count and total inventory quantity on hand
  const [totals] = await pool.execute(
    `SELECT COUNT(*) AS total_products, COALESCE(SUM(quantity), 0) AS total_quantity
     FROM products
     WHERE organization_id = ?`,
    [organizationId]
  );

  const totalProducts = parseInt(totals[0].total_products, 10) || 0;
  const totalQuantity = parseInt(totals[0].total_quantity, 10) || 0;

  // 2. Fetch products where quantity <= COALESCE(low_stock_threshold, 5)
  const [lowStockRows] = await pool.execute(
    `SELECT id, organization_id, name, sku, description, quantity,
            cost_price, selling_price, COALESCE(low_stock_threshold, 5) AS low_stock_threshold,
            created_at, updated_at
     FROM products
     WHERE organization_id = ? AND quantity <= COALESCE(low_stock_threshold, 5)
     ORDER BY quantity ASC, name ASC`,
    [organizationId]
  );

  const lowStockProducts = lowStockRows.map(formatProduct);

  return {
    totalProducts,
    totalQuantity,
    lowStockCount: lowStockProducts.length,
    lowStockProducts,
  };
}

/**
 * Helper to normalize numeric fields from MySQL strings to JS numbers.
 */
function formatProduct(row) {
  if (!row) return null;
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    sku: row.sku,
    description: row.description || '',
    quantity: parseInt(row.quantity, 10) || 0,
    costPrice: parseFloat(row.cost_price) || 0.0,
    sellingPrice: parseFloat(row.selling_price) || 0.0,
    lowStockThreshold: parseInt(row.low_stock_threshold, 10) || 5,
    isLowStock: (parseInt(row.quantity, 10) || 0) <= (parseInt(row.low_stock_threshold, 10) || 5),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
