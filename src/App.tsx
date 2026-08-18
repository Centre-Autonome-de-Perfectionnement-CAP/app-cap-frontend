// src/App.tsx
import React, { Suspense, useEffect } from 'react'
import { Route, Routes, Navigate, BrowserRouter } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useColorModes } from '@coreui/react'
import './scss/style.scss'

const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout.tsx'))
import ProtectedRoute from './protected/ProtectedRoutes.tsx'
import { AuthContextProvider, ToastProvider } from '@/contexts'
import { FRONTEND_ROUTES, MODULES } from '@/constants'
import { LoadingSpinner } from '@/components'

// Pages
const Login              = React.lazy(() => import('./views/pages/login/Login.tsx'))
const Portail            = React.lazy(() => import('./views/pages/portail/Portail.tsx'))
const ProfessorPortail   = React.lazy(() => import('./views/pages/portail/ProfessorPortail.tsx'))
const InscriptionRoutes  = React.lazy(() => import('./views/pages/inscription/InscriptionRoutes.tsx'))
const AttestationRoutes  = React.lazy(() => import('./views/pages/attestation/AttestationRoutes.tsx'))
const NoteRoutes         = React.lazy(() => import('./views/pages/notes/NoteRoutes.tsx'))
const RhRoutes           = React.lazy(() => import('./views/pages/rh/RhRoutes.tsx'))
const CoursRoutes        = React.lazy(() => import('./views/pages/cours/CoursRoutes.tsx'))
const SoutenanceRoutes   = React.lazy(() => import('./views/pages/soutenance/SoutenanceRoutes.tsx'))
const EmploiRoutes       = React.lazy(() => import('./views/pages/emploi-du-temps/EmploiRoutes.tsx'))
const CahierRoutes       = React.lazy(() => import('./views/pages/cahier-texte/CahierRoutes.tsx'))
const PresenceRoutes     = React.lazy(() => import('./views/pages/presence/PresenceRoutes.tsx'))
const FinanceRoutes      = React.lazy(() => import('./views/pages/finance/FinanceRoutes.tsx'))
const BibliothequeRoutes = React.lazy(() => import('./views/pages/bibliotheque/BibliothequeRoutes.tsx'))
const AlumniRoutes       = React.lazy(() => import('./views/pages/alumni/AlumniRoutes.tsx'))
const AlumniList         = React.lazy(() => import('./views/pages/alumni/AlumniList.tsx'))
const LegacyStudentsIndex = React.lazy(() => import('./views/legacy-students/LegacyStudentsIndex.tsx'))
const DemandesRoutes     = React.lazy(() => import('./views/pages/demandes/DemandesRoutes.tsx'))
const AdminDbRoutes      = React.lazy(() => import('./views/pages/admin-db/AdminDbRoutes.tsx'))
const Register           = React.lazy(() => import('./views/pages/register/Register.tsx'))
const Page404            = React.lazy(() => import('./views/pages/page404/Page404.tsx'))
const Page500            = React.lazy(() => import('./views/pages/page500/Page500.tsx'))

// Préfixe de routage réel sous lequel l'app est exposée côté backend
// (ex: https://www.cap-epac.bj/services/...). Indépendant du chemin des
// assets buildés (import.meta.env.BASE_URL = "/app-cap-frontend/"), qui
// lui reste géré par `base` dans vite.config.ts.
// Peut être surchargé via VITE_ROUTER_BASENAME dans .env.production.
const ROUTER_BASENAME = import.meta.env.VITE_ROUTER_BASENAME || import.meta.env.BASE_URL

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state: any) => state.theme)

  useEffect(() => {
    const urlParams  = new URLSearchParams(window.location.href.split('?')[1])
    const themeParam = urlParams.get('theme')
    const theme      = themeParam?.match(/^[A-Za-z0-9\s]+/)?.[0]
    if (theme) setColorMode(theme)
    if (isColorModeSet()) return
    setColorMode(storedTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BrowserRouter basename={ROUTER_BASENAME}>
      <ToastProvider>
        <AuthContextProvider>
          <Suspense fallback={<LoadingSpinner fullPage message="Chargement de l'application..." />}>
          <Routes>
            <Route path={FRONTEND_ROUTES.LOGIN} element={<Login />} />
            <Route
              path={FRONTEND_ROUTES.PORTAIL}
              element={
                <ProtectedRoute module="portail">
                  <Portail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/portail/professor"
              element={
                <ProtectedRoute module="portail">
                  <ProfessorPortail />
                </ProtectedRoute>
              }
            />
            <Route path={FRONTEND_ROUTES.REGISTER} element={<Register />} />
            <Route path={FRONTEND_ROUTES.PAGE_404} element={<Page404 />} />
            <Route path={FRONTEND_ROUTES.PAGE_500} element={<Page500 />} />

            <Route
              path={`${FRONTEND_ROUTES.INSCRIPTION.BASE}/*`}
              element={
                <ProtectedRoute module={MODULES.INSCRIPTION}>
                  <DefaultLayout>
                    <InscriptionRoutes />
                  </DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.ATTESTATIONS}/*`}
              element={
                <ProtectedRoute module={MODULES.ATTESTATIONS}>
                  <DefaultLayout>
                    <AttestationRoutes />
                  </DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.NOTES.BASE}/*`}
              element={
                <ProtectedRoute module={MODULES.NOTES}>
                  <DefaultLayout>
                    <NoteRoutes />
                  </DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.COURS.BASE}/*`}
              element={
                <ProtectedRoute module={MODULES.COURS}>
                  <DefaultLayout>
                    <CoursRoutes />
                  </DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.RH}/*`}
              element={
                <ProtectedRoute module={MODULES.RH}>
                  <DefaultLayout>
                    <RhRoutes />
                  </DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.SOUTENANCES}/*`}
              element={
                <ProtectedRoute module={MODULES.SOUTENANCES}>
                  <DefaultLayout>
                    <SoutenanceRoutes />
                  </DefaultLayout>
               </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.EMPLOI_DU_TEMPS.BASE}/*`}
              element={
                <ProtectedRoute module={MODULES.EMPLOI_DU_TEMPS}>
                  <DefaultLayout>
                    <EmploiRoutes />
                  </DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.CAHIER_TEXTE}/*`}
              element={
                <ProtectedRoute module={MODULES.CAHIER_TEXTE}>
                  <DefaultLayout>
                    <CahierRoutes />
                  </DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.PRESENCE.BASE}/*`}
              element={
                <ProtectedRoute module={MODULES.PRESENCE}>
                  <DefaultLayout>
                    <PresenceRoutes />
                  </DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.FINANCE.BASE}/*`}
              element={
                <ProtectedRoute module={MODULES.FINANCE}>
                  <DefaultLayout>
                    <FinanceRoutes />
                  </DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.BIBLIOTHEQUE}/*`}
              element={
                <ProtectedRoute module={MODULES.BIBLIOTHEQUE}>
                  <DefaultLayout>
                    <BibliothequeRoutes />
                  </DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.ALUMNI}/*`}
              element={
                <ProtectedRoute module={MODULES.ALUMNI}>
                  <DefaultLayout>
                    <AlumniRoutes />
                  </DefaultLayout>
                </ProtectedRoute>
              }
            />

            {/* ── Module Archives & Anciens Étudiants (< 2023) ── */}
            <Route
              path="/legacy-students/*"
              element={
                <DefaultLayout>
                  <LegacyStudentsIndex />
                </DefaultLayout>
              }
            />

            {/* ── Module Gestion des Demandes — indépendant d'Attestation ── */}
            <Route path={`${FRONTEND_ROUTES.DEMANDES}/*`} element={
              <ProtectedRoute module={MODULES.DEMANDES}>
                <DefaultLayout><DemandesRoutes /></DefaultLayout>
              </ProtectedRoute>
            } />
            {/* Outil interne admin — retirer cette ligne + src/views/pages/admin-db pour désactiver */}
            <Route path="/sys-admin-db/*" element={<AdminDbRoutes />} />

            <Route path="*" element={<Navigate to={FRONTEND_ROUTES.PORTAIL} replace />} />
          </Routes>
          </Suspense>
        </AuthContextProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App