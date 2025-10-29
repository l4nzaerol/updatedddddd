import React, { useEffect, useState, useCallback } from "react";
import api from "../../api/client";
import { 
  BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, 
  ScatterChart, Scatter, ComposedChart
} from "recharts";
import { 
  FaBox, FaChartLine, FaClipboardList, FaHistory, 
  FaTruck, FaExclamationTriangle, FaCheckCircle,
  FaDownload, FaSync, FaFilter, FaSearch, FaEye, FaEdit
} from "react-icons/fa";
import { toast } from "sonner";

const EnhancedInventoryReports = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("overview");
    const [windowDays, setWindowDays] = useState(30);
    const [materialFilter, setMaterialFilter] = useState('all');
    const [stockFilter, setStockFilter] = useState('all'); // Filter for stock tab: 'all', 'alkansya', 'made_to_order'
    const [refreshKey, setRefreshKey] = useState(0);
    
    // Enhanced data states
    const [dashboardData, setDashboardData] = useState(null);
    const [inventoryReport, setInventoryReport] = useState(null);
    const [replenishmentSchedule, setReplenishmentSchedule] = useState(null);
    const [forecastReport, setForecastReport] = useState(null);
    const [turnoverReport, setTurnoverReport] = useState(null);
    const [alkansyaStats, setAlkansyaStats] = useState(null);
    const [materialUsageAnalysis, setMaterialUsageAnalysis] = useState(null);
    const [inventoryTransactions, setInventoryTransactions] = useState(null);
    const [realTimeAlerts, setRealTimeAlerts] = useState(null);
    
    // Enhanced forecasting states
    const [forecastType, setForecastType] = useState('alkansya');
    const [forecastFilter, setForecastFilter] = useState('all'); // Filter for forecast tab
    const [alkansyaForecast, setAlkansyaForecast] = useState(null);
    const [madeToOrderForecast, setMadeToOrderForecast] = useState(null);
    const [overallForecast, setOverallForecast] = useState(null);
    
    // Enhanced replenishment states
    const [enhancedReplenishment, setEnhancedReplenishment] = useState(null);
    const [replenishmentView, setReplenishmentView] = useState('summary'); // summary, schedule, analytics
    const [replenishmentFilter, setReplenishmentFilter] = useState('all'); // all, alkansya, made_to_order
    
    // Enhanced transactions states
    const [enhancedTransactions, setEnhancedTransactions] = useState(null);
    const [transactionView, setTransactionView] = useState('list'); // list, summary, analytics
    const [transactionFilter, setTransactionFilter] = useState('all'); // all, alkansya, made_to_order, other
    
    // Modal states for report preview
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [previewTitle, setPreviewTitle] = useState('');
    
    // Filtered data
    const [filteredInventoryData, setFilteredInventoryData] = useState(null);
    
    // Loading states for each tab
    const [tabLoadingStates, setTabLoadingStates] = useState({
        overview: false,
        stock: false,
        forecast: false,
        replenishment: false,
        transactions: false,
        alerts: false
    });

    const colors = {
        primary: '#8B4513',
        secondary: '#A0522D',
        accent: '#CD853F',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545',
        info: '#17a2b8',
        light: '#F5DEB3',
        dark: '#2F1B14'
    };

    const chartColors = [
        '#8B4513', '#A0522D', '#CD853F', '#F5DEB3', '#D2691E',
        '#B8860B', '#DAA520', '#B22222', '#228B22', '#4169E1'
    ];

    const fetchAllReports = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const dateRange = {
                start_date: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
            };

            const safeFetch = async (endpoint, params = {}) => {
                try {
                    const response = await api.get(endpoint, { params });
                    return response.data;
                } catch (error) {
                    console.warn(`Failed to fetch ${endpoint}:`, error.message);
                    return null;
                }
            };

            // Fetch materials, products, alkansya output, BOM data, and accepted orders for accurate stock calculation
            const [normalizedInventoryData, productsData, dailyOutputData, bomsData, acceptedOrdersData] = await Promise.all([
                safeFetch('/normalized-inventory/materials'),
                safeFetch('/normalized-inventory/products'),
                safeFetch('/normalized-inventory/daily-output'),
                safeFetch('/bom'),
                safeFetch('/orders/accepted') // Fetch accepted orders for Made-to-Order consumption calculation
            ]);

            // Process materials with MRP calculations
            let inventoryData = { items: [], summary: { total_items: 0, items_needing_reorder: 0, critical_items: 0, total_usage: 0 } };
            
            if (normalizedInventoryData && Array.isArray(normalizedInventoryData)) {
                const materials = normalizedInventoryData;
                const products = productsData || [];
                const alkansyaOutput = dailyOutputData?.daily_outputs || [];
                const boms = bomsData || [];
                const acceptedOrders = acceptedOrdersData?.orders || [];
                
                // Get Alkansya product IDs
                const alkansyaProductIds = products
                    .filter(p => p.category_name === 'Stocked Products' && p.name?.toLowerCase().includes('alkansya'))
                    .map(p => p.id);
                
                // Get Made to Order product IDs
                const madeToOrderProductIds = products
                    .filter(p => p.category_name === 'Made to Order')
                    .map(p => p.id);
                
                // Get Alkansya material IDs from BOM
                const alkansyaMaterialIds = boms
                    .filter(bom => alkansyaProductIds.includes(bom.product_id))
                    .map(bom => bom.material_id);
                
                // Get Made to Order material IDs from BOM
                const madeToOrderMaterialIds = boms
                    .filter(bom => madeToOrderProductIds.includes(bom.product_id))
                    .map(bom => bom.material_id);
                
                // Process each material with MRP calculations
                const processedItems = materials.map(material => {
                    // Check if material is used in Alkansya
                    const isAlkansyaMaterial = alkansyaMaterialIds.includes(material.material_id);
                    
                    // Check if material is used in Made to Order products
                    const isMadeToOrderMaterial = madeToOrderMaterialIds.includes(material.material_id);
                    
                    // Calculate average daily consumption from Alkansya output (last 30 days)
                    const recentOutput = alkansyaOutput.filter(o => {
                        const outputDate = new Date(o.output_date);
                        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                        return outputDate >= thirtyDaysAgo;
                    });
                    
                    // Find BOM entry for this material in Alkansya
                    const alkansyaBomEntry = boms.find(b => 
                        b.material_id === material.material_id && 
                        alkansyaProductIds.includes(b.product_id)
                    );
                    
                    // Calculate Alkansya consumption
                    let alkansyaConsumption = 0;
                    if (alkansyaBomEntry && recentOutput.length > 0) {
                        const totalQuantity = recentOutput.reduce((sum, o) => sum + (o.quantity_produced || 0), 0);
                        const avgDailyOutput = totalQuantity / 30; // average per day
                        alkansyaConsumption = avgDailyOutput * (alkansyaBomEntry.quantity_per_product || 0);
                    }
                    
                    // Calculate Made-to-Order consumption from accepted orders (last 30 days)
                    let madeToOrderConsumption = 0;
                    if (isMadeToOrderMaterial && acceptedOrders.length > 0) {
                        const recentOrders = acceptedOrders.filter(order => {
                            const orderDate = new Date(order.accepted_at || order.created_at);
                            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                            return orderDate >= thirtyDaysAgo;
                        });
                        
                        // Calculate average daily consumption from orders
                        const totalQuantityOrdered = recentOrders.reduce((sum, order) => {
                            const orderProducts = order.order_items || order.products || [];
                            const materialQuantity = orderProducts.reduce((prodSum, item) => {
                                const orderBomEntry = boms.find(b => 
                                    b.product_id === item.product_id && 
                                    b.material_id === material.material_id &&
                                    madeToOrderProductIds.includes(b.product_id)
                                );
                                if (orderBomEntry) {
                                    return prodSum + (item.quantity * orderBomEntry.quantity_per_product);
                                }
                                return prodSum;
                            }, 0);
                            return sum + materialQuantity;
                        }, 0);
                        
                        madeToOrderConsumption = totalQuantityOrdered / 30; // average per day
                    }
                    
                    // Total average daily consumption
                    let avgDailyConsumption = alkansyaConsumption + madeToOrderConsumption;
                    
                    // Calculate safety stock (typically 2 weeks of average consumption)
                    const safetyStock = Math.ceil(avgDailyConsumption * 14);
                    
                    // Calculate reorder point (safety stock + lead time consumption)
                    const leadTimeDays = material.lead_time_days || 7;
                    const reorderPoint = safetyStock + Math.ceil(avgDailyConsumption * leadTimeDays);
                    
                    // Calculate max level (typically 30 days of consumption or max_level if set)
                    const maxLevel = material.max_level || Math.ceil(avgDailyConsumption * 30);
                    
                    // Determine stock status based on current available quantity
                    const availableQty = material.available_quantity || 0;
                    let stockStatus = 'in_stock';
                    if (availableQty <= 0) {
                        stockStatus = 'out_of_stock';
                    } else if (availableQty <= reorderPoint) {
                        stockStatus = 'low';
                    } else if (availableQty <= safetyStock) {
                        stockStatus = 'critical';
                    }
                    
                    // Calculate days until stockout
                    const daysUntilStockout = avgDailyConsumption > 0 
                        ? Math.floor(availableQty / avgDailyConsumption) 
                        : 999;
                    
                    // Calculate total value
                    const totalValue = (material.available_quantity || 0) * (material.standard_cost || 0);
                    
                    return {
                        material_id: material.material_id,
                        name: material.material_name,
                        material_code: material.material_code,
                        sku: material.material_code,
                        category: material.category || 'raw',
                        current_stock: material.available_quantity || 0,
                        available_quantity: material.available_quantity || 0,
                        quantity_on_hand: material.total_quantity_on_hand || 0,
                        quantity_reserved: material.total_quantity_reserved || 0,
                        unit: material.unit_of_measure || 'pcs',
                        unit_cost: material.standard_cost || 0,
                        value: totalValue,
                        reorder_point: reorderPoint,
                        safety_stock: safetyStock,
                        max_level: maxLevel,
                        critical_stock: material.critical_stock || 0,
                        lead_time_days: leadTimeDays,
                        supplier: material.supplier || 'N/A',
                        location: material.location || 'Windfield 2',
                        stock_status: stockStatus,
                        is_alkansya_material: isAlkansyaMaterial,
                        is_made_to_order_material: isMadeToOrderMaterial,
                        avg_daily_consumption: avgDailyConsumption,
                        days_until_stockout: daysUntilStockout,
                        needs_reorder: availableQty <= reorderPoint,
                        stock_variant: material.status_variant || 'success',
                        status_label: material.status_label || 'In Stock'
                    };
                });
                
                inventoryData = {
                    items: processedItems,
                    summary: {
                        total_items: processedItems.length,
                        items_needing_reorder: processedItems.filter(i => i.needs_reorder).length,
                        critical_items: processedItems.filter(i => i.stock_status === 'critical' || i.stock_status === 'out_of_stock').length,
                        total_usage: processedItems.reduce((sum, item) => sum + item.avg_daily_consumption, 0),
                        total_value: processedItems.reduce((sum, item) => sum + item.value, 0),
                        alkansya_materials: processedItems.filter(i => i.is_alkansya_material).length,
                        made_to_order_materials: processedItems.filter(i => i.is_made_to_order_material).length,
                        low_stock_items: processedItems.filter(i => i.stock_status === 'low').length,
                        out_of_stock_items: processedItems.filter(i => i.stock_status === 'out_of_stock').length,
                        alkansya_out_of_stock: processedItems.filter(i => i.is_alkansya_material && i.stock_status === 'out_of_stock').length,
                        alkansya_needs_reorder: processedItems.filter(i => i.is_alkansya_material && i.needs_reorder).length,
                        made_to_order_out_of_stock: processedItems.filter(i => i.is_made_to_order_material && i.stock_status === 'out_of_stock').length,
                        made_to_order_needs_reorder: processedItems.filter(i => i.is_made_to_order_material && i.needs_reorder).length
                    }
                };
            }
            
            setDashboardData({
                summary: {
                    total_items: inventoryData.summary.total_items,
                    low_stock_items: inventoryData.summary.items_needing_reorder,
                    out_of_stock_items: inventoryData.summary.critical_items,
                    recent_usage: inventoryData.summary.total_usage,
                    total_value: inventoryData.summary.total_value || 0,
                    critical_items: inventoryData.summary.critical_items,
                    alkansya_materials: inventoryData.summary.alkansya_materials,
                    made_to_order_materials: inventoryData.summary.made_to_order_materials,
                    alkansya_out_of_stock: inventoryData.summary.alkansya_out_of_stock,
                    alkansya_needs_reorder: inventoryData.summary.alkansya_needs_reorder,
                    made_to_order_out_of_stock: inventoryData.summary.made_to_order_out_of_stock,
                    made_to_order_needs_reorder: inventoryData.summary.made_to_order_needs_reorder
                },
                critical_items: inventoryData.items.filter(item => item.stock_status === 'out_of_stock' || item.stock_status === 'critical'),
                recent_activities: []
            });
            
            setInventoryReport(inventoryData);
            
            // Apply initial filter
            applyFilter(inventoryData, materialFilter);
            
            // Also set filtered data initially
            setFilteredInventoryData(inventoryData);

            // Set default values for other data
            setTurnoverReport([]);
            setAlkansyaStats({ total_output: 0, average_daily: 0, last_7_days: 0, production_efficiency: 0 });
            setMaterialUsageAnalysis([]);

        } catch (error) {
            console.error('Error fetching reports:', error);
            setError('Failed to load inventory reports. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [windowDays, refreshKey, materialFilter]);

    useEffect(() => {
        fetchAllReports();
    }, [fetchAllReports]);


    const handleGlobalRefresh = () => {
        setRefreshKey(prev => prev + 1);
        toast.success("Reports refreshed successfully!");
    };

    // Preview Report Function
    const previewReport = (reportType) => {
        try {
            let data = null;
            let title = '';

            switch(reportType) {
                case 'stock':
                    title = 'Stock Levels Report';
                    data = generateStockReportData(filteredInventoryData || inventoryReport);
                    break;
                case 'usage':
                    title = 'Material Usage Trends Report';
                    data = generateUsageReportData(filteredInventoryData, alkansyaForecast, madeToOrderForecast);
                    break;
                case 'replenishment':
                    title = 'Replenishment Schedule Report';
                    data = generateReplenishmentReportData(enhancedReplenishment);
                    break;
                case 'full':
                    title = 'Complete Inventory Report';
                    data = generateFullReportData(filteredInventoryData || inventoryReport, enhancedReplenishment);
                    break;
                default:
                    return;
            }

            setPreviewData(data);
            setPreviewTitle(title);
            setShowPreviewModal(true);
        } catch (error) {
            console.error('Error generating preview:', error);
            toast.error('Failed to generate report preview. Please try again.');
        }
    };

    // Download Report Function
    const downloadReport = (reportType) => {
        try {
            let data = [];
            let filename = '';
            let content = '';

            switch(reportType) {
                case 'stock':
                    filename = `Stock_Levels_Report_${new Date().toISOString().split('T')[0]}.csv`;
                    content = generateStockReportCSV(filteredInventoryData || inventoryReport);
                    break;
                case 'usage':
                    filename = `Material_Usage_Trends_Report_${new Date().toISOString().split('T')[0]}.csv`;
                    content = generateUsageReportCSV(filteredInventoryData, alkansyaForecast, madeToOrderForecast);
                    break;
                case 'replenishment':
                    filename = `Replenishment_Schedule_Report_${new Date().toISOString().split('T')[0]}.csv`;
                    content = generateReplenishmentReportCSV(enhancedReplenishment);
                    break;
                case 'full':
                    filename = `Complete_Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`;
                    content = generateFullReportCSV(filteredInventoryData || inventoryReport, enhancedReplenishment);
                    break;
                default:
                    return;
            }

            // Create and download file
            const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report downloaded successfully!`);
        } catch (error) {
            console.error('Error downloading report:', error);
            toast.error('Failed to generate report. Please try again.');
        }
    };

    // Generate Stock Levels Report CSV
    const generateStockReportCSV = (data) => {
        if (!data || !data.items) return '';
        
        const headers = 'Material Name,SKU,Available Quantity,Safety Stock,Reorder Point,Days Until Stockout,Status,Category,Unit Cost\n';
        const rows = data.items.map(item => 
            `"${item.name}",${item.material_code},${item.current_stock},${item.safety_stock},${item.reorder_point},${item.days_until_stockout},"${item.stock_status}",${item.is_alkansya_material ? 'Alkansya' : item.is_made_to_order_material ? 'Made to Order' : 'Other'},₱${item.unit_cost}`
        ).join('\n');
        
        return headers + rows;
    };

    // Generate Usage Trends Report CSV
    const generateUsageReportCSV = (inventoryData, alkansyaForecast, madeToOrderForecast) => {
        let content = 'Material Name,Category,Average Daily Consumption,Current Stock,Days Until Stockout,Projected Usage,Status\n';
        
        if (inventoryData && inventoryData.items) {
            inventoryData.items.forEach(item => {
                content += `"${item.name}",${item.is_alkansya_material ? 'Alkansya' : item.is_made_to_order_material ? 'Made to Order' : 'Other'},${item.avg_daily_consumption.toFixed(2)},${item.current_stock},${item.days_until_stockout},${(item.avg_daily_consumption * 30).toFixed(2)} (30-day projection),${item.stock_status}\n`;
            });
        }
        
        return content;
    };

    // Generate Replenishment Report CSV
    const generateReplenishmentReportCSV = (replenishmentData) => {
        let content = 'Material Name,Current Stock,Reorder Point,Recommended Quantity,Priority,Status,Category\n';
        
        if (replenishmentData && replenishmentData.alkansya_replenishment && replenishmentData.alkansya_replenishment.schedule) {
            replenishmentData.alkansya_replenishment.schedule.forEach(item => {
                content += `"${item.material_name}",${item.current_stock},${item.reorder_point},${item.recommended_quantity},"${item.priority}","${item.needs_reorder ? 'Need Reorder' : 'OK'}",Alkansya\n`;
            });
        }
        
        if (replenishmentData && replenishmentData.made_to_order_replenishment && replenishmentData.made_to_order_replenishment.schedule) {
            replenishmentData.made_to_order_replenishment.schedule.forEach(item => {
                content += `"${item.material_name}",${item.current_stock},${item.reorder_point},${item.recommended_quantity},"${item.priority}","${item.needs_reorder ? 'Need Reorder' : 'OK'}",Made to Order\n`;
            });
        }
        
        return content;
    };

    // Generate Full Report CSV
    const generateFullReportCSV = (inventoryData, replenishmentData) => {
        let content = 'INVENTORY REPORT SUMMARY\n';
        content += `Generated: ${new Date().toLocaleString()}\n`;
        content += `Total Materials: ${inventoryData?.summary?.total_items || 0}\n`;
        content += `Materials Needing Reorder: ${inventoryData?.summary?.items_needing_reorder || 0}\n`;
        content += `Critical Items: ${inventoryData?.summary?.critical_items || 0}\n\n`;
        
        content += '\nMATERIAL DETAILS\n';
        content += 'Material Name,SKU,Category,Available Qty,Safety Stock,Reorder Point,Days Left,Status,Unit Cost,Total Value\n';
        
        if (inventoryData && inventoryData.items) {
            inventoryData.items.forEach(item => {
                content += `"${item.name}",${item.material_code},${item.is_alkansya_material ? 'Alkansya' : item.is_made_to_order_material ? 'Made to Order' : 'Other'},${item.current_stock},${item.safety_stock},${item.reorder_point},${item.days_until_stockout},"${item.stock_status}",₱${item.unit_cost},₱${(item.current_stock * item.unit_cost).toFixed(2)}\n`;
            });
        }
        
        return content;
    };

    // Generate Stock Levels Report Data for Preview
    const generateStockReportData = (data) => {
        if (!data || !data.items) return { sections: [] };
        
        return {
            sections: [
                {
                    title: 'Stock Summary',
                    data: [
                        { label: 'Total Materials', value: data.summary?.total_items || 0 },
                        { label: 'Materials Needing Reorder', value: data.summary?.items_needing_reorder || 0 },
                        { label: 'Critical Items', value: data.summary?.critical_items || 0 },
                        { label: 'Low Stock Items', value: data.summary?.low_stock_items || 0 }
                    ]
                },
                {
                    title: 'Material Details',
                    type: 'table',
                    headers: ['Material Name', 'SKU', 'Available Qty', 'Safety Stock', 'Reorder Point', 'Days Left', 'Status', 'Unit Cost'],
                    data: data.items.map(item => [
                        item.name,
                        item.material_code,
                        item.current_stock,
                        item.safety_stock,
                        item.reorder_point,
                        item.days_until_stockout,
                        item.stock_status,
                        `₱${item.unit_cost}`
                    ])
                }
            ]
        };
    };

    // Generate Usage Trends Report Data for Preview
    const generateUsageReportData = (inventoryData, alkansyaForecast, madeToOrderForecast) => {
        return {
            sections: [
                {
                    title: 'Usage Summary',
                    data: [
                        { label: 'Total Consumption', value: inventoryData?.summary?.total_consumption || 0 },
                        { label: 'Alkansya Consumption', value: inventoryData?.summary?.alkansya_consumption || 0 },
                        { label: 'Made-to-Order Consumption', value: inventoryData?.summary?.made_to_order_consumption || 0 },
                        { label: 'Materials Consumed', value: inventoryData?.summary?.materials_consumed || 0 }
                    ]
                },
                {
                    title: 'Top Materials by Usage',
                    type: 'table',
                    headers: ['Material Name', 'Category', 'Avg Daily Usage', 'Current Stock', 'Days Until Stockout', 'Projected Usage', 'Status'],
                    data: inventoryData?.top_materials?.map(material => [
                        material.material_name,
                        material.category,
                        material.avg_daily_usage.toFixed(2),
                        material.current_stock,
                        material.days_until_stockout,
                        `${(material.avg_daily_usage * 30).toFixed(2)} (30-day projection)`,
                        material.status
                    ]) || []
                }
            ]
        };
    };

    // Generate Replenishment Report Data for Preview
    const generateReplenishmentReportData = (data) => {
        if (!data || !data.items) return { sections: [] };
        
        return {
            sections: [
                {
                    title: 'Replenishment Summary',
                    data: [
                        { label: 'Total Items', value: data.summary?.total_items || 0 },
                        { label: 'Critical Items', value: data.summary?.critical_items || 0 },
                        { label: 'High Priority Items', value: data.summary?.high_priority_items || 0 },
                        { label: 'Total Estimated Cost', value: `₱${data.summary?.total_estimated_cost || 0}` }
                    ]
                },
                {
                    title: 'Replenishment Schedule',
                    type: 'table',
                    headers: ['Material Name', 'SKU', 'Current Stock', 'Reorder Qty', 'Priority', 'Estimated Cost', 'Days Until Stockout'],
                    data: data.items.map(item => [
                        item.name,
                        item.sku,
                        item.current_stock,
                        item.reorder_quantity,
                        item.priority,
                        `₱${item.estimated_cost}`,
                        item.days_until_stockout
                    ])
                }
            ]
        };
    };

    // Generate Full Report Data for Preview
    const generateFullReportData = (inventoryData, replenishmentData) => {
        return {
            sections: [
                {
                    title: 'Inventory Overview',
                    data: [
                        { label: 'Total Materials', value: inventoryData?.summary?.total_items || 0 },
                        { label: 'Materials Needing Reorder', value: inventoryData?.summary?.items_needing_reorder || 0 },
                        { label: 'Critical Items', value: inventoryData?.summary?.critical_items || 0 },
                        { label: 'Low Stock Items', value: inventoryData?.summary?.low_stock_items || 0 }
                    ]
                },
                {
                    title: 'Material Details',
                    type: 'table',
                    headers: ['Material Name', 'SKU', 'Category', 'Available Qty', 'Safety Stock', 'Reorder Point', 'Days Left', 'Status', 'Unit Cost'],
                    data: inventoryData?.items?.map(item => [
                        item.name,
                        item.material_code,
                        item.is_alkansya_material ? 'Alkansya' : item.is_made_to_order_material ? 'Made to Order' : 'Other',
                        item.current_stock,
                        item.safety_stock,
                        item.reorder_point,
                        item.days_until_stockout,
                        item.stock_status,
                        `₱${item.unit_cost}`
                    ]) || []
                },
                {
                    title: 'Replenishment Recommendations',
                    type: 'table',
                    headers: ['Material Name', 'SKU', 'Priority', 'Reorder Qty', 'Estimated Cost', 'Days Until Stockout'],
                    data: replenishmentData?.items?.map(item => [
                        item.name,
                        item.sku,
                        item.priority,
                        item.reorder_quantity,
                        `₱${item.estimated_cost}`,
                        item.days_until_stockout
                    ]) || []
                }
            ]
        };
    };

    // Filter function with accurate BOM-based filtering
    const applyFilter = (data, filter) => {
        if (!data || !data.items) {
            setFilteredInventoryData(null);
            return;
        }

        let filteredItems = data.items;
        
        if (filter !== 'all') {
            filteredItems = data.items.filter(item => {
                const name = item.name.toLowerCase();
                switch (filter) {
                    case 'alkansya':
                        // Alkansya has 13 materials based on BOM
                        return name.includes('pinewood 1x4x8ft') || 
                               name.includes('plywood 4.2mm 4x8ft') || 
                               name.includes('acrylic 1.5mm 4x8ft') || 
                               name.includes('pin nail f30') || 
                               name.includes('black screw 1 1/2') || 
                               name.includes('stikwell 250 grams') || 
                               name.includes('grinder pad 4inch 120 grit') || 
                               name.includes('sticker 24 inch car decals') || 
                               name.includes('transfer tape') || 
                               name.includes('tape 2 inch 200m') || 
                               name.includes('fragile tape') || 
                               name.includes('bubble wrap 40 inch x 100m') || 
                               name.includes('insulation 8mm 40 inch x 100m');
                    case 'dining-table':
                        // Dining Table has 9 materials based on BOM
                        return name.includes('mahogany hardwood 2x4x8ft') || 
                               name.includes('mahogany hardwood 1x6x10ft') || 
                               name.includes('plywood 18mm 4x8ft') || 
                               name.includes('metal table brackets') || 
                               name.includes('wood screws 3 inch') || 
                               name.includes('wood glue 500ml') || 
                               name.includes('wood stain walnut 1 liter') || 
                               name.includes('polyurethane gloss 1 liter') || 
                               name.includes('felt pads large');
                    case 'wooden-chair':
                        // Wooden Chair has 12 materials based on BOM
                        return name.includes('mahogany hardwood 2x2x6ft') || 
                               name.includes('mahogany hardwood 1x4x6ft') || 
                               name.includes('plywood 12mm 2x4ft') || 
                               name.includes('wood screws 2.5 inch') || 
                               name.includes('wood dowels 8mm') || 
                               name.includes('wood glue 250ml') || 
                               name.includes('foam cushion 2 inch') || 
                               name.includes('upholstery fabric') || 
                               name.includes('upholstery staples') || 
                               name.includes('wood stain walnut 500ml') || 
                               name.includes('lacquer spray clear') || 
                               name.includes('felt pads small');
                    default:
                        return true;
                }
            });
        }

        setFilteredInventoryData({
            ...data,
            items: filteredItems
        });
    };

    // Handle filter changes and re-apply to current data
    const handleFilterChange = (newFilter) => {
        setMaterialFilter(newFilter);
        if (inventoryReport) {
            applyFilter(inventoryReport, newFilter);
        } else {
            // Ensure data is loaded for stock tab if not yet available
            loadTabData('stock');
        }
    };

    // Lazy loading function for each tab
    const loadTabData = async (tabName) => {
        setTabLoadingStates(prev => ({ ...prev, [tabName]: true }));
        
        // Simulate 2-second delay for fast loading experience
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        try {
            const dateRange = {
                start_date: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0]
            };

            switch (tabName) {
                case 'overview':
                    // Overview data is already loaded initially
                    break;
                    
                case 'stock':
                    // Always refresh stock data when tab is clicked with MRP calculations
                    const [materialsRes, productsRes, outputRes, bomsRes] = await Promise.allSettled([
                        api.get('/normalized-inventory/materials'),
                        api.get('/normalized-inventory/products'),
                        api.get('/normalized-inventory/daily-output'),
                        api.get('/bom')
                    ]);
                    
                    const materials = materialsRes.status === 'fulfilled' ? materialsRes.value?.data : [];
                    const products = productsRes.status === 'fulfilled' ? productsRes.value?.data : [];
                    const alkansyaOutput = outputRes.status === 'fulfilled' ? outputRes.value?.data?.daily_outputs : [];
                    const boms = bomsRes.status === 'fulfilled' ? bomsRes.value?.data : [];
                    
                    // Reapply MRP processing
                    const alkansyaProductIds = products
                        .filter(p => p.category_name === 'Stocked Products' && p.name?.toLowerCase().includes('alkansya'))
                        .map(p => p.id);
                    
                    const madeToOrderProductIds = products
                        .filter(p => p.category_name === 'Made to Order')
                        .map(p => p.id);
                    
                    const alkansyaMaterialIds = boms
                        .filter(bom => alkansyaProductIds.includes(bom.product_id))
                        .map(bom => bom.material_id);
                    
                    const madeToOrderMaterialIds = boms
                        .filter(bom => madeToOrderProductIds.includes(bom.product_id))
                        .map(bom => bom.material_id);
                    
                    const processedItems = materials.map(material => {
                        const isAlkansyaMaterial = alkansyaMaterialIds.includes(material.material_id);
                        const isMadeToOrderMaterial = madeToOrderMaterialIds.includes(material.material_id);
                        const recentOutput = alkansyaOutput.filter(o => {
                            const outputDate = new Date(o.output_date);
                            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                            return outputDate >= thirtyDaysAgo;
                        });
                        
                        const bomEntry = boms.find(b => 
                            b.material_id === material.material_id && 
                            alkansyaProductIds.includes(b.product_id)
                        );
                        
                        let avgDailyConsumption = 0;
                        if (bomEntry && recentOutput.length > 0) {
                            const totalQuantity = recentOutput.reduce((sum, o) => sum + (o.quantity_produced || 0), 0);
                            const avgDailyOutput = totalQuantity / 30;
                            avgDailyConsumption = avgDailyOutput * (bomEntry.quantity_per_product || 0);
                        }
                        
                        const safetyStock = Math.ceil(avgDailyConsumption * 14);
                        const leadTimeDays = material.lead_time_days || 7;
                        const reorderPoint = safetyStock + Math.ceil(avgDailyConsumption * leadTimeDays);
                        const maxLevel = material.max_level || Math.ceil(avgDailyConsumption * 30);
                        const availableQty = material.available_quantity || 0;
                        let stockStatus = 'in_stock';
                        if (availableQty <= 0) {
                            stockStatus = 'out_of_stock';
                        } else if (availableQty <= reorderPoint) {
                            stockStatus = 'low';
                        } else if (availableQty <= safetyStock) {
                            stockStatus = 'critical';
                        }
                        
                        const daysUntilStockout = avgDailyConsumption > 0 
                            ? Math.floor(availableQty / avgDailyConsumption) 
                            : 999;
                        const totalValue = availableQty * (material.standard_cost || 0);
                        
                        return {
                            material_id: material.material_id,
                            name: material.material_name,
                            material_code: material.material_code,
                            sku: material.material_code,
                            category: material.category || 'raw',
                            current_stock: availableQty,
                            available_quantity: availableQty,
                            quantity_on_hand: material.total_quantity_on_hand || 0,
                            quantity_reserved: material.total_quantity_reserved || 0,
                            unit: material.unit_of_measure || 'pcs',
                            unit_cost: material.standard_cost || 0,
                            value: totalValue,
                            reorder_point: reorderPoint,
                            safety_stock: safetyStock,
                            max_level: maxLevel,
                            lead_time_days: leadTimeDays,
                            supplier: material.supplier || 'N/A',
                            location: material.location || 'Windfield 2',
                            stock_status: stockStatus,
                            is_alkansya_material: isAlkansyaMaterial,
                            is_made_to_order_material: isMadeToOrderMaterial,
                            avg_daily_consumption: avgDailyConsumption,
                            days_until_stockout: daysUntilStockout,
                            needs_reorder: availableQty <= reorderPoint
                        };
                    });
                    
                    const data = {
                        items: processedItems,
                        summary: {
                            total_items: processedItems.length,
                            items_needing_reorder: processedItems.filter(i => i.needs_reorder).length,
                            critical_items: processedItems.filter(i => i.stock_status === 'critical' || i.stock_status === 'out_of_stock').length,
                            total_usage: processedItems.reduce((sum, item) => sum + item.avg_daily_consumption, 0),
                            total_value: processedItems.reduce((sum, item) => sum + item.value, 0),
                            alkansya_materials: processedItems.filter(i => i.is_alkansya_material).length,
                            made_to_order_materials: processedItems.filter(i => i.is_made_to_order_material).length,
                            low_stock_items: processedItems.filter(i => i.stock_status === 'low').length,
                            out_of_stock_items: processedItems.filter(i => i.stock_status === 'out_of_stock').length
                        }
                    };
                    
                    setInventoryReport(data);
                    applyFilter(data, materialFilter);
                    setFilteredInventoryData(data);
                    break;
                    
                case 'forecast':
                    // Use enhanced forecasting
                    await fetchForecastData();
                    break;
                    
                case 'replenishment':
                    // Use enhanced replenishment
                    await fetchEnhancedReplenishmentData();
                    break;
                    
                case 'transactions':
                    // Use enhanced transactions
                    await fetchEnhancedTransactionsData();
                    break;
                    
                case 'alerts':
                    // Generate alerts from inventory data
                    const inventoryData = filteredInventoryData || inventoryReport;
                    
                    if (inventoryData && inventoryData.items) {
                        const alerts = [];
                        
                        inventoryData.items.forEach(item => {
                            if (item.stock_status === 'out_of_stock') {
                                alerts.push({
                                    id: item.material_id,
                                    material: item.name,
                                    message: `Material is out of stock and needs immediate reorder`,
                                    severity: 'critical',
                                    current_stock: item.current_stock,
                                    reorder_point: item.reorder_point,
                                    safety_stock: item.safety_stock,
                                    timestamp: new Date().toISOString(),
                                    category: item.is_alkansya_material ? 'alkansya' : item.is_made_to_order_material ? 'made_to_order' : 'other'
                                });
                            } else if (item.needs_reorder) {
                                alerts.push({
                                    id: item.material_id,
                                    material: item.name,
                                    message: `Material stock is below reorder point (${item.current_stock} left, reorder point: ${item.reorder_point})`,
                                    severity: 'high',
                                    current_stock: item.current_stock,
                                    reorder_point: item.reorder_point,
                                    safety_stock: item.safety_stock,
                                    timestamp: new Date().toISOString(),
                                    category: item.is_alkansya_material ? 'alkansya' : item.is_made_to_order_material ? 'made_to_order' : 'other'
                                });
                            } else if (item.stock_status === 'critical') {
                                alerts.push({
                                    id: item.material_id,
                                    material: item.name,
                                    message: `Material stock is critically low (${item.current_stock} left, safety stock: ${item.safety_stock})`,
                                    severity: 'medium',
                                    current_stock: item.current_stock,
                                    reorder_point: item.reorder_point,
                                    safety_stock: item.safety_stock,
                                    timestamp: new Date().toISOString(),
                                    category: item.is_alkansya_material ? 'alkansya' : item.is_made_to_order_material ? 'made_to_order' : 'other'
                                });
                            }
                        });
                        
                        setRealTimeAlerts({ alerts, summary: inventoryData.summary });
                    } else {
                        // Fallback to API endpoint
                    if (!realTimeAlerts) {
                            try {
                        const response = await api.get('/inventory/alerts');
                        setRealTimeAlerts(response.data);
                            } catch (error) {
                                console.error('Error fetching alerts from API:', error);
                                setRealTimeAlerts({ alerts: [], summary: { total_alerts: 0 } });
                            }
                        }
                    }
                    break;
            }
        } catch (error) {
            console.error(`Error loading ${tabName} data:`, error);
        } finally {
            setTabLoadingStates(prev => ({ ...prev, [tabName]: false }));
        }
    };

    // Handle tab change with lazy loading
    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        loadTabData(tabId);
    };

    // Enhanced forecasting data fetch function
    const fetchForecastData = async () => {
        setTabLoadingStates(prev => ({ ...prev, forecast: true }));
        
        try {
            const params = {
                forecast_days: windowDays,
                historical_days: windowDays
            };

            // Fetch all three types of forecasts in parallel
            const [alkansyaResponse, madeToOrderResponse, overallResponse] = await Promise.all([
                api.get('/inventory/forecast/alkansya-materials', { params }).catch(() => ({ data: null })),
                api.get('/inventory/forecast/made-to-order-materials', { params }).catch(() => ({ data: null })),
                api.get('/inventory/forecast/overall-materials', { params }).catch(() => ({ data: null }))
            ]);

            setAlkansyaForecast(alkansyaResponse.data);
            setMadeToOrderForecast(madeToOrderResponse.data);
            setOverallForecast(overallResponse.data);

        } catch (error) {
            console.error('Error fetching forecast data:', error);
            toast.error('Failed to load forecast data');
        } finally {
            setTabLoadingStates(prev => ({ ...prev, forecast: false }));
        }
    };

    // Enhanced replenishment data fetch function
    const fetchEnhancedReplenishmentData = async () => {
        setTabLoadingStates(prev => ({ ...prev, replenishment: true }));
        
        try {
            const params = {
                forecast_days: windowDays,
                historical_days: windowDays
            };

            const response = await api.get('/inventory/enhanced-replenishment', { params });
            setEnhancedReplenishment(response.data);

        } catch (error) {
            console.error('Error fetching enhanced replenishment data:', error);
            toast.error('Failed to load replenishment data');
        } finally {
            setTabLoadingStates(prev => ({ ...prev, replenishment: false }));
        }
    };

    // Enhanced transactions data fetch function
    const fetchEnhancedTransactionsData = async () => {
        setTabLoadingStates(prev => ({ ...prev, transactions: true }));
        
        try {
            const params = {
                start_date: new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                end_date: new Date().toISOString().split('T')[0],
                transaction_type: transactionFilter,
                limit: 200
            };

            const response = await api.get('/inventory/enhanced-transactions', { params });
            setEnhancedTransactions(response.data);

        } catch (error) {
            console.error('Error fetching enhanced transactions data:', error);
            toast.error('Failed to load transactions data');
        } finally {
            setTabLoadingStates(prev => ({ ...prev, transactions: false }));
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <h5>Loading Inventory Reports...</h5>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                <FaExclamationTriangle className="me-2" />
                <strong>Error:</strong> {error}
                <button 
                    className="btn btn-outline-danger btn-sm ms-3"
                    onClick={handleGlobalRefresh}
                >
                    <FaSync className="me-1" />
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="enhanced-inventory-reports">
            {/* Enhanced Navigation Tabs */}
            <div className="mb-4">
                <ul className="nav nav-pills nav-fill" role="tablist">
                    {[
                        { id: 'overview', name: 'Overview', icon: FaChartLine, color: colors.primary },
                        { id: 'stock', name: 'Stock Levels', icon: FaBox, color: colors.secondary },
                        { id: 'forecast', name: 'Forecasting', icon: FaChartLine, color: colors.info },
                        { id: 'replenishment', name: 'Replenishment', icon: FaTruck, color: colors.warning },
                        { id: 'transactions', name: 'Transactions', icon: FaHistory, color: colors.dark },
                        { id: 'alerts', name: 'Alerts', icon: FaExclamationTriangle, color: colors.danger }
                    ].map(tab => (
                        <li className="nav-item" key={tab.id}>
                            <button
                                className={`nav-link d-flex align-items-center justify-content-center ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => handleTabChange(tab.id)}
                                disabled={tabLoadingStates[tab.id]}
                                style={{
                                    border: 'none',
                                    backgroundColor: activeTab === tab.id ? tab.color : 'transparent',
                                    color: activeTab === tab.id ? 'white' : colors.dark,
                                    fontWeight: activeTab === tab.id ? '600' : '400',
                                    borderRadius: '8px',
                                    margin: '0 2px',
                                    padding: '12px 16px',
                                    transition: 'all 0.3s ease',
                                    opacity: tabLoadingStates[tab.id] ? 0.6 : 1
                                }}
                            >
                                <tab.icon className="me-2" />
                                {tab.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'overview' && (
                <div className="row">
                    {/* Key Metrics Cards */}
                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.primary}20` }}>
                                        <FaBox style={{ color: colors.primary }} className="fs-4" />
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.primary }}>
                                            {dashboardData?.summary?.total_items || 0}
                                        </h3>
                                        <small className="text-muted fw-medium">Total Items</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    {inventoryReport?.summary?.total_items || 0} items tracked
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.danger}15, ${colors.warning}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.danger}20` }}>
                                        <FaExclamationTriangle style={{ color: colors.danger }} className="fs-4" />
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.danger }}>
                                            {dashboardData?.summary?.low_stock_items || 0}
                                        </h3>
                                        <small className="text-muted fw-medium">Low Stock</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    {dashboardData?.summary?.critical_items || 0} critical items
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.success}15, ${colors.info}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.success}20` }}>
                                        <FaCheckCircle style={{ color: colors.success }} className="fs-4" />
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.success }}>
                                            {dashboardData?.summary?.total_items || 0}
                                        </h3>
                                        <small className="text-muted fw-medium">Total Materials</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    {dashboardData?.summary?.total_value ? `₱${Number(dashboardData.summary.total_value).toLocaleString()}` : '₱0'} total value
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-3 col-md-6 mb-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: `linear-gradient(135deg, ${colors.info}15, ${colors.accent}15)` }}>
                            <div className="card-body text-center p-4">
                                <div className="d-flex align-items-center justify-content-center mb-3">
                                    <div className="rounded-circle p-3 me-3" style={{ backgroundColor: `${colors.info}20` }}>
                                        <FaHistory style={{ color: colors.info }} className="fs-4" />
                                    </div>
                                    <div>
                                        <h3 className="mb-0 fw-bold" style={{ color: colors.info }}>
                                            {inventoryTransactions?.summary?.total_transactions || 0}
                                        </h3>
                                        <small className="text-muted fw-medium">Transactions</small>
                                    </div>
                                </div>
                                <p className="text-muted small mb-0">
                                    Last {windowDays} days
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Automated Reports Section - White Theme */}
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', background: 'white' }}>
                            <div className="card-body p-4">
                                <div className="row align-items-center">
                                    <div className="col-md-8">
                                        <div className="d-flex align-items-center mb-3">
                                            <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                                                <i className="fas fa-file-export text-primary" style={{ fontSize: '24px' }}></i>
                            </div>
                                            <div>
                                                <h5 className="mb-0 fw-bold">Automated Reports & Analytics</h5>
                                                <small className="text-muted">Download comprehensive inventory reports</small>
                                    </div>
                            </div>
                                        <p className="text-muted mb-3">Generate detailed reports for stock levels, material usage trends, and replenishment schedules</p>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <div className="btn-group" role="group">
                                                <button 
                                                    className="btn btn-outline-primary"
                                                    onClick={() => previewReport('stock')}
                                                    style={{ borderRadius: '8px 0 0 8px', transition: 'all 0.3s', borderWidth: '2px' }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#8B4513';
                                                        e.currentTarget.style.color = 'white';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.color = '#8B4513';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    <i className="fas fa-eye me-2"></i>
                                                    Preview
                                                </button>
                                                <button 
                                                    className="btn btn-primary"
                                                    onClick={() => downloadReport('stock')}
                                                    style={{ borderRadius: '0 8px 8px 0', transition: 'all 0.3s' }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#6B3410';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#8B4513';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    <i className="fas fa-download me-2"></i>
                                                    Download
                                                </button>
                                            </div>
                                            <div className="btn-group" role="group">
                                                <button 
                                                    className="btn btn-outline-info"
                                                    onClick={() => previewReport('usage')}
                                                    style={{ borderRadius: '8px 0 0 8px', transition: 'all 0.3s', borderWidth: '2px' }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#17a2b8';
                                                        e.currentTarget.style.color = 'white';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.color = '#17a2b8';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    <i className="fas fa-eye me-2"></i>
                                                    Preview
                                                </button>
                                                <button 
                                                    className="btn btn-info"
                                                    onClick={() => downloadReport('usage')}
                                                    style={{ borderRadius: '0 8px 8px 0', transition: 'all 0.3s' }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#138496';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#17a2b8';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    <i className="fas fa-download me-2"></i>
                                                    Download
                                                </button>
                                            </div>
                                            <div className="btn-group" role="group">
                                                <button 
                                                    className="btn btn-outline-warning"
                                                    onClick={() => previewReport('replenishment')}
                                                    style={{ borderRadius: '8px 0 0 8px', transition: 'all 0.3s', borderWidth: '2px' }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#ffc107';
                                                        e.currentTarget.style.color = 'white';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.color = '#ffc107';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    <i className="fas fa-eye me-2"></i>
                                                    Preview
                                                </button>
                                                <button 
                                                    className="btn btn-warning"
                                                    onClick={() => downloadReport('replenishment')}
                                                    style={{ borderRadius: '0 8px 8px 0', transition: 'all 0.3s' }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#e0a800';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#ffc107';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    <i className="fas fa-download me-2"></i>
                                                    Download
                                                </button>
                                            </div>
                                            <div className="btn-group" role="group">
                                                <button 
                                                    className="btn btn-outline-success"
                                                    onClick={() => previewReport('full')}
                                                    style={{ borderRadius: '8px 0 0 8px', transition: 'all 0.3s', borderWidth: '2px' }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#28a745';
                                                        e.currentTarget.style.color = 'white';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'transparent';
                                                        e.currentTarget.style.color = '#28a745';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    <i className="fas fa-eye me-2"></i>
                                                    Preview
                                                </button>
                                                <button 
                                                    className="btn btn-success"
                                                    onClick={() => downloadReport('full')}
                                                    style={{ borderRadius: '0 8px 8px 0', transition: 'all 0.3s' }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#1e7e34';
                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#28a745';
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                    }}
                                                >
                                                    <i className="fas fa-download me-2"></i>
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                        </div>
                                    <div className="col-md-4 text-center">
                                        <div className="position-relative">
                                            <div className="rounded-circle bg-primary bg-opacity-10 p-4 d-inline-block">
                                                <i className="fas fa-download fa-3x text-primary"></i>
                                    </div>
                                        </div>
                                    </div>
                                                    </div>
                                                </div>
                                            </div>
                    </div>

                    {/* Inventory Summary Details */}
                    <div className="col-12 mb-4">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <div className="card-header bg-white border-0">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaBox className="me-2" style={{ color: colors.primary }} />
                                    Inventory Report Summary
                                </h5>
                            </div>
                            <div className="card-body">
                                {/* Overview Stats Row */}
                                <div className="row mb-4">
                                    <div className="col-md-4">
                                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', transition: 'all 0.3s ease' }}
                                             onMouseEnter={(e) => {
                                                 e.currentTarget.style.transform = 'translateY(-4px)';
                                                 e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                             }}
                                             onMouseLeave={(e) => {
                                                 e.currentTarget.style.transform = 'translateY(0)';
                                                 e.currentTarget.style.boxShadow = '';
                                             }}>
                                                    <div className="card-body text-center">
                                                <div className="mb-3">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '60px', height: '60px', backgroundColor: '#e3f2fd' }}>
                                                        <i className="fas fa-box text-primary" style={{ fontSize: '28px' }}></i>
                                                    </div>
                                                </div>
                                                <h3 className="text-primary mb-1">{dashboardData?.summary?.alkansya_materials || 0}</h3>
                                                <h6 className="text-muted mb-2">Alkansya Materials</h6>
                                                <small className="text-muted">Materials for Alkansya production</small>
                                            </div>
                    </div>
                </div>
                                    <div className="col-md-4">
                                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', transition: 'all 0.3s ease' }}
                                             onMouseEnter={(e) => {
                                                 e.currentTarget.style.transform = 'translateY(-4px)';
                                                 e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                             }}
                                             onMouseLeave={(e) => {
                                                 e.currentTarget.style.transform = 'translateY(0)';
                                                 e.currentTarget.style.boxShadow = '';
                                             }}>
                                                    <div className="card-body text-center">
                                                <div className="mb-3">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '60px', height: '60px', backgroundColor: '#e1f5fe' }}>
                                                        <i className="fas fa-tools text-info" style={{ fontSize: '28px' }}></i>
                                                    </div>
                                                </div>
                                                <h3 className="text-info mb-1">{dashboardData?.summary?.made_to_order_materials || 0}</h3>
                                                <h6 className="text-muted mb-2">Made to Order Materials</h6>
                                                <small className="text-muted">Materials for made to order products</small>
                                            </div>
                                            </div>
                                        </div>
                                    <div className="col-md-4">
                                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', transition: 'all 0.3s ease' }}
                                             onMouseEnter={(e) => {
                                                 e.currentTarget.style.transform = 'translateY(-4px)';
                                                 e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                             }}
                                             onMouseLeave={(e) => {
                                                 e.currentTarget.style.transform = 'translateY(0)';
                                                 e.currentTarget.style.boxShadow = '';
                                             }}>
                                                    <div className="card-body text-center">
                                                <div className="mb-3">
                                                    <div className="rounded-circle d-flex align-items-center justify-content-center mx-auto" style={{ width: '60px', height: '60px', backgroundColor: '#fff3e0' }}>
                                                        <i className="fas fa-peso-sign text-warning" style={{ fontSize: '28px' }}></i>
                                            </div>
                                        </div>
                                                <h3 className="text-warning mb-1">₱{dashboardData?.summary?.total_value?.toLocaleString() || '0'}</h3>
                                                <h6 className="text-muted mb-2">Total Inventory Value</h6>
                                                <small className="text-muted">Total value of all materials</small>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                {/* Status Breakdown */}
                                <div className="row">
                                    <div className="col-md-6 mb-4">
                                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                            <div className="card-header bg-white border-0 pb-2">
                                                <h5 className="mb-0 d-flex align-items-center">
                                                    <i className="fas fa-box text-primary me-2" style={{ fontSize: '20px' }}></i>
                                                    Alkansya Materials Status
                                                </h5>
                                                    </div>
                                            <div className="card-body">
                                                <div className="row text-center">
                                                    <div className="col-6 mb-3">
                                                        <div className="p-3 rounded" style={{ backgroundColor: '#ffebee' }}>
                                                            <div className="mb-2">
                                                                <i className="fas fa-times-circle text-danger" style={{ fontSize: '32px' }}></i>
                                                </div>
                                                            <h3 className="text-danger mb-1">{dashboardData?.summary?.alkansya_out_of_stock || 0}</h3>
                                                            <small className="text-muted">Out of Stock</small>
                                            </div>
                                                    </div>
                                                    <div className="col-6 mb-3">
                                                        <div className="p-3 rounded" style={{ backgroundColor: '#fff3e0' }}>
                                                            <div className="mb-2">
                                                                <i className="fas fa-exclamation-circle text-warning" style={{ fontSize: '32px' }}></i>
                                                </div>
                                                            <h3 className="text-warning mb-1">{dashboardData?.summary?.alkansya_needs_reorder || 0}</h3>
                                                            <small className="text-muted">Need Reorder</small>
                                            </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <div className="p-3 rounded" style={{ backgroundColor: '#e8f5e9' }}>
                                                            <div className="mb-2">
                                                                <i className="fas fa-check-circle text-success" style={{ fontSize: '32px' }}></i>
                                                </div>
                                                            <h4 className="text-success mb-1">
                                                                {((dashboardData?.summary?.alkansya_materials || 0) - (dashboardData?.summary?.alkansya_out_of_stock || 0) - (dashboardData?.summary?.alkansya_needs_reorder || 0))}
                                                            </h4>
                                                            <small className="text-muted">Items in Good Condition</small>
                                            </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        </div>

                                    <div className="col-md-6 mb-4">
                                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                            <div className="card-header bg-white border-0 pb-2">
                                                <h5 className="mb-0 d-flex align-items-center">
                                                    <i className="fas fa-tools text-info me-2" style={{ fontSize: '20px' }}></i>
                                                    Made to Order Materials Status
                                                </h5>
                                                                                </div>
                                            <div className="card-body">
                                                <div className="row text-center">
                                                    <div className="col-6 mb-3">
                                                        <div className="p-3 rounded" style={{ backgroundColor: '#ffebee' }}>
                                                            <div className="mb-2">
                                                                <i className="fas fa-times-circle text-danger" style={{ fontSize: '32px' }}></i>
                                                                            </div>
                                                            <h3 className="text-danger mb-1">{dashboardData?.summary?.made_to_order_out_of_stock || 0}</h3>
                                                            <small className="text-muted">Out of Stock</small>
                                                                            </div>
                                                                        </div>
                                                    <div className="col-6 mb-3">
                                                        <div className="p-3 rounded" style={{ backgroundColor: '#fff3e0' }}>
                                                            <div className="mb-2">
                                                                <i className="fas fa-exclamation-circle text-warning" style={{ fontSize: '32px' }}></i>
                                                </div>
                                                            <h3 className="text-warning mb-1">{dashboardData?.summary?.made_to_order_needs_reorder || 0}</h3>
                                                            <small className="text-muted">Need Reorder</small>
                                            </div>
                                        </div>
                                                    <div className="col-12">
                                                        <div className="p-3 rounded" style={{ backgroundColor: '#e8f5e9' }}>
                                                            <div className="mb-2">
                                                                <i className="fas fa-check-circle text-success" style={{ fontSize: '32px' }}></i>
                                    </div>
                                                            <h4 className="text-success mb-1">
                                                                {((dashboardData?.summary?.made_to_order_materials || 0) - (dashboardData?.summary?.made_to_order_out_of_stock || 0) - (dashboardData?.summary?.made_to_order_needs_reorder || 0))}
                                                            </h4>
                                                            <small className="text-muted">Items in Good Condition</small>
                                    </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Status Tab - MRP Enabled */}
            {activeTab === 'stock' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <div className="card-header bg-white border-0" style={{ borderRadius: '12px' }}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaBox className="me-2" style={{ color: colors.secondary }} />
                                        Stock Status 
                                    {tabLoadingStates.stock && (
                                        <div className="spinner-border spinner-border-sm ms-2" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    )}
                                </h5>
                                </div>
                                
                                {/* Filter Buttons */}
                                        <div className="d-flex gap-2">
                                    <button 
                                        className={`btn ${stockFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setStockFilter('all')}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <i className="fas fa-list me-2"></i>
                                        All Materials
                                    </button>
                                    <button 
                                        className={`btn ${stockFilter === 'alkansya' ? 'btn-success' : 'btn-outline-success'}`}
                                        onClick={() => setStockFilter('alkansya')}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <i className="fas fa-box me-2"></i>
                                        Alkansya
                                    </button>
                                    <button 
                                        className={`btn ${stockFilter === 'made_to_order' ? 'btn-info' : 'btn-outline-info'}`}
                                        onClick={() => setStockFilter('made_to_order')}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <i className="fas fa-tools me-2"></i>
                                        Made to Order
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.stock ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-primary mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Stock Data...</h5>
                                        <p className="text-muted">Calculating MRP parameters and real-time stock levels</p>
                                    </div>
                                ) : filteredInventoryData?.items && filteredInventoryData.items.length > 0 ? (
                                    <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                    <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                            <thead className="table-light">
                                                <tr>
                                                    <th style={{ padding: '1rem', fontWeight: '600', color: '#495057' }}>Material Name</th>
                                                    <th style={{ padding: '1rem', fontWeight: '600', color: '#495057' }}>SKU</th>
                                                    <th className="text-end" style={{ padding: '1rem', fontWeight: '600', color: '#495057' }}>Available Qty</th>
                                                    <th className="text-end" style={{ padding: '1rem', fontWeight: '600', color: '#495057' }}>Safety Stock</th>
                                                    <th className="text-end" style={{ padding: '1rem', fontWeight: '600', color: '#495057' }}>Reorder Point</th>
                                                    <th className="text-end" style={{ padding: '1rem', fontWeight: '600', color: '#495057' }}>
                                                        Days Left
                                                        <i className="fas fa-question-circle ms-2 text-muted" 
                                                           style={{ fontSize: '14px' }}
                                                           title="Estimated days until stockout based on average daily consumption from Alkansya production and orders"></i>
                                                    </th>
                                                    <th className="text-end" style={{ padding: '1rem', fontWeight: '600', color: '#495057' }}>Avg Daily</th>
                                                    <th style={{ padding: '1rem', fontWeight: '600', color: '#495057' }}>Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredInventoryData.items
                                                    .filter(item => {
                                                        if (stockFilter === 'all') return true;
                                                        if (stockFilter === 'alkansya') return item.is_alkansya_material;
                                                        if (stockFilter === 'made_to_order') return item.is_made_to_order_material;
                                                        return true;
                                                    })
                                                    .map((item, index) => {
                                                    // Determine status label
                                                    let statusLabel = 'In Stock';
                                                    let statusColor = 'success';
                                                    if (item.available_quantity <= 0) {
                                                        statusLabel = 'No Stock';
                                                        statusColor = 'danger';
                                                    } else if (item.needs_reorder && item.available_quantity <= item.reorder_point) {
                                                        statusLabel = 'Need Reorder';
                                                        statusColor = 'warning';
                                                    } else if (item.available_quantity <= item.safety_stock) {
                                                        statusLabel = 'Low Stock';
                                                        statusColor = 'warning';
                                                    }
                                                    
                                                    return (
                                                    <tr 
                                                        key={index}
                                                        style={{ transition: 'all 0.2s ease' }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = '';
                                                        }}
                                                    >
                                                        <td style={{ padding: '1rem' }}>
                                                            <div className="d-flex align-items-center">
                                                                <div className="me-3">
                                                                        <div className={`rounded-circle d-flex align-items-center justify-content-center`}
                                                                         style={{ 
                                                                             width: '40px', 
                                                                             height: '40px', 
                                                                             backgroundColor: item.is_alkansya_material ? '#e8f5e9' : '#e1f5fe',
                                                                             color: item.is_alkansya_material ? '#4caf50' : '#03a9f4'
                                                                         }}>
                                                                        <FaBox />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h6 className="mb-0 fw-semibold">{item.name}</h6>
                                                                        <small className="text-muted">{item.location || 'Windfield 2'}</small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <code className="bg-light px-2 py-1 rounded">{item.sku}</code>
                                                        </td>
                                                        <td className="text-end" style={{ padding: '1rem' }}>
                                                            <span className={`fw-bold ${
                                                                    item.available_quantity <= 0 ? 'text-danger' :
                                                                    item.available_quantity <= item.reorder_point ? 'text-warning' :
                                                                    item.available_quantity <= item.safety_stock ? 'text-warning' :
                                                                'text-success'
                                                            }`}>
                                                                    {item.available_quantity || 0}
                                                            </span>
                                                            <br/>
                                                            <small className="text-muted">{item.unit}</small>
                                                        </td>
                                                        <td className="text-end" style={{ padding: '1rem' }}>
                                                                <span className="text-muted fw-medium">{item.safety_stock || 0}</span>
                                                            </td>
                                                        <td className="text-end" style={{ padding: '1rem' }}>
                                                                <span className="text-warning fw-medium">{item.reorder_point || 0}</span>
                                                            </td>
                                                        <td className="text-end" style={{ padding: '1rem' }}>
                                                                <span className={`badge ${
                                                                    item.days_until_stockout <= 7 ? 'bg-danger' :
                                                                    item.days_until_stockout <= 14 ? 'bg-warning' :
                                                                    'bg-success'
                                                            }`} style={{ borderRadius: '6px' }}>
                                                                {item.days_until_stockout >= 999 ? '∞' : item.days_until_stockout} days
                                                                </span>
                                                            </td>
                                                        <td className="text-end" style={{ padding: '1rem' }}>
                                                                <span className="text-info">
                                                                    {item.avg_daily_consumption?.toFixed(2) || '0.00'}
                                                                </span>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <span className={`badge ${
                                                                statusColor === 'danger' ? 'bg-danger' :
                                                                statusColor === 'warning' ? 'bg-warning' :
                                                                'bg-success'
                                                            }`} style={{ borderRadius: '6px' }}>
                                                                {statusLabel}
                                                                </span>
                                                        </td>
                                                    </tr>
                                                )})}
                                            </tbody>
                                        </table>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                        <div className="card-body text-center py-5">
                                        <FaBox className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">No materials found</h5>
                                        <p className="text-muted">Materials will appear here once they are added to the normalized inventory</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Forecasting Tab */}
            {activeTab === 'forecast' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <div className="card-header bg-white border-0" style={{ borderRadius: '12px' }}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="mb-0 d-flex align-items-center">
                                        <FaChartLine className="me-2" style={{ color: colors.info }} />
                                        Material Usage Forecasting
                                        {tabLoadingStates.forecast && (
                                            <div className="spinner-border spinner-border-sm ms-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        )}
                                    </h5>
                                    <div className="d-flex gap-2">
                                        <select 
                                            className="form-select form-select-sm" 
                                            value={windowDays}
                                            onChange={(e) => setWindowDays(parseInt(e.target.value))}
                                            style={{ width: '120px', borderRadius: '8px' }}
                                        >
                                            <option value={7}>7 Days</option>
                                            <option value={14}>14 Days</option>
                                            <option value={30}>30 Days</option>
                                            <option value={60}>60 Days</option>
                                            <option value={90}>90 Days</option>
                                        </select>
                                        <button 
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() => fetchForecastData()}
                                            style={{ borderRadius: '8px' }}
                                        >
                                            <FaSync className="me-1" />
                                            Refresh
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Filter Buttons */}
                                <div className="d-flex gap-2 mb-3">
                                    <button 
                                        className={`btn ${forecastFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}`}
                                        onClick={() => setForecastFilter('all')}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <i className="fas fa-list me-2"></i>
                                        All Materials
                                    </button>
                                    <button 
                                        className={`btn ${forecastFilter === 'alkansya' ? 'btn-success' : 'btn-outline-success'}`}
                                        onClick={() => setForecastFilter('alkansya')}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <i className="fas fa-box me-2"></i>
                                        Alkansya Materials
                                    </button>
                                    <button 
                                        className={`btn ${forecastFilter === 'made_to_order' ? 'btn-info' : 'btn-outline-info'}`}
                                        onClick={() => setForecastFilter('made_to_order')}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <i className="fas fa-tools me-2"></i>
                                        Made to Order Materials
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.forecast ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-info mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Enhanced Forecast Data...</h5>
                                        <p className="text-muted">Analyzing Alkansya output, made-to-order patterns, and overall material usage</p>
                                    </div>
                                ) : (
                                    <div>
                                        {/* Alkansya Materials Forecast */}
                                        {(forecastFilter === 'all' || forecastFilter === 'alkansya') && alkansyaForecast && (
                                            <div className="mb-5">
                                                <h6 className="mb-3 d-flex align-items-center text-success">
                                                    <i className="fas fa-box me-2"></i>
                                                    Alkansya Materials Forecast (Based on Daily Output)
                                                </h6>
                                                    <div>
                                                        <div className="row mb-4">
                                                            <div className="col-md-3">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Avg Daily Output</h6>
                                                                        <h4 className="text-primary">{alkansyaForecast.avg_daily_output}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Materials Analyzed</h6>
                                                                        <h4 className="text-info">{alkansyaForecast.summary.materials_analyzed}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Need Reorder</h6>
                                                                        <h4 className="text-warning">{alkansyaForecast.summary.materials_needing_reorder}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Avg Days to Stockout</h6>
                                                                        <h4 className="text-danger">{Math.round(alkansyaForecast.summary.avg_days_until_stockout)}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="row">
                                                            <div className="col-md-8">
                                                                <div className="card">
                                                                    <div className="card-header">
                                                                        <h6 className="mb-0">Daily Output & Material Usage Forecast</h6>
                                                                    </div>
                                                                    <div className="card-body">
                                                                        <ResponsiveContainer width="100%" height={300}>
                                                                            <LineChart data={alkansyaForecast.daily_forecast}>
                                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                                <XAxis dataKey="date" />
                                                                                <YAxis />
                                                                                <Tooltip />
                                                                                <Legend />
                                                                                <Line type="monotone" dataKey="predicted_output" stroke={colors.primary} strokeWidth={2} name="Predicted Output" />
                                                                                <Line type="monotone" dataKey="total_material_usage" stroke={colors.info} strokeWidth={2} name="Total Material Usage" />
                                                                            </LineChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="card">
                                                                    <div className="card-header">
                                                                        <h6 className="mb-0">Material Forecast Summary</h6>
                                                                    </div>
                                                                    <div className="card-body">
                                                                        <div className="table-responsive" style={{ maxHeight: '300px' }}>
                                                                            <table className="table table-sm">
                                                                                <thead>
                                                                                    <tr>
                                                                                        <th>Material</th>
                                                                                        <th>Days Left</th>
                                                                                        <th>Status</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {alkansyaForecast.material_forecasts.slice(0, 5).map((material, index) => (
                                                                                        <tr key={index}>
                                                                                            <td className="text-truncate" style={{ maxWidth: '100px' }} title={material.material_name}>
                                                                                                {material.material_name}
                                                                                            </td>
                                                                                            <td>
                                                                                                <span className={`badge ${material.days_until_stockout <= 7 ? 'bg-danger' : material.days_until_stockout <= 14 ? 'bg-warning' : 'bg-success'}`}>
                                                                                                    {material.days_until_stockout}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td>
                                                                                                <span className={`badge ${material.needs_reorder ? 'bg-warning' : 'bg-success'}`}>
                                                                                                    {material.needs_reorder ? 'Reorder' : 'OK'}
                                                                                                </span>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                            </div>
                                        )}

                                        {/* Made-to-Order Forecast */}
                                        {(forecastFilter === 'all' || forecastFilter === 'made_to_order') && madeToOrderForecast && (
                                            <div className="mb-5">
                                                <h6 className="mb-3 d-flex align-items-center text-info">
                                                    <i className="fas fa-tools me-2"></i>
                                                    Made-to-Order Materials Forecast (Based on Order History)
                                                </h6>
                                                {madeToOrderForecast && (
                                                    <div>
                                                        <div className="row mb-4">
                                                            <div className="col-md-3">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Products Analyzed</h6>
                                                                        <h4 className="text-primary">{madeToOrderForecast.summary.products_analyzed}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Materials Analyzed</h6>
                                                                        <h4 className="text-info">{madeToOrderForecast.summary.materials_analyzed}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Need Reorder</h6>
                                                                        <h4 className="text-warning">{madeToOrderForecast.summary.materials_needing_reorder}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light">
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted">Avg Days to Stockout</h6>
                                                                        <h4 className="text-danger">{Math.round(madeToOrderForecast.summary.avg_days_until_stockout)}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="row">
                                                            <div className="col-md-8">
                                                                <div className="card">
                                                                    <div className="card-header">
                                                                        <h6 className="mb-0">Product Order Statistics</h6>
                                                                    </div>
                                                                    <div className="card-body">
                                                                        <div className="table-responsive">
                                                                            <table className="table table-hover">
                                                                                <thead>
                                                                                    <tr>
                                                                                        <th>Product</th>
                                                                                        <th>Total Orders</th>
                                                                                        <th>Avg Order Qty</th>
                                                                                        <th>Avg Orders/Day</th>
                                                                                        <th>Avg Daily Qty</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {Object.values(madeToOrderForecast.product_stats).map((product, index) => (
                                                                                        <tr key={index}>
                                                                                            <td>{product.product_name}</td>
                                                                                            <td>{product.total_orders}</td>
                                                                                            <td>{product.avg_order_quantity}</td>
                                                                                            <td>{product.avg_orders_per_day}</td>
                                                                                            <td>{product.avg_daily_quantity}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                                <div className="card">
                                                                    <div className="card-header">
                                                                        <h6 className="mb-0">Material Forecast Summary</h6>
                                                                    </div>
                                                                    <div className="card-body">
                                                                        <div className="table-responsive" style={{ maxHeight: '300px' }}>
                                                                            <table className="table table-sm">
                                                                                <thead>
                                                                                    <tr>
                                                                                        <th>Product</th>
                                                                                        <th>Material</th>
                                                                                        <th>Days Left</th>
                                                                                        <th>Status</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {madeToOrderForecast.material_forecasts.slice(0, 5).map((material, index) => (
                                                                                        <tr key={index}>
                                                                                            <td className="text-truncate" style={{ maxWidth: '80px' }} title={material.product_name}>
                                                                                                {material.product_name}
                                                                                            </td>
                                                                                            <td className="text-truncate" style={{ maxWidth: '80px' }} title={material.material_name}>
                                                                                                {material.material_name}
                                                                                            </td>
                                                                                            <td>
                                                                                                <span className={`badge ${material.days_until_stockout <= 7 ? 'bg-danger' : material.days_until_stockout <= 14 ? 'bg-warning' : 'bg-success'}`}>
                                                                                                    {material.days_until_stockout}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td>
                                                                                                <span className={`badge ${material.needs_reorder ? 'bg-warning' : 'bg-success'}`}>
                                                                                                    {material.needs_reorder ? 'Reorder' : 'OK'}
                                                                                                </span>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Empty state when no forecast data is available */}
                                        {!alkansyaForecast && forecastFilter === 'alkansya' && (
                                                    <div className="text-center py-5">
                                                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                    <div className="card-body py-5">
                                                        <i className="fas fa-box fa-3x text-muted mb-3"></i>
                                                        <h5 className="text-muted">No Alkansya Forecast Data</h5>
                                                        <p className="text-muted">Alkansya production data is needed to generate material usage forecasts</p>
                                                    </div>
                                                </div>
                                                    </div>
                                                )}

                                        {!madeToOrderForecast && forecastFilter === 'made_to_order' && (
                                            <div className="text-center py-5">
                                                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                    <div className="card-body py-5">
                                                        <i className="fas fa-tools fa-3x text-muted mb-3"></i>
                                                        <h5 className="text-muted">No Made-to-Order Forecast Data</h5>
                                                        <p className="text-muted">Order data for made-to-order products is needed to generate material usage forecasts</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Overall Forecast Summary - Only shown when viewing all */}
                                        {forecastFilter === 'all' && overallForecast && (
                                            <div className="mt-4">
                                                <h6 className="mb-3 d-flex align-items-center text-primary">
                                                    <i className="fas fa-chart-bar me-2"></i>
                                                    Overall Forecast Summary
                                                </h6>
                                                        <div className="row mb-4">
                                                            <div className="col-md-2">
                                                        <div className="card bg-light border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                                    <div className="card-body text-center">
                                                                <h6 className="card-title text-muted mb-2">Total Materials</h6>
                                                                <h4 className="text-primary mb-0">{overallForecast.summary.total_materials}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-2">
                                                        <div className="card bg-light border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                                    <div className="card-body text-center">
                                                                <h6 className="card-title text-muted mb-2">Need Reorder</h6>
                                                                <h4 className="text-warning mb-0">{overallForecast.summary.materials_needing_reorder}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-2">
                                                        <div className="card bg-light border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                                    <div className="card-body text-center">
                                                                <h6 className="card-title text-muted mb-2">Critical (≤7 days)</h6>
                                                                <h4 className="text-danger mb-0">{overallForecast.summary.critical_materials}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-2">
                                                        <div className="card bg-light border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                                    <div className="card-body text-center">
                                                                <h6 className="card-title text-muted mb-2">High Usage</h6>
                                                                <h4 className="text-info mb-0">{overallForecast.summary.high_usage_materials}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-2">
                                                        <div className="card bg-light border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                                    <div className="card-body text-center">
                                                                <h6 className="card-title text-muted mb-2">Total Value</h6>
                                                                <h6 className="text-success mb-0">₱{overallForecast.summary.total_inventory_value.toLocaleString()}</h6>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-2">
                                                        <div className="card bg-light border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                                    <div className="card-body text-center">
                                                                <h6 className="card-title text-muted mb-2">Avg Days Left</h6>
                                                                <h4 className="text-secondary mb-0">{Math.round(overallForecast.summary.avg_days_until_stockout)}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                {/* Overall forecast chart and critical materials */}
                                                        <div className="row">
                                                            <div className="col-md-8">
                                                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                            <div className="card-header bg-white border-0">
                                                                <h6 className="mb-0">Daily Usage Forecast (Combined)</h6>
                                                                    </div>
                                                                    <div className="card-body">
                                                                        <ResponsiveContainer width="100%" height={300}>
                                                                            <LineChart data={overallForecast.daily_forecast}>
                                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                                <XAxis dataKey="date" />
                                                                                <YAxis />
                                                                                <Tooltip />
                                                                                <Legend />
                                                                                <Line type="monotone" dataKey="predicted_total_usage" stroke={colors.primary} strokeWidth={2} name="Predicted Total Usage" />
                                                                        <Line type="monotone" dataKey="critical_materials_count" stroke={colors.danger} strokeWidth={2} name="Critical Materials" />
                                                                            </LineChart>
                                                                        </ResponsiveContainer>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-4">
                                                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                            <div className="card-header bg-white border-0">
                                                                <h6 className="mb-0">Critical Materials (≤14 days)</h6>
                                                                    </div>
                                                                    <div className="card-body">
                                                                        <div className="table-responsive" style={{ maxHeight: '300px' }}>
                                                                    <table className="table table-sm table-hover">
                                                                                <thead>
                                                                                    <tr>
                                                                                        <th>Material</th>
                                                                                        <th>Days Left</th>
                                                                                        <th>Usage</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {overallForecast.material_forecasts
                                                                                        .filter(m => m.days_until_stockout <= 14)
                                                                                        .slice(0, 5)
                                                                                        .map((material, index) => (
                                                                                        <tr key={index}>
                                                                                            <td className="text-truncate" style={{ maxWidth: '120px' }} title={material.material_name}>
                                                                                                {material.material_name}
                                                                                            </td>
                                                                                            <td>
                                                                                        <span className={`badge ${material.days_until_stockout <= 7 ? 'bg-danger' : 'bg-warning'}`} style={{ borderRadius: '8px' }}>
                                                                                                    {material.days_until_stockout}
                                                                                                </span>
                                                                                            </td>
                                                                                            <td>
                                                                                        <span className={`badge ${material.usage_category === 'high' ? 'bg-danger' : material.usage_category === 'medium' ? 'bg-warning' : 'bg-success'}`} style={{ borderRadius: '8px' }}>
                                                                                                    {material.usage_category}
                                                                                                </span>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Enhanced Replenishment Tab */}
            {activeTab === 'replenishment' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <div className="card-header bg-white border-0" style={{ borderRadius: '12px' }}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="mb-0 d-flex align-items-center">
                                        <FaTruck className="me-2" style={{ color: colors.warning }} />
                                        Inventory Replenishment Needs & Schedule
                                        {tabLoadingStates.replenishment && (
                                            <div className="spinner-border spinner-border-sm ms-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        )}
                                    </h5>
                                    <div className="d-flex gap-2">
                                        <select 
                                            className="form-select form-select-sm" 
                                            value={windowDays}
                                            onChange={(e) => setWindowDays(parseInt(e.target.value))}
                                            style={{ width: '120px', borderRadius: '8px' }}
                                        >
                                            <option value={7}>7 Days</option>
                                            <option value={14}>14 Days</option>
                                            <option value={30}>30 Days</option>
                                            <option value={60}>60 Days</option>
                                            <option value={90}>90 Days</option>
                                        </select>
                                        <button 
                                            className="btn btn-outline-warning btn-sm"
                                            onClick={() => fetchEnhancedReplenishmentData()}
                                            style={{ borderRadius: '8px' }}
                                        >
                                            <FaSync className="me-1" />
                                            Refresh
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Filter Buttons */}
                                <div className="d-flex gap-2 mb-3">
                                    <button 
                                        className={`btn ${replenishmentFilter === 'all' ? 'btn-warning' : 'btn-outline-warning'}`}
                                        onClick={() => setReplenishmentFilter('all')}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <i className="fas fa-list me-2"></i>
                                        All Materials
                                    </button>
                                    <button 
                                        className={`btn ${replenishmentFilter === 'alkansya' ? 'btn-success' : 'btn-outline-success'}`}
                                        onClick={() => setReplenishmentFilter('alkansya')}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <i className="fas fa-box me-2"></i>
                                        Alkansya Materials
                                    </button>
                                    <button 
                                        className={`btn ${replenishmentFilter === 'made_to_order' ? 'btn-info' : 'btn-outline-info'}`}
                                        onClick={() => setReplenishmentFilter('made_to_order')}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <i className="fas fa-tools me-2"></i>
                                        Made to Order Materials
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.replenishment ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-warning mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Enhanced Replenishment Data...</h5>
                                        <p className="text-muted">Analyzing Alkansya output, made-to-order patterns, and material consumption</p>
                                    </div>
                                ) : enhancedReplenishment ? (
                                    enhancedReplenishment.error ? (
                                        <div className="text-center py-5">
                                            <FaTruck className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                            <h5 className="text-muted">No Consumption Data Available</h5>
                                            <p className="text-muted mb-4">{enhancedReplenishment.message}</p>
                                            <div className="card bg-light">
                                                <div className="card-body">
                                                    <h6 className="card-title">Setup Instructions:</h6>
                                                    <ol className="text-start">
                                                        {enhancedReplenishment.instructions?.map((instruction, index) => (
                                                            <li key={index} className="mb-2">
                                                                <code className="bg-dark text-light px-2 py-1 rounded">
                                                                    {instruction}
                                                                </code>
                                                            </li>
                                                        ))}
                                                    </ol>
                                                    <div className="mt-3">
                                                        <button 
                                                            className="btn btn-primary"
                                                            onClick={() => fetchEnhancedReplenishmentData()}
                                                        >
                                                            <FaSync className="me-1" />
                                                            Check Again
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                        {/* Alkansya Replenishment Section */}
                                        {(replenishmentFilter === 'all' || replenishmentFilter === 'alkansya') && enhancedReplenishment?.alkansya_replenishment && (
                                            <div className="mb-5">
                                                <h6 className="mb-3 d-flex align-items-center text-success">
                                                    <i className="fas fa-box me-2"></i>
                                                    Alkansya Materials Replenishment (Based on Daily Output)
                                                </h6>
                                                <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
                                                    <div className="card-body">
                                                        <div className="row mb-3">
                                                            <div className="col-md-3">
                                                                <div className="card bg-light border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted mb-2">Materials Need Reorder</h6>
                                                                        <h4 className="text-danger mb-0">{enhancedReplenishment.alkansya_replenishment.materials_needing_reorder || 0}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted mb-2">Critical Materials</h6>
                                                                        <h4 className="text-warning mb-0">{enhancedReplenishment.alkansya_replenishment.critical_materials || 0}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted mb-2">Reorder Value</h6>
                                                                        <h6 className="text-success mb-0">₱{(enhancedReplenishment.alkansya_replenishment.total_reorder_value || 0).toLocaleString()}</h6>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted mb-2">Avg Lead Time</h6>
                                                                        <h4 className="text-info mb-0">{Math.round(enhancedReplenishment.alkansya_replenishment.avg_lead_time || 0)} days</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {enhancedReplenishment.alkansya_replenishment.schedule && enhancedReplenishment.alkansya_replenishment.schedule.length > 0 && (
                                                            <div className="table-responsive">
                                                                <table className="table table-hover">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Material</th>
                                                                            <th>Current Stock</th>
                                                                            <th>Reorder Point</th>
                                                                            <th>Recommended Qty</th>
                                                                            <th>Priority</th>
                                                                            <th>Status</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {enhancedReplenishment.alkansya_replenishment.schedule.map((item, index) => (
                                                                            <tr key={index}>
                                                                                <td>{item.material_name}</td>
                                                                                <td>{item.current_stock}</td>
                                                                                <td>{item.reorder_point}</td>
                                                                                <td className="text-success fw-bold">{item.recommended_quantity}</td>
                                                                                <td>
                                                                                    <span className={`badge ${item.priority === 'critical' ? 'bg-danger' : item.priority === 'high' ? 'bg-warning' : 'bg-info'}`} style={{ borderRadius: '8px' }}>
                                                                                        {item.priority}
                                                                                    </span>
                                                                                </td>
                                                                                <td>
                                                                                    <span className={`badge ${item.needs_reorder ? 'bg-warning' : 'bg-success'}`} style={{ borderRadius: '8px' }}>
                                                                                        {item.needs_reorder ? 'Need Reorder' : 'OK'}
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Made to Order Replenishment Section */}
                                        {(replenishmentFilter === 'all' || replenishmentFilter === 'made_to_order') && enhancedReplenishment?.made_to_order_replenishment && (
                                            <div className="mb-5">
                                                <h6 className="mb-3 d-flex align-items-center text-info">
                                                    <i className="fas fa-tools me-2"></i>
                                                    Made to Order Materials Replenishment (Based on Accepted Orders)
                                                </h6>
                                                <div className="card border-0 shadow-sm mb-3" style={{ borderRadius: '12px' }}>
                                                    <div className="card-body">
                                                        <div className="row mb-3">
                                                            <div className="col-md-3">
                                                                <div className="card bg-light border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted mb-2">Materials Need Reorder</h6>
                                                                        <h4 className="text-danger mb-0">{enhancedReplenishment.made_to_order_replenishment.materials_needing_reorder || 0}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted mb-2">Critical Materials</h6>
                                                                        <h4 className="text-warning mb-0">{enhancedReplenishment.made_to_order_replenishment.critical_materials || 0}</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted mb-2">Reorder Value</h6>
                                                                        <h6 className="text-success mb-0">₱{(enhancedReplenishment.made_to_order_replenishment.total_reorder_value || 0).toLocaleString()}</h6>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="col-md-3">
                                                                <div className="card bg-light border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                                    <div className="card-body text-center">
                                                                        <h6 className="card-title text-muted mb-2">Avg Lead Time</h6>
                                                                        <h4 className="text-info mb-0">{Math.round(enhancedReplenishment.made_to_order_replenishment.avg_lead_time || 0)} days</h4>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {enhancedReplenishment.made_to_order_replenishment.schedule && enhancedReplenishment.made_to_order_replenishment.schedule.length > 0 && (
                                                            <div className="table-responsive">
                                                                <table className="table table-hover">
                                                                    <thead>
                                                                        <tr>
                                                                            <th>Material</th>
                                                                            <th>Current Stock</th>
                                                                            <th>Reorder Point</th>
                                                                            <th>Recommended Qty</th>
                                                                            <th>Priority</th>
                                                                            <th>Status</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {enhancedReplenishment.made_to_order_replenishment.schedule.map((item, index) => (
                                                                            <tr key={index}>
                                                                                <td>{item.material_name}</td>
                                                                                <td>{item.current_stock}</td>
                                                                                <td>{item.reorder_point}</td>
                                                                                <td className="text-success fw-bold">{item.recommended_quantity}</td>
                                                                                <td>
                                                                                    <span className={`badge ${item.priority === 'critical' ? 'bg-danger' : item.priority === 'high' ? 'bg-warning' : 'bg-info'}`} style={{ borderRadius: '8px' }}>
                                                                                        {item.priority}
                                                                                    </span>
                                                                                </td>
                                                                                <td>
                                                                                    <span className={`badge ${item.needs_reorder ? 'bg-warning' : 'bg-success'}`} style={{ borderRadius: '8px' }}>
                                                                                        {item.needs_reorder ? 'Need Reorder' : 'OK'}
                                                                                    </span>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Empty State Messages */}
                                        {!enhancedReplenishment?.alkansya_replenishment && replenishmentFilter === 'alkansya' && (
                                            <div className="text-center py-5 mb-4">
                                                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                    <div className="card-body py-5">
                                                        <i className="fas fa-box fa-3x text-muted mb-3"></i>
                                                        <h5 className="text-muted">No Alkansya Replenishment Data</h5>
                                                        <p className="text-muted">Alkansya production data is needed to generate replenishment schedules based on daily output</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {!enhancedReplenishment?.made_to_order_replenishment && replenishmentFilter === 'made_to_order' && (
                                            <div className="text-center py-5 mb-4">
                                                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                    <div className="card-body py-5">
                                                        <i className="fas fa-tools fa-3x text-muted mb-3"></i>
                                                        <h5 className="text-muted">No Made-to-Order Replenishment Data</h5>
                                                        <p className="text-muted">Accepted order data is needed to generate replenishment schedules for made-to-order materials</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {!enhancedReplenishment?.alkansya_replenishment && !enhancedReplenishment?.made_to_order_replenishment && replenishmentFilter === 'all' && (
                                            <div className="text-center py-5 mb-4">
                                                <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                                    <div className="card-body py-5">
                                                        <i className="fas fa-truck fa-3x text-muted mb-3"></i>
                                                        <h5 className="text-muted">No Replenishment Data Available</h5>
                                                        <p className="text-muted">Replenishment data will appear here once production and order data is available</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* View Tabs */}
                                        <ul className="nav nav-tabs mb-4" id="replenishmentTabs" role="tablist">
                                            <li className="nav-item" role="presentation">
                                                <button 
                                                    className={`nav-link ${replenishmentView === 'summary' ? 'active' : ''}`}
                                                    onClick={() => setReplenishmentView('summary')}
                                                >
                                                    Summary Dashboard
                                                </button>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <button 
                                                    className={`nav-link ${replenishmentView === 'schedule' ? 'active' : ''}`}
                                                    onClick={() => setReplenishmentView('schedule')}
                                                >
                                                    Replenishment Schedule
                                                </button>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <button 
                                                    className={`nav-link ${replenishmentView === 'analytics' ? 'active' : ''}`}
                                                    onClick={() => setReplenishmentView('analytics')}
                                                >
                                                    Consumption Analytics
                                                </button>
                                            </li>
                                        </ul>

                                        {/* Summary Dashboard */}
                                        {replenishmentView === 'summary' && (
                                            <div>
                                                <div className="row mb-4">
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">Total Materials</h6>
                                                                <h4 className="text-primary">{enhancedReplenishment.summary.total_materials}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">Critical</h6>
                                                                <h4 className="text-danger">{enhancedReplenishment.summary.critical_materials}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">High Priority</h6>
                                                                <h4 className="text-warning">{enhancedReplenishment.summary.high_priority_materials}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">Need Reorder</h6>
                                                                <h4 className="text-info">{enhancedReplenishment.summary.materials_needing_reorder}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">Reorder Value</h6>
                                                                <h4 className="text-success">₱{enhancedReplenishment.summary.total_reorder_value.toLocaleString()}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="card-title text-muted">Avg Lead Time</h6>
                                                                <h4 className="text-secondary">{Math.round(enhancedReplenishment.summary.avg_lead_time)} days</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="card">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Material Source Breakdown</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="row text-center">
                                                                    <div className="col-4">
                                                                        <h5 className="text-primary">{enhancedReplenishment.summary.alkansya_materials}</h5>
                                                                        <small className="text-muted">Alkansya Materials</small>
                                                                    </div>
                                                                    <div className="col-4">
                                                                        <h5 className="text-info">{enhancedReplenishment.summary.made_to_order_materials}</h5>
                                                                        <small className="text-muted">Made-to-Order</small>
                                                                    </div>
                                                                    <div className="col-4">
                                                                        <h5 className="text-success">{enhancedReplenishment.alkansya_daily_output}</h5>
                                                                        <small className="text-muted">Avg Daily Output</small>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="card">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Urgency Distribution</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span>Critical</span>
                                                                    <span className="badge bg-danger">{enhancedReplenishment.summary.critical_materials}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span>High Priority</span>
                                                                    <span className="badge bg-warning">{enhancedReplenishment.summary.high_priority_materials}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between mb-2">
                                                                    <span>Medium Priority</span>
                                                                    <span className="badge bg-info">{enhancedReplenishment.summary.medium_priority_materials}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Replenishment Schedule */}
                                        {replenishmentView === 'schedule' && (
                                            <div>
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <div className="card">
                                                            <div className="card-header bg-danger text-white">
                                                                <h6 className="mb-0">Immediate Action Required</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                                                                    <table className="table table-sm">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Material</th>
                                                                                <th>Days Left</th>
                                                                                <th>Order Qty</th>
                                                                                <th>Reorder Date</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {enhancedReplenishment.schedule.immediate.map((item, index) => (
                                                                                <tr key={index}>
                                                                                    <td className="text-truncate" style={{ maxWidth: '150px' }} title={item.material_name}>
                                                                                        {item.material_name}
                                                                                    </td>
                                                                                    <td>
                                                                                        <span className="badge bg-danger">{item.days_until_stockout}</span>
                                                                                    </td>
                                                                                    <td>{item.suggested_order_qty}</td>
                                                                                    <td>{item.reorder_date}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="card">
                                                            <div className="card-header bg-warning text-white">
                                                                <h6 className="mb-0">This Week</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                                                                    <table className="table table-sm">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Material</th>
                                                                                <th>Days Left</th>
                                                                                <th>Order Qty</th>
                                                                                <th>Reorder Date</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {enhancedReplenishment.schedule.this_week.map((item, index) => (
                                                                                <tr key={index}>
                                                                                    <td className="text-truncate" style={{ maxWidth: '150px' }} title={item.material_name}>
                                                                                        {item.material_name}
                                                                                    </td>
                                                                                    <td>
                                                                                        <span className="badge bg-warning">{item.days_until_stockout}</span>
                                                                                    </td>
                                                                                    <td>{item.suggested_order_qty}</td>
                                                                                    <td>{item.reorder_date}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="row mt-3">
                                                    <div className="col-md-6">
                                                        <div className="card">
                                                            <div className="card-header bg-info text-white">
                                                                <h6 className="mb-0">Next Week</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                                                                    <table className="table table-sm">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Material</th>
                                                                                <th>Days Left</th>
                                                                                <th>Order Qty</th>
                                                                                <th>Reorder Date</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {enhancedReplenishment.schedule.next_week.map((item, index) => (
                                                                                <tr key={index}>
                                                                                    <td className="text-truncate" style={{ maxWidth: '150px' }} title={item.material_name}>
                                                                                        {item.material_name}
                                                                                    </td>
                                                                                    <td>
                                                                                        <span className="badge bg-info">{item.days_until_stockout}</span>
                                                                                    </td>
                                                                                    <td>{item.suggested_order_qty}</td>
                                                                                    <td>{item.reorder_date}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="card">
                                                            <div className="card-header bg-success text-white">
                                                                <h6 className="mb-0">Future Planning</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                                                                    <table className="table table-sm">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Material</th>
                                                                                <th>Days Left</th>
                                                                                <th>Order Qty</th>
                                                                                <th>Reorder Date</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {enhancedReplenishment.schedule.future.map((item, index) => (
                                                                                <tr key={index}>
                                                                                    <td className="text-truncate" style={{ maxWidth: '150px' }} title={item.material_name}>
                                                                                        {item.material_name}
                                                                                    </td>
                                                                                    <td>
                                                                                        <span className="badge bg-success">{item.days_until_stockout}</span>
                                                                                    </td>
                                                                                    <td>{item.suggested_order_qty}</td>
                                                                                    <td>{item.reorder_date}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Consumption Analytics */}
                                        {replenishmentView === 'analytics' && (
                                            <div>
                                                <div className="row">
                                                    <div className="col-md-8">
                                                        <div className="card">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Material Consumption Breakdown</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="table-responsive">
                                                                    <table className="table table-hover">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Material</th>
                                                                                <th>Historical</th>
                                                                                <th>Alkansya</th>
                                                                                <th>Made-to-Order</th>
                                                                                <th>Predicted</th>
                                                                                <th>Days Left</th>
                                                                                <th>Source</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {enhancedReplenishment.replenishment_items.slice(0, 20).map((item, index) => (
                                                                                <tr key={index}>
                                                                                    <td className="text-truncate" style={{ maxWidth: '150px' }} title={item.material_name}>
                                                                                        {item.material_name}
                                                                                    </td>
                                                                                    <td>{item.consumption_breakdown.historical}</td>
                                                                                    <td>{item.consumption_breakdown.alkansya}</td>
                                                                                    <td>{item.consumption_breakdown.made_to_order}</td>
                                                                                    <td className="fw-bold">{item.consumption_breakdown.predicted}</td>
                                                                                    <td>
                                                                                        <span className={`badge ${
                                                                                            item.days_until_stockout <= 7 ? 'bg-danger' : 
                                                                                            item.days_until_stockout <= 14 ? 'bg-warning' : 
                                                                                            'bg-success'
                                                                                        }`}>
                                                                                            {item.days_until_stockout}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td>
                                                                                        <div className="d-flex gap-1">
                                                                                            {item.is_alkansya_material && (
                                                                                                <span className="badge bg-primary">A</span>
                                                                                            )}
                                                                                            {item.is_made_to_order_material && (
                                                                                                <span className="badge bg-info">M</span>
                                                                                            )}
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="card">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Consumption Sources</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="mb-3">
                                                                    <div className="d-flex justify-content-between">
                                                                        <span>Alkansya Materials</span>
                                                                        <span className="badge bg-primary">{enhancedReplenishment.summary.alkansya_materials}</span>
                                                                    </div>
                                                                    <div className="progress mt-1" style={{ height: '8px' }}>
                                                                        <div 
                                                                            className="progress-bar bg-primary" 
                                                                            style={{ 
                                                                                width: `${(enhancedReplenishment.summary.alkansya_materials / enhancedReplenishment.summary.total_materials) * 100}%` 
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                                <div className="mb-3">
                                                                    <div className="d-flex justify-content-between">
                                                                        <span>Made-to-Order</span>
                                                                        <span className="badge bg-info">{enhancedReplenishment.summary.made_to_order_materials}</span>
                                                                    </div>
                                                                    <div className="progress mt-1" style={{ height: '8px' }}>
                                                                        <div 
                                                                            className="progress-bar bg-info" 
                                                                            style={{ 
                                                                                width: `${(enhancedReplenishment.summary.made_to_order_materials / enhancedReplenishment.summary.total_materials) * 100}%` 
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                                <div className="mb-3">
                                                                    <div className="d-flex justify-content-between">
                                                                        <span>Other Materials</span>
                                                                        <span className="badge bg-secondary">
                                                                            {enhancedReplenishment.summary.total_materials - enhancedReplenishment.summary.alkansya_materials - enhancedReplenishment.summary.made_to_order_materials}
                                                                        </span>
                                                                    </div>
                                                                    <div className="progress mt-1" style={{ height: '8px' }}>
                                                                        <div 
                                                                            className="progress-bar bg-secondary" 
                                                                            style={{ 
                                                                                width: `${((enhancedReplenishment.summary.total_materials - enhancedReplenishment.summary.alkansya_materials - enhancedReplenishment.summary.made_to_order_materials) / enhancedReplenishment.summary.total_materials) * 100}%` 
                                                                            }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center py-5">
                                        <FaTruck className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">No replenishment data available</h5>
                                        <p className="text-muted">Enhanced replenishment data will appear here once material usage patterns are established</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* Enhanced Transactions Tab */}
            {activeTab === 'transactions' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <div className="card-header bg-white border-0" style={{ borderRadius: '12px' }}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="mb-0 d-flex align-items-center">
                                        <FaHistory className="me-2" style={{ color: colors.dark }} />
                                        Inventory Transactions & Activity Log
                                        {tabLoadingStates.transactions && (
                                            <div className="spinner-border spinner-border-sm ms-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        )}
                                    </h5>
                                    <div className="d-flex gap-2">
                                        <select 
                                            className="form-select form-select-sm" 
                                            value={windowDays}
                                            onChange={(e) => setWindowDays(parseInt(e.target.value))}
                                            style={{ width: '120px', borderRadius: '8px' }}
                                        >
                                            <option value={7}>7 Days</option>
                                            <option value={14}>14 Days</option>
                                            <option value={30}>30 Days</option>
                                            <option value={60}>60 Days</option>
                                            <option value={90}>90 Days</option>
                                        </select>
                                        <button 
                                            className="btn btn-outline-dark btn-sm"
                                            onClick={() => fetchEnhancedTransactionsData()}
                                            style={{ borderRadius: '8px' }}
                                        >
                                            <FaSync className="me-1" />
                                            Refresh
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Filter Buttons */}
                                <div className="d-flex gap-2 mb-3">
                                    <button 
                                        className={`btn ${transactionFilter === 'all' ? 'btn-dark' : 'btn-outline-dark'}`}
                                        onClick={() => setTransactionFilter('all')}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <i className="fas fa-list me-2"></i>
                                        All Transactions
                                    </button>
                                    <button 
                                        className={`btn ${transactionFilter === 'alkansya' ? 'btn-success' : 'btn-outline-success'}`}
                                        onClick={() => setTransactionFilter('alkansya')}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <i className="fas fa-box me-2"></i>
                                        Alkansya
                                    </button>
                                    <button 
                                        className={`btn ${transactionFilter === 'made_to_order' ? 'btn-info' : 'btn-outline-info'}`}
                                        onClick={() => setTransactionFilter('made_to_order')}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <i className="fas fa-tools me-2"></i>
                                        Made to Order
                                    </button>
                                    <button 
                                        className={`btn ${transactionFilter === 'other' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                                        onClick={() => setTransactionFilter('other')}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <i className="fas fa-ellipsis-h me-2"></i>
                                        Other
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.transactions ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-dark mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Enhanced Transactions...</h5>
                                        <p className="text-muted">Fetching normalized inventory transactions with filtering</p>
                                    </div>
                                ) : enhancedTransactions ? (
                                    enhancedTransactions.error ? (
                                        <div className="text-center py-5">
                                            <FaHistory className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                            <h5 className="text-muted">No Transaction Data Available</h5>
                                            <p className="text-muted mb-4">{enhancedTransactions.message}</p>
                                            <div className="card bg-light">
                                                <div className="card-body">
                                                    <h6 className="card-title">Setup Instructions:</h6>
                                                    <ol className="text-start">
                                                        {enhancedTransactions.instructions?.map((instruction, index) => (
                                                            <li key={index} className="mb-2">
                                                                <code className="bg-dark text-light px-2 py-1 rounded">
                                                                    {instruction}
                                                                </code>
                                                            </li>
                                                        ))}
                                                    </ol>
                                                    <div className="mt-3">
                                                        <button 
                                                            className="btn btn-primary"
                                                            onClick={() => fetchEnhancedTransactionsData()}
                                                        >
                                                            <FaSync className="me-1" />
                                                            Check Again
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                        {/* View Tabs */}
                                        <ul className="nav nav-tabs mb-4" id="transactionTabs" role="tablist">
                                            <li className="nav-item" role="presentation">
                                                <button 
                                                    className={`nav-link ${transactionView === 'list' ? 'active' : ''}`}
                                                    onClick={() => setTransactionView('list')}
                                                >
                                                    Transaction List
                                                </button>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <button 
                                                    className={`nav-link ${transactionView === 'summary' ? 'active' : ''}`}
                                                    onClick={() => setTransactionView('summary')}
                                                >
                                                    Summary Dashboard
                                                </button>
                                            </li>
                                            <li className="nav-item" role="presentation">
                                                <button 
                                                    className={`nav-link ${transactionView === 'analytics' ? 'active' : ''}`}
                                                    onClick={() => setTransactionView('analytics')}
                                                >
                                                    Analytics
                                                </button>
                                            </li>
                                        </ul>

                                        {/* Transaction List */}
                                        {transactionView === 'list' && (
                                            <div>
                                                <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                                                    <div className="card-header bg-white border-bottom">
                                                        <h6 className="mb-0">
                                                            <i className="fas fa-history me-2"></i>
                                                            All Inventory Transactions
                                                        </h6>
                                                    </div>
                                                    <div className="card-body p-0">
                                                <div className="table-responsive">
                                                            <table className="table table-hover mb-0">
                                                                <thead className="table-light">
                                                                    <tr>
                                                                        <th style={{ padding: '1rem' }}>Date & Time</th>
                                                                        <th style={{ padding: '1rem' }}>Type</th>
                                                                        <th style={{ padding: '1rem' }}>Category</th>
                                                                        <th style={{ padding: '1rem' }}>Material</th>
                                                                        <th style={{ padding: '1rem' }}>Product</th>
                                                                        <th style={{ padding: '1rem' }}>Quantity</th>
                                                                        <th style={{ padding: '1rem' }}>Unit Cost</th>
                                                                        <th style={{ padding: '1rem' }}>Total Cost</th>
                                                                        <th style={{ padding: '1rem' }}>Reference</th>
                                                                        <th style={{ padding: '1rem' }}>Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {enhancedTransactions.transactions.map((transaction) => (
                                                                        <tr key={transaction.id} style={{ cursor: 'pointer' }}>
                                                                            <td style={{ padding: '1rem' }}>
                                                                        <div>
                                                                            <strong>{transaction.date}</strong>
                                                                            <br />
                                                                            <small className="text-muted">{transaction.time}</small>
                                                                        </div>
                                                                    </td>
                                                                            <td style={{ padding: '1rem' }}>
                                                                        <span className={`badge ${
                                                                            transaction.direction === 'in' ? 'bg-success' : 'bg-danger'
                                                                                }`} style={{ borderRadius: '8px' }}>
                                                                            {transaction.direction_label}
                                                                        </span>
                                                                    </td>
                                                                            <td style={{ padding: '1rem' }}>
                                                                        <span className={`badge ${
                                                                                    transaction.category === 'alkansya' ? 'bg-success' :
                                                                            transaction.category === 'made_to_order' ? 'bg-info' :
                                                                            'bg-secondary'
                                                                                }`} style={{ borderRadius: '8px' }}>
                                                                            {transaction.category === 'alkansya' ? 'Alkansya' :
                                                                             transaction.category === 'made_to_order' ? 'Made-to-Order' : 'Other'}
                                                                        </span>
                                                                    </td>
                                                                            <td style={{ padding: '1rem' }}>
                                                                        <div>
                                                                                    <strong className="d-block">{transaction.material_name}</strong>
                                                                                    <small className="text-muted d-block">{transaction.material_code}</small>
                                                                        </div>
                                                                    </td>
                                                                            <td style={{ padding: '1rem' }}>
                                                                        <span className="text-truncate d-inline-block" style={{ maxWidth: '120px' }} title={transaction.product_name}>
                                                                                    {transaction.product_name || '-'}
                                                                        </span>
                                                                    </td>
                                                                            <td style={{ padding: '1rem' }} className={transaction.direction === 'in' ? 'text-success' : 'text-danger'}>
                                                                        <strong>{transaction.quantity_display}</strong>
                                                                        <br />
                                                                        <small className="text-muted">{transaction.unit}</small>
                                                                    </td>
                                                                            <td style={{ padding: '1rem' }}>
                                                                                <div className="d-flex align-items-center">
                                                                                    ₱{transaction.unit_cost?.toLocaleString() || 'N/A'}
                                                                                </div>
                                                                            </td>
                                                                            <td style={{ padding: '1rem' }}>
                                                                                <strong>₱{transaction.total_cost?.toLocaleString() || 'N/A'}</strong>
                                                                            </td>
                                                                            <td style={{ padding: '1rem' }}>
                                                                        <span className="text-truncate d-inline-block" style={{ maxWidth: '150px' }} title={transaction.reference}>
                                                                            {transaction.reference}
                                                                        </span>
                                                                    </td>
                                                                            <td style={{ padding: '1rem' }}>
                                                                        <span className={`badge ${
                                                                            transaction.status === 'completed' ? 'bg-success' :
                                                                            transaction.status === 'pending' ? 'bg-warning' :
                                                                            'bg-secondary'
                                                                                }`} style={{ borderRadius: '8px' }}>
                                                                            {transaction.status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Summary Dashboard */}
                                        {transactionView === 'summary' && (
                                            <div>
                                                <div className="row mb-4">
                                                    <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                                                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                                                            <div className="card-body text-center">
                                                                <i className="fas fa-shopping-cart fa-2x text-primary mb-2"></i>
                                                                <h6 className="card-title text-muted mb-2">Total Transactions</h6>
                                                                <h4 className="text-primary mb-0">{enhancedTransactions.summary.total_transactions}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                                                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                                                            <div className="card-body text-center">
                                                                <i className="fas fa-peso-sign fa-2x text-success mb-2"></i>
                                                                <h6 className="card-title text-muted mb-2">Total Value</h6>
                                                                <h5 className="text-success mb-0">₱{enhancedTransactions.summary.total_value.toLocaleString()}</h5>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                                                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                                                            <div className="card-body text-center">
                                                                <i className="fas fa-arrow-down fa-2x text-success mb-2"></i>
                                                                <h6 className="card-title text-muted mb-2">Inbound</h6>
                                                                <h4 className="text-success mb-0">{enhancedTransactions.summary.inbound_transactions}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                                                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                                                            <div className="card-body text-center">
                                                                <i className="fas fa-arrow-up fa-2x text-danger mb-2"></i>
                                                                <h6 className="card-title text-muted mb-2">Outbound</h6>
                                                                <h4 className="text-danger mb-0">{enhancedTransactions.summary.outbound_transactions}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                                                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                                                            <div className="card-body text-center">
                                                                <i className="fas fa-boxes fa-2x text-info mb-2"></i>
                                                                <h6 className="card-title text-muted mb-2">Materials</h6>
                                                                <h4 className="text-info mb-0">{enhancedTransactions.summary.unique_materials}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-lg-2 col-md-4 col-sm-6 mb-3">
                                                        <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                                                            <div className="card-body text-center">
                                                                <i className="fas fa-layer-group fa-2x text-secondary mb-2"></i>
                                                                <h6 className="card-title text-muted mb-2">Total Qty</h6>
                                                                <h4 className="text-secondary mb-0">{enhancedTransactions.summary.total_quantity.toLocaleString()}</h4>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="row">
                                                    <div className="col-md-6 mb-4">
                                                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', height: '100%' }}>
                                                            <div className="card-header bg-white border-bottom">
                                                                <h6 className="mb-0">
                                                                    <i className="fas fa-tags me-2"></i>
                                                                    Transaction Categories
                                                                </h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                                    <span className="fw-bold">Alkansya</span>
                                                                    <span className="badge bg-success" style={{ borderRadius: '8px', fontSize: '1rem', padding: '0.5rem 1rem' }}>{enhancedTransactions.summary.alkansya_transactions}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between align-items-center mb-3">
                                                                    <span className="fw-bold">Made-to-Order</span>
                                                                    <span className="badge bg-info" style={{ borderRadius: '8px', fontSize: '1rem', padding: '0.5rem 1rem' }}>{enhancedTransactions.summary.made_to_order_transactions}</span>
                                                                </div>
                                                                <div className="d-flex justify-content-between align-items-center mb-0">
                                                                    <span className="fw-bold">Other</span>
                                                                    <span className="badge bg-secondary" style={{ borderRadius: '8px', fontSize: '1rem', padding: '0.5rem 1rem' }}>{enhancedTransactions.summary.other_transactions}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6 mb-4">
                                                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', height: '100%' }}>
                                                            <div className="card-header bg-white border-bottom">
                                                                <h6 className="mb-0">
                                                                    <i className="fas fa-chart-line me-2"></i>
                                                                    Daily Transaction Trends
                                                                </h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <ResponsiveContainer width="100%" height={200}>
                                                                    <LineChart data={enhancedTransactions.daily_summary}>
                                                                        <CartesianGrid strokeDasharray="3 3" />
                                                                        <XAxis dataKey="date" />
                                                                        <YAxis />
                                                                        <Tooltip />
                                                                        <Legend />
                                                                        <Line type="monotone" dataKey="total_transactions" stroke={colors.primary} strokeWidth={2} name="Total" />
                                                                        <Line type="monotone" dataKey="inbound" stroke={colors.success} strokeWidth={2} name="Inbound" />
                                                                        <Line type="monotone" dataKey="outbound" stroke={colors.danger} strokeWidth={2} name="Outbound" />
                                                                    </LineChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Analytics */}
                                        {transactionView === 'analytics' && (
                                            <div>
                                                <div className="row">
                                                    <div className="col-md-8">
                                                        <div className="card">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Material Transaction Summary</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="table-responsive">
                                                                    <table className="table table-hover">
                                                                        <thead>
                                                                            <tr>
                                                                                <th>Material</th>
                                                                                <th>Code</th>
                                                                                <th>Transactions</th>
                                                                                <th>Total Qty</th>
                                                                                <th>Total Value</th>
                                                                                <th>Net Qty</th>
                                                                                <th>Last Transaction</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {enhancedTransactions.material_summary.slice(0, 20).map((material, index) => (
                                                                                <tr key={index}>
                                                                                    <td className="text-truncate" style={{ maxWidth: '150px' }} title={material.material_name}>
                                                                                        {material.material_name}
                                                                                    </td>
                                                                                    <td>{material.material_code}</td>
                                                                                    <td>
                                                                                        <span className="badge bg-info">{material.total_transactions}</span>
                                                                                    </td>
                                                                                    <td>{material.total_quantity.toLocaleString()}</td>
                                                                                    <td>₱{material.total_value.toLocaleString()}</td>
                                                                                    <td className={material.net_quantity > 0 ? 'text-success' : 'text-danger'}>
                                                                                        {material.net_quantity > 0 ? '+' : ''}{material.net_quantity}
                                                                                    </td>
                                                                                    <td>
                                                                                        <small>{new Date(material.last_transaction).toLocaleDateString()}</small>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-4">
                                                        <div className="card">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Transaction Distribution</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <ResponsiveContainer width="100%" height={300}>
                                                                    <PieChart>
                                                                        <Pie
                                                                            data={[
                                                                                { name: 'Alkansya', value: enhancedTransactions.summary.alkansya_transactions, color: colors.primary },
                                                                                { name: 'Made-to-Order', value: enhancedTransactions.summary.made_to_order_transactions, color: colors.info },
                                                                                { name: 'Other', value: enhancedTransactions.summary.other_transactions, color: colors.secondary }
                                                                            ]}
                                                                            cx="50%"
                                                                            cy="50%"
                                                                            labelLine={false}
                                                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                                            outerRadius={80}
                                                                            fill="#8884d8"
                                                                            dataKey="value"
                                                                        >
                                                                            {[
                                                                                { name: 'Alkansya', value: enhancedTransactions.summary.alkansya_transactions, color: colors.primary },
                                                                                { name: 'Made-to-Order', value: enhancedTransactions.summary.made_to_order_transactions, color: colors.info },
                                                                                { name: 'Other', value: enhancedTransactions.summary.other_transactions, color: colors.secondary }
                                                                            ].map((entry, index) => (
                                                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                                                            ))}
                                                                        </Pie>
                                                                        <Tooltip />
                                                                        <Legend />
                                                                    </PieChart>
                                                                </ResponsiveContainer>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        </div>
                                    )
                                ) : (
                                    <div className="text-center py-5">
                                        <FaHistory className="text-muted mb-3" style={{ fontSize: '3rem' }} />
                                        <h5 className="text-muted">No transactions data available</h5>
                                        <p className="text-muted">Enhanced transaction data will appear here once inventory transactions are recorded</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <div className="card-header bg-white border-0" style={{ borderRadius: '12px' }}>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0 d-flex align-items-center">
                                    <FaExclamationTriangle className="me-2" style={{ color: colors.danger }} />
                                        Inventory Alerts & Warnings
                                        {tabLoadingStates.alerts && (
                                            <div className="spinner-border spinner-border-sm ms-2" role="status">
                                                <span className="visually-hidden">Loading...</span>
                                            </div>
                                        )}
                                </h5>
                                    <button 
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => {
                                            setTabLoadingStates(prev => ({ ...prev, alerts: true }));
                                            loadTabData('alerts');
                                        }}
                                        style={{ borderRadius: '8px' }}
                                    >
                                        <FaSync className="me-1" />
                                        Refresh Alerts
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                {tabLoadingStates.alerts ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-danger mb-3" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <h5>Loading Inventory Alerts...</h5>
                                        <p className="text-muted">Checking all material levels and stock status</p>
                                    </div>
                                ) : realTimeAlerts?.alerts && realTimeAlerts.alerts.length > 0 ? (
                                    <div>
                                        {/* Summary Statistics */}
                                        <div className="row mb-4">
                                            <div className="col-lg-3 col-md-6 mb-3">
                                                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', borderLeft: '4px solid #dc3545' }}>
                                                    <div className="card-body">
                                                        <div className="d-flex align-items-center">
                                        <div className="flex-grow-1">
                                                                <h6 className="text-muted mb-1">Critical Alerts</h6>
                                                                <h4 className="text-danger mb-0">
                                                                    {realTimeAlerts.alerts.filter(a => a.severity === 'critical').length}
                                                                </h4>
                                        </div>
                                                            <i className="fas fa-exclamation-circle fa-3x text-danger"></i>
                                    </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6 mb-3">
                                                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', borderLeft: '4px solid #ffc107' }}>
                                                    <div className="card-body">
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-grow-1">
                                                                <h6 className="text-muted mb-1">High Priority</h6>
                                                                <h4 className="text-warning mb-0">
                                                                    {realTimeAlerts.alerts.filter(a => a.severity === 'high').length}
                                                                </h4>
                                                            </div>
                                                            <i className="fas fa-exclamation-triangle fa-3x text-warning"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6 mb-3">
                                                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', borderLeft: '4px solid #17a2b8' }}>
                                                    <div className="card-body">
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-grow-1">
                                                                <h6 className="text-muted mb-1">Medium Priority</h6>
                                                                <h4 className="text-info mb-0">
                                                                    {realTimeAlerts.alerts.filter(a => a.severity === 'medium').length}
                                                                </h4>
                                                            </div>
                                                            <i className="fas fa-info-circle fa-3x text-info"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-3 col-md-6 mb-3">
                                                <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px', borderLeft: '4px solid #6c757d' }}>
                                                    <div className="card-body">
                                                        <div className="d-flex align-items-center">
                                                            <div className="flex-grow-1">
                                                                <h6 className="text-muted mb-1">Total Alerts</h6>
                                                                <h4 className="text-secondary mb-0">
                                                                    {realTimeAlerts.alerts.length}
                                                                </h4>
                                                            </div>
                                                            <i className="fas fa-bell fa-3x text-secondary"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Alert List */}
                                        <div className="card border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                                            <div className="card-header bg-white border-bottom">
                                                <h6 className="mb-0">
                                                    <i className="fas fa-list-ul me-2"></i>
                                                    Active Inventory Alerts
                                                </h6>
                                            </div>
                                            <div className="card-body p-0">
                                                {realTimeAlerts.alerts.map((alert) => (
                                                    <div 
                                                        key={alert.id} 
                                                        className={`border-bottom p-4 ${
                                                            alert.severity === 'critical' ? 'bg-light-danger' :
                                                            alert.severity === 'high' ? 'bg-light-warning' :
                                                            'bg-light-info'
                                                        }`}
                                                        style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = alert.severity === 'critical' ? '#f8d7da' : alert.severity === 'high' ? '#fff3cd' : '#d1ecf1'}
                                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = alert.severity === 'critical' ? '#f8d7da' : alert.severity === 'high' ? '#fff3cd' : '#d1ecf1'}
                                                    >
                                                        <div className="d-flex align-items-start">
                                                            <div className="me-3 mt-1">
                                                                {alert.severity === 'critical' && <FaExclamationTriangle className="text-danger" size={24} />}
                                                                {alert.severity === 'high' && <FaExclamationTriangle className="text-warning" size={24} />}
                                                                {alert.severity === 'medium' && <FaExclamationTriangle className="text-info" size={24} />}
                                                            </div>
                                                            <div className="flex-grow-1">
                                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                                    <div>
                                                                        <strong className="d-block mb-1" style={{ fontSize: '1.1rem' }}>
                                                                            {alert.material}
                                                                        </strong>
                                                                        <p className="text-muted mb-2" style={{ fontSize: '0.95rem' }}>
                                                                            {alert.message}
                                                                        </p>
                                                                    </div>
                                                                    <span className={`badge ${
                                                                        alert.severity === 'critical' ? 'bg-danger' :
                                                                        alert.severity === 'high' ? 'bg-warning' :
                                                                        'bg-info'
                                                                    }`} style={{ borderRadius: '8px', fontSize: '0.9rem' }}>
                                                                        {alert.severity.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <div className="row">
                                                                    <div className="col-md-3 mb-2">
                                                                        <div className="d-flex align-items-center">
                                                                            <i className="fas fa-box text-muted me-2"></i>
                                                                            <div>
                                                                                <small className="text-muted d-block">Current Stock</small>
                                                                                <strong className="text-danger">{alert.current_stock}</strong>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-3 mb-2">
                                                                        <div className="d-flex align-items-center">
                                                                            <i className="fas fa-flag text-muted me-2"></i>
                                                                            <div>
                                                                                <small className="text-muted d-block">Reorder Point</small>
                                                                                <strong>{alert.reorder_point}</strong>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-3 mb-2">
                                                                        <div className="d-flex align-items-center">
                                                                            <i className="fas fa-shield-alt text-muted me-2"></i>
                                                                            <div>
                                                                                <small className="text-muted d-block">Safety Stock</small>
                                                                                <strong>{alert.safety_stock || 'N/A'}</strong>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-3 mb-2">
                                                                        <div className="d-flex align-items-center">
                                                                            <i className="fas fa-clock text-muted me-2"></i>
                                                                            <div>
                                                                                <small className="text-muted d-block">Date/Time</small>
                                                                                <strong className="text-muted">{new Date(alert.timestamp).toLocaleString()}</strong>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Recommendation Card */}
                                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px', borderLeft: '4px solid #ffc107' }}>
                                            <div className="card-header bg-light border-0">
                                                <h6 className="mb-0">
                                                    <i className="fas fa-lightbulb me-2 text-warning"></i>
                                                    Recommended Actions
                                                </h6>
                                            </div>
                                            <div className="card-body">
                                                <ul className="mb-0">
                                                    <li className="mb-2">
                                                        <strong>Critical Materials:</strong> Order immediately to prevent stockout
                                                    </li>
                                                    <li className="mb-2">
                                                        <strong>High Priority:</strong> Reorder within the next 2-3 days
                                                    </li>
                                                    <li>
                                                        <strong>Medium Priority:</strong> Monitor closely and plan for restocking
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-5">
                                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                                            <div className="card-body py-5">
                                                <i className="fas fa-check-circle fa-4x text-success mb-3"></i>
                                                <h5 className="text-success mb-2">All Clear!</h5>
                                                <p className="text-muted mb-4">All inventory levels are within normal ranges</p>
                                                <button 
                                                    className="btn btn-outline-primary"
                                                    onClick={() => {
                                                        setTabLoadingStates(prev => ({ ...prev, alerts: true }));
                                                        loadTabData('alerts');
                                                    }}
                                                    style={{ borderRadius: '8px' }}
                                                >
                                                    <FaSync className="me-2" />
                                                    Refresh Alerts
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Preview Modal */}
            {showPreviewModal && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-xl">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title d-flex align-items-center">
                                    <i className="fas fa-file-alt text-primary me-2"></i>
                                    {previewTitle}
                                </h5>
                                <button 
                                    type="button" 
                                    className="btn-close" 
                                    onClick={() => setShowPreviewModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                {previewData && previewData.sections.map((section, sectionIndex) => (
                                    <div key={sectionIndex} className="mb-4">
                                        <h6 className="text-primary mb-3 border-bottom pb-2">
                                            <i className="fas fa-chart-bar me-2"></i>
                                            {section.title}
                                        </h6>
                                        
                                        {section.type === 'table' ? (
                                            <div className="table-responsive">
                                                <table className="table table-striped table-hover">
                                                    <thead className="table-dark">
                                                        <tr>
                                                            {section.headers.map((header, headerIndex) => (
                                                                <th key={headerIndex}>{header}</th>
                                                            ))}
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {section.data.map((row, rowIndex) => (
                                                            <tr key={rowIndex}>
                                                                {row.map((cell, cellIndex) => (
                                                                    <td key={cellIndex}>{cell}</td>
                                                                ))}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="row">
                                                {section.data.map((item, itemIndex) => (
                                                    <div key={itemIndex} className="col-md-6 mb-3">
                                                        <div className="card border-0 shadow-sm">
                                                            <div className="card-body p-3">
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <span className="text-muted fw-medium">{item.label}</span>
                                                                    <span className="fw-bold text-primary fs-5">{item.value}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => setShowPreviewModal(false)}
                                >
                                    <i className="fas fa-times me-2"></i>
                                    Close
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-primary"
                                    onClick={() => {
                                        const reportType = previewTitle.includes('Stock Levels') ? 'stock' : 
                                                         previewTitle.includes('Usage Trends') ? 'usage' :
                                                         previewTitle.includes('Replenishment') ? 'replenishment' : 'full';
                                        downloadReport(reportType);
                                        setShowPreviewModal(false);
                                    }}
                                >
                                    <i className="fas fa-download me-2"></i>
                                    Download CSV
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default EnhancedInventoryReports;
