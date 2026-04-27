import React, { useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CForm,
  CFormInput,
  CFormSelect,
  CAlert,
  CBadge,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPlus,
  cilPencil,
  cilTrash,
  cilCalendar,
  cilOptions,
  cilSearch,
  cilReload,
  cilUser,
  cilSchool,
} from '@coreui/icons'
import { usePrograms } from '@/hooks/cours'
import SearchableSelect from '@/components/forms/SearchableSelect'
import CoursService from '@/services/cours.service'
import type { Program } from '@/types/cours.types'

const Programs: React.FC = () => {
  // Hook personnalisé pour gérer les données et les actions
  const {
    programs,
    classGroups,
    courseElementProfessors,
    loading,
    error,
    createProgram,
    updateProgram,
    deleteProgram,
    updateFilters,
    resetFilters,
    setError
  } = usePrograms()

  // États locaux pour l'interface utilisateur
  const [showModal, setShowModal] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [formData, setFormData] = useState({
    class_group_id: '',
    course_element_professor_id: '',
    semester: '1',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)


  const handleShowModal = (program?: Program) => {
    if (program) {
      setEditingProgram(program)
      setFormData({
        class_group_id: program.class_group_id.toString(),
        course_element_professor_id: program.course_element_professor_id.toString(),
        semester: (program as any).semester?.toString() || '1',
      })
    } else {
      setEditingProgram(null)
      setFormData({
        class_group_id: '',
        course_element_professor_id: '',
        semester: '1',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProgram(null)
    setFormData({
      class_group_id: '',
      course_element_professor_id: '',
      semester: '1',
    })
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingProgram) {
        const data = {
          weighting: editingProgram.weighting,
        }
        await updateProgram(editingProgram.id, data)
        setAlert({ type: 'success', message: 'Programme mis à jour avec succès!' })
      } else {
        const selectedClass = classGroups.find(g => g.id === parseInt(formData.class_group_id))
        const data = {
          class_group_id: parseInt(formData.class_group_id),
          course_element_professor_id: parseInt(formData.course_element_professor_id),
          academic_year_id: selectedClass?.academic_year?.id || 1,
          semester: parseInt(formData.semester),
          weighting: {},
        }
        await createProgram(data)
        setAlert({ type: 'success', message: 'Programme créé avec succès!' })
      }
      handleCloseModal()
      setTimeout(() => setAlert(null), 5000)
    } catch (error) {
      console.error('Erreur handleSubmit:', error)
      setAlert({ type: 'danger', message: 'Une erreur est survenue. Veuillez réessayer.' })
      setTimeout(() => setAlert(null), 5000)
    }
  }

  const handleDelete = async (program: Program) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ce programme ?`)) {
      try {
        await deleteProgram(program.id)
        setAlert({ type: 'success', message: 'Programme supprimé avec succès!' })
        setTimeout(() => setAlert(null), 5000)
      } catch (error) {
        console.error('Erreur handleDelete:', error)
        setAlert({ type: 'danger', message: 'Erreur lors de la suppression. Veuillez réessayer.' })
        setTimeout(() => setAlert(null), 5000)
      }
    }
  }

  const handleRenewProgram = async (program: Program) => {
    // TODO: Implémenter avec SweetAlert2 quand disponible
    const confirmed = window.confirm(
      `Voulez-vous reconduire ce programme pour la prochaine année académique ?\n\n` +
      `Classe: ${program.class_group?.department?.name} - Niveau ${program.class_group?.study_level}\n` +
      `Cours: ${program.course_element_professor?.course_element?.name}\n` +
      `Professeur: ${program.course_element_professor?.professor?.full_name}`
    )

    if (confirmed) {
      try {
        // TODO: Décommenter quand la logique backend sera implémentée
        await CoursService.renewProgram(program.id)
        setAlert({ 
          type: 'success', 
          message: 'Programme reconduit avec succès pour la prochaine année académique!' 
        })
        setTimeout(() => setAlert(null), 5000)
      } catch (error: any) {
        console.error('Erreur handleRenewProgram:', error)
        const errorMessage = error?.response?.data?.message || 'Erreur lors de la reconduction. Veuillez réessayer.'
        setAlert({ 
          type: 'danger', 
          message: errorMessage
        })
        setTimeout(() => setAlert(null), 5000)
      }
    }
  }

  // Gestion des filtres
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    updateFilters({ search: value })
  }

  const handleClassFilterChange = (value: string) => {
    setClassFilter(value)
    updateFilters({ class_group_id: value ? parseInt(value) : undefined })
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setClassFilter('')
    resetFilters()
  }

  // Fonction locale pour le rendu des badges (différente du hook)
  const renderWeightingBadgesLocal = (weighting: { [key: string]: number }) => {
    return Object.entries(weighting)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => (
        <CBadge key={key} color="info" className="me-1">
          {key}: {value}%
        </CBadge>
      ))
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>
                <CIcon icon={cilCalendar} className="me-2" />
                Gestion des Programmes de Cours
              </strong>
              <CButton
                color="primary"
                onClick={() => handleShowModal()}
              >
                <CIcon icon={cilPlus} className="me-2" />
                Nouveau Programme
              </CButton>
            </CCardHeader>
            <CCardBody>
              {alert && (
                <CAlert color={alert.type} dismissible onClose={() => setAlert(null)}>
                  {alert.message}
                </CAlert>
              )}
              
              {error && (
                <CAlert color="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </CAlert>
              )}

              <CRow className="mb-3">
                <CCol md={4}>
                  <CFormInput
                    type="text"
                    placeholder="Rechercher par cours, professeur ou classe..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={classFilter}
                    onChange={(e) => handleClassFilterChange(e.target.value)}
                  >
                    <option value="">Toutes les classes</option>
                    {(classGroups || []).map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.group_name || `Groupe ${group.id}`}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={4} className="d-flex gap-2">
                  <CButton
                    color="outline-secondary"
                    onClick={handleClearFilters}
                  >
                    <CIcon icon={cilSearch} className="me-2" />
                    Effacer
                  </CButton>
                  <CButton
                    color="outline-primary"
                    onClick={() => window.location.reload()}
                  >
                    <CIcon icon={cilReload} className="me-2" />
                    Actualiser
                  </CButton>
                </CCol>
              </CRow>

              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Classe</CTableHeaderCell>
                    <CTableHeaderCell>Cours (ECUE)</CTableHeaderCell>
                    <CTableHeaderCell>Professeur</CTableHeaderCell>
                    <CTableHeaderCell>Semestre</CTableHeaderCell>
                    <CTableHeaderCell>Statut</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {loading ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center">
                        Chargement...
                      </CTableDataCell>
                    </CTableRow>
                  ) : programs.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center text-muted">
                        {searchTerm || classFilter ? 'Aucun programme ne correspond aux filtres' : 'Aucun programme trouvé'}
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    programs.map((program) => (
                      <CTableRow key={program.id}>
                        <CTableDataCell>
                          <CBadge color="primary">
                            <CIcon icon={cilSchool} className="me-1" size="sm" />
                            {program.class_group?.department?.name} - Niveau {program.class_group?.study_level} {(program.class_group as any)?.group_name ? `(${(program.class_group as any).group_name})` : ''}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div>
                            <CBadge color="info">{program.course_element_professor?.course_element?.code}</CBadge>
                            <div className="small text-muted">
                              {program.course_element_professor?.course_element?.name}
                            </div>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="success">
                            <CIcon icon={cilUser} className="me-1" size="sm" />
                            {program.course_element_professor?.professor?.full_name}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={(program as any).semester === 1 ? "warning" : "info"}>
                            {(program as any).semester === 1 ? 'Semestre Impair' : 'Semestre Pair'}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          {(program.academic_year as any)?.is_current ? (
                            <CBadge color="success">Actif</CBadge>
                          ) : (
                            <CBadge color="secondary">Archivé</CBadge>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          {new Date(program.created_at).toLocaleDateString('fr-FR')}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CDropdown>
                            <CDropdownToggle color="ghost" size="sm">
                              <CIcon icon={cilOptions} />
                            </CDropdownToggle>
                            <CDropdownMenu>
                              <CDropdownItem
                                onClick={() => handleShowModal(program)}
                              >
                                <CIcon icon={cilPencil} className="me-2" />
                                Modifier
                              </CDropdownItem>
                              {(program.academic_year as any)?.is_current && (
                                <CDropdownItem
                                  onClick={() => handleRenewProgram(program)}
                                  className="text-primary"
                                >
                                  <CIcon icon={cilReload} className="me-2" />
                                  Reconduire
                                </CDropdownItem>
                              )}
                              <CDropdownItem
                                onClick={() => handleDelete(program)}
                                className="text-danger"
                              >
                                <CIcon icon={cilTrash} className="me-2" />
                                Supprimer
                              </CDropdownItem>
                            </CDropdownMenu>
                          </CDropdown>
                        </CTableDataCell>
                      </CTableRow>
                    ))
                  )}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Modal pour créer/modifier un programme */}
      <CModal size="lg" visible={showModal} onClose={handleCloseModal}>
        <CModalHeader>
          <CModalTitle>
            {editingProgram ? 'Modifier le Programme' : 'Nouveau Programme de Cours'}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <SearchableSelect
              id="class_group_id"
              label="Classe"
              value={formData.class_group_id}
              onChange={(value) => setFormData({ ...formData, class_group_id: value.toString() })}
              options={classGroups.map(g => ({ value: g.id, label: g.group_name || `Groupe ${g.id}` }))}
              placeholder="Sélectionner une classe"
              required
            />
            <SearchableSelect
              id="course_element_professor_id"
              label="Association Matière-Professeur"
              value={formData.course_element_professor_id}
              onChange={(value) => setFormData({ ...formData, course_element_professor_id: value.toString() })}
              options={(courseElementProfessors || []).map(a => ({
                value: a.id,
                label: `${a.course_element?.code} - ${a.course_element?.name} (${a.professor?.full_name})`
              }))}
              placeholder="Sélectionner une association"
              required
            />
            <div className="mb-3">
              <label htmlFor="semester" className="form-label">Semestre</label>
              <CFormSelect
                id="semester"
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                required
              >
                <option value="1">Semestre Impair</option>
                <option value="2">Semestre Pair</option>
              </CFormSelect>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={handleCloseModal}>
              Annuler
            </CButton>
            <CButton color="primary" type="submit">
              {editingProgram ? 'Mettre à jour' : 'Créer'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default Programs
