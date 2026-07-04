# Changelog - Assurini

## [2026-01-04] - Migration OpenRouter et Mise à jour de sécurité

### 🔄 Changements majeurs

#### Migration de Google AI vers OpenRouter
- **Raison** : Problèmes d'authentification avec Google AI API
- **Solution** : Migration vers OpenRouter qui supporte plusieurs modèles d'IA

#### Fichiers modifiés

1. **`src/ai/flows/recommend-insurance-plan.ts`**
   - Suppression de l'utilisation de Genkit
   - Implémentation directe de l'API OpenRouter
   - Modèle utilisé : `mistralai/mistral-7b-instruct:free`
   - Amélioration de la gestion des erreurs (429, 401, 402)
   - Amélioration du parsing JSON pour gérer les réponses avec markdown

2. **`src/ai/flows/chatbot-flow.ts`**
   - Remplacement de Genkit par OpenRouter
   - Modèle utilisé : `mistralai/mistral-7b-instruct:free`
   - Conservation du prompt système original
   - Gestion de l'historique de conversation

### 🔒 Sécurité

#### Mise à jour Next.js
- **Ancienne version** : 15.2.3
- **Nouvelle version** : 15.3.8
- **CVE corrigées** :
  - CVE-2025-66478 (Remote Code Execution)
  - CVE-2025-55183 (Source Code Exposure - Medium)
  - CVE-2025-55184 (Denial of Service - High)
  - CVE-2025-67779 (Complete DoS Fix)

### ➕ Ajouts

- **`DEPLOIEMENT_VERCEL.md`** : Guide complet de déploiement
- **`.env.example`** : Template des variables d'environnement
- **`CHANGELOG.md`** : Ce fichier

### 🔧 Configuration

#### Nouvelle variable d'environnement requise
```
OPENROUTER_API_KEY=sk-or-v1-...
```

### ✅ Tests effectués

- ✅ Recommandations d'assurance fonctionnelles
- ✅ Chatbot fonctionnel
- ✅ Parsing JSON amélioré
- ✅ Gestion des erreurs API

### 📊 Performance

- **Modèles gratuits** : Limites de taux appliquées par OpenRouter
- **Temps de réponse** : ~2-5 secondes pour les recommandations
- **Temps de réponse** : ~1-3 secondes pour le chatbot

### 🚀 Prochaines étapes recommandées

1. Déployer sur Vercel avec la variable d'environnement
2. Tester en production
3. Monitorer les limites de taux
4. Envisager un upgrade vers des modèles payants si nécessaire

### 🐛 Problèmes connus

- Les modèles gratuits ont des limites de taux strictes
- Certains modèles gratuits peuvent être temporairement indisponibles
- Le parsing JSON peut échouer si le modèle génère du texte non-JSON

### 💡 Améliorations futures possibles

- Implémenter un système de retry automatique
- Ajouter un cache pour les recommandations similaires
- Passer à des modèles payants pour plus de stabilité
- Ajouter des métriques de monitoring

