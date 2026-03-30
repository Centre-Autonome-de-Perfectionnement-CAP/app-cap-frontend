import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'

import { Dashboard, TextbookList } from './index'

const CahierRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module Cahier de Texte..." />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/list" element={<TextbookList />} />
        <Route path="/" element={<Navigate to="/cahier-texte/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}

export default CahierRoutes
