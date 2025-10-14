# Accurate BOM Mapping for Alkansya Production

## Overview
This document shows the exact BOM (Bill of Materials) mapping based on the specifications provided, with accurate quantities for each material per Alkansya unit produced.

## BOM Specifications

| Material | SKU | Quantity per Alkansya | Description |
|----------|-----|----------------------|-------------|
| **Core Structural Materials** |
| Pinewood 1x4x8ft | PW-1x4x8 | 1.000 | 1 piece per alkansya |
| Plywood 4.2mm 4x8ft | PLY-4.2-4x8 | 1.000 | 1 piece per alkansya |
| Acrylic 1.5mm 4x8ft | ACR-1.5-4x8 | 1.000 | 1 piece per alkansya |
| **Fasteners** |
| Pin Nail F30 | PN-F30 | 24.000 | 24 pcs nails per alkansya |
| Black Screw 1 1/2 | BS-1.5 | 4.000 | 4 pcs screw per alkansya |
| **Adhesives & Processing** |
| Stikwell 250 | STKW-250 | 0.025 | 1 piece per 40 alkansya (1/40) |
| Grinder pad 4inch 120 grit | GRP-4-120 | 0.050 | 20 alkansya per 1 piece (1/20) |
| **Decorative Materials** |
| Sticker 24 inch Car Decals | STK-24-W | 1.000 | 1 piece per alkansya |
| Transfer Tape | TFT-24 | 0.0033 | 300 alkansya per piece (1/300) |
| **Packaging Materials** |
| TAPE 2 inch 300m | TAPE-2-300 | 0.005 | 200 alkansya per 1 piece (1/200) |
| Bubble Wrap 40 inch x 100m | BWRAP-40-100 | 1.000 | 1 piece per alkansya |
| Insulation 8mm 40 inch x 100m | INS-8-40-100 | 1.000 | 1 piece per alkansya |

## Material Consumption Examples

### For 1 Alkansya:
- **Pinewood**: 1 piece
- **Plywood**: 1 piece  
- **Acrylic**: 1 piece
- **Pin Nails**: 24 pieces
- **Black Screws**: 4 pieces
- **Stikwell**: 0.025 pieces (1/40th of a tube)
- **Grinder Pad**: 0.05 pieces (1/20th of a pad)
- **Sticker**: 1 piece
- **Transfer Tape**: 0.0033 pieces (1/300th of a roll)
- **Packing Tape**: 0.005 pieces (1/200th of a roll)
- **Bubble Wrap**: 1 piece
- **Insulation**: 1 piece

### For 100 Alkansya:
- **Pinewood**: 100 pieces
- **Plywood**: 100 pieces
- **Acrylic**: 100 pieces
- **Pin Nails**: 2,400 pieces
- **Black Screws**: 400 pieces
- **Stikwell**: 2.5 pieces (2.5 tubes)
- **Grinder Pad**: 5 pieces (5 pads)
- **Sticker**: 100 pieces
- **Transfer Tape**: 0.33 pieces (1/3rd of a roll)
- **Packing Tape**: 0.5 pieces (half a roll)
- **Bubble Wrap**: 100 pieces
- **Insulation**: 100 pieces

### For 1,000 Alkansya:
- **Pinewood**: 1,000 pieces
- **Plywood**: 1,000 pieces
- **Acrylic**: 1,000 pieces
- **Pin Nails**: 24,000 pieces
- **Black Screws**: 4,000 pieces
- **Stikwell**: 25 pieces (25 tubes)
- **Grinder Pad**: 50 pieces (50 pads)
- **Sticker**: 1,000 pieces
- **Transfer Tape**: 3.33 pieces (3.33 rolls)
- **Packing Tape**: 5 pieces (5 rolls)
- **Bubble Wrap**: 1,000 pieces
- **Insulation**: 1,000 pieces

## Key Changes Made

### 1. **Core Materials (1:1 Ratio)**
- ✅ Pinewood: 1 piece per alkansya (was 2)
- ✅ Plywood: 1 piece per alkansya (was 1) 
- ✅ Acrylic: 1 piece per alkansya (was 1)

### 2. **Fasteners (Exact Quantities)**
- ✅ Pin Nails: 24 pieces per alkansya (was 20)
- ✅ Black Screws: 4 pieces per alkansya (was 10)

### 3. **Adhesives & Processing (Fractional)**
- ✅ Stikwell: 0.025 per alkansya (1/40) (was 1)
- ✅ Grinder Pad: 0.05 per alkansya (1/20) (was 2)

### 4. **Decorative Materials**
- ✅ Sticker: 1 piece per alkansya (was 0.5)
- ✅ Transfer Tape: 0.0033 per alkansya (1/300) (was 0.5)

### 5. **Packaging Materials**
- ✅ Packing Tape: 0.005 per alkansya (1/200) (was 1)
- ✅ Bubble Wrap: 1 piece per alkansya (was 0.5)
- ✅ Insulation: 1 piece per alkansya (was 0.5)

## Impact on Production

### **Material Efficiency**
- **Reduced Waste**: More accurate consumption ratios
- **Better Planning**: Precise material requirements
- **Cost Optimization**: No over-ordering of materials

### **Production Planning**
- **Daily Production**: 300-500 units per day
- **Material Needs**: Calculated based on exact BOM
- **Stock Management**: Accurate reorder points

### **Inventory Management**
- **Real-time Tracking**: Precise material usage
- **Reorder Alerts**: Based on actual consumption
- **Cost Control**: Accurate material costing

## Database Implementation

The accurate BOM is implemented in:
- `ComprehensiveInventorySeeder.php`
- `EnhancedInventorySeeder.php`
- All production seeders use these exact ratios

## Usage

Run the enhanced seeders to get accurate material consumption:

```bash
# Create inventory with accurate BOM
php artisan db:seed --class=EnhancedInventorySeeder

# Create production data with accurate consumption
php artisan db:seed --class=AlkansyaDailyOutputSeeder
```

## Benefits

1. **Accurate Material Planning**: No more guesswork on material needs
2. **Cost Optimization**: Precise material requirements reduce waste
3. **Better Inventory Management**: Accurate reorder points and stock levels
4. **Realistic Production Data**: Material usage matches actual manufacturing
5. **Improved Forecasting**: Better demand planning based on accurate consumption
