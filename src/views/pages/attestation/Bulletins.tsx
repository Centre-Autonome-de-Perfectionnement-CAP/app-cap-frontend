import { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CSpinner,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CFormCheck,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilCheckAlt, cilSearch } from '@coreui/icons'
import { useAttestationData } from '@/hooks/attestation'
import { useFiltersData, useAnneeAcademiqueData } from '@/hooks/inscription'
import { AttestationFilters, PreviewModal } from '@/components/attestation'
import type { EligibleStudent } from '@/types/attestation.types'
import useDebounce from '@/hooks/common/useDebounce'
import usePagination from '@/hooks/common/usePagination'
import useModal from '@/hooks/common/useModal'
import attestationService from '@/services/attestation.service'
import Swal from 'sweetalert2'

const Bulletins = () => {
  const { students, loading, loadStudents, generateBulletin } = useAttestationData('success')
  const { academicYears } = useAnneeAcademiqueData()
  const [generating, setGenerating] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])
  const [generatingBulk, setGeneratingBulk] = useState(false)
  const previewModal = useModal()
  const [previewStudent, setPreviewStudent] = useState<EligibleStudent | null>(null)
  const [attestationPreviewUrl, setAttestationPreviewUrl] = useState<string | undefined>()
  const [birthCertUrl, setBirthCertUrl] = useState<string | undefined>()
  
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedFiliere, setSelectedFiliere] = useState('all')
  const [selectedCohort, setSelectedCohort] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 500)
  
  const { currentPage, itemsPerPage, totalPages, goToPage, nextPage, previousPage, canGoNext, canGoPrevious, startIndex, endIndex } = usePagination({
    totalItems: students.length,
    itemsPerPage: 10,
  })

  const [showModal, setShowModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<EligibleStudent | null>(null)

  const { departments, cohorts } = useFiltersData(
    selectedYear !== 'all' ? parseInt(selectedYear) : null
  )

  useEffect(() => {
    loadStudents({})
  }, [])
  
  useEffect(() => {
    const filters: any = {}
    if (selectedYear !== 'all') filters.academic_year_id = parseInt(selectedYear)
    if (selectedFiliere !== 'all') filters.department_id = parseInt(selectedFiliere)
    if (selectedCohort !== 'all') filters.cohort = selectedCohort
    if (debouncedSearch) filters.search = debouncedSearch
    loadStudents(filters)
  }, [debouncedSearch])

  const handleFilterChange = (name: string, option: any) => {
    const value = option?.value || 'all'
    if (name === 'year') setSelectedYear(value)
    else if (name === 'filiere') setSelectedFiliere(value)
    else if (name === 'cohort') setSelectedCohort(value)
    
    const filters: any = {}
    const newYear = name === 'year' ? value : selectedYear
    const newFiliere = name === 'filiere' ? value : selectedFiliere
    const newCohort = name === 'cohort' ? value : selectedCohort
    
    if (newYear !== 'all') filters.academic_year_id = parseInt(newYear)
    if (newFiliere !== 'all') filters.department_id = parseInt(newFiliere)
    if (newCohort !== 'all') filters.cohort = parseInt(newCohort)
    if (searchQuery) filters.search = searchQuery
    loadStudents(filters)
  }

  const openModal = (student: EligibleStudent) => {
    setSelectedStudent(student)
    setShowModal(true)
  }

  const handlePreview = async (student: EligibleStudent) => {
    if (selectedYear === 'all') {
      await Swal.fire({
        icon: 'warning',
        title: 'Année académique requise',
        text: 'Veuillez sélectionner une année académique'
      })
      return
    }
    setPreviewStudent(student)
    previewModal.open()
    try {
      const [bulletinUrl, birthCertResponse] = await Promise.all([
        attestationService.generateBulletin(student.student_pending_student_id, parseInt(selectedYear)),
        attestationService.getBirthCertificate(student.student_pending_student_id).catch(() => null)
      ])
      setAttestationPreviewUrl(bulletinUrl)
      if (birthCertResponse?.data?.url) setBirthCertUrl(birthCertResponse.data.url)
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la génération de l\'aperçu'
      })
    }
  }

  const handleGenerate = async () => {
    if (!selectedStudent || selectedYear === 'all') return
    
    setGenerating(true)
    try {
      await generateBulletin(
        selectedStudent.student_pending_student_id,
        parseInt(selectedYear)
      )
      setShowModal(false)
    } finally {
      setGenerating(false)
    }
  }

  const handleUpdateNames = async (lastName: string, firstNames: string) => {
    if (!previewStudent || selectedYear === 'all') return
    await attestationService.updateStudentNames(previewStudent.student_pending_student_id, lastName, firstNames)
    const url = await attestationService.generateBulletin(previewStudent.student_pending_student_id, parseInt(selectedYear))
    setAttestationPreviewUrl(url)
  }

  const handleValidateAndDownload = async () => {
    if (!previewStudent || selectedYear === 'all') return
    await generateBulletin(previewStudent.student_pending_student_id, parseInt(selectedYear))
  }

  const handleSelectStudent = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    )
  }

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map(s => s.student_pending_student_id))
    }
  }

  const handleGenerateBulk = async () => {
    if (selectedStudents.length === 0 || selectedYear === 'all') {
      await Swal.fire({
        icon: 'warning',
        title: 'Année académique requise',
        text: 'Veuillez sélectionner une année académique'
      })
      return
    }
    setGeneratingBulk(true)
    try {
      const bulletins = selectedStudents.map(studentId => ({
        student_pending_student_id: studentId,
        academic_year_id: parseInt(selectedYear)
      }))
      
      const url = await attestationService.generateMultipleBulletins(bulletins)
      
      const link = document.createElement('a')
      link.href = url
      link.download = 'bulletins.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      await Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: `${selectedStudents.length} bulletin(s) généré(s) avec succès`,
        timer: 2000,
        showConfirmButton: false
      })
      setSelectedStudents([])
    } catch (error) {
      await Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de la génération en masse'
      })
    } finally {
      setGeneratingBulk(false)
    }
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Bulletins</strong>
            </CCardHeader>
            <CCardBody>
              {students.length > 0 && (
                <CRow className="mb-3">
                  <CCol>
                    <CButton 
                      color="primary" 
                      onClick={handleSelectAll}
                      className="me-2"
                    >
                      <CIcon icon={cilCheckAlt} className="me-1" />
                      {selectedStudents.length === students.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </CButton>
                    {selectedStudents.length > 0 && (
                      <CButton 
                        color="success" 
                        onClick={handleGenerateBulk}
                        disabled={generatingBulk}
                      >
                        {generatingBulk ? <CSpinner size="sm" /> : <CIcon icon={cilCloudDownload} className="me-1" />}
                        Générer {selectedStudents.length} bulletin(s)
                      </CButton>
                    )}
                  </CCol>
                </CRow>
              )}

              <AttestationFilters
                filterOptions={{
                  years: academicYears,
                  filieres: departments,
                  cohorts: cohorts,
                }}
                selectedYear={selectedYear}
                selectedFiliere={selectedFiliere}
                selectedCohort={selectedCohort}
                searchQuery={searchQuery}
                onFilterChange={handleFilterChange}
                onSearchChange={(e) => setSearchQuery(e.target.value)}
                showSearch
              />

              {loading ? (
                <div className="text-center">
                  <CSpinner color="primary" />
                </div>
              ) : (
                <CTable striped hover>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: '50px' }}>
                        <CFormCheck 
                          checked={selectedStudents.length === students.length && students.length > 0}
                          onChange={handleSelectAll}
                        />
                      </CTableHeaderCell>
                      <CTableHeaderCell>Matricule</CTableHeaderCell>
                      <CTableHeaderCell>Nom</CTableHeaderCell>
                      <CTableHeaderCell>Prénoms</CTableHeaderCell>
                      <CTableHeaderCell>Filière</CTableHeaderCell>
                      <CTableHeaderCell>Action</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {students.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={6} className="text-center">
                          Aucun étudiant trouvé
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      students.slice(startIndex, endIndex).map((student) => (
                      <CTableRow key={student.id}>
                        <CTableDataCell>
                          <CFormCheck 
                            checked={selectedStudents.includes(student.student_pending_student_id)}
                            onChange={() => handleSelectStudent(student.student_pending_student_id)}
                          />
                        </CTableDataCell>
                        <CTableDataCell>{student.student_id}</CTableDataCell>
                        <CTableDataCell>{student.last_name}</CTableDataCell>
                        <CTableDataCell>{student.first_names}</CTableDataCell>
                        <CTableDataCell>{student.department}</CTableDataCell>
                        <CTableDataCell>
                          <CButton color="info" size="sm" onClick={() => handlePreview(student)} className="me-1">
                            <CIcon icon={cilSearch} />
                          </CButton>
                          <CButton color="success" size="sm" onClick={() => openModal(student)}>
                            <CIcon icon={cilCloudDownload} />
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    )))}
                  </CTableBody>
                </CTable>
              )}
              
              {students.length > 0 && (
                <CPagination align="center" className="mt-3">
                  <CPaginationItem disabled={!canGoPrevious} onClick={previousPage}>
                    Précédent
                  </CPaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <CPaginationItem
                      key={i + 1}
                      active={currentPage === i + 1}
                      onClick={() => goToPage(i + 1)}
                    >
                      {i + 1}
                    </CPaginationItem>
                  ))}
                  <CPaginationItem disabled={!canGoNext} onClick={nextPage}>
                    Suivant
                  </CPaginationItem>
                </CPagination>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CModal visible={showModal} onClose={() => setShowModal(false)}>
        <CModalHeader>
          <CModalTitle>Générer un bulletin</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            <strong>Étudiant:</strong> {selectedStudent?.last_name} {selectedStudent?.first_names}
          </p>
          <p className="text-muted">
            Le bulletin de l'année complète sera généré.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </CButton>
          <CButton color="primary" onClick={handleGenerate} disabled={generating}>
            {generating ? <CSpinner size="sm" /> : 'Générer'}
          </CButton>
        </CModalFooter>
      </CModal>

      <PreviewModal
        visible={previewModal.isOpen}
        onClose={() => {
          previewModal.close()
          setPreviewStudent(null)
          setAttestationPreviewUrl(undefined)
          setBirthCertUrl(undefined)
        }}
        birthCertificateUrl={birthCertUrl}
        attestationUrl={attestationPreviewUrl}
        studentName={previewStudent?.last_name || ''}
        studentFirstNames={previewStudent?.first_names || ''}
        onUpdateNames={handleUpdateNames}
        onValidateAndDownload={handleValidateAndDownload}
      />
    </>
  )
}

export default Bulletins
