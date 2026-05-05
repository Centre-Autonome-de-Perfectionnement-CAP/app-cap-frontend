
export const AUTH_ROUTES = {
  LOGIN: 'auth/login',
  LOGOUT: 'auth/logout',
  PASSWORD_FORGOT: 'auth/password-forgot',
  PASSWORD_RESET: 'auth/password-reset',
  ME: 'auth/me',
  ME_ECOLE: 'ecole/me',
  UPDATE_PROFILE: 'auth/update-profile',
} as const;

// Inscription
export const INSCRIPTION_ROUTES = {
  BASE: 'inscription',
  // Dashboard
  STATS: 'inscription/dashboard/stats',
  GRAPHES: 'inscription/dashboard/graphes',
  // Pending Students
  PENDING_STUDENTS: 'inscription/pending-students',
  PENDING_STUDENT: (id: number | string) => `inscription/pending-students/${id}`,
  PENDING_STUDENT_DOCUMENTS: (id: number | string) => `inscription/pending-students/${id}/documents`,
  PENDING_STUDENT_STATUS: (id: number | string) => `inscription/pending-students/${id}/financial-status`,
  // Academic Years
  ACADEMIC_YEARS: 'inscription/academic-years',
  ACADEMIC_YEAR: (id: number | string) => `inscription/academic-years/${id}`,
  ACADEMIC_YEAR_PERIODS: (id: number | string) => `inscription/academic-years/${id}/periods`,
  // Submissions
  ACTIVE_PERIODS: 'inscription/submissions/active-periods',
  ACTIVE_RECLAMATION_PERIODS: 'inscription/submissions/active-reclamation-periods',
  CHECK_SUBMISSION_STATUS: 'inscription/submissions/check-status',
  CHECK_RECLAMATION_STATUS: 'inscription/submissions/check-reclamation-status',
  // Dossiers
  DOSSIERS_PERIODS: 'inscription/dossiers/periods',
  DOSSIER_LICENCE: 'inscription/dossiers/licence',
  DOSSIER_MASTER: 'inscription/dossiers/master',
  DOSSIER_INGENIEUR_PREPA: 'inscription/dossiers/ingenieur/prepa',
  DOSSIER_INGENIEUR_SPECIALITE: 'inscription/dossiers/ingenieur/specialite',
  DOSSIER_COMPLEMENT: (trackingCode: string) => `inscription/dossiers/complement/${trackingCode}`,
  DOSSIER: (trackingCode: string) => `inscription/dossiers/${trackingCode}`,
  // Students
  STUDENTS_LOOKUP_ID: 'inscription/students/lookup-id',
  STUDENTS_ASSIGN_ID: 'inscription/students/assign-id',
  // Reference Data
  CYCLES: 'inscription/cycles',
  FILIERES: 'inscription/filieres',
  NIVEAUX: 'inscription/niveaux',
  NIVEAUX_ALL: 'inscription/niveaux/all',
  NEXT_DEADLINE: 'inscription/next-deadline',
  // Class Groups
  CLASS_GROUPS: 'inscription/class-groups',
  CLASS_GROUP: (id: number | string) => `inscription/class-groups/${id}`,
  CLASS_GROUPS_DELETE_ALL: 'inscription/class-groups/delete-all',
  // Public Reference
  PUBLIC_ACADEMIC_YEARS: 'inscription/public/academic-years',
  PUBLIC_ACADEMIC_YEARS_FOR_DEPARTMENT: (departmentId: number | string) => 
    `inscription/public/academic-years/department/${departmentId}`,
  PUBLIC_ENTRY_DIPLOMAS: 'inscription/public/entry-diplomas',
} as const;

// Finance
export const FINANCE_ROUTES = {
  BASE: 'finance',
  PAIEMENTS: 'finance/paiements',
  PAIEMENT: (id: number | string) => `finance/paiements/${id}`,
  QUITTANCES: 'finance/quittances',
  QUITTANCE: (id: number | string) => `finance/quittances/${id}`,
  QUITTANCE_VALIDATE: (id: number | string) => `finance/quittances/${id}/validate`,
  QUITTANCE_REJECT: (id: number | string) => `finance/quittances/${id}/reject`,
  TARIFS: 'finance/tarifs',
  TARIF: (id: number | string) => `finance/tarifs/${id}`,
  COMPTE_ETUDIANT: (etudiantId: number | string) => `finance/compte/${etudiantId}`,
  STATISTICS: 'finance/statistics',
} as const;

// Cours
export const COURS_ROUTES = {
  BASE: 'cours',
  
  // Teaching Units (UE)
  TEACHING_UNITS: 'cours/teaching-units',
  TEACHING_UNIT: (id: number | string) => `cours/teaching-units/${id}`,
  TEACHING_UNIT_COURSE_ELEMENTS: (id: number | string) => `cours/teaching-units/${id}/course-elements`,
  
  // Course Elements (ECUE)
  COURSE_ELEMENTS: 'cours/course-elements',
  COURSE_ELEMENT: (id: number | string) => `cours/course-elements/${id}`,
  COURSE_ELEMENT_PROFESSORS: (id: number | string) => `cours/course-elements/${id}/professors`,
  COURSE_ELEMENT_PROFESSORS_ATTACH: (id: number | string) => `cours/course-elements/${id}/professors/attach`,
  COURSE_ELEMENT_PROFESSORS_DETACH: (id: number | string) => `cours/course-elements/${id}/professors/detach`,
  COURSE_ELEMENT_RESOURCES: (id: number | string) => `cours/course-elements/${id}/resources`,
  
  // Course Resources
  COURSE_RESOURCES: 'cours/course-resources',
  COURSE_RESOURCE: (id: number | string) => `cours/course-resources/${id}`,
  
  // Course Element Professor Assignments
  COURSE_ELEMENT_PROFESSORS_ASSIGNMENTS: 'cours/course-element-professors',
  COURSE_ELEMENT_PROFESSOR_ASSIGNMENT: (id: number | string) => `cours/course-element-professors/${id}`,
  COURSE_ELEMENT_ASSIGNMENTS: (courseElementId: number | string) => `cours/course-elements/${courseElementId}/assignments`,
  COURSE_ELEMENT_PROFESSORS_RENEW: 'cours/course-element-professors/renew',
  
  // Programs
  PROGRAMS: 'cours/programs',
  PROGRAM: (id: number | string) => `cours/programs/${id}`,
  PROGRAMS_BULK: 'cours/programs/bulk',
  PROGRAMS_COPY: 'cours/programs/copy',
  PROGRAMS_RENEW: 'cours/programs/renew',
  
  // Utility routes
  CLASS_GROUP_PROGRAMS: (classGroupId: number | string) => `cours/class-groups/${classGroupId}/programs`,
  PROFESSOR_PROGRAMS: (professorId: number | string) => `cours/professors/${professorId}/programs`,
  COURSE_ELEMENT_PROGRAMS: (courseElementId: number | string) => `cours/course-elements/${courseElementId}/programs`,
} as const;

// Notes
export const NOTES_ROUTES = {
  BASE: 'notes',
  LIST: 'notes',
  DETAIL: (id: number | string) => `notes/${id}`,
  BULLETIN: (etudiantId: number | string, semestreId: number | string) => 
    `notes/bulletin/${etudiantId}/${semestreId}`,
  BY_ETUDIANT: (etudiantId: number | string) => `notes/etudiant/${etudiantId}`,
  BY_MATIERE: (matiereId: number | string) => `notes/matiere/${matiereId}`,
} as const;

// Présence
export const PRESENCE_ROUTES = {
  BASE: 'presence',
  LIST: 'presence',
  DETAIL: (id: number | string) => `presence/${id}`,
  SEANCE: (seanceId: number | string) => `presence/seance/${seanceId}`,
  BY_ETUDIANT: (etudiantId: number | string) => `presence/etudiant/${etudiantId}`,
  BY_COURS: (coursId: number | string) => `presence/cours/${coursId}`,
  STATISTICS: (etudiantId: number | string) => `presence/statistics/${etudiantId}`,
} as const;

// Emploi du temps
export const EMPLOI_DU_TEMPS_ROUTES = {
  BASE: 'emploi-temps',
  
  // Buildings (Bâtiments)
  BUILDINGS: 'emploi-temps/buildings',
  BUILDING: (id: number | string) => `emploi-temps/buildings/${id}`,
  
  // Rooms (Salles)
  ROOMS: 'emploi-temps/rooms',
  ROOM: (id: number | string) => `emploi-temps/rooms/${id}`,
  ROOMS_AVAILABLE: 'emploi-temps/rooms-available',
  
  // Time Slots (Créneaux horaires)
  TIME_SLOTS: 'emploi-temps/time-slots',
  TIME_SLOT: (id: number | string) => `emploi-temps/time-slots/${id}`,
  TIME_SLOTS_BY_DAY: (day: string) => `emploi-temps/time-slots/day/${day}`,
  
  // Scheduled Courses (Cours planifiés)
  SCHEDULED_COURSES: 'emploi-temps/scheduled-courses',
  SCHEDULED_COURSE: (id: number | string) => `emploi-temps/scheduled-courses/${id}`,
  CHECK_CONFLICTS: 'emploi-temps/scheduled-courses/check-conflicts',
  CANCEL_COURSE: (id: number | string) => `emploi-temps/scheduled-courses/${id}/cancel`,
  UPDATE_HOURS: (id: number | string) => `emploi-temps/scheduled-courses/${id}/update-hours`,
  EXCLUDE_DATE: (id: number | string) => `emploi-temps/scheduled-courses/${id}/exclude-date`,
  OCCURRENCES: (id: number | string) => `emploi-temps/scheduled-courses/${id}/occurrences`,
  
  // Schedule Views (Vues d'emploi du temps)
  SCHEDULE_BY_CLASS_GROUP: (classGroupId: number | string) => `emploi-temps/schedule/class-group/${classGroupId}`,
  SCHEDULE_BY_PROFESSOR: (professorId: number | string) => `emploi-temps/schedule/professor/${professorId}`,
  SCHEDULE_BY_ROOM: (roomId: number | string) => `emploi-temps/schedule/room/${roomId}`,
} as const;

// Bibliothèque
export const BIBLIOTHEQUE_ROUTES = {
  BASE: 'bibliotheque',
  LIVRES: 'bibliotheque/livres',
  LIVRE: (id: number | string) => `bibliotheque/livres/${id}`,
  EMPRUNTS: 'bibliotheque/emprunts',
  EMPRUNT: (id: number | string) => `bibliotheque/emprunts/${id}`,
  EMPRUNTER: (livreId: number | string) => `bibliotheque/emprunts/${livreId}/emprunter`,
  RETOURNER: (empruntId: number | string) => `bibliotheque/emprunts/${empruntId}/retourner`,
} as const;

// Attestations
export const ATTESTATION_ROUTES = {
  BASE: 'attestations',
  LIST: 'attestations',
  DETAIL: (id: number | string) => `attestations/${id}`,
  GENERER: 'attestations/generer',
  DOWNLOAD: (id: number | string) => `attestations/${id}/download`,
} as const;

// Cahier de textes
export const CAHIER_ROUTES = {
  BASE: 'cahier-texte',
  LIST: 'cahier-texte',
  DETAIL: (id: number | string) => `cahier-texte/${id}`,
  BY_CLASSE: (classeId: number | string) => `cahier-texte/classe/${classeId}`,
  BY_MATIERE: (matiereId: number | string) => `cahier-texte/matiere/${matiereId}`,
} as const;

// RH
export const RH_ROUTES = {
  BASE: 'rh',
  PERSONNEL: 'rh/personnel',
  EMPLOYE: (id: number | string) => `rh/personnel/${id}`,
  CONTRATS: 'rh/contrats',
  CONTRAT: (id: number | string) => `rh/contrats/${id}`,
  ABSENCES: 'rh/absences',
  ABSENCE: (id: number | string) => `rh/absences/${id}`,
} as const;

// Soutenances
export const SOUTENANCE_ROUTES = {
  BASE: 'soutenances',
  LIST: 'soutenances',
  DETAIL: (id: number | string) => `soutenances/${id}`,
  PLANIFIER: 'soutenances/planifier',
  JURY: (soutenanceId: number | string) => `soutenances/${soutenanceId}/jury`,
} as const;

// ==================== ROUTES FRONTEND ====================

export const FRONTEND_ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  PORTAIL: '/portail',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  
  // Inscription
  INSCRIPTION: {
    BASE: '/inscription',
    DASHBOARD: '/inscription/dashboard',
    ETUDIANTS: '/inscription/etudiants',
    ETUDIANT_DETAIL: (id: number | string) => `/inscription/etudiants/${id}`,
    PENDING_STUDENTS: '/inscription/pending-students',
    ANNEES_ACADEMIQUES: '/inscription/annees-academiques',
  },
  
  // Finance
  FINANCE: {
    BASE: '/finance',
    PAIEMENTS: '/finance/paiements',
    QUITTANCES: '/finance/quittances',
    TARIFS: '/finance/tarifs',
  },
  
  // Cours
  COURS: {
    BASE: '/cours',
    LIST: '/cours/liste',
    EMPLOI: '/cours/emploi-du-temps',
  },
  
  // Emploi du Temps
  EMPLOI_DU_TEMPS: {
    BASE: '/emploi-du-temps',
    DASHBOARD: '/emploi-du-temps/dashboard',
    CALENDAR: '/emploi-du-temps/calendar',
    BUILDINGS: '/emploi-du-temps/buildings',
    ROOMS: '/emploi-du-temps/rooms',
    TIME_SLOTS: '/emploi-du-temps/time-slots',
    SCHEDULED_COURSES: '/emploi-du-temps/scheduled-courses',
    SCHEDULE_VIEW: '/emploi-du-temps/schedule-view',
  },
  
  // Notes
  NOTES: {
    BASE: '/notes',
    SAISIE: '/notes/saisie',
    BULLETINS: '/notes/bulletins',
  },
  
  // Présence
  PRESENCE: {
    BASE: '/presence',
    SAISIE: '/presence/saisie',
    LISTE: '/presence/liste',
  },
  
  // Autres
  BIBLIOTHEQUE: '/bibliotheque',
  ATTESTATIONS: '/attestations',
  CAHIER_TEXTE: '/cahier-texte',
  RH: '/rh',
  SOUTENANCES: '/soutenances',
  
  // Errors
  PAGE_404: '/404',
  PAGE_500: '/500',
} as const;
