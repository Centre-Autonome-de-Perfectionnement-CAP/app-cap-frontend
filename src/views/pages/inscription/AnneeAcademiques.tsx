import { useState } from 'react'
import type { Period } from '../../../types/inscription.types'
import {
  CButton,
  CCard,
  CCardHeader,
  CCardBody,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CRow,
  CCol,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CBadge,
  CListGroup,
  CListGroupItem,
  CAlert,
  CFormCheck,
} from '@coreui/react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import useAnneeAcademiquesData from '../../../hooks/inscription/useAnneeAcademiqueData.ts'
import Swal from 'sweetalert2'
import { isBeforeToday, isStartBeforeEnd, addMonths, parseFrenchDate } from '../../../utils/date.utils'
import { LoadingSpinner } from '../../../components'

const AnneeAcademiques = () => {
  const { academicYears, filieres, loading, error, createAcademicYear, addPeriod, getPeriods } =
    useAnneeAcademiquesData()

  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [addPeriodModalVisible, setAddPeriodModalVisible] = useState(false)
  const [periodsModalVisible, setPeriodsModalVisible] = useState(false)
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null)
  const [selectedYear, setSelectedYear] = useState<any>(null)
  const [newYearStart, setNewYearStart] = useState<Date | null>(null)
  const [newYearEnd, setNewYearEnd] = useState<Date | null>(null)
  const [submissionStart, setSubmissionStart] = useState<Date | null>(null)
  const [submissionEnd, setSubmissionEnd] = useState<Date | null>(null)
  const [activeTab, setActiveTab] = useState('depot')
  const [periodStartDate, setPeriodStartDate] = useState<Date | null>(null)
  const [periodStartTime, setPeriodStartTime] = useState<Date | null>(null)
  const [periodEndDate, setPeriodEndDate] = useState<Date | null>(null)
  const [periodEndTime, setPeriodEndTime] = useState<Date | null>(null)
  const [selectedFilieres, setSelectedFilieres] = useState<number[]>([])
  const [periods, setPeriods] = useState<Period[]>([])
  const [includeSubmissionPeriod, setIncludeSubmissionPeriod] = useState(false)

  const handleCreateYear = async () => {
    // Validation de base pour l'année académique
    if (!newYearStart || !newYearEnd) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Veuillez remplir les dates de début et de fin de l\'année académique.',
      })
      return
    }

    if (isBeforeToday(newYearStart)) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: "La date de début d'une année académique ne peut pas être antérieure à la date actuelle.",
      })
      return
    }

    if (!isStartBeforeEnd(newYearStart, newYearEnd)) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'La date de début doit être antérieure à la date de fin.',
      })
      return
    }

    // Vérifier que la date de fin est au moins 1 mois après la date de début
    const oneMonthAfterStart = new Date(newYearStart)
    oneMonthAfterStart.setMonth(oneMonthAfterStart.getMonth() + 1)
    if (newYearEnd < oneMonthAfterStart) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'La date de fin doit être au moins 1 mois après la date de début.',
      })
      return
    }

    // Validation de la période de soumission si elle est incluse
    if (includeSubmissionPeriod) {
      if (!submissionStart || !submissionEnd) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation',
          text: 'Veuillez remplir les dates de soumission ou décocher l\'option.',
        })
        return
      }

      if (!isStartBeforeEnd(submissionStart, submissionEnd)) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation',
          text: 'La date de début de soumission doit être antérieure à la date de fin de soumission.',
        })
        return
      }
    }

    const result = await createAcademicYear(
      newYearStart, 
      newYearEnd, 
      includeSubmissionPeriod ? submissionStart : null, 
      includeSubmissionPeriod ? submissionEnd : null
    )
    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Année académique créée avec succès.',
      })
      setCreateModalVisible(false)
      setNewYearStart(null)
      setNewYearEnd(null)
      setSubmissionStart(null)
      setSubmissionEnd(null)
      setIncludeSubmissionPeriod(false)
    } else {
      const errorMessage = !result.success && result.error
        ? typeof result.error === 'string' ? result.error : result.error?.message
        : "Échec de la création de l'année académique."
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage,
      })
    }
  }

  const handleAddPeriod = async () => {
    if (
      !periodStartDate ||
      !periodEndDate ||
      !periodStartTime ||
      !periodEndTime ||
      selectedFilieres.length === 0
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'Veuillez remplir tous les champs et sélectionner au moins une filière.',
      })
      return
    }

    if (isBeforeToday(periodStartDate)) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'La date de début de la période ne peut pas être antérieure à la date actuelle.',
      })
      return
    }

    if (!isStartBeforeEnd(periodStartDate, periodEndDate)) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation',
        text: 'La date de début doit être antérieure à la date de fin.',
      })
      return
    }

    // Valider que les dates sont dans la plage de l'année académique
    if (selectedYear) {
      const yearStart = parseFrenchDate(selectedYear.date_debut)
      const yearEnd = parseFrenchDate(selectedYear.date_fin)
      
      if (yearStart && periodStartDate < yearStart) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation',
          text: `La date de début doit être après le début de l'année académique (${selectedYear.date_debut}).`,
        })
        return
      }
      
      if (yearEnd && periodEndDate > yearEnd) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation',
          text: `La date de fin doit être avant la fin de l'année académique (${selectedYear.date_fin}).`,
        })
        return
      }
    }

    const result = await addPeriod(
      selectedYearId,
      activeTab,
      periodStartDate,
      periodStartTime,
      periodEndDate,
      periodEndTime,
      selectedFilieres,
    )

    if (result.success) {
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Période ajoutée avec succès.',
      })
      setAddPeriodModalVisible(false)
      setPeriodStartDate(null)
      setPeriodStartTime(null)
      setPeriodEndDate(null)
      setPeriodEndTime(null)
      setSelectedFilieres(filieres.map((f: any) => f.id || f))
    } else {
      let errorMessage = "Échec de l'ajout de la période."
      
      // Gérer les erreurs de validation du backend
      if (result.error) {
        if (typeof result.error === 'string') {
          errorMessage = result.error
        } else if (result.error.message) {
          errorMessage = result.error.message
        } else if (result.error.errors) {
          // Afficher les erreurs de validation détaillées
          const validationErrors = Object.values(result.error.errors).flat().join('\n')
          errorMessage = validationErrors || result.error.message || errorMessage
        }
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Erreur de validation',
        text: errorMessage,
      })
    }
  }

  const handleShowPeriods = async (yearId: any) => {
    const periodsData = await getPeriods(yearId)
    setPeriods(periodsData)
    setPeriodsModalVisible(true)
  }

  const handleFiliereChange = (filiereId: number) => {
    setSelectedFilieres((prev) =>
      prev.includes(filiereId) ? prev.filter((f) => f !== filiereId) : [...prev, filiereId],
    )
  }

  const openAddPeriodModal = (yearId: any) => {
    const year = academicYears.find((y: any) => y.id === yearId)
    setSelectedYearId(yearId)
    setSelectedYear(year)
    setAddPeriodModalVisible(true)
    // Sélectionner tous les IDs de filières par défaut
    setSelectedFilieres(filieres.map((f: any) => f.id || f))
  }

  if (loading) {
    return <LoadingSpinner message="Chargement des années académiques..." />
  }

  return (
    <CCard className="mb-4 shadow-sm">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <span className="fw-bold">Années Académiques</span>
        <CButton color="outline-primary" size="sm" onClick={() => setCreateModalVisible(true)}>
          Créer une année académique
        </CButton>
      </CCardHeader>
      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <CTable align="middle" responsive bordered>
          <CTableHead className="text-nowrap table-light">
            <CTableRow>
              <CTableHeaderCell className="text-center">Année Académique</CTableHeaderCell>
              <CTableHeaderCell className="text-center">Début</CTableHeaderCell>
              <CTableHeaderCell className="text-center">Fin</CTableHeaderCell>
              <CTableHeaderCell className="text-center">Ajouter une période</CTableHeaderCell>
              <CTableHeaderCell className="text-center">Périodes</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {academicYears.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={5} className="text-center text-muted py-3">
                  Aucune année académique trouvée.
                </CTableDataCell>
              </CTableRow>
            ) : (
              academicYears.map((year: any) => (
                <CTableRow key={year.id}>
                  <CTableDataCell className="text-center">{year.libelle}</CTableDataCell>
                  <CTableDataCell className="text-center">{year.date_debut}</CTableDataCell>
                  <CTableDataCell className="text-center">{year.date_fin}</CTableDataCell>
                  <CTableDataCell className="text-center">
                    <CButton
                      color="outline-success"
                      size="sm"
                      onClick={() => openAddPeriodModal(year.id)}
                    >
                      Ajouter
                    </CButton>
                  </CTableDataCell>
                  <CTableDataCell className="text-center">
                    <CButton
                      color="outline-secondary"
                      size="sm"
                      onClick={() => handleShowPeriods(year.id)}
                    >
                      Voir
                    </CButton>
                  </CTableDataCell>
                </CTableRow>
              ))
            )}
          </CTableBody>
        </CTable>
      </CCardBody>

      {/* Modale Créer année */}
      <CModal 
        visible={createModalVisible} 
        onClose={() => {
          setCreateModalVisible(false)
          setIncludeSubmissionPeriod(false)
        }}
      >
        <CModalHeader>
          <CModalTitle>Créer une année académique</CModalTitle>
        </CModalHeader>
        <CModalBody className="p-4">
          <CForm>
            <CRow className="mb-3">
              <CCol md="3" className="d-flex align-items-center">
                <label className="form-label mb-0">Date de début</label>
              </CCol>
              <CCol md="9">
                <DatePicker
                  selected={newYearStart}
                  onChange={(date: any) => setNewYearStart(date)}
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                  placeholderText="Choisir la date de début (jj/mm/aaaa)"
                  minDate={new Date()}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md="3" className="d-flex align-items-center">
                <label className="form-label mb-0">Date de fin</label>
              </CCol>
              <CCol md="9">
                <DatePicker
                  selected={newYearEnd}
                  onChange={(date: any) => setNewYearEnd(date)}
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                  placeholderText="Choisir la date de fin (jj/mm/aaaa)"
                  minDate={newYearStart ? addMonths(1) : addMonths(6)}
                />
              </CCol>
            </CRow>
            <hr className="my-4" />
            <CFormCheck
              id="includeSubmissionPeriod"
              label="Ajouter une période de soumission des dossiers"
              checked={includeSubmissionPeriod}
              onChange={(e) => setIncludeSubmissionPeriod(e.target.checked)}
              className="mb-3"
            />
            {includeSubmissionPeriod && (
              <>
            <h6 className="mb-3 text-muted">Période de soumission des dossiers</h6>
            <CRow className="mb-3">
              <CCol md="3" className="d-flex align-items-center">
                <label className="form-label mb-0">Début soumission</label>
              </CCol>
              <CCol md="9">
                <DatePicker
                  selected={submissionStart}
                  onChange={(date: any) => setSubmissionStart(date)}
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                  placeholderText="Date de début de soumission (jj/mm/aaaa)"
                  minDate={new Date()}
                />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md="3" className="d-flex align-items-center">
                <label className="form-label mb-0">Fin soumission</label>
              </CCol>
              <CCol md="9">
                <DatePicker
                  selected={submissionEnd}
                  onChange={(date: any) => setSubmissionEnd(date)}
                  dateFormat="dd/MM/yyyy"
                  className="form-control"
                  placeholderText="Date de fin de soumission (jj/mm/aaaa)"
                  minDate={submissionStart || new Date()}
                />
              </CCol>
            </CRow>
              </>
            )}
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="outline-secondary" onClick={() => setCreateModalVisible(false)}>
            Annuler
          </CButton>
          <CButton color="outline-primary" onClick={handleCreateYear}>
            Créer
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal
        visible={addPeriodModalVisible}
        onClose={() => setAddPeriodModalVisible(false)}
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Ajouter une période</CModalTitle>
        </CModalHeader>
        <CModalBody className="p-4">
          <CNav variant="tabs" className="mb-3">
            <CNavItem>
              <CNavLink active={activeTab === 'depot'} onClick={() => setActiveTab('depot')}>
                Dépôt de dossier
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === 'reclamation'}
                onClick={() => setActiveTab('reclamation')}
              >
                Période de réclamation
              </CNavLink>
            </CNavItem>
          </CNav>
          {selectedYear && (
            <CAlert color="info" className="mb-3">
              <strong>Année académique : {selectedYear.libelle}</strong>
              <br />
              Période valide : du {selectedYear.date_debut} au {selectedYear.date_fin}
              <br />
              <small>Les périodes doivent être comprises dans cette plage de dates.</small>
            </CAlert>
          )}
          <CTabContent>
            <CTabPane visible={true}>
              <CForm>
                <CRow className="mb-3">
                  <CCol md="3" className="d-flex align-items-center">
                    <label className="form-label mb-0">Date de début</label>
                  </CCol>
                  <CCol md="9">
                    <DatePicker
                      selected={periodStartDate}
                      onChange={(date: any) => setPeriodStartDate(date)}
                      dateFormat="dd/MM/yyyy"
                      className="form-control"
                      placeholderText="Choisir la date de début (jj/mm/aaaa)"
                      minDate={selectedYear ? parseFrenchDate(selectedYear.date_debut) || new Date() : new Date()}
                      maxDate={selectedYear ? parseFrenchDate(selectedYear.date_fin) || undefined : undefined}
                    />
                  </CCol>
                </CRow>
                <CRow className="mb-3">
                  <CCol md="3" className="d-flex align-items-center">
                    <label className="form-label mb-0">Heure de début</label>
                  </CCol>
                  <CCol md="9">
                    <DatePicker
                      selected={periodStartTime}
                      onChange={(date: any) => setPeriodStartTime(date)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Heure"
                      dateFormat="HH:mm"
                      className="form-control"
                      placeholderText="Choisir l'heure de début (hh:mm)"
                    />
                  </CCol>
                </CRow>
                <CRow className="mb-3">
                  <CCol md="3" className="d-flex align-items-center">
                    <label className="form-label mb-0">Date de fin</label>
                  </CCol>
                  <CCol md="9">
                    <DatePicker
                      selected={periodEndDate}
                      onChange={(date: any) => setPeriodEndDate(date)}
                      dateFormat="dd/MM/yyyy"
                      className="form-control"
                      placeholderText="Choisir la date de fin (jj/mm/aaaa)"
                      minDate={selectedYear ? parseFrenchDate(selectedYear.date_debut) || new Date() : new Date()}
                      maxDate={selectedYear ? parseFrenchDate(selectedYear.date_fin) || undefined : undefined}
                    />
                  </CCol>
                </CRow>
                <CRow className="mb-3">
                  <CCol md="3" className="d-flex align-items-center">
                    <label className="form-label mb-0">Heure de fin</label>
                  </CCol>
                  <CCol md="9">
                    <DatePicker
                      selected={periodEndTime}
                      onChange={(date: any) => setPeriodEndTime(date)}
                      showTimeSelect
                      showTimeSelectOnly
                      timeIntervals={15}
                      timeCaption="Heure"
                      dateFormat="HH:mm"
                      className="form-control"
                      placeholderText="Choisir l'heure de fin (hh:mm)"
                    />
                  </CCol>
                </CRow>
                <CRow className="mb-3">
                  <CCol md="3" className="d-flex align-items-center">
                    <label className="form-label mb-0">Filières</label>
                  </CCol>
                  <CCol md="9">
                    <CRow>
                      {filieres.map((filiere: any) => {
                        const filiereId = filiere.id || filiere
                        const filiereName = filiere.abbreviation || filiere.title || filiere
                        const isSelected = selectedFilieres.includes(filiereId)
                        return (
                          <CCol xs="6" key={filiereId} className="mb-2">
                            <CBadge
                              color={isSelected ? 'success' : 'secondary'}
                              shape="rounded-pill"
                              className={`px-3 py-2 w-100 text-start shadow-sm border ${isSelected ? 'fw-bold' : ''}`}
                              onClick={() => handleFiliereChange(filiereId)}
                            >
                              {isSelected && <span className="me-2">✔</span>}
                              {filiereName}
                            </CBadge>
                          </CCol>
                        )
                      })}
                    </CRow>
                  </CCol>
                </CRow>
              </CForm>
            </CTabPane>
          </CTabContent>
        </CModalBody>
        <CModalFooter>
          <CButton color="outline-secondary" onClick={() => setAddPeriodModalVisible(false)}>
            Annuler
          </CButton>
          <CButton color="outline-success" onClick={handleAddPeriod}>
            Ajouter
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modale Voir périodes */}
      <CModal visible={periodsModalVisible} onClose={() => setPeriodsModalVisible(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Périodes définies</CModalTitle>
        </CModalHeader>
        <CModalBody className="p-4">
          <CListGroup>
            {periods.length === 0 ? (
              <CListGroupItem>Aucune période définie.</CListGroupItem>
            ) : (
              periods.map((period, index) => (
                <CListGroupItem key={index} className="mb-2 shadow-sm p-3 rounded">
                  <p className="mb-1">
                    <strong>Type:</strong>{' '}
                    <CBadge
                      color={period.type === 'depot' ? 'success' : 'warning'}
                      className="px-2 py-1"
                    >
                      {period.type === 'depot' ? 'Dépôt de dossier' : 'Réclamation'}
                    </CBadge>
                  </p>
                  <p className="mb-1">
                    <strong>Début:</strong> {period.start}
                  </p>
                  <p className="mb-1">
                    <strong>Fin:</strong> {period.end}
                  </p>
                  <p className="mb-0">
                    <strong>Filières:</strong>{' '}
                    {period.filieres && period.filieres.length > 0 ? (
                      period.filieres.map((filiere, i) => (
                        <CBadge key={i} color="info" className="me-1 px-2 py-1">
                          {filiere}
                        </CBadge>
                      ))
                    ) : (
                      <span>Aucune</span>
                    )}
                  </p>
                </CListGroupItem>
              ))
            )}
          </CListGroup>
        </CModalBody>
        <CModalFooter>
          <CButton color="outline-secondary" onClick={() => setPeriodsModalVisible(false)}>
            Fermer
          </CButton>
        </CModalFooter>
      </CModal>
    </CCard>
  )
}

export default AnneeAcademiques
