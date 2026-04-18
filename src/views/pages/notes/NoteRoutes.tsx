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
const ProfessorTextbookPage  = React.lazy(() => import('./ProfessorTextbookPage'));

const NoteRoutes = () => {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner fullPage message="Vérification des droits..." />;
  }

  const isProfesseur = role === 'professeur';
  const isAdmin      = role === 'admin' || role === 'scolarite' || role === 'direction';

  // Routes contrats : publiques (accessibles même sans authentification)
  const publicContratRoutes = (
    <>
      <Route path="professor/contrats"       element={<ProfessorContratsList />} />
      <Route path="professor/contrats/:uuid" element={<ProfessorContratDetail />} />
    </>
  );

  // Non authentifié
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

  // Authentifié
  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module notes..." />}>
      <Routes>
        {/* Routes Professeur */}
        {isProfesseur && (
          <>
            <Route path="professor/dashboard"     element={<ProfessorDashboard />} />
            <Route path="professor/grade-sheet/:programUuid" element={<GradeSheet />} />
            {/* ✅ CORRECTION : le chemin doit correspondre à /notes/professor/textbook */}
            <Route path="professor/textbook"      element={<ProfessorTextbookPage />} />
            <Route path="professor/evaluation/:programUuid" element={<CreateEvaluation />} />
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