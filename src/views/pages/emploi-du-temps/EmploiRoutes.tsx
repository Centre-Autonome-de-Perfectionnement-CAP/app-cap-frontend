import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'

import { Dashboard, Calendar, Buildings, Rooms, TimeSlots } from './index'

const EmploiRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module Emploi du Temps..." />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/buildings" element={<Buildings />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/time-slots" element={<TimeSlots />} />
        {/* Rediriger vers le dashboard par défaut */}
        <Route path="/" element={<Navigate to="/emploi-du-temps/dashboard" replace />} />
        {/* Route 404 pour les sous-routes invalides */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}

export default EmploiRoutes
