// src/views/pages/attestation/Bulletins.tsx
// Le bulletin nécessite une année académique sélectionnée — logique spéciale conservée.

import { useState, useEffect, useCallback } from 'react'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow,
  CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell,
  CButton, CSpinner, CPagination, CPaginationItem,
  CFormCheck, CBadge, CAlert,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilCheckAlt, cilSearch, cilInbox, cilInfo } from '@coreui/icons'
import { AttestationFilters, PreviewModal } from '@/components/attestation'
import { useFiltersData, useAnneeAcademiqueData } from '@/hooks/inscription'
import useAttestationData from '@/hooks/attestation/useAttestationData'
import useDebounce from '@/hooks/common/useDebounce'
import usePagination from '@/hooks/common/usePagination'
import useModal from '@/hooks/common/useModal'
import attestationService from '@/services/attestation.service'
import type { EligibleStudent } from '@/types/attestation.types'

const Bulletins = () => {
  const { students, loading, loadStudents } = useAttestationData('passage')
  const { academicYears } = useAnneeAcademiqueData()

  const [generatingId,   setGeneratingId]   = useState<number | null>(null)
  const [selectedIds,    setSelectedIds]     = useState<number[]>([])
  const [generatingBulk, setGeneratingBulk] = useState(false)

  const previewModal = useModal()
  const [previewStudent,        setPreviewStudent]        = useState<EligibleStudent | null>(null)
  const [attestationPreviewUrl, setAttestationPreviewUrl] = useState<string | undefined>()
  const [birthCertUrl,          setBirthCertUrl]          = useState<string | undefined>()

  // Modal confirmation avant téléchargement unitaire
  const [confirmModal,    setConfirmModal]    = useState(false)
  const [confirmStudent,  setConfirmStudent]  = useState<EligibleStudent | null>(null)

  const [selectedYear,    setSelectedYear]    = useState('all')
  const [selectedFiliere, setSelectedFiliere] = useState('all')
  const [selectedCohort,  setSelectedCohort]  = useState('all')
  const [searchQuery,     setSearchQuery]     = useState('')
  const debouncedSearch = useDebounce(searchQuery, 500)

  const { currentPage, totalPages, goToPage, nextPage, previousPage,
          canGoNext, canGoPrevious, startIndex, endIndex } = usePagination({
    totalItems: students.length, itemsPerPage: 10,
  })

  const { departments, cohorts } = useFiltersData(
    selectedYear !== 'all' ? parseInt(selectedYear) : null,
  )

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const requireYear = async (): Promise<boolean> => {
    if (selectedYear !== 'all') return true
    const Swal = (await import('sweetalert2')).default
    await Swal.fire({ icon: 'warning', title: 'Année requise', text: 'Sélectionnez une année académique pour générer le bulletin.' })
    return false
  }

  const downloadBlob = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url; link.download = filename
    document.body.appendChild(link); link.click(); document.body.removeChild(link)
  }

  // ── Chargement ──────────────────────────────────────────────────────────────

  const buildFilters = useCallback((
    year = selectedYear, filiere = selectedFiliere,
    cohort = selectedCohort, search = searchQuery,
  ) => {
    const f: Record<string, any> = {}
    if (year    !== 'all') f.academic_year_id = parseInt(year)
    if (filiere !== 'all') f.department_id    = parseInt(filiere)
    if (cohort  !== 'all') f.cohort           = cohort
    if (search)            f.search           = search
    return f
  }, [selectedYear, selectedFiliere, selectedCohort, searchQuery])

  useEffect(() => { loadStudents({}) }, [])

  useEffect(() => {
    loadStudents(buildFilters(undefined, undefined, undefined, debouncedSearch))
  }, [debouncedSearch])

  const handleFilterChange = (name: string, option: any) => {
    const value = option?.value || 'all'
    const newYear    = name === 'year'    ? value : selectedYear
    const newFiliere = name === 'filiere' ? value : selectedFiliere
    const newCohort  = name === 'cohort'  ? value : selectedCohort
    if (name === 'year')    setSelectedYear(value)
    if (name === 'filiere') setSelectedFiliere(value)
    if (name === 'cohort')  setSelectedCohort(value)
    loadStudents(buildFilters(newYear, newFiliere, newCohort))
  }

  // ── Aperçu ──────────────────────────────────────────────────────────────────

  const handlePreview = async (student: EligibleStudent) => {
    if (!await requireYear()) return
    setPreviewStudent(student)
    setAttestationPreviewUrl(undefined)
    setBirthCertUrl(undefined)
    previewModal.open()
    try {
      const [url, birthCert] = await Promise.all([
        attestationService.generateBulletin(student.student_pending_student_id, parseInt(selectedYear)),
        attestationService.getBirthCertificate(student.student_pending_student_id).catch(() => null),
      ])
      setAttestationPreviewUrl(url)
      if (birthCert?.data?.url) setBirthCertUrl(birthCert.data.url)
    } catch {
      const Swal = (await import('sweetalert2')).default
      Swal.fire({ icon: 'error', title: 'Erreur', text: "Impossible de générer l'aperçu" })
    }
  }

  // ── Génération unitaire ─────────────────────────────────────────────────────

  const openConfirm = async (student: EligibleStudent) => {
    if (!await requireYear()) return
    setConfirmStudent(student)
    setConfirmModal(true)
  }

  const handleGenerate = async () => {
    if (!confirmStudent || selectedYear === 'all') return
    setGeneratingId(confirmStudent.student_pending_student_id)
    setConfirmModal(false)
    try {
      const url = await attestationService.generateBulletin(
        confirmStudent.student_pending_student_id, parseInt(selectedYear),
      )
      downloadBlob(url, 'bulletin.pdf')
      const Swal = (await import('sweetalert2')).default
      Swal.fire({ icon: 'success', title: 'Succès', text: 'Bulletin généré', timer: 2000, showConfirmButton: false })
    } catch (err: any) {
      const Swal = (await import('sweetalert2')).default
      Swal.fire({ icon: 'error', title: 'Erreur', text: err?.message || 'Erreur lors de la génération' })
    } finally {
      setGeneratingId(null)
      setConfirmStudent(null)
    }
  }

  // ── Noms + re-aperçu ────────────────────────────────────────────────────────

  const handleUpdateNames = async (lastName: string, firstNames: string) => {
    if (!previewStudent || selectedYear === 'all') return
    await attestationService.updateStudentNames(previewStudent.student_pending_student_id, lastName, firstNames)
    const url = await attestationService.generateBulletin(previewStudent.student_pending_student_id, parseInt(selectedYear))
    setAttestationPreviewUrl(url)
  }

  const handleValidateAndDownload = async () => {
    if (!previewStudent || selectedYear === 'all') return
    const url = await attestationService.generateBulletin(previewStudent.student_pending_student_id, parseInt(selectedYear))
    downloadBlob(url, 'bulletin.pdf')
  }

  // ── Sélection ───────────────────────────────────────────────────────────────

  const toggle = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const toggleAll = () =>
    setSelectedIds(selectedIds.length === students.length ? [] : students.map(s => s.student_pending_student_id))

  // ── Génération en masse ─────────────────────────────────────────────────────

  const handleGenerateBulk = async () => {
    if (!await requireYear()) return
    if (!selectedIds.length) return
    setGeneratingBulk(true)
    try {
      const bulletins = selectedIds.map(id => ({
        student_pending_student_id: id,
        academic_year_id: parseInt(selectedYear),
      }))
      const url = await attestationService.generateMultipleBulletins(bulletins)
      downloadBlob(url, 'bulletins.pdf')
      const Swal = (await import('sweetalert2')).default
      Swal.fire({ icon: 'success', title: 'Succès', text: `${selectedIds.length} bulletin(s) généré(s)`, timer: 2000, showConfirmButton: false })
      setSelectedIds([])
    } catch (err: any) {
      const Swal = (await import('sweetalert2')).default
      Swal.fire({ icon: 'error', title: 'Erreur', text: err?.message || 'Erreur lors de la génération en masse' })
    } finally {
      setGeneratingBulk(false)
    }
  }

  // ── Rendu ───────────────────────────────────────────────────────────────────

  const paginatedStudents = students.slice(startIndex, endIndex)
  const allSelected = students.length > 0 && selectedIds.length === students.length

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="border-0 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderRadius: 12 }}>
            <CCardHeader
              className="bg-white d-flex justify-content-between align-items-center"
              style={{ borderBottom: '1px solid #f1f5f9', borderRadius: '12px 12px 0 0', padding: '16px 20px' }}
            >
              <div>
                <strong style={{ fontSize: '1rem', color: '#111827' }}>Bulletins de Notes</strong>
                <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>
                  Sélectionnez une année académique pour activer la génération
                </div>
              </div>
              {students.length > 0 && (
                <CBadge color="primary" shape="rounded-pill">{students.length} étudiant{students.length > 1 ? 's' : ''}</CBadge>
              )}
            </CCardHeader>

            <CCardBody className="p-4">
              {selectedYear === 'all' && (
                <CAlert color="info" className="small py-2 mb-3">
                  <CIcon icon={cilInfo} className="me-1" />
                  Sélectionnez une <strong>année académique</strong> pour pouvoir générer les bulletins.
                </CAlert>
              )}

              {/* Actions masse */}
              {students.length > 0 && (
                <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                  <CButton color="light" size="sm" className="border" onClick={toggleAll}>
                    <CIcon icon={cilCheckAlt} className="me-1" />
                    {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </CButton>
                  {selectedIds.length > 0 && (
                    <CButton color="success" size="sm" onClick={handleGenerateBulk} disabled={generatingBulk}>
                      {generatingBulk
                        ? <><CSpinner size="sm" className="me-1" />Génération…</>
                        : <><CIcon icon={cilCloudDownload} className="me-1" />
                            Générer {selectedIds.length} bulletin{selectedIds.length > 1 ? 's' : ''}</>}
                    </CButton>
                  )}
                </div>
              )}

              <AttestationFilters
                filterOptions={{ years: academicYears, filieres: departments, cohorts }}
                selectedYear={selectedYear}
                selectedFiliere={selectedFiliere}
                selectedCohort={selectedCohort}
                searchQuery={searchQuery}
                onFilterChange={handleFilterChange}
                onSearchChange={e => setSearchQuery(e.target.value)}
                showSearch
              />

              {loading ? (
                <div className="text-center py-5">
                  <CSpinner color="primary" />
                  <div className="text-muted small mt-2">Chargement…</div>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%', background: '#f3f4f6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px',
                  }}>
                    <CIcon icon={cilInbox} style={{ width: 28, height: 28, color: '#9ca3af' }} />
                  </div>
                  <div className="fw-semibold">Aucun étudiant trouvé</div>
                </div>
              ) : (
                <CTable hover responsive className="align-middle mt-3" style={{ fontSize: '0.88rem' }}>
                  <CTableHead style={{
                    background: 'linear-gradient(to right, #f8fafc, #f1f5f9)',
                    fontSize: '0.72rem', textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: '#6b7280',
                  }}>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: 44 }}>
                        <CFormCheck checked={allSelected} onChange={toggleAll} />
                      </CTableHeaderCell>
                      <CTableHeaderCell>Matricule</CTableHeaderCell>
                      <CTableHeaderCell>Nom</CTableHeaderCell>
                      <CTableHeaderCell>Prénoms</CTableHeaderCell>
                      <CTableHeaderCell>Filière</CTableHeaderCell>
                      <CTableHeaderCell>Niveau</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: 100, textAlign: 'right' }}>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {paginatedStudents.map(student => (
                      <CTableRow key={student.id}>
                        <CTableDataCell>
                          <CFormCheck
                            checked={selectedIds.includes(student.student_pending_student_id)}
                            onChange={() => toggle(student.student_pending_student_id)}
                          />
                        </CTableDataCell>
                        <CTableDataCell>
                          <code style={{ fontSize: '0.8rem', color: '#6b7280' }}>{student.student_id || '—'}</code>
                        </CTableDataCell>
                        <CTableDataCell className="fw-semibold" style={{ color: '#111827' }}>
                          {student.last_name}
                        </CTableDataCell>
                        <CTableDataCell>{student.first_names}</CTableDataCell>
                        <CTableDataCell className="text-muted">{student.department}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="info" shape="rounded-pill" style={{ fontSize: '0.72rem' }}>
                            {student.study_level || '—'}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell style={{ textAlign: 'right' }}>
                          <CButton
                            color="light" size="sm" className="border me-1"
                            title="Aperçu" onClick={() => handlePreview(student)}
                          >
                            <CIcon icon={cilSearch} />
                          </CButton>
                          <CButton
                            color="success" size="sm"
                            title="Télécharger"
                            onClick={() => openConfirm(student)}
                            disabled={generatingId === student.student_pending_student_id}
                          >
                            {generatingId === student.student_pending_student_id
                              ? <CSpinner size="sm" />
                              : <CIcon icon={cilCloudDownload} />}
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}

              {students.length > 10 && (
                <CPagination align="center" className="mt-3" size="sm">
                  <CPaginationItem disabled={!canGoPrevious} onClick={previousPage}>Précédent</CPaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <CPaginationItem key={i + 1} active={currentPage === i + 1} onClick={() => goToPage(i + 1)}>
                      {i + 1}
                    </CPaginationItem>
                  ))}
                  <CPaginationItem disabled={!canGoNext} onClick={nextPage}>Suivant</CPaginationItem>
                </CPagination>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Modal confirmation génération unitaire */}
      <CModal visible={confirmModal} onClose={() => setConfirmModal(false)} alignment="center">
        <CModalHeader>
          <CModalTitle>Générer le bulletin</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            <strong>{confirmStudent?.last_name} {confirmStudent?.first_names}</strong>
          </p>
          <p className="text-muted small mb-0">
            Le bulletin pour l'année académique sélectionnée sera généré et téléchargé.
          </p>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setConfirmModal(false)}>Annuler</CButton>
          <CButton color="primary" onClick={handleGenerate}>
            <CIcon icon={cilCloudDownload} className="me-1" />Générer
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Aperçu */}
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
