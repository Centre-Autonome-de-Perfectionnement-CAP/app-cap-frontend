// src/views/pages/stages/StagesGuard.tsx
// Accès au module Stages : administrateur, Responsable de division,
// superviseurs et secrétariat (attestations seulement).
// Le serveur vérifie en plus que le responsable est celui de la formation
// continue (celui qui ne s'occupe pas des licences).
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts'
import { FRONTEND_ROUTES } from '@/constants'
import { LoadingSpinner } from '@/components'

export const STAGES_ROLES = ['admin', 'responsable-division', 'chef-division', 'superviseur', 'secretaire']
export const isStagesLead = (role: string | null) => role === 'admin' || role === 'responsable-division' || role === 'chef-division'
/** Le secrétariat n'accède qu'aux attestations (impression, remise). */
export const isStagesSecretariat = (role: string | null) => role === 'secretaire'

const StagesGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, role } = useAuth()
  if (isLoading) return <LoadingSpinner fullPage message="Vérification des droits..." />
  if (!isAuthenticated) return <Navigate to={FRONTEND_ROUTES.LOGIN} replace />
  if (!STAGES_ROLES.includes(role as string)) return <Navigate to={FRONTEND_ROUTES.PORTAIL} replace />
  return <>{children}</>
}

export default StagesGuard
