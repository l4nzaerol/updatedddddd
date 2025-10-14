import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/client";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid 
} from "recharts";
import { clearRequestCache } from "../../utils/apiRetry";

const SalesAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");
    const [windowDays, setWindowDays] = useState(30);
    const [refreshKey, setRefreshKey] = useState(0);
    
    // Sales analytics data states
    const [salesDashboardData, setSalesDashboardData] = useState(null);
    const [salesProcessData, setSalesProcessData] = useState(null);
    const [productPerformanceData, setProductPerformanceData] = useState(null);
    const [salesReportData, setSalesReportData] = useState(null);
    const [customerAnalytics, setCustomerAnalytics] = useState(null);
    const [revenueAnalytics, setRevenueAnalytics] = useState(null);
    const [orderAnalytics, setOrderAnalytics] = useState(null);
    const [trendAnalysis, setTrendAnalysis] = useState(null);

    // Fetch all sales analytics
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

            console.log('📊 Fetching sales analytics with date range:', dateRange);

            // Fetch all sales-related data
            const [
                dashboardResponse,
                processResponse,
                productResponse,
                reportResponse,
                customerResponse,
                revenueResponse,
                orderResponse,
                trendResponse
            ] = await Promise.all([
                api.get('/sales/dashboard', { params: dateRange }),
                api.get('/sales/process-analytics', { params: dateRange }),
                api.get('/sales/product-performance', { params: dateRange }),
                api.get('/sales/report', { params: dateRange }),
                api.get('/sales/customer-analytics', { params: dateRange }),
                api.get('/sales/revenue-analytics', { params: dateRange }),
                api.get('/sales/order-analytics', { params: dateRange }),
                api.get('/sales/trend-analysis', { params: dateRange })
            ]);

            setSalesDashboardData(dashboardResponse.data);
            setSalesProcessData(processResponse.data);
            setProductPerformanceData(productResponse.data);
            setSalesReportData(reportResponse.data);
            setCustomerAnalytics(customerResponse.data);
            setRevenueAnalytics(revenueResponse.data);
            setOrderAnalytics(orderResponse.data);
            setTrendAnalysis(trendResponse.data);

            console.log('📊 Sales analytics fetched successfully');
        } catch (err) {
            console.error('❌ Error fetching sales analytics:', err);
            setError(err.response?.data?.message || 'Failed to fetch sales analytics');
        } finally {
            setLoading(false);
        }
    }, [windowDays]);

    useEffect(() => {
        fetchAllReports();
    }, [fetchAllReports, refreshKey]);

    const handleGlobalRefresh = () => {
        clearRequestCache();
        setRefreshKey(prev => prev + 1);
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

    const handleSalesExport = async (exportType, format) => {
        try {
            setLoading(true);
            if (format === 'csv') {
                switch (exportType) {
                    case 'dashboard':
                        exportReport('sales_dashboard', salesDashboardData?.summary || []);
                        break;
                    case 'products':
                        exportReport('product_performance', productPerformanceData?.products || []);
                        break;
                    case 'customers':
                        exportReport('customer_analytics', customerAnalytics?.customers || []);
                        break;
                    case 'revenue':
                        exportReport('revenue_analytics', revenueAnalytics?.revenue_data || []);
                        break;
                    default:
                        console.log('Unknown export type');
                }
            } else if (format === 'pdf') {
                await exportSalesDataToPDF(exportType);
            }
        } catch (error) {
            console.error('Export error:', error);
            setError('Failed to export data');
        } finally {
            setLoading(false);
        }
    };

    const exportSalesDataToPDF = async (exportType) => {
        // PDF export implementation would go here
        console.log(`Exporting ${exportType} to PDF`);
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
                        Sales Analytics & Reports
                    </h4>
                    <p className="text-muted mb-0">Revenue analysis and customer behavior insights</p>
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
                        { id: 'revenue', name: 'Revenue Analytics', icon: '💰' },
                        { id: 'products', name: 'Product Performance', icon: '📦' },
                        { id: 'customers', name: 'Customer Analytics', icon: '👥' },
                        { id: 'orders', name: 'Order Analytics', icon: '🛒' },
                        { id: 'trends', name: 'Trend Analysis', icon: '📈' }
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

            {/* Content based on active tab */}
            {activeTab === 'overview' && (
                <div>
                    {/* Sales Dashboard Overview */}
                    <div className="row mb-4">
                        <div className="col-lg-3 col-md-6 mb-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body text-center">
                                    <div className="d-flex align-items-center justify-content-center mb-2">
                                        <div className="bg-success bg-opacity-10 rounded-circle p-3 me-3">
                                            <i className="fas fa-dollar-sign text-success fs-4"></i>
                                        </div>
                                        <div>
                                            <h3 className="mb-0 text-success fw-bold">₱2,450,000</h3>
                                            <small className="text-muted">Total Revenue</small>
                                        </div>
                                    </div>
                                    <p className="text-muted small mb-0">this period</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 mb-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body text-center">
                                    <div className="d-flex align-items-center justify-content-center mb-2">
                                        <div className="bg-primary bg-opacity-10 rounded-circle p-3 me-3">
                                            <i className="fas fa-shopping-cart text-primary fs-4"></i>
                                        </div>
                                        <div>
                                            <h3 className="mb-0 text-primary fw-bold">156</h3>
                                            <small className="text-muted">Total Orders</small>
                                        </div>
                                    </div>
                                    <p className="text-muted small mb-0">orders placed</p>
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
                                            <h3 className="mb-0 text-info fw-bold">₱15,705</h3>
                                            <small className="text-muted">Avg Order Value</small>
                                        </div>
                                    </div>
                                    <p className="text-muted small mb-0">per order</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-3 col-md-6 mb-3">
                            <div className="card border-0 shadow-sm h-100">
                                <div className="card-body text-center">
                                    <div className="d-flex align-items-center justify-content-center mb-2">
                                        <div className="bg-warning bg-opacity-10 rounded-circle p-3 me-3">
                                            <i className="fas fa-percentage text-warning fs-4"></i>
                                        </div>
                                        <div>
                                            <h3 className="mb-0 text-warning fw-bold">78.5%</h3>
                                            <small className="text-muted">Conversion Rate</small>
                                        </div>
                                    </div>
                                    <p className="text-muted small mb-0">visitor to customer</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Revenue Chart */}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-white border-0">
                            <h5 className="mb-0 fw-semibold">Revenue Trends</h5>
                        </div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={[
                                    { date: '2024-01-01', revenue: 45000, cumulative: 45000 },
                                    { date: '2024-01-02', revenue: 52000, cumulative: 97000 },
                                    { date: '2024-01-03', revenue: 48000, cumulative: 145000 },
                                    { date: '2024-01-04', revenue: 55000, cumulative: 200000 },
                                    { date: '2024-01-05', revenue: 42000, cumulative: 242000 },
                                    { date: '2024-01-06', revenue: 58000, cumulative: 300000 },
                                    { date: '2024-01-07', revenue: 51000, cumulative: 351000 }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']} />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#10B981" name="Daily Revenue" />
                                    <Line type="monotone" dataKey="cumulative" stroke="#3B82F6" name="Cumulative Revenue" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Product Performance Overview */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0">
                            <h5 className="mb-0 fw-semibold">Top Performing Products</h5>
                        </div>
                        <div className="card-body">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={[
                                    { product: 'Alkansya', revenue: 1800000, quantity: 1200 },
                                    { product: 'Dining Table', revenue: 450000, quantity: 18 },
                                    { product: 'Wooden Chair', revenue: 200000, quantity: 80 }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="product" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                                    <Bar dataKey="quantity" fill="#10B981" name="Quantity Sold" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

                    {/* Revenue Chart */}
                    {revenueAnalytics && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Revenue Trends</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={revenueAnalytics.revenue_data || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']} />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#10B981" name="Daily Revenue" />
                                    <Line type="monotone" dataKey="cumulative" stroke="#3B82F6" name="Cumulative Revenue" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Product Performance Overview */}
                    {productPerformanceData && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Top Performing Products</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={productPerformanceData.products?.slice(0, 5) || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="product_name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                                    <Bar dataKey="quantity_sold" fill="#10B981" name="Quantity Sold" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            {/* Revenue Analytics Tab */}
            {activeTab === 'revenue' && (
                <div className="space-y-6">
                    {revenueAnalytics && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Revenue Analysis</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={revenueAnalytics.revenue_data || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, 'Revenue']} />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#10B981" name="Daily Revenue" />
                                    <Line type="monotone" dataKey="target" stroke="#EF4444" name="Target" />
                                    <Line type="monotone" dataKey="forecast" stroke="#8B5CF6" name="Forecast" strokeDasharray="5 5" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Revenue Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">Total Revenue</h4>
                            <p className="text-2xl font-bold text-green-600">₱{revenueAnalytics?.summary?.total_revenue?.toLocaleString() || 0}</p>
                            <p className="text-sm text-gray-500">this period</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">Growth Rate</h4>
                            <p className="text-2xl font-bold text-blue-600">{revenueAnalytics?.summary?.growth_rate?.toFixed(1) || 0}%</p>
                            <p className="text-sm text-gray-500">vs previous period</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">Average Daily</h4>
                            <p className="text-2xl font-bold text-purple-600">₱{revenueAnalytics?.summary?.avg_daily_revenue?.toLocaleString() || 0}</p>
                            <p className="text-sm text-gray-500">per day</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Performance Tab */}
            {activeTab === 'products' && (
                <div className="space-y-6">
                    {productPerformanceData && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Product Performance</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={productPerformanceData.products || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="product_name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="revenue" fill="#3B82F6" name="Revenue" />
                                    <Bar dataKey="quantity_sold" fill="#10B981" name="Quantity Sold" />
                                    <Bar dataKey="profit_margin" fill="#EF4444" name="Profit Margin %" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Product Details Table */}
                    {productPerformanceData && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Product Performance Details</h3>
                            <div className="overflow-x-auto">
                                <table className="min-w-full table-auto">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-4 py-2 text-left">Product</th>
                                            <th className="px-4 py-2 text-left">Revenue</th>
                                            <th className="px-4 py-2 text-left">Quantity Sold</th>
                                            <th className="px-4 py-2 text-left">Profit Margin</th>
                                            <th className="px-4 py-2 text-left">Performance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productPerformanceData.products?.map((product, index) => (
                                            <tr key={index} className="border-b">
                                                <td className="px-4 py-2 font-medium">{product.product_name}</td>
                                                <td className="px-4 py-2">₱{product.revenue?.toLocaleString()}</td>
                                                <td className="px-4 py-2">{product.quantity_sold}</td>
                                                <td className="px-4 py-2">{product.profit_margin?.toFixed(1)}%</td>
                                                <td className="px-4 py-2">
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        product.profit_margin >= 30 ? 'bg-green-100 text-green-800' :
                                                        product.profit_margin >= 15 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {product.profit_margin >= 30 ? 'Excellent' :
                                                         product.profit_margin >= 15 ? 'Good' : 'Needs Improvement'}
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
            )}

            {/* Customer Analytics Tab */}
            {activeTab === 'customers' && (
                <div className="space-y-6">
                    {customerAnalytics && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Customer Analytics</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={customerAnalytics.customers || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="customer_name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="total_orders" fill="#3B82F6" name="Total Orders" />
                                    <Bar dataKey="total_revenue" fill="#10B981" name="Total Revenue" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Customer Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">Total Customers</h4>
                            <p className="text-2xl font-bold text-blue-600">{customerAnalytics?.summary?.total_customers || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">New Customers</h4>
                            <p className="text-2xl font-bold text-green-600">{customerAnalytics?.summary?.new_customers || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">Repeat Customers</h4>
                            <p className="text-2xl font-bold text-purple-600">{customerAnalytics?.summary?.repeat_customers || 0}</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">Customer Retention</h4>
                            <p className="text-2xl font-bold text-orange-600">{customerAnalytics?.summary?.retention_rate?.toFixed(1) || 0}%</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Analytics Tab */}
            {activeTab === 'orders' && (
                <div className="space-y-6">
                    {orderAnalytics && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Order Analytics</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={orderAnalytics.order_data || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="orders" stroke="#3B82F6" name="Orders" />
                                    <Line type="monotone" dataKey="revenue" stroke="#10B981" name="Revenue" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Order Status Distribution */}
                    {orderAnalytics && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Order Status Distribution</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={orderAnalytics.status_distribution || []}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="count"
                                    >
                                        {(orderAnalytics.status_distribution || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6'][index % 5]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            {/* Trend Analysis Tab */}
            {activeTab === 'trends' && (
                <div className="space-y-6">
                    {trendAnalysis && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Sales Trend Analysis</h3>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={trendAnalysis.trends || []}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="period" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue" />
                                    <Line type="monotone" dataKey="orders" stroke="#10B981" name="Orders" />
                                    <Line type="monotone" dataKey="customers" stroke="#EF4444" name="Customers" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Trend Insights */}
                    {trendAnalysis && (
                        <div className="bg-white p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">Trend Insights</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 mb-2">Growth Trends</h4>
                                    <p className="text-sm text-gray-600">Revenue Growth: {trendAnalysis.insights?.revenue_growth?.toFixed(1) || 0}%</p>
                                    <p className="text-sm text-gray-600">Order Growth: {trendAnalysis.insights?.order_growth?.toFixed(1) || 0}%</p>
                                    <p className="text-sm text-gray-600">Customer Growth: {trendAnalysis.insights?.customer_growth?.toFixed(1) || 0}%</p>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-800 mb-2">Seasonal Patterns</h4>
                                    <p className="text-sm text-gray-600">Peak Month: {trendAnalysis.insights?.peak_month || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">Low Month: {trendAnalysis.insights?.low_month || 'N/A'}</p>
                                    <p className="text-sm text-gray-600">Seasonality: {trendAnalysis.insights?.seasonality || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Export Buttons */}
            <div className="mt-6 flex gap-4">
                <button 
                    onClick={() => handleSalesExport('dashboard', 'csv')}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                    Export Dashboard CSV
                </button>
                <button 
                    onClick={() => handleSalesExport('products', 'csv')}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Export Products CSV
                </button>
                <button 
                    onClick={() => handleSalesExport('customers', 'csv')}
                    className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                >
                    Export Customers CSV
                </button>
                <button 
                    onClick={() => handleSalesExport('revenue', 'csv')}
                    className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                >
                    Export Revenue CSV
                </button>
            </div>
        </div>
    );
};

export default SalesAnalytics;
