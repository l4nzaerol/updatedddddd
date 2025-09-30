import React, { useEffect, useState } from "react";
import AppLayout from "../Header";
import api from "../../api/client";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid 
} from "recharts";
import { useNavigate } from "react-router-dom";

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

  useEffect(() => {
    loadAllReports();
  }, [reportDays, forecastDays]);

  const loadAllReports = async () => {
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
          params: { start_date: getStartDate(reportDays), end_date: new Date().toISOString().split('T')[0] } 
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
  };

  const getStartDate = (days) => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
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

          {/* Inventory Status Report Tab */}
          {activeTab === "inventory" && inventoryReport && (
            <div>
              <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Inventory Status Report ({inventoryReport.period.start_date} to {inventoryReport.period.end_date})</h5>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => exportReport("inventory_status", inventoryReport.items)}>
                    Export CSV
                  </button>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-3">
                      <div className="text-muted small">Total Items</div>
                      <div className="h4">{inventoryReport.summary.total_items}</div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-muted small">Items Needing Reorder</div>
                      <div className="h4 text-danger">{inventoryReport.summary.items_needing_reorder}</div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-muted small">Critical Items</div>
                      <div className="h4 text-warning">{inventoryReport.summary.critical_items}</div>
                    </div>
                    <div className="col-md-3">
                      <div className="text-muted small">Total Usage</div>
                      <div className="h4">{inventoryReport.summary.total_usage}</div>
                    </div>
                  </div>

                  {/* Stock Status Chart */}
                  <div className="mb-4">
                    <h6>Stock Status Distribution</h6>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Normal', value: inventoryReport.items.filter(i => i.stock_status === 'normal').length },
                            { name: 'Low', value: inventoryReport.items.filter(i => i.stock_status === 'low').length },
                            { name: 'Critical', value: inventoryReport.items.filter(i => i.stock_status === 'critical').length },
                            { name: 'Out of Stock', value: inventoryReport.items.filter(i => i.stock_status === 'out_of_stock').length },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[0, 1, 2, 3].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                          <th>SKU</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th className="text-end">Current Stock</th>
                          <th className="text-end">Avg Daily Usage</th>
                          <th className="text-end">Days Until Stockout</th>
                          <th>Status</th>
                          <th>Reorder Needed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryReport.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold">{item.sku}</td>
                            <td>{item.name}</td>
                            <td><span className="badge bg-secondary">{item.category}</span></td>
                            <td className="text-end">{item.current_stock}</td>
                            <td className="text-end">{item.avg_daily_usage}</td>
                            <td className="text-end">{item.days_until_stockout}</td>
                            <td>
                              <span className={`badge ${
                                item.stock_status === 'critical' ? 'bg-danger' :
                                item.stock_status === 'low' ? 'bg-warning' :
                                item.stock_status === 'out_of_stock' ? 'bg-dark' : 'bg-success'
                              }`}>
                                {item.stock_status}
                              </span>
                            </td>
                            <td>{item.reorder_needed ? '✅ Yes' : '❌ No'}</td>
                          </tr>
                        ))}
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

          {/* Material Forecast Tab */}
          {activeTab === "forecast" && forecastReport && (
            <div>
              <div className="card mb-4">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Material Usage Forecast ({forecastReport.forecast_period_days} days ahead)</h5>
                  <div className="d-flex gap-2 align-items-center">
                    <label className="mb-0">Forecast Days:</label>
                    <input 
                      type="number" 
                      className="form-control form-control-sm" 
                      style={{ width: 80 }} 
                      value={forecastDays} 
                      onChange={(e) => setForecastDays(Number(e.target.value) || 30)} 
                    />
                    <button className="btn btn-sm btn-outline-primary" onClick={() => exportReport("material_forecast", forecastReport.forecasts)}>
                      Export CSV
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-4">
                      <div className="text-muted small">Items Will Need Reorder</div>
                      <div className="h4 text-danger">{forecastReport.summary.items_will_need_reorder}</div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-muted small">Total Forecasted Usage</div>
                      <div className="h4">{forecastReport.summary.total_forecasted_usage}</div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-muted small">Critical Items (&lt; 7 days)</div>
                      <div className="h4 text-warning">{forecastReport.summary.items_critical}</div>
                    </div>
                  </div>

                  {/* Forecast Chart */}
                  <div className="mb-4">
                    <h6>Projected Stock Levels (Items Needing Reorder)</h6>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={forecastReport.forecasts.filter(f => f.will_need_reorder).slice(0, 15)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="sku" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="current_stock" fill="#82ca9d" name="Current Stock" />
                        <Bar dataKey="projected_stock" fill="#ff7c7c" name="Projected Stock" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead>
                        <tr>
                          <th>SKU</th>
                          <th>Name</th>
                          <th className="text-end">Current Stock</th>
                          <th className="text-end">Avg Daily Usage</th>
                          <th className="text-end">Forecasted Usage</th>
                          <th className="text-end">Projected Stock</th>
                          <th className="text-end">Days Until Stockout</th>
                          <th className="text-end">Recommended Order Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {forecastReport.forecasts.map((item, idx) => (
                          <tr key={idx} className={item.will_need_reorder ? 'table-warning' : ''}>
                            <td className="fw-semibold">{item.sku}</td>
                            <td>{item.name}</td>
                            <td className="text-end">{item.current_stock}</td>
                            <td className="text-end">{item.avg_daily_usage}</td>
                            <td className="text-end">{item[`forecasted_usage_${forecastDays}_days`]}</td>
                            <td className="text-end">{item.projected_stock}</td>
                            <td className="text-end">{item.days_until_stockout}</td>
                            <td className="text-end fw-bold">{item.recommended_order_qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                            <td className="text-end">{item.days_until_stockout}</td>
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
