import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/client";
import { 
  BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, 
  ScatterChart, Scatter, ComposedChart
} from "recharts";
import { 
  FaIndustry, FaChartLine, FaClipboardList, FaHistory, 
  FaTruck, FaExclamationTriangle, FaCheckCircle,
  FaDownload, FaSync, FaFilter, FaSearch, FaEye, FaEdit,
  FaCogs, FaUsers, FaBoxes, FaChartBar
} from "react-icons/fa";
import { toast } from "sonner";

const ProductionReports = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");
    const [windowDays, setWindowDays] = useState(30);
    const [refreshKey, setRefreshKey] = useState(0);
    
    // Enhanced data states
    const [dashboardData, setDashboardData] = useState(null);
    const [productionOverview, setProductionOverview] = useState(null);
    const [productionOutput, setProductionOutput] = useState(null);
    const [madeToOrderStatus, setMadeToOrderStatus] = useState(null);
    const [alkansyaDailyOutput, setAlkansyaDailyOutput] = useState(null);
    const [productionAnalytics, setProductionAnalytics] = useState(null);
    const [efficiencyMetrics, setEfficiencyMetrics] = useState(null);
    const [resourceUtilization, setResourceUtilization] = useState(null);
    const [stageBreakdown, setStageBreakdown] = useState(null);
    
    // New accurate data states
    const [alkansyaProductionData, setAlkansyaProductionData] = useState(null);
    const [madeToOrderProductionData, setMadeToOrderProductionData] = useState(null);
    const [productionOutputData, setProductionOutputData] = useState(null);
    
    // Loading states for each tab
    const [tabLoadingStates, setTabLoadingStates] = useState({
        overview: false,
        output: false,
        madeToOrder: false,
        alkansya: false,
        analytics: false,
        efficiency: false,
        utilization: false,
        stages: false
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
            const productionAnalyticsData = await safeFetch('/production/analytics', dateRange);

            // Set data with proper fallbacks
            const analyticsData = productionAnalyticsData || { 
                in_progress: [], 
                completed_today: 0, 
                efficiency: 0, 
                average_cycle_time: 0 
            };
            
            setDashboardData({
                total_productions: analyticsData.in_progress?.length || 0,
                completed_today: analyticsData.completed_today || 0,
                efficiency: analyticsData.efficiency || 0,
                average_cycle_time: analyticsData.average_cycle_time || 0,
                in_progress_productions: analyticsData.in_progress || []
            });
            
            setProductionAnalytics(analyticsData);

        } catch (error) {
            console.error('Error fetching production reports:', error);
            setError('Failed to load production reports. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [windowDays, refreshKey]);

    useEffect(() => {
        fetchAllReports();
    }, [fetchAllReports]);

    const handleGlobalRefresh = () => {
        setRefreshKey(prev => prev + 1);
        toast.success("Production reports refreshed successfully!");
    };

    // Fetch production overview data
    const fetchProductionOverview = async () => {
        setTabLoadingStates(prev => ({ ...prev, overview: true }));
        
        try {
            const params = {
                start_date: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
            };

            const response = await api.get('/production/overview', { params });
            setProductionOverview(response.data);

        } catch (error) {
            console.error('Error fetching production overview:', error);
            toast.error('Failed to load production overview data');
        } finally {
            setTabLoadingStates(prev => ({ ...prev, overview: false }));
        }
    };

    // Fetch Alkansya production data
    const fetchAlkansyaProductionData = async () => {
        setTabLoadingStates(prev => ({ ...prev, alkansya: true }));
        
        try {
            const params = {
                start_date: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
            };

            const response = await api.get('/production/alkansya-data', { params });
            setAlkansyaProductionData(response.data);

        } catch (error) {
            console.error('Error fetching Alkansya production data:', error);
            toast.error('Failed to load Alkansya production data');
        } finally {
            setTabLoadingStates(prev => ({ ...prev, alkansya: false }));
        }
    };

    // Fetch Made-to-Order production data
    const fetchMadeToOrderProductionData = async () => {
        setTabLoadingStates(prev => ({ ...prev, madeToOrder: true }));
        
        try {
            const params = {
                start_date: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
            };

            const response = await api.get('/production/made-to-order-data', { params });
            setMadeToOrderProductionData(response.data);

        } catch (error) {
            console.error('Error fetching Made-to-Order production data:', error);
            toast.error('Failed to load Made-to-Order production data');
        } finally {
            setTabLoadingStates(prev => ({ ...prev, madeToOrder: false }));
        }
    };

    // Fetch production output analytics
    const fetchProductionOutputData = async () => {
        setTabLoadingStates(prev => ({ ...prev, output: true }));
        
        try {
            const params = {
                start_date: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
            };

            const response = await api.get('/production/output-analytics', { params });
            setProductionOutputData(response.data);

        } catch (error) {
            console.error('Error fetching production output data:', error);
            toast.error('Failed to load production output data');
        } finally {
            setTabLoadingStates(prev => ({ ...prev, output: false }));
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
                    // Use enhanced production overview
                    await fetchProductionOverview();
                    break;
                    
                case 'output':
                    // Use accurate production output analytics
                    await fetchProductionOutputData();
                    break;
                    
                case 'madeToOrder':
                    // Use accurate Made-to-Order production data
                    await fetchMadeToOrderProductionData();
                    break;
                    
                case 'alkansya':
                    // Use accurate Alkansya production data
                    await fetchAlkansyaProductionData();
                    break;
                    
                case 'analytics':
                    const analyticsResponse = await api.get('/production/analytics', { params: dateRange });
                    setProductionAnalytics(analyticsResponse.data);
                    break;
                    
                case 'efficiency':
                    const efficiencyResponse = await api.get('/production/efficiency-metrics', { params: dateRange });
                    setEfficiencyMetrics(efficiencyResponse.data);
                    break;
                    
                case 'utilization':
                    const utilizationResponse = await api.get('/production/resource-utilization', { params: dateRange });
                    setResourceUtilization(utilizationResponse.data);
                    break;
                    
                case 'stages':
                    const stagesResponse = await api.get('/production/stage-breakdown', { params: dateRange });
                    setStageBreakdown(stagesResponse.data);
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
                    <h5>Loading Production Reports...</h5>
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
        <div className="enhanced-production-reports">
            {/* Enhanced Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 p-4 bg-gradient text-white rounded-3" 
                 style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}>
                <div>
                    <h2 className="mb-2 d-flex align-items-center">
                        <FaIndustry className="me-3" />
                        Enhanced Production Analytics
                    </h2>
                    <p className="mb-0 opacity-90">Comprehensive production management and performance tracking</p>
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
                        { id: 'output', name: 'Production Output', icon: FaIndustry, color: colors.secondary },
                        { id: 'madeToOrder', name: 'Made-to-Order', icon: FaClipboardList, color: colors.accent },
                        { id: 'alkansya', name: 'Alkansya Output', icon: FaBoxes, color: colors.success },
                        { id: 'analytics', name: 'Analytics', icon: FaChartBar, color: colors.info },
                        { id: 'efficiency', name: 'Efficiency', icon: FaChartLine, color: colors.warning },
                        { id: 'utilization', name: 'Resources', icon: FaCogs, color: colors.dark },
                        { id: 'stages', name: 'Stages', icon: FaHistory, color: colors.danger }
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

            {/* Enhanced Production Overview Tab */}
            {activeTab === 'overview' && (
                <div className="row">
                    {tabLoadingStates.overview ? (
                        <div className="col-12">
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary mb-3" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <h5>Loading Production Overview...</h5>
                                <p className="text-muted">Analyzing Alkansya and Made-to-Order production data</p>
                            </div>
                        </div>
                    ) : productionOverview ? (
                        <>
                            {/* Overall Production Metrics */}
                            <div className="col-12 mb-4">
                                <div className="row">
                                    <div className="col-lg-3 col-md-6 mb-4">
                                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}15)` }}>
                                            <div className="card-body text-center p-4">
                                                <div className="d-flex align-items-center justify-content-center mb-3">
                                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.primary}20` }}>
                                                        <FaIndustry style={{ color: colors.primary }} className="fs-4" />
                                                    </div>
                                                    <div>
                                                        <h3 className="mb-0 fw-bold" style={{ color: colors.primary }}>
                                                            {productionOverview.overall.total_units_produced || 0}
                                                        </h3>
                                                        <small className="text-muted fw-medium">Total Units Produced</small>
                                                    </div>
                                                </div>
                                                <p className="text-muted small mb-0">
                                                    Last {windowDays} days
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-3 col-md-6 mb-4">
                                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.success}15, ${colors.info}15)` }}>
                                            <div className="card-body text-center p-4">
                                                <div className="d-flex align-items-center justify-content-center mb-3">
                                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.success}20` }}>
                                                        <FaBoxes style={{ color: colors.success }} className="fs-4" />
                                                    </div>
                                                    <div>
                                                        <h3 className="mb-0 fw-bold" style={{ color: colors.success }}>
                                                            {productionOverview.alkansya.total_units_produced || 0}
                                                        </h3>
                                                        <small className="text-muted fw-medium">Alkansya Units</small>
                                                    </div>
                                                </div>
                                                <p className="text-muted small mb-0">
                                                    Daily production output
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-3 col-md-6 mb-4">
                                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.accent}15, ${colors.warning}15)` }}>
                                            <div className="card-body text-center p-4">
                                                <div className="d-flex align-items-center justify-content-center mb-3">
                                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.accent}20` }}>
                                                        <FaClipboardList style={{ color: colors.accent }} className="fs-4" />
                                                    </div>
                                                    <div>
                                                        <h3 className="mb-0 fw-bold" style={{ color: colors.accent }}>
                                                            {productionOverview.made_to_order.total_products_ordered || 0}
                                                        </h3>
                                                        <small className="text-muted fw-medium">Made-to-Order Units</small>
                                                    </div>
                                                </div>
                                                <p className="text-muted small mb-0">
                                                    Custom order products
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-3 col-md-6 mb-4">
                                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.info}15, ${colors.primary}15)` }}>
                                            <div className="card-body text-center p-4">
                                                <div className="d-flex align-items-center justify-content-center mb-3">
                                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.info}20` }}>
                                                        <FaChartLine style={{ color: colors.info }} className="fs-4" />
                                                    </div>
                                                    <div>
                                                        <h3 className="mb-0 fw-bold" style={{ color: colors.info }}>
                                                            {productionOverview.overall.production_efficiency || 0}%
                                                        </h3>
                                                        <small className="text-muted fw-medium">Efficiency</small>
                                                    </div>
                                                </div>
                                                <p className="text-muted small mb-0">
                                                    Overall production efficiency
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Product Type Breakdown */}
                            <div className="col-12 mb-4">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="card border-0 shadow-sm h-100">
                                            <div className="card-header bg-white border-0">
                                                <h5 className="mb-0 d-flex align-items-center">
                                                    <FaBoxes className="me-2" style={{ color: colors.success }} />
                                                    Alkansya Production Overview
                                                </h5>
                                            </div>
                                            <div className="card-body">
                                                <div className="row mb-3">
                                                    <div className="col-6">
                                                        <div className="text-center">
                                                            <h4 className="text-success mb-1">{productionOverview.alkansya.average_daily_output || 0}</h4>
                                                            <small className="text-muted">Avg Daily Output</small>
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div className="text-center">
                                                            <h4 className="text-info mb-1">{productionOverview.alkansya.total_days || 0}</h4>
                                                            <small className="text-muted">Production Days</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mb-3">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span>Production Trend</span>
                                                        <span className={`badge ${
                                                            productionOverview.alkansya.production_trend === 'increasing' ? 'bg-success' :
                                                            productionOverview.alkansya.production_trend === 'decreasing' ? 'bg-danger' :
                                                            'bg-secondary'
                                                        }`}>
                                                            {productionOverview.alkansya.production_trend || 'stable'}
                                                        </span>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span>Max Daily Output</span>
                                                        <span className="fw-bold">{productionOverview.alkansya.max_daily_output || 0}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between">
                                                        <span>Min Daily Output</span>
                                                        <span className="fw-bold">{productionOverview.alkansya.min_daily_output || 0}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-3">
                                                    <h6 className="text-muted mb-2">Recent Production</h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-sm">
                                                            <thead>
                                                                <tr>
                                                                    <th>Date</th>
                                                                    <th>Units</th>
                                                                    <th>By</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {productionOverview.alkansya.recent_output?.slice(0, 5).map((output, index) => (
                                                                    <tr key={index}>
                                                                        <td>{output.date}</td>
                                                                        <td className="text-success fw-bold">{output.quantity}</td>
                                                                        <td className="text-muted">{output.produced_by}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="card border-0 shadow-sm h-100">
                                            <div className="card-header bg-white border-0">
                                                <h5 className="mb-0 d-flex align-items-center">
                                                    <FaClipboardList className="me-2" style={{ color: colors.accent }} />
                                                    Made-to-Order Overview
                                                </h5>
                                            </div>
                                            <div className="card-body">
                                                <div className="row mb-3">
                                                    <div className="col-6">
                                                        <div className="text-center">
                                                            <h4 className="text-accent mb-1">{productionOverview.made_to_order.total_orders || 0}</h4>
                                                            <small className="text-muted">Total Orders</small>
                                                        </div>
                                                    </div>
                                                    <div className="col-6">
                                                        <div className="text-center">
                                                            <h4 className="text-info mb-1">₱{productionOverview.made_to_order.total_revenue?.toLocaleString() || 0}</h4>
                                                            <small className="text-muted">Total Revenue</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mb-3">
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span>Unique Products</span>
                                                        <span className="fw-bold">{productionOverview.made_to_order.unique_products || 0}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span>Avg Order Value</span>
                                                        <span className="fw-bold">₱{productionOverview.made_to_order.average_order_value?.toLocaleString() || 0}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-3">
                                                    <h6 className="text-muted mb-2">Order Status Breakdown</h6>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span>Completed</span>
                                                        <span className="badge bg-success">{productionOverview.made_to_order.order_status_breakdown?.completed || 0}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span>In Progress</span>
                                                        <span className="badge bg-warning">{productionOverview.made_to_order.order_status_breakdown?.in_progress || 0}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between mb-1">
                                                        <span>Pending</span>
                                                        <span className="badge bg-info">{productionOverview.made_to_order.order_status_breakdown?.pending || 0}</span>
                                                    </div>
                                                    <div className="d-flex justify-content-between">
                                                        <span>Cancelled</span>
                                                        <span className="badge bg-danger">{productionOverview.made_to_order.order_status_breakdown?.cancelled || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Production Charts */}
                            <div className="col-12 mb-4">
                                <div className="card border-0 shadow-sm">
                                    <div className="card-header bg-white border-0">
                                        <h5 className="mb-0 d-flex align-items-center">
                                            <FaChartLine className="me-2" style={{ color: colors.primary }} />
                                            Daily Production Comparison
                                        </h5>
                                    </div>
                                    <div className="card-body">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={productionOverview.daily_summary}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="alkansya_units" stroke={colors.success} strokeWidth={2} name="Alkansya Units" />
                                                <Line type="monotone" dataKey="made_to_order_units" stroke={colors.accent} strokeWidth={2} name="Made-to-Order Units" />
                                                <Line type="monotone" dataKey="total_units" stroke={colors.primary} strokeWidth={2} name="Total Units" />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Material Utilization */}
                            <div className="col-12 mb-4">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="card border-0 shadow-sm">
                                            <div className="card-header bg-white border-0">
                                                <h6 className="mb-0">Material Utilization Breakdown</h6>
                                            </div>
                                            <div className="card-body">
                                                <ResponsiveContainer width="100%" height={200}>
                                                    <PieChart>
                                                        <Pie
                                                            data={[
                                                                { name: 'Alkansya', value: productionOverview.overall.material_utilization?.alkansya_percentage || 0, color: colors.success },
                                                                { name: 'Made-to-Order', value: productionOverview.overall.material_utilization?.made_to_order_percentage || 0, color: colors.accent }
                                                            ]}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                            outerRadius={60}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                        >
                                                            {[
                                                                { name: 'Alkansya', value: productionOverview.overall.material_utilization?.alkansya_percentage || 0, color: colors.success },
                                                                { name: 'Made-to-Order', value: productionOverview.overall.material_utilization?.made_to_order_percentage || 0, color: colors.accent }
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
                                    <div className="col-md-6">
                                        <div className="card border-0 shadow-sm">
                                            <div className="card-header bg-white border-0">
                                                <h6 className="mb-0">Production Distribution</h6>
                                            </div>
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between mb-3">
                                                    <span>Alkansya Production</span>
                                                    <span className="badge bg-success fs-6">
                                                        {productionOverview.overall.production_breakdown?.alkansya_percentage || 0}%
                                                    </span>
                                                </div>
                                                <div className="progress mb-3" style={{ height: '20px' }}>
                                                    <div 
                                                        className="progress-bar bg-success" 
                                                        style={{ 
                                                            width: `${productionOverview.overall.production_breakdown?.alkansya_percentage || 0}%` 
                                                        }}
                                                    ></div>
                                                </div>
                                                <div className="d-flex justify-content-between mb-3">
                                                    <span>Made-to-Order Production</span>
                                                    <span className="badge bg-accent fs-6">
                                                        {productionOverview.overall.production_breakdown?.made_to_order_percentage || 0}%
                                                    </span>
                                                </div>
                                                <div className="progress" style={{ height: '20px' }}>
                                                    <div 
                                                        className="progress-bar" 
                                                        style={{ 
                                                            width: `${productionOverview.overall.production_breakdown?.made_to_order_percentage || 0}%`,
                                                            backgroundColor: colors.accent
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="col-12">
                            <div className="text-center py-5">
                                <FaIndustry className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                <h5 className="text-muted">No Production Data Available</h5>
                                <p className="text-muted">Production overview data will appear here once production activities are recorded</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Enhanced Production Output Tab */}
            {activeTab === 'output' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaIndustry className="me-2" style={{ color: colors.secondary }} />
                                    Production Output Analysis
                                    {tabLoadingStates.output && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.output ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-secondary mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Production Output Data...</h5>
                                        <p className="text-muted">Analyzing accurate production performance and output trends</p>
                                    </div>
                                ) : productionOutputData ? (
                                    <div>
                                        {/* Key Metrics */}
                                        <div className="row mb-4">
                                            <div className="col-lg-3 col-md-6 mb-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h4 className="text-primary mb-1">{productionOutputData.metrics.total_units_produced || 0}</h4>
                                                        <small className="text-muted">Total Units Produced</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6 mb-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h4 className="text-success mb-1">{productionOutputData.metrics.alkansya_units || 0}</h4>
                                                        <small className="text-muted">Alkansya Units</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6 mb-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h4 className="text-accent mb-1">{productionOutputData.metrics.made_to_order_units || 0}</h4>
                                                        <small className="text-muted">Made-to-Order Units</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6 mb-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h4 className="text-info mb-1">{productionOutputData.metrics.production_days || 0}</h4>
                                                        <small className="text-muted">Production Days</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Production Breakdown */}
                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="mb-0">Production Statistics</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Order Days</span>
                                                            <span className="fw-bold">{productionOutputData.metrics.order_days || 0}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Avg Daily Alkansya</span>
                                                            <span className="fw-bold text-success">{productionOutputData.metrics.average_daily_alkansya || 0}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span>Avg Daily Orders</span>
                                                            <span className="fw-bold text-accent">{productionOutputData.metrics.average_daily_orders || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="mb-0">Efficiency Analysis</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Alkansya Consistency</span>
                                                            <span className="fw-bold text-success">{productionOutputData.efficiency_analysis?.alkansya_consistency || 0}%</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Order Completion</span>
                                                            <span className="fw-bold text-accent">{productionOutputData.efficiency_analysis?.order_completion_rate || 0}%</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span>Overall Efficiency</span>
                                                            <span className="fw-bold text-primary">{productionOutputData.efficiency_analysis?.overall_efficiency || 0}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Daily Production Chart */}
                                        <div className="row mb-4">
                                            <div className="col-12">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="mb-0">Daily Production Output</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <LineChart data={productionOutputData.daily_summary}>
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis dataKey="date" />
                                                                <YAxis />
                                                                <Tooltip />
                                                                <Legend />
                                                                <Line type="monotone" dataKey="alkansya_units" stroke={colors.success} strokeWidth={2} name="Alkansya Units" />
                                                                <Line type="monotone" dataKey="made_to_order_units" stroke={colors.accent} strokeWidth={2} name="Made-to-Order Units" />
                                                                <Line type="monotone" dataKey="total_units" stroke={colors.primary} strokeWidth={2} name="Total Units" />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Weekly Trends */}
                                        <div className="row mb-4">
                                            <div className="col-12">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="mb-0">Weekly Production Trends</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <BarChart data={productionOutputData.weekly_trends}>
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis dataKey="week" />
                                                                <YAxis />
                                                                <Tooltip />
                                                                <Legend />
                                                                <Bar dataKey="alkansya_units" fill={colors.success} name="Alkansya Units" />
                                                                <Bar dataKey="made_to_order_units" fill={colors.accent} name="Made-to-Order Units" />
                                                                <Bar dataKey="total_units" fill={colors.primary} name="Total Units" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Production Stability */}
                                        <div className="row">
                                            <div className="col-12">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="mb-0">Production Stability Analysis</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="row">
                                                            <div className="col-md-4">
                                                                <div className="text-center">
                                                                    <h5 className={`${
                                                                        productionOutputData.efficiency_analysis?.production_stability === 'high' ? 'text-success' :
                                                                        productionOutputData.efficiency_analysis?.production_stability === 'medium' ? 'text-warning' :
                                                                        'text-danger'
                                                                    }`}>
                                                                        {productionOutputData.efficiency_analysis?.production_stability?.toUpperCase() || 'LOW'}
                                                                    </h5>
                                                                    <small className="text-muted">Production Stability</small>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="text-center">
                                                                    <h5 className={`${
                                                                        productionOutputData.efficiency_analysis?.alkansya_trend === 'increasing' ? 'text-success' :
                                                                        productionOutputData.efficiency_analysis?.alkansya_trend === 'decreasing' ? 'text-danger' :
                                                                        'text-info'
                                                                    }`}>
                                                                        {productionOutputData.efficiency_analysis?.alkansya_trend?.toUpperCase() || 'STABLE'}
                                                                    </h5>
                                                                    <small className="text-muted">Alkansya Trend</small>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="text-center">
                                                                    <h5 className="text-success">
                                                                        {productionOutputData.efficiency_analysis?.order_completion_rate || 0}%
                                                                    </h5>
                                                                    <small className="text-muted">Order Completion Rate</small>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaIndustry className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">No Production Output Data</h5>
                                        <p className="text-muted">Production output data will appear here once production activities are recorded</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Made-to-Order Tab */}
            {activeTab === 'madeToOrder' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaClipboardList className="me-2" style={{ color: colors.accent }} />
                                    Made-to-Order Production Status
                                    {tabLoadingStates.madeToOrder && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.madeToOrder ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-accent mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Made-to-Order Data...</h5>
                                        <p className="text-muted">Fetching accurate accepted order production status</p>
                                    </div>
                                ) : madeToOrderProductionData ? (
                                    <div>
                                        {/* Key Metrics */}
                                        <div className="row mb-4">
                                            <div className="col-lg-3 col-md-6 mb-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h4 className="text-accent mb-1">{madeToOrderProductionData.metrics.total_accepted_orders || 0}</h4>
                                                        <small className="text-muted">Accepted Orders</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6 mb-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h4 className="text-success mb-1">{madeToOrderProductionData.metrics.total_products_ordered || 0}</h4>
                                                        <small className="text-muted">Products Ordered</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6 mb-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h4 className="text-info mb-1">₱{madeToOrderProductionData.metrics.total_revenue?.toLocaleString() || 0}</h4>
                                                        <small className="text-muted">Total Revenue</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6 mb-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h4 className="text-warning mb-1">{madeToOrderProductionData.metrics.unique_customers || 0}</h4>
                                                        <small className="text-muted">Unique Customers</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Order Analytics */}
                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="mb-0">Order Analytics</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Average Order Value</span>
                                                            <span className="fw-bold">₱{madeToOrderProductionData.metrics.average_order_value?.toLocaleString() || 0}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Unique Products</span>
                                                            <span className="fw-bold">{madeToOrderProductionData.metrics.unique_products || 0}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span>Avg Products per Order</span>
                                                            <span className="fw-bold">{madeToOrderProductionData.metrics.average_products_per_order || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="mb-0">Customer Analysis</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Total Customers</span>
                                                            <span className="fw-bold">{madeToOrderProductionData.customer_analysis?.total_customers || 0}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Repeat Customers</span>
                                                            <span className="fw-bold text-success">{madeToOrderProductionData.customer_analysis?.repeat_customers || 0}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span>New Customers</span>
                                                            <span className="fw-bold text-info">{madeToOrderProductionData.customer_analysis?.new_customers || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Daily Orders Chart */}
                                        <div className="row mb-4">
                                            <div className="col-12">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="mb-0">Daily Order Trends</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <LineChart data={madeToOrderProductionData.daily_order_summary}>
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis dataKey="date" />
                                                                <YAxis />
                                                                <Tooltip />
                                                                <Legend />
                                                                <Line type="monotone" dataKey="order_count" stroke={colors.accent} strokeWidth={2} name="Orders" />
                                                                <Line type="monotone" dataKey="total_units" stroke={colors.success} strokeWidth={2} name="Units" />
                                                                <Line type="monotone" dataKey="total_revenue" stroke={colors.info} strokeWidth={2} name="Revenue" />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Product Breakdown */}
                                        <div className="row mb-4">
                                            <div className="col-12">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="mb-0">Product Performance</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="table-responsive">
                                                            <table className="table table-hover">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Product Name</th>
                                                                        <th>Total Ordered</th>
                                                                        <th>Total Revenue</th>
                                                                        <th>Order Count</th>
                                                                        <th>Avg per Order</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {madeToOrderProductionData.product_breakdown?.map((product, index) => (
                                                                        <tr key={index}>
                                                                            <td className="fw-bold">{product.product_name}</td>
                                                                            <td className="text-success fw-bold">{product.total_ordered}</td>
                                                                            <td>₱{product.total_revenue?.toLocaleString() || 0}</td>
                                                                            <td>
                                                                                <span className="badge bg-info">{product.order_count}</span>
                                                                            </td>
                                                                            <td>{product.average_quantity_per_order}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Recent Orders */}
                                        <div className="row">
                                            <div className="col-12">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="mb-0">Recent Accepted Orders</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="table-responsive">
                                                            <table className="table table-hover">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Order ID</th>
                                                                        <th>Customer</th>
                                                                        <th>Total Amount</th>
                                                                        <th>Status</th>
                                                                        <th>Date</th>
                                                                        <th>Items</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {madeToOrderProductionData.recent_orders?.map((order, index) => (
                                                                        <tr key={index}>
                                                                            <td className="fw-bold">#{order.id}</td>
                                                                            <td>
                                                                                <div>
                                                                                    <div className="fw-bold">{order.customer_name}</div>
                                                                                    <small className="text-muted">{order.customer_email}</small>
                                                                                </div>
                                                                            </td>
                                                                            <td className="text-success fw-bold">₱{order.total_amount?.toLocaleString() || 0}</td>
                                                                            <td>
                                                                                <span className="badge bg-success">{order.status}</span>
                                                                            </td>
                                                                            <td>{order.created_at}</td>
                                                                            <td>
                                                                                <div className="small">
                                                                                    {order.items?.map((item, itemIndex) => (
                                                                                        <div key={itemIndex} className="mb-1">
                                                                                            {item.product_name} x{item.quantity}
                                                                                        </div>
                                                                                    ))}
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
                                        </div>

                                        {/* Materials Required */}
                                        {madeToOrderProductionData.materials_required?.length > 0 && (
                                            <div className="row mt-4">
                                                <div className="col-12">
                                                    <div className="card">
                                                        <div className="card-header">
                                                            <h6 className="mb-0">Materials Required for Orders</h6>
                                                        </div>
                                                        <div className="card-body">
                                                            <div className="table-responsive">
                                                                <table className="table table-sm">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Material</th>
                                                                            <th>Code</th>
                                                                            <th>Quantity Required</th>
                                                                            <th>Unit</th>
                                                                            <th>Cost per Unit</th>
                                                                            <th>Total Cost</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {madeToOrderProductionData.materials_required.map((material, index) => (
                                                                            <tr key={index}>
                                                                                <td>{material.material_name}</td>
                                                                                <td>{material.material_code}</td>
                                                                                <td className="text-accent fw-bold">{material.quantity_required}</td>
                                                                                <td>{material.unit}</td>
                                                                                <td>₱{material.cost_per_unit?.toLocaleString() || 0}</td>
                                                                                <td>₱{material.total_cost?.toLocaleString() || 0}</td>
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
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaClipboardList className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">No Made-to-Order Data</h5>
                                        <p className="text-muted">Made-to-Order production data will appear here once orders are accepted</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Alkansya Daily Output Tab */}
            {activeTab === 'alkansya' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaBoxes className="me-2" style={{ color: colors.success }} />
                                    Alkansya Daily Output Reports
                                    {tabLoadingStates.alkansya && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.alkansya ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-success mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Alkansya Production Data...</h5>
                                        <p className="text-muted">Fetching accurate daily Alkansya production records</p>
                                    </div>
                                ) : alkansyaProductionData ? (
                                    <div>
                                        {/* Key Metrics */}
                                        <div className="row mb-4">
                                            <div className="col-lg-3 col-md-6 mb-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h4 className="text-success mb-1">{alkansyaProductionData.metrics.total_units_produced || 0}</h4>
                                                        <small className="text-muted">Total Units Produced</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6 mb-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h4 className="text-info mb-1">{alkansyaProductionData.metrics.average_daily_output || 0}</h4>
                                                        <small className="text-muted">Average Daily Output</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6 mb-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h4 className="text-warning mb-1">{alkansyaProductionData.metrics.production_consistency || 0}%</h4>
                                                        <small className="text-muted">Production Consistency</small>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6 mb-3">
                                                <div className="card bg-light">
                                                    <div className="card-body text-center">
                                                        <h4 className="text-primary mb-1">{alkansyaProductionData.metrics.total_days || 0}</h4>
                                                        <small className="text-muted">Production Days</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Production Trend */}
                                        <div className="row mb-4">
                                            <div className="col-md-6">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="mb-0">Production Performance</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Recent Trend</span>
                                                            <span className={`badge ${
                                                                alkansyaProductionData.metrics.recent_trend === 'increasing' ? 'bg-success' :
                                                                alkansyaProductionData.metrics.recent_trend === 'decreasing' ? 'bg-danger' :
                                                                'bg-secondary'
                                                            }`}>
                                                                {alkansyaProductionData.metrics.recent_trend || 'stable'}
                                                            </span>
                                                        </div>
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span>Max Daily Output</span>
                                                            <span className="fw-bold">{alkansyaProductionData.metrics.max_daily_output || 0}</span>
                                                        </div>
                                                        <div className="d-flex justify-content-between">
                                                            <span>Min Daily Output</span>
                                                            <span className="fw-bold">{alkansyaProductionData.metrics.min_daily_output || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="mb-0">Product Information</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        {alkansyaProductionData.product_info ? (
                                                            <div>
                                                                <h6 className="text-success">{alkansyaProductionData.product_info.name}</h6>
                                                                <p className="text-muted small mb-2">{alkansyaProductionData.product_info.description}</p>
                                                                <div className="d-flex justify-content-between">
                                                                    <span>Materials Required</span>
                                                                    <span className="badge bg-info">{alkansyaProductionData.product_info.materials_count}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between">
                                                                    <span>Unit Price</span>
                                                                    <span className="fw-bold">₱{alkansyaProductionData.product_info.unit_price?.toLocaleString() || 0}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <p className="text-muted">No product information available</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Daily Production Chart */}
                                        <div className="row mb-4">
                                            <div className="col-12">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="mb-0">Daily Production Output</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <LineChart data={alkansyaProductionData.daily_breakdown}>
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis dataKey="date" />
                                                                <YAxis />
                                                                <Tooltip />
                                                                <Legend />
                                                                <Line type="monotone" dataKey="quantity_produced" stroke={colors.success} strokeWidth={2} name="Units Produced" />
                                                                <Line type="monotone" dataKey="efficiency" stroke={colors.warning} strokeWidth={2} name="Efficiency %" />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Daily Production Table */}
                                        <div className="row">
                                            <div className="col-12">
                                                <div className="card">
                                                    <div className="card-header">
                                                        <h6 className="mb-0">Daily Production Details</h6>
                                                    </div>
                                                    <div className="card-body">
                                                        <div className="table-responsive">
                                                            <table className="table table-hover">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Date</th>
                                                                        <th>Day</th>
                                                                        <th>Units Produced</th>
                                                                        <th>Efficiency</th>
                                                                        <th>Produced By</th>
                                                                        <th>Type</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {alkansyaProductionData.daily_breakdown?.map((day, index) => (
                                                                        <tr key={index}>
                                                                            <td>{day.date}</td>
                                                                            <td>{day.day_of_week}</td>
                                                                            <td className="text-success fw-bold">{day.quantity_produced}</td>
                                                                            <td>
                                                                                <span className={`badge ${
                                                                                    day.efficiency >= 100 ? 'bg-success' :
                                                                                    day.efficiency >= 80 ? 'bg-warning' :
                                                                                    'bg-danger'
                                                                                }`}>
                                                                                    {day.efficiency}%
                                                                                </span>
                                                                            </td>
                                                                            <td>{day.produced_by}</td>
                                                                            <td>
                                                                                <span className={`badge ${
                                                                                    day.is_weekend ? 'bg-info' : 'bg-primary'
                                                                                }`}>
                                                                                    {day.is_weekend ? 'Weekend' : 'Weekday'}
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

                                        {/* Materials Consumed */}
                                        {alkansyaProductionData.metrics.materials_consumed?.length > 0 && (
                                            <div className="row mt-4">
                                                <div className="col-12">
                                                    <div className="card">
                                                        <div className="card-header">
                                                            <h6 className="mb-0">Materials Consumed</h6>
                                                        </div>
                                                        <div className="card-body">
                                                            <div className="table-responsive">
                                                                <table className="table table-sm">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Material</th>
                                                                            <th>Code</th>
                                                                            <th>Quantity Consumed</th>
                                                                            <th>Unit</th>
                                                                            <th>Cost per Unit</th>
                                                                            <th>Total Cost</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {alkansyaProductionData.metrics.materials_consumed.map((material, index) => (
                                                                            <tr key={index}>
                                                                                <td>{material.material_name}</td>
                                                                                <td>{material.material_code}</td>
                                                                                <td className="text-success fw-bold">{material.quantity_consumed}</td>
                                                                                <td>{material.unit}</td>
                                                                                <td>₱{material.cost_per_unit?.toLocaleString() || 0}</td>
                                                                                <td>₱{material.total_cost?.toLocaleString() || 0}</td>
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
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaBoxes className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">No Alkansya Production Data</h5>
                                        <p className="text-muted">Alkansya production data will appear here once daily output is recorded</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaChartBar className="me-2" style={{ color: colors.info }} />
                                    Production Analytics
                                    {tabLoadingStates.analytics && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.analytics ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-info mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Analytics Data...</h5>
                                        <p className="text-muted">Analyzing production performance metrics</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaChartBar className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">Production Analytics</h5>
                                        <p className="text-muted">Advanced production analytics will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Efficiency Tab */}
            {activeTab === 'efficiency' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaChartLine className="me-2" style={{ color: colors.warning }} />
                                    Efficiency Metrics
                                    {tabLoadingStates.efficiency && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.efficiency ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-warning mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Efficiency Data...</h5>
                                        <p className="text-muted">Calculating production efficiency metrics</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaChartLine className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">Efficiency Metrics</h5>
                                        <p className="text-muted">Production efficiency analysis will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Resource Utilization Tab */}
            {activeTab === 'utilization' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaCogs className="me-2" style={{ color: colors.dark }} />
                                    Resource Utilization
                                    {tabLoadingStates.utilization && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.utilization ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-dark mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Resource Data...</h5>
                                        <p className="text-muted">Analyzing resource utilization patterns</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaCogs className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">Resource Utilization</h5>
                                        <p className="text-muted">Resource usage analysis will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Production Stages Tab */}
            {activeTab === 'stages' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaHistory className="me-2" style={{ color: colors.danger }} />
                                    Production Stage Breakdown
                                    {tabLoadingStates.stages && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </h5>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.stages ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-danger mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Stage Data...</h5>
                                        <p className="text-muted">Analyzing production stage performance</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaHistory className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">Production Stages</h5>
                                        <p className="text-muted">Stage-by-stage production analysis will appear here</p>
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

export default ProductionReports;