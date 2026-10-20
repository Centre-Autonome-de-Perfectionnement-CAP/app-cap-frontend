// src/views/pages/stages/StagesRoutes.tsx
import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'
import DefaultLayout from '@/layout/DefaultLayout'
import StagesGuard from './StagesGuard'

const StagesPage = React.lazy(() => import('./StagesPage'))

const StagesRoutes = () => (
  <StagesGuard>
    <DefaultLayout>
      <Suspense fallback={<LoadingSpinner fullPage message="Chargement…" />}>
        <Routes>
          <Route path="/" element={<StagesPage />} />
          <Route path="*" element={<Navigate to="/stages" replace />} />
        </Routes>
      </Suspense>
    </DefaultLayout>
  </StagesGuard>
)

export default StagesRoutes
