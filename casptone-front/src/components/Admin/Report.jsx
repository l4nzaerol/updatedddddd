import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/client";
import AppLayout from "../Header";
import DailyOutputChart from "./Analytics/DailyOutputChart.js";
import SalesDashboard from "./Analytics/SalesDashboard.jsx";
import SalesProcessAnalytics from "./Analytics/SalesProcessAnalytics.jsx";
import ProductPerformance from "./Analytics/ProductPerformance.jsx";
import SalesReport from "./Analytics/SalesReport.jsx";
import { downloadStockCsv, downloadUsageCsv, downloadReplenishmentCsv } from "../../api/inventoryApi";
// import { exportProductionCsv } from "../../api/productionApi";
import { clearRequestCache } from "../../utils/apiRetry";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid 
} from "recharts";
import "./InventoryReportsDashboard.css";

const Report = () => {
    const navigate = useNavigate();
    const [windowDays, setWindowDays] = useState(30);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [mainTab, setMainTab] = useState("inventory"); // Main category: inventory, production, or sales
    const [activeTab, setActiveTab] = useState("overview"); // Sub-tab within category
    const [refreshKey, setRefreshKey] = useState(0); // Key to force component refresh
    
    // Inventory report data states
    const [dashboardData, setDashboardData] = useState(null);
    const [inventoryReport, setInventoryReport] = useState(null);
    const [consumptionTrends, setConsumptionTrends] = useState(null);
    const [replenishmentSchedule, setReplenishmentSchedule] = useState(null);
    const [forecastReport, setForecastReport] = useState(null);
    const [dailyUsage, setDailyUsage] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [materialFilter, setMaterialFilter] = useState('all');
    
    // Production report data states
    const [productionAnalytics, setProductionAnalytics] = useState(null);
    const [productionPerformance, setProductionPerformance] = useState(null);
    
    // Advanced analytics states
    const [productionOutput, setProductionOutput] = useState(null);
    const [resourceUtilization, setResourceUtilization] = useState(null);
    const [advancedPerformance, setAdvancedPerformance] = useState(null);
    const [predictiveAnalytics, setPredictiveAnalytics] = useState(null);
    // const [materialTrends, setMaterialTrends] = useState(null);
    const [stockReport, setStockReport] = useState(null);
    
    // Sales analytics data states
    const [salesDashboardData, setSalesDashboardData] = useState(null);
    const [salesProcessData, setSalesProcessData] = useState(null);
    const [productPerformanceData, setProductPerformanceData] = useState(null);
    const [salesReportData, setSalesReportData] = useState(null);

    // useEffect moved after fetchAllReports definition

    // Filter materials based on product type
    const filterMaterials = (items) => {
        if (!items) return [];
        
        console.log('🔍 Filtering materials:', { materialFilter, totalItems: items.length });
        
        let filteredItems;
        switch (materialFilter) {
            case 'alkansya':
                filteredItems = items.filter(item => 
                    item.name.toLowerCase().includes('alkansya') ||
                    item.sku.toLowerCase().includes('alkansya')
                );
                break;
            case 'dining-table':
                filteredItems = items.filter(item => 
                    item.name.toLowerCase().includes('table') ||
                    item.sku.toLowerCase().includes('table')
                );
                break;
            case 'wooden-chair':
                filteredItems = items.filter(item => 
                    item.name.toLowerCase().includes('chair') ||
                    item.sku.toLowerCase().includes('chair')
                );
                break;
            default:
                filteredItems = items;
        }
        
        console.log('🔍 Filtered result:', { filteredCount: filteredItems.length, filter: materialFilter });
        return filteredItems;
    };

    // Debug logging for tab changes and data availability
    useEffect(() => {
        console.log('🔍 Tab State:', { mainTab, activeTab });
        console.log('🔍 Resource Utilization:', resourceUtilization);
        console.log('🔍 Has material_usage_by_product?', !!resourceUtilization?.material_usage_by_product);
    }, [activeTab, mainTab, resourceUtilization]);

    // Debug logging for material filter changes
    useEffect(() => {
        console.log('🔍 Material Filter Changed:', materialFilter);
    }, [materialFilter]);

    const fetchAllReports = useCallback(async () => {
        setLoading(true);
        setError("");
        const startTime = performance.now();
        try {
            console.log("🚀 Starting progressive report loading...");
            
            // Phase 1: Load critical data first (most important for user)
            console.log("📊 Phase 1: Loading critical data...");
            const criticalRequests = [
                api.get("/inventory/dashboard"),
                api.get("/inventory/report", { 
                    params: { 
                        start_date: getStartDate(windowDays), 
                        end_date: new Date().toISOString().split('T')[0] 
                    } 
                }),
                api.get("/productions/analytics")
            ];
            
            const criticalResults = await Promise.allSettled(criticalRequests);
            
            // Set critical data immediately
            if (criticalResults[0].status === 'fulfilled') {
                setDashboardData(criticalResults[0].value.data);
                console.log("✅ Dashboard data loaded");
            }
            if (criticalResults[1].status === 'fulfilled') {
                setInventoryReport(criticalResults[1].value.data);
                console.log("✅ Inventory report loaded");
            }
            if (criticalResults[2].status === 'fulfilled') {
                setProductionAnalytics(criticalResults[2].value.data);
                setProductionPerformance(criticalResults[2].value.data);
                console.log("✅ Production analytics loaded");
            }
            
            // Phase 2: Load secondary data in background
            console.log("📈 Phase 2: Loading secondary data...");
            const secondaryRequests = [
                api.get("/inventory/forecast", { 
                    params: { forecast_days: 30, historical_days: windowDays } 
                }),
                api.get("/inventory/replenishment-schedule"),
                api.get("/inventory/consumption-trends", { 
                    params: { days: windowDays } 
                }),
                api.get("/inventory/daily-usage", { 
                    params: { date: selectedDate } 
                })
            ];
            
            const secondaryResults = await Promise.allSettled(secondaryRequests);
            
            // Set secondary data
            if (secondaryResults[0].status === 'fulfilled') {
                setForecastReport(secondaryResults[0].value.data);
                console.log("✅ Forecast report loaded");
            }
            if (secondaryResults[1].status === 'fulfilled') {
                setReplenishmentSchedule(secondaryResults[1].value.data);
                console.log("✅ Replenishment schedule loaded");
            }
            if (secondaryResults[2].status === 'fulfilled') {
                setConsumptionTrends(secondaryResults[2].value.data);
                console.log("✅ Consumption trends loaded");
            }
            if (secondaryResults[3].status === 'fulfilled') {
                setDailyUsage(secondaryResults[3].value.data);
                console.log("✅ Daily usage loaded");
            }
            
            // Phase 3: Load advanced analytics in background (lowest priority)
            console.log("🔬 Phase 3: Loading advanced analytics...");
            const advancedRequests = [
                api.get('/analytics/production-output', { params: { 
                    start_date: getStartDate(90), 
                    end_date: new Date().toISOString().split('T')[0],
                    timeframe: 'daily'
                }}),
                api.get('/analytics/resource-utilization', { params: { 
                    start_date: getStartDate(90), 
                    end_date: new Date().toISOString().split('T')[0]
                }}),
                api.get('/analytics/production-performance', { params: { 
                    start_date: getStartDate(90), 
                    end_date: new Date().toISOString().split('T')[0]
                }}),
                api.get('/analytics/predictive', { params: { forecast_days: 30 }}),
                api.get('/analytics/material-usage-trends', { params: { 
                    start_date: getStartDate(90), 
                    end_date: new Date().toISOString().split('T')[0],
                    timeframe: 'daily'
                }}),
                api.get('/analytics/automated-stock-report'),
                api.get('/analytics/sales-dashboard'),
                api.get('/analytics/sales-process'),
                api.get('/analytics/product-performance'),
                api.get('/analytics/sales-report')
            ];
            
            const advancedResults = await Promise.allSettled(advancedRequests);
            
            // Set advanced analytics data
            if (advancedResults[0].status === 'fulfilled') {
                setProductionOutput(advancedResults[0].value.data);
                console.log("✅ Production output loaded");
            }
            if (advancedResults[1].status === 'fulfilled') {
                setResourceUtilization(advancedResults[1].value.data);
                console.log("✅ Resource utilization loaded");
            }
            if (advancedResults[2].status === 'fulfilled') {
                setAdvancedPerformance(advancedResults[2].value.data);
                console.log("✅ Production performance loaded");
            }
            if (advancedResults[3].status === 'fulfilled') {
                setPredictiveAnalytics(advancedResults[3].value.data);
                console.log("✅ Predictive analytics loaded");
            }
            if (advancedResults[4].status === 'fulfilled') {
                console.log("✅ Material trends loaded");
            }
            if (advancedResults[5].status === 'fulfilled') {
                setStockReport(advancedResults[5].value.data);
                console.log("✅ Stock report loaded");
            }
            if (advancedResults[6].status === 'fulfilled') {
                setSalesDashboardData(advancedResults[6].value.data);
                console.log("✅ Sales dashboard loaded");
            }
            if (advancedResults[7].status === 'fulfilled') {
                setSalesProcessData(advancedResults[7].value.data);
                console.log("✅ Sales process loaded");
            }
            if (advancedResults[8].status === 'fulfilled') {
                setProductPerformanceData(advancedResults[8].value.data);
                console.log("✅ Product performance loaded");
            }
            if (advancedResults[9].status === 'fulfilled') {
                setSalesReportData(advancedResults[9].value.data);
                console.log("✅ Sales report loaded");
            }
            
            const totalTime = performance.now() - startTime;
            console.log(`🎉 All reports loaded successfully in ${totalTime.toFixed(2)}ms (${(totalTime/1000).toFixed(2)}s)`);
            
        } catch (err) {
            console.error("❌ Error fetching reports:", err);
            setError("Failed to load reports. Please check console for details.");
        } finally {
            setLoading(false);
        }
    }, [windowDays, selectedDate]);

    useEffect(() => {
        fetchAllReports();
    }, [fetchAllReports]);

    const handleGlobalRefresh = () => {
        console.log('🔄 Global refresh triggered');
        clearRequestCache();
        setRefreshKey(prev => prev + 1); // Force component refresh
        console.log('🔄 Refresh key updated to:', refreshKey + 1);
        fetchAllReports();
    };
    
    const getStartDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    };
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
    const PRIORITY_COLORS = { urgent: '#dc3545', high: '#fd7e14', medium: '#ffc107', low: '#28a745' };
    
    // Export functions
    const exportReport = (reportName, data) => {
        if (!data || data.length === 0) {
            alert('No data available to export');
            return;
        }
        const csv = convertToCSV(data);
        downloadCSV(csv, `${reportName}_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const convertToCSV = (data) => {
        if (!data || data.length === 0) return "";
        const headers = Object.keys(data[0]).join(",");
        const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(","));
        return [headers, ...rows].join("\n");
    };

    const downloadCSV = (csv, filename) => {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };

    // Sales Export Handlers
    const handleSalesExport = async (tabType, format) => {
        try {
            let data = null;
            let filename = '';
            
            // Get data based on tab type
            switch (tabType) {
                case 'dashboard':
                    data = salesDashboardData;
                    filename = 'sales_dashboard';
                    break;
                case 'process':
                    data = salesProcessData;
                    filename = 'sales_process';
                    break;
                case 'reports':
                    data = salesReportData;
                    filename = 'sales_reports';
                    break;
                case 'products':
                    data = productPerformanceData;
                    filename = 'product_performance';
                    break;
                default:
                    alert('Invalid tab type for export');
                    return;
            }

            if (!data) {
                alert('No data available to export');
                return;
            }

            if (format === 'csv') {
                // Export as CSV
                const csvData = convertSalesDataToCSV(data, tabType);
                downloadCSV(csvData, `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
            } else if (format === 'pdf') {
                // Export as PDF
                await exportSalesDataToPDF(data, tabType, filename);
            }
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export data');
        }
    };

    const convertSalesDataToCSV = (data, tabType) => {
        if (!data) return '';
        
        switch (tabType) {
            case 'dashboard':
                return convertDashboardDataToCSV(data);
            case 'process':
                return convertProcessDataToCSV(data);
            case 'reports':
                return convertReportsDataToCSV(data);
            case 'products':
                return convertProductsDataToCSV(data);
            default:
                return '';
        }
    };

    const convertDashboardDataToCSV = (data) => {
        if (!data || !data.overview) return '';
        
        const headers = ['Metric', 'Value'];
        const rows = [
            ['Total Revenue', data.overview.total_revenue],
            ['Total Orders', data.overview.total_orders],
            ['Paid Orders', data.overview.paid_orders],
            ['Pending Orders', data.overview.pending_orders],
            ['Average Order Value', data.overview.average_order_value],
            ['Conversion Rate', data.overview.conversion_rate]
        ];
        
        return [headers.join(','), ...rows.map(row => row.map(val => `"${val}"`).join(','))].join('\n');
    };

    const convertProcessDataToCSV = (data) => {
        if (!data) return '';
        
        const headers = ['Stage', 'Count', 'Percentage'];
        const rows = data.stages?.map(stage => [
            stage.name,
            stage.count,
            stage.percentage
        ]) || [];
        
        return [headers.join(','), ...rows.map(row => row.map(val => `"${val}"`).join(','))].join('\n');
    };

    const convertReportsDataToCSV = (data) => {
        if (!data || !data.orders) return '';
        
        const headers = ['Order ID', 'Customer', 'Total', 'Status', 'Payment Status', 'Date'];
        const rows = data.orders.map(order => [
            order.id,
            order.customer_name,
            order.total,
            order.status,
            order.payment_status,
            order.created_at
        ]);
        
        return [headers.join(','), ...rows.map(row => row.map(val => `"${val}"`).join(','))].join('\n');
    };

    const convertProductsDataToCSV = (data) => {
        if (!data || !data.products) return '';
        
        const headers = ['Product', 'Orders', 'Revenue', 'Average Price'];
        const rows = data.products.map(product => [
            product.name,
            product.orders,
            product.revenue,
            product.average_price
        ]);
        
        return [headers.join(','), ...rows.map(row => row.map(val => `"${val}"`).join(','))].join('\n');
    };

    const exportSalesDataToPDF = async (data, tabType, filename) => {
        // Dynamic import for jsPDF to avoid bundle size issues
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text(`${tabType.charAt(0).toUpperCase() + tabType.slice(1)} Report`, 20, 20);
        
        // Add date
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
        
        // Add data based on tab type
        let yPosition = 50;
        doc.setFontSize(14);
        
        switch (tabType) {
            case 'dashboard':
                if (data.overview) {
                    doc.text('Sales Overview:', 20, yPosition);
                    yPosition += 10;
                    doc.setFontSize(10);
                    doc.text(`Total Revenue: ₱${data.overview.total_revenue}`, 20, yPosition);
                    yPosition += 7;
                    doc.text(`Total Orders: ${data.overview.total_orders}`, 20, yPosition);
                    yPosition += 7;
                    doc.text(`Paid Orders: ${data.overview.paid_orders}`, 20, yPosition);
                    yPosition += 7;
                    doc.text(`Pending Orders: ${data.overview.pending_orders}`, 20, yPosition);
                    yPosition += 7;
                    doc.text(`Average Order Value: ₱${data.overview.average_order_value}`, 20, yPosition);
                    yPosition += 7;
                    doc.text(`Conversion Rate: ${data.overview.conversion_rate}%`, 20, yPosition);
                }
                break;
            case 'process':
                if (data.stages) {
                    doc.text('Sales Process Stages:', 20, yPosition);
                    yPosition += 10;
                    doc.setFontSize(10);
                    data.stages.forEach(stage => {
                        doc.text(`${stage.name}: ${stage.count} (${stage.percentage}%)`, 20, yPosition);
                        yPosition += 7;
                    });
                }
                break;
            case 'reports':
                if (data.orders) {
                    doc.text('Recent Orders:', 20, yPosition);
                    yPosition += 10;
                    doc.setFontSize(8);
                    data.orders.slice(0, 20).forEach(order => {
                        doc.text(`Order ${order.id}: ${order.customer_name} - ₱${order.total} (${order.status})`, 20, yPosition);
                        yPosition += 5;
                    });
                }
                break;
            case 'products':
                if (data.products) {
                    doc.text('Product Performance:', 20, yPosition);
                    yPosition += 10;
                    doc.setFontSize(10);
                    data.products.forEach(product => {
                        doc.text(`${product.name}: ${product.orders} orders, ₱${product.revenue} revenue`, 20, yPosition);
                        yPosition += 7;
                    });
                }
                break;
            default:
                doc.text('No data available for export', 20, yPosition);
                break;
        }
        
        // Save the PDF
        doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Inventory Export Handlers
    const handleInventoryExport = async (exportType, format) => {
        try {
            if (format === 'pdf') {
                await exportInventoryDataToPDF(exportType);
            }
        } catch (error) {
            console.error('Inventory export error:', error);
            alert('Failed to export inventory data');
        }
    };

    const exportInventoryDataToPDF = async (exportType) => {
        // Dynamic import for jsPDF
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text('Inventory Report', 20, 20);
        
        // Add date
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
        
        let yPosition = 50;
        doc.setFontSize(14);
        
        switch (exportType) {
            case 'stock':
                if (inventoryReport) {
                    doc.text('Inventory Stock Levels:', 20, yPosition);
                    yPosition += 10;
                    doc.setFontSize(10);
                    
                    // Add summary
                    if (inventoryReport.summary) {
                        doc.text(`Total Items: ${inventoryReport.summary.total_items}`, 20, yPosition);
                        yPosition += 7;
                        doc.text(`Items Needing Reorder: ${inventoryReport.summary.items_needing_reorder}`, 20, yPosition);
                        yPosition += 7;
                        doc.text(`Critical Items: ${inventoryReport.summary.critical_items}`, 20, yPosition);
                        yPosition += 7;
                        doc.text(`Total Usage: ${inventoryReport.summary.total_usage}`, 20, yPosition);
                        yPosition += 15;
                    }
                    
                    // Add sample items (first 20)
                    if (inventoryReport.items) {
                        doc.text('Sample Inventory Items:', 20, yPosition);
                        yPosition += 10;
                        doc.setFontSize(8);
                        
                        inventoryReport.items.slice(0, 20).forEach(item => {
                            doc.text(`${item.sku}: ${item.name} - Stock: ${item.current_stock} (${item.stock_status})`, 20, yPosition);
                            yPosition += 5;
                        });
                    }
                }
                break;
            case 'usage':
                if (consumptionTrends) {
                    doc.text('Inventory Usage Trends:', 20, yPosition);
                    yPosition += 10;
                    doc.setFontSize(10);
                    
                    if (consumptionTrends.trends) {
                        Object.entries(consumptionTrends.trends).slice(0, 15).forEach(([sku, trend]) => {
                            doc.text(`${sku}: ${trend.avg_daily_usage} units/day (Trend: ${trend.trend > 0 ? '+' : ''}${trend.trend})`, 20, yPosition);
                            yPosition += 7;
                        });
                    }
                }
                break;
            case 'replenishment':
                if (replenishmentSchedule) {
                    doc.text('Replenishment Schedule:', 20, yPosition);
                    yPosition += 10;
                    doc.setFontSize(10);
                    
                    if (replenishmentSchedule.schedule) {
                        replenishmentSchedule.schedule.slice(0, 20).forEach(item => {
                            doc.text(`${item.sku}: Reorder by ${item.order_by_date} (Qty: ${item.recommended_order_qty})`, 20, yPosition);
                            yPosition += 5;
                        });
                    }
                }
                break;
            default:
                doc.text('No data available for export', 20, yPosition);
                break;
        }
        
        // Save the PDF
        doc.save(`inventory_${exportType}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Production Export Handlers
    const handleProductionExport = async (exportType, format) => {
        try {
            if (format === 'pdf') {
                await exportProductionDataToPDF(exportType);
            }
        } catch (error) {
            console.error('Production export error:', error);
            alert('Failed to export production data');
        }
    };

    const exportProductionDataToPDF = async (exportType) => {
        // Dynamic import for jsPDF
        const { jsPDF } = await import('jspdf');
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text('Production Report', 20, 20);
        
        // Add date
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
        
        let yPosition = 50;
        doc.setFontSize(14);
        
        switch (exportType) {
            case 'analytics':
                if (productionAnalytics) {
                    doc.text('Production Analytics:', 20, yPosition);
                    yPosition += 10;
                    doc.setFontSize(10);
                    
                    // Add summary data
                    if (productionAnalytics.summary) {
                        doc.text(`Total Production: ${productionAnalytics.summary.total_production}`, 20, yPosition);
                        yPosition += 7;
                        doc.text(`Active Orders: ${productionAnalytics.summary.active_orders}`, 20, yPosition);
                        yPosition += 7;
                        doc.text(`Completion Rate: ${productionAnalytics.summary.completion_rate}%`, 20, yPosition);
                        yPosition += 15;
                    }
                    
                    // Add daily output data
                    if (productionAnalytics.daily_output) {
                        doc.text('Daily Production Output:', 20, yPosition);
                        yPosition += 10;
                        doc.setFontSize(8);
                        
                        productionAnalytics.daily_output.slice(0, 20).forEach(day => {
                            doc.text(`${day.date}: ${day.quantity} units`, 20, yPosition);
                            yPosition += 5;
                        });
                    }
                }
                break;
            case 'stages':
                if (productionAnalytics && productionAnalytics.stage_breakdown) {
                    doc.text('Production Stage Breakdown:', 20, yPosition);
                    yPosition += 10;
                    doc.setFontSize(10);
                    
                    productionAnalytics.stage_breakdown.forEach(stage => {
                        doc.text(`${stage.name}: ${stage.value} orders (${stage.percentage}%)`, 20, yPosition);
                        yPosition += 7;
                    });
                }
                break;
            case 'output':
                if (productionAnalytics && productionAnalytics.daily_output) {
                    doc.text('Daily Production Output:', 20, yPosition);
                    yPosition += 10;
                    doc.setFontSize(10);
                    
                    productionAnalytics.daily_output.forEach(day => {
                        doc.text(`${day.date}: ${day.quantity} units produced`, 20, yPosition);
                        yPosition += 7;
                    });
                }
                break;
            default:
                doc.text('No data available for export', 20, yPosition);
                break;
        }
        
        // Save the PDF
        doc.save(`production_${exportType}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    // Production CSV Export Handlers
    const handleExportProductionCSV = () => {
        if (!productionAnalytics) {
            alert('No production data available to export');
            return;
        }
        
        // Create CSV from all production data
        const headers = ['Date', 'Product', 'Quantity', 'Stage', 'Status'];
        const rows = (productionAnalytics.daily_output || []).map(item => [
            item.date,
            'Various Products',
            item.quantity,
            'Multiple Stages',
            'Active'
        ]);
        
        const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        downloadCSV(csv, `production_report_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportStageBreakdown = () => {
        if (!productionAnalytics || !productionAnalytics.stage_breakdown) {
            alert('No stage breakdown data available to export');
            return;
        }
        
        // Create CSV from stage breakdown
        const headers = ['Stage Name', 'Number of Orders', 'Percentage'];
        const total = productionAnalytics.stage_breakdown.reduce((sum, item) => sum + item.value, 0);
        const rows = productionAnalytics.stage_breakdown.map(item => [
            item.name,
            item.value,
            `${((item.value / total) * 100).toFixed(2)}%`
        ]);
        
        const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        downloadCSV(csv, `stage_breakdown_${new Date().toISOString().split('T')[0]}.csv`);
    };

    const handleExportDailyOutput = () => {
        if (!productionAnalytics || !productionAnalytics.daily_output) {
            alert('No daily output data available to export');
            return;
        }
        
        // Create CSV from daily output
        const headers = ['Date', 'Quantity Produced', 'Day of Week'];
        const rows = productionAnalytics.daily_output.map(item => {
            const date = new Date(item.date);
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
            return [
                item.date,
                item.quantity,
                dayOfWeek
            ];
        });
        
        const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        downloadCSV(csv, `daily_output_${new Date().toISOString().split('T')[0]}.csv`);
    };

    return (
        <AppLayout>
            <div className="container-fluid py-4" role="region" aria-labelledby="report-heading">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 id="report-heading" className="fw-bold mb-1">
                            📊 Automated Reports & Analytics
                        </h2>
                        
                    </div>
                    <div className="d-flex gap-2">
                        <button 
                            className="btn btn-outline-primary" 
                            onClick={handleGlobalRefresh}
                            disabled={loading}
                            title="Refresh all data"
                        >
                            <i className="fas fa-sync-alt me-1"></i>
                            Refresh Data
                        </button>
                        <button className="btn btn-outline-secondary" onClick={() => navigate("/dashboard")}>
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>
                
                {/* Main Category Tabs - Inventory, Production, and Sales */}
                <ul className="nav nav-pills nav-fill mb-4 shadow-sm" style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '12px' }}>
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${mainTab === "inventory" ? "active" : ""}`}
                            style={{
                                borderRadius: '10px',
                                fontWeight: '600',
                                fontSize: '16px',
                                padding: '12px 24px',
                                backgroundColor: mainTab === "inventory" ? '#0d6efd' : 'transparent',
                                color: mainTab === "inventory" ? 'white' : '#6c757d',
                                border: 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => {
                                setMainTab("inventory");
                                setActiveTab("overview");
                            }}
                        >
                            📦 Inventory Reports
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${mainTab === "production" ? "active" : ""}`}
                            style={{
                                borderRadius: '10px',
                                fontWeight: '600',
                                fontSize: '16px',
                                padding: '12px 24px',
                                backgroundColor: mainTab === "production" ? '#0d6efd' : 'transparent',
                                color: mainTab === "production" ? 'white' : '#6c757d',
                                border: 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => {
                                setMainTab("production");
                                setActiveTab("output-analytics");
                            }}
                        >
                            🏭 Production Reports
                        </button>
                    </li>
                    <li className="nav-item">
                        <button 
                            className={`nav-link ${mainTab === "sales" ? "active" : ""}`}
                            style={{
                                borderRadius: '10px',
                                fontWeight: '600',
                                fontSize: '16px',
                                padding: '12px 24px',
                                backgroundColor: mainTab === "sales" ? '#0d6efd' : 'transparent',
                                color: mainTab === "sales" ? 'white' : '#6c757d',
                                border: 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => {
                                setMainTab("sales");
                                setActiveTab("dashboard");
                            }}
                        >
                            💰 Sales Analytics
                        </button>
                    </li>
                </ul>
                
                {/* Summary Cards - Inventory */}
                {mainTab === "inventory" && dashboardData && (
                    <div className="row g-3 mb-4">
                        <div className="col-md-3">
                            <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #0d6efd' }}>
                                <div className="card-body">
                                    <div className="text-muted small mb-1">Total Items</div>
                                    <div className="h3 mb-0 text-primary">{dashboardData.summary.total_items}</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #dc3545' }}>
                                <div className="card-body">
                                    <div className="text-muted small mb-1">Low Stock Items</div>
                                    <div className="h3 mb-0 text-danger">{dashboardData.summary.low_stock_items}</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #ffc107' }}>
                                <div className="card-body">
                                    <div className="text-muted small mb-1">Out of Stock</div>
                                    <div className="h3 mb-0 text-warning">{dashboardData.summary.out_of_stock_items}</div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #17a2b8' }}>
                                <div className="card-body">
                                    <div className="text-muted small mb-1">Recent Usage (7d)</div>
                                    <div className="h3 mb-0 text-info">{dashboardData.summary.recent_usage}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                
                
                {/* Sub-tabs Navigation - Conditional based on main tab */}
                {mainTab === "inventory" && (
                <ul className="nav nav-tabs mb-4">
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
                            📊 Overview
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "inventory" ? "active" : ""}`} onClick={() => setActiveTab("inventory")}>
                            📦 Inventory Status
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "stock-report" ? "active" : ""}`} onClick={() => setActiveTab("stock-report")}>
                            🚨 Stock Report
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "material-usage" ? "active" : ""}`} onClick={() => setActiveTab("material-usage")}>
                            📊 Material Usage
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "replenishment" ? "active" : ""}`} onClick={() => setActiveTab("replenishment")}>
                            📅 Replenishment
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "forecast" ? "active" : ""}`} onClick={() => setActiveTab("forecast")}>
                            🔮 Material Forecasting
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "trends" ? "active" : ""}`} onClick={() => setActiveTab("trends")}>
                            📈  Consumption Trends
                        </button>
                    </li>
                </ul>
                )}
                
                {/* Production Sub-tabs */}
                {mainTab === "production" && (
                <ul className="nav nav-tabs mb-4">
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "output-analytics" ? "active" : ""}`} onClick={() => setActiveTab("output-analytics")}>
                            📈 Output Analytics
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "resource-util" ? "active" : ""}`} onClick={() => setActiveTab("resource-util")}>
                            📦 Resource Utilization
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "cycle-throughput" ? "active" : ""}`} onClick={() => setActiveTab("cycle-throughput")}>
                            ⏱️ Cycle & Throughput
                        </button>
                    </li>
                    <li className="nav-item">
                        <button className={`nav-link ${activeTab === "predictive" ? "active" : ""}`} onClick={() => setActiveTab("predictive")}>
                            🔮 Predictive Analytics
                        </button>
                    </li>
                </ul>
                )}

                        {/* Sales Sub-tabs */}
                        {mainTab === "sales" && (
                        <ul className="nav nav-tabs mb-4">
                            <li className="nav-item">
                                <button className={`nav-link ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>
                                    📊 Sales Dashboard
                                </button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link ${activeTab === "process" ? "active" : ""}`} onClick={() => setActiveTab("process")}>
                                    🔄 Sales Process
                                </button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link ${activeTab === "reports" ? "active" : ""}`} onClick={() => setActiveTab("reports")}>
                                    📋 Sales Reports
                                </button>
                            </li>
                            <li className="nav-item">
                                <button className={`nav-link ${activeTab === "products" ? "active" : ""}`} onClick={() => setActiveTab("products")}>
                                    📦 Product Performance
                                </button>
                            </li>
                            
                            
                        </ul>
                        )}
                
                {/* CSV Export Buttons - Hidden for Sales Analytics */}
                {mainTab !== "sales" && (
                    <div className="card shadow-sm mb-4">
                        <div className="card-body">
                            <h6 className="fw-bold mb-3">📥 Export Reports</h6>
                            <div className="d-flex flex-wrap gap-2">
                                {mainTab === "inventory" && (
                                    <>
                                        <button 
                                            className="btn btn-outline-primary" 
                                            onClick={downloadStockCsv}
                                            title="Export current inventory stock levels to CSV"
                                        >
                                            📦 Download Stock CSV
                                        </button>
                                        <button 
                                            className="btn btn-outline-danger" 
                                            onClick={() => handleInventoryExport('stock', 'pdf')}
                                            title="Export current inventory stock levels to PDF"
                                        >
                                            📄 Download Stock PDF
                                        </button>
                                        <button 
                                            className="btn btn-outline-primary" 
                                            onClick={() => downloadUsageCsv(90)}
                                            title="Export inventory usage history (90 days) to CSV"
                                        >
                                            📊 Download Usage CSV
                                        </button>
                                        <button 
                                            className="btn btn-outline-danger" 
                                            onClick={() => handleInventoryExport('usage', 'pdf')}
                                            title="Export inventory usage history to PDF"
                                        >
                                            📄 Download Usage PDF
                                        </button>
                                        <button 
                                            className="btn btn-outline-primary" 
                                            onClick={downloadReplenishmentCsv}
                                            title="Export replenishment schedule to CSV"
                                        >
                                            📅 Download Replenishment CSV
                                        </button>
                                        <button 
                                            className="btn btn-outline-danger" 
                                            onClick={() => handleInventoryExport('replenishment', 'pdf')}
                                            title="Export replenishment schedule to PDF"
                                        >
                                            📄 Download Replenishment PDF
                                        </button>
                                    </>
                                )}
                                {mainTab === "production" && (
                                    <>
                                        <button 
                                            className="btn btn-outline-primary" 
                                            onClick={handleExportProductionCSV}
                                            title="Export all production data to CSV"
                                        >
                                            🏭 Download Production CSV
                                        </button>
                                        <button 
                                            className="btn btn-outline-danger" 
                                            onClick={() => handleProductionExport('analytics', 'pdf')}
                                            title="Export all production data to PDF"
                                        >
                                            📄 Download Production PDF
                                        </button>
                                        <button 
                                            className="btn btn-outline-success" 
                                            onClick={handleExportStageBreakdown}
                                            title="Export stage distribution data to CSV"
                                        >
                                            🎯 Download Stage Breakdown CSV
                                        </button>
                                        <button 
                                            className="btn btn-outline-danger" 
                                            onClick={() => handleProductionExport('stages', 'pdf')}
                                            title="Export stage distribution data to PDF"
                                        >
                                            📄 Download Stage Breakdown PDF
                                        </button>
                                        <button 
                                            className="btn btn-outline-info" 
                                            onClick={handleExportDailyOutput}
                                            title="Export daily production output to CSV"
                                        >
                                            📈 Download Daily Output CSV
                                        </button>
                                        <button 
                                            className="btn btn-outline-danger" 
                                            onClick={() => handleProductionExport('output', 'pdf')}
                                            title="Export daily production output to PDF"
                                        >
                                            📄 Download Daily Output PDF
                                        </button>
                                    </>
                                )}
                            </div>
                            {mainTab === "inventory" && (
                                <div className="mt-3 d-flex align-items-center gap-2">
                                    <label htmlFor="fc-window" className="mb-0 small text-muted">Forecast window (days):</label>
                                    <input 
                                        id="fc-window" 
                                        type="number" 
                                        min="7" 
                                        max="120" 
                                        className="form-control form-control-sm" 
                                        style={{width:120}}
                                        value={windowDays} 
                                        onChange={(e)=> setWindowDays(Number(e.target.value)||30)} 
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {loading && (
                    <div className="alert alert-info">
                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                        Loading reports... Please wait.
                    </div>
                )}
                
                {error && (
                    <div className="alert alert-warning">
                        {error}
                        <button className="btn btn-sm btn-primary ms-3" onClick={fetchAllReports}>
                            Retry
                        </button>
                    </div>
                )}
                
                {!loading && (
                    <div className="tab-content">
                        {/* Overview Tab */}
                        {activeTab === "overview" && (
                            <div className="card shadow-sm mb-4">
                                <div className="card-header">
                                    <h5 className="mb-0">📊 Reports Overview</h5>
                                </div>
                                <div className="card-body">
                                    
                                    
                                    <h6 className="mt-4 mb-3">Critical Items Requiring Attention</h6>
                                    {dashboardData && dashboardData.critical_items && dashboardData.critical_items.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>SKU</th>
                                                        <th>Name</th>
                                                        <th className="text-end">Current Stock</th>
                                                        <th className="text-end">Safety Stock</th>
                                                        <th className="text-end">Days Until Stockout</th>
                                                        <th>Urgency</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {dashboardData.critical_items.map((item, idx) => (
                                                        <tr key={idx}>
                                                            <td className="fw-semibold">{item.sku}</td>
                                                            <td>{item.name}</td>
                                                            <td className="text-end">{item.quantity_on_hand}</td>
                                                            <td className="text-end">{item.safety_stock}</td>
                                                            <td className="text-end">{item.days_until_stockout}</td>
                                                            <td><span className="badge bg-danger">{item.urgency}</span></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="alert alert-success">
                                            ✅ No critical items. All inventory levels are healthy!
                                        </div>
                                    )}
                                    
                                    <div className="row mt-4">
                                        <div className="col-md-6">
                                            <div className="card bg-light">
                                                <div className="card-body">
                                                    <h6>📦 Inventory Status</h6>
                                                    <p className="small text-muted">View current stock levels, usage rates, and stockout predictions</p>
                                                    <button className="btn btn-sm btn-primary" onClick={() => setActiveTab("inventory")}>
                                                        View Report →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="card bg-light">
                                                <div className="card-body">
                                                    <h6>📅 Replenishment Schedule</h6>
                                                    <p className="small text-muted">See items needing reorder with priority levels</p>
                                                    <button className="btn btn-sm btn-primary" onClick={() => setActiveTab("replenishment")}>
                                                        View Report →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="row mt-3">
                                    </div>
                                    
                                    <div className="row mt-3">
                                        <div className="col-md-6">
                                            <div className="card bg-light">
                                                <div className="card-body">
                                                    <h6>📅 Materials Usage</h6>
                                                    <p className="small text-muted">View material usage for specific dates</p>
                                                    <button className="btn btn-sm btn-primary" onClick={() => setActiveTab("daily")}>
                                                        View Report →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="card bg-light">
                                                <div className="card-body">
                                                    <h6>📈 Consumption Trends</h6>
                                                    <p className="small text-muted">Track usage patterns over time</p>
                                                    <button className="btn btn-sm btn-primary" onClick={() => setActiveTab("trends")}>
                                                        View Report →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Inventory Status Tab - ENHANCED MINIMALIST DESIGN */}
                        {activeTab === "inventory" && (
                            inventoryReport ? (
                            <div>
                                {/* Simple Summary Cards */}
                                <div className="row mb-4">
                                    <div className="col-md-3">
                                        <div className="card border-0 shadow-sm h-100">
                                            <div className="card-body text-center">
                                                <div className="text-primary mb-2">
                                                    <i className="fas fa-boxes" style={{ fontSize: '2rem' }}></i>
                                                </div>
                                                <h3 className="text-primary mb-1">{inventoryReport.summary.total_items}</h3>
                                                <p className="text-muted small mb-0">Total Items</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card border-0 shadow-sm h-100">
                                            <div className="card-body text-center">
                                                <div className="text-warning mb-2">
                                                    <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem' }}></i>
                                                </div>
                                                <h3 className="text-warning mb-1">{inventoryReport.summary.items_needing_reorder}</h3>
                                                <p className="text-muted small mb-0">Need Reorder</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card border-0 shadow-sm h-100">
                                            <div className="card-body text-center">
                                                <div className="text-danger mb-2">
                                                    <i className="fas fa-exclamation-circle" style={{ fontSize: '2rem' }}></i>
                                                </div>
                                                <h3 className="text-danger mb-1">{inventoryReport.items.filter(i => i.stock_status === 'critical').length}</h3>
                                                <p className="text-muted small mb-0">Critical Items</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card border-0 shadow-sm h-100">
                                            <div className="card-body text-center">
                                                <div className="text-info mb-2">
                                                    <i className="fas fa-chart-bar" style={{ fontSize: '2rem' }}></i>
                                                </div>
                                                <h3 className="text-info mb-1">{inventoryReport.summary.total_usage}</h3>
                                                <p className="text-muted small mb-0">Total Usage</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Simple Material Filter Section */}
                                <div className="card border-0 shadow-sm mb-4">
                                    <div className="card-body">
                                        <div className="row align-items-center">
                                            <div className="col-md-6">
                                                <h6 className="mb-0">🔍 Material Filter</h6>
                                                <small className="text-muted">Filter materials by product type</small>
                                            </div>
                                            <div className="col-md-6">
                                                <div className="btn-group w-100" role="group">
                                                    <input 
                                                        type="radio" 
                                                        className="btn-check" 
                                                        name="materialFilter" 
                                                        id="all" 
                                                        checked={materialFilter === 'all'}
                                                        onChange={() => setMaterialFilter('all')}
                                                    />
                                                    <label className="btn btn-outline-primary" htmlFor="all">All Materials</label>
                                                    
                                                    <input 
                                                        type="radio" 
                                                        className="btn-check" 
                                                        name="materialFilter" 
                                                        id="alkansya" 
                                                        checked={materialFilter === 'alkansya'}
                                                        onChange={() => setMaterialFilter('alkansya')}
                                                    />
                                                    <label className="btn btn-outline-success" htmlFor="alkansya">Alkansya</label>
                                                    
                                                    <input 
                                                        type="radio" 
                                                        className="btn-check" 
                                                        name="materialFilter" 
                                                        id="dining-table" 
                                                        checked={materialFilter === 'dining-table'}
                                                        onChange={() => setMaterialFilter('dining-table')}
                                                    />
                                                    <label className="btn btn-outline-warning" htmlFor="dining-table">Dining Table</label>
                                                    
                                                    <input 
                                                        type="radio" 
                                                        className="btn-check" 
                                                        name="materialFilter" 
                                                        id="wooden-chair" 
                                                        checked={materialFilter === 'wooden-chair'}
                                                        onChange={() => setMaterialFilter('wooden-chair')}
                                                    />
                                                    <label className="btn btn-outline-info" htmlFor="wooden-chair">Wooden Chair</label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                    
                                {/* Enhanced Analytics Charts Section */}
                                <div className="row mb-4">
                                    {/* Stock Status Distribution - Enhanced */}
                                    <div className="col-md-6">
                                        <div className="card shadow-sm h-100">
                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                <h6 className="mb-0 fw-bold">📊 Stock Status Distribution</h6>
                                                <span className="badge bg-info">Analytics</span>
                                            </div>
                                            <div className="card-body">
                                        <ResponsiveContainer width="100%" height={450}>
                                            <PieChart>
                                                <Pie
                                                    data={(() => {
                                                        const normalCount = inventoryReport.items.filter(i => i.stock_status === 'normal').length;
                                                        const lowCount = inventoryReport.items.filter(i => i.stock_status === 'low').length;
                                                        const criticalCount = inventoryReport.items.filter(i => i.stock_status === 'critical').length;
                                                        const outOfStockCount = inventoryReport.items.filter(i => i.stock_status === 'out_of_stock').length;
                                                        const total = normalCount + lowCount + criticalCount + outOfStockCount;
                                                        
                                                        return [
                                                            {
                                                                name: 'Normal Stock',
                                                                value: normalCount,
                                                                color: '#28a745',
                                                                percentage: total > 0 ? ((normalCount / total) * 100).toFixed(1) : '0.0'
                                                            },
                                                            {
                                                                name: 'Low Stock',
                                                                value: lowCount,
                                                                color: '#ffc107',
                                                                percentage: total > 0 ? ((lowCount / total) * 100).toFixed(1) : '0.0'
                                                            },
                                                            {
                                                                name: 'Critical Stock',
                                                                value: criticalCount,
                                                                color: '#dc3545',
                                                                percentage: total > 0 ? ((criticalCount / total) * 100).toFixed(1) : '0.0'
                                                            },
                                                            {
                                                                name: 'Out of Stock',
                                                                value: outOfStockCount,
                                                                color: '#6c757d',
                                                                percentage: total > 0 ? ((outOfStockCount / total) * 100).toFixed(1) : '0.0'
                                                            },
                                                        ];
                                                    })()}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({ name, value, percentage }) => {
                                                                // Show labels for all slices with values > 0
                                                                if (value > 0) {
                                                                    // For large slices, show shorter labels to avoid overlap
                                                                    if (percentage > 50) {
                                                                        return `${name}\n${value} (${percentage}%)`;
                                                                    }
                                                                    return `${name}: ${value} (${percentage}%)`;
                                                                }
                                                                return '';
                                                            }}
                                                            outerRadius={70}
                                                            innerRadius={20}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                            stroke="#fff"
                                                            strokeWidth={3}
                                                        >
                                                            {inventoryReport.items.filter(i => i.stock_status === 'normal').length > 0 && <Cell fill="#28a745" />}
                                                            {inventoryReport.items.filter(i => i.stock_status === 'low').length > 0 && <Cell fill="#ffc107" />}
                                                            {inventoryReport.items.filter(i => i.stock_status === 'critical').length > 0 && <Cell fill="#dc3545" />}
                                                            {inventoryReport.items.filter(i => i.stock_status === 'out_of_stock').length > 0 && <Cell fill="#6c757d" />}
                                                </Pie>
                                                        <Tooltip 
                                                            formatter={(value, name, props) => [`${value} items (${props.payload.percentage}%)`, name]}
                                                            contentStyle={{
                                                                backgroundColor: '#f8f9fa',
                                                                border: '1px solid #dee2e6',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                                                                fontSize: '14px'
                                                            }}
                                                        />
                                                        <Legend 
                                                            verticalAlign="bottom" 
                                                            height={50}
                                                            iconType="circle"
                                                            wrapperStyle={{
                                                                paddingTop: '30px',
                                                                fontSize: '14px',
                                                                textAlign: 'center'
                                                            }}
                                                        />
                                            </PieChart>
                                        </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stock Level Analytics - ENHANCED */}
                                    <div className="col-md-6">
                                        <div className="card shadow-sm h-100 border-0" style={{ background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)' }}>
                                            <div className="card-header d-flex justify-content-between align-items-center border-0 pb-0" style={{ background: 'transparent' }}>
                                                <div>
                                                    <h6 className="mb-1 fw-bold text-dark">📈 Stock Level Analytics</h6>
                                                    <small className="text-muted">Material distribution across stock levels</small>
                                                </div>
                                                <span className="badge bg-primary px-3 py-2" style={{ borderRadius: '20px' }}>Trends</span>
                                            </div>
                                            <div className="card-body pt-2">
                                                <ResponsiveContainer width="100%" height={350}>
                                                    <BarChart 
                                                        data={(() => {
                                                            const normalCount = inventoryReport.items.filter(i => i.stock_status === 'normal').length;
                                                            const lowCount = inventoryReport.items.filter(i => i.stock_status === 'low').length;
                                                            const criticalCount = inventoryReport.items.filter(i => i.stock_status === 'critical').length;
                                                            const outOfStockCount = inventoryReport.items.filter(i => i.stock_status === 'out_of_stock').length;
                                                            
                                                            return [
                                                                { 
                                                                    category: normalCount > 0 ? `Normal Materials (${normalCount})` : 'Normal Materials (0)', 
                                                                    count: normalCount, 
                                                                    color: '#28a745',
                                                                    originalCategory: 'Normal'
                                                                },
                                                                { 
                                                                    category: lowCount > 0 ? `Low Materials (${lowCount})` : 'Low Materials (0)', 
                                                                    count: lowCount, 
                                                                    color: '#ffc107',
                                                                    originalCategory: 'Low'
                                                                },
                                                                { 
                                                                    category: criticalCount > 0 ? `Critical Materials (${criticalCount})` : 'Critical Materials (0)', 
                                                                    count: criticalCount, 
                                                                    color: '#dc3545',
                                                                    originalCategory: 'Critical'
                                                                },
                                                                { 
                                                                    category: outOfStockCount > 0 ? `Out of Stock Materials (${outOfStockCount})` : 'Out of Stock Materials (0)', 
                                                                    count: outOfStockCount, 
                                                                    color: '#6c757d',
                                                                    originalCategory: 'Out of Stock'
                                                                }
                                                            ];
                                                        })()}
                                                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                                    >
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#e8f4fd" />
                                                        <XAxis 
                                                            dataKey="category" 
                                                            angle={-25}
                                                            textAnchor="end"
                                                            height={80}
                                                            tick={{ fontSize: 11, fontWeight: 600, fill: '#495057' }}
                                                            stroke="#666"
                                                        />
                                                        <YAxis 
                                                            tick={{ fontSize: 12, fill: '#495057' }}
                                                            stroke="#666"
                                                            label={{ 
                                                                value: 'Material Count', 
                                                                angle: -90, 
                                                                position: 'insideLeft',
                                                                style: { textAnchor: 'middle', fontWeight: 600, fill: '#495057' }
                                                            }}
                                                        />
                                                        <Tooltip 
                                                            contentStyle={{
                                                                backgroundColor: '#fff',
                                                                border: '1px solid #dee2e6',
                                                                borderRadius: '12px',
                                                                boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                                                                fontSize: '13px'
                                                            }}
                                                            formatter={(value, name, props) => [
                                                                `${value} materials`,
                                                                props.payload.originalCategory
                                                            ]}
                                                            labelStyle={{ fontWeight: 600, color: '#495057' }}
                                                        />
                                                        <Bar 
                                                            dataKey="count" 
                                                            radius={[4, 4, 0, 0]}
                                                            stroke="#fff"
                                                            strokeWidth={1}
                                                        >
                                                            {inventoryReport.items.filter(i => i.stock_status === 'normal').length > 0 && <Cell fill="#28a745" />}
                                                            {inventoryReport.items.filter(i => i.stock_status === 'low').length > 0 && <Cell fill="#ffc107" />}
                                                            {inventoryReport.items.filter(i => i.stock_status === 'critical').length > 0 && <Cell fill="#dc3545" />}
                                                            {inventoryReport.items.filter(i => i.stock_status === 'out_of_stock').length > 0 && <Cell fill="#6c757d" />}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                                
                                                {/* Enhanced Summary Stats */}
                                                <div className="mt-3 pt-3 border-top">
                                                    <div className="row g-2">
                                                        {(() => {
                                                            const normalCount = inventoryReport.items.filter(i => i.stock_status === 'normal').length;
                                                            const lowCount = inventoryReport.items.filter(i => i.stock_status === 'low').length;
                                                            const criticalCount = inventoryReport.items.filter(i => i.stock_status === 'critical').length;
                                                            const outOfStockCount = inventoryReport.items.filter(i => i.stock_status === 'out_of_stock').length;
                                                            const total = normalCount + lowCount + criticalCount + outOfStockCount;
                                                            
                                                            return [
                                                                { 
                                                                    label: 'Normal Materials', 
                                                                    count: normalCount, 
                                                                    color: '#28a745', 
                                                                    percentage: total > 0 ? ((normalCount / total) * 100).toFixed(1) : '0.0',
                                                                    icon: '✅'
                                                                },
                                                                { 
                                                                    label: 'Low Materials', 
                                                                    count: lowCount, 
                                                                    color: '#ffc107', 
                                                                    percentage: total > 0 ? ((lowCount / total) * 100).toFixed(1) : '0.0',
                                                                    icon: '⚠️'
                                                                },
                                                                { 
                                                                    label: 'Critical Materials', 
                                                                    count: criticalCount, 
                                                                    color: '#dc3545', 
                                                                    percentage: total > 0 ? ((criticalCount / total) * 100).toFixed(1) : '0.0',
                                                                    icon: '🚨'
                                                                },
                                                                { 
                                                                    label: 'Out of Stock', 
                                                                    count: outOfStockCount, 
                                                                    color: '#6c757d', 
                                                                    percentage: total > 0 ? ((outOfStockCount / total) * 100).toFixed(1) : '0.0',
                                                                    icon: '❌'
                                                                }
                                                            ].map((item, index) => (
                                                                <div key={index} className="col-6">
                                                                    <div className="d-flex align-items-center p-2 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                                                                        <span className="me-2" style={{ fontSize: '16px' }}>{item.icon}</span>
                                                                        <div className="flex-grow-1">
                                                                            <div className="fw-semibold small" style={{ color: item.color }}>
                                                                                {item.count} {item.label}
                                                                            </div>
                                                                            <div className="text-muted small">{item.percentage}% of total</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Simple Inventory Table */}
                                <div className="card border-0 shadow-sm">
                                    <div className="card-header bg-white border-0 py-3">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h5 className="mb-1 fw-bold">📋 Inventory Status</h5>
                                                <small className="text-muted">
                                                    Real-time overview of all materials
                                                    {materialFilter !== 'all' && (
                                                        <span className="ms-2">
                                                            • Filtered by: <span className="badge bg-primary">{materialFilter.replace('-', ' ').toUpperCase()}</span>
                                                        </span>
                                                    )}
                                                </small>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <button className="btn btn-sm btn-outline-primary" onClick={() => exportReport("inventory_status", filterMaterials(inventoryReport.items))}>
                                                    📥 Export
                                                </button>
                                                <button className="btn btn-sm btn-outline-secondary">
                                                    📊 Analytics
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="card-body p-0">
                                        {/* Quick Stats Row */}
                                        <div className="row g-0 bg-light">
                                            <div className="col-md-3 text-center py-3">
                                                <div className="text-muted small">Filtered Items</div>
                                                <div className="h6 text-primary mb-0">{filterMaterials(inventoryReport.items).length}</div>
                                            </div>
                                            <div className="col-md-3 text-center py-3">
                                                <div className="text-muted small">Avg Days</div>
                                                <div className="h6 text-info mb-0">
                                                    {(() => {
                                                        const filteredItems = filterMaterials(inventoryReport.items);
                                                        const validItems = filteredItems.filter(item => item.days_until_stockout > 0);
                                                        return validItems.length > 0 ? 
                                                            Math.round(validItems.reduce((sum, item) => sum + item.days_until_stockout, 0) / validItems.length) :
                                                            'N/A';
                                                    })()}
                                                </div>
                                            </div>
                                            <div className="col-md-3 text-center py-3">
                                                <div className="text-muted small">High Usage</div>
                                                <div className="h6 text-warning mb-0">{filterMaterials(inventoryReport.items).filter(i => i.avg_daily_usage > 5).length}</div>
                                            </div>
                                            <div className="col-md-3 text-center py-3">
                                                <div className="text-muted small">Low Usage</div>
                                                <div className="h6 text-success mb-0">{filterMaterials(inventoryReport.items).filter(i => i.avg_daily_usage <= 1).length}</div>
                                            </div>
                                        </div>

                                        {/* Simple Table */}
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th className="border-0 py-3">SKU</th>
                                                        <th className="border-0 py-3">Material</th>
                                                        <th className="border-0 py-3 text-end">Stock</th>
                                                        <th className="border-0 py-3 text-end">Usage</th>
                                                        <th className="border-0 py-3 text-end">Days Left</th>
                                                        <th className="border-0 py-3 text-center">Status</th>
                                                        <th className="border-0 py-3 text-center">Analytics</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {filterMaterials(inventoryReport.items).map((item, idx) => {
                                                        const isCritical = item.days_until_stockout <= 7;
                                                        const isLow = item.days_until_stockout <= 14;
                                                        const needsReorder = item.will_need_reorder;
                                                        
                                                        return (
                                                            <tr key={idx} className={`${isCritical ? 'table-danger' : isLow ? 'table-warning' : ''}`}>
                                                                <td className="fw-semibold py-3">{item.sku}</td>
                                                                <td className="py-3">
                                                                    <div className="d-flex align-items-center">
                                                                        <span className="me-2">{item.name}</span>
                                                                        {isCritical && <span className="badge bg-danger">CRITICAL</span>}
                                                                    </div>
                                                                </td>
                                                                <td className="text-end fw-bold py-3">{item.current_stock}</td>
                                                                <td className="text-end py-3">{item.avg_daily_usage}</td>
                                                                <td className="text-end">
                                                                    <span className={`badge ${
                                                                        item.current_stock === 0 ? 'bg-danger' :
                                                                        isCritical ? 'bg-danger' :
                                                                        isLow ? 'bg-warning' : 'bg-success'
                                                                    }`}>
                                                                        {item.current_stock === 0 ? 'Out of Stock' :
                                                                         item.days_until_stockout === 0 ? '0 days' :
                                                                         item.days_until_stockout ? `${item.days_until_stockout} days` : 'N/A'}
                                                                    </span>
                                                                </td>
                                                                <td className="text-center py-3">
                                                                    <span className={`badge ${
                                                                        item.stock_status === 'critical' ? 'bg-danger' :
                                                                        item.stock_status === 'low' ? 'bg-warning' :
                                                                        item.stock_status === 'out_of_stock' ? 'bg-dark' : 'bg-success'
                                                                    }`}>
                                                                        {item.current_stock === 0 ? 'Out of Stock' :
                                                                         item.stock_status === 'critical' ? 'Critical' :
                                                                         item.stock_status === 'low' ? 'Low Stock' :
                                                                         item.stock_status === 'out_of_stock' ? 'Out of Stock' : 'Normal'}
                                                                    </span>
                                                                </td>
                                                                <td className="text-center">
                                                                    <div className="d-flex flex-column gap-1 align-items-center">
                                                                        <span className={`badge ${
                                                                            item.avg_daily_usage > 5 ? 'bg-primary' : 
                                                                            item.avg_daily_usage > 2 ? 'bg-info' : 'bg-secondary'
                                                                        }`}>
                                                                            {item.avg_daily_usage > 5 ? 'High Usage' : 
                                                                             item.avg_daily_usage > 2 ? 'Medium Usage' : 'Low Usage'}
                                                                        </span>
                                                                        {item.days_until_stockout <= 7 && (
                                                                            <span className="badge bg-danger">Urgent</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Analytics Insights */}
                                        <div className="mt-3 p-3 bg-light rounded">
                                            <h6 className="text-primary mb-2">📊 Analytics Insights</h6>
                                            <div className="row">
                                                <div className="col-md-4">
                                                    <div className="text-muted small">Low Stock Analysis</div>
                                                    <div className="text-warning fw-bold">
                                                        {inventoryReport.items.filter(i => i.stock_status === 'low').length} items need reorder attention
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="text-muted small">Usage Pattern</div>
                                                    <div className="text-info fw-bold">
                                                        {inventoryReport.items.filter(i => i.avg_daily_usage > 3).length} high-usage items identified
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="text-muted small">Reorder Efficiency</div>
                                                    <div className="text-success fw-bold">
                                                        {inventoryReport.items.filter(i => i.days_until_stockout > 30).length} items have good stock levels
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Analytics Type Alignment Section */}
                                        <div className="mt-3 p-3 bg-primary bg-opacity-10 rounded">
                                            <h6 className="text-primary mb-3">🎯 Analytics Type Alignment for Inventory Status</h6>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <div className="card border-0 bg-white">
                                                        <div className="card-body">
                                                            <h6 className="text-primary mb-2">📈 Descriptive Analytics</h6>
                                                            <ul className="list-unstyled small">
                                                                <li>✅ Current stock levels across all items</li>
                                                                <li>✅ Stock status distribution (Normal/Low/Critical/Out)</li>
                                                                <li>✅ Average daily usage patterns</li>
                                                                <li>✅ Days until stockout calculations</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="card border-0 bg-white">
                                                        <div className="card-body">
                                                            <h6 className="text-success mb-2">🔮 Predictive Analytics</h6>
                                                            <ul className="list-unstyled small">
                                                                <li>✅ Stockout prediction based on usage trends</li>
                                                                <li>✅ Reorder point recommendations</li>
                                                                <li>✅ Usage pattern forecasting</li>
                                                                <li>✅ Critical item identification</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="row mt-3">
                                                <div className="col-md-6">
                                                    <div className="card border-0 bg-white">
                                                        <div className="card-body">
                                                            <h6 className="text-warning mb-2">📊 Diagnostic Analytics</h6>
                                                            <ul className="list-unstyled small">
                                                                <li>✅ Root cause analysis for low stock</li>
                                                                <li>✅ Usage pattern analysis by item type</li>
                                                                <li>✅ Performance metrics evaluation</li>
                                                                <li>✅ Trend analysis and comparisons</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <div className="card border-0 bg-white">
                                                        <div className="card-body">
                                                            <h6 className="text-info mb-2">🎯 Prescriptive Analytics</h6>
                                                            <ul className="list-unstyled small">
                                                                <li>✅ Automated reorder recommendations</li>
                                                                <li>✅ Priority-based action items</li>
                                                                <li>✅ Optimal stock level suggestions</li>
                                                                <li>✅ Strategic inventory management insights</li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            ) : (
                                <div className="alert alert-warning">
                                    <strong>No Inventory Data Available</strong><br/>
                                    Please ensure the inventory usage seeder has been run.<br/>
                                    <button className="btn btn-sm btn-primary mt-2" onClick={fetchAllReports}>
                                        Reload Data
                                    </button>
                                </div>
                            )
                        )}
                        
                        {/* Replenishment Tab - ENHANCED VERSION */}
            {activeTab === "replenishment" && (
            replenishmentSchedule ? (
            <div>
        {/* Summary Cards */}
        <div className="row mb-4">
            <div className="col-md-3">
                <div className="card border-danger shadow-sm h-100">
                    <div className="card-body text-center">
                        <div className="text-danger mb-2">
                            <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <h3 className="text-danger mb-1">{replenishmentSchedule.summary.immediate_reorders}</h3>
                        <p className="text-muted small mb-0">Immediate Reorders</p>
                        <span className="badge bg-danger mt-2">Urgent Action Required</span>
                    </div>
                </div>
            </div>
            <div className="col-md-3">
                <div className="card border-warning shadow-sm h-100">
                    <div className="card-body text-center">
                        <div className="text-warning mb-2">
                            <i className="fas fa-clock" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <h3 className="text-warning mb-1">{replenishmentSchedule.summary.high_priority}</h3>
                        <p className="text-muted small mb-0">High Priority</p>
                        <span className="badge bg-warning text-dark mt-2">Within 7 Days</span>
                    </div>
                </div>
            </div>
            <div className="col-md-3">
                <div className="card border-info shadow-sm h-100">
                    <div className="card-body text-center">
                        <div className="text-info mb-2">
                            <i className="fas fa-calendar-check" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <h3 className="text-info mb-1">{replenishmentSchedule.summary.medium_priority}</h3>
                        <p className="text-muted small mb-0">Medium Priority</p>
                        <span className="badge bg-info mt-2">Within 14 Days</span>
                    </div>
                </div>
            </div>
            <div className="col-md-3">
                <div className="card border-success shadow-sm h-100">
                    <div className="card-body text-center">
                        <div className="text-success mb-2">
                            <i className="fas fa-peso-sign" style={{ fontSize: '2rem' }}></i>
                        </div>
                        <h3 className="text-success mb-1">{replenishmentSchedule.summary.total_reorder_value}</h3>
                        <p className="text-muted small mb-0">Total Reorder Value</p>
                        <span className="badge bg-success mt-2">Estimated Cost</span>
                    </div>
                </div>
            </div>
        </div>

                {/* Visual Analytics Row - ENHANCED */}
                <div className="row g-4 mb-4">
            {/* Priority Distribution Pie Chart */}
            <div className="col-lg-6">
                <div className="card shadow-sm h-100 border-0">
                    <div className="card-header bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <h5 className="mb-0 fw-bold d-flex align-items-center">
                            <i className="fas fa-chart-pie me-2"></i>
                            Priority Distribution
                        </h5>
                        <small className="text-white-50">Reorder urgency breakdown</small>
                    </div>
                    <div className="card-body d-flex flex-column">
                        {/* Legend with counts */}
                        <div className="row mb-3">
                            <div className="col-4 text-center">
                                <div className="p-2 rounded" style={{ backgroundColor: '#ffe5e5' }}>
                                    <div className="fw-bold text-danger" style={{ fontSize: '1.5rem' }}>
                                        {replenishmentSchedule.summary.immediate_reorders}
                                    </div>
                                    <small className="text-muted d-block">Immediate</small>
                                    <div className="mt-1">
                                        <span className="badge bg-danger">Urgent</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-4 text-center">
                                <div className="p-2 rounded" style={{ backgroundColor: '#fff8e1' }}>
                                    <div className="fw-bold text-warning" style={{ fontSize: '1.5rem' }}>
                                        {replenishmentSchedule.summary.high_priority}
                                    </div>
                                    <small className="text-muted d-block">High Priority</small>
                                    <div className="mt-1">
                                        <span className="badge bg-warning text-dark">≤7 Days</span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-4 text-center">
                                <div className="p-2 rounded" style={{ backgroundColor: '#e0f7fa' }}>
                                    <div className="fw-bold text-info" style={{ fontSize: '1.5rem' }}>
                                        {replenishmentSchedule.summary.medium_priority}
                                    </div>
                                    <small className="text-muted d-block">Medium</small>
                                    <div className="mt-1">
                                        <span className="badge bg-info">≤14 Days</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Pie Chart */}
                        <div className="flex-grow-1">
                            <ResponsiveContainer width="100%" height={280}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Immediate', value: replenishmentSchedule.summary.immediate_reorders, color: '#dc3545' },
                                            { name: 'High Priority', value: replenishmentSchedule.summary.high_priority, color: '#ffc107' },
                                            { name: 'Medium Priority', value: replenishmentSchedule.summary.medium_priority, color: '#17a2b8' }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                        outerRadius={90}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {[
                                            { name: 'Immediate', value: replenishmentSchedule.summary.immediate_reorders, color: '#dc3545' },
                                            { name: 'High Priority', value: replenishmentSchedule.summary.high_priority, color: '#ffc107' },
                                            { name: 'Medium Priority', value: replenishmentSchedule.summary.medium_priority, color: '#17a2b8' }
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '2px solid #667eea',
                                            borderRadius: '8px',
                                            padding: '10px'
                                        }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        formatter={(value, entry) => `${value}: ${entry.payload.value} items`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stock Levels Bar Chart */}
            <div className="col-lg-6">
                <div className="card shadow-sm h-100 border-0">
                    <div className="card-header bg-gradient text-white" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                        <h5 className="mb-0 fw-bold d-flex align-items-center">
                            <i className="fas fa-chart-bar me-2"></i>
                            Current Stock vs. Reorder Point
                        </h5>
                        <small className="text-white-50">Top 5 materials requiring attention</small>
                    </div>
                    <div className="card-body d-flex flex-column">
                        {/* Color Legend */}
                        <div className="d-flex justify-content-center gap-3 mb-3 flex-wrap">
                            <div className="d-flex align-items-center">
                                <div style={{ width: '20px', height: '20px', backgroundColor: '#17a2b8', borderRadius: '4px', marginRight: '8px' }}></div>
                                <small className="fw-semibold">Current Stock</small>
                            </div>
                            <div className="d-flex align-items-center">
                                <div style={{ width: '20px', height: '20px', backgroundColor: '#ffc107', borderRadius: '4px', marginRight: '8px' }}></div>
                                <small className="fw-semibold">Reorder Point</small>
                            </div>
                            <div className="d-flex align-items-center">
                                <div style={{ width: '20px', height: '20px', backgroundColor: '#28a745', borderRadius: '4px', marginRight: '8px' }}></div>
                                <small className="fw-semibold">Recommended Qty</small>
                            </div>
                        </div>
                        
                        {/* Bar Chart */}
                        <div className="flex-grow-1">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart 
                                    data={replenishmentSchedule.schedule?.slice(0, 5).map(item => ({
                                        name: item.sku,
                                        'Current Stock': item.current_stock,
                                        'Reorder Point': item.reorder_point,
                                        'Recommended Qty': item.recommended_order_qty
                                    }))}
                                    margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis 
                                        dataKey="name" 
                                        angle={-25} 
                                        textAnchor="end" 
                                        height={60}
                                        interval={0}
                                        tick={{ fontSize: 12, fontWeight: 600 }}
                                        stroke="#666"
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12 }}
                                        stroke="#666"
                                        label={{ value: 'Quantity', angle: -90, position: 'insideLeft', style: { fontWeight: 600 } }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            border: '2px solid #f5576c',
                                            borderRadius: '8px',
                                            padding: '10px'
                                        }}
                                        cursor={{ fill: 'rgba(245, 87, 108, 0.1)' }}
                                    />
                                    <Legend 
                                        wrapperStyle={{ paddingTop: '10px' }}
                                        iconType="rect"
                                    />
                                    <Bar dataKey="Current Stock" fill="#17a2b8" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="Reorder Point" fill="#ffc107" radius={[8, 8, 0, 0]} />
                                    <Bar dataKey="Recommended Qty" fill="#28a745" radius={[8, 8, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        
                        {/* Status indicator */}
                        <div className="alert alert-warning mb-0 mt-2 py-2" role="alert">
                            <small className="mb-0">
                                <i className="fas fa-info-circle me-2"></i>
                                <strong>Note:</strong> Materials shown have current stock below or near reorder point
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>

                {/* Detailed Replenishment Schedule - MINIMALIST DESIGN */}
                <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center py-3">
                <div>
                    <h5 className="mb-1 fw-bold text-dark">
                        <i className="fas fa-table me-2 text-primary"></i>
                        Detailed Replenishment Schedule
                    </h5>
                    <small className="text-muted">Materials requiring reorder with priority levels and accurate stock status</small>
                </div>
                <button 
                    className="btn btn-dark btn-sm" 
                    onClick={() => exportReport("replenishment_schedule", replenishmentSchedule.schedule)}
                >
                    Export CSV
                </button>
            </div>
            
            <div className="card-body p-0">
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.9rem' }}>
                        <thead style={{ backgroundColor: '#f8f9fa' }}>
                            <tr>
                                <th className="py-3 px-4 text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6c757d' }}>
                                    Priority
                                </th>
                                <th className="py-3 px-4 text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6c757d' }}>
                                    SKU
                                </th>
                                <th className="py-3 px-4 text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6c757d' }}>
                                    Material Name
                                </th>
                                <th className="py-3 px-4 text-center text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6c757d' }}>
                                    Current<br/>Stock
                                </th>
                                <th className="py-3 px-4 text-center text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6c757d' }}>
                                    Reorder<br/>Point
                                </th>
                                <th className="py-3 px-4 text-center text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6c757d', minWidth: '180px' }}>
                                    Stock Status
                                </th>
                                <th className="py-3 px-4 text-center text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6c757d' }}>
                                    Estimated<br/>Reorder Date
                                </th>
                                <th className="py-3 px-4 text-center text-uppercase fw-semibold" style={{ fontSize: '0.75rem', letterSpacing: '0.5px', color: '#6c757d' }}>
                                    Recommended<br/>Qty
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {replenishmentSchedule.schedule && replenishmentSchedule.schedule.length > 0 ? (
                                replenishmentSchedule.schedule.slice(0, 20).map((item, idx) => {
                                    // Calculate accurate stock percentage - CAPPED AT 100%
                                    const rawPercentage = (item.current_stock / item.reorder_point) * 100;
                                    const stockPercentage = Math.min(Math.max(rawPercentage, 0), 100);
                                    
                                    return (
                                        <tr 
                                            key={idx} 
                                            style={{ 
                                                backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafbfc',
                                                borderLeft: item.needs_immediate_reorder ? '3px solid #dc3545' : '3px solid transparent'
                                            }}
                                        >
                                            {/* Priority */}
                                            <td className="py-3 px-4">
                                                <span 
                                                    className="badge text-white" 
                                                    style={{ 
                                                        backgroundColor: PRIORITY_COLORS[item.priority] || '#6c757d',
                                                        fontSize: '0.7rem',
                                                        fontWeight: 600,
                                                        textTransform: 'lowercase',
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '4px'
                                                    }}
                                                >
                                                    {item.priority}
                                                </span>
                                            </td>
                                            
                                            {/* SKU */}
                                            <td className="py-3 px-4">
                                                <span className="font-monospace fw-semibold" style={{ fontSize: '0.85rem', color: '#495057' }}>
                                                    {item.sku}
                                                </span>
                                            </td>
                                            
                                            {/* Material Name */}
                                            <td className="py-3 px-4">
                                                <span style={{ color: '#212529' }}>
                                                    {item.name}
                                                </span>
                                            </td>
                                            
                                            {/* Current Stock */}
                                            <td className="py-3 px-4 text-center">
                                                <span 
                                                    className="fw-bold"
                                                    style={{ 
                                                        color: item.current_stock <= item.reorder_point ? '#dc3545' : '#28a745',
                                                        fontSize: '1rem'
                                                    }}
                                                >
                                                    {item.current_stock}
                                                </span>
                                            </td>
                                            
                                            {/* Reorder Point */}
                                            <td className="py-3 px-4 text-center">
                                                <span className="text-muted fw-semibold">
                                                    {item.reorder_point}
                                                </span>
                                            </td>
                                            
                                            {/* Stock Status - ACCURATE PERCENTAGE (MAX 100%) */}
                                            <td className="py-3 px-4">
                                                <div className="d-flex flex-column">
                                                    <div className="progress" style={{ height: '24px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                                                        <div 
                                                            className={`progress-bar ${
                                                                stockPercentage <= 30 ? 'bg-danger' :
                                                                stockPercentage <= 60 ? 'bg-warning' :
                                                                'bg-success'
                                                            }`}
                                                            role="progressbar" 
                                                            style={{ 
                                                                width: `${stockPercentage}%`,
                                                                fontSize: '0.75rem',
                                                                fontWeight: 600,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            aria-valuenow={stockPercentage} 
                                                            aria-valuemin="0" 
                                                            aria-valuemax="100"
                                                        >
                                                            {stockPercentage > 15 && `${stockPercentage.toFixed(0)}%`}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            
                                            {/* Estimated Reorder Date */}
                                            <td className="py-3 px-4 text-center">
                                                <span className="text-dark" style={{ fontSize: '0.85rem' }}>
                                                    {item.estimated_reorder_date}
                                                </span>
                                            </td>
                                            
                                            {/* Recommended Quantity */}
                                            <td className="py-3 px-4 text-center">
                                                <span className="badge bg-success text-white fw-bold" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                                                    {item.recommended_order_qty}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" className="text-center py-5">
                                        <div className="py-4">
                                            <i className="fas fa-check-circle text-success mb-3" style={{ fontSize: '3rem' }}></i>
                                            <h5 className="text-success fw-bold mb-2">All Stock Levels Are Healthy</h5>
                                            <p className="text-muted mb-0">No replenishment needed at this time.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Footer */}
                {replenishmentSchedule.schedule && replenishmentSchedule.schedule.length > 0 && (
                    <div className="border-top py-3 px-4 bg-light">
                        <div className="row align-items-center">
                            <div className="col-md-6">
                                <small className="text-muted">
                                    <strong>Status Guide:</strong>
                                    <span className="ms-3">
                                        <span className="badge bg-danger me-1" style={{ width: '12px', height: '12px', display: 'inline-block' }}></span>
                                        Critical (≤30%)
                                    </span>
                                    <span className="ms-2">
                                        <span className="badge bg-warning me-1" style={{ width: '12px', height: '12px', display: 'inline-block' }}></span>
                                        Low (31-60%)
                                    </span>
                                    <span className="ms-2">
                                        <span className="badge bg-success me-1" style={{ width: '12px', height: '12px', display: 'inline-block' }}></span>
                                        Healthy ({'>'}60%)
                                    </span>
                                </small>
                            </div>
                            <div className="col-md-6 text-end">
                                <small className="text-muted">
                                    Showing <strong>{Math.min(20, replenishmentSchedule.schedule.length)}</strong> of <strong>{replenishmentSchedule.schedule.length}</strong> items
                                </small>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="card shadow-sm border-info">
            <div className="card-header bg-info text-white">
                <h6 className="mb-0 fw-bold">
                    <i className="fas fa-lightbulb me-2"></i>Quick Actions & Recommendations
                </h6>
            </div>
            <div className="card-body">
                <div className="row">
                    <div className="col-md-6">
                        <h6 className="fw-bold">📋 Action Items:</h6>
                        <ul className="small mb-0">
                            <li>Review and approve {replenishmentSchedule.summary.immediate_reorders} immediate reorders</li>
                            <li>Contact suppliers for {replenishmentSchedule.summary.high_priority} high-priority items</li>
                            <li>Schedule orders for {replenishmentSchedule.summary.medium_priority} medium-priority materials</li>
                        </ul>
                    </div>
                    <div className="col-md-6">
                        <h6 className="fw-bold">💡 Best Practices:</h6>
                        <ul className="small mb-0">
                            <li>Order materials 1-2 weeks before reorder date</li>
                            <li>Consider bulk discounts for frequently used items</li>
                            <li>Maintain safety stock buffer of 20-30%</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
    ) : (
        <div className="alert alert-warning shadow-sm">
            <div className="d-flex align-items-center">
                <i className="fas fa-exclamation-triangle me-3" style={{ fontSize: '2rem' }}></i>
                <div>
                    <strong>No Replenishment Data Available</strong><br/>
                    <small>Data is being loaded or unavailable. Please refresh the page.</small>
                </div>
            </div>
        </div>
    )
)}
                        
                        {/* Material Forecasting Tab */}
                        {activeTab === "forecast" && (
                            forecastReport ? (
                            <div>
                                {/* Simple Summary Cards */}
                                <div className="row mb-4">
                                    <div className="col-md-3">
                                        <div className="card border-danger shadow-sm h-100">
                                            <div className="card-body text-center">
                                                <div className="text-danger mb-2">
                                                    <i className="fas fa-exclamation-triangle" style={{ fontSize: '2rem' }}></i>
                                                </div>
                                                <h3 className="text-danger mb-1">{forecastReport.summary.items_will_need_reorder}</h3>
                                                <p className="text-muted small mb-0">Items Need Reorder</p>
                                                <span className="badge bg-danger mt-2">Critical</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card border-warning shadow-sm h-100">
                                            <div className="card-body text-center">
                                                <div className="text-warning mb-2">
                                                    <i className="fas fa-clock" style={{ fontSize: '2rem' }}></i>
                                                </div>
                                                <h3 className="text-warning mb-1">{forecastReport.summary.items_critical}</h3>
                                                <p className="text-muted small mb-0">Critical Items</p>
                                                <span className="badge bg-warning text-dark mt-2">&lt; 7 days</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card border-info shadow-sm h-100">
                                            <div className="card-body text-center">
                                                <div className="text-info mb-2">
                                                    <i className="fas fa-chart-line" style={{ fontSize: '2rem' }}></i>
                                                </div>
                                                <h3 className="text-info mb-1">{forecastReport.summary.total_forecasted_usage.toLocaleString()}</h3>
                                                <p className="text-muted small mb-0">Forecasted Usage</p>
                                                <span className="badge bg-info mt-2">30 days</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="card border-success shadow-sm h-100">
                                            <div className="card-body text-center">
                                                <div className="text-success mb-2">
                                                    <i className="fas fa-check-circle" style={{ fontSize: '2rem' }}></i>
                                                </div>
                                                <h3 className="text-success mb-1">
                                                    {forecastReport.forecasts.filter(f => !f.will_need_reorder).length}
                                                </h3>
                                                <p className="text-muted small mb-0">Items Safe</p>
                                                <span className="badge bg-success mt-2">No Action</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Simple Data Table */}
                                <div className="card shadow-sm">
                                    <div className="card-header d-flex justify-content-between align-items-center">
                                        <h5 className="mb-0">Material Forecast Analysis</h5>
                                        <div className="d-flex gap-2">
                                            <select 
                                                className="form-select form-select-sm" 
                                                style={{ width: 120 }} 
                                                value={30} 
                                                onChange={(e) => console.log('Forecast days changed:', e.target.value)}
                                            >
                                                <option value={7}>7 days</option>
                                                <option value={14}>14 days</option>
                                                <option value={30}>30 days</option>
                                                <option value={60}>60 days</option>
                                                <option value={90}>90 days</option>
                                            </select>
                                            <button className="btn btn-sm btn-outline-primary" onClick={() => exportReport("material_forecast", forecastReport.forecasts)}>
                                                📊 Export
                                            </button>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <div className="table-responsive">
                                            <table className="table table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>SKU</th>
                                                        <th>Material</th>
                                                        <th className="text-end">Current</th>
                                                        <th className="text-end">Daily Avg</th>
                                                        <th className="text-end">Forecasted</th>
                                                        <th className="text-end">Projected</th>
                                                        <th className="text-end">Days Left</th>
                                                        <th className="text-end">Order Qty</th>
                                                        <th className="text-center">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {forecastReport.forecasts && forecastReport.forecasts.length > 0 ? (
                                                        forecastReport.forecasts.slice(0, 20).map((item, idx) => {
                                                            const isCritical = item.days_until_stockout < 7;
                                                            const needsReorder = item.will_need_reorder;
                                                            const statusColor = isCritical ? 'danger' : needsReorder ? 'warning' : 'success';
                                                            const statusIcon = isCritical ? '🚨' : needsReorder ? '⚠️' : '✅';
                                                            
                                                            return (
                                                                <tr key={idx} className={`${isCritical ? 'table-danger' : needsReorder ? 'table-warning' : ''}`}>
                                                                    <td className="fw-semibold">{item.sku}</td>
                                                                    <td>
                                                                        <div className="d-flex align-items-center">
                                                                            <span className="me-2">{item.name}</span>
                                                                            {isCritical && <span className="badge bg-danger">CRITICAL</span>}
                                                                        </div>
                                                                    </td>
                                                                    <td className="text-end fw-bold">{item.current_stock}</td>
                                                                    <td className="text-end">{item.avg_daily_usage}</td>
                                                                    <td className="text-end">{item['forecasted_usage_30_days']}</td>
                                                                    <td className="text-end">
                                                                        <span className={`fw-bold ${item.projected_stock < 0 ? 'text-danger' : 'text-warning'}`}>
                                                                            {item.projected_stock}
                                                                        </span>
                                                                    </td>
                                                                    <td className="text-end">
                                                                        <span className={`badge bg-${statusColor}`}>
                                                                            {item.days_until_stockout} days
                                                                        </span>
                                                                    </td>
                                                                    <td className="text-end">
                                                                        {item.recommended_order_qty > 0 && (
                                                                            <span className="badge bg-primary">
                                                                                {item.recommended_order_qty}
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <span className="fs-5">{statusIcon}</span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="9" className="text-center text-muted">No forecast data available.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            ) : (
                                <div className="alert alert-warning">
                                    <strong>No Forecast Data Available</strong><br/>
                                    Data is being loaded or unavailable.
                                </div>
                            )
                        )}
                
                        {/* Consumption Trends Tab */}
                        {activeTab === "trends" && (
                            consumptionTrends ? (
                    <div className="card shadow-sm mb-4">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Consumption Trends</h5>
                            <button className="btn btn-sm btn-outline-primary" onClick={() => exportReport("consumption_trends", Object.values(consumptionTrends.trends))}>
                                📥 Export CSV
                            </button>
                        </div>
                        <div className="card-body">
                            <div className="alert alert-info">
                                <strong>Trend Analysis:</strong> Positive trend = increasing usage, Negative trend = decreasing usage
                            </div>
                            
                            <div className="mb-4">
                                <h6>Average Daily Usage Trends</h6>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={Object.values(consumptionTrends.trends).slice(0, 15)}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="sku" angle={-45} textAnchor="end" height={100} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="avg_daily_usage" stroke="#8884d8" name="Avg Daily Usage" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            
                            <div className="table-responsive">
                                <table className="table table-sm table-hover">
                                    <thead>
                                        <tr>
                                            <th>SKU</th>
                                            <th>Item Name</th>
                                            <th className="text-end">Avg Daily Usage</th>
                                            <th className="text-end">Total Usage</th>
                                            <th className="text-end">Trend</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.values(consumptionTrends.trends).slice(0, 20).map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="fw-semibold">{item.sku}</td>
                                                <td>{item.item_name}</td>
                                                <td className="text-end">{item.avg_daily_usage}</td>
                                                <td className="text-end">{item.total_usage_period}</td>
                                                <td className="text-end">
                                                    <span className={`badge ${
                                                        item.trend > 0 ? 'bg-warning' : 
                                                        item.trend < 0 ? 'bg-info' : 'bg-secondary'
                                                    }`}>
                                                        {item.trend > 0 ? '↑' : item.trend < 0 ? '↓' : '→'} {item.trend}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                            ) : (
                                <div className="alert alert-warning">
                                    <strong>No Trends Data Available</strong><br/>
                                    Data is being loaded or unavailable.
                                </div>
                            )
                        )}
                
                        
                        {/* Stock Report Tab - Inventory */}
                        {activeTab === "stock-report" && mainTab === "inventory" && stockReport && (
                            <div className="card shadow-sm mb-4">
                                <div className="card-header bg-white border-bottom">
                                    <h5 className="mb-1 fw-bold">Automated Stock Report</h5>
                                    <small className="text-muted">Generated: {stockReport.generated_at}</small>
                                </div>
                                <div className="card-body">
                                    {/* Summary Cards */}
                                    <div className="row mb-4">
                                        <div className="col-md-4">
                                            <div className="card border-danger border-3">
                                                <div className="card-body text-center">
                                                    <h2 className="text-danger mb-0">{stockReport.summary.critical_items}</h2>
                                                    <p className="text-muted mb-0">Critical Items</p>
                                                    <small className="text-danger">Immediate action required</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="card border-warning border-3">
                                                <div className="card-body text-center">
                                                    <h2 className="text-warning mb-0">{stockReport.summary.low_stock_items}</h2>
                                                    <p className="text-muted mb-0">Low Stock Items</p>
                                                    <small className="text-warning">Monitor closely</small>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="card border-success border-3">
                                                <div className="card-body text-center">
                                                    <h2 className="text-success mb-0">{stockReport.summary.healthy_items}</h2>
                                                    <p className="text-muted mb-0">Healthy Items</p>
                                                    <small className="text-success">Stock levels good</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Critical Items Table */}
                                    {stockReport.items_by_status.critical.length > 0 && (
                                        <div className="mb-4">
                                            <h6 className="fw-bold text-danger mb-3">
                                                <i className="fas fa-exclamation-circle me-2"></i>
                                                Critical Stock Items - Immediate Action Required
                                            </h6>
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead className="table-danger">
                                                        <tr>
                                                            <th>Material</th>
                                                            <th>SKU</th>
                                                            <th className="text-end">Current Stock</th>
                                                            <th className="text-end">Safety Stock</th>
                                                            <th className="text-end">Daily Usage</th>
                                                            <th className="text-end">Days Left</th>
                                                            <th>Depletion Date</th>
                                                            <th className="text-end">Reorder Qty</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {stockReport.items_by_status.critical.map((item, idx) => (
                                                            <tr key={idx} className="table-danger">
                                                                <td className="fw-bold">{item.material}</td>
                                                                <td><code>{item.sku}</code></td>
                                                                <td className="text-end">{item.current_stock} {item.unit}</td>
                                                                <td className="text-end">{item.safety_stock}</td>
                                                                <td className="text-end">{item.daily_usage_rate}</td>
                                                                <td className="text-end">
                                                                    <span className="badge bg-danger">{item.days_until_depletion}</span>
                                                                </td>
                                                                <td>{item.predicted_depletion_date}</td>
                                                                <td className="text-end fw-bold text-danger">
                                                                    {item.suggested_reorder_qty} {item.unit}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Low Stock Items */}
                                    {stockReport.items_by_status.low.length > 0 && (
                                        <div>
                                            <h6 className="fw-bold text-warning mb-3">Low Stock Items - Monitor Closely</h6>
                                            <div className="table-responsive">
                                                <table className="table table-sm table-hover">
                                                    <thead className="table-warning">
                                                        <tr>
                                                            <th>Material</th>
                                                            <th className="text-end">Current Stock</th>
                                                            <th className="text-end">Days Left</th>
                                                            <th className="text-end">Reorder Qty</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {stockReport.items_by_status.low.slice(0, 10).map((item, idx) => (
                                                            <tr key={idx} className="table-warning">
                                                                <td>{item.material}</td>
                                                                <td className="text-end">{item.current_stock} {item.unit}</td>
                                                                <td className="text-end">
                                                                    <span className="badge bg-warning">{item.days_until_depletion}</span>
                                                                </td>
                                                                <td className="text-end fw-bold">{item.suggested_reorder_qty}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Material Usage Tab - Inventory */}
                        {activeTab === "material-usage" && mainTab === "inventory" && (
                            resourceUtilization && resourceUtilization.material_usage_by_product ? (
                            <div>
                                {/* Summary Cards */}
                                <div className="row g-3 mb-4">
                                    {resourceUtilization.material_usage_by_product.map((product, idx) => (
                                        <div key={idx} className="col-md-4">
                                            <div className="card border-0 shadow-sm h-100" style={{ 
                                                borderLeft: `4px solid ${idx === 0 ? '#8b5e34' : idx === 1 ? '#d4a574' : '#17a2b8'}` 
                                            }}>
                                                <div className="card-body">
                                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                                        <h6 className="mb-0 fw-bold">{product.product}</h6>
                                                        <span className="badge" style={{ 
                                                            backgroundColor: idx === 0 ? '#fff3e0' : idx === 1 ? '#f3e5f5' : '#e8f5e9',
                                                            color: idx === 0 ? '#8b5e34' : idx === 1 ? '#d4a574' : '#17a2b8'
                                                        }}>
                                                            {product.total_materials} materials
                                                        </span>
                                                    </div>
                                                    <div className="mt-3">
                                                        <div className="text-muted small mb-1">Total Materials Used</div>
                                                        <h4 className="mb-0" style={{ color: idx === 0 ? '#8b5e34' : idx === 1 ? '#d4a574' : '#17a2b8' }}>
                                                            {product.materials.reduce((sum, m) => sum + parseFloat(m.total_used || 0), 0).toFixed(2)}
                                                        </h4>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Material Usage Overview - Horizontal Bar Chart */}
                                <div className="card shadow-sm mb-4">
                                    <div className="card-header bg-white text-dark border-bottom">
                                        <div className="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h5 className="mb-1 fw-bold">Top Materials Usage Across All Products</h5>
                                                <p className="mb-0 text-muted">Total consumption by material type</p>
                                            </div>
                                            <button className="btn btn-sm btn-outline-primary" onClick={() => exportReport("material_usage", resourceUtilization.material_usage_by_product)}>
                                                📊 Export Data
                                            </button>
                                        </div>
                                    </div>
                                    <div className="card-body">
                                        <ResponsiveContainer width="100%" height={400}>
                                            <BarChart 
                                                layout="vertical"
                                                data={(() => {
                                                    const materialTotals = {};
                                                    resourceUtilization.material_usage_by_product.forEach(product => {
                                                        product.materials.forEach(mat => {
                                                            const key = mat.material;
                                                            if (!materialTotals[key]) {
                                                                materialTotals[key] = {
                                                                    material: key,
                                                                    total: 0,
                                                                    unit: mat.unit
                                                                };
                                                            }
                                                            materialTotals[key].total += parseFloat(mat.total_used || 0);
                                                        });
                                                    });
                                                    return Object.values(materialTotals)
                                                        .sort((a, b) => b.total - a.total)
                                                        .slice(0, 8);
                                                })()}
                                                margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" />
                                                <YAxis dataKey="material" type="category" width={110} />
                                                <Tooltip 
                                                    formatter={(value, name, props) => [
                                                        `${value.toFixed(2)} ${props.payload.unit}`,
                                                        'Total Used'
                                                    ]}
                                                />
                                                <Bar dataKey="total" fill="#0d6efd" name="Total Usage">
                                                    {(() => {
                                                        const materialTotals = {};
                                                        resourceUtilization.material_usage_by_product.forEach(product => {
                                                            product.materials.forEach(mat => {
                                                                const key = mat.material;
                                                                if (!materialTotals[key]) {
                                                                    materialTotals[key] = { material: key, total: 0, unit: mat.unit };
                                                                }
                                                                materialTotals[key].total += parseFloat(mat.total_used || 0);
                                                            });
                                                        });
                                                        return Object.values(materialTotals)
                                                            .sort((a, b) => b.total - a.total)
                                                            .slice(0, 8)
                                                            .map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ));
                                                    })()}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Product Comparison - Grouped Bar Chart */}
                                <div className="card shadow-sm mb-4">
                                    <div className="card-header bg-white border-bottom">
                                        <h5 className="mb-1 fw-bold">Material Usage Comparison by Product</h5>
                                        <small className="text-muted">Side-by-side comparison of top materials</small>
                                    </div>
                                    <div className="card-body">
                                        <ResponsiveContainer width="100%" height={350}>
                                            <BarChart 
                                                data={(() => {
                                                    // Get all unique materials
                                                    const allMaterials = new Set();
                                                    resourceUtilization.material_usage_by_product.forEach(product => {
                                                        product.materials.slice(0, 5).forEach(mat => allMaterials.add(mat.material));
                                                    });
                                                    
                                                    // Create data structure
                                                    return Array.from(allMaterials).map(material => {
                                                        const dataPoint = { material };
                                                        resourceUtilization.material_usage_by_product.forEach(product => {
                                                            const mat = product.materials.find(m => m.material === material);
                                                            dataPoint[product.product] = mat ? parseFloat(mat.total_used || 0) : 0;
                                                        });
                                                        return dataPoint;
                                                    }).slice(0, 6);
                                                })()}
                                                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis 
                                                    dataKey="material" 
                                                    angle={-35} 
                                                    textAnchor="end" 
                                                    height={80}
                                                    interval={0}
                                                />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                                <Bar dataKey="Dining Table" fill="#8b5e34" name="Dining Table" />
                                                <Bar dataKey="Wooden Chair" fill="#d4a574" name="Wooden Chair" />
                                                <Bar dataKey="Alkansya" fill="#17a2b8" name="Alkansya" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Detailed Material Usage by Product */}
                                <div className="row g-4">
                                    {resourceUtilization.material_usage_by_product.map((product, idx) => (
                                        <div key={idx} className="col-lg-4">
                                            <div className="card shadow-sm h-100">
                                                <div className="card-header" style={{ 
                                                    backgroundColor: idx === 0 ? '#fff3e0' : idx === 1 ? '#f3e5f5' : '#e8f5e9',
                                                    borderBottom: `3px solid ${idx === 0 ? '#8b5e34' : idx === 1 ? '#d4a574' : '#17a2b8'}`
                                                }}>
                                                    <h6 className="mb-0 fw-bold" style={{ color: idx === 0 ? '#8b5e34' : idx === 1 ? '#d4a574' : '#17a2b8' }}>
                                                        {product.product}
                                                    </h6>
                                                    <small className="text-muted">{product.total_materials} materials tracked</small>
                                                </div>
                                                <div className="card-body p-0">
                                                    {/* Pie Chart for Material Distribution */}
                                                    <div className="p-3 bg-light">
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <PieChart>
                                                                <Pie
                                                                    data={product.materials.map(mat => ({
                                                                        name: mat.material,
                                                                        value: parseFloat(mat.total_used || 0)
                                                                    }))}
                                                                    cx="50%"
                                                                    cy="40%"
                                                                    labelLine={false}
                                                                    label={false}
                                                                    outerRadius={70}
                                                                    fill="#8884d8"
                                                                    dataKey="value"
                                                                >
                                                                    {product.materials.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip 
                                                                    formatter={(value, name) => [
                                                                        `${value.toFixed(2)} units`,
                                                                        name
                                                                    ]}
                                                                />
                                                                <Legend 
                                                                    verticalAlign="bottom" 
                                                                    height={80}
                                                                    wrapperStyle={{ 
                                                                        paddingTop: '10px',
                                                                        fontSize: '11px',
                                                                        lineHeight: '1.2'
                                                                    }}
                                                                    iconSize={8}
                                                                    formatter={(value, entry) => {
                                                                        const percent = ((entry.payload.value / product.materials.reduce((sum, m) => sum + parseFloat(m.total_used || 0), 0)) * 100).toFixed(0);
                                                                        return `${value.substring(0, 20)}${value.length > 20 ? '...' : ''} (${percent}%)`;
                                                                    }}
                                                                />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                    
                                                    {/* Material List */}
                                                    <div className="table-responsive">
                                                        <table className="table table-sm table-hover mb-0">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th className="small">Material</th>
                                                                    <th className="text-end small">Used</th>
                                                                    <th className="text-end small">Avg</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {product.materials.map((mat, midx) => (
                                                                    <tr key={midx}>
                                                                        <td className="small">
                                                                            <span className="badge me-1" style={{ 
                                                                                backgroundColor: COLORS[midx % COLORS.length],
                                                                                width: '8px',
                                                                                height: '8px',
                                                                                borderRadius: '50%',
                                                                                display: 'inline-block'
                                                                            }}></span>
                                                                            {mat.material}
                                                                        </td>
                                                                        <td className="text-end small fw-bold">
                                                                            {parseFloat(mat.total_used || 0).toFixed(2)} {mat.unit}
                                                                        </td>
                                                                        <td className="text-end small text-muted">
                                                                            {parseFloat(mat.avg_used || 0).toFixed(2)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            ) : (
                                <div className="alert alert-warning">
                                    <h5 className="alert-heading">📊 Material Usage Data Not Available</h5>
                                    {!resourceUtilization ? (
                                        <p>Loading resource utilization data...</p>
                                    ) : (
                                        <>
                                            <p>No material usage data found for the selected period.</p>
                                            <hr/>
                                            <p className="mb-0"><strong>Possible reasons:</strong></p>
                                            <ul className="mb-0">
                                                <li>Database hasn't been seeded with inventory usage data</li>
                                                <li>No production orders have been processed yet</li>
                                                <li>The selected date range has no data</li>
                                            </ul>
                                            <hr/>
                                            <p className="mb-0"><strong>To fix:</strong> Run <code>php artisan db:seed</code> in the backend</p>
                                        </>
                                    )}
                                </div>
                            )
                        )}
                        
                        {/* Production Reports Content */}
                        {mainTab === "production" && (
                            <div>
                                {/* Capacity Utilization Tab */}
                                {activeTab === "capacity" && productionPerformance && productionPerformance.capacity_utilization && (
                                    <div className="row g-4">
                                        <div className="col-lg-12">
                                            <div className="card shadow-sm">
                                                <div className="card-header bg-white border-bottom">
                                                    <h5 className="mb-0 fw-bold">📊 Capacity Utilization Overview</h5>
                                                </div>
                                                <div className="card-body">
                                                    <div className="row">
                                                        <div className="col-md-4">
                                                            <div className="card bg-light mb-3">
                                                                <div className="card-body text-center">
                                                                    <h2 className="text-primary mb-1">{productionPerformance.capacity_utilization.total_capacity}</h2>
                                                                    <p className="text-muted small mb-0">Total Capacity</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <div className="card bg-light mb-3">
                                                                <div className="card-body text-center">
                                                                    <h2 className="text-warning mb-1">{productionPerformance.capacity_utilization.current_utilization}</h2>
                                                                    <p className="text-muted small mb-0">Current Utilization</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="col-md-4">
                                                            <div className="card bg-light mb-3">
                                                                <div className="card-body text-center">
                                                                    <h2 className="text-success mb-1">{productionPerformance.capacity_utilization.utilization_percentage}%</h2>
                                                                    <p className="text-muted small mb-0">Utilization Rate</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="mt-4">
                                                        <div className="d-flex justify-content-between mb-2">
                                                            <span className="fw-bold">Overall Capacity Utilization</span>
                                                            <span className="text-primary fw-bold">{productionPerformance.capacity_utilization.utilization_percentage}%</span>
                                                        </div>
                                                        <div className="progress" style={{ height: '35px' }}>
                                                            <div 
                                                                className={`progress-bar ${
                                                                    productionPerformance.capacity_utilization.utilization_percentage > 90 ? 'bg-danger' :
                                                                    productionPerformance.capacity_utilization.utilization_percentage > 70 ? 'bg-warning' : 'bg-success'
                                                                }`}
                                                                style={{ width: `${productionPerformance.capacity_utilization.utilization_percentage}%` }}
                                                            >
                                                                {productionPerformance.capacity_utilization.utilization_percentage}%
                                                            </div>
                                                        </div>
                                                        <small className="text-muted mt-2 d-block">
                                                            {productionPerformance.capacity_utilization.utilization_percentage > 90 ? '⚠️ Capacity overloaded - consider resource reallocation' :
                                                             productionPerformance.capacity_utilization.utilization_percentage > 70 ? '⚡ Operating at high capacity' :
                                                             '✅ Capacity available for new orders'}
                                                        </small>
                                                    </div>
                                                    
                                                    {/* Resource Allocation Alerts */}
                                                    {productionPerformance.resource_allocation && productionPerformance.resource_allocation.length > 0 && (
                                                        <div className="mt-4">
                                                            <h6 className="fw-bold mb-3">⚠️ Resource Allocation Alerts</h6>
                                                            {productionPerformance.resource_allocation.map((alert, idx) => (
                                                                <div key={idx} className="alert alert-warning mb-2">
                                                                    <strong>{alert.stage}</strong>: {alert.message}
                                                                    <br />
                                                                    <small>Workload: {alert.workload} items | Priority: {alert.priority}</small>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Output Analytics Tab - NEW */}
                                {activeTab === "output-analytics" && productionOutput && (
                                    <div>
                                        {/* Production Summary Cards */}
                                        {mainTab === "production" && productionAnalytics && productionAnalytics.kpis && (
                                            <div className="row g-3 mb-4">
                                                <div className="col-md-3">
                                                    <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #0d6efd' }}>
                                                        <div className="card-body">
                                                            <div className="text-muted small mb-1">Total Productions</div>
                                                            <div className="h3 mb-0 text-primary">{productionAnalytics.kpis.total || 0}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #28a745' }}>
                                                        <div className="card-body">
                                                            <div className="text-muted small mb-1">Completed</div>
                                                            <div className="h3 mb-0 text-success">{productionAnalytics.kpis.completed || 0}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #ffc107' }}>
                                                        <div className="card-body">
                                                            <div className="text-muted small mb-1">In Progress</div>
                                                            <div className="h3 mb-0 text-warning">{productionAnalytics.kpis.in_progress || 0}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="card shadow-sm border-0" style={{ borderLeft: '4px solid #dc3545' }}>
                                                        <div className="card-body">
                                                            <div className="text-muted small mb-1">On Hold</div>
                                                            <div className="h3 mb-0 text-danger">{productionAnalytics.kpis.hold || 0}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="card shadow-sm mb-4">
                                        <div className="card-header bg-white border-bottom">
                                            <h5 className="mb-0 fw-bold">📈 Production Output by Product</h5>
                                        </div>
                                        <div className="card-body">
                                            {/* Summary Cards */}
                                            <div className="row mb-4">
                                                <div className="col-md-4">
                                                    <div className="card" style={{ backgroundColor: '#fff3e0', border: 'none' }}>
                                                        <div className="card-body text-center">
                                                            <h6 className="text-muted mb-2">🪑 Dining Table</h6>
                                                            <h2 className="mb-1" style={{ color: '#8b5e34' }}>{productionOutput.products.table.totals.total_output}</h2>
                                                            <small className="text-muted">Avg: {productionOutput.products.table.totals.avg_per_period} per period</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="card" style={{ backgroundColor: '#f3e5f5', border: 'none' }}>
                                                        <div className="card-body text-center">
                                                            <h6 className="text-muted mb-2">🪑 Wooden Chair</h6>
                                                            <h2 className="mb-1" style={{ color: '#d4a574' }}>{productionOutput.products.chair.totals.total_output}</h2>
                                                            <small className="text-muted">Avg: {productionOutput.products.chair.totals.avg_per_period} per period</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="card" style={{ backgroundColor: '#e8f5e9', border: 'none' }}>
                                                        <div className="card-body text-center">
                                                            <h6 className="text-muted mb-2">🐷 Alkansya</h6>
                                                            <h2 className="mb-1" style={{ color: '#17a2b8' }}>{productionOutput.products.alkansya.totals.total_output}</h2>
                                                            <small className="text-muted">Avg: {productionOutput.products.alkansya.totals.avg_per_period} per period</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Top Performing Products */}
                                            <div className="card bg-light mb-4">
                                                <div className="card-body">
                                                    <h6 className="fw-bold mb-3">🏆 Top Performing Products</h6>
                                                    {productionOutput.top_performing.map((product, idx) => (
                                                        <div key={idx} className="mb-3">
                                                            <div className="d-flex justify-content-between align-items-center mb-1">
                                                                <span className="fw-bold">{product.product}</span>
                                                                <span className="badge bg-success">{product.output} units</span>
                                                            </div>
                                                            <div className="progress" style={{ height: '10px' }}>
                                                                <div
                                                                    className="progress-bar"
                                                                    style={{ 
                                                                        width: `${Number(product.efficiency).toFixed(2)}%`,
                                                                        backgroundColor: idx === 0 ? '#28a745' : idx === 1 ? '#17a2b8' : '#6c757d'
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <small className="text-muted">{Number(product.efficiency).toFixed(2)}% efficiency</small>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            
                                        {/* Line Chart - Production Trends - ENHANCED VERSION */}
<h6 className="fw-bold mb-3">📊 Production Output Trends</h6>
<p className="text-muted small mb-3">
    Comparison of production patterns: Regular manufacturing vs. Made-to-order fulfillment
</p>

{/* Enhanced Alert with Clear Analytics */}
<div className="alert alert-info mb-3">
    <strong>📊 Understanding the Data:</strong>
    <div className="row mt-2">
        <div className="col-md-6">
            <strong className="text-info">🐷 Alkansya (Regular Production)</strong>
            <ul className="small mb-0 mt-1">
                <li>Manufactured daily (Mon-Sat)</li>
                <li>~78 production days over 3 months</li>
                <li>Output: 25-50 units/day</li>
                <li><strong>Total: {productionOutput.products.alkansya.totals.total_output} units</strong></li>
            </ul>
        </div>
        <div className="col-md-6">
            <strong style={{ color: '#8b5e34' }}>🪑 Tables & Chairs (Made-to-Order)</strong>
            <ul className="small mb-0 mt-1">
                <li>Produced only when customer orders</li>
                <li>Sparse data points (not daily)</li>
                <li>Tables: {productionOutput.products.table.totals.total_output} unit(s)</li>
                <li>Chairs: {productionOutput.products.chair.totals.total_output} unit(s)</li>
            </ul>
        </div>
    </div>
    <div className="alert alert-warning mt-2 mb-0 small">
        <strong>💡 Note:</strong> Tables and Chairs appear as individual points because they're made-to-order products. 
        Alkansya shows a continuous trend because it's manufactured daily.
    </div>
</div>

{/* Summary Cards Before Chart */}
<div className="row mb-3">
    <div className="col-md-4">
        <div className="card border-info">
            <div className="card-body text-center">
                <h6 className="text-info mb-1">🐷 Alkansya</h6>
                <h4 className="mb-0">{productionOutput.products.alkansya.totals.total_output}</h4>
                <small className="text-muted">units | {productionOutput.products.alkansya.totals.total_productions} production days</small>
                <div className="mt-2">
                    <span className="badge bg-info">Regular Production</span>
                </div>
            </div>
        </div>
    </div>
    <div className="col-md-4">
        <div className="card border-secondary">
            <div className="card-body text-center">
                <h6 className="text-secondary mb-1">🪑 Dining Table</h6>
                <h4 className="mb-0">{productionOutput.products.table.totals.total_output}</h4>
                <small className="text-muted">unit(s) | {productionOutput.products.table.totals.total_productions} order(s)</small>
                <div className="mt-2">
                    <span className="badge bg-secondary">Made-to-Order</span>
                </div>
            </div>
        </div>
    </div>
    <div className="col-md-4">
        <div className="card border-warning">
            <div className="card-body text-center">
                <h6 className="text-warning mb-1">🪑 Wooden Chair</h6>
                <h4 className="mb-0">{productionOutput.products.chair.totals.total_output}</h4>
                <small className="text-muted">unit(s) | {productionOutput.products.chair.totals.total_productions} order(s)</small>
                <div className="mt-2">
                    <span className="badge bg-warning text-dark">Made-to-Order</span>
                </div>
            </div>
        </div>
    </div>
</div>

{/* Enhanced Chart */}
<ResponsiveContainer width="100%" height={400}>
    <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
        <XAxis 
            dataKey="period" 
            stroke="#666"
            angle={-15}
            textAnchor="end"
            height={80}
        />
        <YAxis stroke="#666" label={{ value: 'Units Produced', angle: -90, position: 'insideLeft' }} />
        <Tooltip 
            contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '2px solid #17a2b8',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
            formatter={(value, name) => {
                if (name.includes('Alkansya')) {
                    return [`${value} units (Daily Production)`, name];
                } else {
                    return [`${value} unit(s) (Customer Order)`, name];
                }
            }}
        />
        <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => {
                if (value.includes('Alkansya')) return value + ' ⚡ Continuous';
                if (value.includes('Table')) return value + ' 📦 On-Demand';
                if (value.includes('Chair')) return value + ' 📦 On-Demand';
                return value;
            }}
        />
        
        {/* Alkansya - Daily Production (Continuous Line) */}
        <Line 
            data={productionOutput.products.alkansya.output_trend} 
            type="monotone" 
            dataKey="output" 
            stroke="#17a2b8"
            strokeWidth={2}
            name="🐷 Alkansya"
            dot={{ r: 3, fill: '#17a2b8', strokeWidth: 1 }}
            activeDot={{ r: 6 }}
        />
        
        {/* Dining Table - Made-to-Order (Scatter Points) */}
        {productionOutput.products.table.output_trend?.length > 3 && (            <Line 
                data={productionOutput.products.table.output_trend} 
                type="monotone" 
                dataKey="output" 
                stroke="#8b5e34"
                strokeWidth={0}
                name="🪑 Dining Table"
                dot={{ r: 8, fill: '#8b5e34', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 10 }}
                connectNulls={false}
            />
        )}
        
        {/* Wooden Chair - Made-to-Order (Scatter Points) */}
        {productionOutput.products.chair.output_trend?.length > 3 && (          <Line 
                data={productionOutput.products.chair.output_trend} 
                type="monotone" 
                dataKey="output" 
                stroke="#d4a574"
                strokeWidth={0}
                name="🪑 Wooden Chair"
                dot={{ r: 8, fill: '#d4a574', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 10 }}
                connectNulls={false}
            />
        )}
    </LineChart>
</ResponsiveContainer>

{/* Additional Analytics Below Chart */}
<div className="row mt-4">
    <div className="col-md-6">
        <div className="card bg-light">
            <div className="card-body">
                <h6 className="fw-bold text-info">📈 Regular Production Analytics</h6>
                <p className="small mb-2">Alkansya is manufactured daily with consistent output:</p>
                <ul className="small mb-0">
                    <li>Average: <strong>{productionOutput.products.alkansya.totals.avg_per_period} units/day</strong></li>
                    <li>Efficiency: <strong>{productionOutput.top_performing.find(p => p.product === 'Alkansya')?.efficiency.toFixed(2)}%</strong></li>
                    <li>Production Days: <strong>{productionOutput.products.alkansya.totals.total_productions} days</strong></li>
                </ul>
            </div>
        </div>
    </div>
    <div className="col-md-6">
        <div className="card bg-light">
            <div className="card-body">
                <h6 className="fw-bold text-secondary">📦 Made-to-Order Analytics</h6>
                <p className="small mb-2">Tables and Chairs are produced only when ordered:</p>
                <ul className="small mb-0">
                    <li>Dining Tables: <strong>{productionOutput.products.table.totals.total_productions} order(s)</strong> completed</li>
                    <li>Wooden Chairs: <strong>{productionOutput.products.chair.totals.total_productions} order(s)</strong> completed</li>
                    <li>These appear as individual points on the chart</li>
                </ul>
            </div>
        </div>
    </div>
</div>
                                        </div>
                                    </div>
                                </div>
                                )}
                                
                                {/* Resource Utilization Tab - NEW */}
                                {activeTab === "resource-util" && (
                                    resourceUtilization && resourceUtilization.material_usage_by_product ? (
                                    <div className="card shadow-sm mb-4">
                                        <div className="card-header bg-white border-bottom">
                                            <h5 className="mb-0 fw-bold">📦 Resource Utilization & Material Efficiency</h5>
                                        </div>
                                        <div className="card-body">
                                            <h6 className="fw-bold mb-3">Material Usage by Product</h6>
                                            <div className="row mb-4">
                                                {resourceUtilization.material_usage_by_product.map((product, idx) => (
                                                    <div key={idx} className="col-md-4 mb-3">
                                                        <div className="card h-100">
                                                            <div className="card-header bg-light">
                                                                <h6 className="mb-0">{product.product}</h6>
                                                                <small className="text-muted">{product.total_materials} materials used</small>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="table-responsive">
                                                                    <table className="table table-sm">
                                                                        <thead>
                                                                            <tr>
                                                                                <th className="small">Material</th>
                                                                                <th className="text-end small">Used</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {product.materials.slice(0, 5).map((mat, midx) => (
                                                                                <tr key={midx}>
                                                                                    <td className="small">{mat.material}</td>
                                                                                    <td className="text-end small fw-bold">{mat.total_used} {mat.unit}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            {/* Material Efficiency Chart */}
                                            {resourceUtilization.efficiency && resourceUtilization.efficiency.length > 0 && (
                                                <div>
                                                    <h6 className="fw-bold mb-3">📊 Material Usage Efficiency (Actual vs Estimated)</h6>
                                                    <ResponsiveContainer width="100%" height={350}>
                                                        <BarChart data={resourceUtilization.efficiency}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="product" />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Bar dataKey="estimated_usage" fill="#ffc107" name="Estimated Usage" />
                                                            <Bar dataKey="actual_usage" fill="#17a2b8" name="Actual Usage" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                    
                                                    {/* Efficiency Table */}
                                                    <div className="table-responsive mt-3">
                                                        <table className="table table-hover">
                                                            <thead>
                                                                <tr>
                                                                    <th>Product</th>
                                                                    <th className="text-end">Estimated</th>
                                                                    <th className="text-end">Actual</th>
                                                                    <th className="text-end">Efficiency</th>
                                                                    <th className="text-end">Variance</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {resourceUtilization.efficiency.map((item, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="fw-bold">{item.product}</td>
                                                                        <td className="text-end">{item.estimated_usage}</td>
                                                                        <td className="text-end">{item.actual_usage}</td>
                                                                        <td className="text-end">
                                                                            <span className={`badge ${
                                                                                item.efficiency_percentage >= 95 ? 'bg-success' :
                                                                                item.efficiency_percentage >= 85 ? 'bg-warning' : 'bg-danger'
                                                                            }`}>
                                                                                {item.efficiency_percentage}%
                                                                            </span>
                                                                        </td>
                                                                        <td className="text-end">
                                                                            <span className={item.variance > 0 ? 'text-danger' : 'text-success'}>
                                                                                {item.variance > 0 ? '+' : ''}{item.variance}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    ) : (
                                        <div className="alert alert-warning">
                                            <h5 className="alert-heading">📦 Resource Utilization Data Not Available</h5>
                                            {!resourceUtilization ? (
                                                <p>Loading resource utilization data...</p>
                                            ) : (
                                                <>
                                                    <p>No material usage data found for the selected period.</p>
                                                    <hr/>
                                                    <p className="mb-0"><strong>Possible reasons:</strong></p>
                                                    <ul className="mb-0">
                                                        <li>Database hasn't been seeded with inventory usage data</li>
                                                        <li>No production orders have been processed yet</li>
                                                        <li>The selected date range has no data</li>
                                                    </ul>
                                                    <hr/>
                                                    <p className="mb-0"><strong>To fix:</strong> Run <code>php artisan db:seed</code> in the backend</p>
                                                </>
                                            )}
                                        </div>
                                    )
                                )}
                                
                                {/* Cycle & Throughput Tab - NEW */}
                                {activeTab === "cycle-throughput" && advancedPerformance && (
                                    <div className="card shadow-sm mb-4">
                                        <div className="card-header bg-white border-bottom">
                                            <h5 className="mb-0 fw-bold">⏱️ Cycle Time & Throughput Analysis</h5>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                <div className="col-md-6 mb-4">
                                                    <h6 className="fw-bold mb-3">Cycle Time Analysis (Days)</h6>
                                                    <ResponsiveContainer width="100%" height={350}>
                                                        <BarChart data={advancedPerformance.cycle_time_analysis}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="product_type" />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Bar dataKey="avg_cycle_time_days" fill="#8b5e34" name="Avg Cycle Time" />
                                                            <Bar dataKey="min_cycle_time_days" fill="#28a745" name="Min Time" />
                                                            <Bar dataKey="max_cycle_time_days" fill="#dc3545" name="Max Time" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="col-md-6 mb-4">
                                                    <h6 className="fw-bold mb-3">Throughput Rate</h6>
                                                    <ResponsiveContainer width="100%" height={350}>
                                                        <BarChart data={advancedPerformance.throughput_rate}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="product_type" />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Bar dataKey="throughput_per_day" fill="#17a2b8" name="Per Day" />
                                                            <Bar dataKey="throughput_per_week" fill="#8b5e34" name="Per Week" />
                                                            <Bar dataKey="throughput_per_month" fill="#d4a574" name="Per Month" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                            
                                            {/* Performance Tables */}
                                            <div className="row mt-4">
                                                <div className="col-md-6">
                                                    <h6 className="fw-bold mb-3">Cycle Time Details</h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-sm table-hover">
                                                            <thead>
                                                                <tr>
                                                                    <th>Product</th>
                                                                    <th className="text-end">Avg Days</th>
                                                                    <th className="text-end">Min</th>
                                                                    <th className="text-end">Max</th>
                                                                    <th className="text-end">Completed</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {advancedPerformance.cycle_time_analysis.map((item, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="fw-bold">{item.product_type}</td>
                                                                        <td className="text-end">{item.avg_cycle_time_days}</td>
                                                                        <td className="text-end text-success">{item.min_cycle_time_days}</td>
                                                                        <td className="text-end text-danger">{item.max_cycle_time_days}</td>
                                                                        <td className="text-end">{item.total_completed}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <h6 className="fw-bold mb-3">Throughput Details</h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-sm table-hover">
                                                            <thead>
                                                                <tr>
                                                                    <th>Product</th>
                                                                    <th className="text-end">Per Day</th>
                                                                    <th className="text-end">Per Week</th>
                                                                    <th className="text-end">Per Month</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {advancedPerformance.throughput_rate.map((item, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="fw-bold">{item.product_type}</td>
                                                                        <td className="text-end">{item.throughput_per_day}</td>
                                                                        <td className="text-end">{item.throughput_per_week}</td>
                                                                        <td className="text-end">{item.throughput_per_month}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Predictive Analytics Tab - NEW */}
                                {activeTab === "predictive" && predictiveAnalytics && (
                                    <div className="card shadow-sm mb-4">
                                        <div className="card-header bg-white border-bottom">
                                            <h5 className="mb-0 fw-bold">🔮 Predictive Analytics & Forecasting</h5>
                                        </div>
                                        <div className="card-body">
                                            {/* Capacity Forecast */}
                                            {predictiveAnalytics.production_capacity_forecast && predictiveAnalytics.production_capacity_forecast.length > 0 && (
                                                <div className="mb-4">
                                                    <h6 className="fw-bold mb-3">Production Capacity Forecast (30 Days)</h6>
                                                    <ResponsiveContainer width="100%" height={350}>
                                                        <BarChart data={predictiveAnalytics.production_capacity_forecast}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="product_type" />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Bar dataKey="forecasted_output_30_days" fill="#8b5e34" name="Forecasted Output (30 days)" />
                                                            <Bar dataKey="weekly_capacity" fill="#17a2b8" name="Weekly Capacity" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                            
                                            {/* Trend Analysis */}
                                            {predictiveAnalytics.trend_analysis && (
                                                <div className="row mb-4">
                                                    <div className="col-md-6">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="text-muted mb-2">Overall Trend</h6>
                                                                <h3 className="mb-0">
                                                                    <span className={`badge ${
                                                                        predictiveAnalytics.trend_analysis.overall_trend === 'increasing' ? 'bg-success' :
                                                                        predictiveAnalytics.trend_analysis.overall_trend === 'decreasing' ? 'bg-danger' :
                                                                        'bg-secondary'
                                                                    }`}>
                                                                        {predictiveAnalytics.trend_analysis.overall_trend.toUpperCase()}
                                                                    </span>
                                                                </h3>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="card bg-light">
                                                            <div className="card-body text-center">
                                                                <h6 className="text-muted mb-2">Avg Monthly Output</h6>
                                                                <h3 className="mb-0 text-primary">{predictiveAnalytics.trend_analysis.avg_monthly_output}</h3>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Monthly Trends Chart */}
                                            {predictiveAnalytics.trend_analysis && predictiveAnalytics.trend_analysis.monthly_trends && (
                                                <div className="mb-4">
                                                    <h6 className="fw-bold mb-3">Monthly Trend Analysis</h6>
                                                    <ResponsiveContainer width="100%" height={300}>
                                                        <LineChart data={predictiveAnalytics.trend_analysis.monthly_trends}>
                                                            <CartesianGrid strokeDasharray="3 3" />
                                                            <XAxis dataKey="month" />
                                                            <YAxis />
                                                            <Tooltip />
                                                            <Legend />
                                                            <Line 
                                                                type="monotone" 
                                                                dataKey="total_output" 
                                                                stroke="#17a2b8"
                                                                strokeWidth={3}
                                                                name="Total Output"
                                                                dot={{ r: 5 }}
                                                            />
                                                            <Line 
                                                                type="monotone" 
                                                                dataKey="avg_efficiency" 
                                                                stroke="#28a745"
                                                                strokeWidth={3}
                                                                name="Avg Efficiency %"
                                                                dot={{ r: 5 }}
                                                            />
                                                        </LineChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                            
                                            {/* Replenishment Needs */}
                                            {predictiveAnalytics.inventory_replenishment_needs && predictiveAnalytics.inventory_replenishment_needs.length > 0 && (
                                                <div>
                                                    <h6 className="fw-bold mb-3 text-danger">
                                                        <i className="fas fa-exclamation-triangle me-2"></i>
                                                        Materials Needing Replenishment
                                                    </h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-hover">
                                                            <thead>
                                                                <tr>
                                                                    <th>Material</th>
                                                                    <th>SKU</th>
                                                                    <th className="text-end">Current Stock</th>
                                                                    <th className="text-end">Days Left</th>
                                                                    <th>Urgency</th>
                                                                    <th className="text-end">Recommended Order</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {predictiveAnalytics.inventory_replenishment_needs.map((item, idx) => (
                                                                    <tr key={idx} className={item.urgency === 'critical' ? 'table-danger' : 'table-warning'}>
                                                                        <td className="fw-bold">{item.material}</td>
                                                                        <td><code>{item.sku}</code></td>
                                                                        <td className="text-end">{item.current_stock} {item.unit}</td>
                                                                        <td className="text-end">
                                                                            <span className={`badge ${
                                                                                item.days_until_depletion <= 3 ? 'bg-danger' :
                                                                                item.days_until_depletion <= 7 ? 'bg-warning' : 'bg-info'
                                                                            }`}>
                                                                                {item.days_until_depletion} days
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <span className={`badge ${item.urgency === 'critical' ? 'bg-danger' : 'bg-warning'}`}>
                                                                                {item.urgency}
                                                                            </span>
                                                                        </td>
                                                                        <td className="text-end fw-bold text-danger">
                                                                            {item.recommended_order_qty} {item.unit}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Stock Report Tab - NEW (Inventory) */}
                                {activeTab === "stock-report" && stockReport && (
                                    <div className="card shadow-sm mb-4">
                                        <div className="card-header bg-white border-bottom">
                                            <h5 className="mb-1 fw-bold">Automated Stock Report</h5>
                                            <small className="text-muted">Generated: {stockReport.generated_at}</small>
                                        </div>
                                        <div className="card-body">
                                            {/* Summary Cards */}
                                            <div className="row mb-4">
                                                <div className="col-md-4">
                                                    <div className="card border-danger border-3">
                                                        <div className="card-body text-center">
                                                            <h2 className="text-danger mb-0">{stockReport.summary.critical_items}</h2>
                                                            <p className="text-muted mb-0">Critical Items</p>
                                                            <small className="text-danger">Immediate action required</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="card border-warning border-3">
                                                        <div className="card-body text-center">
                                                            <h2 className="text-warning mb-0">{stockReport.summary.low_stock_items}</h2>
                                                            <p className="text-muted mb-0">Low Stock Items</p>
                                                            <small className="text-warning">Monitor closely</small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="card border-success border-3">
                                                        <div className="card-body text-center">
                                                            <h2 className="text-success mb-0">{stockReport.summary.healthy_items}</h2>
                                                            <p className="text-muted mb-0">Healthy Items</p>
                                                            <small className="text-success">Stock levels good</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Critical Items Table */}
                                            {stockReport.items_by_status.critical.length > 0 && (
                                                <div className="mb-4">
                                                    <h6 className="fw-bold text-danger mb-3">
                                                        <i className="fas fa-exclamation-circle me-2"></i>
                                                        Critical Stock Items - Immediate Action Required
                                                    </h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-hover">
                                                            <thead className="table-danger">
                                                                <tr>
                                                                    <th>Material</th>
                                                                    <th>SKU</th>
                                                                    <th className="text-end">Current Stock</th>
                                                                    <th className="text-end">Safety Stock</th>
                                                                    <th className="text-end">Daily Usage</th>
                                                                    <th className="text-end">Days Left</th>
                                                                    <th>Depletion Date</th>
                                                                    <th className="text-end">Reorder Qty</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {stockReport.items_by_status.critical.map((item, idx) => (
                                                                    <tr key={idx} className="table-danger">
                                                                        <td className="fw-bold">{item.material}</td>
                                                                        <td><code>{item.sku}</code></td>
                                                                        <td className="text-end">{item.current_stock} {item.unit}</td>
                                                                        <td className="text-end">{item.safety_stock}</td>
                                                                        <td className="text-end">{item.daily_usage_rate}</td>
                                                                        <td className="text-end">
                                                                            <span className="badge bg-danger">{item.days_until_depletion}</span>
                                                                        </td>
                                                                        <td>{item.predicted_depletion_date}</td>
                                                                        <td className="text-end fw-bold text-danger">
                                                                            {item.suggested_reorder_qty} {item.unit}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Low Stock Items */}
                                            {stockReport.items_by_status.low.length > 0 && (
                                                <div>
                                                    <h6 className="fw-bold text-warning mb-3">Low Stock Items - Monitor Closely</h6>
                                                    <div className="table-responsive">
                                                        <table className="table table-sm table-hover">
                                                            <thead className="table-warning">
                                                                <tr>
                                                                    <th>Material</th>
                                                                    <th className="text-end">Current Stock</th>
                                                                    <th className="text-end">Days Left</th>
                                                                    <th className="text-end">Reorder Qty</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {stockReport.items_by_status.low.slice(0, 10).map((item, idx) => (
                                                                    <tr key={idx} className="table-warning">
                                                                        <td>{item.material}</td>
                                                                        <td className="text-end">{item.current_stock} {item.unit}</td>
                                                                        <td className="text-end">
                                                                            <span className="badge bg-warning">{item.days_until_depletion}</span>
                                                                        </td>
                                                                        <td className="text-end fw-bold">{item.suggested_reorder_qty}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                                
                                {/* Material Usage Tab - NEW (Inventory) */}
                                {activeTab === "material-usage" && resourceUtilization && resourceUtilization.material_usage_by_product && (
                                    <div className="card shadow-sm mb-4">
                                        <div className="card-header bg-white border-bottom">
                                            <h5 className="mb-1 fw-bold">📊 Material Usage Trends by Product</h5>
                                        </div>
                                        <div className="card-body">
                                            <div className="row">
                                                {resourceUtilization.material_usage_by_product.map((product, idx) => (
                                                    <div key={idx} className="col-md-4 mb-3">
                                                        <div className="card h-100 border-2" style={{ borderColor: idx === 0 ? '#8b5e34' : idx === 1 ? '#d4a574' : '#17a2b8' }}>
                                                            <div className="card-header" style={{ 
                                                                backgroundColor: idx === 0 ? '#fff3e0' : idx === 1 ? '#f3e5f5' : '#e8f5e9'
                                                            }}>
                                                                <h6 className="mb-0 fw-bold">{product.product}</h6>
                                                                <small className="text-muted">{product.total_materials} materials tracked</small>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="table-responsive">
                                                                    <table className="table table-sm">
                                                                        <thead>
                                                                            <tr>
                                                                                <th className="small">Material</th>
                                                                                <th className="text-end small">Total Used</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {product.materials.slice(0, 6).map((mat, midx) => (
                                                                                <tr key={midx}>
                                                                                    <td className="small">{mat.material}</td>
                                                                                    <td className="text-end small fw-bold">
                                                                                        {mat.total_used} {mat.unit}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Efficiency Metrics Tab */}
                                {activeTab === "efficiency" && productionPerformance && (
                                    <div>
                                        <div className="row g-4 mb-4">
                                            <div className="col-lg-6">
                                                <div className="card shadow-sm">
                                                    <div className="card-header bg-white border-bottom">
                                                        <h5 className="mb-0 fw-bold">🏆 Top Products</h5>
                                                    </div>
                                                    <div className="card-body">
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <BarChart data={productionPerformance.top_products || []} layout="vertical">
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis type="number" />
                                                                <YAxis dataKey="name" type="category" width={150} />
                                                                <Tooltip />
                                                                <Bar dataKey="quantity" fill="#0d6efd" name="Quantity Produced" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="col-lg-6">
                                                <div className="card shadow-sm">
                                                    <div className="card-header bg-white border-bottom">
                                                        <h5 className="mb-0 fw-bold">👥 Top Users/Workers</h5>
                                                    </div>
                                                    <div className="card-body">
                                                        <ResponsiveContainer width="100%" height={300}>
                                                            <BarChart data={productionPerformance.top_users || []} layout="vertical">
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis type="number" />
                                                                <YAxis dataKey="name" type="category" width={150} />
                                                                <Tooltip />
                                                                <Bar dataKey="quantity" fill="#28a745" name="Quantity Produced" />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <DailyOutputChart data={productionPerformance.daily_output || []} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
                        {/* Sales Analytics Content */}
                        {mainTab === "sales" && (
                            <div>
                                {/* Sales Export Buttons */}
                                <div className="card shadow-sm mb-4">
                                    <div className="card-body">
                                        <h6 className="fw-bold mb-3">📥 Export Sales Data</h6>
                                        <div className="d-flex flex-wrap gap-2">
                                            <button 
                                                className="btn btn-outline-primary" 
                                                onClick={() => handleSalesExport('dashboard', 'csv')}
                                                title="Export Sales Dashboard data to CSV"
                                            >
                                                📊 Export Dashboard CSV
                                            </button>
                                            <button 
                                                className="btn btn-outline-danger" 
                                                onClick={() => handleSalesExport('dashboard', 'pdf')}
                                                title="Export Sales Dashboard data to PDF"
                                            >
                                                📄 Export Dashboard PDF
                                            </button>
                                            <button 
                                                className="btn btn-outline-primary" 
                                                onClick={() => handleSalesExport('process', 'csv')}
                                                title="Export Sales Process data to CSV"
                                            >
                                                🔄 Export Process CSV
                                            </button>
                                            <button 
                                                className="btn btn-outline-danger" 
                                                onClick={() => handleSalesExport('process', 'pdf')}
                                                title="Export Sales Process data to PDF"
                                            >
                                                📄 Export Process PDF
                                            </button>
                                            <button 
                                                className="btn btn-outline-primary" 
                                                onClick={() => handleSalesExport('reports', 'csv')}
                                                title="Export Sales Reports data to CSV"
                                            >
                                                📋 Export Reports CSV
                                            </button>
                                            <button 
                                                className="btn btn-outline-danger" 
                                                onClick={() => handleSalesExport('reports', 'pdf')}
                                                title="Export Sales Reports data to PDF"
                                            >
                                                📄 Export Reports PDF
                                            </button>
                                            <button 
                                                className="btn btn-outline-primary" 
                                                onClick={() => handleSalesExport('products', 'csv')}
                                                title="Export Product Performance data to CSV"
                                            >
                                                📦 Export Products CSV
                                            </button>
                                            <button 
                                                className="btn btn-outline-danger" 
                                                onClick={() => handleSalesExport('products', 'pdf')}
                                                title="Export Product Performance data to PDF"
                                            >
                                                📄 Export Products PDF
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Sales Dashboard Tab */}
                                {activeTab === "dashboard" && (
                                    <div className="mb-4" key={`sales-dashboard-${refreshKey}`}>
                                        <SalesDashboard 
                                            salesData={salesDashboardData}
                                            loading={loading}
                                            error={error}
                                            onRefresh={handleGlobalRefresh}
                                        />
                                    </div>
                                )}

                                {/* Sales Process Tab */}
                                {activeTab === "process" && (
                                    <div className="mb-4" key={`sales-process-${refreshKey}`}>
                                        <SalesProcessAnalytics 
                                            processData={salesProcessData}
                                            loading={loading}
                                            error={error}
                                            onRefresh={handleGlobalRefresh}
                                        />
                                    </div>
                                )}

                                {/* Product Performance Tab */}
                                {activeTab === "products" && (
                                    <div className="mb-4" key={`product-performance-${refreshKey}`}>
                                        <ProductPerformance 
                                            performanceData={productPerformanceData}
                                            loading={loading}
                                            error={error}
                                            onRefresh={handleGlobalRefresh}
                                        />
                                    </div>
                                )}

                                {/* Detailed Reports Tab */}
                                {activeTab === "reports" && (
                                    <div className="mb-4" key={`sales-report-${refreshKey}`}>
                                        <SalesReport 
                                            reportData={salesReportData}
                                            loading={loading}
                                            error={error}
                                            onRefresh={handleGlobalRefresh}
                                        />
                                    </div>
                                )}

                                
                            </div>
                        )}
        </AppLayout>
    );
};

export default Report;
