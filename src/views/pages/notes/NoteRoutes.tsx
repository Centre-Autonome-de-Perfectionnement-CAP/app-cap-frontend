import React, { Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoadingSpinner } from '@/components';
import { useAuth } from '@/contexts';

const ProfessorDashboard     = React.lazy(() => import('./ProfessorDashboard'));
const GradeSheet             = React.lazy(() => import('./GradeSheet'));
const CreateEvaluation       = React.lazy(() => import('./CreateEvaluation'));
const AdminDashboard         = React.lazy(() => import('./AdminDashboard'));
const AdminConsultation      = React.lazy(() => import('./AdminConsultation'));
const DecisionSemester       = React.lazy(() => import('./DecisionSemester'));
const DecisionYear           = React.lazy(() => import('./DecisionYear'));
const ProfessorContratsList  = React.lazy(() => import('./ProfessorContratsList'));
const ProfessorContratDetail = React.lazy(() => import('./ProfessorContratDetail'));

const NoteRoutes = () => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner fullPage message="Vérification des droits..." />;
  }

  const isProfesseur = role === 'professeur';
  const isAdmin      = role === 'admin' || role === 'scolarite' || role === 'direction';

  // ─────────────────────────────────────────────────────────────────────────────
  // ROUTES CONTRATS : publiques (accessibles même sans authentification).
  // ProfessorContratDetail gère lui-même l'affichage selon l'état de connexion.
  // Cela permet au lien envoyé par email de fonctionner directement.
  // ─────────────────────────────────────────────────────────────────────────────
  const publicContratRoutes = (
    <>
      <Route path="professor/contrats"       element={<ProfessorContratsList />} />
      <Route path="professor/contrats/:uuid" element={<ProfessorContratDetail />} />
    </>
  );

  // ── Non authentifié ──────────────────────────────────────────────────────────
  // Seules les routes contrats restent accessibles.
  // Toutes les autres → login avec l'URL courante passée dans location.state
  // (pas en query param, pour être cohérent avec ce que Login.tsx lit).
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<LoadingSpinner fullPage message="Chargement..." />}>
        <Routes>
          {publicContratRoutes}
          <Route
            path="*"
            element={
              <Navigate
                to="/login"
                state={{ redirectAfterLogin: location.pathname + location.search }}
                replace
              />
            }
          />
        </Routes>
      </Suspense>
    );
  }

  // ── Authentifié ──────────────────────────────────────────────────────────────
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module notes..." />}>
      <Routes>
        {/* Routes Professeur */}
        {isProfesseur && (
          <>
            <Route path="professor/dashboard"                element={<ProfessorDashboard />} />
            <Route path="professor/grade-sheet/:programUuid" element={<GradeSheet />} />
            <Route path="professor/evaluation/:programUuid"  element={<CreateEvaluation />} />
            {publicContratRoutes}
          </>
        )}

        {/* Routes Administration */}
        {isAdmin && (
          <>
            <Route path="admin/dashboard"         element={<AdminDashboard />} />
            <Route path="admin/consultation"      element={<AdminConsultation />} />
            <Route path="admin/decision-semester" element={<DecisionSemester />} />
            <Route path="admin/decision-year"     element={<DecisionYear />} />
          </>
        )}

        {/* Redirection par défaut selon le rôle */}
        <Route
          path="/"
          element={
            <Navigate
              to={
                isProfesseur ? 'professor/dashboard'
                : isAdmin    ? 'admin/dashboard'
                : '/portail'
              }
              replace
            />
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/portail" replace />} />
      </Routes>
    </Suspense>
  );
};

export default NoteRoutes;
