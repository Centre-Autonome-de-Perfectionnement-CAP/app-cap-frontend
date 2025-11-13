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
  CFormLabel,
  CFormSelect,
  CAlert,
  CBadge,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CInputGroup,
  CInputGroupText,
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
import type { Program, CourseElement, Professor, ClassGroup } from '@/types/cours.types'

const Programs: React.FC = () => {
  // Hook personnalisé pour gérer les données et les actions
  const {
    programs,
    courseElements,
    professors,
    classGroups,
    loading,
    error,
    createProgram,
    updateProgram,
    deleteProgram,
    updateFilters,
    resetFilters,
    setError,
    validateWeighting,
    getTotalWeighting,
    renderWeightingBadges
  } = usePrograms()

  // États locaux pour l'interface utilisateur
  const [showModal, setShowModal] = useState(false)
  const [editingProgram, setEditingProgram] = useState<Program | null>(null)
  const [formData, setFormData] = useState({
    class_group_id: '',
    course_element_id: '',
    professor_id: '',
    weighting: {
      CC: 0,
      TP: 0,
      PROJET: 0,
      EXAMEN: 0,
    },
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)


  const handleShowModal = (program?: Program) => {
    if (program) {
      setEditingProgram(program)
      setFormData({
        class_group_id: program.class_group_id.toString(),
        course_element_id: program.course_element?.id?.toString() || '',
        professor_id: program.professor?.id?.toString() || '',
        weighting: { ...program.weighting },
      })
    } else {
      setEditingProgram(null)
      setFormData({
        class_group_id: '',
        course_element_id: '',
        professor_id: '',
        weighting: {
          CC: 0,
          TP: 0,
          PROJET: 0,
          EXAMEN: 0,
        },
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProgram(null)
    setFormData({
      class_group_id: '',
      course_element_id: '',
      professor_id: '',
      weighting: {
        CC: 0,
        TP: 0,
        PROJET: 0,
        EXAMEN: 0,
      },
    })
  }

  const handleWeightingChange = (key: string, value: number) => {
    setFormData({
      ...formData,
      weighting: {
        ...formData.weighting,
        [key]: value,
      },
    })
  }

  const getTotalWeighting = () => {
    return Object.values(formData.weighting).reduce((sum, value) => sum + value, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const total = getTotalWeighting(formData.weighting)
    if (total !== 100) {
      setAlert({ 
        type: 'danger', 
        message: `La somme des pondérations doit être égale à 100% (actuellement: ${total}%)` 
      })
      setTimeout(() => setAlert(null), 5000)
      return
    }
    
    try {
      const data = {
        class_group_id: parseInt(formData.class_group_id),
        course_element_professor_id: 1, // TODO: Gérer la relation course_element + professor
        weighting: formData.weighting,
      }
      
      if (editingProgram) {
        // Update existing program
        await updateProgram(editingProgram.id, { weighting: formData.weighting })
        setAlert({ type: 'success', message: 'Programme mis à jour avec succès!' })
      } else {
        // Create new program
        await createProgram(data)
        setAlert({ type: 'success', message: 'Programme créé avec succès!' })
      }
      handleCloseModal()
      
      // Auto-hide alert after 5 seconds
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
                    {classGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
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
                    <CTableHeaderCell>Pondération</CTableHeaderCell>
                    <CTableHeaderCell>Date</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {loading ? (
                    <CTableRow>
                      <CTableDataCell colSpan={6} className="text-center">
                        Chargement...
                      </CTableDataCell>
                    </CTableRow>
                  ) : programs.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={6} className="text-center text-muted">
                        {searchTerm || classFilter ? 'Aucun programme ne correspond aux filtres' : 'Aucun programme trouvé'}
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    programs.map((program) => (
                      <CTableRow key={program.id}>
                        <CTableDataCell>
                          <CBadge color="primary">
                            <CIcon icon={cilSchool} className="me-1" size="sm" />
                            {program.class_group?.name}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div>
                            <CBadge color="info">{program.course_element?.code}</CBadge>
                            <div className="small text-muted">
                              {program.course_element?.name}
                            </div>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="success">
                            <CIcon icon={cilUser} className="me-1" size="sm" />
                            {program.professor?.name}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          {renderWeightingBadgesLocal(program.weighting)}
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
            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="class_group_id">Classe *</CFormLabel>
                  <CFormSelect
                    id="class_group_id"
                    value={formData.class_group_id}
                    onChange={(e) => setFormData({ ...formData, class_group_id: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner une classe</option>
                    {classGroups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </CFormSelect>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="course_element_id">Cours (ECUE) *</CFormLabel>
                  <CFormSelect
                    id="course_element_id"
                    value={formData.course_element_id}
                    onChange={(e) => setFormData({ ...formData, course_element_id: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner un cours</option>
                    {courseElements.map((element) => (
                      <option key={element.id} value={element.id}>
                        {element.code} - {element.name}
                      </option>
                    ))}
                  </CFormSelect>
                </div>
              </CCol>
            </CRow>
            <div className="mb-3">
              <CFormLabel htmlFor="professor_id">Professeur *</CFormLabel>
              <CFormSelect
                id="professor_id"
                value={formData.professor_id}
                onChange={(e) => setFormData({ ...formData, professor_id: e.target.value })}
                required
              >
                <option value="">Sélectionner un professeur</option>
                {professors.map((professor) => (
                  <option key={professor.id} value={professor.id}>
                    {professor.name}
                  </option>
                ))}
              </CFormSelect>
            </div>
            
            <div className="mb-3">
              <CFormLabel>Pondération des évaluations *</CFormLabel>
              <div className="text-muted small mb-2">
                La somme doit être égale à 100%
              </div>
              <CRow>
                <CCol md={6}>
                  <CInputGroup className="mb-2">
                    <CInputGroupText>CC</CInputGroupText>
                    <CFormInput
                      type="number"
                      value={formData.weighting.CC}
                      onChange={(e) => handleWeightingChange('CC', parseInt(e.target.value) || 0)}
                      min="0"
                      max="100"
                    />
                    <CInputGroupText>%</CInputGroupText>
                  </CInputGroup>
                </CCol>
                <CCol md={6}>
                  <CInputGroup className="mb-2">
                    <CInputGroupText>TP</CInputGroupText>
                    <CFormInput
                      type="number"
                      value={formData.weighting.TP}
                      onChange={(e) => handleWeightingChange('TP', parseInt(e.target.value) || 0)}
                      min="0"
                      max="100"
                    />
                    <CInputGroupText>%</CInputGroupText>
                  </CInputGroup>
                </CCol>
              </CRow>
              <CRow>
                <CCol md={6}>
                  <CInputGroup className="mb-2">
                    <CInputGroupText>PROJET</CInputGroupText>
                    <CFormInput
                      type="number"
                      value={formData.weighting.PROJET}
                      onChange={(e) => handleWeightingChange('PROJET', parseInt(e.target.value) || 0)}
                      min="0"
                      max="100"
                    />
                    <CInputGroupText>%</CInputGroupText>
                  </CInputGroup>
                </CCol>
                <CCol md={6}>
                  <CInputGroup className="mb-2">
                    <CInputGroupText>EXAMEN</CInputGroupText>
                    <CFormInput
                      type="number"
                      value={formData.weighting.EXAMEN}
                      onChange={(e) => handleWeightingChange('EXAMEN', parseInt(e.target.value) || 0)}
                      min="0"
                      max="100"
                    />
                    <CInputGroupText>%</CInputGroupText>
                  </CInputGroup>
                </CCol>
              </CRow>
              <div className="text-end">
                <CBadge 
                  color={getTotalWeighting() === 100 ? 'success' : 'danger'}
                  className="fs-6"
                >
                  Total: {getTotalWeighting()}%
                </CBadge>
              </div>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={handleCloseModal}>
              Annuler
            </CButton>
            <CButton 
              color="primary" 
              type="submit"
              disabled={getTotalWeighting() !== 100}
            >
              {editingProgram ? 'Mettre à jour' : 'Créer'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default Programs
