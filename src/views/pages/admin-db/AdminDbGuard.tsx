// src/views/pages/admin-db/AdminDbGuard.tsx
//
// Garde d'accès dédiée : réservée aux rôles listés dans ALLOWED_ROLES.
// Volontairement isolée de src/protected/ProtectedRoutes.tsx pour que ce
// module reste autonome (aucune dépendance croisée) et facile à retirer :
// il suffit de supprimer ce dossier + la route dans App.tsx.
//
// MISE À JOUR : 'responsable-division' ajouté après constat qu'aucun
// compte 'admin' n'était réellement utilisé — le rôle 'responsable-division'
// porte désormais aussi cette responsabilité. Pour changer les rôles
// autorisés, modifier uniquement ALLOWED_ROLES ci-dessous ET la même
// constante côté backend (AdminTableController::ALLOWED_ROLES) — les deux
// doivent rester synchronisées.

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts'
import { FRONTEND_ROUTES } from '@/constants'
import { LoadingSpinner } from '@/components'

const ALLOWED_ROLES = ['admin', 'responsable-division']

interface Props {
  children: React.ReactNode
}

const AdminDbGuard = ({ children }: Props) => {
  const { isAuthenticated, isLoading, role } = useAuth()

  if (isLoading) {
    return <LoadingSpinner fullPage message="Vérification des droits..." />
  }

  if (!isAuthenticated || !ALLOWED_ROLES.includes(role as string)) {
    return <Navigate to={FRONTEND_ROUTES.LOGIN} replace />
  }

  return <>{children}</>
}

export default AdminDbGuard