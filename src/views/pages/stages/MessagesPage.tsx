// src/views/pages/stages/MessagesPage.tsx
// Messagerie de stage (progiciel) : « Mes stagiaires » (superviseur et ses
// stagiaires, visible par eux seuls) et la discussion générale. Texte
// seulement ; les messages s'effacent après 7 jours. Liste à gauche, fil à
// droite (un seul volet sur petit écran). Rafraîchi tant que la page est visible.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilLockLocked, cilSend, cilInfo } from '@coreui/icons'
import stageService, { type ChatChannel, type ChatMessage, type ChatThread } from '@/services/stage.service'
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
  const navigate = useNavigate()
  const [list, setList] = useState<{ channels: ChatChannel[]; keep_days: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadList = useCallback(() => {
    stageService.chatList().then(d => { setList(d); setError(null) }).catch(e => setError(friendlyError(e)))
  }, [])
  useEffect(loadList, [loadList, channel])
  useVisiblePoll(loadList, POLL_LIST_MS)

  // Grand écran : la première discussion s'ouvre d'elle-même.
  useEffect(() => {
    if (!channel && list?.channels.length && window.matchMedia('(min-width: 992px)').matches) {
      navigate(`/stages/messages/${list.channels[0].key}`, { replace: true })
    }
  }, [channel, list, navigate])

  const groups = list?.channels.filter(c => c.kind === 'group') ?? []
  const general = list?.channels.filter(c => c.kind === 'general') ?? []

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead title="Messages" subtitle={`Texte seulement · les messages s'effacent après ${list?.keep_days ?? 7} jours`} />
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

const Thread = ({ channel, onRead }: { channel: string; onRead: () => void }) => {
  const navigate = useNavigate()
  const [thread, setThread] = useState<ChatThread | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [older, setOlder] = useState(false)
  const box = useRef<HTMLDivElement>(null)
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
      setThread(t => t && {
        ...t, seen: d.seen ?? t.seen,
        messages: last ? [...t.messages, ...d.messages.filter(m => !t.messages.some(x => x.id === m.id))] : d.messages,
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

  const send = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true); setError(null)
    try {
      await stageService.chatSend(channel, body)
      setText(''); stick.current = true
      await refresh(); scrollDown()
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setSending(false)
    }
  }

  if (!thread) return error
    ? <div style={{ padding: 16 }}><div className="stg-err">{error}</div></div>
    : <div className="msg-loading"><CSpinner size="sm" color="primary" />Chargement de la discussion…</div>

  const c = thread.channel
  const unreadCount = thread.first_unread_id ? thread.messages.filter(m => m.id >= thread.first_unread_id! && !m.mine).length : 0
  return (
    <>
      <header className="msg-th">
        <button type="button" className="msg-back" onClick={() => navigate('/stages/messages')} aria-label="Retour aux discussions">
          <CIcon icon={cilArrowLeft} />
        </button>
        <span className="msg-av" data-kind={c.kind}>{c.kind === 'general' ? 'CAP' : 'G'}</span>
        <div style={{ minWidth: 0 }}>
          <strong>{c.title}</strong>
          <small>{c.subtitle}</small>
        </div>
        {c.kind === 'group' && <span className="msg-lock"><CIcon icon={cilLockLocked} style={{ width: 14 }} />Privé</span>}
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
              <div className="msg-b" data-mine={m.mine ? '1' : '0'} data-run={sameRun ? '1' : '0'}>
                {m.body}
                <span className="msg-tm">
                  {time(m.at)}{m.mine && thread.seen?.id === m.id && thread.seen.count > 0 ? ` · Vu${thread.seen.count > 1 ? ` par ${thread.seen.count}` : ''}` : ''}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {error && <div style={{ padding: '8px 12px 0' }}><div className="stg-err">{error}</div></div>}
      <div className="msg-comp">
        <label htmlFor="msg-input" className="visually-hidden">Votre message</label>
        <textarea id="msg-input" rows={1} maxLength={2000} value={text} onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder={c.kind === 'group' ? 'Écrire un message à vos stagiaires…' : 'Écrire un message à tous…'}
          style={{ height: Math.min(132, 44 + Math.max(0, text.split('\n').length - 1) * 21) }} />
        <button type="button" className="msg-send" onClick={send} disabled={!text.trim() || sending} aria-label="Envoyer">
          {sending ? <CSpinner size="sm" /> : <CIcon icon={cilSend} />}
        </button>
      </div>
      <p className="msg-hint">Entrée pour envoyer, Maj + Entrée pour aller à la ligne.</p>
    </>
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
    .msg-back { all: unset; cursor: pointer; display: none; width: 34px; height: 34px; border-radius: 10px; align-items: center; justify-content: center; color: #475569; }
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
    @media (max-width: 991px) {
      .msg-wrap { grid-template-columns: minmax(0, 1fr); height: calc(100vh - 200px); }
      .msg-wrap[data-open='1'] .msg-list { display: none; }
      .msg-wrap[data-open='0'] .msg-pane { display: none; }
      .msg-back { display: inline-flex; }
      .msg-body { padding: 12px; }
      .msg-b { max-width: 82%; }
      .msg-lock { display: none; }
    }
  `}</style>
)

export default MessagesPage
