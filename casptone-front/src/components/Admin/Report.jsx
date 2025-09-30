import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import AppLayout from "../Header";
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

    useEffect(() => {
        fetchAllReports();
    }, [windowDays]);

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
                                setActiveTab("performance");
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
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "daily" ? "active" : ""}`} onClick={() => setActiveTab("daily")}>
                            📅 Daily Usage
                        </button>
                    </li>
                </ul>
                )}
                
                {/* Production Sub-tabs */}
                {mainTab === "production" && (
                <ul className="nav nav-tabs mb-4">
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "performance" ? "active" : ""}`} onClick={() => setActiveTab("performance")}>
                            📊 Performance
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "progress" ? "active" : ""}`} onClick={() => setActiveTab("progress")}>
                            ⏱️ Work Progress
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "capacity" ? "active" : ""}`} onClick={() => setActiveTab("capacity")}>
                            📈 Capacity Utilization
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "efficiency" ? "active" : ""}`} onClick={() => setActiveTab("efficiency")}>
                            ⚡ Efficiency Metrics
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
                        
                        {/* Production Reports Content */}
                        {mainTab === "production" && (
                            <div>
                                {/* Performance Tab */}
                                {activeTab === "performance" && productionPerformance && (
                                    <div className="row g-4">
                                        <div className="col-lg-8">
                                            <div className="card shadow-sm">
                                                <div className="card-header bg-white border-bottom">
                                                    <h5 className="mb-0 fw-bold">📊 Daily Production Output</h5>
                                                </div>
                                                <div className="card-body">
                                                    <ResponsiveContainer width="100%" height={350}>
                                                        <BarChart data={productionPerformance.daily_output || []}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="date" />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Bar dataKey="quantity" fill="#0d6efd" name="Output Quantity" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-lg-4">
                                            <div className="card shadow-sm">
                                                <div className="card-header bg-white border-bottom">
                                                    <h5 className="mb-0 fw-bold">🎯 Stage Distribution</h5>
                                                </div>
                                                <div className="card-body">
                                                    <ResponsiveContainer width="100%" height={400}>
                                                        <PieChart>
                                                            <Pie
                                                                data={productionPerformance.stage_breakdown || []}
                                                                cx="50%"
                                                                cy="45%"
                                                                labelLine={{
                                                                    stroke: '#666',
                                                                    strokeWidth: 1.5
                                                                }}
                                                                label={({ cx, cy, midAngle, innerRadius, outerRadius, name, value }) => {
                                                                    const RADIAN = Math.PI / 180;
                                                                    const radius = outerRadius + 40;
                                                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                                                    
                                                                    // Shorten stage names for better display
                                                                    const shortName = name
                                                                        .replace('Material Preparation', 'Material Prep')
                                                                        .replace('Cutting & Shaping', 'Cutting')
                                                                        .replace('Sanding & Surface Preparation', 'Sanding')
                                                                        .replace('Quality Check & Packaging', 'Quality Check');
                                                                    
                                                                    return (
                                                                        <text 
                                                                            x={x} 
                                                                            y={y} 
                                                                            fill="#333"
                                                                            textAnchor={x > cx ? 'start' : 'end'} 
                                                                            dominantBaseline="central"
                                                                            style={{ 
                                                                                fontSize: '13px', 
                                                                                fontWeight: '600',
                                                                                textShadow: '0 0 3px white, 0 0 3px white'
                                                                            }}
                                                                        >
                                                                            {`${shortName}: ${value}`}
                                                                        </text>
                                                                    );
                                                                }}
                                                                outerRadius={90}
                                                                fill="#8884d8"
                                                                dataKey="value"
                                                                nameKey="name"
                                                            >
                                                                {(productionPerformance.stage_breakdown || []).map((entry, index) => (
                                                                    <Cell 
                                                                        key={`cell-${index}`} 
                                                                        fill={COLORS[index % COLORS.length]}
                                                                        stroke="#fff"
                                                                        strokeWidth={2}
                                                                    />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip 
                                                                formatter={(value, name) => [`${value} order${value !== 1 ? 's' : ''}`, name]}
                                                                contentStyle={{ 
                                                                    backgroundColor: 'rgba(255, 255, 255, 0.98)', 
                                                                    border: '2px solid #ddd',
                                                                    borderRadius: '8px',
                                                                    padding: '10px',
                                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                                                }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Work Progress Tab */}
                                {activeTab === "progress" && productionPerformance && (
                                    <div className="card shadow-sm">
                                        <div className="card-header bg-white border-bottom">
                                            <h5 className="mb-0 fw-bold">⏱️ Work Progress by Stage</h5>
                                        </div>
                                        <div className="card-body">
                                            <ResponsiveContainer width="100%" height={400}>
                                                <BarChart data={productionPerformance.stage_workload || []}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="stage" angle={-45} textAnchor="end" height={120} />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="current_workload" fill="#0d6efd" name="Current Workload" />
                                                    <Bar dataKey="capacity" fill="#28a745" name="Capacity" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                            
                                            {/* Stage Status Table */}
                                            <div className="table-responsive mt-4">
                                                <table className="table table-sm">
                                                    <thead>
                                                        <tr>
                                                            <th>Stage</th>
                                                            <th className="text-end">Workload</th>
                                                            <th className="text-end">Capacity</th>
                                                            <th className="text-end">Utilization</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(productionPerformance.stage_workload || []).map((stage, idx) => (
                                                            <tr key={idx}>
                                                                <td className="fw-semibold">{stage.stage}</td>
                                                                <td className="text-end">{stage.current_workload}</td>
                                                                <td className="text-end">{stage.capacity}</td>
                                                                <td className="text-end">{stage.utilization_percentage}%</td>
                                                                <td>
                                                                    <span className={`badge ${
                                                                        stage.status === 'overloaded' ? 'bg-danger' :
                                                                        stage.status === 'busy' ? 'bg-warning' : 'bg-success'
                                                                    }`}>
                                                                        {stage.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
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
                                        
                                        <div className="card shadow-sm">
                                            <div className="card-header bg-white border-bottom">
                                                <h5 className="mb-0 fw-bold">📈 Daily Output Trend</h5>
                                            </div>
                                            <div className="card-body">
                                                <ResponsiveContainer width="100%" height={350}>
                                                    <LineChart data={productionPerformance.daily_output || []}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="date" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Legend />
                                                        <Line type="monotone" dataKey="quantity" stroke="#0d6efd" strokeWidth={3} name="Daily Output" />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
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
