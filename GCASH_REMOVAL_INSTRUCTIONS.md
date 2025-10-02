# GCash Removal Instructions

## Changes Needed

### 1. ✅ Backend Seeder (Already Done by User)
**File**: `capstone-back\database\seeders\AccurateOrdersSeeder.php`
- Line 208: Changed from `'payment_method' => 'gcash'` to `'payment_method' => 'maya'`

### 2. Frontend - Cart Checkout Page
**File**: `casptone-front\src\components\Customers\CartTable.js`

**Remove lines 506-521** (the GCash payment option):

```javascript
// DELETE THESE LINES (506-521):
                    <label className={`payment-option ${paymentMethod==='gcash'?'selected':''}`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="gcash" 
                        checked={paymentMethod==='gcash'} 
                        onChange={() => setPaymentMethod('gcash')} 
                      />
                      <div className="payment-content">
                        <div className="payment-icon">📱</div>
                        <div className="payment-text">
                          <span className="payment-title">GCash</span>
                          <span className="payment-desc">Pay securely with GCash</span>
                        </div>
                      </div>
                    </label>
                    
```

**After deletion, the payment methods section should look like:**

```javascript
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <div className="payment-methods">
                    <label className={`payment-option ${paymentMethod==='cod'?'selected':''}`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="cod" 
                        checked={paymentMethod==='cod'} 
                        onChange={() => setPaymentMethod('cod')} 
                      />
                      <div className="payment-content">
                        <div className="payment-icon">📦</div>
                        <div className="payment-text">
                          <span className="payment-title">Cash on Delivery</span>
                          <span className="payment-desc">Pay when your order arrives</span>
                        </div>
                      </div>
                    </label>
                    
                    <label className={`payment-option ${paymentMethod==='maya'?'selected':''}`}>
                      <input 
                        type="radio" 
                        name="payment" 
                        value="maya" 
                        checked={paymentMethod==='maya'} 
                        onChange={() => setPaymentMethod('maya')} 
                      />
                      <div className="payment-content">
                        <div className="payment-icon">💳</div>
                        <div className="payment-text">
                          <span className="payment-title">Maya</span>
                          <span className="payment-desc">Pay with Maya wallet</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
```

### 3. Frontend - Admin Orders Management
**File**: `casptone-front\src\components\Admin\EnhancedOrdersManagement.js`

**Line 164** - Remove GCash from methodInfo:
```javascript
// BEFORE:
const methodInfo = {
  cod: { label: "Cash on Delivery", color: "secondary", icon: "💵" },
  maya: { label: "Maya", color: "primary", icon: "💳" },
  gcash: { label: "GCash", color: "info", icon: "💳" }
};

// AFTER:
const methodInfo = {
  cod: { label: "Cash on Delivery", color: "secondary", icon: "💵" },
  maya: { label: "Maya", color: "primary", icon: "💳" }
};
```

**Line 281** - Remove GCash option from filter dropdown:
```javascript
// BEFORE:
<select>
  <option value="">All Payment</option>
  <option value="cod">💵 COD</option>
  <option value="maya">💳 Maya</option>
  <option value="gcash">💳 GCash</option>
</select>

// AFTER:
<select>
  <option value="">All Payment</option>
  <option value="cod">💵 COD</option>
  <option value="maya">💳 Maya</option>
</select>
```

## Manual Steps

### Step 1: Edit CartTable.js
1. Open `casptone-front\src\components\Customers\CartTable.js`
2. Go to line 506
3. Delete lines 506-521 (the entire GCash label block including the blank line after)
4. Save the file

### Step 2: Edit EnhancedOrdersManagement.js
1. Open `casptone-front\src\components\Admin\EnhancedOrdersManagement.js`
2. Go to line 164, remove the gcash line from methodInfo
3. Go to line 281, remove the gcash option from the select dropdown
4. Save the file

### Step 3: Run Database Seeder
```bash
cd capstone-back
php artisan migrate:fresh --seed
```

### Step 4: Restart Frontend
```bash
cd casptone-front
npm start
```

## Verification

After making these changes:

### ✅ Checkout Page Should Show:
- Cash on Delivery option
- Maya option
- **NO GCash option**

### ✅ Admin Orders Page Should Show:
- Payment filter: COD, Maya only
- Order payment badges: COD or Maya only

### ✅ Database Orders Should Have:
- All orders with `payment_method = 'maya'` (from seeder)

## Why These Changes?

1. **Simplified Payment Options**: Only 2 payment methods (COD and Maya)
2. **Cleaner UI**: Less clutter in checkout
3. **Consistent Data**: All seeded orders use Maya
4. **Easier Testing**: Fewer payment scenarios to test

## Summary

- ✅ Backend seeder: Changed to Maya (already done)
- ⏳ Frontend checkout: Remove GCash option (manual edit needed)
- ⏳ Frontend admin: Remove GCash from filters (manual edit needed)

Total lines to delete: ~20 lines across 2 files
