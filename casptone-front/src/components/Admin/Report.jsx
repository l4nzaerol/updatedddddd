import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../Header";
import InventoryReports from "./InventoryReports";
import ProductionReports from "./ProductionReports";
import SalesAnalytics from "./SalesAnalytics";

// Enhanced CSS for better styling
const enhancedStyles = `
    .enhanced-report-container {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-radius: 0.5rem;
        overflow: hidden;
    }
    
    .bg-gradient-primary {
        background: linear-gradient(135deg, #007bff 0%, #0056b3 100%) !important;
    }
    
    .enhanced-content-wrapper {
        background: white;
        border-radius: 0.5rem;
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }
    
    .report-tab-enhanced {
        transition: all 0.3s ease;
        border-radius: 0.5rem 0.5rem 0 0;
    }
    
    .report-tab-enhanced:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .analytics-card {
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        border: 1px solid #e9ecef;
        border-radius: 0.75rem;
        transition: all 0.3s ease;
    }
    
    .analytics-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }
    
    .metric-icon {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
    }
    
    .chart-container {
        background: white;
        border-radius: 0.75rem;
        padding: 1.5rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        border: 1px solid #e9ecef;
    }
    
    .data-table-enhanced {
        background: white;
        border-radius: 0.75rem;
        overflow: hidden;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }
    
    .data-table-enhanced th {
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        font-weight: 600;
        color: #495057;
        border: none;
        padding: 1rem;
    }
    
    .data-table-enhanced td {
        padding: 1rem;
        border: none;
        border-bottom: 1px solid #f1f3f4;
    }
    
    .status-badge {
        padding: 0.375rem 0.75rem;
        border-radius: 1rem;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .status-critical {
        background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
        color: white;
    }
    
    .status-warning {
        background: linear-gradient(135deg, #ffc107 0%, #e0a800 100%);
        color: #212529;
    }
    
    .status-success {
        background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
        color: white;
    }
    
    .status-info {
        background: linear-gradient(135deg, #17a2b8 0%, #138496 100%);
        color: white;
    }
    
    .progress-ring {
        width: 4rem;
        height: 4rem;
        border-radius: 50%;
        background: conic-gradient(#007bff 0deg, #e9ecef 0deg);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
    }
    
    .progress-ring::before {
        content: '';
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        background: white;
        position: absolute;
    }
    
    .progress-text {
        position: relative;
        z-index: 1;
        font-weight: 600;
        color: #007bff;
    }
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = enhancedStyles;
    document.head.appendChild(styleSheet);
}

const Report = () => {
    const navigate = useNavigate();
    const [activeReport, setActiveReport] = useState("inventory");
    const [loading] = useState(false);

    const reportTabs = [
        { 
            id: "inventory", 
            name: "Inventory Reports", 
            component: InventoryReports,
            icon: "📊",
            description: "Predictive analytics for material usage and inventory management"
        },
        { 
            id: "production", 
            name: "Production Reports", 
            component: ProductionReports,
            icon: "🏭",
            description: "Advanced performance metrics and production analytics"
        },
        { 
            id: "sales", 
            name: "Sales Analytics", 
            component: SalesAnalytics,
            icon: "💰",
            description: "Revenue analysis and customer behavior insights"
        }
    ];

    const ActiveComponent = reportTabs.find(tab => tab.id === activeReport)?.component;

    return (
        <AppLayout>
            <div className="container-fluid" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
                {/* Header Section */}
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <div>
                                <button 
                                    className="btn btn-outline-secondary btn-sm mb-2"
                                    onClick={() => navigate('/dashboard')}
                                >
                                    ← Back to Dashboard
                                </button>
                                <h2 className="mb-0" style={{ color: '#2c3e50', fontWeight: '600' }}>
                                    Reports & Analytics Dashboard
                                </h2>
                                <p className="text-muted mb-0">
                                    Comprehensive reporting and predictive analytics for Unick Enterprises Inc.
                                </p>
                            </div>
                            <div className="d-flex gap-2">
                                <button className="btn btn-primary btn-sm">
                                    <i className="fas fa-download me-1"></i>
                                    Export Report
                                </button>
                                <button className="btn btn-success btn-sm">
                                    <i className="fas fa-sync me-1"></i>
                                    Refresh Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="row mb-4">
                    <div className="col-lg-3 col-md-6 mb-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body text-center">
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                                        <i className="fas fa-chart-line text-primary fs-4"></i>
                                    </div>
                                    <div>
                                        <h3 className="mb-0 text-primary fw-bold">3</h3>
                                        <small className="text-muted">Report Types</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">Inventory • Production • Sales</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6 mb-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body text-center">
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                                        <i className="fas fa-brain text-success fs-4"></i>
                                    </div>
                                    <div>
                                        <h3 className="mb-0 text-success fw-bold">AI</h3>
                                        <small className="text-muted">Predictive Analytics</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">Smart forecasting & insights</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6 mb-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body text-center">
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                                        <i className="fas fa-clock text-warning fs-4"></i>
                                    </div>
                                    <div>
                                        <h3 className="mb-0 text-warning fw-bold">90</h3>
                                        <small className="text-muted">Days of Data</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">3 months historical data</p>
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-3 col-md-6 mb-3">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body text-center">
                                <div className="d-flex align-items-center justify-content-center mb-2">
                                    <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                                        <i className="fas fa-chart-bar text-info fs-4"></i>
                                    </div>
                                    <div>
                                        <h3 className="mb-0 text-info fw-bold">Real-time</h3>
                                        <small className="text-muted">Live Updates</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">Dynamic data refresh</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Report Tabs */}
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <ul className="nav nav-tabs nav-fill border-0" role="tablist">
                                    {reportTabs.map((tab, index) => (
                                        <li className="nav-item" key={tab.id}>
                                            <button
                                                className={`nav-link report-tab-enhanced ${activeReport === tab.id ? 'active' : ''}`}
                                                onClick={() => setActiveReport(tab.id)}
                                                style={{
                                                    border: 'none',
                                                    borderBottom: activeReport === tab.id ? '3px solid #007bff' : '3px solid transparent',
                                                    backgroundColor: activeReport === tab.id ? 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)' : 'transparent',
                                                    color: activeReport === tab.id ? 'white' : '#6c757d',
                                                    fontWeight: activeReport === tab.id ? '600' : '400',
                                                    padding: '1rem 1.5rem',
                                                    borderRadius: activeReport === tab.id ? '0.5rem 0.5rem 0 0' : '0',
                                                    boxShadow: activeReport === tab.id ? '0 4px 8px rgba(0, 123, 255, 0.2)' : 'none'
                                                }}
                                            >
                                                <div className="d-flex align-items-center justify-content-center">
                                                    <span className="me-2 fs-5">{tab.icon}</span>
                                                    <div className="text-start">
                                                        <div className="fw-bold">{tab.name}</div>
                                                        <small className={`d-block ${activeReport === tab.id ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                                                            {tab.description}
                                                        </small>
                                                    </div>
                                                </div>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="card-body p-0">
                                {loading ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-3 text-muted">Loading comprehensive report data...</p>
                                    </div>
                                ) : (
                                    <div className="enhanced-report-container">
                                        {/* Enhanced Report Header */}
                                        <div className="bg-gradient-primary text-white p-4 mb-0">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h5 className="mb-1 fw-bold">
                                                        {reportTabs.find(tab => tab.id === activeReport)?.icon} 
                                                        {reportTabs.find(tab => tab.id === activeReport)?.name}
                                                    </h5>
                                                    <p className="mb-0 opacity-75">
                                                        {reportTabs.find(tab => tab.id === activeReport)?.description}
                                                    </p>
                                                </div>
                                                <div className="d-flex gap-2">
                                                    <button className="btn btn-light btn-sm">
                                                        <i className="fas fa-download me-1"></i>
                                                        Export Data
                                                    </button>
                                                    <button className="btn btn-outline-light btn-sm">
                                                        <i className="fas fa-chart-line me-1"></i>
                                                        Analytics
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Enhanced Content Display */}
                                        <div className="p-4">
                                            {ActiveComponent && <ActiveComponent />}
                                        </div>

                                        {/* Analytics Footer */}
                                        <div className="bg-light border-top p-3">
                                            <div className="row text-center">
                                                <div className="col-md-3">
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                                                            <i className="fas fa-chart-bar text-primary"></i>
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-0 fw-bold">Data Accuracy</h6>
                                                            <small className="text-muted">Real-time updates</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        <div className="bg-success bg-opacity-10 rounded-circle p-2 me-2">
                                                            <i className="fas fa-brain text-success"></i>
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-0 fw-bold">AI Insights</h6>
                                                            <small className="text-muted">Predictive analytics</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-2">
                                                            <i className="fas fa-clock text-warning"></i>
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-0 fw-bold">Last Updated</h6>
                                                            <small className="text-muted">Just now</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="d-flex align-items-center justify-content-center">
                                                        <div className="bg-info bg-opacity-10 rounded-circle p-2 me-2">
                                                            <i className="fas fa-shield-alt text-info"></i>
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-0 fw-bold">Data Security</h6>
                                                            <small className="text-muted">Enterprise grade</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default Report;