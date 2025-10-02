# Quick Test Guide - Production Tracking by Product

## 🎯 What to Test

The system now shows **different tracking** based on product type:
- **Table & Chair** → Detailed production tracking
- **Alkansya & Others** → Simple 5-step status

## 🚀 Quick Test Steps

### Test 1: Alkansya Order (Simple Status)

1. **Login as customer**
2. **Add Alkansya to cart** (2 pieces)
3. **Checkout and place order**
4. **Go to "My Orders"**
5. **Click "Track Order"**

**Expected Result:**
```
✅ See simple status timeline:
   [✓] Pending → [✓] Processing → [ ] Ready → [ ] Delivered → [ ] Complete
   
✅ No production stages
✅ Clean, minimal view
✅ Shows: "Processing" badge
```

### Test 2: Table Order (Production Tracking)

1. **Login as customer**
2. **Add Dining Table to cart**
3. **Checkout and place order**
4. **Go to "My Orders"**
5. **Click "Track Order"**

**Expected Result:**
```
✅ See detailed production tracking:
   Progress: 0% [░░░░░░░░░░░░░░░░░░░░]
   
✅ Production stages table:
   - Material Preparation
   - Cutting & Shaping
   - Assembly
   - Sanding
   - Finishing
   - Quality Check
   
✅ ETA displayed
✅ Stage-by-stage breakdown
```

### Test 3: Chair Order (Production Tracking)

1. **Order a Chair product**
2. **Track the order**
3. **Expected:** Same as Table - detailed production tracking

## 📊 Visual Comparison

### Alkansya Tracking:
```
┌────────────────────────────┐
│ Order #123 Status          │
├────────────────────────────┤
│ Products:                  │
│ • Alkansya x2    ₱680      │
├────────────────────────────┤
│ [✓]─[✓]─[2]─[3]─[4]       │
│  ↑    ↑                    │
│ Done Current               │
└────────────────────────────┘
```

### Table Tracking:
```
┌────────────────────────────┐
│ Order #124 Production      │
├────────────────────────────┤
│ Progress: 25%              │
│ [█████░░░░░░░░░░░░░░░]    │
├────────────────────────────┤
│ Material Prep  [✓]         │
│ Cutting        [→]         │
│ Assembly       [ ]         │
│ ...                        │
└────────────────────────────┘
```

## ✅ Success Checklist

### For Alkansya Orders:
- [ ] Shows "Order Status" (not "Production Tracking")
- [ ] 5 simple steps visible
- [ ] Current step highlighted in green
- [ ] Completed steps have checkmarks
- [ ] No production stage details
- [ ] Shows order dates

### For Table/Chair Orders:
- [ ] Shows "Production Tracking"
- [ ] Progress bar visible
- [ ] ETA displayed
- [ ] Stage breakdown table shown
- [ ] Pending/In Progress/Completed columns
- [ ] Real-time updates work

## 🔧 Admin Testing

### Update Order Status:

1. **Login as admin**
2. **Go to Orders page**
3. **Find Alkansya order**
4. **Update status:**
   - Pending → Accepted
   - Accepted → Ready for Delivery
   - Ready → Delivered
5. **Customer sees:** Status timeline updates automatically

### Update Production:

1. **Find Table/Chair order**
2. **Go to Production Tracking**
3. **Update stage progress**
4. **Customer sees:** Progress bar and stages update

## 🐛 Troubleshooting

### Issue: Both show production tracking
**Fix:** Check product name contains "table" or "chair"

### Issue: Both show simple status
**Fix:** Verify API endpoint returns correct tracking_type

### Issue: No tracking data
**Fix:** 
```bash
# Check order exists
# Verify customer is logged in
# Check browser console for errors
```

## 📱 Mobile Testing

Test on mobile devices:
- [ ] Simple status timeline fits screen
- [ ] Production table scrolls horizontally
- [ ] Status badges readable
- [ ] Touch interactions work

## 🎯 Expected Behavior Summary

| Product Type | Tracking View | Steps/Stages | Progress Bar | ETA |
|--------------|---------------|--------------|--------------|-----|
| Alkansya | Simple Status | 5 steps | ❌ | ❌ |
| Table | Production | 6 stages | ✅ | ✅ |
| Chair | Production | 6 stages | ✅ | ✅ |
| Other Products | Simple Status | 5 steps | ❌ | ❌ |

---

**Quick Test:** Order Alkansya and Table separately, track both, see the difference! 🎉
