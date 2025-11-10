import React, { useState, useCallback } from 'react'
import {
  CButton,
  CCard,
  CCardHeader,
  CCardBody,
  CAlert,
} from '@coreui/react'
import {
  AcademicYearForm,
  AcademicYearList,
  AddPeriodModal,
  PeriodsModal,
} from '../../../components/inscription'
import { LoadingSpinner } from '../../../components/common'
import { useAnneeAcademiqueData } from '../../../hooks/inscription'
import { useModal } from '../../../hooks/common'
import {
  isBeforeToday,
  isStartBeforeEnd,
} from '../../../utils/date.utils'
import Swal from 'sweetalert2'
import type { Period } from '../../../types/inscription.types'


const AnneeAcademiques = () => {
  const {
    academicYears,
    filieres,
    loading,
    error,
    createAcademicYear,
    addPeriod,
    getPeriods,
  } = useAnneeAcademiqueData()

  const createModal = useModal()
  const addPeriodModal = useModal()
  const periodsModal = useModal()

  const [newYearStart, setNewYearStart] = useState<Date | null>(null)
  const [newYearEnd, setNewYearEnd] = useState<Date | null>(null)
  const [submissionStart, setSubmissionStart] = useState<Date | null>(null)
  const [submissionEnd, setSubmissionEnd] = useState<Date | null>(null)
  const [includeSubmissionPeriod, setIncludeSubmissionPeriod] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)

  const [selectedYear, setSelectedYear] = useState<any>(null)
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState('depot')
  const [periodStartDate, setPeriodStartDate] = useState<Date | null>(null)
  const [periodStartTime, setPeriodStartTime] = useState<Date | null>(null)
  const [periodEndDate, setPeriodEndDate] = useState<Date | null>(null)
  const [periodEndTime, setPeriodEndTime] = useState<Date | null>(null)
  const [selectedFilieres, setSelectedFilieres] = useState<number[]>([])
  const [periodLoading, setPeriodLoading] = useState(false)

  const [periods, setPeriods] = useState<Period[]>([])
  const [periodsLoading, setPeriodsLoading] = useState(false)

  const handleCreateYear = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      if (!newYearStart || !newYearEnd) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation',
          text: "Veuillez remplir les dates de début et de fin de l'année académique.",
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

      if (includeSubmissionPeriod) {
        if (!submissionStart || !submissionEnd) {
          Swal.fire({
            icon: 'warning',
            title: 'Validation',
            text: "Veuillez remplir les dates de soumission ou décocher l'option.",
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

      setCreateLoading(true)
      try {
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
          createModal.close()
          setNewYearStart(null)
          setNewYearEnd(null)
          setSubmissionStart(null)
          setSubmissionEnd(null)
          setIncludeSubmissionPeriod(false)
        } else {
          const errorMessage =
            !result.success && result.error
              ? typeof result.error === 'string'
                ? result.error
                : result.error?.message
              : "Échec de la création de l'année académique."
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: errorMessage,
          })
        }
      } catch (error) {
        console.error('Erreur lors de la création:', error)
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Une erreur est survenue lors de la création.',
        })
      } finally {
        setCreateLoading(false)
      }
    },
    [
      newYearStart,
      newYearEnd,
      submissionStart,
      submissionEnd,
      includeSubmissionPeriod,
      createAcademicYear,
      createModal,
    ]
  )

  const handleOpenAddPeriod = useCallback(
    (year: any) => {
      setSelectedYear(year)
      setSelectedYearId(year.id)
      setSelectedFilieres(filieres.map((f: any) => f.id || f))
      addPeriodModal.open()
    },
    [filieres, addPeriodModal]
  )

  const handleAddPeriod = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()

      if (
        !periodStartDate ||
        !periodEndDate ||
        !periodStartTime ||
        !periodEndTime ||
        selectedFilieres.length === 0 ||
        !selectedYearId
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

      setPeriodLoading(true)
      try {
        const formatDateForAPI = (date: Date): string => {
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        }

        const formatTimeForAPI = (date: Date): string => {
          const hours = String(date.getHours()).padStart(2, '0')
          const minutes = String(date.getMinutes()).padStart(2, '0')
          return `${hours}:${minutes}`
        }

        const result = await addPeriod(
          selectedYearId,
          activeTab,
          formatDateForAPI(periodStartDate),
          formatTimeForAPI(periodStartTime),
          formatDateForAPI(periodEndDate),
          formatTimeForAPI(periodEndTime),
          selectedFilieres
        )

        if (result.success) {
          Swal.fire({
            icon: 'success',
            title: 'Succès',
            text: 'Période ajoutée avec succès.',
          })
          addPeriodModal.close()
          setPeriodStartDate(null)
          setPeriodStartTime(null)
          setPeriodEndDate(null)
          setPeriodEndTime(null)
          setSelectedFilieres(filieres.map((f: any) => f.id || f))
        } else {
          let errorMessage = "Échec de l'ajout de la période."
          if (result.error) {
            if (typeof result.error === 'string') {
              errorMessage = result.error
            } else if (result.error.message) {
              errorMessage = result.error.message
            } else if (result.error.errors) {
              const validationErrors = Object.values(result.error.errors)
                .flat()
                .join('\n')
              errorMessage = validationErrors || result.error.message || errorMessage
            }
          }
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: errorMessage,
          })
        }
      } catch (error) {
        console.error("Erreur lors de l'ajout de période:", error)
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: "Une erreur est survenue lors de l'ajout de la période.",
        })
      } finally {
        setPeriodLoading(false)
      }
    },
    [
      periodStartDate,
      periodEndDate,
      periodStartTime,
      periodEndTime,
      selectedFilieres,
      selectedYearId,
      activeTab,
      addPeriod,
      addPeriodModal,
      filieres,
    ]
  )

  const handleViewPeriods = useCallback(
    async (year: any) => {
      setSelectedYear(year)
      setPeriodsLoading(true)
      periodsModal.open()

      try {
        const result = await getPeriods(year.id)
        if (result.success) {
          setPeriods(result.data || [])
        }
      } catch (error) {
        console.error('Erreur lors du chargement des périodes:', error)
      } finally {
        setPeriodsLoading(false)
      }
    },
    [getPeriods, periodsModal]
  )

  if (loading) {
    return <LoadingSpinner message="Chargement des années académiques..." fullPage />
  }

  return (
    <>
      <CCard className="mb-4 shadow-sm">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <span className="fw-bold">Années Académiques</span>
          <CButton color="primary" size="sm" onClick={createModal.open}>
            Créer une nouvelle année
          </CButton>
        </CCardHeader>
        <CCardBody>
          {error && <CAlert color="danger">{error}</CAlert>}

          <AcademicYearList
            academicYears={academicYears}
            loading={false}
            onViewPeriods={handleViewPeriods}
            onAddPeriod={handleOpenAddPeriod}
          />
        </CCardBody>
      </CCard>

      <AcademicYearForm
        visible={createModal.isOpen}
        onClose={createModal.close}
        onSubmit={handleCreateYear}
        newYearStart={newYearStart}
        newYearEnd={newYearEnd}
        submissionStart={submissionStart}
        submissionEnd={submissionEnd}
        includeSubmissionPeriod={includeSubmissionPeriod}
        setNewYearStart={setNewYearStart}
        setNewYearEnd={setNewYearEnd}
        setSubmissionStart={setSubmissionStart}
        setSubmissionEnd={setSubmissionEnd}
        setIncludeSubmissionPeriod={setIncludeSubmissionPeriod}
        loading={createLoading}
      />

      <AddPeriodModal
        visible={addPeriodModal.isOpen}
        onClose={addPeriodModal.close}
        onSubmit={handleAddPeriod}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        periodStartDate={periodStartDate}
        periodStartTime={periodStartTime}
        periodEndDate={periodEndDate}
        periodEndTime={periodEndTime}
        setPeriodStartDate={setPeriodStartDate}
        setPeriodStartTime={setPeriodStartTime}
        setPeriodEndDate={setPeriodEndDate}
        setPeriodEndTime={setPeriodEndTime}
        filieres={filieres}
        selectedFilieres={selectedFilieres}
        setSelectedFilieres={setSelectedFilieres}
        loading={periodLoading}
      />

      <PeriodsModal
        visible={periodsModal.isOpen}
        onClose={periodsModal.close}
        selectedYear={selectedYear}
        periods={periods}
        loading={periodsLoading}
      />
    </>
  )
}

export default AnneeAcademiques
