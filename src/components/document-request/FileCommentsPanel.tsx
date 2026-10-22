// src/components/document-request/FileCommentsPanel.tsx
//
// Commentaires sur une pièce du dossier, dans le visualiseur.
//  - tout acteur peut écrire un commentaire ;
//  - seul l'auteur voit « Modifier » / « Supprimer » sur son commentaire ;
//  - la secrétaire (et l'admin) voit en plus l'historique : versions
//    précédentes et commentaires supprimés.
// Chaque action se termine par le modal central de résultat (OK requis).

import { useEffect, useState } from 'react'
import { CSpinner } from '@coreui/react'
import documentRequestService from '@/services/document-request.service'
import { showSuccess, showError, friendlyError } from '@/components/common/ActionResult'
import type { FileComment } from './useFileComments'

const MAX = 2000

const fmt = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const btn = (kind: 'primary' | 'ghost' | 'danger'): React.CSSProperties => ({
  border: kind === 'ghost' ? '1px solid #e2e8f0' : 'none',
  background: kind === 'primary' ? '#2563eb' : kind === 'danger' ? '#dc2626' : '#fff',
  color: kind === 'ghost' ? '#334155' : '#fff',
  borderRadius: 8, padding: '6px 12px',
  fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
})

const textareaStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: '0.88rem', lineHeight: 1.5,
  border: '1.5px solid #e2e8f0', borderRadius: 10, outline: 'none',
  resize: 'vertical', fontFamily: 'inherit', color: '#0f172a', background: '#fff',
}

// ─── Un commentaire ─────────────────────────────────────────────────────────────

const CommentItem = ({ c, demandeId, historyVisible, onChanged }: {
  c: FileComment; demandeId: number; historyVisible: boolean; onChanged: () => Promise<void>
}) => {
  const [editing,   setEditing]   = useState(false)
  const [draft,     setDraft]     = useState(c.body ?? '')
  const [confirm,   setConfirm]   = useState(false)
  const [busy,      setBusy]      = useState(false)
  const [showHist,  setShowHist]  = useState(false)

  const deleted   = !!c.deleted_at
  const revisions = c.revisions ?? []

  const save = async () => {
    const body = draft.trim()
    if (!body) return
    setBusy(true)
    try {
      await documentRequestService.updateFileComment(demandeId, c.id, body)
      setEditing(false)
      await onChanged()
      await showSuccess('Commentaire modifié', 'Votre commentaire a été mis à jour.')
    } catch (e) {
      await showError('Modification impossible', friendlyError(e))
    } finally { setBusy(false) }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await documentRequestService.deleteFileComment(demandeId, c.id)
      setConfirm(false)
      await onChanged()
      await showSuccess('Commentaire supprimé', 'Votre commentaire a été retiré de ce document.')
    } catch (e) {
      await showError('Suppression impossible', friendlyError(e))
    } finally { setBusy(false) }
  }

  return (
    <div style={{
      border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px',
      background: deleted ? '#f8fafc' : c.is_mine ? '#f8fbff' : '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a' }}>
          {c.is_mine ? 'Vous' : c.author_name}
        </span>
        {c.author_role_label && (
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{c.author_role_label}</span>
        )}
      </div>
      <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: 1 }}>
        {fmt(c.created_at)}
        {c.edited_at && !deleted && <> · modifié</>}
      </div>

      {deleted ? (
        <div style={{ fontSize: '0.875rem', color: '#64748b', fontStyle: 'italic', marginTop: 8 }}>
          Commentaire supprimé par son auteur le {fmt(c.deleted_at)}.
        </div>
      ) : editing ? (
        <div style={{ marginTop: 8 }}>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value.slice(0, MAX))}
            rows={3}
            style={textareaStyle}
            autoFocus
            disabled={busy}
          />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 6 }}>
            <button type="button" style={btn('ghost')} disabled={busy}
              onClick={() => { setEditing(false); setDraft(c.body ?? '') }}>
              Annuler
            </button>
            <button type="button" style={{ ...btn('primary'), opacity: draft.trim() ? 1 : 0.5 }}
              disabled={busy || !draft.trim()} onClick={save}>
              {busy ? <CSpinner size="sm" /> : 'Enregistrer'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ fontSize: '0.88rem', color: '#1e293b', lineHeight: 1.55, marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {c.body}
        </div>
      )}

      {/* Actions de l'auteur */}
      {c.can_edit && !editing && (
        confirm ? (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
            marginTop: 10, padding: '8px 10px', borderRadius: 8, background: '#fef2f2',
          }}>
            <span style={{ fontSize: '0.875rem', color: '#991b1b', fontWeight: 600, marginRight: 'auto' }}>
              Supprimer ce commentaire ?
            </span>
            <button type="button" style={btn('ghost')} disabled={busy} onClick={() => setConfirm(false)}>Non</button>
            <button type="button" style={btn('danger')} disabled={busy} onClick={remove}>
              {busy ? <CSpinner size="sm" /> : 'Oui, supprimer'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button type="button" style={btn('ghost')} onClick={() => { setDraft(c.body ?? ''); setEditing(true) }}>
              Modifier
            </button>
            <button type="button" style={{ ...btn('ghost'), color: '#b91c1c' }} onClick={() => setConfirm(true)}>
              Supprimer
            </button>
          </div>
        )
      )}

      {/* Historique (secrétaire / admin) */}
      {historyVisible && revisions.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={() => setShowHist(v => !v)}
            style={{ border: 'none', background: 'none', padding: 0, color: '#2563eb', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
          >
            {showHist ? "Masquer l'historique" : `Voir l'historique (${revisions.length})`}
          </button>
          {showHist && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {revisions.map((r, i) => (
                <div key={i} style={{ borderLeft: '3px solid #e2e8f0', paddingLeft: 10 }}>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    {r.action === 'deleted' ? 'Supprimé' : 'Modifié'} par {r.author_name} le {fmt(r.created_at)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#475569', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {r.action === 'deleted' ? 'Texte supprimé : ' : 'Texte avant modification : '}
                    <em>{r.previous_body}</em>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Panneau ────────────────────────────────────────────────────────────────────

interface Props {
  demandeId: number
  source: string
  fileKey: string
  comments: FileComment[]
  historyVisible: boolean
  loaded: boolean
  onChanged: () => Promise<void>
}

const FileCommentsPanel = ({ demandeId, source, fileKey, comments, historyVisible, loaded, onChanged }: Props) => {
  const [draft, setDraft] = useState('')
  const [busy,  setBusy]  = useState(false)

  // Brouillon propre à chaque document
  useEffect(() => { setDraft('') }, [source, fileKey])

  const list = comments.filter(c => c.file_source === source && c.file_key === fileKey)

  const publish = async () => {
    const body = draft.trim()
    if (!body) return
    setBusy(true)
    try {
      await documentRequestService.addFileComment(demandeId, source, fileKey, body)
      setDraft('')
      await onChanged()
      await showSuccess('Commentaire publié', 'Votre commentaire est visible par les acteurs du dossier.')
    } catch (e) {
      await showError('Publication impossible', friendlyError(e))
    } finally { setBusy(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!loaded && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><CSpinner size="sm" /></div>
        )}
        {loaded && list.length === 0 && (
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem', padding: '24px 8px', lineHeight: 1.6 }}>
            Aucun commentaire sur ce document.
            <br />Écrivez le premier ci-dessous.
          </div>
        )}
        {list.map(c => (
          <CommentItem key={c.id} c={c} demandeId={demandeId} historyVisible={historyVisible} onChanged={onChanged} />
        ))}
      </div>

      <div style={{ borderTop: '1px solid #e2e8f0', padding: '12px 16px', background: '#fff' }}>
        <label htmlFor="file-comment-new" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>
          Votre commentaire
        </label>
        <textarea
          id="file-comment-new"
          value={draft}
          onChange={e => setDraft(e.target.value.slice(0, MAX))}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); void publish() } }}
          placeholder="Exemple : la date de naissance est peu lisible."
          rows={3}
          style={textareaStyle}
          disabled={busy}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Visible par tous les acteurs du dossier</span>
          <button
            type="button"
            onClick={publish}
            disabled={busy || !draft.trim()}
            style={{ ...btn('primary'), padding: '8px 16px', opacity: draft.trim() ? 1 : 0.5, cursor: draft.trim() ? 'pointer' : 'not-allowed' }}
          >
            {busy ? <CSpinner size="sm" /> : 'Publier'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default FileCommentsPanel
