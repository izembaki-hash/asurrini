# Script de déploiement Assurini pour Windows PowerShell
# Usage: .\deploy.ps1

Write-Host "🚀 Déploiement Assurini sur Vercel" -ForegroundColor Cyan
Write-Host ""

# Vérifier que les changements sont commitées
$gitStatus = git status -s
if ($gitStatus) {
    Write-Host "⚠️  Vous avez des changements non commitées." -ForegroundColor Yellow
    $response = Read-Host "Voulez-vous les commiter maintenant? (y/n)"
    if ($response -eq "y") {
        Write-Host "📝 Commit des changements..." -ForegroundColor Green
        git add .
        git commit -m "Migration OpenRouter et mise à jour Next.js 15.3.8"
        Write-Host "✅ Changements commitées" -ForegroundColor Green
    } else {
        Write-Host "❌ Déploiement annulé. Commitez vos changements d'abord." -ForegroundColor Red
        exit 1
    }
}

# Push vers GitHub
Write-Host ""
Write-Host "📤 Push vers GitHub..." -ForegroundColor Cyan
git push

# Vérifier si Vercel CLI est installé
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelInstalled) {
    Write-Host ""
    Write-Host "⚠️  Vercel CLI n'est pas installé." -ForegroundColor Yellow
    Write-Host "Installez-le avec: npm install -g vercel" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Ou déployez via GitHub (push automatique vers Vercel)" -ForegroundColor Cyan
    exit 1
}

# Déployer sur Vercel
Write-Host ""
Write-Host "🚀 Déploiement sur Vercel..." -ForegroundColor Cyan
vercel --prod

Write-Host ""
Write-Host "✅ Déploiement terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 N'oubliez pas de configurer la variable d'environnement:" -ForegroundColor Yellow
Write-Host "   OPENROUTER_API_KEY dans les paramètres Vercel" -ForegroundColor Yellow
Write-Host ""
Write-Host "📖 Voir DEPLOIEMENT_VERCEL.md pour plus de détails" -ForegroundColor Cyan

