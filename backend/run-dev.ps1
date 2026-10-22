# Start SmartTea backend once on port 8000 (default). Safe to re-run: exits if already up.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$port = 8000
$healthUrl = "http://127.0.0.1:$port/health"

function Test-BackendUp {
    try {
        $r = Invoke-RestMethod -Uri $healthUrl -TimeoutSec 3
        return ($r.status -eq "ok" -or $r.service -eq "smarttea-backend")
    } catch {
        return $false
    }
}

function Get-ListenerPid($listenPort) {
    $line = netstat -ano | Select-String "LISTENING" | Select-String ":$listenPort\s"
    if (-not $line) { return $null }
    $parts = ($line.ToString().Trim() -split '\s+')
    return [int]$parts[-1]
}

if (Test-BackendUp) {
    $pid = Get-ListenerPid $port
    Write-Host "SmartTea backend is already running on http://127.0.0.1:$port (PID $pid)." -ForegroundColor Green
    Write-Host "Do not start a second JVM — Vite proxies /api to this port."
    Write-Host "To restart: stop that process, then run this script again."
    exit 0
}

$blockingPid = Get-ListenerPid $port
if ($blockingPid) {
    Write-Host "Port $port is in use by PID $blockingPid but /health did not respond." -ForegroundColor Yellow
    Write-Host "Stop it manually, then re-run:"
    Write-Host "  Stop-Process -Id $blockingPid -Force"
    exit 1
}

if (-not $env:JAVA_HOME) {
    $defaultJdk = "C:\Program Files\Java\jdk-17"
    if (Test-Path $defaultJdk) {
        $env:JAVA_HOME = $defaultJdk
        $env:Path = "$env:JAVA_HOME\bin;$env:Path"
    }
}

Write-Host "Starting backend on port $port ..."
mvn -DskipTests compile spring-boot:run
