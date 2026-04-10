import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { CCard, CCardBody } from '@coreui/react'
import { LoadingSpinner } from '@/components'

import { Dashboard, PendingStudents, AnneeAcademiques, StudentsList, CorrectionRequestsList } from './index.ts'

// Composant de test simple
const TestComponent = () => {
  return (
    <CCard>
      <CCardBody>
        <h1>Module Inscription - Route fonctionne ✓</h1>
        <p>Si vous voyez ce message, le routage fonctionne correctement.</p>
      </CCardBody>
    </CCard>
  )
}

const InscriptionRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module Inscription..." />}>
      <Routes>
        <Route path="/test" element={<TestComponent />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pending-students" element={<PendingStudents />} />
        <Route path="/academics-years" element={<AnneeAcademiques />} />
        <Route path="/students-list" element={<StudentsList />} />
        <Route path="/corrections" element={<CorrectionRequestsList />} />
        {/* Rediriger /inscription vers /inscription/dashboard par défaut */}
        <Route path="/" element={<Navigate to="/inscription/dashboard" replace />} />
        {/* Route 404 pour les sous-routes invalides */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}

export default InscriptionRoutes
