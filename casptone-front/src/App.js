import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import { Toaster } from "sonner";
import "bootstrap/dist/css/bootstrap.min.css";

// Components
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import Cart from "./components/Customers/Cart";
import ProductPage from "./components/Admin/ProductPage"; 
import ProductionPage from "./components/Admin/ProductionPage"; 
import InventoryPage from "./components/Admin/InventoryPage"; 
import OrderPage from "./components/Admin/OrderPage"; 
import Report from "./components/Admin/Report"; 
import InventoryAnalytics from "./components/Admin/InventoryAnalytics";
import InventoryReportsDashboard from "./components/Admin/InventoryReportsDashboard";
import EnhancedProductionDashboard from "./components/Admin/EnhancedProductionDashboard";
import OrderAcceptance from "./components/Admin/OrderAcceptance";
import MyOrders from "./components/Customers/MyOrders";
import OrderTracking from "./components/Customers/OrderTracking";
import SimpleOrderTracking from "./components/Customers/SimpleOrderTracking";

// ✅ Authentication Check
const isAuthenticated = () => !!localStorage.getItem("token");

function App() {
    return (
        <Router>
            <Toaster position="top-right" richColors />
            <main id="main-content">
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route path="/cart" element={isAuthenticated() ? <Cart /> : <Navigate to="/login" />} />
                <Route path="/my-orders" element={isAuthenticated() ? <MyOrders /> : <Navigate to="/login" />} />
                <Route path="/dashboard" element={isAuthenticated() ? <Dashboard /> : <Navigate to="/login" />} />
                <Route path="/inventory" element={isAuthenticated() ? <InventoryPage /> : <Navigate to="/login" />} /> 
                <Route path="/product" element={isAuthenticated() ? <ProductPage /> : <Navigate to="/login" />} /> 
                <Route path="/productions" element={isAuthenticated() ? <ProductionPage /> : <Navigate to="/login" />} /> 
                <Route path="/production-analytics" element={isAuthenticated() ? <EnhancedProductionDashboard /> : <Navigate to="/login" />} /> 
                <Route path="/orders" element={isAuthenticated() ? <OrderPage /> : <Navigate to="/login" />} />
                <Route path="/order-acceptance" element={isAuthenticated() ? <OrderAcceptance /> : <Navigate to="/login" />} /> 
                <Route path="/reports" element={isAuthenticated() ? <Report /> : <Navigate to="/login" />} /> 
                <Route path="/inventory-analytics" element={isAuthenticated() ? <InventoryAnalytics /> : <Navigate to="/login" />} /> 
                <Route path="/inventory-reports" element={isAuthenticated() ? <InventoryReportsDashboard /> : <Navigate to="/login" />} /> 
                <Route path="/track/:orderId" element={isAuthenticated() ? <TrackWrapper /> : <Navigate to="/login" />} />

                {/* Redirect unknown routes */}
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
            </main>
        </Router>
    );
}

export default App;

function TrackWrapper(){
    const { orderId } = useParams();
    return <SimpleOrderTracking orderId={orderId} />;
}
