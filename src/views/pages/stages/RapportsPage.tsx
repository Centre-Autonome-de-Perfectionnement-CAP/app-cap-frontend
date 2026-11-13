// src/views/pages/stages/RapportsPage.tsx
// Rapports des stagiaires, rangés pour ne rien avoir à trier :
//  1. stagiaires en cours / stages terminés ;
//  2. rapports de fin de stage (mémoires compris) / rapports périodiques ;
//  3. à traiter / renvoyés au stagiaire / validés. Un rapport validé quitte
//     « À traiter » ; le responsable peut toujours le rouvrir, commenter et
//     trancher à nouveau.
// Dans chaque case : un groupe par stagiaire, le plus ancien en attente d'abord.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CButton, CCard, CCardBody, CFormCheck, CFormInput, CInputGroup, CInputGroupText, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload, cilSearch, cilX, cilChevronBottom, cilChevronRight, cilPeople } from '@coreui/icons'
import stageService, { type ReportSummary } from '@/services/stage.service'
import { friendlyError } from '@/components/common/ActionResult'
import { useAuth } from '@/contexts'
import { PageHead, Empty, StagesStyles } from './StagesUi'
import { isStagesLead } from './StagesGuard'
import { frDate } from './stageUtils'
import ReportModal from './ReportModal'

const STATUS: Record<ReportSummary['status'], { color: string; bg: string }> = {
  submitted:           { color: '#2563eb', bg: '#eff6ff' },
  supervisor_approved: { color: '#059669', bg: '#ecfdf5' },
  supervisor_rejected: { color: '#ea580c', bg: '#fff7ed' },
  approved:            { color: '#047857', bg: '#d1fae5' },
  rejected:            { color: '#e11d48', bg: '#fff1f2' },
}

type Who = 'current' | 'finished'
type Kind = 'final' | 'periodic'
type State = 'todo' | 'rejected' | 'approved'
type Lists = Record<State, ReportSummary[]>

const STATES: { key: State; label: string; color: string }[] = [
  { key: 'todo', label: 'À traiter', color: '#2563eb' },
  { key: 'rejected', label: 'Renvoyés au stagiaire', color: '#e11d48' },
  { key: 'approved', label: 'Validés', color: '#047857' },
]

const DAY = 86400000
const waitingDays = (iso: string | null) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY)) : 0)
const since = (d: number) => (d === 0 ? "aujourd'hui" : d === 1 ? 'depuis 1 jour' : `depuis ${d} jours`)
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const whoOf = (r: ReportSummary): Who => (r.stage?.termine ? 'finished' : 'current')
const kindOf = (r: ReportSummary): Kind => (r.kind === 'final' ? 'final' : 'periodic')

interface Group { key: string; name: string; partner: string | null; reference: string; reports: ReportSummary[]; oldest: number }

/** Un groupe par stagiaire ; du plus ancien au plus récent. */
const groupBy = (rows: ReportSummary[], todo: boolean): Group[] => {
  const map = new Map<string, Group>()
  for (const r of rows) {
    const key = String(r.stage?.id ?? r.id)
    const g = map.get(key) ?? { key, name: r.stage?.nom_complet ?? '', partner: null, reference: r.stage?.reference ?? '', reports: [], oldest: 0 }
    g.partner ??= r.binome?.name ?? null
    g.reports.push(r)
    g.oldest = Math.max(g.oldest, waitingDays(r.submitted_at))
    map.set(key, g)
  }
  const groups = [...map.values()]
  for (const g of groups) g.reports.sort((a, b) => (todo ? 1 : -1) * (a.submitted_at ?? '').localeCompare(b.submitted_at ?? ''))
  return groups.sort((a, b) => (todo ? b.oldest - a.oldest : 0) || a.name.localeCompare(b.name))
}

const RapportsPage = () => {
  const { role } = useAuth()
  const lead = isStagesLead(role as string)
  const [params, setParams] = useSearchParams()
  const [who, setWho] = useState<Who>('current')
  const [kind, setKind] = useState<Kind>('final')
  const [state, setState] = useState<State>('todo')
  const [mineOnly, setMineOnly] = useState(!lead)
  const [lists, setLists] = useState<Lists | null>(null)
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [openId, setOpenId] = useState<number | null>(() => (params.get('rapport') ? Number(params.get('rapport')) : null))

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [todo, rejected, approved] = await Promise.all(
        (['to_review', 'rejected', 'approved'] as const).map(s => stageService.reports(s, mineOnly).then(r => r.data)))
      setLists({ todo, rejected, approved })
    } catch (e) { setError(friendlyError(e)) } finally { setLoading(false) }
  }, [mineOnly])
  useEffect(() => { load() }, [load])

  // Compteurs « à traiter » de chaque case, pour savoir d'un coup d'œil où agir.
  const todoCount = useCallback((w: Who, k?: Kind) => (lists?.todo ?? []).filter(r => whoOf(r) === w && (!k || kindOf(r) === k)).length, [lists])
  const inBox = useCallback((st: State) => (lists?.[st] ?? []).filter(r => whoOf(r) === who && kindOf(r) === kind), [lists, who, kind])

  const rows = lists ? inBox(state) : null
  const groups = useMemo(() => {
    const k = norm(q.trim())
    return groupBy((rows ?? []).filter(r => !k || norm(`${r.stage?.nom_complet} ${r.stage?.reference} ${r.binome?.name ?? ''}`).includes(k)), state === 'todo')
  }, [rows, q, state])

  const close = () => {
    setOpenId(null)
    if (params.has('rapport')) { params.delete('rapport'); setParams(params, { replace: true }) }
  }

  const totalTodo = lists?.todo.length ?? 0
  const kinds: { key: Kind; label: string; hint: string }[] = [
    { key: 'final', label: 'Rapports de fin de stage', hint: 'Mémoires compris. Ils conditionnent l\'attestation.' },
    { key: 'periodic', label: 'Rapports périodiques', hint: 'Journaliers, hebdomadaires ou mensuels.' },
  ]

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title="Rapports des stagiaires"
        subtitle={lists ? (totalTodo ? `${totalTodo} rapport(s) ${lead ? 'à traiter' : 'attendent votre avis'}. Cliquez sur un rapport pour l'ouvrir.` : 'Rien à traiter pour le moment.') : 'Chargement…'}
        actions={<CButton color="secondary" variant="outline" size="sm" onClick={load} disabled={loading} title="Actualiser"><CIcon icon={cilReload} /></CButton>}
      />

      <div className="rp-seg" role="tablist" aria-label="Stagiaires">
        {([['current', 'Stagiaires en cours'], ['finished', 'Stages terminés']] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={who === k} className={who === k ? 'on' : ''} onClick={() => setWho(k)}>
            {l}{lists && todoCount(k) > 0 && <span className="rp-badge">{todoCount(k)}</span>}
          </button>
        ))}
      </div>

      <div className="rp-tiles">
        {kinds.map(t => (
          <button key={t.key} type="button" className={`rp-tile${kind === t.key ? ' on' : ''}`} onClick={() => setKind(t.key)}
            style={{ ['--c' as string]: t.key === 'final' ? '#7c3aed' : '#0f766e' }}>
            <span className="rp-n">{lists ? todoCount(who, t.key) : '…'}<small> à traiter</small></span>
            <span className="rp-l">{t.label}</span>
            <span className="rp-h">{t.hint}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="rp-chips">
          {STATES.map(s => (
            <button key={s.key} type="button" className={state === s.key ? 'on' : ''} style={{ ['--c' as string]: s.color }} onClick={() => setState(s.key)}>
              {s.label} <span>{lists ? inBox(s.key).length : '…'}</span>
            </button>
          ))}
        </div>
        <CInputGroup style={{ maxWidth: 320 }}>
          <CInputGroupText style={{ background: '#fff' }}><CIcon icon={cilSearch} style={{ width: 16, color: '#94a3b8' }} /></CInputGroupText>
          <CFormInput value={q} onChange={e => setQ(e.target.value)} placeholder="Exemple : AGOSSOU ou STG-AB12CD" maxLength={100} aria-label="Rechercher un stagiaire" />
          {q && <CButton color="secondary" variant="outline" onClick={() => setQ('')} title="Effacer"><CIcon icon={cilX} /></CButton>}
        </CInputGroup>
        <CFormCheck id="rpt-mine" label="Seulement mes stagiaires" checked={mineOnly} onChange={e => setMineOnly(e.target.checked)} />
      </div>

      {state === 'approved' && lead && (
        <div className="stg-muted">Un rapport validé reste modifiable : ouvrez-le pour ajouter un commentaire ou revenir sur la décision.</div>
      )}
      {error && <div className="stg-err">{error}</div>}
      {!lists && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
      {rows && groups.length === 0 && (
        <CCard className="border-0 shadow-sm"><CCardBody>
          <Empty text={q ? 'Aucun stagiaire ne correspond à la recherche.' : state === 'todo' ? 'Tout est traité ici. Bravo !' : 'Aucun rapport dans cette case.'} />
        </CCardBody></CCard>
      )}

      <div className="stg-list" style={{ opacity: loading ? 0.6 : 1 }}>
        {groups.map(g => (
          <InternGroup key={g.key} g={g} todo={state === 'todo'} defaultOpen={state === 'todo' || groups.length <= 5} onOpen={setOpenId} />
        ))}
      </div>

      <ReportModal reportId={openId} onClose={close} onChanged={load} />
      <style>{`
        .rp-seg { display: inline-flex; background: #f1f5f9; border-radius: 12px; padding: 4px; gap: 4px; align-self: flex-start; flex-wrap: wrap; }
        .rp-seg button { all: unset; cursor: pointer; padding: 8px 16px; border-radius: 9px; font-weight: 700; color: #475569; display: inline-flex; align-items: center; gap: 8px; }
        .rp-seg button.on { background: #fff; color: #0f172a; box-shadow: 0 1px 3px rgba(15, 23, 42, .12); }
        .rp-seg button:focus-visible { outline: 2px solid #0f766e; }
        .rp-badge { background: #2563eb; color: #fff; border-radius: 999px; font-size: .8rem; padding: 1px 8px; }
        .rp-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 10px; }
        .rp-tile { all: unset; box-sizing: border-box; cursor: pointer; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 14px;
          display: flex; flex-direction: column; gap: 2px; transition: border-color .15s, box-shadow .15s; }
        .rp-tile:hover, .rp-tile:focus-visible { border-color: var(--c); }
        .rp-tile.on { border-color: var(--c); box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 15%, transparent); }
        .rp-n { font-size: 1.6rem; font-weight: 800; color: var(--c); line-height: 1.1; }
        .rp-n small { font-size: .875rem; font-weight: 600; color: #64748b; }
        .rp-l { font-weight: 700; color: #0f172a; }
        .rp-h { font-size: .875rem; color: #64748b; }
        .rp-chips { display: flex; gap: 6px; flex-wrap: wrap; }
        .rp-chips button { all: unset; cursor: pointer; border: 1px solid #e2e8f0; background: #fff; border-radius: 999px; padding: 6px 14px; font-weight: 600; color: #334155; }
        .rp-chips button span { color: #64748b; font-weight: 700; margin-left: 4px; }
        .rp-chips button.on { border-color: var(--c); color: var(--c); background: color-mix(in srgb, var(--c) 8%, #fff); }
        .rp-chips button.on span { color: var(--c); }
        .rp-chips button:focus-visible { outline: 2px solid var(--c); }
        .rp-group { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
        .rp-head { all: unset; box-sizing: border-box; width: 100%; cursor: pointer; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 14px; }
        .rp-head:hover { background: #f8fafc; }
        .rp-bin { display: inline-flex; align-items: center; gap: 4px; margin-top: 2px; color: #6d28d9; background: #f5f3ff; border-radius: 8px; padding: 1px 8px; font-size: .875rem; font-weight: 600; }
        .rp-items { display: flex; flex-direction: column; border-top: 1px solid #f1f5f9; }
        .rp-item { all: unset; box-sizing: border-box; cursor: pointer; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 9px 14px 9px 40px; border-bottom: 1px solid #f8fafc; }
        .rp-item:hover, .rp-item:focus-visible { background: #f0fdfa; }
        .rp-old { font-weight: 700; }
      `}</style>
    </div>
  )
}

const InternGroup = ({ g, todo, defaultOpen, onOpen }: { g: Group; todo: boolean; defaultOpen: boolean; onOpen: (id: number) => void }) => {
  const [open, setOpen] = useState(defaultOpen)
  useEffect(() => setOpen(defaultOpen), [defaultOpen])
  const late = g.oldest >= 7
  return (
    <div className="rp-group">
      <button type="button" className="rp-head" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <CIcon icon={open ? cilChevronBottom : cilChevronRight} style={{ width: 14, color: '#64748b' }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ color: '#0f172a' }}>{g.name}</strong> <span className="stg-ref">{g.reference}</span>
          {g.partner && <><br /><span className="rp-bin"><CIcon icon={cilPeople} style={{ width: 14 }} />Binôme avec {g.partner}</span></>}
        </span>
        <span className="stg-muted">{g.reports.length} rapport(s)</span>
        {todo && <span className="rp-old" style={{ color: late ? '#c2410c' : '#64748b' }}>{since(g.oldest)}</span>}
      </button>
      {open && (
        <div className="rp-items">
          {g.reports.map(r => (
            <button key={r.id} type="button" className="rp-item" onClick={() => onOpen(r.id)} title="Ouvrir le rapport">
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ color: '#0f172a' }}>{r.label}</strong>
                <span className="stg-muted"> · déposé le {frDate(r.submitted_at)}{r.current_version > 1 ? ` · version ${r.current_version}` : ''}{r.late ? ' · en retard' : ''}{r.binome ? ' · vaut pour les deux' : ''}</span>
              </span>
              <span className="stg-pill" style={{ color: STATUS[r.status].color, background: STATUS[r.status].bg }}>
                {r.correction_status === 'pending' ? 'Version corrigée à examiner' : r.status_label}
              </span>
              <CIcon icon={cilChevronRight} style={{ width: 14, color: '#0f766e' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default RapportsPage
