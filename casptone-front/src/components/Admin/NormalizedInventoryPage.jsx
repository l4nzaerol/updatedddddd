import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../Header";
import { toast } from "sonner";
import api from "../../api/client";

// Custom styles for simple, clean design
const customStyles = `
  .table tbody tr {
    transition: background-color 0.2s ease;
  }
  .table tbody tr:hover {
    background-color: #f8f9fa;
  }
  
  /* Simple transparent button styles */
  .btn-action {
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid #3d66a2ff;
    border-radius: 6px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #374151;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    margin: 0 2px;
  }
  
  .btn-action:hover {
    background: rgba(249, 250, 251, 0.9);
    border-color: #9ca3af;
    color: #111827;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .btn-action:active {
    transform: translateY(0);
  }
  
  .btn-action i {
    font-size: 12px;
    color: inherit;
  }
  
  /* Modal styles */
  .material-details-modal .modal-content {
    border: none;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  }
  
  .material-details-modal .modal-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 15px 15px 0 0;
    border: none;
  }
  
  .material-details-modal .modal-body {
    padding: 2rem;
  }
  
  .material-info-card {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 1.5rem;
    margin-bottom: 1rem;
    border-left: 4px solid #667eea;
  }
  
  .material-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .stat-card {
    background: white;
    border-radius: 8px;
    padding: 1rem;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    border-top: 3px solid #667eea;
  }
  
  .stat-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #667eea;
  }
  
  .stat-label {
    font-size: 0.875rem;
    color: #6c757d;
    margin-top: 0.25rem;
  }
`;


// BOM Management Modal Component
const BOMModal = ({ show, onHide, product, onSave }) => {
  const [formData, setFormData] = useState({
    materials: []
  });
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchAvailableMaterials = useCallback(async () => {
    try {
      const response = await api.get('/normalized-inventory/materials');
      setAvailableMaterials(response.data);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      toast.error("Failed to fetch materials");
    }
  }, []);

  const fetchBOM = useCallback(async () => {
    if (!product) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/normalized-inventory/bom/${product.product_id}`);
      setFormData({ materials: response.data });
    } catch (error) {
      console.error('Failed to fetch BOM:', error);
      toast.error("Failed to fetch BOM");
    } finally {
      setLoading(false);
    }
  }, [product]);

  useEffect(() => {
    if (show) {
      fetchAvailableMaterials();
      if (product) {
        fetchBOM();
      }
    }
  }, [show, product, fetchAvailableMaterials, fetchBOM]);

  const handleAddMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, {
        material_id: '',
        quantity_per_product: 0,
        unit_of_measure: ''
      }]
    }));
  };

  const handleRemoveMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const handleMaterialChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => 
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  const handleSave = async () => {
    if (!product) return;

    setSaving(true);
    try {
      await api.post('/normalized-inventory/bom', {
        product_id: product.product_id,
        materials: formData.materials
      });

      toast.success("BOM updated successfully!");
      onSave();
      onHide();
    } catch (error) {
      console.error('Failed to save BOM:', error);
      toast.error("Failed to save BOM");
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-xl">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              BOM for {product?.product_name || 'Product'}
            </h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6>Materials Required</h6>
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={handleAddMaterial}
                  >
                    + Add Material
                  </button>
                </div>

                {formData.materials.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    No materials added yet. Click "Add Material" to get started.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Material</th>
                          <th>Quantity per Product</th>
                          <th>Unit</th>
                          <th>Cost per Unit</th>
                          <th>Total Cost</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.materials.map((material, index) => {
                          const selectedMaterial = availableMaterials.find(m => m.material_id === material.material_id);
                          return (
                            <tr key={index}>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={material.material_id}
                                  onChange={(e) => {
                                    const selected = availableMaterials.find(m => m.material_id === parseInt(e.target.value));
                                    handleMaterialChange(index, 'material_id', e.target.value);
                                    if (selected) {
                                      handleMaterialChange(index, 'unit_of_measure', selected.unit_of_measure);
                                    }
                                  }}
                                >
                                  <option value="">Select Material</option>
                                  {availableMaterials.map(mat => (
                                    <option key={mat.material_id} value={mat.material_id}>
                                      {mat.material_name} ({mat.material_code})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={material.quantity_per_product}
                                  onChange={(e) => handleMaterialChange(index, 'quantity_per_product', parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.0001"
                                />
                              </td>
                              <td>
                                <select
                                  className="form-select form-select-sm"
                                  value={material.unit_of_measure}
                                  onChange={(e) => handleMaterialChange(index, 'unit_of_measure', e.target.value)}
                                >
                                  <option value="">Select Unit</option>
                                  <option value="pcs">Pieces (pcs)</option>
                                  <option value="kg">Kilograms (kg)</option>
                                  <option value="g">Grams (g)</option>
                                  <option value="m">Meters (m)</option>
                                  <option value="cm">Centimeters (cm)</option>
                                  <option value="mm">Millimeters (mm)</option>
                                  <option value="ft">Feet (ft)</option>
                                  <option value="in">Inches (in)</option>
                                  <option value="sqm">Square Meters (sqm)</option>
                                  <option value="sqft">Square Feet (sqft)</option>
                                  <option value="cbm">Cubic Meters (cbm)</option>
                                  <option value="l">Liters (l)</option>
                                  <option value="ml">Milliliters (ml)</option>
                                  <option value="box">Box</option>
                                  <option value="pack">Pack</option>
                                  <option value="roll">Roll</option>
                                  <option value="sheet">Sheet</option>
                                  <option value="set">Set</option>
                                  <option value="pair">Pair</option>
                                  <option value="dozen">Dozen</option>
                                  <option value="gross">Gross</option>
                                </select>
                              </td>
                              <td>
                                ₱{selectedMaterial?.standard_cost?.toLocaleString() || '0'}
                              </td>
                              <td>
                                ₱{((selectedMaterial?.standard_cost || 0) * material.quantity_per_product).toLocaleString()}
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleRemoveMaterial(index)}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="mt-3">
                  <strong>Total BOM Cost: ₱{formData.materials.reduce((total, material) => {
                    const selectedMaterial = availableMaterials.find(m => m.material_id === material.material_id);
                    return total + ((selectedMaterial?.standard_cost || 0) * material.quantity_per_product);
                  }, 0).toLocaleString()}</strong>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save BOM"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Material Form Modal Component
const MaterialModal = ({ show, onHide, material, onSave }) => {
  const [formData, setFormData] = useState({
    material_name: "",
    material_code: "",
    description: "",
    unit_of_measure: "",
    reorder_level: 0,
    standard_cost: 0,
    initial_quantity: 0,
    location_id: null,
    location: "Windfield 2",
    critical_stock: 0,
    max_level: 0,
    lead_time_days: 0,
    supplier: "",
    category: "raw"
  });

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (material) {
      setFormData({
        material_name: material.material_name || "",
        material_code: material.material_code || "",
        description: material.description || "",
        unit_of_measure: material.unit_of_measure || "",
        reorder_level: material.reorder_level || 0,
        standard_cost: material.standard_cost || 0,
        initial_quantity: material.current_stock || 0,
        location_id: material.location_id || null,
        location: material.location || "",
        critical_stock: material.critical_stock || 0,
        max_level: material.max_level || 0,
        lead_time_days: material.lead_time_days || 0,
        supplier: material.supplier || "",
        category: material.category || "raw"
      });
    } else {
      setFormData({
        material_name: "",
        material_code: "",
        description: "",
        unit_of_measure: "",
        reorder_level: 0,
        standard_cost: 0,
        initial_quantity: 0,
        location_id: null,
        location: "Windfield 2",
        critical_stock: 0,
        max_level: 0,
        lead_time_days: 0,
        supplier: "",
        category: "raw"
      });
    }
    setErrors({});
  }, [material, show]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.material_name.trim()) newErrors.material_name = "Material name is required";
    if (!formData.material_code.trim()) newErrors.material_code = "Material code is required";
    if (!formData.unit_of_measure.trim()) newErrors.unit_of_measure = "Unit of measure is required";
    if (formData.reorder_level < 0) newErrors.reorder_level = "Reorder level cannot be negative";
    if (formData.standard_cost < 0) newErrors.standard_cost = "Standard cost cannot be negative";
    if (formData.initial_quantity < 0) newErrors.initial_quantity = "Initial quantity cannot be negative";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      await onSave(formData);
      onHide();
      
      toast.success("📦 Material Saved Successfully!", {
        description: material 
          ? `"${formData.material_name}" has been updated.`
          : `"${formData.material_name}" has been added to the inventory.`,
        duration: 4000,
        style: {
          background: '#f0fdf4',
          border: '1px solid #86efac',
          color: '#166534'
        }
      });
    } catch (error) {
      console.error("Save failed:", error);
      toast.error("❌ Material Save Failed", {
        description: "Unable to save the material. Please check your inputs and try again.",
        duration: 5000,
        style: {
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#dc2626'
        }
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {material ? "Edit Material" : "Add New Material"}
            </h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Material Name *</label>
                <input
                  type="text"
                  className={`form-control ${errors.material_name ? "is-invalid" : ""}`}
                  value={formData.material_name}
                  onChange={(e) => handleChange("material_name", e.target.value)}
                />
                {errors.material_name && <div className="invalid-feedback">{errors.material_name}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Material Code *</label>
                <input
                  type="text"
                  className={`form-control ${errors.material_code ? "is-invalid" : ""}`}
                  value={formData.material_code}
                  onChange={(e) => handleChange("material_code", e.target.value)}
                />
                {errors.material_code && <div className="invalid-feedback">{errors.material_code}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Unit of Measure *</label>
                <select
                  className={`form-control ${errors.unit_of_measure ? "is-invalid" : ""}`}
                  value={formData.unit_of_measure}
                  onChange={(e) => handleChange("unit_of_measure", e.target.value)}
                >
                  <option value="">Select Unit</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="g">Grams (g)</option>
                  <option value="m">Meters (m)</option>
                  <option value="cm">Centimeters (cm)</option>
                  <option value="mm">Millimeters (mm)</option>
                  <option value="ft">Feet (ft)</option>
                  <option value="in">Inches (in)</option>
                  <option value="sqm">Square Meters (sqm)</option>
                  <option value="sqft">Square Feet (sqft)</option>
                  <option value="cbm">Cubic Meters (cbm)</option>
                  <option value="l">Liters (l)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                  <option value="roll">Roll</option>
                  <option value="sheet">Sheet</option>
                  <option value="set">Set</option>
                  <option value="pair">Pair</option>
                  <option value="dozen">Dozen</option>
                  <option value="gross">Gross</option>
                </select>
                {errors.unit_of_measure && <div className="invalid-feedback">{errors.unit_of_measure}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Reorder Level</label>
                <input
                  type="number"
                  className={`form-control ${errors.reorder_level ? "is-invalid" : ""}`}
                  value={formData.reorder_level}
                  onChange={(e) => handleChange("reorder_level", Math.max(0, parseFloat(e.target.value) || 0))}
                  min="0"
                  step="0.01"
                />
                {errors.reorder_level && <div className="invalid-feedback">{errors.reorder_level}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Standard Cost</label>
                <input
                  type="number"
                  className={`form-control ${errors.standard_cost ? "is-invalid" : ""}`}
                  value={formData.standard_cost}
                  onChange={(e) => handleChange("standard_cost", Math.max(0, parseFloat(e.target.value) || 0))}
                  min="0"
                  step="0.01"
                />
                {errors.standard_cost && <div className="invalid-feedback">{errors.standard_cost}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Initial Quantity</label>
                <input
                  type="number"
                  className={`form-control ${errors.initial_quantity ? "is-invalid" : ""}`}
                  value={formData.initial_quantity}
                  onChange={(e) => handleChange("initial_quantity", Math.max(0, parseFloat(e.target.value) || 0))}
                  min="0"
                  step="0.01"
                />
                {errors.initial_quantity && <div className="invalid-feedback">{errors.initial_quantity}</div>}
              </div>
              <div className="col-md-6">
                <label className="form-label">Location</label>
                <select
                  className="form-control"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                >
                  <option value="Windfield 2">Windfield 2</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Critical Stock Level</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.critical_stock}
                  onChange={(e) => handleChange("critical_stock", Math.max(0, parseFloat(e.target.value) || 0))}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Max Level</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.max_level}
                  onChange={(e) => handleChange("max_level", Math.max(0, parseFloat(e.target.value) || 0))}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Lead Time (Days)</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.lead_time_days}
                  onChange={(e) => handleChange("lead_time_days", Math.max(0, parseInt(e.target.value) || 0))}
                  min="0"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Supplier</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.supplier}
                  onChange={(e) => handleChange("supplier", e.target.value)}
                  placeholder="Supplier name or company"
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Category</label>
                <select
                  className="form-control"
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                >
                  <option value="raw">Raw Material</option>
                  <option value="packaging">Packaging</option>
                </select>
              </div>
              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="Additional notes about this material..."
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : (material ? "Update" : "Add")} Material
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Alkansya Daily Output Modal Component
const AlkansyaOutputModal = ({ show, onHide, onSuccess }) => {
  const [formData, setFormData] = useState({
    output_date: new Date().toISOString().split('T')[0],
    quantity_produced: 0,
    remarks: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (formData.quantity_produced <= 0) {
      toast.error("Quantity produced must be greater than 0");
      return;
    }

    setSaving(true);
    try {
      const response = await api.post('/normalized-inventory/alkansya-output', formData);

      toast.success("📊 Alkansya Output Recorded!", {
        description: `${formData.quantity_produced} units recorded for ${formData.output_date}`,
        duration: 4000,
        style: {
          background: '#f0fdf4',
          border: '1px solid #86efac',
          color: '#166534'
        }
      });

      onSuccess();
      onHide();
    } catch (error) {
      console.error('Failed to record output:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        response: error.response?.data
      });
      
      toast.error("❌ Failed to Record Output", {
        description: `Unable to record the daily output. ${error.response?.data?.error || error.message}`,
        duration: 5000,
        style: {
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#dc2626'
        }
      });
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Record Alkansya Daily Output</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Output Date *</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.output_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, output_date: e.target.value }))}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Quantity Produced *</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.quantity_produced}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity_produced: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="col-12">
                <label className="form-label">Remarks</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Additional notes about the production..."
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Recording..." : "Record Output"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stock Adjustment Modal Component
const StockAdjustmentModal = ({ show, onHide, material, onSuccess }) => {
  const [formData, setFormData] = useState({
    adjustment_type: 'add',
    quantity: 0,
    reason: '',
    reference: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (show && material) {
      setFormData({
        adjustment_type: 'add',
        quantity: 0,
        reason: '',
        reference: ''
      });
    }
  }, [show, material]);

  const handleSave = async () => {
    if (formData.quantity <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    if (!formData.reason.trim()) {
      toast.error("Please provide a reason for this adjustment");
      return;
    }

    setSaving(true);
    try {
      await api.post('/normalized-inventory/stock-adjustment', {
        material_id: material.material_id,
        adjustment_type: formData.adjustment_type,
        quantity: formData.quantity,
        reason: formData.reason,
        reference: formData.reference
      });

      toast.success("📦 Stock Adjusted Successfully!", {
        description: `${formData.adjustment_type === 'add' ? 'Added' : formData.adjustment_type === 'subtract' ? 'Subtracted' : 'Set'} ${formData.quantity} units`,
        duration: 4000,
        style: {
          background: '#f0fdf4',
          border: '1px solid #86efac',
          color: '#166534'
        }
      });

      onSuccess();
      onHide();
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      toast.error("❌ Stock Adjustment Failed", {
        description: `Unable to adjust stock. ${error.response?.data?.error || error.message}`,
        duration: 5000,
        style: {
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#dc2626'
        }
      });
    } finally {
      setSaving(false);
    }
  };

  if (!show || !material) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Adjust Stock - {material.material_name}</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            <div className="row g-3">
              <div className="col-12">
                <div className="alert alert-info">
                  <strong>Current Stock:</strong> {material.available_quantity || 0} {material.unit_of_measure}
                </div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Adjustment Type *</label>
                <select
                  className="form-select"
                  value={formData.adjustment_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, adjustment_type: e.target.value }))}
                >
                  <option value="add">Add Stock</option>
                  <option value="subtract">Subtract Stock</option>
                  <option value="set">Set Stock</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Quantity *</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                />
                <small className="text-muted">Unit: {material.unit_of_measure}</small>
              </div>
              <div className="col-12">
                <label className="form-label">Reason *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g., Purchase, Return, Correction, etc."
                />
              </div>
              <div className="col-12">
                <label className="form-label">Reference</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.reference}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference: e.target.value }))}
                  placeholder="e.g., PO-12345, Invoice-67890, etc."
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Adjusting..." : "Adjust Stock"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Material Details Modal Component
const MaterialDetailsModal = ({ show, onHide, material }) => {
  if (!show || !material) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock': return 'success';
      case 'Low Stock': return 'warning';
      case 'Out of Stock': return 'danger';
      default: return 'secondary';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'raw': return 'fas fa-tree';
      case 'packaging': return 'fas fa-box';
      default: return 'fas fa-cube';
    }
  };

  return (
    <div className="modal show d-block material-details-modal" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title d-flex align-items-center">
              <i className={`${getCategoryIcon(material.category)} me-2`}></i>
              Material Details
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onHide}></button>
          </div>
          <div className="modal-body">
            {/* Material Information Card */}
            <div className="material-info-card">
              <div className="row">
                <div className="col-md-8">
                  <h4 className="mb-2 text-dark">{material.material_name}</h4>
                  <p className="text-muted mb-2">{material.description || 'No description available'}</p>
                  <div className="d-flex align-items-center gap-3">
                    <code className="bg-white px-2 py-1 rounded">{material.material_code}</code>
                    <span className={`badge bg-${getStatusColor(material.status_label)} px-2 py-1`}>
                      {material.status_label}
                    </span>
                    <span className={`badge ${material.category === 'raw' ? 'bg-primary' : 'bg-info'} px-2 py-1`}>
                      <i className={`${getCategoryIcon(material.category)} me-1`}></i>
                      {material.category === 'raw' ? 'Raw Material' : 'Packaging'}
                    </span>
                  </div>
                </div>
                <div className="col-md-4 text-end">
                  <div className="h3 text-primary mb-0">{formatCurrency(material.standard_cost)}</div>
                  <small className="text-muted">Standard Cost</small>
                </div>
              </div>
            </div>

            {/* Material Statistics Grid */}
            <div className="material-stats-grid">
              <div className="stat-card">
                <div className="stat-value">{material.available_quantity || 0}</div>
                <div className="stat-label">
                  <i className="fas fa-boxes me-1"></i>
                  Available Quantity
                </div>
                <small className="text-muted">{material.unit_of_measure}</small>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{material.reorder_level || 0}</div>
                <div className="stat-label">
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  Reorder Level
                </div>
                <small className="text-muted">{material.unit_of_measure}</small>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{material.critical_stock || 0}</div>
                <div className="stat-label">
                  <i className="fas fa-exclamation-circle me-1"></i>
                  Critical Stock
                </div>
                <small className="text-muted">{material.unit_of_measure}</small>
              </div>
              
              <div className="stat-card">
                <div className="stat-value">{material.max_level || 0}</div>
                <div className="stat-label">
                  <i className="fas fa-arrow-up me-1"></i>
                  Max Level
                </div>
                <small className="text-muted">{material.unit_of_measure}</small>
              </div>
            </div>

            {/* Additional Information */}
            <div className="row mt-4">
              <div className="col-md-6">
                <div className="card border-0 bg-light">
                  <div className="card-body">
                    <h6 className="card-title text-primary">
                      <i className="fas fa-map-marker-alt me-2"></i>
                      Location & Supplier
                    </h6>
                    <div className="mb-2">
                      <strong>Location:</strong> {material.location || 'Not specified'}
                    </div>
                    <div className="mb-2">
                      <strong>Supplier:</strong> {material.supplier || 'Not specified'}
                    </div>
                    <div className="mb-0">
                      <strong>Lead Time:</strong> {material.lead_time_days || 0} days
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                <div className="card border-0 bg-light">
                  <div className="card-body">
                    <h6 className="card-title text-primary">
                      <i className="fas fa-chart-line me-2"></i>
                      Cost Analysis
                    </h6>
                    <div className="mb-2">
                      <strong>Standard Cost:</strong> {formatCurrency(material.standard_cost || 0)}
                    </div>
                    <div className="mb-2">
                      <strong>Total Value:</strong> {formatCurrency((material.available_quantity || 0) * (material.standard_cost || 0))}
                    </div>
                    <div className="mb-0">
                      <strong>Unit:</strong> {material.unit_of_measure}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stock Status Indicator */}
            <div className="mt-4">
              <div className="card border-0">
                <div className="card-body">
                  <h6 className="card-title text-primary">
                    <i className="fas fa-warehouse me-2"></i>
                    Stock Status
                  </h6>
                  <div className="progress mb-3" style={{ height: '20px' }}>
                    <div 
                      className={`progress-bar ${
                        material.available_quantity > material.reorder_level ? 'bg-success' :
                        material.available_quantity > material.critical_stock ? 'bg-warning' : 'bg-danger'
                      }`}
                      role="progressbar"
                      style={{ 
                        width: `${Math.min(100, (material.available_quantity / material.max_level) * 100)}%` 
                      }}
                    >
                      {material.available_quantity} / {material.max_level}
                    </div>
                  </div>
                  <div className="row text-center">
                    <div className="col-4">
                      <small className="text-muted">Current Stock</small>
                      <div className="fw-bold">{material.available_quantity || 0}</div>
                    </div>
                    <div className="col-4">
                      <small className="text-muted">Reorder Level</small>
                      <div className="fw-bold text-warning">{material.reorder_level || 0}</div>
                    </div>
                    <div className="col-4">
                      <small className="text-muted">Max Level</small>
                      <div className="fw-bold text-info">{material.max_level || 0}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Close
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => {
                onHide();
                // You can add edit functionality here
                console.log('Edit material:', material);
              }}
            >
              <i className="fas fa-edit me-2"></i>
              Edit Material
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Normalized Inventory Component
const NormalizedInventoryPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [dailyOutputs, setDailyOutputs] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("materials");
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showBOMModal, setShowBOMModal] = useState(false);
  const [showAlkansyaModal, setShowAlkansyaModal] = useState(false);
  const [showMaterialDetailsModal, setShowMaterialDetailsModal] = useState(false);
  const [showStockAdjustmentModal, setShowStockAdjustmentModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productFilter, setProductFilter] = useState("all"); // "all", "made_to_order", "stocked"
  const [materialFilter, setMaterialFilter] = useState("all"); // "all", "raw", "packaging"

  // Filter products based on category
  const filteredProducts = useMemo(() => {
    if (productFilter === "all") {
      return products;
    } else if (productFilter === "made_to_order") {
      return products.filter(product => 
        product.category_name === "Made to Order" || 
        product.category_name === "made_to_order"
      );
    } else if (productFilter === "stocked") {
      return products.filter(product => 
        product.category_name !== "Made to Order" && 
        product.category_name !== "made_to_order"
      );
    }
    return products;
  }, [products, productFilter]);

  // Filter materials based on category
  const filteredMaterials = useMemo(() => {
    if (materialFilter === "all") {
      return materials;
    } else if (materialFilter === "raw") {
      return materials.filter(material => 
        material.category === "raw"
      );
    } else if (materialFilter === "alkansya") {
      return materials.filter(material => 
        material.material_name.toLowerCase().includes('alkansya') ||
        material.material_code.toLowerCase().includes('alkansya') ||
        material.material_code.includes('PW-') || 
        material.material_code.includes('PLY-') || 
        material.material_code.includes('ACR-') || 
        material.material_code.includes('PN-') ||
        material.material_code.includes('BS-') || 
        material.material_code.includes('STKW-')
      );
    } else if (materialFilter === "made_to_order") {
      return materials.filter(material => 
        material.material_name.toLowerCase().includes('table') ||
        material.material_name.toLowerCase().includes('chair') ||
        material.material_code.toLowerCase().includes('table') ||
        material.material_code.toLowerCase().includes('chair') ||
        material.material_code.includes('HW-MAHOG-') || 
        material.material_code.includes('PLY-18-') ||
        material.material_code.includes('WS-3') || 
        material.material_code.includes('WG-500') ||
        material.material_code.includes('WS-2.5') || 
        material.material_code.includes('WD-8MM')
      );
    }
    return materials;
  }, [materials, materialFilter]);

  // API helper function

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [materialsRes, productsRes, summaryRes, transactionsRes, dailyOutputsRes] = await Promise.allSettled([
        api.get("/normalized-inventory/materials"),
        api.get("/normalized-inventory/products"),
        api.get("/normalized-inventory/summary"),
        api.get("/normalized-inventory/transactions"),
        api.get("/normalized-inventory/daily-output")
      ]);

      if (materialsRes.status === "fulfilled") setMaterials(materialsRes.value?.data || []);
      if (productsRes.status === "fulfilled") setProducts(productsRes.value?.data || []);
      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value?.data || {});
      if (transactionsRes.status === "fulfilled") setTransactions(transactionsRes.value?.data?.data || []);
      if (dailyOutputsRes.status === "fulfilled") setDailyOutputs(dailyOutputsRes.value?.data?.daily_outputs || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data. Check API settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Material CRUD operations
  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setShowMaterialModal(true);
  };

  const handleEditMaterial = (material) => {
    setEditingMaterial(material);
    setShowMaterialModal(true);
  };

  const handleSaveMaterial = async (materialData) => {
    try {
      if (editingMaterial) {
        await api.put(`/normalized-inventory/materials/${editingMaterial.material_id}`, materialData);
      } else {
        await api.post("/normalized-inventory/materials", materialData);
      }
      await fetchData();
    } catch (error) {
      console.error("Save material error:", error);
      throw error;
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm("Are you sure you want to delete this material? This action cannot be undone.")) {
      return;
    }

    try {
      await api.delete(`/normalized-inventory/materials/${materialId}`);
      
      toast.success("🗑️ Material Deleted Successfully!", {
        description: "Material has been removed from the inventory.",
        duration: 4000,
        style: {
          background: '#f0fdf4',
          border: '1px solid #86efac',
          color: '#166534'
        }
      });
      
      await fetchData();
    } catch (error) {
      console.error("Delete material error:", error);
      toast.error("❌ Material Deletion Failed", {
        description: `Unable to delete the material. ${error.response?.data?.error || error.message}`,
        duration: 5000,
        style: {
          background: '#fee2e2',
          border: '1px solid #fca5a5',
          color: '#dc2626'
        }
      });
    }
  };

  const handleEditBOM = (product) => {
    setSelectedProduct(product);
    setShowBOMModal(true);
  };

  const handleViewMaterialDetails = (material) => {
    setSelectedMaterial(material);
    setShowMaterialDetailsModal(true);
  };

  const handleAdjustStock = (material) => {
    setSelectedMaterial(material);
    setShowStockAdjustmentModal(true);
  };

  const handleViewProductDetails = (product) => {
    // Show product details in a modal or navigate to details page
    toast.info("📋 Product Details", {
      description: `Viewing details for ${product.product_name}`,
      duration: 3000,
      style: {
        background: '#eff6ff',
        border: '1px solid #93c5fd',
        color: '#1e40af'
      }
    });
    // TODO: Implement product details modal or navigation
  };

  const handleEditProduct = (product) => {
    // Edit product functionality
    toast.info("✏️ Edit Product", {
      description: `Editing ${product.product_name}`,
      duration: 3000,
      style: {
        background: '#fef3c7',
        border: '1px solid #fbbf24',
        color: '#92400e'
      }
    });
    // TODO: Implement product edit modal or navigation
  };

  const handleAlkansyaOutput = () => {
    setShowAlkansyaModal(true);
  };

  return (
    <AppLayout>
      <style>{customStyles}</style>
      <div className="container-fluid py-4" role="region" aria-labelledby="inv-heading">
        {/* Navigation Buttons */}
        <div className="d-flex gap-2 mb-3">
          <button className="btn btn-outline-secondary" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </button>
        </div>

        <div className="container-fluid py-4">
          {/* Header */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 id="inv-heading" className="mb-0">Normalized Inventory Management</h2>
            <div className="d-flex gap-2 flex-wrap">
              <button className="btn btn-info" onClick={handleAlkansyaOutput}>
                <i className="fas fa-piggy-bank me-2"></i>
                + Daily Alkansya Output
              </button>
              <button className="btn btn-success" onClick={handleAddMaterial}>
                + Add Material
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted small mb-1">Total Materials</div>
                  <div className="h3 mb-1 text-primary fw-bold">{summary.total_materials || 0}</div>
                  <div className="small text-muted">Raw materials</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted small mb-1">Total Products</div>
                  <div className="h3 mb-1 text-success fw-bold">{summary.total_products || 0}</div>
                  <div className="small text-muted">Finished products</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted small mb-1">Low Stock</div>
                  <div className="h3 mb-1 text-warning fw-bold">{summary.low_stock_materials || 0}</div>
                  <div className="small text-muted">Need reordering</div>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="text-muted small mb-1">Inventory Value</div>
                  <div className="h3 mb-1 text-info fw-bold">₱{(summary.total_inventory_value || 0).toLocaleString()}</div>
                  <div className="small text-muted">Total value</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-4">
            <div className="d-flex border-bottom bg-white rounded-top">
              <button 
                className={`btn btn-link text-decoration-none px-4 py-3 border-0 rounded-0 ${
                  activeTab === 'materials' 
                    ? 'text-primary border-bottom border-primary border-2 bg-light' 
                    : 'text-muted'
                }`}
                onClick={() => setActiveTab('materials')}
                style={{
                  fontWeight: activeTab === 'materials' ? '600' : '400'
                }}
              >
                <i className="fas fa-boxes me-2"></i>
                Materials 
                <span className="badge bg-primary ms-2">{materials.length}</span>
              </button>
              <button 
                className={`btn btn-link text-decoration-none px-4 py-3 border-0 rounded-0 ${
                  activeTab === 'products' 
                    ? 'text-primary border-bottom border-primary border-2 bg-light' 
                    : 'text-muted'
                }`}
                onClick={() => setActiveTab('products')}
                style={{
                  fontWeight: activeTab === 'products' ? '600' : '400'
                }}
              >
                <i className="fas fa-check-circle me-2"></i>
                Products 
                <span className="badge bg-success ms-2">{products.length}</span>
              </button>
              <button 
                className={`btn btn-link text-decoration-none px-4 py-3 border-0 rounded-0 ${
                  activeTab === 'transactions' 
                    ? 'text-primary border-bottom border-primary border-2 bg-light' 
                    : 'text-muted'
                }`}
                onClick={() => setActiveTab('transactions')}
                style={{
                  fontWeight: activeTab === 'transactions' ? '600' : '400'
                }}
              >
                <i className="fas fa-history me-2"></i>
                Transactions
              </button>
              <button 
                className={`btn btn-link text-decoration-none px-4 py-3 border-0 rounded-0 ${
                  activeTab === 'daily-output' 
                    ? 'text-primary border-bottom border-primary border-2 bg-light' 
                    : 'text-muted'
                }`}
                onClick={() => setActiveTab('daily-output')}
                style={{
                  fontWeight: activeTab === 'daily-output' ? '600' : '400'
                }}
              >
                <i className="fas fa-chart-line me-2"></i>
                Daily Output
                <span className="badge bg-info ms-2">{dailyOutputs.length}</span>
              </button>
            </div>
          </div>

          {loading && (
            <div className="alert alert-info">Loading inventory data…</div>
          )}
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          {/* Materials Tab */}
          {activeTab === 'materials' && (
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h5 className="mb-1 text-dark fw-semibold">
                    <i className="fas fa-boxes me-2 text-primary"></i>
                    Materials
                  </h5>
                  <small className="text-muted">
                    {filteredMaterials.length} of {materials.length} materials
                  </small>
                </div>
                <div className="d-flex gap-2">
                  <button 
                    className={`btn btn-sm ${materialFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setMaterialFilter('all')}
                  >
                    <i className="fas fa-list me-1"></i>
                    All Materials
                  </button>
                  <button 
                    className={`btn btn-sm ${materialFilter === 'raw' ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => setMaterialFilter('raw')}
                  >
                    <i className="fas fa-tree me-1"></i>
                    Raw Materials
                  </button>
                  <button 
                    className={`btn btn-sm ${materialFilter === 'alkansya' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setMaterialFilter('alkansya')}
                  >
                    <i className="fas fa-piggy-bank me-1"></i>
                    Alkansya Materials
                  </button>
                  <button 
                    className={`btn btn-sm ${materialFilter === 'made_to_order' ? 'btn-info' : 'btn-outline-info'}`}
                    onClick={() => setMaterialFilter('made_to_order')}
                  >
                    <i className="fas fa-tools me-1"></i>
                    Made to Order Materials
                  </button>
                </div>
              </div>
              
              <div className="card border-0 shadow-sm">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="py-3 px-3 fw-semibold">Code</th>
                        <th className="py-3 px-3 fw-semibold">Name</th>
                        <th className="py-3 px-3 fw-semibold text-end">Available Qty</th>
                        <th className="py-3 px-3 fw-semibold text-end">Reorder Level</th>
                        <th className="py-3 px-3 fw-semibold text-end">Unit Cost</th>
                        <th className="py-3 px-3 fw-semibold">Location</th>
                        <th className="py-3 px-3 fw-semibold">Category</th>
                        <th className="py-3 px-3 fw-semibold">Supplier</th>
                        <th className="py-3 px-3 fw-semibold">Status</th>
                        <th className="py-3 px-3 fw-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMaterials.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="text-center py-5">
                            <div className="text-muted">
                              <i className="fas fa-search fa-2x mb-3 d-block"></i>
                              <h6>No materials found</h6>
                              <small>{materialFilter === 'all' ? 'No materials available' : `No ${materialFilter} materials found`}</small>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredMaterials.map((material) => (
                          <tr key={material.material_id}>
                            <td className="py-3 px-3">
                              <code className="small bg-light px-2 py-1 rounded">{material.material_code}</code>
                            </td>
                            <td className="py-3 px-3">
                              <div className="fw-semibold text-dark">{material.material_name}</div>
                              {material.description && (
                                <small className="text-muted">{material.description.substring(0, 50)}...</small>
                              )}
                            </td>
                            <td className="py-3 px-3 text-end">
                              <div className="fw-bold text-dark">{material.available_quantity}</div>
                              <small className="text-muted">{material.unit_of_measure}</small>
                            </td>
                            <td className="py-3 px-3 text-end">
                              <div className="fw-semibold text-info">{material.reorder_level}</div>
                            </td>
                            <td className="py-3 px-3 text-end">
                              <div className="fw-semibold">₱{material.standard_cost.toLocaleString()}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="small text-muted">{material.location || 'N/A'}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`badge ${material.category === 'raw' ? 'bg-primary' : 'bg-info'} px-2 py-1`}>
                                {material.category === 'raw' ? 'Raw' : 'Packaging'}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="small text-muted">{material.supplier || 'N/A'}</div>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`badge bg-${material.status_variant} px-2 py-1`}>
                                {material.status_label}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <div className="d-flex gap-1 align-items-center">
                                <button 
                                  className="btn btn-sm btn-action"
                                  onClick={() => handleViewMaterialDetails(material)}
                                  title="View Details"
                                  style={{ minWidth: '32px', height: '32px', padding: '6px' }}
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button 
                                  className="btn btn-sm btn-action"
                                  onClick={() => handleAdjustStock(material)}
                                  title="Adjust Stock"
                                  style={{ minWidth: '32px', height: '32px', padding: '6px' }}
                                >
                                  <i className="fas fa-warehouse"></i>
                                </button>
                                <button 
                                  className="btn btn-sm btn-action"
                                  onClick={() => handleEditMaterial(material)}
                                  title="Edit Material"
                                  style={{ minWidth: '32px', height: '32px', padding: '6px' }}
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  className="btn btn-sm btn-action"
                                  onClick={() => handleDeleteMaterial(material.material_id)}
                                  title="Delete Material"
                                  style={{ minWidth: '32px', height: '32px', padding: '6px' }}
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h5 className="mb-1 text-dark fw-semibold">
                    <i className="fas fa-check-circle me-2 text-success"></i>
                    Products
                  </h5>
                  <small className="text-muted">
                    {filteredProducts.length} of {products.length} products
                  </small>
                </div>
                <div className="d-flex gap-2">
                  <button 
                    className={`btn btn-sm ${productFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setProductFilter('all')}
                  >
                    <i className="fas fa-list me-1"></i>
                    All Products
                  </button>
                  <button 
                    className={`btn btn-sm ${productFilter === 'made_to_order' ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => setProductFilter('made_to_order')}
                  >
                    <i className="fas fa-tools me-1"></i>
                    Made to Order
                  </button>
                  <button 
                    className={`btn btn-sm ${productFilter === 'stocked' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setProductFilter('stocked')}
                  >
                    <i className="fas fa-warehouse me-1"></i>
                    Stocked Products
                  </button>
                </div>
              </div>
              
              <div className="card border-0 shadow-sm">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="py-3 px-3 fw-semibold">Code</th>
                        <th className="py-3 px-3 fw-semibold">Name</th>
                        <th className="py-3 px-3 fw-semibold text-end">Standard Cost</th>
                        <th className="py-3 px-3 fw-semibold text-end">Selling Price</th>
                        <th className="py-3 px-3 fw-semibold text-end">Stock</th>
                        <th className="py-3 px-3 fw-semibold text-end">Materials Count</th>
                        <th className="py-3 px-3 fw-semibold text-end">BOM Cost</th>
                        <th className="py-3 px-3 fw-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-5">
                            <div className="text-muted">
                              <i className="fas fa-search fa-2x mb-3 d-block"></i>
                              <h6>No products found</h6>
                              <small>{productFilter === 'all' ? 'Add products to get started' : `No ${productFilter === 'made_to_order' ? 'made to order' : 'stocked'} products found`}</small>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product) => (
                          <tr key={product.product_id}>
                            <td className="py-3 px-3">
                              <code className="small bg-light px-2 py-1 rounded">{product.product_code}</code>
                            </td>
                            <td className="py-3 px-3">
                              <div className="fw-semibold text-dark">{product.product_name}</div>
                              {product.description && (
                                <small className="text-muted">{product.description.substring(0, 50)}...</small>
                              )}
                            </td>
                            <td className="py-3 px-3 text-end">
                              <div className="fw-bold text-dark">₱{product.standard_cost.toLocaleString()}</div>
                            </td>
                            <td className="py-3 px-3 text-end">
                              <div className="fw-bold text-success">₱{product.price.toLocaleString()}</div>
                            </td>
                            <td className="py-3 px-3 text-end">
                              <div className="d-flex flex-column align-items-end">
                                <div className="fw-bold text-dark">{product.current_stock || 0}</div>
                                <small className={`badge badge-sm ${
                                  product.status === 'out_of_stock' ? 'bg-danger' :
                                  product.status === 'low_stock' ? 'bg-warning' :
                                  product.status === 'in_stock' ? 'bg-success' :
                                  product.status === 'not_in_production' ? 'bg-secondary' :
                                  product.status === 'in_production' ? 'bg-warning' :
                                  product.status === 'ready_to_deliver' ? 'bg-info' :
                                  product.status === 'completed' ? 'bg-success' :
                                  'bg-secondary'
                                }`}>
                                  {product.status_label || 'Unknown'}
                                </small>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-end">
                              <div className="fw-semibold">{product.materials_count}</div>
                            </td>
                            <td className="py-3 px-3 text-end">
                              <div className="fw-semibold text-info">₱{product.total_material_cost.toLocaleString()}</div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="d-flex gap-1 align-items-center">
                                <button 
                                  className="btn btn-sm btn-action"
                                  onClick={() => handleViewProductDetails(product)}
                                  title="View Details"
                                  style={{ minWidth: '32px', height: '32px', padding: '6px' }}
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                                <button 
                                  className="btn btn-sm btn-action"
                                  onClick={() => handleEditBOM(product)}
                                  title="Edit BOM"
                                  style={{ minWidth: '32px', height: '32px', padding: '6px' }}
                                >
                                  <i className="fas fa-list-alt"></i>
                                </button>
                                <button 
                                  className="btn btn-sm btn-action"
                                  onClick={() => handleEditProduct(product)}
                                  title="Edit Product"
                                  style={{ minWidth: '32px', height: '32px', padding: '6px' }}
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h5 className="mb-1 text-dark fw-semibold">
                    <i className="fas fa-history me-2 text-info"></i>
                    Inventory Transactions
                  </h5>
                  <small className="text-muted">
                    Recent inventory movements
                  </small>
                </div>
              </div>
              
              <div className="card border-0 shadow-sm">
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="py-3 px-3 fw-semibold">Date</th>
                        <th className="py-3 px-3 fw-semibold">Material</th>
                        <th className="py-3 px-3 fw-semibold">Type</th>
                        <th className="py-3 px-3 fw-semibold text-end">Quantity</th>
                        <th className="py-3 px-3 fw-semibold">Reference</th>
                        <th className="py-3 px-3 fw-semibold">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-5">
                            <div className="text-muted">
                              <i className="fas fa-search fa-2x mb-3 d-block"></i>
                              <h6>No transactions found</h6>
                              <small>Transactions will appear here</small>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        transactions.map((transaction) => (
                          <tr key={transaction.transaction_id}>
                            <td className="py-3 px-3">
                              <small>{new Date(transaction.timestamp).toLocaleDateString()}</small>
                            </td>
                            <td className="py-3 px-3">
                              <div className="fw-semibold text-dark">{transaction.material?.material_name}</div>
                              <small className="text-muted">{transaction.material?.material_code}</small>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`badge bg-${
                                transaction.transaction_type === 'PURCHASE' ? 'success' :
                                transaction.transaction_type === 'CONSUMPTION' ? 'warning' :
                                transaction.transaction_type === 'DAILY_OUTPUT' ? 'info' :
                                'secondary'
                              }`}>
                                {transaction.transaction_type}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-end">
                              <div className={`fw-bold ${transaction.quantity > 0 ? 'text-success' : 'text-danger'}`}>
                                {transaction.quantity > 0 ? '+' : ''}{transaction.quantity}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <small>{transaction.reference}</small>
                            </td>
                            <td className="py-3 px-3">
                              <small className="text-muted">{transaction.remarks}</small>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Daily Output Tab */}
          {activeTab === 'daily-output' && (
            <div className="mb-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h5 className="mb-1 text-dark fw-semibold">
                    <i className="fas fa-chart-line me-2 text-info"></i>
                    Daily Alkansya Output
                  </h5>
                  <small className="text-muted">
                    Production output records and statistics
                  </small>
                </div>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowAlkansyaModal(true)}
                >
                  <i className="fas fa-plus me-2"></i>
                  Record Daily Output
                </button>
              </div>
              
              <div className="card border-0 shadow-sm">
                <div className="card-body p-0">
                  <table className="table table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="py-3 px-3 fw-semibold">Date</th>
                        <th className="py-3 px-3 fw-semibold text-end">Quantity Produced</th>
                        <th className="py-3 px-3 fw-semibold">Produced By</th>
                        <th className="py-3 px-3 fw-semibold">Materials Used</th>
                        <th className="py-3 px-3 fw-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyOutputs.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="text-center py-5">
                            <div className="text-muted">
                              <i className="fas fa-chart-line fa-2x mb-3 d-block"></i>
                              <h6>No daily output records found</h6>
                              <small>Start recording daily production to see data here</small>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        dailyOutputs.map((output) => (
                          <tr key={output.id}>
                            <td className="py-3 px-3">
                              <div className="fw-semibold text-dark">
                                {new Date(output.date).toLocaleDateString()}
                              </div>
                              <small className="text-muted">
                                {new Date(output.date).toLocaleTimeString()}
                              </small>
                            </td>
                            <td className="py-3 px-3 text-end">
                              <div className="fw-bold text-success">
                                {output.quantity_produced} units
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="fw-semibold text-dark">
                                {output.produced_by || 'System'}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="small text-muted">
                                {output.materials_used && Array.isArray(output.materials_used) 
                                  ? `${output.materials_used.length} materials consumed`
                                  : 'Materials data not available'
                                }
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="d-flex gap-1">
                                <button 
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => {
                                    // View details functionality
                                    console.log('View output details:', output);
                                  }}
                                  title="View Details"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Modals */}
          <MaterialModal
            show={showMaterialModal}
            onHide={() => setShowMaterialModal(false)}
            material={editingMaterial}
            onSave={handleSaveMaterial}
          />

          <BOMModal
            show={showBOMModal}
            onHide={() => setShowBOMModal(false)}
            product={selectedProduct}
            onSave={fetchData}
          />

          <AlkansyaOutputModal
            show={showAlkansyaModal}
            onHide={() => setShowAlkansyaModal(false)}
            onSuccess={fetchData}
          />

          <MaterialDetailsModal
            show={showMaterialDetailsModal}
            onHide={() => setShowMaterialDetailsModal(false)}
            material={selectedMaterial}
          />

          <StockAdjustmentModal
            show={showStockAdjustmentModal}
            onHide={() => setShowStockAdjustmentModal(false)}
            material={selectedMaterial}
            onSuccess={fetchData}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default NormalizedInventoryPage;
