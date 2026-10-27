// src/views/pages/whatsapp/WhatsAppRoutes.tsx
//
// Chaque section a sa propre URL → la sidebar peut les activer directement
// (lien actif cohérent avec tous les autres modules du projet).

import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'
import DefaultLayout from '@/layout/DefaultLayout'
import WhatsAppGuard from './WhatsAppGuard'

const WhatsAppPage = React.lazy(() => import('./WhatsAppPage'))

const WhatsAppRoutes = () => (
  <WhatsAppGuard>
    <DefaultLayout>
      <Suspense fallback={<LoadingSpinner fullPage message="Chargement…" />}>
        <Routes>
          <Route path="/"                element={<WhatsAppPage view="connexion" />} />
          <Route path="/messages/sent"   element={<WhatsAppPage view="envoyes" />} />
          <Route path="/messages/failed" element={<WhatsAppPage view="echoues" />} />
          <Route path="/stats"           element={<WhatsAppPage view="statistiques" />} />
          <Route path="*"                element={<Navigate to="/whatsapp" replace />} />
        </Routes>
      </Suspense>
    </DefaultLayout>
  </WhatsAppGuard>
)

export default WhatsAppRoutes
