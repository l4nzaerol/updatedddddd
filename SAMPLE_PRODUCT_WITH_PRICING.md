# Sample Product Creation with Automatic Pricing

## Example 1: Alkansya (Money Box)

### Product Details:
- **Name**: Wooden Alkansya
- **Description**: Handcrafted wooden money box with acrylic window
- **Category**: Home Decor

### Materials Needed (Bill of Materials):

| SKU | Material Name | Unit Cost | Quantity Needed | Total Cost |
|-----|---------------|-----------|-----------------|------------|
| PW-1x4x8 | Pinewood 1x4x8ft | ₱85.00 | 0.5 piece | ₱42.50 |
| PLY-4.2-4x8 | Plywood 4.2mm 4x8ft | ₱320.00 | 0.25 sheet | ₱80.00 |
| ACR-1.5-4x8 | Acrylic 1.5mm 4x8ft | ₱450.00 | 0.1 sheet | ₱45.00 |
| PN-F30 | Pin Nail F30 | ₱180.00 | 0.02 box (20 pcs) | ₱3.60 |
| BS-1.5 | Black Screw 1 1/2 | ₱250.00 | 0.008 box (4 pcs) | ₱2.00 |
| STKW-250 | Stikwell 250 | ₱65.00 | 0.1 tube | ₱6.50 |
| GRP-4-120 | Grinder pad 4inch | ₱25.00 | 0.5 piece | ₱12.50 |
| STK-24-W | Sticker White | ₱850.00 | 0.02 roll | ₱17.00 |

**Total Material Cost: ₱209.10**

### Price Calculation:

```
Material Cost:        ₱209.10
Labor (25%):          ₱52.28
─────────────────────────────
Production Cost:      ₱261.38
Profit (30%):         ₱78.41
─────────────────────────────
Suggested Price:      ₱339.79
Rounded Price:        ₱340.00
```

### API Request to Calculate:

```json
POST /api/price-calculator/calculate
Content-Type: application/json

{
  "materials": [
    { "sku": "PW-1x4x8", "quantity": 0.5 },
    { "sku": "PLY-4.2-4x8", "quantity": 0.25 },
    { "sku": "ACR-1.5-4x8", "quantity": 0.1 },
    { "sku": "PN-F30", "quantity": 0.02 },
    { "sku": "BS-1.5", "quantity": 0.008 },
    { "sku": "STKW-250", "quantity": 0.1 },
    { "sku": "GRP-4-120", "quantity": 0.5 },
    { "sku": "STK-24-W", "quantity": 0.02 }
  ],
  "labor_percentage": 25,
  "profit_margin": 30
}
```

---

## Example 2: Dining Table (4-Seater)

### Product Details:
- **Name**: Mahogany Dining Table 4-Seater
- **Description**: Solid mahogany dining table with walnut finish
- **Category**: Furniture

### Materials Needed:

| SKU | Material Name | Unit Cost | Quantity Needed | Total Cost |
|-----|---------------|-----------|-----------------|------------|
| HW-MAHOG-2x4x8 | Mahogany 2x4x8ft (Legs) | ₱420.00 | 4 pieces | ₱1,680.00 |
| HW-MAHOG-1x6x10 | Mahogany 1x6x10ft (Top) | ₱580.00 | 6 pieces | ₱3,480.00 |
| PLY-18-4x8 | Plywood 18mm | ₱850.00 | 0.5 sheet | ₱425.00 |
| WS-3 | Wood Screws 3" | ₱320.00 | 0.5 box (100 pcs) | ₱160.00 |
| WG-500 | Wood Glue 500ml | ₱145.00 | 2 bottles | ₱290.00 |
| SAND-80 | Sandpaper 80 Grit | ₱8.00 | 10 sheets | ₱80.00 |
| SAND-120 | Sandpaper 120 Grit | ₱8.00 | 10 sheets | ₱80.00 |
| SAND-220 | Sandpaper 220 Grit | ₱10.00 | 8 sheets | ₱80.00 |
| STAIN-WALNUT-1L | Wood Stain 1L | ₱380.00 | 1 liter | ₱380.00 |
| POLY-GLOSS-1L | Polyurethane 1L | ₱420.00 | 1 liter | ₱420.00 |
| TBRACKET-METAL | Metal Brackets | ₱180.00 | 2 sets | ₱360.00 |
| FELT-PAD-LG | Felt Pads Large | ₱45.00 | 1 pack | ₱45.00 |

**Total Material Cost: ₱7,480.00**

### Price Calculation:

```
Material Cost:        ₱7,480.00
Labor (40%):          ₱2,992.00
─────────────────────────────
Production Cost:      ₱10,472.00
Profit (35%):         ₱3,665.20
─────────────────────────────
Suggested Price:      ₱14,137.20
Rounded Price:        ₱14,140.00
```

### API Request:

```json
POST /api/price-calculator/calculate

{
  "materials": [
    { "sku": "HW-MAHOG-2x4x8", "quantity": 4 },
    { "sku": "HW-MAHOG-1x6x10", "quantity": 6 },
    { "sku": "PLY-18-4x8", "quantity": 0.5 },
    { "sku": "WS-3", "quantity": 0.5 },
    { "sku": "WG-500", "quantity": 2 },
    { "sku": "SAND-80", "quantity": 10 },
    { "sku": "SAND-120", "quantity": 10 },
    { "sku": "SAND-220", "quantity": 8 },
    { "sku": "STAIN-WALNUT-1L", "quantity": 1 },
    { "sku": "POLY-GLOSS-1L", "quantity": 1 },
    { "sku": "TBRACKET-METAL", "quantity": 2 },
    { "sku": "FELT-PAD-LG", "quantity": 1 }
  ],
  "labor_percentage": 40,
  "profit_margin": 35
}
```

---

## Example 3: Dining Chair (Upholstered)

### Product Details:
- **Name**: Mahogany Dining Chair with Cushion
- **Description**: Solid mahogany chair with padded seat
- **Category**: Furniture

### Materials Needed:

| SKU | Material Name | Unit Cost | Quantity Needed | Total Cost |
|-----|---------------|-----------|-----------------|------------|
| HW-MAHOG-2x2x6 | Mahogany 2x2x6ft (Legs) | ₱280.00 | 4 pieces | ₱1,120.00 |
| HW-MAHOG-1x4x6 | Mahogany 1x4x6ft (Back) | ₱320.00 | 2 pieces | ₱640.00 |
| PLY-12-2x4 | Plywood 12mm | ₱280.00 | 0.5 sheet | ₱140.00 |
| WS-2.5 | Wood Screws 2.5" | ₱280.00 | 0.25 box (50 pcs) | ₱70.00 |
| WD-8MM | Wood Dowels 8mm | ₱5.00 | 8 pieces | ₱40.00 |
| FOAM-CUSHION-2 | Foam Cushion 2" | ₱380.00 | 0.25 sheet | ₱95.00 |
| FABRIC-UPHOLSTERY | Upholstery Fabric | ₱220.00 | 1.5 yards | ₱330.00 |
| STAPLES-UPHOLSTERY | Upholstery Staples | ₱95.00 | 0.1 box (100 pcs) | ₱9.50 |
| WG-250 | Wood Glue 250ml | ₱85.00 | 1 bottle | ₱85.00 |
| STAIN-WALNUT-500 | Wood Stain 500ml | ₱220.00 | 0.5 bottle | ₱110.00 |
| LACQUER-SPRAY | Lacquer Spray | ₱180.00 | 1 can | ₱180.00 |
| FELT-PAD-SM | Felt Pads Small | ₱35.00 | 1 pack | ₱35.00 |

**Total Material Cost: ₱2,854.50**

### Price Calculation:

```
Material Cost:        ₱2,854.50
Labor (35%):          ₱999.08
─────────────────────────────
Production Cost:      ₱3,853.58
Profit (30%):         ₱1,156.07
─────────────────────────────
Suggested Price:      ₱5,009.65
Rounded Price:        ₱5,010.00
```

### API Request:

```json
POST /api/price-calculator/calculate

{
  "materials": [
    { "sku": "HW-MAHOG-2x2x6", "quantity": 4 },
    { "sku": "HW-MAHOG-1x4x6", "quantity": 2 },
    { "sku": "PLY-12-2x4", "quantity": 0.5 },
    { "sku": "WS-2.5", "quantity": 0.25 },
    { "sku": "WD-8MM", "quantity": 8 },
    { "sku": "FOAM-CUSHION-2", "quantity": 0.25 },
    { "sku": "FABRIC-UPHOLSTERY", "quantity": 1.5 },
    { "sku": "STAPLES-UPHOLSTERY", "quantity": 0.1 },
    { "sku": "WG-250", "quantity": 1 },
    { "sku": "STAIN-WALNUT-500", "quantity": 0.5 },
    { "sku": "LACQUER-SPRAY", "quantity": 1 },
    { "sku": "FELT-PAD-SM", "quantity": 1 }
  ],
  "labor_percentage": 35,
  "profit_margin": 30
}
```

---

## How to Use in Your System

### Step 1: Create Product (Frontend)
```javascript
const productData = {
  name: "Wooden Alkansya",
  description: "Handcrafted wooden money box",
  category: "Home Decor",
  materials: [
    { sku: "PW-1x4x8", quantity: 0.5 },
    { sku: "PLY-4.2-4x8", quantity: 0.25 },
    // ... other materials
  ]
};

// Calculate suggested price
const priceResponse = await fetch('/api/price-calculator/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    materials: productData.materials,
    labor_percentage: 25, // Alkansya preset
    profit_margin: 30
  })
});

const pricing = await priceResponse.json();
console.log('Suggested Price:', pricing.suggested_price); // ₱339.79

// Create product with suggested price
productData.price = Math.round(pricing.suggested_price);
```

### Step 2: Display Price Breakdown
```
╔═══════════════════════════════════╗
║  PRICE CALCULATION BREAKDOWN      ║
╠═══════════════════════════════════╣
║  Material Cost:      ₱209.10      ║
║  Labor (25%):        ₱52.28       ║
║  ─────────────────────────────    ║
║  Production Cost:    ₱261.38      ║
║  Profit (30%):       ₱78.41       ║
║  ─────────────────────────────    ║
║  Suggested Price:    ₱339.79      ║
║  Recommended:        ₱340.00      ║
╚═══════════════════════════════════╝

[Use This Price] [Adjust] [Manual Override]
```

---

## Quick Reference Table

| Product Type | Material Cost | Labor % | Profit % | Final Price |
|--------------|---------------|---------|----------|-------------|
| Alkansya     | ₱209.10      | 25%     | 30%      | ₱340.00     |
| Dining Table | ₱7,480.00    | 40%     | 35%      | ₱14,140.00  |
| Chair        | ₱2,854.50    | 35%     | 30%      | ₱5,010.00   |

---

## Testing Commands

### 1. Seed the database:
```bash
php artisan db:seed --class=InventoryItemsSeeder
```

### 2. Test Alkansya pricing:
```bash
curl -X POST http://localhost:8000/api/price-calculator/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "materials": [
      {"sku": "PW-1x4x8", "quantity": 0.5},
      {"sku": "PLY-4.2-4x8", "quantity": 0.25},
      {"sku": "ACR-1.5-4x8", "quantity": 0.1}
    ],
    "labor_percentage": 25,
    "profit_margin": 30
  }'
```

### 3. Expected Response:
```json
{
  "material_cost": 167.50,
  "labor_cost": 41.88,
  "labor_percentage": 25,
  "production_cost": 209.38,
  "profit_margin": 30,
  "suggested_price": 272.19,
  "profit_amount": 62.81,
  "material_breakdown": [...]
}
```

---

**Ready to use!** Just call the API with your materials and get instant price suggestions! 🚀
