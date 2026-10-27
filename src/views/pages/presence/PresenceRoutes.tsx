import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'

// CHEMINS CORRECTS
const Dashboard = React.lazy(() => import('./admin/Dashboard'))
const Management = React.lazy(() => import('./admin/Management'))
const Fingerprint = React.lazy(() => import('./admin/Fingerprint'))
const CourseAttendance = React.lazy(() => import('./admin/CourseAttendance'))


const PresenceRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement..." />}>
      <Routes>

        {/*  ADMIN  */}
        <Route path="admin/dashboard" element={<Dashboard />} />
        <Route path="admin/management" element={<Management />} />
        <Route path="admin/fingerprint" element={<Fingerprint />} />
        <Route path="admin/course-attendance" element={<CourseAttendance />} />

        {/*  REDIRECTION  */}
        <Route index element={<Navigate to="admin/dashboard" replace />} />

        {/*  REDIRECTION LOCALE (IMPORTANT) */}
        <Route path="*" element={<Navigate to="admin/dashboard" replace />} />

      </Routes>
    </Suspense>
  )
}

export default PresenceRoutes