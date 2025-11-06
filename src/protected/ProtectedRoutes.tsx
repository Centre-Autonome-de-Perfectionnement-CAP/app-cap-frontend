import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts';
import { useNavigate } from 'react-router-dom';
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton } from '@coreui/react';
import { FRONTEND_ROUTES } from '@/constants';
import { LoadingSpinner } from '@/components';

const rolePermissions = {
  'chef-cap': {
    inscription: false
  },
  'secretaire': {
    bibliotheque: false,
    cahier: false,
    cours: false,
    emploi: false,
    notes: false,
    presence: false,
    finance: false
  },
  'chef-division': {
    finance: false,
    rh: false
  },
  'comptable': {
    attestation: false,
    bibliotheque: false,
    cahier: false,
    cours: false,
    emploi: false,
    inscription: false,
    notes: false,
    presence: false,
    soutenance: false
  }
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
  const [showModal, setShowModal] = useState(false);

  if (isLoading) {
    return <LoadingSpinner message="Vérification de l'authentification..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to={FRONTEND_ROUTES.LOGIN} replace />;
  }

  if (module && !isAllowed(role, module)) {
    return (
      <CModal visible={showModal} onClose={() => {
        setShowModal(false);
        navigate(FRONTEND_ROUTES.PORTAIL);
      }}>
        <CModalHeader>
          <CModalTitle>Accès non autorisé</CModalTitle>
        </CModalHeader>
        <CModalBody>
          Vous n'avez pas les droits nécessaires pour accéder à ce module ({module}).
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" onClick={() => {
            setShowModal(false);
            navigate(FRONTEND_ROUTES.PORTAIL);
          }}>
            Retour au portail
          </CButton>
        </CModalFooter>
      </CModal>
    );
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
