 import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Spinner } from "react-bootstrap";
import ProductCatalog from "./ProductCatalog";
import "./CustomerDashboard.css";
import bannerImage from "../../assets/images/unick_banner.png";

const CustomerDashboard = ({ searchTerm = "" }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            // Check if we have cached products (valid for 5 minutes)
            const cachedProducts = localStorage.getItem('cached_products');
            const cacheTimestamp = localStorage.getItem('products_cache_timestamp');
            const now = Date.now();
            const cacheValid = cacheTimestamp && (now - parseInt(cacheTimestamp)) < 300000; // 5 minutes
            
            if (cachedProducts && cacheValid) {
                const parsedProducts = JSON.parse(cachedProducts);
                setProducts(parsedProducts);
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
            
            // Show specific error messages
            if (error.response?.status === 500) {
                console.error("Server error - backend issue");
            } else if (!error.response) {
                console.error("Network error - check if backend is running");
            }
            
            // Try to use cached data if available, even if expired
            const cachedProducts = localStorage.getItem('cached_products');
            if (cachedProducts) {
                console.log("Using expired cache as fallback");
                setProducts(JSON.parse(cachedProducts));
            } else {
                // If no cache and error, set empty array to show "no products" message
                setProducts([]);
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
    }, []); // Keep empty dependency array

    useEffect(() => {
        fetchProducts();
    }, []); // Remove fetchProducts dependency to prevent infinite loop


    return (
      <div className="enhanced-customer-dashboard">
        {/* Promotional Banner Hero Section */}
        <div 
          className="promotional-banner-section"
          style={{ '--banner-image': `url(${bannerImage})` }}
        >
          <div className="banner-background"></div>
          <div className="banner-content">
            {/* Empty banner content - just for background */}
          </div>
        </div>


        {/* Enhanced Products Section */}
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
              <ProductCatalog products={products} searchTerm={searchTerm} />
            </motion.div>
          )}
        </div>


      </div>
    );
};


// Memoize the component to prevent unnecessary re-renders
export default memo(CustomerDashboard);