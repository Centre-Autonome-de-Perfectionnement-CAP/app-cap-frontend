// src/constants/app.constants.ts

export const ROLES = {
  ADMIN:             'admin',
  CHEF_CAP:          'chef-cap',
  CHEF_DIVISION:     'chef-division',
  SECRETAIRE:        'secretaire',
  ETUDIANT:          'etudiant',
  COMPTABLE:         'comptable',
  DIRECTEUR:         'directeur',          // ← ajouté
  DIRECTEUR_ADJOINT: 'directeur-adjoint',  // ← ajouté
} as const

export type UserRole = typeof ROLES[keyof typeof ROLES]

export const ROLE_NAMES: Record<UserRole, string> = {
  [ROLES.ADMIN]:             'Administrateur',
  [ROLES.CHEF_CAP]:          'Chef CAP',
  [ROLES.CHEF_DIVISION]:     'Responsable Division',
  [ROLES.SECRETAIRE]:        'Secrétaire',
  [ROLES.ETUDIANT]:          'Étudiant',
  [ROLES.COMPTABLE]:         'Comptable',
  [ROLES.DIRECTEUR]:         'Directeur',
  [ROLES.DIRECTEUR_ADJOINT]: 'Directeur Adjoint',
}

export const STATUTS = {
  ACTIF: 'actif', INACTIF: 'inactif', EN_ATTENTE: 'en_attente',
  VALIDE: 'valide', REJETE: 'rejete', SUSPENDU: 'suspendu', DIPLOME: 'diplome',
} as const
export type Statut = typeof STATUTS[keyof typeof STATUTS]

export const PAYMENT_STATUS = {
  EN_ATTENTE: 'en_attente', VALIDE: 'valide', REJETE: 'rejete', ANNULE: 'annule',
} as const
export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS]

export const PAYMENT_TYPES = {
  INSCRIPTION: 'inscription', SCOLARITE: 'scolarite', EXAMEN: 'examen', AUTRE: 'autre',
} as const
export type PaymentType = typeof PAYMENT_TYPES[keyof typeof PAYMENT_TYPES]

export const PAYMENT_MODES = {
  ESPECES: 'especes', VIREMENT: 'virement', CHEQUE: 'cheque', MOBILE_MONEY: 'mobile_money',
} as const
export type PaymentMode = typeof PAYMENT_MODES[keyof typeof PAYMENT_MODES]

export const SEXE = { MASCULIN: 'M', FEMININ: 'F' } as const
export type Sexe = typeof SEXE[keyof typeof SEXE]

export const EVALUATION_TYPES = {
  CC: 'cc', EXAMEN: 'examen', TP: 'tp', PROJET: 'projet',
} as const
export type EvaluationType = typeof EVALUATION_TYPES[keyof typeof EVALUATION_TYPES]

export const SEMESTRES = { PREMIER: 1, SECOND: 2 } as const
export type Semestre = typeof SEMESTRES[keyof typeof SEMESTRES]

export const PRESENCE_STATUS = {
  PRESENT: 'present', ABSENT: 'absent', RETARD: 'retard', JUSTIFIE: 'justifie',
} as const
export type PresenceStatus = typeof PRESENCE_STATUS[keyof typeof PRESENCE_STATUS]

export const DECISIONS = { ADMIS: 'ADMIS', AJOURNE: 'AJOURNÉ', REDOUBLE: 'REDOUBLE' } as const
export type Decision = typeof DECISIONS[keyof typeof DECISIONS]

export const MENTIONS = {
  TRES_BIEN: 'Très Bien', BIEN: 'Bien', ASSEZ_BIEN: 'Assez Bien', PASSABLE: 'Passable',
} as const
export type Mention = typeof MENTIONS[keyof typeof MENTIONS]

export const PAGINATION = {
  DEFAULT_PAGE: 1, DEFAULT_PER_PAGE: 10, PER_PAGE_OPTIONS: [10, 25, 50, 100],
} as const

export const MESSAGES = {
  SUCCESS: { CREATE: 'Élément créé avec succès', UPDATE: 'Élément mis à jour avec succès', DELETE: 'Élément supprimé avec succès', SAVE: 'Enregistrement effectué avec succès' },
  ERROR: { GENERIC: 'Une erreur est survenue', NETWORK: 'Erreur de connexion au serveur', NOT_FOUND: 'Élément non trouvé', UNAUTHORIZED: 'Action non autorisée', VALIDATION: 'Veuillez vérifier les données saisies' },
  CONFIRM: { DELETE: 'Êtes-vous sûr de vouloir supprimer cet élément ?', LOGOUT: 'Voulez-vous vraiment vous déconnecter ?' },
} as const

export const APP_CONFIG = {
  NAME: 'CAP - EPAC', VERSION: '5.5.0', API_TIMEOUT: 30000,
  DEBOUNCE_DELAY: 500, DATE_FORMAT: 'DD/MM/YYYY', DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',
} as const
