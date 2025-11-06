import React, { useState, useEffect } from 'react'
import Select, { SingleValue } from 'react-select'
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
  CCol,
  CPagination,
  CPaginationItem,
  CAlert,
  CFormCheck,
  CFormInput,
  CFormSwitch,
  CBadge,
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'

import { cilCheckCircle, cilXCircle } from '@coreui/icons'
import usePendingStudentsData from '../../../hooks/inscription/usePendingSudentsData'
import StudentsFilter from '../../../components/inscription/StudentsFilter'
import debounce from 'lodash/debounce'
import Swal from 'sweetalert2'
import type { PendingStudentData } from '../../../types/inscription.types'

// Types pour les options de select
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

  const specialFilieres: string[] = ['Droit', 'Médecine', 'Informatique'] // Exemple de filières spéciales
  const isSpecialFiliere: boolean = specialFilieres.includes(selectedFiliere)

  // Debounce la recherche pour éviter la perte de focus
  const debouncedSetSearchQuery = debounce(setSearchQuery, 300)

  // Gérer les changements de filtre
  const handleFilterChange = (name: string, option: SingleValue<SelectOption>): void => {
    const value = option ? String(option.value) : 'all'
    if (name === 'filiere') setSelectedFiliere(value)
    if (name === 'year') setSelectedYear(value)
    if (name === 'entryDiploma') setSelectedEntryDiploma(value)
    if (name === 'statut') setSelectedStatut(value)
    setCurrentPage(1) // Réinitialiser à la première page
  }

  // Gérer la recherche locale avant debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value
    setLocalSearchQuery(value)
    debouncedSetSearchQuery(value)
    setCurrentPage(1) // Réinitialiser à la première page
  }

  // Gérer le changement de page
  const handlePageChange = (page: number): void => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // Ouvrir un document dans un nouvel onglet
  const handleOpenDocument = (documentUrl: string): void => {
    if (documentUrl) {
      window.open(documentUrl, '_blank')
    }
  }

  // Gérer les changements d'opinion
  const handleOpinionChange = (studentId: number, type: string, value: string): void => {
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
      }),
    )
  }

  // Gérer les changements de commentaire
  const handleCommentChange = (studentId: number, type: string, value: string): void => {
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
      }),
    )
  }

  // Gérer la sélection multiple des étudiants
  const handleSelectStudent = (studentId: number): void => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  // Gérer l'envoi de mail pour les étudiants sélectionnés
  const handleSendMail = async (type: string): Promise<void> => {
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
      setSelectedStudents([]) // Réinitialiser la sélection
    } else {
      const errorMessage = !result.success && result.error
        ? typeof result.error === 'string' ? result.error : result.error?.message
        : "Échec de l'envoi du mail."
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage,
      })
    }
  }

  // Gérer l'exportation
  const handleExport = async (format: string): Promise<void> => {
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
      const errorMessage = !result.success && result.error
        ? typeof result.error === 'string' ? result.error : result.error?.message
        : "Échec de l'export."
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage,
      })
    }
  }

  // Gérer le changement de statut exonéré ou sponsorisé
  const handleStatusChange = async (studentId: number, field: 'exonere' | 'sponsorise', checked: boolean): Promise<void> => {
    const result = await updateStudentStatus(studentId, field, checked)
    if (result.success) {
      // Mettre à jour l'état local
      setEditedData((prev) =>
        prev.map((student) =>
          student.id === studentId ? { ...student, [field]: checked ? 'Oui' : 'Non' } : student,
        ),
      )
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: `Statut ${field === 'exonere' ? 'exonéré' : 'sponsorisé'} mis à jour avec succès.`,
        timer: 1500,
        showConfirmButton: false,
      })
    } else {
      const errorMessage = !result.success && result.error
        ? typeof result.error === 'string' ? result.error : result.error?.message
        : 'Impossible de mettre à jour le statut.'
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: errorMessage,
      })
    }
  }

  // Synchroniser editedData avec pendingStudents lors du chargement
  useEffect(() => {
    setEditedData(pendingStudents)
  }, [pendingStudents])

  // Les options de filtrage sont maintenant gérées par le composant StudentsFilter

  // Options pour opinion select
  const opinionOptions: SelectOption[] = [
    { value: 'Favorable', label: 'Favorable' },
    { value: 'Défavorable', label: 'Défavorable' },
  ]

  return (
    <CCard className="mb-4 shadow-sm">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <span>Étudiants en Attente</span>
        <div>
          <CButton
            color="primary"
            variant="outline"
            className="me-2"
            onClick={() => handleExport('pdf')}
          >
            Exporter PDF
          </CButton>
          <CButton
            color="primary"
            variant="outline"
            className="me-2"
            onClick={() => handleExport('excel')}
          >
            Exporter Excel
          </CButton>
          <CButton color="primary" variant="outline" onClick={() => handleExport('word')}>
            Exporter Word
          </CButton>
        </div>
      </CCardHeader>
      <CCardBody>
        {/* Afficher les erreurs */}
        {error && <CAlert color="danger">{error}</CAlert>}

        {/* Filtres et recherche */}
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
        
        <div className="mb-3 d-flex justify-content-end">
          <CCol xs={12} md={6} className="d-flex justify-content-end">
            {selectedStudents.length > 0 && (
              <>
                <CButton
                  color="primary"
                  size="sm"
                  className="me-2"
                  onClick={() => handleSendMail('CUCA')}
                >
                  Envoyer Mail CUCA
                </CButton>
                {!isSpecialFiliere && (
                  <CButton color="primary" size="sm" onClick={() => handleSendMail('CUO')}>
                    Envoyer Mail CUO
                  </CButton>
                )}
              </>
            )}
          </CCol>
        </div>

        {/* Tableau */}
        <CTable
          className="table table-bordered table-striped table-hover"
          style={{ fontSize: '0.9rem' }}
          align="middle"
          responsive
        >
          <CTableHead className="text-nowrap">
            <CTableRow>
              <CTableHeaderCell>
                <CFormCheck
                  id="selectAll"
                  checked={selectedStudents.length === editedData.length && editedData.length > 0}
                  onChange={(e) =>
                    setSelectedStudents(
                      e.target.checked ? editedData.map((student) => student.id) : [],
                    )
                  }
                />
              </CTableHeaderCell>
              <CTableHeaderCell>N°</CTableHeaderCell>
              <CTableHeaderCell>Nom et Prénoms</CTableHeaderCell>
              <CTableHeaderCell>Pièces</CTableHeaderCell>
              <CTableHeaderCell>
                {isSpecialFiliere ? "Avis de la commission d'études" : 'Opinion Cuca'}
              </CTableHeaderCell>
              <CTableHeaderCell>
                {isSpecialFiliere ? "Commentaires de la commission d'études" : 'Commentaire Cuca'}
              </CTableHeaderCell>
              {!isSpecialFiliere && <CTableHeaderCell>Opinion CUO</CTableHeaderCell>}
              {!isSpecialFiliere && <CTableHeaderCell>Commentaire CUO</CTableHeaderCell>}
              <CTableHeaderCell>Mail CUCA envoyé</CTableHeaderCell>
              {!isSpecialFiliere && <CTableHeaderCell>Mail CUO envoyé</CTableHeaderCell>}
              <CTableHeaderCell>Exonéré</CTableHeaderCell>
              <CTableHeaderCell>Sponsorisé</CTableHeaderCell>
              <CTableHeaderCell>Statut</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {editedData.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={isSpecialFiliere ? 11 : 14} className="text-center">
                  Aucun étudiant trouvé.
                </CTableDataCell>
              </CTableRow>
            ) : (
              editedData.map((student, index) => (
                <CTableRow key={student.id}>
                  <CTableDataCell>
                    <CFormCheck
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                    />
                  </CTableDataCell>
                  <CTableDataCell>{(currentPage - 1) * 10 + index + 1}</CTableDataCell>
                  <CTableDataCell>{student.first_name + ' ' + student.last_name}</CTableDataCell>
                  <CTableDataCell>
                    <div style={{ maxWidth: '200px' }}>
                      {student.pieces && student.pieces.length > 0 ? (
                        student.pieces.map((piece, pieceIndex) => (
                          <div key={pieceIndex} className="mb-1">
                            <CBadge 
                              color="primary" 
                              className="cursor-pointer text-decoration-underline"
                              onClick={() => handleOpenDocument(typeof piece === 'string' ? piece : (piece.url || ''))}
                              style={{ cursor: 'pointer' }}
                            >
                              {typeof piece === 'string' ? `Pièce ${pieceIndex + 1}` : (piece.name || `Pièce ${pieceIndex + 1}`)}
                            </CBadge>
                          </div>
                        ))
                      ) : (
                        <span className="text-muted">Aucune pièce</span>
                      )}
                    </div>
                  </CTableDataCell>
                  <CTableDataCell>
                    <Select
                      options={opinionOptions}
                      value={opinionOptions.find((opt) => opt.value === student.opinionCuca)}
                      onChange={(option) =>
                        handleOpinionChange(student.id, 'opinionCuca', String(option?.value || ''))
                      }
                      isClearable={false}
                    />
                  </CTableDataCell>
                  <CTableDataCell>
                    <CFormInput
                      value={student.commentaireCuca || ''}
                      onChange={(e) =>
                        handleCommentChange(student.id, 'commentaireCuca', e.target.value)
                      }
                    />
                  </CTableDataCell>
                  {!isSpecialFiliere && (
                    <CTableDataCell>
                      <Select
                        options={opinionOptions}
                        value={opinionOptions.find((opt) => opt.value === student.opinionCuo)}
                        onChange={(option) =>
                          handleOpinionChange(student.id, 'opinionCuo', String(option?.value || ''))
                        }
                        isClearable={false}
                      />
                    </CTableDataCell>
                  )}
                  {!isSpecialFiliere && (
                    <CTableDataCell>
                      <CFormInput
                        value={student.commentaireCuo || ''}
                        onChange={(e) =>
                          handleCommentChange(student.id, 'commentaireCuo', e.target.value)
                        }
                      />
                    </CTableDataCell>
                  )}
                  <CTableDataCell>
                    <CIcon
                      icon={student.mailCucaEnvoye === 'Oui' ? cilCheckCircle : cilXCircle}
                      className={student.mailCucaEnvoye === 'Oui' ? 'text-success' : 'text-danger'}
                    />
                    ({student.mailCucaCount || 0})
                  </CTableDataCell>
                  {!isSpecialFiliere && (
                    <CTableDataCell>
                      <CIcon
                        icon={student.mailCuoEnvoye === 'Oui' ? cilCheckCircle : cilXCircle}
                        className={student.mailCuoEnvoye === 'Oui' ? 'text-success' : 'text-danger'}
                      />
                      ({student.mailCuoCount || 0})
                    </CTableDataCell>
                  )}
                  <CTableDataCell>
                    <CFormSwitch
                      id={`exonere-${student.id}`}
                      checked={student.exonere === 'Oui'}
                      onChange={(e) => handleStatusChange(student.id, 'exonere', e.target.checked)}
                      label=""
                    />
                  </CTableDataCell>
                  <CTableDataCell>
                    <CFormSwitch
                      id={`sponsorise-${student.id}`}
                      checked={student.sponsorise === 'Oui'}
                      onChange={(e) => handleStatusChange(student.id, 'sponsorise', e.target.checked)}
                      label=""
                    />
                  </CTableDataCell>
                  <CTableDataCell>
                    <CBadge 
                      color={
                        student.status === 'approved' ? 'success' : 
                        student.status === 'rejected' ? 'danger' : 'warning'
                      }
                    >
                      {student.status === 'approved' ? 'Validé' : 
                       student.status === 'rejected' ? 'Rejeté' : 'En attente'}
                    </CBadge>
                  </CTableDataCell>
                </CTableRow>
              ))
            )}
          </CTableBody>
        </CTable>

        {/* Pagination */}
        <CPagination align="center" className="mt-3">
          <CPaginationItem
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Précédent
          </CPaginationItem>
          {[...Array(totalPages).keys()].map((page) => (
            <CPaginationItem
              key={page + 1}
              active={currentPage === page + 1}
              onClick={() => handlePageChange(page + 1)}
            >
              {page + 1}
            </CPaginationItem>
          ))}
          <CPaginationItem
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Suivant
          </CPaginationItem>
        </CPagination>
      </CCardBody>
    </CCard>
  )
}

export default PendingStudents
