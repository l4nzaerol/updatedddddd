import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/client";
import { 
  BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, 
  ScatterChart, Scatter, ComposedChart
} from "recharts";
import { 
  FaDollarSign, FaChartLine, FaShoppingCart, FaUsers, 
  FaBoxes, FaClipboardList, FaHistory, FaExclamationTriangle,
  FaDownload, FaSync, FaFilter, FaSearch, FaEye, FaEdit,
  FaChartBar, FaArrowUp, FaPercent, FaCreditCard
} from "react-icons/fa";
import { toast } from "sonner";

const SalesAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");
    const [windowDays, setWindowDays] = useState(30);
    const [refreshKey, setRefreshKey] = useState(0);
    
    // Enhanced data states
    const [dashboardData, setDashboardData] = useState(null);
    const [revenueAnalytics, setRevenueAnalytics] = useState(null);
    const [productPerformance, setProductPerformance] = useState(null);
    const [customerAnalytics, setCustomerAnalytics] = useState(null);
    const [orderAnalytics, setOrderAnalytics] = useState(null);
    const [paymentAnalytics, setPaymentAnalytics] = useState(null);
    const [trendAnalysis, setTrendAnalysis] = useState(null);
    const [salesReports, setSalesReports] = useState(null);
    
    // Loading states for each tab
    const [tabLoadingStates, setTabLoadingStates] = useState({
        overview: false,
        revenue: false,
        products: false,
        customers: false,
        orders: false,
        payments: false,
        trends: false,
        reports: false
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
            const salesAnalyticsData = await safeFetch('/analytics/sales-dashboard', dateRange);

            // Set data with proper fallbacks - using zero values since no actual records exist
            const analyticsData = salesAnalyticsData || { 
                overview: {
                    total_revenue: 0,
                    total_orders: 0,
                    paid_orders: 0,
                    pending_orders: 0,
                    average_order_value: 0,
                    conversion_rate: 0
                },
                revenue_trends: [],
                top_products: [],
                sales_by_status: [],
                payment_method_analysis: [],
                customer_analysis: {
                    new_customers: 0,
                    returning_customers: 0,
                    total_customers: 0,
                    avg_lifetime_value: 0
                },
                monthly_comparison: {
                    current_month: { revenue: 0, orders: 0 },
                    last_month: { revenue: 0, orders: 0 },
                    growth: { revenue_growth: 0, orders_growth: 0 }
                }
            };
            
            setDashboardData(analyticsData);

        } catch (error) {
            console.error('Error fetching sales analytics:', error);
            setError('Failed to load sales analytics. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [windowDays, refreshKey]);

    useEffect(() => {
        fetchAllReports();
    }, [fetchAllReports]);

    const handleGlobalRefresh = () => {
        setRefreshKey(prev => prev + 1);
        toast.success("Sales analytics refreshed successfully!");
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
                    
                case 'revenue':
                    const revenueResponse = await api.get('/analytics/revenue-analytics', { params: dateRange });
                    setRevenueAnalytics(revenueResponse.data);
                        break;
                    
                    case 'products':
                    const productsResponse = await api.get('/analytics/product-performance', { params: dateRange });
                    setProductPerformance(productsResponse.data);
                        break;
                    
                    case 'customers':
                    const customersResponse = await api.get('/analytics/customer-analytics', { params: dateRange });
                    setCustomerAnalytics(customersResponse.data);
                    break;
                    
                case 'orders':
                    const ordersResponse = await api.get('/analytics/order-analytics', { params: dateRange });
                    setOrderAnalytics(ordersResponse.data);
                    break;
                    
                case 'payments':
                    const paymentsResponse = await api.get('/analytics/payment-analytics', { params: dateRange });
                    setPaymentAnalytics(paymentsResponse.data);
                    break;
                    
                case 'trends':
                    const trendsResponse = await api.get('/analytics/trend-analysis', { params: dateRange });
                    setTrendAnalysis(trendsResponse.data);
                        break;
                    
                case 'reports':
                    const reportsResponse = await api.get('/analytics/sales-reports', { params: dateRange });
                    setSalesReports(reportsResponse.data);
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
                    <h5>Loading Sales Analytics...</h5>
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
        <div className="enhanced-sales-analytics">
            {/* Enhanced Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 p-4 bg-gradient text-white rounded-3" 
                 style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}>
                <div>
                    <h2 className="mb-2 d-flex align-items-center">
                        <FaDollarSign className="me-3" />
                        Enhanced Sales Analytics
                    </h2>
                    <p className="mb-0 opacity-90">Comprehensive sales performance and revenue insights</p>
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
                        { id: 'revenue', name: 'Revenue Analytics', icon: FaDollarSign, color: colors.success },
                        { id: 'products', name: 'Product Performance', icon: FaBoxes, color: colors.secondary },
                        { id: 'customers', name: 'Customer Analytics', icon: FaUsers, color: colors.info },
                        { id: 'orders', name: 'Order Analytics', icon: FaShoppingCart, color: colors.accent },
                        { id: 'payments', name: 'Payment Analytics', icon: FaCreditCard, color: colors.warning },
                        { id: 'trends', name: 'Trend Analysis', icon: FaArrowUp, color: colors.danger },
                        { id: 'reports', name: 'Sales Reports', icon: FaClipboardList, color: colors.dark }
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

            {/* Content based on active tab */}
            {activeTab === 'overview' && (
                <div className="row">
                    {/* Key Metrics Cards */}
                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.success}15, ${colors.info}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.success}20` }}>
                                        <FaDollarSign style={{ color: colors.success }} className="fs-4" />
                                        </div>
                                        <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.success }}>
                                            ₱{dashboardData?.overview?.total_revenue?.toLocaleString() || '0'}
                                        </h3>
                                        <small className="text-muted fw-medium">Total Revenue</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    This period
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.primary}15, ${colors.accent}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.primary}20` }}>
                                        <FaShoppingCart style={{ color: colors.primary }} className="fs-4" />
                                        </div>
                                        <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.primary }}>
                                            {dashboardData?.overview?.total_orders || 0}
                                        </h3>
                                        <small className="text-muted fw-medium">Total Orders</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    Orders placed
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.info}15, ${colors.secondary}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.info}20` }}>
                                        <FaChartBar style={{ color: colors.info }} className="fs-4" />
                                        </div>
                                        <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.info }}>
                                            ₱{dashboardData?.overview?.average_order_value?.toLocaleString() || '0'}
                                        </h3>
                                        <small className="text-muted fw-medium">Avg Order Value</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    Per order
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.warning}15, ${colors.accent}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.warning}20` }}>
                                        <FaPercent style={{ color: colors.warning }} className="fs-4" />
                                        </div>
                                        <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.warning }}>
                                            {dashboardData?.overview?.conversion_rate || 0}%
                                        </h3>
                                        <small className="text-muted fw-medium">Conversion Rate</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    Visitor to customer
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Additional Metrics Row */}
                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.danger}15, ${colors.warning}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.danger}20` }}>
                                        <FaUsers style={{ color: colors.danger }} className="fs-4" />
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.danger }}>
                                            {dashboardData?.customer_analysis?.total_customers || 0}
                                        </h3>
                                        <small className="text-muted fw-medium">Total Customers</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    {dashboardData?.customer_analysis?.new_customers || 0} new, {dashboardData?.customer_analysis?.returning_customers || 0} returning
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.info}15, ${colors.primary}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.info}20` }}>
                                        <FaCreditCard style={{ color: colors.info }} className="fs-4" />
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.info }}>
                                            {dashboardData?.overview?.paid_orders || 0}
                                        </h3>
                                        <small className="text-muted fw-medium">Paid Orders</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    {dashboardData?.overview?.pending_orders || 0} pending
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.accent}15, ${colors.secondary}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.accent}20` }}>
                                        <FaArrowUp style={{ color: colors.accent }} className="fs-4" />
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.accent }}>
                                            {dashboardData?.monthly_comparison?.growth?.revenue_growth || 0}%
                                        </h3>
                                        <small className="text-muted fw-medium">Revenue Growth</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    vs last month
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.dark}15, ${colors.primary}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.dark}20` }}>
                                        <FaDollarSign style={{ color: colors.dark }} className="fs-4" />
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.dark }}>
                                            ₱{dashboardData?.customer_analysis?.avg_lifetime_value?.toLocaleString() || '0'}
                                        </h3>
                                        <small className="text-muted fw-medium">Avg Customer Value</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    Lifetime value
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="col-lg-8 mb-4">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaChartLine className="me-2" style={{ color: colors.primary }} />
                                    Revenue Trends Overview
                                </h5>
                            </div>
                            <div className="card-body">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={dashboardData?.revenue_trends || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']} />
                                        <Legend />
                                        <Line type="monotone" dataKey="revenue" stroke={colors.success} name="Daily Revenue" />
                                        <Line type="monotone" dataKey="orders" stroke={colors.primary} name="Orders" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Sales Status Chart */}
                    <div className="col-lg-4 mb-4">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaChartBar className="me-2" style={{ color: colors.secondary }} />
                                    Sales by Status
                                </h5>
                            </div>
                            <div className="card-body">
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={dashboardData?.sales_by_status || []}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="count"
                                        >
                                            {(dashboardData?.sales_by_status || []).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method Analysis */}
                    <div className="col-lg-6 mb-4">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaCreditCard className="me-2" style={{ color: colors.warning }} />
                                    Payment Methods
                                </h5>
                            </div>
                            <div className="card-body">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={dashboardData?.payment_method_analysis || []}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="payment_method" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']} />
                                        <Legend />
                                        <Bar dataKey="revenue" fill={colors.warning} name="Revenue" />
                                        <Bar dataKey="count" fill={colors.accent} name="Order Count" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Comparison */}
                    <div className="col-lg-6 mb-4">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaArrowUp className="me-2" style={{ color: colors.danger }} />
                                    Monthly Comparison
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-6 text-center">
                                        <h6 className="text-muted mb-2">Current Month</h6>
                                        <h4 className="text-success mb-1">
                                            ₱{dashboardData?.monthly_comparison?.current_month?.revenue?.toLocaleString() || '0'}
                                        </h4>
                                        <small className="text-muted">
                                            {dashboardData?.monthly_comparison?.current_month?.orders || 0} orders
                                        </small>
                                    </div>
                                    <div className="col-6 text-center">
                                        <h6 className="text-muted mb-2">Last Month</h6>
                                        <h4 className="text-primary mb-1">
                                            ₱{dashboardData?.monthly_comparison?.last_month?.revenue?.toLocaleString() || '0'}
                                        </h4>
                                        <small className="text-muted">
                                            {dashboardData?.monthly_comparison?.last_month?.orders || 0} orders
                                        </small>
                                    </div>
                                </div>
                                <hr />
                                <div className="row">
                                    <div className="col-6 text-center">
                                        <h6 className="text-muted mb-2">Revenue Growth</h6>
                                        <h4 className={`mb-0 ${(dashboardData?.monthly_comparison?.growth?.revenue_growth || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {dashboardData?.monthly_comparison?.growth?.revenue_growth || 0}%
                                        </h4>
                                    </div>
                                    <div className="col-6 text-center">
                                        <h6 className="text-muted mb-2">Order Growth</h6>
                                        <h4 className={`mb-0 ${(dashboardData?.monthly_comparison?.growth?.orders_growth || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {dashboardData?.monthly_comparison?.growth?.orders_growth || 0}%
                                        </h4>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Products */}
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaBoxes className="me-2" style={{ color: colors.secondary }} />
                                    Top Performing Products
                                </h5>
                            </div>
                            <div className="card-body">
                                {dashboardData?.top_products && dashboardData.top_products.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={dashboardData.top_products}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']} />
                                            <Legend />
                                            <Bar dataKey="total_revenue" fill={colors.primary} name="Revenue" />
                                            <Bar dataKey="total_quantity" fill={colors.accent} name="Quantity Sold" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaBoxes className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">No Product Sales Data</h5>
                                        <p className="text-muted">Product performance data will appear here when orders are placed</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Revenue Analytics Tab */}
            {activeTab === 'revenue' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaDollarSign className="me-2" style={{ color: colors.success }} />
                                    Revenue Analytics
                                    {tabLoadingStates.revenue && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                        </div>
                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.revenue ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-success mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Revenue Data...</h5>
                                        <p className="text-muted">Analyzing revenue trends and performance metrics</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaDollarSign className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">Revenue Analytics</h5>
                                        <p className="text-muted">Detailed revenue analysis will appear here</p>
                        </div>
                                )}
                        </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Performance Tab */}
            {activeTab === 'products' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaBoxes className="me-2" style={{ color: colors.secondary }} />
                                    Product Performance Analysis
                                    {tabLoadingStates.products && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.products ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-secondary mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Product Data...</h5>
                                        <p className="text-muted">Analyzing product performance and sales metrics</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaBoxes className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">Product Performance</h5>
                                        <p className="text-muted">Product sales analysis will appear here</p>
                        </div>
                    )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Analytics Tab */}
            {activeTab === 'customers' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaUsers className="me-2" style={{ color: colors.info }} />
                                    Customer Analytics
                                    {tabLoadingStates.customers && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                        </div>
                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.customers ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-info mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Customer Data...</h5>
                                        <p className="text-muted">Analyzing customer behavior and preferences</p>
                        </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaUsers className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">Customer Analytics</h5>
                                        <p className="text-muted">Customer insights and behavior analysis will appear here</p>
                        </div>
                                )}
                        </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Analytics Tab */}
            {activeTab === 'orders' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaShoppingCart className="me-2" style={{ color: colors.accent }} />
                                    Order Analytics
                                    {tabLoadingStates.orders && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.orders ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-accent mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Order Data...</h5>
                                        <p className="text-muted">Analyzing order patterns and fulfillment metrics</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaShoppingCart className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">Order Analytics</h5>
                                        <p className="text-muted">Order tracking and analysis will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                        </div>
                    )}

            {/* Payment Analytics Tab */}
            {activeTab === 'payments' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaCreditCard className="me-2" style={{ color: colors.warning }} />
                                    Payment Analytics
                                    {tabLoadingStates.payments && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.payments ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-warning mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Payment Data...</h5>
                                        <p className="text-muted">Analyzing payment methods and transaction patterns</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaCreditCard className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">Payment Analytics</h5>
                                        <p className="text-muted">Payment method analysis will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Trend Analysis Tab */}
            {activeTab === 'trends' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaArrowUp className="me-2" style={{ color: colors.danger }} />
                                    Trend Analysis
                                    {tabLoadingStates.trends && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.trends ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-danger mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Trend Data...</h5>
                                        <p className="text-muted">Analyzing sales trends and seasonal patterns</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaArrowUp className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">Trend Analysis</h5>
                                        <p className="text-muted">Sales trend analysis will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                        </div>
                    )}

            {/* Sales Reports Tab */}
            {activeTab === 'reports' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaClipboardList className="me-2" style={{ color: colors.dark }} />
                                    Sales Reports
                                    {tabLoadingStates.reports && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.reports ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-dark mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Reports...</h5>
                                        <p className="text-muted">Generating comprehensive sales reports</p>
                                </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaClipboardList className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">Sales Reports</h5>
                                        <p className="text-muted">Detailed sales reports will appear here</p>
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

export default SalesAnalytics;