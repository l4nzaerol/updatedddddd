<?php
/**
 * Test script to verify inventory reports API endpoints
 * Run this from the project root: php test_inventory_endpoints.php
 */

echo "🧪 Testing Inventory Reports API Endpoints\n";
echo "==========================================\n\n";

$baseUrl = 'http://localhost:8000/api';

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
            
            // Show some key data for important endpoints
            if ($endpoint === '/inventory/alkansya-daily-output/statistics') {
                if (isset($data['total_output'])) {
                    echo "   📊 Total Output: {$data['total_output']}\n";
                }
                if (isset($data['average_daily'])) {
                    echo "   📈 Average Daily: {$data['average_daily']}\n";
                }
            }
            
            if ($endpoint === '/inventory/dashboard') {
                if (isset($data['summary']['total_items'])) {
                    echo "   📦 Total Items: {$data['summary']['total_items']}\n";
                }
            }
        } else {
            echo "⚠️  WARNING - {$endpoint} returned invalid JSON\n";
        }
    }
    echo "\n";
}

echo "🏁 Test completed!\n";
echo "If all endpoints are working, the inventory reports should load properly.\n";
?>
