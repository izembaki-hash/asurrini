# Guide de Déploiement sur Vercel

## ✅ Modifications effectuées

### 1. Migration de Google AI vers OpenRouter
- **Recommandations d'assurance** : Utilise maintenant OpenRouter avec le modèle `mistralai/mistral-7b-instruct:free`
- **Chatbot** : Utilise maintenant OpenRouter avec le modèle `mistralai/mistral-7b-instruct:free`
- **Fichiers modifiés** :
  - `src/ai/flows/recommend-insurance-plan.ts`
  - `src/ai/flows/chatbot-flow.ts`

### 2. Mise à jour de sécurité Next.js
- **Version** : Mise à jour vers Next.js 15.3.8 (corrige CVE-2025-66478, CVE-2025-55183, CVE-2025-55184)

## 🔑 Configuration requise pour Vercel

### Variable d'environnement obligatoire

Ajoutez cette variable d'environnement dans les paramètres de votre projet Vercel :

**Nom de la variable :**
```
OPENROUTER_API_KEY
```

**Valeur :**
```
<ta-clef-openrouter>
```

### Étapes pour ajouter la variable sur Vercel

1. Allez sur [vercel.com](https://vercel.com) et connectez-vous
2. Sélectionnez votre projet **Assurini**
3. Cliquez sur **Settings** (Paramètres)
4. Dans le menu de gauche, cliquez sur **Environment Variables**
5. Cliquez sur **Add New**
6. Remplissez :
   - **Name** : `OPENROUTER_API_KEY`
   - **Value** : `<ta-clef-openrouter>`
   - **Environments** : Cochez **Production**, **Preview**, et **Development**
7. Cliquez sur **Save**

## 🚀 Déploiement

### Option 1 : Déploiement automatique (recommandé)

Si vous avez connecté votre dépôt GitHub à Vercel :

1. Commitez vos changements :
   ```bash
   git add .
   git commit -m "Migration vers OpenRouter et mise à jour Next.js 15.3.8"
   git push
   ```

2. Vercel déploiera automatiquement

### Option 2 : Déploiement manuel

```bash
vercel --prod
```

## ✅ Vérification après déploiement

1. **Testez les recommandations d'assurance** :
   - Allez sur `/quote`
   - Remplissez le formulaire
   - Vérifiez que la recommandation s'affiche

2. **Testez le chatbot** :
   - Cliquez sur l'icône de chat
   - Envoyez un message
   - Vérifiez que le bot répond

## 🔧 Dépannage

### Erreur : "Le service de chat est temporairement indisponible"
- Vérifiez que la variable `OPENROUTER_API_KEY` est bien configurée
- Redéployez l'application après avoir ajouté la variable

### Erreur : "Limite de requêtes atteinte"
- Le modèle gratuit a des limites de taux
- Attendez quelques secondes et réessayez
- Ou passez à un modèle payant sur OpenRouter

### Erreur de build Vercel
- Vérifiez que Next.js 15.3.8 est bien dans `package.json`
- Vérifiez qu'il n'y a pas d'erreurs TypeScript

## 📊 Modèles utilisés

- **Recommandations** : `mistralai/mistral-7b-instruct:free`
- **Chatbot** : `mistralai/mistral-7b-instruct:free`

Ces modèles sont gratuits mais ont des limites de taux. Pour une utilisation en production intensive, envisagez de passer à des modèles payants.

## 🔐 Sécurité

⚠️ **Important** : Ne commitez JAMAIS la clé API dans votre code. Elle doit toujours être dans les variables d'environnement.

## 📝 Notes

- Les anciennes dépendances Genkit sont toujours présentes mais ne sont plus utilisées
- Vous pouvez les supprimer plus tard si vous le souhaitez
- L'application fonctionne maintenant sans Google AI API

