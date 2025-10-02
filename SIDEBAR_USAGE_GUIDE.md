# Sidebar Component Usage Guide

## ✅ What Was Created

A role-based Sidebar component at:
- `casptone-front/src/components/Sidebar.jsx`

## 🎯 Features

### For Staff Users:
- ✅ Dashboard
- ✅ Productions

### For Admin Users:
- ✅ Dashboard
- ✅ Productions
- ✅ Products
- ✅ Orders
- ✅ Inventory
- ✅ Reports

## 📦 How to Use

### Step 1: Import the Sidebar

In your layout or main component (e.g., `App.jsx`, `AdminLayout.jsx`):

```javascript
import Sidebar from './components/Sidebar';

function AdminLayout() {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        {/* Your main content here */}
        <Outlet /> {/* or your routes */}
      </div>
    </div>
  );
}
```

### Step 2: Update Your Routes

Make sure your routes match the sidebar paths:

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ProductionPage from './pages/ProductionPage';
import ProductsPage from './pages/ProductsPage';
// ... other imports

function App() {
  return (
    <BrowserRouter>
      <div className="d-flex">
        <Sidebar />
        <div className="flex-grow-1">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/production" element={<ProductionPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
```

### Step 3: Ensure User Data in localStorage

After login, make sure user data is stored:

```javascript
// In your login function
const handleLogin = async (email, password) => {
  const response = await axios.post('/api/login', { email, password });
  
  // Store user data
  localStorage.setItem('token', response.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.user));
  
  // Redirect based on role
  if (response.data.user.role === 'staff') {
    navigate('/dashboard');
  } else if (response.data.user.role === 'employee') {
    navigate('/dashboard');
  }
};
```

## 🎨 Customization

### Change Icons

Edit the `menuItems` array in `Sidebar.jsx`:

```javascript
const menuItems = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: '🏠', // Change this
    roles: ['employee', 'staff']
  },
  // ...
];
```

### Change Styling

The sidebar uses Bootstrap classes. You can customize:

```javascript
// Change background color
<div className="sidebar bg-primary text-white"> // Change bg-dark to bg-primary

// Change width
<div className="sidebar" style={{ width: '300px' }}> // Change from 250px

// Change hover color
onMouseEnter={(e) => {
  e.currentTarget.style.backgroundColor = '#0d6efd'; // Your color
}}
```

### Add More Menu Items

```javascript
const menuItems = [
  // ... existing items
  {
    name: 'Settings',
    path: '/settings',
    icon: '⚙️',
    roles: ['employee', 'staff'] // Who can access
  },
];
```

## 🧪 Testing

### Test as Staff:
1. Login with `staff@gmail.com` / `staff`
2. Check sidebar shows only:
   - Dashboard
   - Productions

### Test as Admin:
1. Login with `admin@gmail.com` / `admin`
2. Check sidebar shows all items:
   - Dashboard
   - Productions
   - Products
   - Orders
   - Inventory
   - Reports

## 🔧 Troubleshooting

### Issue: All items show for staff
**Solution**: Check localStorage has correct user data
```javascript
console.log(localStorage.getItem('user'));
// Should show: {"id":3,"name":"Staff User","email":"staff@gmail.com","role":"staff"}
```

### Issue: No items show
**Solution**: User data not in localStorage
```javascript
// After login, ensure this runs:
localStorage.setItem('user', JSON.stringify(response.data.user));
```

### Issue: Active link not highlighting
**Solution**: Check route paths match exactly
```javascript
// Sidebar path
path: '/dashboard'

// Route path
<Route path="/dashboard" element={<Dashboard />} />
// Must match exactly
```

## 📱 Responsive Design (Optional)

Add mobile toggle:

```javascript
const [isOpen, setIsOpen] = useState(true);

return (
  <div className={`sidebar ${isOpen ? 'd-block' : 'd-none d-md-block'}`}>
    <button 
      className="btn btn-sm btn-light d-md-none"
      onClick={() => setIsOpen(!isOpen)}
    >
      ☰
    </button>
    {/* ... rest of sidebar */}
  </div>
);
```

## ✅ Integration Checklist

- [ ] Sidebar component created
- [ ] Imported in layout/App component
- [ ] Routes configured
- [ ] User data stored in localStorage after login
- [ ] Tested with staff account
- [ ] Tested with admin account
- [ ] Active link highlighting works
- [ ] Styling looks good

---

**Quick Start**: Import `<Sidebar />` in your layout and you're done! 🚀
