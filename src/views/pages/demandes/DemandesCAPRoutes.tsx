// src/views/pages/demandes/DemandesCAPRoutes.tsx
// Routes dédiées à l'espace CAP Demandes direction.
// Pas de DefaultLayout — CAPLayout est géré directement dans WorkflowRouter.
// Accessible sur /demandes/cap/*

import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { FRONTEND_ROUTES } from '@/constants'

const WorkflowRouter = React.lazy(() => import('./WorkflowRouter'))

// Fallback de chargement minimal, sans dépendance à LoadingSpinner (qui peut
// importer des composants CoreUI non souhaités dans ce contexte)
const Loader = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: '#f1f5f9',
    fontFamily: '"DM Sans", system-ui, sans-serif',
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 36, height: 36,
        border: '3px solid #e2e8f0', borderTopColor: '#1e3a5f',
        borderRadius: '50%', margin: '0 auto 14px',
        animation: 'capspin 0.7s linear infinite',
      }} />
      <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0 }}>
        Chargement de l'espace gestion…
      </p>
      <style>{`@keyframes capspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  </div>
)

const DemandesCAPRoutes = () => (
  <Suspense fallback={<Loader />}>
    <Routes>
      <Route path="/"         element={<WorkflowRouter />} />
      <Route path="/dashboard" element={<WorkflowRouter />} />
      <Route path="*"          element={<Navigate to={FRONTEND_ROUTES.DEMANDES_CAP} replace />} />
    </Routes>
  </Suspense>
)

export default DemandesCAPRoutes
