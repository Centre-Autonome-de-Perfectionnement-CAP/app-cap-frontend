// src/views/pages/stages/AttestationModal.tsx
// Une attestation de stage : contenu pré-rempli, conditions, et l'étape du
// circuit selon le rôle (responsable : corriger, valider, annuler ;
// secrétariat : numéro et impression, remise datée, scan).

import { useEffect, useRef, useState } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CSpinner, CFormInput, CFormTextarea, CFormLabel,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckAlt, cilPrint, cilTask, cilCloudUpload, cilFile, cilBan, cilWarning } from '@coreui/icons'
import stageService, { type Attestation, type AttestationEligibility } from '@/services/stage.service'
import { showSuccess, friendlyError } from '@/components/common/ActionResult'
import StageFileViewer from './StageFileViewer'
import ExceptionalAttestationModal from './ExceptionalAttestationModal'
import { frDate, frDateTime, todayIso } from './stageUtils'

export const ATT_STATUS: Record<Attestation['status'], { color: string; bg: string }> = {
  a_valider:  { color: '#d97706', bg: '#fffbeb' },
  a_imprimer: { color: '#2563eb', bg: '#eff6ff' },
  imprimee:   { color: '#7c3aed', bg: '#f5f3ff' },
  remise:     { color: '#059669', bg: '#ecfdf5' },
  annulee:    { color: '#64748b', bg: '#f1f5f9' },
}

export const EligibilityBox = ({ e, frozen }: { e: AttestationEligibility | null | undefined; frozen?: boolean }) => {
  if (!e) return null
  const ok = e.eligible
  return (
    <div style={{ border: `1px solid ${ok ? '#a7f3d0' : '#fde68a'}`, background: ok ? '#ecfdf5' : '#fffbeb', borderRadius: 12, padding: '10px 12px' }}>
      <div style={{ fontWeight: 800, color: ok ? '#047857' : '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
        <CIcon icon={ok ? cilCheckAlt : cilWarning} style={{ width: 16 }} />
        {ok ? 'Conditions remplies' : 'Conditions non remplies'}
        {frozen && <span className="stg-muted" style={{ fontWeight: 500 }}>(au moment de la validation)</span>}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '.85rem', marginTop: 6 }}>
        <span>Assiduité : <strong style={{ color: e.attendance_ok ? '#047857' : '#b45309' }}>{e.taux !== null ? `${e.taux} %` : '—'}</strong> (minimum {e.seuil} %)</span>
        <span>Rapport final : <strong style={{ color: e.final_validated ? '#047857' : '#b45309' }}>{e.final_validated ? 'validé' : 'non validé'}</strong></span>
        <span className="stg-muted">{e.jours_ouvres} jour(s) ouvré(s), {e.absences} absence(s)</span>
      </div>
    </div>
  )
}

interface Props { attestationId: number | null; lead: boolean; onClose: () => void; onChanged: () => void }

const AttestationModal = ({ attestationId, lead, onClose, onChanged }: Props) => {
  const [a, setA] = useState<Attestation | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [edit, setEdit] = useState({ theme: '', service: '', observations: '' })
  const [numero, setNumero] = useState('')
  const [date, setDate] = useState(todayIso())
  const [cancelMode, setCancelMode] = useState(false)
  const [cancelMotif, setCancelMotif] = useState('')
  const [exceptional, setExceptional] = useState(false)
  const [scanView, setScanView] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const apply = (x: Attestation) => {
    setA(x)
    setEdit({ theme: x.content?.theme ?? '', service: x.content?.service ?? '', observations: x.content?.observations ?? '' })
    setNumero(x.numero ?? x.suggested_numero ?? '')
  }

  useEffect(() => {
    setA(null); setErr(null); setCancelMode(false); setCancelMotif(''); setDate(todayIso())
    if (attestationId === null) return
    stageService.attestation(attestationId).then(apply).catch(e => setErr(friendlyError(e)))
  }, [attestationId])

  // Échap ferme seulement cette fenêtre (pas la fiche ouverte dessous).
  useEffect(() => {
    if (attestationId === null || exceptional || scanView) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); onClose() } }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [attestationId, onClose, exceptional, scanView])

  const run = async (fn: () => Promise<any>, title: string) => {
    if (!a) return
    setBusy(true); setErr(null)
    try {
      const res: any = await fn()
      apply(res.data)
      onChanged()
      setBusy(false)
      await showSuccess(title, res?.message)
    } catch (e) {
      setErr(friendlyError(e))
      setBusy(false)
    }
  }

  const c = a?.content
  const st = a ? ATT_STATUS[a.status] : null
  const editing = lead && a?.status === 'a_valider'
  const open = a ? ['a_valider', 'a_imprimer', 'imprimee'].includes(a.status) : false

  return (
    <CModal visible={attestationId !== null} onClose={onClose} size="lg" fullscreen="md" scrollable keyboard={false}>
      <CModalHeader>
        <CModalTitle style={{ fontSize: '1rem', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {a ? <>Attestation — {a.stage?.nom_complet}
            {st && <span className="stg-pill" style={{ color: st.color, background: st.bg }}>{a.status_label}</span>}
            {a.kind !== 'normale' && <span className="stg-pill" style={{ color: '#9a3412', background: '#fff7ed' }}>{a.kind_label}</span>}</> : 'Attestation'}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {!a && !err && <div style={{ padding: 32, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
        {a && c && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {a.motif && (
              <div className="stg-card" style={{ background: '#fff7ed', borderColor: '#fed7aa', whiteSpace: 'pre-line', fontSize: '.88rem' }}>
                {a.motif_type_label && <strong>{a.motif_type_label}. </strong>}{a.motif}
              </div>
            )}
            <EligibilityBox e={a.eligibility} frozen={a.status !== 'a_valider'} />

            <dl className="att-dl">
              <dt>Stagiaire</dt><dd>{c.nom_complet}</dd>
              <dt>Né(e) le</dt><dd>{frDate(c.date_naissance, true)} à {c.lieu_naissance}</dd>
              <dt>Établissement</dt><dd>{c.etablissement} — {c.filiere}</dd>
              <dt>Période</dt><dd>Du {frDate(c.date_debut, true)} au {frDate(c.date_fin, true)}{c.duree ? ` (${c.duree})` : ''}</dd>
              <dt>Lieu</dt><dd>{c.lieu ?? '—'}</dd>
              {!editing && <><dt>Service</dt><dd>{c.service ?? '—'}</dd></>}
              {!editing && <><dt>Thème</dt><dd>{c.theme ?? '—'}</dd></>}
              {!editing && c.observations && <><dt>Observations</dt><dd>{c.observations}</dd></>}
              {a.numero && <><dt>Numéro</dt><dd><strong>{a.numero}</strong></dd></>}
            </dl>

            {editing && (
              <div className="stg-card">
                <div style={{ fontWeight: 700, marginBottom: 8 }}>À vérifier avant validation</div>
                <CFormLabel className="small fw-semibold mb-1">Service</CFormLabel>
                <CFormInput maxLength={150} value={edit.service} onChange={e => setEdit({ ...edit, service: e.target.value })} />
                <CFormLabel className="small fw-semibold mb-1 mt-2">Thème du stage</CFormLabel>
                <CFormInput maxLength={200} value={edit.theme} onChange={e => setEdit({ ...edit, theme: e.target.value })} />
                <CFormLabel className="small fw-semibold mb-1 mt-2">Observations (facultatif)</CFormLabel>
                <CFormTextarea rows={2} maxLength={500} value={edit.observations} onChange={e => setEdit({ ...edit, observations: e.target.value })} />
                <CButton size="sm" color="secondary" variant="outline" className="mt-2" disabled={busy}
                  onClick={() => run(() => stageService.updateAttestation(a.id, edit), 'Modifications enregistrées')}>Enregistrer les corrections</CButton>
              </div>
            )}

            {a.status === 'a_imprimer' && (
              <div className="stg-card">
                <div style={{ fontWeight: 700 }}>Impression</div>
                <p className="stg-muted" style={{ margin: '4px 0 8px' }}>Imprimez l'attestation sur le modèle officiel, puis confirmez son numéro. Le stagiaire sera prévenu qu'il peut la retirer.</p>
                <CFormLabel className="small fw-semibold mb-1">Numéro (proposé, modifiable)</CFormLabel>
                <CFormInput maxLength={60} value={numero} onChange={e => setNumero(e.target.value)} />
              </div>
            )}

            {a.status === 'imprimee' && (
              <div className="stg-card">
                <div style={{ fontWeight: 700 }}>Remise au stagiaire</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 6 }}>
                  <div>
                    <CFormLabel className="small fw-semibold mb-1">Date de remise</CFormLabel>
                    <CFormInput type="date" max={todayIso()} value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                  <CButton color="success" style={{ color: '#fff' }} disabled={busy || !date}
                    onClick={() => run(() => stageService.deliveredAttestation(a.id, date), 'Remise enregistrée')}>
                    <CIcon icon={cilTask} className="me-1" />Marquer remise
                  </CButton>
                </div>
                <details style={{ marginTop: 10 }}>
                  <summary className="stg-muted" style={{ cursor: 'pointer' }}>Corriger le numéro</summary>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <CFormInput size="sm" maxLength={60} value={numero} onChange={e => setNumero(e.target.value)} />
                    <CButton size="sm" color="secondary" variant="outline" disabled={busy || !numero.trim() || numero.trim() === a.numero}
                      onClick={() => run(() => stageService.printedAttestation(a.id, numero.trim()), 'Numéro modifié')}>Enregistrer</CButton>
                  </div>
                </details>
              </div>
            )}

            {(a.status === 'imprimee' || a.status === 'remise') && (
              <div className="stg-card" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ flex: 1, minWidth: 180 }}>
                  <strong>Scan pour l'archive</strong> <span className="stg-muted">(facultatif — PDF, JPG ou PNG, 10 Mo max.)</span>
                </span>
                {a.has_scan && <CButton size="sm" color="secondary" variant="outline" onClick={() => setScanView(true)}><CIcon icon={cilFile} className="me-1" />Voir</CButton>}
                <CButton size="sm" color="primary" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}>
                  <CIcon icon={cilCloudUpload} className="me-1" />{a.has_scan ? 'Remplacer' : 'Ajouter'}
                </CButton>
                <input ref={fileRef} type="file" accept="application/pdf,image/jpeg,image/png" hidden onChange={e => {
                  const f = e.target.files?.[0]; e.target.value = ''
                  if (!f) return
                  if (f.size > 10 * 1024 * 1024) { setErr('Le fichier ne doit pas dépasser 10 Mo.'); return }
                  run(() => stageService.uploadAttestationScan(a.id, f), 'Scan enregistré')
                }} />
              </div>
            )}

            <div className="stg-muted" style={{ fontSize: '.78rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span>Préparée le {frDateTime(a.created_at)}</span>
              {a.validated_at && <span>Validée le {frDateTime(a.validated_at)}{a.validated_by ? ` par ${a.validated_by}` : ''}</span>}
              {a.printed_at && <span>Imprimée le {frDateTime(a.printed_at)}{a.printed_by ? ` par ${a.printed_by}` : ''}</span>}
              {a.delivered_on && <span>Remise le {frDate(a.delivered_on, true)}{a.delivered_by ? ` (enregistrée par ${a.delivered_by})` : ''}</span>}
              {a.cancelled_at && <span>Annulée le {frDateTime(a.cancelled_at)}{a.cancelled_by ? ` par ${a.cancelled_by}` : ''} : {a.cancel_reason}</span>}
            </div>

            {cancelMode && (
              <div className="stg-card" style={{ borderColor: '#fecdd3' }}>
                <CFormLabel className="small fw-semibold mb-1">Motif de l'annulation</CFormLabel>
                <CFormTextarea rows={2} maxLength={1000} value={cancelMotif} onChange={e => setCancelMotif(e.target.value)} />
              </div>
            )}
          </div>
        )}
        {err && <div className="stg-err" style={{ marginTop: 12, marginBottom: 0 }}>{err}</div>}
      </CModalBody>
      {a && (
        <CModalFooter style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <CButton color="secondary" variant="ghost" onClick={cancelMode ? () => setCancelMode(false) : onClose}>{cancelMode ? 'Retour' : 'Fermer'}</CButton>
            {lead && open && !cancelMode && (
              <CButton color="danger" variant="ghost" onClick={() => { setCancelMotif(''); setCancelMode(true) }}><CIcon icon={cilBan} className="me-1" />Annuler l'attestation</CButton>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {cancelMode ? (
              <CButton color="danger" disabled={busy || cancelMotif.trim().length < 5}
                onClick={async () => { await run(() => stageService.cancelAttestation(a.id, cancelMotif.trim()), 'Attestation annulée'); setCancelMode(false) }}>
                Confirmer l'annulation
              </CButton>
            ) : <>
              {editing && !a.eligibility?.eligible && a.stage && (
                <CButton color="warning" variant="outline" onClick={() => setExceptional(true)}>Attestation exceptionnelle</CButton>
              )}
              {editing && (
                <CButton color="success" style={{ color: '#fff' }} disabled={busy || !a.eligibility?.eligible}
                  onClick={() => run(() => stageService.validateAttestation(a.id), 'Attestation validée')}>
                  {busy && <CSpinner size="sm" className="me-1" />}<CIcon icon={cilCheckAlt} className="me-1" />Valider
                </CButton>
              )}
              {a.status === 'a_imprimer' && (
                <CButton color="primary" disabled={busy || numero.trim().length < 2}
                  onClick={() => run(() => stageService.printedAttestation(a.id, numero.trim()), 'Attestation imprimée')}>
                  {busy && <CSpinner size="sm" className="me-1" />}<CIcon icon={cilPrint} className="me-1" />Marquer imprimée
                </CButton>
              )}
            </>}
          </div>
        </CModalFooter>
      )}
      {a?.stage && (
        <ExceptionalAttestationModal
          visible={exceptional}
          stage={a.stage}
          onClose={() => setExceptional(false)}
          onDone={x => { setExceptional(false); apply(x); onChanged() }}
        />
      )}
      {a?.stage && (
        <StageFileViewer
          visible={scanView}
          stageId={a.stage.id}
          files={[{ key: 'scan', label: `Scan de l'attestation${a.numero ? ` ${a.numero}` : ''}` }]}
          initialKey="scan"
          title="Attestation signée (scan)"
          loader={() => stageService.attestationScan(a.id)}
          onClose={() => setScanView(false)}
        />
      )}
      <style>{`
        .att-dl { display: grid; grid-template-columns: 130px minmax(0, 1fr); gap: 6px 12px; margin: 0; font-size: .9rem; }
        .att-dl dt { color: #64748b; font-weight: 600; }
        .att-dl dd { margin: 0; color: #0f172a; }
        @media (max-width: 576px) { .att-dl { grid-template-columns: minmax(0, 1fr); } .att-dl dd { margin-bottom: 6px; } }
      `}</style>
    </CModal>
  )
}

export default AttestationModal
