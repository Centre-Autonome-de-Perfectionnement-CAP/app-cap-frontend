import { useState, useEffect, useMemo } from 'react'
import {
  CCard, CCardBody, CRow, CCol,
  CFormInput, CButton, CInputGroup, CInputGroupText,
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CContainer, CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilPhone } from '@coreui/icons'
import { SingleValue } from 'react-select'
import AttendanceFilter from '@/components/Attendance/AttendanceFilter'

const ITEMS_PER_PAGE = 15
const BASE_URL       = 'http://localhost:8000/api/attendance'

interface SelectOption { value: string; label: string }

// ── Badge statut avec 3 états : présent / retard / absent ────────────────────
const StatusBadge = ({ status, onTime }: { status: string; onTime: boolean }) => {
  const isPresent = status === 'Présent' || status === 'present'

  if (isPresent && !onTime) return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: '#fef3c7', color: '#92400e',
      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#d97706', flexShrink: 0 }} />
      Présent (retard)
    </span>
  )

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: isPresent ? '#dcfce7' : '#fee2e2',
      color:      isPresent ? '#15803d' : '#991b1b',
      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isPresent ? '#16a34a' : '#dc2626', flexShrink: 0 }} />
      {isPresent ? 'Présent' : 'Absent'}
    </span>
  )
}

const Management = () => {
  const [filterOptions, setFilterOptions] = useState({
    annees: [] as string[], filieres: [] as string[],
    niveaux: [] as string[], matieres: [] as string[], heures: [] as string[],
  })
  const [students, setStudents]       = useState<any[]>([])
  const [filters, setFilters]         = useState({ year: '', filiere: '', niveau: '', matiere: '', heure: '' })
  const [search, setSearch]           = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading]         = useState(false)

  useEffect(() => {
    fetch(`${BASE_URL}/filters`).then(r => r.json()).then(d => {
      if (d.success) setFilterOptions({
        annees: d.data.annees || [], filieres: d.data.filieres || [],
        niveaux: d.data.niveaux || [], matieres: d.data.matieres || [], heures: d.data.heures || [],
      })
    }).catch(console.error)
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.year)    params.append('year',    filters.year)
    if (filters.filiere) params.append('filiere', filters.filiere)
    if (filters.niveau)  params.append('niveau',  filters.niveau)
    if (filters.matiere) params.append('matiere', filters.matiere)
    if (filters.heure)   params.append('heure',   filters.heure)

    fetch(`${BASE_URL}/management?${params}`)
      .then(r => r.json()).then(d => { setStudents(d.data || []); setCurrentPage(1) })
      .catch(console.error).finally(() => setLoading(false))
  }, [filters])

  const handleFilterChange = (name: string, option: SingleValue<SelectOption>) => {
    setFilters(prev => ({ ...prev, [name]: option && option.value !== 'all' ? option.value : '' }))
  }

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return students
    return students.filter(s =>
      (s.name || '').toLowerCase().includes(q) || (s.matricule || '').toLowerCase().includes(q)
    )
  }, [search, students])

  const totalPages    = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE)
  const paginated     = filteredStudents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const handleExport = (format: string) => {
    window.open(`${BASE_URL}/management/export?${new URLSearchParams({ format, ...filters })}`, '_blank')
  }

  // Compteurs pour le résumé
  const nbPresent = students.filter(s => s.status === 'Présent').length
  const nbRetard  = students.filter(s => s.status === 'Présent' && !s.on_time).length
  const nbAbsent  = students.filter(s => s.status === 'Absent').length

  return (
    <CContainer fluid className="p-4">
      <CCard className="shadow-sm border" style={{ borderRadius: '8px' }}>
        <CCardBody className="p-4">

          <h5 style={{ fontWeight: 700, marginBottom: '24px', color: '#212529' }}>Management des présences</h5>

          <AttendanceFilter
            filterOptions={filterOptions}
            selectedYear={filters.year} selectedFiliere={filters.filiere}
            selectedNiveau={filters.niveau} selectedMatiere={filters.matiere}
            selectedHeure={filters.heure} showMatiere={true} showHeure={true}
            onFilterChange={handleFilterChange}
          />

          {/* ── Compteurs rapides ────────────────────────────────────── */}
          {!loading && students.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
              {[
                { label: 'Présents',        value: nbPresent, bg: '#dcfce7', color: '#15803d' },
                { label: 'Retards',         value: nbRetard,  bg: '#fef3c7', color: '#92400e' },
                { label: 'Absents',         value: nbAbsent,  bg: '#fee2e2', color: '#991b1b' },
              ].map(({ label, value, bg, color }) => (
                <div key={label} style={{ background: bg, color, borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600 }}>
                  {value} {label}
                </div>
              ))}
            </div>
          )}

          {/* ── Exports + Recherche ──────────────────────────────────── */}
          <CRow className="mb-3 align-items-end g-3">
            <CCol xs={12} md={8}>
              <div className="d-flex gap-2 flex-wrap">
                {(['pdf', 'excel', 'word'] as const).map(fmt => (
                  <CButton key={fmt} color="primary" variant="outline" size="sm"
                    onClick={() => handleExport(fmt)}
                    style={{ borderRadius: '6px', fontSize: '13px' }}>
                    Exporter {fmt.toUpperCase()}
                  </CButton>
                ))}
              </div>
            </CCol>
            <CCol xs={12} md={4}>
              <label className="form-label fw-semibold" style={{ fontSize: '14px' }}>Recherche</label>
              <CInputGroup>
                <CInputGroupText style={{ background: '#fff', border: '1px solid #dee2e6', borderRight: 'none' }}>
                  <CIcon icon={cilSearch} size="sm" className="text-muted" />
                </CInputGroupText>
                <CFormInput
                  placeholder="Nom ou matricule..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
                  style={{ borderLeft: 'none', borderRadius: '0 6px 6px 0' }}
                />
              </CInputGroup>
            </CCol>
          </CRow>

          <div className="mb-2">
            <small className="text-muted" style={{ fontSize: '13px' }}>
              {loading ? 'Chargement...' : `${filteredStudents.length} enregistrement(s)`}
            </small>
          </div>

          {/* ── Tableau ──────────────────────────────────────────────── */}
          <CCard className="border" style={{ borderRadius: '6px' }}>
            <CCardBody className="p-0">
              {loading ? (
                <div className="text-center py-5">
                  <CSpinner color="primary" size="sm" />
                  <span className="ms-2 text-muted">Chargement...</span>
                </div>
              ) : (
                <CTable hover responsive striped className="mb-0" style={{ fontSize: '14px' }}>
                  <CTableHead style={{ background: '#f8f9fa' }}>
                    <CTableRow>
                      <CTableHeaderCell className="ps-3">#</CTableHeaderCell>
                      <CTableHeaderCell>Matricule</CTableHeaderCell>
                      <CTableHeaderCell>Nom et Prénoms</CTableHeaderCell>
                      <CTableHeaderCell>Contact</CTableHeaderCell>
                      <CTableHeaderCell>Matière</CTableHeaderCell>
                      <CTableHeaderCell>Date</CTableHeaderCell>
                      <CTableHeaderCell>Créneau</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Statut</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {paginated.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={8} className="text-center py-5 text-muted">
                          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>Aucun enregistrement</div>
                          <div style={{ fontSize: '13px' }}>Modifiez les filtres pour afficher des résultats.</div>
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      paginated.map((s, i) => (
                        <CTableRow key={i}>
                          <CTableDataCell className="ps-3 text-muted" style={{ fontSize: '13px' }}>
                            {(currentPage - 1) * ITEMS_PER_PAGE + i + 1}
                          </CTableDataCell>
                          <CTableDataCell><strong style={{ fontSize: '13px' }}>{s.matricule || 'N/A'}</strong></CTableDataCell>
                          <CTableDataCell style={{ fontSize: '13px' }}>{s.name}</CTableDataCell>
                          <CTableDataCell>
                            {s.phone ? (
                              <a href={`tel:${s.phone}`} style={{ color: '#0d6efd', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px' }}>
                                <CIcon icon={cilPhone} size="sm" />{s.phone}
                              </a>
                            ) : <span className="text-muted">—</span>}
                          </CTableDataCell>
                          <CTableDataCell style={{ fontSize: '13px' }}>{s.matiere}</CTableDataCell>
                          <CTableDataCell style={{ fontSize: '13px' }}>{s.date}</CTableDataCell>
                          <CTableDataCell>
                            {s.heure ? <span style={{ fontSize: '12px', color: '#475569' }}>{s.heure}</span>
                                     : <span className="text-muted">—</span>}
                          </CTableDataCell>
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

          {/* ── Pagination ───────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <span className="text-muted" style={{ fontSize: '13px' }}>
                Page {currentPage} / {totalPages} — {filteredStudents.length} résultat(s)
              </span>
              <div className="d-flex gap-2">
                <CButton size="sm" color="light" disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  style={{ borderRadius: '6px', border: '1px solid #dee2e6', fontWeight: 600 }}>
                  Précédent
                </CButton>
                <CButton size="sm" color="light" disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  style={{ borderRadius: '6px', border: '1px solid #dee2e6', fontWeight: 600 }}>
                  Suivant
                </CButton>
              </div>
            </div>
          )}

        </CCardBody>
      </CCard>
    </CContainer>
  )
}

export default Management
