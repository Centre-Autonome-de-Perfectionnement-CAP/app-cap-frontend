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
  cilBook,
  cilOptions,
  cilSearch,
  cilReload,
} from '@coreui/icons'
import { useTeachingUnits } from '@/hooks/cours'
import type { TeachingUnit } from '@/types/cours.types'

const TeachingUnits: React.FC = () => {
  // Hook personnalisé pour gérer les données et les actions
  const {
    teachingUnits,
    loading,
    error,
    filters,
    createTeachingUnit,
    updateTeachingUnit,
    deleteTeachingUnit,
    updateFilters,
    resetFilters,
    setError
  } = useTeachingUnits()

  // États locaux pour l'interface utilisateur
  const [showModal, setShowModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<TeachingUnit | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)

  const handleShowModal = (unit?: TeachingUnit) => {
    if (unit) {
      setEditingUnit(unit)
      setFormData({
        name: unit.name,
        code: unit.code,
      })
    } else {
      setEditingUnit(null)
      setFormData({
        name: '',
        code: '',
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUnit(null)
    setFormData({
      name: '',
      code: '',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingUnit) {
        // Update existing unit
        await updateTeachingUnit(editingUnit.id, formData)
        setAlert({ type: 'success', message: 'Unité d\'enseignement mise à jour avec succès!' })
      } else {
        // Create new unit
        await createTeachingUnit(formData)
        setAlert({ type: 'success', message: 'Unité d\'enseignement créée avec succès!' })
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

  const handleDelete = async (unit: TeachingUnit) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'UE "${unit.name}" ?`)) {
      try {
        await deleteTeachingUnit(unit.id)
        setAlert({ type: 'success', message: 'Unité d\'enseignement supprimée avec succès!' })
        setTimeout(() => setAlert(null), 5000)
      } catch (error) {
        console.error('Erreur handleDelete:', error)
        setAlert({ type: 'danger', message: 'Erreur lors de la suppression. Veuillez réessayer.' })
        setTimeout(() => setAlert(null), 5000)
      }
    }
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
                <CIcon icon={cilBook} className="me-2" />
                Gestion des Unités d'Enseignement (UE)
              </strong>
              <CButton
                color="primary"
                onClick={() => handleShowModal()}
              >
                <CIcon icon={cilPlus} className="me-2" />
                Nouvelle UE
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
                    placeholder="Rechercher par nom ou code..."
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
                    <CTableHeaderCell>Nb. ECUE</CTableHeaderCell>
                    <CTableHeaderCell>Date de création</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {loading ? (
                    <CTableRow>
                      <CTableDataCell colSpan={5} className="text-center">
                        Chargement...
                      </CTableDataCell>
                    </CTableRow>
                  ) : teachingUnits.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={5} className="text-center text-muted">
                        {searchTerm ? 'Aucune UE ne correspond à votre recherche' : 'Aucune unité d\'enseignement trouvée'}
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    teachingUnits.map((unit) => (
                      <CTableRow key={unit.id}>
                        <CTableDataCell>
                          <CBadge color="primary">{unit.code}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>{unit.name}</CTableDataCell>
                        <CTableDataCell>
                          <CBadge color="info">{unit.course_elements_count || 0}</CBadge>
                        </CTableDataCell>
                        <CTableDataCell>
                          {new Date(unit.created_at).toLocaleDateString('fr-FR')}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CDropdown>
                            <CDropdownToggle color="ghost" size="sm">
                              <CIcon icon={cilOptions} />
                            </CDropdownToggle>
                            <CDropdownMenu>
                              <CDropdownItem
                                onClick={() => handleShowModal(unit)}
                              >
                                <CIcon icon={cilPencil} className="me-2" />
                                Modifier
                              </CDropdownItem>
                              <CDropdownItem
                                onClick={() => handleDelete(unit)}
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

      {/* Modal pour créer/modifier une UE */}
      <CModal visible={showModal} onClose={handleCloseModal}>
        <CModalHeader>
          <CModalTitle>
            {editingUnit ? 'Modifier l\'UE' : 'Nouvelle Unité d\'Enseignement'}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <div className="mb-3">
              <CFormLabel htmlFor="name">Nom de l'UE *</CFormLabel>
              <CFormInput
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex: Mathématiques Générales"
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="code">Code de l'UE *</CFormLabel>
              <CFormInput
                type="text"
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="ex: MATH101"
                required
              />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={handleCloseModal}>
              Annuler
            </CButton>
            <CButton color="primary" type="submit">
              {editingUnit ? 'Mettre à jour' : 'Créer'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default TeachingUnits
