# 🎓 App CAP Frontend - TypeScript

Application web frontend pour le système de gestion du Centre Autonome de Perfectionnement (CAP).

**Stack Technique** : React 19 + TypeScript + Vite + CoreUI

---

## ✨ Statut du Projet

✅ **Migration TypeScript complète**
- 115 fichiers convertis de JavaScript vers TypeScript
- 0 fichiers JavaScript restants
- Configuration TypeScript stricte
- Types et interfaces créés pour tous les modules

---

## 🚀 Démarrage Rapide

### Prérequis
- Node.js >= 18
- npm >= 9

### Installation

```bash
# Installer les dépendances
npm install

# Démarrer en mode développement
npm start

# ou
npm run dev
```

L'application sera disponible sur [http://localhost:3000](http://localhost:3000)

### Build Production

```bash
# Vérifier les types
npm run type-check

# Build
npm run build

# Preview du build
npm run serve
```

---

## 📁 Structure du Projet

```
app-cap-frontend/
├── src/
│   ├── types/              # Types TypeScript centralisés
│   ├── services/           # Services API
│   ├── hooks/              # Custom React Hooks
│   ├── components/         # Composants réutilisables
│   ├── views/              # Pages/Vues
│   ├── layout/             # Layouts
│   ├── contexts/           # React Contexts
│   ├── _nav/               # Configuration navigation
│   ├── utils/              # Utilitaires
│   └── config/             # Configuration
├── public/                 # Fichiers statiques
└── docs/                   # Documentation
```

Voir [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) pour plus de détails.

---

## 📚 Modules Fonctionnels

### 🎯 Inscription
- Gestion des étudiants
- Années académiques
- Candidatures
- Dossiers d'inscription

### 💰 Finance
- Paiements et quittances
- Comptes étudiants
- Tarifs de scolarité
- Statistiques financières

### 📖 Cours & Notes
- Emploi du temps
- Gestion des cours
- Saisie des notes
- Bulletins

### 📋 Présence
- Feuilles d'émargement
- Suivi de présence
- Statistiques d'assiduité

### 📚 Bibliothèque
- Gestion du catalogue
- Emprunts/Retours

### 📜 Attestations
- Génération d'attestations
- Certificats de scolarité

### 💼 RH
- Gestion du personnel
- Planning des enseignants

### 🎓 Soutenances
- Planification
- Suivi des soutenances

---

## 🛠️ Technologies

### Frontend
- **React 19** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool ultra-rapide
- **CoreUI** - UI Framework
- **React Router** - Navigation
- **Axios** - HTTP Client
- **Redux** - State management (optionnel)

### Outils de développement
- **ESLint** - Linter
- **Prettier** - Formateur de code
- **Sass** - Préprocesseur CSS

---

## 📖 Documentation

- [MIGRATION_TYPESCRIPT.md](./MIGRATION_TYPESCRIPT.md) - Guide de migration TypeScript
- [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) - Structure détaillée du projet

---

## 🎯 Path Mappings

Imports simplifiés grâce aux alias :

```typescript
// Au lieu de : import { User } from '../../../types/index';
import { User } from '@/types';

// Au lieu de : import AuthService from '../../../services/auth.service';
import AuthService from '@/services/auth.service';

// Et ainsi de suite...
import { useEtudiant } from '@/hooks/inscription/useEtudiant';
import { StudentCard } from '@/components/StudentCard';
```

---

## 📝 Scripts Disponibles

```bash
# Développement
npm start              # Démarrer le serveur de dev
npm run dev            # Alias pour start

# Build
npm run build          # Build production (avec vérification TypeScript)
npm run type-check     # Vérifier les types TypeScript uniquement

# Qualité du code
npm run lint           # Linter le code

# Preview
npm run serve          # Prévisualiser le build production
```

---

## 🔒 Authentification

L'application utilise un système d'authentification basé sur JWT :
- Connexion via `/login`
- Routes protégées par `ProtectedRoutes`
- Token stocké et géré automatiquement

---

## 🌐 Configuration API

Backend API : `http://localhost:8000/api/`

Modifier dans `src/services/http.service.ts` :

```typescript
const API_URL = "http://localhost:8000/api/";
```

---

## 🎨 Personnalisation

### Thème
Les styles sont dans `src/scss/style.scss`

### Navigation
Configuration dans `src/_nav/`

### Routes
Configuration dans `src/routes.ts`

---

## 🧪 Tests

```bash
# À venir
npm test
```

---

## 📦 Build & Déploiement

```bash
# Build
npm run build

# Les fichiers de production seront dans ./build/
```

---

## 🤝 Contribution

### Conventions de code
- Utiliser TypeScript strict
- Nommer les composants en PascalCase
- Nommer les fichiers en kebab-case ou PascalCase
- Suivre les conventions ESLint/Prettier

### Workflow
1. Créer une branche feature
2. Coder avec TypeScript
3. Tester localement
4. Vérifier les types : `npm run type-check`
5. Commit et Push
6. Créer une Pull Request

---

## 📄 Licence

MIT

---

## 👥 Équipe

**Cellule Informatique du CAP**

---

## 📞 Support

Pour toute question ou problème :
- Email : support@cap.sn
- Issues : [GitHub Issues](https://github.com/...)

---

**Version** : 5.5.0 (TypeScript)  
**Dernière mise à jour** : Novembre 2025
