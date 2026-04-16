import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  CButton, CCard, CCardBody, CCardHeader, CCol, CRow,
  CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CForm, CFormLabel, CFormSelect, CFormInput, CFormTextarea, CFormCheck,
  CBadge, CSpinner, CAlert, CTooltip,
  CPagination, CPaginationItem,
  CInputGroup, CInputGroupText,
  CCollapse,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPlus, cilPencil, cilTrash, cilBan, cilSearch, cilFilter,
  cilReload, cilWarning, cilCalendar, cilClock, cilBuilding,
  cilRoom, cilUser, cilBook, cilChevronBottom, cilChevronTop, cilX,cilCloudDownload,
} from '@coreui/icons'
import axios from 'axios'

import DownloadEdtModal from './DownloadEdtModal'

// ─── Intercepteur Bearer ──────────────────────────────────────────────────────
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// ─── URLs centralisées ────────────────────────────────────────────────────────
const API     = '/emploi-temps'
const API_SEL = '/emploi-temps/selects'

// ─── Types ───────────────────────────────────────────────────────────────────
interface AcademicYear  { id: number; academic_year: string; libelle: string; is_current: boolean }
interface Department    { id: number; name: string; abbreviation: string }
interface ClassGroup    { id: number; group_name: string; study_level: string }
interface Building      { id: number; name: string; code: string }
interface Room          { id: number; name: string; code: string; capacity: number; room_type: string; building_id?: number; building?: Building }
interface CourseElement { id: number; name: string; code: string; credits: number }
interface Professor     { id: number; first_name: string; last_name: string; email: string }
interface Program       { id: number; semester?: number; course_element?: CourseElement; professor?: Professor }

interface EmploiDuTemps {
  id: number; uuid: string
  academic_year?: AcademicYear
  department?: Department
  class_group?: ClassGroup
  program?: Program
  room?: Room & { building?: Building }
  day_of_week: string; start_time: string; end_time: string
  duration_in_minutes: number; duration_in_hours: number; duration_formatted: string
  is_recurring: boolean; recurrence_end_date?: string
  notes?: string; is_cancelled: boolean; is_active: boolean
}

interface Conflict { type: string; message: string }

interface Filters {
  search: string; academic_year_id: string; department_id: string
  class_group_id: string; program_id: string; building_id: string; room_id: string
  day_of_week: string; start_time: string; end_time: string
  professor_id: string; course_element_id: string
  is_cancelled: string; is_active: string; is_recurring: string; per_page: string
}

// ─── Constantes ──────────────────────────────────────────────────────────────
const DAYS = [
  { value: 'monday',    label: 'Lundi'    },
  { value: 'tuesday',   label: 'Mardi'    },
  { value: 'wednesday', label: 'Mercredi' },
  { value: 'thursday',  label: 'Jeudi'    },
  { value: 'friday',    label: 'Vendredi' },
  { value: 'saturday',  label: 'Samedi'   },
  { value: 'sunday',    label: 'Dimanche' },
]
const DAY_LABEL: Record<string, string> = Object.fromEntries(DAYS.map(d => [d.value, d.label]))

const EMPTY_FORM = {
  academic_year_id: '', department_id: '', class_group_id: '', program_id: '',
  building_id: '', room_id: '', day_of_week: '',
  start_time: '', end_time: '',
  is_recurring: false, recurrence_end_date: '', notes: '',
}

const EMPTY_FILTERS: Filters = {
  search: '', academic_year_id: '', department_id: '', class_group_id: '',
  program_id: '', building_id: '', room_id: '', day_of_week: '',
  start_time: '', end_time: '', professor_id: '', course_element_id: '',
  is_cancelled: '', is_active: '', is_recurring: '', per_page: '20',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Calcule la durée entre deux heures HH:MM et retourne une chaîne lisible */
function calcDuration(start: string, end: string): string {
  if (!start || !end) return ''
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const totalMin = (eh * 60 + em) - (sh * 60 + sm)
  if (totalMin <= 0) return '—'
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

const GestionEmploiDuTemps: React.FC = () => {

  // ── Liste ─────────────────────────────────────────────────────────────────
  const [records, setRecords]         = useState<EmploiDuTemps[]>([])
  const [total, setTotal]             = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [lastPage, setLastPage]       = useState(1)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [successMsg, setSuccessMsg]   = useState<string | null>(null)

  // ── Références ────────────────────────────────────────────────────────────
  const [academicYears, setAcademicYears]   = useState<AcademicYear[]>([])
  const [departments, setDepartments]       = useState<Department[]>([])
  const [buildings, setBuildings]           = useState<Building[]>([])
  const [allRooms, setAllRooms]             = useState<Room[]>([])
  const [professors, setProfessors]         = useState<Professor[]>([])
  const [courseElements, setCourseElements] = useState<CourseElement[]>([])
  const [refsLoading, setRefsLoading]       = useState(true)

  // ── Cascades formulaire ───────────────────────────────────────────────────
  const [formClassGroups, setFormClassGroups]   = useState<ClassGroup[]>([])
  const [formPrograms, setFormPrograms]         = useState<Program[]>([])
  const [classGroupsLoading, setClassGroupsLoading] = useState(false)
  const [programsLoading, setProgramsLoading]   = useState(false)

  // ── Cascades filtres ──────────────────────────────────────────────────────
  const [filterClassGroups, setFilterClassGroups] = useState<ClassGroup[]>([])

  // ── Filtres ───────────────────────────────────────────────────────────────
  const [filters, setFilters]     = useState<Filters>(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)

  // ── Formulaire ────────────────────────────────────────────────────────────
  const [showModal, setShowModal]       = useState(false)
  const [editRecord, setEditRecord]     = useState<EmploiDuTemps | null>(null)
  const [form, setForm]                 = useState<any>(EMPTY_FORM)
  const [formErrors, setFormErrors]     = useState<Record<string, string>>({})
  const [conflicts, setConflicts]       = useState<Conflict[]>([])
  const [formLoading, setFormLoading]   = useState(false)

  // ── Suppression ───────────────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget]       = useState<EmploiDuTemps | null>(null)
  const [deleteLoading, setDeleteLoading]     = useState(false)

  const [showDownloadModal, setShowDownloadModal] = useState(false)

  // ─── Dérivés ─────────────────────────────────────────────────────────────

  // Salles filtrées par bâtiment (formulaire)
  const filteredRooms = useMemo(() =>
    form.building_id
      ? allRooms.filter(r => (r.building?.id ?? r.building_id) === Number(form.building_id))
      : allRooms,
    [form.building_id, allRooms]
  )

  // Salles filtrées par bâtiment (panneau de filtres)
  const filterRoomsList = useMemo(() =>
    filters.building_id
      ? allRooms.filter(r => (r.building?.id ?? r.building_id) === Number(filters.building_id))
      : allRooms,
    [filters.building_id, allRooms]
  )

  const activeFilterCount = useMemo(() =>
    Object.entries(filters).filter(([k, v]) => k !== 'per_page' && v !== '').length,
    [filters]
  )

  // Durée calculée en temps réel depuis les champs start_time / end_time du formulaire
  const formDuration = useMemo(() =>
    calcDuration(form.start_time, form.end_time),
    [form.start_time, form.end_time]
  )

  // ─── Chargement des références statiques ────────────────────────────────

  const fetchRefs = useCallback(async () => {
    setRefsLoading(true)
    try {
      const [ay, dep, bld, rms, profs, ce] = await Promise.all([
        axios.get(`${API_SEL}/academic-years`),
        axios.get(`${API_SEL}/departments`),
        axios.get(`${API}/buildings`),
        axios.get(`${API}/rooms`),
        axios.get(`${API_SEL}/professors`),
        axios.get(`${API_SEL}/course-elements`),
      ])
      setAcademicYears(ay.data.data  ?? [])
      setDepartments(dep.data.data   ?? [])
      setBuildings(bld.data.data     ?? [])
      setAllRooms(rms.data.data      ?? [])
      setProfessors(profs.data.data  ?? [])
      setCourseElements(ce.data.data ?? [])
    } catch (e: any) {
      setError('Erreur lors du chargement des données de référence.')
    } finally {
      setRefsLoading(false)
    }
  }, [])

  // ─── Cascade : classes par département (formulaire) ──────────────────────

  const fetchFormClassGroups = useCallback(async (ayId: string, depId: string) => {
    if (!ayId || !depId) { setFormClassGroups([]); return }
    setClassGroupsLoading(true)
    try {
      const { data } = await axios.get(`${API_SEL}/class-groups`, {
        params: { academic_year_id: ayId, department_id: depId },
      })
      setFormClassGroups(data.data ?? [])
    } catch { setFormClassGroups([]) }
    finally { setClassGroupsLoading(false) }
  }, [])

  // ─── Cascade : programmes par classe (formulaire) ────────────────────────

  const fetchFormPrograms = useCallback(async (ayId: string, cgId: string) => {
    if (!ayId || !cgId) { setFormPrograms([]); return }
    setProgramsLoading(true)
    try {
      const { data } = await axios.get(`${API_SEL}/programs`, {
        params: { academic_year_id: ayId, class_group_id: cgId },
      })
      setFormPrograms(data.data ?? [])
    } catch { setFormPrograms([]) }
    finally { setProgramsLoading(false) }
  }, [])

  // ─── Cascade : classes par département (filtres) ─────────────────────────

  const fetchFilterClassGroups = useCallback(async (ayId: string, depId: string) => {
    if (!ayId && !depId) { setFilterClassGroups([]); return }
    try {
      const { data } = await axios.get(`${API_SEL}/class-groups`, {
        params: {
          ...(ayId  ? { academic_year_id: ayId }  : {}),
          ...(depId ? { department_id: depId }     : {}),
        },
      })
      setFilterClassGroups(data.data ?? [])
    } catch { setFilterClassGroups([]) }
  }, [])

  // ─── Chargement liste principale ─────────────────────────────────────────

  const fetchRecords = useCallback(async (page = 1) => {
    setLoading(true); setError(null)
    try {
      const params: any = { page, ...filters }
      Object.keys(params).forEach(k => { if (!params[k] && params[k] !== false) delete params[k] })
      const { data } = await axios.get(`${API}/emploi-du-temps`, { params })
      setRecords(data.data ?? [])
      setTotal(data.meta?.total ?? (data.data?.length ?? 0))
      setCurrentPage(data.meta?.current_page ?? 1)
      setLastPage(data.meta?.last_page ?? 1)
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erreur lors du chargement.')
    } finally { setLoading(false) }
  }, [filters])

  useEffect(() => { fetchRefs() }, [fetchRefs])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchRecords(1) }, [filters])

  // ─── Quand les filtres académique/département changent → rafraîchir classes ─

  useEffect(() => {
    fetchFilterClassGroups(filters.academic_year_id, filters.department_id)
  }, [filters.academic_year_id, filters.department_id, fetchFilterClassGroups])

  // ─── Helpers formulaire ──────────────────────────────────────────────────

  const openCreate = () => {
    setEditRecord(null)
    setForm({ ...EMPTY_FORM })
    setFormClassGroups([]); setFormPrograms([])
    setFormErrors({}); setConflicts([])
    setShowModal(true)
  }

  const openEdit = (rec: EmploiDuTemps) => {
    setEditRecord(rec)
    const ayId  = String(rec.academic_year?.id  ?? '')
    const depId = String(rec.department?.id     ?? '')
    const cgId  = String(rec.class_group?.id    ?? '')
    setForm({
      academic_year_id:    ayId,
      department_id:       depId,
      class_group_id:      cgId,
      program_id:          String(rec.program?.id ?? ''),
      building_id:         String(rec.room?.building?.id ?? rec.room?.building_id ?? ''),
      room_id:             String(rec.room?.id ?? ''),
      day_of_week:         rec.day_of_week,
      start_time:          rec.start_time,
      end_time:            rec.end_time,
      is_recurring:        rec.is_recurring,
      recurrence_end_date: rec.recurrence_end_date ?? '',
      notes:               rec.notes ?? '',
    })
    setFormErrors({}); setConflicts([])
    if (ayId && depId) fetchFormClassGroups(ayId, depId)
    if (ayId && cgId)  fetchFormPrograms(ayId, cgId)
    setShowModal(true)
  }

  const handleFormChange = (key: string, value: any) => {
    setForm((prev: any) => {
      const next = { ...prev, [key]: value }

      // Cascade Année / Département → reset classe + programmes
      if (key === 'academic_year_id') {
        next.class_group_id = ''; next.program_id = ''
        setFormClassGroups([]); setFormPrograms([])
        fetchFormClassGroups(value, prev.department_id)
      }
      if (key === 'department_id') {
        next.class_group_id = ''; next.program_id = ''
        setFormClassGroups([]); setFormPrograms([])
        fetchFormClassGroups(prev.academic_year_id, value)
      }
      // Cascade Classe → reset programmes
      if (key === 'class_group_id') {
        next.program_id = ''
        setFormPrograms([])
        fetchFormPrograms(prev.academic_year_id, value)
      }
      // Cascade Bâtiment → reset salle
      if (key === 'building_id') {
        next.room_id = ''
      }

      return next
    })
    setFormErrors(e => { const n = { ...e }; delete n[key]; return n })
  }

  const submitForm = async () => {
    setFormErrors({}); setConflicts([]); setFormLoading(true)
    try {
      const payload: any = {
        academic_year_id: Number(form.academic_year_id),
        department_id:    Number(form.department_id),
        class_group_id:   Number(form.class_group_id),
        program_id:       Number(form.program_id),
        room_id:          Number(form.room_id),
        day_of_week:      form.day_of_week,
        start_time:       form.start_time,
        end_time:         form.end_time,
        is_recurring:     form.is_recurring,
      }
      if (form.recurrence_end_date) payload.recurrence_end_date = form.recurrence_end_date
      if (form.notes)               payload.notes               = form.notes

      if (editRecord) {
        await axios.put(`${API}/emploi-du-temps/${editRecord.id}`, payload)
        setSuccessMsg('Emploi du temps modifié avec succès.')
      } else {
        await axios.post(`${API}/emploi-du-temps`, payload)
        setSuccessMsg('Emploi du temps créé avec succès.')
      }
      setShowModal(false)
      fetchRecords(currentPage)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (e: any) {
      if (e.response?.status === 422) {
        const errs: Record<string, string> = {}
        Object.entries(e.response.data.errors ?? {}).forEach(([k, v]: any) => {
          errs[k] = Array.isArray(v) ? v[0] : v
        })
        setFormErrors(errs)
      } else if (e.response?.status === 409) {
        setConflicts(e.response.data.conflicts ?? [])
      } else {
        setError(e.response?.data?.message ?? 'Erreur serveur.')
      }
    } finally { setFormLoading(false) }
  }

  // Ouverture de la modal de suppression
  const confirmDelete = (rec: EmploiDuTemps) => {
    setDeleteTarget(rec)
    setShowDeleteModal(true)
  }

  // Suppression effective via DELETE /api/emploi-temps/emploi-du-temps/{id}
  const doDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await axios.delete(`${API}/emploi-du-temps/${deleteTarget.id}`)
      setSuccessMsg('Emploi du temps supprimé avec succès.')
      setShowDeleteModal(false)
      setDeleteTarget(null)
      // Revenir à la page 1 si on vide la page courante
      const newTotal = total - 1
      const perPage  = Number(filters.per_page)
      const maxPage  = Math.max(1, Math.ceil(newTotal / perPage))
      fetchRecords(currentPage > maxPage ? maxPage : currentPage)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (e: any) {
      setError(e.response?.data?.message ?? 'Erreur lors de la suppression.')
      setShowDeleteModal(false)
    } finally { setDeleteLoading(false) }
  }

  const doCancel = async (rec: EmploiDuTemps) => {
    try {
      await axios.post(`${API}/emploi-du-temps/${rec.id}/cancel`)
      setSuccessMsg('Cours annulé.')
      fetchRecords(currentPage)
      setTimeout(() => setSuccessMsg(null), 4000)
    } catch (e: any) {
      setError(e.response?.data?.message ?? "Erreur lors de l'annulation.")
    }
  }

  const resetFilters = () => setFilters({ ...EMPTY_FILTERS })

  // ─── RENDU ────────────────────────────────────────────────────────────────

  return (
    <>
      {error      && <CAlert color="danger"  dismissible onClose={() => setError(null)}>{error}</CAlert>}
      {successMsg && <CAlert color="success" dismissible onClose={() => setSuccessMsg(null)}>{successMsg}</CAlert>}
      {refsLoading && (
        <CAlert color="info" className="d-flex align-items-center gap-2">
          <CSpinner size="sm" /> Chargement des données de référence…
        </CAlert>
      )}

      <CCard>
        {/* ══ En-tête ══ */}
        <CCardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div>
            <h5 className="mb-0"><CIcon icon={cilCalendar} className="me-2" />Gestion des Emplois du Temps</h5>
            <small className="text-medium-emphasis">{total} entrée(s)</small>
          </div>
          <div className="d-flex gap-2 flex-wrap">
            <CButton color="success" size="sm" onClick={() => setShowDownloadModal(true)} title="Télécharger l'emploi du temps en PDF">
              <CIcon icon={cilCloudDownload} className="me-1" />
              Télécharger PDF
            </CButton>
            <CButton color="secondary" variant="outline" size="sm" onClick={() => setShowFilters(v => !v)}>
              <CIcon icon={cilFilter} className="me-1" />Filtres
              {activeFilterCount > 0 && <CBadge color="danger" shape="rounded-pill" className="ms-1">{activeFilterCount}</CBadge>}
              <CIcon icon={showFilters ? cilChevronTop : cilChevronBottom} className="ms-1" />
            </CButton>
            <CButton color="secondary" variant="outline" size="sm" onClick={() => fetchRecords(currentPage)} title="Rafraîchir">
              <CIcon icon={cilReload} />
            </CButton>
            <CButton color="primary" size="sm" onClick={openCreate} disabled={refsLoading}>
              <CIcon icon={cilPlus} className="me-1" />Nouveau
            </CButton>
          </div>
        </CCardHeader>

        {/* ══ Filtres ══ */}
        <CCollapse visible={showFilters}>
          <div className="px-3 pt-3 pb-2 border-bottom bg-light">
            <CRow className="g-2">

              {/* Recherche */}
              <CCol xs={12} md={4}>
                <CInputGroup size="sm">
                  <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
                  <CFormInput placeholder="Cours, professeur, salle, classe…" value={filters.search}
                    onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
                  {filters.search && (
                    <CButton variant="outline" color="secondary" onClick={() => setFilters(f => ({ ...f, search: '' }))}>
                      <CIcon icon={cilX} />
                    </CButton>
                  )}
                </CInputGroup>
              </CCol>

              {/* Année */}
              <CCol xs={12} sm={6} md={4}>
                <CFormSelect size="sm" value={filters.academic_year_id}
                  onChange={e => setFilters(f => ({ ...f, academic_year_id: e.target.value, class_group_id: '' }))}>
                  <option value="">— Année académique —</option>
                  {academicYears.map(ay => (
                    <option key={ay.id} value={ay.id}>{ay.libelle ?? ay.academic_year}{ay.is_current ? ' ★' : ''}</option>
                  ))}
                </CFormSelect>
              </CCol>

              {/* Département */}
              <CCol xs={12} sm={6} md={4}>
                <CFormSelect size="sm" value={filters.department_id}
                  onChange={e => setFilters(f => ({ ...f, department_id: e.target.value, class_group_id: '' }))}>
                  <option value="">— Département —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.abbreviation})</option>)}
                </CFormSelect>
              </CCol>

              {/* Classe (filtrée par année + département) */}
              <CCol xs={12} sm={6} md={3}>
                <CFormSelect size="sm" value={filters.class_group_id}
                  onChange={e => setFilters(f => ({ ...f, class_group_id: e.target.value }))}>
                  <option value="">— Classe —</option>
                  {filterClassGroups.map(c => (
                    <option key={c.id} value={c.id}>{c.group_name} — {c.study_level}</option>
                  ))}
                </CFormSelect>
              </CCol>

              {/* Jour */}
              <CCol xs={12} sm={6} md={2}>
                <CFormSelect size="sm" value={filters.day_of_week}
                  onChange={e => setFilters(f => ({ ...f, day_of_week: e.target.value }))}>
                  <option value="">— Jour —</option>
                  {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </CFormSelect>
              </CCol>

              {/* Heure début */}
              <CCol xs={6} sm={3} md={2}>
                <CFormInput type="time" size="sm" title="Heure début (≥)" value={filters.start_time}
                  onChange={e => setFilters(f => ({ ...f, start_time: e.target.value }))} />
              </CCol>

              {/* Heure fin */}
              <CCol xs={6} sm={3} md={2}>
                <CFormInput type="time" size="sm" title="Heure fin (≤)" value={filters.end_time}
                  onChange={e => setFilters(f => ({ ...f, end_time: e.target.value }))} />
              </CCol>

              {/* Bâtiment */}
              <CCol xs={12} sm={6} md={3}>
                <CFormSelect size="sm" value={filters.building_id}
                  onChange={e => setFilters(f => ({ ...f, building_id: e.target.value, room_id: '' }))}>
                  <option value="">— Bâtiment —</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                </CFormSelect>
              </CCol>

              {/* Salle */}
              <CCol xs={12} sm={6} md={3}>
                <CFormSelect size="sm" value={filters.room_id}
                  onChange={e => setFilters(f => ({ ...f, room_id: e.target.value }))}>
                  <option value="">— Salle —</option>
                  {filterRoomsList.map(r => <option key={r.id} value={r.id}>{r.name} ({r.code})</option>)}
                </CFormSelect>
              </CCol>

              {/* Professeur */}
              <CCol xs={12} sm={6} md={3}>
                <CFormSelect size="sm" value={filters.professor_id}
                  onChange={e => setFilters(f => ({ ...f, professor_id: e.target.value }))}>
                  <option value="">— Professeur —</option>
                  {professors.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
                </CFormSelect>
              </CCol>

              {/* Cours */}
              <CCol xs={12} sm={6} md={3}>
                <CFormSelect size="sm" value={filters.course_element_id}
                  onChange={e => setFilters(f => ({ ...f, course_element_id: e.target.value }))}>
                  <option value="">— Élément de cours —</option>
                  {courseElements.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </CFormSelect>
              </CCol>

              {/* Statut */}
              <CCol xs={12} sm={4} md={2}>
                <CFormSelect size="sm" value={filters.is_active}
                  onChange={e => setFilters(f => ({ ...f, is_active: e.target.value }))}>
                  <option value="">— Statut —</option>
                  <option value="true">Actif</option>
                  <option value="false">Inactif</option>
                </CFormSelect>
              </CCol>

              {/* Annulation */}
              <CCol xs={12} sm={4} md={2}>
                <CFormSelect size="sm" value={filters.is_cancelled}
                  onChange={e => setFilters(f => ({ ...f, is_cancelled: e.target.value }))}>
                  <option value="">— Annulation —</option>
                  <option value="false">Non annulé</option>
                  <option value="true">Annulé</option>
                </CFormSelect>
              </CCol>

              {/* Récurrence */}
              <CCol xs={12} sm={4} md={2}>
                <CFormSelect size="sm" value={filters.is_recurring}
                  onChange={e => setFilters(f => ({ ...f, is_recurring: e.target.value }))}>
                  <option value="">— Récurrence —</option>
                  <option value="true">Récurrent</option>
                  <option value="false">Ponctuel</option>
                </CFormSelect>
              </CCol>

              {/* Par page */}
              <CCol xs={6} sm={3} md={2}>
                <CFormSelect size="sm" value={filters.per_page}
                  onChange={e => setFilters(f => ({ ...f, per_page: e.target.value }))}>
                  <option value="10">10 / page</option>
                  <option value="20">20 / page</option>
                  <option value="50">50 / page</option>
                  <option value="100">100 / page</option>
                </CFormSelect>
              </CCol>

              {/* Reset */}
              <CCol xs={12} className="d-flex justify-content-end">
                <CButton size="sm" color="secondary" variant="outline" onClick={resetFilters}>
                  <CIcon icon={cilX} className="me-1" />Réinitialiser
                </CButton>
              </CCol>
            </CRow>
          </div>
        </CCollapse>

        {/* ══ Tableau ══ */}
        <CCardBody className="p-0">
          {loading ? (
            <div className="text-center py-5"><CSpinner color="primary" /><p className="mt-2 text-medium-emphasis">Chargement…</p></div>
          ) : records.length === 0 ? (
            <div className="text-center py-5 text-medium-emphasis">
              <CIcon icon={cilCalendar} size="3xl" className="mb-3" />
              <p>Aucun emploi du temps trouvé.</p>
              <CButton color="primary" size="sm" onClick={openCreate}><CIcon icon={cilPlus} className="me-1" />Créer le premier</CButton>
            </div>
          ) : (
            <div className="table-responsive">
              <CTable hover small align="middle" className="mb-0">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell>Cours / Professeur</CTableHeaderCell>
                    <CTableHeaderCell>Classe</CTableHeaderCell>
                    <CTableHeaderCell>Jour &amp; Horaire</CTableHeaderCell>
                    <CTableHeaderCell>Salle</CTableHeaderCell>
                    <CTableHeaderCell>Récurrence</CTableHeaderCell>
                    <CTableHeaderCell>Statut</CTableHeaderCell>
                    <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {records.map(rec => (
                    <CTableRow key={rec.id} className={rec.is_cancelled ? 'table-secondary opacity-75' : ''}>

                      {/* Cours / Professeur */}
                      <CTableDataCell>
                        <div className="fw-semibold">
                          <CIcon icon={cilBook} size="sm" className="me-1 text-primary" />
                          {rec.program?.course_element?.name ?? '—'}
                        </div>
                        {rec.program?.course_element?.code && (
                          <small className="text-medium-emphasis">{rec.program.course_element.code}</small>
                        )}
                        {rec.program?.professor && (
                          <div className="mt-1 small text-muted">
                            <CIcon icon={cilUser} size="sm" className="me-1" />
                            {rec.program.professor.first_name} {rec.program.professor.last_name}
                          </div>
                        )}
                      </CTableDataCell>

                      {/* Classe */}
                      <CTableDataCell>
                        {rec.class_group ? (
                          <>
                            <div className="fw-semibold">{rec.class_group.group_name}</div>
                            <small className="text-medium-emphasis">{rec.class_group.study_level}</small>
                          </>
                        ) : '—'}
                      </CTableDataCell>

                      {/* Jour & Horaire */}
                      <CTableDataCell>
                        <div><CBadge color="info">{DAY_LABEL[rec.day_of_week] ?? rec.day_of_week}</CBadge></div>
                        <small>
                          <CIcon icon={cilClock} size="sm" className="me-1" />
                          {rec.start_time} – {rec.end_time}
                          <span className="text-muted ms-1">
                            ({rec.duration_formatted ?? `${rec.duration_in_hours}h`})
                          </span>
                        </small>
                      </CTableDataCell>

                      {/* Salle */}
                      <CTableDataCell>
                        {rec.room ? (
                          <>
                            <div><CIcon icon={cilRoom} size="sm" className="me-1 text-secondary" />{rec.room.name}</div>
                            <small className="text-muted"><CIcon icon={cilBuilding} size="sm" className="me-1" />{rec.room.building?.name ?? ''}</small>
                          </>
                        ) : '—'}
                      </CTableDataCell>

                      {/* Récurrence */}
                      <CTableDataCell>
                        <small>
                          {rec.is_recurring ? (
                            <><CBadge color="secondary" className="me-1">Récurrent</CBadge><br />
                            {rec.recurrence_end_date && <span className="text-muted">→ {rec.recurrence_end_date}</span>}</>
                          ) : <CBadge color="light" textColor="dark">Ponctuel</CBadge>}
                        </small>
                      </CTableDataCell>

                      {/* Statut */}
                      <CTableDataCell>
                        {rec.is_cancelled
                          ? <CBadge color="danger">Annulé</CBadge>
                          : rec.is_active
                          ? <CBadge color="success">Actif</CBadge>
                          : <CBadge color="secondary">Inactif</CBadge>}
                      </CTableDataCell>

                      {/* Actions */}
                      <CTableDataCell className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          <CTooltip content="Modifier">
                            <CButton size="sm" color="warning" variant="ghost"
                              onClick={() => openEdit(rec)} disabled={rec.is_cancelled}>
                              <CIcon icon={cilPencil} />
                            </CButton>
                          </CTooltip>
                          {!rec.is_cancelled && (
                            <CTooltip content="Annuler ce cours">
                              <CButton size="sm" color="secondary" variant="ghost" onClick={() => doCancel(rec)}>
                                <CIcon icon={cilBan} />
                              </CButton>
                            </CTooltip>
                          )}
                          <CTooltip content="Supprimer définitivement">
                            <CButton size="sm" color="danger" variant="ghost" onClick={() => confirmDelete(rec)}>
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </CTooltip>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          )}

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="d-flex justify-content-center py-3">
              <CPagination size="sm">
                <CPaginationItem disabled={currentPage === 1} onClick={() => fetchRecords(currentPage - 1)}>Préc.</CPaginationItem>
                {Array.from({ length: Math.min(lastPage, 10) }, (_, i) => i + 1).map(p => (
                  <CPaginationItem key={p} active={p === currentPage} onClick={() => fetchRecords(p)}>{p}</CPaginationItem>
                ))}
                <CPaginationItem disabled={currentPage === lastPage} onClick={() => fetchRecords(currentPage + 1)}>Suiv.</CPaginationItem>
              </CPagination>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* ══════════════════════════════════════════════════════════════
          MODAL CRÉATION / MODIFICATION
      ══════════════════════════════════════════════════════════════ */}
      <CModal visible={showModal} onClose={() => setShowModal(false)} size="lg" backdrop="static">
        <CModalHeader>
          <CModalTitle>
            <CIcon icon={editRecord ? cilPencil : cilPlus} className="me-2" />
            {editRecord ? "Modifier l'emploi du temps" : 'Nouvel emploi du temps'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>

          {/* Conflits */}
          {conflicts.length > 0 && (
            <CAlert color="danger">
              <CIcon icon={cilWarning} className="me-2" /><strong>Conflits détectés :</strong>
              <ul className="mb-0 mt-1">{conflicts.map((c, i) => <li key={i}>{c.message}</li>)}</ul>
            </CAlert>
          )}

          <CForm>
            <CRow className="g-3">

              {/* ── 1. Année académique ── */}
              <CCol xs={12} md={6}>
                <CFormLabel className="fw-semibold">
                  Année académique <span className="text-danger">*</span>
                </CFormLabel>
                <CFormSelect value={form.academic_year_id}
                  onChange={e => handleFormChange('academic_year_id', e.target.value)}
                  invalid={!!formErrors.academic_year_id}>
                  <option value="">— Sélectionner —</option>
                  {academicYears.map(ay => (
                    <option key={ay.id} value={ay.id}>
                      {ay.libelle ?? ay.academic_year}{ay.is_current ? ' ★' : ''}
                    </option>
                  ))}
                </CFormSelect>
                {formErrors.academic_year_id && <div className="invalid-feedback d-block">{formErrors.academic_year_id}</div>}
              </CCol>

              {/* ── 2. Département ── */}
              <CCol xs={12} md={6}>
                <CFormLabel className="fw-semibold">
                  Département <span className="text-danger">*</span>
                </CFormLabel>
                <CFormSelect value={form.department_id}
                  onChange={e => handleFormChange('department_id', e.target.value)}
                  invalid={!!formErrors.department_id}>
                  <option value="">— Sélectionner —</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.abbreviation})</option>
                  ))}
                </CFormSelect>
                {formErrors.department_id && <div className="invalid-feedback d-block">{formErrors.department_id}</div>}
              </CCol>

              {/* ── 3. Classe (filtrée par année + département) ── */}
              <CCol xs={12} md={6}>
                <CFormLabel className="fw-semibold">
                  Classe <span className="text-danger">*</span>
                  {classGroupsLoading && <CSpinner size="sm" className="ms-2" />}
                </CFormLabel>
                <CFormSelect value={form.class_group_id}
                  onChange={e => handleFormChange('class_group_id', e.target.value)}
                  disabled={!form.academic_year_id || !form.department_id || classGroupsLoading}
                  invalid={!!formErrors.class_group_id}>
                  <option value="">
                    {!form.academic_year_id || !form.department_id
                      ? "— Sélectionnez d'abord l'année et le département —"
                      : classGroupsLoading ? 'Chargement…'
                      : formClassGroups.length === 0 ? '— Aucune classe disponible —'
                      : '— Sélectionner une classe —'}
                  </option>
                  {formClassGroups.map(c => (
                    <option key={c.id} value={c.id}>{c.group_name} — {c.study_level}</option>
                  ))}
                </CFormSelect>
                {formErrors.class_group_id && <div className="invalid-feedback d-block">{formErrors.class_group_id}</div>}
              </CCol>

              {/* ── 4. Programme (cours + prof, filtré par classe) ── */}
              <CCol xs={12} md={6}>
                <CFormLabel className="fw-semibold">
                  Programme (cours + professeur) <span className="text-danger">*</span>
                  {programsLoading && <CSpinner size="sm" className="ms-2" />}
                </CFormLabel>
                <CFormSelect value={form.program_id}
                  onChange={e => handleFormChange('program_id', e.target.value)}
                  disabled={!form.class_group_id || programsLoading}
                  invalid={!!formErrors.program_id}>
                  <option value="">
                    {!form.class_group_id ? "— Sélectionnez d'abord une classe —"
                      : programsLoading ? 'Chargement…'
                      : formPrograms.length === 0 ? '— Aucun programme pour cette classe —'
                      : '— Sélectionner —'}
                  </option>
                  {formPrograms.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.course_element?.name ?? `Programme #${p.id}`}
                      {p.professor ? ` — ${p.professor.first_name} ${p.professor.last_name}` : ''}
                      {p.semester ? ` (S${p.semester})` : ''}
                    </option>
                  ))}
                </CFormSelect>
                {formErrors.program_id && <div className="invalid-feedback d-block">{formErrors.program_id}</div>}
              </CCol>

              {/* ── 5. Bâtiment ── */}
              <CCol xs={12} md={6}>
                <CFormLabel className="fw-semibold">
                  Bâtiment <span className="text-danger">*</span>
                </CFormLabel>
                <CFormSelect value={form.building_id}
                  onChange={e => handleFormChange('building_id', e.target.value)}>
                  <option value="">— Sélectionner —</option>
                  {buildings.map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                </CFormSelect>
              </CCol>

              {/* ── 6. Salle (filtrée par bâtiment) ── */}
              <CCol xs={12} md={6}>
                <CFormLabel className="fw-semibold">
                  Salle <span className="text-danger">*</span>
                </CFormLabel>
                <CFormSelect value={form.room_id}
                  onChange={e => handleFormChange('room_id', e.target.value)}
                  disabled={!form.building_id}
                  invalid={!!formErrors.room_id}>
                  <option value="">
                    {!form.building_id ? "— Sélectionnez d'abord un bâtiment —"
                      : filteredRooms.length === 0 ? '— Aucune salle dans ce bâtiment —'
                      : '— Sélectionner une salle —'}
                  </option>
                  {filteredRooms.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.code}) — {r.capacity} places</option>
                  ))}
                </CFormSelect>
                {formErrors.room_id && <div className="invalid-feedback d-block">{formErrors.room_id}</div>}
              </CCol>

              {/* ── 7. Jour ── */}
              <CCol xs={12} md={4}>
                <CFormLabel className="fw-semibold">
                  Jour <span className="text-danger">*</span>
                </CFormLabel>
                <CFormSelect value={form.day_of_week}
                  onChange={e => handleFormChange('day_of_week', e.target.value)}
                  invalid={!!formErrors.day_of_week}>
                  <option value="">— Sélectionner —</option>
                  {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </CFormSelect>
                {formErrors.day_of_week && <div className="invalid-feedback d-block">{formErrors.day_of_week}</div>}
              </CCol>

              {/* ── 8. Heure début ── */}
              <CCol xs={6} md={4}>
                <CFormLabel className="fw-semibold">
                  Heure de début <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput type="time" value={form.start_time}
                  onChange={e => handleFormChange('start_time', e.target.value)}
                  invalid={!!formErrors.start_time} />
                {formErrors.start_time && <div className="invalid-feedback d-block">{formErrors.start_time}</div>}
              </CCol>

              {/* ── 9. Heure fin ── */}
              <CCol xs={6} md={4}>
                <CFormLabel className="fw-semibold">
                  Heure de fin <span className="text-danger">*</span>
                </CFormLabel>
                <CFormInput type="time" value={form.end_time}
                  onChange={e => handleFormChange('end_time', e.target.value)}
                  invalid={!!formErrors.end_time} />
                {formErrors.end_time && <div className="invalid-feedback d-block">{formErrors.end_time}</div>}
              </CCol>

              {/* ── Durée calculée automatiquement (lecture seule) ── */}
              {formDuration && (
                <CCol xs={12}>
                  <div className="d-flex align-items-center gap-2 px-1">
                    <CIcon icon={cilClock} className="text-info" />
                    <span className="text-muted small">Durée calculée :</span>
                    <CBadge color="info" className="fs-6">{formDuration}</CBadge>
                  </div>
                </CCol>
              )}

              {/* ── Récurrence ── */}
              <CCol xs={12}>
                <CFormCheck id="is_recurring" label="Cours récurrent (hebdomadaire tout le semestre)"
                  checked={form.is_recurring}
                  onChange={e => handleFormChange('is_recurring', e.target.checked)} />
              </CCol>

              {form.is_recurring && (
                <CCol xs={12} md={6}>
                  <CFormLabel>Date de fin de récurrence <span className="text-muted">(fin du semestre)</span></CFormLabel>
                  <CFormInput type="date" value={form.recurrence_end_date}
                    onChange={e => handleFormChange('recurrence_end_date', e.target.value)}
                    invalid={!!formErrors.recurrence_end_date} />
                  {formErrors.recurrence_end_date && (
                    <div className="invalid-feedback d-block">{formErrors.recurrence_end_date}</div>
                  )}
                </CCol>
              )}

              {/* ── Notes ── */}
              <CCol xs={12}>
                <CFormLabel>Notes / Observations</CFormLabel>
                <CFormTextarea rows={2} value={form.notes}
                  onChange={e => handleFormChange('notes', e.target.value)}
                  placeholder="Informations complémentaires…" />
              </CCol>

            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setShowModal(false)}>Annuler</CButton>
          <CButton color="primary" onClick={submitForm} disabled={formLoading}>
            {formLoading && <CSpinner size="sm" className="me-2" />}
            {editRecord ? 'Enregistrer les modifications' : "Créer l'emploi du temps"}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ══ Modal suppression ══ */}
      <CModal visible={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteTarget(null) }} size="sm">
        <CModalHeader><CModalTitle>Confirmer la suppression</CModalTitle></CModalHeader>
        <CModalBody>
          <p>Voulez-vous vraiment supprimer définitivement cet emploi du temps ?</p>
          {deleteTarget && (
            <div className="p-2 rounded bg-light small text-muted">
              <strong>{deleteTarget.program?.course_element?.name ?? 'Ce cours'}</strong>
              <br />
              {DAY_LABEL[deleteTarget.day_of_week]} — {deleteTarget.start_time} → {deleteTarget.end_time}
              {deleteTarget.class_group && <><br />{deleteTarget.class_group.group_name}</>}
            </div>
          )}
          <CAlert color="warning" className="mt-2 mb-0 py-2 small">
            <CIcon icon={cilWarning} className="me-1" />
            Cette action est irréversible.
          </CAlert>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost"
            onClick={() => { setShowDeleteModal(false); setDeleteTarget(null) }}
            disabled={deleteLoading}>
            Annuler
          </CButton>
          <CButton color="Secondary" onClick={doDelete} disabled={deleteLoading}>
            {deleteLoading ? <><CSpinner size="sm" className="me-1" />Suppression…</> : 'Supprimer définitivement'}
          </CButton>
        </CModalFooter>
      </CModal>
      <DownloadEdtModal
        visible={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </>
  )
}

export default GestionEmploiDuTemps

