// src/views/pages/stages/RapportsPage.tsx
// Rapports des stagiaires, pensés pour ne pas avoir à trier :
//  - par défaut, seulement ce que JE dois traiter (responsable : décision ;
//    superviseur : avis), regroupé par stagiaire, le plus ancien en attente
//    d'abord, rapports finaux en tête ;
//  - un clic sur un rapport l'ouvre ; les autres vues (finaux, à corriger,
//    validés, tous) restent à un clic, regroupées de la même façon.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CButton, CCard, CCardBody, CFormCheck, CFormInput, CInputGroup, CInputGroupText, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload, cilSearch, cilX, cilChevronBottom, cilChevronRight } from '@coreui/icons'
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

type View = 'mine' | 'final' | 'rejected' | 'approved' | 'all'

const DAY = 86400000
const waitingDays = (iso: string | null) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY)) : 0)
const since = (d: number) => (d === 0 ? "aujourd'hui" : d === 1 ? 'depuis 1 jour' : `depuis ${d} jours`)
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

interface Group { key: string; name: string; reference: string; reports: ReportSummary[]; oldest: number; hasFinal: boolean }

/** Un groupe par stagiaire (ou binôme) ; rapports finaux en tête, puis du plus ancien au plus récent. */
const groupBy = (rows: ReportSummary[]): Group[] => {
  const map = new Map<string, Group>()
  for (const r of rows) {
    const key = String(r.stage?.id ?? r.id)
    const g = map.get(key) ?? {
      key, name: `${r.stage?.nom_complet ?? ''}${r.binome ? ` et ${r.binome.name}` : ''}`, reference: r.stage?.reference ?? '',
      reports: [], oldest: 0, hasFinal: false,
    }
    g.reports.push(r)
    g.oldest = Math.max(g.oldest, waitingDays(r.submitted_at))
    g.hasFinal ||= r.kind === 'final'
    map.set(key, g)
  }
  const groups = [...map.values()]
  for (const g of groups) {
    g.reports.sort((a, b) => (a.kind === 'final' ? 0 : 1) - (b.kind === 'final' ? 0 : 1) || (a.submitted_at ?? '').localeCompare(b.submitted_at ?? ''))
  }
  return groups.sort((a, b) => Number(b.hasFinal) - Number(a.hasFinal) || b.oldest - a.oldest || a.name.localeCompare(b.name))
}

const RapportsPage = () => {
  const { role } = useAuth()
  const lead = isStagesLead(role as string)
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<View>('mine')
  const [mineOnly, setMineOnly] = useState(!lead)
  const [toReview, setToReview] = useState<ReportSummary[] | null>(null)
  const [rejected, setRejected] = useState<ReportSummary[] | null>(null)
  const [other, setOther] = useState<ReportSummary[] | null>(null)
  const [q, setQ] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [openId, setOpenId] = useState<number | null>(() => (params.get('rapport') ? Number(params.get('rapport')) : null))

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [a, b] = await Promise.all([stageService.reports('to_review', mineOnly), stageService.reports('rejected', mineOnly)])
      setToReview(a.data); setRejected(b.data)
      if (view === 'approved' || view === 'all') setOther((await stageService.reports(view, mineOnly)).data)
    } catch (e) { setError(friendlyError(e)) } finally { setLoading(false) }
  }, [mineOnly, view])
  useEffect(() => { load() }, [load])

  // Ce que JE dois faire : le responsable tranche tout ; le superviseur donne son avis sur les nouveaux dépôts.
  const forMe = useCallback((r: ReportSummary) => lead || r.status === 'submitted' || r.correction_status === 'pending', [lead])
  const mine = useMemo(() => (toReview ?? []).filter(forMe), [toReview, forMe])
  const waitingLead = useMemo(() => (toReview ?? []).filter(r => !forMe(r)), [toReview, forMe])
  const finals = useMemo(() => mine.filter(r => r.kind === 'final'), [mine])

  const rows = view === 'mine' ? mine : view === 'final' ? finals : view === 'rejected' ? rejected : other
  const groups = useMemo(() => {
    const k = norm(q.trim())
    return groupBy((rows ?? []).filter(r => !k || norm(`${r.stage?.nom_complet} ${r.stage?.reference} ${r.binome?.name ?? ''}`).includes(k)))
  }, [rows, q])

  const close = () => {
    setOpenId(null)
    if (params.has('rapport')) { params.delete('rapport'); setParams(params, { replace: true }) }
  }

  const tiles: { key: View; label: string; n?: number; hint: string; color: string }[] = [
    { key: 'mine', label: lead ? 'À traiter par moi' : 'Mon avis attendu', n: mine.length, hint: 'Le plus ancien en premier', color: '#2563eb' },
    { key: 'final', label: 'Rapports finaux à traiter', n: finals.length, hint: "Ils conditionnent l'attestation", color: '#7c3aed' },
    { key: 'rejected', label: 'Renvoyés pour correction', n: rejected?.length, hint: 'En attente du stagiaire', color: '#e11d48' },
  ]

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title="Rapports des stagiaires"
        subtitle={mine.length
          ? `${mine.length} rapport(s) ${lead ? 'à traiter' : 'attendent votre avis'}, regroupés par stagiaire. Cliquez sur un rapport pour l'ouvrir.`
          : 'Rien à traiter pour le moment.'}
        actions={<CButton color="secondary" variant="outline" size="sm" onClick={load} disabled={loading} title="Actualiser"><CIcon icon={cilReload} /></CButton>}
      />

      <div className="rp-tiles">
        {tiles.map(t => (
          <button key={t.key} type="button" className={`rp-tile${view === t.key ? ' on' : ''}`} onClick={() => setView(t.key)} style={{ ['--c' as string]: t.color }}>
            <span className="rp-n">{t.n ?? '…'}</span>
            <span className="rp-l">{t.label}</span>
            <span className="rp-h">{t.hint}</span>
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <CInputGroup style={{ maxWidth: 360 }}>
          <CInputGroupText style={{ background: '#fff' }}><CIcon icon={cilSearch} style={{ width: 16, color: '#94a3b8' }} /></CInputGroupText>
          <CFormInput value={q} onChange={e => setQ(e.target.value)} placeholder="Exemple : AGOSSOU ou STG-AB12CD" maxLength={100} aria-label="Rechercher un stagiaire" />
          {q && <CButton color="secondary" variant="outline" onClick={() => setQ('')} title="Effacer"><CIcon icon={cilX} /></CButton>}
        </CInputGroup>
        <CFormCheck id="rpt-mine" label="Seulement mes stagiaires" checked={mineOnly} onChange={e => setMineOnly(e.target.checked)} />
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <CButton size="sm" color="secondary" variant={view === 'approved' ? undefined : 'ghost'} onClick={() => setView('approved')}>Validés</CButton>
          <CButton size="sm" color="secondary" variant={view === 'all' ? undefined : 'ghost'} onClick={() => setView('all')}>Tous</CButton>
        </span>
      </div>

      {error && <div className="stg-err">{error}</div>}
      {!rows && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
      {rows && groups.length === 0 && (
        <CCard className="border-0 shadow-sm"><CCardBody>
          <Empty text={q ? 'Aucun stagiaire ne correspond à la recherche.' : view === 'mine' ? 'Tout est traité. Bravo !' : 'Aucun rapport dans cette vue.'} />
        </CCardBody></CCard>
      )}

      <div className="stg-list" style={{ opacity: loading ? 0.6 : 1 }}>
        {groups.map(g => (
          <InternGroup key={g.key} g={g} defaultOpen={view !== 'approved' && view !== 'all'} onOpen={setOpenId} />
        ))}
      </div>

      {view === 'mine' && !lead && waitingLead.length > 0 && (
        <div className="stg-muted">{waitingLead.length} rapport(s) déjà vus par un superviseur attendent la décision du responsable de division.</div>
      )}

      <ReportModal reportId={openId} onClose={close} onChanged={load} />
      <style>{`
        .rp-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
        .rp-tile { all: unset; box-sizing: border-box; cursor: pointer; background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 14px;
          display: flex; flex-direction: column; gap: 2px; transition: border-color .15s, box-shadow .15s; }
        .rp-tile:hover, .rp-tile:focus-visible { border-color: var(--c); }
        .rp-tile.on { border-color: var(--c); box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 15%, transparent); }
        .rp-n { font-size: 1.6rem; font-weight: 800; color: var(--c); line-height: 1.1; }
        .rp-l { font-weight: 700; color: #0f172a; }
        .rp-h { font-size: .875rem; color: #64748b; }
        .rp-group { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
        .rp-head { all: unset; box-sizing: border-box; width: 100%; cursor: pointer; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 10px 14px; }
        .rp-head:hover { background: #f8fafc; }
        .rp-items { display: flex; flex-direction: column; border-top: 1px solid #f1f5f9; }
        .rp-item { all: unset; box-sizing: border-box; cursor: pointer; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; padding: 9px 14px 9px 40px; border-bottom: 1px solid #f8fafc; }
        .rp-item:hover, .rp-item:focus-visible { background: #f0fdfa; }
        .rp-final { color: #7c3aed; background: #f5f3ff; font-weight: 700; font-size: .8rem; border-radius: 999px; padding: 2px 8px; }
        .rp-old { font-weight: 700; }
      `}</style>
    </div>
  )
}

const InternGroup = ({ g, defaultOpen, onOpen }: { g: Group; defaultOpen: boolean; onOpen: (id: number) => void }) => {
  const [open, setOpen] = useState(defaultOpen)
  useEffect(() => setOpen(defaultOpen), [defaultOpen])
  const late = g.oldest >= 7
  return (
    <div className="rp-group">
      <button type="button" className="rp-head" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <CIcon icon={open ? cilChevronBottom : cilChevronRight} style={{ width: 14, color: '#64748b' }} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ color: '#0f172a' }}>{g.name}</strong> <span className="stg-ref">{g.reference}</span>
        </span>
        {g.hasFinal && <span className="rp-final">Rapport final</span>}
        <span className="stg-muted">{g.reports.length} rapport(s)</span>
        <span className="rp-old" style={{ color: late ? '#c2410c' : '#64748b' }}>{since(g.oldest)}</span>
      </button>
      {open && (
        <div className="rp-items">
          {g.reports.map(r => (
            <button key={r.id} type="button" className="rp-item" onClick={() => onOpen(r.id)} title="Ouvrir le rapport">
              <span style={{ flex: 1, minWidth: 0 }}>
                {r.kind === 'final' && <span className="rp-final" style={{ marginRight: 6 }}>Final</span>}
                <strong style={{ color: '#0f172a' }}>{r.label}</strong>
                <span className="stg-muted"> · déposé le {frDate(r.submitted_at)}{r.current_version > 1 ? ` · version ${r.current_version}` : ''}{r.late ? ' · en retard' : ''}{r.binome ? ' · rapport du binôme' : ''}</span>
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
