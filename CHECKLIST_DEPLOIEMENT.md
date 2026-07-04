# ✅ Checklist de Déploiement Assurini

## Avant le déploiement

### Tests locaux
- [ ] Le serveur démarre sans erreur (`npm run dev`)
- [ ] La page d'accueil s'affiche (http://localhost:9002)
- [ ] Les recommandations fonctionnent (/quote)
- [ ] Le chatbot répond correctement
- [ ] Aucune erreur dans la console du navigateur
- [ ] Aucune erreur dans le terminal

### Code
- [ ] Next.js 15.3.8 dans package.json
- [ ] Fichier `.env.local` existe avec `OPENROUTER_API_KEY`
- [ ] Fichier `.env.local` est dans `.gitignore`
- [ ] Pas de clés API dans le code source
- [ ] Tous les fichiers sont sauvegardés

## Configuration Vercel

### Variables d'environnement
- [ ] Compte Vercel créé/connecté
- [ ] Projet Assurini sélectionné
- [ ] Variable `OPENROUTER_API_KEY` ajoutée
- [ ] Environnements cochés : Production, Preview, Development
- [ ] Variable sauvegardée

### Connexion GitHub
- [ ] Repository GitHub connecté à Vercel
- [ ] Branche principale configurée (main/master)
- [ ] Auto-deploy activé

## Déploiement

### Commit et Push
- [ ] Changements commitées localement
  ```bash
  git add .
  git commit -m "Migration OpenRouter et Next.js 15.3.8"
  ```
- [ ] Push vers GitHub
  ```bash
  git push
  ```

### Build Vercel
- [ ] Build démarre automatiquement
- [ ] Build réussit sans erreur
- [ ] Déploiement terminé

## Tests en production

### Fonctionnalités
- [ ] Site accessible (URL Vercel)
- [ ] Page d'accueil s'affiche
- [ ] Navigation fonctionne
- [ ] Formulaire de devis fonctionne
- [ ] Recommandations d'assurance fonctionnent
- [ ] Chatbot répond correctement
- [ ] Authentification fonctionne
- [ ] Génération de PDF fonctionne

### Performance
- [ ] Temps de chargement acceptable
- [ ] Pas d'erreurs 500
- [ ] Pas d'erreurs dans la console

### Sécurité
- [ ] HTTPS activé
- [ ] Pas de clés API exposées
- [ ] Variables d'environnement sécurisées

## Post-déploiement

### Monitoring
- [ ] Vérifier les logs Vercel
- [ ] Vérifier les analytics
- [ ] Tester sur mobile
- [ ] Tester sur différents navigateurs

### Documentation
- [ ] README.md à jour
- [ ] CHANGELOG.md à jour
- [ ] Documentation technique à jour

## En cas de problème

### Rollback
- [ ] Savoir comment revenir à la version précédente
- [ ] Avoir un backup du code

### Support
- [ ] Logs Vercel consultés
- [ ] Documentation consultée
- [ ] Équipe technique contactée si nécessaire

---

## 🎉 Déploiement réussi !

Si toutes les cases sont cochées, félicitations ! 🚀

Votre application Assurini est maintenant :
- ✅ Déployée sur Vercel
- ✅ Sécurisée (Next.js 15.3.8)
- ✅ Fonctionnelle (OpenRouter IA)
- ✅ Prête pour la production

---

**Date du déploiement** : _______________  
**Version déployée** : 1.0.0  
**Déployé par** : _______________

