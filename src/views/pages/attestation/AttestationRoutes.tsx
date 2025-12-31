import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'

const AttestationSuccess = React.lazy(() => import('./AttestationSuccess'))
const PreparatoryClass = React.lazy(() => import('./PreparatoryClass'))
const Bulletins = React.lazy(() => import('./Bulletins'))
const AttestationLicence = React.lazy(() => import('./AttestationLicence'))

const AttestationRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module Attestation..." />}>
      <Routes>
        <Route path="/success" element={<AttestationSuccess />} />
        <Route path="/preparatory" element={<PreparatoryClass />} />
        <Route path="/bulletins" element={<Bulletins />} />
        <Route path="/licence" element={<AttestationLicence />} />
        <Route path="/" element={<Navigate to="/attestations/success" replace />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}

export default AttestationRoutes
