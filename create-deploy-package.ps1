Write-Host "📦 Creating deployment package..."

# Удаляем старый архив если есть
if (Test-Path "deploy.zip") {
    Remove-Item "deploy.zip" -Force
}

# Создаем архив с нужными файлами
$files = @(
    "backend/dist",
    "backend/package.json",
    "backend/package-lock.json",
    "backend/.env",
    "backend/scripts",
    "frontend/dist",
    "package.json",
    "start.js",
    "README.md"
)

Compress-Archive -Path $files -DestinationPath "deploy.zip" -Force

Write-Host "✅ Deploy package created: deploy.zip"
Write-Host ""
Write-Host "Checklist for hosting:"
Write-Host "1. Upload deploy.zip to hosting"
Write-Host "2. Extract all files"
Write-Host "3. Make sure backend/.env has PORT=20533"
Write-Host "4. Delete frontend/.env if exists!"
Write-Host "5. Set MAIN FILE to: start-prod.js"
Write-Host "6. Start server"
