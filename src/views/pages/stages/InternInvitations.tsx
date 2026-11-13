// src/views/pages/stages/InternInvitations.tsx
// Stagiaires arrivés avant le système (ou en dehors) : le responsable de
// division les invite avec leur seul numéro WhatsApp ; chacun remplit
// lui-même son dossier (identité, formation, dates réelles du stage).
// En binôme : deux numéros, un lien chacun ; le binôme se forme à la seconde
// inscription, avec les dates du premier inscrit.

import { useCallback, useEffect, useState } from 'react'
import {
  CButton, CButtonGroup, CCard, CCardBody, CCardHeader, CFormInput, CSpinner,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUserPlus } from '@coreui/icons'
import stageService, { type FinalMode, type InternInvitation } from '@/services/stage.service'
import { showSuccess, showError, friendlyError } from '@/components/common/ActionResult'
import { Empty, Pill } from './StagesUi'
import { frDateTime } from './stageUtils'
import { PhoneListField, filledPhones } from './PhoneListField'
import { FINAL_MODES, FinalModeChoice } from './BinomesPage'

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

/**
 * Liste des invitations (onglet « Invitations » de la page Stagiaires) et
 * fenêtre d'envoi (toujours disponible). onCount : nombre d'invitations en
 * attente, pour le compteur de l'onglet.
 */
export const InternInvitations = ({ open, onOpenChange, onRegistered, showList, onCount }: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onRegistered?: () => void
  showList: boolean
  onCount?: (pending: number) => void
}) => {
  const [invs, setInvs] = useState<InternInvitation[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try { setInvs(await stageService.internInvitations()) } catch (e) { setError(friendlyError(e)) }
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (invs) onCount?.(invs.filter(i => i.status === 'pending').length) }, [invs, onCount])

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

  return (
    <>
      {showList && (
        <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <CCardHeader style={{ background: '#fff', fontWeight: 800 }}>
            Stagiaires invités ({(invs ?? []).filter(i => i.status === 'pending').length} en attente)
          </CCardHeader>
          <CCardBody>
            {error && <div className="stg-err">{error}</div>}
            {!invs && !error && <div style={{ padding: 24, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
            {invs && invs.length === 0 && <Empty text="Aucune invitation envoyée. « Inviter un stagiaire existant » envoie un lien sur WhatsApp." />}
            <div className="stg-list">
              {invs?.map(i => {
                const st = STATUS[i.status]
                const partner = i.pair_id ? invs.find(p => p.id === i.pair_id) : null
                return (
                  <div key={i.id} className="stg-card stg-row2">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong>{i.phone}</strong>
                        {i.status === 'used' && i.intern_name && <span>{i.intern_name}</span>}
                        <Pill color={st.color} bg={st.bg}>{st.label}</Pill>
                        {i.pair_id && <Pill color="#0f766e" bg="#f0fdfa">Binôme</Pill>}
                      </span>
                      {i.pair_id && (
                        <div className="stg-muted">
                          Avec {partner ? (partner.status === 'used' && partner.intern_name ? partner.intern_name : partner.phone) : 'un autre stagiaire'}
                          {i.final_mode ? ` · rapport final ${FINAL_MODES[i.final_mode].label.toLowerCase()}` : ''}
                        </div>
                      )}
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

const cleanPhone = (v: string) => v.replace(/[^\d+\s.-]/g, '')

const InviteModal = ({ visible, onClose, onDone }: { visible: boolean; onClose: () => void; onDone: () => void }) => {
  const [pairMode, setPairMode] = useState(false)
  const [phones, setPhones] = useState<string[]>([''])
  const [duo, setDuo] = useState<[string, string]>(['', ''])
  const [mode, setMode] = useState<FinalMode>('individuel')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => { if (visible) { setPairMode(false); setPhones(['']); setDuo(['', '']); setMode('individuel'); setErr(null) } }, [visible])

  const count = filledPhones(phones).length

  const send = async () => {
    if (pairMode) {
      const both = filledPhones(duo)
      if (both.length !== 2) { setErr('Indiquez les deux numéros du binôme.'); return }
      if (both[0].replace(/\D/g, '').slice(-8) === both[1].replace(/\D/g, '').slice(-8)) { setErr('Les deux numéros doivent être différents.'); return }
    } else if (count === 0) { setErr('Indiquez au moins un numéro WhatsApp.'); return }
    setBusy(true); setErr(null)
    try {
      const res: any = pairMode
        ? await stageService.inviteInterns(filledPhones(duo).join('\n'), { final_mode: mode })
        : await stageService.inviteInterns(filledPhones(phones).join('\n'))
      onDone()
      await showSuccess(pairMode ? 'Invitation en binôme' : 'Invitations', res?.message)
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
        <CButtonGroup role="group" aria-label="Type d'invitation" className="mb-3 w-100">
          <CButton color="primary" variant={pairMode ? 'outline' : undefined} disabled={busy} onClick={() => { setPairMode(false); setErr(null) }}>Seul(s)</CButton>
          <CButton color="primary" variant={pairMode ? undefined : 'outline'} disabled={busy} onClick={() => { setPairMode(true); setErr(null) }}>En binôme</CButton>
        </CButtonGroup>
        {!pairMode && <>
          <label className="fw-semibold small mb-1">Numéro(s) WhatsApp <span className="text-danger">*</span></label>
          <PhoneListField value={phones} onChange={v => { setPhones(v); setErr(null) }} disabled={busy} />
        </>}
        {pairMode && <>
          {(['Premier stagiaire', 'Second stagiaire'] as const).map((label, i) => (
            <div key={label} className="mb-2">
              <label className="fw-semibold small mb-1" htmlFor={`duo-${i}`}>{label} : numéro WhatsApp <span className="text-danger">*</span></label>
              <CFormInput id={`duo-${i}`} type="tel" inputMode="tel" autoComplete="off" maxLength={20} disabled={busy}
                value={duo[i]} placeholder="Exemple : 01 97 00 00 00"
                onChange={e => { const v = cleanPhone(e.target.value); setDuo(d => (i === 0 ? [v, d[1]] : [d[0], v])); setErr(null) }} />
            </div>
          ))}
          <div className="fw-semibold small mb-1 mt-3">Rapport final <span className="text-danger">*</span></div>
          <FinalModeChoice value={mode} onChange={setMode} disabled={busy} />
        </>}
        <div style={{ marginTop: 12, background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: 10, padding: '10px 12px', fontSize: '.875rem', color: '#115e59' }}>
          {pairMode ? <>
            Chacun reçoit sur WhatsApp son propre lien (7 jours, une seule utilisation) et remplit son dossier. Le premier inscrit
            déclare les dates du stage ; le second reprend ses dates, son service et ses superviseurs. Le binôme se forme
            automatiquement à la seconde inscription. Si l'un ne s'inscrit pas, l'autre poursuit seul et vous êtes prévenu.
          </> : <>
            Chaque numéro reçoit sur WhatsApp un lien personnel (7 jours, une seule utilisation). Le stagiaire remplit lui-même
            son dossier : identité, formation, dates réelles du stage. Sa note de service lui est envoyée aux dates déclarées.
            Stage terminé : il devra déposer son rapport final pour obtenir son attestation.
          </>}
        </div>
        {err && <div className="stg-err" style={{ marginTop: 12 }}>{err}</div>}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={onClose}>Annuler</CButton>
        <CButton color="primary" onClick={send} disabled={busy}>{busy && <CSpinner size="sm" className="me-1" />}{pairMode ? 'Inviter le binôme' : count > 1 ? `Envoyer les ${count} invitations` : "Envoyer l'invitation"}</CButton>
      </CModalFooter>
    </CModal>
  )
}
