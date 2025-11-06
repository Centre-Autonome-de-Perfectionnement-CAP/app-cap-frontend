import React, { useState } from 'react'
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
  CPagination,
  CPaginationItem,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CAlert,
  CListGroup,
  CListGroupItem,
  CFormCheck,
  CBadge,
  CButtonGroup,
  CFormLabel,
  CFormInput,
  CRow,
  CCol,
  CAvatar,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser } from '@coreui/icons'
import useStudentsListData from '../../../hooks/inscription/useStudentsListData.ts'
import InscriptionService from '../../../services/inscription.service.ts'
import StudentsFilter from '../../../components/inscription/StudentsFilter'
import debounce from 'lodash/debounce'
import Swal from 'sweetalert2'
import { LoadingSpinner } from '../../../components'

const StudentsList = () => {
  const {
    students,
    filterOptions,
    selectedYear,
    setSelectedYear,
    selectedFiliere,
    setSelectedFiliere,
    selectedEntryDiploma,
    setSelectedEntryDiploma,
    selectedRedoublant,
    setSelectedRedoublant,
    selectedNiveau,
    setSelectedNiveau,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    totalPages,
    studentDetails,
    getStudentDetails,
    updateStudent,
    exportList,
    loading,
    error,
  } = useStudentsListData()

  const [modalVisible, setModalVisible] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [groupsModalVisible, setGroupsModalVisible] = useState(false)
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const [groups, setGroups] = useState<any[]>([])
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0)
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])
  const [allStudentsForGrouping, setAllStudentsForGrouping] = useState<any[]>([])
  const [editForm, setEditForm] = useState<any>({})
  const [editLoading, setEditLoading] = useState(false)

  const debouncedSetSearchQuery = debounce(setSearchQuery, 300)

  const handleFilterChange = (name: string, option: { value: string } | null) => {
    const value = option ? option.value : 'all'
    if (name === 'year') setSelectedYear(value)
    if (name === 'filiere') setSelectedFiliere(value)
    if (name === 'entryDiploma') setSelectedEntryDiploma(value)
    if (name === 'redoublant') setSelectedRedoublant(value)
    if (name === 'niveau') setSelectedNiveau(value)
    setCurrentPage(1)
  }

  const handleSearchChange = (e: any) => {
    const value = e.target.value
    setLocalSearchQuery(value)
    debouncedSetSearchQuery(value)
    setCurrentPage(1)
  }

  const handlePageChange = (page: any) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleOpenModal = async (studentId: any) => {
    const result = await getStudentDetails(studentId)
    if (result.success) {
      setModalVisible(true)
    }
  }

  const handleOpenEditModal = () => {
    if (studentDetails) {
      // Extraire prénom et nom du nomPrenoms
      const [nom, ...prenoms] = studentDetails.nomPrenoms.split(' ')
      setEditForm({
        first_name: prenoms.join(' ') || '',
        last_name: nom || '',
        email: studentDetails.email || '',
        phone: studentDetails.telephone || '',
        gender: studentDetails.sexe || '',
        date_of_birth: studentDetails.dateNaissance || '',
      })
      setModalVisible(false)
      setEditModalVisible(true)
    }
  }

  const handleEditFormChange = (field: string, value: string) => {
    setEditForm((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSubmitEdit = async () => {
    if (!studentDetails) return

    setEditLoading(true)
    try {
      const result = await updateStudent(studentDetails.id, editForm)
      if (result.success) {
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Les informations de l\'étudiant ont été mises à jour avec succès.',
        })
        setEditModalVisible(false)
        setModalVisible(true)
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: result.error || 'Échec de la mise à jour des informations.',
        })
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Une erreur est survenue lors de la mise à jour.',
      })
    } finally {
      setEditLoading(false)
    }
  }

  const handleCreateGroups = async () => {
    if (selectedYear === 'all' || selectedFiliere === 'all' || selectedNiveau === 'all') {
      Swal.fire({
        icon: 'warning',
        title: 'Sélection requise',
        text: "Veuillez sélectionner une année académique, une filière et un niveau d'études avant de créer des groupes.",
      })
      return
    }

    // Charger tous les étudiants de la classe (sans pagination)
    try {
      const response = await InscriptionService.studentsList(
        selectedYear,
        selectedFiliere,
        selectedEntryDiploma,
        selectedRedoublant,
        selectedNiveau,
        1,
        '', // Pas de recherche
        1000 // Récupérer jusqu'à 1000 étudiants
      )
      const allStudents = response.data || []
      
      // Filtrer uniquement les étudiants qui ont un student_id (étudiants approuvés)
      const approvedStudents = allStudents.filter((s: any) => s.student_id !== null)
      
      if (approvedStudents.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Aucun étudiant',
          text: 'Aucun étudiant approuvé trouvé pour cette classe.',
        })
        return
      }

      setAllStudentsForGrouping(approvedStudents)
      setGroups([{ name: 'A', students: [] }])
      setCurrentGroupIndex(0)
      setSelectedStudents([])
      setGroupsModalVisible(true)
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les étudiants.',
      })
    }
  }

  const handleSelectStudent = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const handleSelectAll = () => {
    const assignedStudentIds = groups.flatMap(g => g.students.map((s: any) => s.id))
    const availableStudents = allStudentsForGrouping.filter(
      s => !assignedStudentIds.includes(s.id)
    )
    setSelectedStudents(availableStudents.map(s => s.id))
  }

  const handleDeselectAll = () => {
    setSelectedStudents([])
  }

  const handleSelectFirst = () => {
    Swal.fire({
      title: 'Sélectionner les N premiers',
      input: 'number',
      inputLabel: 'Nombre d\'étudiants à sélectionner',
      inputPlaceholder: 'Entrez un nombre',
      showCancelButton: true,
      confirmButtonText: 'Valider',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const n = parseInt(result.value)
        const assignedStudentIds = groups.flatMap(g => g.students.map((s: any) => s.id))
        const availableStudents = allStudentsForGrouping.filter(
          s => !assignedStudentIds.includes(s.id)
        )
        setSelectedStudents(availableStudents.slice(0, n).map(s => s.id))
      }
    })
  }

  const handleSelectLast = () => {
    Swal.fire({
      title: 'Sélectionner les N derniers',
      input: 'number',
      inputLabel: 'Nombre d\'étudiants à sélectionner',
      inputPlaceholder: 'Entrez un nombre',
      showCancelButton: true,
      confirmButtonText: 'Valider',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const n = parseInt(result.value)
        const assignedStudentIds = groups.flatMap(g => g.students.map((s: any) => s.id))
        const availableStudents = allStudentsForGrouping.filter(
          s => !assignedStudentIds.includes(s.id)
        )
        setSelectedStudents(availableStudents.slice(-n).map(s => s.id))
      }
    })
  }

  const handleSelectOneInTwo = () => {
    const assignedStudentIds = groups.flatMap(g => g.students.map((s: any) => s.id))
    const availableStudents = allStudentsForGrouping.filter(
      s => !assignedStudentIds.includes(s.id)
    )
    setSelectedStudents(availableStudents.filter((_, index) => index % 2 === 0).map(s => s.id))
  }

  const handleValidateGroup = () => {
    if (selectedStudents.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Attention',
        text: 'Veuillez sélectionner au moins un étudiant pour ce groupe.',
      })
      return
    }

    // Ajouter les étudiants sélectionnés au groupe actuel
    const studentsToAdd = allStudentsForGrouping.filter(s => selectedStudents.includes(s.id))
    const updatedGroups = [...groups]
    updatedGroups[currentGroupIndex].students = studentsToAdd
    setGroups(updatedGroups)

    // Vérifier s'il reste des étudiants non assignés
    const assignedStudentIds = updatedGroups.flatMap(g => g.students.map((s: any) => s.id))
    const remainingStudents = allStudentsForGrouping.filter(
      s => !assignedStudentIds.includes(s.id)
    )

    if (remainingStudents.length > 0) {
      // Créer automatiquement un nouveau groupe avec un nom suivant (B, C, D, etc.)
      const nextGroupName = String.fromCharCode(65 + updatedGroups.length) // A=65, B=66, etc.
      const newGroup = { name: nextGroupName, students: [] }
      setGroups([...updatedGroups, newGroup])
      setCurrentGroupIndex(updatedGroups.length)
      setSelectedStudents([])
    } else {
      // Tous les étudiants ont été assignés - sauvegarder dans la base de données
      handleSaveGroups(updatedGroups)
    }
  }

  const handleSaveGroups = async (groupsToSave: any[]) => {
    try {
      // Récupérer l'ID de l'année académique et de la filière
      const academicYear = filterOptions.years.find((y) => 
        (typeof y === 'object' && y !== null && 'libelle' in y && y.libelle === selectedYear) || y === selectedYear
      )
      const department = filterOptions.filieres.find((f) => 
        (typeof f === 'object' && f !== null && (('title' in f && f.title === selectedFiliere) || ('libelle' in f && f.libelle === selectedFiliere) || ('name' in f && f.name === selectedFiliere))) || f === selectedFiliere
      )

      const academicYearId = (typeof academicYear === 'object' && academicYear !== null && 'id' in academicYear) ? academicYear.id : academicYear
      const departmentId = (typeof department === 'object' && department !== null && 'id' in department) ? department.id : department

      // Convert to number to ensure type safety
      const academicYearIdNum = typeof academicYearId === 'string' ? parseInt(academicYearId, 10) : Number(academicYearId)
      const departmentIdNum = typeof departmentId === 'string' ? parseInt(departmentId, 10) : Number(departmentId)

      if (!academicYearIdNum || !departmentIdNum || isNaN(academicYearIdNum) || isNaN(departmentIdNum)) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Impossible de récupérer les informations de la classe.',
        })
        return
      }

      const data = {
        academic_year_id: academicYearIdNum,
        department_id: departmentIdNum,
        study_level: selectedNiveau,
        replace_existing: true, // Remplacer les groupes existants
        groups: groupsToSave.map(g => ({
          name: g.name,
          student_ids: g.students.map((s: any) => s.student_id).filter((id: any) => id !== null)
        }))
      }

      const response = await InscriptionService.createClassGroups(data)

      if (response.success) {
        Swal.fire({
          icon: 'success',
          title: 'Groupes créés',
          text: `${groupsToSave.length} groupe(s) créé(s) avec succès !`,
          html: groupsToSave.map((g) => 
            `<div><strong>Groupe ${g.name}:</strong> ${g.students.length} étudiant(s)</div>`
          ).join(''),
        })
        setGroupsModalVisible(false)
        setGroups([])
        setSelectedStudents([])
        setAllStudentsForGrouping([])
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Échec de la création des groupes.',
        })
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde des groupes:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error?.message || 'Une erreur est survenue lors de la sauvegarde des groupes.',
      })
    }
  }

  const handleCancelGroupCreation = () => {
    Swal.fire({
      title: 'Annuler la création de groupes ?',
      text: 'Tous les groupes en cours seront perdus.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, annuler',
      cancelButtonText: 'Non, continuer',
    }).then((result) => {
      if (result.isConfirmed) {
        setGroupsModalVisible(false)
        setGroups([])
        setSelectedStudents([])
        setAllStudentsForGrouping([])
      }
    })
  }

  const handleExport = async (type: 'fiche-presence' | 'fiche-emargement') => {
    if (selectedYear === 'all' || selectedFiliere === 'all' || selectedNiveau === 'all') {
      Swal.fire({
        icon: 'warning',
        title: 'Sélection requise',
        text: "Veuillez sélectionner une année académique, une filière et un niveau avant d'exporter.",
      })
      return
    }

    try {
      // Récupérer les IDs nécessaires pour la requête
      const academicYearObj = filterOptions.years.find(y => 
        typeof y === 'object' && y.libelle === selectedYear
      )
      const departmentObj = filterOptions.filieres.find(f => 
        typeof f === 'object' && (f.name === selectedFiliere || f.title === selectedFiliere)
      )
      
      const academicYearId = typeof academicYearObj === 'object' && academicYearObj.id 
        ? Number(academicYearObj.id) 
        : undefined
      const departmentId = typeof departmentObj === 'object' && departmentObj.id 
        ? Number(departmentObj.id) 
        : undefined

      if (!academicYearId || !departmentId) {
        throw new Error('Impossible de trouver les identifiants nécessaires')
      }

      // Récupérer les groupes disponibles pour cette classe
      const groupsResponse = await InscriptionService.getClassGroups(
        academicYearId,
        departmentId,
        selectedNiveau
      )

      let selectedGroupe: string | undefined = undefined
      const groups = groupsResponse.data || []

      if (groups.length > 0) {
        // Il y a des groupes, demander à l'utilisateur de choisir
        const options: any = {
          'all': 'Tous les groupes'
        }
        groups.forEach((group: any) => {
          options[group.group_name] = `Groupe ${group.group_name} (${group.students_count} étudiants)`
        })

        const result = await Swal.fire({
          title: 'Sélectionner un groupe',
          text: 'Voulez-vous exporter tous les groupes ou un groupe spécifique ?',
          icon: 'question',
          input: 'select',
          inputOptions: options,
          inputPlaceholder: 'Choisir une option',
          showCancelButton: true,
          confirmButtonText: 'Exporter',
          cancelButtonText: 'Annuler',
          inputValidator: (value) => {
            if (!value) {
              return 'Vous devez choisir une option !'
            }
          }
        })

        if (!result.isConfirmed) {
          return
        }

        selectedGroupe = result.value === 'all' ? undefined : result.value
      }

      // Exporter le PDF via le service
      const blob = await InscriptionService.exportList(
        type,
        selectedYear,
        selectedFiliere,
        selectedNiveau,
        selectedGroupe
      )

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const filename = selectedGroupe 
        ? `${type}-${selectedFiliere}-${selectedNiveau}-${selectedGroupe}.pdf`
        : `${type}-${selectedFiliere}-${selectedNiveau}.pdf`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: `Téléchargement de la ${type.replace('-', ' ')} réussi.`,
      })
    } catch (error) {
      console.error('Erreur d\'export:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: "Échec du téléchargement du PDF.",
      })
    }
  }

  if (loading) {
    return <LoadingSpinner message="Chargement de la liste des étudiants..." />
  }

  return (
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

        {/* Filtres et recherche */}
        <StudentsFilter
          filterOptions={filterOptions}
          selectedYear={selectedYear}
          selectedFiliere={selectedFiliere}
          selectedNiveau={selectedNiveau}
          selectedEntryDiploma={selectedEntryDiploma}
          selectedRedoublant={selectedRedoublant}
          searchQuery={localSearchQuery}
          onFilterChange={handleFilterChange}
          onSearchChange={handleSearchChange}
          showSearch={true}
          showNiveau={true}
          showRedoublant={true}
        />

        {/* Tableau */}
        <CTable align="middle" responsive bordered>
          <CTableHead className="text-nowrap table-light">
            <CTableRow>
              <CTableHeaderCell className="text-center">N°</CTableHeaderCell>
              <CTableHeaderCell className="text-center">Matricule</CTableHeaderCell>
              <CTableHeaderCell className="text-center">Nom et Prénoms</CTableHeaderCell>
              <CTableHeaderCell className="text-center">Sexe</CTableHeaderCell>
              <CTableHeaderCell className="text-center">Redoublant</CTableHeaderCell>
              <CTableHeaderCell className="text-center">Groupe</CTableHeaderCell>
              <CTableHeaderCell className="text-center">Date de naissance</CTableHeaderCell>
              <CTableHeaderCell className="text-center">Détails</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {students.length === 0 ? (
              <CTableRow>
                <CTableDataCell colSpan={8} className="text-center text-muted py-3">
                  Aucun étudiant trouvé.
                </CTableDataCell>
              </CTableRow>
            ) : (
              students.map((student, index) => (
                <CTableRow key={student.id}>
                  <CTableDataCell className="text-center">
                    {(currentPage - 1) * 10 + index + 1}
                  </CTableDataCell>
                  <CTableDataCell className="text-center">{student.matricule}</CTableDataCell>
                  <CTableDataCell className="text-center">{student.nomPrenoms}</CTableDataCell>
                  <CTableDataCell className="text-center">{student.sexe}</CTableDataCell>
                  <CTableDataCell className="text-center">{student.redoublant}</CTableDataCell>
                  <CTableDataCell className="text-center">
                    {student.groupe ? (
                      <CBadge color="info">{student.groupe}</CBadge>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </CTableDataCell>
                  <CTableDataCell className="text-center">{student.dateNaissance}</CTableDataCell>
                  <CTableDataCell className="text-center">
                    <CButton
                      color="primary"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(student.id)}
                    >
                      Détails
                    </CButton>
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
          {[...Array(totalPages).keys()].map((page: any) => (
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

      {/* Modale pour détails de l'étudiant */}
      <CModal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <CModalHeader>
          <CModalTitle>Détails de l'étudiant</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {studentDetails ? (
            <>
              {/* Photo/Avatar de l'étudiant */}
              <div className="text-center mb-4">
                <CAvatar
                  size="xl"
                  style={{ width: '120px', height: '120px' }}
                >
                  {studentDetails.photo ? (
                    <img src={studentDetails.photo} alt="Photo étudiant" className="w-100 h-100 object-cover" />
                  ) : (
                    <CIcon icon={cilUser} size="xxl" className="text-muted" />
                  )}
                </CAvatar>
                <h5 className="mt-3 mb-1">{studentDetails.nomPrenoms}</h5>
                <p className="text-muted">{studentDetails.matricule}</p>
              </div>

              <CListGroup>
              <CListGroupItem>
                <strong>Matricule:</strong> {studentDetails.matricule}
              </CListGroupItem>
              <CListGroupItem>
                <strong>Nom et Prénoms:</strong> {studentDetails.nomPrenoms}
              </CListGroupItem>
              <CListGroupItem>
                <strong>Sexe:</strong> {studentDetails.sexe}
              </CListGroupItem>
              <CListGroupItem>
                <strong>Redoublant:</strong> {studentDetails.redoublant}
              </CListGroupItem>
              <CListGroupItem>
                <strong>Date de naissance:</strong> {studentDetails.dateNaissance}
              </CListGroupItem>
              <CListGroupItem>
                <strong>Filière:</strong> {studentDetails.filiere}
              </CListGroupItem>
              <CListGroupItem>
                <strong>Niveau:</strong> {studentDetails.niveau}
              </CListGroupItem>
              <CListGroupItem>
                <strong>Année:</strong> {studentDetails.annee}
              </CListGroupItem>
              <CListGroupItem>
                <strong>Diplôme d'entrée:</strong> {studentDetails.entryDiploma}
              </CListGroupItem>
              {studentDetails.groupe && (
                <CListGroupItem>
                  <strong>Groupe:</strong> <CBadge color="info">{studentDetails.groupe}</CBadge>
                </CListGroupItem>
              )}
              <CListGroupItem>
                <strong>Email:</strong> {studentDetails.email}
              </CListGroupItem>
              <CListGroupItem>
                <strong>Téléphone:</strong> {studentDetails.telephone}
              </CListGroupItem>
            </CListGroup>
            </>
          ) : (
            <LoadingSpinner message="Chargement des détails de l'étudiant..." />
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" onClick={handleOpenEditModal}>
            Modifier
          </CButton>
          <CButton color="secondary" variant="outline" onClick={() => setModalVisible(false)}>
            Fermer
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modale pour modifier l'étudiant */}
      <CModal visible={editModalVisible} onClose={() => setEditModalVisible(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Modifier l'étudiant</CModalTitle>
        </CModalHeader>
        <CModalBody className="p-4">
          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="lastName">Nom</CFormLabel>
              <CFormInput
                id="lastName"
                value={editForm.last_name || ''}
                onChange={(e) => handleEditFormChange('last_name', e.target.value)}
                placeholder="Nom de famille"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel htmlFor="firstName">Prénom(s)</CFormLabel>
              <CFormInput
                id="firstName"
                value={editForm.first_name || ''}
                onChange={(e) => handleEditFormChange('first_name', e.target.value)}
                placeholder="Prénom(s)"
              />
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="email">Email</CFormLabel>
              <CFormInput
                type="email"
                id="email"
                value={editForm.email || ''}
                onChange={(e) => handleEditFormChange('email', e.target.value)}
                placeholder="email@exemple.com"
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel htmlFor="phone">Téléphone</CFormLabel>
              <CFormInput
                id="phone"
                value={editForm.phone || ''}
                onChange={(e) => handleEditFormChange('phone', e.target.value)}
                placeholder="+225 XX XX XX XX XX"
              />
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="gender">Sexe</CFormLabel>
              <select
                id="gender"
                className="form-select"
                value={editForm.gender || ''}
                onChange={(e) => handleEditFormChange('gender', e.target.value)}
              >
                <option value="">Sélectionner...</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </CCol>
            <CCol md={6}>
              <CFormLabel htmlFor="dateOfBirth">Date de naissance</CFormLabel>
              <CFormInput
                type="date"
                id="dateOfBirth"
                value={editForm.date_of_birth || ''}
                onChange={(e) => handleEditFormChange('date_of_birth', e.target.value)}
              />
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton 
            color="secondary" 
            variant="outline" 
            onClick={() => {
              setEditModalVisible(false)
              setModalVisible(true)
            }}
          >
            Annuler
          </CButton>
          <CButton 
            color="primary" 
            onClick={handleSubmitEdit}
            disabled={editLoading}
          >
            {editLoading ? 'Enregistrement...' : 'Enregistrer'}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modale pour créer des groupes */}
      <CModal visible={groupsModalVisible} onClose={handleCancelGroupCreation} size="lg">
        <CModalHeader>
          <CModalTitle>
            Créer des groupes - Groupe {groups[currentGroupIndex]?.name}
            <CBadge color="info" className="ms-2">
              {allStudentsForGrouping.length - groups.flatMap(g => g.students).length} étudiant(s) restant(s)
            </CBadge>
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="p-4">
          <CAlert color="info" className="mb-3">
            <strong>Classe:</strong> {selectedFiliere} - {selectedNiveau} ({selectedYear})
            <br />
            <strong>Total étudiants:</strong> {allStudentsForGrouping.length}
            <br />
            <small>Sélectionnez les étudiants pour le groupe {groups[currentGroupIndex]?.name}. Les étudiants restants seront automatiquement placés dans le groupe suivant.</small>
          </CAlert>

          {/* Options de sélection groupée */}
          <div className="mb-3">
            <CFormLabel className="fw-semibold">Options de sélection rapide:</CFormLabel>
            <CButtonGroup size="sm" className="d-flex flex-wrap gap-2">
              <CButton color="secondary" variant="outline" onClick={handleSelectAll}>
                Tout sélectionner
              </CButton>
              <CButton color="secondary" variant="outline" onClick={handleDeselectAll}>
                Tout désélectionner
              </CButton>
              <CButton color="secondary" variant="outline" onClick={handleSelectFirst}>
                Premiers N
              </CButton>
              <CButton color="secondary" variant="outline" onClick={handleSelectLast}>
                Derniers N
              </CButton>
              <CButton color="secondary" variant="outline" onClick={handleSelectOneInTwo}>
                Un sur deux
              </CButton>
            </CButtonGroup>
          </div>

          {/* Liste des étudiants disponibles */}
          <div className="mb-3">
            <CFormLabel className="fw-semibold">
              Étudiants disponibles ({allStudentsForGrouping.filter(
                s => !groups.flatMap(g => g.students).map((st: any) => st.id).includes(s.id)
              ).length}):
            </CFormLabel>
            <div className="border rounded p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <CListGroup>
                {allStudentsForGrouping
                  .filter(s => !groups.flatMap(g => g.students).map((st: any) => st.id).includes(s.id))
                  .map((student, index) => (
                    <CListGroupItem key={student.id} className="d-flex align-items-center">
                      <CFormCheck
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                        className="me-3"
                      />
                      <label htmlFor={`student-${student.id}`} className="flex-grow-1 cursor-pointer">
                        <strong>{index + 1}.</strong> {student.nomPrenoms}
                        <small className="text-muted ms-2">({student.matricule})</small>
                      </label>
                    </CListGroupItem>
                  ))}
              </CListGroup>
            </div>
          </div>

          {/* Aperçu des groupes créés */}
          {groups.some(g => g.students.length > 0) && (
            <div className="mt-4">
              <CFormLabel className="fw-semibold">Groupes créés:</CFormLabel>
              <div className="d-flex flex-wrap gap-2">
                {groups.filter(g => g.students.length > 0).map((group) => (
                  <CBadge key={group.name} color="success" className="p-2">
                    Groupe {group.name}: {group.students.length} étudiant(s)
                  </CBadge>
                ))}
              </div>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={handleCancelGroupCreation}>
            Annuler
          </CButton>
          <CButton color="success" onClick={handleValidateGroup}>
            Valider le groupe {groups[currentGroupIndex]?.name} ({selectedStudents.length} sélectionné(s))
          </CButton>
        </CModalFooter>
      </CModal>
    </CCard>
  )
}

export default StudentsList
