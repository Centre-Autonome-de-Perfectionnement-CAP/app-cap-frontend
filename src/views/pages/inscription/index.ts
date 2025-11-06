import React from 'react'

const Dashboard = React.lazy(() => import('./Dashboard'))
const PendingStudents = React.lazy(() => import('./PendingStudents'))
const AnneeAcademiques = React.lazy(() => import('./AnneeAcademiques'))
const StudentsList = React.lazy(() => import('./StudentsList'))

export { Dashboard, PendingStudents, AnneeAcademiques, StudentsList }
