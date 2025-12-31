# Module Soutenance

Ce module gère la soumission et l'organisation des soutenances de mémoires.

## Pages créées

### 1. SubmissionPeriods.tsx
Gestion des périodes de soumission par année académique.

**Fonctionnalités :**
- Affichage des périodes par année académique
- Ajout de nouvelles périodes
- Modification des périodes existantes
- Affichage du nombre de jours restants
- Badge de statut (actif/expiré)

**Routes API utilisées :**
- `GET /api/soutenance/periods` - Liste des périodes
- `POST /api/soutenance/periods` - Créer une période
- `PUT /api/soutenance/periods/{id}` - Modifier une période

### 2. SubmissionsList.tsx
Liste et gestion des soumissions de mémoires.

**Fonctionnalités :**
- Affichage de toutes les soumissions
- Filtres : année académique, statut, type de soutenance, filière
- Acceptation des soumissions
- Rejet avec motif
- Visualisation du dossier complet
- Affichage des documents

**Routes API utilisées :**
- `GET /api/soutenance/submissions` - Liste des soumissions
- `POST /api/soutenance/submissions/accept` - Accepter une soumission
- `POST /api/soutenance/submissions/reject` - Rejeter une soumission
- `GET /api/soutenance/submissions/{id}/dossier` - Détails du dossier

### 3. JuryManagement.tsx
Constitution et gestion des jurys de soutenance.

**Fonctionnalités :**
- Liste des soumissions acceptées
- Configuration du jury (membres, rôles)
- Planification (salle, date/heure)
- Filtres : année, type, statut jury, planification
- Export des propositions de jury (PDF)
- Export des notes de service (PDF)
- Validation du nombre de membres selon le type de soutenance

**Routes API utilisées :**
- `GET /api/soutenance/jury/data` - Liste des soumissions pour jury
- `GET /api/soutenance/jury/get` - Récupérer un jury existant
- `POST /api/soutenance/submissions/{id}/jury` - Enregistrer le jury
- `GET /api/soutenance/jury/export-proposals` - Export propositions
- `GET /api/soutenance/jury/export-notes` - Export notes de service

## Service (soutenance.service.ts)

Le service contient toutes les méthodes pour communiquer avec l'API backend :

- **Périodes** : getPeriods, createPeriod, updatePeriod
- **Soumissions** : getSubmissions, acceptSubmission, rejectSubmission, getDossierDetails
- **Jurys** : getJurySubmissions, getJury, saveJury, exportJury
- **Données de référence** : getAcademicYears, getDepartments, getProfessors, getRooms

## Navigation

Le module est accessible via le menu latéral avec 3 entrées :
- Périodes de Soumission
- Liste des Soumissions
- Constitution des Jurys

## Dépendances

- `@coreui/react` - Composants UI
- `react-select` - Sélecteurs avancés
- `sweetalert2` - Alertes et confirmations
- `@coreui/icons-react` - Icônes

## Notes d'implémentation

- Tous les composants suivent le pattern établi dans les autres modules (inscription, finance, etc.)
- Utilisation de TypeScript pour le typage
- Gestion d'erreurs avec try/catch et affichage via Swal
- Loading states avec le composant LoadingSpinner
- Filtres réactifs avec react-select
- Modales CoreUI pour les formulaires
- Responsive design avec le système de grille CoreUI
