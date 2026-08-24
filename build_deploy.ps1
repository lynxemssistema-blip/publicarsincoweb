Write-Host "Iniciando processo de deploy para o Easypanel..."

# 1. Build do Frontend
Write-Host "Construindo o Frontend..."
Set-Location frontend
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao construir o frontend."
    exit $LASTEXITCODE
}
Set-Location ..

# 2. Limpar pasta antiga para evitar lixo
Write-Host "Limpando PublicacaoSite antigo..."
Remove-Item -Path "PublicacaoSite\assets" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Copiar Frontend
Write-Host "Copiando build do Frontend..."
New-Item -Path "PublicacaoSite\public" -ItemType Directory -Force | Out-Null
Copy-Item -Path "frontend\dist\*" -Destination "PublicacaoSite\public" -Recurse -Force
Copy-Item -Path "public\landing.html" -Destination "PublicacaoSite\public" -Force -ErrorAction SilentlyContinue
Copy-Item -Path "login_inicial.html" -Destination "PublicacaoSite\public" -Force -ErrorAction SilentlyContinue

# 4. Copiar Backend
Write-Host "Copiando arquivos do Backend..."
Copy-Item -Path "src\*" -Destination "PublicacaoSite\src" -Recurse -Force
Copy-Item -Path "package.json" -Destination "PublicacaoSite" -Force
Copy-Item -Path "package-lock.json" -Destination "PublicacaoSite" -Force

# 5. Commit e Push
Write-Host "Enviando atualizações para o GitHub (sinco-web e publicarsincoweb)..."
git add PublicacaoSite/
git commit -m "chore: atualiza PublicacaoSite com a ultima versao - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git push origin main
git push deployrepo main --force

# 6. Acionar deploy no Easypanel via Webhook
Write-Host ""
Write-Host "Acionando deploy no Easypanel..." -ForegroundColor Cyan
$webhookUrl = "http://85.31.60.68:3000/api/deploy/f91a80aa82214fce8c7eb46808eec772b3dfce8953c0849e"
try {
    $response = Invoke-WebRequest -Uri $webhookUrl -Method GET -TimeoutSec 15 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Deploy acionado com sucesso no Easypanel!" -ForegroundColor Green
        Write-Host "   Acompanhe em: http://85.31.60.68:3000/projects/sinco/app/app/deployments" -ForegroundColor DarkCyan
    } else {
        Write-Warning "Easypanel retornou status: $($response.StatusCode)"
    }
} catch {
    Write-Warning "Não foi possível acionar o webhook automaticamente: $_"
    Write-Host "   Acione manualmente em: http://85.31.60.68:3000" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host " Deploy finalizado! Novo build em andamento." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
