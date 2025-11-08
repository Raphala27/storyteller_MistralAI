# 📋 Guide des Logs

Ce guide explique comment visualiser et gérer les logs de l'application AI Story Generator.

## 🎯 Méthodes de Visualisation

### 1. Logs Sauvegardés (Recommandé) 💾

Utilisez `start_with_logs.sh` pour sauvegarder tous les logs dans des fichiers :

```bash
bash scripts/start_with_logs.sh
```

**Avantages :**
- ✅ Logs persistants même après l'arrêt
- ✅ Peut analyser/rechercher dans les fichiers
- ✅ Consulter les logs à tout moment
- ✅ Partager les logs pour le débogage

**Localisation des logs :**
```
logs/
├── backend.log     # Logs du serveur FastAPI
└── frontend.log    # Logs du serveur Vite
```

**Consulter les logs :**
```bash
# Voir les logs en temps réel
tail -f logs/backend.log
tail -f logs/frontend.log

# Voir les dernières lignes
tail -n 50 logs/backend.log

# Rechercher dans les logs
grep "error" logs/backend.log
grep "http://localhost" logs/frontend.log

# Ouvrir dans VS Code
code logs/backend.log
```

---

### 2. Logs Colorés et Horodatés 🎨

Utilisez `start_verbose.sh` pour des logs enrichis :

```bash
bash scripts/start_verbose.sh
```

**Avantages :**
- ✅ Couleurs pour distinguer backend/frontend
- ✅ Timestamps précis sur chaque ligne
- ✅ Affichage en temps réel ET sauvegarde
- ✅ Parfait pour le développement

**Exemple d'affichage :**
```
[15:30:15] [BACKEND] ✅ Database tables created successfully
[15:30:15] [BACKEND] INFO:     Application startup complete.
[15:30:16] [FRONTEND] VITE v7.2.0  ready in 123 ms
[15:30:16] [FRONTEND] ➜  Local:   http://localhost:5173/
```

---

### 3. VS Code Tasks (Le Plus Pratique) 🚀

**Ouvrir les tasks :**
- `Cmd+Shift+P` (Mac) ou `Ctrl+Shift+P` (Windows/Linux)
- Taper : `Tasks: Run Task`

**Tasks disponibles :**

| Task | Description |
|------|-------------|
| `Start Both Servers` | Lance backend + frontend dans des panneaux séparés |
| `Start Backend` | Backend seul avec ses logs |
| `Start Frontend` | Frontend seul avec ses logs |
| `View Backend Logs` | Ouvre backend.log en temps réel |
| `View Frontend Logs` | Ouvre frontend.log en temps réel |

**Avantages :**
- ✅ Chaque serveur dans son propre terminal
- ✅ Pas de logs mélangés
- ✅ Intégré dans VS Code
- ✅ Arrêt facile de chaque serveur

---

## 📊 Analyser les Logs

### Erreurs Courantes Backend

```bash
# Erreurs de connexion à la base de données
grep -i "database\|postgres\|connection" logs/backend.log

# Erreurs Mistral AI
grep -i "mistral\|api key" logs/backend.log

# Erreurs Python générales
grep -i "error\|exception\|traceback" logs/backend.log
```

### Erreurs Courantes Frontend

```bash
# Erreurs de build
grep -i "error\|failed" logs/frontend.log

# Problèmes de connexion API
grep -i "fetch\|axios\|failed to fetch" logs/frontend.log

# Warnings
grep -i "warning" logs/frontend.log
```

### Requêtes API

```bash
# Voir toutes les requêtes HTTP
grep -E "GET|POST|PUT|DELETE" logs/backend.log

# Requêtes sur les stories
grep "/stories" logs/backend.log

# Temps de réponse
grep "ms" logs/frontend.log
```

---

## 🔍 Débogage Avancé

### Augmenter le Niveau de Log Backend

Éditez `backend/database.py` :

```python
engine = create_engine(
    DATABASE_URL,
    echo=True,  # ⬅️ Active les logs SQL détaillés
    # ...
)
```

Puis redémarrez :
```bash
bash scripts/start_with_logs.sh
tail -f logs/backend.log  # Vous verrez toutes les requêtes SQL
```

### Logs Frontend Détaillés

Éditez `frontend/vite.config.js` :

```javascript
export default defineConfig({
  logLevel: 'info',  // ou 'warn', 'error', 'silent'
  // ...
})
```

---

## 📦 Rotation des Logs

Si les logs deviennent trop gros :

```bash
# Archiver les anciens logs
mkdir -p logs/archive
mv logs/backend.log logs/archive/backend-$(date +%Y%m%d-%H%M%S).log
mv logs/frontend.log logs/archive/frontend-$(date +%Y%m%d-%H%M%S).log

# Ou simplement vider
> logs/backend.log
> logs/frontend.log
```

Ajoutez au `.gitignore` :
```
logs/
logs/archive/
```

---

## 🚨 En Cas de Problème

### Les serveurs ne démarrent pas

**Vérifier les logs :**
```bash
cat logs/backend.log
cat logs/frontend.log
```

**Erreurs communes :**

| Erreur | Solution |
|--------|----------|
| `Address already in use` | Port occupé : `lsof -ti:8000 \| xargs kill -9` |
| `MISTRAL_API_KEY not found` | Vérifier `backend/.env` |
| `Module not found` | Réinstaller : `pip install -r requirements.txt` |
| `Connection refused` | PostgreSQL non démarré : `brew services start postgresql@14` |

### Logs vides ou manquants

```bash
# Créer le dossier logs si nécessaire
mkdir -p logs

# Vérifier les permissions
ls -la logs/

# Redémarrer avec logs
bash scripts/start_with_logs.sh
```

---

## 💡 Astuces

### Suivre plusieurs logs simultanément

```bash
# Dans un terminal
tail -f logs/backend.log

# Dans un autre terminal
tail -f logs/frontend.log

# Ou utiliser multitail (si installé)
multitail logs/backend.log logs/frontend.log
```

### Filtrer les logs en temps réel

```bash
# Voir uniquement les erreurs
tail -f logs/backend.log | grep -i error

# Voir uniquement les requêtes POST
tail -f logs/backend.log | grep POST

# Colorier avec grep
tail -f logs/backend.log | grep --color=auto -E "error|warning|$"
```

### Compter les occurrences

```bash
# Nombre d'erreurs
grep -c "error" logs/backend.log

# Nombre de requêtes par endpoint
grep -o "/stories\|/start-story\|/continue-story" logs/backend.log | sort | uniq -c
```

---

## 📚 Ressources

- [Documentation Scripts](../scripts/README.md)
- [Architecture du Projet](../docs/ARCHITECTURE.md)
- [Guide PostgreSQL](../docs/POSTGRES_QUICKSTART.md)
