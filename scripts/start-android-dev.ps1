# Starts Metro for USB-connected Android devices (localhost + adb reverse).
# Usage:
#   npm run start:android          # Metro only (foreground)
#   npm run android:usb            # build/install app, then connect to Metro on localhost

param(
  [switch]$Run
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location $projectRoot

function Stop-DevServerPort {
  param([int]$Port = 8081)

  $pids = @()
  try {
    $pids = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
      Select-Object -ExpandProperty OwningProcess -Unique
  } catch {
    $lines = netstat -ano | Select-String ":$Port\s+.*LISTENING"
    foreach ($line in $lines) {
      $parts = ($line.ToString().Trim() -split '\s+')
      if ($parts.Length -ge 1) { $pids += $parts[-1] }
    }
    $pids = $pids | Select-Object -Unique
  }

  foreach ($procId in $pids) {
    if ($procId -and $procId -ne 0) {
      Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
      Write-Host "Stopped process $procId on port $Port" -ForegroundColor Yellow
    }
  }
}

$sdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA "Android\Sdk" }
$adb = Join-Path $sdkRoot "platform-tools\adb.exe"

if (-not (Test-Path $adb)) {
  Write-Host "adb not found. Run scripts/setup-android-env.ps1 first." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "Project: $projectRoot" -ForegroundColor Cyan
Write-Host "Stopping stale Metro servers on ports 8081 and 8082..." -ForegroundColor Yellow
Stop-DevServerPort 8081
Stop-DevServerPort 8082
Start-Sleep -Seconds 1

$devices = & $adb devices | Select-String "device$" | Where-Object { $_ -notmatch "List of devices" }
if (-not $devices) {
  Write-Host "No Android device detected. Enable USB debugging and reconnect." -ForegroundColor Yellow
} else {
  & $adb reverse tcp:8081 tcp:8081 | Out-Null
  Write-Host "adb reverse tcp:8081 tcp:8081" -ForegroundColor Green
}

$env:REACT_NATIVE_PACKAGER_HOSTNAME = "127.0.0.1"
$devClientUrl = "trakkit://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081"

function Ensure-UsbMetroBridge {
  & $adb reverse tcp:8081 tcp:8081 | Out-Null
  Write-Host "adb reverse tcp:8081 tcp:8081" -ForegroundColor Green
}

function Open-DevClientLocalhost {
  Write-Host "Opening dev client with 127.0.0.1 Metro URL (USB reverse)..." -ForegroundColor Cyan
  & $adb shell am force-stop com.trakkit.mobile 2>$null
  Start-Sleep -Seconds 1
  & $adb shell am start -a android.intent.action.VIEW -d $devClientUrl | Out-Null
}

if ($Run) {
  Write-Host ""
  Write-Host "Building and installing Android app from this project..." -ForegroundColor Cyan
  # Prefer IPv4 for adb reverse; --localhost on Windows often binds ::1 only
  $env:NODE_OPTIONS = "$(if ($env:NODE_OPTIONS) { "$($env:NODE_OPTIONS) " })--dns-result-order=ipv4first"
  npx expo run:android -p 8081

  if ($devices) {
    Write-Host ""
    Ensure-UsbMetroBridge
    Open-DevClientLocalhost
  }

  Write-Host ""
  Write-Host "If the app shows Unable to load script:" -ForegroundColor Yellow
  Write-Host "  1) Confirm Metro is listening on 127.0.0.1 (not only ::1)" -ForegroundColor White
  Write-Host "  2) adb reverse tcp:8081 tcp:8081" -ForegroundColor White
  Write-Host "  3) adb shell am start -a android.intent.action.VIEW -d `"$devClientUrl`"" -ForegroundColor White
  Write-Host "Or: npm run start:android" -ForegroundColor White
} else {
  Write-Host ""
  Write-Host "Starting Metro (LAN bind + 127.0.0.1 URL for USB reverse) on port 8081..." -ForegroundColor Cyan
  Write-Host "Using --lan so Metro listens on 0.0.0.0 (adb reverse needs IPv4 127.0.0.1)." -ForegroundColor DarkGray
  Ensure-UsbMetroBridge
  $env:NODE_OPTIONS = "$(if ($env:NODE_OPTIONS) { "$($env:NODE_OPTIONS) " })--dns-result-order=ipv4first"
  # --lan binds all interfaces; packager hostname stays 127.0.0.1 for the device URL
  npx expo start --dev-client --lan -p 8081
}
