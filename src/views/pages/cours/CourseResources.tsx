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
  CFormTextarea,
  CFormCheck,
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
  cilFolder,
  cilOptions,
  cilSearch,
  cilReload,
  cilCloudDownload,
  cilFile,
} from '@coreui/icons'
import { useCourseResources } from '@/hooks/cours'
import type { CourseResource, CourseElement } from '@/types/cours.types'

const CourseResources: React.FC = () => {
  // Hook personnalisé pour gérer les données et les actions
  const {
    courseResources,
    courseElements,
    loading,
    error,
    resourceTypes,
    createCourseResource,
    updateCourseResource,
    deleteCourseResource,
    updateFilters,
    resetFilters,
    setError,
    getResourceTypeColor,
    formatFileSize
  } = useCourseResources()

  // États locaux pour l'interface utilisateur
  const [showModal, setShowModal] = useState(false)
  const [editingResource, setEditingResource] = useState<CourseResource | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resource_type: '',
    is_public: false,
    course_element_id: '',
    file: null as File | null,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [resourceTypeFilter, setResourceTypeFilter] = useState('')
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)


  const handleShowModal = (resource?: CourseResource) => {
    if (resource) {
      setEditingResource(resource)
      setFormData({
        title: resource.title,
        description: resource.description || '',
        resource_type: resource.resource_type,
        is_public: resource.is_public,
        course_element_id: resource.course_element_id.toString(),
        file: null,
      })
    } else {
      setEditingResource(null)
      setFormData({
        title: '',
        description: '',
        resource_type: '',
        is_public: false,
        course_element_id: '',
        file: null,
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingResource(null)
    setFormData({
      title: '',
      description: '',
      resource_type: '',
      is_public: false,
      course_element_id: '',
      file: null,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const data = {
        ...formData,
        course_element_id: parseInt(formData.course_element_id),
        resource_type: formData.resource_type as 'syllabus' | 'cours' | 'td' | 'tp' | 'examen',
        file: formData.file!,
      }
      
      if (editingResource) {
        // Update existing resource (sans fichier pour l'instant)
        const updateData = { ...formData }
        delete (updateData as any).file
        await updateCourseResource(editingResource.id, updateData)
        setAlert({ type: 'success', message: 'Ressource mise à jour avec succès!' })
      } else {
        // Create new resource
        if (!formData.file) {
          setAlert({ type: 'danger', message: 'Veuillez sélectionner un fichier.' })
          return
        }
        await createCourseResource(data)
        setAlert({ type: 'success', message: 'Ressource créée avec succès!' })
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

  const handleDelete = async (resource: CourseResource) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la ressource "${resource.title}" ?`)) {
      try {
        await deleteCourseResource(resource.id)
        setAlert({ type: 'success', message: 'Ressource supprimée avec succès!' })
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
    updateFilters({ ...getFiltersFromState(), search: value })
  }

  const handleTypeFilterChange = (value: string) => {
    setResourceTypeFilter(value)
    updateFilters({ ...getFiltersFromState(), resource_type: value || undefined })
  }

  const getFiltersFromState = () => ({
    search: searchTerm,
    resource_type: resourceTypeFilter || undefined
  })

  const handleClearFilters = () => {
    setSearchTerm('')
    setResourceTypeFilter('')
    resetFilters()
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>
                <CIcon icon={cilFolder} className="me-2" />
                Gestion des Ressources Pédagogiques
              </strong>
              <CButton
                color="primary"
                onClick={() => handleShowModal()}
              >
                <CIcon icon={cilPlus} className="me-2" />
                Nouvelle Ressource
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
                    placeholder="Rechercher par titre ou cours..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormSelect
                    value={resourceTypeFilter}
                    onChange={(e) => handleTypeFilterChange(e.target.value)}
                  >
                    <option value="">Tous les types</option>
                    {resourceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
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
                    <CTableHeaderCell>Titre</CTableHeaderCell>
                    <CTableHeaderCell>Cours (ECUE)</CTableHeaderCell>
                    <CTableHeaderCell>Type</CTableHeaderCell>
                    <CTableHeaderCell>Fichier</CTableHeaderCell>
                    <CTableHeaderCell>Visibilité</CTableHeaderCell>
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
                  ) : courseResources.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={7} className="text-center text-muted">
                        {searchTerm || resourceTypeFilter ? 'Aucune ressource ne correspond aux filtres' : 'Aucune ressource trouvée'}
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    courseResources.map((resource) => (
                      <CTableRow key={resource.id}>
                        <CTableDataCell>
                          <div>
                            <strong>{resource.title}</strong>
                            {resource.description && (
                              <div className="text-muted small">
                                {resource.description.length > 50 
                                  ? `${resource.description.substring(0, 50)}...`
                                  : resource.description
                                }
                              </div>
                            )}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="info">
                            {resource.course_element?.code}
                          </CBadge>
                          <div className="small text-muted">
                            {resource.course_element?.name}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={getResourceTypeColor(resource.resource_type)}>
                            {resourceTypes.find(t => t.value === resource.resource_type)?.label || resource.resource_type}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          {resource.file_name && (
                            <div>
                              <CIcon icon={cilFile} className="me-1" />
                              <span className="small">{resource.file_name}</span>
                              <div className="text-muted small">
                                {resource.file_size && formatFileSize(resource.file_size)}
                              </div>
                            </div>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CBadge color={resource.is_public ? 'success' : 'secondary'}>
                            {resource.is_public ? 'Public' : 'Privé'}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          {new Date(resource.created_at).toLocaleDateString('fr-FR')}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CDropdown>
                            <CDropdownToggle color="ghost" size="sm">
                              <CIcon icon={cilOptions} />
                            </CDropdownToggle>
                            <CDropdownMenu>
                              <CDropdownItem>
                                <CIcon icon={cilCloudDownload} className="me-2" />
                                Télécharger
                              </CDropdownItem>
                              <CDropdownItem
                                onClick={() => handleShowModal(resource)}
                              >
                                <CIcon icon={cilPencil} className="me-2" />
                                Modifier
                              </CDropdownItem>
                              <CDropdownItem
                                onClick={() => handleDelete(resource)}
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

      {/* Modal pour créer/modifier une ressource */}
      <CModal size="lg" visible={showModal} onClose={handleCloseModal}>
        <CModalHeader>
          <CModalTitle>
            {editingResource ? 'Modifier la Ressource' : 'Nouvelle Ressource Pédagogique'}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <CRow>
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
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="resource_type">Type de ressource *</CFormLabel>
                  <CFormSelect
                    id="resource_type"
                    value={formData.resource_type}
                    onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner un type</option>
                    {resourceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </CFormSelect>
                </div>
              </CCol>
            </CRow>
            <div className="mb-3">
              <CFormLabel htmlFor="title">Titre de la ressource *</CFormLabel>
              <CFormInput
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="ex: Cours d'introduction à l'algèbre"
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="description">Description</CFormLabel>
              <CFormTextarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Description optionnelle de la ressource..."
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="file">
                Fichier {!editingResource && '*'}
              </CFormLabel>
              <CFormInput
                type="file"
                id="file"
                onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                required={!editingResource}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar"
              />
              <div className="form-text">
                Formats acceptés: PDF, Word, PowerPoint, Excel, ZIP, RAR
              </div>
            </div>
            <div className="mb-3">
              <CFormCheck
                id="is_public"
                label="Rendre cette ressource publique"
                checked={formData.is_public}
                onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
              />
              <div className="form-text">
                Les ressources publiques sont accessibles à tous les utilisateurs
              </div>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={handleCloseModal}>
              Annuler
            </CButton>
            <CButton color="primary" type="submit">
              {editingResource ? 'Mettre à jour' : 'Créer'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default CourseResources
