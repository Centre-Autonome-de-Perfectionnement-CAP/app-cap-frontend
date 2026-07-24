// src/protected/ProtectedRoutes.tsx
// MODIFICATION : les 4 rôles direction sont redirigés vers /demandes
// s'ils tentent d'accéder à /portail (ou à n'importe quelle autre route interdite).
// Ces acteurs ignorent l'existence du portail.

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { useNavigate } from 'react-router-dom';
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton } from '@coreui/react';
import { FRONTEND_ROUTES } from '@/constants';
import { LoadingSpinner } from '@/components';

// Rôles direction : accès uniquement à /demandes, jamais au portail
const DIRECTION_ROLES = ['sec-da', 'directrice-adjointe', 'sec-dir', 'directeur']

// Permissions par rôle : false = module interdit, absent = autorisé par défaut
const rolePermissions = {
  'chef-cap': {
    inscription: false,
  },
  'secretaire': {
    bibliotheque: false,
    'cahier-texte': false,
    cours: false,
    'emploi-du-temps': false,
    notes: false,
    presence: false,
    finance: false,
  },
  'responsable-division': {
  },
  'comptable': {
    attestations: false,
    bibliotheque: false,
    'cahier-texte': false,
    cours: false,
    'emploi-du-temps': false,
    inscription: false,
    notes: false,
    presence: false,
    soutenances: false,
  },
  // Rôles direction : accès au module demandes uniquement
  'sec-da': {
    bibliotheque: false, cahier: false, cours: false, emploi: false,
    inscription: false, notes: false, presence: false, soutenance: false, finance: false,
    // portail: implicitement interdit (redirect ci-dessous)
  },
  'directrice-adjointe': {
    bibliotheque: false, cahier: false, cours: false, emploi: false,
    inscription: false, notes: false, presence: false, soutenance: false, finance: false,
  },
  'sec-dir': {
    bibliotheque: false, cahier: false, cours: false, emploi: false,
    inscription: false, notes: false, presence: false, soutenance: false, finance: false,
  },
  'directeur': {
    bibliotheque: false,
    cahier: false,
    cours: false,
    emploi: false,
    inscription: false,
    notes: false,
    presence: false,
    soutenance: false,
    finance: false,
  },
  'professeur': {
    attestations: false,
    bibliotheque: false,
    cours: false,
    inscription: false,
    presence: false,
    soutenances: false,
    finance: false,
    rh: false,
    demandes: false,
  },
};

const isAllowed = (role: string | null, module: string): boolean => {
  if (!role) return false;
  const perms = rolePermissions[role as keyof typeof rolePermissions] || {};
  return perms[module as keyof typeof perms] !== false;
};

interface ProtectedRouteProps {
  children?: React.ReactNode;
  module?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, module }) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const navigate = useNavigate();

  if (isLoading) {
    return <LoadingSpinner message="Vérification de l'authentification..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={FRONTEND_ROUTES.LOGIN} replace />;
  }

  // Redirection automatique des professeurs vers leur portail dédié
  if (role === 'professeur' as any && window.location.pathname === FRONTEND_ROUTES.PORTAIL) {
    return <Navigate to="/portail/professor" replace />;
  }

  // Rôles direction : si accès au portail tenté → redirect silencieux vers /demandes
  // Ces acteurs n'ont pas de portail. On ne leur montre pas de message d'erreur,
  // on les envoie directement là où ils doivent être.
  if (DIRECTION_ROLES.includes(role as string) && module === 'portail') {
    return <Navigate to={FRONTEND_ROUTES.DEMANDES} replace />;
  }

  if (module && !isAllowed(role, module)) {
    // Rôles direction : pas de modal "portail" — redirect directe vers demandes
    if (DIRECTION_ROLES.includes(role as string)) {
      return <Navigate to={FRONTEND_ROUTES.DEMANDES} replace />;
    }

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

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
