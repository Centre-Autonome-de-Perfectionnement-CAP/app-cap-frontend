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
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CImage,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash, cilPeople, cilOptions, cilInfo, cilFile } from '@coreui/icons'
import { useAdminUsers } from '@/hooks/rh'
import SearchableSelect from '@/components/forms/SearchableSelect'
import { openFileInNewTab } from '@/utils/fileViewer'
import { validateIFU, validateRIB } from '@/utils/validation.utils'
import type { AdminUser } from '@/types/rh.types'

const AdminUsers: React.FC = () => {
  const {
    adminUsers,
    roles,
    loading,
    error,
    createAdminUser,
    updateAdminUser,
    deleteAdminUser,
    setError,
  } = useAdminUsers()

  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    rib_number: '',
    ifu_number: '',
    bank: '',
    role_id: '',
    chef_division_type: '' as '' | 'formation_distance' | 'formation_continue',
  })
  const [ribFile, setRibFile] = useState<File | null>(null)
  const [ifuFile, setIfuFile] = useState<File | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)
  const [validationErrors, setValidationErrors] = useState<{ rib?: string; ifu?: string }>({})

  const handleShowModal = (user?: AdminUser) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone || '',
        rib_number: user.rib_number || '',
        ifu_number: user.ifu_number || '',
        bank: user.bank || '',
        role_id: user.roles?.[0]?.id?.toString() || '',
        chef_division_type: user.chef_division_type || '',
      })
      setPhotoPreview(user.photo || null)
    } else {
      setEditingUser(null)
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        rib_number: '',
        ifu_number: '',
        bank: '',
        role_id: '',
        chef_division_type: '',
      })
      setPhotoPreview(null)
    }
    setRibFile(null)
    setIfuFile(null)
    setPhotoFile(null)
    setShowModal(true)
  }

  const handleShowDetails = (user: AdminUser) => {
    setSelectedUser(user)
    setShowDetailsModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setRibFile(null)
    setIfuFile(null)
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPhotoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors: { rib?: string; ifu?: string } = {}
    
    if (formData.rib_number && !validateRIB(formData.rib_number)) {
      errors.rib = 'Le RIB doit contenir entre 22 et 27 caractères alphanumériques'
    }
    
    if (formData.ifu_number && !validateIFU(formData.ifu_number)) {
      errors.ifu = 'Le numéro IFU doit contenir exactement 13 chiffres'
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }
    
    setValidationErrors({})
    
    try {
      const submitData = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value) submitData.append(key, value)
      })
      
      if (ribFile) submitData.append('rib', ribFile)
      if (ifuFile) submitData.append('ifu', ifuFile)
      if (photoFile) submitData.append('photo', photoFile)
      if (!editingUser) submitData.append('password', 'password123')

      if (editingUser) {
        await updateAdminUser(editingUser.id, submitData)
        setAlert({ type: 'success', message: 'Utilisateur mis à jour avec succès!' })
      } else {
        await createAdminUser(submitData)
        setAlert({ type: 'success', message: 'Utilisateur créé avec succès!' })
      }
      handleCloseModal()
      setTimeout(() => setAlert(null), 5000)
    } catch (error: any) {
      setAlert({ type: 'danger', message: error.response?.data?.message || 'Une erreur est survenue' })
      setTimeout(() => setAlert(null), 5000)
    }
  }

  const handleDelete = async (user: AdminUser) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${user.first_name} ${user.last_name} ?`)) {
      try {
        await deleteAdminUser(user.id)
        setAlert({ type: 'success', message: 'Utilisateur supprimé avec succès!' })
        setTimeout(() => setAlert(null), 5000)
      } catch (error) {
        setAlert({ type: 'danger', message: 'Erreur lors de la suppression' })
        setTimeout(() => setAlert(null), 5000)
      }
    }
  }

  const selectedRole = roles.find(r => r.id.toString() === formData.role_id)
  const isResponsableDivision = selectedRole?.slug === 'responsable-division'

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>
                <CIcon icon={cilPeople} className="me-2" />
                Gestion des Utilisateurs Administratifs
              </strong>
              <CButton color="primary" onClick={() => handleShowModal()}>
                <CIcon icon={cilPlus} className="me-2" />
                Nouvel Utilisateur
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

              <CTable hover responsive>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Photo</CTableHeaderCell>
                    <CTableHeaderCell>Nom complet</CTableHeaderCell>
                    <CTableHeaderCell>Email</CTableHeaderCell>
                    <CTableHeaderCell>Téléphone</CTableHeaderCell>
                    <CTableHeaderCell>Banque</CTableHeaderCell>
                    <CTableHeaderCell>RIB</CTableHeaderCell>
                    <CTableHeaderCell>IFU</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {loading ? (
                    <CTableRow>
                      <CTableDataCell colSpan={8} className="text-center">
                        Chargement...
                      </CTableDataCell>
                    </CTableRow>
                  ) : adminUsers.length === 0 ? (
                    <CTableRow>
                      <CTableDataCell colSpan={8} className="text-center text-muted">
                        Aucun utilisateur trouvé
                      </CTableDataCell>
                    </CTableRow>
                  ) : (
                    adminUsers.map((user) => (
                      <CTableRow key={user.id}>
                        <CTableDataCell>
                          {user.photo_url ? (
                            <CImage rounded src={user.photo_url} width={40} height={40} />
                          ) : (
                            <div className="bg-secondary rounded d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                              <CIcon icon={cilPeople} size="lg" className="text-white" />
                            </div>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>{user.first_name} {user.last_name}</CTableDataCell>
                        <CTableDataCell>{user.email}</CTableDataCell>
                        <CTableDataCell>{user.phone || 'N/A'}</CTableDataCell>
                        <CTableDataCell>{user.bank || 'N/A'}</CTableDataCell>
                        <CTableDataCell>
                          {user.rib_url ? (
                            <CButton color="link" size="sm" onClick={() => openFileInNewTab(user.rib_url!)}>
                              <CIcon icon={cilFile} />
                            </CButton>
                          ) : 'N/A'}
                        </CTableDataCell>
                        <CTableDataCell>
                          {user.ifu_url ? (
                            <CButton color="link" size="sm" onClick={() => openFileInNewTab(user.ifu_url!)}>
                              <CIcon icon={cilFile} />
                            </CButton>
                          ) : 'N/A'}
                        </CTableDataCell>
                        <CTableDataCell>
                          <CDropdown>
                            <CDropdownToggle color="ghost" size="sm">
                              <CIcon icon={cilOptions} />
                            </CDropdownToggle>
                            <CDropdownMenu>
                              <CDropdownItem onClick={() => handleShowDetails(user)}>
                                <CIcon icon={cilInfo} className="me-2" />
                                Voir détails
                              </CDropdownItem>
                              <CDropdownItem onClick={() => handleShowModal(user)}>
                                <CIcon icon={cilPencil} className="me-2" />
                                Modifier
                              </CDropdownItem>
                              <CDropdownItem
                                onClick={() => handleDelete(user)}
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

      <CModal size="lg" visible={showModal} onClose={handleCloseModal} backdrop="static">
        <CModalHeader closeButton>
          <CModalTitle>
            {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel Utilisateur Administratif'}
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <div className="mb-4 text-center">
              {photoPreview ? (
                <CImage rounded src={photoPreview} width={120} height={120} className="mb-3" />
              ) : (
                <div className="bg-light rounded d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 120, height: 120 }}>
                  <CIcon icon={cilPeople} size="3xl" className="text-secondary" />
                </div>
              )}
              <div>
                <CFormLabel htmlFor="photo" className="btn btn-sm btn-outline-primary">
                  {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                </CFormLabel>
                <CFormInput
                  type="file"
                  id="photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="d-none"
                />
                <small className="d-block text-muted mt-1">Optionnel</small>
              </div>
            </div>

            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="first_name">Prénom *</CFormLabel>
                  <CFormInput
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="last_name">Nom *</CFormLabel>
                  <CFormInput
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </CCol>
            </CRow>

            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="email">Email *</CFormLabel>
                  <CFormInput
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="phone">Téléphone</CFormLabel>
                  <CFormInput
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </CCol>
            </CRow>

            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="rib_number">Numéro RIB</CFormLabel>
                  <CFormInput
                    id="rib_number"
                    value={formData.rib_number}
                    onChange={(e) => {
                      setFormData({ ...formData, rib_number: e.target.value })
                      if (validationErrors.rib) setValidationErrors({ ...validationErrors, rib: undefined })
                    }}
                    invalid={!!validationErrors.rib}
                  />
                  {validationErrors.rib && <small className="text-danger">{validationErrors.rib}</small>}
                  <small className="text-muted d-block">22 à 27 caractères alphanumériques</small>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="rib_file">Document RIB</CFormLabel>
                  <CFormInput
                    type="file"
                    id="rib_file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setRibFile(e.target.files?.[0] || null)}
                  />
                  <small className="text-muted">PDF, JPG ou PNG</small>
                </div>
              </CCol>
            </CRow>

            <CRow>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="ifu_number">Numéro IFU</CFormLabel>
                  <CFormInput
                    id="ifu_number"
                    value={formData.ifu_number}
                    onChange={(e) => {
                      setFormData({ ...formData, ifu_number: e.target.value })
                      if (validationErrors.ifu) setValidationErrors({ ...validationErrors, ifu: undefined })
                    }}
                    invalid={!!validationErrors.ifu}
                  />
                  {validationErrors.ifu && <small className="text-danger">{validationErrors.ifu}</small>}
                  <small className="text-muted d-block">13 chiffres exactement</small>
                </div>
              </CCol>
              <CCol md={6}>
                <div className="mb-3">
                  <CFormLabel htmlFor="ifu_file">Document IFU</CFormLabel>
                  <CFormInput
                    type="file"
                    id="ifu_file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setIfuFile(e.target.files?.[0] || null)}
                  />
                  <small className="text-muted">PDF, JPG ou PNG</small>
                </div>
              </CCol>
            </CRow>

            <div className="mb-3">
              <CFormLabel htmlFor="bank">Banque</CFormLabel>
              <CFormInput
                id="bank"
                value={formData.bank}
                onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
              />
            </div>

            <SearchableSelect
              id="role_id"
              label="Rôle *"
              value={formData.role_id}
              onChange={(value) => setFormData({ ...formData, role_id: value.toString(), chef_division_type: '' })}
              options={roles.map(r => ({ value: r.id, label: r.name }))}
              placeholder="Sélectionner un rôle"
              required
            />

            {isResponsableDivision && (
              <div className="mt-3 mb-3">
                <CFormLabel htmlFor="chef_division_type">Type de Responsable *</CFormLabel>
                <CFormSelect
                  id="chef_division_type"
                  value={formData.chef_division_type}
                  onChange={(e) => setFormData({ ...formData, chef_division_type: e.target.value as any })}
                  required
                >
                  <option value="">Sélectionner le type</option>
                  <option value="formation_distance">Formation à Distance (FAD)</option>
                  <option value="formation_continue">Formation Continue (FC)</option>
                </CFormSelect>
              </div>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={handleCloseModal}>
              Annuler
            </CButton>
            <CButton color="primary" type="submit">
              {editingUser ? 'Mettre à jour' : 'Créer'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      <CModal size="lg" visible={showDetailsModal} onClose={() => setShowDetailsModal(false)} backdrop="static">
        <CModalHeader closeButton>
          <CModalTitle>Détails de l'Utilisateur</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedUser && (
            <>
              <div className="text-center mb-4">
                {selectedUser.photo_url ? (
                  <CImage rounded src={selectedUser.photo_url} width={100} height={100} />
                ) : (
                  <div className="bg-light rounded d-inline-flex align-items-center justify-content-center" style={{ width: 100, height: 100 }}>
                    <CIcon icon={cilPeople} size="3xl" className="text-secondary" />
                  </div>
                )}
              </div>
              
              <CRow className="mb-3">
                <CCol md={6}>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Nom complet</strong>
                    <span>{selectedUser.first_name} {selectedUser.last_name}</span>
                  </div>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Email</strong>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Téléphone</strong>
                    <span>{selectedUser.phone || 'Non renseigné'}</span>
                  </div>
                </CCol>
                <CCol md={6}>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Banque</strong>
                    <span>{selectedUser.bank || 'Non renseignée'}</span>
                  </div>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Numéro RIB</strong>
                    <span>{selectedUser.rib_number || 'Non renseigné'}</span>
                  </div>
                  <div className="mb-3">
                    <strong className="text-muted d-block mb-1">Numéro IFU</strong>
                    <span>{selectedUser.ifu_number || 'Non renseigné'}</span>
                  </div>
                </CCol>
              </CRow>

              <div className="border-top pt-3">
                <div className="mb-2">
                  <strong className="text-muted d-block mb-1">Date de création</strong>
                  <span>{new Date(selectedUser.created_at).toLocaleString('fr-FR')}</span>
                </div>
                {selectedUser.updated_at && (
                  <div>
                    <strong className="text-muted d-block mb-1">Dernière modification</strong>
                    <span>{new Date(selectedUser.updated_at).toLocaleString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDetailsModal(false)}>
            Fermer
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default AdminUsers
