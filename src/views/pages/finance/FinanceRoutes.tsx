import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'

// const Dashboard = React.lazy(() => import('./Dashboard'))

const FinanceRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module Finance..." />}>
      <Routes>
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
        <Route path="/" element={<Navigate to="/finance/dashboard" replace />} />
        {/* Route 404 pour les sous-routes invalides */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}

export default FinanceRoutes
