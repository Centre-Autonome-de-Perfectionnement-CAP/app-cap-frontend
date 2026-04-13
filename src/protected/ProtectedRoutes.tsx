import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { useNavigate } from 'react-router-dom';
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton } from '@coreui/react';
import { FRONTEND_ROUTES } from '@/constants';
import { LoadingSpinner } from '@/components';

// Permissions par rôle : false = module interdit, absent = autorisé par défaut
const rolePermissions = {
  'chef-cap': {
    inscription: false,
  },
  'secretaire': {
    bibliotheque: false,
    cahier: false,
    cours: false,
    emploi: false,
    notes: false,
    presence: false,
    finance: false,
  },
  'chef-division': {
  },
  'comptable': {
    bibliotheque: false,
    cahier: false,
    cours: false,
    emploi: false,
    inscription: false,
    notes: false,
    presence: false,
    soutenance: false,
  },
  // Nouveaux rôles : accès au module demandes uniquement
  // ⚠️ Ne PAS mettre demandes: false ici — laisser absent = autorisé
  'sec-da': {
    bibliotheque: false, cahier: false, cours: false, emploi: false,
    inscription: false, notes: false, presence: false, soutenance: false, finance: false,
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
    attestation: false,
    bibliotheque: false,
    cahier: false,
    cours: false,
    emploi: false,
    inscription: false,
    presence: false,
    soutenance: false,
    finance: false,
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

  // Redirection automatique des professeurs vers les notes
  if (role === 'professeur' as any && window.location.pathname === FRONTEND_ROUTES.PORTAIL) {
    return <Navigate to="/notes/professor/dashboard" replace />;
  }

  if (module && !isAllowed(role, module)) {
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
