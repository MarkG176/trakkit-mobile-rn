# Run AFTER Android Studio's first-run setup finishes (Standard install).
# Usage: powershell -ExecutionPolicy Bypass -File .\scripts\setup-android-env.ps1

$sdkRoot = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$adb = Join-Path $sdkRoot "platform-tools\adb.exe"

if (-not (Test-Path $adb)) {
  Write-Host ""
  Write-Host "Android SDK not found at: $sdkRoot" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "Do this first:"
  Write-Host "  1. Open Android Studio (Start menu -> Android Studio)"
  Write-Host "  2. First-run wizard -> Standard install -> Finish"
  Write-Host "  3. Re-run this script"
  Write-Host ""
  exit 1
}

$javaHome = "C:\Program Files\Android\Android Studio\jbr"

[Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkRoot, "User")
[Environment]::SetEnvironmentVariable("ANDROID_SDK_ROOT", $sdkRoot, "User")
if (Test-Path $javaHome) {
  [Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
}

$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$toAdd = @(
  (Join-Path $sdkRoot "platform-tools"),
  (Join-Path $sdkRoot "emulator"),
  (Join-Path $sdkRoot "cmdline-tools\latest\bin")
)
if (Test-Path $javaHome) {
  $toAdd = @((Join-Path $javaHome "bin")) + $toAdd
}
foreach ($entry in $toAdd) {
  if ($userPath -notlike "*$entry*") {
    $userPath = if ($userPath) { "$userPath;$entry" } else { $entry }
  }
}
[Environment]::SetEnvironmentVariable("Path", $userPath, "User")

$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot
$env:Path = "$($toAdd -join ';');$env:Path"

$localProps = Join-Path $PSScriptRoot "..\android\local.properties"
$sdkDirEscaped = ($sdkRoot -replace '\\', '\\')
Set-Content -Path $localProps -Value "sdk.dir=$sdkDirEscaped`n" -Encoding ASCII

Write-Host ""
Write-Host "Android SDK configured." -ForegroundColor Green
Write-Host "  ANDROID_HOME = $sdkRoot"
Write-Host "  JAVA_HOME    = $(if (Test-Path $javaHome) { $javaHome } else { '(not found)' })"
Write-Host "  adb          = $adb"
Write-Host ""
Write-Host "Close and reopen your terminal, then run:"
Write-Host "  npx expo run:android"
Write-Host ""
