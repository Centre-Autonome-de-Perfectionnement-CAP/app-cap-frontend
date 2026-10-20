// src/views/pages/stages/StagesRoutes.tsx
import React, { Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LoadingSpinner } from '@/components'
import DefaultLayout from '@/layout/DefaultLayout'
import { useAuth } from '@/contexts'
import StagesGuard, { isStagesLead } from './StagesGuard'

const StagesPage        = React.lazy(() => import('./StagesPage'))
const StagiairesPage    = React.lazy(() => import('./StagiairesPage'))
const BinomesPage       = React.lazy(() => import('./BinomesPage'))
const SuperviseursPage  = React.lazy(() => import('./SuperviseursPage'))
const GroupeWhatsAppPage = React.lazy(() => import('./GroupeWhatsAppPage'))
const DemandesStagiairesPage = React.lazy(() => import('./DemandesStagiairesPage'))
const RapportsPage = React.lazy(() => import('./RapportsPage'))

/** Accueil du module : on garde ?ref=… (liens reçus par WhatsApp / email). */
const Home = () => {
  const { search } = useLocation()
  const { role } = useAuth()
  const target = role === 'superviseur' && !search ? '/stages/stagiaires' : `/stages/demandes${search}`
  return <Navigate to={target} replace />
}

const LeadOnly = ({ children }: { children: React.ReactNode }) => {
  const { role } = useAuth()
  return isStagesLead(role as string) ? <>{children}</> : <Navigate to="/stages/stagiaires" replace />
}

const StagesRoutes = () => (
  <StagesGuard>
    <DefaultLayout>
      <Suspense fallback={<LoadingSpinner fullPage message="Chargement…" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/demandes" element={<StagesPage />} />
          <Route path="/stagiaires" element={<StagiairesPage />} />
          <Route path="/binomes" element={<BinomesPage />} />
          <Route path="/demandes-stagiaires" element={<DemandesStagiairesPage />} />
          <Route path="/rapports" element={<RapportsPage />} />
          <Route path="/superviseurs" element={<LeadOnly><SuperviseursPage /></LeadOnly>} />
          <Route path="/groupe-whatsapp" element={<LeadOnly><GroupeWhatsAppPage /></LeadOnly>} />
          <Route path="*" element={<Navigate to="/stages" replace />} />
        </Routes>
      </Suspense>
    </DefaultLayout>
  </StagesGuard>
)

export default StagesRoutes
