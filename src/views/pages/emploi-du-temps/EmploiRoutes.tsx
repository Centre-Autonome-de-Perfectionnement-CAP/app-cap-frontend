import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'
import { useAuth } from '@/contexts'

import {
  Dashboard,
  Calendar,
  Buildings,
  Rooms,
  TimeSlots,
  ScheduledCourses,
  UpdateHours,
  ScheduleViews,
  RenewSchedule,
  GenerateSchedule,
  MonEmploiDuTemps,
} from './index'

const EmploiRoutes = () => {
  const { role } = useAuth()
  const isProfesseur = (role as any) === 'professeur'
  const defaultRoute = isProfesseur
    ? '/emploi-du-temps/mon-emploi-du-temps'
    : '/emploi-du-temps/dashboard'

  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module Emploi du Temps..." />}>
      <Routes>
        {/* Route professeur - son emploi du temps personnel */}
        <Route path="/mon-emploi-du-temps" element={<MonEmploiDuTemps />} />

        {/* Routes admin/chef-division */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/buildings" element={<Buildings />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/time-slots" element={<TimeSlots />} />
        <Route path="/scheduled-courses" element={<ScheduledCourses />} />
        <Route path="/update-hours" element={<UpdateHours />} />
        <Route path="/schedule-views" element={<ScheduleViews />} />
        <Route path="/renew-schedule" element={<RenewSchedule />} />
        <Route path="/generate-schedule" element={<GenerateSchedule />} />

        <Route path="/" element={<Navigate to={defaultRoute} replace />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}

export default EmploiRoutes
