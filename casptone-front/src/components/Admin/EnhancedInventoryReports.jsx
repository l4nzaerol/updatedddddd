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
                    const response = await api.get('/inventory/normalized-inventory');
                    const data = response.data;
                    setInventoryReport(data);
                    applyFilter(data, materialFilter);
                    break;
                    
                case 'consumption':
                    if (!consumptionTrends) {
                        const response = await api.get('/inventory/consumption-trends', { 
                            params: { days: windowDays } 
                        });
                        setConsumptionTrends(response.data);
                    }
                    break;
                    
                case 'forecast':
                    if (!forecastReport) {
                        const response = await api.get('/inventory/forecast', { 
                            params: { forecast_days: 30, historical_days: windowDays } 
                        });
                        setForecastReport(response.data);
                    }
                    break;
                    
                case 'replenishment':
                    if (!replenishmentSchedule) {
                        const response = await api.get('/inventory/replenishment-schedule');
                        setReplenishmentSchedule(response.data);
                    }
                    break;
                    
                case 'transactions':
                    {
                        // Load last 365 days to include seeder PURCHASE transactions
                        const txResponse = await api.get('/inventory/transactions', {
                            params: {
                                start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                end_date: new Date().toISOString().split('T')[0]
                            }
                        });
                        const txData = txResponse.data || { transactions: [], summary: { total_transactions: 0, total_value: 0 } };
                        // Normalize fields to UI expectations
                        const normalized = {
                            ...txData,
                            transactions: (txData.transactions || []).map(t => ({
                                id: t.id ?? `${t.material_id || 'mat'}-${t.created_at || Date.now()}`,
                                type: (t.transaction_type || t.type || '').toUpperCase(),
                                material: t.material_name || t.material || t.material_code || 'Unknown',
                                quantity: Number(t.quantity ?? 0),
                                unit_cost: Number(t.unit_cost ?? 0),
                                total_cost: Number(t.total_cost ?? (Number(t.quantity ?? 0) * Number(t.unit_cost ?? 0))),
                                reference: t.reference || t.notes || '—',
                                timestamp: t.created_at || t.timestamp || new Date().toISOString()
                            }))
                        };
                        setInventoryTransactions(normalized);
                    }
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
                        { id: 'stock', name: 'Stock Status', icon: FaBox, color: colors.secondary },
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
                                    {dashboardData?.summary?.total_value ? `₱${dashboardData.summary.total_value.toLocaleString()}` : '₱0'} total value
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
                            <div className="card-body">
                                {tabLoadingStates.consumption ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-accent mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Consumption Data...</h5>
                                        <p className="text-muted">Analyzing material usage from orders and Alkansya production</p>
                                    </div>
                                ) : consumptionTrends?.chart_data && consumptionTrends.chart_data.length > 0 ? (
                                    <div>
                                        {/* Summary Cards */}
                                        <div className="row mb-4">
                                            <div className="col-md-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h6 className="card-title text-muted">Total Consumption</h6>
                                                        <h3 className="text-primary">{consumptionTrends.summary?.total_consumption?.toLocaleString() || 0}</h3>
                                                        <small className="text-muted">units</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h6 className="card-title text-muted">Alkansya Production</h6>
                                                        <h3 className="text-success">{consumptionTrends.summary?.alkansya_consumption?.toLocaleString() || 0}</h3>
                                                        <small className="text-muted">units</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h6 className="card-title text-muted">Order Consumption</h6>
                                                        <h3 className="text-info">{consumptionTrends.summary?.order_consumption?.toLocaleString() || 0}</h3>
                                                        <small className="text-muted">units</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h6 className="card-title text-muted">Total Cost</h6>
                                                        <h3 className="text-warning">₱{consumptionTrends.summary?.total_cost?.toLocaleString() || 0}</h3>
                                                        <small className="text-muted">material cost</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Consumption Chart */}
                                        <div className="mb-4">
                                            <h6 className="mb-3">Daily Consumption Trends</h6>
                                            <ResponsiveContainer width="100%" height={400}>
                                                <AreaChart data={consumptionTrends.chart_data}>
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
                                        {consumptionTrends.top_materials && consumptionTrends.top_materials.length > 0 && (
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
                                                            {consumptionTrends.top_materials.map((material, index) => (
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
                                                                            {material.total_consumption.toLocaleString()}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className="text-success">
                                                                            {material.alkansya_consumption.toLocaleString()}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className="text-info">
                                                                            {material.order_consumption.toLocaleString()}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className="fw-bold text-warning">
                                                                            ₱{material.total_cost.toLocaleString()}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className="text-muted">
                                                                            {material.consumption_days} days
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
                                                                ₱{item.value ? item.value.toLocaleString() : '0'}
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

            {/* Forecasting Tab */}
            {activeTab === 'forecast' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaChartLine className="me-2" style={{ color: colors.info }} />
                                    Material Usage Forecasting
                                    {tabLoadingStates.forecast && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.forecast ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-info mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Forecast Data...</h5>
                                        <p className="text-muted">Analyzing usage patterns and generating predictions</p>
                                    </div>
                                ) : forecastReport?.forecast && forecastReport.forecast.length > 0 ? (
                                    <div>
                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h6 className="card-title text-muted">Forecast Accuracy</h6>
                                                        <h3 className="text-primary">{forecastReport.accuracy || 0}%</h3>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h6 className="card-title text-muted">Forecast Period</h6>
                                                        <h3 className="text-info">30 Days</h3>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <ResponsiveContainer width="100%" height={400}>
                                            <LineChart data={forecastReport.forecast}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="predicted" stroke={colors.info} strokeWidth={3} name="Predicted Usage" />
                                                <Line type="monotone" dataKey="actual" stroke={colors.success} strokeWidth={2} name="Actual Usage" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaChartLine className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">No forecast data available</h5>
                                        <p className="text-muted">Forecasting data will appear here once usage patterns are established</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Replenishment Tab */}
            {activeTab === 'replenishment' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaTruck className="me-2" style={{ color: colors.warning }} />
                                    Replenishment Schedule
                                    {tabLoadingStates.replenishment && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.replenishment ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-warning mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Replenishment Data...</h5>
                                        <p className="text-muted">Calculating reorder points and suggested quantities</p>
                                    </div>
                                ) : replenishmentSchedule?.items && replenishmentSchedule.items.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Material</th>
                                                    <th>Current Stock</th>
                                                    <th>Reorder Point</th>
                                                    <th>Suggested Order</th>
                                                    <th>Urgency</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {replenishmentSchedule.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="me-3">
                                                                    <div className="rounded-circle d-flex align-items-center justify-content-center" 
                                                                         style={{ 
                                                                             width: '40px', 
                                                                             height: '40px', 
                                                                             backgroundColor: `${colors.warning}20`,
                                                                             color: colors.warning
                                                                         }}>
                                                                        <FaTruck />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h6 className="mb-0">{item.material}</h6>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`fw-bold ${
                                                                item.current_stock <= 0 ? 'text-danger' :
                                                                item.current_stock <= item.reorder_point ? 'text-warning' :
                                                                'text-success'
                                                            }`}>
                                                                {item.current_stock}
                                                            </span>
                                                        </td>
                                                        <td>{item.reorder_point}</td>
                                                        <td>
                                                            <span className="fw-bold text-primary">{item.suggested_order}</span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${
                                                                item.urgency === 'critical' ? 'bg-danger' :
                                                                item.urgency === 'high' ? 'bg-warning' :
                                                                'bg-info'
                                                            }`}>
                                                                {item.urgency?.toUpperCase() || 'MEDIUM'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button className="btn btn-outline-primary btn-sm">
                                                                <FaTruck className="me-1" />
                                                                Order
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaTruck className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">No replenishment needed</h5>
                                        <p className="text-muted">All materials are currently above reorder points</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaHistory className="me-2" style={{ color: colors.dark }} />
                                    Inventory Transactions
                                    {tabLoadingStates.transactions && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.transactions ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-dark mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Transactions...</h5>
                                        <p className="text-muted">Fetching all inventory transactions</p>
                                    </div>
                                ) : inventoryTransactions?.transactions && inventoryTransactions.transactions.length > 0 ? (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Type</th>
                                                    <th>Material</th>
                                                    <th>Quantity</th>
                                                    <th>Unit Cost</th>
                                                    <th>Total Cost</th>
                                                    <th>Reference</th>
                                                    <th>Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {inventoryTransactions.transactions.map((transaction) => (
                                                <tr key={transaction.id}>
                                                    <td>
                                                        <span className={`badge ${
                                                            transaction.type === 'PURCHASE' ? 'bg-success' :
                                                            transaction.type === 'CONSUMPTION' ? 'bg-danger' :
                                                            'bg-info'
                                                        }`}>
                                                            {transaction.type}
                                                        </span>
                                                    </td>
                                                    <td>{transaction.material}</td>
                                                    <td className={transaction.quantity > 0 ? 'text-success' : 'text-danger'}>
                                                        {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                                                    </td>
                                                    <td>₱{transaction.unit_cost?.toLocaleString() || 'N/A'}</td>
                                                    <td>₱{transaction.total_cost?.toLocaleString() || 'N/A'}</td>
                                                    <td>{transaction.reference}</td>
                                                    <td>{new Date(transaction.timestamp).toLocaleString()}</td>
                                                </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaHistory className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">No transactions recorded</h5>
                                        <p className="text-muted">Inventory transactions will appear here</p>
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
