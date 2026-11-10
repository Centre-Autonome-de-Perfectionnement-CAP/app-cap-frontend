// src/views/pages/stages/EvaluationsPage.tsx
// Notes de stage (sur 20) : chaque superviseur note les stagiaires dont le
// stage finit (les siens obligatoirement, sur fond vert, les autres s'il le
// souhaite), avec un commentaire obligatoire. Onglet « Validation »
// (responsables) : détail de toutes les notes, renvoi pour revoir, validation
// avec l'appréciation générale ; le stagiaire reçoit alors son bulletin.

import { useCallback, useEffect, useState } from 'react'
import { CButton, CFormInput, CFormLabel, CFormSelect, CFormTextarea, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckAlt, cilCloudDownload, cilPencil, cilActionUndo } from '@coreui/icons'
import feedbackService, { frNum, type EvalBoardItem, type EvalCriterion, type EvalToRate } from '@/services/stageFeedback.service'
import { friendlyError, showSuccess } from '@/components/common/ActionResult'
import { PageHead, Empty, FilterTabs, Pill, StagesStyles } from './StagesUi'
import { frDate } from './stageUtils'

const EvaluationsPage = () => {
  const [tab, setTab] = useState<'noter' | 'validation'>('noter')
  const [lead, setLead] = useState(false)
  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead title="Notes de stage" subtitle="Notez sur 20 les stagiaires dont le stage se termine : obligatoire pour vos stagiaires, facultatif pour les autres." />
      {lead && <FilterTabs options={[{ key: 'noter', label: 'À noter' }, { key: 'validation', label: 'Validation' }]} value={tab} onChange={setTab} />}
      {tab === 'noter' ? <ToRate onLead={setLead} /> : <Validation />}
    </div>
  )
}

// ── Noter ────────────────────────────────────────────────────────────────

const ToRate = ({ onLead }: { onLead: (v: boolean) => void }) => {
  const [data, setData] = useState<{ criteria: EvalCriterion[]; interns: EvalToRate[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState<EvalToRate | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const r = await feedbackService.toRate()
      setData(r); onLead(r.lead)
    } catch (e) { setError(friendlyError(e)) }
  }, [onLead])
  useEffect(() => { load() }, [load])

  if (error) return <div className="stg-err">{error}</div>
  if (!data) return <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>
  if (data.interns.length === 0) return <div className="stg-card"><Empty text="Aucun stagiaire à noter pour le moment. La notation s'ouvre 10 jours ouvrés avant la fin du stage." /></div>

  return <>
    <div className="stg-list">
      {data.interns.map(i => {
        const e = i.mine_evaluation
        return (
          <button key={i.id} type="button" className="stg-card stg-row2" onClick={() => setOpen(i)}
            style={{ textAlign: 'left', cursor: 'pointer', ...(i.mine ? { background: '#ecfdf5', borderColor: '#a7f3d0' } : {}) }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ color: '#0f172a' }}>{i.name}</strong>
              <span className="stg-muted" style={{ display: 'block' }}>{i.reference}{i.date_fin ? ` · fin le ${frDate(i.date_fin)}` : ''}</span>
            </span>
            {i.mine && <Pill color="#047857" bg="#d1fae5">Mon stagiaire · obligatoire</Pill>}
            {e?.returned_note ? <Pill color="#b45309" bg="#fffbeb">À revoir</Pill>
              : e ? <Pill color="#0f766e" bg="#f0fdfa">Noté {frNum(e.total)}/20</Pill>
              : <Pill color="#475569" bg="#f1f5f9">À noter</Pill>}
          </button>
        )
      })}
    </div>
    {open && <RateModal intern={open} criteria={data.criteria} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); load() }} />}
  </>
}

const RateModal = ({ intern, criteria, onClose, onSaved }: { intern: EvalToRate; criteria: EvalCriterion[]; onClose: () => void; onSaved: () => void }) => {
  const prev = intern.mine_evaluation
  const [scores, setScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(criteria.map(c => [c.key, prev?.scores[c.key] != null ? String(prev.scores[c.key]).replace('.', ',') : ''])))
  const [comment, setComment] = useState(prev?.comment ?? '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const num = (s: string) => (s.trim() === '' ? NaN : Number(s.replace(',', '.')))
  const total = criteria.reduce((t, c) => t + (Number.isFinite(num(scores[c.key])) ? num(scores[c.key]) : 0), 0)

  const save = async () => {
    for (const c of criteria) {
      const v = num(scores[c.key])
      if (!Number.isFinite(v) || v < 0 || v > c.max || (v * 2) % 1 !== 0) { setErr(`${c.label} : une note de 0 à ${c.max}, par demi-point.`); return }
    }
    if (comment.trim().length < 10) { setErr('Le commentaire est obligatoire (10 caractères au moins).'); return }
    setBusy(true); setErr(null)
    try {
      await feedbackService.saveEvaluation(intern.id, Object.fromEntries(criteria.map(c => [c.key, num(scores[c.key])])), comment.trim())
      showSuccess('Note enregistrée')
      onSaved()
    } catch (e) { setErr(friendlyError(e)) } finally { setBusy(false) }
  }

  return (
    <CModal visible onClose={onClose} alignment="center" scrollable>
      <CModalHeader><CModalTitle>Noter {intern.name}</CModalTitle></CModalHeader>
      <CModalBody>
        {prev?.returned_note && (
          <div className="stg-warn mb-3"><span><b>À revoir :</b> {prev.returned_note}</span></div>
        )}
        {criteria.map(c => (
          <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <CFormLabel htmlFor={`ev-${c.key}`} className="fw-semibold mb-0" style={{ flex: 1 }}>{c.label} <span className="text-danger">*</span></CFormLabel>
            <CFormInput id={`ev-${c.key}`} inputMode="decimal" style={{ width: 124, textAlign: 'center' }} value={scores[c.key]}
              onChange={e => setScores({ ...scores, [c.key]: e.target.value.replace(/[^\d.,]/g, '').slice(0, 4) })} placeholder="Exemple : 3,5" aria-label={`${c.label}, sur ${c.max}`} />
            <span className="stg-muted" style={{ width: 28 }}>/ {c.max}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 4 }}>
          <span>Total</span><span>{frNum(total)} / 20</span>
        </div>
        <div className="stg-muted">Par demi-point (exemple : 3,5). La note finale est la moyenne pondérée des superviseurs, validée par le responsable.</div>
        <CFormLabel className="fw-semibold mt-3">Commentaire <span className="text-danger">*</span></CFormLabel>
        <CFormTextarea rows={3} maxLength={2000} value={comment} onChange={e => setComment(e.target.value)}
          placeholder="Exemple : Sérieux et ponctuel, bonne progression ; doit gagner en autonomie." />
        <div className="stg-muted mt-1">Seul le responsable de division lit les commentaires.</div>
        {err && <div className="stg-err mt-3 mb-0">{err}</div>}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>Annuler</CButton>
        <CButton color="primary" disabled={busy} onClick={save}>{busy && <CSpinner size="sm" className="me-1" />}Enregistrer la note</CButton>
      </CModalFooter>
    </CModal>
  )
}

// ── Validation (responsables) ────────────────────────────────────────────

const Validation = () => {
  const [data, setData] = useState<{ criteria: EvalCriterion[]; items: EvalBoardItem[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<{ item: EvalBoardItem; kind: 'validate' | 'return' } | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try { setData(await feedbackService.board()) } catch (e) { setError(friendlyError(e)) }
  }, [])
  useEffect(() => { load() }, [load])

  if (error) return <div className="stg-err">{error}</div>
  if (!data) return <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>
  if (data.items.length === 0) return <div className="stg-card"><Empty text="Aucune note de stage en cours." /></div>

  return <>
    <div className="stg-list">
      {data.items.map(it => (
        <div key={it.id} className="stg-card">
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <strong style={{ color: '#0f172a' }}>{it.name}</strong>
            <span className="stg-muted">{it.reference}{it.date_fin ? ` · fin le ${frDate(it.date_fin)}` : ''}</span>
            <span style={{ marginLeft: 'auto' }}>
              {it.validated
                ? <Pill color="#047857" bg="#ecfdf5">Validée : {frNum(it.final, 2)}/20</Pill>
                : it.preview ? <Pill color="#0f766e" bg="#f0fdfa">Moyenne {frNum(it.preview.average, 2)} · note retenue {frNum(it.preview.final, 2)}/20</Pill>
                : <Pill color="#475569" bg="#f1f5f9">Aucune note</Pill>}
            </span>
          </div>
          {!it.validated && it.missing.length > 0 && <div className="stg-muted mt-1">Attend la note de : {it.missing.join(', ')}</div>}
          {it.evaluations.length > 0 && (
            <div style={{ overflowX: 'auto', marginTop: 8 }}>
              <table className="table table-sm mb-0" style={{ fontSize: '.875rem' }}>
                <thead><tr>
                  <th>Superviseur</th>
                  {data.criteria.map(c => <th key={c.key} style={{ textAlign: 'center' }} title={c.label}>{c.label.split(' ')[0]} /{c.max}</th>)}
                  <th style={{ textAlign: 'center' }}>Total</th><th>Commentaire</th>
                </tr></thead>
                <tbody>
                  {it.evaluations.map(e => (
                    <tr key={e.user_id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{e.name}{e.titular && <span className="stg-muted"> · titulaire</span>}{e.returned && <span style={{ color: '#b45309', fontWeight: 700 }}> · à revoir</span>}</td>
                      {data.criteria.map(c => <td key={c.key} style={{ textAlign: 'center' }}>{frNum(e.scores[c.key])}</td>)}
                      <td style={{ textAlign: 'center', fontWeight: 800 }}>{frNum(e.total)}</td>
                      <td style={{ minWidth: 220, whiteSpace: 'pre-line' }}>{e.comment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {it.validated && it.appreciation && <div className="mt-2"><b>Appréciation :</b> {it.appreciation}</div>}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {it.validated ? (
              <CButton size="sm" color="primary" variant="outline" onClick={() => feedbackService.downloadBulletin(it).catch(e => setError(friendlyError(e)))}>
                <CIcon icon={cilCloudDownload} className="me-1" />Bulletin
              </CButton>
            ) : <>
              {it.evaluations.length > 0 && (
                <CButton size="sm" color="warning" variant="outline" onClick={() => setAction({ item: it, kind: 'return' })}><CIcon icon={cilActionUndo} className="me-1" />Renvoyer pour revoir</CButton>
              )}
              <CButton size="sm" color="success" style={{ color: '#fff' }} disabled={!it.preview} onClick={() => setAction({ item: it, kind: 'validate' })}>
                <CIcon icon={cilCheckAlt} className="me-1" />Valider la note
              </CButton>
            </>}
          </div>
        </div>
      ))}
    </div>
    {action && <ActionModal {...action} onClose={() => setAction(null)} onDone={() => { setAction(null); load() }} />}
  </>
}

const ActionModal = ({ item, kind, onClose, onDone }: { item: EvalBoardItem; kind: 'validate' | 'return'; onClose: () => void; onDone: () => void }) => {
  const [text, setText] = useState('')
  const [who, setWho] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const go = async () => {
    if (kind === 'return' && !who) { setErr('Choisissez le superviseur.'); return }
    if (text.trim().length < (kind === 'validate' ? 10 : 5)) { setErr(kind === 'validate' ? 'Écrivez l\'appréciation générale.' : 'Dites ce qu\'il faut revoir.'); return }
    setBusy(true); setErr(null)
    try {
      if (kind === 'validate') {
        await feedbackService.validateEvaluation(item.id, text.trim())
        showSuccess('Note validée', `${item.name} reçoit son bulletin sur WhatsApp et par email.`)
      } else {
        await feedbackService.returnEvaluation(item.id, Number(who), text.trim())
        showSuccess('Note renvoyée', 'Le superviseur est prévenu.')
      }
      onDone()
    } catch (e) { setErr(friendlyError(e)) } finally { setBusy(false) }
  }
  return (
    <CModal visible onClose={onClose} alignment="center">
      <CModalHeader><CModalTitle>{kind === 'validate' ? `Valider la note de ${item.name}` : 'Renvoyer une note pour revoir'}</CModalTitle></CModalHeader>
      <CModalBody>
        {kind === 'validate' && item.preview && (
          <div className="stg-card mb-3" style={{ background: '#f0fdfa' }}>
            Moyenne pondérée : <b>{frNum(item.preview.average, 2)}</b> · note retenue : <b>{frNum(item.preview.final, 2)} / 20</b>
            <div className="stg-muted">Titulaires 60 %, autres superviseurs 40 % ; arrondi au demi-point (au-delà de x,50 : entier suivant).</div>
          </div>
        )}
        {kind === 'return' && <>
          <CFormLabel className="fw-semibold">Superviseur <span className="text-danger">*</span></CFormLabel>
          <CFormSelect value={who} onChange={e => setWho(e.target.value)} className="mb-3">
            <option value="">Choisir…</option>
            {item.evaluations.map(e => <option key={e.user_id} value={e.user_id}>{e.name}</option>)}
          </CFormSelect>
        </>}
        <CFormLabel className="fw-semibold">{kind === 'validate' ? 'Appréciation générale' : 'Ce qu\'il faut revoir'} <span className="text-danger">*</span></CFormLabel>
        <CFormTextarea rows={3} maxLength={kind === 'validate' ? 2000 : 1000} value={text} onChange={e => setText(e.target.value)}
          placeholder={kind === 'validate' ? 'Exemple : Stage réussi, stagiaire sérieux et impliqué.' : 'Exemple : La note de qualité semble sévère au vu des travaux validés.'} />
        {kind === 'validate' && <div className="stg-muted mt-1">L'appréciation figure sur le bulletin du stagiaire, sans les commentaires des superviseurs.</div>}
        {err && <div className="stg-err mt-3 mb-0">{err}</div>}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>Annuler</CButton>
        <CButton color={kind === 'validate' ? 'success' : 'warning'} style={{ color: '#fff' }} disabled={busy} onClick={go}>
          {busy && <CSpinner size="sm" className="me-1" />}<CIcon icon={kind === 'validate' ? cilCheckAlt : cilPencil} className="me-1" />
          {kind === 'validate' ? 'Valider et envoyer le bulletin' : 'Renvoyer'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default EvaluationsPage
