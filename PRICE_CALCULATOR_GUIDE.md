# Price Calculator System - Complete Guide

## Overview
Automatic price calculation system that suggests product prices based on:
- **Material Costs** - Sum of all materials needed
- **Labor Costs** - Percentage of material cost (customizable)
- **Profit Margin** - Percentage markup for profit (customizable)

## Features Implemented

### 1. **Accurate Unit Costs in Seeder**
All materials now have realistic unit costs in PHP:

#### Alkansya Materials:
- Pinewood 1x4x8ft: ₱85.00/piece
- Plywood 4.2mm 4x8ft: ₱320.00/sheet
- Acrylic 1.5mm 4x8ft: ₱450.00/sheet
- Pin Nail F30: ₱180.00/box (1000 pcs)
- Black Screw 1 1/2: ₱250.00/box (500 pcs)
- Stikwell 250: ₱65.00/tube
- Grinder pad 4inch: ₱25.00/piece
- Sticker White/Black: ₱850.00/roll (50m)
- Transfer Tape: ₱380.00/roll (50m)
- Packing Tape: ₱120.00/roll (300m)
- Fragile Tape: ₱135.00/roll (300m)
- Bubble Wrap: ₱680.00/roll (100m)
- Insulation: ₱720.00/roll (100m)

#### Table Materials:
- Mahogany 2x4x8ft: ₱420.00/piece
- Mahogany 1x6x10ft: ₱580.00/piece
- Plywood 18mm: ₱850.00/sheet
- Wood Screws 3": ₱320.00/box (200 pcs)
- Wood Glue 500ml: ₱145.00/bottle
- Sandpaper (80/120/220): ₱8-10/sheet
- Wood Stain 1L: ₱380.00/liter
- Polyurethane 1L: ₱420.00/liter
- Metal Brackets: ₱180.00/set (4 pcs)
- Felt Pads Large: ₱45.00/pack (8 pcs)

#### Chair Materials:
- Mahogany 2x2x6ft: ₱280.00/piece
- Mahogany 1x4x6ft: ₱320.00/piece
- Plywood 12mm: ₱280.00/sheet
- Wood Screws 2.5": ₱280.00/box (200 pcs)
- Wood Dowels 8mm: ₱5.00/piece (36")
- Foam Cushion 2": ₱380.00/sheet (2x4 ft)
- Upholstery Fabric: ₱220.00/yard
- Upholstery Staples: ₱95.00/box (1000 pcs)
- Wood Glue 250ml: ₱85.00/bottle
- Wood Stain 500ml: ₱220.00/bottle
- Lacquer Spray: ₱180.00/can (400ml)
- Felt Pads Small: ₱35.00/pack (8 pcs)

### 2. **Price Calculator API**

#### Calculate Price (Custom Materials)
```
POST /api/price-calculator/calculate
```

**Request Body:**
```json
{
  "materials": [
    {
      "sku": "PW-1x4x8",
      "quantity": 0.5
    },
    {
      "sku": "PLY-4.2-4x8",
      "quantity": 0.25
    }
  ],
  "labor_percentage": 30,
  "profit_margin": 25
}
```

**Response:**
```json
{
  "material_cost": 122.50,
  "labor_cost": 36.75,
  "labor_percentage": 30,
  "production_cost": 159.25,
  "profit_margin": 25,
  "suggested_price": 199.06,
  "profit_amount": 39.81,
  "material_breakdown": [
    {
      "sku": "PW-1x4x8",
      "name": "Pinewood 1x4x8ft",
      "unit_cost": 85.00,
      "quantity": 0.5,
      "total_cost": 42.50,
      "unit": "piece"
    },
    {
      "sku": "PLY-4.2-4x8",
      "name": "Plywood 4.2mm 4x8ft",
      "unit_cost": 320.00,
      "quantity": 0.25,
      "total_cost": 80.00,
      "unit": "sheet"
    }
  ]
}
```

#### Calculate Price for Existing Product
```
GET /api/price-calculator/product/{productId}
```

Uses the product's Bill of Materials (BOM) to calculate suggested price.

#### Get Pricing Presets
```
GET /api/price-calculator/presets
```

**Response:**
```json
{
  "presets": {
    "alkansya": {
      "name": "Alkansya",
      "labor_percentage": 25,
      "profit_margin": 30,
      "description": "Small decorative items with moderate labor"
    },
    "table": {
      "name": "Dining Table",
      "labor_percentage": 40,
      "profit_margin": 35,
      "description": "Large furniture with high labor cost"
    },
    "chair": {
      "name": "Chair",
      "labor_percentage": 35,
      "profit_margin": 30,
      "description": "Medium furniture with upholstery work"
    },
    "custom": {
      "name": "Custom",
      "labor_percentage": 30,
      "profit_margin": 25,
      "description": "Standard pricing for custom products"
    }
  }
}
```

#### Bulk Calculate
```
POST /api/price-calculator/bulk
```

Calculate prices for multiple products at once.

## Pricing Formula

### Step 1: Calculate Material Cost
```
Material Cost = Σ(Unit Cost × Quantity) for all materials
```

### Step 2: Calculate Labor Cost
```
Labor Cost = Material Cost × (Labor Percentage / 100)
```

### Step 3: Calculate Production Cost
```
Production Cost = Material Cost + Labor Cost
```

### Step 4: Calculate Suggested Selling Price
```
Suggested Price = Production Cost × (1 + Profit Margin / 100)
```

### Step 5: Calculate Profit Amount
```
Profit Amount = Suggested Price - Production Cost
```

## Example Calculations

### Example 1: Alkansya (Small Product)
**Materials:**
- Pinewood: 0.5 piece × ₱85 = ₱42.50
- Plywood: 0.25 sheet × ₱320 = ₱80.00
- Acrylic: 0.1 sheet × ₱450 = ₱45.00
- Pin Nails: 20 pcs (0.02 box) × ₱180 = ₱3.60
- Black Screws: 4 pcs (0.008 box) × ₱250 = ₱2.00

**Material Cost:** ₱173.10

**Labor (25%):** ₱173.10 × 0.25 = ₱43.28

**Production Cost:** ₱173.10 + ₱43.28 = ₱216.38

**Suggested Price (30% profit):** ₱216.38 × 1.30 = ₱281.29

**Profit:** ₱281.29 - ₱216.38 = ₱64.91

### Example 2: Dining Table (Large Product)
**Materials:**
- Mahogany legs: 4 pieces × ₱420 = ₱1,680.00
- Mahogany top: 6 pieces × ₱580 = ₱3,480.00
- Plywood: 0.5 sheet × ₱850 = ₱425.00
- Hardware & Finishing: ~₱500.00

**Material Cost:** ₱6,085.00

**Labor (40%):** ₱6,085.00 × 0.40 = ₱2,434.00

**Production Cost:** ₱6,085.00 + ₱2,434.00 = ₱8,519.00

**Suggested Price (35% profit):** ₱8,519.00 × 1.35 = ₱11,500.65

**Profit:** ₱11,500.65 - ₱8,519.00 = ₱2,981.65

### Example 3: Chair (Medium Product)
**Materials:**
- Mahogany legs: 4 pieces × ₱280 = ₱1,120.00
- Mahogany backrest: 2 pieces × ₱320 = ₱640.00
- Plywood seat: 0.5 sheet × ₱280 = ₱140.00
- Foam & Fabric: ~₱600.00
- Hardware: ~₱200.00

**Material Cost:** ₱2,700.00

**Labor (35%):** ₱2,700.00 × 0.35 = ₱945.00

**Production Cost:** ₱2,700.00 + ₱945.00 = ₱3,645.00

**Suggested Price (30% profit):** ₱3,645.00 × 1.30 = ₱4,738.50

**Profit:** ₱4,738.50 - ₱3,645.00 = ₱1,093.50

## Labor Percentage Guidelines

### Low Labor (20-25%)
- Simple assembly products
- Minimal finishing required
- Standardized production
- Example: Alkansya, simple boxes

### Medium Labor (30-35%)
- Moderate complexity
- Some custom work
- Upholstery or finishing
- Example: Chairs, small furniture

### High Labor (40-50%)
- Complex assembly
- Custom craftsmanship
- Detailed finishing
- Example: Tables, cabinets, custom furniture

## Profit Margin Guidelines

### Standard Margin (20-25%)
- Competitive products
- High volume items
- Standard designs

### Good Margin (25-30%)
- Quality products
- Moderate volume
- Some customization

### Premium Margin (30-40%)
- Custom products
- High-end materials
- Unique designs
- Low volume

## How to Use in Frontend

### When Adding New Product:
1. User selects materials and quantities
2. System calculates material cost automatically
3. User selects product type preset (or custom)
4. System suggests price based on formula
5. User can adjust labor % and profit margin
6. Final price is calculated and displayed

### Price Breakdown Display:
```
Material Cost:     ₱173.10
Labor Cost (25%):  ₱43.28
─────────────────────────
Production Cost:   ₱216.38
Profit (30%):      ₱64.91
─────────────────────────
Suggested Price:   ₱281.29
```

## Benefits

1. **Accurate Pricing** - Based on real material costs
2. **Consistent Margins** - Ensures profitability
3. **Quick Calculations** - Instant price suggestions
4. **Transparency** - Clear breakdown of costs
5. **Flexibility** - Adjustable labor and profit percentages
6. **Product-Specific** - Different presets for different products

## Integration Points

### Product Creation Form:
- Add "Calculate Price" button
- Show material cost breakdown
- Display suggested price
- Allow manual override

### Product Edit Form:
- Show current vs suggested price
- Highlight if price is below cost
- Suggest price updates

### Inventory Dashboard:
- Show products with low margins
- Alert if material costs increased
- Suggest price adjustments

---

**Status**: ✅ Complete and Ready to Use
**Backend**: Fully implemented with API endpoints
**Frontend**: Ready for integration
**Database**: All materials have accurate unit costs
