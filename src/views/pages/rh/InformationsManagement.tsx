import React, { useState, useEffect } from 'react'
import { CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CFormTextarea, CFormCheck, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CRow, CSpinner, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash } from '@coreui/icons'
import rhService from '@/services/rh.service'

const InformationsManagement: React.FC = () => {
  const [informations, setInformations] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingInfo, setEditingInfo] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'bi-info-circle',
    color: 'primary',
    link: '',
    file_id: null as number | null,
    is_active: true,
    order: 0,
  })

  const icons = [
    'bi-info-circle', 'bi-calendar-check', 'bi-calendar-event', 'bi-headset',
    'bi-cash-coin', 'bi-book', 'bi-trophy', 'bi-bell', 'bi-megaphone',
  ]

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [infos, docs] = await Promise.all([
        rhService.getImportantInformationsAdmin(),
        rhService.getDocuments(),
      ])
      setInformations(infos)
      setDocuments(docs.filter((d: any) => d.type === 'pdf'))
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingInfo) {
        await rhService.updateImportantInformation(editingInfo.id, formData)
      } else {
        await rhService.createImportantInformation(formData)
      }
      setShowModal(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette information ?')) return
    try {
      await rhService.deleteImportantInformation(id)
      loadData()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      icon: 'bi-info-circle',
      color: 'primary',
      link: '',
      file_id: null,
      is_active: true,
      order: 0,
    })
    setEditingInfo(null)
  }

  const openEditModal = (info: any) => {
    setEditingInfo(info)
    setFormData({
      title: info.title,
      description: info.description,
      icon: info.icon,
      color: info.color,
      link: info.link || '',
      file_id: info.file_id || null,
      is_active: info.is_active ?? true,
      order: info.order ?? 0,
    })
    setShowModal(true)
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Gestion des Informations Importantes</h5>
          <CButton color="primary" onClick={() => { resetForm(); setShowModal(true) }}>
            <CIcon icon={cilPlus} className="me-2" />
            Nouvelle Information
          </CButton>
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
                  <CTableHeaderCell>Ordre</CTableHeaderCell>
                  <CTableHeaderCell>Titre</CTableHeaderCell>
                  <CTableHeaderCell>Couleur</CTableHeaderCell>
                  <CTableHeaderCell>Icône</CTableHeaderCell>
                  <CTableHeaderCell>Fichier</CTableHeaderCell>
                  <CTableHeaderCell>Statut</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {informations.map(info => (
                  <CTableRow key={info.id}>
                    <CTableDataCell>{info.order}</CTableDataCell>
                    <CTableDataCell>{info.title}</CTableDataCell>
                    <CTableDataCell><CBadge color={info.color}>{info.color}</CBadge></CTableDataCell>
                    <CTableDataCell>
                      <i className={`bi ${info.icon}`} style={{ fontSize: '1.5rem' }}></i>
                    </CTableDataCell>
                    <CTableDataCell>{info.file ? <CBadge color="info">{info.file.name}</CBadge> : '-'}</CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={info.is_active ? 'success' : 'secondary'}>
                        {info.is_active ? 'Actif' : 'Inactif'}
                      </CBadge>
                    </CTableDataCell>
                    <CTableDataCell>
                      <CButton color="primary" variant="ghost" size="sm" className="me-2" onClick={() => openEditModal(info)}>
                        <CIcon icon={cilPencil} />
                      </CButton>
                      <CButton color="danger" variant="ghost" size="sm" onClick={() => handleDelete(info.id)}>
                        <CIcon icon={cilTrash} />
                      </CButton>
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
          <CModalTitle>{editingInfo ? 'Modifier' : 'Nouvelle'} Information</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Titre *</CFormLabel>
                <CFormInput value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Description *</CFormLabel>
                <CFormTextarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={4}>
                <CFormLabel>Icône *</CFormLabel>
                <CFormSelect value={formData.icon} onChange={e => setFormData({...formData, icon: e.target.value})} required>
                  {icons.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormLabel>Couleur *</CFormLabel>
                <CFormSelect value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} required>
                  <option value="primary">Bleu</option>
                  <option value="success">Vert</option>
                  <option value="info">Cyan</option>
                  <option value="warning">Jaune</option>
                  <option value="danger">Rouge</option>
                </CFormSelect>
              </CCol>
              <CCol md={4}>
                <CFormLabel>Ordre</CFormLabel>
                <CFormInput type="number" value={formData.order} onChange={e => setFormData({...formData, order: parseInt(e.target.value)})} />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Lien</CFormLabel>
                <CFormInput value={formData.link} onChange={e => setFormData({...formData, link: e.target.value})} placeholder="/enroll" />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Document PDF (optionnel)</CFormLabel>
                <small className="text-muted d-block mb-2">
                  Sélectionnez un document existant ou créez-en un dans l'onglet "Documents Utiles"
                </small>
                <CFormSelect value={formData.file_id || ''} onChange={e => setFormData({...formData, file_id: e.target.value ? parseInt(e.target.value) : null})}>
                  <option value="">Aucun document</option>
                  {documents.map((doc: any) => (
                    <option key={doc.id} value={doc.id}>{doc.titre}</option>
                  ))}
                </CFormSelect>
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormCheck checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} label="Actif" />
              </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => setShowModal(false)}>Annuler</CButton>
            <CButton color="primary" type="submit">Enregistrer</CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default InformationsManagement
