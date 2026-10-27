// src/views/pages/stages/TermsForm.tsx
// Conditions du stage (service, lieu, dates, horaires). Tout arrive
// pré-rempli : le responsable ajuste seulement ce qui doit l'être.

import { CFormInput, CFormLabel, CFormTextarea, CRow, CCol } from '@coreui/react'
import type { StageTerms } from '@/services/stage.service'
import { durationLabel, endForMonths, todayIso } from './stageUtils'

interface Props {
  value: StageTerms
  onChange: (v: StageTerms) => void
  /** Message (proposition) ou motif (rectification). */
  note: string
  onNoteChange: (v: string) => void
  noteLabel: string
  noteRequired?: boolean
  notePlaceholder?: string
  allowPastStart?: boolean
}

const QUICK_MONTHS = [1, 2, 3, 6]

const TermsForm = ({ value, onChange, note, onNoteChange, noteLabel, noteRequired, notePlaceholder, allowPastStart }: Props) => {
  const set = <K extends keyof StageTerms>(k: K, v: StageTerms[K]) => onChange({ ...value, [k]: v })
  const setH = (k: keyof StageTerms['horaires'], v: string) => onChange({ ...value, horaires: { ...value.horaires, [k]: v } })
  const duration = durationLabel(value.date_debut, value.date_fin)
  const invalidDates = !!value.date_debut && !!value.date_fin && value.date_fin <= value.date_debut

  return (
    <div className="stg-terms">
      <CRow className="g-3">
        <CCol xs={12} md={6}>
          <CFormLabel className="stg-label">Service d'affectation <span className="text-danger">*</span></CFormLabel>
          <CFormInput value={value.service} maxLength={150} onChange={e => set('service', e.target.value)} />
        </CCol>
        <CCol xs={12} md={6}>
          <CFormLabel className="stg-label">Lieu <span className="text-danger">*</span></CFormLabel>
          <CFormInput value={value.lieu} maxLength={150} onChange={e => set('lieu', e.target.value)} />
        </CCol>

        <CCol xs={6}>
          <CFormLabel className="stg-label">Début <span className="text-danger">*</span></CFormLabel>
          <CFormInput type="date" value={value.date_debut} min={allowPastStart ? undefined : todayIso()}
            onChange={e => set('date_debut', e.target.value)} />
        </CCol>
        <CCol xs={6}>
          <CFormLabel className="stg-label">Fin <span className="text-danger">*</span></CFormLabel>
          <CFormInput type="date" value={value.date_fin} min={value.date_debut || undefined} invalid={invalidDates}
            onChange={e => set('date_fin', e.target.value)} />
        </CCol>
        <CCol xs={12}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '.875rem', color: '#64748b', marginRight: 2 }}>Durée rapide :</span>
            {QUICK_MONTHS.map(m => (
              <button key={m} type="button" className="stg-chip" disabled={!value.date_debut}
                onClick={() => set('date_fin', endForMonths(value.date_debut, m))}>
                {m} mois
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: '.875rem', fontWeight: 700, color: invalidDates ? '#e11d48' : '#0f766e' }}>
              {invalidDates ? 'La fin doit être après le début' : duration ? `Durée : ${duration}` : ''}
            </span>
          </div>
        </CCol>

        <CCol xs={12}>
          <CFormLabel className="stg-label mb-1">Horaires <span className="text-danger">*</span></CFormLabel>
          <div className="stg-hours">
            {([
              ['arrivee', 'Arrivée'], ['pause_debut', 'Début pause'],
              ['pause_fin', 'Fin pause'], ['sortie', 'Sortie'],
            ] as const).map(([k, label]) => (
              <label key={k} className="stg-hour">
                <span>{label}</span>
                <CFormInput type="time" value={value.horaires[k]} onChange={e => setH(k, e.target.value)} />
              </label>
            ))}
          </div>
        </CCol>

        <CCol xs={12}>
          <CFormLabel className="stg-label">
            {noteLabel} {noteRequired ? <span className="text-danger">*</span> : <span style={{ color: '#94a3b8', fontWeight: 400 }}>(facultatif)</span>}
          </CFormLabel>
          <CFormTextarea rows={3} maxLength={1000} value={note} placeholder={notePlaceholder}
            onChange={e => onNoteChange(e.target.value)} />
        </CCol>
      </CRow>

      <style>{`
        .stg-label { font-size: .875rem; font-weight: 700; color: #334155; margin-bottom: 4px; }
        .stg-chip {
          border: 1px solid #cbd5e1; background: #fff; color: #334155; border-radius: 999px;
          padding: 3px 11px; font-size: .875rem; font-weight: 600; cursor: pointer;
        }
        .stg-chip:hover:not(:disabled) { border-color: #0f766e; color: #0f766e; }
        .stg-chip:disabled { opacity: .5; cursor: not-allowed; }
        .stg-hours { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
        .stg-hour { display: flex; flex-direction: column; gap: 3px; font-size: .875rem; color: #64748b; font-weight: 600; margin: 0; }
        @media (max-width: 575px) { .stg-hours { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      `}</style>
    </div>
  )
}

export const validateTerms = (t: StageTerms, opts: { allowPastStart?: boolean } = {}): string | null => {
  if (!t.service.trim() || !t.lieu.trim()) return 'Le service et le lieu sont obligatoires.'
  if (!t.date_debut || !t.date_fin) return 'Les dates de début et de fin sont obligatoires.'
  if (!opts.allowPastStart && t.date_debut < todayIso()) return 'La date de début ne peut pas être passée.'
  if (t.date_fin <= t.date_debut) return 'La date de fin doit être après la date de début.'
  const h = t.horaires
  if (!h.arrivee || !h.pause_debut || !h.pause_fin || !h.sortie) return 'Les quatre horaires sont obligatoires.'
  if (!(h.arrivee < h.pause_debut && h.pause_debut <= h.pause_fin && h.pause_fin < h.sortie)) {
    return 'Les horaires doivent se suivre : arrivée, début de pause, fin de pause, sortie.'
  }
  return null
}

export default TermsForm
