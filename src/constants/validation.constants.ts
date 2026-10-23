/**
 * Constantes de validation
 */

// Expressions régulières
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PHONE_REGEX = /^[\d\s+()-]+$/
export const MATRICULE_REGEX = /^[A-Z0-9]+$/
export const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]+$/
export const IFU_REGEX = /^\d{13}$/
export const RIB_REGEX = /^[A-Z0-9]{22,27}$/

// Longueurs minimales
export const MIN_LENGTH = {
  NAME: 2,
  EMAIL: 5,
  PHONE: 8,
  PASSWORD: 8,
  MATRICULE: 4,
  SEARCH: 2,
  IFU: 13,
  RIB: 22,
} as const

// Longueurs maximales
export const MAX_LENGTH = {
  NAME: 100,
  EMAIL: 100,
  PHONE: 20,
  PASSWORD: 50,
  MATRICULE: 20,
  DESCRIPTION: 500,
  COMMENT: 1000,
  IFU: 13,
  RIB: 27,
} as const

// Plages de valeurs
export const VALUE_RANGES = {
  YEAR: {
    MIN: 1900,
    MAX: new Date().getFullYear() + 10,
  },
  AGE: {
    MIN: 16,
    MAX: 100,
  },
  AMOUNT: {
    MIN: 0,
    MAX: 100000000,
  },
  NOTE: {
    MIN: 0,
    MAX: 20,
  },
} as const

// Types de fichiers acceptés
export const ACCEPTED_FILE_TYPES = {
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  DOCUMENT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  EXCEL: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
} as const

// Taille maximale d'un fichier envoyé, en Mo (même valeurs que le serveur,
// App\Support\UploadLimit) : 2 Mo partout, 10 Mo pour un rapport ou un
// mémoire, 20 Mo pour un support de cours.
export const UPLOAD_LIMIT_MB = { DEFAULT: 2, REPORT: 10, COURSE: 20 } as const

/** Vrai si le fichier dépasse la limite (en Mo). */
export const isTooHeavy = (file: File, maxMb: number = UPLOAD_LIMIT_MB.DEFAULT) => file.size > maxMb * 1024 * 1024

// Messages d'erreur par défaut
export const DEFAULT_ERROR_MESSAGES = {
  REQUIRED: 'Ce champ est requis',
  INVALID_EMAIL: 'Adresse email invalide',
  INVALID_PHONE: 'Numéro de téléphone invalide',
  INVALID_DATE: 'Date invalide',
  MIN_LENGTH: 'Longueur minimale non atteinte',
  MAX_LENGTH: 'Longueur maximale dépassée',
  INVALID_FORMAT: 'Format invalide',
  FILE_TOO_LARGE: 'Fichier trop volumineux',
  INVALID_FILE_TYPE: 'Type de fichier non accepté',
  INVALID_IFU: 'Le numéro IFU doit contenir exactement 13 chiffres',
  INVALID_RIB: 'Le RIB doit contenir entre 22 et 27 caractères',
} as const
