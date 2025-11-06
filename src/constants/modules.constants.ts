/**
 * Constantes des modules de l'application
 */

export const MODULES = {
  INSCRIPTION: 'inscription',
  FINANCE: 'finance',
  COURS: 'cours',
  NOTES: 'notes',
  PRESENCE: 'presence',
  EMPLOI_DU_TEMPS: 'emploi-du-temps',
  BIBLIOTHEQUE: 'bibliotheque',
  ATTESTATIONS: 'attestations',
  CAHIER_TEXTE: 'cahier-texte',
  RH: 'rh',
  SOUTENANCES: 'soutenances',
} as const;

export type ModuleName = typeof MODULES[keyof typeof MODULES];

export const MODULE_NAMES: Record<ModuleName, string> = {
  [MODULES.INSCRIPTION]: 'Inscription',
  [MODULES.FINANCE]: 'Finance',
  [MODULES.COURS]: 'Cours',
  [MODULES.NOTES]: 'Notes',
  [MODULES.PRESENCE]: 'Présence',
  [MODULES.EMPLOI_DU_TEMPS]: 'Emploi du Temps',
  [MODULES.BIBLIOTHEQUE]: 'Bibliothèque',
  [MODULES.ATTESTATIONS]: 'Attestations',
  [MODULES.CAHIER_TEXTE]: 'Cahier de Textes',
  [MODULES.RH]: 'Ressources Humaines',
  [MODULES.SOUTENANCES]: 'Soutenances',
};

export const MODULE_ICONS: Record<ModuleName, string> = {
  [MODULES.INSCRIPTION]: 'cilUserPlus',
  [MODULES.FINANCE]: 'cilCreditCard',
  [MODULES.COURS]: 'cilBook',
  [MODULES.NOTES]: 'cilClipboard',
  [MODULES.PRESENCE]: 'cilCheckCircle',
  [MODULES.EMPLOI_DU_TEMPS]: 'cilCalendar',
  [MODULES.BIBLIOTHEQUE]: 'cilLibrary',
  [MODULES.ATTESTATIONS]: 'cilFile',
  [MODULES.CAHIER_TEXTE]: 'cilNotes',
  [MODULES.RH]: 'cilPeople',
  [MODULES.SOUTENANCES]: 'cilSpeech',
};
