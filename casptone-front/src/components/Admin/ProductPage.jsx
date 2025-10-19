import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../Header";
import { toast } from "sonner";
import { formatPrice } from "../../utils/currency";

// Custom styles for enhanced product management
const customStyles = `
  .product-card {
    transition: all 0.3s ease;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    overflow: hidden;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-color: #3b82f6;
  }
  
  .product-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
    background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    border-radius: 8px 8px 0 0;
  }
  
  .product-image-container {
    position: relative;
    overflow: hidden;
    border-radius: 8px 8px 0 0;
  }
  
  .table-product-image {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }
  
  .product-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    padding: 4px 8px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .product-badge.stocked {
    background: #dcfce7;
    color: #166534;
    border: 1px solid #bbf7d0;
  }
  
  .product-badge.made-to-order {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
  }
  
  .product-price {
    font-size: 1.5rem;
    font-weight: 700;
    color: #059669;
  }
  
  .product-cost {
    font-size: 0.875rem;
    color: #6b7280;
    text-decoration: line-through;
  }
  
  .product-margin {
    font-size: 0.75rem;
    color: #10b981;
    font-weight: 600;
  }
  
  .filter-button {
    transition: all 0.2s ease;
    border-radius: 8px;
    font-weight: 500;
  }
  
  .filter-button.active {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
  }
  
  .filter-button:not(.active) {
    background: white;
    color: #6b7280;
    border-color: #d1d5db;
  }
  
  .filter-button:not(.active):hover {
    background: #f9fafb;
    border-color: #9ca3af;
    color: #374151;
  }
  
  .search-input {
    border-radius: 8px;
    border: 1px solid #d1d5db;
    transition: all 0.2s ease;
  }
  
  .search-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .action-button {
    transition: all 0.2s ease;
    border-radius: 6px;
    font-weight: 500;
  }
  
  .action-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

// Product Form Modal Component
const ProductFormModal = ({ show, onHide, product, onSave }) => {
  const [formData, setFormData] = useState({
    product_name: "",
    product_code: "",
    description: "",
    category_name: "Stocked Products",
    unit_of_measure: "pcs",
    standard_cost: 0,
    price: 0,
    image: "",
    stock: 0,
    bom: []
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [materials, setMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);

  const apiBase = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
  const apiCall = useCallback(async (path, options = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    };

    const url = path.startsWith('http') ? path : `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, [apiBase]);

  const fetchMaterials = useCallback(async () => {
    setLoadingMaterials(true);
    try {
      const materialsData = await apiCall("/normalized-inventory/materials");
      setMaterials(materialsData);
    } catch (error) {
      console.error("Failed to fetch materials:", error);
    } finally {
      setLoadingMaterials(false);
    }
  }, [apiCall]);

  const fetchProductBOM = useCallback(async (productId) => {
    try {
      const bomData = await apiCall(`/products/${productId}/bom`);
      return bomData;
    } catch (error) {
      console.error("Failed to fetch BOM:", error);
      return [];
    }
  }, [apiCall]);

  const addBOMItem = () => {
    setFormData(prev => ({
      ...prev,
      bom: [...prev.bom, {
        material_id: "",
        quantity_per_product: 0,
        unit_of_measure: "pcs"
      }]
    }));
  };

  const removeBOMItem = (index) => {
    setFormData(prev => ({
      ...prev,
      bom: prev.bom.filter((_, i) => i !== index)
    }));
  };

  const updateBOMItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      bom: prev.bom.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  useEffect(() => {
    if (show) {
      fetchMaterials();
    }
  }, [show, fetchMaterials]);

  useEffect(() => {
    const loadProductData = async () => {
      if (product) {
        const bomData = await fetchProductBOM(product.id);
        setFormData({
          product_name: product.product_name || product.name || "",
          product_code: product.product_code || "",
          description: product.description || "",
          category_name: product.category_name || "Stocked Products",
          unit_of_measure: product.unit_of_measure || "pcs",
          standard_cost: product.standard_cost || 0,
          price: product.price || 0,
          image: product.image || "",
          stock: product.stock || 0,
          bom: bomData || []
        });
      } else {
        setFormData({
          product_name: "",
          product_code: "",
          description: "",
          category_name: "Stocked Products",
          unit_of_measure: "pcs",
          standard_cost: 0,
          price: 0,
          image: "",
          stock: 0,
          bom: []
        });
      }
      setErrors({});
    };

    loadProductData();
  }, [product, show, fetchProductBOM]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.product_name.trim()) newErrors.product_name = "Product name is required";
    if (!formData.product_code.trim()) newErrors.product_code = "Product code is required";
    if (formData.standard_cost < 0) newErrors.standard_cost = "Standard cost cannot be negative";
    if (formData.price < 0) newErrors.price = "Price cannot be negative";
    if (formData.stock < 0) newErrors.stock = "Stock cannot be negative";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (product) {
        await apiCall(`/products/${product.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiCall('/products', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }

      toast.success("📦 Product Saved Successfully!", {
        description: product 
          ? `"${formData.product_name}" has been updated.`
          : `"${formData.product_name}" has been added to the catalog.`,
        duration: 4000,
        style: {
          background: '#f0fdf4',
          border: '1px solid #86efac',
          color: '#166534'
        }
      });

      onSave();
      onHide();
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("❌ Product Save Failed", {
        description: "Unable to save the product. Please check your inputs and try again.",
        duration: 5000,
        style: {
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#dc2626'
        }
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const calculateMargin = () => {
    if (formData.standard_cost > 0 && formData.price > 0) {
      return ((formData.price - formData.standard_cost) / formData.price * 100).toFixed(1);
    }
    return 0;
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {product ? "Edit Product" : "Add New Product"}
            </h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className={`form-control ${errors.product_name ? "is-invalid" : ""}`}
                  value={formData.product_name}
                  onChange={(e) => handleChange("product_name", e.target.value)}
                />
                {errors.product_name && <div className="invalid-feedback">{errors.product_name}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Product Code *</label>
                <input
                  type="text"
                  className={`form-control ${errors.product_code ? "is-invalid" : ""}`}
                  value={formData.product_code}
                  onChange={(e) => handleChange("product_code", e.target.value)}
                />
                {errors.product_code && <div className="invalid-feedback">{errors.product_code}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={formData.category_name}
                  onChange={(e) => handleChange("category_name", e.target.value)}
                >
                  <option value="Stocked Products">Stocked Products</option>
                  <option value="Made to Order">Made to Order</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Unit of Measure</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.unit_of_measure}
                  onChange={(e) => handleChange("unit_of_measure", e.target.value)}
                  placeholder="pcs, kg, m, etc."
                />
              </div>
              <div className="col-md-4">
                <label className="form-label">Standard Cost</label>
                <input
                  type="number"
                  className={`form-control ${errors.standard_cost ? "is-invalid" : ""}`}
                  value={formData.standard_cost}
                  onChange={(e) => handleChange("standard_cost", Math.max(0, parseFloat(e.target.value) || 0))}
                  min="0"
                  step="0.01"
                />
                {errors.standard_cost && <div className="invalid-feedback">{errors.standard_cost}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label">Selling Price</label>
                <input
                  type="number"
                  className={`form-control ${errors.price ? "is-invalid" : ""}`}
                  value={formData.price}
                  onChange={(e) => handleChange("price", Math.max(0, parseFloat(e.target.value) || 0))}
                  min="0"
                  step="0.01"
                />
                {errors.price && <div className="invalid-feedback">{errors.price}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label">Current Stock</label>
                <input
                  type="number"
                  className={`form-control ${errors.stock ? "is-invalid" : ""}`}
                  value={formData.stock}
                  onChange={(e) => handleChange("stock", Math.max(0, parseFloat(e.target.value) || 0))}
                  min="0"
                  step="0.01"
                />
                {errors.stock && <div className="invalid-feedback">{errors.stock}</div>}
              </div>
              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Product description..."
                />
              </div>
              <div className="col-12">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  className="form-control"
                  value={formData.image}
                  onChange={(e) => handleChange("image", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              {formData.standard_cost > 0 && formData.price > 0 && (
                <div className="col-12">
                  <div className="alert alert-info">
                    <strong>Profit Margin:</strong> {calculateMargin()}% 
                    <span className="ms-3">
                      <strong>Profit:</strong> ₱{(formData.price - formData.standard_cost).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              
              {/* BOM Section */}
              <div className="col-12">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">Bill of Materials (BOM)</h6>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={addBOMItem}
                      disabled={loadingMaterials}
                    >
                      <i className="fas fa-plus me-1"></i>
                      Add Material
                    </button>
                  </div>
                  <div className="card-body">
                    {loadingMaterials ? (
                      <div className="text-center py-3">
                        <div className="spinner-border spinner-border-sm" role="status">
                          <span className="visually-hidden">Loading materials...</span>
                        </div>
                        <p className="mt-2 mb-0 text-muted">Loading materials...</p>
                      </div>
                    ) : formData.bom.length === 0 ? (
                      <div className="text-center py-4 text-muted">
                        <i className="fas fa-box-open fa-2x mb-2"></i>
                        <p>No materials added yet. Click "Add Material" to get started.</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Material</th>
                              <th>Quantity</th>
                              <th>Unit</th>
                              <th>Cost</th>
                              <th>Total</th>
                              <th width="50">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {formData.bom.map((item, index) => {
                              const material = materials.find(m => m.material_id === item.material_id);
                              const unitCost = parseFloat(material?.standard_cost) || 0;
                              const totalCost = item.quantity_per_product * unitCost;
                              
                              return (
                                <tr key={index}>
                                  <td>
                                    <select
                                      className="form-select form-select-sm"
                                      value={item.material_id}
                                      onChange={(e) => updateBOMItem(index, 'material_id', e.target.value)}
                                    >
                                      <option value="">Select Material</option>
                                      {materials.map(material => (
                                        <option key={material.material_id} value={material.material_id}>
                                          {material.material_name} ({material.material_code})
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control form-control-sm"
                                      value={item.quantity_per_product || 0}
                                      onChange={(e) => updateBOMItem(index, 'quantity_per_product', parseFloat(e.target.value) || 0)}
                                      min="0"
                                      step="0.0001"
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={item.unit_of_measure}
                                      onChange={(e) => updateBOMItem(index, 'unit_of_measure', e.target.value)}
                                      placeholder="pcs, kg, etc."
                                    />
                                  </td>
                                  <td>
                                    <span className="text-muted">₱{(unitCost || 0).toFixed(2)}</span>
                                  </td>
                                  <td>
                                    <span className="fw-semibold">₱{(totalCost || 0).toFixed(2)}</span>
                                  </td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-outline-danger"
                                      onClick={() => removeBOMItem(index)}
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="table-light">
                              <td colSpan="4" className="text-end fw-bold">Total BOM Cost:</td>
                              <td className="fw-bold">
                                ₱{formData.bom.reduce((sum, item) => {
                                  const material = materials.find(m => m.material_id === item.material_id);
                                  return sum + (item.quantity_per_product * (parseFloat(material?.standard_cost) || 0));
                                }, 0).toFixed(2)}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : (product ? "Update" : "Add")} Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Product Management Component
const ProductPage = () => {
  console.log("🚀 Enhanced ProductPage component loaded!");
  
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all"); // "all", "stocked", "made_to_order"
  const [viewMode, setViewMode] = useState("grid"); // "grid", "table"

  const apiBase = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000/api";
  const apiCall = useCallback(async (path, options = {}) => {
    const token = localStorage.getItem("token");
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    };

    const url = path.startsWith('http') ? path : `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }, [apiBase]);

  const getImageUrl = useCallback((product) => {
    if (!product.image) {
      // Return a data URI placeholder instead of a file path
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }
    
    // If it's already a full URL, return as is
    if (product.image.startsWith('http')) {
      return product.image;
    }
    
    // If it's a relative path, prepend the API base URL
    const baseUrl = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";
    
    // Handle different image path formats
    let imagePath = product.image;
    if (imagePath.startsWith('storage/')) {
      // Already has storage/ prefix
      return `${baseUrl}/${imagePath}`;
    } else if (imagePath.startsWith('products/')) {
      // Has products/ prefix, add storage/
      return `${baseUrl}/storage/${imagePath}`;
    } else if (!imagePath.startsWith('/')) {
      // No leading slash, add storage/
      return `${baseUrl}/storage/${imagePath}`;
    } else {
      // Has leading slash, remove it and add storage/
      return `${baseUrl}/storage${imagePath}`;
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const productsData = await apiCall("/products");
      console.log("📦 Products loaded:", productsData);
      console.log("🖼️ Product images:", productsData.map(p => ({ 
        name: p.product_name || p.name, 
        image: p.image,
        constructedUrl: getImageUrl(p)
      })));
      setProducts(productsData);
      setFilteredProducts(productsData);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch products. Check API settings.");
    } finally {
      setLoading(false);
    }
  }, [apiCall, getImageUrl]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product => {
        const productName = product.product_name || product.name || '';
        return productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
               product.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Filter by category
    if (categoryFilter === "stocked") {
      filtered = filtered.filter(product => 
        product.category_name === "Stocked Products" || 
        product.category_name === "stocked"
      );
    } else if (categoryFilter === "made_to_order") {
      filtered = filtered.filter(product => 
        product.category_name === "Made to Order" || 
        product.category_name === "made_to_order"
      );
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return;
    }

    try {
      await apiCall(`/products/${productId}`, {
        method: 'DELETE'
      });
      
      toast.success("🗑️ Product Deleted Successfully!", {
        description: "Product has been removed from the catalog.",
        duration: 4000,
        style: {
          background: '#f0fdf4',
          border: '1px solid #86efac',
          color: '#166534'
        }
      });
      
      await fetchProducts();
    } catch (error) {
      console.error("Delete product error:", error);
      toast.error("❌ Product Deletion Failed", {
        description: "Unable to delete the product. Please try again.",
        duration: 5000,
        style: {
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#dc2626'
        }
      });
    }
  };

  const handleToggleAvailability = async (product) => {
    if (product.category_name !== 'Made to Order' && product.category_name !== 'made_to_order') {
      return;
    }

    const currentStatus = product.is_available !== false ? 'available' : 'not available';
    const newStatus = product.is_available !== false ? 'not available' : 'available';
    
    const confirmMessage = `Are you sure you want to change the availability of "${product.product_name || product.name}" from ${currentStatus} to ${newStatus} for Made to Order?\n\nThis will affect whether customers can add this product to their cart.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await apiCall(`/products/${product.id}/toggle-availability`, {
        method: 'POST'
      });
      
      toast.success("🔄 Availability Updated!", {
        description: `Product is now ${response.is_available_for_order ? 'available' : 'not available'} for Made to Order.`,
        duration: 4000,
        style: {
          background: '#f0fdf4',
          border: '1px solid #86efac',
          color: '#166534'
        }
      });
      
      await fetchProducts();
    } catch (error) {
      console.error("Toggle availability error:", error);
      
      toast.error("❌ Failed to Update Availability", {
        description: `Unable to update product availability. ${error.message || 'Please check your authentication and try again.'}`,
        duration: 5000,
        style: {
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#dc2626'
        }
      });
    }
  };

  const getProductAvailability = (product) => {
    if (product.category_name === "Made to Order" || product.category_name === "made_to_order") {
      return { available: true, text: "Available for Made to Order", variant: "success" };
    } else {
      const stock = product.stock || 0;
      if (stock > 10) {
        return { available: true, text: "In Stock", variant: "success" };
      } else if (stock > 0) {
        return { available: true, text: "Low Stock", variant: "warning" };
      } else {
        return { available: false, text: "Out of Stock", variant: "danger" };
      }
    }
  };

  const calculateMargin = (product) => {
    if (product.standard_cost > 0 && product.price > 0) {
      return ((product.price - product.standard_cost) / product.price * 100).toFixed(1);
    }
    return 0;
  };


  return (
    <AppLayout>
      <style>{customStyles}</style>
      <div className="container-fluid py-4">
        {/* Navigation */}
        <div className="d-flex gap-2 mb-3">
          <button className="btn btn-outline-secondary" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </button>
        </div>

        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h2 className="mb-1 text-dark">
              Unick Products
            </h2>
          </div>
          <button className="btn btn-primary" onClick={handleAddProduct}>
            <i className="fas fa-plus me-2"></i>
            Add Product
          </button>
        </div>

        {/* Filters and Search */}
        <div className="row mb-4">
          <div className="col-md-6">
            <div style={{ 
              display: 'flex',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'white',
              border: '1px solid #e5e7eb'
            }}>
              <input
                type="text"
                placeholder="Search woodcraft products"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  flex: 1,
                  height: '45px', 
                  fontSize: '16px',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'white',
                  color: '#374151',
                  padding: '0 16px',
                  borderRadius: '8px 0 0 8px'
                }}
              />
              <button 
                type="button"
                style={{
                  backgroundColor: '#8B4513',
                  border: 'none',
                  height: '45px',
                  padding: '0 20px',
                  minWidth: '60px',
                  borderRadius: '0 8px 8px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-search text-white" style={{ fontSize: '16px' }}></i>
              </button>
            </div>
          </div>
          <div className="col-md-4">
            <div className="btn-group w-100" role="group">
              <button
                className={`btn filter-button ${categoryFilter === "all" ? "active" : ""}`}
                onClick={() => setCategoryFilter("all")}
              >
                All Products
              </button>
              <button
                className={`btn filter-button ${categoryFilter === "stocked" ? "active" : ""}`}
                onClick={() => setCategoryFilter("stocked")}
              >
                Stocked
              </button>
              <button
                className={`btn filter-button ${categoryFilter === "made_to_order" ? "active" : ""}`}
                onClick={() => setCategoryFilter("made_to_order")}
              >
                Made to Order
              </button>
            </div>
          </div>
          <div className="col-md-2">
            <div className="btn-group w-100" role="group">
              <button
                className={`btn ${viewMode === "grid" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
              >
                <i className="fas fa-th"></i>
              </button>
              <button
                className={`btn ${viewMode === "table" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setViewMode("table")}
                title="Table View"
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading products...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger">{error}</div>
        )}

        {/* Products Display */}
        {!loading && !error && (
          <>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No products found</h5>
                <p className="text-muted">
                  {searchTerm || categoryFilter !== "all" 
                    ? "Try adjusting your search or filters" 
                    : "Add your first product to get started"
                  }
                </p>
                {!searchTerm && categoryFilter === "all" && (
                  <button className="btn btn-primary" onClick={handleAddProduct}>
                    <i className="fas fa-plus me-2"></i>
                    Add Product
                  </button>
                )}
              </div>
            ) : (
              <>
                {viewMode === "grid" ? (
                  <div className="row">
                    {filteredProducts.map((product) => {
                      const availability = getProductAvailability(product);
                      const margin = calculateMargin(product);
                      
                      return (
                        <div key={product.id} className="col-lg-4 col-md-6 mb-4">
                          <div className="product-card h-100 position-relative">
                            <div className="position-relative product-image-container">
                              <img
                                src={getImageUrl(product)}
                                alt={product.product_name || product.name}
                                className="product-image"
                                onError={(e) => {
                                  console.log('Image failed to load:', product.image, 'Constructed URL:', getImageUrl(product));
                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                                }}
                              />
                              <div className={`product-badge ${product.category_name === "Made to Order" ? "made-to-order" : "stocked"}`}>
                                {product.category_name === "Made to Order" ? "Made to Order" : "Stocked"}
                              </div>
                            </div>
                            <div className="p-3">
                              <h5 className="mb-2">{product.product_name || product.name}</h5>
                              <p className="text-muted small mb-2">{product.description}</p>
                              <div className="mb-2">
                                <code className="small bg-light px-2 py-1 rounded">{product.product_code}</code>
                              </div>
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <div>
                                  <div className="product-price">{formatPrice(product.price)}</div>
                                  <div className="product-cost">{formatPrice(product.standard_cost)}</div>
                                </div>
                                <div className="text-end">
                                  <div className="product-margin">{margin}% margin</div>
                                  <div className="small text-muted">
                                    {product.category_name === "Made to Order" ? "On Demand" : `${product.stock || 0} in stock`}
                                  </div>
                                </div>
                              </div>
                              <div className="mb-3">
                                <span className={`badge bg-${availability.variant}`}>
                                  {availability.text}
                                </span>
                                {product.bom && product.bom.length > 0 && (
                                  <div className="mt-2">
                                    <small className="text-muted">
                                      <i className="fas fa-cogs me-1"></i>
                                      {product.bom.length} material{product.bom.length !== 1 ? 's' : ''} in BOM
                                    </small>
                                  </div>
                                )}
                              </div>
                              <div className="d-flex gap-2">
                                {(product.category_name === 'Made to Order' || product.category_name === 'made_to_order') && (
                                  <button
                                    className={`btn btn-sm ${product.is_available ? 'btn-outline-success' : 'btn-outline-danger'} action-button`}
                                    onClick={() => handleToggleAvailability(product)}
                                    title={product.is_available ? 'Mark as Not Available' : 'Mark as Available'}
                                  >
                                    <i className={`fas ${product.is_available ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                                  </button>
                                )}
                                <button
                                  className="btn btn-sm btn-outline-primary action-button flex-fill"
                                  onClick={() => handleEditProduct(product)}
                                >
                                  <i className="fas fa-edit me-1"></i>
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-danger action-button"
                                  onClick={() => handleDeleteProduct(product.id)}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="card">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Product</th>
                            <th>Code</th>
                            <th>Category</th>
                            <th className="text-end">Price</th>
                            <th className="text-end">Cost</th>
                            <th className="text-end">Margin</th>
                            <th className="text-end">Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((product) => {
                            const availability = getProductAvailability(product);
                            const margin = calculateMargin(product);
                            
                            return (
                              <tr key={product.id}>
                                <td>
                                  <div className="d-flex align-items-center">
                                    <img
                                      src={getImageUrl(product)}
                                      alt={product.product_name || product.name}
                                      className="table-product-image me-3"
                                      onError={(e) => {
                                        console.log('Table image failed to load:', product.image, 'Constructed URL:', getImageUrl(product));
                                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5ObyBJbWFnZTwvdGV4dD48L3N2Zz4=';
                                      }}
                                    />
                                    <div>
                                      <div className="fw-semibold">{product.product_name || product.name}</div>
                                      <small className="text-muted">{product.description?.substring(0, 50)}...</small>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <code className="small bg-light px-2 py-1 rounded">{product.product_code}</code>
                                </td>
                                <td>
                                  <span className={`badge ${product.category_name === "Made to Order" ? "bg-warning" : "bg-primary"}`}>
                                    {product.category_name}
                                  </span>
                                </td>
                                <td className="text-end fw-semibold text-success">
                                  {formatPrice(product.price)}
                                </td>
                                <td className="text-end text-muted">
                                  {formatPrice(product.standard_cost)}
                                </td>
                                <td className="text-end">
                                  <span className="text-success fw-semibold">{margin}%</span>
                                </td>
                                <td className="text-end">
                                  {product.category_name === "Made to Order" ? (
                                    <span className="text-muted">N/A</span>
                                  ) : (
                                    <span className="fw-semibold">{product.stock || 0}</span>
                                  )}
                                </td>
                                <td>
                                  <span className={`badge bg-${availability.variant}`}>
                                    {availability.text}
                                  </span>
                                </td>
                                <td>
                                  <div className="d-flex gap-1">
                                    {(product.category_name === 'Made to Order' || product.category_name === 'made_to_order') && (
                                      <button
                                        className={`btn btn-sm ${product.is_available ? 'btn-outline-success' : 'btn-outline-danger'} action-button`}
                                        onClick={() => handleToggleAvailability(product)}
                                        title={product.is_available ? 'Mark as Not Available' : 'Mark as Available'}
                                      >
                                        <i className={`fas ${product.is_available ? 'fa-toggle-on' : 'fa-toggle-off'}`}></i>
                                      </button>
                                    )}
                                    <button
                                      className="btn btn-sm btn-outline-primary action-button"
                                      onClick={() => handleEditProduct(product)}
                                      title="Edit Product"
                                    >
                                      <i className="fas fa-edit"></i>
                                    </button>
                                    <button
                                      className="btn btn-sm btn-outline-danger action-button"
                                      onClick={() => handleDeleteProduct(product.id)}
                                      title="Delete Product"
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Product Form Modal */}
        <ProductFormModal
          show={showProductModal}
          onHide={() => setShowProductModal(false)}
          product={editingProduct}
          onSave={fetchProducts}
        />
      </div>
    </AppLayout>
  );
};

export default ProductPage;