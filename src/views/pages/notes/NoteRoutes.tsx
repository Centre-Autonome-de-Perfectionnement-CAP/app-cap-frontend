import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components';
import { useAuth } from '@/contexts';

const ProfessorDashboard = React.lazy(() => import('./ProfessorDashboard'));
const GradeSheet = React.lazy(() => import('./GradeSheet'));
const CreateEvaluation = React.lazy(() => import('./CreateEvaluation'));
const AdminDashboard = React.lazy(() => import('./AdminDashboard'));
const AdminConsultation = React.lazy(() => import('./AdminConsultation'));
const DecisionSemester = React.lazy(() => import('./DecisionSemester'));
const DecisionYear = React.lazy(() => import('./DecisionYear'));

const NoteRoutes = () => {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullPage message="Vérification des droits..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const isProfesseur = role === 'professeur';
  const isAdmin = role === 'admin' || role === 'scolarite' || role === 'direction';

  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module notes..." />}>
      <Routes>
        {/* Routes Professeur */}
        {isProfesseur && (
          <>
            <Route path="professor/dashboard" element={<ProfessorDashboard />} />
            <Route path="professor/grade-sheet/:programUuid" element={<GradeSheet />} />
            <Route path="professor/evaluation/:programUuid" element={<CreateEvaluation />} />
          </>
        )}

        {/* Routes Administration */}
        {isAdmin && (
          <>
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/consultation" element={<AdminConsultation />} />
            <Route path="admin/decision-semester" element={<DecisionSemester />} />
            <Route path="admin/decision-year" element={<DecisionYear />} />
          </>
        )}

        {/* Redirection par défaut selon le rôle */}
        <Route
          path="/"
          element={
            <Navigate
              to={isProfesseur ? "professor/dashboard" : isAdmin ? "admin/dashboard" : "/portail"}
              replace
            />
          }
        />

        {/* 404 pour les routes invalides */}
        <Route path="*" element={<Navigate to="/portail" replace />} />
      </Routes>
    </Suspense>
  );
};

export default NoteRoutes;
