# ⚡ Quick Start - Déploiement Assurini

## 🚀 Déploiement en 3 étapes

### Étape 1 : Configurer Vercel

1. Allez sur https://vercel.com
2. Connectez-vous
3. Sélectionnez votre projet **Assurini**
4. Cliquez sur **Settings** → **Environment Variables**
5. Cliquez sur **Add New**
6. Ajoutez :
   ```
   Name: OPENROUTER_API_KEY
   Value: <ta-clef-openrouter>
   Environments: ✅ Production ✅ Preview ✅ Development
   ```
7. Cliquez sur **Save**

### Étape 2 : Déployer

**Option A - Push GitHub (recommandé) :**
```bash
git add .
git commit -m "Migration OpenRouter et Next.js 15.3.8"
git push
```

**Option B - Script PowerShell :**
```powershell
.\deploy.ps1
```

### Étape 3 : Tester

1. Attendez que le déploiement se termine
2. Ouvrez votre site Vercel
3. Testez :
   - Recommandations : `/quote`
   - Chatbot : Icône en bas à droite

---

## ✅ C'est tout !

Votre application est maintenant :
- ✅ Sécurisée (Next.js 15.3.8)
- ✅ Fonctionnelle (OpenRouter IA)
- ✅ Déployée sur Vercel

---

## 📚 Documentation complète

- **Déploiement détaillé** : `DEPLOIEMENT_VERCEL.md`
- **Modifications** : `RESUME_MODIFICATIONS.md`
- **Historique** : `CHANGELOG.md`

---

## 🆘 Problème ?

**Erreur "service indisponible"** → Vérifiez que `OPENROUTER_API_KEY` est bien configurée sur Vercel

**Erreur de build** → Vérifiez que Next.js 15.3.8 est dans `package.json`

**Autre problème** → Consultez `DEPLOIEMENT_VERCEL.md` section Dépannage

