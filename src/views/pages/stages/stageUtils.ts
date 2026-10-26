// src/views/pages/stages/stageUtils.ts
import type { AttentionCodeKey, InternScope, StageHoraires, StageStatus } from '@/services/stage.service'

export const STATUS_STYLE: Record<StageStatus, { color: string; bg: string }> = {
  submitted:        { color: '#2563eb', bg: '#eff6ff' },
  proposal_sent:    { color: '#d97706', bg: '#fffbeb' },
  counter_proposed: { color: '#7c3aed', bg: '#f5f3ff' },
  accepted:         { color: '#059669', bg: '#ecfdf5' },
  rejected:         { color: '#e11d48', bg: '#fff1f2' },
  expired:          { color: '#64748b', bg: '#f1f5f9' },
  withdrawn:        { color: '#9a3412', bg: '#fff7ed' },
}

export const frDate = (iso: string | null | undefined, long = false): string => {
  if (!iso) return '—'
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('fr-FR', long
    ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
    : { day: '2-digit', month: 'short', year: 'numeric' })
}

export const frDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—'
    : d.toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const hh = (v?: string) => (v ?? '').replace(':', 'h')
export const horairesLabel = (h: StageHoraires | null | undefined) =>
  h ? `${hh(h.arrivee)} – ${hh(h.pause_debut)} · ${hh(h.pause_fin)} – ${hh(h.sortie)}` : '—'

/** Durée du premier au dernier jour inclus : « 3 mois », « 2 mois 4 jours ». */
export const durationLabel = (start?: string | null, end?: string | null): string | null => {
  if (!start || !end || end <= start) return null
  const s = new Date(`${start}T12:00:00`)
  const e = new Date(`${end}T12:00:00`)
  e.setDate(e.getDate() + 1)
  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  let anchor = new Date(s); anchor.setMonth(s.getMonth() + months)
  if (anchor > e) { months--; anchor = new Date(s); anchor.setMonth(s.getMonth() + months) }
  const days = Math.round((e.getTime() - anchor.getTime()) / 86400000)
  const parts: string[] = []
  if (months) parts.push(`${months} mois`)
  if (days) parts.push(`${days} jour${days > 1 ? 's' : ''}`)
  return parts.join(' ') || null
}

/** Date de fin pour une durée en mois (dernier jour inclus). */
export const endForMonths = (start: string, months: number): string => {
  const d = new Date(`${start}T12:00:00`)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, last))
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const todayIso = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const HISTORY_LABELS: Record<string, string> = {
  submitted:        'Demande déposée',
  proposal_sent:    'Proposition envoyée',
  counter_proposed: 'Contre-proposition du demandeur',
  accepted:         'Proposition acceptée par le demandeur - note émise',
  accepted_counter: 'Contre-proposition acceptée - note émise',
  accepted_direct:  'Dates identiques à la demande - note émise',
  rejected:         'Demande non retenue',
  rectified:        'Conditions modifiées - note rectificative',
  reminder_sent:    'Relance envoyée au demandeur',
  expired:          'Proposition expirée (sans réponse)',
  activation_sent:  "Lien d'activation envoyé au stagiaire",
  activation_reminder: "Rappel d'activation envoyé",
  activated:        'Présence confirmée - espace stagiaire activé',
  withdrawn:        'Désistement (présence jamais confirmée)',
  reglement_accepted: 'Règlement intérieur accepté',
  device_reset:     'Téléphone de stage réinitialisé',
  device_refused:   'Connexion refusée depuis un autre téléphone',
  intern_request:   'Demande du stagiaire',
  intern_request_approved: 'Demande du stagiaire acceptée',
  intern_request_rejected: 'Demande du stagiaire refusée',
  supervisor_added: 'Superviseur attribué',
  supervisor_removed: 'Superviseur retiré',
  team_joined:      'Binôme formé',
  team_left:        'Binôme défait',
  whatsapp_group_added: 'Ajouté au groupe WhatsApp',
  whatsapp_group_invited: 'Lien du groupe WhatsApp envoyé',
  whatsapp_group_removed: 'Retiré du groupe WhatsApp',
  whatsapp_group_unreachable: 'Groupe WhatsApp : numéro injoignable',
  registered_by_invitation: 'Stage enregistré par le stagiaire (arrivé avant le système)',
  report_submitted: 'Rapport déposé',
  report_approved:  'Rapport validé',
  report_rejected:  'Rapport à corriger',
  report_correction_approved: 'Version corrigée après soutenance validée',
  report_correction_rejected: 'Version corrigée après soutenance non retenue',
  attestation_prepared:  'Attestation pré-remplie',
  attestation_edited:    'Attestation corrigée',
  attestation_validated: 'Attestation validée',
  attestation_exceptional: 'Attestation exceptionnelle validée',
  attestation_printed:   'Attestation imprimée',
  attestation_number_changed: "Numéro d'attestation modifié",
  attestation_delivered: 'Attestation remise au stagiaire',
  attestation_scan:      "Scan de l'attestation archivé",
  attestation_cancelled: 'Attestation annulée',
  attestation_reset:     'Attestation à valider de nouveau (date de fin modifiée)',
}

/** Phase d'un stage accepté. */
export const PHASE = {
  current:  { label: 'En cours', color: '#059669', bg: '#ecfdf5' },
  upcoming: { label: 'À venir',  color: '#2563eb', bg: '#eff6ff' },
  finished: { label: 'Terminé',  color: '#64748b', bg: '#f1f5f9' },
} as const

/** Place du stagiaire dans le groupe WhatsApp de l'année. */
export const WA_GROUP = {
  added:   { label: 'Dans le groupe WhatsApp', color: '#15803d', bg: '#dcfce7' },
  invited: { label: 'Lien du groupe envoyé',    color: '#b45309', bg: '#fef3c7' },
  removed: { label: 'Sorti du groupe',          color: '#64748b', bg: '#f1f5f9' },
} as const

/**
 * Codes d'attention : un code court par situation, la même légende partout
 * (liste des stagiaires, tableau de bord, dossier).
 */
export const ATTENTION: Record<AttentionCodeKey, { short: string; label: string; color: string; bg: string }> = {
  non_active:       { short: 'NP', label: 'Non présenté',      color: '#be123c', bg: '#ffe4e6' },
  assiduite:        { short: 'AS', label: 'Assiduité faible',  color: '#c2410c', bg: '#ffedd5' },
  fin_proche:       { short: 'FP', label: 'Fin proche',        color: '#7c3aed', bg: '#ede9fe' },
  rapports:         { short: 'RM', label: 'Rapports manquants', color: '#b45309', bg: '#fef3c7' },
  sans_superviseur: { short: 'SS', label: 'Sans superviseur',  color: '#475569', bg: '#e2e8f0' },
}

/** Filtres de la liste des stagiaires (le titre de la page reprend le libellé). */
export const INTERN_SCOPES: Record<InternScope, string> = {
  active:       'Actifs',
  current:      'En cours',
  upcoming:     'À venir',
  unsupervised: 'Sans superviseur',
  finished:     'Terminés',
  mine:         'Mes stagiaires',
  all:          'Tous',
}

