import React, { useState, useEffect, useCallback } from 'react'
import type { SingleValue } from 'react-select'
import { CCard, CCardHeader, CCardBody, CAlert } from '@coreui/react'
import {
  PendingStudentsTable,
  PendingStudentsToolbar,
  StudentsFilter,
  ValidatedStudentsModal,
} from '../../../components/inscription'
import { Pagination, LoadingSpinner } from '../../../components/common'
import usePendingStudentsData from '../../../hooks/inscription/usePendingSudentsData'
import { useDebounce } from '../../../hooks/common'
import Swal from 'sweetalert2'
import type { PendingStudentData } from '../../../types/inscription.types'

interface SelectOption {
  value: string | number
  label: string
}

interface StudentMailData {
  studentId: number
  opinionCuca?: string
  commentaireCuca?: string
  opinionCuo?: string
  commentaireCuo?: string
}


const PendingStudents: React.FC = () => {
  const {
    pendingStudents,
    filterOptions,
    selectedFiliere,
    setSelectedFiliere,
    selectedYear,
    setSelectedYear,
    selectedEntryDiploma,
    setSelectedEntryDiploma,
    selectedCohort,
    setSelectedCohort,
    selectedStatut,
    setSelectedStatut,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    loading,
    error,
    sendStudentMail,
    exportData,
    updateStudentStatus,
    updateStudentLevel,
    renamePiece,
  } = usePendingStudentsData()

  const [editedData, setEditedData] = useState<PendingStudentData[]>(pendingStudents)
  const [localSearchQuery, setLocalSearchQuery] = useState<string>(searchQuery)
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])
  const [showValidatedStudentsModal, setShowValidatedStudentsModal] = useState(false)

  const debouncedSearchQuery = useDebounce(localSearchQuery, 300)

  const opinionOptions: SelectOption[] = [
    { value: 'Favorable', label: 'Favorable' },
    { value: 'Défavorable', label: 'Défavorable' },
  ]

  const selectedFiliereOption = filterOptions.filieres.find(
    (f) => {
      if (typeof f === 'string') return f === selectedFiliere
      return String(f.id) === selectedFiliere
    }
  )
  const filiereName = selectedFiliereOption
    ? typeof selectedFiliereOption === 'string'
      ? selectedFiliereOption
      : (selectedFiliereOption.name || selectedFiliereOption.title || selectedFiliereOption.libelle || '')
    : ''
  const isSpecialFiliere: boolean = filiereName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .includes('prepa')

    console.log(isSpecialFiliere, filiereName)

  useEffect(() => {
    setSearchQuery(debouncedSearchQuery)
    setCurrentPage(1)
  }, [debouncedSearchQuery, setSearchQuery, setCurrentPage])

  useEffect(() => {
    setEditedData(pendingStudents)
  }, [pendingStudents])

  const handleFilterChange = useCallback(
    (name: string, option: SingleValue<SelectOption>): void => {
      const value = option ? String(option.value) : 'all'
      if (name === 'filiere') setSelectedFiliere(value)
      if (name === 'year') setSelectedYear(value)
      if (name === 'entryDiploma') setSelectedEntryDiploma(value)
      if (name === 'cohort') setSelectedCohort(value)
      if (name === 'statut') setSelectedStatut(value)
      setCurrentPage(1)
    },
    [
      setSelectedFiliere,
      setSelectedYear,
      setSelectedEntryDiploma,
      setSelectedCohort,
      setSelectedStatut,
      setCurrentPage,
    ]
  )

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setLocalSearchQuery(e.target.value)
    },
    []
  )

  const handleOpenDocument = useCallback(async (documentUrl: string): Promise<void> => {
    if (documentUrl) {
      const { openFileInNewTab } = await import('../../../utils/fileViewer')
      openFileInNewTab(documentUrl)
    }
  }, [])

  const handleOpinionChange = useCallback(
    (studentId: number, type: string, value: string): void => {
      setEditedData((prev) =>
        prev.map((student) => {
          if (student.id === studentId) {
            const updatedStudent = { ...student, [type]: value }
            // Ne pas écraser le commentaire existant, juste mettre à jour l'opinion
            return updatedStudent
          }
          return student
        })
      )
    },
    []
  )

  const handleCommentChange = useCallback(
    (studentId: number, type: string, value: string): void => {
      setEditedData((prev) =>
        prev.map((student) => {
          if (student.id === studentId) {
            const updatedStudent = { ...student }
            if (type === 'commentaireCuca') {
              updatedStudent.commentaireCuca = value
            } else if (type === 'commentaireCuo') {
              updatedStudent.commentaireCuo = value
            }
            return updatedStudent
          }
          return student
        })
      )
    },
    []
  )

  const handleSelectStudent = useCallback((studentId: number): void => {
    const student = editedData.find(s => s.id === studentId);
    if (!student) return;
    const hasCucaComplete = student.opinionCuca && student.commentaireCuca;
    const hasCuoComplete = student.opinionCuo && student.commentaireCuo;
    
    if (!hasCucaComplete && !hasCuoComplete) {
      return;
    }
    
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    )
  }, [editedData])

  const handleSelectAll = useCallback(
    (checked: boolean): void => {
      if (checked) {
        const selectableStudents = editedData.filter(student => {
          const hasCucaComplete = student.opinionCuca && student.commentaireCuca;
          const hasCuoComplete = student.opinionCuo && student.commentaireCuo;
          return hasCucaComplete || hasCuoComplete;
        });
        setSelectedStudents(selectableStudents.map(s => s.id));
      } else {
        setSelectedStudents([]);
      }
    },
    [editedData]
  )

  const handleStatusChange = useCallback(
    async (
      studentId: number,
      field: 'exonere' | 'sponsorise',
      checked: boolean
    ): Promise<void> => {
      const result = await updateStudentStatus(studentId, field, checked)
      if (result.success) {
        setEditedData((prev) =>
          prev.map((student) =>
            student.id === studentId
              ? { ...student, [field]: checked ? 'Oui' : 'Non' }
              : student
          )
        )
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: `Statut ${field === 'exonere' ? 'exonéré' : 'sponsorisé'} mis à jour avec succès.`,
          timer: 1500,
          showConfirmButton: false,
        })
      } else {
        const errorMessage =
          !result.success && result.error
            ? typeof result.error === 'string'
              ? result.error
              : result.error?.message
            : 'Impossible de mettre à jour le statut.'
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorMessage,
        })
      }
    },
    [updateStudentStatus]
  )

  const handleLevelChange = useCallback(
    async (studentId: number, level: string): Promise<void> => {
      if (!level.trim()) return
      const result = await updateStudentLevel(studentId, level)
      if (!result.success) {
        const errorMessage =
          !result.success && result.error
            ? typeof result.error === 'string'
              ? result.error
              : result.error?.message
            : 'Impossible de mettre à jour le niveau.'
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorMessage,
        })
      }
    },
    [updateStudentLevel]
  )

  const handleSendMail = useCallback(
    async (_type: string): Promise<void> => {
      if (selectedStudents.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Sélection requise',
          text: 'Veuillez sélectionner au moins un étudiant.',
        })
        return
      }

      const studentsData: StudentMailData[] = selectedStudents.map((studentId) => {
        const student = editedData.find((s) => s.id === studentId)
        return {
          studentId,
          opinionCuca: student?.opinionCuca,
          commentaireCuca: student?.commentaireCuca,
          opinionCuo: student?.opinionCuo,
          commentaireCuo: student?.commentaireCuo,
        }
      })

      const result = await sendStudentMail(studentsData)
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: `Mail${selectedStudents.length > 1 ? 's' : ''} envoyé${selectedStudents.length > 1 ? 's' : ''} avec succès.`,
        })
        setSelectedStudents([])
      } else {
        const errorMessage =
          !result.success && result.error
            ? typeof result.error === 'string'
              ? result.error
              : result.error?.message
            : "Échec de l'envoi du mail."
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorMessage,
        })
      }
    },
    [selectedStudents, editedData, sendStudentMail]
  )

  const handleExport = useCallback(
    async (format: string): Promise<void> => {
      if (format === 'emails') {
        // Pour l'export des emails, on n'a besoin que de l'année académique
        if (selectedYear === 'all') {
          Swal.fire({
            icon: 'warning',
            title: 'Sélection requise',
            text: "Veuillez sélectionner une année académique avant d'exporter les emails.",
          })
          return
        }
      } else if (format.startsWith('validated-students-')) {
        // Pour l'export des étudiants validés par type, seule l'année académique est nécessaire
        if (selectedYear === 'all') {
          Swal.fire({
            icon: 'warning',
            title: 'Sélection requise',
            text: "Veuillez sélectionner une année académique avant d'exporter les étudiants validés.",
          })
          return
        }
      } else {
        // Pour les autres exports, année et filière sont obligatoires, cohorte optionnelle
        if (selectedYear === 'all' || selectedFiliere === 'all') {
          Swal.fire({
            icon: 'warning',
            title: 'Sélection requise',
            text: "Veuillez sélectionner une année académique et une filière avant d'exporter.",
          })
          return
        }
      }

      Swal.fire({
        title: 'Exportation en cours...',
        text: 'Veuillez patienter',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading()
        }
      })

      const result = await exportData(format)
      
      Swal.close()
      
      if (result.success && result.url) {
        const link = document.createElement('a')
        link.href = result.url
        link.download = result.filename || `export_${format}_${Date.now()}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(result.url)
        
        const successMessage = format.startsWith('validated-students-') 
          ? 'Export des étudiants validés réussi.'
          : `Exportation en ${format} réussie.`
        
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: successMessage,
          timer: 1500,
          showConfirmButton: false,
        })
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: (result as any).error ? (typeof (result as any).error === 'string' ? (result as any).error : (result as any).error?.message) || "Échec de l'export." : "Échec de l'export.",
        })
      }
    },
    [selectedYear, selectedFiliere, selectedCohort, exportData]
  )

  const handleValidatedStudentsExport = useCallback(
    async (type: string): Promise<void> => {
      await handleExport(`validated-students-${type}`)
    },
    [handleExport]
  )

  return (
    <CCard className="mb-4 shadow-sm">
      <CCardHeader>
        <span className="fw-bold">Étudiants en Attente</span>
      </CCardHeader>
      <CCardBody>
        {error && <CAlert color="danger">{error}</CAlert>}

        <StudentsFilter
          filterOptions={filterOptions}
          selectedYear={selectedYear}
          selectedFiliere={selectedFiliere}
          selectedEntryDiploma={selectedEntryDiploma}
          selectedCohort={selectedCohort}
          selectedStatut={selectedStatut}
          searchQuery={localSearchQuery}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
          showSearch={true}
          showCohort={true}
          showStatut={true}
        />
        <PendingStudentsToolbar
          selectedStudentsCount={selectedStudents.length}
          isSpecialFiliere={isSpecialFiliere}
          onSendMail={handleSendMail}
          onExport={handleExport}
          onShowValidatedStudentsModal={() => setShowValidatedStudentsModal(true)}
        />
        {loading ? (
          <LoadingSpinner message="Chargement des étudiants..." />
        ) : (
          <>
            <PendingStudentsTable
              students={editedData}
              currentPage={currentPage}
              selectedStudents={selectedStudents}
              isSpecialFiliere={isSpecialFiliere}
              opinionOptions={opinionOptions}
              onSelectAll={handleSelectAll}
              onSelectStudent={handleSelectStudent}
              onOpenDocument={handleOpenDocument}
              onOpinionChange={handleOpinionChange}
              onCommentChange={handleCommentChange}
              onStatusChange={handleStatusChange}
              onLevelChange={handleLevelChange}
              onRenamePiece={renamePiece}
            />
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}
      </CCardBody>

      <ValidatedStudentsModal
        visible={showValidatedStudentsModal}
        onClose={() => setShowValidatedStudentsModal(false)}
        onExport={handleValidatedStudentsExport}
      />
    </CCard>
  )
}

export default PendingStudents
