import React, { useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea,
  CFormCheck,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilTrash, cilPlus } from '@coreui/icons'
import { useBuildings } from '@/hooks/emploi-du-temps'
import type { CreateBuildingRequest, Building } from '@/types/emploi-du-temps.types'

const Buildings: React.FC = () => {
  const { buildings, loading, createBuilding, updateBuilding, deleteBuilding } = useBuildings()
  const [showModal, setShowModal] = useState(false)
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null)
  const [formData, setFormData] = useState<CreateBuildingRequest>({
    name: '',
    code: '',
    address: '',
    description: '',
    is_active: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingBuilding) {
        await updateBuilding(editingBuilding.id, formData)
      } else {
        await createBuilding(formData)
      }
      setShowModal(false)
      resetForm()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleEdit = (building: Building) => {
    setEditingBuilding(building)
    setFormData({
      name: building.name,
      code: building.code,
      address: building.address || '',
      description: building.description || '',
      is_active: building.is_active,
    })
    setShowModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      address: '',
      description: '',
      is_active: true,
    })
    setEditingBuilding(null)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    resetForm()
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Gestion des Bâtiments</strong>
              <CButton
                color="primary"
                onClick={() => setShowModal(true)}
              >
                <CIcon icon={cilPlus} className="me-2" />
                Nouveau Bâtiment
              </CButton>
            </CCardHeader>
            <CCardBody>
              {loading ? (
                <div className="text-center p-4">
                  <CSpinner color="primary" />
                </div>
              ) : (
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Code</CTableHeaderCell>
                      <CTableHeaderCell>Nom</CTableHeaderCell>
                      <CTableHeaderCell>Adresse</CTableHeaderCell>
                      <CTableHeaderCell>Statut</CTableHeaderCell>
                      <CTableHeaderCell>Salles</CTableHeaderCell>
                      <CTableHeaderCell>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {buildings.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={6} className="text-center">
                          Aucun bâtiment trouvé
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      buildings.map((building) => (
                        <CTableRow key={building.id}>
                          <CTableDataCell>
                            <strong>{building.code}</strong>
                          </CTableDataCell>
                          <CTableDataCell>{building.name}</CTableDataCell>
                          <CTableDataCell>{building.address || '-'}</CTableDataCell>
                          <CTableDataCell>
                            <CBadge color={building.is_active ? 'success' : 'secondary'}>
                              {building.is_active ? 'Actif' : 'Inactif'}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell>{building.rooms_count || 0}</CTableDataCell>
                          <CTableDataCell>
                            <CButton
                              color="info"
                              variant="ghost"
                              size="sm"
                              className="me-2"
                              onClick={() => handleEdit(building)}
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>
                            <CButton
                              color="danger"
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteBuilding(building.id)}
                            >
                              <CIcon icon={cilTrash} />
                            </CButton>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    )}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Modal Formulaire */}
      <CModal visible={showModal} onClose={handleCloseModal} size="lg">
        <CModalHeader>
          <CModalTitle>
            {editingBuilding ? 'Modifier le Bâtiment' : 'Nouveau Bâtiment'}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <div className="mb-3">
              <CFormLabel htmlFor="name">Nom *</CFormLabel>
              <CFormInput
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="code">Code *</CFormLabel>
              <CFormInput
                type="text"
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="address">Adresse</CFormLabel>
              <CFormInput
                type="text"
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="description">Description</CFormLabel>
              <CFormTextarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="mb-3">
              <CFormCheck
                id="is_active"
                label="Actif"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={handleCloseModal}>
              Annuler
            </CButton>
            <CButton color="primary" type="submit" disabled={loading}>
              {loading ? <CSpinner size="sm" /> : editingBuilding ? 'Mettre à jour' : 'Créer'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default Buildings
