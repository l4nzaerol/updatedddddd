import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../Header";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../../api/client";
import Pusher from "pusher-js";
import { exportProductionCsv } from "../../api/productionApi";

// Simple CSV export helper
const toCSV = (rows, columns) => {
  const header = columns.join(",");
  const lines = rows.map((r) => columns.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","));
  return [header, ...lines].join("\n");
};

const STAGES = [
  "Material Preparation",
  "Cutting & Shaping",
  "Assembly",
  "Sanding & Surface Preparation",
  "Finishing",
  "Quality Check & Packaging"
];
const COLORS = ["#f39c12", "#2980b9", "#8e44ad", "#27ae60"];

const authHeaders = () => ({});

export default function ProductionTrackingSystem() {
  const navigate = useNavigate();
  const [productions, setProductions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");
  const [analyticsData, setAnalyticsData] = useState({
    stage_breakdown: [],
    kpis: {},
    daily_output: [],
    resource_allocation: [],
    stage_workload: []
  });

  useEffect(() => {
    fetchProductions();
    fetchAnalytics();
    // Realtime updates via Pusher (simple refetch strategy)
    try {
      const pusherKey = process.env.REACT_APP_PUSHER_KEY || "";
      const cluster = process.env.REACT_APP_PUSHER_CLUSTER || "mt1";
      if (pusherKey) {
        const pusher = new Pusher(pusherKey, { cluster });
        const channel = pusher.subscribe("production-channel");
        const handler = () => {
          fetchProductions();
          fetchAnalytics();
        };
        channel.bind("production-updated", handler);
        channel.bind("production-process-updated", handler);
        return () => {
          channel.unbind("production-updated", handler);
          channel.unbind("production-process-updated", handler);
          pusher.unsubscribe("production-channel");
          pusher.disconnect();
        };
      }
    } catch (e) {
      console.warn("Pusher setup failed", e);
    }
    // Fallback polling when realtime not configured
    const intervalId = setInterval(() => {
      try {
        fetchProductions();
        fetchAnalytics();
      } catch (e) {
        // ignore polling errors
      }
    }, 8000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    applyFilters();
  }, [productions, search, statusFilter, dateRange]);

  const fetchProductions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/productions`);
      const data = res.data || [];
      setProductions(data);
      setFiltered(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to load production data. Please check your API endpoint and authentication.");
    } finally {
      setLoading(false);
    }
  };

  const markOrderReadyForDelivery = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/ready-for-delivery`);
      await fetchProductions();
      await fetchAnalytics();
    } catch (err) {
      console.error('Ready for delivery error:', err);
      setError('Failed to mark order as ready for delivery');
    }
  };

  const markOrderDelivered = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/delivered`);
      await fetchProductions();
      await fetchAnalytics();
    } catch (err) {
      console.error('Mark delivered error:', err);
      setError('Failed to mark order as delivered');
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Use a default 14-day window unless user selected a range
      const today = new Date();
      const defaultStart = new Date();
      defaultStart.setDate(today.getDate() - 13); // inclusive of today = 14 days

      const start = dateRange.start || defaultStart.toISOString().slice(0, 10);
      const end = dateRange.end || today.toISOString().slice(0, 10);

      const res = await api.get(`/productions/analytics`, { params: { start_date: start, end_date: end } });
      const data = res.data || {};
      console.log('Analytics data:', data);
      
      // Store analytics data
      setAnalyticsData({
        stage_breakdown: data.stage_breakdown || [],
        kpis: data.kpis || {},
        daily_output: data.daily_output || [],
        resource_allocation: data.resource_allocation || [],
        stage_workload: data.stage_workload || []
      });
      
      // Debug logging
      console.log('Analytics data received:', data);
      console.log('Stage breakdown:', data.stage_breakdown);
      console.log('Stage workload:', data.stage_workload);
      
      // Update suggestions with real analytics data
      const newSuggestions = [];
      
      // Add stage workload data (primary source)
      if (data.stage_workload && data.stage_workload.length > 0) {
        data.stage_workload.forEach(workload => {
          newSuggestions.push({
            stage: workload.stage,
            capacity: workload.capacity,
            assigned: [],
            queued: workload.current_workload,
            utilization: workload.utilization_percentage || ((workload.current_workload / workload.capacity) * 100),
            status: workload.status || 'available',
            message: `${workload.stage} workload: ${workload.current_workload}/${workload.capacity} (${Math.round(workload.utilization_percentage || ((workload.current_workload / workload.capacity) * 100))}%)`,
            priority: workload.current_workload > workload.capacity ? 'high' : (workload.current_workload > workload.capacity * 0.7 ? 'medium' : 'low')
          });
        });
      }
      
      // Add resource allocation data if available
      if (data.resource_allocation && data.resource_allocation.length > 0) {
        data.resource_allocation.forEach(allocation => {
          const existingIndex = newSuggestions.findIndex(s => s.stage === allocation.stage);
          if (existingIndex >= 0) {
            newSuggestions[existingIndex].message = allocation.message;
            newSuggestions[existingIndex].priority = allocation.priority;
          } else {
            newSuggestions.push({
              stage: allocation.stage,
              capacity: 3, // Default capacity
              assigned: [],
              queued: allocation.workload || 0,
              utilization: ((allocation.workload || 0) / 3) * 100,
              status: allocation.priority === 'high' ? 'overloaded' : 'busy',
              message: allocation.message || `${allocation.stage} workload: ${allocation.workload || 0}`,
              priority: allocation.priority || 'medium'
            });
          }
        });
      }
      
      setSuggestions(newSuggestions);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    }
  };

  const applyFilters = () => {
    let data = [...productions];
    
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((p) =>
        (p.product_name || "").toLowerCase().includes(q) || 
        (p.id && String(p.id).includes(q)) || 
        (p.date || "").includes(q)
      );
    }
    
    if (statusFilter !== "all") {
      data = data.filter((p) => p.status === statusFilter);
    }
    
    if (dateRange.start) {
      data = data.filter((p) => new Date(p.date) >= new Date(dateRange.start));
    }
    
    if (dateRange.end) {
      data = data.filter((p) => new Date(p.date) <= new Date(dateRange.end));
    }
    
    console.log('Filtered data:', data); // Debug log
    setFiltered(data);
  };

  // Derived data for charts - only show stages with active production
  const stageData = useMemo(() => {
    console.log('Calculating stageData:', { analyticsData, productions });
    
    // Use analytics data if available, otherwise fallback to local data
    if (analyticsData.stage_breakdown && analyticsData.stage_breakdown.length > 0) {
      const result = analyticsData.stage_breakdown
        .filter(stage => stage.value > 0) // Only show stages with active production
        .map(stage => ({
          name: stage.name,
          value: stage.value
        }));
      console.log('Using analytics stage data:', result);
      return result;
    }
    
    // Fallback to local productions data - only show stages with active production
    const fallbackResult = STAGES.map((stage) => ({
      name: stage,
      value: productions.filter((p) => (p.current_stage || p.stage) === stage && p.status === 'In Progress').length
    })).filter(stage => stage.value > 0); // Only show stages with active production
    console.log('Using fallback stage data:', fallbackResult);
    return fallbackResult;
  }, [analyticsData.stage_breakdown, productions]);

  const dailyOutput = useMemo(() => {
    // Use analytics data if available, otherwise fallback to local data
    if (analyticsData.daily_output && analyticsData.daily_output.length > 0) {
      return analyticsData.daily_output.map(item => ({
        date: item.date,
        quantity: item.quantity
      }));
    }
    
    // Fallback to local productions data
    const map = {};
    productions.forEach((p) => {
      const d = p.date ? new Date(p.date).toISOString().split("T")[0] : "unknown";
      map[d] = map[d] || { date: d, quantity: 0 };
      map[d].quantity += Number(p.quantity || 0);
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [analyticsData.daily_output, productions]);

  // Suggest resource allocation based on actual production data
  const computeSuggestions = () => {
    const capacities = { 
      "Material Preparation": 3, 
      "Cutting & Shaping": 4, 
      "Assembly": 5, 
      "Sanding & Surface Preparation": 3, 
      "Finishing": 3, 
      "Quality Check & Packaging": 2 
    };
    
    const pending = productions.filter((p) => p.status === "In Progress" || p.status === "Pending");
    const byStage = STAGES.reduce((acc, s) => ({ ...acc, [s]: pending.filter((p) => (p.current_stage || p.stage) === s) }), {});

    const alloc = [];
    STAGES.forEach((s) => {
      const queue = byStage[s] || [];
      const cap = capacities[s] || 1;
      const currentWorkload = queue.length;
      const utilization = (currentWorkload / cap) * 100;
      
      alloc.push({ 
        stage: s, 
        capacity: cap, 
        assigned: [], 
        queued: currentWorkload,
        utilization: utilization,
        status: utilization > 90 ? 'overloaded' : (utilization > 70 ? 'busy' : 'available'),
        message: utilization > 90 ? `Stage '${s}' is overloaded with ${currentWorkload} items` : 
                 utilization > 70 ? `Stage '${s}' is busy with ${currentWorkload} items` : 
                 `Stage '${s}' has ${currentWorkload} items (${Math.round(utilization)}% capacity)`,
        priority: utilization > 90 ? 'high' : (utilization > 70 ? 'medium' : 'low')
      });
    });

    setSuggestions(alloc);
  };

  useEffect(() => {
    if (productions.length > 0) {
      computeSuggestions();
    }
  }, [productions]);

  const updateStage = async (id, newStage) => {
    try {
      // Use override-stage endpoint because backend ignores direct stage updates on PATCH
      const res = await api.post(`/productions/${id}/override-stage`, { stage: newStage, reason: 'Manual stage change from dashboard' });
      const updated = res.data?.production || res.data;
      setProductions((prev) => prev.map((p) => (p.id === id ? updated : p)));
      // Immediately refresh analytics so charts and workload reflect the new stage
      await fetchProductions();
      await fetchAnalytics();
    } catch (err) {
      console.error("Update stage error:", err);
      setError("Failed to update production stage");
    }
  };

  const bulkExportCSV = () => {
    const columns = ["id", "product_name", "date", "stage", "status", "quantity", "resources_used", "notes"];
    const rows = filtered.map((r) => ({
      ...r,
      resources_used: typeof r.resources_used === "object" ? JSON.stringify(r.resources_used) : r.resources_used,
    }));

    const csv = toCSV(rows, columns);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `productions_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const bulkExportPDF = () => {
    // Simple text-based export for demonstration
    const content = filtered.map(r => 
      `ID: ${r.id}, Product: ${r.product_name}, Date: ${r.date}, Stage: ${r.stage}, Status: ${r.status}, Quantity: ${r.quantity}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `productions_report_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (

    <AppLayout>
    <div className="container-fluid py-4" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Header Section */}
      <button className="btn btn-outline-secondary mb-3" onClick={() => navigate("/dashboard")}>
                    ← Back to Dashboard
                  </button>
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>

                  <h1 id="prod-track-heading" className="text-primary mb-2">
                    Production Tracking System
                  </h1>
                  
                </div>
                <div className="text-end">
                  <div className="d-flex gap-2 mb-3">
                    <button className="btn btn-outline-primary" onClick={bulkExportCSV}>
                      Export CSV
                    </button>
                    <button className="btn btn-outline-secondary" onClick={bulkExportPDF}>
                      Export Report
                    </button>
                    <button className="btn btn-outline-success" onClick={() => exportProductionCsv({ start_date: dateRange.start, end_date: dateRange.end })}>
                      Server Export
                    </button>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")}></button>
        </div>
      )}

      {/* Simple Filters (compact, like Orders page) */}
      <div className="card mb-3 shadow-sm">
        <div className="card-body py-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-4">
              <input 
                className="form-control" 
                placeholder="Search product, prod ID, order ID, or date" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
              />
            </div>
            <div className="col-md-2">
              <select 
                className="form-select" 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Status filter"
              >
                <option value="all">All</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Hold">Hold</option>
              </select>
            </div>
            <div className="col-md-2">
              <input 
                type="date" 
                className="form-control" 
                value={dateRange.start} 
                onChange={(e) => setDateRange((d) => ({ ...d, start: e.target.value }))} 
                aria-label="Start date"
              />
            </div>
            <div className="col-md-2">
              <input 
                type="date" 
                className="form-control" 
                value={dateRange.end} 
                onChange={(e) => setDateRange((d) => ({ ...d, end: e.target.value }))} 
                aria-label="End date"
              />
            </div>
            <div className="col-md-2">
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-secondary w-100" 
                  onClick={() => { setSearch(""); setStatusFilter("all"); setDateRange({ start: "", end: "" }); }}
                >
                  Reset
                </button>
                <button className="btn btn-primary w-100" onClick={() => { applyFilters(); }}>
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Current Production Processes */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">
                Current Production Processes 
                <span className="badge bg-light text-primary ms-2">{filtered.filter(p => p.status === 'In Progress').length}</span>
              </h5>
            </div>
            <div className="card-body">
              
              {loading && (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div className="mt-2 text-muted">Loading productions...</div>
                </div>
              )}
              
              {!loading && filtered.filter(p => p.status === 'In Progress').length === 0 && (
                <div className="text-center py-4 text-muted">
                  <i className="fas fa-cogs fa-3x mb-3"></i>
                  <div>No production processes currently in progress.</div>
                  <div className="small">All items are either completed, pending, or on hold.</div>
                  <button className="btn btn-outline-primary mt-2" onClick={fetchProductions}>
                    Refresh Data
                  </button>
                </div>
              )}
              
              <div className="timeline-list" style={{ maxHeight: 500, overflowY: "auto" }}>
                {filtered.filter(p => p.status === 'In Progress').map((prod) => (
                  <div key={prod.id} className="card mb-3 border-start border-4" 
                       style={{ borderColor: prod.status === "Completed" ? "#27ae60" : 
                                            prod.status === "Hold" ? "#f39c12" : "#2980b9" }}>
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <div className="small text-muted mb-1">
                            {prod.date ? new Date(prod.date).toLocaleDateString() : "No date"}
                          </div>
                          <div className="h6 mb-1">{prod.product_name}</div>
                          <div className="small text-muted">
                            Qty: <strong>{prod.quantity || 0}</strong> • Prod ID: <strong>{prod.id}</strong>
                            {prod.order_id && (<>
                              {' '}• Order ID: <strong>{prod.order_id}</strong>
                            </>)}
                            {prod.order?.user?.name && (
                              <>
                                {' '}• Customer: <strong>{prod.order.user.name}</strong>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-end">
                          <span className={`badge ${
                            prod.status === "Completed" ? "bg-success" : 
                            prod.status === "Hold" ? "bg-warning text-dark" : 
                            prod.status === "In Progress" ? "bg-info text-dark" : "bg-secondary"
                          }`}>
                            {prod.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <label className="form-label small">Stage:</label>
                        <select 
                          className="form-select form-select-sm" 
                          value={prod.stage} 
                          onChange={(e) => updateStage(prod.id, e.target.value)}
                        >
                          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      {/* Gantt-like view for processes if available */}
                      {Array.isArray(prod.processes) && prod.processes.length > 0 && (
                        <div className="mt-3">
                          <div className="small fw-bold mb-1">Process Timeline</div>
                          <div className="d-flex flex-column gap-2">
                            {prod.processes.map((pr) => (
                              <div key={pr.id} className="d-flex align-items-center gap-2">
                                <div style={{ width: 130 }} className="small">{pr.process_name}</div>
                                <div className="progress flex-grow-1" style={{ height: 10 }}>
                                  <div
                                    className={`progress-bar ${pr.status === 'completed' ? 'bg-success' : pr.status === 'in_progress' ? 'bg-info' : 'bg-secondary'}`}
                                    style={{ width: pr.status === 'completed' ? '100%' : pr.status === 'in_progress' ? '50%' : '8%' }}
                                  ></div>
                                </div>
                                <span className="badge bg-light text-dark small text-capitalize">{pr.status}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-2 small text-muted">
                        <strong>Resources:</strong> {
                          Array.isArray(prod.resources_used)
                            ? (prod.resources_used.length
                                ? prod.resources_used.map((r) => `${r.inventory_item_id ?? r.sku ?? 'item'}: ${r.qty ?? r.quantity ?? 0}`).join(", ")
                                : "N/A")
                            : (typeof prod.resources_used === "object" && prod.resources_used
                                ? Object.entries(prod.resources_used || {}).map(([k,v]) => `${k}: ${v}`).join(", ")
                                : (prod.resources_used || "N/A"))
                        }
                      </div>
                      
                      {prod.notes && (
                        <div className="mt-1 small">
                          <strong>Notes:</strong> {prod.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Ready to Deliver */}
        <div className="col-lg-6 mb-4">
          <div className="card h-100 shadow-sm">
            <div className="card-header bg-warning text-dark">
              <h5 className="card-title mb-0">
                Ready to Deliver
                <span className="badge bg-light text-dark ms-2">
                  {filtered.filter(p => (p.current_stage === 'Ready for Delivery' || p.stage === 'Ready for Delivery') && p.status === 'Completed').length}
                </span>
              </h5>
            </div>
            <div className="card-body">
              <div className="timeline-list" style={{ maxHeight: 500, overflowY: "auto" }}>
                {filtered
                  .filter(p => (p.current_stage === 'Ready for Delivery' || p.stage === 'Ready for Delivery') && p.status === 'Completed')
                  .map(prod => (
                    <div key={prod.id} className="card mb-3 border-start border-4" style={{ borderColor: '#f39c12' }}>
                      <div className="card-body p-3">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <div className="small text-muted mb-1">
                              {prod.date ? new Date(prod.date).toLocaleDateString() : 'No date'}
                            </div>
                            <div className="h6 mb-1">{prod.product_name}</div>
                            <div className="small text-muted">
                              Qty: <strong>{prod.quantity || 0}</strong> • Prod ID: <strong>{prod.id}</strong>
                              {prod.order_id ? (<>
                                {' '}• Order ID: <strong>{prod.order_id}</strong>
                              </>) : null}
                              {prod.order?.user?.name && (
                                <>
                                  {' '}• Customer: <strong>{prod.order.user.name}</strong>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="text-end">
                            <span className="badge bg-success">Completed</span>
                          </div>
                        </div>

                        <div className="mt-3 d-flex gap-2">
                          {prod.order_id && (
                            <>
                              <button
                                className="btn btn-outline-warning btn-sm"
                                onClick={() => markOrderReadyForDelivery(prod.order_id)}
                                title="Mark Order as Ready for Delivery"
                              >
                                Mark Ready for Delivery
                              </button>
                              <button
                                className="btn btn-outline-success btn-sm"
                                onClick={() => markOrderDelivered(prod.order_id)}
                                title="Mark Order as Delivered"
                              >
                                Mark Delivered
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                {filtered.filter(p => (p.current_stage === 'Ready for Delivery' || p.stage === 'Ready for Delivery') && p.status === 'Completed').length === 0 && (
                  <div className="text-center py-4 text-muted">
                    <i className="fas fa-truck-loading fa-3x mb-3"></i>
                    <div>No orders are currently ready to deliver.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Charts and Analytics */}
      <div className="row">
        <div className="col-12">
          {/* Charts */}
          <div className="card mb-4 shadow-sm">
            <div className="card-header bg-success text-white">
              <h5 className="card-title mb-0">
                Analytics Dashboard
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-lg-8">
                  <h6>Daily Output</h6>
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyOutput} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="quantity" fill="#3498db" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="col-lg-4">
                  <h6>Current Production by Stage</h6>
                  <div style={{ width: "100%", height: 260 }}>
                    {stageData && stageData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={stageData} 
                            dataKey="value" 
                            nameKey="name" 
                            outerRadius={80} 
                            label={({name, value}) => `${name}: ${value}`}
                          >
                            {stageData.map((entry, index) => (
                              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="d-flex align-items-center justify-content-center h-100">
                        <div className="text-center text-muted">
                          <div className="mb-2">No current production stages</div>
                          <small>Only stages with active production are shown</small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <hr />

              {/* KPIs */}
              <div className="row">
                <div className="col-md-4">
                  <div className="p-3 bg-light rounded">
                    <h6 className="text-primary">Summary</h6>
                    <div className="mb-2">
                      Total Orders: <span className="badge bg-primary">{productions.length}</span>
                    </div>
                    <div className="mb-2">
                      In Progress: <span className="badge bg-info">{productions.filter((p) => p.status === "In Progress").length}</span>
                    </div>
                    <div className="mb-2">
                      Completed: <span className="badge bg-success">{productions.filter((p) => p.status === "Completed").length}</span>
                    </div>
                    <div>
                      On Hold: <span className="badge bg-warning">{productions.filter((p) => p.status === "Hold").length}</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-8">
                  <h6 className="text-primary">Stage Workload</h6>
                  <div>
                    {suggestions.map((suggestion) => {
                      const capacity = suggestion.capacity || 1;
                      const workload = suggestion.queued || 0;
                      const utilization = suggestion.utilization || ((workload / capacity) * 100);
                      const statusColor = suggestion.status === 'overloaded' ? 'danger' : 
                                        suggestion.status === 'busy' ? 'warning' : 'success';
                      
                      return (
                        <div key={suggestion.stage} className="d-flex align-items-center mb-2">
                          <div style={{ width: 140 }} className="small fw-bold">{suggestion.stage}</div>
                          <div className="progress flex-grow-1 me-3" style={{ height: 20 }}>
                            <div 
                              className={`progress-bar bg-${statusColor}`}
                              role="progressbar" 
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            >
                              {workload}/{capacity}
                            </div>
                          </div>
                          <div className="small">
                            <span className={`badge bg-${statusColor}`}>{workload}</span>
                            <span className="badge bg-light text-dark ms-1">/{capacity}</span>
                            <span className="badge bg-secondary ms-1">{Math.round(utilization)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resource Allocation Suggestions */}
          <div className="card shadow-sm">
            <div className="card-header bg-warning text-dark">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0">
                  Resource Allocation Suggestions
                </h5>
                <button 
                  className="btn btn-outline-dark btn-sm" 
                  onClick={fetchAnalytics}
                >
                  Refresh
                </button>
              </div>
            </div>
            <div className="card-body">
              
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Stage</th>
                      <th>Capacity</th>
                      <th>Top Priority Assignments</th>
                      <th>Queued Items</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.map((s) => (
                      <tr key={s.stage}>
                        <td>
                          <span className="fw-bold">{s.stage}</span>
                          {s.priority === 'high' && (
                            <i className="fas fa-exclamation-triangle text-danger ms-2" title="High Priority Alert"></i>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-info">{s.capacity}</span>
                        </td>
                        <td>
                          <div className="small">
                            <span className={`badge bg-${s.priority === 'high' ? 'danger' : s.priority === 'medium' ? 'warning' : 'info'} me-2`}>
                              {s.priority?.toUpperCase()}
                            </span>
                            {s.message}
                          </div>
                        </td>
                        <td>
                          <span className={`badge bg-${s.queued > s.capacity ? 'danger' : s.queued > s.capacity * 0.7 ? 'warning' : 'success'}`}>
                            {s.queued}
                          </span>
                          <div className="small text-muted mt-1">
                            {Math.round((s.queued / s.capacity) * 100)}% capacity
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
    </div>
    
    </AppLayout>
  );
}