// src/views/pages/whatsapp/WhatsAppGuard.tsx
//
// Garde d'accès dédiée, pattern identique à AdminDbGuard.tsx.
// ALLOWED_ROLES doit rester synchronisé avec
// WhatsAppAdminController::ALLOWED_ROLES côté backend.
// Rôles autorisés : 'admin' et 'responsable-division' (décision utilisateur).

import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts'
import { FRONTEND_ROUTES } from '@/constants'
import { LoadingSpinner } from '@/components'

const ALLOWED_ROLES = ['admin', 'responsable-division']

interface Props {
  children: React.ReactNode
}

const WhatsAppGuard = ({ children }: Props) => {
  const { isAuthenticated, isLoading, role } = useAuth()

  if (isLoading) {
    return <LoadingSpinner fullPage message="Vérification des droits..." />
  }

  if (!isAuthenticated || !ALLOWED_ROLES.includes(role as string)) {
    return <Navigate to={FRONTEND_ROUTES.LOGIN} replace />
  }

  return <>{children}</>
}

export default WhatsAppGuard
