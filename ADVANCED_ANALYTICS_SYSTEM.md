# Advanced Analytics System - Complete

## Overview

A comprehensive analytics system that provides accurate insights based on seeder data and manual orders. The system highlights product-specific analytics for **Tables**, **Chairs**, and **Alkansya** with predictive capabilities and automated reporting.

## Analytics Endpoints

### 1. Production Output Analytics
**Endpoint:** `GET /api/analytics/production-output`

**Parameters:**
- `start_date` (optional): Start date (default: 3 months ago)
- `end_date` (optional): End date (default: today)
- `timeframe` (optional): daily, weekly, monthly (default: daily)

**Features:**
- Daily/weekly/monthly output trends by product
- Top-performing product lines
- Efficiency metrics per product
- Total output and averages

**Response:**
```json
{
  "period": {"start": "2024-08-07", "end": "2024-11-07"},
  "timeframe": "daily",
  "products": {
    "table": {
      "name": "Dining Table",
      "output_trend": [
        {"period": "2024-11-01", "output": 2, "count": 2},
        {"period": "2024-11-02", "output": 1, "count": 1}
      ],
      "totals": {
        "total_output": 15,
        "total_productions": 8,
        "avg_per_period": 1.88
      }
    },
    "chair": {
      "name": "Wooden Chair",
      "output_trend": [...],
      "totals": {...}
    },
    "alkansya": {
      "name": "Alkansya",
      "output_trend": [...],
      "totals": {
        "total_output": 2949,
        "total_productions": 77,
        "avg_per_period": 38.3
      }
    }
  },
  "top_performing": [
    {"product": "Alkansya", "output": 2949, "efficiency": 85.5},
    {"product": "Dining Table", "output": 15, "efficiency": 92.3},
    {"product": "Wooden Chair", "output": 20, "efficiency": 88.7}
  ]
}
```

---

### 2. Resource Utilization Analytics
**Endpoint:** `GET /api/analytics/resource-utilization`

**Parameters:**
- `start_date` (optional)
- `end_date` (optional)

**Features:**
- Material usage efficiency (actual vs. estimated)
- Material consumption by product type
- Efficiency percentages
- Variance analysis

**Response:**
```json
{
  "period": {"start": "2024-08-07", "end": "2024-11-07"},
  "material_usage_by_product": [
    {
      "product": "Dining Table",
      "materials": [
        {
          "material": "Mahogany Hardwood 2x4x8ft",
          "sku": "HW-MAHOG-2x4x8",
          "total_used": 60,
          "avg_used": 7.5,
          "unit": "piece"
        },
        {
          "material": "Plywood 18mm 4x8ft",
          "sku": "PLY-18-4x8",
          "total_used": 15,
          "avg_used": 1.88,
          "unit": "sheet"
        }
      ],
      "total_materials": 12
    },
    {
      "product": "Wooden Chair",
      "materials": [...],
      "total_materials": 12
    },
    {
      "product": "Alkansya",
      "materials": [...],
      "total_materials": 14
    }
  ],
  "efficiency": [
    {
      "product": "Dining Table",
      "estimated_usage": 500,
      "actual_usage": 480,
      "efficiency_percentage": 104.17,
      "variance": -20
    }
  ]
}
```

---

### 3. Production Performance Analytics
**Endpoint:** `GET /api/analytics/production-performance`

**Parameters:**
- `start_date` (optional)
- `end_date` (optional)

**Features:**
- Cycle time analysis (time to complete one product)
- Throughput rate (finished goods per unit of time)
- Min/max/average cycle times
- Daily/weekly/monthly throughput

**Response:**
```json
{
  "period": {"start": "2024-08-07", "end": "2024-11-07", "total_days": 92},
  "cycle_time_analysis": [
    {
      "product_type": "Table",
      "avg_cycle_time_days": 12.5,
      "min_cycle_time_days": 10,
      "max_cycle_time_days": 15,
      "total_completed": 8
    },
    {
      "product_type": "Chair",
      "avg_cycle_time_days": 10.2,
      "min_cycle_time_days": 8,
      "max_cycle_time_days": 13,
      "total_completed": 5
    },
    {
      "product_type": "Alkansya",
      "avg_cycle_time_days": 7.0,
      "min_cycle_time_days": 7,
      "max_cycle_time_days": 7,
      "total_completed": 77
    }
  ],
  "throughput_rate": [
    {
      "product_type": "Table",
      "total_output": 15,
      "throughput_per_day": 0.16,
      "throughput_per_week": 1.14,
      "throughput_per_month": 4.89
    },
    {
      "product_type": "Chair",
      "total_output": 20,
      "throughput_per_day": 0.22,
      "throughput_per_week": 1.52,
      "throughput_per_month": 6.52
    },
    {
      "product_type": "Alkansya",
      "total_output": 2949,
      "throughput_per_day": 32.05,
      "throughput_per_week": 224.35,
      "throughput_per_month": 961.63
    }
  ]
}
```

---

### 4. Predictive Analytics & Forecasting
**Endpoint:** `GET /api/analytics/predictive`

**Parameters:**
- `forecast_days` (optional): Number of days to forecast (default: 30)

**Features:**
- Forecast production capacity
- Predict material usage
- Identify replenishment needs
- Trend analysis (seasonal demand, recurring patterns)

**Response:**
```json
{
  "forecast_period_days": 30,
  "forecast_end_date": "2024-12-07",
  "material_usage_forecast": [
    {
      "material": "Mahogany Hardwood 2x4x8ft",
      "sku": "HW-MAHOG-2x4x8",
      "current_stock": 112,
      "daily_avg_usage": 2.5,
      "forecasted_usage_30_days": 75,
      "remaining_after_forecast": 37,
      "unit": "piece"
    }
  ],
  "production_capacity_forecast": [
    {
      "product_type": "Table",
      "daily_avg_output": 0.16,
      "forecasted_output_30_days": 5,
      "weekly_capacity": 1,
      "monthly_capacity": 5
    },
    {
      "product_type": "Alkansya",
      "daily_avg_output": 38.3,
      "forecasted_output_30_days": 1149,
      "weekly_capacity": 268,
      "monthly_capacity": 1149
    }
  ],
  "inventory_replenishment_needs": [
    {
      "material": "Plywood 4.2mm 4x8ft",
      "sku": "PLY-4.2-4x8",
      "current_stock": 50,
      "days_until_depletion": 5.2,
      "urgency": "critical",
      "recommended_order_qty": 288,
      "unit": "sheet"
    }
  ],
  "trend_analysis": {
    "monthly_trends": [
      {"month": "2024-08", "total_output": 950, "avg_efficiency": 85.2},
      {"month": "2024-09", "total_output": 980, "avg_efficiency": 87.1},
      {"month": "2024-10", "total_output": 1019, "avg_efficiency": 88.5}
    ],
    "overall_trend": "increasing",
    "avg_monthly_output": 983
  }
}
```

---

### 5. Material Usage Trends
**Endpoint:** `GET /api/analytics/material-usage-trends`

**Parameters:**
- `start_date` (optional)
- `end_date` (optional)
- `timeframe` (optional): daily, weekly, monthly

**Features:**
- Material consumption patterns over time
- Usage trends by product type
- Daily/weekly/monthly breakdowns

**Response:**
```json
{
  "period": {"start": "2024-08-07", "end": "2024-11-07"},
  "timeframe": "daily",
  "usage_trends": [
    {
      "period": "2024-11-01",
      "materials": [
        {
          "material": "Mahogany Hardwood 2x4x8ft",
          "sku": "HW-MAHOG-2x4x8",
          "total_used": 8,
          "unit": "piece"
        },
        {
          "material": "Pinewood 1x4x8ft",
          "sku": "PW-1x4x8",
          "total_used": 90,
          "unit": "piece"
        }
      ],
      "total_materials_used": 15
    }
  ]
}
```

---

### 6. Automated Stock Report
**Endpoint:** `GET /api/analytics/automated-stock-report`

**Features:**
- Current stock levels
- Predicted depletion dates
- Suggested reorder points
- Status indicators (critical/low/healthy)
- Daily usage rates
- Days until stockout

**Response:**
```json
{
  "generated_at": "2024-11-07 04:19:21",
  "total_items": 38,
  "summary": {
    "critical_items": 5,
    "low_stock_items": 8,
    "healthy_items": 25
  },
  "items_by_status": {
    "critical": [
      {
        "material": "Plywood 4.2mm 4x8ft",
        "sku": "PLY-4.2-4x8",
        "category": "raw",
        "current_stock": 50,
        "unit": "sheet",
        "safety_stock": 40,
        "reorder_point": 80,
        "max_level": 400,
        "daily_usage_rate": 9.6,
        "days_until_depletion": 5.2,
        "predicted_depletion_date": "2024-11-12",
        "status": "critical",
        "suggested_reorder_qty": 350,
        "lead_time_days": 7
      }
    ],
    "low": [...],
    "healthy": [...]
  },
  "all_items": [...]
}
```

---

## Key Features

### 1. Product-Specific Analytics
Each endpoint highlights data by product type:
- **Dining Table** - Furniture production metrics
- **Wooden Chair** - Furniture production metrics
- **Alkansya** - High-volume production metrics

### 2. Predictive Capabilities
- Material usage forecasting
- Production capacity prediction
- Inventory depletion dates
- Replenishment recommendations

### 3. Automated Reporting
- Real-time stock reports
- Critical item alerts
- Suggested reorder quantities
- Lead time considerations

### 4. Trend Analysis
- Seasonal demand patterns
- Recurring slowdowns
- Resource needs prediction
- Efficiency trends

### 5. Visualization-Ready Data
All endpoints return structured data perfect for:
- Charts and graphs
- Dashboards
- Tables
- Comparison views

---

## Use Cases

### Use Case 1: Production Planning
**Endpoint:** `/analytics/production-output`
- View output trends by product
- Identify top-performing products
- Plan production schedules

### Use Case 2: Material Management
**Endpoint:** `/analytics/resource-utilization`
- Track material efficiency
- Compare actual vs. estimated usage
- Identify waste or overuse

### Use Case 3: Performance Monitoring
**Endpoint:** `/analytics/production-performance`
- Monitor cycle times
- Track throughput rates
- Identify bottlenecks

### Use Case 4: Inventory Planning
**Endpoint:** `/analytics/predictive`
- Forecast material needs
- Plan replenishment schedules
- Avoid stockouts

### Use Case 5: Stock Monitoring
**Endpoint:** `/analytics/automated-stock-report`
- Daily stock status
- Critical item alerts
- Reorder recommendations

### Use Case 6: Trend Analysis
**Endpoint:** `/analytics/material-usage-trends`
- Identify usage patterns
- Plan for seasonal demand
- Optimize inventory levels

---

## Data Sources

### 1. Production Data
- `production` table - Table & Chair productions
- `production_analytics` table - Alkansya daily output

### 2. Inventory Data
- `inventory_items` table - Current stock levels
- `inventory_usage` table - Material consumption records
- `product_materials` table - Bill of Materials (BOM)

### 3. Order Data
- `orders` table - Customer orders
- `order_items` table - Order details

---

## Accuracy Features

### 1. Based on Real Data
- Uses actual seeder data (3 months of Alkansya)
- Includes manual orders created in system
- Real production records

### 2. Product-Specific Calculations
- Separate calculations for each product type
- Respects different production cycles
- Accounts for material differences

### 3. Time-Based Aggregation
- Daily, weekly, monthly views
- Historical trends
- Future forecasts

### 4. Efficiency Metrics
- Actual vs. estimated comparisons
- Variance analysis
- Performance indicators

---

## Integration with Existing System

### Works With:
- ✅ ComprehensiveOrdersSeeder (creates orders/productions)
- ✅ InventoryDeductionSeeder (tracks material usage)
- ✅ AlkansyaDailyOutputSeeder (3-month Alkansya data)
- ✅ Manual orders created through UI
- ✅ Real-time inventory updates

### Updates Automatically:
- New productions are included
- Material usage is tracked
- Inventory changes reflected
- Forecasts adjust to new data

---

## Frontend Integration Example

```javascript
// Get production output analytics
const response = await api.get('/analytics/production-output', {
  params: {
    start_date: '2024-08-01',
    end_date: '2024-11-07',
    timeframe: 'monthly'
  }
});

// Display top performing products
response.data.top_performing.forEach(product => {
  console.log(`${product.product}: ${product.output} units, ${product.efficiency}% efficient`);
});

// Get automated stock report
const stockReport = await api.get('/analytics/automated-stock-report');

// Alert critical items
stockReport.data.items_by_status.critical.forEach(item => {
  alert(`CRITICAL: ${item.material} - Only ${item.days_until_depletion} days left!`);
});
```

---

## Benefits

1. **Accurate Insights** - Based on real production and inventory data
2. **Product-Specific** - Highlights Tables, Chairs, and Alkansya separately
3. **Predictive** - Forecasts future needs and capacity
4. **Automated** - Real-time reports without manual intervention
5. **Actionable** - Provides specific recommendations
6. **Comprehensive** - Covers all aspects of production analytics
7. **Visualization-Ready** - Structured data for charts and dashboards

---

## Files Created

1. ✅ `capstone-back/app/Http/Controllers/AdvancedAnalyticsController.php`
   - 6 analytics endpoints
   - Product-specific calculations
   - Predictive algorithms

2. ✅ `capstone-back/routes/api.php`
   - Added 6 new routes under `/analytics/*`

---

## Summary

✅ Production Output Analytics - Daily/weekly/monthly trends by product
✅ Resource Utilization - Material efficiency and usage by product
✅ Production Performance - Cycle time and throughput analysis
✅ Predictive Analytics - Forecasting and trend analysis
✅ Material Usage Trends - Consumption patterns over time
✅ Automated Stock Report - Real-time inventory status and alerts

**All analytics are product-specific (Table, Chair, Alkansya) and based on accurate seeder data plus manual orders!**
