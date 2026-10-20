// src/views/pages/stages/StagesPage.tsx
// Tableau de bord des demandes de stage (Responsable de division / admin).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CButton, CCard, CCardBody, CFormInput, CSpinner, CBadge, CInputGroup, CInputGroupText } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSettings, cilSearch, cilInbox, cilCommentBubble, cilSend, cilCheckCircle, cilBan, cilClock, cilList, cilReload, cilUserUnfollow,
} from '@coreui/icons'
import StatCard from '@/views/pages/demandes/components/ui/StatCard'
import stageService, { type StageListResponse, type StageStatus } from '@/services/stage.service'
import { friendlyError } from '@/components/common/ActionResult'
import { useAuth } from '@/contexts'
import { isStagesLead } from './StagesGuard'
import { ExportButton } from './StagesUi'
import StageDetailModal from './StageDetailModal'
import StageSettingsModal from './StageSettingsModal'
import { STATUS_STYLE, frDate, durationLabel } from './stageUtils'

type Filter = 'to_handle' | StageStatus | 'all'

const CARDS: { key: Filter; label: string; icon: any; color: string; bg: string }[] = [
  { key: 'to_handle',        label: 'À traiter',          icon: cilInbox,         color: '#2563eb', bg: '#eff6ff' },
  { key: 'counter_proposed', label: 'Contre-propositions', icon: cilCommentBubble, color: '#7c3aed', bg: '#f5f3ff' },
  { key: 'proposal_sent',    label: 'En attente de réponse', icon: cilSend,        color: '#d97706', bg: '#fffbeb' },
  { key: 'accepted',         label: 'Acceptées',          icon: cilCheckCircle,   color: '#059669', bg: '#ecfdf5' },
  { key: 'rejected',         label: 'Non retenues',       icon: cilBan,           color: '#e11d48', bg: '#fff1f2' },
  { key: 'expired',          label: 'Expirées',           icon: cilClock,         color: '#64748b', bg: '#f1f5f9' },
  { key: 'withdrawn',        label: 'Désistements',       icon: cilUserUnfollow,  color: '#9a3412', bg: '#fff7ed' },
  { key: 'all',              label: 'Toutes',             icon: cilList,          color: '#0f766e', bg: '#f0fdfa' },
]

const StagesPage = () => {
  const [params, setParams] = useSearchParams()
  const { role } = useAuth()
  const lead = isStagesLead(role as string)
  const [filter, setFilter] = useState<Filter>('to_handle')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [list, setList] = useState<StageListResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<number | string | null>(() => params.get('ref'))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [requestsOpen, setRequestsOpen] = useState<boolean | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      setList(await stageService.list({ status: filter, q: search || undefined, page }))
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setLoading(false)
    }
  }, [filter, search, page])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!lead) return
    stageService.getSettings().then(s => setRequestsOpen(s.requests_open)).catch(() => setRequestsOpen(null))
  }, [lead])

  // Recherche : déclenchée 400 ms après la frappe
  useEffect(() => {
    const t = setTimeout(() => { setSearch(q.trim()); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [q])

  const counts = useMemo(() => {
    const c = list?.counts
    if (!c) return {} as Record<Filter, number>
    const total = Object.values(c).reduce((a, b) => a + b, 0)
    return { ...c, to_handle: (c.submitted ?? 0) + (c.counter_proposed ?? 0), all: total } as Record<Filter, number>
  }, [list])

  const closeDetail = useCallback(() => {
    setOpenId(null)
    if (params.has('ref')) { params.delete('ref'); setParams(params, { replace: true }) }
  }, [params, setParams])

  return (
    <div className="stg-page">
      <div className="stg-head">
        <div>
          <h4 style={{ margin: 0, fontWeight: 800 }}>Demandes de stage</h4>
          <span style={{ color: '#64748b', fontSize: '.88rem' }}>Étude, propositions de dates et notes de service.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {requestsOpen !== null && (
            <CBadge color={requestsOpen ? 'success' : 'warning'} shape="rounded-pill" style={{ padding: '6px 10px' }}>
              {requestsOpen ? 'Demandes ouvertes' : 'Demandes fermées'}
            </CBadge>
          )}
          <CButton color="secondary" variant="outline" size="sm" onClick={() => load()} disabled={loading} title="Actualiser">
            <CIcon icon={cilReload} />
          </CButton>
          {lead && <ExportButton path={`demandes?status=${filter}`} />}
          {lead && (
            <CButton color="primary" variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
              <CIcon icon={cilSettings} className="me-1" />Réglages
            </CButton>
          )}
        </div>
      </div>

      <div className="stg-cards">
        {CARDS.map(c => (
          <StatCard
            key={c.key}
            label={c.label}
            count={counts[c.key] ?? 0}
            color={c.color}
            bg={c.bg}
            icon={<CIcon icon={c.icon} style={{ width: 17 }} />}
            active={filter === c.key}
            onClick={() => { setFilter(c.key); setPage(1) }}
          />
        ))}
      </div>

      <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <CCardBody>
          <CInputGroup className="mb-3">
            <CInputGroupText style={{ background: '#fff' }}><CIcon icon={cilSearch} style={{ width: 16, color: '#94a3b8' }} /></CInputGroupText>
            <CFormInput
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Rechercher : référence, nom, établissement, email, numéro…"
              maxLength={100}
            />
          </CInputGroup>

          {error && <div className="stg-err">{error}</div>}
          {loading && !list && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}

          {list && list.data.length === 0 && !loading && (
            <div style={{ padding: '40px 12px', textAlign: 'center', color: '#64748b' }}>
              <CIcon icon={cilInbox} style={{ width: 34, color: '#cbd5e1' }} />
              <div style={{ marginTop: 8 }}>Aucune demande dans cette catégorie.</div>
            </div>
          )}

          {list && list.data.length > 0 && (
            <div className="stg-list" style={{ opacity: loading ? 0.6 : 1 }}>
              {list.data.map(r => {
                const st = STATUS_STYLE[r.status]
                return (
                  <button key={r.id} type="button" className="stg-row" onClick={() => setOpenId(r.id)}>
                    <span className="stg-bar" style={{ background: st.color }} />
                    <div className="stg-main">
                      <div className="stg-line">
                        <span className="stg-ref">{r.reference}</span>
                        <span className="stg-pill" style={{ color: st.color, background: st.bg }}>{r.status_label}</span>
                      </div>
                      <strong className="stg-name">{r.nom_complet}</strong>
                      <span className="stg-sub">{r.formation} · {r.etablissement}</span>
                    </div>
                    <div className="stg-side">
                      {r.date_debut
                        ? <><span>{frDate(r.date_debut)} → {frDate(r.date_fin)}</span><span className="stg-sub">{durationLabel(r.date_debut, r.date_fin)}</span></>
                        : <><span>{r.date_debut_souhaitee ? `Souhaite : ${frDate(r.date_debut_souhaitee)}` : 'Début non précisé'}</span><span className="stg-sub">{r.duree_souhaitee}</span></>}
                      <span className="stg-sub">Reçue le {frDate(r.created_at)}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {list && list.meta.last_page > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <CButton size="sm" color="secondary" variant="outline" disabled={page <= 1 || loading} onClick={() => setPage(p => p - 1)}>Précédent</CButton>
              <span style={{ fontSize: '.875rem', color: '#475569' }}>Page {list.meta.current_page} / {list.meta.last_page}</span>
              <CButton size="sm" color="secondary" variant="outline" disabled={page >= list.meta.last_page || loading} onClick={() => setPage(p => p + 1)}>Suivant</CButton>
            </div>
          )}
        </CCardBody>
      </CCard>

      <StageDetailModal idOrRef={openId} onClose={closeDetail} onChanged={load} />
      {lead && <StageSettingsModal visible={settingsOpen} onClose={() => setSettingsOpen(false)} onSaved={s => setRequestsOpen(s.requests_open)} />}

      <style>{`
        .stg-page { display: flex; flex-direction: column; gap: 14px; }
        .stg-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; flex-wrap: wrap; }
        .stg-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
        .stg-err { background: #fff1f2; border: 1px solid #fecdd3; color: #9f1239; border-radius: 10px; padding: 10px 14px; margin-bottom: 10px; }
        .stg-list { display: flex; flex-direction: column; gap: 8px; }
        .stg-row {
          position: relative; display: flex; align-items: center; gap: 14px; width: 100%; text-align: left;
          border: 1px solid #e6ebf2; background: #fff; border-radius: 12px; padding: 12px 14px 12px 18px; overflow: hidden;
          transition: box-shadow .15s ease, border-color .15s ease, transform .15s ease; cursor: pointer;
        }
        .stg-row:hover { border-color: #cbd5e1; box-shadow: 0 8px 20px rgba(15,23,42,.07); transform: translateY(-1px); }
        .stg-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
        .stg-main { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
        .stg-line { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .stg-ref { font-family: monospace; font-weight: 800; color: #0f766e; font-size: .875rem; }
        .stg-pill { font-size: .875rem; font-weight: 800; padding: 2px 9px; border-radius: 999px; }
        .stg-name { color: #0f172a; font-size: .95rem; }
        .stg-sub { color: #64748b; font-size: .875rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .stg-side { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; font-size: .875rem; font-weight: 600; color: #334155; flex-shrink: 0; }
        @media (max-width: 640px) {
          .stg-row { flex-direction: column; align-items: stretch; gap: 6px; }
          .stg-side { align-items: flex-start; }
        }
      `}</style>
    </div>
  )
}

export default StagesPage
