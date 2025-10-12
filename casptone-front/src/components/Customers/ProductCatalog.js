// src/components/ProductCatalog.js
import React, { useState, memo } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import "./product_catalog.css";

const ProductCatalog = ({ products }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Debug logging
  console.log("ProductCatalog received products:", products);
  console.log("Products length:", products?.length || 0);

  // Enhanced categorization for the 3 main products
  const categorizeProducts = (products) => {
    const chairs = products.filter(product => 
      product.name.toLowerCase().includes('chair') ||
      product.name.toLowerCase().includes('wooden chair')
    );
    const tables = products.filter(product => 
      product.name.toLowerCase().includes('table') ||
      product.name.toLowerCase().includes('dining table')
    );
    const alkansya = products.filter(product => 
      product.name.toLowerCase().includes('alkansya')
    );
    const other = products.filter(product => 
      !product.name.toLowerCase().includes('alkansya') &&
      !product.name.toLowerCase().includes('table') &&
      !product.name.toLowerCase().includes('chair') &&
      !product.name.toLowerCase().includes('dining')
    );
    
    return { chairs, tables, alkansya, other };
  };

  const { chairs, tables, alkansya, other } = categorizeProducts(products);

  const handleShowModal = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError(null);
  };

  const handleAddToCart = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You need to be logged in to add to cart.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        "http://localhost:8000/api/cart",
        {
          product_id: selectedProduct.id,
          quantity: quantity,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Added to cart:", response.data);
      
      // Show toast notification
      setToastMessage(`${selectedProduct.name} added to cart!`);
      setShowToast(true);
      
      // Auto hide toast after 3 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
      
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const ProductCard = ({ product, index, category }) => (
    <motion.div
      key={product.id}
      className={`product-card-modern ${category}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      whileHover={{ scale: 1.02, y: -5 }}
    >
      {/* Product Badge */}
      {product.stock > 10 && (
        <div className="product-badge popular">
          <i className="fas fa-star me-1"></i>
          Popular
        </div>
      )}
      {product.stock <= 5 && product.stock > 0 && (
        <div className="product-badge">
          <i className="fas fa-fire me-1"></i>
          Limited
        </div>
      )}
      
      <div className="product-image-container">
        <img
          src={`http://localhost:8000/${product.image}`}
          alt={product.name}
          className="product-main-image"
          onClick={() => handleShowModal(product)}
          loading="lazy"
          onError={(e) => {
            e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
          }}
        />
        <div className="product-overlay">
          <button 
            className="btn btn-light btn-sm"
            onClick={() => handleShowModal(product)}
          >
            <i className="fas fa-eye me-1"></i>
            Quick View
          </button>
        </div>
      </div>
      <div className="product-info">
        <h4 className="product-title">{product.name}</h4>
        <p className="product-price">₱{product.price.toLocaleString()}</p>
        <div className="product-stock-info mb-3">
          <small className={`stock-badge ${product.stock > 10 ? 'text-success' : product.stock > 0 ? 'text-warning' : 'text-danger'}`}>
            <i className={`fas ${product.stock > 10 ? 'fa-check-circle' : product.stock > 0 ? 'fa-exclamation-triangle' : 'fa-times-circle'} me-1`}></i>
            {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
          </small>
        </div>
        <Button
          variant="dark"
          className="w-100 btn-enhanced"
          onClick={() => handleShowModal(product)}
          disabled={product.stock === 0}
        >
          <i className="fas fa-shopping-cart me-2"></i>
          {product.stock === 0 ? 'Out of Stock' : 'View Details'}
        </Button>
      </div>
    </motion.div>
  );

  return (
    <div className="woodcraft-catalog">
      {!products || products.length === 0 ? (
        <div className="text-center py-5">
          <div className="empty-state">
            <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
            <h4 className="text-muted">No products available</h4>
            <p className="text-muted">
              {!products ? 'Loading products...' : 'No products found. Please check back later.'}
            </p>
            {!products && (
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="catalog-sections">
          {/* Chairs Section */}
          {chairs.length > 0 && (
            <motion.section 
              className="catalog-section chairs-section"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="section-header">
                <div className="section-icon">
                  <i className="fas fa-chair"></i>
                </div>
                <div className="section-content">
                  <h2 className="section-title">Premium Chairs</h2>
                  <p className="section-subtitle">Handcrafted wooden chairs for comfort and style</p>
                </div>
                <div className="section-decoration">
                  <div className="wood-grain"></div>
                </div>
              </div>
              <div className="products-row">
                {chairs.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} category="chairs" />
                ))}
              </div>
            </motion.section>
          )}

          {/* Tables Section */}
          {tables.length > 0 && (
            <motion.section 
              className="catalog-section tables-section"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="section-header">
                <div className="section-icon">
                  <i className="fas fa-table"></i>
                </div>
                <div className="section-content">
                  <h2 className="section-title">Dining Tables</h2>
                  <p className="section-subtitle">Elegant dining tables for family gatherings</p>
                </div>
                <div className="section-decoration">
                  <div className="wood-grain"></div>
                </div>
              </div>
              <div className="products-row">
                {tables.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} category="tables" />
                ))}
              </div>
            </motion.section>
          )}

          {/* Alkansya Section */}
          {alkansya.length > 0 && (
            <motion.section 
              className="catalog-section alkansya-section"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="section-header">
                <div className="section-icon">
                  <i className="fas fa-piggy-bank"></i>
                </div>
                <div className="section-content">
                  <h2 className="section-title">Alkansya Collection</h2>
                  <p className="section-subtitle">Traditional Filipino savings banks with modern craftsmanship</p>
                </div>
                <div className="section-decoration">
                  <div className="wood-grain"></div>
                </div>
              </div>
              <div className="products-row">
                {alkansya.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} category="alkansya" />
                ))}
              </div>
            </motion.section>
          )}

          {/* Other Products Section */}
          {other.length > 0 && (
            <motion.section 
              className="catalog-section other-section"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="section-header">
                <div className="section-icon">
                  <i className="fas fa-hammer"></i>
                </div>
                <div className="section-content">
                  <h2 className="section-title">Specialty Items</h2>
                  <p className="section-subtitle">Unique handcrafted pieces for your home</p>
                </div>
                <div className="section-decoration">
                  <div className="wood-grain"></div>
                </div>
              </div>
              <div className="products-row">
                {other.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} category="other" />
                ))}
              </div>
            </motion.section>
          )}
        </div>
      )}

      {/* Enhanced Modal for product details */}
      {selectedProduct && (
        <Modal
          show={showModal}
          onHide={handleCloseModal}
          centered
          size="lg"
          dialogClassName="product-modal"
        >
          <Modal.Header closeButton className="border-0">
            <Modal.Title className="fw-bold">
              <i className="fas fa-box me-2 text-primary"></i>
              Product Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-0">
            <div className="modal-product-container">
              {/* Left side - Product Image */}
              <div className="modal-image-section">
                <div className="image-wrapper">
                  <img
                    src={`http://localhost:8000/${selectedProduct.image}`}
                    alt={selectedProduct.name}
                    className="modal-product-image"
                  />
                  {selectedProduct.stock > 10 && (
                    <div className="product-badge popular">
                      <i className="fas fa-star me-1"></i>
                      Popular
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Product Details */}
              <div className="modal-details-section">
                <div className="product-header">
                  <h3 className="modal-product-title">{selectedProduct.name}</h3>
                  <div className="product-rating mb-3">
                    <div className="stars">
                      {[...Array(5)].map((_, i) => (
                        <i key={i} className="fas fa-star text-warning"></i>
                      ))}
                    </div>
                    <span className="ms-2 text-muted">(4.8/5) 127 reviews</span>
                  </div>
                </div>

                <p className="modal-product-desc">{selectedProduct.description}</p>
                
                <div className="price-section">
                  <h4 className="modal-product-price">₱{selectedProduct.price.toLocaleString()}</h4>
                  <div className="price-details">
                    <small className="text-muted">Free shipping on orders over ₱5,000</small>
                  </div>
                </div>

                <div className="stock-section">
                  <div className={`modal-product-stock ${selectedProduct.stock > 10 ? 'in-stock' : selectedProduct.stock > 0 ? 'low-stock' : 'out-of-stock'}`}>
                    <i className={`fas ${selectedProduct.stock > 10 ? 'fa-check-circle' : selectedProduct.stock > 0 ? 'fa-exclamation-triangle' : 'fa-times-circle'} me-2`}></i>
                    {selectedProduct.stock > 10 ? 'In Stock' : selectedProduct.stock > 0 ? `Only ${selectedProduct.stock} left` : 'Out of Stock'}
                  </div>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}

                <Form className="mt-4">
                  <Form.Group>
                    <Form.Label className="fw-bold">
                      <i className="fas fa-calculator me-2"></i>
                      Quantity
                    </Form.Label>
                    <div className="quantity-controls">
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <i className="fas fa-minus"></i>
                      </button>
                      <Form.Control
                        type="number"
                        min="1"
                        max={selectedProduct.stock}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        className="text-center"
                        style={{ width: '80px' }}
                      />
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={() => setQuantity(Math.min(selectedProduct.stock, quantity + 1))}
                        disabled={quantity >= selectedProduct.stock}
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                    <Form.Text className="text-muted">
                      Total: ₱{(selectedProduct.price * quantity).toLocaleString()}
                    </Form.Text>
                  </Form.Group>
                </Form>

                <div className="action-buttons mt-4">
                  <div className="d-grid gap-2">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleAddToCart}
                      disabled={loading || selectedProduct.stock === 0}
                      className="btn-enhanced"
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Adding to Cart...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-shopping-cart me-2"></i>
                          {selectedProduct.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline-secondary" 
                      onClick={handleCloseModal}
                      size="lg"
                    >
                      <i className="fas fa-times me-2"></i>
                      Continue Shopping
                    </Button>
                  </div>
                </div>

                <div className="product-features mt-4">
                  <div className="row text-center">
                    <div className="col-4">
                      <i className="fas fa-shipping-fast fa-2x text-primary mb-2"></i>
                      <p className="small mb-0">Free Shipping</p>
                    </div>
                    <div className="col-4">
                      <i className="fas fa-undo fa-2x text-success mb-2"></i>
                      <p className="small mb-0">Easy Returns</p>
                    </div>
                    <div className="col-4">
                      <i className="fas fa-shield-alt fa-2x text-warning mb-2"></i>
                      <p className="small mb-0">Warranty</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3 }}
            className="toast-notification"
          >
            <div className="toast-content">
              <div className="toast-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="toast-message">
                <div className="toast-title">Added to Cart!</div>
                <div className="toast-text">{toastMessage}</div>
              </div>
              <button 
                className="toast-close"
                onClick={() => setShowToast(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="toast-progress"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(ProductCatalog);
