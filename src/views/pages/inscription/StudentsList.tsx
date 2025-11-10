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

  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300)

  const detailsModal = useStudentDetails({
    getStudentDetails: getStudentDetailsFromHook,
  })

  const editModal = useStudentEdit({
    studentDetails: detailsModal.studentDetails || studentDetailsFromHook,
    updateStudent,
    onSuccess: () => {
      detailsModal.open(detailsModal.studentDetails?.id)
    },
  })

  const groupCreation = useGroupCreation({
    selectedYear,
    selectedFiliere,
    selectedNiveau,
    selectedEntryDiploma: _selectedEntryDiploma,
    selectedRedoublant,
    filterOptions,
  })
  React.useEffect(() => {
    setSearchQuery(debouncedSearchQuery)
    setCurrentPage(1)
  }, [debouncedSearchQuery, setSearchQuery, setCurrentPage])

  const handleFilterChange = useCallback(
    (name: string, option: { value: string } | null) => {
      const value = option ? option.value : 'all'
      if (name === 'year') setSelectedYear(value)
      if (name === 'filiere') setSelectedFiliere(value)
      if (name === 'redoublant') setSelectedRedoublant(value)
      if (name === 'niveau') setSelectedNiveau(value)
      setCurrentPage(1)
    },
    [
      setSelectedYear,
      setSelectedFiliere,
      setSelectedRedoublant,
      setSelectedNiveau,
      setCurrentPage,
    ]
  )

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchQuery(e.target.value)
  }, [])

  const handleRowClick = useCallback(
    (studentId: number) => {
      detailsModal.open(studentId)
    },
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

  const handleCancelGroupCreation = useCallback(async () => {
    const cancelled = await groupCreation.cancelGroupCreation()
    if (cancelled) {
      // Modal fermée
    }
  }, [groupCreation])

  const handleExport = useCallback(
    async (type: 'fiche-presence' | 'fiche-emargement') => {
      if (selectedYear === 'all' || selectedFiliere === 'all' || selectedNiveau === 'all') {
        Swal.fire({
          icon: 'warning',
          title: 'Sélection requise',
          text: "Veuillez sélectionner une année académique, une filière et un niveau avant d'exporter.",
        })
        return
      }

      try {
        const academicYearObj = filterOptions.years.find(
          (y: any) => typeof y === 'object' && y.libelle === selectedYear
        )
        const departmentObj = filterOptions.filieres.find(
          (f: any) => typeof f === 'object' && (f.name === selectedFiliere || f.title === selectedFiliere)
        )

        const academicYearId =
          typeof academicYearObj === 'object' && academicYearObj.id
            ? Number(academicYearObj.id)
            : undefined
        const departmentId =
          typeof departmentObj === 'object' && departmentObj.id
            ? Number(departmentObj.id)
            : undefined

        if (!academicYearId || !departmentId) {
          throw new Error('Impossible de trouver les identifiants nécessaires')
        }

        const groupsResponse = await InscriptionService.getClassGroups(
          academicYearId,
          departmentId,
          selectedNiveau
        )

        let selectedGroupe: string | undefined = undefined
        const groups = groupsResponse.data || []

        if (groups.length > 0) {
          const options: any = {
            'all': 'Tous les groupes',
          }
          groups.forEach((g: any) => {
            options[g.name] = `Groupe ${g.name}`
          })

          const result = await Swal.fire({
            title: 'Sélectionner un groupe',
            input: 'select',
            inputOptions: options,
            inputPlaceholder: 'Choisir un groupe',
            showCancelButton: true,
            confirmButtonText: 'Exporter',
            cancelButtonText: 'Annuler',
          })

          if (!result.isConfirmed) return
          selectedGroupe = result.value !== 'all' ? result.value : undefined
        }
        const blob = await InscriptionService.exportList(
          type,
          selectedYear,
          selectedFiliere,
          selectedNiveau,
          selectedGroupe
        )

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${type}-${selectedYear}-${selectedFiliere}-${selectedNiveau}${
          selectedGroupe ? `-Groupe${selectedGroupe}` : ''
        }.pdf`
        link.click()
        window.URL.revokeObjectURL(url)

        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: `Téléchargement de la ${type.replace('-', ' ')} réussi.`,
        })
      } catch (error) {
        console.error("Erreur d'export:", error)
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Échec du téléchargement du PDF.',
        })
      }
    },
    [selectedYear, selectedFiliere, selectedNiveau, filterOptions]
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
            <CButton
              color="success"
              variant="outline"
              size="sm"
              className="me-2"
              onClick={handleCreateGroups}
            >
              Créer des groupes
            </CButton>
            <CButton
              color="primary"
              variant="outline"
              size="sm"
              className="me-2"
              onClick={() => handleExport('fiche-presence')}
            >
              Fiche de présence
            </CButton>
            <CButton
              color="primary"
              variant="outline"
              size="sm"
              onClick={() => handleExport('fiche-emargement')}
            >
              Fiche d'émargement
            </CButton>
          </div>
        </CCardHeader>
        <CCardBody>
          {error && <CAlert color="danger">{error}</CAlert>}
          <StudentsFilter
            filterOptions={filterOptions}
            selectedYear={selectedYear}
            selectedFiliere={selectedFiliere}
            selectedNiveau={selectedNiveau}
            selectedRedoublant={selectedRedoublant}
            searchQuery={localSearchQuery}
            onFilterChange={handleFilterChange}
            onSearchChange={handleSearchChange}
            showSearch={true}
            showNiveau={true}
            showRedoublant={true}
          />
          <StudentTable students={students} loading={false} onRowClick={handleRowClick} />
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
