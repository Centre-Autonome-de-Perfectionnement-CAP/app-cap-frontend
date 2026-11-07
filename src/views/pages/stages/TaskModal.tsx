// src/views/pages/stages/TaskModal.tsx
// Une tâche dans le visualiseur commun (ViewerFrame) : les fichiers remis à
// gauche (PDF et images affichés, autres fichiers à télécharger), consignes,
// liens, décision et publication dans le panneau latéral.

import { useEffect, useState, type ReactNode } from 'react'
import { CButton, CFormLabel, CFormTextarea, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckAlt, cilPencil, cilTrash, cilBullhorn, cilLink } from '@coreui/icons'
import ViewerFrame from '@/components/document-request/ViewerFrame'
import { openProgressive, type Opened } from '@/components/document-request/progressiveFile'
import { saveLocalFile } from '@/utils/base64File'
import stageService, { type TaskDetail, type TaskItem } from '@/services/stage.service'
import { friendlyError, showSuccess } from '@/components/common/ActionResult'
import { frDate, frDateTime, TASK_STATUS } from './stageUtils'
import { Pill } from './StagesUi'

/** Affichables dans le visualiseur ; les autres fichiers se téléchargent. */
const PREVIEW = /\.(pdf|png|jpe?g|webp)$/i

interface Props { taskId: number | null; onClose: () => void; onChanged: () => void }

const TaskModal = ({ taskId, onClose, onChanged }: Props) => {
  const [t, setT] = useState<TaskDetail | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [file, setFile] = useState<Opened | null>(null)
  const [fileErr, setFileErr] = useState<string | null>(null)
  const [mode, setMode] = useState<'view' | 'validated' | 'revision' | 'delete'>('view')
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!taskId) { setT(null); return }
    let alive = true
    setT(null); setErr(null); setIndex(0); setMode('view')
    stageService.task(taskId).then(d => { if (alive) setT(d) }).catch(e => { if (alive) setErr(friendlyError(e)) })
    return () => { alive = false }
  }, [taskId])

  const files = t?.items.filter(i => i.kind === 'file') ?? []
  const links = t?.items.filter(i => i.kind === 'link') ?? []
  const current: TaskItem | undefined = files[index]

  // Fichier affiché : PDF et images par tranches ; les autres ne sont pas chargés.
  useEffect(() => {
    setFile(null); setFileErr(null)
    if (!t || !current || !PREVIEW.test(current.name)) return
    let alive = true
    openProgressive(`tache-${t.id}-${current.id}`, stageService.taskChunks(t.id, current.id), current.name)
      .then(f => { if (alive) setFile(f) })
      .catch(e => { if (alive) setFileErr(friendlyError(e)) })
    return () => { alive = false }
  }, [t, current])

  if (!taskId) return null

  const download = () => {
    if (!t || !current) return
    const opened = file ?? null
    ;(opened ? Promise.resolve(opened) : openProgressive(`tache-${t.id}-${current.id}`, stageService.taskChunks(t.id, current.id), current.name))
      .then(o => o.full().then(u => saveLocalFile(u, current.name)))
      .catch(e => setErr(friendlyError(e)))
  }

  const act = async (fn: () => Promise<unknown>, done: string, close = false) => {
    setBusy(true); setErr(null)
    try {
      const r: any = await fn()
      showSuccess(done)
      onChanged()
      if (close) { onClose(); return }
      if (r?.data) setT(r.data)
      setMode('view'); setText('')
    } catch (e) {
      setErr(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  const decide = () => {
    if (!t || (mode !== 'validated' && mode !== 'revision')) return
    if (mode === 'revision' && !text.trim()) { setErr('Dites ce qu\'il faut revoir.'); return }
    act(() => stageService.decideTask(t.id, mode, text.trim()), mode === 'validated' ? 'Travail validé.' : 'Demande de revoir envoyée.')
  }

  const st = t ? TASK_STATUS[t.status] : null
  const noFile = t && files.length === 0
  return (
    <ViewerFrame
      title={t ? t.title : 'Tâche'}
      badge={t && <>
        {st && <Pill color={st.color} bg={st.bg}>{t.status_label}{t.version > 1 ? ` (v${t.version})` : ''}</Pill>}
        {t.published && <Pill color="#6d28d9" bg="#f5f3ff">Publié</Pill>}
      </>}
      subtitle={t && `${t.members.map(m => m.name).join(' et ')} · ${t.due_date ? `échéance ${frDate(t.due_date)}` : 'sans échéance'}`}
      items={files.map(f => ({ id: String(f.id), label: f.name }))}
      index={index}
      onIndex={setIndex}
      loading={(!t && !err) || (!!current && PREVIEW.test(current.name) && !file && !fileErr)}
      error={!t ? err : noFile ? (t.status === 'todo' ? 'Rien n\'a encore été remis.' : 'Aucun fichier : voir les liens dans le panneau.') : fileErr}
      file={current && !PREVIEW.test(current.name)
        ? { url: null, kind: 'other' }
        : file ? { url: file.url, kind: file.kind, stream: file.stream } : null}
      onDownload={download}
      onClose={onClose}
      sidebar={t && (
        <div style={{ paddingRight: 16, paddingTop: 4, display: 'flex', flexDirection: 'column', gap: 12, fontSize: '.875rem' }}>
          <div>
            <div style={{ color: '#64748b' }}>
              {t.created_by.type === 'staff' ? `Confiée par ${t.created_by.name}` : 'Créée par le stagiaire'}
              {t.submitted_at ? ` · remise le ${frDateTime(t.submitted_at)}` : ''}
            </div>
          </div>
          {t.instructions && <Block title="Consignes">{t.instructions}</Block>}
          {t.message && <Block title="Message du stagiaire">{t.message}</Block>}
          {links.length > 0 && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Liens</div>
              {links.map(l => (
                <a key={l.id} href={l.url as string} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: 6, wordBreak: 'break-all', marginBottom: 4 }}>
                  <CIcon icon={cilLink} style={{ width: 14, flexShrink: 0 }} />{l.name}
                </a>
              ))}
            </div>
          )}
          {t.review_comment && (
            <Block title={`Commentaire${t.reviewed_by ? ` de ${t.reviewed_by}` : ''}${t.reviewed_at ? ` (${frDate(t.reviewed_at)})` : ''}`}>{t.review_comment}</Block>
          )}
          {(mode === 'validated' || mode === 'revision') && (
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
              <div style={{ fontWeight: 700 }}>{mode === 'validated' ? 'Valider ce travail' : 'Demander de revoir'}</div>
              <CFormLabel className="fw-semibold small mt-2 mb-1">
                {mode === 'validated' ? <>Commentaire <span style={{ color: '#94a3b8', fontWeight: 400 }}>(facultatif)</span></> : <>Ce qu'il faut revoir <span className="text-danger">*</span></>}
              </CFormLabel>
              <CFormTextarea rows={3} maxLength={2000} value={text} onChange={e => setText(e.target.value)} autoFocus
                placeholder={mode === 'validated' ? 'Exemple : Très bien, version validée.' : 'Exemple : Reprenez la version téléphone, le menu cache le titre.'} />
            </div>
          )}
          {mode === 'delete' && (
            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, color: '#9f1239' }}>
              Supprimer cette tâche et le travail remis ? Cette action est définitive.
            </div>
          )}
          {t.can_publish && mode === 'view' && (
            <div style={{ color: '#64748b' }}>
              {t.published
                ? 'Publié : visible de tous les stagiaires et du personnel dans « Travaux publiés ».'
                : 'Rendre public : visible de tous les stagiaires et du personnel dans « Travaux publiés », annoncé à tous le soir.'}
            </div>
          )}
          {err && t && <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#9f1239', borderRadius: 10, padding: '8px 12px' }}>{err}</div>}
        </div>
      )}
      footer={t && (mode === 'view' ? <>
        {t.can_delete && <CButton color="danger" variant="ghost" onClick={() => setMode('delete')}><CIcon icon={cilTrash} className="me-1" />Supprimer</CButton>}
        {t.can_publish && (
          <CButton color="primary" variant="outline" disabled={busy} onClick={() => act(() => stageService.publishTask(t.id, !t.published), t.published ? 'Travail retiré des travaux publiés.' : 'Travail rendu public : il sera annoncé ce soir.')}>
            <CIcon icon={cilBullhorn} className="me-1" />{t.published ? 'Retirer de la publication' : 'Rendre public'}
          </CButton>
        )}
        {t.can_review && <>
          <CButton color="warning" variant="outline" onClick={() => { setText(''); setMode('revision') }}><CIcon icon={cilPencil} className="me-1" />À revoir</CButton>
          <CButton color="success" style={{ color: '#fff' }} onClick={() => { setText(''); setMode('validated') }}><CIcon icon={cilCheckAlt} className="me-1" />Valider</CButton>
        </>}
      </> : <>
        <CButton color="secondary" variant="outline" onClick={() => { setMode('view'); setErr(null) }}>Retour</CButton>
        {mode === 'delete'
          ? <CButton color="danger" style={{ color: '#fff' }} disabled={busy} onClick={() => act(() => stageService.deleteTask(t.id), 'Tâche supprimée.', true)}>
            {busy && <CSpinner size="sm" className="me-1" />}Supprimer définitivement
          </CButton>
          : <CButton color={mode === 'validated' ? 'success' : 'warning'} style={{ color: '#fff' }} disabled={busy} onClick={decide}>
            {busy && <CSpinner size="sm" className="me-1" />}{mode === 'validated' ? 'Confirmer la validation' : 'Envoyer la demande'}
          </CButton>}
      </>)}
    />
  )
}

const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <div style={{ fontWeight: 800, marginBottom: 4 }}>{title}</div>
    <div style={{ whiteSpace: 'pre-line', background: '#f8fafc', borderRadius: 10, padding: '8px 10px' }}>{children}</div>
  </div>
)

export default TaskModal
