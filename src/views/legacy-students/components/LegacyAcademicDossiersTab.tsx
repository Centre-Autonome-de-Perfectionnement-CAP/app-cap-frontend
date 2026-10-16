import React, { useEffect, useState, useMemo } from "react"
import {
  CCard, CCardBody, CCardHeader, CRow, CCol, CFormInput, CFormSelect,
  CButton, CBadge, CTable, CTableHead, CTableBody, CTableRow,
  CTableHeaderCell, CTableDataCell, CSpinner, CAlert, CPagination, CPaginationItem,
} from "@coreui/react"
import CIcon from "@coreui/icons-react"
import {
  cilBook, cilSearch, cilPencil, cilCheckCircle,
  cilEducation, cilNotes, cilMagnifyingGlass, cilFilter, cilFile,
} from "@coreui/icons"
import { legacyStudentAdminService } from "@/services/legacyStudentAdminService"
import type { LegacyStudent, LegacyFiliere } from "@/types/legacyStudent.types"

interface Props {
  filieres: LegacyFiliere[]
  onOpenAcademic: (student: LegacyStudent) => void
  onOpenDetail: (student: LegacyStudent) => void
}

export const LegacyAcademicDossiersTab: React.FC<Props> = ({
  filieres,
  onOpenAcademic,
  onOpenDetail,
}) => {
  const [students, setStudents] = useState<LegacyStudent[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [selectedFiliere, setSelectedFiliere] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 10

  const loadValidatedStudents = async () => {
    setLoading(true)
    try {
      // On charge spécifiquement les étudiants avec le statut 'validated'
      const response = await legacyStudentAdminService.getAll({
        status: "validated",
        per_page: 200,
      })
      if (response && response.data) {
        // Filtrer strictement les étudiants validés
        setStudents(response.data.filter((s) => s.status === "validated"))
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadValidatedStudents()
  }, [])

  // Filtrage local
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        !search ||
        s.matricule.toLowerCase().includes(search.toLowerCase()) ||
        s.last_name.toLowerCase().includes(search.toLowerCase()) ||
        s.first_name.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())

      const matchYear = !selectedYear || String(s.enrollment_year) === String(selectedYear)
      const matchFiliere =
        !selectedFiliere ||
        String(s.department?.id) === String(selectedFiliere) ||
        s.department?.name === selectedFiliere

      return matchSearch && matchYear && matchFiliere
    })
  }, [students, search, selectedYear, selectedFiliere])

  const totalPages = Math.ceil(filteredStudents.length / perPage) || 1
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * perPage
    return filteredStudents.slice(start, start + perPage)
  }, [filteredStudents, currentPage])

  // Années d inscription disponibles pour le filtre
  const availableYears = useMemo(() => {
    const years = students.map((s) => s.enrollment_year).filter(Boolean)
    return Array.from(new Set(years)).sort((a, b) => b - a)
  }, [students])

  return (
    <div className="d-flex flex-column gap-3">
      {/* ── Bandeau d information ── */}
      <CCard className="border-top-primary border-top-3 shadow-sm">
        <CCardBody>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-1 d-flex align-items-center gap-2 text-primary">
                <CIcon icon={cilBook} />
                Complétion des Dossiers Académiques (&lt; 2023)
              </h5>
              <p className="text-muted small mb-0">
                Seuls les anciens étudiants dont le compte administratif a été <strong>validé</strong> apparaissent ici.
                Complétez leurs relevés de notes annuels, unités d'enseignement (UE), mentions et informations de soutenance.
              </p>
            </div>
            <div className="d-flex gap-2">
              <CBadge color="success" className="p-2 fs-6 d-flex align-items-center gap-1">
                <CIcon icon={cilCheckCircle} />
                {students.length} Étudiant(s) Validé(s)
              </CBadge>
            </div>
          </div>
        </CCardBody>
      </CCard>

      {/* ── Filtres de recherche ── */}
      <CCard className="shadow-sm">
        <CCardBody className="py-2">
          <CRow className="g-2 align-items-center">
            <CCol md={5}>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light"><CIcon icon={cilSearch} /></span>
                <CFormInput
                  placeholder="Rechercher par matricule, nom, prénom..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                />
              </div>
            </CCol>
            <CCol md={3}>
              <CFormSelect
                size="sm"
                value={selectedFiliere}
                onChange={(e) => { setSelectedFiliere(e.target.value); setCurrentPage(1) }}
              >
                <option value="">Toutes les filières</option>
                {filieres.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} {f.cycle ? `(${f.cycle})` : ""}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={2}>
              <CFormSelect
                size="sm"
                value={selectedYear}
                onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1) }}
              >
                <option value="">Toutes les promos</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Promotion {yr}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={2} className="text-end">
              <CButton
                size="sm"
                color="secondary"
                variant="outline"
                className="w-100"
                onClick={() => { setSearch(""); setSelectedYear(""); setSelectedFiliere(""); setCurrentPage(1) }}
              >
                <CIcon icon={cilFilter} className="me-1" /> Réinitialiser
              </CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* ── Tableau des dossiers académiques validés ── */}
      <CCard className="shadow-sm">
        <CCardHeader className="bg-white py-2 d-flex justify-content-between align-items-center">
          <span className="fw-semibold small text-muted">
            Liste des étudiants validés à compléter ({filteredStudents.length})
          </span>
          <CButton size="sm" color="light" onClick={loadValidatedStudents} disabled={loading}>
            {loading ? <CSpinner size="sm" /> : "↻ Actualiser"}
          </CButton>
        </CCardHeader>
        <CCardBody className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />
              <div className="text-muted mt-2 small">Chargement des dossiers académiques...</div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-5">
              <CIcon icon={cilFile} size="xxl" className="text-muted mb-2" />
              <p className="text-muted mb-1">Aucun étudiant validé ne correspond aux critères.</p>
              <small className="text-muted">
                Assurez-vous de valider les fiches dans le menu <strong>Registres & Fiches</strong>.
              </small>
            </div>
          ) : (
            <div className="table-responsive">
              <CTable hover align="middle" className="mb-0">
                <CTableHead color="light">
                  <CTableRow>
                    <CTableHeaderCell style={{ minWidth: 130 }}>Matricule</CTableHeaderCell>
                    <CTableHeaderCell style={{ minWidth: 200 }}>Nom & Prénoms</CTableHeaderCell>
                    <CTableHeaderCell style={{ minWidth: 100 }}>Promo</CTableHeaderCell>
                    <CTableHeaderCell style={{ minWidth: 180 }}>Cycle & Filière</CTableHeaderCell>
                    <CTableHeaderCell style={{ minWidth: 130 }}>Contact</CTableHeaderCell>
                    <CTableHeaderCell style={{ minWidth: 100 }}>Statut</CTableHeaderCell>
                    <CTableHeaderCell style={{ minWidth: 200 }} className="text-end">Actions Dossier</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {paginatedStudents.map((student) => (
                    <CTableRow key={student.id}>
                      <CTableDataCell className="fw-bold text-primary">
                        {student.matricule}
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="fw-semibold">{student.last_name} {student.first_name}</div>
                        {student.date_of_birth && (
                          <div className="small text-muted">
                            Né(e) le {new Date(student.date_of_birth).toLocaleDateString("fr-FR")}
                            {student.place_of_birth ? ` à ${student.place_of_birth}` : ""}
                          </div>
                        )}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="dark" shape="rounded-pill">
                          Promo {student.enrollment_year}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex flex-column gap-1">
                          {student.cycle && (
                            <span className="badge bg-light text-dark border align-self-start small">
                              {student.cycle}
                            </span>
                          )}
                          {student.department ? (
                            <span className="small fw-semibold text-secondary">{student.department.name}</span>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="small">{student.phone}</div>
                        <div className="small text-muted">{student.email}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="success" className="d-inline-flex align-items-center gap-1">
                          <CIcon icon={cilCheckCircle} /> Validé
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          <CButton
                            color="primary"
                            size="sm"
                            className="d-flex align-items-center gap-1 shadow-sm"
                            onClick={() => onOpenAcademic(student)}
                            title="Compléter les notes, UEs, moyenne et mémoire"
                          >
                            <CIcon icon={cilNotes} />
                            Compléter le dossier
                          </CButton>
                          <CButton
                            color="secondary"
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenDetail(student)}
                            title="Consulter la fiche"
                          >
                            <CIcon icon={cilMagnifyingGlass} />
                          </CButton>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <CPagination className="justify-content-center mt-2">
          <CPaginationItem
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Précédent
          </CPaginationItem>
          {Array.from({ length: totalPages }).map((_, i) => (
            <CPaginationItem
              key={i + 1}
              active={currentPage === i + 1}
              onClick={() => setCurrentPage(i + 1)}
            >
              {i + 1}
            </CPaginationItem>
          ))}
          <CPaginationItem
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Suivant
          </CPaginationItem>
        </CPagination>
      )}
    </div>
  )
}
