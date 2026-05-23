import { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CBadge,
  CFormInput,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CSpinner,
  CFormLabel,
  CAlert,
} from '@coreui/react'
import { cilCheckCircle, cilTrash, cilCheckAlt, cilInfo, cilCloudDownload, cilCalendar } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import CahierService from '@/services/cahier.service'
import { TextbookEntryStatus } from '@/types/cahier-texte.types'
import type { TextbookEntry } from '@/types/cahier-texte.types'
import HttpService from '@/services/http.service.ts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AcademicYear {
  id: number
  academic_year: string
  name?: string
  libelle: string
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TextbookList = () => {
  // List state
  const [entries, setEntries] = useState<TextbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Detail modal
  const [detailModal, setDetailModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<TextbookEntry | null>(null)

  // ── Download modal ─────────────────────────────────────────────────────────
  const [downloadModal, setDownloadModal] = useState(false)
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  // Sélections du modal
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [academicYearsLoading, setAcademicYearsLoading] = useState(false)
  const [selectedAcademicYearId, setSelectedAcademicYearId] = useState<string>('')
  const [selectedRegroupement, setSelectedRegroupement] = useState<string>('1')

  // ── Chargement des entrées ─────────────────────────────────────────────────
  useEffect(() => {
    loadEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search, statusFilter])

  const loadEntries = async () => {
    try {
      setLoading(true)
      const { data, meta } = await CahierService.getEntries({
        page: currentPage,
        per_page: 15,
        search: search || undefined,
        status: statusFilter || undefined,
      })
      setEntries(data)
      setTotalPages(meta.last_page)
    } catch (error) {
      console.error('Erreur chargement entrées:', error)
    } finally {
      setLoading(false)
    }
  }

  // ── Chargement des années académiques quand le modal s'ouvre ───────────────
  const openDownloadModal = async () => {
    setDownloadModal(true)
    setDownloadError('')
    setSelectedRegroupement('1')

    if (academicYears.length > 0) return

    try {
      setAcademicYearsLoading(true)
      const response = await HttpService.get<{ success: boolean; data: AcademicYear[] }>(
        'inscription/academic-years'
      )
      const years: AcademicYear[] = response.data ?? []
      setAcademicYears(years)
      if (years.length > 0) {
        setSelectedAcademicYearId(String(years[0].id))
      }
    } catch (err) {
      console.error('Erreur chargement années académiques:', err)
      setDownloadError('Impossible de charger les années académiques.')
    } finally {
      setAcademicYearsLoading(false)
    }
  }

  const closeDownloadModal = () => {
    setDownloadModal(false)
    setDownloadError('')
  }

  // ── Génération et téléchargement du fichier Excel ──────────────────────────
  const handleDownloadExcel = async () => {
    if (!selectedAcademicYearId) {
      setDownloadError('Veuillez sélectionner une année académique.')
      return
    }

    setDownloadError('')
    setDownloadLoading(true)

    try {
      const params = new URLSearchParams({
        academic_year_id: selectedAcademicYearId,
        regroupement: selectedRegroupement,
      })

      // Utilisation de fetch directement pour un meilleur contrôle sur les blobs
      const token = localStorage.getItem('token')
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001'
      
      const response = await fetch(
        `${apiUrl}/api/cahier-texte/export/payment-excel?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
        }
      )

      if (!response.ok) {
        let errorMessage = 'Erreur lors de la génération du fichier.'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          // Si le corps n'est pas du JSON, garder le message par défaut
        }
        setDownloadError(errorMessage)
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      const selectedYear = academicYears.find((y) => String(y.id) === selectedAcademicYearId)
      const yearLabel = selectedYear?.academic_year ?? selectedYear?.libelle ?? selectedAcademicYearId
      const reg = selectedRegroupement === '1' ? '1er' : '2eme'

      const a = document.createElement('a')
      a.href = url
      a.download = `etat_paiement_vacation_${reg}_regroupement_${yearLabel}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      closeDownloadModal()
    } catch (err: any) {
      console.error('Erreur génération Excel:', err)
      setDownloadError(err.message || 'Une erreur est survenue lors de la génération. Veuillez réessayer.')
    } finally {
      setDownloadLoading(false)
    }
  }

  // ─── Statuts ──────────────────────────────────────────────────────────────

  const getStatusBadge = (status: TextbookEntryStatus) => {
    const badges: Record<TextbookEntryStatus, { color: string; text: string }> = {
      [TextbookEntryStatus.DRAFT]:     { color: 'warning', text: 'Brouillon' },
      [TextbookEntryStatus.PUBLISHED]: { color: 'info',    text: 'Signé' },
      [TextbookEntryStatus.VALIDATED]: { color: 'success', text: 'Validé' },
    }
    const badge = badges[status] ?? badges[TextbookEntryStatus.DRAFT]
    return <CBadge color={badge.color}>{badge.text}</CBadge>
  }

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
      try {
        await CahierService.deleteEntry(id)
        loadEntries()
      } catch (error) {
        console.error('Erreur suppression:', error)
      }
    }
  }

  const handlePublish = async (id: number) => {
    try {
      await CahierService.publishEntry(id)
      loadEntries()
    } catch (error) {
      console.error('Erreur publication:', error)
    }
  }

  const handleValidate = async (id: number) => {
    if (window.confirm('Confirmer la validation de cette entrée ?')) {
      try {
        await CahierService.validateEntry(id)
        loadEntries()
      } catch (error) {
        console.error('Erreur validation:', error)
      }
    }
  }

  const openDetail = (entry: TextbookEntry) => {
    setSelectedEntry(entry)
    setDetailModal(true)
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <strong>Liste des entrées du cahier de texte</strong>
              <CButton
                color="primary"
                size="sm"
                onClick={openDownloadModal}
                className="d-flex align-items-center gap-2"
              >
                <CIcon icon={cilCloudDownload} />
                Télécharger état de paiement
              </CButton>
            </CCardHeader>

            <CCardBody>
              {/* ── Filters ──────────────────────────────────────────────── */}
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormInput
                    type="text"
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
                  >
                    <option value="">Tous les statuts</option>
                    <option value="published">Signé</option>
                    <option value="validated">Validé</option>
                    <option value="draft">Brouillon</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              {/* ── Table ────────────────────────────────────────────────── */}
              {loading ? (
                <div className="text-center py-4"><CSpinner /></div>
              ) : entries.length === 0 ? (
                <div className="text-center text-muted py-4">Aucune entrée trouvée.</div>
              ) : (
                <>
                  <CTable hover responsive>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Date</CTableHeaderCell>
                        <CTableHeaderCell>Titre</CTableHeaderCell>
                        <CTableHeaderCell>Cours (ECUE)</CTableHeaderCell>
                        <CTableHeaderCell>Classe</CTableHeaderCell>
                        <CTableHeaderCell>Heures</CTableHeaderCell>
                        <CTableHeaderCell>Statut</CTableHeaderCell>
                        <CTableHeaderCell>Actions</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {entries.map((entry) => (
                        <CTableRow key={entry.id}>
                          <CTableDataCell>{entry.session_date}</CTableDataCell>
                          <CTableDataCell>{entry.session_title}</CTableDataCell>
                          <CTableDataCell>{entry.course_element?.name ?? '—'}</CTableDataCell>
                          <CTableDataCell>{entry.class_group?.group_name ?? '—'}</CTableDataCell>
                          <CTableDataCell>{entry.hours_taught}h</CTableDataCell>
                          <CTableDataCell>{getStatusBadge(entry.status)}</CTableDataCell>
                          <CTableDataCell>
                            <CButton
                              color="secondary"
                              variant="outline"
                              size="sm"
                              className="me-1"
                              title="Voir le détail"
                              onClick={() => openDetail(entry)}
                            >
                              <CIcon icon={cilInfo} />
                            </CButton>

                            {entry.status === TextbookEntryStatus.PUBLISHED && (
                              <CButton
                                color="success"
                                size="sm"
                                className="me-1"
                                title="Valider"
                                onClick={() => handleValidate(entry.id)}
                              >
                                <CIcon icon={cilCheckCircle} />
                              </CButton>
                            )}

                            {entry.status === TextbookEntryStatus.DRAFT && (
                              <CButton
                                color="info"
                                size="sm"
                                className="me-1"
                                title="Signer / Publier"
                                onClick={() => handlePublish(entry.id)}
                              >
                                <CIcon icon={cilCheckAlt} />
                              </CButton>
                            )}

                            {entry.status === TextbookEntryStatus.DRAFT && (
                              <CButton
                                color="danger"
                                size="sm"
                                title="Supprimer"
                                onClick={() => handleDelete(entry.id)}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            )}
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>

                  {totalPages > 1 && (
                    <CPagination className="justify-content-center">
                      <CPaginationItem
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        Précédent
                      </CPaginationItem>
                      {[...Array(totalPages)].map((_, i) => (
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
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        Suivant
                      </CPaginationItem>
                    </CPagination>
                  )}
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL — Détail d'une entrée
      ════════════════════════════════════════════════════════════════════ */}
      <CModal
        visible={detailModal}
        onClose={() => setDetailModal(false)}
        size="lg"
        scrollable
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>
            Détail de l'entrée —{' '}
            <span className="text-muted fw-normal">
              {selectedEntry?.session_date}
            </span>
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedEntry && (
            <div className="row g-3">
              <div className="col-12">
                <div
                  className="p-3 rounded"
                  style={{ background: 'var(--cui-tertiary-bg, #f8f9fa)', borderLeft: '4px solid var(--cui-primary)' }}
                >
                  <h6 className="mb-1 fw-bold">{selectedEntry.session_title}</h6>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {getStatusBadge(selectedEntry.status)}
                    <CBadge color="light" textColor="dark">
                      <CIcon icon={cilCalendar} className="me-1" size="sm" />
                      {selectedEntry.session_date}
                    </CBadge>
                    {selectedEntry.start_time && selectedEntry.end_time && (
                      <CBadge color="light" textColor="dark">
                        {selectedEntry.start_time} — {selectedEntry.end_time}
                      </CBadge>
                    )}
                    <CBadge color="primary">{selectedEntry.hours_taught}h dispensées</CBadge>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <DetailField label="Cours (ECUE)" value={selectedEntry.course_element?.name} />
              </div>
              <div className="col-md-6">
                <DetailField label="Classe / Groupe" value={selectedEntry.class_group?.group_name} />
              </div>

              {selectedEntry.professor && (
                <>
                  <div className="col-md-6">
                    <DetailField
                      label="Enseignant"
                      value={selectedEntry.professor.full_name ?? `${selectedEntry.professor.first_name} ${selectedEntry.professor.last_name}`}
                    />
                  </div>
                  <div className="col-md-6">
                    <DetailField label="Email" value={selectedEntry.professor.email} />
                  </div>
                </>
              )}

              <div className="col-12">
                <DetailField label="Contenu dispensé" value={selectedEntry.content_covered} multiline />
              </div>

              {selectedEntry.objectives && (
                <div className="col-12">
                  <DetailField label="Objectifs" value={selectedEntry.objectives} multiline />
                </div>
              )}

              {selectedEntry.teaching_methods && (
                <div className="col-md-6">
                  <DetailField label="Méthodes pédagogiques" value={selectedEntry.teaching_methods} />
                </div>
              )}

              {(selectedEntry.students_present !== undefined || selectedEntry.students_absent !== undefined) && (
                <>
                  <div className="col-md-3">
                    <DetailField label="Étudiants présents" value={selectedEntry.students_present?.toString()} />
                  </div>
                  <div className="col-md-3">
                    <DetailField label="Étudiants absents" value={selectedEntry.students_absent?.toString()} />
                  </div>
                </>
              )}

              {selectedEntry.homework && (
                <div className="col-md-8">
                  <DetailField label="Devoir / Exercice" value={selectedEntry.homework} multiline />
                </div>
              )}
              {selectedEntry.homework_due_date && (
                <div className="col-md-4">
                  <DetailField label="Date de rendu" value={selectedEntry.homework_due_date} />
                </div>
              )}

              {selectedEntry.observations && (
                <div className="col-12">
                  <DetailField label="Observations" value={selectedEntry.observations} multiline />
                </div>
              )}

              {selectedEntry.status === TextbookEntryStatus.VALIDATED && selectedEntry.validated_at && (
                <div className="col-12">
                  <div
                    className="p-2 rounded d-flex align-items-center gap-2"
                    style={{ background: '#d1fae5', color: '#065f46', fontSize: '0.85rem' }}
                  >
                    <CIcon icon={cilCheckCircle} />
                    <span>
                      Validé le <strong>{selectedEntry.validated_at}</strong>
                      {selectedEntry.validated_by && ` par ${selectedEntry.validated_by}`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDetailModal(false)}>
            Fermer
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL — Télécharger l'état de paiement (Excel)
      ════════════════════════════════════════════════════════════════════ */}
      <CModal
        visible={downloadModal}
        onClose={closeDownloadModal}
        size="md"
        alignment="center"
      >
        <CModalHeader style={{ borderBottom: '2px solid var(--cui-primary)' }}>
          <CModalTitle className="d-flex align-items-center gap-2">
            <CIcon icon={cilCloudDownload} />
            Télécharger l'état de paiement
          </CModalTitle>
        </CModalHeader>

        <CModalBody>
          {/* ── Erreur ── */}
          {downloadError && (
            <CAlert color="danger" className="py-2">
              {downloadError}
            </CAlert>
          )}

          {/* ── Chargement des années ── */}
          {academicYearsLoading ? (
            <div className="text-center py-3">
              <CSpinner size="sm" className="me-2" />
              Chargement des années académiques…
            </div>
          ) : (
            <div className="d-flex flex-column gap-3 py-1">
              {/* Année académique */}
              <div>
                <CFormLabel className="fw-semibold mb-1">
                  Année académique <span className="text-danger">*</span>
                </CFormLabel>
                <CFormSelect
                  value={selectedAcademicYearId}
                  onChange={(e) => setSelectedAcademicYearId(e.target.value)}
                  disabled={downloadLoading}
                >
                  <option value="">— Sélectionner une année —</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={String(year.id)}>
                      {year.academic_year ?? year.libelle}
                    </option>
                  ))}
                </CFormSelect>
              </div>

              {/* Regroupement */}
              <div>
                <CFormLabel className="fw-semibold mb-1">
                  Regroupement <span className="text-danger">*</span>
                </CFormLabel>
                <CFormSelect
                  value={selectedRegroupement}
                  onChange={(e) => setSelectedRegroupement(e.target.value)}
                  disabled={downloadLoading}
                >
                  <option value="1">1er Regroupement</option>
                  <option value="2">2ème Regroupement</option>
                </CFormSelect>
              </div>

              {/* Info */}
              <div
                className="p-2 rounded"
                style={{ background: '#eff6ff', color: '#1e40af', fontSize: '0.82rem' }}
              >
                Le fichier Excel sera généré selon le template officiel du CAP (UAC / EPAC)
                et contiendra toutes les heures effectuées et validées pour le regroupement
                sélectionné.
              </div>
            </div>
          )}
        </CModalBody>

        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={closeDownloadModal}
            disabled={downloadLoading}
          >
            Annuler
          </CButton>
          <CButton
            color="primary"
            onClick={handleDownloadExcel}
            disabled={downloadLoading || academicYearsLoading || !selectedAcademicYearId}
            className="d-flex align-items-center gap-2"
          >
            {downloadLoading ? (
              <>
                <CSpinner size="sm" />
                Génération…
              </>
            ) : (
              <>
                <CIcon icon={cilCloudDownload} />
                Générer &amp; Télécharger
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

// ─── Helper sub-component ─────────────────────────────────────────────────────

interface DetailFieldProps {
  label: string
  value?: string | null
  multiline?: boolean
}

const DetailField = ({ label, value, multiline }: DetailFieldProps) => {
  if (!value && value !== 0) return null
  return (
    <div>
      <div
        style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--cui-secondary-color, #6c757d)',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '0.9rem',
          color: 'var(--cui-body-color)',
          whiteSpace: multiline ? 'pre-wrap' : 'normal',
          lineHeight: '1.5',
        }}
      >
        {value}
      </div>
    </div>
  )
}

export default TextbookList