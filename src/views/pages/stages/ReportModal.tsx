// src/views/pages/stages/ReportModal.tsx
// Lecture d'un rapport dans le visualiseur commun (ViewerFrame) : versions,
// échanges et décisions dans le panneau latéral ; commenter, valider ou
// demander une correction.

import { useCallback, useEffect, useState } from 'react'
import { CButton, CSpinner, CFormTextarea } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckAlt, cilPencil, cilCommentBubble } from '@coreui/icons'
import ViewerFrame from '@/components/document-request/ViewerFrame'
import { saveLocalFile } from '@/utils/base64File'
import stageService, { type ReportDetail } from '@/services/stage.service'
import { showSuccess, friendlyError } from '@/components/common/ActionResult'
import { frDateTime } from './stageUtils'
import { Pill } from './StagesUi'

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

  const download = useCallback(() => { if (file) saveLocalFile(file.url, file.name) }, [file])

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
    ...d.versions.map(v => ({ at: v.at, el: <><strong>Version {v.version}</strong> déposée{v.late ? ' (en retard)' : ''}{v.post_defense ? ' - corrigée après soutenance' : ''}{v.note ? <div style={{ whiteSpace: 'pre-line' }}>{v.note}</div> : null}</> })),
    ...d.comments.map(c => ({ at: c.at, el: <><strong>{c.author === 'staff' ? c.name : 'Stagiaire'}</strong> <span className="text-muted">(v{c.version})</span><div style={{ whiteSpace: 'pre-line' }}>{c.body}</div></> })),
    ...d.reviews.map(r => ({ at: r.at, el: <><strong style={{ color: r.decision === 'approved' ? '#059669' : '#ea580c' }}>{r.decision === 'approved' ? 'Validé' : 'À corriger'}</strong> par {r.name} ({r.role}, v{r.version}){r.comment ? <div style={{ whiteSpace: 'pre-line' }}>{r.comment}</div> : null}</> })),
  ].sort((a, b) => a.at.localeCompare(b.at)) : []

  if (reportId === null) return null

  // Versions, de la plus récente à la plus ancienne
  const versions = d ? [...d.versions].reverse() : []
  const vIndex = Math.max(0, versions.findIndex(v => v.version === version))

  return (
    <ViewerFrame
      title={d ? `${d.label} - ${d.stage?.nom_complet ?? ''}` : 'Rapport'}
      badge={d && <>
        {st && <Pill color={st.color} bg={st.bg}>{d.status_label}</Pill>}
        {d.late && <Pill color="#b45309" bg="#fef3c7">En retard</Pill>}
        {d.correction_status === 'pending' && <Pill color="#1d4ed8" bg="#dbeafe">Version corrigée après soutenance à relire</Pill>}
      </>}
      items={versions.map(v => ({
        id: String(v.version),
        label: `Version ${v.version}${v.post_defense ? ' - après soutenance' : ''}${v.version === d?.official_version ? ' (officielle)' : v.version === d?.current_version ? ' (actuelle)' : ''}`,
      }))}
      index={vIndex}
      onIndex={i => setVersion(versions[i]?.version ?? version)}
      loading={(!d && !err) || (!!d && !file && !fileErr)}
      error={d ? fileErr : err}
      file={file ? { url: file.url, kind: 'pdf' } : null}
      onDownload={download}
      onClose={onClose}
      sidebar={d && (
        <div style={{ paddingRight: 16, paddingTop: 4 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>Historique</div>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {events.map((e, i) => (
              <li key={i} style={{ fontSize: '.875rem', background: '#f8fafc', borderRadius: 10, padding: '8px 10px' }}>
                {e.el}
                <div style={{ fontSize: '.875rem', color: '#64748b', marginTop: 2 }}>{frDateTime(e.at)}</div>
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
              <div style={{ fontWeight: 700 }}>{d.correction_status === 'pending'
                ? (mode === 'approved' ? 'Valider la version corrigée' : 'Ne pas retenir la version corrigée')
                : (mode === 'approved' ? 'Valider ce rapport' : 'Demander une correction')}</div>
              {d.correction_status === 'pending' && (
                <div style={{ fontSize: '.875rem', color: '#475569', marginTop: 4 }}>
                  Le rapport reste validé dans tous les cas (attestation comprise). Validée, cette version devient la version officielle.
                </div>
              )}
              <CFormTextarea className="mt-2" rows={3} maxLength={2000} value={text} onChange={e => setText(e.target.value)} autoFocus
                placeholder={mode === 'approved' ? 'Commentaire (facultatif)' : 'Ce qui doit être corrigé (obligatoire)'} />
            </div>
          )}
          {err && <div style={{ marginTop: 10, background: '#fff1f2', border: '1px solid #fecdd3', color: '#9f1239', borderRadius: 10, padding: '8px 12px', fontSize: '.875rem' }}>{err}</div>}
        </div>
      )}
      footer={d && (mode === 'view' ? <>
        <CButton color="warning" variant="outline" onClick={() => { setText(''); setMode('rejected') }}><CIcon icon={cilPencil} className="me-1" />À corriger</CButton>
        <CButton color="success" style={{ color: '#fff' }} onClick={() => { setText(''); setMode('approved') }}><CIcon icon={cilCheckAlt} className="me-1" />Valider</CButton>
      </> : <>
        <CButton color="secondary" variant="outline" onClick={() => { setMode('view'); setErr(null) }}>Retour</CButton>
        <CButton color={mode === 'approved' ? 'success' : 'warning'} style={{ color: '#fff' }} disabled={busy} onClick={decide}>
          {busy && <CSpinner size="sm" className="me-1" />}{mode === 'approved' ? 'Confirmer la validation' : 'Envoyer la demande de correction'}
        </CButton>
      </>)}
    />
  )
}

export default ReportModal
