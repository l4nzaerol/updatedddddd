import React, { useEffect, useState } from "react";
import { getAnalytics } from "../../api/productionApi";
import KPICards from "./Analytics/KPICards";
import DailyOutputChart from "./Analytics/DailyOutputChart";
import TopProductsChart from "./Analytics/TopProductsChart";
import TopUsersChart from "./Analytics/TopUsersChart";
import TopStaffChart from "./Analytics/TopStaffChart";

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);

  const fetchAnalytics = async () => {
    const data = await getAnalytics({});
    
    // Transform the API response to match the expected dashboard structure
    const transformedData = {
      kpis: {
        total: data.products?.alkansya?.totals?.total_productions || 0,
        completed: data.products?.alkansya?.totals?.total_productions || 0,
        in_progress: 0,
        hold: 0
      },
      daily_output: data.products?.alkansya?.output_trend?.map(item => ({
        date: item.period,
        alkansya: item.output,
        furniture: 0,
        quantity: item.output
      })) || [],
      top_products: data.top_performing || [],
      top_users: [],
      top_staff: []
    };
    
    setAnalytics(transformedData);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []); // fetch on mount

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'transparent' }}>
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

      {/* Analytics - No container background */}
      <div className="container-fluid" style={{ maxWidth: '100%', padding: '0 1rem' }}>
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
