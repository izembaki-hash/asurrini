# 🤖 Modèles IA Disponibles sur OpenRouter

## ✅ Modèle actuellement utilisé

**Google Gemini 2.0 Flash Experimental** (`google/gemini-2.0-flash-exp:free`)

### Avantages :
- ✅ **Gratuit**
- ✅ **Rapide** (temps de réponse ~1-2 secondes)
- ✅ **Stable** (moins de surcharge que Mistral)
- ✅ **Limites généreuses** (plus de requêtes par minute)
- ✅ **Bonne qualité** de réponses

### Utilisé pour :
- Recommandations d'assurance
- Chatbot de support client

---

## 🔄 Autres modèles gratuits disponibles

### 1. Meta Llama 3.1 8B Instruct (Gratuit)
```
meta-llama/llama-3.1-8b-instruct:free
```
- ✅ Très bon pour les conversations
- ✅ Rapide
- ⚠️ Peut avoir des limites de taux

### 2. Mistral 7B Instruct (Gratuit)
```
mistralai/mistral-7b-instruct:free
```
- ✅ Bon pour le français
- ⚠️ **Souvent surchargé** (beaucoup d'utilisateurs)
- ⚠️ Limites de taux strictes

### 3. Google Gemini Flash 1.5 (Gratuit)
```
google/gemini-flash-1.5:free
```
- ✅ Stable
- ✅ Bon équilibre vitesse/qualité
- ✅ Alternative au 2.0 Flash

---

## 💰 Modèles payants (meilleure qualité)

### 1. GPT-4 Turbo
```
openai/gpt-4-turbo
```
- 💰 ~$0.01 par 1000 tokens
- ✅ Excellente qualité
- ✅ Très stable

### 2. Claude 3.5 Sonnet
```
anthropic/claude-3.5-sonnet
```
- 💰 ~$0.003 par 1000 tokens
- ✅ Excellente qualité
- ✅ Très bon pour le français

### 3. GPT-4o
```
openai/gpt-4o
```
- 💰 ~$0.005 par 1000 tokens
- ✅ Rapide et de qualité
- ✅ Bon rapport qualité/prix

---

## 🔧 Comment changer de modèle

### Fichiers à modifier :

1. **Pour les recommandations** : `src/ai/flows/recommend-insurance-plan.ts`
   - Ligne ~141 : `model: 'nom-du-modele'`

2. **Pour le chatbot** : `src/ai/flows/chatbot-flow.ts`
   - Ligne ~68 : `model: 'nom-du-modele'`

### Exemple :

```typescript
body: JSON.stringify({
  model: 'meta-llama/llama-3.1-8b-instruct:free', // Changez ici
  messages: messages,
  temperature: 0.7,
}),
```

---

## 📊 Comparaison des modèles gratuits

| Modèle | Vitesse | Stabilité | Qualité | Français | Recommandé |
|--------|---------|-----------|---------|----------|------------|
| **Gemini 2.0 Flash** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ **OUI** |
| Llama 3.1 8B | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Oui |
| Gemini Flash 1.5 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ Oui |
| Mistral 7B | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⚠️ Non (surchargé) |

---

## 🚨 Problèmes courants

### Erreur : "Service temporairement indisponible"
**Cause** : Modèle surchargé ou limite de taux atteinte

**Solutions** :
1. Attendez 30-60 secondes
2. Changez de modèle (voir ci-dessus)
3. Passez à un modèle payant

### Erreur 429 : "Too Many Requests"
**Cause** : Trop de requêtes en peu de temps

**Solutions** :
1. Attendez quelques minutes
2. Utilisez un modèle moins populaire
3. Passez à un modèle payant

### Erreur 402 : "Payment Required"
**Cause** : Modèle payant sans crédits

**Solutions** :
1. Utilisez un modèle gratuit (`:free`)
2. Ajoutez des crédits sur OpenRouter

---

## 💡 Recommandations

### Pour le développement local :
✅ **Gemini 2.0 Flash** (actuel) - Gratuit et stable

### Pour la production (faible trafic) :
✅ **Gemini 2.0 Flash** - Gratuit, suffisant pour <1000 requêtes/jour

### Pour la production (trafic moyen/élevé) :
💰 **GPT-4o** ou **Claude 3.5 Sonnet** - Meilleure qualité et stabilité

---

## 📝 Notes

- Les modèles gratuits ont des **limites de taux** (ex: 10-20 requêtes/minute)
- Les modèles payants sont facturés au **token** (environ $0.001-0.01 par requête)
- Vous pouvez voir vos crédits sur https://openrouter.ai/credits
- Les modèles `:free` sont parfaits pour le développement et les petits projets

---

**Modèle actuel** : `google/gemini-2.0-flash-exp:free`  
**Dernière mise à jour** : 2026-01-04

