// src/views/pages/stages/TachesPage.tsx
// Tâches des stagiaires : confier une tâche, examiner le travail remis
// (valider ou demander de revoir), rendre public un travail validé
// (« Travaux publiés », annoncés à tous le soir).

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CButton, CCard, CCardBody, CFormCheck, CFormInput, CFormLabel, CFormTextarea, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilReload, cilTask } from '@coreui/icons'
import stageService, { type TaskIntern, type TaskSummary } from '@/services/stage.service'
import { friendlyError, showSuccess } from '@/components/common/ActionResult'
import { useAuth } from '@/contexts'
import { PageHead, Empty, FilterTabs, Pill, StagesStyles } from './StagesUi'
import { frDate, todayIso, TASK_STATUS } from './stageUtils'
import TaskModal from './TaskModal'
import PersonPicker from './PersonPicker'

type View = 'submitted' | 'revision' | 'todo' | 'validated' | 'all' | 'publies'
const VIEWS: { key: View; label: string }[] = [
  { key: 'submitted', label: 'À examiner' }, { key: 'revision', label: 'À revoir' }, { key: 'todo', label: 'À faire' },
  { key: 'validated', label: 'Validées' }, { key: 'all', label: 'Toutes' }, { key: 'publies', label: 'Travaux publiés' },
]

const TachesPage = () => {
  const { role } = useAuth()
  const [params, setParams] = useSearchParams()
  const [view, setView] = useState<View>(() => (params.get('vue') === 'publies' ? 'publies' : 'submitted'))
  const [mine, setMine] = useState(role === 'superviseur')
  const [rows, setRows] = useState<TaskSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [openId, setOpenId] = useState<number | null>(() => (params.get('tache') ? Number(params.get('tache')) : null))

  const load = useCallback(async () => {
    setError(null)
    try {
      if (view === 'publies') {
        setRows(await stageService.tasksPublished())
      } else {
        const r = await stageService.tasks(view, mine)
        setRows(r.data.tasks)
      }
    } catch (e) { setError(friendlyError(e)) }
  }, [view, mine])
  useEffect(() => { load() }, [load])

  const close = () => {
    setOpenId(null)
    if (params.has('tache')) { params.delete('tache'); setParams(params, { replace: true }) }
  }

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title="Tâches des stagiaires"
        subtitle="Confiez une tâche, examinez le travail remis et rendez publics les meilleurs travaux."
        actions={<>
          <CButton color="secondary" variant="outline" size="sm" onClick={load} title="Actualiser"><CIcon icon={cilReload} /></CButton>
          <CButton color="primary" size="sm" onClick={() => setCreating(true)}>
            <CIcon icon={cilPlus} className="me-1" />Nouvelle tâche
          </CButton>
        </>}
      />
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <FilterTabs options={VIEWS} value={view} onChange={v => { setRows(null); setView(v) }} />
        {view !== 'publies' && <CFormCheck id="tsk-mine" label="Seulement mes stagiaires" checked={mine} onChange={e => setMine(e.target.checked)} />}
      </div>

      {error && <div className="stg-err">{error}</div>}
      {!rows && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
      {rows && rows.length === 0 && (
        <CCard className="border-0 shadow-sm"><CCardBody>
          <Empty text={view === 'publies' ? 'Aucun travail publié pour le moment.' : 'Aucune tâche dans cette catégorie.'} />
        </CCardBody></CCard>
      )}

      <div className="stg-list">
        {rows?.map(t => {
          const st = TASK_STATUS[t.status]
          const late = t.due_date && t.status !== 'validated' && t.due_date < todayIso()
          return (
            <button key={t.id} type="button" className="stg-card stg-row2" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setOpenId(t.id)}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: '#f0fdfa', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CIcon icon={cilTask} style={{ width: 18 }} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ color: '#0f172a' }}>{t.title}</strong>
                <span className="stg-muted" style={{ display: 'block' }}>
                  {t.members.map(m => m.name).join(' et ')}
                  {' · '}{t.created_by.type === 'staff' ? `confiée par ${t.created_by.name}` : 'créée par le stagiaire'}
                  {t.version > 0 ? ` · version ${t.version}` : ''}
                </span>
              </span>
              {t.published && <Pill color="#6d28d9" bg="#f5f3ff">Publié</Pill>}
              {view !== 'publies' && <Pill color={st.color} bg={st.bg}>{t.status_label}</Pill>}
              <span className="stg-muted" style={late ? { color: '#e11d48', fontWeight: 700 } : undefined}>
                {view === 'publies' ? frDate(t.published_at) : t.due_date ? frDate(t.due_date) : 'Sans échéance'}
              </span>
            </button>
          )
        })}
      </div>

      <TaskModal taskId={openId} onClose={close} onChanged={load} />
      {creating && <NewTaskModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load() }} />}
    </div>
  )
}

const NewTaskModal = ({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) => {
  const [interns, setInterns] = useState<TaskIntern[] | null>(null)
  const [intern, setIntern] = useState<number | null>(null)
  const [pair, setPair] = useState(false)
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [due, setDue] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const chosen = interns?.find(i => i.id === intern)

  // Stagiaires en cours (liste à jour à chaque ouverture)
  useEffect(() => {
    stageService.tasks('todo', false).then(r => setInterns(r.data.interns)).catch(e => setErr(friendlyError(e)))
  }, [])

  const save = async () => {
    if (!chosen) { setErr('Choisissez le stagiaire.'); return }
    if (!title.trim()) { setErr('Donnez un titre à la tâche.'); return }
    setBusy(true); setErr(null)
    try {
      await stageService.createTask({
        stage_request_id: chosen.id, title: title.trim(), instructions: instructions.trim() || undefined,
        due_date: due || undefined, pour_binome: !!chosen.binome && pair,
      })
      showSuccess('Tâche confiée : le stagiaire est prévenu.')
      onCreated()
    } catch (e) {
      setErr(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <CModal visible onClose={onClose} alignment="center">
      <CModalHeader><CModalTitle>Nouvelle tâche</CModalTitle></CModalHeader>
      <CModalBody>
        <CFormLabel className="fw-semibold">Stagiaire <span className="text-danger">*</span></CFormLabel>
        <PersonPicker people={interns?.map(i => ({ id: i.id, name: i.name, mine: i.mine, hint: i.binome ? `binôme : ${i.binome}` : null })) ?? null}
          value={intern} onChange={id => { setIntern(id); setPair(false) }} />
        {chosen?.binome && (
          <CFormCheck className="mt-2" id="tsk-pair" label={`Aussi pour son binôme (${chosen.binome})`} checked={pair} onChange={e => setPair(e.target.checked)} />
        )}
        <CFormLabel className="fw-semibold mt-3">Titre <span className="text-danger">*</span></CFormLabel>
        <CFormInput value={title} maxLength={200} onChange={e => setTitle(e.target.value)} placeholder="Exemple : Maquette de la page d'accueil" />
        <CFormLabel className="fw-semibold mt-3">Consignes</CFormLabel>
        <CFormTextarea rows={4} maxLength={3000} value={instructions} onChange={e => setInstructions(e.target.value)}
          placeholder="Exemple : Version téléphone et ordinateur, avec une courte note des choix." />
        <CFormLabel className="fw-semibold mt-3">Échéance</CFormLabel>
        <CFormInput type="date" min={todayIso()} value={due} onChange={e => setDue(e.target.value)} />
        {err && <div className="stg-err mt-3">{err}</div>}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>Annuler</CButton>
        <CButton color="primary" disabled={busy} onClick={save}>{busy && <CSpinner size="sm" className="me-1" />}Confier la tâche</CButton>
      </CModalFooter>
    </CModal>
  )
}

export default TachesPage
