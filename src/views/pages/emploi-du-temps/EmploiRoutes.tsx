import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'

// const Dashboard = React.lazy(() => import('./Dashboard'))

const EmploiRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module Emploi du Temps..." />}>
      <Routes>
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        <Route path="/" element={<Navigate to="/cours/emploi-du-temps/dashboard" replace />} />
        {/* Route 404 pour les sous-routes invalides */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}

export default EmploiRoutes
