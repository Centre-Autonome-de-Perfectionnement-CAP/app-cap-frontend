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
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash, cilPeople, cilOptions, cilInfo, cilFile } from '@coreui/icons'
import { useAdminUsers } from '@/hooks/rh'
import SearchableSelect from '@/components/forms/SearchableSelect'
import { friendlyError } from '@/components/common/ActionResult'
import { openFileInNewTab } from '@/utils/fileViewer'
import { validateIFU, validateRIB } from '@/utils/validation.utils'
import type { AdminUser } from '@/types/rh.types'

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  rib_number: '',
  ifu_number: '',
  bank: '',
  role_id: '',
  chef_division_type: '' as '' | 'formation_distance' | 'formation_continue',
}

const Req = () => <span className="text-danger ms-1">*</span>

/** Photo de l'utilisateur, ou une pastille neutre. */
const Avatar = ({ url, size = 40 }: { url?: string | null; size?: number }) => (
  url
    ? <CImage rounded src={url} width={size} height={size} style={{ objectFit: 'cover', flexShrink: 0 }} alt="" />
    : (
      <div className="bg-secondary-subtle rounded d-flex align-items-center justify-content-center" style={{ width: size, height: size, flexShrink: 0 }}>
        <CIcon icon={cilPeople} className="text-secondary" />
      </div>
    )
)

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
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [ribFile, setRibFile] = useState<File | null>(null)
  const [ifuFile, setIfuFile] = useState<File | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [alert, setAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null)
  const [validationErrors, setValidationErrors] = useState<{ rib?: string; ifu?: string }>({})
  const [saving, setSaving] = useState(false)

  const flash = (type: 'success' | 'danger', message: string) => {
    setAlert({ type, message })
    setTimeout(() => setAlert(null), 5000)
  }

  const set = (key: keyof typeof EMPTY_FORM, value: string) => setFormData(f => ({ ...f, [key]: value }))

  const handleShowModal = (user?: AdminUser) => {
    setEditingUser(user ?? null)
    setFormData(user ? {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone || '',
      rib_number: user.rib_number || '',
      ifu_number: user.ifu_number || '',
      bank: user.bank || '',
      role_id: user.roles?.[0]?.id?.toString() || '',
      chef_division_type: user.chef_division_type || '',
    } : EMPTY_FORM)
    setPhotoPreview(user?.photo_url || null)
    setRibFile(null)
    setIfuFile(null)
    setPhotoFile(null)
    setValidationErrors({})
    setShowModal(true)
  }

  const handleShowDetails = (user: AdminUser) => {
    setSelectedUser(user)
    setShowDetailsModal(true)
  }

  const handleCloseModal = () => {
    if (saving) return
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
      reader.onloadend = () => setPhotoPreview(reader.result as string)
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

    // Le mot de passe est généré par le serveur à la création.
    const submitData = new FormData()
    Object.entries(formData).forEach(([key, value]) => {
      if (value) submitData.append(key, value)
    })
    if (ribFile) submitData.append('rib', ribFile)
    if (ifuFile) submitData.append('ifu', ifuFile)
    if (photoFile) submitData.append('photo', photoFile)

    setSaving(true)
    try {
      if (editingUser) {
        await updateAdminUser(editingUser.id, submitData)
        flash('success', 'Utilisateur mis à jour.')
      } else {
        await createAdminUser(submitData)
        flash('success', 'Utilisateur créé.')
      }
      setSaving(false)
      handleCloseModal()
    } catch (err) {
      setSaving(false)
      flash('danger', friendlyError(err))
    }
  }

  const handleDelete = async (user: AdminUser) => {
    if (window.confirm(`Supprimer ${user.first_name} ${user.last_name} ?`)) {
      try {
        await deleteAdminUser(user.id)
        flash('success', 'Utilisateur supprimé.')
      } catch (err) {
        flash('danger', friendlyError(err))
      }
    }
  }

  const selectedRole = roles.find(r => r.id.toString() === formData.role_id)
  const isResponsableDivision = selectedRole?.slug === 'responsable-division'
  const roleOf = (user: AdminUser) => user.roles?.[0]?.name

  const actions = (user: AdminUser) => (
    <CDropdown alignment="end">
      <CDropdownToggle color="ghost" size="sm" caret={false} aria-label={`Actions pour ${user.first_name} ${user.last_name}`}>
        <CIcon icon={cilOptions} />
      </CDropdownToggle>
      <CDropdownMenu>
        <CDropdownItem as="button" onClick={() => handleShowDetails(user)}>
          <CIcon icon={cilInfo} className="me-2" />Voir les détails
        </CDropdownItem>
        <CDropdownItem as="button" onClick={() => handleShowModal(user)}>
          <CIcon icon={cilPencil} className="me-2" />Modifier
        </CDropdownItem>
        <CDropdownItem as="button" onClick={() => handleDelete(user)} className="text-danger">
          <CIcon icon={cilTrash} className="me-2" />Supprimer
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )

  const docs = (user: AdminUser) => (
    <div className="d-flex gap-1">
      {user.rib_url && <CButton color="light" size="sm" onClick={() => openFileInNewTab(user.rib_url!)}><CIcon icon={cilFile} className="me-1" />RIB</CButton>}
      {user.ifu_url && <CButton color="light" size="sm" onClick={() => openFileInNewTab(user.ifu_url!)}><CIcon icon={cilFile} className="me-1" />IFU</CButton>}
      {!user.rib_url && !user.ifu_url && <span className="text-body-secondary">-</span>}
    </div>
  )

  return (
    <>
      <CCard className="mb-4">
        <CCardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-2">
          <strong className="d-flex align-items-center">
            <CIcon icon={cilPeople} className="me-2" />
            Utilisateurs administratifs
          </strong>
          <CButton color="primary" className="flex-grow-1 flex-sm-grow-0" onClick={() => handleShowModal()}>
            <CIcon icon={cilPlus} className="me-2" />
            Nouvel utilisateur
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

          {loading ? (
            <div className="text-center py-4"><CSpinner size="sm" color="primary" /></div>
          ) : adminUsers.length === 0 ? (
            <p className="text-center text-body-secondary py-4 mb-0">Aucun utilisateur.</p>
          ) : (
            <>
              {/* Ordinateur : tableau */}
              <div className="d-none d-lg-block">
                <CTable hover responsive align="middle">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Utilisateur</CTableHeaderCell>
                      <CTableHeaderCell>Rôle</CTableHeaderCell>
                      <CTableHeaderCell>Téléphone</CTableHeaderCell>
                      <CTableHeaderCell>Banque</CTableHeaderCell>
                      <CTableHeaderCell>Documents</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {adminUsers.map(user => (
                      <CTableRow key={user.id}>
                        <CTableDataCell>
                          <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                            <Avatar url={user.photo_url} />
                            <div style={{ minWidth: 0 }}>
                              <div className="fw-semibold text-truncate">{user.first_name} {user.last_name}</div>
                              <div className="small text-body-secondary text-truncate">{user.email}</div>
                            </div>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>{roleOf(user) || '-'}</CTableDataCell>
                        <CTableDataCell>{user.phone || '-'}</CTableDataCell>
                        <CTableDataCell>{user.bank || '-'}</CTableDataCell>
                        <CTableDataCell>{docs(user)}</CTableDataCell>
                        <CTableDataCell className="text-end">{actions(user)}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </div>

              {/* Téléphone et tablette : une carte par utilisateur */}
              <div className="d-lg-none d-flex flex-column gap-2">
                {adminUsers.map(user => (
                  <div key={user.id} className="border rounded-3 p-3">
                    <div className="d-flex align-items-start gap-2">
                      <Avatar url={user.photo_url} size={44} />
                      <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="fw-semibold" style={{ overflowWrap: 'anywhere' }}>{user.first_name} {user.last_name}</div>
                        {roleOf(user) && <div className="small text-primary fw-semibold">{roleOf(user)}</div>}
                        <div className="small text-body-secondary" style={{ overflowWrap: 'anywhere' }}>{user.email}</div>
                        {user.phone && <div className="small text-body-secondary">{user.phone}</div>}
                      </div>
                      {actions(user)}
                    </div>
                    {(user.rib_url || user.ifu_url) && <div className="mt-2">{docs(user)}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </CCardBody>
      </CCard>

      <CModal size="lg" fullscreen="md" scrollable visible={showModal} onClose={handleCloseModal} backdrop="static">
        <CModalHeader closeButton={!saving}>
          <CModalTitle>{editingUser ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit} className="d-flex flex-column" style={{ minHeight: 0, flex: 1, overflow: 'hidden' }}>
          <CModalBody>
            <div className="d-flex align-items-center gap-3 mb-4">
              <Avatar url={photoPreview} size={72} />
              <div>
                <CFormLabel htmlFor="photo" className="btn btn-sm btn-outline-primary mb-1">
                  {photoPreview ? 'Changer la photo' : 'Ajouter une photo'}
                </CFormLabel>
                <CFormInput type="file" id="photo" accept="image/jpeg,image/png" onChange={handlePhotoChange} className="d-none" />
                <div className="small text-body-secondary">Facultatif · JPG ou PNG</div>
              </div>
            </div>

            <h6 className="text-body-secondary text-uppercase small fw-semibold mb-2">Identité</h6>
            <CRow className="g-3 mb-4">
              <CCol xs={12} md={6}>
                <CFormLabel htmlFor="first_name">Prénom<Req /></CFormLabel>
                <CFormInput id="first_name" value={formData.first_name} onChange={e => set('first_name', e.target.value)} required
                  placeholder="Exemple : Koffi" autoComplete="off" />
              </CCol>
              <CCol xs={12} md={6}>
                <CFormLabel htmlFor="last_name">Nom<Req /></CFormLabel>
                <CFormInput id="last_name" value={formData.last_name} onChange={e => set('last_name', e.target.value)} required
                  placeholder="Exemple : ADJOVI" autoComplete="off" />
              </CCol>
              <CCol xs={12} md={6}>
                <CFormLabel htmlFor="email">Email<Req /></CFormLabel>
                <CFormInput type="email" id="email" value={formData.email} onChange={e => set('email', e.target.value)} required
                  placeholder="Exemple : k.adjovi@gmail.com" autoComplete="off" />
              </CCol>
              <CCol xs={12} md={6}>
                <CFormLabel htmlFor="phone">Téléphone</CFormLabel>
                <CFormInput type="tel" id="phone" value={formData.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="Exemple : +229 01 97 00 00 00" autoComplete="off" />
              </CCol>
            </CRow>

            <h6 className="text-body-secondary text-uppercase small fw-semibold mb-2">Rôle</h6>
            <CRow className="g-3 mb-4">
              <CCol xs={12} md={isResponsableDivision ? 6 : 12}>
                <SearchableSelect
                  id="role_id"
                  label="Rôle"
                  value={formData.role_id}
                  onChange={value => setFormData(f => ({ ...f, role_id: value.toString(), chef_division_type: '' }))}
                  options={roles.map(r => ({ value: r.id, label: r.name }))}
                  placeholder="Choisir un rôle"
                  required
                />
              </CCol>
              {isResponsableDivision && (
                <CCol xs={12} md={6}>
                  <CFormLabel htmlFor="chef_division_type">Division<Req /></CFormLabel>
                  <CFormSelect id="chef_division_type" value={formData.chef_division_type}
                    onChange={e => set('chef_division_type', e.target.value)} required>
                    <option value="">Choisir la division</option>
                    <option value="formation_distance">Formation à Distance (FAD)</option>
                    <option value="formation_continue">Formation Continue (FC)</option>
                  </CFormSelect>
                </CCol>
              )}
            </CRow>

            <h6 className="text-body-secondary text-uppercase small fw-semibold mb-2">Coordonnées bancaires <span className="text-lowercase fw-normal">(facultatif)</span></h6>
            <CRow className="g-3">
              <CCol xs={12}>
                <CFormLabel htmlFor="bank">Banque</CFormLabel>
                <CFormInput id="bank" value={formData.bank} onChange={e => set('bank', e.target.value)} placeholder="Exemple : Ecobank Bénin" />
              </CCol>
              <CCol xs={12} md={6}>
                <CFormLabel htmlFor="rib_number">Numéro RIB</CFormLabel>
                <CFormInput id="rib_number" value={formData.rib_number} invalid={!!validationErrors.rib} placeholder="Exemple : BJ0610100100000010203040506"
                  onChange={e => { set('rib_number', e.target.value); if (validationErrors.rib) setValidationErrors(v => ({ ...v, rib: undefined })) }} />
                <div className={`small ${validationErrors.rib ? 'text-danger' : 'text-body-secondary'}`}>{validationErrors.rib || '22 à 27 caractères alphanumériques'}</div>
              </CCol>
              <CCol xs={12} md={6}>
                <CFormLabel htmlFor="rib_file">Document RIB</CFormLabel>
                <CFormInput type="file" id="rib_file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setRibFile(e.target.files?.[0] || null)} />
                <div className="small text-body-secondary">PDF, JPG ou PNG</div>
              </CCol>
              <CCol xs={12} md={6}>
                <CFormLabel htmlFor="ifu_number">Numéro IFU</CFormLabel>
                <CFormInput id="ifu_number" value={formData.ifu_number} invalid={!!validationErrors.ifu} inputMode="numeric" placeholder="Exemple : 3202012345678"
                  onChange={e => { set('ifu_number', e.target.value); if (validationErrors.ifu) setValidationErrors(v => ({ ...v, ifu: undefined })) }} />
                <div className={`small ${validationErrors.ifu ? 'text-danger' : 'text-body-secondary'}`}>{validationErrors.ifu || '13 chiffres exactement'}</div>
              </CCol>
              <CCol xs={12} md={6}>
                <CFormLabel htmlFor="ifu_file">Document IFU</CFormLabel>
                <CFormInput type="file" id="ifu_file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setIfuFile(e.target.files?.[0] || null)} />
                <div className="small text-body-secondary">PDF, JPG ou PNG</div>
              </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter className="flex-nowrap">
            <CButton color="secondary" variant="outline" className="flex-grow-1 flex-md-grow-0" disabled={saving} onClick={handleCloseModal}>
              Annuler
            </CButton>
            <CButton color="primary" type="submit" className="flex-grow-1 flex-md-grow-0" disabled={saving}>
              {saving && <CSpinner size="sm" className="me-2" />}
              {editingUser ? 'Enregistrer' : "Créer l'utilisateur"}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>

      <CModal size="lg" fullscreen="md" scrollable visible={showDetailsModal} onClose={() => setShowDetailsModal(false)}>
        <CModalHeader closeButton>
          <CModalTitle>Détails de l'utilisateur</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedUser && (
            <>
              <div className="d-flex align-items-center gap-3 mb-4">
                <Avatar url={selectedUser.photo_url} size={72} />
                <div style={{ minWidth: 0 }}>
                  <div className="fs-5 fw-semibold" style={{ overflowWrap: 'anywhere' }}>{selectedUser.first_name} {selectedUser.last_name}</div>
                  {roleOf(selectedUser) && <div className="text-primary fw-semibold">{roleOf(selectedUser)}</div>}
                </div>
              </div>
              <CRow className="g-3">
                {([
                  ['Email', selectedUser.email],
                  ['Téléphone', selectedUser.phone],
                  ['Banque', selectedUser.bank],
                  ['Numéro RIB', selectedUser.rib_number],
                  ['Numéro IFU', selectedUser.ifu_number],
                  ['Créé le', new Date(selectedUser.created_at).toLocaleString('fr-FR')],
                ] as [string, string | undefined][]).map(([label, value]) => (
                  <CCol key={label} xs={12} md={6}>
                    <div className="small text-body-secondary">{label}</div>
                    <div style={{ overflowWrap: 'anywhere' }}>{value || 'Non renseigné'}</div>
                  </CCol>
                ))}
              </CRow>
              {(selectedUser.rib_url || selectedUser.ifu_url) && <div className="mt-3">{docs(selectedUser)}</div>}
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" className="flex-grow-1 flex-md-grow-0" onClick={() => setShowDetailsModal(false)}>
            Fermer
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default AdminUsers
