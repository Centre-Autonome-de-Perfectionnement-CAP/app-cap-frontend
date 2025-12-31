import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'
import { SubmissionPeriods, SubmissionsList, JuryManagement } from './index'

const SoutenanceRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module Soutenance..." />}>
      <Routes>
        <Route path="/periods" element={<SubmissionPeriods />} />
        <Route path="/submissions" element={<SubmissionsList />} />
        <Route path="/jury" element={<JuryManagement />} />
        <Route path="/" element={<Navigate to="/soutenance/periods" replace />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}

export default SoutenanceRoutes
