// src/views/pages/stages/WorkAttestationModal.tsx
// Une attestation de travail, selon l'étape et le rôle :
//  - responsable : lien en attente (renvoyer, ou remplir soi-même), vérifier
//    et corriger chaque point, aperçu, valider, annuler ;
//  - secrétariat (et responsable) : imprimer (numéro du registre), faire
//    signer par le Chef CAP, prévenir l'intéressé, enregistrer la remise.

import { useEffect, useState } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CSpinner, CFormInput, CFormTextarea, CFormLabel, CFormSelect,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckAlt, cilPrint, cilTask, cilBan, cilDescription, cilBell, cilPlus, cilX, cilSend } from '@coreui/icons'
import stageService, { type WorkAttestation, type WorkAttestationStatus, type WorkAttestationValues } from '@/services/stage.service'
import { showSuccess, friendlyError } from '@/components/common/ActionResult'
import StageFileViewer from './StageFileViewer'
import { frDate, frDateTime, printPdf, todayIso } from './stageUtils'

export const WORK_STATUS: Record<WorkAttestationStatus, { color: string; bg: string }> = {
  invitee:    { color: '#0369a1', bg: '#f0f9ff' },
  a_valider:  { color: '#d97706', bg: '#fffbeb' },
  a_imprimer: { color: '#2563eb', bg: '#eff6ff' },
  imprimee:   { color: '#7c3aed', bg: '#f5f3ff' },
  prete:      { color: '#0f766e', bg: '#f0fdfa' },
  remise:     { color: '#059669', bg: '#ecfdf5' },
  annulee:    { color: '#64748b', bg: '#f1f5f9' },
}

const EMPTY: WorkAttestationValues = {
  civilite: null, nom: '', prenoms: '', email: '', phone: '', diplome: '', nature: '', fonctions: [''], taches: [''],
  date_debut: '', date_fin: '', appreciation: '',
}
const OTHER = '__autre__'

/** Une ligne par point (fonction, tâche) : ajouter, retirer. */
export const BulletsField = ({ label, required, items, onChange, max, maxLen, placeholder, disabled }: {
  label: string; required?: boolean; items: string[]; onChange: (v: string[]) => void
  max: number; maxLen: number; placeholder: string; disabled?: boolean
}) => {
  const list = items.length ? items : ['']
  const set = (i: number, v: string) => onChange(list.map((x, j) => (j === i ? v : x)))
  return (
    <div className="mb-3">
      <CFormLabel className="small fw-semibold mb-1">{label}{required && <span className="text-danger"> *</span>}</CFormLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {list.map((v, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span aria-hidden style={{ color: '#64748b', width: 10 }}>-</span>
            <CFormInput value={v} maxLength={maxLen} disabled={disabled} placeholder={i === 0 ? placeholder : undefined}
              aria-label={`${label} ${i + 1}`} onChange={e => set(i, e.target.value)} />
            {(list.length > 1 || v !== '') && (
              <CButton color="secondary" variant="ghost" size="sm" disabled={disabled} title="Retirer cette ligne" aria-label="Retirer cette ligne"
                onClick={() => onChange(list.length > 1 ? list.filter((_, j) => j !== i) : [''])}><CIcon icon={cilX} /></CButton>
            )}
          </div>
        ))}
      </div>
      {list.length < max && (
        <CButton color="primary" variant="ghost" size="sm" className="mt-1 px-1" disabled={disabled} onClick={() => onChange([...list, ''])}>
          <CIcon icon={cilPlus} className="me-1" />Ajouter une ligne
        </CButton>
      )}
    </div>
  )
}

interface Props { attestationId: number | null; lead: boolean; onClose: () => void; onChanged: () => void }

const WorkAttestationModal = ({ attestationId, lead, onClose, onChanged }: Props) => {
  const [a, setA] = useState<WorkAttestation | null>(null)
  const [v, setV] = useState<WorkAttestationValues>(EMPTY)
  const [natureChoice, setNatureChoice] = useState('')
  const [dirty, setDirty] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [printing, setPrinting] = useState(false)
  const [pdfView, setPdfView] = useState(false)
  const [numero, setNumero] = useState('')
  const [docDate, setDocDate] = useState(todayIso())
  const [date, setDate] = useState(todayIso())
  const [cancelMode, setCancelMode] = useState(false)
  const [cancelMotif, setCancelMotif] = useState('')

  const apply = (x: WorkAttestation) => {
    setA(x)
    const val = x.values ?? EMPTY
    setV({ ...val, fonctions: val.fonctions.length ? val.fonctions : [''], taches: val.taches.length ? val.taches : [''] })
    const nature = val.nature ?? ''
    setNatureChoice(nature === '' ? '' : (x.natures ?? []).includes(nature) ? nature : OTHER)
    setDirty(false)
    setNumero(x.numero ?? x.next_number ?? '')
    setDocDate(x.document_date ?? x.default_document_date ?? todayIso())
  }

  useEffect(() => {
    setA(null); setErr(null); setCancelMode(false); setCancelMotif(''); setDate(todayIso())
    if (attestationId === null) return
    stageService.workAttestation(attestationId).then(apply).catch(e => setErr(friendlyError(e)))
  }, [attestationId])

  const set = <K extends keyof WorkAttestationValues>(k: K, value: WorkAttestationValues[K]) => { setV(p => ({ ...p, [k]: value })); setDirty(true) }

  const run = async (fn: () => Promise<any>, title: string, quiet = false) => {
    setBusy(true); setErr(null)
    try {
      const res: any = await fn()
      if (res?.data) apply(res.data)
      onChanged()
      setBusy(false)
      if (!quiet) await showSuccess(title, res?.message)
      return true
    } catch (e) {
      setErr(friendlyError(e))
      setBusy(false)
      return false
    }
  }

  const payload = (): Partial<WorkAttestationValues> => ({
    ...v,
    fonctions: v.fonctions.map(s => s.trim()).filter(Boolean),
    taches: v.taches.map(s => s.trim()).filter(Boolean),
  })
  const save = () => run(() => stageService.updateWorkAttestation(a!.id, payload()), 'Modifications enregistrées')
  /** Enregistre d'abord ce qui a changé (l'aperçu et la validation lisent la fiche enregistrée). */
  const saveThen = async (next: () => void | Promise<unknown>) => {
    if (dirty && !(await run(() => stageService.updateWorkAttestation(a!.id, payload()), '', true))) return
    await next()
  }

  const print = async () => {
    if (!a) return
    setPrinting(true); setErr(null)
    try { printPdf(await stageService.workAttestationPdf(a.id, a.status === 'a_imprimer' ? docDate : undefined)) }
    catch (e) { setErr(friendlyError(e)) }
    finally { setPrinting(false) }
  }

  const st = a ? WORK_STATUS[a.status] : null
  const editing = lead && !!a && (a.status === 'invitee' || a.status === 'a_valider')
  const open = !!a && ['invitee', 'a_valider', 'a_imprimer', 'imprimee', 'prete'].includes(a.status)
  const lim = a?.limits
  const total = [...v.fonctions, ...v.taches].join('').length

  return (
    <CModal visible={attestationId !== null} onClose={onClose} size="lg" fullscreen="md" scrollable>
      <CModalHeader>
        <CModalTitle style={{ fontSize: '1rem', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {a ? <>Attestation de travail{a.nom_complet ? ` - ${a.nom_complet}` : ''}
            {st && <span className="stg-pill" style={{ color: st.color, background: st.bg }}>{a.status_label}</span>}</> : 'Attestation de travail'}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {!a && !err && <div style={{ padding: 32, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
        {a && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {a.status === 'invitee' && (
              <div className="stg-card" style={{ background: '#f0f9ff', borderColor: '#bae6fd' }}>
                <strong>Lien envoyé au {a.phone}</strong>
                <div className="stg-muted">
                  Envoyé {a.send_count} fois, dernière le {frDateTime(a.last_sent_at)} · valable jusqu'au {frDateTime(a.expires_at)}.
                  La personne remplit sa fiche sans compte. Vous pouvez aussi la remplir vous-même ci-dessous : le lien ne fonctionnera plus.
                </div>
                {lead && (
                  <CButton size="sm" color="primary" variant="outline" className="mt-2" disabled={busy}
                    onClick={() => run(() => stageService.resendWorkAttestation(a.id), 'Lien renvoyé')}><CIcon icon={cilSend} className="me-1" />Renvoyer le lien</CButton>
                )}
              </div>
            )}

            {editing ? (
              <div className="stg-card">
                <div style={{ fontWeight: 700, marginBottom: 10 }}>{a.status === 'invitee' ? 'Remplir la fiche' : 'Vérifier, corriger, compléter'}</div>
                <div className="row g-2">
                  <div className="col-sm-3">
                    <CFormLabel className="small fw-semibold mb-1">Civilité <span className="text-danger">*</span></CFormLabel>
                    <CFormSelect value={v.civilite ?? ''} onChange={e => set('civilite', (e.target.value || null) as WorkAttestationValues['civilite'])}>
                      <option value="">Choisir</option><option value="M.">M.</option><option value="Mme">Mme</option><option value="Mlle">Mlle</option>
                    </CFormSelect>
                  </div>
                  <div className="col-sm-4">
                    <CFormLabel className="small fw-semibold mb-1">Nom <span className="text-danger">*</span></CFormLabel>
                    <CFormInput maxLength={80} value={v.nom ?? ''} placeholder="Exemple : AGOSSOU" onChange={e => set('nom', e.target.value)} />
                  </div>
                  <div className="col-sm-5">
                    <CFormLabel className="small fw-semibold mb-1">Prénoms <span className="text-danger">*</span></CFormLabel>
                    <CFormInput maxLength={100} value={v.prenoms ?? ''} placeholder="Exemple : Jean Marc" onChange={e => set('prenoms', e.target.value)} />
                  </div>
                  <div className="col-sm-6">
                    <CFormLabel className="small fw-semibold mb-1">Email</CFormLabel>
                    <CFormInput type="email" maxLength={254} value={v.email ?? ''} placeholder="Exemple : jean.agossou@gmail.com" onChange={e => set('email', e.target.value)} />
                  </div>
                  <div className="col-sm-6">
                    <CFormLabel className="small fw-semibold mb-1">WhatsApp</CFormLabel>
                    <CFormInput type="tel" maxLength={30} value={v.phone ?? ''} placeholder="Exemple : 01 97 00 00 00" onChange={e => set('phone', e.target.value)} />
                  </div>
                  <div className="col-12">
                    <CFormLabel className="small fw-semibold mb-1">Diplôme <span className="text-danger">*</span></CFormLabel>
                    <CFormInput maxLength={150} value={v.diplome ?? ''} placeholder="Exemple : Licence Professionnelle en Génie Électrique et Informatique" onChange={e => set('diplome', e.target.value)} />
                    <div className="stg-muted" style={{ fontSize: '.875rem' }}>Imprimé : « titulaire du diplôme de … » (ou « d’… » devant une voyelle).</div>
                  </div>
                  <div className="col-sm-6">
                    <CFormLabel className="small fw-semibold mb-1">Début <span className="text-danger">*</span></CFormLabel>
                    <CFormInput type="date" max={todayIso()} value={v.date_debut ?? ''} onChange={e => set('date_debut', e.target.value)} />
                  </div>
                  <div className="col-sm-6">
                    <CFormLabel className="small fw-semibold mb-1">Fin <span className="text-danger">*</span></CFormLabel>
                    <CFormInput type="date" min={v.date_debut || undefined} max={todayIso()} value={v.date_fin ?? ''} onChange={e => set('date_fin', e.target.value)} />
                  </div>
                  <div className="col-12">
                    <CFormLabel className="small fw-semibold mb-1">Nature de l'engagement</CFormLabel>
                    <CFormSelect value={natureChoice} onChange={e => {
                      const c = e.target.value
                      setNatureChoice(c)
                      set('nature', c === OTHER ? '' : c)
                    }}>
                      <option value="">Sans mention</option>
                      {(a.natures ?? []).map(n => <option key={n} value={n}>{n}</option>)}
                      <option value={OTHER}>Autre (à préciser)</option>
                    </CFormSelect>
                    {natureChoice === OTHER && (
                      <CFormInput className="mt-2" maxLength={80} value={v.nature ?? ''} placeholder="Exemple : en qualité d’assistant technique" onChange={e => set('nature', e.target.value)} />
                    )}
                    <div className="stg-muted" style={{ fontSize: '.875rem' }}>Imprimé : « a exercé{v.nature ? `, ${v.nature},` : ''} les fonctions de : ».</div>
                  </div>
                </div>
                <div className="mt-3">
                  <BulletsField label="Fonctions" required items={v.fonctions} onChange={x => set('fonctions', x)}
                    max={lim?.fonctions ?? 5} maxLen={lim?.fonction ?? 90} placeholder="Exemple : Développeur web au Service Informatique" />
                  <BulletsField label="Tâches (« a notamment été chargé de : »)" items={v.taches} onChange={x => set('taches', x)}
                    max={lim?.taches ?? 8} maxLen={lim?.tache ?? 110} placeholder="Exemple : la maintenance du parc informatique ;" />
                  {lim && total > lim.total && (
                    <div className="stg-err">Fonctions et tâches trop longues pour tenir sur une page ({total} caractères, {lim.total} au plus) : raccourcissez-les.</div>
                  )}
                  <CFormLabel className="small fw-semibold mb-1">Appréciation</CFormLabel>
                  <CFormTextarea rows={3} maxLength={400} value={v.appreciation ?? ''} onChange={e => set('appreciation', e.target.value)}
                    placeholder="Exemple : Son engagement, son professionnalisme et sa disponibilité ont grandement contribué au bon fonctionnement du Service Informatique du Centre." />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  <CButton size="sm" color="secondary" variant="outline" disabled={busy || !dirty} onClick={save}>Enregistrer</CButton>
                  <CButton size="sm" color="secondary" variant="outline" disabled={busy} onClick={() => saveThen(() => setPdfView(true))}>
                    <CIcon icon={cilDescription} className="me-1" />Aperçu du PDF
                  </CButton>
                </div>
              </div>
            ) : a.values && (
              <dl className="att-dl">
                <dt>Personne</dt><dd>{a.nom_complet}</dd>
                <dt>Diplôme</dt><dd>{a.values.diplome ?? '-'}</dd>
                <dt>Période</dt><dd>Du {frDate(a.date_debut, true)} au {frDate(a.date_fin, true)}</dd>
                {a.values.nature && <><dt>Nature</dt><dd>{a.values.nature}</dd></>}
                <dt>Fonctions</dt><dd>{a.values.fonctions.map(f => <div key={f}>- {f}</div>)}</dd>
                {a.values.taches.length > 0 && <><dt>Tâches</dt><dd>{a.values.taches.map(t => <div key={t}>- {t}</div>)}</dd></>}
                <dt>Contact</dt><dd>{[a.values.phone, a.values.email].filter(Boolean).join(' · ') || '-'}</dd>
                {a.numero && <><dt>Numéro</dt><dd><strong>{a.numero}</strong></dd></>}
              </dl>
            )}

            {a.status === 'a_imprimer' && (
              <div className="stg-card">
                <div style={{ fontWeight: 700 }}>Impression</div>
                <p className="stg-muted" style={{ margin: '4px 0 8px' }}>Choisissez la date du document, imprimez, inscrivez le numéro à la main, puis marquez l'attestation imprimée. Ensuite : signature du Chef CAP, et vous prévenez l'intéressé.</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <div>
                    <CFormLabel className="small fw-semibold mb-1">Date du document <span className="text-danger">*</span></CFormLabel>
                    <CFormInput type="date" value={docDate} onChange={e => setDocDate(e.target.value)} style={{ maxWidth: 180 }} />
                  </div>
                  <CButton color="primary" variant="outline" disabled={printing || !docDate} onClick={print}>
                    {printing ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilPrint} className="me-1" />}Imprimer
                  </CButton>
                  <CButton color="secondary" variant="ghost" onClick={() => setPdfView(true)}><CIcon icon={cilDescription} className="me-1" />Aperçu</CButton>
                </div>
                <CFormLabel className="small fw-semibold mb-1 mt-3">N° du registre écrit à la main</CFormLabel>
                <CFormInput maxLength={60} value={numero} onChange={e => setNumero(e.target.value)} style={{ maxWidth: 220 }} placeholder="Exemple : 22-26" />
              </div>
            )}

            {(a.status === 'imprimee' || a.status === 'prete') && (
              <div className="stg-card" style={{ borderColor: a.status === 'imprimee' ? '#c4b5fd' : undefined }}>
                <div style={{ fontWeight: 700 }}>{a.status === 'imprimee' ? 'Signature, puis prévenir l\'intéressé' : 'Intéressé prévenu'}</div>
                <p className="stg-muted" style={{ margin: '4px 0 8px' }}>
                  {a.status === 'imprimee'
                    ? 'Une fois l\'attestation signée par le Chef CAP, prévenez l\'intéressé : il reçoit un message sur WhatsApp et par email, et vient la retirer au secrétariat.'
                    : `Prévenu le ${frDateTime(a.notified_at)}${a.notified_by ? ` par ${a.notified_by}` : ''}${(a.notify_count ?? 0) > 1 ? ` (${a.notify_count} fois)` : ''}. Il ne vient pas ? Relancez-le.`}
                </p>
                <CButton color={a.status === 'imprimee' ? 'success' : 'primary'} variant={a.status === 'imprimee' ? undefined : 'outline'}
                  style={a.status === 'imprimee' ? { color: '#fff' } : undefined} disabled={busy}
                  onClick={() => run(() => stageService.notifyWorkAttestation(a.id), 'Intéressé prévenu')}>
                  <CIcon icon={cilBell} className="me-1" />{a.status === 'imprimee' ? 'Prévenir : attestation prête' : 'Prévenir à nouveau'}
                </CButton>
              </div>
            )}

            {(a.status === 'imprimee' || a.status === 'prete') && (
              <div className="stg-card">
                <div style={{ fontWeight: 700 }}>Remise</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 6 }}>
                  <div>
                    <CFormLabel className="small fw-semibold mb-1">Date de remise <span className="text-danger">*</span></CFormLabel>
                    <CFormInput type="date" max={todayIso()} value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                  <CButton color="success" style={{ color: '#fff' }} disabled={busy || !date}
                    onClick={() => run(() => stageService.deliveredWorkAttestation(a.id, date), 'Remise enregistrée')}>
                    <CIcon icon={cilTask} className="me-1" />Marquer remise
                  </CButton>
                </div>
                <details style={{ marginTop: 10 }}>
                  <summary className="stg-muted" style={{ cursor: 'pointer' }}>Corriger le numéro noté ou la date du document</summary>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                    <CFormInput size="sm" maxLength={60} placeholder="N° écrit à la main" value={numero} onChange={e => setNumero(e.target.value)} style={{ maxWidth: 200 }} />
                    <CFormInput size="sm" type="date" value={docDate} onChange={e => setDocDate(e.target.value)} style={{ maxWidth: 170 }} />
                    <CButton size="sm" color="secondary" variant="outline" disabled={busy || !docDate || (numero.trim() === (a.numero ?? '') && docDate === a.document_date)}
                      onClick={() => run(() => stageService.printedWorkAttestation(a.id, numero.trim(), docDate), 'Modification enregistrée')}>Enregistrer</CButton>
                  </div>
                </details>
              </div>
            )}

            {['imprimee', 'prete', 'remise'].includes(a.status) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <CButton size="sm" color="secondary" variant="outline" onClick={() => setPdfView(true)}><CIcon icon={cilDescription} className="me-1" />Voir le PDF</CButton>
                <CButton size="sm" color="secondary" variant="outline" disabled={printing} onClick={print}>
                  {printing ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilPrint} className="me-1" />}Réimprimer
                </CButton>
              </div>
            )}

            <div className="stg-muted" style={{ fontSize: '.875rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {a.created_by && <span>Créée par {a.created_by}</span>}
              {a.submitted_at && <span>Fiche envoyée par la personne le {frDateTime(a.submitted_at)}</span>}
              {a.validated_at && <span>Validée le {frDateTime(a.validated_at)}{a.validated_by ? ` par ${a.validated_by}` : ''}</span>}
              {a.printed_at && <span>Imprimée le {frDateTime(a.printed_at)}{a.printed_by ? ` par ${a.printed_by}` : ''}</span>}
              {a.delivered_on && <span>Remise le {frDate(a.delivered_on, true)}{a.delivered_by ? ` (enregistrée par ${a.delivered_by})` : ''}</span>}
              {a.cancelled_at && <span>Annulée le {frDateTime(a.cancelled_at)}{a.cancelled_by ? ` par ${a.cancelled_by}` : ''} : {a.cancel_reason}</span>}
            </div>

            {cancelMode && (
              <div className="stg-card" style={{ borderColor: '#fecdd3' }}>
                <CFormLabel className="small fw-semibold mb-1">Motif de l'annulation <span className="text-danger">*</span></CFormLabel>
                <CFormTextarea rows={2} maxLength={1000} value={cancelMotif} placeholder="Exemple : Demande faite en double" onChange={e => setCancelMotif(e.target.value)} />
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
                onClick={async () => { await run(() => stageService.cancelWorkAttestation(a.id, cancelMotif.trim()), 'Attestation annulée'); setCancelMode(false) }}>
                Confirmer l'annulation
              </CButton>
            ) : <>
              {editing && (
                <CButton color="success" style={{ color: '#fff' }} disabled={busy || (!!lim && total > lim.total)}
                  onClick={() => saveThen(() => run(() => stageService.validateWorkAttestation(a.id), 'Attestation validée'))}>
                  {busy && <CSpinner size="sm" className="me-1" />}<CIcon icon={cilCheckAlt} className="me-1" />Valider
                </CButton>
              )}
              {a.status === 'a_imprimer' && (
                <CButton color="primary" disabled={busy || !docDate}
                  onClick={() => run(() => stageService.printedWorkAttestation(a.id, numero.trim(), docDate), 'Attestation imprimée')}>
                  {busy && <CSpinner size="sm" className="me-1" />}<CIcon icon={cilPrint} className="me-1" />Marquer imprimée
                </CButton>
              )}
            </>}
          </div>
        </CModalFooter>
      )}
      {a && (
        <StageFileViewer
          visible={pdfView}
          files={[{ key: 'pdf', label: ['invitee', 'a_valider'].includes(a.status) ? 'Aperçu (non validée)' : `Attestation de travail${a.numero ? ` N° ${a.numero}` : ''}` }]}
          initialKey="pdf"
          title="Attestation de travail"
          loader={() => stageService.workAttestationPdf(a.id, a.status === 'a_imprimer' ? docDate : undefined)}
          onClose={() => setPdfView(false)}
        />
      )}
    </CModal>
  )
}

export default WorkAttestationModal
