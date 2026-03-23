import React, { Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoadingSpinner } from '@/components'
import { useAuth } from '@/contexts'

const ProfessorDashboard  = React.lazy(() => import('./ProfessorDashboard'))
const GradeSheet          = React.lazy(() => import('./GradeSheet'))
const CreateEvaluation    = React.lazy(() => import('./CreateEvaluation'))
const AdminDashboard      = React.lazy(() => import('./AdminDashboard'))
const AdminConsultation   = React.lazy(() => import('./AdminConsultation'))
const DecisionSemester    = React.lazy(() => import('./DecisionSemester'))
const DecisionYear        = React.lazy(() => import('./DecisionYear'))

/**
 * Guard interne au module Notes.
 *
 * - "professeur" → accès UNIQUEMENT aux routes /professor/*
 *   Toute tentative d'accès à /admin/* ou /decisions/* → redirigé vers son dashboard
 *
 * - Rôles admin (chef-cap, secrétaire, chef-division...) → accès UNIQUEMENT aux routes
 *   /admin/* et /decisions/*
 *   Toute tentative d'accès à /professor/* → redirigé vers /notes/admin/dashboard
 */
const NoteRoutes = () => {
  const { role } = useAuth()
  const isProfesseur = (role as string) === 'professeur'

  return (
    <Suspense fallback={<LoadingSpinner fullPage message="Chargement du module Notes..." />}>
      <Routes>

        {/* ── Routes Professeur ── */}
        {/* Accessibles UNIQUEMENT au rôle professeur */}
        <Route
          path="/professor/dashboard"
          element={
            isProfesseur
              ? <ProfessorDashboard />
              : <Navigate to="/notes/admin/dashboard" replace />
          }
        />
        <Route
          path="/professor/grade-sheet/:programId"
          element={
            isProfesseur
              ? <GradeSheet />
              : <Navigate to="/notes/admin/dashboard" replace />
          }
        />
        <Route
          path="/professor/evaluation/:programId"
          element={
            isProfesseur
              ? <CreateEvaluation />
              : <Navigate to="/notes/admin/dashboard" replace />
          }
        />

        {/* ── Routes Administration ── */}
        {/* Accessibles UNIQUEMENT aux rôles admin (pas au professeur) */}
        <Route
          path="/admin/dashboard"
          element={
            isProfesseur
              ? <Navigate to="/notes/professor/dashboard" replace />
              : <AdminDashboard />
          }
        />
        <Route
          path="/admin/consultation"
          element={
            isProfesseur
              ? <Navigate to="/notes/professor/dashboard" replace />
              : <AdminConsultation />
          }
        />

        {/* ── Routes Décisions ── */}
        {/* Accessibles UNIQUEMENT aux rôles admin */}
        <Route
          path="/decisions/semester"
          element={
            isProfesseur
              ? <Navigate to="/notes/professor/dashboard" replace />
              : <DecisionSemester />
          }
        />
        <Route
          path="/decisions/year"
          element={
            isProfesseur
              ? <Navigate to="/notes/professor/dashboard" replace />
              : <DecisionYear />
          }
        />

        {/* ── Redirection par défaut selon le rôle ── */}
        <Route
          path="/"
          element={
            <Navigate
              to={isProfesseur ? '/notes/professor/dashboard' : '/notes/admin/dashboard'}
              replace
            />
          }
        />

        {/* 404 sous-routes invalides */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </Suspense>
  )
}

export default NoteRoutes