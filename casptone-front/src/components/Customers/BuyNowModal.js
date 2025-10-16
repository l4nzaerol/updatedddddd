// src/components/Customers/BuyNowModal.js
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { authUtils } from "../../utils/auth";
import "./BuyNowModal.css";

const BuyNowModal = ({ show, onClose, product, onOrderSuccess }) => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    selectedProvince: "",
    selectedCity: "",
    selectedBarangay: "",
    houseUnit: "",
    paymentMethod: "cod"
  });
  const [errors, setErrors] = useState({});

  // Philippine location data
  const philippineLocations = {
    provinces: [
      { id: "metro-manila", name: "Metro Manila" },
      { id: "laguna", name: "Laguna" },
      { id: "cavite", name: "Cavite" },
      { id: "rizal", name: "Rizal" },
      { id: "bulacan", name: "Bulacan" },
      { id: "pampanga", name: "Pampanga" }
    ],
    cities: {
      "metro-manila": [
        { id: "manila", name: "Manila" },
        { id: "quezon-city", name: "Quezon City" },
        { id: "makati", name: "Makati" },
        { id: "taguig", name: "Taguig" },
        { id: "pasig", name: "Pasig" },
        { id: "mandaluyong", name: "Mandaluyong" },
        { id: "san-juan", name: "San Juan" },
        { id: "marikina", name: "Marikina" },
        { id: "pasay", name: "Pasay" },
        { id: "paranaque", name: "Parañaque" },
        { id: "las-pinas", name: "Las Piñas" },
        { id: "muntinlupa", name: "Muntinlupa" },
        { id: "caloocan", name: "Caloocan" },
        { id: "malabon", name: "Malabon" },
        { id: "navotas", name: "Navotas" },
        { id: "valenzuela", name: "Valenzuela" }
      ],
      "laguna": [
        { id: "calamba", name: "Calamba" },
        { id: "san-pablo", name: "San Pablo" },
        { id: "santa-rosa", name: "Santa Rosa" },
        { id: "binan", name: "Biñan" },
        { id: "cabuyao", name: "Cabuyao" },
        { id: "los-banos", name: "Los Baños" },
        { id: "alaminos", name: "Alaminos" },
        { id: "bay", name: "Bay" },
        { id: "calauan", name: "Calauan" },
        { id: "cavinti", name: "Cavinti" },
        { id: "famy", name: "Famy" },
        { id: "kalayaan", name: "Kalayaan" },
        { id: "liliw", name: "Liliw" },
        { id: "lumban", name: "Lumban" },
        { id: "mabitac", name: "Mabitac" },
        { id: "magdalena", name: "Magdalena" },
        { id: "majayjay", name: "Majayjay" },
        { id: "nagcarlan", name: "Nagcarlan" },
        { id: "paete", name: "Paete" },
        { id: "pagsanjan", name: "Pagsanjan" },
        { id: "pakil", name: "Pakil" },
        { id: "pandan", name: "Pandan" },
        { id: "pila", name: "Pila" },
        { id: "rizal", name: "Rizal" },
        { id: "san-pedro", name: "San Pedro" },
        { id: "siniloan", name: "Siniloan" },
        { id: "victoria", name: "Victoria" }
      ],
      "cavite": [
        { id: "dasmarinas", name: "Dasmarinas" },
        { id: "imus", name: "Imus" },
        { id: "bacoor", name: "Bacoor" },
        { id: "cavite-city", name: "Cavite City" },
        { id: "tagaytay", name: "Tagaytay" },
        { id: "trece-martires", name: "Trece Martires" },
        { id: "silang", name: "Silang" },
        { id: "kawit", name: "Kawit" },
        { id: "naic", name: "Naic" },
        { id: "tanza", name: "Tanza" },
        { id: "ternate", name: "Ternate" },
        { id: "gen-trias", name: "General Trias" },
        { id: "gen-mariano-alvarez", name: "General Mariano Alvarez" },
        { id: "magallanes", name: "Magallanes" },
        { id: "maragondon", name: "Maragondon" },
        { id: "mendez", name: "Mendez" },
        { id: "noveleta", name: "Noveleta" },
        { id: "rosario", name: "Rosario" }
      ]
    },
    barangays: {
      "manila": [
        { id: "binondo", name: "Binondo" },
        { id: "quiapo", name: "Quiapo" },
        { id: "santa-cruz", name: "Santa Cruz" },
        { id: "sampaloc", name: "Sampaloc" },
        { id: "san-miguel", name: "San Miguel" },
        { id: "ermita", name: "Ermita" },
        { id: "intramuros", name: "Intramuros" },
        { id: "malate", name: "Malate" },
        { id: "paco", name: "Paco" },
        { id: "pandacan", name: "Pandacan" },
        { id: "port-area", name: "Port Area" },
        { id: "san-andres", name: "San Andres" },
        { id: "santa-ana", name: "Santa Ana" },
        { id: "tondo", name: "Tondo" }
      ],
      "quezon-city": [
        { id: "diliman", name: "Diliman" },
        { id: "commonwealth", name: "Commonwealth" },
        { id: "novaliches", name: "Novaliches" },
        { id: "cubao", name: "Cubao" },
        { id: "kamuning", name: "Kamuning" },
        { id: "new-manila", name: "New Manila" },
        { id: "san-francisco", name: "San Francisco" },
        { id: "santa-mesa", name: "Santa Mesa" },
        { id: "santol", name: "Santol" },
        { id: "sikatuna", name: "Sikatuna" },
        { id: "tatalon", name: "Tatalon" },
        { id: "university", name: "University" },
        { id: "veterans", name: "Veterans" },
        { id: "west-triangle", name: "West Triangle" }
      ],
      "calamba": [
        { id: "barangay-1", name: "Barangay 1" },
        { id: "barangay-2", name: "Barangay 2" },
        { id: "barangay-3", name: "Barangay 3" },
        { id: "barangay-4", name: "Barangay 4" },
        { id: "barangay-5", name: "Barangay 5" },
        { id: "barangay-6", name: "Barangay 6" },
        { id: "barangay-7", name: "Barangay 7" },
        { id: "bagong-kalsada", name: "Bagong Kalsada" },
        { id: "banlic", name: "Banlic" },
        { id: "bucal", name: "Bucal" },
        { id: "bunting", name: "Bunting" },
        { id: "canlubang", name: "Canlubang" },
        { id: "halang", name: "Halang" },
        { id: "hornalan", name: "Hornalan" },
        { id: "kay-anlog", name: "Kay-Anlog" },
        { id: "la-mesa", name: "La Mesa" },
        { id: "lawa", name: "Lawa" },
        { id: "lecaros", name: "Lecaros" },
        { id: "lingga", name: "Lingga" },
        { id: "looc", name: "Looc" },
        { id: "mabato", name: "Mabato" },
        { id: "majada", name: "Majada" },
        { id: "makiling", name: "Makiling" },
        { id: "mapagong", name: "Mapagong" },
        { id: "masili", name: "Masili" },
        { id: "maunong", name: "Maunong" },
        { id: "mayapa", name: "Mayapa" },
        { id: "paciano", name: "Paciano" },
        { id: "palingon", name: "Palingon" },
        { id: "paliparan", name: "Paliparan" },
        { id: "parian", name: "Parian" },
        { id: "paris", name: "Paris" },
        { id: "poblacion", name: "Poblacion" },
        { id: "pritil", name: "Pritil" },
        { id: "pulo", name: "Pulo" },
        { id: "punta", name: "Punta" },
        { id: "puting-lupa", name: "Puting Lupa" },
        { id: "real", name: "Real" },
        { id: "saimsim", name: "Saimsim" },
        { id: "sampiruhan", name: "Sampiruhan" },
        { id: "san-cristobal", name: "San Cristobal" },
        { id: "san-jose", name: "San Jose" },
        { id: "santol", name: "Santol" },
        { id: "sucol", name: "Sucol" },
        { id: "turbina", name: "Turbina" },
        { id: "ulango", name: "Ulango" },
        { id: "uzon", name: "Uzon" }
      ]
    }
  };

  useEffect(() => {
    if (show && product) {
      setQuantity(1);
      setFormData({
        phone: "",
        selectedProvince: "",
        selectedCity: "",
        selectedBarangay: "",
        houseUnit: "",
        paymentMethod: "cod"
      });
      setErrors({});
    }
  }, [show, product]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.phone) {
      newErrors.phone = "Contact number is required";
    } else if (!formData.phone.startsWith("09") || formData.phone.length !== 11) {
      newErrors.phone = "Contact number must start with 09 and be 11 digits";
    }

    if (!formData.selectedProvince) {
      newErrors.selectedProvince = "Province is required";
    }

    if (!formData.selectedCity) {
      newErrors.selectedCity = "City is required";
    }

    if (!formData.selectedBarangay) {
      newErrors.selectedBarangay = "Barangay is required";
    }

    if (!formData.houseUnit) {
      newErrors.houseUnit = "House/Unit number is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("You need to be logged in to place an order");
        return;
      }

      // Create structured address
      const structuredAddress = `${formData.houseUnit}, ${philippineLocations.barangays[formData.selectedCity]?.find(b => b.id === formData.selectedBarangay)?.name || formData.selectedBarangay}, ${philippineLocations.cities[formData.selectedProvince]?.find(c => c.id === formData.selectedCity)?.name || formData.selectedCity}, ${philippineLocations.provinces.find(p => p.id === formData.selectedProvince)?.name || formData.selectedProvince}`;

      const orderData = {
        product_id: product.id,
        quantity: quantity,
        payment_method: formData.paymentMethod,
        shipping_address: structuredAddress,
        contact_phone: formData.phone,
        buy_now: true // Flag to indicate this is a direct order
      };

      const response = await axios.post("http://localhost:8000/api/orders", orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      toast.success("Order placed successfully!", {
        description: `Order ID: #${response.data.order_id || response.data.id}`,
        duration: 5000
      });

      // Close modal and trigger success callback
      onClose();
      if (onOrderSuccess) {
        onOrderSuccess(response.data);
      }

    } catch (error) {
      console.error("Order placement error:", error);
      const errorMessage = error.response?.data?.message || "Failed to place order";
      toast.error("Order failed", {
        description: errorMessage,
        duration: 4000
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = product ? (product.price * quantity).toFixed(2) : 0;

  if (!show || !product) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="buy-now-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="buy-now-modal-content"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>Buy Now - {product.name}</h3>
            <button className="close-btn" onClick={onClose}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="modal-body">
            {/* Product Summary */}
            <div className="product-summary">
              <div className="product-image-container">
                <img 
                  src={product.image_url || product.image} 
                  alt={product.name}
                  className="product-image"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x300?text=No+Image';
                  }}
                />
              </div>
              <div className="product-details">
                <h4>{product.name}</h4>
                <p className="product-price">₱{product.price.toLocaleString()}</p>
                <div className="quantity-selector">
                  <label>Quantity:</label>
                  <div className="quantity-controls">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span>{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Form */}
            <div className="order-form">
              <h4>Order Details</h4>
              
              {/* Contact Number */}
              <div className="form-group">
                <label>Contact Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="09XXXXXXXXX"
                  className={errors.phone ? "error" : ""}
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>

              {/* Address Selection */}
              <div className="address-section">
                <h5>Shipping Address *</h5>
                
                <div className="address-grid">
                  <div className="form-group">
                    <label>Province *</label>
                    <select
                      value={formData.selectedProvince}
                      onChange={(e) => handleInputChange("selectedProvince", e.target.value)}
                      className={errors.selectedProvince ? "error" : ""}
                    >
                      <option value="">Select Province</option>
                      {philippineLocations.provinces.map(province => (
                        <option key={province.id} value={province.id}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                    {errors.selectedProvince && <span className="error-text">{errors.selectedProvince}</span>}
                  </div>

                  <div className="form-group">
                    <label>City/Municipality *</label>
                    <select
                      value={formData.selectedCity}
                      onChange={(e) => handleInputChange("selectedCity", e.target.value)}
                      disabled={!formData.selectedProvince}
                      className={errors.selectedCity ? "error" : ""}
                    >
                      <option value="">Select City</option>
                      {formData.selectedProvince && philippineLocations.cities[formData.selectedProvince]?.map(city => (
                        <option key={city.id} value={city.id}>
                          {city.name}
                        </option>
                      ))}
                    </select>
                    {errors.selectedCity && <span className="error-text">{errors.selectedCity}</span>}
                  </div>

                  <div className="form-group">
                    <label>Barangay *</label>
                    <select
                      value={formData.selectedBarangay}
                      onChange={(e) => handleInputChange("selectedBarangay", e.target.value)}
                      disabled={!formData.selectedCity}
                      className={errors.selectedBarangay ? "error" : ""}
                    >
                      <option value="">Select Barangay</option>
                      {formData.selectedCity && philippineLocations.barangays[formData.selectedCity]?.map(barangay => (
                        <option key={barangay.id} value={barangay.id}>
                          {barangay.name}
                        </option>
                      ))}
                    </select>
                    {errors.selectedBarangay && <span className="error-text">{errors.selectedBarangay}</span>}
                  </div>

                  <div className="form-group">
                    <label>House/Unit Number *</label>
                    <input
                      type="text"
                      value={formData.houseUnit}
                      onChange={(e) => handleInputChange("houseUnit", e.target.value)}
                      placeholder="e.g., 123, Unit 4A, Lot 5"
                      className={errors.houseUnit ? "error" : ""}
                    />
                    {errors.houseUnit && <span className="error-text">{errors.houseUnit}</span>}
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="form-group">
                <label>Payment Method *</label>
                <div className="payment-options">
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === "cod"}
                      onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
                    />
                    <span>Cash on Delivery (COD)</span>
                  </label>
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="maya"
                      checked={formData.paymentMethod === "maya"}
                      onChange={(e) => handleInputChange("paymentMethod", e.target.value)}
                    />
                    <span>Maya Payment</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="order-summary">
              <h4>Order Summary</h4>
              <div className="summary-row">
                <span>Product:</span>
                <span>{product.name}</span>
              </div>
              <div className="summary-row">
                <span>Quantity:</span>
                <span>{quantity}</span>
              </div>
              <div className="summary-row">
                <span>Unit Price:</span>
                <span>₱{product.price.toLocaleString()}</span>
              </div>
              <div className="summary-row total">
                <span>Total:</span>
                <span>₱{totalPrice}</span>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="place-order-btn"
              onClick={handlePlaceOrder}
              disabled={loading}
            >
              {loading ? "Placing Order..." : "Place Order"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BuyNowModal;
