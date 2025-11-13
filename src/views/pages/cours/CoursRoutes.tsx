import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'

import { Dashboard, TeachingUnits, CourseElements, CourseResources, Programs } from './index'

const CoursRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module Cours..." />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/teaching-units" element={<TeachingUnits />} />
        <Route path="/course-elements" element={<CourseElements />} />
        <Route path="/course-resources" element={<CourseResources />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/" element={<Navigate to="/cours/dashboard" replace />} />
        {/* Route 404 pour les sous-routes invalides */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}

export default CoursRoutes
