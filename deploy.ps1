# Publica as mudanças: envia pro GitHub -> Render atualiza sozinho.
# Uso:  .\deploy.ps1 "mensagem do que mudou"
param([string]$msg = "atualizacao")
$git = "C:\Program Files\Git\cmd\git.exe"
& $git add -A
& $git commit -m $msg
& $git push
Write-Host "`nPronto! O Render vai atualizar em 1-2 minutos." -ForegroundColor Green
