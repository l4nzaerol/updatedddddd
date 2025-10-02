# Quick Price Calculator Reference

## 🚀 Quick Start

### Run Seeder (First Time):
```bash
php artisan db:seed --class=InventoryItemsSeeder
```

### API Endpoints:
```
POST /api/price-calculator/calculate          - Calculate custom price
GET  /api/price-calculator/product/{id}       - Get product price
GET  /api/price-calculator/presets            - Get pricing presets
POST /api/price-calculator/bulk               - Bulk calculate
```

## 📊 Pricing Presets

| Product  | Labor % | Profit % | Use Case                    |
|----------|---------|----------|-----------------------------|
| Alkansya | 25%     | 30%      | Small decorative items      |
| Table    | 40%     | 35%      | Large furniture             |
| Chair    | 35%     | 30%      | Medium furniture            |
| Custom   | 30%     | 25%      | Standard products           |

## 💰 Material Costs (Key Items)

### Alkansya:
- Pinewood 1x4x8ft: **₱85.00**/piece
- Plywood 4.2mm: **₱320.00**/sheet
- Acrylic 1.5mm: **₱450.00**/sheet
- Pin Nails F30: **₱180.00**/box
- Stikwell 250: **₱65.00**/tube

### Table:
- Mahogany 2x4x8ft: **₱420.00**/piece
- Mahogany 1x6x10ft: **₱580.00**/piece
- Plywood 18mm: **₱850.00**/sheet
- Wood Stain 1L: **₱380.00**/liter

### Chair:
- Mahogany 2x2x6ft: **₱280.00**/piece
- Mahogany 1x4x6ft: **₱320.00**/piece
- Foam Cushion: **₱380.00**/sheet
- Upholstery Fabric: **₱220.00**/yard

## 🧮 Formula

```
Material Cost = Σ(Unit Cost × Quantity)
Labor Cost = Material Cost × (Labor % ÷ 100)
Production Cost = Material Cost + Labor Cost
Selling Price = Production Cost × (1 + Profit % ÷ 100)
Profit = Selling Price - Production Cost
```

## 📝 Example Request

```json
POST /api/price-calculator/calculate
{
  "materials": [
    { "sku": "PW-1x4x8", "quantity": 0.5 },
    { "sku": "PLY-4.2-4x8", "quantity": 0.25 }
  ],
  "labor_percentage": 30,
  "profit_margin": 25
}
```

## 📊 Example Response

```json
{
  "material_cost": 122.50,
  "labor_cost": 36.75,
  "production_cost": 159.25,
  "suggested_price": 199.06,
  "profit_amount": 39.81
}
```

## 💡 Quick Examples

### Alkansya (Small):
- Materials: **₱173**
- Labor (25%): **₱43**
- Cost: **₱216**
- Price (30%): **₱281**
- Profit: **₱65**

### Table (Large):
- Materials: **₱6,085**
- Labor (40%): **₱2,434**
- Cost: **₱8,519**
- Price (35%): **₱11,501**
- Profit: **₱2,982**

### Chair (Medium):
- Materials: **₱2,700**
- Labor (35%): **₱945**
- Cost: **₱3,645**
- Price (30%): **₱4,739**
- Profit: **₱1,094**

## ⚙️ Labor Guidelines

- **20-25%**: Simple assembly
- **30-35%**: Moderate complexity
- **40-50%**: High craftsmanship

## 📈 Profit Guidelines

- **20-25%**: Competitive pricing
- **25-30%**: Standard margin
- **30-40%**: Premium products

---
**Quick Tip**: Always ensure selling price > production cost!
