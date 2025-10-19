<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Support\Facades\Auth;

class CartController extends Controller
{
    public function addToCart(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1'
        ]);

        $product = Product::findOrFail($request->product_id);

        // Check stock availability before adding (only for stocked products)
        if (($product->category_name !== 'Made to Order' && $product->category_name !== 'made_to_order') && $product->stock < $request->quantity) {
            return response()->json(['message' => 'Insufficient stock'], 400);
        }

        // For Made to Order products, check availability status
        if (($product->category_name === 'Made to Order' || $product->category_name === 'made_to_order') && $product->is_available === false) {
            return response()->json(['message' => 'This product is currently not available for order'], 400);
        }

        // Check if the product is already in the cart
        $cartItem = Cart::where('user_id', Auth::id())
            ->where('product_id', $request->product_id)
            ->first();

        if ($cartItem) {
            // Ensure the total quantity does not exceed stock (only for stocked products)
            if (($product->category_name !== 'Made to Order' && $product->category_name !== 'made_to_order') && (($cartItem->quantity + $request->quantity) > $product->stock)) {
                return response()->json(['message' => 'Not enough stock available'], 400);
            }

            $cartItem->quantity += $request->quantity;
            $cartItem->save();
        } else {
            $cartItem = Cart::create([
                'user_id' => Auth::id(),
                'product_id' => $request->product_id,
                'quantity' => $request->quantity
            ]);
        }

        // Return full cart details in response
        return response()->json([
            'message' => 'Product added to cart successfully',
            'cart' => $cartItem
        ]);
    }

    public function viewCart()
    {
        $userId = Auth::id();
        if (!$userId) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $cartItems = Cart::where('user_id', $userId)->with('product')->get();

            $cart = $cartItems->map(function ($cartItem) {
        return [
            'id' => $cartItem->id,
            'name' => $cartItem->product->name,
            'price' => $cartItem->product->price,
            'quantity' => $cartItem->quantity,
            'image' => $cartItem->product->image, // add image
        ];
    });


        return response()->json($cart);
    }

    public function update(Request $request, $id)
{
    $request->validate([
        'quantity' => 'required|integer|min:1'
    ]);

    $cartItem = Cart::findOrFail($id);

    // Optional: Add check to ensure the authenticated user owns this cart item
    if ($cartItem->user_id !== auth()->id()) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    // Get the product to check stock availability (only for stocked products)
    $product = $cartItem->product;
    if (($product->category_name !== 'Made to Order' && $product->category_name !== 'made_to_order') && $product->stock < $request->quantity) {
        return response()->json(['message' => 'Insufficient stock'], 400);
    }

    $cartItem->quantity = $request->quantity;
    $cartItem->save();

    return response()->json(['message' => 'Cart item updated successfully.']);
}


    public function removeFromCart($id)
    {
        $userId = Auth::id();
        if (!$userId) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $cartItem = Cart::where('user_id', $userId)->findOrFail($id);
        $cartItem->delete();

        return response()->json(['message' => 'Item removed from cart']);
    }
}