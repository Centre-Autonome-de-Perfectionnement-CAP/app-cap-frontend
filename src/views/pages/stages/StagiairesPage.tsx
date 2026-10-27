// src/views/pages/stages/StagiairesPage.tsx
// Stagiaires (demandes acceptées) : une ligne par stagiaire avec sa période,
// son encadrement, son assiduité, ses rapports et ses codes d'attention.
// « Détails » ouvre son dossier. Le filtre est dans l'adresse et dans le
// titre : on sait toujours ce que l'on regarde.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CButton, CCard, CCardBody, CFormInput, CFormCheck, CInputGroup, CInputGroupText, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilReload, cilGroup, cilX } from '@coreui/icons'
import stageService, { type FollowResponse, type FollowRow, type InternScope } from '@/services/stage.service'
import { showSuccess, showError, friendlyError } from '@/components/common/ActionResult'
import { useAuth } from '@/contexts'
import { isStagesLead } from './StagesGuard'
import { InternInvitations, InviteInternButton } from './InternInvitations'
import SupervisorAssignModal from './SupervisorAssignModal'
import { FormBinomeModal } from './BinomesPage'
import {
  PageHead, Empty, Pill, StagesStyles, ExportButton, FilterTabs, CodeBadges, CodesLegend, useOpenDossier,
} from './StagesUi'
import { PHASE, INTERN_SCOPES, frDate } from './stageUtils'

const LEAD_SCOPES: InternScope[] = ['active', 'current', 'upcoming', 'unsupervised', 'finished', 'all']
const SUPERVISOR_SCOPES: InternScope[] = ['mine', ...LEAD_SCOPES]

const StagiairesPage = () => {
  const { role } = useAuth()
  const lead = isStagesLead(role as string)
  const scopes = lead ? LEAD_SCOPES : SUPERVISOR_SCOPES
  const [params, setParams] = useSearchParams()
  const asked = (params.get('filtre') ?? params.get('scope')) as InternScope | null
  const scope: InternScope = asked && scopes.includes(asked) ? asked : scopes[0]
  const setScope = (s: InternScope) => setParams(p => { const n = new URLSearchParams(p); n.delete('scope'); n.set('filtre', s); return n }, { replace: true })

  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [list, setList] = useState<FollowResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [assignIds, setAssignIds] = useState<number[] | null>(null)
  const [teamOpen, setTeamOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const openDossier = useOpenDossier(`Stagiaires · ${INTERN_SCOPES[scope]}`)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setList(await stageService.follow(scope, search)) } catch (e) { setError(friendlyError(e)) } finally { setLoading(false) }
  }, [scope, search])

  useEffect(() => { load() }, [load])
  useEffect(() => { setSelected([]) }, [scope, search])
  useEffect(() => { const t = setTimeout(() => setSearch(q.trim()), 400); return () => clearTimeout(t) }, [q])

  const rows = list?.data ?? []
  const allChecked = rows.length > 0 && rows.every(r => selected.includes(r.id))
  const toggle = (id: number) => setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))
  const pair = useMemo<[number, number] | undefined>(() => (selected.length === 2 ? [selected[0], selected[1]] : undefined), [selected])

  const selfAssign = async (action: 'add' | 'remove', ids: number[]) => {
    if (!list) return
    setBusy(true)
    try {
      const res: any = await stageService.setSupervisor(ids, list.me.id, action)
      setSelected([])
      await load()
      await showSuccess(action === 'add' ? 'Stagiaires suivis' : 'Stagiaires retirés de votre suivi', res?.message)
    } catch (e) {
      await showError('Action impossible', friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  const exportPath = `stagiaires?scope=${scope}${search ? `&q=${encodeURIComponent(search)}` : ''}`

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title={`Stagiaires · ${INTERN_SCOPES[scope]}`}
        subtitle={lead ? 'Une ligne par stagiaire. « Détails » ouvre son dossier complet.' : 'Les stagiaires que vous suivez, et ceux que vous pouvez prendre en charge.'}
        actions={<>
          <ExportButton path={exportPath} />
          <CButton color="secondary" variant="outline" size="sm" onClick={load} disabled={loading} title="Actualiser"><CIcon icon={cilReload} /></CButton>
          {lead && <InviteInternButton onClick={() => setInviteOpen(true)} />}
        </>}
      />

      <FilterTabs
        options={scopes.map(k => ({ key: k, label: INTERN_SCOPES[k], count: list?.counts?.[k] }))}
        value={scope}
        onChange={setScope}
      />

      <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <CCardBody>
          <CInputGroup style={{ marginBottom: 12 }}>
            <CInputGroupText style={{ background: '#fff' }}><CIcon icon={cilSearch} style={{ width: 16, color: '#94a3b8' }} /></CInputGroupText>
            <CFormInput value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher : nom, référence, établissement…" maxLength={100} />
            {q && <CButton color="secondary" variant="outline" onClick={() => setQ('')} title="Effacer"><CIcon icon={cilX} /></CButton>}
          </CInputGroup>

          {error && <div className="stg-err">{error}</div>}
          {loading && !list && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
          {list && rows.length === 0 && !loading && (
            <Empty text={scope === 'mine'
              ? 'Vous ne suivez encore aucun stagiaire. Ouvrez « Actifs » ou « Sans superviseur » pour en prendre en charge.'
              : `Aucun stagiaire dans « ${INTERN_SCOPES[scope]} ».`} />
          )}

          {rows.length > 0 && (
            <div style={{ overflowX: 'auto', opacity: loading ? 0.6 : 1 }}>
              <table className="stg-table" style={{ minWidth: 860 }}>
                <thead>
                  <tr>
                    <th style={{ width: 34 }}>
                      <CFormCheck checked={allChecked} onChange={() => setSelected(allChecked ? [] : rows.map(r => r.id))} aria-label="Tout sélectionner" />
                    </th>
                    <th>Stagiaire</th><th>Période</th><th>Superviseur</th><th>Assiduité</th><th>Rapports</th><th>Codes</th><th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <InternLine key={r.id} r={r} seuil={list?.seuil ?? 80} lead={lead} busy={busy}
                      checked={selected.includes(r.id)} onToggle={() => toggle(r.id)}
                      onOpen={() => openDossier(r.reference)}
                      onAssign={() => setAssignIds([r.id])}
                      onSelf={action => selfAssign(action, [r.id])} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {rows.length > 0 && <div style={{ marginTop: 12 }}><CodesLegend /></div>}
        </CCardBody>
      </CCard>

      {selected.length > 0 && (
        <div className="stg-bar-sel">
          <strong style={{ marginRight: 'auto' }}>{selected.length} sélectionné(s)</strong>
          {lead && <CButton color="light" size="sm" onClick={() => setAssignIds(selected)}>Attribuer un superviseur</CButton>}
          {!lead && <CButton color="light" size="sm" disabled={busy} onClick={() => selfAssign('add', selected)}>Les suivre</CButton>}
          {!lead && <CButton color="light" size="sm" variant="outline" style={{ color: '#fff', borderColor: '#fff' }} disabled={busy} onClick={() => selfAssign('remove', selected)}>Ne plus les suivre</CButton>}
          <CButton color="light" size="sm" disabled={selected.length !== 2} title={selected.length !== 2 ? 'Un binôme compte exactement deux stagiaires' : undefined}
            onClick={() => setTeamOpen(true)}>
            <CIcon icon={cilGroup} className="me-1" />Former un binôme
          </CButton>
          <CButton color="link" size="sm" style={{ color: '#fff' }} onClick={() => setSelected([])}>Annuler</CButton>
        </div>
      )}

      {lead && <InternInvitations open={inviteOpen} onOpenChange={setInviteOpen} onRegistered={load} />}

      {lead && (
        <SupervisorAssignModal visible={assignIds !== null} ids={assignIds ?? []}
          onClose={() => setAssignIds(null)} onDone={() => { setAssignIds(null); setSelected([]); load() }} />
      )}
      <FormBinomeModal visible={teamOpen} preset={pair} onClose={() => setTeamOpen(false)} onDone={() => { setTeamOpen(false); setSelected([]); load() }} />
    </div>
  )
}

const InternLine = ({ r, seuil, lead, busy, checked, onToggle, onOpen, onAssign, onSelf }: {
  r: FollowRow; seuil: number; lead: boolean; busy: boolean; checked: boolean
  onToggle: () => void; onOpen: () => void; onAssign: () => void; onSelf: (a: 'add' | 'remove') => void
}) => {
  const ph = PHASE[r.phase]
  return (
    <tr style={{ background: checked ? '#f0fdfa' : undefined }}>
      <td><CFormCheck checked={checked} onChange={onToggle} aria-label={`Sélectionner ${r.nom_complet}`} /></td>
      <td style={{ minWidth: 190 }}>
        <button type="button" onClick={onOpen} style={{ all: 'unset', cursor: 'pointer', fontWeight: 700, color: '#0f172a' }}>{r.nom_complet}</button>
        <div><span className="stg-ref">{r.reference}</span> <span className="stg-muted">· {r.etablissement}</span></div>
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        {frDate(r.date_debut_reelle ?? r.date_debut)} → {frDate(r.date_fin)}
        <div><Pill color={ph.color} bg={ph.bg}>{ph.label}</Pill></div>
      </td>
      <td style={{ minWidth: 150 }}>
        {r.supervisors.length > 0 && <div>{r.supervisors.map(s => s.name).join(', ')}</div>}
        {lead && r.phase !== 'finished' && (
          <CButton size="sm" color="primary" variant={r.supervisors.length ? 'ghost' : 'outline'} className={r.supervisors.length ? 'px-0' : undefined} onClick={onAssign}>
            {r.supervisors.length ? 'Changer' : 'Attribuer'}
          </CButton>
        )}
        {!lead && r.phase !== 'finished' && (r.supervised_by_me
          ? <CButton size="sm" color="secondary" variant="ghost" className="px-0" disabled={busy} onClick={() => onSelf('remove')}>Ne plus suivre</CButton>
          : <CButton size="sm" color="success" style={{ color: '#fff' }} disabled={busy} onClick={() => onSelf('add')}>Suivre</CButton>)}
        {r.supervisors.length === 0 && r.phase === 'finished' && <span className="stg-muted">—</span>}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        {!r.activated ? <span className="stg-muted">{r.phase === 'upcoming' ? 'Pas commencé' : 'Non activé'}</span>
          : r.taux === null ? <span className="stg-muted">—</span>
            : <>
              <strong style={{ color: r.jours_ouvres >= 5 && r.taux < seuil ? '#c2410c' : '#047857' }}>{r.taux} %</strong>
              <div className="stg-muted">{r.absences} abs. · {r.retards} retard(s)</div>
            </>}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        {r.activated ? <>
          {r.rapports.validated}/{r.rapports.deposited} validé(s)
          <div className="stg-muted">Final : {r.rapports.final_validated ? 'validé' : 'non validé'}</div>
        </> : <span className="stg-muted">—</span>}
      </td>
      <td>{r.codes.length ? <CodeBadges codes={r.codes} /> : <span className="stg-muted">—</span>}</td>
      <td style={{ textAlign: 'right' }}><CButton size="sm" color="primary" onClick={onOpen}>Détails</CButton></td>
    </tr>
  )
}

export default StagiairesPage
