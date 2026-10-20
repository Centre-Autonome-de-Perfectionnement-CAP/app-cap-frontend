// src/views/pages/stages/StagesRoutes.tsx
import React, { Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { LoadingSpinner } from '@/components'
import DefaultLayout from '@/layout/DefaultLayout'
import { useAuth } from '@/contexts'
import StagesGuard, { isStagesLead, isStagesSecretariat } from './StagesGuard'

const StagesPage        = React.lazy(() => import('./StagesPage'))
const StagiairesPage    = React.lazy(() => import('./StagiairesPage'))
const BinomesPage       = React.lazy(() => import('./BinomesPage'))
const SuperviseursPage  = React.lazy(() => import('./SuperviseursPage'))
const GroupeWhatsAppPage = React.lazy(() => import('./GroupeWhatsAppPage'))
const DemandesStagiairesPage = React.lazy(() => import('./DemandesStagiairesPage'))
const RapportsPage = React.lazy(() => import('./RapportsPage'))
const AttestationsPage = React.lazy(() => import('./AttestationsPage'))

/** Accueil du module : on garde ?ref=… (liens reçus par WhatsApp / email). */
const Home = () => {
  const { search } = useLocation()
  const { role } = useAuth()
  if (isStagesSecretariat(role as string)) return <Navigate to="/stages/attestations" replace />
  const target = role === 'superviseur' && !search ? '/stages/stagiaires' : `/stages/demandes${search}`
  return <Navigate to={target} replace />
}

/** Pages du suivi : pas pour le secrétariat (attestations seulement). */
const Staff = ({ children }: { children: React.ReactNode }) => {
  const { role } = useAuth()
  return isStagesSecretariat(role as string) ? <Navigate to="/stages/attestations" replace /> : <>{children}</>
}

const LeadOnly = ({ children }: { children: React.ReactNode }) => {
  const { role } = useAuth()
  return isStagesLead(role as string) ? <>{children}</> : <Navigate to="/stages/stagiaires" replace />
}

/** Attestations : responsables et secrétariat (pas les superviseurs). */
const SecretariatOrLead = ({ children }: { children: React.ReactNode }) => {
  const { role } = useAuth()
  return isStagesLead(role as string) || isStagesSecretariat(role as string) ? <>{children}</> : <Navigate to="/stages/stagiaires" replace />
}

const StagesRoutes = () => (
  <StagesGuard>
    <DefaultLayout>
      <Suspense fallback={<LoadingSpinner fullPage message="Chargement…" />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/demandes" element={<Staff><StagesPage /></Staff>} />
          <Route path="/stagiaires" element={<Staff><StagiairesPage /></Staff>} />
          <Route path="/binomes" element={<Staff><BinomesPage /></Staff>} />
          <Route path="/demandes-stagiaires" element={<Staff><DemandesStagiairesPage /></Staff>} />
          <Route path="/rapports" element={<Staff><RapportsPage /></Staff>} />
          <Route path="/attestations" element={<SecretariatOrLead><AttestationsPage /></SecretariatOrLead>} />
          <Route path="/superviseurs" element={<LeadOnly><SuperviseursPage /></LeadOnly>} />
          <Route path="/groupe-whatsapp" element={<LeadOnly><GroupeWhatsAppPage /></LeadOnly>} />
          <Route path="*" element={<Navigate to="/stages" replace />} />
        </Routes>
      </Suspense>
    </DefaultLayout>
  </StagesGuard>
)

export default StagesRoutes
