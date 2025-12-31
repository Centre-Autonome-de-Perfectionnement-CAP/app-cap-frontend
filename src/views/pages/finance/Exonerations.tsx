import React, { useEffect, useState } from 'react'
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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CSpinner
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilPencil, cilTrash } from '@coreui/icons'
import { financeService } from '@/services/finance.service'

const Exonerations: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [exonerations, setExonerations] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    student_pending_student_id: '',
    academic_year_id: '',
    type: 'percentage',
    value: '',
    reason: ''
  })

  useEffect(() => {
    loadExonerations()
  }, [])

  const loadExonerations = async () => {
    try {
      const response = await financeService.getExonerations()
      setExonerations(response.data)
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await financeService.updateExoneration(editingId, formData)
      } else {
        await financeService.createExoneration(formData)
      }
      setShowModal(false)
      loadExonerations()
      resetForm()
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Confirmer la suppression?')) {
      try {
        await financeService.deleteExoneration(id)
        loadExonerations()
      } catch (error) {
        console.error('Erreur:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      student_pending_student_id: '',
      academic_year_id: '',
      type: 'percentage',
      value: '',
      reason: ''
    })
    setEditingId(null)
  }

  if (loading) return <CSpinner />

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard>
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Gestion des exonérations</strong>
              <CButton color="primary" onClick={() => setShowModal(true)}>
                <CIcon icon={cilPlus} /> Nouvelle exonération
              </CButton>
            </CCardHeader>
            <CCardBody>
              <CTable hover>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>Étudiant</CTableHeaderCell>
                    <CTableHeaderCell>Année académique</CTableHeaderCell>
                    <CTableHeaderCell>Type</CTableHeaderCell>
                    <CTableHeaderCell>Valeur</CTableHeaderCell>
                    <CTableHeaderCell>Raison</CTableHeaderCell>
                    <CTableHeaderCell>Actions</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {exonerations.map((exo) => (
                    <CTableRow key={exo.id}>
                      <CTableDataCell>{exo.student_name}</CTableDataCell>
                      <CTableDataCell>{exo.academic_year}</CTableDataCell>
                      <CTableDataCell>{exo.type}</CTableDataCell>
                      <CTableDataCell>{exo.value}{exo.type === 'percentage' ? '%' : ' FCFA'}</CTableDataCell>
                      <CTableDataCell>{exo.reason}</CTableDataCell>
                      <CTableDataCell>
                        <CButton size="sm" color="info" className="me-2" onClick={() => {
                          setFormData(exo)
                          setEditingId(exo.id)
                          setShowModal(true)
                        }}>
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton size="sm" color="danger" onClick={() => handleDelete(exo.id)}>
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CModal visible={showModal} onClose={() => { setShowModal(false); resetForm() }}>
        <CModalHeader>
          <CModalTitle>{editingId ? 'Modifier' : 'Nouvelle'} exonération</CModalTitle>
        </CModalHeader>
        <CForm onSubmit={handleSubmit}>
          <CModalBody>
            <div className="mb-3">
              <CFormLabel>Type</CFormLabel>
              <CFormSelect
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="percentage">Pourcentage</option>
                <option value="fixed">Montant fixe</option>
              </CFormSelect>
            </div>
            <div className="mb-3">
              <CFormLabel>Valeur</CFormLabel>
              <CFormInput
                type="number"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                required
              />
            </div>
            <div className="mb-3">
              <CFormLabel>Raison</CFormLabel>
              <CFormInput
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" onClick={() => { setShowModal(false); resetForm() }}>
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

export default Exonerations
