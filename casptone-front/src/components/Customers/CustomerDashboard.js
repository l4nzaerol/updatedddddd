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
      <div className="container customer-dashboard mt-4 wood-animated">

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="text-center mb-4 p-3">
                    <h2 style={{ color: 'black' }} >UNICK FURNITURE</h2>
                    </div>

                <div className="d-flex justify-content-center mb-3">
                    <motion.input
                        type="text"
                        className="form-control w-50 shadow-sm"
                        placeholder="Search for a product..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        whileFocus={{ scale: 1.05 }}
                    />
                </div>

                {/* <div className="d-flex justify-content-center mb-3 gap-2">
                    <input
                        type="number"
                        className="form-control w-25"
                        placeholder="Enter Order ID to track"
                        value={selectedOrderId}
                        onChange={(e)=> setSelectedOrderId(e.target.value)}
                    />
                </div> */}

                <div className="card p-4 shadow-lg wood-card">
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center">
                            <Spinner animation="border" variant="primary" />
                            <span className="ms-2">Loading products...</span>
                        </div>
                    ) : (
                        <ProductCatalog products={filteredProducts} />
                    )}
                </div>

                {selectedOrderId && (
                    <div className="mt-3">
                        <OrderTracking orderId={selectedOrderId} />
                    </div>
                )}
            </motion.div>
        </div>
    );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(CustomerDashboard);