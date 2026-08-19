import {
  CBadge,
  CButton,
  CFormCheck,
  CFormInput,
  CFormSelect,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CPagination,
  CPaginationItem,
  CRow,
  CCol,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSearch,
  cilPencil,
  cilCheckCircle,
  cilXCircle,
  cilMagnifyingGlass,
  cilFolderOpen,
  cilPrint,
  cilNotes,
} from '@coreui/icons'
import type { LegacyStudent, LegacyStudentFilters, LegacyStudentPaginationMeta, LegacyFiliere } from '@/types/legacyStudent.types'

interface LegacyStudentsTableProps {
  students: LegacyStudent[]
  loading: boolean
  filters: LegacyStudentFilters
  setFilters: (filters: LegacyStudentFilters) => void
  filieres: LegacyFiliere[]
  selectedIds: (number | string)[]
  toggleSelectAll: () => void
  toggleSelectOne: (id: number | string) => void
  pagination: LegacyStudentPaginationMeta
  onViewDetail: (student: LegacyStudent) => void
  onEdit: (student: LegacyStudent) => void
  onReject: (student: LegacyStudent) => void
  onValidateOne: (id: number | string) => void
  onBulkValidate: () => void
  onBulkReject: () => void
  onPrintPdf: (student: LegacyStudent) => void
  onOpenAcademic: (student: LegacyStudent) => void
}

const LegacyStudentsTable = ({
  students,
  loading,
  filters,
  setFilters,
  filieres,
  selectedIds,
  toggleSelectAll,
  toggleSelectOne,
  pagination,
  onViewDetail,
  onEdit,
  onReject,
  onValidateOne,
  onBulkValidate,
  onBulkReject,
  onPrintPdf,
  onOpenAcademic
}: LegacyStudentsTableProps) => {

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'validated': return 'success'
      case 'pending': return 'warning'
      case 'rejected': return 'danger'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'validated': return 'Validé'
      case 'pending': return 'En attente'
      case 'rejected': return 'Rejeté'
      default: return status
    }
  }

  return (
    <>
      {/* Filtres */}
      <CRow className="mb-3 g-2">
        <CCol md={3}>
          <CFormInput
            type="text"
            placeholder="Rechercher par matricule, nom..."
            value={filters.search || ''}
            onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
          />
        </CCol>
        <CCol md={2}>
          <CFormSelect value={filters.status || 'all'} onChange={e => setFilters({ ...filters, status: e.target.value as any, page: 1 })}>
            <option value="all">Tous statuts</option>
            <option value="pending">En attente</option>
            <option value="validated">Validé</option>
            <option value="rejected">Rejeté</option>
          </CFormSelect>
        </CCol>
        <CCol md={2}>
          <CFormInput
            type="text"
            placeholder="Année promo (ex: 2020)"
            maxLength={4}
            value={filters.enrollment_year || ''}
            onChange={e => setFilters({ ...filters, enrollment_year: e.target.value, page: 1 })}
          />
        </CCol>
        <CCol md={4}>
          <CFormSelect value={filters.department_id || ''} onChange={e => setFilters({ ...filters, department_id: e.target.value, page: 1 })}>
            <option value="">Toutes filières</option>
            {filieres.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </CFormSelect>
        </CCol>
        <CCol md={1}>
          <CButton color="primary" className="w-100" onClick={() => setFilters({ ...filters, page: 1 })}>
            <CIcon icon={cilSearch} />
          </CButton>
        </CCol>
      </CRow>

      {/* Actions groupées */}
      {selectedIds.length > 0 && (
        <CRow className="mb-3 align-items-center bg-light p-2 rounded">
          <CCol>
            <strong>{selectedIds.length} sélectionné(s)</strong>
          </CCol>
          <CCol className="text-end">
            <CButton color="success" className="me-2" onClick={onBulkValidate}>
              Valider la sélection
            </CButton>
            <CButton color="danger" onClick={onBulkReject}>
              Rejeter la sélection
            </CButton>
          </CCol>
        </CRow>
      )}

      {loading ? (
        <div className="text-center p-5">
          <CSpinner color="primary" />
        </div>
      ) : students.length === 0 ? (
        <div className="text-center p-5 text-muted">
          <CIcon icon={cilFolderOpen} size="3xl" className="mb-3 opacity-25" />
          <p>Aucun dossier trouvé.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <CTable hover small>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell style={{ width: '40px' }}>
                    <CFormCheck
                      id="selectAll"
                      checked={students.length > 0 && selectedIds.length === students.length}
                      onChange={toggleSelectAll}
                    />
                  </CTableHeaderCell>
                  <CTableHeaderCell>Matricule</CTableHeaderCell>
                  <CTableHeaderCell>Nom & Prénoms</CTableHeaderCell>
                  <CTableHeaderCell>Date de Naiss.</CTableHeaderCell>
                  <CTableHeaderCell>Année</CTableHeaderCell>
                  <CTableHeaderCell>Filière</CTableHeaderCell>
                  <CTableHeaderCell>Téléphone</CTableHeaderCell>
                  <CTableHeaderCell>Statut</CTableHeaderCell>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {students.map((student) => (
                  <CTableRow key={student.id}>
                    <CTableDataCell>
                      <CFormCheck
                        id={`check-${student.id}`}
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleSelectOne(student.id)}
                      />
                    </CTableDataCell>
                    <CTableDataCell className="align-middle text-nowrap">
                      {student.matricule}
                    </CTableDataCell>
                    <CTableDataCell className="align-middle">
                      <div className="fw-semibold text-nowrap">{student.last_name} {student.first_name}</div>
                      <div className="text-muted small">{student.email}</div>
                    </CTableDataCell>
                    <CTableDataCell className="align-middle text-nowrap">
                      {student.date_of_birth ? (
                        <span className="badge bg-light text-dark border">
                          {new Date(student.date_of_birth).toLocaleDateString('fr-FR')}
                        </span>
                      ) : (
                        <span className="text-muted small">—</span>
                      )}
                    </CTableDataCell>
                    <CTableDataCell className="align-middle">
                      {student.enrollment_year}
                    </CTableDataCell>
                    <CTableDataCell className="align-middle">
                      <div className="d-flex flex-column gap-1">
                        {student.cycle && (
                          <span className="text-muted small">{student.cycle}</span>
                        )}
                        {student.department ? (
                          <CBadge color="info">{student.department.name}</CBadge>
                        ) : (
                          '—'
                        )}
                      </div>
                    </CTableDataCell>
                    <CTableDataCell className="align-middle text-nowrap">
                      {student.phone}
                    </CTableDataCell>
                    <CTableDataCell className="align-middle">
                      <CBadge color={getStatusBadgeColor(student.status)}>
                        {getStatusLabel(student.status)}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell className="align-middle text-nowrap">
                      {new Date(student.created_at).toLocaleDateString('fr-FR')}
                    </CTableDataCell>
                    <CTableDataCell className="align-middle">
                      <div className="d-flex gap-1">
                        <CButton
                          color="secondary"
                          size="sm"
                          variant="outline"
                          title="Voir"
                          onClick={() => onViewDetail(student)}
                        >
                          <CIcon icon={cilMagnifyingGlass} />
                        </CButton>
                        <CButton
                          color="primary"
                          size="sm"
                          variant="outline"
                          title="Éditer"
                          onClick={() => onEdit(student)}
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          color="info"
                          size="sm"
                          variant="outline"
                          title="Compléter le dossier académique (Notes, résultats, mémoire)"
                          onClick={() => onOpenAcademic(student)}
                        >
                          <CIcon icon={cilNotes} />
                        </CButton>
                        <CButton
                          color="dark"
                          size="sm"
                          variant="outline"
                          title="Imprimer"
                          onClick={() => onPrintPdf(student)}
                        >
                          <CIcon icon={cilPrint} />
                        </CButton>
                        {student.status === 'pending' && (
                          <>
                            <CButton
                              color="success"
                              size="sm"
                              variant="outline"
                              title="Valider"
                              onClick={() => onValidateOne(student.id)}
                            >
                              <CIcon icon={cilCheckCircle} />
                            </CButton>
                            <CButton
                              color="danger"
                              size="sm"
                              variant="outline"
                              title="Rejeter"
                              onClick={() => onReject(student)}
                            >
                              <CIcon icon={cilXCircle} />
                            </CButton>
                          </>
                        )}
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </div>

          {pagination.last_page > 1 && (
            <CPagination className="justify-content-center mt-3">
              <CPaginationItem disabled={pagination.current_page === 1} onClick={() => setFilters({ ...filters, page: pagination.current_page - 1 })}>
                Précédent
              </CPaginationItem>
              {[...Array(Math.min(pagination.last_page, 10))].map((_, i) => (
                <CPaginationItem
                  key={i + 1}
                  active={pagination.current_page === i + 1}
                  onClick={() => setFilters({ ...filters, page: i + 1 })}
                >
                  {i + 1}
                </CPaginationItem>
              ))}
              <CPaginationItem disabled={pagination.current_page === pagination.last_page} onClick={() => setFilters({ ...filters, page: pagination.current_page + 1 })}>
                Suivant
              </CPaginationItem>
            </CPagination>
          )}
        </>
      )}
    </>
  )
}

export default LegacyStudentsTable
