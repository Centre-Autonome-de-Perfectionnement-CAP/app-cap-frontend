import React, { useState, useEffect } from 'react'
import { CButton, CCard, CCardBody, CCardHeader, CCol, CForm, CFormInput, CFormLabel, CFormSelect, CFormTextarea, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CRow, CSpinner, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash, cilCloudDownload } from '@coreui/icons'
import rhService from '@/services/rh.service'

const DocumentsManagement: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingDoc, setEditingDoc] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    categorie: 'administratif',
    datePublication: new Date().toISOString().split('T')[0],
    file: null as File | null,
    lien: '',
  })

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const data = await rhService.getDocuments()
      setDocuments(data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const formDataToSend = new FormData()
      formDataToSend.append('titre', formData.titre)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('categorie', formData.categorie)
      formDataToSend.append('datePublication', formData.datePublication)
      
      if (formData.file) {
        formDataToSend.append('file', formData.file)
      } else if (formData.lien) {
        formDataToSend.append('lien', formData.lien)
      }

      if (editingDoc) {
        await rhService.updateDocument(editingDoc.id, Object.fromEntries(formDataToSend))
      } else {
        await rhService.createDocument(formDataToSend)
      }

      setShowModal(false)
      resetForm()
      loadDocuments()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce document ?')) return
    try {
      await rhService.deleteDocument(id)
      loadDocuments()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleDownload = async (doc: any) => {
    try {
      const blobUrl = await rhService.downloadDocument(doc.id)
      
      // Créer un lien de téléchargement temporaire
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${doc.titre}.pdf`
      document.body.appendChild(link)
      link.click()
      
      // Nettoyer
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      titre: '',
      description: '',
      categorie: 'administratif',
      datePublication: new Date().toISOString().split('T')[0],
      file: null,
      lien: '',
    })
    setEditingDoc(null)
  }

  const openEditModal = (doc: any) => {
    setEditingDoc(doc)
    setFormData({
      titre: doc.titre,
      description: doc.description,
      categorie: doc.categorie,
      datePublication: doc.datePublication,
      file: null,
      lien: '',
    })
    setShowModal(true)
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Gestion des Documents</h5>
          <CButton color="primary" onClick={() => { resetForm(); setShowModal(true) }}>
            <CIcon icon={cilPlus} className="me-2" />
            Nouveau Document
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
                  <CTableHeaderCell>Titre</CTableHeaderCell>
                  <CTableHeaderCell>Catégorie</CTableHeaderCell>
                  <CTableHeaderCell>Type</CTableHeaderCell>
                  <CTableHeaderCell>Date Publication</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {documents.map(doc => (
                  <CTableRow key={doc.id}>
                    <CTableDataCell>{doc.titre}</CTableDataCell>
                    <CTableDataCell><CBadge color="secondary">{doc.categorie}</CBadge></CTableDataCell>
                    <CTableDataCell><CBadge color="info">{doc.type}</CBadge></CTableDataCell>
                    <CTableDataCell>{new Date(doc.datePublication).toLocaleDateString('fr-FR')}</CTableDataCell>
                    <CTableDataCell>
                      <CButton color="success" variant="ghost" size="sm" className="me-2" onClick={() => handleDownload(doc)} title="Télécharger">
                        <CIcon icon={cilCloudDownload} />
                      </CButton>
                      <CButton color="primary" variant="ghost" size="sm" className="me-2" onClick={() => openEditModal(doc)}>
                        <CIcon icon={cilPencil} />
                      </CButton>
                      <CButton color="danger" variant="ghost" size="sm" onClick={() => handleDelete(doc.id)}>
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
          <CModalTitle>{editingDoc ? 'Modifier' : 'Nouveau'} Document</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Titre *</CFormLabel>
                <CFormInput value={formData.titre} onChange={e => setFormData({...formData, titre: e.target.value})} required />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol>
                <CFormLabel>Description *</CFormLabel>
                <CFormTextarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
              </CCol>
            </CRow>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel>Catégorie *</CFormLabel>
                <CFormSelect value={formData.categorie} onChange={e => setFormData({...formData, categorie: e.target.value})} required>
                  <option value="administratif">Administratif</option>
                  <option value="pedagogique">Pédagogique</option>
                  <option value="legal">Juridique</option>
                  <option value="organisation">Organisation</option>
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel>Date Publication *</CFormLabel>
                <CFormInput type="date" value={formData.datePublication} onChange={e => setFormData({...formData, datePublication: e.target.value})} required />
              </CCol>
            </CRow>
            {!editingDoc && (
              <>
                <CRow className="mb-3">
                  <CCol>
                    <CFormLabel>Fichier</CFormLabel>
                    <CFormInput type="file" onChange={e => setFormData({...formData, file: (e.target as HTMLInputElement).files?.[0] || null})} />
                  </CCol>
                </CRow>
                <div className="text-center my-2">OU</div>
                <CRow className="mb-3">
                  <CCol>
                    <CFormLabel>Lien externe</CFormLabel>
                    <CFormInput type="url" value={formData.lien} onChange={e => setFormData({...formData, lien: e.target.value})} placeholder="https://..." />
                  </CCol>
                </CRow>
              </>
            )}
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

export default DocumentsManagement
