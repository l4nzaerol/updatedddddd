import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const [userRole, setUserRole] = useState('');
  const location = useLocation();

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem('role');
    setUserRole(role || '');
  }, []);

  // Define all menu items with their allowed roles
  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: '📊',
      roles: ['employee', 'staff'] // Both admin and staff can access
    },
    {
      name: 'Productions',
      path: '/production',
      icon: '🏭',
      roles: ['employee', 'staff'] // Both admin and staff can access
    },
    {
      name: 'Products',
      path: '/products',
      icon: '📦',
      roles: ['employee'] // Only admin
    },
    {
      name: 'Orders',
      path: '/orders',
      icon: '🛒',
      roles: ['employee'] // Only admin
    },
    {
      name: 'Inventory',
      path: '/inventory',
      icon: '📋',
      roles: ['employee'] // Only admin
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: '📈',
      roles: ['employee'] // Only admin
    },
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div className="sidebar bg-dark text-white" style={{ minHeight: '100vh', width: '250px' }}>
      {/* Sidebar Header */}
      <div className="sidebar-header p-3 border-bottom border-secondary">
        <h4 className="mb-0">
          {userRole === 'staff' ? '👷 Staff Panel' : '👨‍💼 Admin Panel'}
        </h4>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav p-3">
        {filteredMenuItems.map(item => (
          <Link
            key={item.name}
            to={item.path}
            className={`d-flex align-items-center text-decoration-none text-white p-2 mb-2 rounded ${
              location.pathname === item.path ? 'bg-primary' : 'hover-bg-secondary'
            }`}
            style={{
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (location.pathname !== item.path) {
                e.currentTarget.style.backgroundColor = '#495057';
              }
            }}
            onMouseLeave={(e) => {
              if (location.pathname !== item.path) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <span className="me-2" style={{ fontSize: '1.2rem' }}>{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer p-3 border-top border-secondary mt-auto">
        <small className="text-muted">
          Logged in as: <strong>{userRole === 'staff' ? 'Staff' : 'Admin'}</strong>
        </small>
      </div>
    </div>
  );
};

export default Sidebar;
