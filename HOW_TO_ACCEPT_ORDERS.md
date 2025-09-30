# How to Accept Orders Before Production Starts

## 📍 **Where to Accept Orders**

### **Option 1: Admin Sidebar Menu** ✅ (Recommended)
1. Login as admin (`admin@gmail.com` / `password`)
2. Look at the left sidebar
3. Click on **"Order Acceptance"** (with checkmark icon)
4. You'll see all pending orders

### **Option 2: Direct URL**
Navigate to: `http://localhost:3000/order-acceptance`

---

## 🎯 **Step-by-Step: How to Accept an Order**

### **Step 1: View Pending Orders**
```
Admin Dashboard → Sidebar → "Order Acceptance"
```

You'll see:
- **Statistics Cards**: Pending, Accepted Today, Accepted This Week, Rejected
- **Tabs**: Pending | Accepted | Rejected
- **Order Cards** showing:
  - Order number
  - Customer name, phone, address
  - Order items with quantities
  - Total price
  - Payment method
  - Days waiting

### **Step 2: Review Order Details**
Each pending order card shows:
- ✅ Customer Information
- ✅ Order Items (with "Production Required" badge)
- ✅ Total Price
- ✅ Payment Status
- ✅ How many days customer has been waiting

### **Step 3: Accept the Order**
1. Click **"Accept Order"** button (green)
2. A modal will appear
3. Optionally add admin notes (e.g., "Materials available, starting production")
4. Click **"Accept Order"** to confirm

**What Happens**:
- ✅ Order status changes to "accepted"
- ✅ Production record created automatically
- ✅ 6 Production processes created (all pending):
  - Material Preparation
  - Cutting & Shaping
  - Assembly
  - Sanding & Surface Preparation
  - Finishing
  - Quality Check & Packaging
- ✅ Customer sees "Order Accepted!" message
- ✅ Production appears in Productions page

### **Step 4: Start Production**
After accepting:
1. Go to **Productions** page (sidebar)
2. Find the newly created production
3. Update stages manually or start processes
4. Customer sees real-time progress updates

---

## ❌ **How to Reject an Order**

If you need to reject an order:

1. Click **"Reject Order"** button (red)
2. A modal will appear
3. **Enter rejection reason** (required)
   - Example: "Out of stock for this item"
   - Example: "Cannot meet delivery deadline"
4. Optionally add admin notes
5. Click **"Reject Order"** to confirm

**What Happens**:
- ❌ Order status changes to "rejected"
- ❌ Rejection reason saved
- ❌ Customer sees rejection message with reason
- ❌ No production records created

---

## 📊 **Order Acceptance Page Features**

### **Statistics Dashboard**
- **Pending**: Number of orders waiting for review
- **Accepted Today**: Orders accepted in the last 24 hours
- **Accepted This Week**: Orders accepted this week
- **Rejected**: Total rejected orders

### **Three Tabs**
1. **Pending Tab**: Orders waiting for your review
2. **Accepted Tab**: Recently accepted orders
3. **Rejected Tab**: Orders that were rejected

### **Auto-Refresh**
- Page refreshes every 30 seconds
- Always shows latest order status

---

## 🔄 **Complete Workflow**

```
1. Customer places order
   ↓
2. Order appears in "Order Acceptance" page (Pending tab)
   ↓
3. Admin reviews order details
   ↓
4. Admin clicks "Accept Order"
   ↓
5. Production records created automatically
   ↓
6. Order moves to "Accepted" tab
   ↓
7. Production appears in "Productions" page
   ↓
8. Admin can start production processes
   ↓
9. Customer sees real-time progress
```

---

## 🎨 **Visual Guide**

### **Sidebar Navigation**
```
┌─────────────────────────┐
│  🏭 Unick              │
├─────────────────────────┤
│  📊 Dashboard          │
│  📦 Products           │
│  📋 Orders             │
│  ✅ Order Acceptance   │ ← Click here!
│  📦 Inventory          │
│  🏭 Productions        │
│  📊 Reports            │
└─────────────────────────┘
```

### **Order Acceptance Page**
```
┌──────────────────────────────────────────────┐
│  ✅ Order Acceptance Management              │
├──────────────────────────────────────────────┤
│  [Pending: 3] [Accepted: 5] [Rejected: 1]   │
├──────────────────────────────────────────────┤
│  [Pending] [Accepted] [Rejected]  ← Tabs    │
├──────────────────────────────────────────────┤
│  ┌────────────────────────────────────────┐ │
│  │ Order #00001        [3 days waiting]   │ │
│  │ Customer: John Doe                     │ │
│  │ Phone: +63 917 123 4567               │ │
│  │ Items: Dining Table x1                │ │
│  │ Total: ₱15,000                        │ │
│  │                                        │ │
│  │ [✅ Accept Order] [❌ Reject Order]   │ │
│  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

---

## ⚡ **Quick Tips**

1. **Check Pending Orders Daily**: Look for orders waiting for acceptance
2. **Review Customer Details**: Make sure contact info is correct
3. **Check Materials**: Verify you have materials before accepting
4. **Add Notes**: Use admin notes for internal tracking
5. **Monitor Statistics**: Keep track of acceptance rate

---

## 🚨 **Important Notes**

- ⚠️ **Production ONLY starts after acceptance**
- ⚠️ Orders stay in "pending" until you accept them
- ⚠️ Customer sees "Awaiting admin acceptance" until you act
- ⚠️ Once accepted, production records are created automatically
- ⚠️ You cannot undo acceptance (but you can update production status)

---

## 📱 **Customer View**

### **Before Acceptance**:
```
┌────────────────────────────────────┐
│ ⚠️ Order Awaiting Acceptance      │
│                                    │
│ Your order has been received and   │
│ is awaiting admin review.          │
│ Production will begin once the     │
│ order is accepted.                 │
└────────────────────────────────────┘
```

### **After Acceptance**:
```
┌────────────────────────────────────┐
│ ✅ Order Accepted!                 │
│                                    │
│ Your order has been accepted and   │
│ production will begin shortly.     │
│                                    │
│ Accepted: Sep 30, 2025 3:30 PM    │
│ by Admin Name                      │
└────────────────────────────────────┘

Progress: 0%
Current Stage: Material Preparation
```

---

## ✅ **Summary**

**To accept orders before production starts:**

1. ✅ Login as admin
2. ✅ Click **"Order Acceptance"** in sidebar
3. ✅ Review pending orders
4. ✅ Click **"Accept Order"**
5. ✅ Confirm acceptance
6. ✅ Production created automatically
7. ✅ Go to Productions page to start work

**That's it! The order acceptance workflow is now active and ready to use!** 🎉
