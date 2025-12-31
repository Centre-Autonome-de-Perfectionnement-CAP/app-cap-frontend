import React, { useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CAlert,
  CSpinner
} from '@coreui/react'
import { financeService } from '@/services/finance.service'

const SubmitPayment: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    matricule: '',
    department_id: '',
    montant: '',
    reference: '',
    numero_compte: '',
    date_versement: '',
    motif: '',
    email: '',
    contact: '',
    quittance: null as File | null
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const formDataToSend = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataToSend.append(key, value)
      })

      await financeService.submitPayment(formDataToSend)
      setSuccess(true)
      setFormData({
        matricule: '',
        department_id: '',
        montant: '',
        reference: '',
        numero_compte: '',
        date_versement: '',
        motif: '',
        email: '',
        contact: '',
        quittance: null
      })
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la soumission')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard>
          <CCardHeader>
            <strong>Soumettre un paiement</strong>
          </CCardHeader>
          <CCardBody>
            {error && <CAlert color="danger">{error}</CAlert>}
            {success && <CAlert color="success">Paiement soumis avec succès!</CAlert>}

            <CForm onSubmit={handleSubmit}>
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Matricule *</CFormLabel>
                  <CFormInput
                    value={formData.matricule}
                    onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Département *</CFormLabel>
                  <CFormSelect
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner...</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Montant *</CFormLabel>
                  <CFormInput
                    type="number"
                    value={formData.montant}
                    onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Référence *</CFormLabel>
                  <CFormInput
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    required
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormLabel>Numéro de compte *</CFormLabel>
                  <CFormInput
                    value={formData.numero_compte}
                    onChange={(e) => setFormData({ ...formData, numero_compte: e.target.value })}
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormLabel>Date de versement *</CFormLabel>
                  <CFormInput
                    type="date"
                    value={formData.date_versement}
                    onChange={(e) => setFormData({ ...formData, date_versement: e.target.value })}
                    required
                  />
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={12}>
                  <CFormLabel>Quittance (PDF, JPG, PNG) *</CFormLabel>
                  <CFormInput
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e: any) => setFormData({ ...formData, quittance: e.target.files[0] })}
                    required
                  />
                </CCol>
              </CRow>

              <CButton type="submit" color="primary" disabled={loading}>
                {loading ? <CSpinner size="sm" /> : 'Soumettre'}
              </CButton>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default SubmitPayment
