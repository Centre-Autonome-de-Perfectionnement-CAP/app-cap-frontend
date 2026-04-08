import React, { useState, useEffect } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPencil, cilTrash, cilCheckCircle, cilXCircle } from '@coreui/icons'
import rhService from '@/services/rh.service'
import Swal from 'sweetalert2'

const WhatsAppGroups: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDept, setEditingDept] = useState<any | null>(null)
  const [whatsappLink, setWhatsappLink] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await rhService.getWhatsAppGroups()
      setDepartments(data)
    } catch (error) {
      console.error('Erreur:', error)
      Swal.fire('Erreur', 'Impossible de charger les données', 'error')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (dept: any) => {
    setEditingDept(dept)
    setWhatsappLink(dept.whatsapp_link || '')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingDept) return

    try {
      await rhService.updateWhatsAppGroup(editingDept.id, {
        whatsapp_link: whatsappLink || null,
      })
      Swal.fire('Succès', 'Lien WhatsApp mis à jour', 'success')
      setShowModal(false)
      loadData()
    } catch (error: any) {
      console.error('Erreur:', error)
      Swal.fire('Erreur', error.response?.data?.message || 'Erreur lors de la mise à jour', 'error')
    }
  }

  const handleDelete = async (dept: any) => {
    const result = await Swal.fire({
      title: 'Supprimer le lien ?',
      text: `Voulez-vous supprimer le lien WhatsApp de ${dept.name} ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
    })

    if (!result.isConfirmed) return

    try {
      await rhService.deleteWhatsAppGroup(dept.id)
      Swal.fire('Supprimé', 'Lien WhatsApp supprimé', 'success')
      loadData()
    } catch (error) {
      console.error('Erreur:', error)
      Swal.fire('Erreur', 'Erreur lors de la suppression', 'error')
    }
  }

  return (
    <>
      <CCard>
        <CCardHeader>
          <h5 className="mb-0">Gestion des Groupes WhatsApp</h5>
          <p className="text-muted mb-0 mt-2">
            Configurez les liens des groupes WhatsApp pour chaque filière
          </p>
        </CCardHeader>
        <CCardBody>
          {loading ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />
            </div>
          ) : (
            <CTable hover responsive>
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Cycle</CTableHeaderCell>
                  <CTableHeaderCell>Filière</CTableHeaderCell>
                  <CTableHeaderCell>Abréviation</CTableHeaderCell>
                  <CTableHeaderCell>Lien WhatsApp</CTableHeaderCell>
                  <CTableHeaderCell>Statut</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {departments.map((dept) => (
                  <CTableRow key={dept.id}>
                    <CTableDataCell>{dept.cycle?.name || '-'}</CTableDataCell>
                    <CTableDataCell>{dept.name}</CTableDataCell>
                    <CTableDataCell>{dept.abbreviation || '-'}</CTableDataCell>
                    <CTableDataCell>
                      {dept.whatsapp_link ? (
                        <a
                          href={dept.whatsapp_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary"
                        >
                          {dept.whatsapp_link.substring(0, 40)}...
                        </a>
                      ) : (
                        <span className="text-muted">Non défini</span>
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      {dept.whatsapp_link ? (
                        <CBadge color="success">
                          <CIcon icon={cilCheckCircle} className="me-1" />
                          Configuré
                        </CBadge>
                      ) : (
                        <CBadge color="warning">
                          <CIcon icon={cilXCircle} className="me-1" />
                          Non configuré
                        </CBadge>
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton
                        color="primary"
                        variant="ghost"
                        size="sm"
                        className="me-2"
                        onClick={() => openEditModal(dept)}
                      >
                        <CIcon icon={cilPencil} />
                      </CButton>
                      {dept.whatsapp_link && (
                        <CButton
                          color="danger"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(dept)}
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      )}
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      <CModal visible={showModal} onClose={() => setShowModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>
            {editingDept?.whatsapp_link ? 'Modifier' : 'Ajouter'} le lien WhatsApp
          </CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            {editingDept && (
              <>
                <CRow className="mb-3">
                  <CCol>
                    <CFormLabel className="fw-semibold">Filière</CFormLabel>
                    <p className="mb-0">{editingDept.name}</p>
                  </CCol>
                </CRow>
                <CRow className="mb-3">
                  <CCol>
                    <CFormLabel>Lien WhatsApp *</CFormLabel>
                    <CFormInput
                      type="url"
                      value={whatsappLink}
                      onChange={(e) => setWhatsappLink(e.target.value)}
                      placeholder="https://chat.whatsapp.com/..."
                      required
                    />
                    <small className="text-muted">
                      Collez le lien d'invitation du groupe WhatsApp
                    </small>
                  </CCol>
                </CRow>
              </>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </CButton>
            <CButton color="primary" type="submit">
              Enregistrer
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default WhatsAppGroups
