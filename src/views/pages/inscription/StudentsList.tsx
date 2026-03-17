// ============================================================
// FICHIER : src/views/inscription/StudentsList.tsx
// ACTION  : REMPLACER tout le contenu du fichier par ceci
// ============================================================

import React, { useState, useCallback } from 'react'
import { CButton, CCard, CCardHeader, CCardBody, CAlert } from '@coreui/react'
import {
  StudentsFilter,
  StudentTable,
  StudentDetailsModal,
  StudentEditModal,
  GroupCreationModal,
} from '../../../components/inscription'
import { LoadingSpinner, Pagination } from '../../../components/common'
import { useDebounce } from '../../../hooks/common'
import {
  useStudentsListData,
  useStudentDetails,
  useStudentEdit,
  useGroupCreation,
} from '../../../hooks/inscription'
import InscriptionService from '../../../services/inscription.service'
import Swal from 'sweetalert2'

const StudentsList = () => {
  const {
    students,
    filterOptions,
    selectedYear,
    setSelectedYear,
    selectedFiliere,
    setSelectedFiliere,
    selectedEntryDiploma: _selectedEntryDiploma,
    selectedRedoublant,
    setSelectedRedoublant,
    selectedNiveau,
    setSelectedNiveau,
    selectedCohort,
    setSelectedCohort,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    studentDetails: studentDetailsFromHook,
    getStudentDetails: getStudentDetailsFromHook,
    updateStudent,
    loading,
    error,
  } = useStudentsListData()

  const [localSearchQuery, setLocalSearchQuery]   = useState(searchQuery)
  const [hasExistingGroups, setHasExistingGroups] = useState(false)
  const debouncedSearchQuery                      = useDebounce(localSearchQuery, 300)

  // ── Responsable ──────────────────────────────────────────────────────────
  // Map { classGroupName → personal_information_id } du responsable de chaque groupe
  const [groupResponsibleMap, setGroupResponsibleMap] = useState<Record<string, number>>({})
  const [assigningId, setAssigningId]                 = useState<number | null>(null)

  /**
   * Reconstruit la map à partir de la liste des étudiants.
   * Clé   : classGroupName  (ex: "A", "B")
   * Valeur : personal_information_id du responsable
   */
  const buildGroupResponsibleMap = useCallback((studentList: typeof students) => {
    const map: Record<string, number> = {}
    studentList?.forEach((s: any) => {
      const isResp = s.isClassResponsible === true || s.role_id === 9
      if (isResp && s.classGroupName) {
        // ✅ On stocke personal_information_id (pas pending_students.id)
        const piId = s.personal_information_id ?? s.id
        map[s.classGroupName] = piId
      }
    })
    setGroupResponsibleMap(map)
  }, [])

  React.useEffect(() => {
    buildGroupResponsibleMap(students)
  }, [students, buildGroupResponsibleMap])

  /**
   * Assigner ou retirer le rôle de responsable.
   * @param personalInfoId  personal_information.id de l'étudiant ciblé
   * @param isCurrently     true = retirer, false = nommer
   */
  const handleAssignResponsible = useCallback(
    async (personalInfoId: number, isCurrently: boolean) => {
      const action      = isCurrently ? 'retirer' : 'nommer'
      const confirmText = isCurrently
        ? 'Cet étudiant ne sera plus responsable de classe.'
        : 'Cet étudiant deviendra responsable de classe et recevra un accès.'

      const result = await Swal.fire({
        title: isCurrently ? 'Retirer le responsable ?' : 'Nommer responsable ?',
        text: confirmText,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: `Oui, ${action}`,
        cancelButtonText: 'Annuler',
      })

      if (!result.isConfirmed) return

      setAssigningId(personalInfoId)
      try {
        if (isCurrently) {
          await InscriptionService.removeClassResponsible(personalInfoId)
        } else {
          await InscriptionService.assignClassResponsible(personalInfoId)
        }

        await Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: isCurrently
            ? 'Le rôle de responsable a été retiré.'
            : 'L\'étudiant a été nommé responsable de classe.',
          timer: 1800,
          showConfirmButton: false,
        })

        window.location.reload()

      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err?.response?.data?.message || err?.message || `Impossible de ${action} le responsable.`,
        })
      } finally {
        setAssigningId(null)
      }
    },
    []
  )
  // ─────────────────────────────────────────────────────────────────────────

  const detailsModal = useStudentDetails({ getStudentDetails: getStudentDetailsFromHook })

  const editModal = useStudentEdit({
    studentDetails: detailsModal.studentDetails || studentDetailsFromHook,
    updateStudent,
    onSuccess: () => { detailsModal.open(detailsModal.studentDetails?.id) },
  })

  const groupCreation = useGroupCreation({
    selectedYear,
    selectedFiliere,
    selectedNiveau,
    selectedEntryDiploma: _selectedEntryDiploma,
    selectedRedoublant,
    selectedCohort,
    filterOptions,
  })

  React.useEffect(() => {
    setSearchQuery(debouncedSearchQuery)
    setCurrentPage(1)
  }, [debouncedSearchQuery, setSearchQuery, setCurrentPage])

  React.useEffect(() => {
    const checkExistingGroups = async () => {
      if (
        selectedYear    !== 'all' &&
        selectedFiliere !== 'all' &&
        selectedNiveau  !== 'all' &&
        selectedCohort  !== 'all'
      ) {
        try {
          const academicYearId = parseInt(selectedYear, 10)
          const departmentId   = parseInt(selectedFiliere, 10)
          if (!isNaN(academicYearId) && !isNaN(departmentId)) {
            const response = await InscriptionService.getClassGroups(
              academicYearId, departmentId, selectedNiveau, selectedCohort
            )
            setHasExistingGroups(response.data && response.data.length > 0)
          }
        } catch {
          setHasExistingGroups(false)
        }
      } else {
        setHasExistingGroups(false)
      }
    }
    checkExistingGroups()
  }, [selectedYear, selectedFiliere, selectedNiveau, selectedCohort])

  const handleFilterChange = useCallback(
    (name: string, option: { value: string } | null) => {
      const value = option ? option.value : 'all'
      if (name === 'year')       setSelectedYear(value)
      if (name === 'filiere')    setSelectedFiliere(value)
      if (name === 'redoublant') setSelectedRedoublant(value)
      if (name === 'niveau')     setSelectedNiveau(value)
      if (name === 'cohort')     setSelectedCohort(value)
      setCurrentPage(1)
    },
    [setSelectedYear, setSelectedFiliere, setSelectedRedoublant, setSelectedNiveau, setSelectedCohort, setCurrentPage]
  )

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => { setLocalSearchQuery(e.target.value) },
    []
  )

  const handleRowClick = useCallback(
    (studentId: number) => { detailsModal.open(studentId) },
    [detailsModal]
  )

  const handleOpenEditFromDetails = useCallback(() => {
    if (detailsModal.studentDetails) {
      detailsModal.close()
      editModal.initializeForm(detailsModal.studentDetails)
    }
  }, [detailsModal, editModal])

  const handleCreateGroups = useCallback(async () => {
    await groupCreation.initializeGroups()
  }, [groupCreation])

  const handleCreateDefaultGroup = useCallback(async () => {
    if (selectedYear === 'all' || selectedFiliere === 'all' || selectedNiveau === 'all' || selectedCohort === 'all') {
      Swal.fire({
        icon: 'warning', title: 'Sélection requise',
        text: 'Veuillez sélectionner une année académique, une filière, un niveau et une cohorte.',
      })
      return
    }
    try {
      const result = await Swal.fire({
        title: 'Créer un groupe unique ?',
        text: 'Tous les étudiants de cette cohorte seront placés dans un groupe unique "A".',
        icon: 'question', showCancelButton: true,
        confirmButtonText: 'Oui, créer', cancelButtonText: 'Annuler',
      })
      if (result.isConfirmed) {
        const response = await InscriptionService.createDefaultClassGroup(
          parseInt(selectedYear), parseInt(selectedFiliere), selectedNiveau, selectedCohort
        )
        if (response.success) {
          await Swal.fire({
            icon: 'success', title: 'Groupe créé',
            text: `Groupe unique créé avec ${response.data.students_count} étudiant(s)`,
          })
          window.location.reload()
        }
      }
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: error?.message || 'Impossible de créer le groupe' })
    }
  }, [selectedYear, selectedFiliere, selectedNiveau, selectedCohort])

  const handleCancelGroupCreation = useCallback(async () => {
    await groupCreation.cancelGroupCreation()
  }, [groupCreation])

  const handleExport = useCallback(
    async (type: 'fiche-presence' | 'fiche-emargement') => {
      if (selectedYear === 'all' || selectedFiliere === 'all' || selectedNiveau === 'all') {
        Swal.fire({
          icon: 'warning', title: 'Sélection requise',
          text: "Veuillez sélectionner une année académique, une filière et un niveau avant d'exporter.",
        })
        return
      }
      try {
        const academicYearId = parseInt(selectedYear, 10)
        const departmentId   = parseInt(selectedFiliere, 10)
        if (isNaN(academicYearId) || isNaN(departmentId)) throw new Error('Identifiants invalides')

        const cohortForExport = selectedCohort === 'all' ? 'all' : selectedCohort
        const groupsResponse  = await InscriptionService.getClassGroups(
          academicYearId, departmentId, selectedNiveau,
          cohortForExport !== 'all' ? cohortForExport : undefined
        )
        let selectedGroupe: string | undefined
        const groups = groupsResponse.data || []
        if (groups.length > 0) {
          const options: any = { all: 'Tous les groupes' }
          groups.forEach((g: any) => {
            const gn = g.group_name || g.name
            options[gn] = `Groupe ${gn}`
          })
          const res = await Swal.fire({
            title: 'Sélectionner un groupe', input: 'select', inputOptions: options,
            inputPlaceholder: 'Choisir un groupe', showCancelButton: true,
            confirmButtonText: 'Exporter', cancelButtonText: 'Annuler',
          })
          if (!res.isConfirmed) return
          selectedGroupe = res.value !== 'all' ? res.value : undefined
        }

        const blobUrl    = await InscriptionService.exportList(
          type, selectedYear, selectedFiliere, selectedNiveau, cohortForExport, selectedGroupe
        )
        const yearObj    = filterOptions.years.find((y: any) =>
          (typeof y === 'object' && String(y.id) === selectedYear) || String(y) === selectedYear
        )
        const filiereObj = filterOptions.filieres.find((f: any) =>
          (typeof f === 'object' && String(f.id) === selectedFiliere) || String(f) === selectedFiliere
        )
        const yearLabel    = yearObj && typeof yearObj === 'object'
          ? yearObj.libelle || (yearObj as any).academic_year || selectedYear : selectedYear
        const filiereLabel = filiereObj && typeof filiereObj === 'object'
          ? filiereObj.name || filiereObj.title || filiereObj.libelle || selectedFiliere : selectedFiliere
        const cohortLabel  = cohortForExport === 'all' ? 'ToutesCohortes' : `Cohorte${cohortForExport}`

        const link    = document.createElement('a')
        link.href     = blobUrl
        link.download = `${type}-${yearLabel}-${filiereLabel}-Niveau${selectedNiveau}-${cohortLabel}${
          selectedGroupe ? `-Groupe${selectedGroupe}` : ''}.pdf`
        link.click()
        window.URL.revokeObjectURL(blobUrl)
        Swal.fire({ icon: 'success', title: 'Succès', text: 'Téléchargement réussi.' })
      } catch {
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Échec du téléchargement du PDF.' })
      }
    },
    [selectedYear, selectedFiliere, selectedNiveau, selectedCohort, filterOptions]
  )

  if (loading) {
    return <LoadingSpinner message="Chargement de la liste des étudiants..." fullPage />
  }

  return (
    <>
      <CCard className="mb-4 shadow-sm">
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <span className="fw-bold">Liste des Étudiants</span>
          <div>
            {!hasExistingGroups && (
              <>
                <CButton color="info" variant="outline" size="sm" className="me-2"
                  onClick={handleCreateDefaultGroup}>Groupe unique</CButton>
                <CButton color="success" variant="outline" size="sm" className="me-2"
                  onClick={handleCreateGroups}>Créer des groupes</CButton>
              </>
            )}
            <CButton color="primary" variant="outline" size="sm" className="me-2"
              onClick={() => handleExport('fiche-presence')}>Fiche de présence</CButton>
            <CButton color="primary" variant="outline" size="sm"
              onClick={() => handleExport('fiche-emargement')}>Fiche d'émargement</CButton>
          </div>
        </CCardHeader>

        <CCardBody>
          {error && <CAlert color="danger">{error}</CAlert>}
          <StudentsFilter
            filterOptions={filterOptions}
            selectedYear={selectedYear}
            selectedFiliere={selectedFiliere}
            selectedNiveau={selectedNiveau}
            selectedCohort={selectedCohort}
            selectedRedoublant={selectedRedoublant}
            searchQuery={localSearchQuery}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            showSearch={true}
            showNiveau={true}
            showCohort={true}
            showRedoublant={true}
          />

          {/* ✅ Passe les 3 nouvelles props pour la fonctionnalité Responsable */}
          <StudentTable
            students={students}
            loading={false}
            onRowClick={handleRowClick}
            onAssignResponsible={handleAssignResponsible}
            groupResponsibleMap={groupResponsibleMap}
            assigningId={assigningId}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </CCardBody>
      </CCard>

      <StudentDetailsModal
        visible={detailsModal.isOpen}
        student={detailsModal.studentDetails}
        loading={detailsModal.loading}
        onClose={detailsModal.close}
        onEdit={handleOpenEditFromDetails}
      />
      <StudentEditModal
        visible={editModal.isOpen}
        formData={editModal.formData}
        loading={editModal.loading}
        onClose={editModal.close}
        onSubmit={editModal.handleSubmit}
        onChange={editModal.handleChange}
      />
      <GroupCreationModal
        visible={groupCreation.allStudentsForGrouping.length > 0}
        groups={groupCreation.groups}
        currentGroupIndex={groupCreation.currentGroupIndex}
        selectedStudents={groupCreation.selectedStudents}
        allStudentsForGrouping={groupCreation.allStudentsForGrouping}
        loading={groupCreation.loading}
        onClose={handleCancelGroupCreation}
        onSelectStudent={groupCreation.selectStudent}
        onSelectAll={groupCreation.selectAll}
        onDeselectAll={groupCreation.deselectAll}
        onSelectFirst={groupCreation.selectFirst}
        onSelectLast={groupCreation.selectLast}
        onSelectOneInTwo={groupCreation.selectOneInTwo}
        onValidateGroup={groupCreation.validateGroup}
      />
    </>
  )
}

export default StudentsList