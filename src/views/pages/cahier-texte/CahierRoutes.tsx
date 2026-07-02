import { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'
import { useAuth } from '@/contexts'

import { Dashboard, TextbookList, MesEntrees, EntryForm, EntryDetail, ViewByClass } from './index'

const CahierRoutes = () => {
  const { role } = useAuth()
  const isProfesseur = (role as any) === 'professeur'

  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module Cahier de Texte..." />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Vue professeur : ses propres entrées */}
        <Route path="/mes-entrees" element={<MesEntrees />} />

        {/* Vue admin : toutes les entrées */}
        <Route path="/list" element={<TextbookList />} />

        {/* Formulaires communs */}
        <Route path="/new" element={<EntryForm />} />
        <Route path="/edit/:id" element={<EntryForm />} />
        <Route path="/detail/:id" element={<EntryDetail />} />

        {/* Consultation par classe (admin) */}
        <Route path="/by-class" element={<ViewByClass />} />

        {/* Redirection par défaut selon le rôle */}
        <Route
          path="/"
          element={<Navigate to={isProfesseur ? '/cahier-texte/dashboard' : '/cahier-texte/dashboard'} replace />}
        />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}

export default CahierRoutes
