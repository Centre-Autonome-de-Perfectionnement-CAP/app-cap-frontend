import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'

import { Dashboard, Tarifs, Historique, Validation, SubmitPayment, StudentFinancialState, Exonerations, Reports } from './index'

const FinanceRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module Finance..." />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tarifs" element={<Tarifs />} />
        <Route path="/historique" element={<Historique />} />
        <Route path="/validation" element={<Validation />} />
        <Route path="/submit-payment" element={<SubmitPayment />} />
        <Route path="/my-financial-state" element={<StudentFinancialState />} />
        <Route path="/exonerations" element={<Exonerations />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/" element={<Navigate to="/finance/dashboard" replace />} />
        {/* Route 404 pour les sous-routes invalides */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}

export default FinanceRoutes
