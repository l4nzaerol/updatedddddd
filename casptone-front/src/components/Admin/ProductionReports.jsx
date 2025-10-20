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
    const [productionOutput, setProductionOutput] = useState(null);
    const [madeToOrderStatus, setMadeToOrderStatus] = useState(null);
    const [alkansyaDailyOutput, setAlkansyaDailyOutput] = useState(null);
    const [productionAnalytics, setProductionAnalytics] = useState(null);
    const [efficiencyMetrics, setEfficiencyMetrics] = useState(null);
    const [resourceUtilization, setResourceUtilization] = useState(null);
    const [stageBreakdown, setStageBreakdown] = useState(null);
    
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
                    
                case 'output':
                    const outputResponse = await api.get('/production/output', { params: dateRange });
                    setProductionOutput(outputResponse.data);
                    break;
                    
                case 'madeToOrder':
                    const madeToOrderResponse = await api.get('/inventory/made-to-order-status', { params: dateRange });
                    setMadeToOrderStatus(madeToOrderResponse.data);
                    break;
                    
                case 'alkansya':
                    const alkansyaResponse = await api.get('/normalized-inventory/daily-output', { params: dateRange });
                    setAlkansyaDailyOutput(alkansyaResponse.data);
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

            {/* Content based on active tab */}
            {activeTab === 'overview' && (
                <div className="row">
                    {/* Key Metrics Cards */}
                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.primary}20` }}>
                                        <FaIndustry style={{ color: colors.primary }} className="fs-4" />
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.primary }}>
                                            {dashboardData?.total_productions || 0}
                                        </h3>
                                        <small className="text-muted fw-medium">Active Productions</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    Currently in progress
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
                                            {dashboardData?.completed_today || 0}
                                        </h3>
                                        <small className="text-muted fw-medium">Completed Today</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    Units finished today
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.warning}15, ${colors.accent}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.warning}20` }}>
                                        <FaChartLine style={{ color: colors.warning }} className="fs-4" />
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.warning }}>
                                            {dashboardData?.efficiency || 0}%
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

                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.info}15, ${colors.primary}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.info}20` }}>
                                        <FaHistory style={{ color: colors.info }} className="fs-4" />
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.info }}>
                                            {dashboardData?.average_cycle_time || 0}
                                        </h3>
                                        <small className="text-muted fw-medium">Avg Cycle Time</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    Days per production
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
                                    Production Performance Overview
                                </h5>
                            </div>
                            <div className="card-body">
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={[
                                        { date: '2024-01-01', target: 30, actual: 28, efficiency: 93 },
                                        { date: '2024-01-02', target: 30, actual: 32, efficiency: 107 },
                                        { date: '2024-01-03', target: 30, actual: 29, efficiency: 97 },
                                        { date: '2024-01-04', target: 30, actual: 31, efficiency: 103 },
                                        { date: '2024-01-05', target: 30, actual: 27, efficiency: 90 },
                                        { date: '2024-01-06', target: 30, actual: 33, efficiency: 110 },
                                        { date: '2024-01-07', target: 30, actual: 30, efficiency: 100 }
                                    ]}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="target" stroke={colors.primary} name="Target" />
                                        <Line type="monotone" dataKey="actual" stroke={colors.success} name="Actual" />
                                        <Line type="monotone" dataKey="efficiency" stroke={colors.warning} name="Efficiency %" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Production Output Tab */}
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
                                        <p className="text-muted">Analyzing production performance and output trends</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaIndustry className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">Production Output Data</h5>
                                        <p className="text-muted">Detailed production output analysis will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Made-to-Order Tab */}
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
                                        <p className="text-muted">Fetching custom order production status</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaClipboardList className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">Made-to-Order Productions</h5>
                                        <p className="text-muted">Custom order production tracking will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Alkansya Daily Output Tab */}
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
                                        <h5>Loading Alkansya Output Data...</h5>
                                        <p className="text-muted">Fetching daily Alkansya production records</p>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <FaBoxes className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">Alkansya Daily Output</h5>
                                        <p className="text-muted">Daily Alkansya production reports will appear here</p>
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