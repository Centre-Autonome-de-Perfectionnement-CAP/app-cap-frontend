// src/protected/ProtectedRoutes.tsx
// Les 4 rôles direction sont redirigés vers /demandes s'ils tentent
// d'accéder à /portail (ou toute autre route interdite) — ils ignorent
// l'existence du portail.
// Le rôle 'responsable' (responsable de classe, distinct de
// 'responsable-division') n'a accès qu'à son propre espace /responsable/*.
// Le rôle 'professeur' n'a accès qu'à notes + emploi-du-temps.

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
// IMPORTANT : ces clés doivent être EXACTEMENT celles de MODULES
// (src/constants/modules.constants.ts) et des props module={...} de App.tsx —
// 'cahier-texte', 'emploi-du-temps', 'attestations', 'soutenances' (pas
// 'cahier', 'emploi', 'attestation', 'soutenance' : une clé qui ne
// correspond à aucun module réel ne bloque RIEN silencieusement).
const rolePermissions: Record<string, Record<string, boolean>> = {
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
  // Alias legacy de 'responsable-division' (workflow Demandes) — non restreint
  'chef-division': {},
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
    bibliotheque: false, 'cahier-texte': false, cours: false, 'emploi-du-temps': false,
    inscription: false, notes: false, presence: false, soutenances: false, finance: false,
    // portail: implicitement interdit (redirect ci-dessous)
  },
  'directrice-adjointe': {
    bibliotheque: false, 'cahier-texte': false, cours: false, 'emploi-du-temps': false,
    inscription: false, notes: false, presence: false, soutenances: false, finance: false,
  },
  'sec-dir': {
    bibliotheque: false, 'cahier-texte': false, cours: false, 'emploi-du-temps': false,
    inscription: false, notes: false, presence: false, soutenances: false, finance: false,
  },
  'directeur': {
    bibliotheque: false,
    'cahier-texte': false,
    cours: false,
    'emploi-du-temps': false,
    inscription: false,
    notes: false,
    presence: false,
    soutenances: false,
    finance: false,
  },
  // Professeur : accès UNIQUEMENT à notes + emploi-du-temps
  // (le reste est bloqué via la redirection PROFESSEUR_ALLOWED_MODULES ci-dessous)
  'professeur': {
    portail: false,
    attestations: false,
    bibliotheque: false,
    'cahier-texte': false,
    cours: false,
    inscription: false,
    presence: false,
    soutenances: false,
    finance: false,
    rh: false,
    demandes: false,
    // notes et emploi-du-temps ne sont PAS listés ici → donc autorisés
  },
  // Responsable (responsable de classe) : accès UNIQUEMENT à /responsable/*
  'responsable': {
    portail: false,
    inscription: false,
    attestations: false,
    bibliotheque: false,
    'cahier-texte': false,
    cours: false,
    'emploi-du-temps': false,
    notes: false,
    presence: false,
    soutenances: false,
    finance: false,
    rh: false,
  },
};

// Modules autorisés au professeur (pour la redirection) —
// mêmes clés réelles que rolePermissions/MODULES ci-dessus.
const PROFESSEUR_ALLOWED_MODULES = ['notes', 'emploi-du-temps']

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

  // Superviseur de stage → module Stages uniquement
  if (r === 'superviseur') {
    return <Navigate to="/stages/stagiaires" replace />;
  }

  // Responsable → son dashboard uniquement, quel que soit le module demandé
  if (r === 'responsable') {
    return <Navigate to={FRONTEND_ROUTES.RESPONSABLE_DASHBOARD} replace />;
  }

  // Professeur → autorisé sur notes + emploi-du-temps uniquement.
  // Si le module demandé n'est pas dans sa liste → redirigé vers son dashboard.
  if (r === 'professeur') {
    if (!module || !PROFESSEUR_ALLOWED_MODULES.includes(module)) {
      return <Navigate to={FRONTEND_ROUTES.NOTES.PROFESSOR_DASHBOARD} replace />;
    }
    return children ? <>{children}</> : <Outlet />;
  }

  // Rôles direction : si accès au portail tenté → redirect silencieux vers /demandes
  // Ces acteurs n'ont pas de portail. On ne leur montre pas de message d'erreur,
  // on les envoie directement là où ils doivent être.
  if (DIRECTION_ROLES.includes(r) && module === 'portail') {
    return <Navigate to={FRONTEND_ROUTES.DEMANDES} replace />;
  }

  // Vérification des permissions par module pour les autres rôles admin
  if (module && !isAllowed(r, module)) {
    // Rôles direction : pas de modal "portail" — redirect directe vers demandes
    if (DIRECTION_ROLES.includes(r)) {
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

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
