# Documentation

Ce dossier contient toute la documentation technique du projet AI Story Generator.

## 📚 Fichiers de Documentation

### 🏗️ [ARCHITECTURE.md](./ARCHITECTURE.md)
Description complète de l'architecture du projet :
- Structure du code
- Technologies utilisées
- Organisation des fichiers
- Flux de données

### 🗄️ [DATABASE_README.md](./DATABASE_README.md)
Guide complet de la base de données PostgreSQL :
- Configuration de la base de données
- Schéma des tables
- Migration depuis le stockage fichier
- Gestion des connexions
- Compatibilité Python 3.13

### 🚀 [POSTGRES_QUICKSTART.md](./POSTGRES_QUICKSTART.md)
Guide de démarrage rapide pour PostgreSQL :
- Installation en local
- Configuration de base
- Premiers pas
- Tests rapides
- Déploiement sur Render.com

## 🔍 Guide Rapide

### Démarrer avec le Projet
1. Lisez le [README principal](../README.md) pour une vue d'ensemble
2. Consultez [POSTGRES_QUICKSTART.md](./POSTGRES_QUICKSTART.md) pour configurer la base de données
3. Référez-vous à [ARCHITECTURE.md](./ARCHITECTURE.md) pour comprendre la structure

### Pour les Développeurs
- **Backend** : Voir [DATABASE_README.md](./DATABASE_README.md) pour les détails de l'ORM et des requêtes
- **Frontend** : Voir [README du frontend](../frontend/README.md)
- **Scripts** : Voir [README des scripts](../scripts/README.md)

## 🔧 Technologies Documentées

- **Backend** : FastAPI, Python 3.13, SQLAlchemy 2.0, psycopg3
- **Base de données** : PostgreSQL 14+
- **Frontend** : React, Vite
- **IA** : Mistral AI API

## 🎯 Parcours de Lecture Recommandé

### Pour les Nouveaux Utilisateurs
1. README principal (racine du projet)
2. [POSTGRES_QUICKSTART.md](./POSTGRES_QUICKSTART.md)
3. [Scripts README](../scripts/README.md)

### Pour les Développeurs Backend
1. [ARCHITECTURE.md](./ARCHITECTURE.md)
2. [DATABASE_README.md](./DATABASE_README.md)
3. Code source dans `backend/`

### Pour le Déploiement
1. [POSTGRES_QUICKSTART.md](./POSTGRES_QUICKSTART.md) (section Render.com)
2. [DATABASE_README.md](./DATABASE_README.md) (section production)
3. Variables d'environnement dans `.env.example`

## 🐛 Résolution de Problèmes

Chaque document contient une section de dépannage pour les problèmes courants :
- **Connexion DB** : Voir [DATABASE_README.md](./DATABASE_README.md)
- **Installation** : Voir [POSTGRES_QUICKSTART.md](./POSTGRES_QUICKSTART.md)
- **Scripts** : Voir [Scripts README](../scripts/README.md)

## 📝 Contribuer à la Documentation

Si vous ajoutez de nouvelles fonctionnalités :
1. Mettez à jour [ARCHITECTURE.md](./ARCHITECTURE.md) si la structure change
2. Documentez les changements de DB dans [DATABASE_README.md](./DATABASE_README.md)
3. Ajoutez des exemples dans [POSTGRES_QUICKSTART.md](./POSTGRES_QUICKSTART.md) si pertinent

## 🔗 Liens Utiles

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Mistral AI Documentation](https://docs.mistral.ai/)
- [Render.com Documentation](https://render.com/docs)
