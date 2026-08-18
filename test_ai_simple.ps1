param()
$token = '$jwt'
$headers = @{ 'Authorization' = "Bearer $token"; 'Content-Type' = 'application/json' }
$base = 'http://localhost:5000/api/v1'
$tests = @(
    @{ Name = 'AI Status'; Path = '/ai/status'; Method = 'GET' },
    @{ Name = 'AI Chat List'; Path = '/ai/chat/sessions'; Method = 'GET' },
    @{ Name = 'AI Reports List'; Path = '/ai/reports'; Method = 'GET' },
    @{ Name = 'AI OCR List'; Path = '/ai/ocr'; Method = 'GET' },
    @{ Name = 'AI Analytics Raw'; Path = '/ai/analytics/raw'; Method = 'GET' },
    @{ Name = 'AI Insights List'; Path = '/ai/insights'; Method = 'GET' },
    @{ Name = 'AI Insights Stats'; Path = '/ai/insights/stats'; Method = 'GET' },
    @{ Name = 'AI Suggestions List'; Path = '/ai/suggestions'; Method = 'GET' },
    @{ Name = 'AI Suggestions Stats'; Path = '/ai/suggestions/stats'; Method = 'GET' },
    @{ Name = 'AI Usage'; Path = '/ai/usage'; Method = 'GET' },
    @{ Name = 'AI Usage Features'; Path = '/ai/usage/features'; Method = 'GET' }
)
$passed = 0; $failed = 0
Write-Host '?? Testing AI Backend Endpoints' -ForegroundColor Cyan
Write-Host ('=' * 60)
foreach ($test in $tests) {
    try {
        $r = Invoke-RestMethod -Uri "$base$($test.Path)" -Method $test.Method -Headers $headers -ErrorAction Stop
        $passed++
        Write-Host "? PASS: $($test.Name)" -ForegroundColor Green
    } catch {
        $failed++
        $status = $_.Exception.Response.StatusCode.value__
        Write-Host "? FAIL: $($test.Name) (Status: $status)" -ForegroundColor Red
    }
}
Write-Host ('=' * 60)
Write-Host "?? Total: $($passed + $failed) | Passed: $passed ? | Failed: $failed ?" -ForegroundColor Yellow
if ($failed -eq 0) { Write-Host '?? All backend AI endpoints are accessible!' -ForegroundColor Green }
