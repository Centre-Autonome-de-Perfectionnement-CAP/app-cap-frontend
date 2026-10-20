// src/views/pages/stages/StageSettingsModal.tsx
// Réglages du module : ouverture des demandes et valeurs par défaut.

import { useEffect, useState } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CSpinner,
  CFormSwitch, CFormLabel, CFormInput, CFormTextarea, CRow, CCol,
} from '@coreui/react'
import stageService, { type StageSettings } from '@/services/stage.service'
import { showSuccess, friendlyError } from '@/components/common/ActionResult'

interface Props {
  visible: boolean
  onClose: () => void
  onSaved: (s: StageSettings) => void
}

const StageSettingsModal = ({ visible, onClose, onSaved }: Props) => {
  const [form, setForm] = useState<StageSettings | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setForm(null); setError(null)
    stageService.getSettings().then(setForm).catch(e => setError(friendlyError(e)))
  }, [visible])

  const set = <K extends keyof StageSettings>(k: K, v: StageSettings[K]) => setForm(f => (f ? { ...f, [k]: v } : f))

  const save = async () => {
    if (!form) return
    setBusy(true); setError(null)
    try {
      const saved = await stageService.updateSettings({
        requests_open: form.requests_open,
        closed_message: form.closed_message,
        default_rejection_reason: form.default_rejection_reason,
        default_service: form.default_service,
        default_lieu: form.default_lieu,
        default_horaires: form.default_horaires,
      })
      onSaved(saved)
      onClose()
      await showSuccess('Réglages enregistrés')
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg" fullscreen="sm" scrollable>
      <CModalHeader><CModalTitle style={{ fontSize: '1.05rem' }}>Réglages des stages</CModalTitle></CModalHeader>
      <CModalBody>
        {!form && !error && <div style={{ padding: 32, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
        {form && (
          <CRow className="g-3">
            <CCol xs={12}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px',
                borderRadius: 12, border: `1px solid ${form.requests_open ? '#a7f3d0' : '#fde68a'}`,
                background: form.requests_open ? '#ecfdf5' : '#fffbeb',
              }}>
                <div>
                  <strong>{form.requests_open ? 'Demandes ouvertes' : 'Demandes fermées'}</strong>
                  <div style={{ fontSize: '.82rem', color: '#475569' }}>
                    {form.requests_open
                      ? 'Le formulaire du site accepte de nouvelles demandes.'
                      : 'Le formulaire du site affiche le message ci-dessous à la place.'}
                  </div>
                </div>
                <CFormSwitch size="xl" checked={form.requests_open} onChange={e => set('requests_open', e.target.checked)} aria-label="Ouvrir ou fermer les demandes" />
              </div>
            </CCol>
            <CCol xs={12}>
              <CFormLabel className="fw-semibold small">Message affiché quand les demandes sont fermées</CFormLabel>
              <CFormTextarea rows={2} maxLength={500} value={form.closed_message} onChange={e => set('closed_message', e.target.value)} />
            </CCol>
            <CCol xs={12}>
              <CFormLabel className="fw-semibold small">Motif de rejet proposé par défaut</CFormLabel>
              <CFormTextarea rows={3} maxLength={1000} value={form.default_rejection_reason} onChange={e => set('default_rejection_reason', e.target.value)} />
            </CCol>
            <CCol xs={12} md={6}>
              <CFormLabel className="fw-semibold small">Service par défaut</CFormLabel>
              <CFormInput maxLength={150} value={form.default_service} onChange={e => set('default_service', e.target.value)} />
            </CCol>
            <CCol xs={12} md={6}>
              <CFormLabel className="fw-semibold small">Lieu par défaut</CFormLabel>
              <CFormInput maxLength={150} value={form.default_lieu} onChange={e => set('default_lieu', e.target.value)} />
            </CCol>
            <CCol xs={12}>
              <CFormLabel className="fw-semibold small mb-1">Horaires par défaut</CFormLabel>
              <CRow className="g-2">
                {([['arrivee', 'Arrivée'], ['pause_debut', 'Début pause'], ['pause_fin', 'Fin pause'], ['sortie', 'Sortie']] as const).map(([k, l]) => (
                  <CCol xs={6} md={3} key={k}>
                    <span style={{ fontSize: '.74rem', color: '#64748b', fontWeight: 600 }}>{l}</span>
                    <CFormInput type="time" value={form.default_horaires[k]}
                      onChange={e => set('default_horaires', { ...form.default_horaires, [k]: e.target.value })} />
                  </CCol>
                ))}
              </CRow>
            </CCol>
            <CCol xs={12}>
              <div style={{ fontSize: '.8rem', color: '#64748b' }}>
                Une proposition sans réponse est relancée après {form.proposal_reminder_days} jours et expire après {form.proposal_expiry_days} jours.
              </div>
            </CCol>
          </CRow>
        )}
        {error && <div style={{ marginTop: 12, background: '#fff1f2', border: '1px solid #fecdd3', color: '#9f1239', borderRadius: 10, padding: '10px 14px' }}>{error}</div>}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={onClose} disabled={busy}>Annuler</CButton>
        <CButton color="primary" onClick={save} disabled={busy || !form}>
          {busy && <CSpinner size="sm" className="me-1" />}Enregistrer
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default StageSettingsModal
