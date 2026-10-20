// src/views/pages/stages/ReportModal.tsx
// Lecture d'un rapport : PDF affiché dans la page, versions, échanges,
// décisions ; commenter, valider ou demander une correction.

import { useCallback, useEffect, useState } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CSpinner, CFormTextarea, CFormSelect,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckAlt, cilPencil, cilCommentBubble } from '@coreui/icons'
import PdfViewer from '@/components/document-request/PdfViewer'
import stageService, { type ReportDetail } from '@/services/stage.service'
import { showSuccess, friendlyError } from '@/components/common/ActionResult'
import { frDateTime } from './stageUtils'

const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  submitted:           { color: '#2563eb', bg: '#eff6ff' },
  supervisor_approved: { color: '#059669', bg: '#ecfdf5' },
  supervisor_rejected: { color: '#ea580c', bg: '#fff7ed' },
  approved:            { color: '#047857', bg: '#d1fae5' },
  rejected:            { color: '#e11d48', bg: '#fff1f2' },
}

interface Props { reportId: number | null; onClose: () => void; onChanged: () => void }

const ReportModal = ({ reportId, onClose, onChanged }: Props) => {
  const [d, setD] = useState<ReportDetail | null>(null)
  const [version, setVersion] = useState<number>(0)
  const [file, setFile] = useState<{ url: string; name: string } | null>(null)
  const [fileErr, setFileErr] = useState<string | null>(null)
  const [mode, setMode] = useState<'view' | 'approved' | 'rejected'>('view')
  const [text, setText] = useState('')
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    setD(null); setFile(null); setMode('view'); setErr(null)
    if (reportId === null) return
    stageService.report(reportId).then(r => { setD(r); setVersion(r.current_version) }).catch(e => setErr(friendlyError(e)))
  }, [reportId])

  useEffect(() => {
    if (!d || !version) return
    let alive = true
    let url: string | null = null
    setFile(null); setFileErr(null)
    stageService.reportFile(d.id, version)
      .then(f => { url = f.url; if (alive) setFile(f); else URL.revokeObjectURL(f.url) })
      .catch(e => { if (alive) setFileErr(friendlyError(e)) })
    return () => { alive = false; if (url) URL.revokeObjectURL(url) }
  }, [d?.id, version]) // eslint-disable-line react-hooks/exhaustive-deps

  // Échap ferme seulement ce rapport (pas la fiche ouverte dessous).
  useEffect(() => {
    if (reportId === null) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); onClose() } }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [reportId, onClose])

  const download = useCallback(() => {
    if (!file) return
    const a = document.createElement('a'); a.href = file.url; a.download = file.name
    document.body.appendChild(a); a.click(); a.remove()
  }, [file])

  const decide = async () => {
    if (!d || mode === 'view') return
    if (mode === 'rejected' && !text.trim()) { setErr('Indiquez ce qui doit être corrigé.'); return }
    setBusy(true); setErr(null)
    try {
      const res: any = await stageService.decideReport(d.id, mode, text.trim() || undefined)
      setD(res.data); setMode('view'); setText('')
      onChanged()
      await showSuccess(mode === 'approved' ? 'Rapport validé' : 'Correction demandée', res?.message)
    } catch (e) {
      setErr(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  const sendComment = async () => {
    if (!d || !comment.trim()) return
    setBusy(true); setErr(null)
    try {
      const res: any = await stageService.commentReport(d.id, comment.trim())
      setD(res.data); setComment('')
    } catch (e) {
      setErr(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  const st = d ? STATUS_COLOR[d.status] : null
  const events = d ? [
    ...d.versions.map(v => ({ at: v.at, el: <><strong>Version {v.version}</strong> déposée{v.late ? ' (en retard)' : ''}{v.note ? <div style={{ whiteSpace: 'pre-line' }}>{v.note}</div> : null}</> })),
    ...d.comments.map(c => ({ at: c.at, el: <><strong>{c.author === 'staff' ? c.name : 'Stagiaire'}</strong> <span className="text-muted">(v{c.version})</span><div style={{ whiteSpace: 'pre-line' }}>{c.body}</div></> })),
    ...d.reviews.map(r => ({ at: r.at, el: <><strong style={{ color: r.decision === 'approved' ? '#059669' : '#ea580c' }}>{r.decision === 'approved' ? 'Validé' : 'À corriger'}</strong> par {r.name} ({r.role}, v{r.version}){r.comment ? <div style={{ whiteSpace: 'pre-line' }}>{r.comment}</div> : null}</> })),
  ].sort((a, b) => a.at.localeCompare(b.at)) : []

  return (
    <CModal visible={reportId !== null} onClose={onClose} fullscreen alignment="center" keyboard={false}>
      <CModalHeader>
        <CModalTitle style={{ fontSize: '1rem', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {d ? <>{d.label}<span style={{ color: '#64748b', fontWeight: 600 }}>— {d.stage?.nom_complet}</span>
            {st && <span className="stg-pill" style={{ color: st.color, background: st.bg }}>{d.status_label}</span>}
            {d.late && <span className="stg-pill" style={{ color: '#b45309', background: '#fef3c7' }}>En retard</span>}</> : 'Rapport'}
        </CModalTitle>
      </CModalHeader>
      <CModalBody style={{ padding: 0, display: 'flex', minHeight: 0, background: '#f1f5f9' }}>
        {!d && !err && <div style={{ margin: 'auto' }}><CSpinner color="primary" /></div>}
        {err && !d && <div style={{ margin: 'auto', color: '#be123c' }}>{err}</div>}
        {d && (
          <div className="rpt-wrap">
            <div className="rpt-doc">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
                <CFormSelect size="sm" style={{ maxWidth: 220 }} value={version} onChange={e => setVersion(Number(e.target.value))}>
                  {[...d.versions].reverse().map(v => <option key={v.version} value={v.version}>Version {v.version}{v.version === d.current_version ? ' (actuelle)' : ''}</option>)}
                </CFormSelect>
                <CButton size="sm" color="primary" variant="outline" className="ms-auto" disabled={!file} onClick={download}>Télécharger</CButton>
              </div>
              {fileErr && <div style={{ padding: 24, color: '#be123c' }}>{fileErr}</div>}
              {!file && !fileErr && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
              {file && <PdfViewer src={file.url} title={file.name} onDownload={download} />}
            </div>
            <aside className="rpt-side">
              <div style={{ fontWeight: 800, marginBottom: 8 }}>Historique</div>
              <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {events.map((e, i) => (
                  <li key={i} style={{ fontSize: '.85rem', background: '#f8fafc', borderRadius: 10, padding: '8px 10px' }}>
                    {e.el}
                    <div style={{ fontSize: '.72rem', color: '#94a3b8', marginTop: 2 }}>{frDateTime(e.at)}</div>
                  </li>
                ))}
              </ol>
              <div style={{ marginTop: 12 }}>
                <CFormTextarea rows={2} maxLength={2000} placeholder="Commenter (le stagiaire est prévenu)…" value={comment} onChange={e => setComment(e.target.value)} />
                <CButton size="sm" color="secondary" variant="outline" className="mt-2" disabled={busy || !comment.trim()} onClick={sendComment}>
                  <CIcon icon={cilCommentBubble} className="me-1" />Envoyer
                </CButton>
              </div>
              {mode !== 'view' && (
                <div style={{ marginTop: 14, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                  <div style={{ fontWeight: 700 }}>{mode === 'approved' ? 'Valider ce rapport' : 'Demander une correction'}</div>
                  <CFormTextarea className="mt-2" rows={3} maxLength={2000} value={text} onChange={e => setText(e.target.value)}
                    placeholder={mode === 'approved' ? 'Commentaire (facultatif)' : 'Ce qui doit être corrigé (obligatoire)'} />
                </div>
              )}
              {err && d && <div style={{ marginTop: 10, background: '#fff1f2', border: '1px solid #fecdd3', color: '#9f1239', borderRadius: 10, padding: '8px 12px', fontSize: '.85rem' }}>{err}</div>}
            </aside>
          </div>
        )}
      </CModalBody>
      {d && (
        <CModalFooter style={{ justifyContent: 'space-between' }}>
          <CButton color="secondary" variant="ghost" onClick={mode === 'view' ? onClose : () => { setMode('view'); setErr(null) }}>
            {mode === 'view' ? 'Fermer' : 'Retour'}
          </CButton>
          {mode === 'view' ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <CButton color="warning" variant="outline" onClick={() => { setText(''); setMode('rejected') }}><CIcon icon={cilPencil} className="me-1" />À corriger</CButton>
              <CButton color="success" style={{ color: '#fff' }} onClick={() => { setText(''); setMode('approved') }}><CIcon icon={cilCheckAlt} className="me-1" />Valider</CButton>
            </div>
          ) : (
            <CButton color={mode === 'approved' ? 'success' : 'warning'} style={{ color: '#fff' }} disabled={busy} onClick={decide}>
              {busy && <CSpinner size="sm" className="me-1" />}{mode === 'approved' ? 'Confirmer la validation' : 'Envoyer la demande de correction'}
            </CButton>
          )}
        </CModalFooter>
      )}
      <style>{`
        .rpt-wrap { display: grid; grid-template-columns: minmax(0, 1fr) 360px; width: 100%; min-height: 0; }
        .rpt-doc { display: flex; flex-direction: column; min-height: 0; }
        .rpt-side { background: #fff; border-left: 1px solid #e2e8f0; padding: 14px; overflow: auto; }
        .stg-pill { font-size: .7rem; font-weight: 800; padding: 2px 9px; border-radius: 999px; }
        @media (max-width: 991px) { .rpt-wrap { grid-template-columns: minmax(0, 1fr); } .rpt-doc { min-height: 60vh; } .rpt-side { border-left: 0; border-top: 1px solid #e2e8f0; } }
      `}</style>
    </CModal>
  )
}

export default ReportModal
