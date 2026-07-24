// src/views/pages/attestation/AttestationRoutes.tsx
import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'

const AttestationPassage     = React.lazy(() => import('./AttestationPassage'))
const PreparatoryClass       = React.lazy(() => import('./PreparatoryClass'))
const Bulletins              = React.lazy(() => import('./Bulletins'))
const AttestationLicence     = React.lazy(() => import('./AttestationLicence'))
const AttestationDefinitive  = React.lazy(() => import('./AttestationDefinitive'))
const AttestationInscription = React.lazy(() => import('./AttestationInscription'))
const AttestationRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module Attestation..." />}>
      <Routes>
        <Route path="/passage"      element={<AttestationPassage />} />
        <Route path="/preparatory"  element={<PreparatoryClass />} />
        <Route path="/bulletins"    element={<Bulletins />} />
        <Route path="/licence"      element={<AttestationLicence />} />
        <Route path="/definitive"   element={<AttestationDefinitive />} />
        <Route path="/inscription"  element={<AttestationInscription />} />
        <Route path="/"             element={<Navigate to="/attestations/passage" replace />} />
        <Route path="*"             element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}

export default AttestationRoutes