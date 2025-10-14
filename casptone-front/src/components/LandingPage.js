import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ProductCatalog from "./Customers/ProductCatalog";
import Login from "./Login";
import "./LandingPage.css";
import bannerImage from "../assets/images/unick_banner.png";

const LandingPage = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
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
                timeout: 10000, // 10 second timeout
            });
    
            console.log("Fetched products:", response.data);
            console.log("Products count:", response.data.length);
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
            } else {
                // If no cache and error, set empty array to show "no products" message
                setProducts([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleLoginClick = () => {
        setShowLoginModal(true);
    };

    const handleCloseLogin = () => {
        setShowLoginModal(false);
    };

    const handleLoginSuccess = () => {
        setShowLoginModal(false);
        // Redirect to customer dashboard
        navigate("/dashboard");
    };

    return (
        <div className="landing-page-container">
            {/* Header - Same as CustomerDashboard but without interactive elements */}
            <header className="landing-header">
                <div className="header-left" onClick={() => window.location.reload()}>
                    <h2 className="header-logo">UNICK FURNITURE</h2>
                </div>
                <div className="header-right">
                    <div className="header-actions">
                        <button className="login-button" onClick={handleLoginClick}>
                            Login
                        </button>
                    </div>
                </div>
            </header>

            {/* Content wrapper to match customer dashboard layout */}
            <div className="landing-page-content">
                {/* Promotional Banner Hero Section - Same as CustomerDashboard */}
                <div 
                    className="promotional-banner-section"
                    style={{ '--banner-image': `url(${bannerImage})` }}
                >
                <div className="banner-background"></div>
                <div className="banner-content">
                    <div className="banner-layout">
                        {/* Left Side - Logo and Brand */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1 }}
                            className="banner-left"
                        >
                            <div className="banner-logo-container">
                                <div className="banner-logo">
                                    <div className="logo-circle">
                                        <span className="logo-text">UNICK</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Side - Description & Search */}
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 1, delay: 0.3 }}
                            className="banner-right"
                        >
                            <div className="banner-description">
                            </div>
                            
                            {/* Search Filter */}
                            <div className="banner-search-container">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.8, duration: 0.6 }}
                                    className="banner-search-wrapper"
                                >
                                    <div className="banner-search-input-container">
                                        <input
                                            type="text"
                                            className="banner-search-input"
                                            placeholder="Search for chairs, tables, alkansya..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        <button className="banner-search-button">
                                            <i className="fas fa-search"></i>
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Enhanced Products Section - Same as CustomerDashboard */}
            <div className="products-section-enhanced">
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-content">
                            <Spinner animation="border" variant="primary" size="lg" />
                            <p className="loading-text">Loading our amazing products...</p>
                        </div>
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9, duration: 1 }}
                    >
                        <ProductCatalog products={filteredProducts} />
                    </motion.div>
                )}
            </div>
            </div>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="login-modal-overlay" onClick={handleCloseLogin}>
                    <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={handleCloseLogin}>
                            <i className="fas fa-times"></i>
                        </button>
                        <Login onLoginSuccess={handleLoginSuccess} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
