$deadline = (Get-Date).AddSeconds(90)

while ((Get-Date) -lt $deadline) {
  try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -ge 200) {
      Start-Process 'http://localhost:3000'
      exit 0
    }
  } catch {
    Start-Sleep -Milliseconds 500
  }
}

Write-Warning 'ResQSync did not respond on http://localhost:3000.'
