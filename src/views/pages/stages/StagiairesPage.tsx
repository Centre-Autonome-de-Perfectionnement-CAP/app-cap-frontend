// src/views/pages/stages/StagiairesPage.tsx
// Stagiaires (demandes acceptées) : superviseurs, binômes, groupe WhatsApp.
// Le superviseur peut s'attribuer des stagiaires ; le responsable attribue
// n'importe quel superviseur.

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CButton, CCard, CCardBody, CFormInput, CFormCheck, CFormSelect, CInputGroup, CInputGroupText, CSpinner,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch, cilReload, cilMediaPlay, cilCalendar, cilCheckCircle, cilUserX, cilUser, cilList, cilGroup,
} from '@coreui/icons'
import StatCard from '@/views/pages/demandes/components/ui/StatCard'
import stageService, { type Intern, type InternListResponse, type InternScope, type Supervisor } from '@/services/stage.service'
import { showSuccess, showError, friendlyError } from '@/components/common/ActionResult'
import { useAuth } from '@/contexts'
import { isStagesLead } from './StagesGuard'
import StageDetailModal from './StageDetailModal'
import { InternInvitations, InviteInternButton } from './InternInvitations'
import { PageHead, Empty, Pill, StagesStyles } from './StagesUi'
import { frDate, durationLabel } from './stageUtils'

const PHASE = {
  current:  { label: 'En cours', color: '#059669', bg: '#ecfdf5' },
  upcoming: { label: 'À venir',  color: '#2563eb', bg: '#eff6ff' },
  finished: { label: 'Terminé',  color: '#64748b', bg: '#f1f5f9' },
} as const

const WA = {
  added:   { label: 'Dans le groupe WhatsApp', color: '#15803d', bg: '#dcfce7' },
  invited: { label: 'Lien du groupe envoyé',    color: '#b45309', bg: '#fef3c7' },
  removed: { label: 'Sorti du groupe',          color: '#64748b', bg: '#f1f5f9' },
} as const

const StagiairesPage = () => {
  const { role } = useAuth()
  const lead = isStagesLead(role as string)
  const [inviteOpen, setInviteOpen] = useState(false)
  const cards: { key: InternScope; label: string; icon: any; color: string; bg: string }[] = [
    ...(!lead ? [{ key: 'mine' as InternScope, label: 'Mes stagiaires', icon: cilUser, color: '#0f766e', bg: '#f0fdfa' }] : []),
    { key: 'current',      label: 'En cours',         icon: cilMediaPlay,   color: '#059669', bg: '#ecfdf5' },
    { key: 'upcoming',     label: 'À venir',          icon: cilCalendar,    color: '#2563eb', bg: '#eff6ff' },
    { key: 'unsupervised', label: 'Sans superviseur', icon: cilUserX,       color: '#d97706', bg: '#fffbeb' },
    { key: 'finished',     label: 'Terminés',         icon: cilCheckCircle, color: '#64748b', bg: '#f1f5f9' },
    { key: 'all',          label: 'Tous',             icon: cilList,        color: '#7c3aed', bg: '#f5f3ff' },
  ]

  const [scope, setScope] = useState<InternScope>(lead ? 'current' : 'mine')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [list, setList] = useState<InternListResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [openId, setOpenId] = useState<number | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const [teamOpen, setTeamOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      setList(await stageService.interns(scope, search || undefined))
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setLoading(false)
    }
  }, [scope, search])

  useEffect(() => { load() }, [load])
  useEffect(() => { setSelected([]) }, [scope, search])
  useEffect(() => {
    const t = setTimeout(() => setSearch(q.trim()), 400)
    return () => clearTimeout(t)
  }, [q])

  const me = list?.me
  const rows = list?.data ?? []
  const allChecked = rows.length > 0 && rows.every(r => selected.includes(r.id))
  const toggle = (id: number) => setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]))
  const selectedRows = useMemo(() => rows.filter(r => selected.includes(r.id)), [rows, selected])

  const selfAssign = async (action: 'add' | 'remove', ids = selected) => {
    if (!me) return
    setBusy(true)
    try {
      const res: any = await stageService.setSupervisor(ids, me.id, action)
      setSelected([])
      await load()
      await showSuccess(action === 'add' ? 'Stagiaires attribués' : 'Stagiaires retirés', res?.message)
    } catch (e) {
      await showError('Action impossible', friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title="Stagiaires"
        subtitle={lead ? 'Suivi des stagiaires, de leurs superviseurs et de leurs binômes.' : 'Les stagiaires que vous suivez, et ceux que vous pouvez prendre en charge.'}
        actions={<>
          <CButton color="secondary" variant="outline" size="sm" onClick={load} disabled={loading} title="Actualiser"><CIcon icon={cilReload} /></CButton>
          {lead && <InviteInternButton onClick={() => setInviteOpen(true)} />}
        </>}
      />

      <div className="stg-cards">
        {cards.map(c => (
          <StatCard key={c.key} label={c.label} count={list?.counts?.[c.key] ?? 0} color={c.color} bg={c.bg}
            icon={<CIcon icon={c.icon} style={{ width: 17 }} />} active={scope === c.key} onClick={() => setScope(c.key)} />
        ))}
      </div>

      <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <CCardBody>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
            <CFormCheck checked={allChecked} disabled={rows.length === 0}
              onChange={() => setSelected(allChecked ? [] : rows.map(r => r.id))} label="Tout" />
            <CInputGroup style={{ flex: 1, minWidth: 220 }}>
              <CInputGroupText style={{ background: '#fff' }}><CIcon icon={cilSearch} style={{ width: 16, color: '#94a3b8' }} /></CInputGroupText>
              <CFormInput value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher : nom, référence, établissement…" maxLength={100} />
            </CInputGroup>
          </div>

          {error && <div className="stg-err">{error}</div>}
          {loading && !list && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
          {list && rows.length === 0 && !loading && (
            <Empty text={scope === 'mine' ? 'Vous ne suivez encore aucun stagiaire. Ouvrez « En cours » ou « Sans superviseur » pour en prendre en charge.' : 'Aucun stagiaire dans cette catégorie.'} />
          )}

          <div className="stg-list" style={{ opacity: loading ? 0.6 : 1 }}>
            {rows.map(r => <InternRow key={r.id} r={r} checked={selected.includes(r.id)} onToggle={() => toggle(r.id)}
              onOpen={() => setOpenId(r.id)} canSelf={!lead} busy={busy}
              onSelf={action => selfAssign(action, [r.id])} />)}
          </div>
        </CCardBody>
      </CCard>

      {selected.length > 0 && (
        <div className="stg-bar-sel">
          <strong style={{ marginRight: 'auto' }}>{selected.length} sélectionné(s)</strong>
          {!lead && <CButton color="light" size="sm" disabled={busy} onClick={() => selfAssign('add')}>Me les attribuer</CButton>}
          {!lead && <CButton color="light" size="sm" variant="outline" style={{ color: '#fff', borderColor: '#fff' }} disabled={busy} onClick={() => selfAssign('remove')}>Me retirer</CButton>}
          {lead && <CButton color="light" size="sm" onClick={() => setAssignOpen(true)}>Superviseur…</CButton>}
          <CButton color="light" size="sm" disabled={selected.length < 2} onClick={() => setTeamOpen(true)}>
            <CIcon icon={cilGroup} className="me-1" />Former un binôme
          </CButton>
          <CButton color="link" size="sm" style={{ color: '#fff' }} onClick={() => setSelected([])}>Annuler</CButton>
        </div>
      )}

      {lead && <InternInvitations open={inviteOpen} onOpenChange={setInviteOpen} onRegistered={load} />}

      <StageDetailModal idOrRef={openId} onClose={() => setOpenId(null)} onChanged={load} />
      {lead && <AssignModal visible={assignOpen} ids={selected} onClose={() => setAssignOpen(false)} onDone={() => { setAssignOpen(false); setSelected([]); load() }} />}
      <TeamQuickModal visible={teamOpen} rows={selectedRows} onClose={() => setTeamOpen(false)} onDone={() => { setTeamOpen(false); setSelected([]); load() }} />
    </div>
  )
}

const InternRow = ({ r, checked, onToggle, onOpen, canSelf, busy, onSelf }: {
  r: Intern; checked: boolean; onToggle: () => void; onOpen: () => void; canSelf: boolean; busy: boolean
  onSelf: (a: 'add' | 'remove') => void
}) => {
  const ph = PHASE[r.phase]
  return (
    <div className="stg-card stg-row2" style={{ borderColor: checked ? '#0f766e' : undefined }}>
      <CFormCheck checked={checked} onChange={onToggle} aria-label={`Sélectionner ${r.nom_complet}`} />
      <button type="button" onClick={onOpen} style={{ all: 'unset', cursor: 'pointer', flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <strong style={{ color: '#0f172a' }}>{r.nom_complet}</strong>
          <Pill color={ph.color} bg={ph.bg}>{ph.label}</Pill>
          {r.team?.name && <span className="stg-chip"><CIcon icon={cilGroup} style={{ width: 12 }} />{r.team.name}</span>}
          {r.whatsapp_group && <Pill color={WA[r.whatsapp_group].color} bg={WA[r.whatsapp_group].bg}>{WA[r.whatsapp_group].label}</Pill>}
        </span>
        <span className="stg-muted">
          {frDate(r.date_debut)} → {frDate(r.date_fin)} · {durationLabel(r.date_debut, r.date_fin)} · {r.formation} ({r.etablissement})
        </span>
        <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {r.supervisors.length === 0
            ? <span style={{ fontSize: '.875rem', color: '#d97706', fontWeight: 700 }}>Sans superviseur</span>
            : r.supervisors.map(s => <span key={s.id} className="stg-chip"><CIcon icon={cilUser} style={{ width: 12 }} />{s.name}</span>)}
        </span>
      </button>
      {canSelf && (
        r.supervised_by_me
          ? <CButton size="sm" color="secondary" variant="outline" disabled={busy} onClick={() => onSelf('remove')}>Ne plus suivre</CButton>
          : <CButton size="sm" color="success" style={{ color: '#fff' }} disabled={busy || r.phase === 'finished'} onClick={() => onSelf('add')}>Suivre</CButton>
      )}
    </div>
  )
}

/** Responsable : attribuer / retirer un superviseur aux stagiaires sélectionnés. */
const AssignModal = ({ visible, ids, onClose, onDone }: { visible: boolean; ids: number[]; onClose: () => void; onDone: () => void }) => {
  const [sups, setSups] = useState<Supervisor[] | null>(null)
  const [supId, setSupId] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setErr(null); setSupId('')
    stageService.supervisors().then(setSups).catch(e => setErr(friendlyError(e)))
  }, [visible])

  const run = async (action: 'add' | 'remove') => {
    if (!supId) { setErr('Choisissez un superviseur.'); return }
    setBusy(true); setErr(null)
    try {
      const res: any = await stageService.setSupervisor(ids, Number(supId), action)
      onDone()
      await showSuccess(action === 'add' ? 'Superviseur attribué' : 'Superviseur retiré', res?.message)
    } catch (e) {
      setErr(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader><CModalTitle style={{ fontSize: '1rem' }}>Superviseur pour {ids.length} stagiaire(s)</CModalTitle></CModalHeader>
      <CModalBody>
        {!sups && !err && <CSpinner size="sm" color="primary" />}
        {sups && sups.length === 0 && <p className="stg-muted">Aucun superviseur inscrit. Invitez-en depuis la page « Superviseurs ».</p>}
        {sups && sups.length > 0 && (
          <CFormSelect value={supId} onChange={e => setSupId(e.target.value)}>
            <option value="">Choisir un superviseur…</option>
            {sups.map(s => <option key={s.id} value={s.id}>{s.name} - {s.active_interns} stagiaire(s) en cours</option>)}
          </CFormSelect>
        )}
        {err && <div className="stg-err" style={{ marginTop: 12 }}>{err}</div>}
      </CModalBody>
      <CModalFooter>
        <CButton color="danger" variant="outline" disabled={busy || !sups?.length} onClick={() => run('remove')}>Retirer</CButton>
        <CButton color="success" style={{ color: '#fff' }} disabled={busy || !sups?.length} onClick={() => run('add')}>
          {busy && <CSpinner size="sm" className="me-1" />}Attribuer
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

/** Former un binôme / groupe avec les stagiaires sélectionnés. */
const TeamQuickModal = ({ visible, rows, onClose, onDone }: { visible: boolean; rows: Intern[]; onClose: () => void; onDone: () => void }) => {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => { if (visible) { setName(''); setErr(null) } }, [visible])

  const save = async () => {
    if (!name.trim()) { setErr('Donnez un nom au binôme.'); return }
    setBusy(true); setErr(null)
    try {
      await stageService.saveTeam(null, name.trim(), rows.map(r => r.id))
      onDone()
      await showSuccess('Binôme enregistré')
    } catch (e) {
      setErr(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader><CModalTitle style={{ fontSize: '1rem' }}>Former un binôme / groupe</CModalTitle></CModalHeader>
      <CModalBody>
        <CFormInput value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder="Ex. : Binôme Réseaux 1" />
        <ul style={{ margin: '12px 0 0', paddingLeft: 18, fontSize: '.88rem' }}>
          {rows.map(r => <li key={r.id}>{r.nom_complet}{r.team?.name ? <span className="stg-muted"> (quitte « {r.team.name} »)</span> : null}</li>)}
        </ul>
        {err && <div className="stg-err" style={{ marginTop: 12 }}>{err}</div>}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={onClose}>Annuler</CButton>
        <CButton color="primary" onClick={save} disabled={busy}>{busy && <CSpinner size="sm" className="me-1" />}Enregistrer</CButton>
      </CModalFooter>
    </CModal>
  )
}

export default StagiairesPage
