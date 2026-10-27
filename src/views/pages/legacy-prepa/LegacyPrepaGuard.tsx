// src/views/pages/legacy-prepa/LegacyPrepaGuard.tsx
//
// Garde d'accès dédiée : module réservé au Chef CAP / Chef Division.
// Volontairement isolée de src/protected/ProtectedRoutes.tsx pour rester
// autonome et facile à retirer. Pour changer les rôles autorisés, modifier
// uniquement ALLOWED_ROLES ci-dessous ET la même constante côté backend
// (LegacyPrepaLinkController) - les deux doivent rester synchronisées.

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts'
import { FRONTEND_ROUTES } from '@/constants'
import { LoadingSpinner } from '@/components'

const ALLOWED_ROLES = ['chef-cap', 'chef-division']

interface Props {
  children: React.ReactNode
}

const LegacyPrepaGuard = ({ children }: Props) => {
  const { isAuthenticated, isLoading, role } = useAuth()

  if (isLoading) {
    return <LoadingSpinner fullPage message="Vérification des droits..." />
  }

  if (!isAuthenticated || !ALLOWED_ROLES.includes(role as string)) {
    return <Navigate to={FRONTEND_ROUTES.PORTAIL} replace />
  }

  return <>{children}</>
}

export default LegacyPrepaGuard