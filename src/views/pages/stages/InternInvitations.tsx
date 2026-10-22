// src/views/pages/stages/InternInvitations.tsx
// Stagiaires arrivés avant le système (ou en dehors) : le responsable de
// division les invite avec leur seul numéro WhatsApp ; chacun remplit
// lui-même son dossier (identité, formation, dates réelles du stage).

import { useCallback, useEffect, useState } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CFormTextarea, CSpinner,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUserPlus } from '@coreui/icons'
import stageService, { type InternInvitation } from '@/services/stage.service'
import { showSuccess, showError, friendlyError } from '@/components/common/ActionResult'
import { Empty, Pill } from './StagesUi'
import { frDateTime } from './stageUtils'

const STATUS = {
  pending: { label: 'En attente', color: '#d97706', bg: '#fffbeb' },
  used:    { label: 'Dossier complété', color: '#059669', bg: '#ecfdf5' },
  expired: { label: 'Expirée', color: '#64748b', bg: '#f1f5f9' },
  revoked: { label: 'Annulée', color: '#e11d48', bg: '#fff1f2' },
} as const

/** Bouton « Inviter un stagiaire existant » (en-tête de la page Stagiaires). */
export const InviteInternButton = ({ onClick }: { onClick: () => void }) => (
  <CButton color="primary" size="sm" onClick={onClick}>
    <CIcon icon={cilUserPlus} className="me-1" />Inviter un stagiaire existant
  </CButton>
)

/** Liste des invitations + fenêtre d'envoi. */
export const InternInvitations = ({ open, onOpenChange, onRegistered }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onRegistered?: () => void
}) => {
  const [invs, setInvs] = useState<InternInvitation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try { setInvs(await stageService.internInvitations()) } catch (e) { setError(friendlyError(e)) }
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

  // Rien à montrer tant qu'aucune invitation n'a été envoyée.
  const hasAny = (invs?.length ?? 0) > 0

  return (
    <>
      {(hasAny || error) && (
        <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <CCardHeader style={{ background: '#fff', fontWeight: 800 }}>
            Stagiaires invités ({(invs ?? []).filter(i => i.status === 'pending').length} en attente)
          </CCardHeader>
          <CCardBody>
            {error && <div className="stg-err">{error}</div>}
            {invs && invs.length === 0 && <Empty text="Aucune invitation envoyée." />}
            <div className="stg-list">
              {invs?.map(i => {
                const st = STATUS[i.status]
                return (
                  <div key={i.id} className="stg-card stg-row2">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong>{i.phone}</strong>
                        {i.status === 'used' && i.intern_name && <span>{i.intern_name}</span>}
                        <Pill color={st.color} bg={st.bg}>{st.label}</Pill>
                      </span>
                      <div className="stg-muted">
                        {i.status === 'used'
                          ? `Dossier complété le ${frDateTime(i.used_at)}${i.reference ? ` · ${i.reference}` : ''}`
                          : `Envoyée ${i.send_count} fois, dernière le ${frDateTime(i.last_sent_at)}${i.status === 'pending' ? ` · valable jusqu'au ${frDateTime(i.expires_at)}` : ''}`}
                        {i.invited_by_name ? ` · invité par ${i.invited_by_name}` : ''}
                      </div>
                    </div>
                    {(i.status === 'pending' || i.status === 'expired') && (
                      <CButton size="sm" color="primary" variant="outline" disabled={busyId === i.id}
                        onClick={() => act(i.id, () => stageService.resendInternInvitation(i.id), 'Lien renvoyé')}>Renvoyer</CButton>
                    )}
                    {i.status === 'pending' && (
                      <CButton size="sm" color="danger" variant="ghost" disabled={busyId === i.id}
                        onClick={() => act(i.id, () => stageService.revokeInternInvitation(i.id), 'Invitation annulée')}>Annuler</CButton>
                    )}
                  </div>
                )
              })}
            </div>
          </CCardBody>
        </CCard>
      )}

      <InviteModal
        visible={open}
        onClose={() => onOpenChange(false)}
        onDone={() => { onOpenChange(false); load(); onRegistered?.() }}
      />
    </>
  )
}

const InviteModal = ({ visible, onClose, onDone }: { visible: boolean; onClose: () => void; onDone: () => void }) => {
  const [numbers, setNumbers] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => { if (visible) { setNumbers(''); setErr(null) } }, [visible])

  const count = numbers.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean).length

  const send = async () => {
    if (count === 0) { setErr('Indiquez au moins un numéro WhatsApp.'); return }
    setBusy(true); setErr(null)
    try {
      const res: any = await stageService.inviteInterns(numbers)
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
      <CModalHeader><CModalTitle style={{ fontSize: '1rem' }}>Inviter un stagiaire existant</CModalTitle></CModalHeader>
      <CModalBody>
        <div style={{ fontSize: '.9rem', color: '#334155', marginBottom: 10 }}>
          Pour un stagiaire arrivé avant le système, ou en dehors : son stage est en cours, ou déjà terminé.
        </div>
        <label className="fw-semibold small mb-1">Numéro(s) WhatsApp</label>
        <CFormTextarea rows={4} value={numbers} maxLength={2000} onChange={e => setNumbers(e.target.value)}
          placeholder={'Exemple : 01 97 00 00 00\n01 96 00 00 00'} />
        <div className="stg-muted" style={{ marginTop: 4 }}>Un numéro par ligne (ou séparés par des virgules). {count > 0 && `${count} numéro(s).`}</div>
        <div style={{ marginTop: 12, background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: 10, padding: '10px 12px', fontSize: '.875rem', color: '#115e59' }}>
          Chaque numéro reçoit sur WhatsApp un lien personnel (7 jours, une seule utilisation). Le stagiaire remplit lui-même
          son dossier : identité, formation, dates réelles du stage. Sa note de service lui est envoyée aux dates déclarées.
          Stage terminé : il devra déposer son rapport final pour obtenir son attestation.
        </div>
        {err && <div className="stg-err" style={{ marginTop: 12 }}>{err}</div>}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={onClose}>Annuler</CButton>
        <CButton color="primary" onClick={send} disabled={busy}>{busy && <CSpinner size="sm" className="me-1" />}Envoyer les invitations</CButton>
      </CModalFooter>
    </CModal>
  )
}
