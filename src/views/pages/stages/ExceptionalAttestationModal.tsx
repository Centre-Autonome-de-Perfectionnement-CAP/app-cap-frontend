// src/views/pages/stages/ExceptionalAttestationModal.tsx
// Attestation exceptionnelle : le responsable passe outre les conditions
// (assiduité, rapport final) en confirmant avec son mot de passe et un motif.

import { useEffect, useState } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CSpinner, CFormTextarea, CFormLabel,
} from '@coreui/react'
import PasswordInput from '@/components/forms/PasswordInput'
import stageService, { type Attestation } from '@/services/stage.service'
import { showSuccess, friendlyError } from '@/components/common/ActionResult'

interface Props {
  visible: boolean
  stage: { id: number; nom_complet: string }
  onClose: () => void
  onDone: (a: Attestation) => void
}

const ExceptionalAttestationModal = ({ visible, stage, onClose, onDone }: Props) => {
  const [motif, setMotif] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => { if (visible) { setMotif(''); setPassword(''); setErr(null) } }, [visible])

  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !busy) { e.stopPropagation(); e.preventDefault(); onClose() } }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [visible, busy, onClose])

  const submit = async () => {
    if (motif.trim().length < 10) { setErr('Précisez le motif (10 caractères au moins).'); return }
    if (!password) { setErr('Saisissez votre mot de passe.'); return }
    setBusy(true); setErr(null)
    try {
      const res: any = await stageService.exceptionalAttestation(stage.id, password, motif.trim())
      setPassword('')
      onDone(res.data)
      await showSuccess('Attestation exceptionnelle validée', res?.message)
    } catch (e) {
      setPassword('')
      setErr(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" keyboard={false} backdrop="static">
      <CModalHeader closeButton={!busy}><CModalTitle style={{ fontSize: '1rem' }}>Attestation exceptionnelle</CModalTitle></CModalHeader>
      <CModalBody>
        <p style={{ fontSize: '.9rem', color: '#475569' }}>
          Pour <strong>{stage.nom_complet}</strong>, sans exiger les conditions habituelles. Le motif et votre nom sont conservés dans l'historique.
        </p>
        <form onSubmit={e => { e.preventDefault(); submit() }}>
          <CFormLabel className="small fw-semibold mb-1">Motif <span className="text-danger">*</span></CFormLabel>
          <CFormTextarea rows={3} maxLength={1000} value={motif} onChange={e => setMotif(e.target.value)} autoFocus />
          <CFormLabel className="small fw-semibold mb-1 mt-3">Votre mot de passe <span className="text-danger">*</span></CFormLabel>
          <PasswordInput autoComplete="current-password" maxLength={255} value={password} onChange={e => setPassword(e.target.value)} />
          <button type="submit" hidden aria-hidden />
        </form>
        {err && <div className="stg-err" style={{ marginTop: 12, marginBottom: 0 }}>{err}</div>}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={onClose} disabled={busy}>Annuler</CButton>
        <CButton color="warning" style={{ color: '#fff' }} onClick={submit} disabled={busy}>
          {busy && <CSpinner size="sm" className="me-1" />}Confirmer
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ExceptionalAttestationModal
