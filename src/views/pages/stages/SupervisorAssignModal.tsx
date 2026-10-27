// src/views/pages/stages/SupervisorAssignModal.tsx
// Responsable : attribuer (ou retirer) un superviseur à un ou plusieurs
// stagiaires. Sert depuis la liste et depuis le dossier d'un stagiaire.

import { useEffect, useState } from 'react'
import {
  CButton, CFormSelect, CSpinner, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CFormLabel,
} from '@coreui/react'
import stageService, { type Supervisor } from '@/services/stage.service'
import { showSuccess, friendlyError } from '@/components/common/ActionResult'

const SupervisorAssignModal = ({ visible, ids, title, onClose, onDone }: {
  visible: boolean
  ids: number[]
  /** Par défaut : « Superviseur pour N stagiaire(s) ». */
  title?: string
  onClose: () => void
  onDone: () => void
}) => {
  const [sups, setSups] = useState<Supervisor[] | null>(null)
  const [supId, setSupId] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setErr(null); setSupId('')
    stageService.supervisors().then(setSups).catch(e => setErr(friendlyError(e)))
  }, [visible])

  const run = async (action: 'add' | 'remove') => {
    if (!supId) { setErr('Choisissez un superviseur.'); return }
    setBusy(true); setErr(null)
    try {
      const res: any = await stageService.setSupervisor(ids, Number(supId), action)
      onDone()
      await showSuccess(action === 'add' ? 'Superviseur attribué' : 'Superviseur retiré', res?.message)
    } catch (e) {
      setErr(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader><CModalTitle style={{ fontSize: '1rem' }}>{title ?? `Superviseur pour ${ids.length} stagiaire(s)`}</CModalTitle></CModalHeader>
      <CModalBody>
        {!sups && !err && <CSpinner size="sm" color="primary" />}
        {sups && sups.length === 0 && <p className="stg-muted">Aucun superviseur inscrit. Invitez-en depuis la page « Superviseurs ».</p>}
        {sups && sups.length > 0 && (
          <>
            <CFormLabel className="fw-semibold small">Superviseur <span className="text-danger">*</span></CFormLabel>
            <CFormSelect value={supId} onChange={e => setSupId(e.target.value)} aria-label="Superviseur">
              <option value="">Choisir un superviseur…</option>
              {sups.map(s => <option key={s.id} value={s.id}>{s.name} - {s.active_interns} stagiaire(s) en cours</option>)}
            </CFormSelect>
          </>
        )}
        {err && <div className="stg-err" style={{ marginTop: 12 }}>{err}</div>}
      </CModalBody>
      <CModalFooter>
        <CButton color="danger" variant="outline" disabled={busy || !sups?.length} onClick={() => run('remove')}>Retirer</CButton>
        <CButton color="success" style={{ color: '#fff' }} disabled={busy || !sups?.length} onClick={() => run('add')}>
          {busy && <CSpinner size="sm" className="me-1" />}Attribuer
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default SupervisorAssignModal
