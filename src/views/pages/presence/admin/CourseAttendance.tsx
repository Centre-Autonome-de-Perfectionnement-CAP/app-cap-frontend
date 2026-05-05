import { useState, useEffect, useMemo } from 'react'
import {
  CCard, CCardBody, CRow, CCol,
  CFormInput, CButton, CInputGroup, CInputGroupText,
  CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CContainer, CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilPhone, cilCloudDownload } from '@coreui/icons'
import Select from 'react-select'

const BASE_URL      = 'http://localhost:8000/api/attendance'
const ITEMS_PER_PAGE = 15

interface SelectOption  { value: string; label: string }
interface SessionOption { value: string; label: string; total: number; presents: number; absents: number; retards: number }

// ── Badge statut (Couleurs demandées) ────────────────────────────────
const StatusBadge = ({ status, onTime }: { status: string; onTime: boolean }) => {
  const isPresent = status === 'Présent' || status === 'present'
  
  if (isPresent && !onTime) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#fff7ed', color: '#fd7e14', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', border: '1px solid #fd7e14' }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#fd7e14', flexShrink: 0 }} />
      Présent (retard)
    </span>
  )
  
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: isPresent ? '#f0fdf4' : '#fef2f2', color: isPresent ? '#16a34a' : '#dc2626', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', border: `1px solid ${isPresent ? '#16a34a' : '#dc2626'}` }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isPresent ? '#16a34a' : '#dc2626', flexShrink: 0 }} />
      {isPresent ? 'Présent' : 'Absent'}
    </span>
  )
}

// ── Carte statistique (Bords droits + Couleurs demandées) ───────────────────
const StatCard = ({ label, value, bg, color }: { label: string; value: number; bg: string; color: string }) => (
  <div style={{ background: bg, color, borderRadius: '0px', padding: '14px 20px', textAlign: 'center', flex: 1, minWidth: '80px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
    <div style={{ fontSize: '26px', fontWeight: 700, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.9 }}>{label}</div>
  </div>
)

const CourseAttendance = () => {
  const [courseElements, setCourseElements] = useState<SelectOption[]>([])
  const [sessions,       setSessions]       = useState<SessionOption[]>([])
  const [selectedCourse,  setSelectedCourse]  = useState<SelectOption | null>(null)
  const [selectedSession, setSelectedSession] = useState<SessionOption | null>(null)
  const [students,     setStudents]     = useState<any[]>([])
  const [summary,      setSummary]      = useState({ total: 0, present: 0, absent: 0, late: 0 })
  const [search,       setSearch]       = useState('')
  const [currentPage,  setCurrentPage]  = useState(1)
  const [loadingSess,  setLoadingSess]  = useState(false)
  const [loadingData,  setLoadingData]  = useState(false)
  const [exportLoading, setExportLoading] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${BASE_URL}/filters`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const opts = (d.data.courseElements || []).map((c: any) => ({
            value: String(c.value),
            label: c.label,
          }))
          setCourseElements(opts)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!selectedCourse) { setSessions([]); setSelectedSession(null); return }
    setLoadingSess(true)
    setSessions([])
    setSelectedSession(null)
    setStudents([])
    setSummary({ total: 0, present: 0, absent: 0, late: 0 })

    fetch(`${BASE_URL}/sessions?course_element_id=${selectedCourse.value}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const opts: SessionOption[] = (d.data || []).map((s: any) => ({
            value:    s.date,
            label:    s.label,
            total:    s.total,
            presents: s.presents,
            absents:  s.absents,
            retards:  s.retards,
          }))
          setSessions(opts)
        }
      })
      .catch(console.error)
      .finally(() => setLoadingSess(false))
  }, [selectedCourse])

  useEffect(() => {
    if (!selectedCourse || !selectedSession) return
    setLoadingData(true)
    setCurrentPage(1)

    const params = new URLSearchParams({
      course_element_id: selectedCourse.value,
      date:              selectedSession.value,
    })

    fetch(`${BASE_URL}/course-attendance?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setStudents(d.data.list    || [])
          setSummary(d.data.summary  || { total: 0, present: 0, absent: 0, late: 0 })
        }
      })
      .catch(console.error)
      .finally(() => setLoadingData(false))
  }, [selectedCourse, selectedSession])

  const handleExport = (format: string) => {
    if (!selectedCourse || !selectedSession) return
    setExportLoading(format)
    const params = new URLSearchParams({
      format,
      course_element_id: selectedCourse.value,
      date:              selectedSession.value,
    })
    window.open(`${BASE_URL}/course-attendance/export?${params}`, '_blank')
    setTimeout(() => setExportLoading(null), 1500)
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return students
    return students.filter(s =>
      (s.name      || '').toLowerCase().includes(q) ||
      (s.matricule || '').toLowerCase().includes(q)
    )
  }, [search, students])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated  = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const hasSelection = selectedCourse && selectedSession

  return (
    <CContainer fluid className="p-4">
      <CCard className="shadow-sm border" style={{ borderRadius: '0px' }}>
        <CCardBody className="p-4">

          <h5 style={{ fontWeight: 700, marginBottom: '6px', color: '#212529' }}>
            Présence par séance
          </h5>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>
            Consultez les statistiques et la liste d'émargement.
          </p>

          {/* 1. CARTES STATISTIQUES (DÉPLACÉES EN HAUT) */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <StatCard label="Effectif" value={summary.total} bg="#f8fafc" color="#475569" />
            <StatCard label="Présents" value={summary.present} bg="#16a34a" color="#ffffff" />
            <StatCard label="Retards" value={summary.late} bg="#fd7e14" color="#ffffff" />
            <StatCard label="Absents" value={summary.absent} bg="#dc2626" color="#ffffff" />
          </div>

          {/* 2. FILTRES SÉLECTEURS (APRÈS LES CARTES) */}
          <CRow className="mb-4 g-3">
            <CCol md={6}>
              <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Matière / Cours</label>
              <Select
                options={courseElements}
                value={selectedCourse}
                onChange={(opt) => setSelectedCourse(opt as any)}
                placeholder="Sélectionner une matière..."
                isClearable
                styles={{ control: (b) => ({ ...b, borderRadius: '0px', fontSize: '14px', minHeight: '38px' }) }}
              />
            </CCol>

            <CCol md={6}>
              <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>
                Séance (date) {loadingSess && <CSpinner size="sm" className="ms-2" />}
              </label>
              <Select
                options={sessions}
                value={selectedSession}
                onChange={(opt) => setSelectedSession(opt as any)}
                placeholder={selectedCourse ? 'Sélectionner une séance...' : 'Choisir d\'abord une matière'}
                isClearable
                isDisabled={!selectedCourse || loadingSess}
                styles={{ control: (b) => ({ ...b, borderRadius: '0px', fontSize: '14px', minHeight: '38px' }) }}
              />
            </CCol>
          </CRow>

          {/* 3. RECHERCHE ET EXPORT */}
          {hasSelection && (
            <CRow className="mb-3 align-items-end g-3">
              <CCol xs={12} md={8}>
                <div className="d-flex gap-2 flex-wrap">
                  {['pdf', 'excel', 'word'].map(fmt => (
                    <CButton key={fmt} color="primary" variant="outline" size="sm" disabled={!!exportLoading || loadingData} onClick={() => handleExport(fmt)} style={{ borderRadius: '0px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      {exportLoading === fmt ? <CSpinner size="sm" /> : <CIcon icon={cilCloudDownload} size="sm" />}
                      {fmt.toUpperCase()}
                    </CButton>
                  ))}
                </div>
              </CCol>
              <CCol xs={12} md={4}>
                <label className="form-label fw-semibold" style={{ fontSize: '13px' }}>Recherche</label>
                <CInputGroup>
                  <CInputGroupText style={{ background: '#fff', borderRadius: '0px' }}><CIcon icon={cilSearch} size="sm" /></CInputGroupText>
                  <CFormInput style={{ borderRadius: '0px' }} placeholder="Nom ou matricule..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} />
                </CInputGroup>
              </CCol>
            </CRow>
          )}

          {!hasSelection && !loadingData && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}></div>
              <div style={{ fontSize: '15px', fontWeight: 600 }}>Sélectionnez une matière et une séance pour voir la liste complète</div>
            </div>
          )}

          {/* 4. TABLEAU DE PRÉSENCE */}
          {hasSelection && (
            <>
              <CCard className="border" style={{ borderRadius: '0px' }}>
                <CCardBody className="p-0">
                  {loadingData ? (
                    <div className="text-center py-5"><CSpinner color="primary" size="sm" /></div>
                  ) : (
                    <CTable hover responsive striped className="mb-0" style={{ fontSize: '14px' }}>
                      <CTableHead style={{ background: '#f8f9fa' }}>
                        <CTableRow>
                          <CTableHeaderCell className="ps-3">#</CTableHeaderCell>
                          <CTableHeaderCell>Matricule</CTableHeaderCell>
                          <CTableHeaderCell>Nom et Prénoms</CTableHeaderCell>
                          <CTableHeaderCell>Contact</CTableHeaderCell>
                          <CTableHeaderCell>Créneau</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Statut</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {paginated.length === 0 ? (
                          <CTableRow><CTableDataCell colSpan={6} className="text-center py-5">Aucun enregistrement trouvé</CTableDataCell></CTableRow>
                        ) : (
                          paginated.map((s, i) => (
                            <CTableRow key={i}>
                              <CTableDataCell className="ps-3 text-muted">{(currentPage - 1) * ITEMS_PER_PAGE + i + 1}</CTableDataCell>
                              <CTableDataCell><strong>{s.matricule || 'N/A'}</strong></CTableDataCell>
                              <CTableDataCell>{s.name}</CTableDataCell>
                              <CTableDataCell>
                                {s.phone ? (
                                  <a href={`tel:${s.phone}`} style={{ color: '#0d6efd', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                    <CIcon icon={cilPhone} size="sm" />{s.phone}
                                  </a>
                                ) : '—'}
                              </CTableDataCell>
                              <CTableDataCell>{s.heure || '—'}</CTableDataCell>
                              <CTableDataCell className="text-center">
                                <StatusBadge status={s.status} onTime={s.on_time ?? true} />
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
                  <span className="text-muted" style={{ fontSize: '13px' }}>Page {currentPage} / {totalPages}</span>
                  <div className="d-flex gap-2">
                    <CButton size="sm" color="light" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={{ borderRadius: '0px', border: '1px solid #dee2e6' }}>Précédent</CButton>
                    <CButton size="sm" color="light" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} style={{ borderRadius: '0px', border: '1px solid #dee2e6' }}>Suivant</CButton>
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