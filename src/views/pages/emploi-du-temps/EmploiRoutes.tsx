import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'

const Dashboard            = lazy(() => import('./Dashboard'))
const Calendar             = lazy(() => import('./Calendar'))
const Buildings            = lazy(() => import('./Buildings'))
const Rooms                = lazy(() => import('./Rooms'))
const TimeSlots            = lazy(() => import('./TimeSlots'))
const ScheduledCourses     = lazy(() => import('./ScheduledCourses'))
const GestionEmploiDuTemps = lazy(() => import('./GestionEmploiDuTemps'))

const EmploiRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module Emploi du Temps…" />}>
      <Routes>
        <Route path="/dashboard"          element={<Dashboard />} />
        <Route path="/calendar"           element={<Calendar />} />
        <Route path="/buildings"          element={<Buildings />} />
        <Route path="/rooms"              element={<Rooms />} />
        <Route path="/time-slots"         element={<TimeSlots />} />
        <Route path="/scheduled-courses"  element={<ScheduledCourses />} />
        <Route path="/gestion"            element={<GestionEmploiDuTemps />} />
        <Route path="/"  element={<Navigate to="/emploi-du-temps/dashboard" replace />} />
        <Route path="*"  element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}

export default EmploiRoutes