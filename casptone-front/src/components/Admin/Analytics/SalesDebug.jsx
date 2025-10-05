import React, { useState, useEffect } from 'react';
import api from '../../../api/client';

const SalesDebug = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const timestamp = Date.now();
      const response = await api.get('/analytics/sales-dashboard', {
        params: {
          start_date: '2024-01-01',
          end_date: '2025-12-31',
          _t: timestamp
        }
      });
      setData(response.data);
      console.log('DEBUG - Sales data loaded:', response.data);
    } catch (err) {
      setError('Failed to load data');
      console.error('DEBUG - Sales data error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading debug data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div className="card">
      <div className="card-header">
        <h5>🔍 Sales Analytics Debug</h5>
        <button className="btn btn-sm btn-primary" onClick={fetchData}>
          Refresh
        </button>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-3">
            <div className="card bg-primary text-white">
              <div className="card-body text-center">
                <h3>{data.overview?.total_orders || 0}</h3>
                <p>Total Orders</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-success text-white">
              <div className="card-body text-center">
                <h3>₱{data.overview?.total_revenue || 0}</h3>
                <p>Total Revenue</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-info text-white">
              <div className="card-body text-center">
                <h3>{data.overview?.paid_orders || 0}</h3>
                <p>Paid Orders</p>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card bg-warning text-white">
              <div className="card-body text-center">
                <h3>{data.overview?.pending_orders || 0}</h3>
                <p>Pending Orders</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <h6>Raw API Response:</h6>
          <pre style={{ fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default SalesDebug;
