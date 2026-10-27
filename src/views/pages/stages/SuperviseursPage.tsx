// src/views/pages/stages/SuperviseursPage.tsx
// Superviseurs inscrits et invitations (responsable de division / admin).
// Inviter = coller un ou plusieurs numéros WhatsApp : chacun reçoit son lien.

import { useCallback, useEffect, useState } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CFormInput, CSpinner,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUserPlus, cilReload } from '@coreui/icons'
import stageService, { type Supervisor, type SupervisorInvitation } from '@/services/stage.service'
import { showSuccess, showError, friendlyError } from '@/components/common/ActionResult'
import { PageHead, Empty, Pill, StagesStyles } from './StagesUi'
import { frDate, frDateTime } from './stageUtils'
import { PhoneListField, filledPhones } from './PhoneListField'

const INV_STATUS = {
  pending:  { label: 'En attente', color: '#d97706', bg: '#fffbeb' },
  accepted: { label: 'Inscrit',    color: '#059669', bg: '#ecfdf5' },
  expired:  { label: 'Expirée',    color: '#64748b', bg: '#f1f5f9' },
  revoked:  { label: 'Annulée',    color: '#e11d48', bg: '#fff1f2' },
} as const

const SuperviseursPage = () => {
  const [sups, setSups] = useState<Supervisor[] | null>(null)
  const [invs, setInvs] = useState<SupervisorInvitation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const [s, i] = await Promise.all([stageService.supervisors(), stageService.invitations()])
      setSups(s); setInvs(i)
    } catch (e) {
      setError(friendlyError(e))
    }
  }, [])
  useEffect(() => { load() }, [load])

  const act = async (id: number, fn: () => Promise<any>, title: string) => {
    setBusyId(id)
    try {
      const res = await fn()
      await load()
      await showSuccess(title, res?.message)
    } catch (e) {
      await showError('Action impossible', friendlyError(e))
    } finally {
      setBusyId(null)
    }
  }

  const open = (invs ?? []).filter(i => i.status !== 'accepted')

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title="Superviseurs"
        subtitle="Invitez-les avec leur seul numéro WhatsApp : ils créent eux-mêmes leur compte."
        actions={<>
          <CButton color="secondary" variant="outline" size="sm" onClick={load} title="Actualiser"><CIcon icon={cilReload} /></CButton>
          <CButton color="primary" size="sm" onClick={() => setInviteOpen(true)}><CIcon icon={cilUserPlus} className="me-1" />Inviter</CButton>
        </>}
      />
      {error && <div className="stg-err">{error}</div>}

      <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <CCardHeader style={{ background: '#fff', fontWeight: 800 }}>Inscrits ({sups?.length ?? 0})</CCardHeader>
        <CCardBody>
          {!sups && !error && <CSpinner size="sm" color="primary" />}
          {sups && sups.length === 0 && <Empty text="Aucun superviseur inscrit. Invitez-en un avec son numéro WhatsApp." />}
          <div className="stg-list">
            {sups?.map(s => (
              <div key={s.id} className="stg-card stg-row2">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong>{s.name}</strong>
                  <div className="stg-muted">{s.phone ?? '-'} · {s.email}</div>
                </div>
                <span className="stg-chip">{s.active_interns} stagiaire(s) en cours</span>
                <span className="stg-muted">depuis le {frDate(s.since)}</span>
              </div>
            ))}
          </div>
        </CCardBody>
      </CCard>

      <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <CCardHeader style={{ background: '#fff', fontWeight: 800 }}>Invitations ({open.length} non acceptée(s))</CCardHeader>
        <CCardBody>
          {invs && invs.length === 0 && <Empty text="Aucune invitation envoyée." />}
          <div className="stg-list">
            {invs?.map(i => {
              const st = INV_STATUS[i.status]
              return (
                <div key={i.id} className="stg-card stg-row2">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong>{i.phone}</strong>{i.name && <span>{i.name}</span>}
                      <Pill color={st.color} bg={st.bg}>{st.label}</Pill>
                    </span>
                    <div className="stg-muted">
                      {i.status === 'accepted'
                        ? `Compte créé le ${frDateTime(i.accepted_at)}${i.accepted_name ? ` par ${i.accepted_name}` : ''}`
                        : `Envoyée ${i.send_count} fois, dernière le ${frDateTime(i.last_sent_at)}${i.status === 'pending' ? ` · valable jusqu'au ${frDateTime(i.expires_at)}` : ''}`}
                      {i.invited_by_name ? ` · invité par ${i.invited_by_name}` : ''}
                    </div>
                  </div>
                  {(i.status === 'pending' || i.status === 'expired') && (
                    <CButton size="sm" color="primary" variant="outline" disabled={busyId === i.id}
                      onClick={() => act(i.id, () => stageService.resendInvitation(i.id), 'Lien renvoyé')}>Renvoyer</CButton>
                  )}
                  {i.status === 'pending' && (
                    <CButton size="sm" color="danger" variant="ghost" disabled={busyId === i.id}
                      onClick={() => act(i.id, () => stageService.revokeInvitation(i.id), 'Invitation annulée')}>Annuler</CButton>
                  )}
                </div>
              )
            })}
          </div>
        </CCardBody>
      </CCard>

      <InviteModal visible={inviteOpen} onClose={() => setInviteOpen(false)} onDone={() => { setInviteOpen(false); load() }} />
    </div>
  )
}

const InviteModal = ({ visible, onClose, onDone }: { visible: boolean; onClose: () => void; onDone: () => void }) => {
  const [phones, setPhones] = useState<string[]>([''])
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => { if (visible) { setPhones(['']); setName(''); setErr(null) } }, [visible])

  const count = filledPhones(phones).length

  const send = async () => {
    if (count === 0) { setErr('Indiquez au moins un numéro WhatsApp.'); return }
    setBusy(true); setErr(null)
    try {
      const res: any = await stageService.invite(filledPhones(phones).join('\n'), count === 1 ? name.trim() : undefined)
      onDone()
      await showSuccess('Invitations', res?.message)
    } catch (e) {
      setErr(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" fullscreen="sm">
      <CModalHeader><CModalTitle style={{ fontSize: '1rem' }}>Inviter des superviseurs</CModalTitle></CModalHeader>
      <CModalBody>
        <label className="fw-semibold small mb-1">Numéro(s) WhatsApp <span className="text-danger">*</span></label>
        <PhoneListField value={phones} onChange={v => { setPhones(v); setErr(null) }} disabled={busy} />
        {count === 1 && (
          <>
            <label className="fw-semibold small mb-1 mt-3">Nom <span className="stg-muted">(facultatif, pour le message)</span></label>
            <CFormInput value={name} maxLength={120} onChange={e => setName(e.target.value)} placeholder="Exemple : M. Dossou" />
          </>
        )}
        <div style={{ marginTop: 12, background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: 10, padding: '10px 12px', fontSize: '.875rem', color: '#115e59' }}>
          Chaque numéro reçoit sur WhatsApp un lien personnel, valable 72 heures et utilisable une seule fois, pour créer son compte superviseur.
        </div>
        {err && <div className="stg-err" style={{ marginTop: 12 }}>{err}</div>}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={onClose}>Annuler</CButton>
        <CButton color="primary" onClick={send} disabled={busy}>{busy && <CSpinner size="sm" className="me-1" />}{count > 1 ? `Envoyer les ${count} invitations` : "Envoyer l'invitation"}</CButton>
      </CModalFooter>
    </CModal>
  )
}

export default SuperviseursPage
