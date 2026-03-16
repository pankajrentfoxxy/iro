# IRO - Create .env from template if missing
# Run from project root: .\scripts\setup-env.ps1

$envPath = Join-Path $PSScriptRoot ".." ".env"
$examplePath = Join-Path $PSScriptRoot ".." ".env.example"

if (Test-Path $envPath) {
    Write-Host ".env already exists." -ForegroundColor Green
    exit 0
}

if (-not (Test-Path $examplePath)) {
    Write-Host ".env.example not found." -ForegroundColor Red
    exit 1
}

Copy-Item $examplePath $envPath
Write-Host "Created .env from .env.example" -ForegroundColor Green
Write-Host "Edit .env and set DATABASE_URL, JWT_SECRET, ENCRYPTION_KEY" -ForegroundColor Yellow
