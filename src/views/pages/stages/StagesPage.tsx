// src/views/pages/stages/StagesPage.tsx
// Demandes de stage : étude, propositions de dates et notes de service.
// Le filtre est dans l'adresse et dans le titre ; une demande s'ouvre dans
// son dossier.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CButton, CCard, CCardBody, CFormInput, CSpinner, CInputGroup, CInputGroupText } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSettings, cilSearch, cilReload } from '@coreui/icons'
import stageService, { type StageListResponse, type StageStatus } from '@/services/stage.service'
import { friendlyError } from '@/components/common/ActionResult'
import { useAuth } from '@/contexts'
import { isStagesLead } from './StagesGuard'
import { ExportButton, Empty, FilterTabs, PageHead, Pill, StagesStyles, useOpenDossier } from './StagesUi'
import { STATUS_STYLE, frDate, durationLabel } from './stageUtils'

type Filter = 'to_handle' | StageStatus | 'all'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'to_handle',        label: 'À traiter' },
  { key: 'counter_proposed', label: 'Contre-propositions' },
  { key: 'proposal_sent',    label: 'En attente de réponse' },
  { key: 'accepted',         label: 'Acceptées' },
  { key: 'rejected',         label: 'Non retenues' },
  { key: 'expired',          label: 'Expirées' },
  { key: 'withdrawn',        label: 'Désistements' },
  { key: 'all',              label: 'Toutes' },
]

const StagesPage = () => {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const { role } = useAuth()
  const lead = isStagesLead(role as string)
  const asked = params.get('filtre') as Filter | null
  const filter: Filter = asked && FILTERS.some(f => f.key === asked) ? asked : 'to_handle'
  const label = FILTERS.find(f => f.key === filter)!.label
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [list, setList] = useState<StageListResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requestsOpen, setRequestsOpen] = useState<boolean | null>(null)
  // Position du lieu non relevée : aucun stagiaire ne peut confirmer sa présence ni pointer.
  const [placeMissing, setPlaceMissing] = useState(false)
  const openDossier = useOpenDossier(`Demandes de stage · ${label}`)

  const setFilter = (f: Filter) => {
    setPage(1)
    setParams(p => { const n = new URLSearchParams(p); n.set('filtre', f); return n }, { replace: true })
  }

  // Ancien lien (?ref=…) : le dossier, directement.
  useEffect(() => {
    const ref = params.get('ref')
    if (ref) navigate(`/stages/dossier/${encodeURIComponent(ref)}`, { replace: true })
  }, [params, navigate])

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
    stageService.getSettings()
      .then(s => { setRequestsOpen(s.requests_open); setPlaceMissing(!s.lieu_position) })
      .catch(() => setRequestsOpen(null))
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

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title={`Demandes de stage · ${label}`}
        subtitle="Étude, propositions de dates et notes de service."
        actions={<>
          {requestsOpen !== null && (
            <Pill color={requestsOpen ? '#047857' : '#b45309'} bg={requestsOpen ? '#ecfdf5' : '#fffbeb'}>
              {requestsOpen ? 'Demandes ouvertes' : 'Demandes fermées'}
            </Pill>
          )}
          <CButton color="secondary" variant="outline" size="sm" onClick={() => load()} disabled={loading} title="Actualiser">
            <CIcon icon={cilReload} />
          </CButton>
          {lead && <ExportButton path={`demandes?status=${filter}`} />}
          {lead && (
            <CButton color="primary" variant="outline" size="sm" onClick={() => navigate('/stages/reglages')}>
              <CIcon icon={cilSettings} className="me-1" />Réglages
            </CButton>
          )}
        </>}
      />

      {lead && placeMissing && (
        <div className="stg-warn" role="alert">
          <div>
            <strong>Position du lieu de stage non relevée</strong>
            <div>Tant qu'elle ne l'est pas, les stagiaires ne peuvent ni confirmer leur présence ni pointer. Relevez-la depuis le lieu de stage, avec votre téléphone.</div>
          </div>
          <CButton color="warning" size="sm" onClick={() => navigate('/stages/reglages')}>Relever la position</CButton>
        </div>
      )}

      <FilterTabs options={FILTERS.map(f => ({ ...f, count: counts[f.key] ?? 0 }))} value={filter} onChange={setFilter} />

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
          {list && list.data.length === 0 && !loading && <Empty text={`Aucune demande dans « ${label} ».`} />}

          {list && list.data.length > 0 && (
            <div className="stg-list" style={{ opacity: loading ? 0.6 : 1 }}>
              {list.data.map(r => {
                const st = STATUS_STYLE[r.status]
                return (
                  <button key={r.id} type="button" className="stg-row" onClick={() => openDossier(r.reference)}>
                    <span className="stg-bar" style={{ background: st.color }} />
                    <div className="stg-main">
                      <div className="stg-line">
                        <span className="stg-ref">{r.reference}</span>
                        <Pill color={st.color} bg={st.bg}>{r.status_label}</Pill>
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
    </div>
  )
}

export default StagesPage
