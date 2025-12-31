import React, { useState, useEffect, useCallback } from 'react'
import {
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormTextarea,
  CFormLabel,
  CAlert,
  CRow,
  CCol,
  CBadge,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle, cilXCircle, cilFile } from '@coreui/icons'
import Select from 'react-select'
import Swal from 'sweetalert2'
import soutenanceService from '../../../services/soutenance.service'
import { LoadingSpinner } from '@/components'

interface Submission {
  id: number
  student_id_number: string
  student_name: string
  student_email: string
  student_contacts: string
  thesis_title: string
  professor_name: string
  defense_type: string
  status: string
  department: string
  period: string
  documents: any[]
}

interface FilterOption {
  value: string | number
  label: string
}

const SubmissionsList: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([])
  const [academicYears, setAcademicYears] = useState<FilterOption[]>([])
  const [departments, setDepartments] = useState<FilterOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [selectedYear, setSelectedYear] = useState<FilterOption | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<FilterOption | null>(null)
  const [selectedType, setSelectedType] = useState<FilterOption | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<FilterOption | null>(null)
  
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showDossierModal, setShowDossierModal] = useState(false)
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const statusOptions: FilterOption[] = [
    { value: '', label: 'Tous' },
    { value: 'pending', label: 'En Attente' },
    { value: 'accepted', label: 'Accepté' },
    { value: 'rejected', label: 'Rejeté' },
  ]

  const typeOptions: FilterOption[] = [
    { value: '', label: 'Tous' },
    { value: 'licence', label: 'Licence' },
    { value: 'master', label: 'Master' },
    { value: 'engineering', label: 'Ingénieur' },
  ]

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterSubmissions()
  }, [submissions, selectedYear, selectedStatus, selectedType, selectedDepartment])

  const loadData = async () => {
    try {
      setLoading(true)
      const [submissionsData, yearsData, deptsData] = await Promise.all([
        soutenanceService.getSubmissions(),
        soutenanceService.getAcademicYears(),
        soutenanceService.getDepartments(),
      ])
      
      setSubmissions(submissionsData)
      setAcademicYears([
        { value: '', label: 'Toutes' },
        ...yearsData.map((y: any) => ({ value: y.id, label: y.academic_year })),
      ])
      setDepartments([
        { value: '', label: 'Toutes' },
        ...deptsData.map((d: any) => ({ value: d.id, label: d.name || d.title })),
      ])
      
      if (yearsData.length > 0) {
        setSelectedYear({ value: yearsData[0].id, label: yearsData[0].academic_year })
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const filterSubmissions = useCallback(() => {
    let filtered = [...submissions]
    
    if (selectedYear && selectedYear.value) {
      filtered = filtered.filter((s) => s.period?.includes(selectedYear.label))
    }
    if (selectedStatus && selectedStatus.value) {
      filtered = filtered.filter((s) => s.status === selectedStatus.value)
    }
    if (selectedType && selectedType.value) {
      filtered = filtered.filter((s) => s.defense_type === selectedType.value)
    }
    if (selectedDepartment && selectedDepartment.value) {
      filtered = filtered.filter((s) => s.department === selectedDepartment.label)
    }
    
    setFilteredSubmissions(filtered)
  }, [submissions, selectedYear, selectedStatus, selectedType, selectedDepartment])

  const handleAccept = async (submissionId: number) => {
    const result = await Swal.fire({
      title: "Confirmer l'acceptation",
      text: 'Voulez-vous vraiment accepter cette soumission ?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Oui, accepter',
      cancelButtonText: 'Annuler',
    })

    if (result.isConfirmed) {
      try {
        await soutenanceService.acceptSubmission(submissionId)
        Swal.fire('Succès', 'Soumission acceptée avec succès', 'success')
        loadData()
      } catch (err: any) {
        Swal.fire('Erreur', err.message || 'Une erreur est survenue', 'error')
      }
    }
  }

  const handleReject = (submission: Submission) => {
    setSelectedSubmission(submission)
    setRejectionReason('')
    setShowRejectModal(true)
  }

  const submitRejection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubmission) return

    try {
      await soutenanceService.rejectSubmission(selectedSubmission.id, rejectionReason)
      Swal.fire('Succès', 'Soumission rejetée avec succès', 'success')
      setShowRejectModal(false)
      loadData()
    } catch (err: any) {
      Swal.fire('Erreur', err.message || 'Une erreur est survenue', 'error')
    }
  }

  const handleViewDossier = async (submissionId: number) => {
    try {
      const data = await soutenanceService.getDossierDetails(submissionId)
      setSelectedSubmission(data)
      setShowDossierModal(true)
    } catch (err: any) {
      Swal.fire('Erreur', err.message || 'Impossible de charger le dossier', 'error')
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'warning',
      accepted: 'success',
      rejected: 'danger',
    }
    return <CBadge color={colors[status] || 'secondary'}>{status}</CBadge>
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      licence: 'primary',
      master: 'success',
      engineering: 'warning',
      ingénieur: 'warning',
    }
    return <CBadge color={colors[type.toLowerCase()] || 'secondary'}>{type}</CBadge>
  }

  if (loading) return <LoadingSpinner fullPage message="Chargement des soumissions..." />

  return (
    <>
      <CCard className="mb-4 shadow-sm">
        <CCardHeader>
          <h4 className="mb-0">Liste des Soumissions de Mémoires</h4>
        </CCardHeader>
        <CCardBody>
          {error && <CAlert color="danger">{error}</CAlert>}

          {/* Filtres */}
          <div className="mb-3 p-3 bg-light rounded">
            <CRow>
              <CCol md={3}>
                <label className="form-label">Année Académique</label>
                <Select
                  options={academicYears}
                  value={selectedYear}
                  onChange={setSelectedYear}
                  placeholder="Sélectionner..."
                />
              </CCol>
              <CCol md={3}>
                <label className="form-label">Statut</label>
                <Select
                  options={statusOptions}
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  placeholder="Tous"
                />
              </CCol>
              <CCol md={3}>
                <label className="form-label">Type de Soutenance</label>
                <Select
                  options={typeOptions}
                  value={selectedType}
                  onChange={setSelectedType}
                  placeholder="Tous"
                />
              </CCol>
              <CCol md={3}>
                <label className="form-label">Filière</label>
                <Select
                  options={departments}
                  value={selectedDepartment}
                  onChange={setSelectedDepartment}
                  placeholder="Toutes"
                />
              </CCol>
            </CRow>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <CTable striped hover>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>#</CTableHeaderCell>
                  <CTableHeaderCell>Matricule</CTableHeaderCell>
                  <CTableHeaderCell>Nom & Prénoms</CTableHeaderCell>
                  <CTableHeaderCell>Email</CTableHeaderCell>
                  <CTableHeaderCell>Contacts</CTableHeaderCell>
                  <CTableHeaderCell>Titre du Mémoire</CTableHeaderCell>
                  <CTableHeaderCell>Encadreur</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {filteredSubmissions.map((submission, index) => (
                  <CTableRow key={submission.id}>
                    <CTableDataCell>{index + 1}</CTableDataCell>
                    <CTableDataCell>{submission.student_id_number}</CTableDataCell>
                    <CTableDataCell>{submission.student_name}</CTableDataCell>
                    <CTableDataCell>{submission.student_email}</CTableDataCell>
                    <CTableDataCell>{submission.student_contacts}</CTableDataCell>
                    <CTableDataCell>{submission.thesis_title}</CTableDataCell>
                    <CTableDataCell>{submission.professor_name}</CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        color="info"
                        size="sm"
                        className="me-1"
                        onClick={() => handleViewDossier(submission.id)}
                      >
                        <CIcon icon={cilFile} /> Voir
                      </CButton>
                      {submission.status === 'pending' && (
                        <>
                          <CButton
                            color="success"
                            size="sm"
                            className="me-1"
                            onClick={() => handleAccept(submission.id)}
                          >
                            <CIcon icon={cilCheckCircle} />
                          </CButton>
                          <CButton
                            color="danger"
                            size="sm"
                            onClick={() => handleReject(submission)}
                          >
                            <CIcon icon={cilXCircle} />
                          </CButton>
                        </>
                      )}
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </div>
        </CCardBody>
      </CCard>

      {/* Modal Rejet */}
      <CModal visible={showRejectModal} onClose={() => setShowRejectModal(false)}>
        <CModalHeader>
          <CModalTitle>Motif du rejet</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={submitRejection}>
          <CModalBody>
            <CFormLabel>Veuillez saisir le motif du rejet :</CFormLabel>
            <CFormTextarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowRejectModal(false)}>
              Annuler
            </CButton>
            <CButton color="danger" type="submit">
              Rejeter
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      {/* Modal Dossier */}
      <CModal size="lg" visible={showDossierModal} onClose={() => setShowDossierModal(false)}>
        <CModalHeader className="bg-primary text-white">
          <CModalTitle>Dossier de Soutenance</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedSubmission && (
            <CRow>
              <CCol md={6}>
                <CCard className="h-100 border-0 shadow-sm">
                  <CCardHeader className="bg-light">
                    <h6 className="mb-0">Informations Étudiant</h6>
                  </CCardHeader>
                  <CCardBody>
                    <p><strong>Matricule:</strong> {selectedSubmission.student_id_number}</p>
                    <p><strong>Nom & Prénoms:</strong> {selectedSubmission.student_name}</p>
                    <p><strong>Email:</strong> {selectedSubmission.student_email}</p>
                    <p><strong>Contacts:</strong> {selectedSubmission.student_contacts}</p>
                    <p><strong>Filière:</strong> {selectedSubmission.department}</p>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol md={6}>
                <CCard className="h-100 border-0 shadow-sm">
                  <CCardHeader className="bg-light">
                    <h6 className="mb-0">Détails du Mémoire</h6>
                  </CCardHeader>
                  <CCardBody>
                    <p><strong>Titre:</strong> {selectedSubmission.thesis_title}</p>
                    <p><strong>Encadreur:</strong> {selectedSubmission.professor_name}</p>
                    <p><strong>Période:</strong> {selectedSubmission.period}</p>
                    <p><strong>Type:</strong> {getTypeBadge(selectedSubmission.defense_type)}</p>
                    <p><strong>Statut:</strong> {getStatusBadge(selectedSubmission.status)}</p>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDossierModal(false)}>
            Fermer
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default SubmissionsList
