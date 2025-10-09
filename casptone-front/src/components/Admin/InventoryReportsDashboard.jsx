import React, { useEffect, useState, useCallback } from "react";
import AppLayout from "../Header";
import api from "../../api/client";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid 
} from "recharts";
import { useNavigate } from "react-router-dom";
import "./InventoryReportsDashboard.css";

/**
 * Comprehensive Inventory Reports Dashboard
 * Displays all 8 inventory reports based on module objectives
 */
export default function InventoryReportsDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  
  // Report data states
  const [dashboardData, setDashboardData] = useState(null);
  const [inventoryReport, setInventoryReport] = useState(null);
  const [turnoverReport, setTurnoverReport] = useState(null);
  const [forecastReport, setForecastReport] = useState(null);
  const [replenishmentSchedule, setReplenishmentSchedule] = useState(null);
  const [abcAnalysis, setAbcAnalysis] = useState(null);
  const [dailyUsage, setDailyUsage] = useState(null);
  const [consumptionTrends, setConsumptionTrends] = useState(null);

  // Filter states
  const [reportDays, setReportDays] = useState(30);
  const [forecastDays, setForecastDays] = useState(30);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [materialFilter, setMaterialFilter] = useState('all');

  // useEffect moved after loadAllReports definition

  const loadAllReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Load reports sequentially with small delays to avoid rate limiting
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      
      // Load dashboard first
      try {
        const dashboard = await api.get("/inventory/dashboard");
        setDashboardData(dashboard.data);
      } catch (e) {
        console.error("Dashboard load failed:", e);
      }
      
      await delay(100);
      
      // Load other reports with delays
      try {
        const inventory = await api.get("/inventory/report", { 
          params: { 
            start_date: getStartDate(reportDays), 
            end_date: new Date().toISOString().split('T')[0],
            product_filter: materialFilter
          } 
        });
        setInventoryReport(inventory.data);
      } catch (e) {
        console.error("Inventory report load failed:", e);
      }
      
      await delay(100);
      
      try {
        const turnover = await api.get("/inventory/turnover-report", { params: { days: reportDays } });
        setTurnoverReport(turnover.data);
      } catch (e) {
        console.error("Turnover report load failed:", e);
      }
      
      await delay(100);
      
      try {
        const forecast = await api.get("/inventory/forecast", { 
          params: { forecast_days: forecastDays, historical_days: reportDays } 
        });
        setForecastReport(forecast.data);
      } catch (e) {
        console.error("Forecast report load failed:", e);
      }
      
      await delay(100);
      
      try {
        const replenishment = await api.get("/inventory/replenishment-schedule");
        setReplenishmentSchedule(replenishment.data);
      } catch (e) {
        console.error("Replenishment schedule load failed:", e);
      }
      
      await delay(100);
      
      try {
        const abc = await api.get("/inventory/abc-analysis", { params: { days: 90 } });
        setAbcAnalysis(abc.data);
      } catch (e) {
        console.error("ABC analysis load failed:", e);
      }
      
      await delay(100);
      
      try {
        const daily = await api.get("/inventory/daily-usage", { params: { date: selectedDate } });
        setDailyUsage(daily.data);
      } catch (e) {
        console.error("Daily usage load failed:", e);
      }
      
      await delay(100);
      
      try {
        const trends = await api.get("/inventory/consumption-trends", { params: { days: reportDays } });
        setConsumptionTrends(trends.data);
      } catch (e) {
        console.error("Consumption trends load failed:", e);
      }
      
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError("Failed to load some reports. Please try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [reportDays, forecastDays, selectedDate, materialFilter]);

  useEffect(() => {
    loadAllReports();
  }, [loadAllReports]);

  const getStartDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  // const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const PRIORITY_COLORS = { urgent: '#dc3545', high: '#fd7e14', medium: '#ffc107', low: '#28a745' };

  // Export functions
  const exportReport = (reportName, data) => {
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

  // Get filtered materials from backend response
  const getFilteredMaterials = () => {
    if (!inventoryReport || !inventoryReport.items) return [];
    return inventoryReport.items;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mt-4">
          <div className="alert alert-info">Loading reports...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <button className="btn btn-outline-secondary mb-2" onClick={() => navigate("/dashboard")}>
              ← Back to Dashboard
            </button>
            <h2 className="mb-0">Inventory Reports & Analytics</h2>
            <p className="text-muted">Comprehensive reports based on inventory module objectives</p>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <label className="mb-0">Period (days):</label>
            <input 
              type="number" 
              className="form-control" 
              style={{ width: 100 }} 
              value={reportDays} 
              onChange={(e) => setReportDays(Number(e.target.value) || 30)} 
            />
            <button className="btn btn-primary" onClick={loadAllReports}>
              Refresh All
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Dashboard Summary Cards */}
        {dashboardData && (
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-primary">
                <div className="card-body">
                  <div className="text-muted small">Total Items</div>
                  <div className="h3 mb-0 text-primary">{dashboardData.summary.total_items}</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-danger">
                <div className="card-body">
                  <div className="text-muted small">Low Stock Items</div>
                  <div className="h3 mb-0 text-danger">{dashboardData.summary.low_stock_items}</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-warning">
                <div className="card-body">
                  <div className="text-muted small">Out of Stock</div>
                  <div className="h3 mb-0 text-warning">{dashboardData.summary.out_of_stock_items}</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-info">
                <div className="card-body">
                  <div className="text-muted small">Recent Usage (7d)</div>
                  <div className="h3 mb-0 text-info">{dashboardData.summary.recent_usage}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
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
            <button className={`nav-link ${activeTab === "turnover" ? "active" : ""}`} onClick={() => setActiveTab("turnover")}>
              🔄 Stock Turnover
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === "forecast" ? "active" : ""}`} onClick={() => setActiveTab("forecast")}>
              🔮 Forecast
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === "replenishment" ? "active" : ""}`} onClick={() => setActiveTab("replenishment")}>
              📅 Replenishment
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === "abc" ? "active" : ""}`} onClick={() => setActiveTab("abc")}>
              🎯 ABC Analysis
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === "daily" ? "active" : ""}`} onClick={() => setActiveTab("daily")}>
              📅 Daily Usage
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link ${activeTab === "trends" ? "active" : ""}`} onClick={() => setActiveTab("trends")}>
              📈 Consumption Trends
            </button>
          </li>
        </ul>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Overview Tab */}
          {activeTab === "overview" && dashboardData && (
            <div>
              <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Critical Items Requiring Attention</h5>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => exportReport("critical_items", dashboardData.critical_items)}>
                    Export CSV
                  </button>
                </div>
                <div className="card-body">
                  {dashboardData.critical_items && dashboardData.critical_items.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>SKU</th>
                            <th>Name</th>
                            <th>Current Stock</th>
                            <th>Safety Stock</th>
                            <th>Days Until Stockout</th>
                            <th>Urgency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.critical_items.map((item, idx) => (
                            <tr key={idx}>
                              <td className="fw-semibold">{item.sku}</td>
                              <td>{item.name}</td>
                              <td>{item.quantity_on_hand}</td>
                              <td>{item.safety_stock}</td>
                              <td>{item.days_until_stockout}</td>
                              <td><span className="badge bg-danger">{item.urgency}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="alert alert-success">No critical items. All inventory levels are healthy!</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Inventory Status Report Tab - ENHANCED MINIMALIST DESIGN */}
          {activeTab === "inventory" && inventoryReport && (
            <div>
              {/* Enhanced Summary Cards */}
              <div className="row mb-4">
                <div className="col-md-3">
                  <div className="summary-card">
                    <div className="card-icon">📦</div>
                    <div className="card-value">{inventoryReport.summary.total_items}</div>
                    <div className="card-label">Total Items</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="summary-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                    <div className="card-icon">⚠️</div>
                    <div className="card-value">{inventoryReport.summary.items_needing_reorder}</div>
                    <div className="card-label">Need Reorder</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="summary-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                    <div className="card-icon">🚨</div>
                    <div className="card-value">{inventoryReport.summary.critical_items}</div>
                    <div className="card-label">Critical Items</div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="summary-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                    <div className="card-icon">📊</div>
                    <div className="card-value">{inventoryReport.summary.total_usage}</div>
                    <div className="card-label">Total Usage</div>
                  </div>
                </div>
              </div>

              {/* Enhanced Material Filter Section */}
              <div className="material-filter">
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <h6 className="mb-0">🔍 Material Filter</h6>
                    <small className="text-muted">Filter materials by product type</small>
                  </div>
                  <div className="col-md-6">
                    <div className="btn-group w-100" role="group">
                      <input 
                        type="radio" 
                        className="btn-check" 
                        name="materialFilter" 
                        id="all" 
                        checked={materialFilter === 'all'}
                        onChange={() => setMaterialFilter('all')}
                      />
                      <label className="btn btn-outline-primary" htmlFor="all">All Materials</label>
                      
                      <input 
                        type="radio" 
                        className="btn-check" 
                        name="materialFilter" 
                        id="alkansya" 
                        checked={materialFilter === 'alkansya'}
                        onChange={() => setMaterialFilter('alkansya')}
                      />
                      <label className="btn btn-outline-success" htmlFor="alkansya">Alkansya</label>
                      
                      <input 
                        type="radio" 
                        className="btn-check" 
                        name="materialFilter" 
                        id="dining-table" 
                        checked={materialFilter === 'dining-table'}
                        onChange={() => setMaterialFilter('dining-table')}
                      />
                      <label className="btn btn-outline-warning" htmlFor="dining-table">Dining Table</label>
                      
                      <input 
                        type="radio" 
                        className="btn-check" 
                        name="materialFilter" 
                        id="wooden-chair" 
                        checked={materialFilter === 'wooden-chair'}
                        onChange={() => setMaterialFilter('wooden-chair')}
                      />
                      <label className="btn btn-outline-info" htmlFor="wooden-chair">Wooden Chair</label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Minimalist Inventory Table */}
              <div className="card inventory-status-table">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1">📋 Inventory Status</h5>
                      <small>
                        Real-time overview of all materials
                        {materialFilter !== 'all' && (
                          <span className="ms-2">
                            • Filtered by: <span className="badge bg-primary">{materialFilter.replace('-', ' ').toUpperCase()}</span>
                          </span>
                        )}
                      </small>
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-sm btn-outline-light" onClick={() => exportReport("inventory_status", getFilteredMaterials())}>
                        📥 Export
                      </button>
                      <button className="btn btn-sm btn-outline-light">
                        📊 Analytics
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="card-body p-0">
                  {/* Quick Stats Row */}
                  <div className="quick-stats">
                    <div className="row g-0">
                      <div className="col-md-3">
                        <div className="stat-item">
                          <div className="stat-value text-primary">{getFilteredMaterials().length}</div>
                          <div className="stat-label">Filtered Items</div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="stat-item">
                          <div className="stat-value text-info">
                            {(() => {
                              const filteredItems = getFilteredMaterials();
                              const validItems = filteredItems.filter(item => item.days_until_stockout > 0);
                              return validItems.length > 0 ? 
                                Math.round(validItems.reduce((sum, item) => sum + item.days_until_stockout, 0) / validItems.length) :
                                'N/A';
                            })()}
                          </div>
                          <div className="stat-label">Avg Days</div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="stat-item">
                          <div className="stat-value text-warning">{getFilteredMaterials().filter(i => i.avg_daily_usage > 5).length}</div>
                          <div className="stat-label">High Usage</div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="stat-item">
                          <div className="stat-value text-success">{getFilteredMaterials().filter(i => i.avg_daily_usage <= 1).length}</div>
                          <div className="stat-label">Low Usage</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Table */}
                  <div className="table-responsive">
                    <table className="table inventory-table mb-0">
                      <thead>
                        <tr>
                          <th>SKU</th>
                          <th>Material</th>
                          <th className="text-end">Stock</th>
                          <th className="text-end">Usage</th>
                          <th className="text-end">Forecasted</th>
                          <th className="text-end">Projected</th>
                          <th className="text-end">Days Left</th>
                          <th className="text-end">Order Qty</th>
                          <th className="text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredMaterials().map((item, idx) => {
                          const isCritical = item.days_until_stockout <= 7;
                          const isLow = item.days_until_stockout <= 14;
                          const needsReorder = item.will_need_reorder;
                          
                          return (
                            <tr key={idx} className={`${isCritical ? 'table-danger' : isLow ? 'table-warning' : ''}`}>
                              <td className="fw-semibold py-3">{item.sku}</td>
                              <td className="py-3">
                                <div className="d-flex align-items-center">
                                  <span className="me-2">{item.name}</span>
                                  {isCritical && <span className="badge bg-danger">CRITICAL</span>}
                                </div>
                              </td>
                              <td className="text-end fw-bold py-3">{item.current_stock}</td>
                              <td className="text-end py-3">{item.avg_daily_usage}</td>
                              <td className="text-end py-3">{item.forecasted_usage_30_days || 'N/A'}</td>
                              <td className="text-end py-3">
                                <span className={`fw-bold ${item.projected_stock < 0 ? 'text-danger' : 'text-warning'}`}>
                                  {item.projected_stock || 'N/A'}
                                </span>
                              </td>
                              <td className="text-end">
                                <span className={`badge ${
                                  item.current_stock === 0 ? 'bg-danger' :
                                  isCritical ? 'bg-danger' :
                                  isLow ? 'bg-warning' : 'bg-success'
                                }`}>
                                  {item.current_stock === 0 ? 'Out of Stock' :
                                   item.days_until_stockout === 0 ? '0 days' :
                                   item.days_until_stockout ? `${item.days_until_stockout} days` : 'N/A'}
                                </span>
                              </td>
                              <td className="text-end">
                                {needsReorder && (
                                  <span className="badge bg-primary">
                                    {item.recommended_order_qty || 'Auto'}
                                  </span>
                                )}
                              </td>
                              <td className="text-center">
                                <span className={`status-indicator ${
                                  item.current_stock === 0 ? 'status-out' :
                                  item.stock_status === 'critical' ? 'status-critical' :
                                  item.stock_status === 'low' ? 'status-warning' : 'status-safe'
                                }`}>
                                  {item.current_stock === 0 ? '🚨 Out of Stock' :
                                   item.stock_status === 'critical' ? '🚨 Critical' :
                                   item.stock_status === 'low' ? '⚠️ Low Stock' :
                                   item.stock_status === 'out_of_stock' ? '🚨 Out of Stock' : '✅ Normal'}
                                </span>
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
          )}

          {/* Stock Turnover Report Tab */}
          {activeTab === "turnover" && turnoverReport && (
            <div>
              <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Stock Turnover Report ({turnoverReport.period_days} days)</h5>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => exportReport("stock_turnover", turnoverReport.items)}>
                    Export CSV
                  </button>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-3">
                      <div className="text-muted small">Fast Moving</div>
                      <div className="h4 text-success">{turnoverReport.summary.fast_moving}</div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-muted small">Medium Moving</div>
                      <div className="h4 text-warning">{turnoverReport.summary.medium_moving}</div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-muted small">Slow Moving</div>
                      <div className="h4 text-danger">{turnoverReport.summary.slow_moving}</div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-muted small">Avg Turnover Rate</div>
                      <div className="h4">{turnoverReport.summary.avg_turnover_rate}</div>
                    </div>
                  </div>

                  {/* Turnover Chart */}
                  <div className="mb-4">
                    <h6>Turnover Rate by Item (Top 15)</h6>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={turnoverReport.items.slice(0, 15)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="sku" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="turnover_rate" fill="#8884d8" name="Turnover Rate" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th>SKU</th>
                          <th>Name</th>
                          <th className="text-end">Total Usage</th>
                          <th className="text-end">Avg Stock Level</th>
                          <th className="text-end">Turnover Rate</th>
                          <th className="text-end">Turnover Days</th>
                          <th>Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {turnoverReport.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold">{item.sku}</td>
                            <td>{item.name}</td>
                            <td className="text-end">{item.total_usage}</td>
                            <td className="text-end">{item.avg_stock_level}</td>
                            <td className="text-end">{item.turnover_rate}</td>
                            <td className="text-end">{item.turnover_days}</td>
                            <td>
                              <span className={`badge ${
                                item.turnover_category === 'fast' ? 'bg-success' :
                                item.turnover_category === 'medium' ? 'bg-warning' : 'bg-danger'
                              }`}>
                                {item.turnover_category}
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
          )}

          {/* Enhanced Material Forecast Tab */}
          {activeTab === "forecast" && forecastReport && (
            <div>
              {/* Enhanced Header with Analytics */}
              <div className="card mb-4 border-0 shadow-sm">
                <div className="card-header bg-gradient-primary text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="mb-1">🔮 Advanced Material Forecasting</h4>
                      <p className="mb-0 opacity-75">Predictive analytics for inventory planning ({forecastReport.forecast_period_days} days ahead)</p>
                    </div>
                    <div className="d-flex gap-2 align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <label className="mb-0 text-white">Forecast Period:</label>
                        <select 
                          className="form-select form-select-sm" 
                          style={{ width: 120 }} 
                          value={forecastDays} 
                          onChange={(e) => setForecastDays(Number(e.target.value))}
                        >
                          <option value={7}>7 days</option>
                          <option value={14}>14 days</option>
                          <option value={30}>30 days</option>
                          <option value={60}>60 days</option>
                          <option value={90}>90 days</option>
                        </select>
                      </div>
                      <button className="btn btn-light btn-sm" onClick={() => exportReport("material_forecast", forecastReport.forecasts)}>
                        📊 Export Data
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="card-body p-4">
                  {/* Enhanced Analytics Dashboard */}
                  <div className="row g-4 mb-4">
                    <div className="col-lg-3 col-md-6">
                      <div className="card border-0 bg-danger bg-opacity-10 analytics-card fade-in">
                        <div className="card-body text-center">
                          <div className="display-6 text-danger mb-2">⚠️</div>
                          <h3 className="text-danger mb-1 metric-value">{forecastReport.summary.items_will_need_reorder}</h3>
                          <p className="text-muted mb-0 metric-label">Items Need Reorder</p>
                          <small className="text-danger">Critical for operations</small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-lg-3 col-md-6">
                      <div className="card border-0 bg-warning bg-opacity-10 analytics-card slide-in-left">
                        <div className="card-body text-center">
                          <div className="display-6 text-warning mb-2">⏰</div>
                          <h3 className="text-warning mb-1 metric-value">{forecastReport.summary.items_critical}</h3>
                          <p className="text-muted mb-0 metric-label">Critical Items</p>
                          <small className="text-warning">&lt; 7 days stockout risk</small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-lg-3 col-md-6">
                      <div className="card border-0 bg-info bg-opacity-10 analytics-card slide-in-right">
                        <div className="card-body text-center">
                          <div className="display-6 text-info mb-2">📈</div>
                          <h3 className="text-info mb-1 metric-value">{forecastReport.summary.total_forecasted_usage.toLocaleString()}</h3>
                          <p className="text-muted mb-0 metric-label">Total Forecasted Usage</p>
                          <small className="text-info">Units to be consumed</small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-lg-3 col-md-6">
                      <div className="card border-0 bg-success bg-opacity-10 analytics-card fade-in">
                        <div className="card-body text-center">
                          <div className="display-6 text-success mb-2">✅</div>
                          <h3 className="text-success mb-1 metric-value">
                            {forecastReport.forecasts.filter(f => !f.will_need_reorder).length}
                          </h3>
                          <p className="text-muted mb-0 metric-label">Items Safe</p>
                          <small className="text-success">No immediate reorder needed</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Charts Section */}
                  <div className="row g-4 mb-4">
                    {/* Stock Level Forecast Chart */}
                    <div className="col-lg-8">
                      <div className="card border-0 shadow-sm chart-container">
                        <div className="card-header bg-light">
                          <h6 className="mb-0 forecast-title">📊 Stock Level Projections</h6>
                          <small className="text-muted">Current vs Projected stock levels for items needing reorder</small>
                        </div>
                        <div className="card-body">
                          <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={forecastReport.forecasts.filter(f => f.will_need_reorder).slice(0, 12)}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                              <XAxis 
                                dataKey="sku" 
                                angle={-45} 
                                textAnchor="end" 
                                height={80}
                                fontSize={12}
                                tick={{ fill: '#666' }}
                              />
                              <YAxis 
                                fontSize={12}
                                tick={{ fill: '#666' }}
                              />
                              <Tooltip 
                                contentStyle={{
                                  backgroundColor: '#fff',
                                  border: '1px solid #ccc',
                                  borderRadius: '8px',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                              />
                              <Legend />
                              <Bar dataKey="current_stock" fill="#28a745" name="Current Stock" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="projected_stock" fill="#dc3545" name="Projected Stock" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="reorder_point" fill="#ffc107" name="Reorder Point" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Risk Assessment Pie Chart */}
                    <div className="col-lg-4">
                      <div className="card border-0 shadow-sm chart-container">
                        <div className="card-header bg-light">
                          <h6 className="mb-0 forecast-title">🎯 Risk Assessment</h6>
                          <small className="text-muted">Inventory risk distribution</small>
                        </div>
                        <div className="card-body">
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Critical Risk', value: forecastReport.summary.items_critical, fill: '#dc3545' },
                                  { name: 'Medium Risk', value: forecastReport.summary.items_will_need_reorder - forecastReport.summary.items_critical, fill: '#ffc107' },
                                  { name: 'Low Risk', value: forecastReport.forecasts.filter(f => !f.will_need_reorder).length, fill: '#28a745' }
                                ]}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, value }) => `${name}: ${value}`}
                              >
                                {[0, 1, 2].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={['#dc3545', '#ffc107', '#28a745'][index]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Data Table */}
                  <div className="card border-0 shadow-sm">
                    <div className="card-header bg-light d-flex justify-content-between align-items-center">
                      <div>
                        <h6 className="mb-0 forecast-title">📋 Detailed Forecast Analysis</h6>
                        <small className="text-muted">Comprehensive forecasting data with actionable insights</small>
                      </div>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary btn-enhanced">
                          🔍 Filter Critical
                        </button>
                        <button className="btn btn-sm btn-outline-success btn-enhanced">
                          📋 Generate Orders
                        </button>
                      </div>
                    </div>
                    <div className="card-body p-0">
                      <div className="table-responsive">
                        <table className="table table-hover mb-0 table-enhanced">
                          <thead className="table-light">
                            <tr>
                              <th className="border-0">📦 SKU</th>
                              <th className="border-0">📝 Material</th>
                              <th className="border-0 text-end">📊 Current</th>
                              <th className="border-0 text-end">📈 Daily Avg</th>
                              <th className="border-0 text-end">🔮 Forecasted</th>
                              <th className="border-0 text-end">📉 Projected</th>
                              <th className="border-0 text-end">⏰ Days Left</th>
                              <th className="border-0 text-end">🛒 Order Qty</th>
                              <th className="border-0 text-center">⚠️ Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {forecastReport.forecasts.map((item, idx) => {
                              const isCritical = item.days_until_stockout < 7;
                              const needsReorder = item.will_need_reorder;
                              const statusColor = isCritical ? 'danger' : needsReorder ? 'warning' : 'success';
                              const statusIcon = isCritical ? '🚨' : needsReorder ? '⚠️' : '✅';
                              
                              return (
                                <tr key={idx} className={`${isCritical ? 'table-danger' : needsReorder ? 'table-warning' : ''}`}>
                                  <td className="fw-bold">{item.sku}</td>
                                  <td>
                                    <div className="d-flex align-items-center">
                                      <span className="me-2">{item.name}</span>
                                      {isCritical && <span className="badge bg-danger">CRITICAL</span>}
                                    </div>
                                  </td>
                                  <td className="text-end fw-bold">{item.current_stock}</td>
                                  <td className="text-end">{item.avg_daily_usage}</td>
                                  <td className="text-end">{item[`forecasted_usage_${forecastDays}_days`]}</td>
                                  <td className="text-end">
                                    <span className={`fw-bold ${item.projected_stock < 0 ? 'text-danger' : 'text-warning'}`}>
                                      {item.projected_stock}
                                    </span>
                                  </td>
                                  <td className="text-end">
                                    <span className={`badge bg-${statusColor} ${isCritical ? 'pulse' : ''}`}>
                                      {item.current_stock === 0 ? 'Out of Stock' :
                                       item.days_until_stockout === 0 ? '0 days' :
                                       item.days_until_stockout ? `${item.days_until_stockout} days` : 'No usage data'}
                                    </span>
                                  </td>
                                  <td className="text-end">
                                    {item.recommended_order_qty > 0 && (
                                      <span className="badge bg-primary">
                                        {item.recommended_order_qty}
                                      </span>
                                    )}
                                  </td>
                                  <td className="text-center">
                                    <span className="fs-5">{statusIcon}</span>
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
            </div>
          )}

          {/* Replenishment Schedule Tab */}
          {activeTab === "replenishment" && replenishmentSchedule && (
            <div>
              <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Replenishment Schedule</h5>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => exportReport("replenishment_schedule", replenishmentSchedule.schedule)}>
                    Export CSV
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

                  {/* Priority Distribution Chart */}
                  <div className="mb-4">
                    <h6>Priority Distribution</h6>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Urgent', value: replenishmentSchedule.schedule.filter(s => s.priority === 'urgent').length },
                            { name: 'High', value: replenishmentSchedule.schedule.filter(s => s.priority === 'high').length },
                            { name: 'Medium', value: replenishmentSchedule.schedule.filter(s => s.priority === 'medium').length },
                            { name: 'Low', value: replenishmentSchedule.schedule.filter(s => s.priority === 'low').length },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.keys(PRIORITY_COLORS).map((key, index) => (
                            <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[key]} />
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
                          <th>Priority</th>
                          <th>SKU</th>
                          <th>Name</th>
                          <th className="text-end">Current Stock</th>
                          <th className="text-end">Reorder Point</th>
                          <th>Estimated Reorder Date</th>
                          <th>Order By Date</th>
                          <th className="text-end">Recommended Qty</th>
                          <th>Supplier</th>
                        </tr>
                      </thead>
                      <tbody>
                        {replenishmentSchedule.schedule.map((item, idx) => (
                          <tr key={idx} className={item.needs_immediate_reorder ? 'table-danger' : ''}>
                            <td>
                              <span className={`badge`} style={{ backgroundColor: PRIORITY_COLORS[item.priority] }}>
                                {item.priority}
                              </span>
                            </td>
                            <td className="fw-semibold">{item.sku}</td>
                            <td>{item.name}</td>
                            <td className="text-end">{item.current_stock}</td>
                            <td className="text-end">{item.reorder_point}</td>
                            <td>{item.estimated_reorder_date}</td>
                            <td>{item.order_by_date}</td>
                            <td className="text-end fw-bold">{item.recommended_order_qty}</td>
                            <td>{item.supplier || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABC Analysis Tab */}
          {activeTab === "abc" && abcAnalysis && (
            <div>
              <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">ABC Analysis ({abcAnalysis.period_days} days)</h5>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => exportReport("abc_analysis", abcAnalysis.items)}>
                    Export CSV
                  </button>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-3">
                      <div className="text-muted small">Class A Items (High Value)</div>
                      <div className="h4 text-danger">{abcAnalysis.summary.class_a_items}</div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-muted small">Class B Items (Medium Value)</div>
                      <div className="h4 text-warning">{abcAnalysis.summary.class_b_items}</div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-muted small">Class C Items (Low Value)</div>
                      <div className="h4 text-success">{abcAnalysis.summary.class_c_items}</div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-muted small">Total Value</div>
                      <div className="h4">${abcAnalysis.summary.total_value.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* ABC Distribution Chart */}
                  <div className="mb-4">
                    <h6>ABC Classification Distribution</h6>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={abcAnalysis.items.slice(0, 20)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="sku" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="usage_value" fill="#8884d8" name="Usage Value" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th>Classification</th>
                          <th>SKU</th>
                          <th>Name</th>
                          <th className="text-end">Total Usage</th>
                          <th className="text-end">Usage Value</th>
                          <th className="text-end">% of Total</th>
                          <th className="text-end">Cumulative %</th>
                          <th>Recommendation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {abcAnalysis.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <span className={`badge ${
                                item.classification === 'A' ? 'bg-danger' :
                                item.classification === 'B' ? 'bg-warning' : 'bg-success'
                              }`}>
                                Class {item.classification}
                              </span>
                            </td>
                            <td className="fw-semibold">{item.sku}</td>
                            <td>{item.name}</td>
                            <td className="text-end">{item.total_usage}</td>
                            <td className="text-end">${item.usage_value.toFixed(2)}</td>
                            <td className="text-end">{item.percent_of_total}%</td>
                            <td className="text-end">{item.cumulative_percent}%</td>
                            <td><small>{item.recommendation}</small></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Daily Usage Tab */}
          {activeTab === "daily" && dailyUsage && (
            <div>
              <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Daily Usage Report</h5>
                  <div className="d-flex gap-2 align-items-center">
                    <input 
                      type="date" 
                      className="form-control form-control-sm" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)} 
                    />
                    <button className="btn btn-sm btn-primary" onClick={loadAllReports}>Load</button>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => exportReport("daily_usage", Object.values(dailyUsage.usage_summary))}>
                      Export CSV
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
                      <div className="h4">{dailyUsage.total_items_used}</div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-muted small">Total Quantity Used</div>
                      <div className="h4">{dailyUsage.total_quantity_used}</div>
                    </div>
                  </div>

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
                </div>
              </div>
            </div>
          )}

          {/* Consumption Trends Tab */}
          {activeTab === "trends" && consumptionTrends && (
            <div>
              <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Consumption Trends ({consumptionTrends.period_days} days)</h5>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => exportReport("consumption_trends", Object.values(consumptionTrends.trends))}>
                    Export CSV
                  </button>
                </div>
                <div className="card-body">
                  <div className="alert alert-info">
                    <strong>Trend Analysis:</strong> Positive trend = increasing usage, Negative trend = decreasing usage
                  </div>

                  {/* Trends Chart */}
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
                        <Line type="monotone" dataKey="trend" stroke="#82ca9d" name="Trend" />
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
                          <th className="text-end">Total Usage (Period)</th>
                          <th className="text-end">Trend</th>
                          <th className="text-end">Days Until Stockout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(consumptionTrends.trends).map((item, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold">{item.sku}</td>
                            <td>{item.item_name}</td>
                            <td className="text-end">{item.avg_daily_usage}</td>
                            <td className="text-end">{item.total_usage_period}</td>
                            <td className="text-end">
                              <span className={`badge ${item.trend > 0 ? 'bg-warning' : item.trend < 0 ? 'bg-info' : 'bg-secondary'}`}>
                                {item.trend > 0 ? '↑' : item.trend < 0 ? '↓' : '→'} {item.trend}
                              </span>
                            </td>
                            <td className="text-end">
                              {item.current_stock === 0 ? 'Out of Stock' :
                               item.days_until_stockout === 0 ? '0 days' :
                               item.days_until_stockout ? `${item.days_until_stockout} days` : 'No usage data'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
