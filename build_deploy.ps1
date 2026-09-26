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

# 2. Limpar pastas antigas para evitar lixo
Write-Host "Limpando PublicacaoSite antigo..."
Remove-Item -Path "PublicacaoSite\assets" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "PublicacaoSite\public\assets" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "PublicacaoSite\frontend\dist\assets" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Copiar Frontend para a raiz do PublicacaoSite (onde o Dockerfile pega os arquivos)
Write-Host "Copiando build do Frontend para a raiz de PublicacaoSite..."
Copy-Item -Path "frontend\dist\*" -Destination "PublicacaoSite" -Recurse -Force
Copy-Item -Path "public\landing.html" -Destination "PublicacaoSite" -Force -ErrorAction SilentlyContinue
Copy-Item -Path "login_inicial.html" -Destination "PublicacaoSite" -Force -ErrorAction SilentlyContinue


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

# 6. Atualizar FORCE_REDEPLOY no Easypanel para forçar rebuild Docker sem cache
Write-Host ""
Write-Host "Atualizando FORCE_REDEPLOY no Easypanel..." -ForegroundColor Cyan
$easyUrl  = "http://85.31.60.68:3000"
$easyUser = "edsonmanoel2012@gmail.com"
$easyPass = "10207597Rdv*1"
$buildTag = "deploy-$(Get-Date -Format 'yyyyMMdd-HHmm')"
try {
    # Login
    $loginBody = @{ email = $easyUser; password = $easyPass } | ConvertTo-Json
    $loginResp = Invoke-WebRequest -Uri "$easyUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -UseBasicParsing -ErrorAction Stop
    $token = ($loginResp.Content | ConvertFrom-Json).token
    if ($token) {
        # Atualiza env var
        $envBody = @{ projectName = "sinco"; serviceName = "app"; env = "FORCE_REDEPLOY=$buildTag" } | ConvertTo-Json
        Invoke-WebRequest -Uri "$easyUrl/api/services/update" -Method POST -Body $envBody -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing -ErrorAction SilentlyContinue | Out-Null
        Write-Host "✅ FORCE_REDEPLOY = $buildTag" -ForegroundColor Green
    }
} catch {
    Write-Warning "Não foi possível atualizar FORCE_REDEPLOY via API: $_"
}

# 7. Acionar deploy no Easypanel via Webhook
Write-Host ""
Write-Host "Acionando deploy no Easypanel..." -ForegroundColor Cyan
$webhookUrl = "http://85.31.60.68:3000/api/deploy/f91a80aa82214fce8c7eb46808eec772b3dfce8953c0849e"
try {
    $response = Invoke-WebRequest -Uri $webhookUrl -Method GET -TimeoutSec 15 -UseBasicParsing -ErrorAction Stop
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
Write-Host "==============================================" -ForegroundColor Green
Write-Host " Deploy finalizado! Novo build em andamento." -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
