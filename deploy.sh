#!/bin/bash

# Script de déploiement Assurini
# Usage: ./deploy.sh

echo "🚀 Déploiement Assurini sur Vercel"
echo ""

# Vérifier que les changements sont commitées
if [[ -n $(git status -s) ]]; then
    echo "⚠️  Vous avez des changements non commitées."
    echo "Voulez-vous les commiter maintenant? (y/n)"
    read -r response
    if [[ "$response" == "y" ]]; then
        echo "📝 Commit des changements..."
        git add .
        git commit -m "Migration OpenRouter et mise à jour Next.js 15.3.8"
        echo "✅ Changements commitées"
    else
        echo "❌ Déploiement annulé. Commitez vos changements d'abord."
        exit 1
    fi
fi

# Push vers GitHub
echo ""
echo "📤 Push vers GitHub..."
git push

# Vérifier si Vercel CLI est installé
if ! command -v vercel &> /dev/null; then
    echo ""
    echo "⚠️  Vercel CLI n'est pas installé."
    echo "Installez-le avec: npm install -g vercel"
    echo ""
    echo "Ou déployez via GitHub (push automatique vers Vercel)"
    exit 1
fi

# Déployer sur Vercel
echo ""
echo "🚀 Déploiement sur Vercel..."
vercel --prod

echo ""
echo "✅ Déploiement terminé!"
echo ""
echo "📋 N'oubliez pas de configurer la variable d'environnement:"
echo "   OPENROUTER_API_KEY dans les paramètres Vercel"
echo ""
echo "📖 Voir DEPLOIEMENT_VERCEL.md pour plus de détails"

