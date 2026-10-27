import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableHead,
  CTableBody,
  CTableHeaderCell,
  CTableDataCell,
  CTableRow,
  CButton,
  CForm,
  CFormInput,
  CFormSelect,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CSpinner,
  CAlert,
  CPagination,
  CPaginationItem,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilLink, cilInfo } from '@coreui/icons'
import InscriptionService from '@/services/inscription.service'
import { AcademicYear } from '@/types/inscription.types'

interface Candidate {
  id: number
  tracking_code: string
  status: string
  level?: string
  department_id?: number
  academic_year_id?: number
  student_pending_student_id: number
  student_id?: number
  matricule?: string | null
  nomPrenoms: string
  last_name: string
  first_names: string
  email: string
  telephone?: string
  gender?: string
  birth_date?: string
  filiere: string
  dept_abbreviation?: string
  cycle_id?: number
  annee: string
}

const LegacyPrepaLink: React.FC = () => {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [selectedYear, setSelectedYear] = useState<number | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [linkData, setLinkData] = useState({
    academic_year_id: '',
    study_level: 'Prépa',
    year_decision: 'pass',
    deliberation_date: '',
    financial_status: 'Non exonéré',
    cohort: '',
  })
  const [linking, setLinking] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchAcademicYears = async () => {
    try {
      const data = await InscriptionService.academicYears()
      setAcademicYears(data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchCandidates = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: any = { page: currentPage }
      if (search) params.search = search
      if (selectedYear) params.academic_year_id = selectedYear
      const res = await InscriptionService.getLegacyPrepaCandidates(params)
      setCandidates(res.data || [])
      setTotalPages(res.last_page || 1)
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAcademicYears()
  }, [])

  useEffect(() => {
    fetchCandidates()
  }, [currentPage, search, selectedYear])

  const openLinkModal = (c: Candidate) => {
    setSelectedCandidate(c)
    setLinkData({
      academic_year_id: '',
      study_level: 'Prépa',
      year_decision: 'pass',
      deliberation_date: '',
      financial_status: 'Non exonéré',
      cohort: '',
    })
    setSuccess(null)
    setError(null)
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelectedCandidate(null)
  }

  const handleLink = async () => {
    if (!selectedCandidate || !linkData.academic_year_id) {
      setError("L'année académique historique est requise")
      return
    }
    setLinking(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await InscriptionService.linkLegacyPrepa(selectedCandidate.id, {
        ...linkData,
        academic_year_id: Number(linkData.academic_year_id),
      })
      const matricule =
        res?.student?.student_id_number ?? res?.data?.student?.student_id_number
      setSuccess(
        matricule
          ? `Historique Prépa rattaché avec succès. Matricule de l'étudiant : ${matricule}. Il est désormais éligible à l'inscription Spécialité.`
          : "Historique Prépa rattaché avec succès. L'étudiant est désormais éligible à l'inscription Spécialité.",
      )
      closeModal()
      fetchCandidates()
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors du rattachement')
    } finally {
      setLinking(false)
    }
  }

  return (
    <>
      <CCard>
        <CCardHeader>
          <strong>Rattachement Prépa (anciens étudiants)</strong>
          <small className="ms-2 text-muted">
            Permet de rattacher l'historique de Prépa validée (avant 2023) pour rendre l'étudiant éligible à l'inscription en Spécialité
          </small>
        </CCardHeader>
        <CCardBody>
          {success && <CAlert color="success" dismissible onClose={() => setSuccess(null)}>{success}</CAlert>}
          {error && <CAlert color="danger" dismissible onClose={() => setError(null)}>{error}</CAlert>}

          <CRow className="mb-3">
            <CCol md={4}>
              <CForm className="d-flex">
                <CFormInput
                  placeholder="Rechercher (Nom, matricule, email, code tracking)"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                />
                <CButton color="primary" className="ms-2">
                  <CIcon icon={cilSearch} />
                </CButton>
              </CForm>
            </CCol>
            <CCol md={4}>
              <CFormSelect
                value={selectedYear}
                onChange={(e) => { setSelectedYear(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1) }}
              >
                <option value="">Toutes les années académiques (actuelles)</option>
                {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>{ay.libelle}</option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>

          {loading ? (
            <div className="text-center py-5"><CSpinner color="primary" /></div>
          ) : (
            <>
              <CTable striped hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Matricule</CTableHeaderCell>
                    <CTableHeaderCell>Nom & Prénoms</CTableHeaderCell>
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>Téléphone</CTableHeaderCell>
                    <CTableHeaderCell>Filière (Prépa)</CTableHeaderCell>
                    <CTableHeaderCell>Année</CTableHeaderCell>
                    <CTableHeaderCell>Statut</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {candidates.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={8} className="text-center">Aucun candidat Prépa trouvé</CTableDataCell>
                    </CTableRow>
                  ) : (
                    candidates.map((c) => (
                      <CTableRow key={c.id}>
                        <CTableDataCell>{c.matricule || '-'}</CTableDataCell>
                        <CTableDataCell>{c.nomPrenoms}</CTableDataCell>
                        <CTableDataCell>{c.email}</CTableDataCell>
                        <CTableDataCell>{c.telephone || '-'}</CTableDataCell>
                        <CTableDataCell>{c.filiere}</CTableDataCell>
                        <CTableDataCell>{c.annee}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={c.status === 'approved' ? 'success' : c.status === 'rejected' ? 'danger' : 'warning'}>
                            {c.status}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CButton color="primary" size="sm" onClick={() => openLinkModal(c)}>
                            <CIcon icon={cilLink} className="me-1" /> Rattacher historique Prépa
                          </CButton>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>

              {totalPages > 1 && (
                <CPagination className="justify-content-end mt-3">
                  <CPaginationItem disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p-1))}>&lt;</CPaginationItem>
                  {Array.from({length: totalPages}, (_, i) => i+1).slice(Math.max(0,currentPage-3), Math.min(totalPages,currentPage+2)).map(p => (
                    <CPaginationItem key={p} active={p===currentPage} onClick={() => setCurrentPage(p)}>{p}</CPaginationItem>
                  ))}
                  <CPaginationItem disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))}>&gt;</CPaginationItem>
                </CPagination>
              )}
            </>
          )}
        </CCardBody>
      </CCard>

      <CModal visible={modalOpen} onClose={closeModal} size="lg">
        <CModalHeader>
          <CModalTitle>Rattachement historique Prépa</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedCandidate && (
            <>
              <CAlert color="info">
                <CIcon icon={cilInfo} className="me-2" />
                Étudiant : <strong>{selectedCandidate.nomPrenoms}</strong> - Filière Prépa courante : <strong>{selectedCandidate.filiere}</strong>
              </CAlert>

              <CRow className="mb-3">
                <CCol md={6}>
                  <label className="form-label">Année académique où il a fait sa Prépa <span className="text-danger">*</span></label>
                  <CFormSelect
                    value={linkData.academic_year_id}
                    onChange={(e) => setLinkData({...linkData, academic_year_id: e.target.value})}
                  >
                    <option value="">Sélectionner</option>
                    {academicYears.map((ay) => (
                  <option key={ay.id} value={ay.id}>{ay.libelle}</option>
                    ))}
                  </CFormSelect>
                  <small className="text-muted">Doit exister dans les années académiques</small>
                </CCol>
                <CCol md={6}>
                  <label className="form-label">Niveau d'étude</label>
                  <CFormInput value={linkData.study_level} onChange={(e) => setLinkData({...linkData, study_level: e.target.value})} />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <label className="form-label">Décision d'année</label>
                  <CFormSelect value={linkData.year_decision} onChange={(e) => setLinkData({...linkData, year_decision: e.target.value})}>
                    <option value="pass">Admis (pass)</option>
                    <option value="fail">Échec (fail)</option>
                    <option value="repeat">Redoublement (repeat)</option>
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <label className="form-label">Date de délibération</label>
                  <CFormInput type="date" value={linkData.deliberation_date} onChange={(e) => setLinkData({...linkData, deliberation_date: e.target.value})} />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <label className="form-label">Statut financier</label>
                  <CFormSelect value={linkData.financial_status} onChange={(e) => setLinkData({...linkData, financial_status: e.target.value})}>
                    <option value="Non exonéré">Non exonéré</option>
                    <option value="Exonéré">Exonéré</option>
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <label className="form-label">Cohorte</label>
                  <CFormInput value={linkData.cohort} onChange={(e) => setLinkData({...linkData, cohort: e.target.value})} />
                </CCol>
              </CRow>

              <CAlert color="warning">
                Cette action créera/créera le lien nécessaire (Student + StudentPendingStudent si manquant) et ajoutera un <strong>AcademicPath</strong> pour l'année historique Prépa validée. 
                L'étudiant sera <strong>éligible</strong> à l'inscription en <strong>Spécialité Ingénieur</strong> après ce rattachement.
              </CAlert>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={closeModal} disabled={linking}>Annuler</CButton>
          <CButton color="primary" onClick={handleLink} disabled={linking}>
            {linking ? <><CSpinner size="sm" className="me-2" /> Rattachement...</> : 'Rattacher l\'historique Prépa'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default LegacyPrepaLink
