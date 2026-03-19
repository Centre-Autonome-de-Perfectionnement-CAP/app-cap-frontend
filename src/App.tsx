import React, { Suspense, useEffect } from 'react'
import { Route, Routes, Navigate, BrowserRouter } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useColorModes } from '@coreui/react'
import './scss/style.scss'

const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout.tsx'))
import ProtectedRoute from './protected/ProtectedRoutes.tsx'
import { AuthContextProvider, useAuth } from '@/contexts'
import { FRONTEND_ROUTES, MODULES } from '@/constants'
import { LoadingSpinner } from '@/components'

// ── Pages publiques ────────────────────────────────────────────────────────
const Login    = React.lazy(() => import('./views/pages/login/Login.tsx'))
const Portail  = React.lazy(() => import('./views/pages/portail/Portail.tsx'))
const Register = React.lazy(() => import('./views/pages/register/Register.tsx'))
const Page404  = React.lazy(() => import('./views/pages/page404/Page404.tsx'))
const Page500  = React.lazy(() => import('./views/pages/page500/Page500.tsx'))

// ── Espace responsable de classe ───────────────────────────────────────────
const ResponsableLayout   = React.lazy(() => import('./layout/ResponsableLayout.tsx'))
const ResponsableDashboard = React.lazy(() => import('./views/pages/responsable/ResponsableDashboard.tsx'))

// ── Modules admin ──────────────────────────────────────────────────────────
const InscriptionRoutes = React.lazy(() => import('./views/pages/inscription/InscriptionRoutes.tsx'))
const AttestationRoutes = React.lazy(() => import('./views/pages/attestation/AttestationRoutes.tsx'))
const NoteRoutes        = React.lazy(() => import('./views/pages/notes/NoteRoutes.tsx'))
const RhRoutes          = React.lazy(() => import('./views/pages/rh/RhRoutes.tsx'))
const CoursRoutes       = React.lazy(() => import('./views/pages/cours/CoursRoutes.tsx'))
const SoutenanceRoutes  = React.lazy(() => import('./views/pages/soutenance/SoutenanceRoutes.tsx'))
const EmploiRoutes      = React.lazy(() => import('./views/pages/emploi-du-temps/EmploiRoutes.tsx'))
const CahierRoutes      = React.lazy(() => import('./views/pages/cahier-texte/CahierRoutes.tsx'))
const PresenceRoutes    = React.lazy(() => import('./views/pages/presence/PresenceRoutes.tsx'))
const FinanceRoutes     = React.lazy(() => import('./views/pages/finance/FinanceRoutes.tsx'))
const BibliothequeRoutes = React.lazy(() => import('./views/pages/bibliotheque/BibliothequeRoutes.tsx'))

// ── Guard exclusif pour le dashboard responsable ───────────────────────────
/**
 * Seul le rôle 'responsable' peut accéder à cette route.
 * Tout autre rôle authentifié → portail.
 * Non authentifié → login.
 */
const ResponsableOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, role } = useAuth()

  if (isLoading) return <LoadingSpinner fullPage message="Vérification..." />
  if (!isAuthenticated)                   return <Navigate to={FRONTEND_ROUTES.LOGIN}   replace />
  if ((role as string) !== 'responsable') return <Navigate to={FRONTEND_ROUTES.PORTAIL} replace />

  return <>{children}</>
}

// ── App ────────────────────────────────────────────────────────────────────
const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('coreui-free-react-admin-template-theme')
  const storedTheme = useSelector((state: any) => state.theme)

  useEffect(() => {
    const urlParams  = new URLSearchParams(window.location.href.split('?')[1])
    const themeParam = urlParams.get('theme')
    const themeMatch = themeParam?.match(/^[A-Za-z0-9\s]+/)
    const theme      = themeMatch?.[0]
    if (theme) setColorMode(theme)
    if (isColorModeSet()) return
    setColorMode(storedTheme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BrowserRouter basename="/services">
      <AuthContextProvider>
        <Suspense fallback={<LoadingSpinner fullPage message="Chargement de l'application..." />}>
          <Routes>

            {/* ── Routes publiques ── */}
            <Route path={FRONTEND_ROUTES.LOGIN}    element={<Login />} />
            <Route path={FRONTEND_ROUTES.REGISTER} element={<Register />} />
            <Route path={FRONTEND_ROUTES.PAGE_404} element={<Page404 />} />
            <Route path={FRONTEND_ROUTES.PAGE_500} element={<Page500 />} />

            {/* ── Portail admin ── */}
            <Route
              path={FRONTEND_ROUTES.PORTAIL}
              element={
                <ProtectedRoute module="portail">
                  <Portail />
                </ProtectedRoute>
              }
            />

            {/* ── Dashboard responsable de classe ──────────────────────── */}
            {/* Accessible UNIQUEMENT au rôle 'responsable'                 */}
            <Route
              path={`${FRONTEND_ROUTES.RESPONSABLE_DASHBOARD}/*`}
              element={
                <ResponsableOnlyRoute>
                  <ResponsableLayout>
                    <ResponsableDashboard />
                  </ResponsableLayout>
                </ResponsableOnlyRoute>
              }
            />

            {/* ── Modules admin ── */}
            <Route
              path={`${FRONTEND_ROUTES.INSCRIPTION.BASE}/*`}
              element={
                <ProtectedRoute module={MODULES.INSCRIPTION}>
                  <DefaultLayout><InscriptionRoutes /></DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.ATTESTATIONS}/*`}
              element={
                <ProtectedRoute module={MODULES.ATTESTATIONS}>
                  <DefaultLayout><AttestationRoutes /></DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.NOTES.BASE}/*`}
              element={
                <ProtectedRoute module={MODULES.NOTES}>
                  <DefaultLayout><NoteRoutes /></DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.COURS.BASE}/*`}
              element={
                <ProtectedRoute module={MODULES.COURS}>
                  <DefaultLayout><CoursRoutes /></DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.RH}/*`}
              element={
                <ProtectedRoute module={MODULES.RH}>
                  <DefaultLayout><RhRoutes /></DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.SOUTENANCES}/*`}
              element={
                <ProtectedRoute module={MODULES.SOUTENANCES}>
                  <DefaultLayout><SoutenanceRoutes /></DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.EMPLOI_DU_TEMPS.BASE}/*`}
              element={
                <ProtectedRoute module={MODULES.EMPLOI_DU_TEMPS}>
                  <DefaultLayout><EmploiRoutes /></DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.CAHIER_TEXTE}/*`}
              element={
                <ProtectedRoute module={MODULES.CAHIER_TEXTE}>
                  <DefaultLayout><CahierRoutes /></DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.PRESENCE.BASE}/*`}
              element={
                <ProtectedRoute module={MODULES.PRESENCE}>
                  <DefaultLayout><PresenceRoutes /></DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.FINANCE.BASE}/*`}
              element={
                <ProtectedRoute module={MODULES.FINANCE}>
                  <DefaultLayout><FinanceRoutes /></DefaultLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path={`${FRONTEND_ROUTES.BIBLIOTHEQUE}/*`}
              element={
                <ProtectedRoute module={MODULES.BIBLIOTHEQUE}>
                  <DefaultLayout><BibliothequeRoutes /></DefaultLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to={FRONTEND_ROUTES.PORTAIL} replace />} />
          </Routes>
        </Suspense>
      </AuthContextProvider>
    </BrowserRouter>
  )
}

export default App