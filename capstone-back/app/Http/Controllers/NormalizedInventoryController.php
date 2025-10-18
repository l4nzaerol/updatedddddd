<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Material;
use App\Models\BOM;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class NormalizedInventoryController extends Controller
{
    /**
     * Get all products with their materials and inventory status
     */
    public function getProducts()
    {
        $products = Product::with(['materials', 'bomMaterials.material'])
            ->get()
            ->map(function ($product) {
                $product->materials_count = $product->materials->count();
                $product->total_material_cost = $product->bomMaterials->sum(function ($bom) {
                    return $bom->quantity_per_product * $bom->material->standard_cost;
                });
                
                // Ensure product_name is available (handle both old and new column names)
                if (!isset($product->product_name) && isset($product->name)) {
                    $product->product_name = $product->name;
                }
                
                // Generate product_code if not exists
                if (!isset($product->product_code) || empty($product->product_code)) {
                    $product->product_code = 'PROD-' . str_pad($product->id, 3, '0', STR_PAD_LEFT);
                }
                
                // Set default values for new columns if they don't exist
                if (!isset($product->unit_of_measure)) {
                    $product->unit_of_measure = 'pcs';
                }
                if (!isset($product->standard_cost)) {
                    $product->standard_cost = 0;
                }
                
                return $product;
            });

        return response()->json($products);
    }

    /**
     * Get all materials with inventory status
     */
    public function getMaterials()
    {
        $materials = Material::with(['inventory', 'transactions' => function ($query) {
            $query->orderBy('timestamp', 'desc')->limit(10);
        }])
            ->get()
            ->map(function ($material) {
                $material->total_quantity_on_hand = $material->inventory->sum('current_stock');
                $material->total_quantity_reserved = $material->inventory->sum('quantity_reserved');
                $material->available_quantity = $material->total_quantity_on_hand - $material->total_quantity_reserved;
                
                // Calculate status based on reorder level
                if ($material->available_quantity <= 0) {
                    $material->status = 'out_of_stock';
                    $material->status_label = 'Out of Stock';
                    $material->status_variant = 'danger';
                } elseif ($material->available_quantity <= $material->reorder_level) {
                    $material->status = 'low_stock';
                    $material->status_label = 'Low Stock';
                    $material->status_variant = 'warning';
                } else {
                    $material->status = 'in_stock';
                    $material->status_label = 'In Stock';
                    $material->status_variant = 'success';
                }

                return $material;
            });

        return response()->json($materials);
    }

    /**
     * Get BOM for a specific product
     */
    public function getBOM($productId)
    {
        $bom = BOM::with(['material', 'product'])
            ->where('product_id', $productId)
            ->get()
            ->map(function ($item) {
                $item->total_cost = $item->quantity_per_product * $item->material->standard_cost;
                $item->material->available_quantity = $item->material->inventory->sum('quantity_on_hand') - $item->material->inventory->sum('quantity_reserved');
                return $item;
            });

        return response()->json($bom);
    }

    /**
     * Create or update BOM
     */
    public function saveBOM(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'materials' => 'required|array',
            'materials.*.material_id' => 'required|exists:materials,material_id',
            'materials.*.quantity_per_product' => 'required|numeric|min:0',
            'materials.*.unit_of_measure' => 'required|string'
        ]);

        DB::beginTransaction();
        try {
            // Delete existing BOM for this product
            BOM::where('product_id', $request->product_id)->delete();

            // Create new BOM entries
            foreach ($request->materials as $material) {
                BOM::create([
                    'product_id' => $request->product_id,
                    'material_id' => $material['material_id'],
                    'quantity_per_product' => $material['quantity_per_product'],
                    'unit_of_measure' => $material['unit_of_measure']
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'BOM updated successfully']);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Failed to update BOM'], 500);
        }
    }

    /**
     * Add material to inventory
     */
    public function addMaterial(Request $request)
    {
        $request->validate([
            'material_name' => 'required|string',
            'material_code' => 'required|string|unique:materials,material_code',
            'description' => 'nullable|string',
            'unit_of_measure' => 'required|string',
            'reorder_level' => 'required|numeric|min:0',
            'standard_cost' => 'required|numeric|min:0',
            'initial_quantity' => 'required|numeric|min:0',
            'location_id' => 'nullable|integer'
        ]);

        DB::beginTransaction();
        try {
            // Create material
            $material = Material::create([
                'material_name' => $request->material_name,
                'material_code' => $request->material_code,
                'description' => $request->description,
                'unit_of_measure' => $request->unit_of_measure,
                'reorder_level' => $request->reorder_level,
                'standard_cost' => $request->standard_cost,
                'current_stock' => $request->initial_quantity
            ]);

            // Create inventory record
            Inventory::create([
                'material_id' => $material->material_id,
                'location_id' => $request->location_id,
                'current_stock' => $request->initial_quantity,
                'quantity_reserved' => 0,
                'last_updated' => now()
            ]);

            // Create transaction record
            InventoryTransaction::create([
                'material_id' => $material->material_id,
                'transaction_type' => 'PURCHASE',
                'quantity' => $request->initial_quantity,
                'reference' => 'Initial Stock',
                'remarks' => 'Initial material stock',
                'timestamp' => now()
            ]);

            DB::commit();
            return response()->json($material->load('inventory'), 201);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Failed to add material'], 500);
        }
    }

    /**
     * Update material
     */
    public function updateMaterial(Request $request, $materialId)
    {
        $material = Material::findOrFail($materialId);
        
        $request->validate([
            'material_name' => 'sometimes|string',
            'material_code' => 'sometimes|string|unique:materials,material_code,' . $materialId . ',material_id',
            'description' => 'nullable|string',
            'unit_of_measure' => 'sometimes|string',
            'reorder_level' => 'sometimes|numeric|min:0',
            'standard_cost' => 'sometimes|numeric|min:0'
        ]);

        $material->update($request->only([
            'material_name', 'material_code', 'description', 
            'unit_of_measure', 'reorder_level', 'standard_cost'
        ]));

        return response()->json($material->load('inventory'));
    }

    /**
     * Delete material
     */
    public function deleteMaterial($materialId)
    {
        $material = Material::findOrFail($materialId);
        
        DB::beginTransaction();
        try {
            // Delete related records
            Inventory::where('material_id', $materialId)->delete();
            InventoryTransaction::where('material_id', $materialId)->delete();
            BOM::where('material_id', $materialId)->delete();
            
            // Delete material
            $material->delete();
            
            DB::commit();
            return response()->json(['message' => 'Material deleted successfully']);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => 'Failed to delete material'], 500);
        }
    }

    /**
     * Record Alkansya daily output and update material consumption
     */
    public function recordAlkansyaOutput(Request $request)
    {
        $request->validate([
            'output_date' => 'required|date',
            'quantity_produced' => 'required|numeric|min:0',
            'remarks' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            // Find Alkansya product
            $alkansyaProduct = Product::where('product_code', 'like', '%alkansya%')
                ->orWhere('product_name', 'like', '%alkansya%')
                ->orWhere('name', 'like', '%alkansya%')
                ->first();

            if (!$alkansyaProduct) {
                throw new \Exception('Alkansya product not found');
            }

            // Get BOM for Alkansya
            $bomItems = BOM::with('material')->where('product_id', $alkansyaProduct->product_id)->get();

            foreach ($bomItems as $bomItem) {
                $consumedQuantity = $bomItem->quantity_per_product * $request->quantity_produced;
                
                // Update inventory
                $inventory = Inventory::where('material_id', $bomItem->material_id)->first();
                if ($inventory) {
                    $inventory->current_stock -= $consumedQuantity;
                    $inventory->last_updated = now();
                    $inventory->save();
                }

                // Create comprehensive transaction record
                InventoryTransaction::create([
                    'material_id' => $bomItem->material_id,
                    'product_id' => $alkansyaProduct->product_id,
                    'user_id' => auth()->id(),
                    'transaction_type' => 'ALKANSYA_CONSUMPTION',
                    'quantity' => -$consumedQuantity, // Negative for consumption
                    'unit_cost' => $bomItem->material->standard_cost,
                    'total_cost' => $bomItem->material->standard_cost * $consumedQuantity,
                    'reference' => 'ALKANSYA_DAILY_OUTPUT',
                    'timestamp' => $request->output_date,
                    'remarks' => "Alkansya daily output - consumed {$consumedQuantity} {$bomItem->material->material_name} for {$request->quantity_produced} units",
                    'status' => 'completed',
                    'priority' => 'normal',
                    'metadata' => [
                        'product_id' => $alkansyaProduct->product_id,
                        'product_name' => $alkansyaProduct->product_name,
                        'output_date' => $request->output_date,
                        'quantity_produced' => $request->quantity_produced,
                        'consumed_quantity' => $consumedQuantity,
                        'material_name' => $bomItem->material->material_name,
                        'material_code' => $bomItem->material->material_code,
                        'bom_ratio' => $bomItem->quantity_per_product,
                    ],
                    'source_data' => [
                        'alkansya_output_id' => null, // Will be set after alkansya record creation
                        'product_id' => $alkansyaProduct->product_id,
                        'material_id' => $bomItem->material_id,
                        'output_date' => $request->output_date,
                        'quantity_produced' => $request->quantity_produced,
                    ],
                    'cost_breakdown' => [
                        'material_cost' => $bomItem->material->standard_cost * $consumedQuantity,
                        'unit_cost' => $bomItem->material->standard_cost,
                        'quantity_used' => $consumedQuantity,
                        'bom_ratio' => $bomItem->quantity_per_product,
                    ]
                ]);
            }

            DB::commit();
            return response()->json(['message' => 'Alkansya output recorded successfully']);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Get inventory transactions
     */
    public function getTransactions(Request $request)
    {
        $query = InventoryTransaction::with('material')
            ->orderBy('timestamp', 'desc');

        if ($request->material_id) {
            $query->where('material_id', $request->material_id);
        }

        if ($request->transaction_type) {
            $query->where('transaction_type', $request->transaction_type);
        }

        if ($request->date_from) {
            $query->whereDate('timestamp', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('timestamp', '<=', $request->date_to);
        }

        $transactions = $query->paginate(50);
        return response()->json($transactions);
    }

    /**
     * Get inventory summary
     */
    public function getInventorySummary()
    {
        $summary = [
            'total_materials' => Material::count(),
            'total_products' => Product::count(),
            'low_stock_materials' => Material::whereHas('inventory', function ($query) {
                $query->selectRaw('SUM(current_stock - quantity_reserved) as available')
                      ->havingRaw('available <= materials.reorder_level');
            })->count(),
            'out_of_stock_materials' => Material::whereHas('inventory', function ($query) {
                $query->selectRaw('SUM(current_stock - quantity_reserved) as available')
                      ->havingRaw('available <= 0');
            })->count(),
            'total_inventory_value' => Material::join('inventory', 'materials.material_id', '=', 'inventory.material_id')
                ->selectRaw('SUM(inventory.current_stock * materials.standard_cost) as total_value')
                ->value('total_value') ?? 0
        ];

        return response()->json($summary);
    }
}
