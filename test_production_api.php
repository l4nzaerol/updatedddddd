<?php

// Test the production analytics API endpoint
$url = 'http://127.0.0.1:8000/api/productions/analytics';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: application/json',
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: " . $httpCode . "\n";
echo "Response:\n";
$data = json_decode($response, true);
if ($data) {
    echo "KPIs:\n";
    print_r($data['kpis'] ?? 'No KPIs');
    
    echo "\nDaily Output (first 3 records):\n";
    $dailyOutput = $data['daily_output'] ?? [];
    for ($i = 0; $i < min(3, count($dailyOutput)); $i++) {
        echo "Date: " . $dailyOutput[$i]['date'] . ", Alkansya: " . $dailyOutput[$i]['alkansya'] . ", Furniture: " . $dailyOutput[$i]['furniture'] . "\n";
    }
} else {
    echo "Failed to decode JSON response\n";
    echo "Raw response: " . $response . "\n";
}
