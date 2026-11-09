// src/views/pages/stages/MessagesPage.tsx
// Messagerie de stage (progiciel) : « Mes stagiaires » (superviseur et ses
// stagiaires, visible par eux seuls) et la discussion générale. Texte, pièces
// jointes, réponse à un message, modification de ses messages, « vu par » ; tout s'efface après
// 7 jours. Liste à gauche, fil à droite (un seul volet sur petit écran) ; aucune discussion
// ouverte par défaut, et on peut en sortir. Rafraîchi tant que la page est visible.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CModal, CModalBody, CModalHeader, CModalTitle, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilX, cilLockLocked, cilSend, cilInfo, cilPaperclip, cilShareAlt, cilPencil } from '@coreui/icons'
import stageService, { type ChatChannel, type ChatFile, type ChatMessage, type ChatSeen, type ChatThread } from '@/services/stage.service'
import { friendlyError } from '@/components/common/ActionResult'
import { PageHead, StagesStyles } from './StagesUi'

const POLL_LIST_MS = 30_000
const POLL_THREAD_MS = 8_000

/** Rafraîchit tant que l'onglet est visible (et tout de suite au retour). */
const useVisiblePoll = (fn: () => void, ms: number) => {
  const ref = useRef(fn)
  useEffect(() => { ref.current = fn }, [fn])
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') ref.current() }
    const id = window.setInterval(tick, ms)
    document.addEventListener('visibilitychange', tick)
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', tick) }
  }, [ms])
}

const time = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
const dayLabel = (iso: string) => {
  const d = new Date(iso), today = new Date(), y = new Date(); y.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (d.toDateString() === y.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}
const listTime = (iso: string) => {
  const d = new Date(iso), y = new Date(); y.setDate(y.getDate() - 1)
  if (d.toDateString() === new Date().toDateString()) return time(iso)
  return d.toDateString() === y.toDateString() ? 'Hier' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
const TONES = ['#326761', '#c2410c', '#4338ca', '#be185d', '#0369a1', '#b45309']
const tone = (key: string) => TONES[[...key].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length]

const MessagesPage = () => {
  const { channel } = useParams()
  const [list, setList] = useState<{ channels: ChatChannel[]; keep_days: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadList = useCallback(() => {
    stageService.chatList().then(d => { setList(d); setError(null) }).catch(e => setError(friendlyError(e)))
  }, [])
  useEffect(loadList, [loadList, channel])
  useVisiblePoll(loadList, POLL_LIST_MS)

  const groups = list?.channels.filter(c => c.kind === 'group') ?? []
  const general = list?.channels.filter(c => c.kind === 'general') ?? []

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead title="Messages" subtitle={`Messages et pièces jointes s'effacent après ${list?.keep_days ?? 7} jours`} />
      {error && !list && <div className="stg-err">{error}</div>}
      <div className="msg-wrap" data-open={channel ? '1' : '0'}>
        <aside className="msg-list">
          <div className="msg-lh">Discussions</div>
          {!list && !error && <div className="msg-loading"><CSpinner size="sm" color="primary" />Chargement…</div>}
          {groups.length > 0 && <p className="msg-sect">Mon groupe</p>}
          {groups.map(c => <ChannelRow key={c.key} c={c} active={c.key === channel} />)}
          {general.length > 0 && <p className="msg-sect">Tout le CAP</p>}
          {general.map(c => <ChannelRow key={c.key} c={c} active={c.key === channel} />)}
        </aside>
        <section className="msg-pane">
          {channel
            ? <Thread key={channel} channel={channel} onRead={loadList} />
            : <div className="msg-empty"><CIcon icon={cilInfo} style={{ width: 28, color: '#94a3b8' }} />Choisissez une discussion.</div>}
        </section>
      </div>
      <MessagesStyles />
    </div>
  )
}

const ChannelRow = ({ c, active }: { c: ChatChannel; active: boolean }) => {
  const navigate = useNavigate()
  return (
    <button type="button" className="msg-li" data-on={active ? '1' : '0'} onClick={() => navigate(`/stages/messages/${c.key}`)}>
      <span className="msg-av" data-kind={c.kind}>{c.kind === 'general' ? 'CAP' : 'G'}</span>
      <span className="msg-li-main">
        <strong>{c.title}</strong>
        <span>{c.last ? `${c.last.who} : ${c.last.body}` : 'Aucun message'}</span>
      </span>
      <span className="msg-li-side">
        {c.last ? listTime(c.last.at) : ''}
        {c.unread > 0 && <span className="msg-nb">{c.unread}</span>}
      </span>
    </button>
  )
}

const ACCEPT = '.pdf,.doc,.docx,.zip,.jpg,.jpeg,.png,.webp'
const MAX_FILES = 3
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = /\.(pdf|docx?|zip|jpe?g|png|webp)$/i
const sizeLabel = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} Ko` : `${(b / 1024 / 1024).toFixed(1).replace('.', ',')} Mo`)
const extOf = (name: string) => (name.split('.').pop() ?? '').toUpperCase().slice(0, 4)
const initials = (s: string) => s.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()

const Thread = ({ channel, onRead }: { channel: string; onRead: () => void }) => {
  const navigate = useNavigate()
  const [thread, setThread] = useState<ChatThread | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const [editing, setEditing] = useState<ChatMessage | null>(null)
  const [sending, setSending] = useState(false)
  const [older, setOlder] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const picker = useRef<HTMLInputElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const stick = useRef(true)
  const scrollDown = () => requestAnimationFrame(() => { const el = box.current; if (el) el.scrollTop = el.scrollHeight })

  useEffect(() => {
    stageService.chatThread(channel)
      .then(d => { setThread(d); scrollDown(); onRead() })
      .catch(e => setError(friendlyError(e)))
  }, [channel]) // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = useCallback(async () => {
    if (!thread) return
    const last = thread.messages[thread.messages.length - 1]?.id
    try {
      const d = await stageService.chatThread(channel, last ? { after: last } : {})
      const edits = new Map((d.edits ?? []).map(e => [e.id, e.body]))
      setThread(t => t && {
        ...t, seen: d.seen ?? t.seen,
        messages: last
          ? [...t.messages.map(m => (edits.has(m.id) ? { ...m, body: edits.get(m.id)!, edited: true } : m)),
            ...d.messages.filter(m => !t.messages.some(x => x.id === m.id))]
          : d.messages,
      })
      if (d.messages.length && stick.current) scrollDown()
    } catch { /* nouvel essai au prochain passage */ }
  }, [channel, thread])
  useVisiblePoll(refresh, POLL_THREAD_MS)

  const loadOlder = async () => {
    if (!thread?.messages.length) return
    setOlder(true)
    const el = box.current, before = el?.scrollHeight ?? 0
    try {
      const d = await stageService.chatThread(channel, { before: thread.messages[0].id })
      setThread(t => t && { ...t, has_more: d.has_more, messages: [...d.messages, ...t.messages] })
      requestAnimationFrame(() => { if (el) el.scrollTop = el.scrollHeight - before })
    } catch (e) { setError(friendlyError(e)) } finally { setOlder(false) }
  }

  const pick = (list: FileList | null) => {
    if (!list?.length) return
    const room = MAX_FILES - files.length
    const ok: File[] = []
    for (const f of Array.from(list)) {
      if (ok.length >= room) { setError('Trois fichiers au plus par message.'); break }
      if (!ALLOWED.test(f.name)) { setError('Fichiers acceptés : PDF, Word, ZIP et images.'); continue }
      if (f.size === 0 || f.size > MAX_BYTES) { setError(`« ${f.name} » est vide ou dépasse 5 Mo.`); continue }
      ok.push(f)
    }
    setFiles(prev => [...prev, ...ok])
    if (picker.current) picker.current.value = ''
  }

  const send = async () => {
    const body = text.trim()
    if (editing) return saveEdit(body)
    if ((!body && !files.length) || sending) return
    setSending(true); setError(null)
    try {
      await stageService.chatSend(channel, { body, files, replyTo: replyTo?.id })
      setText(''); setFiles([]); setReplyTo(null); stick.current = true
      await refresh(); scrollDown()
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setSending(false)
    }
  }

  const saveEdit = async (body: string) => {
    if (!editing || sending) return
    if (!body && !editing.files.length) { setError('Le message ne peut pas être vide.'); return }
    setSending(true); setError(null)
    try {
      await stageService.chatEdit(channel, editing.id, body)
      const id = editing.id
      setThread(t => t && { ...t, messages: t.messages.map(m => (m.id === id && m.body !== body ? { ...m, body, edited: true } : m)) })
      setEditing(null); setText('')
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setSending(false)
    }
  }
  const startEdit = (m: ChatMessage) => { setReplyTo(null); setFiles([]); setEditing(m); setText(m.body); input.current?.focus() }
  const cancelEdit = () => { setEditing(null); setText('') }

  const quote = (m: ChatMessage) => { cancelEdit(); setReplyTo(m); input.current?.focus() }
  const jump = (id: number) => {
    const el = document.getElementById(`msg-${id}`)
    if (!el) return
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    el.classList.add('msg-flash'); window.setTimeout(() => el.classList.remove('msg-flash'), 1400)
  }

  if (!thread) return error
    ? <div style={{ padding: 16 }}><div className="stg-err">{error}</div></div>
    : <div className="msg-loading"><CSpinner size="sm" color="primary" />Chargement de la discussion…</div>

  const c = thread.channel
  const unreadCount = thread.first_unread_id ? thread.messages.filter(m => m.id >= thread.first_unread_id! && !m.mine).length : 0
  return (
    <>
      <header className="msg-th">
        <span className="msg-av" data-kind={c.kind}>{c.kind === 'general' ? 'CAP' : 'G'}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <strong>{c.title}</strong>
          <small>{c.subtitle}</small>
        </div>
        {c.kind === 'group' && <span className="msg-lock"><CIcon icon={cilLockLocked} style={{ width: 14 }} />Privé</span>}
        <button type="button" className="msg-back" onClick={() => navigate('/stages/messages')} aria-label="Fermer la discussion" title="Fermer la discussion">
          <CIcon icon={cilX} />
        </button>
      </header>

      <div ref={box} className="msg-body" onScroll={e => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80 }}>
        {thread.has_more && (
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <button type="button" className="msg-older" onClick={loadOlder} disabled={older}>{older ? 'Chargement…' : 'Messages précédents'}</button>
          </div>
        )}
        {thread.messages.length === 0 && <p className="msg-none">Aucun message. Écrivez le premier !</p>}
        {thread.messages.map((m, i) => {
          const prev = thread.messages[i - 1]
          const newDay = !prev || dayLabel(prev.at) !== dayLabel(m.at)
          const sameRun = !!prev && !newDay && prev.sender.key === m.sender.key && new Date(m.at).getTime() - new Date(prev.at).getTime() < 5 * 60_000
          return (
            <div key={m.id} className="msg-row">
              {newDay && <span className="msg-day">{dayLabel(m.at)}</span>}
              {m.id === thread.first_unread_id && <div className="msg-unread">{unreadCount > 1 ? `${unreadCount} nouveaux messages` : 'Nouveau message'}</div>}
              {!m.mine && !sameRun && (
                <p className="msg-who" style={{ color: tone(m.sender.key) }}>
                  {m.sender.name}{m.sender.role && <span className="msg-role">{m.sender.role}</span>}
                </p>
              )}
              <div className="msg-line" data-mine={m.mine ? '1' : '0'}>
                <div id={`msg-${m.id}`} className="msg-b" data-mine={m.mine ? '1' : '0'} data-run={sameRun ? '1' : '0'}>
                  {m.reply && (
                    <button type="button" className="msg-quote" onClick={() => { if (!m.reply?.deleted) jump(m.reply!.id) }}>
                      {m.reply.deleted ? <i>Message effacé</i> : <><b>{m.reply.name}</b><span>{m.reply.body || 'Pièce jointe'}</span></>}
                    </button>
                  )}
                  {m.body}
                  {m.files.map(f => <Attachment key={f.id} channel={channel} f={f} mine={m.mine} onError={setError} />)}
                  <span className="msg-tm">{m.edited ? 'modifié · ' : ''}{time(m.at)}</span>
                </div>
                <button type="button" className="msg-reply" onClick={() => quote(m)} aria-label="Répondre à ce message" title="Répondre">
                  <CIcon icon={cilShareAlt} style={{ width: 16, transform: 'scaleX(-1)' }} />
                </button>
                {m.mine && (
                  <button type="button" className="msg-reply" onClick={() => startEdit(m)} aria-label="Modifier ce message" title="Modifier">
                    <CIcon icon={cilPencil} style={{ width: 16 }} />
                  </button>
                )}
              </div>
              {m.mine && thread.seen?.id === m.id && <SeenBy seen={thread.seen} />}
            </div>
          )
        })}
      </div>

      {error && <div style={{ padding: '8px 12px 0' }}><div className="stg-err">{error}</div></div>}
      {editing && (
        <div className="msg-replying">
          <div style={{ minWidth: 0, flex: 1 }}>
            <b>Modification du message</b>
            <span>{editing.body || 'Pièce jointe'}</span>
          </div>
          <button type="button" className="msg-x" onClick={cancelEdit} aria-label="Annuler la modification">×</button>
        </div>
      )}
      {replyTo && (
        <div className="msg-replying">
          <div style={{ minWidth: 0, flex: 1 }}>
            <b>Réponse à {replyTo.mine ? 'vous-même' : replyTo.sender.name}</b>
            <span>{replyTo.body || 'Pièce jointe'}</span>
          </div>
          <button type="button" className="msg-x" onClick={() => setReplyTo(null)} aria-label="Annuler la réponse">×</button>
        </div>
      )}
      {files.length > 0 && (
        <div className="msg-chips">
          {files.map((f, i) => (
            <span key={`${f.name}-${i}`} className="msg-chip">
              <span className="msg-chip-n">{f.name}</span><span style={{ color: '#94a3b8' }}>{sizeLabel(f.size)}</span>
              <button type="button" className="msg-x" onClick={() => setFiles(prev => prev.filter((_, k) => k !== i))} aria-label={`Retirer ${f.name}`}>×</button>
            </span>
          ))}
        </div>
      )}
      <div className="msg-comp">
        <input ref={picker} type="file" multiple accept={ACCEPT} hidden onChange={e => pick(e.target.files)} />
        <button type="button" className="msg-clip" onClick={() => picker.current?.click()} disabled={files.length >= MAX_FILES || sending || !!editing}
          aria-label="Joindre un fichier" title="PDF, Word, ZIP, images ; 5 Mo au plus, 3 fichiers">
          <CIcon icon={cilPaperclip} style={{ width: 20 }} />
        </button>
        <label htmlFor="msg-input" className="visually-hidden">Votre message</label>
        <textarea ref={input} id="msg-input" rows={1} maxLength={2000} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            if (e.key === 'Escape' && editing) cancelEdit()
          }}
          placeholder={c.kind === 'group' ? 'Écrire un message à vos stagiaires…' : 'Écrire un message à tous…'}
          style={{ height: Math.min(132, 44 + Math.max(0, text.split('\n').length - 1) * 21) }} />
        <button type="button" className="msg-send" onClick={send} disabled={(!text.trim() && !files.length && !editing?.files.length) || sending}
          aria-label={editing ? 'Enregistrer la modification' : 'Envoyer'}>
          {sending ? <CSpinner size="sm" /> : <CIcon icon={cilSend} />}
        </button>
      </div>
      <p className="msg-hint">Entrée pour envoyer, Maj + Entrée pour aller à la ligne. Survolez un message pour y répondre ou modifier le vôtre.</p>
    </>
  )
}

/** Pièce jointe : aperçu pour une image (chargé à l'affichage), carte à télécharger sinon. */
const Attachment = ({ channel, f, mine, onError }: { channel: string; f: ChatFile; mine: boolean; onError: (m: string) => void }) => {
  const [src, setSrc] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!f.image) return
    let url: string | null = null, alive = true
    stageService.chatFile(channel, f.id).then(u => { url = u; if (alive) setSrc(u); else URL.revokeObjectURL(u) }).catch(() => {})
    return () => { alive = false; if (url) URL.revokeObjectURL(url) }
  }, [channel, f.id, f.image])

  const open = async () => {
    if (busy) return
    setBusy(true)
    try {
      const url = src ?? await stageService.chatFile(channel, f.id)
      const a = document.createElement('a')
      a.href = url; a.download = f.name; a.rel = 'noopener'
      if (f.image) a.target = '_blank'
      a.click()
      if (!src) window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (e) { onError(friendlyError(e)) } finally { setBusy(false) }
  }

  if (f.image) {
    return (
      <button type="button" className="msg-img" onClick={open} aria-label={`Ouvrir l'image ${f.name}`}>
        {src ? <img src={src} alt={f.name} /> : <span>Image…</span>}
      </button>
    )
  }
  return (
    <button type="button" className="msg-file" data-mine={mine ? '1' : '0'} onClick={open} disabled={busy}>
      <span className="msg-ext">{extOf(f.name)}</span>
      <span style={{ minWidth: 0, flex: 1 }}><b>{f.name}</b><small>{busy ? 'Ouverture…' : sizeLabel(f.size)}</small></span>
    </button>
  )
}

/** Pastilles « vu par » sous mon dernier message ; au clic, la liste avec l'heure. */
/**
 * « Vu par » : quelques pastilles sous le dernier message ; la liste
 * complète (tous les noms, heure de lecture) s'ouvre dans une fenêtre qui
 * défile, jamais coupée par la conversation.
 */
const SeenBy = ({ seen }: { seen: ChatSeen }) => {
  const [open, setOpen] = useState(false)
  if (!seen.by.length) return null
  const n = seen.by.length
  return (
    <div className="msg-seen">
      <button type="button" className="msg-seen-btn" onClick={() => setOpen(true)} aria-label={`Vu par ${n} personne${n > 1 ? 's' : ''} : voir les noms`}>
        {seen.by.slice(0, 5).map(p => <span key={p.key} style={{ background: tone(p.key) }} title={p.name}>{initials(p.name)}</span>)}
        <em>{n === 1 ? `Vu par ${seen.by[0].name}` : `Vu par ${n}`}</em>
      </button>
      <CModal visible={open} onClose={() => setOpen(false)} alignment="center" scrollable>
        <CModalHeader><CModalTitle style={{ fontSize: '1rem' }}>Vu par {n} personne{n > 1 ? 's' : ''}</CModalTitle></CModalHeader>
        <CModalBody style={{ padding: '6px 12px 12px' }}>
          {seen.by.map(p => (
            <div key={p.key} className="msg-seen-row">
              <span className="msg-seen-av" style={{ background: tone(p.key) }} aria-hidden="true">{initials(p.name)}</span>
              <span className="msg-seen-name">{p.name}</span>
              <span className="msg-seen-at">{p.at ? listTime(p.at) : ''}</span>
            </div>
          ))}
        </CModalBody>
      </CModal>
    </div>
  )
}

const MessagesStyles = () => (
  <style>{`
    .msg-wrap { display: grid; grid-template-columns: 320px minmax(0, 1fr); gap: 14px; height: calc(100vh - 230px); min-height: 480px; }
    .msg-list, .msg-pane { background: #fff; border: 1px solid #e6ebf2; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; min-height: 0; }
    .msg-list { overflow-y: auto; }
    .msg-lh { padding: 13px 16px; border-bottom: 1px solid #eef2f6; font-weight: 800; font-size: .95rem; }
    .msg-sect { font-size: .875rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; color: #64748b; padding: 12px 16px 4px; margin: 0; }
    .msg-li { all: unset; box-sizing: border-box; display: flex; gap: 10px; align-items: center; width: 100%; padding: 11px 14px; border-left: 3px solid transparent; cursor: pointer; }
    .msg-li:hover { background: #f8fafc; }
    .msg-li[data-on='1'] { background: #eaf3f1; border-left-color: #326761; }
    .msg-li-main { min-width: 0; flex: 1; display: flex; flex-direction: column; font-size: .875rem; }
    .msg-li-main strong { font-size: .9rem; color: #0f172a; }
    .msg-li-main span { color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .msg-li-side { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; font-size: .875rem; color: #64748b; white-space: nowrap; }
    .msg-nb { min-width: 22px; height: 22px; border-radius: 11px; background: #326761; color: #fff; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; padding: 0 6px; }
    .msg-av { width: 40px; height: 40px; border-radius: 12px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: .875rem; background: #eaf3f1; color: #326761; }
    .msg-av[data-kind='general'] { background: #eef2ff; color: #4338ca; }
    .msg-th { display: flex; align-items: center; gap: 12px; padding: 11px 16px; border-bottom: 1px solid #eef2f6; }
    .msg-th strong { display: block; font-size: .95rem; }
    .msg-th small { display: block; color: #64748b; font-size: .875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .msg-back { all: unset; cursor: pointer; display: inline-flex; width: 34px; height: 34px; border-radius: 10px; align-items: center; justify-content: center; color: #475569; flex-shrink: 0; }
    .msg-back:hover { background: #f1f5f9; }
    .msg-lock { margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: .875rem; color: #64748b; background: #f8fafc; border: 1px solid #e6ebf2; border-radius: 999px; padding: 3px 10px; white-space: nowrap; }
    .msg-body { flex: 1; overflow-y: auto; background: #f6f8f7; padding: 14px 22px; display: flex; flex-direction: column; }
    .msg-row { display: flex; flex-direction: column; }
    .msg-day { align-self: center; font-size: .875rem; font-weight: 700; color: #64748b; background: #fff; border: 1px solid #e6ebf2; border-radius: 999px; padding: 2px 10px; margin: 8px 0; }
    .msg-unread { display: flex; align-items: center; gap: 8px; color: #326761; font-size: .875rem; font-weight: 700; margin: 8px 0; }
    .msg-unread::before, .msg-unread::after { content: ''; flex: 1; height: 1px; background: rgba(50, 103, 97, .35); }
    .msg-who { font-size: .875rem; font-weight: 700; margin: 10px 0 2px 4px; }
    .msg-role { margin-left: 6px; font-size: .875rem; font-weight: 700; color: #fff; background: #326761; border-radius: 6px; padding: 0 6px; }
    .msg-b { max-width: 62%; padding: 8px 12px; border-radius: 16px; font-size: .9rem; line-height: 1.4; white-space: pre-wrap; overflow-wrap: anywhere; margin-top: 3px; }
    .msg-b[data-mine='0'] { align-self: flex-start; background: #fff; border: 1px solid #e6ebf2; border-bottom-left-radius: 6px; }
    .msg-b[data-mine='0'][data-run='1'] { border-top-left-radius: 6px; }
    .msg-b[data-mine='1'] { align-self: flex-end; background: #326761; color: #fff; border-bottom-right-radius: 6px; }
    .msg-b[data-mine='1'][data-run='1'] { border-top-right-radius: 6px; }
    .msg-b[data-mine='1'][data-run='0'] { margin-top: 10px; }
    .msg-tm { display: block; text-align: right; font-size: .875rem; opacity: .7; margin-top: 2px; }
    .msg-comp { display: flex; gap: 8px; align-items: flex-end; padding: 10px 12px 4px; border-top: 1px solid #eef2f6; }
    .msg-comp textarea { flex: 1; resize: none; min-height: 44px; max-height: 132px; border: 1px solid #cbd5e1; border-radius: 22px; padding: 11px 16px; font-size: .9rem; line-height: 1.35; background: #f8fafc; outline: none; }
    .msg-comp textarea:focus { border-color: #326761; background: #fff; box-shadow: 0 0 0 1px #326761; }
    .msg-send { all: unset; cursor: pointer; width: 44px; height: 44px; border-radius: 22px; background: #326761; color: #fff; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .msg-send:disabled { opacity: .4; cursor: not-allowed; }
    .msg-hint { margin: 0; padding: 2px 16px 10px; color: #94a3b8; font-size: .875rem; }
    .msg-older { all: unset; cursor: pointer; font-size: .875rem; font-weight: 700; color: #326761; background: #fff; border: 1px solid #e6ebf2; border-radius: 999px; padding: 3px 12px; }
    .msg-none, .msg-empty { margin: auto; color: #64748b; font-size: .9rem; display: flex; flex-direction: column; align-items: center; gap: 8px; }
    .msg-loading { display: flex; gap: 8px; align-items: center; justify-content: center; padding: 24px; color: #64748b; font-size: .9rem; }
    .msg-line { display: flex; align-items: center; gap: 6px; }
    .msg-line[data-mine='1'] { flex-direction: row-reverse; }
    .msg-line .msg-b { margin-top: 3px; }
    .msg-line[data-mine='1'] .msg-b { align-self: auto; }
    .msg-reply { all: unset; cursor: pointer; opacity: 0; width: 30px; height: 30px; border-radius: 15px; display: inline-flex; align-items: center; justify-content: center; color: #64748b; flex-shrink: 0; }
    .msg-line:hover .msg-reply, .msg-reply:focus-visible { opacity: 1; background: #fff; border: 1px solid #e6ebf2; }
    .msg-flash { box-shadow: 0 0 0 3px rgba(50, 103, 97, .35); }
    .msg-quote { all: unset; cursor: pointer; display: block; box-sizing: border-box; width: 100%; border-left: 3px solid #326761; background: #f1f5f9; border-radius: 8px; padding: 4px 8px; margin-bottom: 6px; font-size: .875rem; }
    .msg-b[data-mine='1'] .msg-quote { border-left-color: rgba(255,255,255,.6); background: rgba(255,255,255,.15); }
    .msg-quote b { display: block; }
    .msg-quote span { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; opacity: .85; }
    .msg-img { all: unset; cursor: pointer; display: block; margin-top: 4px; border-radius: 10px; overflow: hidden; background: rgba(0,0,0,.05); }
    .msg-img img { display: block; max-height: 220px; max-width: 100%; }
    .msg-img span { display: flex; width: 180px; height: 110px; align-items: center; justify-content: center; font-size: .875rem; opacity: .7; }
    .msg-file { all: unset; cursor: pointer; box-sizing: border-box; display: flex; gap: 8px; align-items: center; width: 100%; margin-top: 4px; padding: 7px; border-radius: 10px; background: #f8fafc; border: 1px solid #e6ebf2; }
    .msg-file[data-mine='1'] { background: rgba(255,255,255,.15); border-color: transparent; }
    .msg-file b { display: block; font-size: .875rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .msg-file small { display: block; font-size: .875rem; opacity: .75; }
    .msg-ext { width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: .875rem; background: #eaf3f1; color: #326761; }
    .msg-file[data-mine='1'] .msg-ext { background: rgba(255,255,255,.2); color: #fff; }
    .msg-seen { align-self: flex-end; text-align: right; margin-top: 4px; position: relative; }
    .msg-seen-btn { all: unset; cursor: pointer; display: inline-flex; align-items: center; padding: 2px 4px; border-radius: 999px; }
    .msg-seen-btn span { width: 26px; height: 26px; border-radius: 13px; border: 2px solid #f6f8f7; margin-left: -7px; color: #fff; font-size: .875rem; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
    .msg-seen-btn span:first-child { margin-left: 0; }
    .msg-seen-btn em { font-style: normal; font-size: .875rem; color: #64748b; margin-left: 6px; }
    .msg-seen-btn:hover em { color: #326761; text-decoration: underline; }
    .msg-seen-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-size: .875rem; }
    .msg-seen-row:last-child { border-bottom: 0; }
    .msg-seen-av { width: 30px; height: 30px; border-radius: 15px; flex-shrink: 0; color: #fff; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; }
    .msg-seen-name { flex: 1; min-width: 0; color: #0f172a; font-weight: 600; overflow-wrap: anywhere; }
    .msg-seen-at { color: #64748b; white-space: nowrap; }
    .msg-replying { display: flex; align-items: center; gap: 8px; border-left: 4px solid #326761; background: #eaf3f1; padding: 7px 12px; font-size: .875rem; }
    .msg-replying b { display: block; color: #326761; }
    .msg-replying span { display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #64748b; }
    .msg-x { all: unset; cursor: pointer; width: 28px; height: 28px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 1.1rem; color: #64748b; }
    .msg-x:hover { background: #fff; }
    .msg-chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 8px 12px 0; }
    .msg-chip { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; border: 1px solid #e6ebf2; background: #f8fafc; border-radius: 10px; padding: 2px 4px 2px 10px; font-size: .875rem; }
    .msg-chip-n { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
    .msg-clip { all: unset; cursor: pointer; width: 40px; height: 44px; border-radius: 10px; display: inline-flex; align-items: center; justify-content: center; color: #64748b; flex-shrink: 0; }
    .msg-clip:hover { background: #f1f5f9; }
    .msg-clip:disabled { opacity: .4; cursor: not-allowed; }
    @media (max-width: 991px) {
      .msg-wrap { grid-template-columns: minmax(0, 1fr); height: calc(100vh - 200px); }
      .msg-wrap[data-open='1'] .msg-list { display: none; }
      .msg-wrap[data-open='0'] .msg-pane { display: none; }
      .msg-body { padding: 12px; }
      .msg-b { max-width: 82%; }
      .msg-lock { display: none; }
      .msg-reply { opacity: 1; }
    }
  `}</style>
)

export default MessagesPage
