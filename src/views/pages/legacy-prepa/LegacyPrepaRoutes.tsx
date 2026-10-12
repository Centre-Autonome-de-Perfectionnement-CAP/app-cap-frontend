// src/views/pages/legacy-prepa/LegacyPrepaRoutes.tsx
//
// Module séparé et autonome (comme admin-db) : Rattachement des historiques
// Prépa (< 2023) aux dossiers Prépa Ingénieur en cours.
// Réservé au Chef CAP / Chef Division via LegacyPrepaGuard.

import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'
import LegacyPrepaGuard from './LegacyPrepaGuard'
import { FRONTEND_ROUTES } from '@/constants'

const LegacyPrepaLink = React.lazy(() => import('./LegacyPrepaLink'))

const LegacyPrepaRoutes = () => (
  <LegacyPrepaGuard>
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module Rattachement Prépa..." />}>
      <Routes>
        <Route path="/" element={<LegacyPrepaLink />} />
        <Route path="*" element={<Navigate to={FRONTEND_ROUTES.LEGACY_PREPA} replace />} />
      </Routes>
    </Suspense>
  </LegacyPrepaGuard>
)

export default LegacyPrepaRoutes