import { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CFormSelect,
  CAlert,
  CBadge,
  CRow,
  CCol,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser, cilCloudDownload, cilSearch } from '@coreui/icons'
import { LoadingSpinner } from '@/components'
import useHistorique from '@/hooks/finance/useHistorique'
import { getAssetUrl } from '@/utils/assets'

const Historique = () => {
  const {
    historiqueData,
    classes,
    years,
    loading,
    error,
    getHistoriqueByClass,
    exportClassFinancialState,
  } = useHistorique()

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  const handleSearch = () => {
    if (selectedClass) {
      getHistoriqueByClass(selectedClass, selectedYear)
    }
  }

  const handleExport = async () => {
    if (selectedClass) {
      try {
        await exportClassFinancialState(selectedClass, selectedYear)
      } catch (error) {
        console.error('Erreur lors de l\'export:', error)
      }
    }
  }

  const handleViewStudent = (student: any) => {
    setSelectedStudent(student)
    setShowStudentModal(true)
  }

  if (loading) {
    return <LoadingSpinner fullPage message="Chargement de l'historique..." />
  }

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader>
          <h5 className="mb-0">Historique Financier</h5>
        </CCardHeader>
        <CCardBody>
          {error && (
            <CAlert color="danger" className="mb-3">
              {error}
            </CAlert>
          )}

          <CRow className="mb-3">
            <CCol md={4}>
              <CFormSelect
                label="Classe"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">Sélectionner une classe</option>
                {classes?.length > 0 ? classes.map((classe: any) => (
                  <option key={classe.id} value={classe.id}>
                    {classe.name} - {classe.department?.name}
                  </option>
                )) : (
                  <option disabled>Aucune classe disponible</option>
                )}
              </CFormSelect>
            </CCol>
            <CCol md={3}>
              <CFormSelect
                label="Année"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="">Toutes les années</option>
                {years?.map((year: number) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            <CCol md={5} className="d-flex align-items-end gap-2">
              <CButton color="primary" onClick={handleSearch}>
                <CIcon icon={cilSearch} className="me-2" />
                Rechercher
              </CButton>
              {historiqueData && (
                <CButton color="success" onClick={handleExport}>
                  <CIcon icon={cilCloudDownload} className="me-2" />
                  Exporter
                </CButton>
              )}
            </CCol>
          </CRow>

          {historiqueData && historiqueData.length > 0 ? (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Matricule</CTableHeaderCell>
                  <CTableHeaderCell>Nom et Prénoms</CTableHeaderCell>
                  <CTableHeaderCell>Montant Payé</CTableHeaderCell>
                  <CTableHeaderCell>Montant Attendu</CTableHeaderCell>
                  <CTableHeaderCell>Reste à Payer</CTableHeaderCell>
                  <CTableHeaderCell>Statut</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {historiqueData.map((item: any) => (
                  <CTableRow key={item.student.id}>
                    <CTableDataCell>{item.student.student_id_number}</CTableDataCell>
                    <CTableDataCell>
                      {item.student.personalInformation?.first_name} {item.student.personalInformation?.last_name}
                    </CTableDataCell>
                    <CTableDataCell>{item.total_paid?.toLocaleString()} FCFA</CTableDataCell>
                    <CTableDataCell>{item.expected_amount?.toLocaleString()} FCFA</CTableDataCell>
                    <CTableDataCell>
                      <span className={item.remaining_amount > 0 ? 'text-danger' : 'text-success'}>
                        {item.remaining_amount?.toLocaleString()} FCFA
                      </span>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={item.remaining_amount <= 0 ? 'success' : 'warning'}>
                        {item.remaining_amount <= 0 ? 'À jour' : 'En retard'}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        color="info"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewStudent(item.student)}
                      >
                        <CIcon icon={cilUser} />
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          ) : (
            <div className="text-center text-muted py-4">
              <p>Aucune donnée disponible. Veuillez sélectionner une classe et effectuer une recherche.</p>
            </div>
          )}
        </CCardBody>
      </CCard>

      <CModal visible={showStudentModal} onClose={() => setShowStudentModal(false)} size="xl">
        <CModalHeader>
          <CModalTitle>
            État Financier - {selectedStudent?.personalInformation?.first_name} {selectedStudent?.personalInformation?.last_name}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedStudent && (
            <div className="row">
              <div className="col-md-3 text-center mb-3">
                <img
                  src={selectedStudent.photo || getAssetUrl('images/default-avatar.png')}
                  alt="Photo étudiant"
                  className="img-fluid rounded-circle"
                  style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                />
              </div>
              <div className="col-md-9">
                <h6>Informations de l'étudiant</h6>
                <p><strong>Matricule:</strong> {selectedStudent.student_id_number}</p>
                <p><strong>Année d'étude:</strong> {selectedStudent.academicYear?.libelle}</p>
                <p><strong>Filière:</strong> {selectedStudent.classGroup?.department?.name}</p>
              </div>
            </div>
          )}
        </CModalBody>
      </CModal>
    </>
  )
}

export default Historique