import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import AppLayout from "../Header";
import DailyOutputChart from "./Analytics/DailyOutputChart.js";
import { downloadStockCsv, downloadUsageCsv, downloadReplenishmentCsv } from "../../api/inventoryApi";
import { exportProductionCsv } from "../../api/productionApi";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid 
} from "recharts";

const Report = () => {
    const navigate = useNavigate();
    const [windowDays, setWindowDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [mainTab, setMainTab] = useState("inventory"); // Main category: inventory or production
    const [activeTab, setActiveTab] = useState("overview"); // Sub-tab within category
    
    // Inventory report data states
    const [dashboardData, setDashboardData] = useState(null);
    const [inventoryReport, setInventoryReport] = useState(null);
    const [consumptionTrends, setConsumptionTrends] = useState(null);
    const [replenishmentSchedule, setReplenishmentSchedule] = useState(null);
    const [forecastReport, setForecastReport] = useState(null);
    const [dailyUsage, setDailyUsage] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    // Production report data states
    const [productionAnalytics, setProductionAnalytics] = useState(null);
    const [productionPerformance, setProductionPerformance] = useState(null);
    
    // Advanced analytics states
    const [productionOutput, setProductionOutput] = useState(null);
    const [resourceUtilization, setResourceUtilization] = useState(null);
    const [advancedPerformance, setAdvancedPerformance] = useState(null);
    const [predictiveAnalytics, setPredictiveAnalytics] = useState(null);
    const [materialTrends, setMaterialTrends] = useState(null);
    const [stockReport, setStockReport] = useState(null);

    useEffect(() => {
        fetchAllReports();
    }, [windowDays]);

    // Debug logging for tab changes and data availability
    useEffect(() => {
        console.log('🔍 Tab State:', { mainTab, activeTab });
        console.log('🔍 Resource Utilization:', resourceUtilization);
        console.log('🔍 Has material_usage_by_product?', !!resourceUtilization?.material_usage_by_product);
    }, [activeTab, mainTab, resourceUtilization]);

    const fetchAllReports = async () => {
        setLoading(true);
        setError("");
        try {
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
            
            console.log("Starting to fetch all reports...");
            
            // Load dashboard data
            try {
                const dashboard = await api.get("/inventory/dashboard");
                console.log("Dashboard data:", dashboard.data);
                setDashboardData(dashboard.data);
            } catch (e) {
                console.error("Dashboard load failed:", e);
            }
            
            await delay(150);
            
            // Load inventory report
            try {
                const inventory = await api.get("/inventory/report", { 
                    params: { 
                        start_date: getStartDate(windowDays), 
                        end_date: new Date().toISOString().split('T')[0] 
                    } 
                });
                console.log("Inventory report:", inventory.data);
                setInventoryReport(inventory.data);
            } catch (e) {
                console.error("Inventory report load failed:", e);
            }
            
            await delay(150);
            
            // Load forecast report
            try {
                const forecast = await api.get("/inventory/forecast", { 
                    params: { forecast_days: 30, historical_days: windowDays } 
                });
                console.log("Forecast report:", forecast.data);
                setForecastReport(forecast.data);
            } catch (e) {
                console.error("Forecast report load failed:", e);
            }
            
            await delay(150);
            
            // Load replenishment schedule
            try {
                const replenishment = await api.get("/inventory/replenishment-schedule");
                console.log("Replenishment schedule:", replenishment.data);
                setReplenishmentSchedule(replenishment.data);
            } catch (e) {
                console.error("Replenishment schedule load failed:", e);
            }
            
            await delay(150);
            
            // Load consumption trends
            try {
                const trends = await api.get("/inventory/consumption-trends", { 
                    params: { days: windowDays } 
                });
                console.log("Consumption trends:", trends.data);
                setConsumptionTrends(trends.data);
            } catch (e) {
                console.error("Consumption trends load failed:", e);
            }
            
            await delay(150);
            
            // Load daily usage
            try {
                const daily = await api.get("/inventory/daily-usage", { 
                    params: { date: selectedDate } 
                });
                console.log("Daily usage:", daily.data);
                setDailyUsage(daily.data);
            } catch (e) {
                console.error("Daily usage load failed:", e);
            }
            
            await delay(150);
            
            // Load production analytics
            try {
                const prodAnalytics = await api.get("/productions/analytics");
                console.log("Production analytics:", prodAnalytics.data);
                setProductionAnalytics(prodAnalytics.data);
                setProductionPerformance(prodAnalytics.data);
            } catch (e) {
                console.error("Production analytics load failed:", e);
            }
            
            await delay(150);
            
            // Load advanced analytics
            try {
                // Load each advanced analytics endpoint individually with error handling
                const results = await Promise.allSettled([
                    api.get('/analytics/production-output', { params: { 
                        start_date: getStartDate(90), 
                        end_date: new Date().toISOString().split('T')[0],
                        timeframe: 'daily'
                    }}),
                    api.get('/analytics/resource-utilization', { params: { 
                        start_date: getStartDate(90), 
                        end_date: new Date().toISOString().split('T')[0]
                    }}),
                    api.get('/analytics/production-performance', { params: { 
                        start_date: getStartDate(90), 
                        end_date: new Date().toISOString().split('T')[0]
                    }}),
                    api.get('/analytics/predictive', { params: { forecast_days: 30 }}),
                    api.get('/analytics/material-usage-trends', { params: { 
                        start_date: getStartDate(90), 
                        end_date: new Date().toISOString().split('T')[0],
                        timeframe: 'daily'
                    }}),
                    api.get('/analytics/automated-stock-report'),
                ]);

                const endpointNames = [
                    'production-output',
                    'resource-utilization', 
                    'production-performance',
                    'predictive',
                    'material-usage-trends',
                    'automated-stock-report'
                ];

                // Process results and set state for successful calls
                results.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        switch(index) {
                            case 0: 
                                setProductionOutput(result.value.data);
                                console.log('✅ Production Output loaded:', result.value.data);
                                break;
                            case 1: 
                                setResourceUtilization(result.value.data);
                                console.log('✅ Resource Utilization loaded:', result.value.data);
                                console.log('   - Has material_usage_by_product?', !!result.value.data?.material_usage_by_product);
                                console.log('   - Is it an array?', Array.isArray(result.value.data?.material_usage_by_product));
                                console.log('   - Count:', result.value.data?.material_usage_by_product?.length || 0);
                                console.log('   - Data:', result.value.data?.material_usage_by_product);
                                break;
                            case 2: 
                                setAdvancedPerformance(result.value.data);
                                console.log('✅ Production Performance loaded:', result.value.data);
                                break;
                            case 3: 
                                setPredictiveAnalytics(result.value.data);
                                console.log('✅ Predictive Analytics loaded:', result.value.data);
                                break;
                            case 4: 
                                setMaterialTrends(result.value.data);
                                console.log('✅ Material Trends loaded:', result.value.data);
                                break;
                            case 5: 
                                setStockReport(result.value.data);
                                console.log('✅ Stock Report loaded:', result.value.data);
                                break;
                        }
                    } else {
                        console.error(`❌ Failed to load ${endpointNames[index]}:`, result.reason?.response?.data || result.reason);
                    }
                });
                
                const successCount = results.filter(r => r.status === 'fulfilled').length;
                console.log(`📊 Advanced analytics: ${successCount}/${results.length} endpoints loaded successfully`);
            } catch (e) {
                console.error("Advanced analytics load failed:", e);
            }
            
            console.log("All reports loaded successfully!");
            
        } catch (err) {
            console.error("Error fetching reports:", err);
            setError("Failed to load reports. Please check console for details.");
        } finally {
            setLoading(false);
        }
    };
    
    const getStartDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    };
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
    const PRIORITY_COLORS = { urgent: '#dc3545', high: '#fd7e14', medium: '#ffc107', low: '#28a745' };
    
    // Export functions
    const exportReport = (reportName, data) => {
        if (!data || data.length === 0) {
            alert('No data available to export');
            return;
        }
        const csv = convertToCSV(data);
        downloadCSV(csv, `${reportName}_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const convertToCSV = (data) => {
        if (!data || data.length === 0) return "";
        const headers = Object.keys(data[0]).join(",");
        const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(","));
        return [headers, ...rows].join("\n");
    };

    const downloadCSV = (csv, filename) => {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };

    // Production CSV Export Handlers
    const handleExportProductionCSV = () => {
        if (!productionAnalytics) {
            alert('No production data available to export');
            return;
        }
        
        // Create CSV from all production data
        const headers = ['Date', 'Product', 'Quantity', 'Stage', 'Status'];
        const rows = (productionAnalytics.daily_output || []).map(item => [
            item.date,
            'Various Products',
            item.quantity,
            'Multiple Stages',
            'Active'
        ]);
        
        const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        downloadCSV(csv, `production_report_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportStageBreakdown = () => {
        if (!productionAnalytics || !productionAnalytics.stage_breakdown) {
            alert('No stage breakdown data available to export');
            return;
        }
        
        // Create CSV from stage breakdown
        const headers = ['Stage Name', 'Number of Orders', 'Percentage'];
        const total = productionAnalytics.stage_breakdown.reduce((sum, item) => sum + item.value, 0);
        const rows = productionAnalytics.stage_breakdown.map(item => [
            item.name,
            item.value,
            `${((item.value / total) * 100).toFixed(2)}%`
        ]);
        
        const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        downloadCSV(csv, `stage_breakdown_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportDailyOutput = () => {
        if (!productionAnalytics || !productionAnalytics.daily_output) {
            alert('No daily output data available to export');
            return;
        }
        
        // Create CSV from daily output
        const headers = ['Date', 'Quantity Produced', 'Day of Week'];
        const rows = productionAnalytics.daily_output.map(item => {
            const date = new Date(item.date);
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
            return [
                item.date,
                item.quantity,
                dayOfWeek
            ];
        });
        
        const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        downloadCSV(csv, `daily_output_${new Date().toISOString().split('T')[0]}.csv`);
    };

    return (
        <AppLayout>
            <div className="container-fluid py-4" role="region" aria-labelledby="report-heading">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 id="report-heading" className="fw-bold mb-1">
                            📊 Automated Reports & Analytics
                        </h2>
                        
                    </div>
                    <button className="btn btn-outline-secondary" onClick={() => navigate("/dashboard")}>
                        ← Back to Dashboard
                    </button>
                </div>
                
                {/* Main Category Tabs - Production vs Inventory */}
                <ul className="nav nav-pills nav-fill mb-4 shadow-sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '12px' }}>
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${mainTab === "inventory" ? "active" : ""}`}
                            style={{
                                borderRadius: '10px',
                                fontWeight: '600',
                                fontSize: '16px',
                                padding: '12px 24px',
                                backgroundColor: mainTab === "inventory" ? '#0d6efd' : 'transparent',
                                color: mainTab === "inventory" ? 'white' : '#6c757d',
                                border: 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => {
                                setMainTab("inventory");
                                setActiveTab("overview");
                            }}
                        >
                            📦 Inventory Reports
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${mainTab === "production" ? "active" : ""}`}
                            style={{
                                borderRadius: '10px',
                                fontWeight: '600',
                                fontSize: '16px',
                                padding: '12px 24px',
                                backgroundColor: mainTab === "production" ? '#0d6efd' : 'transparent',
                                color: mainTab === "production" ? 'white' : '#6c757d',
                                border: 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => {
                                setMainTab("production");
                                setActiveTab("output-analytics");
                            }}
                        >
                            🏭 Production Reports
                        </button>
                    </li>
                </ul>
                
                {/* Summary Cards - Inventory */}
                {mainTab === "inventory" && dashboardData && (
                    <div className="row g-3 mb-4">
                        <div className="col-md-3">
                            <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #0d6efd' }}>
                                <div className="card-body">
                                    <div className="text-muted small mb-1">Total Items</div>
                                    <div className="h3 mb-0 text-primary">{dashboardData.summary.total_items}</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #dc3545' }}>
                                <div className="card-body">
                                    <div className="text-muted small mb-1">Low Stock Items</div>
                                    <div className="h3 mb-0 text-danger">{dashboardData.summary.low_stock_items}</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #ffc107' }}>
                                <div className="card-body">
                                    <div className="text-muted small mb-1">Out of Stock</div>
                                    <div className="h3 mb-0 text-warning">{dashboardData.summary.out_of_stock_items}</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #17a2b8' }}>
                                <div className="card-body">
                                    <div className="text-muted small mb-1">Recent Usage (7d)</div>
                                    <div className="h3 mb-0 text-info">{dashboardData.summary.recent_usage}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Summary Cards - Production */}
                {mainTab === "production" && productionAnalytics && productionAnalytics.kpis && (
                    <div className="row g-3 mb-4">
                        <div className="col-md-3">
                            <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #0d6efd' }}>
                                <div className="card-body">
                                    <div className="text-muted small mb-1">Total Productions</div>
                                    <div className="h3 mb-0 text-primary">{productionAnalytics.kpis.total || 0}</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #28a745' }}>
                                <div className="card-body">
                                    <div className="text-muted small mb-1">Completed</div>
                                    <div className="h3 mb-0 text-success">{productionAnalytics.kpis.completed || 0}</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #ffc107' }}>
                                <div className="card-body">
                                    <div className="text-muted small mb-1">In Progress</div>
                                    <div className="h3 mb-0 text-warning">{productionAnalytics.kpis.in_progress || 0}</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #dc3545' }}>
                                <div className="card-body">
                                    <div className="text-muted small mb-1">On Hold</div>
                                    <div className="h3 mb-0 text-danger">{productionAnalytics.kpis.hold || 0}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Sub-tabs Navigation - Conditional based on main tab */}
                {mainTab === "inventory" && (
                <ul className="nav nav-tabs mb-4">
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
                            📊 Overview
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "inventory" ? "active" : ""}`} onClick={() => setActiveTab("inventory")}>
                            📦 Inventory Status
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "stock-report" ? "active" : ""}`} onClick={() => setActiveTab("stock-report")}>
                            🚨 Stock Report
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "material-usage" ? "active" : ""}`} onClick={() => setActiveTab("material-usage")}>
                            📊 Material Usage
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "replenishment" ? "active" : ""}`} onClick={() => setActiveTab("replenishment")}>
                            📅 Replenishment
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "forecast" ? "active" : ""}`} onClick={() => setActiveTab("forecast")}>
                            🔮 Forecast
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "trends" ? "active" : ""}`} onClick={() => setActiveTab("trends")}>
                            📈 Trends
                        </button>
                    </li>
                </ul>
                )}
                
                {/* Production Sub-tabs */}
                {mainTab === "production" && (
                <ul className="nav nav-tabs mb-4">
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "output-analytics" ? "active" : ""}`} onClick={() => setActiveTab("output-analytics")}>
                            📈 Output Analytics
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "resource-util" ? "active" : ""}`} onClick={() => setActiveTab("resource-util")}>
                            📦 Resource Utilization
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "cycle-throughput" ? "active" : ""}`} onClick={() => setActiveTab("cycle-throughput")}>
                            ⏱️ Cycle & Throughput
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "predictive" ? "active" : ""}`} onClick={() => setActiveTab("predictive")}>
                            🔮 Predictive Analytics
                        </button>
                    </li>
                </ul>
                )}
                
                {/* CSV Export Buttons */}
                <div className="card shadow-sm mb-4">
                    <div className="card-body">
                        <h6 className="fw-bold mb-3">📥 Export Reports to CSV</h6>
                        <div className="d-flex flex-wrap gap-2">
                            {mainTab === "inventory" && (
                                <>
                                    <button 
                                        className="btn btn-outline-primary" 
                                        onClick={downloadStockCsv}
                                        title="Export current inventory stock levels"
                                    >
                                        📦 Download Stock CSV
                                    </button>
                                    <button 
                                        className="btn btn-outline-primary" 
                                        onClick={() => downloadUsageCsv(90)}
                                        title="Export inventory usage history (90 days)"
                                    >
                                        📊 Download Usage CSV
                                    </button>
                                    <button 
                                        className="btn btn-outline-primary" 
                                        onClick={downloadReplenishmentCsv}
                                        title="Export replenishment schedule"
                                    >
                                        📅 Download Replenishment CSV
                                    </button>
                                </>
                            )}
                            {mainTab === "production" && (
                                <>
                                    <button 
                                        className="btn btn-outline-primary" 
                                        onClick={handleExportProductionCSV}
                                        title="Export all production data"
                                    >
                                        🏭 Download Production CSV
                                    </button>
                                    <button 
                                        className="btn btn-outline-success" 
                                        onClick={handleExportStageBreakdown}
                                        title="Export stage distribution data"
                                    >
                                        🎯 Download Stage Breakdown CSV
                                    </button>
                                    <button 
                                        className="btn btn-outline-info" 
                                        onClick={handleExportDailyOutput}
                                        title="Export daily production output"
                                    >
                                        📈 Download Daily Output CSV
                                    </button>
                                </>
                            )}
                        </div>
                        {mainTab === "inventory" && (
                            <div className="mt-3 d-flex align-items-center gap-2">
                                <label htmlFor="fc-window" className="mb-0 small text-muted">Forecast window (days):</label>
                                <input 
                                    id="fc-window" 
                                    type="number" 
                                    min="7" 
                                    max="120" 
                                    className="form-control form-control-sm" 
                                    style={{width:120}}
                                    value={windowDays} 
                                    onChange={(e)=> setWindowDays(Number(e.target.value)||30)} 
                                />
                            </div>
                        )}
                    </div>
                </div>
                {loading && (
                    <div className="alert alert-info">
                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                        Loading reports... Please wait.
                    </div>
                )}
                
                {error && (
                    <div className="alert alert-warning">
                        {error}
                        <button className="btn btn-sm btn-primary ms-3" onClick={fetchAllReports}>
                            Retry
                        </button>
                    </div>
                )}
                
                {!loading && (
                    <div className="tab-content">
                        {/* Overview Tab */}
                        {activeTab === "overview" && (
                            <div className="card shadow-sm mb-4">
                                <div className="card-header">
                                    <h5 className="mb-0">📊 Reports Overview</h5>
                                </div>
                                <div className="card-body">
                                    
                                    
                                    <h6 className="mt-4 mb-3">Critical Items Requiring Attention</h6>
                                    {dashboardData && dashboardData.critical_items && dashboardData.critical_items.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>SKU</th>
                                                        <th>Name</th>
                                                        <th className="text-end">Current Stock</th>
                                                        <th className="text-end">Safety Stock</th>
                                                        <th className="text-end">Days Until Stockout</th>
                                                        <th>Urgency</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dashboardData.critical_items.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="fw-semibold">{item.sku}</td>
                                                            <td>{item.name}</td>
                                                            <td className="text-end">{item.quantity_on_hand}</td>
                                                            <td className="text-end">{item.safety_stock}</td>
                                                            <td className="text-end">{item.days_until_stockout}</td>
                                                            <td><span className="badge bg-danger">{item.urgency}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="alert alert-success">
                                            ✅ No critical items. All inventory levels are healthy!
                                        </div>
                                    )}
                                    
                                    <div className="row mt-4">
                                        <div className="col-md-6">
                                            <div className="card bg-light">
                                                <div className="card-body">
                                                    <h6>📦 Inventory Status</h6>
                                                    <p className="small text-muted">View current stock levels, usage rates, and stockout predictions</p>
                                                    <button className="btn btn-sm btn-primary" onClick={() => setActiveTab("inventory")}>
                                                        View Report →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="card bg-light">
                                                <div className="card-body">
                                                    <h6>📅 Replenishment Schedule</h6>
                                                    <p className="small text-muted">See items needing reorder with priority levels</p>
                                                    <button className="btn btn-sm btn-primary" onClick={() => setActiveTab("replenishment")}>
                                                        View Report →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="row mt-3">
                                    </div>
                                    
                                    <div className="row mt-3">
                                        <div className="col-md-6">
                                            <div className="card bg-light">
                                                <div className="card-body">
                                                    <h6>📅 Daily Usage</h6>
                                                    <p className="small text-muted">View material usage for specific dates</p>
                                                    <button className="btn btn-sm btn-primary" onClick={() => setActiveTab("daily")}>
                                                        View Report →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="card bg-light">
                                                <div className="card-body">
                                                    <h6>📈 Consumption Trends</h6>
                                                    <p className="small text-muted">Track usage patterns over time</p>
                                                    <button className="btn btn-sm btn-primary" onClick={() => setActiveTab("trends")}>
                                                        View Report →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Inventory Status Tab */}
                        {activeTab === "inventory" && (
                            inventoryReport ? (
                            <div className="card shadow-sm mb-4">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Inventory Status Report</h5>
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => exportReport("inventory_status", inventoryReport.items)}>
                                        📥 Export CSV
                                    </button>
                                </div>
                                <div className="card-body">
                                    <div className="row mb-3">
                                        <div className="col-md-3">
                                            <div className="text-muted small">Total Items</div>
                                            <div className="h4">{inventoryReport.summary.total_items}</div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="text-muted small">Items Needing Reorder</div>
                                            <div className="h4 text-danger">{inventoryReport.summary.items_needing_reorder}</div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="text-muted small">Critical Items</div>
                                            <div className="h4 text-warning">{inventoryReport.summary.critical_items}</div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="text-muted small">Total Usage</div>
                                            <div className="h4">{inventoryReport.summary.total_usage}</div>
                                        </div>
                                    </div>
                                    
                                    {/* Stock Status Chart */}
                                    <div className="mb-4">
                                        <h6>Stock Status Distribution</h6>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Normal', value: inventoryReport.items.filter(i => i.stock_status === 'normal').length },
                                                        { name: 'Low', value: inventoryReport.items.filter(i => i.stock_status === 'low').length },
                                                        { name: 'Critical', value: inventoryReport.items.filter(i => i.stock_status === 'critical').length },
                                                        { name: 'Out of Stock', value: inventoryReport.items.filter(i => i.stock_status === 'out_of_stock').length },
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={(entry) => `${entry.name}: ${entry.value}`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {[0, 1, 2, 3].map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    
                                    <div className="table-responsive">
                                        <table className="table table-sm table-hover">
                                            <thead>
                                                <tr>
                                                    <th>SKU</th>
                                                    <th>Name</th>
                                                    <th className="text-end">Current Stock</th>
                                                    <th className="text-end">Avg Daily Usage</th>
                                                    <th className="text-end">Days Until Stockout</th>
                                                    <th>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {inventoryReport.items.slice(0, 20).map((item, idx) => (
                                                    <tr key={idx}>
                                                        <td className="fw-semibold">{item.sku}</td>
                                                        <td>{item.name}</td>
                                                        <td className="text-end">{item.current_stock}</td>
                                                        <td className="text-end">{item.avg_daily_usage}</td>
                                                        <td className="text-end">{item.days_until_stockout}</td>
                                                        <td>
                                                            <span className={`badge ${
                                                                item.stock_status === 'critical' ? 'bg-danger' :
                                                                item.stock_status === 'low' ? 'bg-warning' :
                                                                item.stock_status === 'out_of_stock' ? 'bg-dark' : 'bg-success'
                                                            }`}>
                                                                {item.stock_status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            ) : (
                                <div className="alert alert-warning">
                                    <strong>No Inventory Data Available</strong><br/>
                                    Please ensure the inventory usage seeder has been run.<br/>
                                    <button className="btn btn-sm btn-primary mt-2" onClick={fetchAllReports}>
                                        Reload Data
                                    </button>
                                </div>
                            )
                        )}
                        
                        {/* Replenishment Tab */}
                        {activeTab === "replenishment" && (
                            replenishmentSchedule ? (
                            <div className="card shadow-sm mb-4">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Replenishment Schedule</h5>
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => exportReport("replenishment_schedule", replenishmentSchedule.schedule)}>
                                        📥 Export CSV
                                    </button>
                                </div>
                                <div className="card-body">
                                    <div className="row mb-3">
                                        <div className="col-md-3">
                                            <div className="text-muted small">Immediate Reorders</div>
                                            <div className="h4 text-danger">{replenishmentSchedule.summary.immediate_reorders}</div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="text-muted small">High Priority</div>
                                            <div className="h4 text-warning">{replenishmentSchedule.summary.high_priority}</div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="text-muted small">Medium Priority</div>
                                            <div className="h4 text-info">{replenishmentSchedule.summary.medium_priority}</div>
                                        </div>
                                        <div className="col-md-3">
                                            <div className="text-muted small">Total Reorder Value</div>
                                            <div className="h4">{replenishmentSchedule.summary.total_reorder_value}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Priority</th>
                                                    <th>SKU</th>
                                                    <th>Name</th>
                                                    <th className="text-end">Current Stock</th>
                                                    <th className="text-end">Reorder Point</th>
                                                    <th>Estimated Reorder Date</th>
                                                    <th className="text-end">Recommended Qty</th>
                                                    <th>Supplier</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {replenishmentSchedule.schedule && replenishmentSchedule.schedule.length > 0 ? (
                                                    replenishmentSchedule.schedule.slice(0, 20).map((item, idx) => (
                                                        <tr key={idx} className={item.needs_immediate_reorder ? 'table-danger' : ''}>
                                                            <td>
                                                                <span className="badge" style={{ backgroundColor: PRIORITY_COLORS[item.priority] || '#6c757d' }}>
                                                                    {item.priority}
                                                                </span>
                                                            </td>
                                                            <td className="fw-semibold">{item.sku}</td>
                                                            <td>{item.name}</td>
                                                            <td className="text-end">{item.current_stock}</td>
                                                            <td className="text-end">{item.reorder_point}</td>
                                                            <td>{item.estimated_reorder_date}</td>
                                                            <td className="text-end fw-bold">{item.recommended_order_qty}</td>
                                                            <td>{item.supplier || '-'}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="8" className="text-center text-muted">No replenishment needed at this time.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            ) : (
                                <div className="alert alert-warning">
                                    <strong>No Replenishment Data Available</strong><br/>
                                    Data is being loaded or unavailable.
                                </div>
                            )
                        )}
                        
                        {/* Forecast Tab */}
                        {activeTab === "forecast" && (
                            forecastReport ? (
                            <div className="card shadow-sm mb-4">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0">Material Usage Forecast</h5>
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => exportReport("material_forecast", forecastReport.forecasts)}>
                                        📥 Export CSV
                                    </button>
                                </div>
                                <div className="card-body">
                                    <div className="row mb-3">
                                        <div className="col-md-4">
                                            <div className="text-muted small">Items Will Need Reorder</div>
                                            <div className="h4 text-danger">{forecastReport.summary.items_will_need_reorder}</div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="text-muted small">Total Forecasted Usage</div>
                                            <div className="h4">{forecastReport.summary.total_forecasted_usage}</div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="text-muted small">Critical Items (&lt; 7 days)</div>
                                            <div className="h4 text-warning">{forecastReport.summary.items_critical}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>SKU</th>
                                                    <th>Name</th>
                                                    <th className="text-end">Current Stock</th>
                                                    <th className="text-end">Avg Daily Usage</th>
                                                    <th className="text-end">Forecasted Usage (30d)</th>
                                                    <th className="text-end">Projected Stock</th>
                                                    <th className="text-end">Days Until Stockout</th>
                                                    <th className="text-end">Recommended Order Qty</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {forecastReport.forecasts && forecastReport.forecasts.length > 0 ? (
                                                    forecastReport.forecasts.slice(0, 20).map((item, idx) => (
                                                        <tr key={idx} className={item.will_need_reorder ? 'table-warning' : ''}>
                                                            <td className="fw-semibold">{item.sku}</td>
                                                            <td>{item.name}</td>
                                                            <td className="text-end">{item.current_stock}</td>
                                                            <td className="text-end">{item.avg_daily_usage}</td>
                                                            <td className="text-end">{item['forecasted_usage_30_days']}</td>
                                                            <td className="text-end">{item.projected_stock}</td>
                                                            <td className="text-end">{item.days_until_stockout}</td>
                                                            <td className="text-end fw-bold">{item.recommended_order_qty}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="8" className="text-center text-muted">No forecast data available.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            ) : (
                                <div className="alert alert-warning">
                                    <strong>No Forecast Data Available</strong><br/>
                                    Data is being loaded or unavailable.
                                </div>
                            )
                        )}
                
                        {/* Consumption Trends Tab */}
                        {activeTab === "trends" && (
                            consumptionTrends ? (
                    <div className="card shadow-sm mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Consumption Trends</h5>
                            <button className="btn btn-sm btn-outline-primary" onClick={() => exportReport("consumption_trends", Object.values(consumptionTrends.trends))}>
                                📥 Export CSV
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="alert alert-info">
                                <strong>Trend Analysis:</strong> Positive trend = increasing usage, Negative trend = decreasing usage
                            </div>
                            
                            <div className="mb-4">
                                <h6>Average Daily Usage Trends</h6>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={Object.values(consumptionTrends.trends).slice(0, 15)}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="sku" angle={-45} textAnchor="end" height={100} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="avg_daily_usage" stroke="#8884d8" name="Avg Daily Usage" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="table-responsive">
                                <table className="table table-sm table-hover">
                                    <thead>
                                        <tr>
                                            <th>SKU</th>
                                            <th>Item Name</th>
                                            <th className="text-end">Avg Daily Usage</th>
                                            <th className="text-end">Total Usage</th>
                                            <th className="text-end">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.values(consumptionTrends.trends).slice(0, 20).map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="fw-semibold">{item.sku}</td>
                                                <td>{item.item_name}</td>
                                                <td className="text-end">{item.avg_daily_usage}</td>
                                                <td className="text-end">{item.total_usage_period}</td>
                                                <td className="text-end">
                                                    <span className={`badge ${
                                                        item.trend > 0 ? 'bg-warning' : 
                                                        item.trend < 0 ? 'bg-info' : 'bg-secondary'
                                                    }`}>
                                                        {item.trend > 0 ? '↑' : item.trend < 0 ? '↓' : '→'} {item.trend}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                            ) : (
                                <div className="alert alert-warning">
                                    <strong>No Trends Data Available</strong><br/>
                                    Data is being loaded or unavailable.
                                </div>
                            )
                        )}
                
                        {/* Daily Usage Tab */}
                        {activeTab === "daily" && (
                            dailyUsage ? (
                    <div className="card shadow-sm mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Daily Usage Report</h5>
                            <div className="d-flex gap-2 align-items-center">
                                <label className="mb-0">Date:</label>
                                <input 
                                    type="date" 
                                    className="form-control form-control-sm" 
                                    style={{ width: 160 }}
                                    value={selectedDate} 
                                    onChange={(e) => setSelectedDate(e.target.value)} 
                                />
                                <button className="btn btn-sm btn-primary" onClick={fetchAllReports}>Load</button>
                                <button className="btn btn-sm btn-outline-primary" onClick={() => dailyUsage && dailyUsage.usage_summary && exportReport("daily_usage", Object.values(dailyUsage.usage_summary))}>
                                    📥 Export CSV
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="row mb-3">
                                <div className="col-md-4">
                                    <div className="text-muted small">Date</div>
                                    <div className="h4">{dailyUsage.date}</div>
                                </div>
                                <div className="col-md-4">
                                    <div className="text-muted small">Total Items Used</div>
                                    <div className="h4 text-primary">{dailyUsage.total_items_used}</div>
                                </div>
                                <div className="col-md-4">
                                    <div className="text-muted small">Total Quantity Used</div>
                                    <div className="h4 text-info">{dailyUsage.total_quantity_used}</div>
                                </div>
                            </div>
                            
                            {dailyUsage.usage_summary && Object.keys(dailyUsage.usage_summary).length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover">
                                        <thead>
                                            <tr>
                                                <th>SKU</th>
                                                <th>Item Name</th>
                                                <th className="text-end">Total Used</th>
                                                <th className="text-end">Remaining Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.values(dailyUsage.usage_summary).map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="fw-semibold">{item.sku}</td>
                                                    <td>{item.item_name}</td>
                                                    <td className="text-end">{item.total_used}</td>
                                                    <td className="text-end">{item.remaining_stock}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="alert alert-info">
                                    No usage data recorded for this date.
                                </div>
                            )}
                        </div>
                    </div>
                            ) : (
                                <div className="alert alert-warning">
                                    <strong>No Daily Usage Data Available</strong><br/>
                                    Select a date and click Load to view usage data.
                                </div>
                            )
                        )}
                        
                        {/* Stock Report Tab - Inventory */}
                        {activeTab === "stock-report" && mainTab === "inventory" && stockReport && (
                            <div className="card shadow-sm mb-4">
                                <div className="card-header bg-white border-bottom">
                                    <h5 className="mb-0 fw-bold">🚨 Automated Stock Report</h5>
                                    <small className="text-muted">Generated: {stockReport.generated_at}</small>
                                </div>
                                <div className="card-body">
                                    {/* Summary Cards */}
                                    <div className="row mb-4">
                                        <div className="col-md-4">
                                            <div className="card border-danger border-3">
                                                <div className="card-body text-center">
                                                    <h2 className="text-danger mb-0">{stockReport.summary.critical_items}</h2>
                                                    <p className="text-muted mb-0">Critical Items</p>
                                                    <small className="text-danger">Immediate action required</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="card border-warning border-3">
                                                <div className="card-body text-center">
                                                    <h2 className="text-warning mb-0">{stockReport.summary.low_stock_items}</h2>
                                                    <p className="text-muted mb-0">Low Stock Items</p>
                                                    <small className="text-warning">Monitor closely</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="card border-success border-3">
                                                <div className="card-body text-center">
                                                    <h2 className="text-success mb-0">{stockReport.summary.healthy_items}</h2>
                                                    <p className="text-muted mb-0">Healthy Items</p>
                                                    <small className="text-success">Stock levels good</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Critical Items Table */}
                                    {stockReport.items_by_status.critical.length > 0 && (
                                        <div className="mb-4">
                                            <h6 className="fw-bold text-danger mb-3">
                                                <i className="fas fa-exclamation-circle me-2"></i>
                                                Critical Stock Items - Immediate Action Required
                                            </h6>
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead className="table-danger">
                                                        <tr>
                                                            <th>Material</th>
                                                            <th>SKU</th>
                                                            <th className="text-end">Current Stock</th>
                                                            <th className="text-end">Safety Stock</th>
                                                            <th className="text-end">Daily Usage</th>
                                                            <th className="text-end">Days Left</th>
                                                            <th>Depletion Date</th>
                                                            <th className="text-end">Reorder Qty</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {stockReport.items_by_status.critical.map((item, idx) => (
                                                            <tr key={idx} className="table-danger">
                                                                <td className="fw-bold">{item.material}</td>
                                                                <td><code>{item.sku}</code></td>
                                                                <td className="text-end">{item.current_stock} {item.unit}</td>
                                                                <td className="text-end">{item.safety_stock}</td>
                                                                <td className="text-end">{item.daily_usage_rate}</td>
                                                                <td className="text-end">
                                                                    <span className="badge bg-danger">{item.days_until_depletion}</span>
                                                                </td>
                                                                <td>{item.predicted_depletion_date}</td>
                                                                <td className="text-end fw-bold text-danger">
                                                                    {item.suggested_reorder_qty} {item.unit}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Low Stock Items */}
                                    {stockReport.items_by_status.low.length > 0 && (
                                        <div>
                                            <h6 className="fw-bold text-warning mb-3">Low Stock Items - Monitor Closely</h6>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-hover">
                                                    <thead className="table-warning">
                                                        <tr>
                                                            <th>Material</th>
                                                            <th className="text-end">Current Stock</th>
                                                            <th className="text-end">Days Left</th>
                                                            <th className="text-end">Reorder Qty</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {stockReport.items_by_status.low.slice(0, 10).map((item, idx) => (
                                                            <tr key={idx} className="table-warning">
                                                                <td>{item.material}</td>
                                                                <td className="text-end">{item.current_stock} {item.unit}</td>
                                                                <td className="text-end">
                                                                    <span className="badge bg-warning">{item.days_until_depletion}</span>
                                                                </td>
                                                                <td className="text-end fw-bold">{item.suggested_reorder_qty}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Material Usage Tab - Inventory */}
                        {activeTab === "material-usage" && mainTab === "inventory" && (
                            resourceUtilization && resourceUtilization.material_usage_by_product ? (
                            <div>
                                {/* Summary Cards */}
                                <div className="row g-3 mb-4">
                                    {resourceUtilization.material_usage_by_product.map((product, idx) => (
                                        <div key={idx} className="col-md-4">
                                            <div className="card border-0 shadow-sm h-100" style={{ 
                                                borderLeft: `4px solid ${idx === 0 ? '#8b5e34' : idx === 1 ? '#d4a574' : '#17a2b8'}` 
                                            }}>
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <h6 className="mb-0 fw-bold">{product.product}</h6>
                                                        <span className="badge" style={{ 
                                                            backgroundColor: idx === 0 ? '#fff3e0' : idx === 1 ? '#f3e5f5' : '#e8f5e9',
                                                            color: idx === 0 ? '#8b5e34' : idx === 1 ? '#d4a574' : '#17a2b8'
                                                        }}>
                                                            {product.total_materials} materials
                                                        </span>
                                                    </div>
                                                    <div className="mt-3">
                                                        <div className="text-muted small mb-1">Total Materials Used</div>
                                                        <h4 className="mb-0" style={{ color: idx === 0 ? '#8b5e34' : idx === 1 ? '#d4a574' : '#17a2b8' }}>
                                                            {product.materials.reduce((sum, m) => sum + parseFloat(m.total_used || 0), 0).toFixed(2)}
                                                        </h4>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Material Usage Overview - Horizontal Bar Chart */}
                                <div className="card shadow-sm mb-4">
                                    <div className="card-header bg-white border-bottom">
                                        <h5 className="mb-0 fw-bold">📊 Top Materials Usage Across All Products</h5>
                                        <small className="text-muted">Total consumption by material type</small>
                                    </div>
                                    <div className="card-body">
                                        <ResponsiveContainer width="100%" height={400}>
                                            <BarChart 
                                                layout="vertical"
                                                data={(() => {
                                                    const materialTotals = {};
                                                    resourceUtilization.material_usage_by_product.forEach(product => {
                                                        product.materials.forEach(mat => {
                                                            const key = mat.material;
                                                            if (!materialTotals[key]) {
                                                                materialTotals[key] = {
                                                                    material: key,
                                                                    total: 0,
                                                                    unit: mat.unit
                                                                };
                                                            }
                                                            materialTotals[key].total += parseFloat(mat.total_used || 0);
                                                        });
                                                    });
                                                    return Object.values(materialTotals)
                                                        .sort((a, b) => b.total - a.total)
                                                        .slice(0, 8);
                                                })()}
                                                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" />
                                                <YAxis dataKey="material" type="category" width={110} />
                                                <Tooltip 
                                                    formatter={(value, name, props) => [
                                                        `${value.toFixed(2)} ${props.payload.unit}`,
                                                        'Total Used'
                                                    ]}
                                                />
                                                <Bar dataKey="total" fill="#0d6efd" name="Total Usage">
                                                    {(() => {
                                                        const materialTotals = {};
                                                        resourceUtilization.material_usage_by_product.forEach(product => {
                                                            product.materials.forEach(mat => {
                                                                const key = mat.material;
                                                                if (!materialTotals[key]) {
                                                                    materialTotals[key] = { material: key, total: 0, unit: mat.unit };
                                                                }
                                                                materialTotals[key].total += parseFloat(mat.total_used || 0);
                                                            });
                                                        });
                                                        return Object.values(materialTotals)
                                                            .sort((a, b) => b.total - a.total)
                                                            .slice(0, 8)
                                                            .map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ));
                                                    })()}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Product Comparison - Grouped Bar Chart */}
                                <div className="card shadow-sm mb-4">
                                    <div className="card-header bg-white border-bottom">
                                        <h5 className="mb-0 fw-bold">🔄 Material Usage Comparison by Product</h5>
                                        <small className="text-muted">Side-by-side comparison of top materials</small>
                                    </div>
                                    <div className="card-body">
                                        <ResponsiveContainer width="100%" height={350}>
                                            <BarChart 
                                                data={(() => {
                                                    // Get all unique materials
                                                    const allMaterials = new Set();
                                                    resourceUtilization.material_usage_by_product.forEach(product => {
                                                        product.materials.slice(0, 5).forEach(mat => allMaterials.add(mat.material));
                                                    });
                                                    
                                                    // Create data structure
                                                    return Array.from(allMaterials).map(material => {
                                                        const dataPoint = { material };
                                                        resourceUtilization.material_usage_by_product.forEach(product => {
                                                            const mat = product.materials.find(m => m.material === material);
                                                            dataPoint[product.product] = mat ? parseFloat(mat.total_used || 0) : 0;
                                                        });
                                                        return dataPoint;
                                                    }).slice(0, 6);
                                                })()}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis 
                                                    dataKey="material" 
                                                    angle={-35} 
                                                    textAnchor="end" 
                                                    height={80}
                                                    interval={0}
                                                />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                                <Bar dataKey="Dining Table" fill="#8b5e34" name="Dining Table" />
                                                <Bar dataKey="Wooden Chair" fill="#d4a574" name="Wooden Chair" />
                                                <Bar dataKey="Alkansya" fill="#17a2b8" name="Alkansya" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Detailed Material Usage by Product */}
                                <div className="row g-4">
                                    {resourceUtilization.material_usage_by_product.map((product, idx) => (
                                        <div key={idx} className="col-lg-4">
                                            <div className="card shadow-sm h-100">
                                                <div className="card-header" style={{ 
                                                    backgroundColor: idx === 0 ? '#fff3e0' : idx === 1 ? '#f3e5f5' : '#e8f5e9',
                                                    borderBottom: `3px solid ${idx === 0 ? '#8b5e34' : idx === 1 ? '#d4a574' : '#17a2b8'}`
                                                }}>
                                                    <h6 className="mb-0 fw-bold" style={{ color: idx === 0 ? '#8b5e34' : idx === 1 ? '#d4a574' : '#17a2b8' }}>
                                                        {product.product}
                                                    </h6>
                                                    <small className="text-muted">{product.total_materials} materials tracked</small>
                                                </div>
                                                <div className="card-body p-0">
                                                    {/* Pie Chart for Material Distribution */}
                                                    <div className="p-3 bg-light">
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <PieChart>
                                                                <Pie
                                                                    data={product.materials.map(mat => ({
                                                                        name: mat.material,
                                                                        value: parseFloat(mat.total_used || 0)
                                                                    }))}
                                                                    cx="50%"
                                                                    cy="40%"
                                                                    labelLine={false}
                                                                    label={false}
                                                                    outerRadius={70}
                                                                    fill="#8884d8"
                                                                    dataKey="value"
                                                                >
                                                                    {product.materials.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip 
                                                                    formatter={(value, name) => [
                                                                        `${value.toFixed(2)} units`,
                                                                        name
                                                                    ]}
                                                                />
                                                                <Legend 
                                                                    verticalAlign="bottom" 
                                                                    height={80}
                                                                    wrapperStyle={{ 
                                                                        paddingTop: '10px',
                                                                        fontSize: '11px',
                                                                        lineHeight: '1.2'
                                                                    }}
                                                                    iconSize={8}
                                                                    formatter={(value, entry) => {
                                                                        const percent = ((entry.payload.value / product.materials.reduce((sum, m) => sum + parseFloat(m.total_used || 0), 0)) * 100).toFixed(0);
                                                                        return `${value.substring(0, 20)}${value.length > 20 ? '...' : ''} (${percent}%)`;
                                                                    }}
                                                                />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    
                                                    {/* Material List */}
                                                    <div className="table-responsive">
                                                        <table className="table table-sm table-hover mb-0">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th className="small">Material</th>
                                                                    <th className="text-end small">Used</th>
                                                                    <th className="text-end small">Avg</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {product.materials.map((mat, midx) => (
                                                                    <tr key={midx}>
                                                                        <td className="small">
                                                                            <span className="badge me-1" style={{ 
                                                                                backgroundColor: COLORS[midx % COLORS.length],
                                                                                width: '8px',
                                                                                height: '8px',
                                                                                borderRadius: '50%',
                                                                                display: 'inline-block'
                                                                            }}></span>
                                                                            {mat.material}
                                                                        </td>
                                                                        <td className="text-end small fw-bold">
                                                                            {parseFloat(mat.total_used || 0).toFixed(2)} {mat.unit}
                                                                        </td>
                                                                        <td className="text-end small text-muted">
                                                                            {parseFloat(mat.avg_used || 0).toFixed(2)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            ) : (
                                <div className="alert alert-warning">
                                    <h5 className="alert-heading">📊 Material Usage Data Not Available</h5>
                                    {!resourceUtilization ? (
                                        <p>Loading resource utilization data...</p>
                                    ) : (
                                        <>
                                            <p>No material usage data found for the selected period.</p>
                                            <hr/>
                                            <p className="mb-0"><strong>Possible reasons:</strong></p>
                                            <ul className="mb-0">
                                                <li>Database hasn't been seeded with inventory usage data</li>
                                                <li>No production orders have been processed yet</li>
                                                <li>The selected date range has no data</li>
                                            </ul>
                                            <hr/>
                                            <p className="mb-0"><strong>To fix:</strong> Run <code>php artisan db:seed</code> in the backend</p>
                                        </>
                                    )}
                                </div>
                            )
                        )}
                        
                        {/* Production Reports Content */}
                        {mainTab === "production" && (
                            <div>
                                {/* Capacity Utilization Tab */}
                                {activeTab === "capacity" && productionPerformance && productionPerformance.capacity_utilization && (
                                    <div className="row g-4">
                                        <div className="col-lg-12">
                                            <div className="card shadow-sm">
                                                <div className="card-header bg-white border-bottom">
                                                    <h5 className="mb-0 fw-bold">📊 Capacity Utilization Overview</h5>
                                                </div>
                                                <div className="card-body">
                                                    <div className="row">
                                                        <div className="col-md-4">
                                                            <div className="card bg-light mb-3">
                                                                <div className="card-body text-center">
                                                                    <h2 className="text-primary mb-1">{productionPerformance.capacity_utilization.total_capacity}</h2>
                                                                    <p className="text-muted small mb-0">Total Capacity</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <div className="card bg-light mb-3">
                                                                <div className="card-body text-center">
                                                                    <h2 className="text-warning mb-1">{productionPerformance.capacity_utilization.current_utilization}</h2>
                                                                    <p className="text-muted small mb-0">Current Utilization</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <div className="card bg-light mb-3">
                                                                <div className="card-body text-center">
                                                                    <h2 className="text-success mb-1">{productionPerformance.capacity_utilization.utilization_percentage}%</h2>
                                                                    <p className="text-muted small mb-0">Utilization Rate</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-4">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span className="fw-bold">Overall Capacity Utilization</span>
                                                            <span className="text-primary fw-bold">{productionPerformance.capacity_utilization.utilization_percentage}%</span>
                                                        </div>
                                                        <div className="progress" style={{ height: '35px' }}>
                                                            <div 
                                                                className={`progress-bar ${
                                                                    productionPerformance.capacity_utilization.utilization_percentage > 90 ? 'bg-danger' :
                                                                    productionPerformance.capacity_utilization.utilization_percentage > 70 ? 'bg-warning' : 'bg-success'
                                                                }`}
                                                                style={{ width: `${productionPerformance.capacity_utilization.utilization_percentage}%` }}
                                                            >
                                                                {productionPerformance.capacity_utilization.utilization_percentage}%
                                                            </div>
                                                        </div>
                                                        <small className="text-muted mt-2 d-block">
                                                            {productionPerformance.capacity_utilization.utilization_percentage > 90 ? '⚠️ Capacity overloaded - consider resource reallocation' :
                                                             productionPerformance.capacity_utilization.utilization_percentage > 70 ? '⚡ Operating at high capacity' :
                                                             '✅ Capacity available for new orders'}
                                                        </small>
                                                    </div>
                                                    
                                                    {/* Resource Allocation Alerts */}
                                                    {productionPerformance.resource_allocation && productionPerformance.resource_allocation.length > 0 && (
                                                        <div className="mt-4">
                                                            <h6 className="fw-bold mb-3">⚠️ Resource Allocation Alerts</h6>
                                                            {productionPerformance.resource_allocation.map((alert, idx) => (
                                                                <div key={idx} className="alert alert-warning mb-2">
                                                                    <strong>{alert.stage}</strong>: {alert.message}
                                                                    <br />
                                                                    <small>Workload: {alert.workload} items | Priority: {alert.priority}</small>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Output Analytics Tab - NEW */}
                                {activeTab === "output-analytics" && productionOutput && (
                                    <div className="card shadow-sm mb-4">
                                        <div className="card-header bg-white border-bottom">
                                            <h5 className="mb-0 fw-bold">📈 Production Output by Product</h5>
                                        </div>
                                        <div className="card-body">
                                            {/* Summary Cards */}
                                            <div className="row mb-4">
                                                <div className="col-md-4">
                                                    <div className="card" style={{ backgroundColor: '#fff3e0', border: 'none' }}>
                                                        <div className="card-body text-center">
                                                            <h6 className="text-muted mb-2">🪑 Dining Table</h6>
                                                            <h2 className="mb-1" style={{ color: '#8b5e34' }}>{productionOutput.products.table.totals.total_output}</h2>
                                                            <small className="text-muted">Avg: {productionOutput.products.table.totals.avg_per_period} per period</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="card" style={{ backgroundColor: '#f3e5f5', border: 'none' }}>
                                                        <div className="card-body text-center">
                                                            <h6 className="text-muted mb-2">🪑 Wooden Chair</h6>
                                                            <h2 className="mb-1" style={{ color: '#d4a574' }}>{productionOutput.products.chair.totals.total_output}</h2>
                                                            <small className="text-muted">Avg: {productionOutput.products.chair.totals.avg_per_period} per period</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="card" style={{ backgroundColor: '#e8f5e9', border: 'none' }}>
                                                        <div className="card-body text-center">
                                                            <h6 className="text-muted mb-2">🐷 Alkansya</h6>
                                                            <h2 className="mb-1" style={{ color: '#17a2b8' }}>{productionOutput.products.alkansya.totals.total_output}</h2>
                                                            <small className="text-muted">Avg: {productionOutput.products.alkansya.totals.avg_per_period} per period</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Top Performing Products */}
                                            <div className="card bg-light mb-4">
                                                <div className="card-body">
                                                    <h6 className="fw-bold mb-3">🏆 Top Performing Products</h6>
                                                    {productionOutput.top_performing.map((product, idx) => (
                                                        <div key={idx} className="mb-3">
                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                <span className="fw-bold">{product.product}</span>
                                                                <span className="badge bg-success">{product.output} units</span>
                                                            </div>
                                                            <div className="progress" style={{ height: '10px' }}>
                                                                <div
                                                                    className="progress-bar"
                                                                    style={{ 
                                                                        width: `${product.efficiency}%`,
                                                                        backgroundColor: idx === 0 ? '#28a745' : idx === 1 ? '#17a2b8' : '#6c757d'
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <small className="text-muted">{product.efficiency}% efficiency</small>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                            {/* Line Chart - Production Trends */}
                                            <h6 className="fw-bold mb-3">📊 Production Output Trends</h6>
                                            <ResponsiveContainer width="100%" height={400}>
                                                <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                                    <XAxis 
                                                        dataKey="period" 
                                                        stroke="#666"
                                                        angle={-15}
                                                        textAnchor="end"
                                                        height={80}
                                                    />
                                                    <YAxis stroke="#666" />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                                            border: '2px solid #8b5e34',
                                                            borderRadius: '8px',
                                                        }}
                                                    />
                                                    <Legend />
                                                    <Line 
                                                        data={productionOutput.products.table.output_trend} 
                                                        type="monotone" 
                                                        dataKey="output" 
                                                        stroke="#8b5e34"
                                                        strokeWidth={3}
                                                        name="🪑 Dining Table"
                                                        dot={{ r: 4, fill: '#8b5e34' }}
                                                    />
                                                    <Line 
                                                        data={productionOutput.products.chair.output_trend} 
                                                        type="monotone" 
                                                        dataKey="output" 
                                                        stroke="#d4a574"
                                                        strokeWidth={3}
                                                        name="🪑 Wooden Chair"
                                                        dot={{ r: 4, fill: '#d4a574' }}
                                                    />
                                                    <Line 
                                                        data={productionOutput.products.alkansya.output_trend} 
                                                        type="monotone" 
                                                        dataKey="output" 
                                                        stroke="#17a2b8"
                                                        strokeWidth={3}
                                                        name="🐷 Alkansya"
                                                        dot={{ r: 4, fill: '#17a2b8' }}
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Resource Utilization Tab - NEW */}
                                {activeTab === "resource-util" && (
                                    resourceUtilization && resourceUtilization.material_usage_by_product ? (
                                    <div className="card shadow-sm mb-4">
                                        <div className="card-header bg-white border-bottom">
                                            <h5 className="mb-0 fw-bold">📦 Resource Utilization & Material Efficiency</h5>
                                        </div>
                                        <div className="card-body">
                                            <h6 className="fw-bold mb-3">Material Usage by Product</h6>
                                            <div className="row mb-4">
                                                {resourceUtilization.material_usage_by_product.map((product, idx) => (
                                                    <div key={idx} className="col-md-4 mb-3">
                                                        <div className="card h-100">
                                                            <div className="card-header bg-light">
                                                                <h6 className="mb-0">{product.product}</h6>
                                                                <small className="text-muted">{product.total_materials} materials used</small>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="table-responsive">
                                                                    <table className="table table-sm">
                                                                        <thead>
                                                                            <tr>
                                                                                <th className="small">Material</th>
                                                                                <th className="text-end small">Used</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {product.materials.slice(0, 5).map((mat, midx) => (
                                                                                <tr key={midx}>
                                                                                    <td className="small">{mat.material}</td>
                                                                                    <td className="text-end small fw-bold">{mat.total_used} {mat.unit}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* Material Efficiency Chart */}
                                            {resourceUtilization.efficiency && resourceUtilization.efficiency.length > 0 && (
                                                <div>
                                                    <h6 className="fw-bold mb-3">📊 Material Usage Efficiency (Actual vs Estimated)</h6>
                                                    <ResponsiveContainer width="100%" height={350}>
                                                        <BarChart data={resourceUtilization.efficiency}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="product" />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Bar dataKey="estimated_usage" fill="#ffc107" name="Estimated Usage" />
                                                            <Bar dataKey="actual_usage" fill="#17a2b8" name="Actual Usage" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                    
                                                    {/* Efficiency Table */}
                                                    <div className="table-responsive mt-3">
                                                        <table className="table table-hover">
                                                            <thead>
                                                                <tr>
                                                                    <th>Product</th>
                                                                    <th className="text-end">Estimated</th>
                                                                    <th className="text-end">Actual</th>
                                                                    <th className="text-end">Efficiency</th>
                                                                    <th className="text-end">Variance</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {resourceUtilization.efficiency.map((item, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="fw-bold">{item.product}</td>
                                                                        <td className="text-end">{item.estimated_usage}</td>
                                                                        <td className="text-end">{item.actual_usage}</td>
                                                                        <td className="text-end">
                                                                            <span className={`badge ${
                                                                                item.efficiency_percentage >= 95 ? 'bg-success' :
                                                                                item.efficiency_percentage >= 85 ? 'bg-warning' : 'bg-danger'
                                                                            }`}>
                                                                                {item.efficiency_percentage}%
                                                                            </span>
                                                                        </td>
                                                                        <td className="text-end">
                                                                            <span className={item.variance > 0 ? 'text-danger' : 'text-success'}>
                                                                                {item.variance > 0 ? '+' : ''}{item.variance}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    ) : (
                                        <div className="alert alert-warning">
                                            <h5 className="alert-heading">📦 Resource Utilization Data Not Available</h5>
                                            {!resourceUtilization ? (
                                                <p>Loading resource utilization data...</p>
                                            ) : (
                                                <>
                                                    <p>No material usage data found for the selected period.</p>
                                                    <hr/>
                                                    <p className="mb-0"><strong>Possible reasons:</strong></p>
                                                    <ul className="mb-0">
                                                        <li>Database hasn't been seeded with inventory usage data</li>
                                                        <li>No production orders have been processed yet</li>
                                                        <li>The selected date range has no data</li>
                                                    </ul>
                                                    <hr/>
                                                    <p className="mb-0"><strong>To fix:</strong> Run <code>php artisan db:seed</code> in the backend</p>
                                                </>
                                            )}
                                        </div>
                                    )
                                )}
                                
                                {/* Cycle & Throughput Tab - NEW */}
                                {activeTab === "cycle-throughput" && advancedPerformance && (
                                    <div className="card shadow-sm mb-4">
                                        <div className="card-header bg-white border-bottom">
                                            <h5 className="mb-0 fw-bold">⏱️ Cycle Time & Throughput Analysis</h5>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6 mb-4">
                                                    <h6 className="fw-bold mb-3">Cycle Time Analysis (Days)</h6>
                                                    <ResponsiveContainer width="100%" height={350}>
                                                        <BarChart data={advancedPerformance.cycle_time_analysis}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="product_type" />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Bar dataKey="avg_cycle_time_days" fill="#8b5e34" name="Avg Cycle Time" />
                                                            <Bar dataKey="min_cycle_time_days" fill="#28a745" name="Min Time" />
                                                            <Bar dataKey="max_cycle_time_days" fill="#dc3545" name="Max Time" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="col-md-6 mb-4">
                                                    <h6 className="fw-bold mb-3">Throughput Rate</h6>
                                                    <ResponsiveContainer width="100%" height={350}>
                                                        <BarChart data={advancedPerformance.throughput_rate}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="product_type" />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Bar dataKey="throughput_per_day" fill="#17a2b8" name="Per Day" />
                                                            <Bar dataKey="throughput_per_week" fill="#8b5e34" name="Per Week" />
                                                            <Bar dataKey="throughput_per_month" fill="#d4a574" name="Per Month" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                            
                                            {/* Performance Tables */}
                                            <div className="row mt-4">
                                                <div className="col-md-6">
                                                    <h6 className="fw-bold mb-3">Cycle Time Details</h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-sm table-hover">
                                                            <thead>
                                                                <tr>
                                                                    <th>Product</th>
                                                                    <th className="text-end">Avg Days</th>
                                                                    <th className="text-end">Min</th>
                                                                    <th className="text-end">Max</th>
                                                                    <th className="text-end">Completed</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {advancedPerformance.cycle_time_analysis.map((item, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="fw-bold">{item.product_type}</td>
                                                                        <td className="text-end">{item.avg_cycle_time_days}</td>
                                                                        <td className="text-end text-success">{item.min_cycle_time_days}</td>
                                                                        <td className="text-end text-danger">{item.max_cycle_time_days}</td>
                                                                        <td className="text-end">{item.total_completed}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <h6 className="fw-bold mb-3">Throughput Details</h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-sm table-hover">
                                                            <thead>
                                                                <tr>
                                                                    <th>Product</th>
                                                                    <th className="text-end">Per Day</th>
                                                                    <th className="text-end">Per Week</th>
                                                                    <th className="text-end">Per Month</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {advancedPerformance.throughput_rate.map((item, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="fw-bold">{item.product_type}</td>
                                                                        <td className="text-end">{item.throughput_per_day}</td>
                                                                        <td className="text-end">{item.throughput_per_week}</td>
                                                                        <td className="text-end">{item.throughput_per_month}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Predictive Analytics Tab - NEW */}
                                {activeTab === "predictive" && predictiveAnalytics && (
                                    <div className="card shadow-sm mb-4">
                                        <div className="card-header bg-white border-bottom">
                                            <h5 className="mb-0 fw-bold">🔮 Predictive Analytics & Forecasting</h5>
                                        </div>
                                        <div className="card-body">
                                            {/* Capacity Forecast */}
                                            {predictiveAnalytics.production_capacity_forecast && predictiveAnalytics.production_capacity_forecast.length > 0 && (
                                                <div className="mb-4">
                                                    <h6 className="fw-bold mb-3">Production Capacity Forecast (30 Days)</h6>
                                                    <ResponsiveContainer width="100%" height={350}>
                                                        <BarChart data={predictiveAnalytics.production_capacity_forecast}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="product_type" />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Bar dataKey="forecasted_output_30_days" fill="#8b5e34" name="Forecasted Output (30 days)" />
                                                            <Bar dataKey="weekly_capacity" fill="#17a2b8" name="Weekly Capacity" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                            
                                            {/* Trend Analysis */}
                                            {predictiveAnalytics.trend_analysis && (
                                                <div className="row mb-4">
                                                    <div className="col-md-6">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="text-muted mb-2">Overall Trend</h6>
                                                                <h3 className="mb-0">
                                                                    <span className={`badge ${
                                                                        predictiveAnalytics.trend_analysis.overall_trend === 'increasing' ? 'bg-success' :
                                                                        predictiveAnalytics.trend_analysis.overall_trend === 'decreasing' ? 'bg-danger' :
                                                                        'bg-secondary'
                                                                    }`}>
                                                                        {predictiveAnalytics.trend_analysis.overall_trend.toUpperCase()}
                                                                    </span>
                                                                </h3>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="text-muted mb-2">Avg Monthly Output</h6>
                                                                <h3 className="mb-0 text-primary">{predictiveAnalytics.trend_analysis.avg_monthly_output}</h3>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Monthly Trends Chart */}
                                            {predictiveAnalytics.trend_analysis && predictiveAnalytics.trend_analysis.monthly_trends && (
                                                <div className="mb-4">
                                                    <h6 className="fw-bold mb-3">Monthly Trend Analysis</h6>
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <LineChart data={predictiveAnalytics.trend_analysis.monthly_trends}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="month" />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Line 
                                                                type="monotone" 
                                                                dataKey="total_output" 
                                                                stroke="#17a2b8"
                                                                strokeWidth={3}
                                                                name="Total Output"
                                                                dot={{ r: 5 }}
                                                            />
                                                            <Line 
                                                                type="monotone" 
                                                                dataKey="avg_efficiency" 
                                                                stroke="#28a745"
                                                                strokeWidth={3}
                                                                name="Avg Efficiency %"
                                                                dot={{ r: 5 }}
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                            
                                            {/* Replenishment Needs */}
                                            {predictiveAnalytics.inventory_replenishment_needs && predictiveAnalytics.inventory_replenishment_needs.length > 0 && (
                                                <div>
                                                    <h6 className="fw-bold mb-3 text-danger">
                                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                                        Materials Needing Replenishment
                                                    </h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-hover">
                                                            <thead>
                                                                <tr>
                                                                    <th>Material</th>
                                                                    <th>SKU</th>
                                                                    <th className="text-end">Current Stock</th>
                                                                    <th className="text-end">Days Left</th>
                                                                    <th>Urgency</th>
                                                                    <th className="text-end">Recommended Order</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {predictiveAnalytics.inventory_replenishment_needs.map((item, idx) => (
                                                                    <tr key={idx} className={item.urgency === 'critical' ? 'table-danger' : 'table-warning'}>
                                                                        <td className="fw-bold">{item.material}</td>
                                                                        <td><code>{item.sku}</code></td>
                                                                        <td className="text-end">{item.current_stock} {item.unit}</td>
                                                                        <td className="text-end">
                                                                            <span className={`badge ${
                                                                                item.days_until_depletion <= 3 ? 'bg-danger' :
                                                                                item.days_until_depletion <= 7 ? 'bg-warning' : 'bg-info'
                                                                            }`}>
                                                                                {item.days_until_depletion} days
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <span className={`badge ${item.urgency === 'critical' ? 'bg-danger' : 'bg-warning'}`}>
                                                                                {item.urgency}
                                                                            </span>
                                                                        </td>
                                                                        <td className="text-end fw-bold text-danger">
                                                                            {item.recommended_order_qty} {item.unit}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Stock Report Tab - NEW (Inventory) */}
                                {activeTab === "stock-report" && stockReport && (
                                    <div className="card shadow-sm mb-4">
                                        <div className="card-header bg-white border-bottom">
                                            <h5 className="mb-0 fw-bold">🚨 Automated Stock Report</h5>
                                            <small className="text-muted">Generated: {stockReport.generated_at}</small>
                                        </div>
                                        <div className="card-body">
                                            {/* Summary Cards */}
                                            <div className="row mb-4">
                                                <div className="col-md-4">
                                                    <div className="card border-danger border-3">
                                                        <div className="card-body text-center">
                                                            <h2 className="text-danger mb-0">{stockReport.summary.critical_items}</h2>
                                                            <p className="text-muted mb-0">Critical Items</p>
                                                            <small className="text-danger">Immediate action required</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="card border-warning border-3">
                                                        <div className="card-body text-center">
                                                            <h2 className="text-warning mb-0">{stockReport.summary.low_stock_items}</h2>
                                                            <p className="text-muted mb-0">Low Stock Items</p>
                                                            <small className="text-warning">Monitor closely</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="card border-success border-3">
                                                        <div className="card-body text-center">
                                                            <h2 className="text-success mb-0">{stockReport.summary.healthy_items}</h2>
                                                            <p className="text-muted mb-0">Healthy Items</p>
                                                            <small className="text-success">Stock levels good</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Critical Items Table */}
                                            {stockReport.items_by_status.critical.length > 0 && (
                                                <div className="mb-4">
                                                    <h6 className="fw-bold text-danger mb-3">
                                                        <i className="fas fa-exclamation-circle me-2"></i>
                                                        Critical Stock Items - Immediate Action Required
                                                    </h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-hover">
                                                            <thead className="table-danger">
                                                                <tr>
                                                                    <th>Material</th>
                                                                    <th>SKU</th>
                                                                    <th className="text-end">Current Stock</th>
                                                                    <th className="text-end">Safety Stock</th>
                                                                    <th className="text-end">Daily Usage</th>
                                                                    <th className="text-end">Days Left</th>
                                                                    <th>Depletion Date</th>
                                                                    <th className="text-end">Reorder Qty</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {stockReport.items_by_status.critical.map((item, idx) => (
                                                                    <tr key={idx} className="table-danger">
                                                                        <td className="fw-bold">{item.material}</td>
                                                                        <td><code>{item.sku}</code></td>
                                                                        <td className="text-end">{item.current_stock} {item.unit}</td>
                                                                        <td className="text-end">{item.safety_stock}</td>
                                                                        <td className="text-end">{item.daily_usage_rate}</td>
                                                                        <td className="text-end">
                                                                            <span className="badge bg-danger">{item.days_until_depletion}</span>
                                                                        </td>
                                                                        <td>{item.predicted_depletion_date}</td>
                                                                        <td className="text-end fw-bold text-danger">
                                                                            {item.suggested_reorder_qty} {item.unit}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Low Stock Items */}
                                            {stockReport.items_by_status.low.length > 0 && (
                                                <div>
                                                    <h6 className="fw-bold text-warning mb-3">Low Stock Items - Monitor Closely</h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-sm table-hover">
                                                            <thead className="table-warning">
                                                                <tr>
                                                                    <th>Material</th>
                                                                    <th className="text-end">Current Stock</th>
                                                                    <th className="text-end">Days Left</th>
                                                                    <th className="text-end">Reorder Qty</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {stockReport.items_by_status.low.slice(0, 10).map((item, idx) => (
                                                                    <tr key={idx} className="table-warning">
                                                                        <td>{item.material}</td>
                                                                        <td className="text-end">{item.current_stock} {item.unit}</td>
                                                                        <td className="text-end">
                                                                            <span className="badge bg-warning">{item.days_until_depletion}</span>
                                                                        </td>
                                                                        <td className="text-end fw-bold">{item.suggested_reorder_qty}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Material Usage Tab - NEW (Inventory) */}
                                {activeTab === "material-usage" && resourceUtilization && resourceUtilization.material_usage_by_product && (
                                    <div className="card shadow-sm mb-4">
                                        <div className="card-header bg-white border-bottom">
                                            <h5 className="mb-0 fw-bold">📊 Material Usage Trends by Product</h5>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                {resourceUtilization.material_usage_by_product.map((product, idx) => (
                                                    <div key={idx} className="col-md-4 mb-3">
                                                        <div className="card h-100 border-2" style={{ borderColor: idx === 0 ? '#8b5e34' : idx === 1 ? '#d4a574' : '#17a2b8' }}>
                                                            <div className="card-header" style={{ 
                                                                backgroundColor: idx === 0 ? '#fff3e0' : idx === 1 ? '#f3e5f5' : '#e8f5e9'
                                                            }}>
                                                                <h6 className="mb-0 fw-bold">{product.product}</h6>
                                                                <small className="text-muted">{product.total_materials} materials tracked</small>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="table-responsive">
                                                                    <table className="table table-sm">
                                                                        <thead>
                                                                            <tr>
                                                                                <th className="small">Material</th>
                                                                                <th className="text-end small">Total Used</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {product.materials.slice(0, 6).map((mat, midx) => (
                                                                                <tr key={midx}>
                                                                                    <td className="small">{mat.material}</td>
                                                                                    <td className="text-end small fw-bold">
                                                                                        {mat.total_used} {mat.unit}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Efficiency Metrics Tab */}
                                {activeTab === "efficiency" && productionPerformance && (
                                    <div>
                                        <div className="row g-4 mb-4">
                                            <div className="col-lg-6">
                                                <div className="card shadow-sm">
                                                    <div className="card-header bg-white border-bottom">
                                                        <h5 className="mb-0 fw-bold">🏆 Top Products</h5>
                                                    </div>
                                                    <div className="card-body">
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <BarChart data={productionPerformance.top_products || []} layout="vertical">
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis type="number" />
                                                                <YAxis dataKey="name" type="category" width={150} />
                                                                <Tooltip />
                                                                <Bar dataKey="quantity" fill="#0d6efd" name="Quantity Produced" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="card shadow-sm">
                                                    <div className="card-header bg-white border-bottom">
                                                        <h5 className="mb-0 fw-bold">👥 Top Users/Workers</h5>
                                                    </div>
                                                    <div className="card-body">
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <BarChart data={productionPerformance.top_users || []} layout="vertical">
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis type="number" />
                                                                <YAxis dataKey="name" type="category" width={150} />
                                                                <Tooltip />
                                                                <Bar dataKey="quantity" fill="#28a745" name="Quantity Produced" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <DailyOutputChart data={productionPerformance.daily_output || []} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default Report;
