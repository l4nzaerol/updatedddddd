 import React, { useState, useEffect, memo } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Spinner } from "react-bootstrap";
import ProductCatalog from "./ProductCatalog";
import OrderTracking from "./OrderTracking";
import "./ProductCatalog";

const CustomerDashboard = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState("");

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            
            // Check if we have cached products (valid for 5 minutes)
            const cachedProducts = localStorage.getItem('cached_products');
            const cacheTimestamp = localStorage.getItem('products_cache_timestamp');
            const now = Date.now();
            const cacheValid = cacheTimestamp && (now - parseInt(cacheTimestamp)) < 300000; // 5 minutes
            
            if (cachedProducts && cacheValid) {
                console.log("Using cached products for faster loading");
                setProducts(JSON.parse(cachedProducts));
                setLoading(false);
                return;
            }
    
            const response = await axios.get("http://localhost:8000/api/products", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                timeout: 10000, // 10 second timeout
            });
    
            console.log("Fetched products:", response.data);
            setProducts(response.data);
            
            // Cache the products for faster future loads
            localStorage.setItem('cached_products', JSON.stringify(response.data));
            localStorage.setItem('products_cache_timestamp', now.toString());
            
        } catch (error) {
            console.error("Error fetching products:", error.response || error);
            
            // Try to use cached data if available, even if expired
            const cachedProducts = localStorage.getItem('cached_products');
            if (cachedProducts) {
                console.log("Using expired cache as fallback");
                setProducts(JSON.parse(cachedProducts));
            }
            
            // If we get rate limited, show a message and retry later
            if (error.response?.status === 429) {
                console.warn("Rate limited - will retry products fetch later");
                setTimeout(() => {
                    fetchProducts();
                }, 5000);
            }
        } finally {
            setLoading(false);
        }
    };
    

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="container-fluid customer-dashboard p-0">
        {/* Hero Section */}
        <div className="hero-section position-relative overflow-hidden">
          <div className="hero-background"></div>
          <div className="wood-pattern"></div>
          <div className="container position-relative" style={{ zIndex: 2 }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center py-5"
            >
              <div className="hero-logo mb-4">
                <div className="logo-icon">
                  <i className="fas fa-tree"></i>
                </div>
                <h1 className="display-3 fw-bold text-white mb-2">
                  <span className="wood-text">UNICK</span> <span className="furniture-text">FURNITURE</span>
                </h1>
                <div className="hero-tagline">
                  <span className="tagline-main">Handcrafted Excellence</span>
                  <span className="tagline-sub">Since 1995</span>
                </div>
              </div>
              <p className="lead text-white-50 mb-4 hero-description">
                Discover our premium collection of handcrafted furniture made from the finest Philippine wood
              </p>
              
              {/* Enhanced Search Bar */}
              <div className="row justify-content-center">
                <div className="col-md-6">
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="position-relative"
                  >
                    <input
                      type="text"
                      className="form-control form-control-lg search-input"
                      placeholder="🔍 Search for furniture, chairs, tables..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        borderRadius: '50px',
                        border: 'none',
                        padding: '1rem 2rem',
                        fontSize: '1.1rem',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                        background: 'rgba(255,255,255,0.95)',
                        backdropFilter: 'blur(10px)'
                      }}
                    />
                    <div className="search-icon">
                      <i className="fas fa-search"></i>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="container py-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="row text-center mb-4"
          >
            <div className="col-md-3">
              <div className="stat-card woodcraft-stat">
                <div className="stat-icon">
                  <i className="fas fa-box"></i>
                </div>
                <h3 className="text-primary fw-bold">{products.length}</h3>
                <p className="text-muted mb-0">Handcrafted Pieces</p>
                <small className="text-muted">Available Now</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card woodcraft-stat">
                <div className="stat-icon">
                  <i className="fas fa-hammer"></i>
                </div>
                <h3 className="text-success fw-bold">28+</h3>
                <p className="text-muted mb-0">Years Experience</p>
                <small className="text-muted">Since 1995</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card woodcraft-stat">
                <div className="stat-icon">
                  <i className="fas fa-leaf"></i>
                </div>
                <h3 className="text-warning fw-bold">100%</h3>
                <p className="text-muted mb-0">Natural Wood</p>
                <small className="text-muted">Philippine Timber</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card woodcraft-stat">
                <div className="stat-icon">
                  <i className="fas fa-shipping-fast"></i>
                </div>
                <h3 className="text-info fw-bold">Fast</h3>
                <p className="text-muted mb-0">Delivery</p>
                <small className="text-muted">Nationwide</small>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Products Section */}
        <div className="container-fluid px-0">
          {loading ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <div className="text-center">
                <Spinner animation="border" variant="primary" size="lg" />
                <p className="mt-3 text-muted">Loading our amazing products...</p>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
            >
              <ProductCatalog products={filteredProducts} />
            </motion.div>
          )}
        </div>

        {/* Order Tracking Section */}
        {selectedOrderId && (
          <div className="container mt-5">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <OrderTracking orderId={selectedOrderId} />
            </motion.div>
          </div>
        )}

        {/* Footer CTA */}
        <div className="container-fluid woodcraft-footer py-5 mt-5">
          <div className="container text-center">
            <div className="footer-content">
              <div className="footer-icon mb-3">
                <i className="fas fa-tree"></i>
              </div>
              <h3 className="mb-3 text-white">Ready to Bring Nature Home?</h3>
              <p className="lead mb-4 text-white-50">Discover our handcrafted furniture collection and transform your space with authentic Philippine wood</p>
              <div className="footer-buttons">
                <button 
                  className="btn btn-warning btn-lg px-4 me-3"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <i className="fas fa-shopping-cart me-2"></i>
                  Start Shopping
                </button>
                <button 
                  className="btn btn-outline-light btn-lg px-4"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  <i className="fas fa-eye me-2"></i>
                  View Gallery
                </button>
              </div>
              <div className="footer-features mt-4">
                <div className="row">
                  <div className="col-md-4">
                    <i className="fas fa-shield-alt fa-2x text-warning mb-2"></i>
                    <p className="small text-white-50 mb-0">Lifetime Warranty</p>
                  </div>
                  <div className="col-md-4">
                    <i className="fas fa-truck fa-2x text-warning mb-2"></i>
                    <p className="small text-white-50 mb-0">Free Delivery</p>
                  </div>
                  <div className="col-md-4">
                    <i className="fas fa-heart fa-2x text-warning mb-2"></i>
                    <p className="small text-white-50 mb-0">Made with Love</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(CustomerDashboard);