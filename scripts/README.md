# Scripts

Ce dossier contient les scripts utilitaires pour gérer l'application AI Story Generator.

## 📜 Scripts Disponibles

### 🚀 start.sh
Script principal pour démarrer l'application (backend + frontend).

**Usage:**
```bash
# Depuis n'importe où dans le projet
bash scripts/start.sh

# Ou depuis la racine
./scripts/start.sh
```

**Ce qu'il fait:**
- Vérifie la présence du fichier `.env`
- Démarre le serveur backend FastAPI (port 8000)
- Démarre le serveur frontend Vite (port 5173)
- Affiche les logs combinés dans le terminal
- Gère l'arrêt propre des deux serveurs avec Ctrl+C

---

### 📋 start_with_logs.sh
Script pour démarrer l'application avec sauvegarde des logs dans des fichiers.

**Usage:**
```bash
bash scripts/start_with_logs.sh
```

**Ce qu'il fait:**
- Démarre les deux serveurs en arrière-plan
- Sauvegarde les logs dans `logs/backend.log` et `logs/frontend.log`
- Affiche comment visualiser les logs
- Permet de consulter les logs même après l'arrêt

**Voir les logs en temps réel:**
```bash
# Backend
tail -f logs/backend.log

# Frontend
tail -f logs/frontend.log

# Ouvrir dans VS Code
code logs/backend.log
code logs/frontend.log
```

---

### 🎨 start_verbose.sh
Script pour démarrer avec logs colorés et horodatés dans le terminal ET sauvegardés.

**Usage:**
```bash
bash scripts/start_verbose.sh
```

**Ce qu'il fait:**
- Affiche les logs avec couleurs (vert=backend, bleu=frontend)
- Ajoute un timestamp sur chaque ligne `[HH:MM:SS]`
- Affiche en temps réel ET sauvegarde dans des fichiers
- Parfait pour le développement et le débogage

**Exemple de sortie:**
```
[10:30:15] [BACKEND] INFO:     Application startup complete.
[10:30:16] [FRONTEND] VITE v7.2.0  ready in 123 ms
```

---

### 🗄️ setup_postgres.sh
Script de configuration de la base de données PostgreSQL.

**Usage:**
```bash
# Depuis n'importe où dans le projet
bash scripts/setup_postgres.sh
```

**Ce qu'il fait:**
1. Installe les dépendances Python
2. Vérifie l'installation de PostgreSQL
3. Crée la base de données `storyteller_db` si nécessaire
4. Configure le fichier `.env` avec DATABASE_URL
5. Teste la connexion à la base de données
6. Crée les tables nécessaires
7. Vérifie la structure des fichiers

**Prérequis:**
- PostgreSQL installé (voir ci-dessous)

## 🔧 Installation de PostgreSQL

### macOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows
Téléchargez l'installateur depuis [postgresql.org](https://www.postgresql.org/download/windows/)

## 📝 Notes

- Tous les scripts peuvent être exécutés depuis n'importe quel répertoire du projet
- Les scripts utilisent des chemins relatifs intelligents
- Les codes couleur facilitent la lecture des sorties

## 🆘 Dépannage

### Le script start.sh ne démarre pas
- Vérifiez que vous avez un fichier `.env` dans `backend/` avec votre `MISTRAL_API_KEY`
- Assurez-vous que les dépendances sont installées : `cd backend && pip install -r requirements.txt`

### Le script setup_postgres.sh échoue
- Vérifiez que PostgreSQL est bien installé et démarré
- Assurez-vous d'avoir les droits de créer une base de données
- Sur macOS avec Homebrew : `brew services restart postgresql@14`

### Port déjà utilisé
Si le port 8000 ou 5173 est déjà utilisé :
```bash
# Trouver et tuer le processus
lsof -ti:8000 | xargs kill -9  # Pour le backend
lsof -ti:5173 | xargs kill -9  # Pour le frontend
```

## 📚 Documentation

Pour plus d'informations, consultez :
- [Documentation complète](../docs/DATABASE_README.md)
- [Guide de démarrage rapide PostgreSQL](../docs/POSTGRES_QUICKSTART.md)
- [Architecture du projet](../docs/ARCHITECTURE.md)
