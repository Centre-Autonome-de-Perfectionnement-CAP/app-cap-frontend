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
const DemandesStagiairesPage = React.lazy(() => import('./DemandesStagiairesPage'))
const RapportsPage = React.lazy(() => import('./RapportsPage'))
const AttestationsPage = React.lazy(() => import('./AttestationsPage'))
const DashboardPage = React.lazy(() => import('./DashboardPage'))
const StageDossierPage = React.lazy(() => import('./StageDossierPage'))
const ReglagesPage = React.lazy(() => import('./ReglagesPage'))
const BibliothequePage = React.lazy(() => import('./BibliothequePage'))
const TravailPage = React.lazy(() => import('./TravailPage'))

/** Accueil du module : un lien reçu (?ref=…) ouvre le dossier ; sinon le tableau de bord. */
const Home = () => {
  const { search } = useLocation()
  const { role } = useAuth()
  if (isStagesSecretariat(role as string)) return <Navigate to="/stages/attestations" replace />
  const ref = new URLSearchParams(search).get('ref')
  return <Navigate to={ref ? `/stages/dossier/${encodeURIComponent(ref)}` : '/stages/tableau-de-bord'} replace />
}

/** Anciennes adresses : la page qui les remplace, filtre compris. */
const Moved = ({ to }: { to: string }) => {
  const { search } = useLocation()
  const scope = new URLSearchParams(search).get('scope')
  return <Navigate to={scope ? `${to}${to.includes('?') ? '&' : '?'}filtre=${encodeURIComponent(scope)}` : to} replace />
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
          <Route path="/tableau-de-bord" element={<Staff><DashboardPage /></Staff>} />
          <Route path="/demandes" element={<Staff><StagesPage /></Staff>} />
          <Route path="/stagiaires" element={<Staff><StagiairesPage /></Staff>} />
          <Route path="/dossier/:ref" element={<Staff><StageDossierPage /></Staff>} />
          <Route path="/suivi" element={<Moved to="/stages/stagiaires" />} />
          <Route path="/binomes" element={<Staff><BinomesPage /></Staff>} />
          <Route path="/demandes-stagiaires" element={<Staff><DemandesStagiairesPage /></Staff>} />
          <Route path="/rapports" element={<Staff><RapportsPage /></Staff>} />
          <Route path="/attestations" element={<SecretariatOrLead><AttestationsPage /></SecretariatOrLead>} />
          <Route path="/superviseurs" element={<LeadOnly><SuperviseursPage /></LeadOnly>} />
          <Route path="/reglages" element={<LeadOnly><ReglagesPage /></LeadOnly>} />
          <Route path="/bibliotheque" element={<LeadOnly><BibliothequePage /></LeadOnly>} />
          <Route path="/bibliotheque/:id" element={<LeadOnly><TravailPage /></LeadOnly>} />
          <Route path="/groupe-whatsapp" element={<Navigate to="/stages/reglages?onglet=whatsapp" replace />} />
          <Route path="*" element={<Navigate to="/stages" replace />} />
        </Routes>
      </Suspense>
    </DefaultLayout>
  </StagesGuard>
)

export default StagesRoutes
