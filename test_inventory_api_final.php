<?php
/**
 * Final test script to verify all inventory reports API endpoints are working
 * Run this from the project root: php test_inventory_api_final.php
 */

echo "🧪 Final Test - Inventory Reports API Endpoints\n";
echo "===============================================\n\n";

$baseUrl = 'http://127.0.0.1:8000/api';

$endpoints = [
    '/inventory/dashboard',
    '/inventory/report',
    '/inventory/consumption-trends',
    '/inventory/replenishment-schedule',
    '/inventory/forecast',
    '/inventory/turnover-report',
    '/inventory/alkansya-daily-output/statistics',
    '/inventory/alkansya-daily-output/materials-analysis'
];

$workingEndpoints = 0;
$totalEndpoints = count($endpoints);

foreach ($endpoints as $endpoint) {
    echo "Testing: {$endpoint}\n";
    
    $url = $baseUrl . $endpoint;
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => 'Content-Type: application/json',
            'timeout' => 10
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        echo "❌ FAILED - Could not connect to {$endpoint}\n";
    } else {
        $data = json_decode($response, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            echo "✅ SUCCESS - {$endpoint} returned valid JSON\n";
            $workingEndpoints++;
            
            // Show some key data for important endpoints
            if ($endpoint === '/inventory/dashboard') {
                if (isset($data['summary']['total_items'])) {
                    echo "   📊 Total Items: {$data['summary']['total_items']}\n";
                }
                if (isset($data['summary']['alkansya_production']['total_output'])) {
                    echo "   🐷 Alkansya Production: {$data['summary']['alkansya_production']['total_output']}\n";
                }
            }
            
            if ($endpoint === '/inventory/alkansya-daily-output/statistics') {
                if (isset($data['total_output'])) {
                    echo "   📈 Total Output: {$data['total_output']}\n";
                }
                if (isset($data['average_daily'])) {
                    echo "   📊 Average Daily: {$data['average_daily']}\n";
                }
            }
        } else {
            echo "⚠️  WARNING - {$endpoint} returned invalid JSON\n";
        }
    }
    echo "\n";
}

echo "🏁 Test Results:\n";
echo "================\n";
echo "Working endpoints: {$workingEndpoints}/{$totalEndpoints}\n";

if ($workingEndpoints === $totalEndpoints) {
    echo "🎉 ALL ENDPOINTS ARE WORKING!\n";
    echo "The inventory reports should now display accurate data.\n";
} else {
    echo "⚠️  Some endpoints are still not working.\n";
    echo "Check the backend server and routes configuration.\n";
}

echo "\n📋 Next Steps:\n";
echo "1. Open the frontend application\n";
echo "2. Navigate to Admin > Inventory Reports\n";
echo "3. Check if all tabs are loading data properly\n";
echo "4. Verify the Alkansya Analytics tab shows production data\n";
?>
