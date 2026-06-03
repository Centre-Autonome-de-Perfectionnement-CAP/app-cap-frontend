import { useState, useEffect, useMemo } from 'react'
import {
  CCard, CCardBody, CRow, CCol, CFormInput, CButton,
  CInputGroup, CInputGroupText, CTable, CTableHead, CTableRow,
  CTableHeaderCell, CTableBody, CTableDataCell,
  CSpinner, CContainer,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilPhone, cilClock } from '@coreui/icons'
import Select, { SingleValue } from 'react-select'

const BASE_URL       = 'http://localhost:8000/api/attendance'
const ITEMS_PER_PAGE = 20

interface SelectOption  { value: string; label: string }
interface SessionOption {
  value: string; label: string
  total: number; presents: number; absents: number; retards: number
}

// ── Badge statut 3 états (Présent / Retard / Absent) ──────────────────────
const StatusBadge = ({ status, lateType }: { status: string; lateType: string | null }) => {
  if (status !== 'present') return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#fee2e2', color:'#991b1b', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:600, whiteSpace:'nowrap' }}>
      <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#dc2626', flexShrink:0 }} />
      Absent
    </span>
  )
  if (lateType !== null) return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#fff3cd', color:'#92400e', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:600, whiteSpace:'nowrap' }}>
      <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#f59e0b', flexShrink:0 }} />
      Retard
    </span>
  )
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:'#dcfce7', color:'#15803d', padding:'3px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:600, whiteSpace:'nowrap' }}>
      <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#16a34a', flexShrink:0 }} />
      Présent
    </span>
  )
}

// ── Durée ──────────────────────────────────────────────────────────────────
const Duration = ({ minutes }: { minutes: number }) => {
  if (!minutes) return <span className="text-muted" style={{ fontSize:'12px' }}>—</span>
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return (
    <span style={{ fontSize:'12px', color:'#475569', display:'inline-flex', alignItems:'center', gap:'3px' }}>
      <CIcon icon={cilClock} size="sm" />
      {h > 0 ? `${h}h${m.toString().padStart(2,'0')}` : `${m}min`}
    </span>
  )
}

// ── Carte stat ─────────────────────────────────────────────────────────────
const StatCard = ({ label, value, bg, color }: { label:string; value:number; bg:string; color:string }) => (
  <div style={{ background:bg, color, borderRadius:'0px', padding:'12px 18px', textAlign:'center', flex:1, minWidth:'80px' }}>
    <div style={{ fontSize:'24px', fontWeight:700, lineHeight:1 }}>{value}</div>
    <div style={{ fontSize:'11px', marginTop:'4px', opacity:0.85 }}>{label}</div>
  </div>
)

// ── Icônes d'export identiques à Fingerprint ───────────────────────────────
const ExportIcon = ({ format }: { format: string }) => {
  if (format === 'pdf') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  )
  if (format === 'excel') return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="12" y1="9" x2="12" y2="21"/>
    </svg>
  )
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  )
}

const CourseAttendance = () => {
  const [courseElements, setCourseElements] = useState<SelectOption[]>([])
  const [sessions,       setSessions]       = useState<SessionOption[]>([])
  const [selectedCourse,  setSelectedCourse]  = useState<SelectOption | null>(null)
  const [selectedSession, setSelectedSession] = useState<SessionOption | null>(null)
  const [students,     setStudents]     = useState<any[]>([])
  const [summary,      setSummary]      = useState({ total:0, present:0, absent:0, late:0 })
  const [search,       setSearch]       = useState('')
  const [currentPage,  setCurrentPage]  = useState(1)
  const [loadingSess,  setLoadingSess]  = useState(false)
  const [loadingData,  setLoadingData]  = useState(false)
  const [exportLoading, setExportLoading] = useState<string|null>(null)

  // Charger les matières depuis l'emploi du temps (courseElements)
  useEffect(() => {
    fetch(`${BASE_URL}/filters`).then(r => r.json()).then(d => {
      if (d.success) {
        // Utiliser courseElements qui viennent de l'emploi du temps
        const opts = (d.data.courseElements || []).map((c: any) => ({ value: String(c.value), label: c.label }))
        setCourseElements(opts)
      }
    })
  }, [])

  // Charger les séances quand une matière est sélectionnée
  useEffect(() => {
    if (!selectedCourse) { setSessions([]); setSelectedSession(null); return }
    setLoadingSess(true)
    setSessions([]); setSelectedSession(null); setStudents([])
    setSummary({ total:0, present:0, absent:0, late:0 })

    fetch(`${BASE_URL}/sessions?course_element_id=${selectedCourse.value}`)
      .then(r => r.json()).then(d => {
        if (d.success) {
          setSessions((d.data || []).map((s: any) => ({
            value: s.date, label: s.label,
            total: s.total, presents: s.presents, absents: s.absents, retards: s.retards,
          })))
        }
      }).finally(() => setLoadingSess(false))
  }, [selectedCourse])

  // Charger les étudiants quand une séance est sélectionnée
  useEffect(() => {
    if (!selectedCourse || !selectedSession) return
    setLoadingData(true); setCurrentPage(1)
    const params = new URLSearchParams({ course_element_id: selectedCourse.value, date: selectedSession.value })
    fetch(`${BASE_URL}/course-attendance?${params}`)
      .then(r => r.json()).then(d => {
        if (d.success) {
          setStudents(d.data.list   || [])
          setSummary(d.data.summary || { total:0, present:0, absent:0, late:0 })
        }
      }).finally(() => setLoadingData(false))
  }, [selectedCourse, selectedSession])

  const handleExport = (format: string) => {
    if (!selectedCourse || !selectedSession) return
    setExportLoading(format)
    const params = new URLSearchParams({ format, course_element_id: selectedCourse.value, date: selectedSession.value })
    window.open(`${BASE_URL}/course-attendance/export?${params}`, '_blank')
    setTimeout(() => setExportLoading(null), 1500)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return students
    return students.filter(s =>
      (s.name || '').toLowerCase().includes(q) || (s.matricule || '').toLowerCase().includes(q)
    )
  }, [search, students])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const hasSelection = selectedCourse && selectedSession

  // Retards directement depuis le summary backend
  const totalRetard = summary.late || 0

  const selectStyles = {
    control: (b: any) => ({ ...b, borderRadius: '6px', fontSize: '14px', minHeight: '38px' }),
  }

  return (
    <CContainer fluid className="p-4">
      <CCard className="shadow-sm border-0" style={{ borderRadius:'8px' }}>
        <CCardBody className="p-4">

          <h5 style={{ fontWeight:700, marginBottom:'6px', color:'#212529' }}>Présence par séance</h5>
          <p style={{ fontSize:'13px', color:'#64748b', marginBottom:'24px' }}>
            Sélectionnez un cours puis une séance pour afficher la fiche de présence complète.
          </p>

          {/* ── Sélecteurs matière + séance ──────────────────────────────── */}
          <CRow className="mb-4 g-3">
            <CCol md={6}>
              <label className="form-label fw-semibold" style={{ fontSize:'13px' }}>Matière / Cours</label>
              <Select
                options={courseElements}
                value={selectedCourse}
                onChange={opt => setSelectedCourse(opt as SelectOption)}
                placeholder="Sélectionner une matière..."
                isClearable
                styles={selectStyles}
                noOptionsMessage={() => 'Aucune matière disponible'}
              />
            </CCol>
            <CCol md={6}>
              <label className="form-label fw-semibold" style={{ fontSize:'13px' }}>
                Séance
                {loadingSess && <CSpinner size="sm" className="ms-2" style={{ width:'14px', height:'14px' }} />}
              </label>
              <Select
                options={sessions}
                value={selectedSession}
                onChange={opt => setSelectedSession(opt as SessionOption)}
                placeholder={selectedCourse ? 'Sélectionner une séance...' : "Choisir d'abord une matière"}
                isClearable
                isDisabled={!selectedCourse || loadingSess}
                styles={selectStyles}
                noOptionsMessage={() => loadingSess ? 'Chargement...' : 'Aucune séance disponible'}
              />
            </CCol>
          </CRow>

          {/* ── Stats séance (3 états : Présents / Retards / Absents) ──────── */}
          {hasSelection && !loadingData && (
            <div style={{ display:'flex', gap:'8px', marginBottom:'20px' }}>
              <StatCard label="Effectif"  value={summary.total}   bg="#f0f0f0" color="#333"    />
              <StatCard label="Présents"  value={summary.present} bg="#d4edda" color="#155724" />
              <StatCard label="Retards"   value={totalRetard}     bg="#fff3cd" color="#92400e" />
              <StatCard label="Absents"   value={summary.absent}  bg="#f8d7da" color="#721c24" />
            </div>
          )}

          {/* ── Export + Recherche ────────────────────────────────────────── */}
          {hasSelection && (
            <CRow className="mb-3 align-items-end g-3">
              <CCol xs={12} md={8}>
                <div className="d-flex gap-2 flex-wrap">
                  {(['pdf', 'excel', 'word'] as const).map(fmt => (
                    <CButton key={fmt} color="primary" variant="outline" size="sm"
                      disabled={!!exportLoading || loadingData}
                      onClick={() => handleExport(fmt)}
                      style={{ borderRadius:'6px', fontSize:'13px', display:'inline-flex', alignItems:'center', gap:'6px' }}>
                      {exportLoading === fmt
                        ? <CSpinner size="sm" style={{ width:'14px', height:'14px' }} />
                        : <ExportIcon format={fmt} />
                      }
                      Exporter {fmt.toUpperCase()}
                    </CButton>
                  ))}
                </div>
              </CCol>
              <CCol xs={12} md={4}>
                <label className="form-label fw-semibold" style={{ fontSize:'13px' }}>Recherche</label>
                <CInputGroup>
                  <CInputGroupText style={{ background:'#fff', border:'1px solid #dee2e6', borderRight:'none' }}>
                    <CIcon icon={cilSearch} size="sm" className="text-muted" />
                  </CInputGroupText>
                  <CFormInput placeholder="Nom ou matricule..."
                    value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                    style={{ borderLeft:'none', borderRadius:'0 6px 6px 0' }}
                  />
                </CInputGroup>
              </CCol>
            </CRow>
          )}

          {/* ── Message si rien sélectionné ──────────────────────────────── */}
          {!hasSelection && !loadingData && (
            <div style={{ textAlign:'center', padding:'48px 0', color:'#94a3b8' }}>
              <div style={{ fontSize:'40px', marginBottom:'12px' }}>📋</div>
              <div style={{ fontSize:'15px', fontWeight:600, marginBottom:'4px', color:'#64748b' }}>
                Sélectionnez une matière et une séance
              </div>
              <div style={{ fontSize:'13px' }}>La fiche de présence s'affichera ici.</div>
            </div>
          )}

          {/* ── Tableau ──────────────────────────────────────────────────── */}
          {hasSelection && (
            <>
              <div className="mb-2">
                <small className="text-muted" style={{ fontSize:'13px' }}>
                  {loadingData ? 'Chargement...' : `${filtered.length} étudiant(s)`}
                </small>
              </div>

              <CCard className="border-0" style={{ border:'1px solid #e2e8f0', borderRadius:'6px' }}>
                <CCardBody className="p-0">
                  {loadingData ? (
                    <div className="text-center py-5">
                      <CSpinner color="primary" size="sm" />
                      <span className="ms-2 text-muted">Chargement...</span>
                    </div>
                  ) : (
                    <CTable hover responsive striped className="mb-0" style={{ fontSize:'13px' }}>
                      <CTableHead style={{ background:'#f8f9fa' }}>
                        <CTableRow>
                          <CTableHeaderCell className="ps-3">#</CTableHeaderCell>
                          <CTableHeaderCell>Matricule</CTableHeaderCell>
                          <CTableHeaderCell>Nom et Prénoms</CTableHeaderCell>
                          <CTableHeaderCell>Contact</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Entrée</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Sortie</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Durée</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Statut</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {paginated.length === 0 ? (
                          <CTableRow>
                            <CTableDataCell colSpan={8} className="text-center py-5 text-muted">
                              <div style={{ fontSize:'15px', fontWeight:600, marginBottom:'4px' }}>Aucun enregistrement</div>
                              <div style={{ fontSize:'13px' }}>Aucun pointage pour cette séance.</div>
                            </CTableDataCell>
                          </CTableRow>
                        ) : (
                          paginated.map((s, i) => (
                            <CTableRow key={i}>
                              <CTableDataCell className="ps-3 text-muted">
                                {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                              </CTableDataCell>
                              <CTableDataCell><strong>{s.matricule || 'N/A'}</strong></CTableDataCell>
                              <CTableDataCell>{s.name}</CTableDataCell>
                              <CTableDataCell>
                                {s.phone ? (
                                  <a href={`tel:${s.phone}`} style={{ color:'#0d6efd', textDecoration:'none', display:'inline-flex', alignItems:'center', gap:'4px' }}>
                                    <CIcon icon={cilPhone} size="sm" />{s.phone}
                                  </a>
                                ) : <span className="text-muted">—</span>}
                              </CTableDataCell>
                              <CTableDataCell className="text-center" style={{ color:'#15803d', fontWeight:600, fontSize:'12px' }}>
                                {s.first_entry ? s.first_entry.substring(0, 5) : <span className="text-muted">—</span>}
                              </CTableDataCell>
                              <CTableDataCell className="text-center" style={{ color:'#dc2626', fontWeight:600, fontSize:'12px' }}>
                                {s.last_exit ? s.last_exit.substring(0, 5) : <span className="text-muted">—</span>}
                              </CTableDataCell>
                              <CTableDataCell className="text-center">
                                <Duration minutes={s.total_minutes || 0} />
                              </CTableDataCell>
                              <CTableDataCell className="text-center">
                                <StatusBadge status={s.status} lateType={s.late_type} />
                              </CTableDataCell>
                            </CTableRow>
                          ))
                        )}
                      </CTableBody>
                    </CTable>
                  )}
                </CCardBody>
              </CCard>

              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="text-muted" style={{ fontSize:'13px' }}>
                    Page {currentPage} / {totalPages} — {filtered.length} résultat(s)
                  </span>
                  <div className="d-flex gap-2">
                    <CButton size="sm" color="light" disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                      style={{ borderRadius:'6px', border:'1px solid #dee2e6', fontWeight:600 }}>Précédent</CButton>
                    <CButton size="sm" color="light" disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                      style={{ borderRadius:'6px', border:'1px solid #dee2e6', fontWeight:600 }}>Suivant</CButton>
                  </div>
                </div>
              )}
            </>
          )}

        </CCardBody>
      </CCard>
    </CContainer>
  )
}

export default CourseAttendance
