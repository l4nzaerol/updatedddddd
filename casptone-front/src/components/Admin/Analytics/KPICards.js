import React from "react";

export default function KPICards({ kpis }) {
  const allMetrics = [
    { 
      label: "Total Productions", 
      value: kpis.total, 
      icon: "fa-industry",
      isPrimary: false
    },
    { 
      label: "Completed", 
      value: kpis.completed_productions, 
      icon: "fa-check-circle",
      isPrimary: false
    },
    { 
      label: "In Progress", 
      value: kpis.in_progress, 
      icon: "fa-spinner",
      isPrimary: false
    },
    { 
      label: "Pending Orders", 
      value: kpis.pending_orders, 
      icon: "fa-clock",
      isPrimary: false
    },
    { 
      label: "Completed Orders", 
      value: kpis.completed_orders, 
      icon: "fa-box-check",
      isPrimary: false
    },
  ];

  return (
    <div className="row">
      {allMetrics.map((item, i) => (
        <div className="col-lg col-md-4 col-sm-6 mb-3" key={i}>
          <div 
            className="card h-100"
            style={{ 
              backgroundColor: item.isPrimary ? '#8b5e34' : '#ffffff',
              border: item.isPrimary ? 'none' : '2px solid #e5d5c3',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              boxShadow: item.isPrimary ? '0 4px 12px rgba(139, 94, 52, 0.2)' : 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = item.isPrimary 
                ? '0 8px 20px rgba(139, 94, 52, 0.3)' 
                : '0 4px 12px rgba(139, 94, 52, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = item.isPrimary 
                ? '0 4px 12px rgba(139, 94, 52, 0.2)' 
                : 'none';
            }}
          >
            <div className="card-body p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{ 
                    width: 48, 
                    height: 48, 
                    backgroundColor: item.isPrimary ? 'rgba(255,255,255,0.2)' : '#f5ebe0',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'rotate(15deg) scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                  }}
                >
                  <i 
                    className={`fas ${item.icon} fa-lg ${item.icon === 'fa-spinner' ? 'fa-pulse' : ''}`}
                    style={{ 
                      color: item.isPrimary ? '#ffffff' : '#8b5e34',
                      transition: 'all 0.3s ease'
                    }}
                  ></i>
                </div>
              </div>
              <div 
                className="small mb-2" 
                style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600',
                  color: item.isPrimary ? 'rgba(255,255,255,0.9)' : '#6b4423',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                {item.label}
              </div>
              <div 
                className="display-6 mb-0 fw-bold" 
                style={{ color: item.isPrimary ? '#ffffff' : '#3d2817' }}
              >
                {item.value || 0}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
