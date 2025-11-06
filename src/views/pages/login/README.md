# Composant Login

## Description
Composant de connexion avec validation complète, gestion d'erreurs et intégration du contexte d'authentification.

## Fonctionnalités

### ✅ Validation côté client
- **Email** : Format email valide requis
- **Mot de passe** : Minimum 6 caractères
- Affichage des erreurs de validation en temps réel
- Nettoyage automatique des erreurs lors de la modification des champs

### ✅ Gestion d'état
- État de chargement pendant la connexion
- Désactivation du formulaire pendant le chargement
- Spinner visuel sur le bouton de connexion

### ✅ Gestion des erreurs
- **401** : Email ou mot de passe incorrect
- **422** : Données de connexion invalides
- Autres erreurs affichées avec message explicite
- Alerte dismissible pour les erreurs

### ✅ Intégration contexte
- Utilisation du hook `useAuth()` du `AuthContext`
- Appel de la méthode `login()` avec les données utilisateur
- Redirection automatique vers le portail après connexion

### ✅ Expérience utilisateur
- Autocomplétion pour email et mot de passe
- Design responsive avec CoreUI
- Carte d'information avec logo CAP
- Interface bilingue (français)

## Utilisation

### Dans les routes
```tsx
import Login from '@/views/pages/login/Login'

<Route path="/login" element={<Login />} />
```

### Avec le contexte d'authentification
Le composant doit être utilisé à l'intérieur d'un `AuthContextProvider` :

```tsx
import { AuthContextProvider } from '@/contexts/AuthContext'

<BrowserRouter>
  <AuthContextProvider>
    <Routes>
      <Route path="/login" element={<Login />} />
    </Routes>
  </AuthContextProvider>
</BrowserRouter>
```

## Flux de connexion

1. **Utilisateur saisit** email et mot de passe
2. **Validation côté client** : vérification format email et longueur mot de passe
3. **Appel API** via `AuthService.login(credentials)`
4. **Réponse serveur** : extraction token et données utilisateur
5. **Mise à jour contexte** : appel `login(token, nom, prenoms, role)`
6. **Stockage local** : sauvegarde dans localStorage
7. **Redirection** : navigation vers `/portail`

## Structure des données

### LoginCredentials
```typescript
interface LoginCredentials {
  email: string;
  password: string;
}
```

### Réponse API
```typescript
interface LoginResponse {
  token: string;
  user: User;
}
```

### User
```typescript
interface User {
  id: number;
  nom?: string;
  name?: string;
  prenoms?: string;
  prenom?: string;
  email: string;
  role: UserRole;
  // ...
}
```

## Gestion des erreurs

### Codes d'erreur HTTP
- **401 Unauthorized** : Identifiants incorrects
- **422 Unprocessable Entity** : Validation échouée côté serveur
- **500 Internal Server Error** : Erreur serveur

### Messages d'erreur
- Email requis / invalide
- Mot de passe requis / trop court
- Email ou mot de passe incorrect
- Erreur de connexion réseau

## Personnalisation

### Logo
Modifier le chemin de l'image :
```tsx
<img 
  src="/images/cap-1.png"  // Votre logo ici
  alt="logo-cap" 
  style={{ maxWidth: '150px', marginBottom: '20px' }}
/>
```

### Validation
Modifier les règles dans `validateForm()` :
```typescript
if (credentials.password.length < 8) { // Minimum 8 au lieu de 6
  errors.password = 'Le mot de passe doit contenir au moins 8 caractères'
}
```

### Redirection
Modifier la destination après connexion dans `AuthContext.tsx` :
```typescript
navigate(FRONTEND_ROUTES.DASHBOARD); // Au lieu de PORTAIL
```

## Tests suggérés

### Tests unitaires
- Validation email invalide
- Validation mot de passe trop court
- Soumission avec champs vides
- Gestion erreur 401
- Gestion erreur réseau

### Tests d'intégration
- Connexion réussie avec redirection
- Sauvegarde token dans localStorage
- Mise à jour du contexte après connexion
- Déconnexion et nettoyage

## Dépendances
- `@coreui/react` : Composants UI
- `@coreui/icons-react` : Icônes
- `react-router-dom` : Navigation (via contexte)
- `@/contexts/AuthContext` : Contexte d'authentification
- `@/services/auth.service` : Service API
- `@/types` : Types TypeScript

## Notes
- Le composant utilise le hook `useAuth()` qui doit être disponible
- L'API doit retourner un token JWT et les données utilisateur
- Le stockage utilise localStorage (STORAGE_KEYS)
- Les comptes de test sont disponibles dans les seeders du backend
