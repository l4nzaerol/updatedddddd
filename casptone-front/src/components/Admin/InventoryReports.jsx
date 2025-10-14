import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/client";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid 
} from "recharts";
import { downloadStockCsv, downloadUsageCsv, downloadReplenishmentCsv } from "../../api/inventoryApi";
import { clearRequestCache } from "../../utils/apiRetry";

const InventoryReports = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");
    const [windowDays, setWindowDays] = useState(30);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [materialFilter, setMaterialFilter] = useState('all');
    const [refreshKey, setRefreshKey] = useState(0);
    
    // Inventory report data states
    const [dashboardData, setDashboardData] = useState(null);
    const [inventoryReport, setInventoryReport] = useState(null);
    const [consumptionTrends, setConsumptionTrends] = useState(null);
    const [replenishmentSchedule, setReplenishmentSchedule] = useState(null);
    const [forecastReport, setForecastReport] = useState(null);
    const [dailyUsage, setDailyUsage] = useState(null);
    const [stockReport, setStockReport] = useState(null);
    
    // Predictive Analytics States
    const [materialUsageForecast, setMaterialUsageForecast] = useState(null);
    const [inventoryReplenishmentForecast, setInventoryReplenishmentForecast] = useState(null);
    const [stockStatusPredictions, setStockStatusPredictions] = useState(null);
    const [seasonalTrends, setSeasonalTrends] = useState(null);
    const [demandPatterns, setDemandPatterns] = useState(null);

    // Filter materials based on product type
    const filterMaterials = (items) => {
        if (!items) return [];
        
        let filteredItems;
        switch (materialFilter) {
            case 'alkansya':
                filteredItems = items.filter(item => 
                    item.name.toLowerCase().includes('alkansya') ||
                    item.sku.toLowerCase().includes('alkansya') ||
                    item.sku.includes('PW-') || item.sku.includes('PLY-') || 
                    item.sku.includes('ACR-') || item.sku.includes('PN-') ||
                    item.sku.includes('BS-') || item.sku.includes('STKW-')
                );
                break;
            case 'dining-table':
                filteredItems = items.filter(item => 
                    item.name.toLowerCase().includes('table') ||
                    item.sku.toLowerCase().includes('table') ||
                    item.sku.includes('HW-MAHOG-') || item.sku.includes('PLY-18-') ||
                    item.sku.includes('WS-3') || item.sku.includes('WG-500')
                );
                break;
            case 'wooden-chair':
                filteredItems = items.filter(item => 
                    item.name.toLowerCase().includes('chair') ||
                    item.sku.toLowerCase().includes('chair') ||
                    item.sku.includes('HW-MAHOG-2x2') || item.sku.includes('HW-MAHOG-1x4') ||
                    item.sku.includes('WS-2.5') || item.sku.includes('WD-8MM')
                );
                break;
            default:
                filteredItems = items;
        }
        
        return filteredItems;
    };

    // Fetch all inventory reports
    const fetchAllReports = useCallback(async () => {
        setLoading(true);
        setError("");
        
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - windowDays);
            const endDate = new Date();
            
            const dateRange = {
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0]
            };

            console.log('📊 Fetching inventory reports with date range:', dateRange);

            // Fetch all inventory-related data
            const [
                dashboardResponse,
                inventoryResponse,
                consumptionResponse,
                replenishmentResponse,
                forecastResponse,
                dailyUsageResponse,
                stockResponse,
                // Predictive Analytics API calls
                materialForecastResponse,
                replenishmentForecastResponse,
                stockPredictionsResponse,
                seasonalTrendsResponse,
                demandPatternsResponse
            ] = await Promise.all([
                api.get('/inventory/dashboard', { params: dateRange }),
                api.get('/inventory/report', { params: dateRange }),
                api.get('/inventory/consumption-trends', { params: dateRange }),
                api.get('/inventory/replenishment-schedule', { params: dateRange }),
                api.get('/inventory/forecast-report', { params: dateRange }),
                api.get('/inventory/daily-usage', { params: { date: selectedDate } }),
                api.get('/inventory/stock-report', { params: dateRange }),
                // Predictive Analytics endpoints
                api.get('/analytics/material-usage-forecast', { params: { ...dateRange, forecast_days: 30 } }),
                api.get('/analytics/inventory-replenishment-forecast', { params: { ...dateRange, forecast_days: 30 } }),
                api.get('/analytics/stock-status-predictions', { params: { ...dateRange, forecast_days: 30 } }),
                api.get('/analytics/seasonal-trends', { params: { ...dateRange, analysis_period: 'yearly' } }),
                api.get('/analytics/demand-patterns', { params: { ...dateRange, analysis_period: 'monthly' } })
            ]);

            setDashboardData(dashboardResponse.data);
            setInventoryReport(inventoryResponse.data);
            setConsumptionTrends(consumptionResponse.data);
            setReplenishmentSchedule(replenishmentResponse.data);
            setForecastReport(forecastResponse.data);
            setDailyUsage(dailyUsageResponse.data);
            setStockReport(stockResponse.data);
            
            // Set predictive analytics data
            setMaterialUsageForecast(materialForecastResponse.data);
            setInventoryReplenishmentForecast(replenishmentForecastResponse.data);
            setStockStatusPredictions(stockPredictionsResponse.data);
            setSeasonalTrends(seasonalTrendsResponse.data);
            setDemandPatterns(demandPatternsResponse.data);

            console.log('📊 Inventory reports fetched successfully');
        } catch (err) {
            console.error('❌ Error fetching inventory reports:', err);
            setError(err.response?.data?.message || 'Failed to fetch inventory reports');
        } finally {
            setLoading(false);
        }
    }, [windowDays, selectedDate]);

    useEffect(() => {
        fetchAllReports();
    }, [fetchAllReports, refreshKey]);

    const handleGlobalRefresh = () => {
        clearRequestCache();
        setRefreshKey(prev => prev + 1);
    };

    const getStartDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    };

    // Export functions
    const exportReport = (reportName, data) => {
        const csv = convertToCSV(data);
        downloadCSV(csv, `${reportName}_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const convertToCSV = (data) => {
        if (!data || data.length === 0) return '';
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(','));
        return [headers, ...rows].join('\n');
    };

    const downloadCSV = (csv, filename) => {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleInventoryExport = async (exportType, format) => {
        try {
            setLoading(true);
            if (format === 'csv') {
                switch (exportType) {
                    case 'stock':
                        await downloadStockCsv();
                        break;
                    case 'usage':
                        await downloadUsageCsv();
                        break;
                    case 'replenishment':
                        await downloadReplenishmentCsv();
                        break;
                    default:
                        console.log('Unknown export type');
                }
            } else if (format === 'pdf') {
                await exportInventoryDataToPDF(exportType);
            }
        } catch (error) {
            console.error('Export error:', error);
            setError('Failed to export data');
        } finally {
            setLoading(false);
        }
    };

    const exportInventoryDataToPDF = async (exportType) => {
        // PDF export implementation would go here
        console.log(`Exporting ${exportType} to PDF`);
    };

    // Predictive Analytics Helper Functions
    const calculateMovingAverage = (data, period = 7) => {
        if (!data || data.length < period) return [];
        
        return data.map((item, index) => {
            if (index < period - 1) return { ...item, moving_avg: null };
            
            const slice = data.slice(index - period + 1, index + 1);
            const avg = slice.reduce((sum, d) => sum + (d.value || d.quantity || 0), 0) / period;
            
            return { ...item, moving_avg: Math.round(avg * 100) / 100 };
        });
    };

    const calculateConsumptionRate = (usageData) => {
        if (!usageData || usageData.length < 2) return null;
        
        const sortedData = [...usageData].sort((a, b) => new Date(a.date) - new Date(b.date));
        const totalDays = (new Date(sortedData[sortedData.length - 1].date) - new Date(sortedData[0].date)) / (1000 * 60 * 60 * 24);
        const totalUsage = sortedData.reduce((sum, item) => sum + (item.quantity || item.value || 0), 0);
        
        return totalDays > 0 ? totalUsage / totalDays : 0;
    };

    const predictStockoutDate = (currentStock, consumptionRate) => {
        if (!consumptionRate || consumptionRate <= 0) return null;
        const daysUntilStockout = Math.floor(currentStock / consumptionRate);
        const stockoutDate = new Date();
        stockoutDate.setDate(stockoutDate.getDate() + daysUntilStockout);
        return stockoutDate.toISOString().split('T')[0];
    };

    const calculateReorderPoint = (avgDailyUsage, leadTimeDays, safetyStock) => {
        return Math.ceil((avgDailyUsage * leadTimeDays) + safetyStock);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>Error: {error}</p>
                <button 
                    onClick={handleGlobalRefresh}
                    className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* Header Controls */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4 className="mb-1" style={{ color: '#2c3e50', fontWeight: '600' }}>
                        Inventory Reports & Predictive Analytics
                    </h4>
                    <p className="text-muted mb-0">Material usage forecasting and inventory management insights</p>
                </div>
                <div className="d-flex gap-2">
                    <select 
                        value={windowDays} 
                        onChange={(e) => setWindowDays(Number(e.target.value))}
                        className="form-select form-select-sm"
                        style={{ width: 'auto' }}
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={90}>Last 90 days</option>
                        <option value={365}>Last year</option>
                    </select>
                    <button 
                        onClick={handleGlobalRefresh}
                        className="btn btn-primary btn-sm"
                    >
                        <i className="fas fa-sync me-1"></i>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-4">
                <ul className="nav nav-pills nav-fill" role="tablist">
                    {[
                        { id: 'overview', name: 'Overview', icon: '📊' },
                        { id: 'predictive', name: 'Predictive Analytics', icon: '🔮' },
                        { id: 'consumption', name: 'Consumption Trends', icon: '📈' },
                        { id: 'replenishment', name: 'Replenishment', icon: '🛒' },
                        { id: 'forecast', name: 'Forecasting', icon: '📅' },
                        { id: 'stock', name: 'Stock Status', icon: '📦' }
                    ].map(tab => (
                        <li className="nav-item" key={tab.id}>
                            <button
                                className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    border: 'none',
                                    backgroundColor: activeTab === tab.id ? '#007bff' : 'transparent',
                                    color: activeTab === tab.id ? 'white' : '#6c757d',
                                    fontWeight: activeTab === tab.id ? '600' : '400'
                                }}
                            >
                                <span className="me-2">{tab.icon}</span>
                                {tab.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Material Filter */}
            <div className="mb-4">
                <div className="d-flex align-items-center gap-3">
                    <label className="form-label mb-0 fw-medium">Filter by Product:</label>
                    <select 
                        value={materialFilter} 
                        onChange={(e) => setMaterialFilter(e.target.value)}
                        className="form-select form-select-sm"
                        style={{ width: 'auto' }}
                    >
                        <option value="all">All Materials</option>
                        <option value="alkansya">Alkansya Materials</option>
                        <option value="dining-table">Dining Table Materials</option>
                        <option value="wooden-chair">Wooden Chair Materials</option>
                    </select>
                </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'overview' && (
                <div>
                    {/* Dashboard Overview */}
                    <div className="row mb-4">
                        <div className="col-lg-3 col-md-6 mb-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body text-center">
                                    <div className="d-flex align-items-center justify-content-center mb-2">
                                        <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                                            <i className="fas fa-boxes text-primary fs-4"></i>
                                        </div>
                                        <div>
                                            <h3 className="mb-0 text-primary fw-bold">41</h3>
                                            <small className="text-muted">Total Items</small>
                                        </div>
                                    </div>
                                    <p className="text-muted small mb-0">38 raw • 0 finished</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 mb-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body text-center">
                                    <div className="d-flex align-items-center justify-content-center mb-2">
                                        <div className="bg-danger bg-opacity-10 rounded-circle p-3 me-3">
                                            <i className="fas fa-exclamation-triangle text-danger fs-4"></i>
                                        </div>
                                        <div>
                                            <h3 className="mb-0 text-danger fw-bold">14</h3>
                                            <small className="text-muted">Reorder Alerts</small>
                                        </div>
                                    </div>
                                    <p className="text-muted small mb-0">Action required</p>
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
                                            <h3 className="mb-0 text-warning fw-bold">0</h3>
                                            <small className="text-muted">Low Stock</small>
                                        </div>
                                    </div>
                                    <p className="text-muted small mb-0">Less than 14 days</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 mb-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body text-center">
                                    <div className="d-flex align-items-center justify-content-center mb-2">
                                        <div className="bg-info bg-opacity-10 rounded-circle p-3 me-3">
                                            <i className="fas fa-cube text-info fs-4"></i>
                                        </div>
                                        <div>
                                            <h3 className="mb-0 text-info fw-bold">0</h3>
                                            <small className="text-muted">Total Finished Goods</small>
                                        </div>
                                    </div>
                                    <p className="text-muted small mb-0">Mass-produced products</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inventory Chart */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0">
                            <h5 className="mb-0 fw-semibold">Inventory Levels by Category</h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                <div className="col-md-8">
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={[
                                            { name: 'Pinewood 1x4x8ft', current: 200, reorder: 50 },
                                            { name: 'Plywood 4.2mm', current: 100, reorder: 25 },
                                            { name: 'Acrylic 1.5mm', current: 80, reorder: 20 },
                                            { name: 'Pin Nail F30', current: 2000, reorder: 500 },
                                            { name: 'Black Screw 1.5"', current: 1000, reorder: 250 }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="current" fill="#3B82F6" name="Current Stock" />
                                            <Bar dataKey="reorder" fill="#EF4444" name="Reorder Point" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="col-md-4">
                                    <div className="d-flex flex-column h-100 justify-content-center">
                                        <div className="mb-3">
                                            <div className="d-flex align-items-center mb-2">
                                                <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                                    <i className="fas fa-chart-bar text-primary"></i>
                                                </div>
                                                <div>
                                                    <h6 className="mb-0">Stock Analysis</h6>
                                                    <small className="text-muted">Current vs Reorder Points</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="d-flex align-items-center mb-2">
                                                <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                                                    <i className="fas fa-check-circle text-success"></i>
                                                </div>
                                                <div>
                                                    <h6 className="mb-0">Healthy Stock</h6>
                                                    <small className="text-muted">Above reorder points</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <div className="d-flex align-items-center mb-2">
                                                <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
                                                    <i className="fas fa-exclamation-triangle text-warning"></i>
                                                </div>
                                                <div>
                                                    <h6 className="mb-0">Attention Needed</h6>
                                                    <small className="text-muted">14 items need reordering</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Predictive Analytics Tab */}
            {activeTab === 'predictive' && (
                <>
                <div className="space-y-6">
                    {/* Material Usage Forecasting Dashboard */}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-white border-0">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-semibold">Material Usage Forecasting</h5>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-primary btn-sm">
                                        <i className="fas fa-brain me-1"></i>
                                        Generate Forecast
                                    </button>
                                    <button className="btn btn-success btn-sm">
                                        <i className="fas fa-download me-1"></i>
                                        Export Report
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="card-body">
                            {/* Forecast Summary Cards */}
                            <div className="row mb-4">
                                <div className="col-lg-3 col-md-6 mb-3">
                                    <div className="card bg-primary text-white h-100">
                                        <div className="card-body text-center">
                                            <h3 className="mb-0 fw-bold">15</h3>
                                            <small className="opacity-75">Total Materials</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-3 col-md-6 mb-3">
                                    <div className="card bg-danger text-white h-100">
                                        <div className="card-body text-center">
                                            <h3 className="mb-0 fw-bold">3</h3>
                                            <small className="opacity-75">Critical Items</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-3 col-md-6 mb-3">
                                    <div className="card bg-warning text-white h-100">
                                        <div className="card-body text-center">
                                            <h3 className="mb-0 fw-bold">5</h3>
                                            <small className="opacity-75">Warning Items</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-3 col-md-6 mb-3">
                                    <div className="card bg-success text-white h-100">
                                        <div className="card-body text-center">
                                            <h3 className="mb-0 fw-bold">7</h3>
                                            <small className="opacity-75">Safe Items</small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Forecast Chart */}
                            <div className="mb-4">
                                <h6 className="fw-semibold mb-3">30-Day Material Usage Forecast</h6>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={[
                                        { material: 'Pinewood 1x4x8ft', predicted: 1800, current: 200 },
                                        { material: 'Plywood 4.2mm', predicted: 900, current: 100 },
                                        { material: 'Acrylic 1.5mm', predicted: 720, current: 80 },
                                        { material: 'Pin Nail F30', predicted: 18000, current: 2000 },
                                        { material: 'Black Screw 1.5"', predicted: 9000, current: 1000 }
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="material" angle={-45} textAnchor="end" height={100} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="predicted" fill="#3B82F6" name="Predicted Usage" />
                                        <Bar dataKey="current" fill="#10B981" name="Current Stock" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Detailed Forecast Cards */}
                            <div className="row">
                                <div className="col-lg-4 col-md-6 mb-3">
                                    <div className="card border-start border-danger border-3 h-100">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h6 className="fw-semibold mb-0">Pinewood 1x4x8ft</h6>
                                                <span className="badge bg-danger">Critical</span>
                                            </div>
                                            <div className="row text-center">
                                                <div className="col-6">
                                                    <small className="text-muted">Current Stock</small>
                                                    <div className="fw-bold">200</div>
                                                </div>
                                                <div className="col-6">
                                                    <small className="text-muted">Predicted Usage</small>
                                                    <div className="fw-bold">1,800</div>
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <small className="text-muted">Days Until Stockout: </small>
                                                <span className="fw-bold text-danger">7 days</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-6 mb-3">
                                    <div className="card border-start border-warning border-3 h-100">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h6 className="fw-semibold mb-0">Plywood 4.2mm</h6>
                                                <span className="badge bg-warning">Warning</span>
                                            </div>
                                            <div className="row text-center">
                                                <div className="col-6">
                                                    <small className="text-muted">Current Stock</small>
                                                    <div className="fw-bold">100</div>
                                                </div>
                                                <div className="col-6">
                                                    <small className="text-muted">Predicted Usage</small>
                                                    <div className="fw-bold">900</div>
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <small className="text-muted">Days Until Stockout: </small>
                                                <span className="fw-bold text-warning">12 days</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-lg-4 col-md-6 mb-3">
                                    <div className="card border-start border-success border-3 h-100">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <h6 className="fw-semibold mb-0">Pin Nail F30</h6>
                                                <span className="badge bg-success">Safe</span>
                                            </div>
                                            <div className="row text-center">
                                                <div className="col-6">
                                                    <small className="text-muted">Current Stock</small>
                                                    <div className="fw-bold">2,000</div>
                                                </div>
                                                <div className="col-6">
                                                    <small className="text-muted">Predicted Usage</small>
                                                    <div className="fw-bold">18,000</div>
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <small className="text-muted">Days Until Stockout: </small>
                                                <span className="fw-bold text-success">45 days</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div>
                    {materialUsageForecast ? (
                            <div className="space-y-6">
                                {/* Forecast Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
                                        <h4 className="text-sm font-medium opacity-90">Total Materials</h4>
                                        <p className="text-2xl font-bold">{materialUsageForecast.forecasts?.length || 0}</p>
                                    </div>
                                    <div className="bg-gradient-to-r from-red-500 to-red-600 p-4 rounded-lg text-white">
                                        <h4 className="text-sm font-medium opacity-90">Critical Items</h4>
                                        <p className="text-2xl font-bold">
                                            {materialUsageForecast.forecasts?.filter(f => f.days_until_stockout < 7).length || 0}
                                        </p>
                                    </div>
                                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 rounded-lg text-white">
                                        <h4 className="text-sm font-medium opacity-90">Warning Items</h4>
                                        <p className="text-2xl font-bold">
                                            {materialUsageForecast.forecasts?.filter(f => f.days_until_stockout >= 7 && f.days_until_stockout < 14).length || 0}
                                        </p>
                                    </div>
                                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
                                        <h4 className="text-sm font-medium opacity-90">Safe Items</h4>
                                        <p className="text-2xl font-bold">
                                            {materialUsageForecast.forecasts?.filter(f => f.days_until_stockout >= 14).length || 0}
                                        </p>
                                    </div>
                                </div>

                                {/* Forecast Chart */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="text-lg font-semibold text-gray-800 mb-4">30-Day Material Usage Forecast</h4>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={materialUsageForecast.forecasts?.slice(0, 10) || []}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="material_name" angle={-45} textAnchor="end" height={100} />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Bar dataKey="predicted_usage" fill="#3B82F6" name="Predicted Usage" />
                                            <Bar dataKey="current_stock" fill="#10B981" name="Current Stock" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Detailed Forecast Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {materialUsageForecast.forecasts?.map((forecast, index) => (
                                        <div key={index} className={`p-4 rounded-lg border-l-4 ${
                                            forecast.days_until_stockout < 7 ? 'bg-red-50 border-red-500' :
                                            forecast.days_until_stockout < 14 ? 'bg-yellow-50 border-yellow-500' :
                                            'bg-green-50 border-green-500'
                                        }`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-semibold text-gray-800 text-sm">{forecast.material_name}</h4>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    forecast.days_until_stockout < 7 ? 'bg-red-100 text-red-800' :
                                                    forecast.days_until_stockout < 14 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    {forecast.days_until_stockout < 7 ? 'Critical' :
                                                     forecast.days_until_stockout < 14 ? 'Warning' : 'Safe'}
                                                </span>
                                            </div>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Current Stock:</span>
                                                    <span className="font-medium">{forecast.current_stock}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Predicted Usage:</span>
                                                    <span className="font-medium">{forecast.predicted_usage}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Days Until Stockout:</span>
                                                    <span className="font-medium">{forecast.days_until_stockout || 'N/A'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Consumption Rate:</span>
                                                    <span className="font-medium">{forecast.consumption_rate}/day</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-gray-400 text-6xl mb-4">📊</div>
                                <p className="text-gray-500 text-lg">No forecast data available</p>
                                <p className="text-gray-400 text-sm">Generate forecasts based on historical data</p>
                            </div>
                        )}

                    {/* Stock Status Predictions */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Stock Status Predictions</h3>
                        {stockStatusPredictions ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {stockStatusPredictions.predictions?.map((prediction, index) => (
                                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                            <h4 className="font-semibold text-gray-800">{prediction.item_name}</h4>
                                            <p className="text-sm text-gray-600">Current: {prediction.current_stock}</p>
                                            <p className="text-sm text-gray-600">Predicted Stockout: {prediction.predicted_stockout_date}</p>
                                            <p className="text-sm text-gray-600">Recommended Order: {prediction.recommended_order_qty}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">No prediction data available</p>
                        )}
                    </div>

                    {/* Seasonal Trends */}
                    {seasonalTrends && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Seasonal Usage Trends</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={seasonalTrends.trends || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="usage" stroke="#3B82F6" name="Usage" />
                                    <Line type="monotone" dataKey="forecast" stroke="#EF4444" name="Forecast" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
                </>
            )}

            {/* Consumption Trends Tab */}
            {activeTab === 'consumption' && (
                <div className="space-y-6">
                    {consumptionTrends && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Material Consumption Trends</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={consumptionTrends.trends || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="consumption" stroke="#3B82F6" name="Daily Consumption" />
                                    <Line type="monotone" dataKey="moving_avg" stroke="#EF4444" name="7-Day Average" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Consumption Rate Analysis */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Consumption Rate Analysis</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {consumptionTrends?.rate_analysis?.map((item, index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-800">{item.material_name}</h4>
                                    <p className="text-sm text-gray-600">Daily Rate: {item.daily_rate?.toFixed(2)}</p>
                                    <p className="text-sm text-gray-600">Weekly Rate: {item.weekly_rate?.toFixed(2)}</p>
                                    <p className="text-sm text-gray-600">Monthly Rate: {item.monthly_rate?.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Replenishment Tab */}
            {activeTab === 'replenishment' && (
                <div className="space-y-6">
                    {replenishmentSchedule && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Replenishment Schedule</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-4 py-2 text-left">Item</th>
                                            <th className="px-4 py-2 text-left">Current Stock</th>
                                            <th className="px-4 py-2 text-left">Reorder Point</th>
                                            <th className="px-4 py-2 text-left">Recommended Qty</th>
                                            <th className="px-4 py-2 text-left">Priority</th>
                                            <th className="px-4 py-2 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {replenishmentSchedule.schedule?.map((item, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="px-4 py-2">{item.name}</td>
                                                <td className="px-4 py-2">{item.current_stock}</td>
                                                <td className="px-4 py-2">{item.reorder_point}</td>
                                                <td className="px-4 py-2">{item.recommended_qty}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        item.priority === 'High' ? 'bg-red-100 text-red-800' :
                                                        item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {item.priority}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2">
                                                    <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                                                        Order
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Forecasting Tab */}
            {activeTab === 'forecast' && (
                <div className="space-y-6">
                    {forecastReport && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Material Usage Forecast</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={forecastReport.forecast_data || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="historical" stroke="#3B82F6" name="Historical Usage" />
                                    <Line type="monotone" dataKey="forecast" stroke="#EF4444" name="Forecast" />
                                    <Line type="monotone" dataKey="confidence_upper" stroke="#10B981" name="Upper Bound" strokeDasharray="5 5" />
                                    <Line type="monotone" dataKey="confidence_lower" stroke="#10B981" name="Lower Bound" strokeDasharray="5 5" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Forecast Accuracy */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Forecast Accuracy Metrics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-800">Mean Absolute Error</h4>
                                <p className="text-2xl font-bold text-blue-600">{forecastReport?.accuracy?.mae?.toFixed(2) || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-800">Root Mean Square Error</h4>
                                <p className="text-2xl font-bold text-blue-600">{forecastReport?.accuracy?.rmse?.toFixed(2) || 'N/A'}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-800">Accuracy Percentage</h4>
                                <p className="text-2xl font-bold text-green-600">{forecastReport?.accuracy?.accuracy_percentage?.toFixed(1) || 'N/A'}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Status Tab */}
            {activeTab === 'stock' && (
                <div className="space-y-6">
                    {stockReport && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Current Stock Status</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-4 py-2 text-left">Item</th>
                                            <th className="px-4 py-2 text-left">SKU</th>
                                            <th className="px-4 py-2 text-left">Current Stock</th>
                                            <th className="px-4 py-2 text-left">Reorder Point</th>
                                            <th className="px-4 py-2 text-left">Status</th>
                                            <th className="px-4 py-2 text-left">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filterMaterials(stockReport.items || []).map((item, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="px-4 py-2">{item.name}</td>
                                                <td className="px-4 py-2">{item.sku}</td>
                                                <td className="px-4 py-2">{item.quantity_on_hand}</td>
                                                <td className="px-4 py-2">{item.reorder_point}</td>
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        item.quantity_on_hand <= 0 ? 'bg-red-100 text-red-800' :
                                                        item.quantity_on_hand <= item.reorder_point ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {item.quantity_on_hand <= 0 ? 'Out of Stock' :
                                                         item.quantity_on_hand <= item.reorder_point ? 'Low Stock' : 'In Stock'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2">₱{(item.quantity_on_hand * item.unit_cost).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Export Buttons */}
            <div className="mt-4 d-flex gap-2">
                <button 
                    onClick={() => handleInventoryExport('stock', 'csv')}
                    className="btn btn-success btn-sm"
                >
                    <i className="fas fa-file-csv me-1"></i>
                    Export Stock CSV
                </button>
                <button 
                    onClick={() => handleInventoryExport('usage', 'csv')}
                    className="btn btn-primary btn-sm"
                >
                    <i className="fas fa-chart-line me-1"></i>
                    Export Usage CSV
                </button>
                <button 
                    onClick={() => handleInventoryExport('replenishment', 'csv')}
                    className="btn btn-info btn-sm"
                >
                    <i className="fas fa-shopping-cart me-1"></i>
                    Export Replenishment CSV
                </button>
            </div>
        </div>
    );
};

export default InventoryReports;
