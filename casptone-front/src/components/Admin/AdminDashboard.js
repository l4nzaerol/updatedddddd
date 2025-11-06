import React, { useEffect, useState } from "react";
import { getAnalytics } from "../../api/productionApi";
import { getAdminOverview } from "../../api/inventoryApi";
import KPICards from "./Analytics/KPICards";
import DailyOutputChart from "./Analytics/DailyOutputChart";
import TopProductsChart from "./Analytics/TopProductsChart";
import TopUsersChart from "./Analytics/TopUsersChart";
import TopStaffChart from "./Analytics/TopStaffChart";

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    status: "",
  });
  const [overview, setOverview] = useState(null);
  const [forecastSort, setForecastSort] = useState({ key: "days_to_depletion", dir: "asc" });
  const [forecastFilter, setForecastFilter] = useState({ text: "", onlyReorder: false });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchAnalytics = async () => {
    const data = await getAnalytics(filters);
    setAnalytics(data);
  };

  const fetchOverview = async () => {
    const data = await getAdminOverview();
    setOverview(data);
  };

  useEffect(() => {
    fetchAnalytics();
    fetchOverview();
  }, []); // fetch on mount

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f5' }}>
      {/* Simple Brown Header */}
      <div style={{ 
        backgroundColor: '#8b5e34',
        padding: '1.5rem 0',
        marginBottom: '2rem'
      }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div className="text-center">
            <h1 className="fw-bold mb-0" style={{ 
              fontSize: '2rem',
              letterSpacing: '1px',
              color: '#ffffff'
            }}>
              UNICK FURNITURE DASHBOARD
            </h1>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="container" style={{ maxWidth: '1200px' }}>
        {!analytics ? (
          <div className="text-center py-5">
            <div className="spinner-border" style={{ color: '#8b5e34' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div className="mt-3" style={{ fontSize: '0.9rem', color: '#6b4423' }}>Loading analytics...</div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <KPICards kpis={analytics?.kpis || {}} />

            {/* Main Charts Row */}
            <div className="row mt-4">
              {/* Daily Output - Full Width */}
              <div className="col-12 mb-4">
                <DailyOutputChart data={analytics?.daily_output || []} />
              </div>
            </div>

            {/* Secondary Charts Row */}
            <div className="row mb-4">
              <div className="col-lg-4 mb-4">
                <TopStaffChart data={analytics?.top_staff || []} />
              </div>
              <div className="col-lg-4 mb-4">
                <TopProductsChart data={analytics?.top_products || []} />
              </div>
              <div className="col-lg-4 mb-4">
                <TopUsersChart data={analytics?.top_users || []} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
