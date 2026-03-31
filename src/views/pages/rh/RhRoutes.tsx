import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'
import { Dashboard, Professors, AdminUsers, Signataires, ContentManagement } from './index'
import Contrats from './Contrats'

const RhRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module RH..." />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/professors" element={<Professors />} />
        <Route path="/admin-users" element={<AdminUsers />} />
        <Route path="/signataires" element={<Signataires />} />
        <Route path="/content" element={<ContentManagement />} />

        {/* 🔥 CONTRATS */}
        <Route path="/contrats" element={<Contrats />} />

        <Route path="/" element={<Navigate to="/rh/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}

export default RhRoutes
