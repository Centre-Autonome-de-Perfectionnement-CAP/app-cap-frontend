import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { useNavigate } from 'react-router-dom';
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton } from '@coreui/react';
import { FRONTEND_ROUTES } from '@/constants';
import { LoadingSpinner } from '@/components';

// ── Modules autorisés par rôle ───────────────────────────────────────────────
// false = accès interdit pour ce module
const rolePermissions: Record<string, Record<string, boolean>> = {
  'chef-cap': {
    inscription: false,
  },
  'secretaire': {
    bibliotheque: false,
    cahier:       false,
    cours:        false,
    emploi:       false,
    notes:        false,
    presence:     false,
    finance:      false,
  },
  'chef-division': {},
  'comptable': {
    attestation:  false,
    bibliotheque: false,
    cahier:       false,
    cours:        false,
    emploi:       false,
    inscription:  false,
    notes:        false,
    presence:     false,
    soutenance:   false,
  },
  // ✅ Professeur : accès UNIQUEMENT à notes + emploi-du-temps
  // Tout le reste est bloqué via la redirection dans ce composant
  'professeur': {
    portail:      false,
    attestation:  false,
    bibliotheque: false,
    cahier:       false,
    cours:        false,
    inscription:  false,
    presence:     false,
    soutenance:   false,
    finance:      false,
    rh:           false,
    // notes et emploi-du-temps ne sont PAS listés ici → donc autorisés
  },
  // ✅ Responsable : accès UNIQUEMENT à /responsable/*
  'responsable': {
    portail:      false,
    inscription:  false,
    attestation:  false,
    bibliotheque: false,
    cahier:       false,
    cours:        false,
    emploi:       false,
    notes:        false,
    presence:     false,
    soutenance:   false,
    finance:      false,
    rh:           false,
  },
};

// Modules autorisés au professeur (pour la redirection)
const PROFESSEUR_ALLOWED_MODULES = ['notes', 'emploi']

const isAllowed = (role: string | null, module: string): boolean => {
  if (!role) return false;
  const perms = rolePermissions[role] ?? {};
  return perms[module] !== false;
};

interface ProtectedRouteProps {
  children?: React.ReactNode;
  module?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, module }) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const navigate = useNavigate();
  const r = role as string;

  if (isLoading) {
    return <LoadingSpinner message="Vérification de l'authentification..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={FRONTEND_ROUTES.LOGIN} replace />;
  }

  // ✅ Responsable → son dashboard uniquement
  if (r === 'responsable') {
    return <Navigate to={FRONTEND_ROUTES.RESPONSABLE_DASHBOARD} replace />;
  }

  // ✅ Professeur → autorisé sur notes + emploi-du-temps uniquement
  // Si le module demandé n'est pas dans sa liste → redirigé vers son dashboard
  if (r === 'professeur') {
    // Si on ne précise pas de module (ex: portail) → redirection
    if (!module || !PROFESSEUR_ALLOWED_MODULES.includes(module)) {
      return <Navigate to={FRONTEND_ROUTES.NOTES.PROFESSOR_DASHBOARD} replace />;
    }
    // Module autorisé → on laisse passer
    return children ? <>{children}</> : <Outlet />;
  }

  // Vérification des permissions par module pour les autres rôles admin
  if (module && !isAllowed(r, module)) {
    return (
      <CModal visible={true} onClose={() => navigate(FRONTEND_ROUTES.PORTAIL)}>
        <CModalHeader>
          <CModalTitle>Accès non autorisé</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Vous n'avez pas les droits nécessaires pour accéder à ce module ({module}).
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" onClick={() => navigate(FRONTEND_ROUTES.PORTAIL)}>
            Retour au portail
          </CButton>
        </CModalFooter>
      </CModal>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;