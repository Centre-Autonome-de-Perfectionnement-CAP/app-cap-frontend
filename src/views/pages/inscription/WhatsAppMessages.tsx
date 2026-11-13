// src/views/pages/inscription/WhatsAppMessages.tsx
// Messages WhatsApp groupés : on coche des étudiants (les filtres et la
// recherche servent seulement à les trouver vite), on peut ajouter des
// numéros hors plateforme, on écrit le message, on joint des fichiers et on
// envoie. Seuls les cochés et les numéros ajoutés reçoivent. Les cochés
// apparaissent en bulles en haut, comme à la création d'un groupe WhatsApp.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CButton, CCard, CCardBody, CFormCheck, CFormInput, CFormSelect, CFormTextarea, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilX, cilPaperclip, cilSend, cilFile, cilHistory } from '@coreui/icons'
import InscriptionService, { type WhatsAppBroadcastItem } from '@/services/inscription.service'
import { useAuth } from '@/contexts'

const ROLES = ['admin', 'responsable-division', 'chef-division', 'secretaire']
const MAX_MESSAGE = 2000
const MAX_FILES = 3
const MAX_FILE_MB = 5
const ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.ppt,.pptx'
const PER_PAGE = 30

interface Picked { id: number; name: string; detail: string }
interface Row { id: number; nomPrenoms: string; matricule: string | null; filiere: string | null; niveau: string | number | null; annee: string | null }
type Opt = { value: string; label: string }

const friendly = (e: any, fallback: string) => {
  const d = e?.response?.data
  const first = d?.errors ? Object.values(d.errors).flat()[0] : null
  return (typeof first === 'string' && first) || (e?.response?.status === 403 ? "Vous n'avez pas accès à l'envoi de messages groupés." : null)
    || (e?.response?.status < 500 && typeof d?.message === 'string' ? d.message : null) || fallback
}

/** Numéros saisis à la main : un par ligne (virgule ou point-virgule acceptés), doublons retirés. */
const splitNumbers = (raw: string) => [...new Set(raw.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean))]

/** Rendu WhatsApp : *gras*, _italique_, ~barré~ (texte seulement, jamais de HTML). */
const WaText = ({ text }: { text: string }) => {
  const parts: React.ReactNode[] = []
  const re = /([*_~])([^*_~\n]+)\1/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    const style = m[1] === '*' ? { fontWeight: 700 } : m[1] === '_' ? { fontStyle: 'italic' } : { textDecoration: 'line-through' }
    parts.push(<span key={k++} style={style}>{m[2]}</span>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

const WhatsAppMessages = () => {
  const { role } = useAuth()
  const allowed = ROLES.includes(role as string)

  // Recherche
  const [years, setYears] = useState<Opt[]>([])
  const [filieres, setFilieres] = useState<Opt[]>([])
  const [niveaux, setNiveaux] = useState<Opt[]>([])
  const [year, setYear] = useState('all')
  const [filiere, setFiliere] = useState('all')
  const [niveau, setNiveau] = useState('all')
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [rows, setRows] = useState<Row[] | null>(null)
  const [page, setPage] = useState(1)
  const [lastPage, setLastPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searching, setSearching] = useState(false)
  const req = useRef(0)

  // Envoi
  const [picked, setPicked] = useState<Map<number, Picked>>(new Map())
  const [numbers, setNumbers] = useState('')
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ recipients: number; invalid_numbers: string[]; without_phone: string[]; minutes: number } | null>(null)
  const [history, setHistory] = useState<WhatsAppBroadcastItem[] | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!allowed) return
    InscriptionService.filterOptions().then((o: any) => {
      setYears((o.years || []).map((y: any) => ({ value: String(y.id ?? y), label: y.libelle || y.academic_year || String(y) })))
      setFilieres((o.filieres || []).map((f: any) => ({ value: String(f.id ?? f), label: f.title || f.name || f.libelle || String(f) })))
      setNiveaux((o.niveaux || []).map((n: any) => (typeof n === 'object' ? { value: String(n.value ?? n.id), label: String(n.label ?? n.name) } : { value: String(n), label: String(n) })))
    }).catch(() => undefined)
  }, [allowed])

  const loadHistory = useCallback(() => {
    InscriptionService.whatsAppMessagesHistory().then(setHistory).catch(() => setHistory([]))
  }, [])
  useEffect(() => { if (allowed) loadHistory() }, [allowed, loadHistory])

  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 300); return () => clearTimeout(t) }, [q])
  useEffect(() => { setPage(1) }, [year, filiere, niveau, debounced])

  // Résultats rechargés sur place ; une réponse dépassée par une recherche plus récente est ignorée.
  useEffect(() => {
    if (!allowed) return
    const id = ++req.current
    setSearching(true)
    InscriptionService.studentsList(year, filiere, 'all', 'all', niveau, page, debounced, PER_PAGE)
      .then((r: any) => {
        if (id !== req.current) return
        setRows(prev => (page > 1 && prev ? [...prev, ...(r.data || [])] : r.data || []))
        setLastPage(r.totalPages || 1)
        setTotal(r.total ?? (r.data || []).length)
      })
      .catch(() => { if (id === req.current) setRows([]) })
      .finally(() => { if (id === req.current) setSearching(false) })
  }, [allowed, year, filiere, niveau, debounced, page])

  const detailOf = (r: Row) => [r.matricule, r.filiere, r.niveau ? `niveau ${r.niveau}` : null, r.annee].filter(Boolean).join(' · ')
  const toggle = (r: Row) => setPicked(prev => {
    const next = new Map(prev)
    if (next.has(r.id)) next.delete(r.id); else next.set(r.id, { id: r.id, name: r.nomPrenoms, detail: detailOf(r) })
    return next
  })
  const unpick = (id: number) => setPicked(prev => { const next = new Map(prev); next.delete(id); return next })
  const shown = rows ?? []
  const allShownPicked = shown.length > 0 && shown.every(r => picked.has(r.id))
  const pickShown = () => setPicked(prev => {
    const next = new Map(prev)
    if (allShownPicked) shown.forEach(r => next.delete(r.id)); else shown.forEach(r => next.set(r.id, { id: r.id, name: r.nomPrenoms, detail: detailOf(r) }))
    return next
  })

  const extra = useMemo(() => splitNumbers(numbers), [numbers])
  const recipients = picked.size + extra.length

  const addFiles = (list: FileList | null) => {
    setErr(null)
    const incoming = Array.from(list ?? [])
    const tooBig = incoming.find(f => f.size > MAX_FILE_MB * 1024 * 1024)
    if (tooBig) { setErr(`« ${tooBig.name} » dépasse ${MAX_FILE_MB} Mo.`); return }
    const next = [...files, ...incoming].slice(0, MAX_FILES)
    if (files.length + incoming.length > MAX_FILES) setErr(`Au plus ${MAX_FILES} fichiers par envoi.`)
    setFiles(next)
    if (fileInput.current) fileInput.current.value = ''
  }

  const canSend = recipients > 0 && message.trim().length > 0 && !sending
  const send = async () => {
    setSending(true); setErr(null)
    try {
      const res = await InscriptionService.sendWhatsAppMessages({ etudiants: [...picked.keys()], numeros: extra.join('\n'), message, fichiers: files })
      setResult(res.data)
      setPicked(new Map()); setNumbers(''); setMessage(''); setFiles([])
      loadHistory()
    } catch (e) {
      setErr(friendly(e, "L'envoi n'a pas pu être lancé. Réessayez dans un instant."))
    } finally {
      setSending(false); setConfirm(false)
    }
  }

  if (!allowed) {
    return <CCard className="border-0 shadow-sm"><CCardBody>L'envoi de messages groupés est réservé à l'administrateur, aux Responsables de division et au secrétariat.</CCardBody></CCard>
  }

  return (
    <div className="wam">
      <div>
        <h1 className="wam-title">Messages WhatsApp</h1>
        <p className="wam-sub">Cochez les destinataires, écrivez le message, joignez des fichiers si besoin, puis envoyez. Seules les personnes cochées et les numéros ajoutés le recevront.</p>
      </div>

      {result && (
        <div className="wam-ok" role="status">
          <strong>Envoi lancé vers {result.recipients} destinataire(s).</strong> Les messages partent un par un pour protéger le numéro du CAP : comptez environ {result.minutes} min.
          {result.without_phone.length > 0 && <div>Sans numéro WhatsApp, non envoyés : {result.without_phone.join(', ')}.</div>}
          {result.invalid_numbers.length > 0 && <div>Numéros non reconnus, ignorés : {result.invalid_numbers.join(', ')}.</div>}
          <button type="button" className="wam-x" onClick={() => setResult(null)} aria-label="Fermer"><CIcon icon={cilX} /></button>
        </div>
      )}

      <div className="wam-grid">
        {/* ── Destinataires ── */}
        <section className="wam-card">
          <div className="wam-h">Destinataires <span className="wam-count">{recipients}</span></div>

          <div className="wam-bubbles" aria-live="polite">
            {picked.size === 0 && extra.length === 0 && <span className="wam-muted">Personne pour l'instant : cochez des étudiants ci-dessous.</span>}
            {[...picked.values()].map(p => (
              <span key={p.id} className="wam-bubble" title={p.detail}>
                {p.name}
                <button type="button" onClick={() => unpick(p.id)} aria-label={`Retirer ${p.name}`}><CIcon icon={cilX} style={{ width: 12 }} /></button>
              </span>
            ))}
            {extra.length > 0 && <span className="wam-bubble wam-bubble-num">{extra.length} numéro(s) ajouté(s)</span>}
            {picked.size > 0 && <button type="button" className="wam-link" onClick={() => setPicked(new Map())}>Tout retirer</button>}
          </div>

          <div className="wam-filters">
            <CFormSelect value={year} onChange={e => setYear(e.target.value)} aria-label="Année">
              <option value="all">Toutes les années</option>
              {years.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </CFormSelect>
            <CFormSelect value={filiere} onChange={e => setFiliere(e.target.value)} aria-label="Filière">
              <option value="all">Toutes les filières</option>
              {filieres.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </CFormSelect>
            <CFormSelect value={niveau} onChange={e => setNiveau(e.target.value)} aria-label="Niveau">
              <option value="all">Tous les niveaux</option>
              {niveaux.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </CFormSelect>
          </div>
          <div className="wam-search">
            <CIcon icon={cilSearch} style={{ width: 16, color: '#94a3b8' }} />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Exemple : AGOSSOU ou un matricule" maxLength={100} aria-label="Rechercher un étudiant" />
            {q && <button type="button" onClick={() => setQ('')} aria-label="Effacer"><CIcon icon={cilX} style={{ width: 14 }} /></button>}
          </div>

          <div className="wam-listhead">
            <span className="wam-muted">{rows ? `${total} étudiant(s) trouvé(s)` : 'Recherche…'}</span>
            {shown.length > 0 && <button type="button" className="wam-link" onClick={pickShown}>{allShownPicked ? 'Décocher les affichés' : `Cocher les affichés (${shown.length})`}</button>}
          </div>
          <div className="wam-list" style={{ opacity: searching ? 0.6 : 1 }}>
            {rows && shown.length === 0 && <div className="wam-muted" style={{ padding: 16 }}>Aucun étudiant ne correspond.</div>}
            {shown.map(r => (
              <label key={r.id} className={`wam-row${picked.has(r.id) ? ' on' : ''}`}>
                <CFormCheck checked={picked.has(r.id)} onChange={() => toggle(r)} aria-label={`Cocher ${r.nomPrenoms}`} />
                <span style={{ minWidth: 0 }}>
                  <strong>{r.nomPrenoms}</strong>
                  <span className="wam-muted" style={{ display: 'block' }}>{detailOf(r)}</span>
                </span>
              </label>
            ))}
            {page < lastPage && (
              <div style={{ padding: 10, textAlign: 'center' }}>
                <CButton size="sm" color="secondary" variant="outline" disabled={searching} onClick={() => setPage(p => p + 1)}>Voir plus</CButton>
              </div>
            )}
          </div>

          <div className="wam-h" style={{ marginTop: 6 }}>Numéros hors plateforme <span className="wam-opt">(facultatif)</span></div>
          <CFormTextarea rows={3} value={numbers} onChange={e => setNumbers(e.target.value)} maxLength={20000}
            placeholder={'Exemple : 0197000000\n0161000000'} aria-label="Numéros hors plateforme, un par ligne" />
          <span className="wam-muted">Un numéro par ligne. Un même numéro ne reçoit qu'une fois.</span>
        </section>

        {/* ── Message et aperçu ── */}
        <section className="wam-card wam-side">
          <div className="wam-h">Message <span className="text-danger">*</span></div>
          <CFormTextarea rows={7} value={message} onChange={e => setMessage(e.target.value)} maxLength={MAX_MESSAGE}
            placeholder="Exemple : Bonjour, la réunion d'information a lieu demain à 10 h au CAP." aria-label="Message" />
          <div className="wam-meta">
            <span className="wam-muted">*gras*, _italique_ comme sur WhatsApp</span>
            <span className="wam-muted">{message.length} / {MAX_MESSAGE}</span>
          </div>

          <div className="wam-h">Fichiers <span className="wam-opt">(facultatif, {MAX_FILES} au plus, {MAX_FILE_MB} Mo chacun)</span></div>
          {files.map((f, i) => (
            <div key={i} className="wam-file">
              <CIcon icon={cilFile} style={{ width: 16, color: '#0f766e' }} /><span>{f.name}</span>
              <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label={`Retirer ${f.name}`}><CIcon icon={cilX} style={{ width: 12 }} /></button>
            </div>
          ))}
          {files.length < MAX_FILES && (
            <div>
              <input ref={fileInput} type="file" multiple accept={ACCEPT} hidden onChange={e => addFiles(e.target.files)} />
              <CButton size="sm" color="secondary" variant="outline" onClick={() => fileInput.current?.click()}><CIcon icon={cilPaperclip} className="me-1" />Joindre un fichier</CButton>
            </div>
          )}

          <div className="wam-h" style={{ marginTop: 6 }}>Aperçu</div>
          <div className="wam-phone" aria-label="Aperçu du message reçu">
            {message.trim() ? <div className="wam-msg"><WaText text={message} /></div> : <div className="wam-muted" style={{ textAlign: 'center' }}>Le message s'affichera ici.</div>}
            {files.map((f, i) => <div key={i} className="wam-msg wam-msg-file"><CIcon icon={cilFile} style={{ width: 18 }} /> {f.name}</div>)}
          </div>

          {err && <div className="wam-err">{err}</div>}
          <CButton color="success" style={{ color: '#fff', fontWeight: 700 }} disabled={!canSend} onClick={() => setConfirm(true)}>
            <CIcon icon={cilSend} className="me-1" />{recipients > 0 ? `Envoyer à ${recipients} destinataire(s)` : 'Envoyer'}
          </CButton>
        </section>
      </div>

      <section className="wam-card">
        <div className="wam-h"><CIcon icon={cilHistory} style={{ width: 16 }} /> Derniers envois</div>
        {!history && <CSpinner size="sm" color="primary" />}
        {history && history.length === 0 && <span className="wam-muted">Aucun envoi ces 30 derniers jours.</span>}
        {history?.map(h => (
          <div key={h.id} className="wam-hist">
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong>{new Date(h.at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</strong>
              {h.by && <span className="wam-muted"> · par {h.by}</span>}
              <span className="wam-muted" style={{ display: 'block' }}>{h.message}</span>
            </span>
            <span className="wam-pill">{h.total} destinataire(s)</span>
            <span className="wam-pill" style={{ color: '#047857', background: '#ecfdf5' }}>{h.sent} reçu(s)</span>
            {h.failed > 0 && <span className="wam-pill" style={{ color: '#be123c', background: '#fff1f2' }}>{h.failed} échec(s)</span>}
            {h.sent + h.failed < h.total && <span className="wam-pill" style={{ color: '#2563eb', background: '#eff6ff' }}>en cours</span>}
          </div>
        ))}
      </section>

      <CModal visible={confirm} onClose={() => setConfirm(false)} alignment="center">
        <CModalHeader><CModalTitle style={{ fontSize: '1.05rem' }}>Envoyer le message ?</CModalTitle></CModalHeader>
        <CModalBody>
          Le message{files.length ? ` et ${files.length} fichier(s)` : ''} partira vers <strong>{recipients} destinataire(s)</strong>, un par un pour protéger le numéro du CAP.
          Un envoi lancé ne peut pas être annulé.
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setConfirm(false)} disabled={sending}>Revenir</CButton>
          <CButton color="success" style={{ color: '#fff' }} onClick={send} disabled={sending}>{sending && <CSpinner size="sm" className="me-1" />}Envoyer</CButton>
        </CModalFooter>
      </CModal>

      <style>{`
        .wam { display: flex; flex-direction: column; gap: 14px; font-size: .95rem; }
        .wam-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
        .wam-sub { color: #64748b; margin: 2px 0 0; }
        .wam-grid { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: 14px; align-items: start; }
        @media (max-width: 991px) { .wam-grid { grid-template-columns: 1fr; } }
        .wam-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .wam-side { position: sticky; top: 80px; }
        .wam-h { font-weight: 800; color: #0f172a; display: flex; align-items: center; gap: 8px; }
        .wam-opt { font-weight: 400; color: #64748b; font-size: .875rem; }
        .wam-count { background: #128C7E; color: #fff; border-radius: 999px; padding: 1px 10px; font-size: .875rem; }
        .wam-muted { color: #64748b; font-size: .875rem; }
        .wam-bubbles { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; min-height: 40px; padding: 8px; border: 1px dashed #cbd5e1; border-radius: 12px; max-height: 160px; overflow-y: auto; }
        .wam-bubble { display: inline-flex; align-items: center; gap: 6px; background: #e7f6f3; color: #075e54; border-radius: 999px; padding: 4px 6px 4px 12px; font-weight: 600; font-size: .875rem; }
        .wam-bubble button { all: unset; cursor: pointer; display: inline-flex; width: 20px; height: 20px; border-radius: 50%; align-items: center; justify-content: center; background: #fff; color: #075e54; }
        .wam-bubble button:hover, .wam-bubble button:focus-visible { background: #075e54; color: #fff; }
        .wam-bubble-num { background: #eef2ff; color: #3730a3; padding-right: 12px; }
        .wam-link { all: unset; cursor: pointer; color: #0f766e; font-weight: 700; font-size: .875rem; }
        .wam-link:focus-visible { outline: 2px solid #0f766e; }
        .wam-filters { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        @media (max-width: 575px) { .wam-filters { grid-template-columns: 1fr; } }
        .wam-search { display: flex; align-items: center; gap: 8px; border: 1px solid #cbd5e1; border-radius: 10px; padding: 0 10px; background: #fff; }
        .wam-search:focus-within { border-color: #128C7E; box-shadow: 0 0 0 3px rgba(18, 140, 126, .15); }
        .wam-search input { border: 0; outline: 0; flex: 1; padding: 9px 0; font-size: .95rem; background: transparent; }
        .wam-search button { all: unset; cursor: pointer; color: #64748b; }
        .wam-listhead { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
        .wam-list { border: 1px solid #e2e8f0; border-radius: 12px; max-height: 420px; overflow-y: auto; transition: opacity .15s; }
        .wam-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-bottom: 1px solid #f1f5f9; cursor: pointer; margin: 0; }
        .wam-row:hover { background: #f8fafc; }
        .wam-row.on { background: #f0fdfa; }
        .wam-row .form-check { margin: 0; }
        .wam-meta { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
        .wam-file { display: flex; align-items: center; gap: 8px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px 10px; }
        .wam-file span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .wam-file button { all: unset; cursor: pointer; color: #64748b; }
        .wam-phone { background: #efeae2; border-radius: 14px; padding: 14px; display: flex; flex-direction: column; gap: 6px; min-height: 90px; }
        .wam-msg { align-self: flex-start; max-width: 92%; background: #fff; border-radius: 0 10px 10px 10px; padding: 8px 10px; box-shadow: 0 1px 1px rgba(0,0,0,.08); white-space: pre-wrap; word-break: break-word; color: #111b21; }
        .wam-msg-file { display: inline-flex; align-items: center; gap: 6px; color: #075e54; font-weight: 600; }
        .wam-err { background: #fff1f2; border: 1px solid #fecdd3; color: #9f1239; border-radius: 10px; padding: 8px 12px; }
        .wam-ok { position: relative; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; border-radius: 12px; padding: 12px 40px 12px 14px; }
        .wam-x { all: unset; cursor: pointer; position: absolute; top: 10px; right: 12px; }
        .wam-hist { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
        .wam-pill { border-radius: 999px; padding: 2px 10px; font-size: .875rem; font-weight: 600; background: #f1f5f9; color: #334155; }
      `}</style>
    </div>
  )
}

export default WhatsAppMessages
