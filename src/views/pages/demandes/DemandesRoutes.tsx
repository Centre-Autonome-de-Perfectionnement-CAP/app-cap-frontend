// src/views/pages/demandes/DemandesRoutes.tsx
import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'
import { FRONTEND_ROUTES } from '@/constants'

// Import LOCAL — plus aucune dépendance vers /attestation/
const WorkflowRouter = React.lazy(() => import('./WorkflowRouter'))

const DemandesRoutes = () => (
  <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module Demandes..." />}>
    <Routes>
      <Route path="/"          element={<WorkflowRouter />} />
      <Route path="/dashboard" element={<WorkflowRouter />} />
      <Route path="*"          element={<Navigate to={FRONTEND_ROUTES.DEMANDES} replace />} />
    </Routes>
  </Suspense>
)

export default DemandesRoutes
