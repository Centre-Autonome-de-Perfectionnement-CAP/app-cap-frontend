// src/views/pages/attestation/components/AttestationView.tsx
// Composant générique réutilisé par Passage, Définitive, Inscription, Préparatoire.
// Gère : filtres, tableau, pagination, aperçu, génération unitaire & en masse.

import { useState, useEffect, useCallback } from 'react'
import {
  CCard, CCardBody, CCardHeader, CCol, CRow,
  CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell,
  CButton, CSpinner, CPagination, CPaginationItem,
  CFormCheck, CBadge, CInputGroup, CInputGroupText, CFormInput,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudDownload, cilCheckAlt, cilSearch, cilFilter,
  cilInbox,
} from '@coreui/icons'
import { AttestationFilters, PreviewModal } from '@/components/attestation'
import { useFiltersData, useAnneeAcademiqueData } from '@/hooks/inscription'
import useAttestationData from '@/hooks/attestation/useAttestationData'
import type { AttestationType } from '@/hooks/attestation/useAttestationData'
import useDebounce from '@/hooks/common/useDebounce'
import usePagination from '@/hooks/common/usePagination'
import useModal from '@/hooks/common/useModal'
import attestationService from '@/services/attestation.service'
import type { EligibleStudent } from '@/types/attestation.types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ColumnConfig {
  key: string
  header: string
  render: (student: EligibleStudent) => React.ReactNode
}

interface Props {
  /** Type d'attestation — détermine les appels API */
  attestationType: AttestationType
  /** Titre affiché dans le header */
  title: string
  /** Sous-titre / description */
  subtitle?: string
  /** Colonnes personnalisées (s'ajoutent aux colonnes de base) */
  extraColumns?: ColumnConfig[]
  /** Afficher ou masquer le filtre cohort */
  showCohortFilter?: boolean
  /** Message quand aucun étudiant */
  emptyMessage?: string
  /** Nom du fichier PDF téléchargé en masse */
  bulkFilename?: string
  /** Générer l'aperçu avec cette fonction (défaut: attestationType) */
  previewGenerator?: (id: number) => Promise<string>
  /** Re-générer l'aperçu après modif des noms */
  previewRegenerator?: (id: number) => Promise<string>
  /** Télécharger unitaire (défaut: attestationType) */
  unitGenerator?: (id: number) => Promise<string>
  /** Nom du fichier PDF unitaire */
  unitFilename?: string
}

// ─── Composant ────────────────────────────────────────────────────────────────

const AttestationView = ({
  attestationType,
  title,
  subtitle,
  extraColumns = [],
  showCohortFilter = true,
  emptyMessage,
  bulkFilename,
  previewGenerator,
  previewRegenerator,
  unitGenerator,
  unitFilename = 'attestation.pdf',
}: Props) => {
  const { students, loading, loadStudents, generateAttestation, generateMultiple } =
    useAttestationData(attestationType)
  const { academicYears } = useAnneeAcademiqueData()

  const [generating,     setGenerating]     = useState<number | null>(null)
  const [selectedIds,    setSelectedIds]     = useState<number[]>([])
  const [generatingBulk, setGeneratingBulk] = useState(false)

  const previewModal = useModal()
  const [previewStudent,         setPreviewStudent]         = useState<EligibleStudent | null>(null)
  const [attestationPreviewUrl,  setAttestationPreviewUrl]  = useState<string | undefined>()
  const [birthCertUrl,           setBirthCertUrl]           = useState<string | undefined>()

  // Filtres
  const [selectedYear,    setSelectedYear]    = useState('all')
  const [selectedFiliere, setSelectedFiliere] = useState('all')
  const [selectedCohort,  setSelectedCohort]  = useState('all')
  const [searchQuery,     setSearchQuery]     = useState('')
  const debouncedSearch = useDebounce(searchQuery, 500)

  const { currentPage, totalPages, goToPage, nextPage, previousPage,
          canGoNext, canGoPrevious, startIndex, endIndex } = usePagination({
    totalItems: students.length,
    itemsPerPage: 10,
  })

  const { departments, cohorts } = useFiltersData(
    selectedYear !== 'all' ? parseInt(selectedYear) : null,
  )

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
    if (!debouncedSearch && debouncedSearch !== '') return
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
    setPreviewStudent(student)
    setAttestationPreviewUrl(undefined)
    setBirthCertUrl(undefined)
    previewModal.open()
    try {
      const generator = previewGenerator
        ?? (() => generateAttestation(student.student_pending_student_id) as any)

      const [url, birthCert] = await Promise.all([
        previewGenerator
          ? previewGenerator(student.student_pending_student_id)
          : (async () => {
              // génère et récupère l'URL sans déclencher le téléchargement
              switch (attestationType) {
                case 'passage':    return attestationService.generatePassage(student.student_pending_student_id)
                case 'definitive': return attestationService.generateDefinitive(student.student_pending_student_id)
                case 'inscription':return attestationService.generateInscription(student.student_pending_student_id)
                case 'preparatory':return attestationService.generatePreparatory(student.student_pending_student_id)
                case 'licence':    return attestationService.generateLicence(student.student_pending_student_id)
                default:           return attestationService.generatePassage(student.student_pending_student_id)
              }
            })(),
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

  const handleGenerate = async (studentPendingStudentId: number) => {
    setGenerating(studentPendingStudentId)
    try {
      if (unitGenerator) {
        const url = await unitGenerator(studentPendingStudentId)
        const link = document.createElement('a')
        link.href = url; link.download = unitFilename
        document.body.appendChild(link); link.click(); document.body.removeChild(link)
        const Swal = (await import('sweetalert2')).default
        Swal.fire({ icon: 'success', title: 'Succès', text: 'Document généré', timer: 2000, showConfirmButton: false })
      } else {
        await generateAttestation(studentPendingStudentId)
      }
    } finally {
      setGenerating(null)
    }
  }

  // ── Modification noms + re-aperçu ───────────────────────────────────────────

  const handleUpdateNames = async (lastName: string, firstNames: string) => {
    if (!previewStudent) return
    await attestationService.updateStudentNames(previewStudent.student_pending_student_id, lastName, firstNames)
    const regenerate = previewRegenerator ?? (() => {
      const id = previewStudent.student_pending_student_id
      switch (attestationType) {
        case 'passage':     return attestationService.generatePassage(id)
        case 'definitive':  return attestationService.generateDefinitive(id)
        case 'inscription': return attestationService.generateInscription(id)
        case 'preparatory': return attestationService.generatePreparatory(id)
        case 'licence':     return attestationService.generateLicence(id)
        default:            return attestationService.generatePassage(id)
      }
    })
    const url = await regenerate(previewStudent.student_pending_student_id)
    setAttestationPreviewUrl(url)
  }

  const handleValidateAndDownload = async () => {
    if (!previewStudent) return
    await handleGenerate(previewStudent.student_pending_student_id)
  }

  // ── Sélection ───────────────────────────────────────────────────────────────

  const toggle = (id: number) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const toggleAll = () =>
    setSelectedIds(selectedIds.length === students.length ? [] : students.map(s => s.student_pending_student_id))

  // ── Génération en masse ─────────────────────────────────────────────────────

  const handleGenerateBulk = async () => {
    if (!selectedIds.length) return
    setGeneratingBulk(true)
    try {
      const url = await generateMultiple(selectedIds)
      const link = document.createElement('a')
      link.href = url
      link.download = bulkFilename ?? `${attestationType}-multiple.pdf`
      document.body.appendChild(link); link.click(); document.body.removeChild(link)
      const Swal = (await import('sweetalert2')).default
      Swal.fire({
        icon: 'success', title: 'Succès',
        text: `${selectedIds.length} document(s) généré(s) avec succès`,
        timer: 2000, showConfirmButton: false,
      })
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
    <CRow>
      <CCol xs={12}>
        <CCard className="border-0 mb-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderRadius: 12 }}>

          {/* Header */}
          <CCardHeader
            className="bg-white d-flex justify-content-between align-items-center"
            style={{ borderBottom: '1px solid #f1f5f9', borderRadius: '12px 12px 0 0', padding: '16px 20px' }}
          >
            <div>
              <strong style={{ fontSize: '1rem', color: '#111827' }}>{title}</strong>
              {subtitle && (
                <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>{subtitle}</div>
              )}
            </div>
            {students.length > 0 && (
              <CBadge color="primary" shape="rounded-pill" style={{ fontSize: '0.8rem' }}>
                {students.length} étudiant{students.length > 1 ? 's' : ''}
              </CBadge>
            )}
          </CCardHeader>

          <CCardBody className="p-4">

            {/* Barre d'actions masse */}
            {students.length > 0 && (
              <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                <CButton color="light" size="sm" onClick={toggleAll} className="border">
                  <CIcon icon={cilCheckAlt} className="me-1" />
                  {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
                </CButton>
                {selectedIds.length > 0 && (
                  <CButton color="success" size="sm" onClick={handleGenerateBulk} disabled={generatingBulk}>
                    {generatingBulk
                      ? <><CSpinner size="sm" className="me-1" />Génération…</>
                      : <><CIcon icon={cilCloudDownload} className="me-1" />
                          Générer {selectedIds.length} document{selectedIds.length > 1 ? 's' : ''}</>}
                  </CButton>
                )}
              </div>
            )}

            {/* Filtres */}
            <AttestationFilters
              filterOptions={{
                years: academicYears,
                filieres: departments,
                cohorts: showCohortFilter ? cohorts : [],
              }}
              selectedYear={selectedYear}
              selectedFiliere={selectedFiliere}
              selectedCohort={selectedCohort}
              searchQuery={searchQuery}
              onFilterChange={handleFilterChange}
              onSearchChange={e => setSearchQuery(e.target.value)}
              showSearch
            />

            {/* Tableau */}
            {loading ? (
              <div className="text-center py-5">
                <CSpinner color="primary" />
                <div className="text-muted small mt-2">Chargement…</div>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', background: '#f3f4f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 12px',
                }}>
                  <CIcon icon={cilInbox} style={{ width: 28, height: 28, color: '#9ca3af' }} />
                </div>
                <div className="fw-semibold">
                  {emptyMessage ?? `Aucun étudiant éligible`}
                </div>
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
                      <CFormCheck
                        checked={allSelected}
                        onChange={toggleAll}
                      />
                    </CTableHeaderCell>
                    <CTableHeaderCell>Matricule</CTableHeaderCell>
                    <CTableHeaderCell>Nom</CTableHeaderCell>
                    <CTableHeaderCell>Prénoms</CTableHeaderCell>
                    <CTableHeaderCell>Filière</CTableHeaderCell>
                    <CTableHeaderCell>Niveau</CTableHeaderCell>
                    {extraColumns.map(c => (
                      <CTableHeaderCell key={c.key}>{c.header}</CTableHeaderCell>
                    ))}
                    <CTableHeaderCell style={{ width: 100, textAlign: 'right' }}>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {paginatedStudents.map(student => (
                    <CTableRow key={student.id} style={{ verticalAlign: 'middle' }}>
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
                      <CTableDataCell>
                        <span className="text-muted">{student.department || '—'}</span>
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color="info" shape="rounded-pill" style={{ fontSize: '0.72rem' }}>
                          {student.study_level || '—'}
                        </CBadge>
                      </CTableDataCell>
                      {extraColumns.map(c => (
                        <CTableDataCell key={c.key}>{c.render(student)}</CTableDataCell>
                      ))}
                      <CTableDataCell style={{ textAlign: 'right' }}>
                        {/* Aperçu */}
                        <CButton
                          color="light"
                          size="sm"
                          className="border me-1"
                          title="Aperçu PDF"
                          onClick={() => handlePreview(student)}
                        >
                          <CIcon icon={cilSearch} />
                        </CButton>
                        {/* Télécharger */}
                        <CButton
                          color="success"
                          size="sm"
                          title="Télécharger"
                          onClick={() => handleGenerate(student.student_pending_student_id)}
                          disabled={generating === student.student_pending_student_id}
                        >
                          {generating === student.student_pending_student_id
                            ? <CSpinner size="sm" />
                            : <CIcon icon={cilCloudDownload} />}
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            )}

            {/* Pagination */}
            {students.length > 10 && (
              <CPagination align="center" className="mt-3" size="sm">
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

      {/* Modal aperçu */}
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

export default AttestationView
