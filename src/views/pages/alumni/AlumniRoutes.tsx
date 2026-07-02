import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'
import AlumniDashboard from './Dashboard'
import AlumniList from './AlumniList'

const AlumniRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module Alumni..." />}>
      <Routes>
        <Route path="/dashboard" element={<AlumniDashboard />} />
        <Route path="/list" element={<AlumniList />} />
        <Route path="/" element={<Navigate to="/alumni/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}

export default AlumniRoutes
