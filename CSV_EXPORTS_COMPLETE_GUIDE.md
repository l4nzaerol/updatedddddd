# CSV Export Functionality - Complete Guide

## What is CSV?

**CSV = Comma-Separated Values**

A universal file format for storing data in tables:
```
Column1,Column2,Column3
Value1,Value2,Value3
Value4,Value5,Value6
```

### Benefits:
- ✅ Opens in Excel, Google Sheets, Numbers
- ✅ Universal compatibility across all platforms
- ✅ Easy to share via email
- ✅ Can be imported into databases
- ✅ Small file size
- ✅ Human-readable

## 📦 Inventory CSV Exports (Already Functional)

### 1. Download Stock CSV
**Endpoint**: `/api/reports/stock.csv`

**What it exports**: Current inventory stock levels

**Columns**:
- SKU
- Item Name
- Category
- Current Quantity
- Unit of Measure
- Reorder Point
- Safety Stock
- Stock Status (Normal/Low/Critical)
- Last Updated

**Example Output**:
```csv
SKU,Item Name,Category,Current Quantity,Unit,Reorder Point,Safety Stock,Status,Last Updated
WD-001,Hardwood 2x6x8ft,Raw Materials,50,piece,20,10,Normal,2025-10-01
WD-002,Plywood 18mm 4x8ft,Raw Materials,15,sheet,10,5,Low,2025-10-01
```

**Use Case**: 
- Check current inventory levels
- Identify low stock items
- Share with suppliers for ordering

---

### 2. Download Usage CSV
**Endpoint**: `/api/reports/usage.csv?days=90`

**What it exports**: Inventory usage history (last 90 days)

**Columns**:
- Date
- SKU
- Item Name
- Quantity Used
- Production Order ID
- Product Made
- Remaining Stock
- Usage Rate

**Example Output**:
```csv
Date,SKU,Item Name,Quantity Used,Order ID,Product,Remaining Stock,Usage Rate
2025-09-30,WD-001,Hardwood 2x6x8ft,4,7,Dining Table,46,0.13/day
2025-09-29,PL-001,Plywood 18mm 4x8ft,1,7,Dining Table,15,0.03/day
```

**Use Case**:
- Track material consumption
- Identify usage patterns
- Forecast future needs
- Calculate production costs

---

### 3. Download Replenishment CSV
**Endpoint**: `/api/reports/replenishment.csv`

**What it exports**: Items needing reorder with priorities

**Columns**:
- Priority (Urgent/High/Medium/Low)
- SKU
- Item Name
- Current Stock
- Reorder Point
- Recommended Order Quantity
- Estimated Reorder Date
- Supplier
- Lead Time (days)
- Estimated Cost

**Example Output**:
```csv
Priority,SKU,Item Name,Current Stock,Reorder Point,Recommended Qty,Reorder Date,Supplier,Lead Time,Cost
Urgent,WD-002,Plywood 18mm 4x8ft,5,10,20,2025-10-02,Supplier A,7,₱15000
High,HW-001,Wood Screws 3 inch,50,100,200,2025-10-05,Supplier B,3,₱2000
```

**Use Case**:
- Plan purchasing orders
- Prioritize urgent items
- Budget for materials
- Coordinate with suppliers

---

## 🏭 Production CSV Exports (Newly Added - Functional)

### 1. Download Production CSV
**What it exports**: All production data with daily output

**Columns**:
- Date
- Product
- Quantity
- Stage
- Status

**Example Output**:
```csv
Date,Product,Quantity,Stage,Status
2025-09-26,Various Products,2,Multiple Stages,Active
2025-09-27,Various Products,1,Multiple Stages,Active
2025-09-30,Various Products,3,Multiple Stages,Active
```

**Use Case**:
- Track daily production output
- Analyze production trends
- Report to management
- Performance reviews

---

### 2. Download Stage Breakdown CSV
**What it exports**: Distribution of orders across production stages

**Columns**:
- Stage Name
- Number of Orders
- Percentage

**Example Output**:
```csv
Stage Name,Number of Orders,Percentage
Material Preparation,2,28.57%
Assembly,1,14.29%
Sanding & Surface Preparation,1,14.29%
Finishing,1,14.29%
Quality Check & Packaging,2,28.57%
```

**Use Case**:
- Identify bottlenecks
- Balance workload
- Resource allocation
- Capacity planning

---

### 3. Download Daily Output CSV
**What it exports**: Daily production quantities with day of week

**Columns**:
- Date
- Quantity Produced
- Day of Week

**Example Output**:
```csv
Date,Quantity Produced,Day of Week
2025-09-26,2,Thursday
2025-09-27,1,Friday
2025-09-28,0,Saturday
2025-09-29,0,Sunday
2025-09-30,3,Monday
2025-10-01,1,Tuesday
```

**Use Case**:
- Track productivity by day
- Identify peak production days
- Plan staffing schedules
- Analyze weekly patterns

---

## How to Use CSV Exports

### Step 1: Click Export Button
Navigate to Reports page and click the desired CSV export button.

### Step 2: File Downloads
Browser automatically downloads the CSV file with a timestamped filename:
- `stock_2025-10-01.csv`
- `usage_2025-10-01.csv`
- `stage_breakdown_2025-10-01.csv`

### Step 3: Open in Spreadsheet
Double-click the file to open in:
- Microsoft Excel
- Google Sheets (upload to Drive)
- Apple Numbers
- LibreOffice Calc

### Step 4: Analyze Data
- Sort columns
- Create charts
- Calculate totals
- Filter data
- Share with team

---

## Technical Implementation

### Frontend (Report.jsx)
```javascript
// Inventory exports (already functional)
<button onClick={downloadStockCsv}>Download Stock CSV</button>
<button onClick={() => downloadUsageCsv(90)}>Download Usage CSV</button>
<button onClick={downloadReplenishmentCsv}>Download Replenishment CSV</button>

// Production exports (newly added)
<button onClick={handleExportProductionCSV}>Download Production CSV</button>
<button onClick={handleExportStageBreakdown}>Download Stage Breakdown CSV</button>
<button onClick={handleExportDailyOutput}>Download Daily Output CSV</button>
```

### Backend Routes
```
GET /api/reports/stock.csv
GET /api/reports/usage.csv?days=90
GET /api/reports/replenishment.csv
```

### Data Flow
```
User clicks button
    ↓
Frontend calls API
    ↓
Backend queries database
    ↓
Formats data as CSV
    ↓
Returns CSV file
    ↓
Browser downloads file
```

---

## Benefits for Your Business

### 📊 Inventory Management
- **Stock CSV**: Quick inventory snapshot
- **Usage CSV**: Track consumption patterns
- **Replenishment CSV**: Never run out of materials

### 🏭 Production Management
- **Production CSV**: Monitor daily output
- **Stage Breakdown CSV**: Identify bottlenecks
- **Daily Output CSV**: Optimize scheduling

### 💼 Business Intelligence
- Import into BI tools
- Create custom reports
- Share with stakeholders
- Archive for records

### 📈 Decision Making
- Data-driven insights
- Trend analysis
- Performance metrics
- Cost optimization

---

## Summary

### ✅ All CSV Exports Are Functional

**Inventory (3 exports)**:
- Stock levels
- Usage history
- Replenishment schedule

**Production (3 exports)**:
- Production data
- Stage breakdown
- Daily output

### ✅ Automated Data
- Real-time from database
- No manual entry needed
- Always up-to-date

### ✅ Professional Format
- Clean column headers
- Properly formatted data
- Ready for analysis

### ✅ Easy to Use
- One-click download
- Opens in any spreadsheet
- Share via email

All CSV export functionality is now **complete and fully functional** with automated output based on your real production and inventory data!
