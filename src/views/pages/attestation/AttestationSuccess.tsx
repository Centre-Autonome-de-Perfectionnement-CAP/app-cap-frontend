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
  CPagination,
  CPaginationItem,
  CFormCheck,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilCheckAlt, cilSearch } from '@coreui/icons'
import { useAttestationData } from '@/hooks/attestation'
import { useFiltersData, useAnneeAcademiqueData } from '@/hooks/inscription'
import { AttestationFilters, PreviewModal } from '@/components/attestation'
import useDebounce from '@/hooks/common/useDebounce'
import usePagination from '@/hooks/common/usePagination'
import useModal from '@/hooks/common/useModal'
import type { EligibleStudent } from '@/types/attestation.types'
import attestationService from '@/services/attestation.service'

const AttestationSuccess = () => {
  const { students, loading, loadStudents, generateAttestation } = useAttestationData('success')
  const { academicYears } = useAnneeAcademiqueData()
  const [generating, setGenerating] = useState<number | null>(null)
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

  const handlePreview = async (student: EligibleStudent) => {
    setPreviewStudent(student)
    previewModal.open()
    try {
      const [attestationUrl, birthCertResponse] = await Promise.all([
        attestationService.generateSuccess(student.student_pending_student_id),
        attestationService.getBirthCertificate(student.student_pending_student_id).catch(() => null)
      ])
      setAttestationPreviewUrl(attestationUrl)
      if (birthCertResponse?.data?.url) setBirthCertUrl(birthCertResponse.data.url)
    } catch (error) {
      alert('Erreur lors de la génération de l\'aperçu')
    }
  }

  const handleGenerate = async (studentPendingStudentId: number) => {
    setGenerating(studentPendingStudentId)
    try {
      await generateAttestation(studentPendingStudentId, 'success')
    } finally {
      setGenerating(null)
    }
  }

  const handleUpdateNames = async (lastName: string, firstNames: string) => {
    if (!previewStudent) return
    await attestationService.updateStudentNames(previewStudent.student_pending_student_id, lastName, firstNames)
    const url = await attestationService.generateSuccess(previewStudent.student_pending_student_id)
    setAttestationPreviewUrl(url)
  }

  const handleValidateAndDownload = async () => {
    if (!previewStudent) return
    await generateAttestation(previewStudent.student_pending_student_id, 'success')
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
    if (selectedStudents.length === 0) return
    setGeneratingBulk(true)
    try {
      for (const studentId of selectedStudents) {
        await generateAttestation(studentId, 'success')
      }
      alert(`${selectedStudents.length} attestation(s) générée(s) avec succès`)
      setSelectedStudents([])
    } catch (error) {
      alert('Erreur lors de la génération en masse')
    } finally {
      setGeneratingBulk(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Attestation de Succès</strong>
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
                      Générer {selectedStudents.length} attestation(s)
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
                        <CButton
                          color="success"
                          size="sm"
                          onClick={() => handleGenerate(student.student_pending_student_id)}
                          disabled={generating === student.student_pending_student_id}
                        >
                          {generating === student.student_pending_student_id ? <CSpinner size="sm" /> : <CIcon icon={cilCloudDownload} />}
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
    </CRow>
  )
}

export default AttestationSuccess
