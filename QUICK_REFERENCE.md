# 🚀 Quick Reference Guide

## 📋 System Flow (One Page)

### **1. Customer Orders Product**
```
Browse → Add to Cart → Checkout → Order Created (pending acceptance)
```

### **2. Admin Accepts Order**
```
Order Acceptance Page → Accept → Production Created (6 processes)
```

### **3. Automatic Progress Updates**
```
Time passes → System calculates progress → Processes auto-complete
```

### **4. Customer Tracks Progress**
```
My Orders → Real-time progress → See current stage & ETA
```

### **5. Production Completes**
```
100% done → Shows in "Ready to Deliver" → Admin marks ready
```

---

## 🎯 Key Features

| Feature | How It Works |
|---------|-------------|
| **Order Acceptance** | Admin accepts → Creates production + 6 processes |
| **Time-Based Progress** | Elapsed time / Total time = Progress % |
| **Auto Process Updates** | Processes complete when time threshold reached |
| **Predictive Analytics** | Historical data → 7-day forecast (85% confidence) |
| **Customer Tracking** | Real-time progress bar + process timeline |

---

## 📊 Production Timeline (14 days)

```
Day 1-2:   Material Preparation (10%)
Day 3-5:   Cutting & Shaping (20%)
Day 6-9:   Assembly (30%)
Day 10-11: Sanding & Surface Prep (15%)
Day 12-14: Finishing (20%)
Day 14:    Quality Check (5%)
```

---

## 🔗 Important API Endpoints

```
# Customer
GET  /api/orders/{id}/tracking

# Admin
GET  /api/orders/pending-acceptance
POST /api/orders/{id}/accept
GET  /api/productions

# Analytics
GET  /api/productions/predictive
GET  /api/productions/daily-summary
```

---

## 🧪 Demo Steps

### **Quick Demo (5 minutes)**:
1. Login as customer → Place order
2. Login as admin → Accept order
3. Check Productions page → See new production
4. Change device date +7 days
5. Refresh page → Progress jumps to 50%
6. Change date +7 more days
7. Refresh → 100% complete!

### **Full Demo (10 minutes)**:
1. Customer places order
2. Admin reviews in Order Acceptance
3. Admin accepts → Production created
4. Show customer tracking view
5. Explain 6-stage process
6. Change date to show time-based progress
7. Show predictive analytics
8. Mark as ready for delivery
9. Show customer notification

---

## 💡 Key Formulas

### **Progress Calculation**:
```
Progress % = (Elapsed Time / Total Time) × 100
```

### **Prediction Formula**:
```
Predicted Output = Historical Avg × (1 + (Efficiency - 100) / 100)
                 + (Trend × 0.5)
                 × Weekend Adjustment
```

---

## 🎓 Common Questions

**Q: How does progress update automatically?**  
A: Every time you fetch productions, system calculates elapsed time and updates processes.

**Q: What happens when I change device date?**  
A: System recalculates progress based on new current time. Processes auto-complete if time threshold reached.

**Q: How accurate are predictions?**  
A: 85% confidence with 30 days of data. Minimum 3 days required.

**Q: Can admin manually update progress?**  
A: Yes, admin can manually change stages, but time-based updates will override on next refresh.

**Q: When does order show "Ready to Deliver"?**  
A: When production reaches 100% (all 6 processes completed).

---

## 📁 Important Files

```
Backend:
- ProductionController.php (Main logic)
- OrderAcceptanceController.php (Order acceptance)
- Production.php (Model)
- ProductionProcess.php (Model)

Frontend:
- ProductionPage.jsx (Admin dashboard)
- OrderAcceptance.jsx (Order acceptance)
- ProductionTracking.jsx (Customer view)

Database:
- orders (Order data)
- productions (Production records)
- production_processes (6 processes per production)
- order_tracking (Customer tracking)
```

---

## ✅ Checklist for Demo

- [ ] Backend server running (`php artisan serve`)
- [ ] Frontend running (`npm start`)
- [ ] Database seeded with sample data
- [ ] Customer account ready (customer@gmail.com)
- [ ] Admin account ready (admin@gmail.com)
- [ ] At least 1 pending order available
- [ ] Device date can be changed for demo
- [ ] Browser console open for debugging

---

## 🎯 Success Indicators

✅ Order acceptance creates production  
✅ Production has 6 processes  
✅ Progress updates when date changes  
✅ Customer sees real-time tracking  
✅ Predictions show 7-day forecast  
✅ 100% production shows in Ready to Deliver  

---

**Everything you need to know in one page!** 🎉
