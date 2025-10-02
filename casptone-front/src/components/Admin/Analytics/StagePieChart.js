import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, LabelList } from "recharts";

// Define distinct colors for each stage (matching StageBreakdownCards)
const stageColors = {
  'Material Preparation': '#8b5e34',    // Brown
  'Cutting & Shaping': '#e74c3c',       // Red
  'Assembly': '#3498db',                 // Blue
  'Sanding & Surface Preparation': '#f39c12', // Orange
  'Finishing': '#9b59b6',                // Purple
  'Quality Check & Packaging': '#27ae60' // Green
};

// Fallback colors for any additional stages
const FALLBACK_COLORS = ["#8b5e34", "#6f4518", "#cbb79a", "#b5835a", "#a06b3b", "#d9c7ae"];

const getStageColor = (stageName, index) => {
  return stageColors[stageName] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
};

// Custom label to show count and percentage on bars
const renderCustomLabel = (props) => {
  const { x, y, width, height, value, total } = props;
  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
  
  return (
    <text 
      x={x + width + 5} 
      y={y + height / 2} 
      fill="#2c3e50" 
      textAnchor="start"
      dominantBaseline="middle"
      style={{ 
        fontSize: '13px', 
        fontWeight: 'bold'
      }}
    >
      {value} ({percentage}%)
    </text>
  );
};

export default function StagePieChart({ data }) {
  // Validate data first
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="card shadow-sm">
        <div className="card-body p-4">
          <h5 className="card-title mb-3 fw-bold" style={{color:'#2c3e50'}}>Production Stage Breakdown</h5>
          <div className="text-center text-muted py-5">
            <i className="fas fa-chart-pie fa-3x mb-3 opacity-25"></i>
            <div className="mb-2 fw-bold">No Active Production Stages</div>
            <small>Start production to see stage breakdown</small>
          </div>
        </div>
      </div>
    );
  }

  // Calculate total for percentage calculation
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);

  // Prepare data with total for percentage calculation
  const dataWithTotal = data.map(item => ({ ...item, total }));

  return (
    <div className="card shadow-sm">
      <div className="card-body p-4">
        <h5 className="card-title mb-4 fw-bold" style={{color:'#2c3e50'}}>Production Stage Breakdown</h5>
      
      {/* Horizontal Bar Chart */}
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={dataWithTotal} 
            layout="vertical"
            margin={{ top: 20, right: 100, left: 20, bottom: 20 }}
          >
            <XAxis 
              type="number" 
              stroke="#666"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={200}
              stroke="#666"
              style={{ fontSize: '13px', fontWeight: '600' }}
              tick={{ fill: '#2c3e50' }}
            />
            <Tooltip 
              formatter={(value, name) => {
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return [`${value} order${value !== 1 ? 's' : ''} (${percentage}%)`, 'Orders'];
              }}
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '2px solid #ddd',
                borderRadius: '10px',
                padding: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            />
            <Bar 
              dataKey="value" 
              radius={[0, 8, 8, 0]}
              barSize={35}
            >
              {dataWithTotal.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getStageColor(entry.name, index)}
                />
              ))}
              <LabelList 
                dataKey="value" 
                position="right" 
                content={(props) => renderCustomLabel({ ...props, total })}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

        {/* Summary Stats Cards */}
        <div className="row mt-4">
          <div className="col-md-12">
            <div className="p-3 rounded" style={{ backgroundColor: '#2c3e50', color: 'white' }}>
              <div className="d-flex justify-content-between align-items-center">
                <span className="fw-semibold">Total Orders in Production</span>
                <span className="badge bg-light text-dark fs-6">{total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stage Details Grid */}
        <div className="row mt-3">
          {data.map((stage, index) => {
            const percentage = total > 0 ? ((stage.value / total) * 100).toFixed(1) : 0;
            const color = getStageColor(stage.name, index);
            
            return (
              <div key={stage.name} className="col-md-4 mb-3">
                <div 
                  className="p-3 rounded shadow-sm h-100"
                  style={{ 
                    backgroundColor: '#ffffff',
                    borderLeft: `5px solid ${color}`,
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-3px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <div 
                      style={{ 
                        width: 16, 
                        height: 16, 
                        backgroundColor: color, 
                        borderRadius: '50%',
                        flexShrink: 0
                      }}
                    ></div>
                    <div 
                      className="fw-bold text-truncate" 
                      style={{ fontSize: '0.85rem', color: '#2c3e50' }}
                      title={stage.name}
                    >
                      {stage.name}
                    </div>
                  </div>
                  <div className="d-flex justify-content-between align-items-end">
                    <div>
                      <div className="small text-muted">Orders</div>
                      <div className="h4 mb-0 fw-bold" style={{ color: color }}>
                        {stage.value}
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="small text-muted">Percentage</div>
                      <div className="h5 mb-0 fw-bold" style={{ color: color }}>
                        {percentage}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
