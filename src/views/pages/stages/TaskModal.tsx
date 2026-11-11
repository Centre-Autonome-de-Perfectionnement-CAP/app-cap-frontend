// src/views/pages/stages/TaskModal.tsx
// Une tâche dans le visualiseur commun (ViewerFrame) : les fichiers remis à
// gauche (PDF et images affichés, autres fichiers à télécharger), consignes,
// liens, invités, décision et publication dans le panneau latéral.

import { useEffect, useState, type ReactNode } from 'react'
import { CButton, CFormCheck, CFormLabel, CFormTextarea, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckAlt, cilPencil, cilTrash, cilBullhorn, cilLink, cilUserPlus, cilX } from '@coreui/icons'
import ViewerFrame from '@/components/document-request/ViewerFrame'
import { openProgressive, type Opened } from '@/components/document-request/progressiveFile'
import { saveLocalFile } from '@/utils/base64File'
import stageService, { type TaskDetail, type TaskInvitables, type TaskInvite, type TaskItem } from '@/services/stage.service'
import { friendlyError, showSuccess } from '@/components/common/ActionResult'
import { frDate, frDateTime, frDue, TASK_STATUS } from './stageUtils'
import { Pill } from './StagesUi'
import PersonPicker from './PersonPicker'

/** Affichables dans le visualiseur ; les autres fichiers se téléchargent. */
const PREVIEW = /\.(pdf|png|jpe?g|webp)$/i

interface Props { taskId: number | null; onClose: () => void; onChanged: () => void }

const TaskModal = ({ taskId, onClose, onChanged }: Props) => {
  const [t, setT] = useState<TaskDetail | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [index, setIndex] = useState(0)
  const [file, setFile] = useState<Opened | null>(null)
  const [fileErr, setFileErr] = useState<string | null>(null)
  const [mode, setMode] = useState<'view' | 'validated' | 'revision' | 'delete' | 'invite'>('view')
  const [invite, setInvite] = useState<InviteForm>(NEW_INVITE)
  const [invitables, setInvitables] = useState<TaskInvitables | null>(null)
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

  const openInvite = () => {
    setInvite(NEW_INVITE); setErr(null); setMode('invite')
    if (!invitables) stageService.taskInvitables().then(setInvitables).catch(e => setErr(friendlyError(e)))
  }
  const sendInvite = () => {
    if (!t) return
    const id = invite.id
    if (!id) { setErr('Choisissez la personne à inviter.'); return }
    act(() => stageService.inviteTask(t.id, invite.type === 'intern'
      ? { type: 'intern', id, role: invite.role, counts: invite.role === 'worker' && invite.counts }
      : { type: 'staff', id, full_power: invite.fullPower }), 'Invitation envoyée : la personne est prévenue.')
  }
  const removeInvite = (i: TaskInvite) => {
    if (t) act(() => stageService.uninviteTask(t.id, i.type, i.id), `${i.name} n'est plus invité.`)
  }
  // Ni les titulaires de la tâche, ni la personne déjà invitée avec les mêmes droits ne sont proposés deux fois : réinviter met à jour les droits.
  const owners = new Set(t?.members.filter(m => !t.invited.some(i => i.type === 'intern' && i.id === m.id)).map(m => m.id))

  const st = t ? TASK_STATUS[t.status] : null
  const noFile = t && files.length === 0
  return (
    <ViewerFrame
      title={t ? t.title : 'Tâche'}
      badge={t && <>
        {st && <Pill color={st.color} bg={st.bg}>{t.status_label}{t.version > 1 ? ` (v${t.version})` : ''}</Pill>}
        {t.published && <Pill color="#6d28d9" bg="#f5f3ff">Publié</Pill>}
      </>}
      subtitle={t && `${t.members.map(m => m.name).join(' et ')} · ${t.due_date ? `échéance ${frDue(t.due_date, t.due_time)}` : 'sans échéance'}`}
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
          {(t.invited.length > 0 || t.can_invite) && mode !== 'invite' && (
            <div>
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Invités</div>
              {t.invited.length === 0 && <div style={{ color: '#64748b' }}>Personne pour le moment. Bouton « Inviter » en bas : un stagiaire ou un superviseur.</div>}
              {t.invited.map(i => (
                <div key={`${i.type}-${i.id}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{i.name}</div>
                    <div style={{ color: '#64748b' }}>{inviteLabel(i)}</div>
                  </div>
                  {t.can_invite && (
                    <button type="button" className="btn btn-sm btn-ghost-secondary" title={`Retirer ${i.name}`} aria-label={`Retirer ${i.name}`} disabled={busy} onClick={() => removeInvite(i)}>
                      <CIcon icon={cilX} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {mode === 'invite' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: 800 }}>Inviter sur la tâche</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['intern', 'staff'] as const).map(k => (
                  <CButton key={k} size="sm" color="primary" variant={invite.type === k ? undefined : 'outline'} style={{ flex: 1 }}
                    onClick={() => setInvite({ ...NEW_INVITE, type: k })}>
                    {k === 'intern' ? 'Un stagiaire' : 'Le personnel'}
                  </CButton>
                ))}
              </div>
              <CFormLabel className="fw-semibold small mb-0">{invite.type === 'intern' ? 'Stagiaire' : 'Membre du personnel'} <span className="text-danger">*</span></CFormLabel>
              <PersonPicker key={invite.type} value={invite.id} onChange={id => setInvite({ ...invite, id })}
                people={invitables ? (invite.type === 'intern' ? invitables.interns.filter(p => !owners.has(p.id)) : invitables.staff) : null}
                placeholder={invite.type === 'intern' ? 'Exemple : AKODOGBO' : 'Exemple : ADJOVI'} />
              {invite.type === 'intern' ? <>
                <CFormCheck type="radio" name="inv-role" id="inv-viewer" label="Pour voir la tâche et le travail remis" checked={invite.role === 'viewer'} onChange={() => setInvite({ ...invite, role: 'viewer' })} />
                <CFormCheck type="radio" name="inv-role" id="inv-worker" label="Pour y travailler (il peut remettre le travail)" checked={invite.role === 'worker'} onChange={() => setInvite({ ...invite, role: 'worker' })} />
                {invite.role === 'worker' && t.can_grant && (
                  <CFormCheck id="inv-counts" className="ms-4" label="Le travail compte aussi pour lui (il en est auteur)" checked={invite.counts} onChange={e => setInvite({ ...invite, counts: e.target.checked })} />
                )}
              </> : t.can_grant ? <>
                <CFormCheck type="radio" name="inv-power" id="inv-see" label="Pour suivre la tâche (sans décision)" checked={!invite.fullPower} onChange={() => setInvite({ ...invite, fullPower: false })} />
                <CFormCheck type="radio" name="inv-power" id="inv-full" label="Plein pouvoir : valider, demander de revoir, publier et inviter" checked={invite.fullPower} onChange={() => setInvite({ ...invite, fullPower: true })} />
              </> : <div style={{ color: '#64748b' }}>Il pourra suivre la tâche, sans décision.</div>}
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
        {t.can_invite && (
          <CButton color="secondary" variant="outline" onClick={openInvite}><CIcon icon={cilUserPlus} className="me-1" />Inviter</CButton>
        )}
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
        {mode === 'invite' ? (
          <CButton color="primary" disabled={busy || !invite.id} onClick={sendInvite}>
            {busy && <CSpinner size="sm" className="me-1" />}Inviter
          </CButton>
        ) : mode === 'delete'
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

interface InviteForm { type: 'intern' | 'staff'; id: number | null; role: 'viewer' | 'worker'; counts: boolean; fullPower: boolean }
const NEW_INVITE: InviteForm = { type: 'intern', id: null, role: 'viewer', counts: false, fullPower: false }

const inviteLabel = (i: TaskInvite) => {
  const what = i.type === 'staff'
    ? (i.full_power ? 'Personnel, plein pouvoir' : 'Personnel, pour suivre')
    : i.role === 'worker' ? `Pour y travailler${i.counts ? ', compte pour lui' : ''}` : 'Pour voir'
  return i.invited_by ? `${what} · invité par ${i.invited_by}` : what
}

const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <div>
    <div style={{ fontWeight: 800, marginBottom: 4 }}>{title}</div>
    <div style={{ whiteSpace: 'pre-line', background: '#f8fafc', borderRadius: 10, padding: '8px 10px' }}>{children}</div>
  </div>
)

export default TaskModal
