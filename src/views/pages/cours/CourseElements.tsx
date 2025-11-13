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
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPlus,
  cilPencil,
  cilTrash,
  cilBookmark,
  cilOptions,
  cilSearch,
  cilReload,
  cilUser,
} from '@coreui/icons'
import { useCourseElements } from '@/hooks/cours'
import type { CourseElement, TeachingUnit } from '@/types/cours.types'

const CourseElements: React.FC = () => {
  // Hook personnalisé pour gérer les données et les actions
  const {
    courseElements,
    teachingUnits,
    loading,
    error,
    createCourseElement,
    updateCourseElement,
    deleteCourseElement,
    updateFilters,
    resetFilters,
    setError
  } = useCourseElements()

  // États locaux pour l'interface utilisateur
  const [showModal, setShowModal] = useState(false)
  const [editingElement, setEditingElement] = useState<CourseElement | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    credits: 1,
    teaching_unit_id: '',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)

  const handleShowModal = (element?: CourseElement) => {
    if (element) {
      setEditingElement(element)
      setFormData({
        name: element.name,
        code: element.code,
        credits: element.credits,
        teaching_unit_id: element.teaching_unit_id.toString(),
      })
    } else {
      setEditingElement(null)
      setFormData({
        name: '',
        code: '',
        credits: 1,
        teaching_unit_id: '',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingElement(null)
    setFormData({
      name: '',
      code: '',
      credits: 1,
      teaching_unit_id: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const data = {
        ...formData,
        credits: formData.credits,
        teaching_unit_id: parseInt(formData.teaching_unit_id)
      }
      
      if (editingElement) {
        // Update existing element
        await updateCourseElement(editingElement.id, data)
        setAlert({ type: 'success', message: 'Élément de cours mis à jour avec succès!' })
      } else {
        // Create new element
        await createCourseElement(data)
        setAlert({ type: 'success', message: 'Élément de cours créé avec succès!' })
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

  const handleDelete = async (element: CourseElement) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'ECUE "${element.name}" ?`)) {
      try {
        await deleteCourseElement(element.id)
        setAlert({ type: 'success', message: 'Élément de cours supprimé avec succès!' })
        setTimeout(() => setAlert(null), 5000)
      } catch (error) {
        console.error('Erreur handleDelete:', error)
        setAlert({ type: 'danger', message: 'Erreur lors de la suppression. Veuillez réessayer.' })
        setTimeout(() => setAlert(null), 5000)
      }
    }
  }

  const getCreditsColor = (credits: number) => {
    if (credits <= 2) return 'secondary'
    if (credits <= 4) return 'primary'
    return 'success'
  }

  // Mise à jour des filtres lors de la recherche
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    updateFilters({ search: value })
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    resetFilters()
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>
                <CIcon icon={cilBookmark} className="me-2" />
                Gestion des Éléments Constitutifs d'UE (ECUE)
              </strong>
              <CButton
                color="primary"
                onClick={() => handleShowModal()}
              >
                <CIcon icon={cilPlus} className="me-2" />
                Nouvel ECUE
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
                <CCol md={6}>
                  <CFormInput
                    type="text"
                    placeholder="Rechercher par nom, code ou UE..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </CCol>
                <CCol md={6} className="d-flex gap-2">
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
                    <CTableHeaderCell>Code</CTableHeaderCell>
                    <CTableHeaderCell>Nom</CTableHeaderCell>
                    <CTableHeaderCell>UE</CTableHeaderCell>
                    <CTableHeaderCell>Crédits</CTableHeaderCell>
                    <CTableHeaderCell>Professeurs</CTableHeaderCell>
                    <CTableHeaderCell>Ressources</CTableHeaderCell>
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
                  ) : courseElements.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center text-muted">
                        {searchTerm ? 'Aucun ECUE ne correspond à votre recherche' : 'Aucun élément de cours trouvé'}
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    courseElements.map((element) => (
                      <CTableRow key={element.id}>
                        <CTableDataCell>
                          <CBadge color="primary">{element.code}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>{element.name}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="info">{element.teaching_unit?.code}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={getCreditsColor(element.credits)}>
                            {element.credits} ECTS
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="secondary">
                            <CIcon icon={cilUser} className="me-1" size="sm" />
                            {element.professors_count || 0}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="warning">
                            {element.resources_count || 0}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CDropdown>
                            <CDropdownToggle color="ghost" size="sm">
                              <CIcon icon={cilOptions} />
                            </CDropdownToggle>
                            <CDropdownMenu>
                              <CDropdownItem
                                onClick={() => handleShowModal(element)}
                              >
                                <CIcon icon={cilPencil} className="me-2" />
                                Modifier
                              </CDropdownItem>
                              <CDropdownItem
                                onClick={() => handleDelete(element)}
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

      {/* Modal pour créer/modifier un ECUE */}
      <CModal visible={showModal} onClose={handleCloseModal}>
        <CModalHeader>
          <CModalTitle>
            {editingElement ? 'Modifier l\'ECUE' : 'Nouvel Élément Constitutif d\'UE'}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <div className="mb-3">
              <CFormLabel htmlFor="teaching_unit_id">Unité d'Enseignement *</CFormLabel>
              <CFormSelect
                id="teaching_unit_id"
                value={formData.teaching_unit_id}
                onChange={(e) => setFormData({ ...formData, teaching_unit_id: e.target.value })}
                required
              >
                <option value="">Sélectionner une UE</option>
                {teachingUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code} - {unit.name}
                  </option>
                ))}
              </CFormSelect>
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="name">Nom de l'ECUE *</CFormLabel>
              <CFormInput
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: Algèbre Linéaire"
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="code">Code de l'ECUE *</CFormLabel>
              <CFormInput
                type="text"
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="ex: MATH101-ALG"
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="credits">Nombre de crédits ECTS *</CFormLabel>
              <CFormInput
                type="number"
                id="credits"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 1 })}
                min="1"
                max="10"
                required
              />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={handleCloseModal}>
              Annuler
            </CButton>
            <CButton color="primary" type="submit">
              {editingElement ? 'Mettre à jour' : 'Créer'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default CourseElements
