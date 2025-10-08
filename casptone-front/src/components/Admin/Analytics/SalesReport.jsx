import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
  AreaChart, Area
} from 'recharts';
import api from '../../../api/client';

const SalesReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    status: 'all',
    payment_status: 'all'
  });

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const timestamp = Date.now();
      const response = await api.get('/analytics/sales-report', {
        params: {
          ...filters,
          _t: timestamp, // Add timestamp to prevent caching
          _force: 'true' // Force fresh data
        }
      });
      setReportData(response.data);
      console.log('Sales Report - Fresh data loaded:', response.data);
      console.log('Sales Report - Total orders from API:', response.data.summary?.total_orders);
    } catch (err) {
      setError('Failed to load sales report data');
      console.error('Sales report data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-PH').format(num);
  };

  const exportToCSV = async () => {
    try {
      const response = await api.get('/analytics/sales-export', {
        params: {
          start_date: filters.start_date,
          end_date: filters.end_date,
          format: 'csv'
        },
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sales_report_${filters.start_date}_to_${filters.end_date}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading sales report data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>Error Loading Sales Report Data</h4>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchReportData}>
          Retry
        </button>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="alert alert-info">
        <h4>No Sales Report Data Available</h4>
        <p>No sales report data found for the selected filters.</p>
      </div>
    );
  }

  const { orders, summary, filters: appliedFilters } = reportData;

  // Prepare data for charts
  const ordersByDate = orders.reduce((acc, order) => {
    const date = new Date(order.checkout_date).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { date, orders: 0, revenue: 0 };
    }
    acc[date].orders += 1;
    if (order.payment_status === 'paid') {
      acc[date].revenue += parseFloat(order.total_price);
    }
    return acc;
  }, {});

  const chartData = Object.values(ordersByDate).sort((a, b) => new Date(a.date) - new Date(b.date));

  const statusData = orders.reduce((acc, order) => {
    if (!acc[order.status]) {
      acc[order.status] = 0;
    }
    acc[order.status] += 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(statusData).map(([status, count]) => ({
    name: status,
    value: count
  }));

  const paymentStatusData = orders.reduce((acc, order) => {
    if (!acc[order.payment_status]) {
      acc[order.payment_status] = 0;
    }
    acc[order.payment_status] += 1;
    return acc;
  }, {});

  const paymentStatusChartData = Object.entries(paymentStatusData).map(([status, count]) => ({
    name: status,
    value: count
  }));

  return (
    <div className="sales-report">
      {/* Header */}
  
      {/* Summary Cards - Production Style */}
      <div className="row g-3 mb-4">
        <div className="col-md-2">
          <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '4px solid #0d6efd' }}>
            <div className="card-body d-flex flex-column">
              <div className="text-muted small mb-1">Total Orders</div>
              <div className="h3 mb-0 text-primary">{formatNumber(summary.total_orders)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '4px solid #28a745' }}>
            <div className="card-body d-flex flex-column">
              <div className="text-muted small mb-1">Total Revenue</div>
              <div className="h4 mb-0 text-success" style={{ fontSize: '1.1rem', lineHeight: '1.2' }}>{formatCurrency(summary.total_revenue)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '4px solid #17a2b8' }}>
            <div className="card-body d-flex flex-column">
              <div className="text-muted small mb-1">Paid Orders</div>
              <div className="h3 mb-0 text-info">{formatNumber(summary.paid_orders)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '4px solid #ffc107' }}>
            <div className="card-body d-flex flex-column">
              <div className="text-muted small mb-1">Pending Orders</div>
              <div className="h3 mb-0 text-warning">{formatNumber(summary.pending_orders)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '4px solid #6c757d' }}>
            <div className="card-body d-flex flex-column">
              <div className="text-muted small mb-1">Avg Order Value</div>
              <div className="h4 mb-0 text-secondary" style={{ fontSize: '1.1rem', lineHeight: '1.2' }}>{formatCurrency(summary.average_order_value)}</div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card shadow-sm border-0 h-100" style={{ borderLeft: '4px solid #343a40' }}>
            <div className="card-body d-flex flex-column">
              <div className="text-muted small mb-1">Payment Rate</div>
              <div className="h3 mb-0 text-dark">
                {summary.total_orders > 0 ? Math.round((summary.paid_orders / summary.total_orders) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Orders & Revenue Over Time</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                      name === 'revenue' ? 'Revenue' : 'Orders'
                    ]}
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="orders" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area yAxisId="right" type="monotone" dataKey="revenue" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Order Status Distribution</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatNumber(value), 'Orders']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Status Chart */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Payment Status Distribution</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentStatusChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {paymentStatusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatNumber(value), 'Orders']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Daily Orders Trend</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatNumber(value), 'Orders']} />
                  <Bar dataKey="orders" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Orders Table */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Detailed Orders Report</h5>
              <small className="text-muted">
                Showing {orders.length} orders
              </small>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Payment Status</th>
                      <th>Total</th>
                      <th>Items</th>
                      <th>Payment Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <strong>#{order.id}</strong>
                        </td>
                        <td>
                          {order.user?.name || 'Unknown Customer'}
                        </td>
                        <td>
                          {new Date(order.checkout_date).toLocaleDateString()}
                        </td>
                        <td>
                          <span className={`badge bg-${
                            order.status === 'completed' ? 'success' :
                            order.status === 'processing' ? 'info' :
                            order.status === 'delivered' ? 'primary' :
                            'warning'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge bg-${
                            order.payment_status === 'paid' ? 'success' :
                            order.payment_status === 'unpaid' ? 'warning' :
                            'danger'
                          }`}>
                            {order.payment_status}
                          </span>
                        </td>
                        <td>
                          <strong>{formatCurrency(order.total_price)}</strong>
                        </td>
                        <td>
                          {order.items?.map((item, index) => (
                            <div key={index} className="small">
                              {item.product?.name} (x{item.quantity})
                            </div>
                          ))}
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            {order.payment_method?.toUpperCase() || 'COD'}
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
  );
};

export default SalesReport;
