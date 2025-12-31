import { useState, useEffect } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CSpinner,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash } from '@coreui/icons'
import rhService from '@/services/rh.service'
import Swal from 'sweetalert2'

interface Signataire {
  id: number
  nom: string
  role_id: number
  role: {
    id: number
    name: string
    slug: string
  }
}

interface Role {
  id: number
  name: string
  slug: string
}

const Signataires = () => {
  const [signataires, setSignataires] = useState<Signataire[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentSignataire, setCurrentSignataire] = useState<Signataire | null>(null)
  const [formData, setFormData] = useState({ nom: '', role_id: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadSignataires()
    loadRoles()
  }, [])

  const loadSignataires = async () => {
    setLoading(true)
    try {
      const response = await rhService.getSignataires()
      setSignataires(response.data || [])
    } catch (error) {
      Swal.fire('Erreur', 'Erreur lors du chargement des signataires', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const data = await rhService.getRoles()
      setRoles(data)
    } catch (error) {
      console.error('Erreur lors du chargement des rôles')
    }
  }

  const handleOpenModal = (signataire?: Signataire) => {
    if (signataire) {
      setEditMode(true)
      setCurrentSignataire(signataire)
      setFormData({ nom: signataire.nom, role_id: signataire.role_id.toString() })
    } else {
      setEditMode(false)
      setCurrentSignataire(null)
      setFormData({ nom: '', role_id: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditMode(false)
    setCurrentSignataire(null)
    setFormData({ nom: '', role_id: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editMode && currentSignataire) {
        await rhService.updateSignataire(currentSignataire.id, formData)
        Swal.fire('Succès', 'Signataire mis à jour avec succès', 'success')
      } else {
        await rhService.createSignataire(formData)
        Swal.fire('Succès', 'Signataire créé avec succès', 'success')
      }
      handleCloseModal()
      loadSignataires()
    } catch (error) {
      Swal.fire('Erreur', 'Une erreur est survenue', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      text: 'Cette action est irréversible',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    })

    if (result.isConfirmed) {
      try {
        await rhService.deleteSignataire(id)
        Swal.fire('Supprimé!', 'Le signataire a été supprimé', 'success')
        loadSignataires()
      } catch (error) {
        Swal.fire('Erreur', 'Erreur lors de la suppression', 'error')
      }
    }
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Gestion des Signataires</strong>
              <CButton color="primary" onClick={() => handleOpenModal()}>
                <CIcon icon={cilPlus} className="me-1" />
                Ajouter un signataire
              </CButton>
            </CCardHeader>
            <CCardBody>
              {loading ? (
                <div className="text-center">
                  <CSpinner color="primary" />
                </div>
              ) : (
                <CTable striped hover>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Nom</CTableHeaderCell>
                      <CTableHeaderCell>Rôle</CTableHeaderCell>
                      <CTableHeaderCell>Actions</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {signataires.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={3} className="text-center">
                          Aucun signataire trouvé
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      signataires.map((signataire) => (
                        <CTableRow key={signataire.id}>
                          <CTableDataCell>{signataire.nom}</CTableDataCell>
                          <CTableDataCell>{signataire.role?.name || '-'}</CTableDataCell>
                          <CTableDataCell>
                            <CButton
                              color="info"
                              size="sm"
                              className="me-2"
                              onClick={() => handleOpenModal(signataire)}
                            >
                              <CIcon icon={cilPencil} />
                            </CButton>
                            <CButton
                              color="danger"
                              size="sm"
                              onClick={() => handleDelete(signataire.id)}
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

      <CModal visible={showModal} onClose={handleCloseModal}>
        <CModalHeader>
          <CModalTitle>{editMode ? 'Modifier' : 'Ajouter'} un signataire</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <div className="mb-3">
              <CFormLabel htmlFor="nom">Nom</CFormLabel>
              <CFormInput
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="role_id">Rôle</CFormLabel>
              <CFormSelect
                id="role_id"
                value={formData.role_id}
                onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                required
              >
                <option value="">Sélectionner un rôle</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </CFormSelect>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={handleCloseModal}>
              Annuler
            </CButton>
            <CButton color="primary" type="submit" disabled={submitting}>
              {submitting ? <CSpinner size="sm" /> : editMode ? 'Modifier' : 'Ajouter'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default Signataires
