# Sidebar Role-Based Display Guide

## 🎯 Goal
Show only Dashboard and Productions in sidebar for staff users.

## 📁 Find Your Sidebar Component

Look for one of these files in your project:
- `casptone-front/src/components/Sidebar.jsx`
- `casptone-front/src/components/Admin/Sidebar.jsx`
- `casptone-front/src/components/Navigation.jsx`
- `casptone-front/src/components/Header.jsx`

## 🔧 Implementation Code

### Step 1: Get User Role
Add this at the top of your sidebar component:

```javascript
import { useState, useEffect } from 'react';

const Sidebar = () => {
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    // Get user from localStorage
    const user = JSON.parse(localStorage.getItem('user'));
    setUserRole(user?.role || '');
  }, []);

  // ... rest of component
```

### Step 2: Define Menu Items with Roles

```javascript
const menuItems = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: '📊',
    roles: ['employee', 'staff'] // Both can access
  },
  {
    name: 'Productions',
    path: '/production',
    icon: '🏭',
    roles: ['employee', 'staff'] // Both can access
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
```

### Step 3: Filter and Render

```javascript
return (
  <div className="sidebar">
    <nav>
      {menuItems
        .filter(item => item.roles.includes(userRole))
        .map(item => (
          <Link 
            key={item.name} 
            to={item.path}
            className="sidebar-link"
          >
            <span className="icon">{item.icon}</span>
            <span className="text">{item.name}</span>
          </Link>
        ))
      }
    </nav>
  </div>
);
```

## 📝 Complete Example Component

```javascript
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  const [userRole, setUserRole] = useState('');
  const location = useLocation();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    setUserRole(user?.role || '');
  }, []);

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: '📊',
      roles: ['employee', 'staff']
    },
    {
      name: 'Productions',
      path: '/production',
      icon: '🏭',
      roles: ['employee', 'staff']
    },
    {
      name: 'Products',
      path: '/products',
      icon: '📦',
      roles: ['employee']
    },
    {
      name: 'Orders',
      path: '/orders',
      icon: '🛒',
      roles: ['employee']
    },
    {
      name: 'Inventory',
      path: '/inventory',
      icon: '📋',
      roles: ['employee']
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: '📈',
      roles: ['employee']
    },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole)
  );

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>{userRole === 'staff' ? 'Staff Panel' : 'Admin Panel'}</h3>
      </div>
      
      <nav className="sidebar-nav">
        {filteredMenuItems.map(item => (
          <Link
            key={item.name}
            to={item.path}
            className={`sidebar-link ${
              location.pathname === item.path ? 'active' : ''
            }`}
          >
            <span className="icon">{item.icon}</span>
            <span className="text">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p>Logged in as: {userRole === 'staff' ? 'Staff' : 'Admin'}</p>
      </div>
    </div>
  );
};

export default Sidebar;
```

## 🎨 Expected Results

### Staff User Sees:
```
┌─────────────────┐
│  Staff Panel    │
├─────────────────┤
│ 📊 Dashboard    │
│ 🏭 Productions  │
└─────────────────┘
```

### Admin User Sees:
```
┌─────────────────┐
│  Admin Panel    │
├─────────────────┤
│ 📊 Dashboard    │
│ 🏭 Productions  │
│ 📦 Products     │
│ 🛒 Orders       │
│ 📋 Inventory    │
│ 📈 Reports      │
└─────────────────┘
```

## 🔍 Alternative: Using Context

If you're using React Context for user state:

```javascript
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user } = useAuth();
  const userRole = user?.role;

  // ... rest of code
```

## 🧪 Testing

1. **Login as Staff**:
   - Email: `staff@gmail.com`
   - Password: `staff`
   - Should see only Dashboard and Productions

2. **Login as Admin**:
   - Email: `admin@gmail.com`
   - Password: `admin`
   - Should see all menu items

## 📋 Checklist

- [ ] Found sidebar component file
- [ ] Added user role detection
- [ ] Defined menu items with roles
- [ ] Added filter logic
- [ ] Tested with staff account
- [ ] Tested with admin account
- [ ] Verified correct items show for each role

---

**Need Help?** Look for files containing "sidebar", "navigation", or "menu" in your components folder.
