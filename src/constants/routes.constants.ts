// src/constants/routes.constants.ts
// — Ajout de FRONTEND_ROUTES.DEMANDES = '/demandes'
// — Ajout de FRONTEND_ROUTES.DEMANDES_CAP_LOGIN et FRONTEND_ROUTES.DEMANDES_CAP

export const AUTH_ROUTES = {
  LOGIN: 'auth/login', LOGOUT: 'auth/logout',
  PASSWORD_FORGOT: 'auth/password-forgot', PASSWORD_RESET: 'auth/password-reset',
  ME: 'auth/me', ME_ECOLE: 'ecole/me', UPDATE_PROFILE: 'auth/update-profile',
} as const

export const INSCRIPTION_ROUTES = {
  BASE: 'inscription',
  STATS: 'inscription/dashboard/stats',
  GRAPHES: 'inscription/dashboard/graphes',
  PENDING_STUDENTS: 'inscription/pending-students',
  PENDING_STUDENT: (id: number | string) => `inscription/pending-students/${id}`,
  PENDING_STUDENT_DOCUMENTS: (id: number | string) => `inscription/pending-students/${id}/documents`,
  PENDING_STUDENT_STATUS: (id: number | string) => `inscription/pending-students/${id}/financial-status`,
  ACADEMIC_YEARS: 'inscription/academic-years',
  ACADEMIC_YEAR: (id: number | string) => `inscription/academic-years/${id}`,
  ACADEMIC_YEAR_PERIODS: (id: number | string) => `inscription/academic-years/${id}/periods`,
  ACTIVE_PERIODS: 'inscription/submissions/active-periods',
  ACTIVE_RECLAMATION_PERIODS: 'inscription/submissions/active-reclamation-periods',
  CHECK_SUBMISSION_STATUS: 'inscription/submissions/check-status',
  CHECK_RECLAMATION_STATUS: 'inscription/submissions/check-reclamation-status',
  DOSSIERS_PERIODS: 'inscription/dossiers/periods',
  DOSSIER_LICENCE: 'inscription/dossiers/licence',
  DOSSIER_MASTER: 'inscription/dossiers/master',
  DOSSIER_INGENIEUR_PREPA: 'inscription/dossiers/ingenieur/prepa',
  DOSSIER_INGENIEUR_SPECIALITE: 'inscription/dossiers/ingenieur/specialite',
  DOSSIER_COMPLEMENT: (trackingCode: string) => `inscription/dossiers/complement/${trackingCode}`,
  DOSSIER: (trackingCode: string) => `inscription/dossiers/${trackingCode}`,
  STUDENTS_LOOKUP_ID: 'inscription/students/lookup-id',
  STUDENTS_ASSIGN_ID: 'inscription/students/assign-id',
  CYCLES: 'inscription/cycles', FILIERES: 'inscription/filieres',
  NIVEAUX: 'inscription/niveaux', NIVEAUX_ALL: 'inscription/niveaux/all',
  NEXT_DEADLINE: 'inscription/next-deadline',
  CLASS_GROUPS: 'inscription/class-groups',
  CLASS_GROUP: (id: number | string) => `inscription/class-groups/${id}`,
  CLASS_GROUPS_DELETE_ALL: 'inscription/class-groups/delete-all',
  PUBLIC_ACADEMIC_YEARS: 'inscription/public/academic-years',
  PUBLIC_ACADEMIC_YEARS_FOR_DEPARTMENT: (departmentId: number | string) =>
    `inscription/public/academic-years/department/${departmentId}`,
  PUBLIC_ENTRY_DIPLOMAS: 'inscription/public/entry-diplomas',
} as const

export const FINANCE_ROUTES = {
  BASE: 'finance', PAIEMENTS: 'finance/paiements',
  PAIEMENT: (id: number | string) => `finance/paiements/${id}`,
  QUITTANCES: 'finance/quittances',
  QUITTANCE: (id: number | string) => `finance/quittances/${id}`,
  QUITTANCE_VALIDATE: (id: number | string) => `finance/quittances/${id}/validate`,
  QUITTANCE_REJECT: (id: number | string) => `finance/quittances/${id}/reject`,
  TARIFS: 'finance/tarifs',
  TARIF: (id: number | string) => `finance/tarifs/${id}`,
  COMPTE_ETUDIANT: (etudiantId: number | string) => `finance/compte/${etudiantId}`,
  STATISTICS: 'finance/statistics',
} as const

export const COURS_ROUTES = {
  BASE: 'cours',
  TEACHING_UNITS: 'cours/teaching-units',
  TEACHING_UNIT: (id: number | string) => `cours/teaching-units/${id}`,
  TEACHING_UNIT_COURSE_ELEMENTS: (id: number | string) => `cours/teaching-units/${id}/course-elements`,
  COURSE_ELEMENTS: 'cours/course-elements',
  COURSE_ELEMENT: (id: number | string) => `cours/course-elements/${id}`,
  COURSE_ELEMENT_PROFESSORS: (id: number | string) => `cours/course-elements/${id}/professors`,
  COURSE_ELEMENT_PROFESSORS_ATTACH: (id: number | string) => `cours/course-elements/${id}/professors/attach`,
  COURSE_ELEMENT_PROFESSORS_DETACH: (id: number | string) => `cours/course-elements/${id}/professors/detach`,
  COURSE_ELEMENT_RESOURCES: (id: number | string) => `cours/course-elements/${id}/resources`,
  COURSE_RESOURCES: 'cours/course-resources',
  COURSE_RESOURCE: (id: number | string) => `cours/course-resources/${id}`,
  COURSE_ELEMENT_PROFESSORS_ASSIGNMENTS: 'cours/course-element-professors',
  COURSE_ELEMENT_PROFESSOR_ASSIGNMENT: (id: number | string) => `cours/course-element-professors/${id}`,
  COURSE_ELEMENT_ASSIGNMENTS: (courseElementId: number | string) => `cours/course-elements/${courseElementId}/assignments`,
  COURSE_ELEMENT_PROFESSORS_RENEW: 'cours/course-element-professors/renew',
  PROGRAMS: 'cours/programs',
  PROGRAM: (id: number | string) => `cours/programs/${id}`,
  PROGRAMS_BULK: 'cours/programs/bulk', PROGRAMS_COPY: 'cours/programs/copy', PROGRAMS_RENEW: 'cours/programs/renew',
  CLASS_GROUP_PROGRAMS: (classGroupId: number | string) => `cours/class-groups/${classGroupId}/programs`,
  PROFESSOR_PROGRAMS: (professorId: number | string) => `cours/professors/${professorId}/programs`,
} as const

export const NOTES_ROUTES = {
  BASE: 'notes',
  EVALUATIONS: 'notes/evaluations',
  EVALUATION: (id: number | string) => `notes/evaluations/${id}`,
  NOTES: 'notes/notes',
  NOTE: (id: number | string) => `notes/notes/${id}`,
  BULLETINS: 'notes/bulletins',
  BULLETIN: (id: number | string) => `notes/bulletins/${id}`,
  PROFESSOR_DASHBOARD: 'notes/professor/dashboard',
  PROFESSOR_EVALUATIONS: 'notes/professor/evaluations',
} as const

export const PRESENCE_ROUTES = {
  BASE: 'presence',
  SESSIONS: 'presence/sessions',
  SESSION: (id: number | string) => `presence/sessions/${id}`,
  PRESENCES: 'presence/presences',
} as const

export const EMPLOI_DU_TEMPS_ROUTES = {
  BASE: 'emploi-du-temps',
  BUILDINGS: 'emploi-du-temps/buildings',
  BUILDING: (id: number | string) => `emploi-du-temps/buildings/${id}`,
  ROOMS: 'emploi-du-temps/rooms',
  ROOM: (id: number | string) => `emploi-du-temps/rooms/${id}`,
  TIME_SLOTS: 'emploi-du-temps/time-slots',
  TIME_SLOT: (id: number | string) => `emploi-du-temps/time-slots/${id}`,
  SCHEDULED_COURSES: 'emploi-du-temps/scheduled-courses',
  SCHEDULED_COURSE: (id: number | string) => `emploi-du-temps/scheduled-courses/${id}`,
  SCHEDULE_VIEW: 'emploi-du-temps/schedule-view',
  DASHBOARD: 'emploi-du-temps/dashboard',
  CONFLICTS: 'emploi-du-temps/conflicts',
} as const

export const SOUTENANCE_ROUTES = {
  BASE: 'soutenances', LIST: 'soutenances',
  DETAIL: (id: number | string) => `soutenances/${id}`,
  PLANIFIER: 'soutenances/planifier',
  JURY: (soutenanceId: number | string) => `soutenances/${soutenanceId}/jury`,
} as const

export const CAHIER_TEXTE_ROUTES = {
  BASE: 'cahier-texte', LIST: 'cahier-texte',
  DETAIL: (id: number | string) => `cahier-texte/${id}`,
  BY_CLASSE: (classeId: number | string) => `cahier-texte/classe/${classeId}`,
  BY_MATIERE: (matiereId: number | string) => `cahier-texte/matiere/${matiereId}`,
} as const

export const RH_ROUTES = {
  BASE: 'rh', PERSONNEL: 'rh/personnel',
  EMPLOYE: (id: number | string) => `rh/personnel/${id}`,
  CONTRATS: 'rh/contrats', CONTRAT: (id: number | string) => `rh/contrats/${id}`,
  ABSENCES: 'rh/absences', ABSENCE: (id: number | string) => `rh/absences/${id}`,
} as const

// ==================== ROUTES FRONTEND ====================

export const FRONTEND_ROUTES = {
  LOGIN:    '/login',
  REGISTER: '/register',
  PORTAIL:  '/portail',
  DASHBOARD: '/dashboard',

  INSCRIPTION: {
    BASE: '/inscription', DASHBOARD: '/inscription/dashboard',
    ETUDIANTS: '/inscription/etudiants',
    ETUDIANT_DETAIL: (id: number | string) => `/inscription/etudiants/${id}`,
    PENDING_STUDENTS: '/inscription/pending-students',
    ANNEES_ACADEMIQUES: '/inscription/annees-academiques',
  },
  FINANCE: {
    BASE: '/finance', PAIEMENTS: '/finance/paiements',
    QUITTANCES: '/finance/quittances', TARIFS: '/finance/tarifs',
  },
  COURS: { BASE: '/cours', LIST: '/cours/liste', EMPLOI: '/cours/emploi-du-temps' },
  EMPLOI_DU_TEMPS: {
    BASE: '/emploi-du-temps', DASHBOARD: '/emploi-du-temps/dashboard',
    CALENDAR: '/emploi-du-temps/calendar', BUILDINGS: '/emploi-du-temps/buildings',
    ROOMS: '/emploi-du-temps/rooms', TIME_SLOTS: '/emploi-du-temps/time-slots',
    SCHEDULED_COURSES: '/emploi-du-temps/scheduled-courses', SCHEDULE_VIEW: '/emploi-du-temps/schedule-view',
  },
  NOTES:    { BASE: '/notes', SAISIE: '/notes/saisie', BULLETINS: '/notes/bulletins' },
  PRESENCE: { BASE: '/presence', SAISIE: '/presence/saisie', LISTE: '/presence/liste' },
  BIBLIOTHEQUE: '/bibliotheque',
  ATTESTATIONS: '/attestations',
  CAHIER_TEXTE: '/cahier-texte',
  RH:           '/rh',
  SOUTENANCES:  '/soutenances',

  // ── Module Gestion des Demandes ──────────────────────────────────────────────
  DEMANDES:           '/demandes',          // rôles secrétaire/comptable/chef-cap (DefaultLayout)
  DEMANDES_CAP_LOGIN: '/demandes/login',    // page de login dédiée direction
  DEMANDES_CAP:       '/demandes/cap',      // espace isolé direction (CAPLayout)

  PAGE_404: '/404',
  PAGE_500: '/500',
} as const
