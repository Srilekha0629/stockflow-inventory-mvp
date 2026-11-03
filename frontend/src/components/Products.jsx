import React, { useState, useEffect, useMemo } from 'react';

export default function Products({ user, onNavigateToDashboard }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    quantity: 0,
    cost_price: 0,
    selling_price: 0,
    low_stock_threshold: 5,
  });
  const [formErrors, setFormErrors] = useState({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [modalServerError, setModalServerError] = useState(null);

  const token = sessionStorage.getItem('stockflow_token');
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  const productsEndpoint = baseUrl.endsWith('/api')
    ? `${baseUrl}/products`
    : `${baseUrl}/api/products`;

  // Fetch products from backend
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(productsEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
        throw new Error(`Failed to fetch inventory items (HTTP ${res.status})`);
      }

      const json = await res.json();
      setProducts(json.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Unable to load products.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products by name or SKU
  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const term = search.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) || p.sku.toLowerCase().includes(term)
    );
  }, [products, search]);

  // Handle opening add modal
  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      quantity: 0,
      cost_price: 0,
      selling_price: 0,
      low_stock_threshold: 5,
    });
    setFormErrors({});
    setModalServerError(null);
    setIsAddModalOpen(true);
  };

  // Handle opening edit modal
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      quantity: product.quantity,
      cost_price: product.costPrice,
      selling_price: product.sellingPrice,
      low_stock_threshold: product.lowStockThreshold || 5,
    });
    setFormErrors({});
    setModalServerError(null);
  };

  // Validate form fields
  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Product name is required.';
    if (!formData.sku.trim()) errs.sku = 'SKU is required.';
    if (formData.quantity < 0) errs.quantity = 'Quantity cannot be negative.';
    if (formData.cost_price < 0) errs.cost_price = 'Cost price cannot be negative.';
    if (formData.selling_price < 0) errs.selling_price = 'Selling price cannot be negative.';
    if (formData.low_stock_threshold < 0) errs.low_stock_threshold = 'Threshold cannot be negative.';
    return errs;
  };

  // Submit Add or Edit
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    setFormErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setFormSubmitting(true);
    setModalServerError(null);

    const isEdit = Boolean(editingProduct);
    const endpoint = isEdit ? `${productsEndpoint}/${editingProduct.id}` : productsEndpoint;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          sku: formData.sku.trim().toUpperCase(),
          description: formData.description.trim(),
          quantity: parseInt(formData.quantity, 10) || 0,
          cost_price: parseFloat(formData.cost_price) || 0,
          selling_price: parseFloat(formData.selling_price) || 0,
          low_stock_threshold: parseInt(formData.low_stock_threshold, 10) || 5,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Failed to save product.');
      }

      // Close modal and refresh
      setIsAddModalOpen(false);
      setEditingProduct(null);
      await fetchProducts();
    } catch (err) {
      setModalServerError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete product action
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    setFormSubmitting(true);

    try {
      const res = await fetch(`${productsEndpoint}/${deletingProduct.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message || 'Failed to delete product.');
      }

      setDeletingProduct(null);
      await fetchProducts();
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 mb-1">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <span>Tenant Catalog: {user?.organizationName || 'My Organization'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Product Inventory Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create, search, update, and manage inventory levels scoped strictly to your organization.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-200 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            Add New Product
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchProducts} className="font-semibold underline ml-3 cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center space-x-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog by product name or SKU..."
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors"
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded cursor-pointer"
          >
            Clear
          </button>
        )}
        <div className="text-xs text-slate-500 font-medium px-2">
          {filteredProducts.length} of {products.length} Products
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm">Loading product inventory...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-4">Product Name</th>
                  <th scope="col" className="px-6 py-4">SKU</th>
                  <th scope="col" className="px-6 py-4 text-center">Quantity on Hand</th>
                  <th scope="col" className="px-6 py-4 text-center">Reorder Threshold</th>
                  <th scope="col" className="px-6 py-4 text-right">Selling Price</th>
                  <th scope="col" className="px-6 py-4 text-center">Stock Status</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const isLow = p.quantity <= (p.lowStockThreshold || 5);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        {p.description && (
                          <div className="text-xs text-slate-400 truncate max-w-xs">{p.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-700">
                        {p.sku}
                      </td>
                      <td className="px-6 py-4 text-center font-bold">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                          isLow
                            ? 'bg-amber-100 text-amber-800 font-bold border border-amber-200'
                            : 'bg-slate-100 text-slate-800'
                        }`}>
                          {p.quantity} units
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-mono text-xs text-slate-500">
                        {p.lowStockThreshold}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-900">
                        ${Number(p.sellingPrice).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            <span className="w-1.5 h-1.5 mr-1.5 bg-rose-600 rounded-full animate-pulse"></span>
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                            Adequate
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingProduct(p)}
                          className="px-2.5 py-1 text-xs font-semibold text-rose-600 hover:text-rose-900 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800">No Products in Catalog</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search
                ? `No items match your search term "${search}".`
                : 'Start tracking inventory by creating your first organization product.'}
            </p>
            <button
              onClick={handleOpenAddModal}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Add First Product
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT MODAL                                                          */}
      {/* ========================================================================= */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-xl border border-slate-200 overflow-hidden animate-fadeIn">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Edit Product Details' : 'Add New Inventory Product'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {modalServerError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                {modalServerError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ergonomic Office Chair"
                  className={`w-full px-3 py-2 text-sm rounded-lg border outline-none focus:ring-2 ${
                    formErrors.name ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-300 focus:ring-indigo-100 focus:border-indigo-500'
                  }`}
                />
                {formErrors.name && <p className="text-xs text-rose-600 mt-1">{formErrors.name}</p>}
              </div>

              {/* SKU */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  SKU (Stock Keeping Unit) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                  placeholder="e.g. CHAIR-ERG-01"
                  className={`w-full px-3 py-2 text-sm font-mono rounded-lg border outline-none focus:ring-2 ${
                    formErrors.sku ? 'border-rose-400 focus:ring-rose-100' : 'border-slate-300 focus:ring-indigo-100 focus:border-indigo-500'
                  }`}
                />
                {formErrors.sku && <p className="text-xs text-rose-600 mt-1">{formErrors.sku}</p>}
                <p className="text-[11px] text-slate-500 mt-0.5">Must be unique within your organization.</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief specifications or dimensions..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Quantity and Low Stock Threshold */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Initial Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                  />
                  {formErrors.quantity && <p className="text-xs text-rose-600 mt-1">{formErrors.quantity}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                    placeholder="Default: 5"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                  />
                  {formErrors.low_stock_threshold && (
                    <p className="text-xs text-rose-600 mt-1">{formErrors.low_stock_threshold}</p>
                  )}
                </div>
              </div>

              {/* Cost Price and Selling Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Cost Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Selling Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center"
                >
                  {formSubmitting && (
                    <svg className="w-3.5 h-3.5 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL                                                 */}
      {/* ========================================================================= */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 p-6 animate-fadeIn space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Delete Product Confirmation</h3>
              <p className="text-xs text-slate-500 mt-2">
                Are you sure you want to permanently delete{' '}
                <strong className="text-slate-800">{deletingProduct.name}</strong> (SKU:{' '}
                <span className="font-mono">{deletingProduct.sku}</span>)?
              </p>
              <p className="text-xs text-rose-600 font-medium mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex items-center justify-center space-x-3 pt-2">
              <button
                type="button"
                disabled={formSubmitting}
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={formSubmitting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center"
              >
                {formSubmitting && (
                  <svg className="w-3.5 h-3.5 mr-1.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
