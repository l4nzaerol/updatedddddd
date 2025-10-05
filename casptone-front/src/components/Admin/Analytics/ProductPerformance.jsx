import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
  ScatterChart, Scatter, ComposedChart
} from 'recharts';
import api from '../../../api/client';
import { deduplicateRequest, forceRefresh, clearRequestCache } from '../../../utils/apiRetry';

const ProductPerformance = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchPerformanceData();
  }, [dateRange]);

  const fetchPerformanceData = async (force = false) => {
    setLoading(true);
    setError('');
    try {
      // Always fetch fresh data with timestamp to prevent caching
      const timestamp = Date.now();
      const response = await api.get('/analytics/product-performance', {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end,
          _t: timestamp, // Add timestamp to prevent caching
          _force: 'true' // Force fresh data
        }
      });
      setPerformanceData(response.data);
      console.log('Product Performance - Fresh data loaded:', response.data);
      console.log('Product Performance - Total products from API:', response.data.product_performance?.length);
    } catch (err) {
      setError('Failed to load product performance data');
      console.error('Product performance data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    clearRequestCache();
    fetchPerformanceData(true);
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading product performance data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        <h4>Error Loading Product Performance Data</h4>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchPerformanceData}>
          Retry
        </button>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="alert alert-info">
        <h4>No Product Performance Data Available</h4>
        <p>No product performance data found for the selected date range.</p>
      </div>
    );
  }

  const { product_performance, category_analysis } = performanceData;

  // Prepare data for charts
  const topProductsChart = product_performance.slice(0, 10).map(product => ({
    name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
    fullName: product.name,
    revenue: parseFloat(product.total_revenue),
    quantity: parseInt(product.total_sold),
    orders: parseInt(product.order_count),
    avgValue: parseFloat(product.total_revenue) / parseInt(product.total_sold)
  }));

  const categoryChart = category_analysis.map(category => ({
    name: category.category || 'Uncategorized',
    revenue: parseFloat(category.total_revenue),
    quantity: parseInt(category.total_sold),
    orders: parseInt(category.order_count)
  }));

  return (
    <div className="product-performance">
      {/* Header Controls */}
      <div className="row mb-4">
        <div className="col-md-6">
          <h2 className="text-primary mb-3">
            <i className="fas fa-chart-bar me-2"></i>
            Product Performance Analytics
          </h2>
        </div>
        <div className="col-md-6">
          <div className="d-flex gap-2 justify-content-end">
            <button 
              className="btn btn-outline-primary"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh data"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
            <input
              type="date"
              className="form-control"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              style={{ width: 'auto' }}
            />
            <input
              type="date"
              className="form-control"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              style={{ width: 'auto' }}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-3">
          <div className="card bg-primary text-white">
            <div className="card-body text-center">
              <h3 className="card-title">{formatNumber(product_performance.length)}</h3>
              <p className="card-text">Products Sold</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-success text-white">
            <div className="card-body text-center">
              <h3 className="card-title">
                {formatCurrency(product_performance.reduce((sum, p) => sum + parseFloat(p.total_revenue), 0))}
              </h3>
              <p className="card-text">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-info text-white">
            <div className="card-body text-center">
              <h3 className="card-title">
                {formatNumber(product_performance.reduce((sum, p) => sum + parseInt(p.total_sold), 0))}
              </h3>
              <p className="card-text">Total Units Sold</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card bg-warning text-white">
            <div className="card-body text-center">
              <h3 className="card-title">
                {formatNumber(category_analysis.length)}
              </h3>
              <p className="card-text">Categories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Products Chart */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Top Products by Revenue</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topProductsChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                      name === 'revenue' ? 'Revenue' : name === 'quantity' ? 'Quantity' : 'Orders'
                    ]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.fullName;
                      }
                      return label;
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#8884d8" name="Revenue" />
                  <Bar yAxisId="right" dataKey="quantity" fill="#82ca9d" name="Quantity" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Product Performance Table */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Detailed Product Performance</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Units Sold</th>
                      <th>Revenue</th>
                      <th>Orders</th>
                      <th>Avg Qty/Order</th>
                      <th>Performance Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product_performance.map((product, index) => {
                      const performanceScore = Math.round(
                        (parseFloat(product.total_revenue) / Math.max(...product_performance.map(p => parseFloat(p.total_revenue)))) * 100
                      );
                      return (
                        <tr key={index}>
                          <td>
                            <strong>{product.name}</strong>
                          </td>
                          <td>
                            <span className="badge bg-secondary">{product.category || 'Uncategorized'}</span>
                          </td>
                          <td>{formatCurrency(parseFloat(product.price))}</td>
                          <td>{formatNumber(parseInt(product.total_sold))}</td>
                          <td>
                            <strong>{formatCurrency(parseFloat(product.total_revenue))}</strong>
                          </td>
                          <td>{formatNumber(parseInt(product.order_count))}</td>
                          <td>{formatNumber(product.avg_quantity_per_order)}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                                <div 
                                  className="progress-bar" 
                                  style={{ width: `${performanceScore}%` }}
                                ></div>
                              </div>
                              <small>{performanceScore}%</small>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Analysis */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Category Performance</h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Revenue</th>
                      <th>Units</th>
                      <th>Orders</th>
                    </tr>
                  </thead>
                  <tbody>
                    {category_analysis.map((category, index) => (
                      <tr key={index}>
                        <td>
                          <span className="badge bg-primary">{category.category || 'Uncategorized'}</span>
                        </td>
                        <td>{formatCurrency(category.total_revenue)}</td>
                        <td>{formatNumber(category.total_sold)}</td>
                        <td>{formatNumber(category.order_count)}</td>
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
            <div className="card-header">
              <h5 className="mb-0">Category Revenue Distribution</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChart}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    label={({ name, revenue }) => `${name}: ${formatCurrency(revenue)}`}
                  >
                    {categoryChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue vs Quantity Scatter Plot */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Revenue vs Quantity Analysis</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={topProductsChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="quantity" 
                    name="Quantity Sold"
                    label={{ value: 'Quantity Sold', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    dataKey="revenue" 
                    name="Revenue"
                    label={{ value: 'Revenue (₱)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'revenue' ? formatCurrency(value) : formatNumber(value),
                      name === 'revenue' ? 'Revenue' : 'Quantity'
                    ]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.fullName;
                      }
                      return '';
                    }}
                  />
                  <Scatter dataKey="revenue" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPerformance;
