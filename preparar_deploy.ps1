$ErrorActionPreference = "Stop"

$DeployZip = "deploy_sincoweb.zip"
$DeployDir = "deploy_temp"

Write-Host "Iniciando preparação do pacote de deploy..." -ForegroundColor Cyan

if (Test-Path $DeployZip) {
    Remove-Item $DeployZip -Force
}

if (Test-Path $DeployDir) {
    Remove-Item $DeployDir -Recurse -Force
}

New-Item -ItemType Directory -Path $DeployDir | Out-Null

Write-Host "Compilando Frontend para Produção..." -ForegroundColor Yellow
Set-Location -Path "frontend"
npm run build
Set-Location -Path ".."

Write-Host "Copiando arquivos essenciais para empacotamento..." -ForegroundColor Yellow
Copy-Item -Path "src" -Destination "$DeployDir\src" -Recurse
Copy-Item -Path "package.json" -Destination $DeployDir
if (Test-Path "package-lock.json") { Copy-Item -Path "package-lock.json" -Destination $DeployDir }
Copy-Item -Path "ecosystem.config.js" -Destination $DeployDir

# Copia o frontend compilado
New-Item -ItemType Directory -Path "$DeployDir\frontend" | Out-Null
Copy-Item -Path "frontend\dist" -Destination "$DeployDir\frontend\dist" -Recurse

Write-Host "Gerando o arquivo ZIP..." -ForegroundColor Yellow
Compress-Archive -Path "$DeployDir\*" -DestinationPath $DeployZip

Write-Host "Limpando arquivos temporários..." -ForegroundColor Yellow
Remove-Item $DeployDir -Recurse -Force

Write-Host "=============================================" -ForegroundColor Green
Write-Host "Sucesso! Arquivo gerado: $DeployZip" -ForegroundColor Green
Write-Host "Tamanho:" (Get-Item $DeployZip).Length "bytes" -ForegroundColor Green
Write-Host "Pronto para ser enviado ao VPS 85.31.60.68!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
