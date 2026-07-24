// src/views/pages/admin-db/AdminDbRoutes.tsx
//
// Outil interne réservé à l'administrateur — accès par URL directe
// (aucune entrée dans le menu de navigation, volontairement).
//
// Pour désactiver cet outil : supprimer la route correspondante dans
// App.tsx, puis ce dossier complet (src/views/pages/admin-db).

import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'
import AdminDbGuard from './AdminDbGuard'
import { ADMIN_DB_BASE_PATH } from './constants'

const TablesList  = React.lazy(() => import('./TablesList'))
const TableDetail = React.lazy(() => import('./TableDetail'))

const AdminDbRoutes = () => (
  <AdminDbGuard>
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du panneau admin..." />}>
      <Routes>
        <Route path="/"       element={<TablesList />} />
        <Route path="/:table" element={<TableDetail />} />
        <Route path="*"       element={<Navigate to={ADMIN_DB_BASE_PATH} replace />} />
      </Routes>
    </Suspense>
  </AdminDbGuard>
)

export default AdminDbRoutes
