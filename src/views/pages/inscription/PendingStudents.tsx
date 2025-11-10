import React, { useState, useEffect, useCallback } from 'react'
import type { SingleValue } from 'react-select'
import { CCard, CCardHeader, CCardBody, CAlert } from '@coreui/react'
import {
  PendingStudentsTable,
  PendingStudentsToolbar,
  StudentsFilter,
} from '../../../components/inscription'
import { Pagination } from '../../../components/common'
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
    selectedStatut,
    setSelectedStatut,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    error,
    sendStudentMail,
    exportData,
    updateStudentStatus,
  } = usePendingStudentsData()

  const [editedData, setEditedData] = useState<PendingStudentData[]>(pendingStudents)
  const [localSearchQuery, setLocalSearchQuery] = useState<string>(searchQuery)
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])

  const debouncedSearchQuery = useDebounce(localSearchQuery, 300)

  const opinionOptions: SelectOption[] = [
    { value: 'Favorable', label: 'Favorable' },
    { value: 'Défavorable', label: 'Défavorable' },
  ]

  const specialFilieres: string[] = ['Droit', 'Médecine', 'Informatique']
  const isSpecialFiliere: boolean = specialFilieres.includes(selectedFiliere)

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
      if (name === 'statut') setSelectedStatut(value)
      setCurrentPage(1)
    },
    [
      setSelectedFiliere,
      setSelectedYear,
      setSelectedEntryDiploma,
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

  const handleOpenDocument = useCallback((documentUrl: string): void => {
    if (documentUrl) {
      window.open(documentUrl, '_blank')
    }
  }, [])

  // Handler pour changer d'opinion
  const handleOpinionChange = useCallback(
    (studentId: number, type: string, value: string): void => {
      setEditedData((prev) =>
        prev.map((student) => {
          if (student.id === studentId) {
            const newComment = value === 'Favorable' ? 'Favorable' : 'Défavorable'
            const updatedStudent = { ...student, [type]: value }
            if (type === 'opinionCuca') {
              updatedStudent.commentaireCuca = newComment
            } else if (type === 'opinionCuo') {
              updatedStudent.commentaireCuo = newComment
            }
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
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    )
  }, [])

  const handleSelectAll = useCallback(
    (checked: boolean): void => {
      setSelectedStudents(checked ? editedData.map((student) => student.id) : [])
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
      if (selectedYear === 'all' || selectedFiliere === 'all') {
        Swal.fire({
          icon: 'warning',
          title: 'Sélection requise',
          text: "Veuillez sélectionner une année académique et une filière avant d'exporter.",
        })
        return
      }

      const result = await exportData(format)
      if (result.success && result.url) {
        const a = document.createElement('a')
        a.href = result.url
        a.download = `pending_students.${format}`
        a.click()
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: `Exportation en ${format} réussie.`,
        })
      } else {
        const errorMessage =
          !result.success && result.error
            ? typeof result.error === 'string'
              ? result.error
              : result.error?.message
            : "Échec de l'export."
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: errorMessage,
        })
      }
    },
    [selectedYear, selectedFiliere, exportData]
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
          selectedStatut={selectedStatut}
          searchQuery={localSearchQuery}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
          showSearch={true}
          showStatut={true}
        />
        <PendingStudentsToolbar
          selectedStudentsCount={selectedStudents.length}
          isSpecialFiliere={isSpecialFiliere}
          onSendMail={handleSendMail}
          onExport={handleExport}
        />
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
        />
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </CCardBody>
    </CCard>
  )
}

export default PendingStudents
