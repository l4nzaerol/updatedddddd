import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import AppLayout from "../Header";
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaBox,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaSpinner,
  FaEdit,
  FaEye,
  FaFilter,
  FaSync
} from "react-icons/fa";

const UnifiedOrderManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State Management
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [dataLoading, setDataLoading] = useState(true); // Loading state for data
  const [activeView, setActiveView] = useState('all'); // pending, all, accepted, rejected
  const [productTypeFilter, setProductTypeFilter] = useState('all'); // all, furniture, alkansya
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [productionStatus, setProductionStatus] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    paymentMethod: '',
    acceptanceStatus: '',
    startDate: '',
    endDate: ''
  });

  // Statistics
  const [stats, setStats] = useState({
    pending: 0,
    accepted: 0,
    rejected: 0,
    processing: 0,
    ready_for_delivery: 0,
    delivered: 0
  });

  useEffect(() => {
    // Load data lazily after a brief delay
    const timer = setTimeout(() => {
    fetchOrders();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Read URL parameters and set filters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const status = searchParams.get('status');
    if (status) {
      setFilters(prev => ({ ...prev, status: status }));
    }
  }, [location.search]);

  useEffect(() => {
    applyFilters();
  }, [orders, activeView, productTypeFilter, filters]);

  const fetchOrders = async () => {
    setDataLoading(true);
    try {
      const response = await api.get("/orders");
      const ordersData = response.data || [];
      setOrders(ordersData);
      
      // Calculate statistics
      const statistics = {
        pending: ordersData.filter(o => o.acceptance_status === 'pending').length,
        accepted: ordersData.filter(o => o.acceptance_status === 'accepted').length,
        rejected: ordersData.filter(o => o.acceptance_status === 'rejected').length,
        processing: ordersData.filter(o => o.status === 'processing').length,
        ready_for_delivery: ordersData.filter(o => o.status === 'ready_for_delivery').length,
        delivered: ordersData.filter(o => o.status === 'delivered').length
      };
      setStats(statistics);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setDataLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // View filter
    if (activeView === 'pending') {
      filtered = filtered.filter(o => o.acceptance_status === 'pending');
    } else if (activeView === 'accepted') {
      filtered = filtered.filter(o => o.acceptance_status === 'accepted');
    } else if (activeView === 'rejected') {
      filtered = filtered.filter(o => o.acceptance_status === 'rejected');
    }
    // If activeView is 'all', don't filter by acceptance status

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(o =>
        o.id.toString().includes(searchLower) ||
        o.user?.name?.toLowerCase().includes(searchLower) ||
        o.user?.email?.toLowerCase().includes(searchLower) ||
        o.contact_phone?.includes(filters.search)
      );
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(o => o.status === filters.status);
    }

    // Payment method filter
    if (filters.paymentMethod) {
      filtered = filtered.filter(o => o.payment_method === filters.paymentMethod);
    }

    // Acceptance status filter
    if (filters.acceptanceStatus) {
      filtered = filtered.filter(o => o.acceptance_status === filters.acceptanceStatus);
    }

    // Date range filter
    if (filters.startDate && filters.endDate) {
      const start = new Date(filters.startDate).setHours(0, 0, 0, 0);
      const end = new Date(filters.endDate).setHours(23, 59, 59, 999);
      filtered = filtered.filter(o => {
        const orderDate = new Date(o.checkout_date).getTime();
        return orderDate >= start && orderDate <= end;
      });
    }

    // Product type filter
    if (productTypeFilter === 'furniture') {
      filtered = filtered.filter(o => {
        // Check if order has items with products that are NOT Alkansya
        return o.items?.some(item => 
          item.product?.name && !item.product.name.toLowerCase().includes('alkansya')
        );
      });
    } else if (productTypeFilter === 'alkansya') {
      filtered = filtered.filter(o => {
        // Check if order has items with Alkansya products
        return o.items?.some(item => 
          item.product?.name && item.product.name.toLowerCase().includes('alkansya')
        );
      });
    }

    setFilteredOrders(filtered);
  };

  const handleAcceptOrder = async () => {
    if (!selectedOrder) return;

    setProcessing(true);
    try {
      const response = await api.post(`/orders/${selectedOrder.id}/accept`, {
        admin_notes: adminNotes
      });

      const productionsCreated = response.data.productions_created || 0;
      toast.success(`Order #${selectedOrder.id} accepted! ${productionsCreated} production(s) created.`);
      
      setShowAcceptModal(false);
      setAdminNotes('');
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error("Error accepting order:", error);
      toast.error("Failed to accept order: " + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectOrder = async () => {
    if (!selectedOrder || !rejectionReason) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    try {
      await api.post(`/orders/${selectedOrder.id}/reject`, {
        rejection_reason: rejectionReason,
        admin_notes: adminNotes
      });

      toast.success(`Order #${selectedOrder.id} rejected`);
      
      setShowRejectModal(false);
      setRejectionReason('');
      setAdminNotes('');
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error("Error rejecting order:", error);
      toast.error("Failed to reject order: " + (error.response?.data?.message || error.message));
    } finally {
      setProcessing(false);
    }
  };

  // Check if production is completed for table and chair orders
  const checkProductionCompletion = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/production-status`);
      return response.data;
    } catch (error) {
      console.error("Error checking production status:", error);
      return { isCompleted: false, message: "Unable to check production status" };
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedOrder) return;

    setProcessing(true);
    try {
      // Check if trying to update to statuses that require production completion
      if (['ready_for_delivery', 'delivered', 'completed'].includes(newStatus)) {
        const productionStatus = await checkProductionCompletion(selectedOrder.id);
        
        if (!productionStatus.isCompleted) {
          toast.error(`Cannot mark as ${newStatus.replace('_', ' ')}: ${productionStatus.message}`);
          setProcessing(false);
          return;
        }
      }

      await api.put(`/orders/${selectedOrder.id}/status`, { status: newStatus });
      toast.success(`Order #${selectedOrder.id} status updated to ${newStatus.replace('_', ' ')}`);
      
      setShowStatusModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'warning', icon: '⏳', label: 'Pending' },
      processing: { color: 'primary', icon: '⚙️', label: 'Processing' },
      ready_for_delivery: { color: 'info', icon: '📦', label: 'Ready for Delivery' },
      delivered: { color: 'success', icon: '✅', label: 'Delivered' },
      completed: { color: 'success', icon: '🎉', label: 'Completed' },
      cancelled: { color: 'danger', icon: '❌', label: 'Cancelled' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`badge bg-${config.color}`}>
        {config.icon} {config.label}
      </span>
    );
  };

  const getAcceptanceBadge = (status) => {
    const config = {
      pending: { color: 'warning', icon: <FaClock />, label: 'Pending' },
      accepted: { color: 'success', icon: <FaCheckCircle />, label: 'Accepted' },
      rejected: { color: 'danger', icon: <FaTimesCircle />, label: 'Rejected' }
    };
    const badge = config[status] || config.pending;
    return (
      <span className={`badge bg-${badge.color} d-flex align-items-center gap-1`}>
        {badge.icon} {badge.label}
      </span>
    );
  };


  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          
          {/* Header */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <div className="d-flex justify-content-between align-items-center">
                <div>
                      <h2 className="mb-1 fw-bold">Unick Orders </h2>
                      <p className="text-muted mb-0">Manage and track all customer orders</p>
                </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-light" onClick={() => navigate("/dashboard")}>
                        <i className="fas fa-arrow-left me-2"></i>
                        Dashboard
                      </button>
                      <button 
                        className="btn btn-primary" 
                        onClick={fetchOrders}
                        disabled={dataLoading}
                      >
                        <FaSync className={dataLoading ? "spinner-border spinner-border-sm" : ""} />
                        {dataLoading ? " Loading..." : " Refresh"}
                </button>
              </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="row mb-4">
            <div className="col-md-2">
              <div 
                className={`card border-0 shadow-sm h-100 ${activeView === 'pending' ? 'border-warning border-3' : ''}`} 
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderRadius: '12px'
                }}
                onMouseEnter={(e) => {
                  if (activeView !== 'pending') {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeView !== 'pending') {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }
                }}
                onClick={() => setActiveView('pending')}
              >
                <div className="card-body text-center p-4">
                  <div className="text-center mb-3">
                    <FaClock className="text-warning" size={32} />
                </div>
                  {dataLoading ? (
                    <div className="spinner-border spinner-border-sm text-warning mb-2" role="status" />
                  ) : (
                    <h2 className="fw-bold mb-2">{stats.pending}</h2>
                  )}
                  <small className="text-muted fw-semibold">Pending</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div 
                className={`card border-0 shadow-sm h-100 ${activeView === 'accepted' ? 'border-success border-3' : ''}`}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderRadius: '12px'
                }}
                onMouseEnter={(e) => {
                  if (activeView !== 'accepted') {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeView !== 'accepted') {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }
                }}
                onClick={() => setActiveView('accepted')}
              >
                <div className="card-body text-center p-4">
                  <div className="text-center mb-3">
                    <FaCheckCircle className="text-success" size={32} />
                  </div>
                  {dataLoading ? (
                    <div className="spinner-border spinner-border-sm text-success mb-2" role="status" />
                  ) : (
                    <h2 className="fw-bold mb-2">{stats.accepted}</h2>
                  )}
                  <small className="text-muted fw-semibold">Accepted</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div 
                className={`card border-0 shadow-sm h-100 ${activeView === 'rejected' ? 'border-danger border-3' : ''}`}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderRadius: '12px'
                }}
                onMouseEnter={(e) => {
                  if (activeView !== 'rejected') {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeView !== 'rejected') {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }
                }}
                onClick={() => setActiveView('rejected')}
              >
                <div className="card-body text-center p-4">
                  <div className="text-center mb-3">
                    <FaTimesCircle className="text-danger" size={32} />
                  </div>
                  {dataLoading ? (
                    <div className="spinner-border spinner-border-sm text-danger mb-2" role="status" />
                  ) : (
                    <h2 className="fw-bold mb-2">{stats.rejected}</h2>
                  )}
                  <small className="text-muted fw-semibold">Rejected</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div 
                className="card border-0 shadow-sm h-100"
                style={{ 
                  transition: 'all 0.3s ease',
                  borderRadius: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div className="card-body text-center p-4">
                  <div className="text-center mb-3">
                    <span style={{ fontSize: '32px' }}>⚙️</span>
                  </div>
                  {dataLoading ? (
                    <div className="spinner-border spinner-border-sm text-primary mb-2" role="status" />
                  ) : (
                    <h2 className="fw-bold mb-2">{stats.processing}</h2>
                  )}
                  <small className="text-muted fw-semibold">Processing</small>
                </div>
              </div>
            </div>
            <div className="col-md-2">
              <div 
                className="card border-0 shadow-sm h-100"
                style={{ 
                  transition: 'all 0.3s ease',
                  borderRadius: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div className="card-body text-center p-4">
                  <div className="text-center mb-3">
                    <FaBox className="text-info" size={32} />
                </div>
                  {dataLoading ? (
                    <div className="spinner-border spinner-border-sm text-info mb-2" role="status" />
                  ) : (
                    <h2 className="fw-bold mb-2">{stats.ready_for_delivery}</h2>
                  )}
                  <small className="text-muted fw-semibold">Ready</small>
              </div>
            </div>
          </div>
            <div className="col-md-2">
              <div 
                className={`card border-0 shadow-sm h-100 ${activeView === 'all' ? 'border-primary border-3' : ''}`}
                style={{ 
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderRadius: '12px'
                }}
                onMouseEnter={(e) => {
                  if (activeView !== 'all') {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeView !== 'all') {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }
                }}
                onClick={() => setActiveView('all')}
              >
                <div className="card-body text-center p-4">
                  <div className="text-center mb-3">
                    <FaBox className="text-secondary" size={32} />
                  </div>
                  {dataLoading ? (
                    <div className="spinner-border spinner-border-sm text-secondary mb-2" role="status" />
                  ) : (
                    <h2 className="fw-bold mb-2">{orders.length}</h2>
                  )}
                  <small className="text-muted fw-semibold">All Orders</small>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body p-4">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label small text-muted mb-1">Search</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search orders..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small text-muted mb-1">Status</label>
                      <select
                        className="form-select"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        style={{ borderRadius: '8px' }}
                      >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="ready_for_delivery">Ready for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small text-muted mb-1">Payment</label>
                      <select
                        className="form-select"
                        value={filters.paymentMethod}
                        onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                        style={{ borderRadius: '8px' }}
                      >
                        <option value="">All Payment</option>
                        <option value="cod">COD</option>
                      </select>
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small text-muted mb-1">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label small text-muted mb-1">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                    <div className="col-md-1">
                      <label className="form-label small text-muted mb-1">&nbsp;</label>
                      <button
                        className="btn btn-outline-secondary w-100"
                        onClick={() => setFilters({
                          search: '',
                          status: '',
                          paymentMethod: '',
                          acceptanceStatus: '',
                          startDate: '',
                          endDate: ''
                        })}
                        style={{ borderRadius: '8px' }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Type Filter */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                <div className="card-body">
                  <div className="d-flex" style={{ borderBottom: '2px solid #dee2e6' }}>
                    <button
                      type="button"
                      className={`btn btn-lg ${productTypeFilter === 'all' ? 'text-primary fw-bold' : 'text-dark'} border-0 py-3 px-4`}
                      onClick={() => setProductTypeFilter('all')}
                      style={{ 
                        borderBottom: productTypeFilter === 'all' ? '3px solid #0d6efd' : 'none',
                        marginBottom: productTypeFilter === 'all' ? '-2px' : '0',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <FaBox className="me-2" style={{ color: productTypeFilter === 'all' ? '#0d6efd' : '#6c757d', fontSize: '20px' }} />
                      All Orders
                    </button>
                    <button
                      type="button"
                      className={`btn btn-lg ${productTypeFilter === 'furniture' ? 'text-success fw-bold' : 'text-dark'} border-0 py-3 px-4`}
                      onClick={() => setProductTypeFilter('furniture')}
                      style={{ 
                        borderBottom: productTypeFilter === 'furniture' ? '3px solid #198754' : 'none',
                        marginBottom: productTypeFilter === 'furniture' ? '-2px' : '0',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span className="me-2" style={{ fontSize: '20px' }}>🪑</span>
                      Table & Chair
                    </button>
                    <button
                      type="button"
                      className={`btn btn-lg ${productTypeFilter === 'alkansya' ? 'text-info fw-bold' : 'text-dark'} border-0 py-3 px-4`}
                      onClick={() => setProductTypeFilter('alkansya')}
                      style={{ 
                        borderBottom: productTypeFilter === 'alkansya' ? '3px solid #0dcaf0' : 'none',
                        marginBottom: productTypeFilter === 'alkansya' ? '-2px' : '0',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <span className="me-2" style={{ fontSize: '20px' }}>🐷</span>
                      Alkansya
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-header bg-white border-bottom border-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-0 fw-bold">
                        {activeView === 'pending' && '⏳ Pending Orders'}
                    {activeView === 'accepted' && '✅ Accepted Orders'}
                    {activeView === 'rejected' && '❌ Rejected Orders'}
                    {activeView === 'all' && '📋 All Orders'}
                        {dataLoading ? (
                          <span className="badge bg-secondary ms-2">⋯</span>
                        ) : (
                    <span className="badge bg-primary ms-2">{filteredOrders.length}</span>
                        )}
                  </h5>
                    </div>
                    <div className="text-muted small">
                      {!dataLoading && `${filteredOrders.length} order${filteredOrders.length !== 1 ? 's' : ''}`}
                    </div>
                  </div>
                </div>
                <div className="card-body p-0">
                  {dataLoading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="text-muted">Loading orders...</p>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="display-1 text-muted">📦</div>
                      <h4 className="text-muted mt-3">No orders found</h4>
                      <p className="text-muted">Try adjusting your filters or check back later.</p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.95rem' }}>
                        <thead className="table-light">
                          <tr>
                            <th style={{ padding: '1rem', fontWeight: '600', color: '#495057' }}>Order ID</th>
                            <th style={{ padding: '1rem', fontWeight: '600', color: '#495057' }}>Customer</th>
                            <th style={{ padding: '1rem', fontWeight: '600', color: '#495057' }}>Items</th>
                            <th style={{ padding: '1rem', fontWeight: '600', color: '#495057' }}>Total</th>
                            <th style={{ padding: '1rem', fontWeight: '600', color: '#495057' }}>Payment</th>
                            <th style={{ padding: '1rem', fontWeight: '600', color: '#495057' }}>Acceptance</th>
                            <th style={{ padding: '1rem', fontWeight: '600', color: '#495057' }}>Status</th>
                            <th style={{ padding: '1rem', fontWeight: '600', color: '#495057' }}>Date</th>
                            <th style={{ padding: '1rem', fontWeight: '600', color: '#495057' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map((order) => (
                            <tr 
                              key={order.id}
                              style={{ transition: 'all 0.2s ease' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '';
                              }}
                            >
                              <td style={{ padding: '1rem' }}>
                                <div className="fw-bold text-primary">#{order.id}</div>
                                {order.tracking_number && (
                                  <small className="text-info d-block mt-1">📦 {order.tracking_number}</small>
                                )}
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <div>
                                  <div className="fw-semibold">{order.user?.name || 'Unknown'}</div>
                                  <small className="text-muted">{order.user?.email}</small>
                                </div>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span className="badge bg-light text-dark">{order.items?.length || 0} items</span>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <div className="fw-bold text-success">
                                  ₱{parseFloat(order.total_price).toFixed(2)}
                                </div>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <span className="badge bg-secondary">
                                  {order.payment_method === 'cod' ? '💵 COD' : '💳 ' + order.payment_method}
                                </span>
                              </td>
                              <td style={{ padding: '1rem' }}>{getAcceptanceBadge(order.acceptance_status)}</td>
                              <td style={{ padding: '1rem' }}>{getStatusBadge(order.status)}</td>
                              <td style={{ padding: '1rem' }}>
                                <small className="text-muted">{new Date(order.checkout_date).toLocaleDateString()}</small>
                              </td>
                              <td style={{ padding: '1rem' }}>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-primary"
                                    onClick={() => {
                                      setSelectedOrder(order);
                                      setShowDetailsModal(true);
                                    }}
                                    title="View Details"
                                    style={{ borderRadius: '6px 0 0 6px' }}
                                  >
                                    <FaEye />
                                  </button>
                                  
                                  {order.acceptance_status === 'pending' && (
                                    <>
                                      <button
                                        className="btn btn-outline-success"
                                        onClick={() => {
                                          setSelectedOrder(order);
                                          setShowAcceptModal(true);
                                        }}
                                        title="Accept Order"
                                      >
                                        <FaCheckCircle />
                                      </button>
                                      <button
                                        className="btn btn-outline-danger"
                                        onClick={() => {
                                          setSelectedOrder(order);
                                          setShowRejectModal(true);
                                        }}
                                        title="Reject Order"
                                        style={{ borderRadius: '0 6px 6px 0' }}
                                      >
                                        <FaTimesCircle />
                                      </button>
                                    </>
                                  )}
                                  
                                  {order.acceptance_status === 'accepted' && (
                                    <button
                                      className="btn btn-outline-info"
                                      onClick={async () => {
                                        setSelectedOrder(order);
                                        
                                        // Always check production status - let the backend determine if tracking is needed
                                        try {
                                          const status = await checkProductionCompletion(order.id);
                                          setProductionStatus(status);
                                        } catch (error) {
                                          console.error("Error checking production status:", error);
                                          setProductionStatus({ 
                                            isCompleted: false, 
                                            message: "Unable to check production status",
                                            details: "Error occurred while checking production status"
                                          });
                                        }
                                        
                                        setShowStatusModal(true);
                                      }}
                                      title="Update Status"
                                      style={{ borderRadius: '0 6px 6px 0' }}
                                    >
                                      <FaEdit />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
      </motion.div>

      {/* Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
              <div className="modal-header border-bottom" style={{ padding: '1.5rem' }}>
                <div className="flex-grow-1">
                  <h5 className="modal-title fw-bold">Order #{selectedOrder.id}</h5>
                  {selectedOrder.tracking_number && (
                    <div className="text-info fw-semibold mt-1">📦 Tracking: {selectedOrder.tracking_number}</div>
                  )}
                </div>
                <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <h6 className="fw-bold mb-3 text-primary">Customer Information</h6>
                    <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '8px' }}>
                      <div className="card-body">
                        <p className="mb-2"><FaUser className="me-2 text-primary" /><strong>Name:</strong> {selectedOrder.user?.name}</p>
                        <p className="mb-2"><strong>Email:</strong> {selectedOrder.user?.email}</p>
                        <p className="mb-2"><FaPhone className="me-2 text-primary" /><strong>Phone:</strong> {selectedOrder.contact_phone}</p>
                        <p className="mb-0"><FaMapMarkerAlt className="me-2 text-primary" /><strong>Address:</strong> {selectedOrder.shipping_address}</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6 mb-3">
                    <h6 className="fw-bold mb-3 text-primary">Order Information</h6>
                    <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '8px' }}>
                      <div className="card-body">
                        <p className="mb-2"><strong>Date:</strong> {new Date(selectedOrder.checkout_date).toLocaleString()}</p>
                        <p className="mb-2"><FaMoneyBillWave className="me-2 text-primary" /><strong>Total:</strong> <span className="text-success fw-bold">₱{parseFloat(selectedOrder.total_price).toFixed(2)}</span></p>
                        <p className="mb-2"><strong>Payment:</strong> <span className="badge bg-secondary">{selectedOrder.payment_method}</span></p>
                        <p className="mb-2"><strong>Status:</strong> {getStatusBadge(selectedOrder.status)}</p>
                        <p className="mb-0"><strong>Acceptance:</strong> {getAcceptanceBadge(selectedOrder.acceptance_status)}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <h6 className="fw-bold mb-3 text-primary">Order Items</h6>
                <div className="table-responsive">
                  <table className="table table-sm table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item) => (
                        <tr key={item.id}>
                          <td>{item.product?.name}</td>
                          <td>{item.quantity}</td>
                          <td>₱{parseFloat(item.price).toFixed(2)}</td>
                          <td className="fw-bold">₱{(item.quantity * parseFloat(item.price)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer border-top bg-light" style={{ padding: '1.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)} style={{ borderRadius: '8px' }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accept Modal */}
      {showAcceptModal && selectedOrder && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
              <div className="modal-header border-bottom border-success" style={{ padding: '1.5rem' }}>
                <h5 className="modal-title fw-bold"><FaCheckCircle className="me-2 text-success" />Accept Order #{selectedOrder.id}</h5>
                <button type="button" className="btn-close" onClick={() => setShowAcceptModal(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                <div className="alert alert-info border-0 shadow-sm" style={{ borderRadius: '8px' }}>
                  <FaCheckCircle className="me-2" />
                  Accepting this order will create production records and notify the customer.
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Admin Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add any notes about this order..."
                    style={{ borderRadius: '8px' }}
                  />
                </div>
              </div>
              <div className="modal-footer border-top" style={{ padding: '1.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowAcceptModal(false)} disabled={processing} style={{ borderRadius: '8px' }}>
                  Cancel
                </button>
                <button className="btn btn-success" onClick={handleAcceptOrder} disabled={processing} style={{ borderRadius: '8px' }}>
                  {processing ? <FaSpinner className="spinner-border spinner-border-sm me-2" /> : <FaCheckCircle className="me-2" />}
                  Accept Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedOrder && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
              <div className="modal-header border-bottom border-danger" style={{ padding: '1.5rem' }}>
                <h5 className="modal-title fw-bold"><FaTimesCircle className="me-2 text-danger" />Reject Order #{selectedOrder.id}</h5>
                <button type="button" className="btn-close" onClick={() => setShowRejectModal(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                <div className="alert alert-warning border-0 shadow-sm" style={{ borderRadius: '8px' }}>
                  <FaTimesCircle className="me-2" />
                  Please provide a reason for rejecting this order. The customer will be notified.
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Rejection Reason *</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this order is being rejected..."
                    required
                    style={{ borderRadius: '8px' }}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Admin Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes..."
                    style={{ borderRadius: '8px' }}
                  />
                </div>
              </div>
              <div className="modal-footer border-top" style={{ padding: '1.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowRejectModal(false)} disabled={processing} style={{ borderRadius: '8px' }}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleRejectOrder} disabled={processing || !rejectionReason} style={{ borderRadius: '8px' }}>
                  {processing ? <FaSpinner className="spinner-border spinner-border-sm me-2" /> : <FaTimesCircle className="me-2" />}
                  Reject Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
        {showStatusModal && selectedOrder && (
          <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
              <div className="modal-header border-bottom" style={{ padding: '1.5rem' }}>
                <h5 className="modal-title fw-bold">Update Order Status</h5>
                <button type="button" className="btn-close" onClick={() => setShowStatusModal(false)}></button>
              </div>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                {/* Order Info Header */}
                <div className="text-center mb-3">
                  <h6 className="text-muted mb-1">Order #{selectedOrder.id}</h6>
                  <div className="d-flex justify-content-center align-items-center gap-2">
                    <span className="text-muted">Current Status:</span>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                </div>

                {/* Production Status Section */}
                {productionStatus && (
                  <div className={`alert ${productionStatus.isCompleted ? 'alert-success' : 'alert-warning'} border-0 mb-3`}>
                    <div className="d-flex align-items-start">
                      <div className="me-2">
                        {productionStatus.isCompleted ? (
                          <i className="fas fa-check-circle text-success fs-6"></i>
                        ) : (
                          <i className="fas fa-clock text-warning fs-6"></i>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1 fw-semibold small">
                          {productionStatus.isCompleted ? 'Production Complete' : 'Production In Progress'}
                        </h6>
                        <p className="mb-0 text-muted small">{productionStatus.message}</p>
                        {productionStatus.stage && (
                          <small className="text-primary d-block mt-1">
                            <i className="fas fa-cog me-1"></i>
                            Current Stage: {productionStatus.stage}
                          </small>
                        )}
                        {productionStatus.progress !== undefined && productionStatus.progress > 0 && (
                          <small className="text-info d-block mt-1">
                            <i className="fas fa-chart-line me-1"></i>
                            Progress: {productionStatus.progress}%
                          </small>
                        )}
                        {productionStatus.details && (
                          <small className="text-info d-block mt-1">
                            <i className="fas fa-info-circle me-1"></i>
                            {productionStatus.details}
                          </small>
                        )}
                        {!productionStatus.isCompleted && (
                          <small className="text-warning d-block mt-1">
                            <i className="fas fa-clock me-1"></i>
                            Complete production before marking as ready for delivery
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Status Selection */}
                <div className="mb-2">
                  <h6 className="fw-semibold text-dark mb-2 small">Update Status</h6>
                  <div className="row g-1">
                    {['processing', 'ready_for_delivery', 'delivered', 'completed', 'cancelled'].map((status) => {
                      const requiresProductionCompletion = ['ready_for_delivery', 'delivered', 'completed'].includes(status);
                      const isDisabled = selectedOrder.status === status || processing ||
                        (requiresProductionCompletion && productionStatus && !productionStatus.isCompleted);
                      const isCurrentStatus = selectedOrder.status === status;
                      
                      const statusConfig = {
                        processing: { icon: '⚙️', label: 'Processing', color: 'primary' },
                        ready_for_delivery: { icon: '📦', label: 'Ready for Delivery', color: 'info' },
                        delivered: { icon: '✅', label: 'Delivered', color: 'success' },
                        completed: { icon: '🎉', label: 'Completed', color: 'success' },
                        cancelled: { icon: '❌', label: 'Cancelled', color: 'danger' }
                      };
                      
                      const config = statusConfig[status];
                      
                      return (
                        <div key={status} className="col-12">
                          <button
                            className={`btn w-100 text-start p-2 border-0 rounded-2 ${
                              isCurrentStatus 
                                ? 'bg-primary text-white' 
                                : isDisabled 
                                  ? 'bg-light text-muted' 
                                  : 'bg-white border hover-shadow'
                            }`}
                            onClick={() => !isDisabled && handleUpdateStatus(status)}
                            disabled={isDisabled}
                            style={{
                              transition: 'all 0.2s ease',
                              boxShadow: isCurrentStatus ? '0 2px 8px rgba(13, 110, 253, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                          >
                            <div className="d-flex align-items-center">
                              <span className="me-2 fs-6">{config.icon}</span>
                              <div className="flex-grow-1">
                                <div className="fw-semibold small">{config.label}</div>
                                <small className={`${isCurrentStatus ? 'text-white-50' : 'text-muted'} small`}>
                                  {status === 'processing' && 'Order is accepted and in production'}
                                  {status === 'ready_for_delivery' && (
                                    isDisabled && productionStatus && !productionStatus.isCompleted
                                      ? 'Production must be completed first'
                                      : 'Order is ready to be delivered'
                                  )}
                                  {status === 'delivered' && (
                                    isDisabled && productionStatus && !productionStatus.isCompleted
                                      ? 'Production must be completed first'
                                      : 'Order has been delivered to customer'
                                  )}
                                  {status === 'completed' && (
                                    isDisabled && productionStatus && !productionStatus.isCompleted
                                      ? 'Production must be completed first'
                                      : 'Order is fully completed'
                                  )}
                                  {status === 'cancelled' && 'Order has been cancelled'}
                                </small>
                              </div>
                              {isCurrentStatus && (
                                <i className="fas fa-check-circle text-white small"></i>
                              )}
                            </div>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top" style={{ padding: '1.5rem' }}>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowStatusModal(false)} style={{ borderRadius: '8px' }}>
                  <i className="fas fa-times me-1"></i>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default UnifiedOrderManagement;
