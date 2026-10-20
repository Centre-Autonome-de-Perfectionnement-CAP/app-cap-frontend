// src/views/pages/stages/BinomesPage.tsx
// Binômes et groupes de travail des stagiaires.

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CButton, CCard, CCardBody, CFormInput, CFormCheck, CSpinner,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash, cilGroup } from '@coreui/icons'
import stageService, { type Intern, type StageTeam } from '@/services/stage.service'
import { showSuccess, showError, friendlyError } from '@/components/common/ActionResult'
import { PageHead, Empty, StagesStyles } from './StagesUi'

const BinomesPage = () => {
  const [teams, setTeams] = useState<StageTeam[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<StageTeam | 'new' | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<StageTeam | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try { setTeams(await stageService.teams()) } catch (e) { setError(friendlyError(e)) }
  }, [])
  useEffect(() => { load() }, [load])

  const remove = async () => {
    if (!confirmDelete) return
    setBusy(true)
    try {
      await stageService.deleteTeam(confirmDelete.id)
      setConfirmDelete(null)
      await load()
      await showSuccess('Binôme supprimé', 'Les stagiaires restent suivis par leurs superviseurs.')
    } catch (e) {
      await showError('Suppression impossible', friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title="Binômes et groupes"
        subtitle="Regroupez les stagiaires qui travaillent ensemble."
        actions={<CButton color="primary" size="sm" onClick={() => setEditing('new')}><CIcon icon={cilPlus} className="me-1" />Nouveau</CButton>}
      />
      {error && <div className="stg-err">{error}</div>}
      {!teams && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
      {teams && teams.length === 0 && <CCard className="border-0 shadow-sm"><CCardBody><Empty text="Aucun binôme pour l'instant." /></CCardBody></CCard>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {teams?.map(t => (
          <div key={t.id} className="stg-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: '#f0fdfa', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CIcon icon={cilGroup} style={{ width: 16 }} />
              </span>
              <strong style={{ flex: 1, minWidth: 0 }}>{t.name}</strong>
              <CButton size="sm" color="secondary" variant="ghost" onClick={() => setEditing(t)} title="Modifier"><CIcon icon={cilPencil} /></CButton>
              <CButton size="sm" color="danger" variant="ghost" onClick={() => setConfirmDelete(t)} title="Supprimer"><CIcon icon={cilTrash} /></CButton>
            </div>
            <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontSize: '.88rem' }}>
              {t.members.map(m => <li key={m.id}>{m.nom_complet}</li>)}
              {t.members.length === 0 && <li className="stg-muted">Aucun stagiaire actif</li>}
            </ul>
          </div>
        ))}
      </div>

      <TeamEditor team={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />

      <CModal visible={!!confirmDelete} onClose={() => setConfirmDelete(null)} alignment="center">
        <CModalHeader><CModalTitle style={{ fontSize: '1rem' }}>Supprimer « {confirmDelete?.name} » ?</CModalTitle></CModalHeader>
        <CModalBody>Les stagiaires ne seront plus regroupés. Rien d'autre ne change.</CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setConfirmDelete(null)}>Annuler</CButton>
          <CButton color="danger" style={{ color: '#fff' }} disabled={busy} onClick={remove}>{busy && <CSpinner size="sm" className="me-1" />}Supprimer</CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

const TeamEditor = ({ team, onClose, onSaved }: { team: StageTeam | 'new' | null; onClose: () => void; onSaved: () => void }) => {
  const [name, setName] = useState('')
  const [interns, setInterns] = useState<Intern[] | null>(null)
  const [picked, setPicked] = useState<number[]>([])
  const [filter, setFilter] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!team) return
    setErr(null); setFilter('')
    setName(team === 'new' ? '' : team.name)
    setPicked(team === 'new' ? [] : team.members.map(m => m.id))
    stageService.interns('all').then(r => setInterns(r.data.filter(i => i.phase !== 'finished'))).catch(e => setErr(friendlyError(e)))
  }, [team])

  const shown = useMemo(() => {
    const f = filter.trim().toLowerCase()
    return (interns ?? []).filter(i => !f || i.nom_complet.toLowerCase().includes(f) || i.reference.toLowerCase().includes(f))
  }, [interns, filter])

  const save = async () => {
    if (!name.trim()) { setErr('Donnez un nom au binôme.'); return }
    if (picked.length < 2) { setErr('Choisissez au moins deux stagiaires.'); return }
    setBusy(true); setErr(null)
    try {
      await stageService.saveTeam(team === 'new' || !team ? null : team.id, name.trim(), picked)
      onSaved()
      await showSuccess('Binôme enregistré')
    } catch (e) {
      setErr(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <CModal visible={!!team} onClose={onClose} alignment="center" scrollable fullscreen="sm">
      <CModalHeader><CModalTitle style={{ fontSize: '1rem' }}>{team === 'new' ? 'Nouveau binôme / groupe' : 'Modifier le binôme'}</CModalTitle></CModalHeader>
      <CModalBody>
        <CFormInput value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder="Nom (ex. : Binôme Réseaux 1)" />
        <CFormInput className="mt-2" size="sm" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filtrer les stagiaires…" />
        <div style={{ marginTop: 10, maxHeight: 320, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {!interns && !err && <CSpinner size="sm" color="primary" />}
          {shown.map(i => (
            <CFormCheck key={i.id} id={`tm-${i.id}`} checked={picked.includes(i.id)}
              onChange={() => setPicked(p => (p.includes(i.id) ? p.filter(x => x !== i.id) : [...p, i.id]))}
              label={<span>{i.nom_complet}{i.team && (team === 'new' || i.team.id !== (team as StageTeam)?.id) ? <span className="stg-muted"> · déjà dans « {i.team.name} »</span> : null}</span>} />
          ))}
          {interns && shown.length === 0 && <span className="stg-muted">Aucun stagiaire.</span>}
        </div>
        <div className="stg-muted" style={{ marginTop: 8 }}>{picked.length} sélectionné(s)</div>
        {err && <div className="stg-err" style={{ marginTop: 12 }}>{err}</div>}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={onClose}>Annuler</CButton>
        <CButton color="primary" onClick={save} disabled={busy}>{busy && <CSpinner size="sm" className="me-1" />}Enregistrer</CButton>
      </CModalFooter>
    </CModal>
  )
}

export default BinomesPage
