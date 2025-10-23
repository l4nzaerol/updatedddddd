import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/client";
import { 
  BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, 
  ScatterChart, Scatter, ComposedChart
} from "recharts";
import { 
  FaBox, FaChartLine, FaClipboardList, FaHistory, 
  FaTruck, FaExclamationTriangle, FaCheckCircle,
  FaDownload, FaSync, FaFilter, FaSearch, FaEye, FaEdit
} from "react-icons/fa";
import { toast } from "sonner";

const EnhancedInventoryReports = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");
    const [windowDays, setWindowDays] = useState(30);
    const [materialFilter, setMaterialFilter] = useState('all');
    const [consumptionFilter, setConsumptionFilter] = useState('all');
    const [refreshKey, setRefreshKey] = useState(0);
    
    // Enhanced data states
    const [dashboardData, setDashboardData] = useState(null);
    const [inventoryReport, setInventoryReport] = useState(null);
    const [consumptionTrends, setConsumptionTrends] = useState(null);
    const [replenishmentSchedule, setReplenishmentSchedule] = useState(null);
    const [forecastReport, setForecastReport] = useState(null);
    const [turnoverReport, setTurnoverReport] = useState(null);
    const [alkansyaStats, setAlkansyaStats] = useState(null);
    const [materialUsageAnalysis, setMaterialUsageAnalysis] = useState(null);
    const [inventoryTransactions, setInventoryTransactions] = useState(null);
    const [realTimeAlerts, setRealTimeAlerts] = useState(null);
    
    // Enhanced forecasting states
    const [forecastType, setForecastType] = useState('alkansya');
    const [alkansyaForecast, setAlkansyaForecast] = useState(null);
    const [madeToOrderForecast, setMadeToOrderForecast] = useState(null);
    const [overallForecast, setOverallForecast] = useState(null);
    
    // Enhanced replenishment states
    const [enhancedReplenishment, setEnhancedReplenishment] = useState(null);
    const [replenishmentView, setReplenishmentView] = useState('summary'); // summary, schedule, analytics
    
    // Enhanced transactions states
    const [enhancedTransactions, setEnhancedTransactions] = useState(null);
    const [transactionView, setTransactionView] = useState('list'); // list, summary, analytics
    const [transactionFilter, setTransactionFilter] = useState('all'); // all, alkansya, made_to_order, other
    
    // Filtered data
    const [filteredInventoryData, setFilteredInventoryData] = useState(null);
    
    // Loading states for each tab
    const [tabLoadingStates, setTabLoadingStates] = useState({
        overview: false,
        stock: false,
        consumption: false,
        forecast: false,
        replenishment: false,
        transactions: false,
        alerts: false
    });

    const colors = {
        primary: '#8B4513',
        secondary: '#A0522D',
        accent: '#CD853F',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545',
        info: '#17a2b8',
        light: '#F5DEB3',
        dark: '#2F1B14'
    };

    const chartColors = [
        '#8B4513', '#A0522D', '#CD853F', '#F5DEB3', '#D2691E',
        '#B8860B', '#DAA520', '#B22222', '#228B22', '#4169E1'
    ];

    const fetchAllReports = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const dateRange = {
                start_date: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
            };

            const safeFetch = async (endpoint, params = {}) => {
                try {
                    const response = await api.get(endpoint, { params });
                    return response.data;
                } catch (error) {
                    console.warn(`Failed to fetch ${endpoint}:`, error.message);
                    return null;
                }
            };

            // Only load overview data initially for fast loading
            const normalizedInventoryData = await safeFetch('/inventory/normalized-inventory');

            // Set data with proper fallbacks
            const inventoryData = normalizedInventoryData || { summary: { total_items: 0, items_needing_reorder: 0, critical_items: 0, total_usage: 0 }, items: [] };
            
            setDashboardData({
                summary: {
                    total_items: inventoryData.summary.total_items,
                    low_stock_items: inventoryData.summary.items_needing_reorder,
                    out_of_stock_items: inventoryData.summary.critical_items,
                    recent_usage: inventoryData.summary.total_usage,
                    total_value: inventoryData.items.reduce((sum, item) => sum + (item.value || 0), 0),
                    critical_items: inventoryData.summary.critical_items
                },
                critical_items: inventoryData.items.filter(item => item.stock_status === 'out_of_stock' || item.stock_status === 'low'),
                recent_activities: []
            });
            
            setInventoryReport(inventoryData);
            
            // Apply initial filter
            applyFilter(inventoryData, materialFilter);
            
            // Also set filtered data initially
            setFilteredInventoryData(inventoryData);

            // Set default values for other data
            setTurnoverReport([]);
            setAlkansyaStats({ total_output: 0, average_daily: 0, last_7_days: 0, production_efficiency: 0 });
            setMaterialUsageAnalysis([]);

        } catch (error) {
            console.error('Error fetching reports:', error);
            setError('Failed to load inventory reports. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [windowDays, refreshKey]);

    useEffect(() => {
        fetchAllReports();
    }, [fetchAllReports]);

    // Reload consumption data when filter changes
    useEffect(() => {
        if (activeTab === 'consumption') {
            loadTabData('consumption');
        }
    }, [consumptionFilter, windowDays]);

    const handleGlobalRefresh = () => {
        setRefreshKey(prev => prev + 1);
        toast.success("Reports refreshed successfully!");
    };

    // Filter function with accurate BOM-based filtering
    const applyFilter = (data, filter) => {
        if (!data || !data.items) {
            setFilteredInventoryData(null);
            return;
        }

        let filteredItems = data.items;
        
        if (filter !== 'all') {
            filteredItems = data.items.filter(item => {
                const name = item.name.toLowerCase();
                switch (filter) {
                    case 'alkansya':
                        // Alkansya has 13 materials based on BOM
                        return name.includes('pinewood 1x4x8ft') || 
                               name.includes('plywood 4.2mm 4x8ft') || 
                               name.includes('acrylic 1.5mm 4x8ft') || 
                               name.includes('pin nail f30') || 
                               name.includes('black screw 1 1/2') || 
                               name.includes('stikwell 250 grams') || 
                               name.includes('grinder pad 4inch 120 grit') || 
                               name.includes('sticker 24 inch car decals') || 
                               name.includes('transfer tape') || 
                               name.includes('tape 2 inch 200m') || 
                               name.includes('fragile tape') || 
                               name.includes('bubble wrap 40 inch x 100m') || 
                               name.includes('insulation 8mm 40 inch x 100m');
                    case 'dining-table':
                        // Dining Table has 9 materials based on BOM
                        return name.includes('mahogany hardwood 2x4x8ft') || 
                               name.includes('mahogany hardwood 1x6x10ft') || 
                               name.includes('plywood 18mm 4x8ft') || 
                               name.includes('metal table brackets') || 
                               name.includes('wood screws 3 inch') || 
                               name.includes('wood glue 500ml') || 
                               name.includes('wood stain walnut 1 liter') || 
                               name.includes('polyurethane gloss 1 liter') || 
                               name.includes('felt pads large');
                    case 'wooden-chair':
                        // Wooden Chair has 12 materials based on BOM
                        return name.includes('mahogany hardwood 2x2x6ft') || 
                               name.includes('mahogany hardwood 1x4x6ft') || 
                               name.includes('plywood 12mm 2x4ft') || 
                               name.includes('wood screws 2.5 inch') || 
                               name.includes('wood dowels 8mm') || 
                               name.includes('wood glue 250ml') || 
                               name.includes('foam cushion 2 inch') || 
                               name.includes('upholstery fabric') || 
                               name.includes('upholstery staples') || 
                               name.includes('wood stain walnut 500ml') || 
                               name.includes('lacquer spray clear') || 
                               name.includes('felt pads small');
                    default:
                        return true;
                }
            });
        }

        setFilteredInventoryData({
            ...data,
            items: filteredItems
        });
    };

    // Handle filter changes and re-apply to current data
    const handleFilterChange = (newFilter) => {
        setMaterialFilter(newFilter);
        if (inventoryReport) {
            applyFilter(inventoryReport, newFilter);
        } else {
            // Ensure data is loaded for stock tab if not yet available
            loadTabData('stock');
        }
    };

    // Lazy loading function for each tab
    const loadTabData = async (tabName) => {
        setTabLoadingStates(prev => ({ ...prev, [tabName]: true }));
        
        // Simulate 2-second delay for fast loading experience
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
            const dateRange = {
                start_date: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
            };

            switch (tabName) {
                case 'overview':
                    // Overview data is already loaded initially
                    break;
                    
                case 'stock':
                    // Always refresh stock data when tab is clicked
                    const stockResponse = await api.get('/inventory/normalized-inventory');
                    const data = stockResponse.data;
                    setInventoryReport(data);
                    applyFilter(data, materialFilter);
                    break;
                    
                case 'consumption':
                    const consumptionResponse = await api.get('/inventory/consumption-trends', { 
                        params: { 
                            days: windowDays,
                            product_type: consumptionFilter
                        } 
                    });
                    console.log('Consumption trends response:', consumptionResponse.data);
                    setConsumptionTrends(consumptionResponse.data);
                    break;
                    
                case 'forecast':
                    // Use enhanced forecasting
                    await fetchForecastData();
                    break;
                    
                case 'replenishment':
                    // Use enhanced replenishment
                    await fetchEnhancedReplenishmentData();
                    break;
                    
                case 'transactions':
                    // Use enhanced transactions
                    await fetchEnhancedTransactionsData();
                    break;
                    
                case 'alerts':
                    if (!realTimeAlerts) {
                        const response = await api.get('/inventory/alerts');
                        setRealTimeAlerts(response.data);
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${tabName} data:`, error);
        } finally {
            setTabLoadingStates(prev => ({ ...prev, [tabName]: false }));
        }
    };

    // Handle tab change with lazy loading
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        loadTabData(tabId);
    };

    // Enhanced forecasting data fetch function
    const fetchForecastData = async () => {
        setTabLoadingStates(prev => ({ ...prev, forecast: true }));
        
        try {
            const params = {
                forecast_days: windowDays,
                historical_days: windowDays
            };

            // Fetch all three types of forecasts in parallel
            const [alkansyaResponse, madeToOrderResponse, overallResponse] = await Promise.all([
                api.get('/inventory/forecast/alkansya-materials', { params }).catch(() => ({ data: null })),
                api.get('/inventory/forecast/made-to-order-materials', { params }).catch(() => ({ data: null })),
                api.get('/inventory/forecast/overall-materials', { params }).catch(() => ({ data: null }))
            ]);

            setAlkansyaForecast(alkansyaResponse.data);
            setMadeToOrderForecast(madeToOrderResponse.data);
            setOverallForecast(overallResponse.data);

        } catch (error) {
            console.error('Error fetching forecast data:', error);
            toast.error('Failed to load forecast data');
        } finally {
            setTabLoadingStates(prev => ({ ...prev, forecast: false }));
        }
    };

    // Enhanced replenishment data fetch function
    const fetchEnhancedReplenishmentData = async () => {
        setTabLoadingStates(prev => ({ ...prev, replenishment: true }));
        
        try {
            const params = {
                forecast_days: windowDays,
                historical_days: windowDays
            };

            const response = await api.get('/inventory/enhanced-replenishment', { params });
            setEnhancedReplenishment(response.data);

        } catch (error) {
            console.error('Error fetching enhanced replenishment data:', error);
            toast.error('Failed to load replenishment data');
        } finally {
            setTabLoadingStates(prev => ({ ...prev, replenishment: false }));
        }
    };

    // Enhanced transactions data fetch function
    const fetchEnhancedTransactionsData = async () => {
        setTabLoadingStates(prev => ({ ...prev, transactions: true }));
        
        try {
            const params = {
                start_date: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0],
                transaction_type: transactionFilter,
                limit: 200
            };

            const response = await api.get('/inventory/enhanced-transactions', { params });
            setEnhancedTransactions(response.data);

        } catch (error) {
            console.error('Error fetching enhanced transactions data:', error);
            toast.error('Failed to load transactions data');
        } finally {
            setTabLoadingStates(prev => ({ ...prev, transactions: false }));
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h5>Loading Inventory Reports...</h5>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                <FaExclamationTriangle className="me-2" />
                <strong>Error:</strong> {error}
                <button 
                    className="btn btn-outline-danger btn-sm ms-3"
                    onClick={handleGlobalRefresh}
                >
                    <FaSync className="me-1" />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="enhanced-inventory-reports">
            {/* Enhanced Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 p-4 bg-gradient text-white rounded-3" 
                 style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}>
                <div>
                    <h2 className="mb-2 d-flex align-items-center">
                        <FaBox className="me-3" />
                        Enhanced Inventory Analytics
                    </h2>
                    <p className="mb-0 opacity-90">Comprehensive inventory management and production tracking</p>
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
                        className="btn btn-light btn-sm"
                    >
                        <FaSync className="me-1" />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Enhanced Navigation Tabs */}
            <div className="mb-4">
                <ul className="nav nav-pills nav-fill" role="tablist">
                    {[
                        { id: 'overview', name: 'Overview', icon: FaChartLine, color: colors.primary },
                        { id: 'stock', name: 'Stock Levels', icon: FaBox, color: colors.secondary },
                        { id: 'consumption', name: 'Consumption', icon: FaChartLine, color: colors.accent },
                        { id: 'forecast', name: 'Forecasting', icon: FaChartLine, color: colors.info },
                        { id: 'replenishment', name: 'Replenishment', icon: FaTruck, color: colors.warning },
                        { id: 'transactions', name: 'Transactions', icon: FaHistory, color: colors.dark },
                        { id: 'alerts', name: 'Alerts', icon: FaExclamationTriangle, color: colors.danger }
                    ].map(tab => (
                        <li className="nav-item" key={tab.id}>
                            <button
                                className={`nav-link d-flex align-items-center justify-content-center ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => handleTabChange(tab.id)}
                                disabled={tabLoadingStates[tab.id]}
                                style={{
                                    border: 'none',
                                    backgroundColor: activeTab === tab.id ? tab.color : 'transparent',
                                    color: activeTab === tab.id ? 'white' : colors.dark,
                                    fontWeight: activeTab === tab.id ? '600' : '400',
                                    borderRadius: '8px',
                                    margin: '0 2px',
                                    padding: '12px 16px',
                                    transition: 'all 0.3s ease',
                                    opacity: tabLoadingStates[tab.id] ? 0.6 : 1
                                }}
                            >
                                <tab.icon className="me-2" />
                                {tab.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Material Filter */}
            <div className="mb-4">
                <div className="d-flex align-items-center gap-3">
                    <FaFilter className="text-muted" />
                    <label className="form-label mb-0 fw-medium">Filter by Product:</label>
                    <select 
                        value={materialFilter} 
                        onChange={(e) => handleFilterChange(e.target.value)}
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
                <div className="row">
                    {/* Key Metrics Cards */}
                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.primary}20` }}>
                                        <FaBox style={{ color: colors.primary }} className="fs-4" />
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.primary }}>
                                            {dashboardData?.summary?.total_items || 0}
                                        </h3>
                                        <small className="text-muted fw-medium">Total Items</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    {inventoryReport?.summary?.total_items || 0} items tracked
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.danger}15, ${colors.warning}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.danger}20` }}>
                                        <FaExclamationTriangle style={{ color: colors.danger }} className="fs-4" />
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.danger }}>
                                            {dashboardData?.summary?.low_stock_items || 0}
                                        </h3>
                                        <small className="text-muted fw-medium">Low Stock</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    {dashboardData?.summary?.critical_items || 0} critical items
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.success}15, ${colors.info}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.success}20` }}>
                                        <FaCheckCircle style={{ color: colors.success }} className="fs-4" />
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.success }}>
                                            {dashboardData?.summary?.total_items || 0}
                                        </h3>
                                        <small className="text-muted fw-medium">Total Materials</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    {dashboardData?.summary?.total_value ? `₱${Number(dashboardData.summary.total_value).toLocaleString()}` : '₱0'} total value
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.info}15, ${colors.accent}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.info}20` }}>
                                        <FaHistory style={{ color: colors.info }} className="fs-4" />
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.info }}>
                                            {inventoryTransactions?.summary?.total_transactions || 0}
                                        </h3>
                                        <small className="text-muted fw-medium">Transactions</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    Last {windowDays} days
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaChartLine className="me-2" style={{ color: colors.primary }} />
                                    Consumption Trends
                                </h5>
                            </div>
                            <div className="card-body">
                                {consumptionTrends && consumptionTrends.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={consumptionTrends}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" />
                                            <YAxis />
                                            <Tooltip />
                                            <Legend />
                                            <Area type="monotone" dataKey="plywood" stackId="1" stroke={colors.primary} fill={colors.primary} fillOpacity={0.6} />
                                            <Area type="monotone" dataKey="hardwood" stackId="1" stroke={colors.secondary} fill={colors.secondary} fillOpacity={0.6} />
                                            <Area type="monotone" dataKey="acrylic" stackId="1" stroke={colors.accent} fill={colors.accent} fillOpacity={0.6} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaChartLine className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">No consumption data available</h5>
                                        <p className="text-muted">Data will appear here once consumption trends are recorded</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Consumption Tab */}
            {activeTab === 'consumption' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 d-flex align-items-center">
                                        <FaChartLine className="me-2" style={{ color: colors.accent }} />
                                        Material Consumption Analysis
                                        {tabLoadingStates.consumption && (
                                            <div className="spinner-border spinner-border-sm ms-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        )}
                                    </h5>
                                </div>
                            </div>
                            <div className="card-body">

                                {/* Filter Controls */}
                                <div className="mb-4">
                                    <div className="row align-items-center">
                                        <div className="col-md-6">
                                            <h6 className="mb-2">Filter by Product Type:</h6>
                                            <div className="btn-group" role="group">
                                                <button 
                                                    className={`btn ${consumptionFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                                                    onClick={() => setConsumptionFilter('all')}
                                                >
                                                    All Products
                                                </button>
                                                <button 
                                                    className={`btn ${consumptionFilter === 'alkansya' ? 'btn-success' : 'btn-outline-success'}`}
                                                    onClick={() => setConsumptionFilter('alkansya')}
                                                >
                                                    Alkansya Only
                                                </button>
                                                <button 
                                                    className={`btn ${consumptionFilter === 'made_to_order' ? 'btn-info' : 'btn-outline-info'}`}
                                                    onClick={() => setConsumptionFilter('made_to_order')}
                                                >
                                                    Made-to-Order Only
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <h6 className="mb-2">Time Period:</h6>
                                            <div className="btn-group" role="group">
                                                <button 
                                                    className={`btn ${windowDays === 7 ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                                    onClick={() => setWindowDays(7)}
                                                >
                                                    7 Days
                                                </button>
                                                <button 
                                                    className={`btn ${windowDays === 30 ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                                    onClick={() => setWindowDays(30)}
                                                >
                                                    30 Days
                                                </button>
                                                <button 
                                                    className={`btn ${windowDays === 90 ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                                    onClick={() => setWindowDays(90)}
                                                >
                                                    90 Days
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {tabLoadingStates.consumption ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-accent mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Consumption Data...</h5>
                                        <p className="text-muted">Analyzing material usage from orders and Alkansya production</p>
                                    </div>
                                ) : consumptionTrends && Object.keys(consumptionTrends).length > 0 ? (
                                    <div>
                                        {/* Summary Cards */}
                                        <div className="row mb-4">
                                            <div className="col-md-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h6 className="card-title text-muted">Total Consumption</h6>
                                                        <h3 className="text-primary">{consumptionTrends.summary?.total_consumption ? Number(consumptionTrends.summary.total_consumption).toLocaleString() : 0}</h3>
                                                        <small className="text-muted">units</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h6 className="card-title text-muted">Alkansya Production</h6>
                                                        <h3 className="text-success">{consumptionTrends.summary?.alkansya_consumption ? Number(consumptionTrends.summary.alkansya_consumption).toLocaleString() : 0}</h3>
                                                        <small className="text-muted">units</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h6 className="card-title text-muted">Order Consumption</h6>
                                                        <h3 className="text-info">{consumptionTrends.summary?.order_consumption ? Number(consumptionTrends.summary.order_consumption).toLocaleString() : 0}</h3>
                                                        <small className="text-muted">units</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h6 className="card-title text-muted">Total Cost</h6>
                                                        <h3 className="text-warning">₱{consumptionTrends.summary?.total_cost ? Number(consumptionTrends.summary.total_cost).toLocaleString() : 0}</h3>
                                                        <small className="text-muted">material cost</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Consumption Chart */}
                                        <div className="mb-4">
                                            <h6 className="mb-3">Daily Consumption Trends</h6>
                                            <ResponsiveContainer width="100%" height={400}>
                                                <AreaChart data={consumptionTrends?.chart_data || []}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Area 
                                                        type="monotone" 
                                                        dataKey="alkansya_consumption" 
                                                        stackId="1" 
                                                        stroke={colors.success} 
                                                        fill={colors.success} 
                                                        fillOpacity={0.6}
                                                        name="Alkansya Production"
                                                    />
                                                    <Area 
                                                        type="monotone" 
                                                        dataKey="order_consumption" 
                                                        stackId="1" 
                                                        stroke={colors.info} 
                                                        fill={colors.info} 
                                                        fillOpacity={0.6}
                                                        name="Order Consumption"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Top Materials Table */}
                                        <div>
                                            <div>
                                                <h6 className="mb-3">Top Consumed Materials</h6>
                                                <div className="table-responsive">
                                                    <table className="table table-hover">
                                                        <thead>
                                                            <tr>
                                                                <th>Material</th>
                                                                <th>Total Consumption</th>
                                                                <th>Alkansya Usage</th>
                                                                <th>Order Usage</th>
                                                                <th>Total Cost</th>
                                                                <th>Usage Days</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(consumptionTrends.top_materials && consumptionTrends.top_materials.length > 0) ? consumptionTrends.top_materials.map((material, index) => (
                                                                <tr key={material.material_id}>
                                                                    <td>
                                                                        <div className="d-flex align-items-center">
                                                                            <div className="me-3">
                                                                                <div className="rounded-circle d-flex align-items-center justify-content-center" 
                                                                                     style={{ 
                                                                                         width: '40px', 
                                                                                         height: '40px', 
                                                                                         backgroundColor: `${colors.accent}20`,
                                                                                         color: colors.accent
                                                                                     }}>
                                                                                    <FaBox />
                                                                                </div>
                                                                            </div>
                                                                            <div>
                                                                                <h6 className="mb-0">{material.material_name}</h6>
                                                                                <small className="text-muted">ID: {material.material_id}</small>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <span className="fw-bold text-primary">
                                                                            {material.total_consumption ? Number(material.total_consumption).toLocaleString() : 0}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className="text-success">
                                                                            {material.alkansya_consumption ? Number(material.alkansya_consumption).toLocaleString() : 0}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className="text-info">
                                                                            {material.order_consumption ? Number(material.order_consumption).toLocaleString() : 0}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className="fw-bold text-warning">
                                                                            ₱{material.total_cost ? Number(material.total_cost).toLocaleString() : 0}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className="text-muted">
                                                                            {material.consumption_days} days
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            )) : (
                                                                <tr>
                                                                    <td colSpan="6" className="text-center text-muted py-4">
                                                                        <FaBox className="mb-2" style={{ fontSize: '2rem' }} />
                                                                        <div>No consumption data available</div>
                                                                        <small>Click "Load Test Data" to see sample data</small>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaChartLine className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">No consumption data available</h5>
                                        <p className="text-muted">Consumption data will appear here once orders are processed and Alkansya production is recorded</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Status Tab */}
            {activeTab === 'stock' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaBox className="me-2" style={{ color: colors.secondary }} />
                                    Stock Status - Normalized Inventory
                                    {tabLoadingStates.stock && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.stock ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Stock Data...</h5>
                                        <p className="text-muted">Fetching materials from normalized inventory</p>
                                    </div>
                                ) : filteredInventoryData?.items && filteredInventoryData.items.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Material Name</th>
                                                    <th>SKU</th>
                                                    <th>Current Stock</th>
                                                    <th>Reorder Point</th>
                                                    <th>Status</th>
                                                    <th>Value</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredInventoryData.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="me-3">
                                                                    <div className="rounded-circle d-flex align-items-center justify-content-center" 
                                                                         style={{ 
                                                                             width: '40px', 
                                                                             height: '40px', 
                                                                             backgroundColor: `${colors.primary}20`,
                                                                             color: colors.primary
                                                                         }}>
                                                                        <FaBox />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h6 className="mb-0">{item.name}</h6>
                                                                    <small className="text-muted">{item.category || 'Material'}</small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <code className="bg-light px-2 py-1 rounded">{item.sku}</code>
                                                        </td>
                                                        <td>
                                                            <span className={`fw-bold ${
                                                                item.current_stock <= 0 ? 'text-danger' :
                                                                item.current_stock <= (item.reorder_point || 0) ? 'text-warning' :
                                                                'text-success'
                                                            }`}>
                                                                {item.current_stock || 0}
                                                            </span>
                                                            <small className="text-muted d-block">{item.unit || 'units'}</small>
                                                        </td>
                                                        <td>
                                                            <span className="text-muted">{item.reorder_point || 'N/A'}</span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${
                                                                item.stock_status === 'out_of_stock' ? 'bg-danger' :
                                                                item.stock_status === 'low' ? 'bg-warning' :
                                                                item.stock_status === 'critical' ? 'bg-danger' :
                                                                'bg-success'
                                                            }`}>
                                                                {item.stock_status === 'out_of_stock' ? 'Out of Stock' :
                                                                 item.stock_status === 'low' ? 'Low Stock' :
                                                                 item.stock_status === 'critical' ? 'Critical' :
                                                                 'In Stock'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="fw-bold text-primary">
                                                                ₱{item.value ? Number(item.value).toLocaleString() : '0'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="btn-group" role="group">
                                                                <button className="btn btn-outline-primary btn-sm">
                                                                    <FaEye className="me-1" />
                                                                    View
                                                                </button>
                                                                <button className="btn btn-outline-secondary btn-sm">
                                                                    <FaEdit className="me-1" />
                                                                    Edit
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaBox className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">No materials found</h5>
                                        <p className="text-muted">Materials will appear here once they are added to the normalized inventory</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Forecasting Tab */}
            {activeTab === 'forecast' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 d-flex align-items-center">
                                        <FaChartLine className="me-2" style={{ color: colors.info }} />
                                        Enhanced Material Usage Forecasting
                                        {tabLoadingStates.forecast && (
                                            <div className="spinner-border spinner-border-sm ms-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        )}
                                    </h5>
                                    <div className="d-flex gap-2">
                                        <select 
                                            className="form-select form-select-sm" 
                                            value={windowDays}
                                            onChange={(e) => setWindowDays(parseInt(e.target.value))}
                                            style={{ width: '120px' }}
                                        >
                                            <option value={7}>7 Days</option>
                                            <option value={14}>14 Days</option>
                                            <option value={30}>30 Days</option>
                                            <option value={60}>60 Days</option>
                                            <option value={90}>90 Days</option>
                                        </select>
                                        <button 
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => fetchForecastData()}
                                        >
                                            <FaSync className="me-1" />
                                            Refresh
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.forecast ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-info mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Enhanced Forecast Data...</h5>
                                        <p className="text-muted">Analyzing Alkansya output, made-to-order patterns, and overall material usage</p>
                                    </div>
                                ) : (
                                    <div>
                                        {/* Forecast Type Tabs */}
                                        <ul className="nav nav-tabs mb-4" id="forecastTabs" role="tablist">
                                            <li className="nav-item" role="presentation">
                                                <button 
                                                    className={`nav-link ${forecastType === 'alkansya' ? 'active' : ''}`}
                                                    onClick={() => setForecastType('alkansya')}
                                                >
                                                    Alkansya Materials
                                                </button>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <button 
                                                    className={`nav-link ${forecastType === 'made-to-order' ? 'active' : ''}`}
                                                    onClick={() => setForecastType('made-to-order')}
                                                >
                                                    Made-to-Order
                                                </button>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <button 
                                                    className={`nav-link ${forecastType === 'overall' ? 'active' : ''}`}
                                                    onClick={() => setForecastType('overall')}
                                                >
                                                    Overall Materials
                                                </button>
                                            </li>
                                        </ul>

                                        {/* Alkansya Materials Forecast */}
                                        {forecastType === 'alkansya' && (
                                            <div>
                                                {alkansyaForecast ? (
                                                    <div>
                                                        <div className="row mb-4">
                                                            <div className="col-md-3">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Avg Daily Output</h6>
                                                                        <h4 className="text-primary">{alkansyaForecast.avg_daily_output}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Materials Analyzed</h6>
                                                                        <h4 className="text-info">{alkansyaForecast.summary.materials_analyzed}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Need Reorder</h6>
                                                                        <h4 className="text-warning">{alkansyaForecast.summary.materials_needing_reorder}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Avg Days to Stockout</h6>
                                                                        <h4 className="text-danger">{Math.round(alkansyaForecast.summary.avg_days_until_stockout)}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="row">
                                                            <div className="col-md-8">
                                                                <div className="card">
                                                                    <div className="card-header">
                                                                        <h6 className="mb-0">Daily Output & Material Usage Forecast</h6>
                                                                    </div>
                                                                    <div className="card-body">
                                                                        <ResponsiveContainer width="100%" height={300}>
                                                                            <LineChart data={alkansyaForecast.daily_forecast}>
                                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                                <XAxis dataKey="date" />
                                                                                <YAxis />
                                                                                <Tooltip />
                                                                                <Legend />
                                                                                <Line type="monotone" dataKey="predicted_output" stroke={colors.primary} strokeWidth={2} name="Predicted Output" />
                                                                                <Line type="monotone" dataKey="total_material_usage" stroke={colors.info} strokeWidth={2} name="Total Material Usage" />
                                                                            </LineChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="card">
                                                                    <div className="card-header">
                                                                        <h6 className="mb-0">Material Forecast Summary</h6>
                                                                    </div>
                                                                    <div className="card-body">
                                                                        <div className="table-responsive" style={{ maxHeight: '300px' }}>
                                                                            <table className="table table-sm">
                                                                                <thead>
                                                                                    <tr>
                                                                                        <th>Material</th>
                                                                                        <th>Days Left</th>
                                                                                        <th>Status</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {alkansyaForecast.material_forecasts.slice(0, 5).map((material, index) => (
                                                                                        <tr key={index}>
                                                                                            <td className="text-truncate" style={{ maxWidth: '100px' }} title={material.material_name}>
                                                                                                {material.material_name}
                                                                                            </td>
                                                                                            <td>
                                                                                                <span className={`badge ${material.days_until_stockout <= 7 ? 'bg-danger' : material.days_until_stockout <= 14 ? 'bg-warning' : 'bg-success'}`}>
                                                                                                    {material.days_until_stockout}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td>
                                                                                                <span className={`badge ${material.needs_reorder ? 'bg-warning' : 'bg-success'}`}>
                                                                                                    {material.needs_reorder ? 'Reorder' : 'OK'}
                                                                                                </span>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-5">
                                                        <FaChartLine className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                                        <h5 className="text-muted">No Alkansya forecast data available</h5>
                                                        <p className="text-muted">Alkansya production data is needed to generate material usage forecasts</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Made-to-Order Forecast */}
                                        {forecastType === 'made-to-order' && (
                                            <div>
                                                {madeToOrderForecast ? (
                                                    <div>
                                                        <div className="row mb-4">
                                                            <div className="col-md-3">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Products Analyzed</h6>
                                                                        <h4 className="text-primary">{madeToOrderForecast.summary.products_analyzed}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Materials Analyzed</h6>
                                                                        <h4 className="text-info">{madeToOrderForecast.summary.materials_analyzed}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Need Reorder</h6>
                                                                        <h4 className="text-warning">{madeToOrderForecast.summary.materials_needing_reorder}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Avg Days to Stockout</h6>
                                                                        <h4 className="text-danger">{Math.round(madeToOrderForecast.summary.avg_days_until_stockout)}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="row">
                                                            <div className="col-md-8">
                                                                <div className="card">
                                                                    <div className="card-header">
                                                                        <h6 className="mb-0">Product Order Statistics</h6>
                                                                    </div>
                                                                    <div className="card-body">
                                                                        <div className="table-responsive">
                                                                            <table className="table table-hover">
                                                                                <thead>
                                                                                    <tr>
                                                                                        <th>Product</th>
                                                                                        <th>Total Orders</th>
                                                                                        <th>Avg Order Qty</th>
                                                                                        <th>Avg Orders/Day</th>
                                                                                        <th>Avg Daily Qty</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {Object.values(madeToOrderForecast.product_stats).map((product, index) => (
                                                                                        <tr key={index}>
                                                                                            <td>{product.product_name}</td>
                                                                                            <td>{product.total_orders}</td>
                                                                                            <td>{product.avg_order_quantity}</td>
                                                                                            <td>{product.avg_orders_per_day}</td>
                                                                                            <td>{product.avg_daily_quantity}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="card">
                                                                    <div className="card-header">
                                                                        <h6 className="mb-0">Material Forecast Summary</h6>
                                                                    </div>
                                                                    <div className="card-body">
                                                                        <div className="table-responsive" style={{ maxHeight: '300px' }}>
                                                                            <table className="table table-sm">
                                                                                <thead>
                                                                                    <tr>
                                                                                        <th>Product</th>
                                                                                        <th>Material</th>
                                                                                        <th>Days Left</th>
                                                                                        <th>Status</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {madeToOrderForecast.material_forecasts.slice(0, 5).map((material, index) => (
                                                                                        <tr key={index}>
                                                                                            <td className="text-truncate" style={{ maxWidth: '80px' }} title={material.product_name}>
                                                                                                {material.product_name}
                                                                                            </td>
                                                                                            <td className="text-truncate" style={{ maxWidth: '80px' }} title={material.material_name}>
                                                                                                {material.material_name}
                                                                                            </td>
                                                                                            <td>
                                                                                                <span className={`badge ${material.days_until_stockout <= 7 ? 'bg-danger' : material.days_until_stockout <= 14 ? 'bg-warning' : 'bg-success'}`}>
                                                                                                    {material.days_until_stockout}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td>
                                                                                                <span className={`badge ${material.needs_reorder ? 'bg-warning' : 'bg-success'}`}>
                                                                                                    {material.needs_reorder ? 'Reorder' : 'OK'}
                                                                                                </span>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-5">
                                                        <FaChartLine className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                                        <h5 className="text-muted">No made-to-order forecast data available</h5>
                                                        <p className="text-muted">Order data for made-to-order products is needed to generate material usage forecasts</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Overall Materials Forecast */}
                                        {forecastType === 'overall' && (
                                            <div>
                                                {overallForecast ? (
                                                    <div>
                                                        <div className="row mb-4">
                                                            <div className="col-md-2">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Total Materials</h6>
                                                                        <h4 className="text-primary">{overallForecast.summary.total_materials}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-2">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Need Reorder</h6>
                                                                        <h4 className="text-warning">{overallForecast.summary.materials_needing_reorder}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-2">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Critical (≤7 days)</h6>
                                                                        <h4 className="text-danger">{overallForecast.summary.critical_materials}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-2">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">High Usage</h6>
                                                                        <h4 className="text-info">{overallForecast.summary.high_usage_materials}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-2">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Total Value</h6>
                                                                        <h4 className="text-success">₱{overallForecast.summary.total_inventory_value.toLocaleString()}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-2">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Avg Days Left</h6>
                                                                        <h4 className="text-secondary">{Math.round(overallForecast.summary.avg_days_until_stockout)}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="row">
                                                            <div className="col-md-8">
                                                                <div className="card">
                                                                    <div className="card-header">
                                                                        <h6 className="mb-0">Daily Usage Forecast</h6>
                                                                    </div>
                                                                    <div className="card-body">
                                                                        <ResponsiveContainer width="100%" height={300}>
                                                                            <LineChart data={overallForecast.daily_forecast}>
                                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                                <XAxis dataKey="date" />
                                                                                <YAxis />
                                                                                <Tooltip />
                                                                                <Legend />
                                                                                <Line type="monotone" dataKey="predicted_total_usage" stroke={colors.primary} strokeWidth={2} name="Predicted Total Usage" />
                                                                                <Line type="monotone" dataKey="critical_materials_count" stroke={colors.danger} strokeWidth={2} name="Critical Materials Count" />
                                                                            </LineChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="card">
                                                                    <div className="card-header">
                                                                        <h6 className="mb-0">Critical Materials</h6>
                                                                    </div>
                                                                    <div className="card-body">
                                                                        <div className="table-responsive" style={{ maxHeight: '300px' }}>
                                                                            <table className="table table-sm">
                                                                                <thead>
                                                                                    <tr>
                                                                                        <th>Material</th>
                                                                                        <th>Days Left</th>
                                                                                        <th>Usage</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {overallForecast.material_forecasts
                                                                                        .filter(m => m.days_until_stockout <= 14)
                                                                                        .slice(0, 5)
                                                                                        .map((material, index) => (
                                                                                        <tr key={index}>
                                                                                            <td className="text-truncate" style={{ maxWidth: '120px' }} title={material.material_name}>
                                                                                                {material.material_name}
                                                                                            </td>
                                                                                            <td>
                                                                                                <span className={`badge ${material.days_until_stockout <= 7 ? 'bg-danger' : 'bg-warning'}`}>
                                                                                                    {material.days_until_stockout}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td>
                                                                                                <span className={`badge ${material.usage_category === 'high' ? 'bg-danger' : material.usage_category === 'medium' ? 'bg-warning' : 'bg-success'}`}>
                                                                                                    {material.usage_category}
                                                                                                </span>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-5">
                                                        <FaChartLine className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                                        <h5 className="text-muted">No overall forecast data available</h5>
                                                        <p className="text-muted">Material usage data is needed to generate comprehensive forecasts</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Replenishment Tab */}
            {activeTab === 'replenishment' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 d-flex align-items-center">
                                        <FaTruck className="me-2" style={{ color: colors.warning }} />
                                        Enhanced Replenishment Schedule
                                        {tabLoadingStates.replenishment && (
                                            <div className="spinner-border spinner-border-sm ms-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        )}
                                    </h5>
                                    <div className="d-flex gap-2">
                                        <select 
                                            className="form-select form-select-sm" 
                                            value={windowDays}
                                            onChange={(e) => setWindowDays(parseInt(e.target.value))}
                                            style={{ width: '120px' }}
                                        >
                                            <option value={7}>7 Days</option>
                                            <option value={14}>14 Days</option>
                                            <option value={30}>30 Days</option>
                                            <option value={60}>60 Days</option>
                                            <option value={90}>90 Days</option>
                                        </select>
                                        <button 
                                            className="btn btn-outline-warning btn-sm"
                                            onClick={() => fetchEnhancedReplenishmentData()}
                                        >
                                            <FaSync className="me-1" />
                                            Refresh
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.replenishment ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-warning mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Enhanced Replenishment Data...</h5>
                                        <p className="text-muted">Analyzing Alkansya output, made-to-order patterns, and material consumption</p>
                                    </div>
                                ) : enhancedReplenishment ? (
                                    enhancedReplenishment.error ? (
                                        <div className="text-center py-5">
                                            <FaTruck className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                            <h5 className="text-muted">No Consumption Data Available</h5>
                                            <p className="text-muted mb-4">{enhancedReplenishment.message}</p>
                                            <div className="card bg-light">
                                                <div className="card-body">
                                                    <h6 className="card-title">Setup Instructions:</h6>
                                                    <ol className="text-start">
                                                        {enhancedReplenishment.instructions?.map((instruction, index) => (
                                                            <li key={index} className="mb-2">
                                                                <code className="bg-dark text-light px-2 py-1 rounded">
                                                                    {instruction}
                                                                </code>
                                                            </li>
                                                        ))}
                                                    </ol>
                                                    <div className="mt-3">
                                                        <button 
                                                            className="btn btn-primary"
                                                            onClick={() => fetchEnhancedReplenishmentData()}
                                                        >
                                                            <FaSync className="me-1" />
                                                            Check Again
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                        {/* View Tabs */}
                                        <ul className="nav nav-tabs mb-4" id="replenishmentTabs" role="tablist">
                                            <li className="nav-item" role="presentation">
                                                <button 
                                                    className={`nav-link ${replenishmentView === 'summary' ? 'active' : ''}`}
                                                    onClick={() => setReplenishmentView('summary')}
                                                >
                                                    Summary Dashboard
                                                </button>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <button 
                                                    className={`nav-link ${replenishmentView === 'schedule' ? 'active' : ''}`}
                                                    onClick={() => setReplenishmentView('schedule')}
                                                >
                                                    Replenishment Schedule
                                                </button>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <button 
                                                    className={`nav-link ${replenishmentView === 'analytics' ? 'active' : ''}`}
                                                    onClick={() => setReplenishmentView('analytics')}
                                                >
                                                    Consumption Analytics
                                                </button>
                                            </li>
                                        </ul>

                                        {/* Summary Dashboard */}
                                        {replenishmentView === 'summary' && (
                                            <div>
                                                <div className="row mb-4">
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">Total Materials</h6>
                                                                <h4 className="text-primary">{enhancedReplenishment.summary.total_materials}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">Critical</h6>
                                                                <h4 className="text-danger">{enhancedReplenishment.summary.critical_materials}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">High Priority</h6>
                                                                <h4 className="text-warning">{enhancedReplenishment.summary.high_priority_materials}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">Need Reorder</h6>
                                                                <h4 className="text-info">{enhancedReplenishment.summary.materials_needing_reorder}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">Reorder Value</h6>
                                                                <h4 className="text-success">₱{enhancedReplenishment.summary.total_reorder_value.toLocaleString()}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">Avg Lead Time</h6>
                                                                <h4 className="text-secondary">{Math.round(enhancedReplenishment.summary.avg_lead_time)} days</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="card">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Material Source Breakdown</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="row text-center">
                                                                    <div className="col-4">
                                                                        <h5 className="text-primary">{enhancedReplenishment.summary.alkansya_materials}</h5>
                                                                        <small className="text-muted">Alkansya Materials</small>
                                                                    </div>
                                                                    <div className="col-4">
                                                                        <h5 className="text-info">{enhancedReplenishment.summary.made_to_order_materials}</h5>
                                                                        <small className="text-muted">Made-to-Order</small>
                                                                    </div>
                                                                    <div className="col-4">
                                                                        <h5 className="text-success">{enhancedReplenishment.alkansya_daily_output}</h5>
                                                                        <small className="text-muted">Avg Daily Output</small>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="card">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Urgency Distribution</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span>Critical</span>
                                                                    <span className="badge bg-danger">{enhancedReplenishment.summary.critical_materials}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span>High Priority</span>
                                                                    <span className="badge bg-warning">{enhancedReplenishment.summary.high_priority_materials}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span>Medium Priority</span>
                                                                    <span className="badge bg-info">{enhancedReplenishment.summary.medium_priority_materials}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Replenishment Schedule */}
                                        {replenishmentView === 'schedule' && (
                                            <div>
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="card">
                                                            <div className="card-header bg-danger text-white">
                                                                <h6 className="mb-0">Immediate Action Required</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                                                                    <table className="table table-sm">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Material</th>
                                                                                <th>Days Left</th>
                                                                                <th>Order Qty</th>
                                                                                <th>Reorder Date</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {enhancedReplenishment.schedule.immediate.map((item, index) => (
                                                                                <tr key={index}>
                                                                                    <td className="text-truncate" style={{ maxWidth: '150px' }} title={item.material_name}>
                                                                                        {item.material_name}
                                                                                    </td>
                                                                                    <td>
                                                                                        <span className="badge bg-danger">{item.days_until_stockout}</span>
                                                                                    </td>
                                                                                    <td>{item.suggested_order_qty}</td>
                                                                                    <td>{item.reorder_date}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="card">
                                                            <div className="card-header bg-warning text-white">
                                                                <h6 className="mb-0">This Week</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                                                                    <table className="table table-sm">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Material</th>
                                                                                <th>Days Left</th>
                                                                                <th>Order Qty</th>
                                                                                <th>Reorder Date</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {enhancedReplenishment.schedule.this_week.map((item, index) => (
                                                                                <tr key={index}>
                                                                                    <td className="text-truncate" style={{ maxWidth: '150px' }} title={item.material_name}>
                                                                                        {item.material_name}
                                                                                    </td>
                                                                                    <td>
                                                                                        <span className="badge bg-warning">{item.days_until_stockout}</span>
                                                                                    </td>
                                                                                    <td>{item.suggested_order_qty}</td>
                                                                                    <td>{item.reorder_date}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="row mt-3">
                                                    <div className="col-md-6">
                                                        <div className="card">
                                                            <div className="card-header bg-info text-white">
                                                                <h6 className="mb-0">Next Week</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                                                                    <table className="table table-sm">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Material</th>
                                                                                <th>Days Left</th>
                                                                                <th>Order Qty</th>
                                                                                <th>Reorder Date</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {enhancedReplenishment.schedule.next_week.map((item, index) => (
                                                                                <tr key={index}>
                                                                                    <td className="text-truncate" style={{ maxWidth: '150px' }} title={item.material_name}>
                                                                                        {item.material_name}
                                                                                    </td>
                                                                                    <td>
                                                                                        <span className="badge bg-info">{item.days_until_stockout}</span>
                                                                                    </td>
                                                                                    <td>{item.suggested_order_qty}</td>
                                                                                    <td>{item.reorder_date}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="card">
                                                            <div className="card-header bg-success text-white">
                                                                <h6 className="mb-0">Future Planning</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                                                                    <table className="table table-sm">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Material</th>
                                                                                <th>Days Left</th>
                                                                                <th>Order Qty</th>
                                                                                <th>Reorder Date</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {enhancedReplenishment.schedule.future.map((item, index) => (
                                                                                <tr key={index}>
                                                                                    <td className="text-truncate" style={{ maxWidth: '150px' }} title={item.material_name}>
                                                                                        {item.material_name}
                                                                                    </td>
                                                                                    <td>
                                                                                        <span className="badge bg-success">{item.days_until_stockout}</span>
                                                                                    </td>
                                                                                    <td>{item.suggested_order_qty}</td>
                                                                                    <td>{item.reorder_date}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Consumption Analytics */}
                                        {replenishmentView === 'analytics' && (
                                            <div>
                                                <div className="row">
                                                    <div className="col-md-8">
                                                        <div className="card">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Material Consumption Breakdown</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="table-responsive">
                                                                    <table className="table table-hover">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Material</th>
                                                                                <th>Historical</th>
                                                                                <th>Alkansya</th>
                                                                                <th>Made-to-Order</th>
                                                                                <th>Predicted</th>
                                                                                <th>Days Left</th>
                                                                                <th>Source</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {enhancedReplenishment.replenishment_items.slice(0, 20).map((item, index) => (
                                                                                <tr key={index}>
                                                                                    <td className="text-truncate" style={{ maxWidth: '150px' }} title={item.material_name}>
                                                                                        {item.material_name}
                                                                                    </td>
                                                                                    <td>{item.consumption_breakdown.historical}</td>
                                                                                    <td>{item.consumption_breakdown.alkansya}</td>
                                                                                    <td>{item.consumption_breakdown.made_to_order}</td>
                                                                                    <td className="fw-bold">{item.consumption_breakdown.predicted}</td>
                                                                                    <td>
                                                                                        <span className={`badge ${
                                                                                            item.days_until_stockout <= 7 ? 'bg-danger' : 
                                                                                            item.days_until_stockout <= 14 ? 'bg-warning' : 
                                                                                            'bg-success'
                                                                                        }`}>
                                                                                            {item.days_until_stockout}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td>
                                                                                        <div className="d-flex gap-1">
                                                                                            {item.is_alkansya_material && (
                                                                                                <span className="badge bg-primary">A</span>
                                                                                            )}
                                                                                            {item.is_made_to_order_material && (
                                                                                                <span className="badge bg-info">M</span>
                                                                                            )}
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="card">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Consumption Sources</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="mb-3">
                                                                    <div className="d-flex justify-content-between">
                                                                        <span>Alkansya Materials</span>
                                                                        <span className="badge bg-primary">{enhancedReplenishment.summary.alkansya_materials}</span>
                                                                    </div>
                                                                    <div className="progress mt-1" style={{ height: '8px' }}>
                                                                        <div 
                                                                            className="progress-bar bg-primary" 
                                                                            style={{ 
                                                                                width: `${(enhancedReplenishment.summary.alkansya_materials / enhancedReplenishment.summary.total_materials) * 100}%` 
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                                <div className="mb-3">
                                                                    <div className="d-flex justify-content-between">
                                                                        <span>Made-to-Order</span>
                                                                        <span className="badge bg-info">{enhancedReplenishment.summary.made_to_order_materials}</span>
                                                                    </div>
                                                                    <div className="progress mt-1" style={{ height: '8px' }}>
                                                                        <div 
                                                                            className="progress-bar bg-info" 
                                                                            style={{ 
                                                                                width: `${(enhancedReplenishment.summary.made_to_order_materials / enhancedReplenishment.summary.total_materials) * 100}%` 
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                                <div className="mb-3">
                                                                    <div className="d-flex justify-content-between">
                                                                        <span>Other Materials</span>
                                                                        <span className="badge bg-secondary">
                                                                            {enhancedReplenishment.summary.total_materials - enhancedReplenishment.summary.alkansya_materials - enhancedReplenishment.summary.made_to_order_materials}
                                                                        </span>
                                                                    </div>
                                                                    <div className="progress mt-1" style={{ height: '8px' }}>
                                                                        <div 
                                                                            className="progress-bar bg-secondary" 
                                                                            style={{ 
                                                                                width: `${((enhancedReplenishment.summary.total_materials - enhancedReplenishment.summary.alkansya_materials - enhancedReplenishment.summary.made_to_order_materials) / enhancedReplenishment.summary.total_materials) * 100}%` 
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center py-5">
                                        <FaTruck className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">No replenishment data available</h5>
                                        <p className="text-muted">Enhanced replenishment data will appear here once material usage patterns are established</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* Enhanced Transactions Tab */}
            {activeTab === 'transactions' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <div className="d-flex justify-content-between align-items-center">
                                    <h5 className="mb-0 d-flex align-items-center">
                                        <FaHistory className="me-2" style={{ color: colors.dark }} />
                                        Enhanced Inventory Transactions
                                        {tabLoadingStates.transactions && (
                                            <div className="spinner-border spinner-border-sm ms-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        )}
                                    </h5>
                                    <div className="d-flex gap-2">
                                        <select 
                                            className="form-select form-select-sm" 
                                            value={transactionFilter}
                                            onChange={(e) => setTransactionFilter(e.target.value)}
                                            style={{ width: '150px' }}
                                        >
                                            <option value="all">All Transactions</option>
                                            <option value="alkansya">Alkansya</option>
                                            <option value="made_to_order">Made-to-Order</option>
                                            <option value="other">Other</option>
                                        </select>
                                        <button 
                                            className="btn btn-outline-dark btn-sm"
                                            onClick={() => fetchEnhancedTransactionsData()}
                                        >
                                            <FaSync className="me-1" />
                                            Refresh
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.transactions ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-dark mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Enhanced Transactions...</h5>
                                        <p className="text-muted">Fetching normalized inventory transactions with filtering</p>
                                    </div>
                                ) : enhancedTransactions ? (
                                    enhancedTransactions.error ? (
                                        <div className="text-center py-5">
                                            <FaHistory className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                            <h5 className="text-muted">No Transaction Data Available</h5>
                                            <p className="text-muted mb-4">{enhancedTransactions.message}</p>
                                            <div className="card bg-light">
                                                <div className="card-body">
                                                    <h6 className="card-title">Setup Instructions:</h6>
                                                    <ol className="text-start">
                                                        {enhancedTransactions.instructions?.map((instruction, index) => (
                                                            <li key={index} className="mb-2">
                                                                <code className="bg-dark text-light px-2 py-1 rounded">
                                                                    {instruction}
                                                                </code>
                                                            </li>
                                                        ))}
                                                    </ol>
                                                    <div className="mt-3">
                                                        <button 
                                                            className="btn btn-primary"
                                                            onClick={() => fetchEnhancedTransactionsData()}
                                                        >
                                                            <FaSync className="me-1" />
                                                            Check Again
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                        {/* View Tabs */}
                                        <ul className="nav nav-tabs mb-4" id="transactionTabs" role="tablist">
                                            <li className="nav-item" role="presentation">
                                                <button 
                                                    className={`nav-link ${transactionView === 'list' ? 'active' : ''}`}
                                                    onClick={() => setTransactionView('list')}
                                                >
                                                    Transaction List
                                                </button>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <button 
                                                    className={`nav-link ${transactionView === 'summary' ? 'active' : ''}`}
                                                    onClick={() => setTransactionView('summary')}
                                                >
                                                    Summary Dashboard
                                                </button>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <button 
                                                    className={`nav-link ${transactionView === 'analytics' ? 'active' : ''}`}
                                                    onClick={() => setTransactionView('analytics')}
                                                >
                                                    Analytics
                                                </button>
                                            </li>
                                        </ul>

                                        {/* Transaction List */}
                                        {transactionView === 'list' && (
                                            <div>
                                                <div className="table-responsive">
                                                    <table className="table table-hover">
                                                        <thead>
                                                            <tr>
                                                                <th>Date/Time</th>
                                                                <th>Type</th>
                                                                <th>Category</th>
                                                                <th>Material</th>
                                                                <th>Product</th>
                                                                <th>Quantity</th>
                                                                <th>Unit Cost</th>
                                                                <th>Total Cost</th>
                                                                <th>Reference</th>
                                                                <th>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {enhancedTransactions.transactions.map((transaction) => (
                                                                <tr key={transaction.id}>
                                                                    <td>
                                                                        <div>
                                                                            <strong>{transaction.date}</strong>
                                                                            <br />
                                                                            <small className="text-muted">{transaction.time}</small>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <span className={`badge ${
                                                                            transaction.direction === 'in' ? 'bg-success' : 'bg-danger'
                                                                        }`}>
                                                                            {transaction.direction_label}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className={`badge ${
                                                                            transaction.category === 'alkansya' ? 'bg-primary' :
                                                                            transaction.category === 'made_to_order' ? 'bg-info' :
                                                                            'bg-secondary'
                                                                        }`}>
                                                                            {transaction.category === 'alkansya' ? 'Alkansya' :
                                                                             transaction.category === 'made_to_order' ? 'Made-to-Order' : 'Other'}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <div>
                                                                            <strong>{transaction.material_name}</strong>
                                                                            <br />
                                                                            <small className="text-muted">{transaction.material_code}</small>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <span className="text-truncate d-inline-block" style={{ maxWidth: '120px' }} title={transaction.product_name}>
                                                                            {transaction.product_name}
                                                                        </span>
                                                                    </td>
                                                                    <td className={transaction.direction === 'in' ? 'text-success' : 'text-danger'}>
                                                                        <strong>{transaction.quantity_display}</strong>
                                                                        <br />
                                                                        <small className="text-muted">{transaction.unit}</small>
                                                                    </td>
                                                                    <td>₱{transaction.unit_cost?.toLocaleString() || 'N/A'}</td>
                                                                    <td>₱{transaction.total_cost?.toLocaleString() || 'N/A'}</td>
                                                                    <td>
                                                                        <span className="text-truncate d-inline-block" style={{ maxWidth: '150px' }} title={transaction.reference}>
                                                                            {transaction.reference}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className={`badge ${
                                                                            transaction.status === 'completed' ? 'bg-success' :
                                                                            transaction.status === 'pending' ? 'bg-warning' :
                                                                            'bg-secondary'
                                                                        }`}>
                                                                            {transaction.status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        {/* Summary Dashboard */}
                                        {transactionView === 'summary' && (
                                            <div>
                                                <div className="row mb-4">
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">Total Transactions</h6>
                                                                <h4 className="text-primary">{enhancedTransactions.summary.total_transactions}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">Total Value</h6>
                                                                <h4 className="text-success">₱{enhancedTransactions.summary.total_value.toLocaleString()}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">Inbound</h6>
                                                                <h4 className="text-success">{enhancedTransactions.summary.inbound_transactions}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">Outbound</h6>
                                                                <h4 className="text-danger">{enhancedTransactions.summary.outbound_transactions}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">Materials</h6>
                                                                <h4 className="text-info">{enhancedTransactions.summary.unique_materials}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">Total Qty</h6>
                                                                <h4 className="text-secondary">{enhancedTransactions.summary.total_quantity.toLocaleString()}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="card">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Transaction Categories</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span>Alkansya</span>
                                                                    <span className="badge bg-primary">{enhancedTransactions.summary.alkansya_transactions}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span>Made-to-Order</span>
                                                                    <span className="badge bg-info">{enhancedTransactions.summary.made_to_order_transactions}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span>Other</span>
                                                                    <span className="badge bg-secondary">{enhancedTransactions.summary.other_transactions}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="card">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Daily Transaction Trends</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <ResponsiveContainer width="100%" height={200}>
                                                                    <LineChart data={enhancedTransactions.daily_summary}>
                                                                        <CartesianGrid strokeDasharray="3 3" />
                                                                        <XAxis dataKey="date" />
                                                                        <YAxis />
                                                                        <Tooltip />
                                                                        <Legend />
                                                                        <Line type="monotone" dataKey="total_transactions" stroke={colors.primary} strokeWidth={2} name="Total" />
                                                                        <Line type="monotone" dataKey="inbound" stroke={colors.success} strokeWidth={2} name="Inbound" />
                                                                        <Line type="monotone" dataKey="outbound" stroke={colors.danger} strokeWidth={2} name="Outbound" />
                                                                    </LineChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Analytics */}
                                        {transactionView === 'analytics' && (
                                            <div>
                                                <div className="row">
                                                    <div className="col-md-8">
                                                        <div className="card">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Material Transaction Summary</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="table-responsive">
                                                                    <table className="table table-hover">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Material</th>
                                                                                <th>Code</th>
                                                                                <th>Transactions</th>
                                                                                <th>Total Qty</th>
                                                                                <th>Total Value</th>
                                                                                <th>Net Qty</th>
                                                                                <th>Last Transaction</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {enhancedTransactions.material_summary.slice(0, 20).map((material, index) => (
                                                                                <tr key={index}>
                                                                                    <td className="text-truncate" style={{ maxWidth: '150px' }} title={material.material_name}>
                                                                                        {material.material_name}
                                                                                    </td>
                                                                                    <td>{material.material_code}</td>
                                                                                    <td>
                                                                                        <span className="badge bg-info">{material.total_transactions}</span>
                                                                                    </td>
                                                                                    <td>{material.total_quantity.toLocaleString()}</td>
                                                                                    <td>₱{material.total_value.toLocaleString()}</td>
                                                                                    <td className={material.net_quantity > 0 ? 'text-success' : 'text-danger'}>
                                                                                        {material.net_quantity > 0 ? '+' : ''}{material.net_quantity}
                                                                                    </td>
                                                                                    <td>
                                                                                        <small>{new Date(material.last_transaction).toLocaleDateString()}</small>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="card">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Transaction Distribution</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <ResponsiveContainer width="100%" height={300}>
                                                                    <PieChart>
                                                                        <Pie
                                                                            data={[
                                                                                { name: 'Alkansya', value: enhancedTransactions.summary.alkansya_transactions, color: colors.primary },
                                                                                { name: 'Made-to-Order', value: enhancedTransactions.summary.made_to_order_transactions, color: colors.info },
                                                                                { name: 'Other', value: enhancedTransactions.summary.other_transactions, color: colors.secondary }
                                                                            ]}
                                                                            cx="50%"
                                                                            cy="50%"
                                                                            labelLine={false}
                                                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                                            outerRadius={80}
                                                                            fill="#8884d8"
                                                                            dataKey="value"
                                                                        >
                                                                            {[
                                                                                { name: 'Alkansya', value: enhancedTransactions.summary.alkansya_transactions, color: colors.primary },
                                                                                { name: 'Made-to-Order', value: enhancedTransactions.summary.made_to_order_transactions, color: colors.info },
                                                                                { name: 'Other', value: enhancedTransactions.summary.other_transactions, color: colors.secondary }
                                                                            ].map((entry, index) => (
                                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                                            ))}
                                                                        </Pie>
                                                                        <Tooltip />
                                                                        <Legend />
                                                                    </PieChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center py-5">
                                        <FaHistory className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">No transactions data available</h5>
                                        <p className="text-muted">Enhanced transaction data will appear here once inventory transactions are recorded</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaExclamationTriangle className="me-2" style={{ color: colors.danger }} />
                                    Real-Time Alerts
                                </h5>
                            </div>
                            <div className="card-body">
                                {realTimeAlerts?.alerts && realTimeAlerts.alerts.length > 0 ? (
                                    realTimeAlerts.alerts.map((alert) => (
                                    <div key={alert.id} className={`alert ${
                                        alert.severity === 'critical' ? 'alert-danger' :
                                        alert.severity === 'high' ? 'alert-warning' :
                                        'alert-info'
                                    } d-flex align-items-center`}>
                                        <FaExclamationTriangle className="me-3" />
                                        <div className="flex-grow-1">
                                            <strong>{alert.material}</strong> - {alert.message}
                                            <br />
                                            <small>Current Stock: {alert.current_stock} | Reorder Point: {alert.reorder_point}</small>
                                        </div>
                                        <small className="text-muted">
                                            {new Date(alert.timestamp).toLocaleString()}
                                        </small>
                                    </div>
                                    ))
                                ) : (
                                    <div className="text-center py-5">
                                        <FaExclamationTriangle className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">No alerts</h5>
                                        <p className="text-muted">All inventory levels are within normal ranges</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default EnhancedInventoryReports;
