import React, { useState, useEffect } from 'react'
import {
  CButton,
  CCol,
  CForm,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSend } from '@coreui/icons'
import inscriptionService from '@/services/inscription.service'
import Swal from 'sweetalert2'

interface WhatsAppBroadcastModalProps {
  visible: boolean
  onClose: () => void
}

const WhatsAppBroadcastModal: React.FC<WhatsAppBroadcastModalProps> = ({ visible, onClose }) => {
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [formData, setFormData] = useState({
    department_id: '',
    message: '',
    cohort: '',
  })

  useEffect(() => {
    if (visible) {
      loadDepartments()
    }
  }, [visible])

  const loadDepartments = async () => {
    try {
      setLoading(true)
      const data = await inscriptionService.getFilieres()
      console.log('Filières chargées:', data)
      setDepartments(data || [])
    } catch (error) {
      console.error('Erreur chargement filières:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectedDepartment = departments.find((d) => d.id === parseInt(formData.department_id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedDepartment?.whatsapp_link) {
      Swal.fire({
        title: 'Lien WhatsApp manquant',
        text: 'Cette filière n\'a pas de lien WhatsApp configuré. Veuillez d\'abord le configurer dans le module RH.',
        icon: 'warning',
      })
      return
    }

    const result = await Swal.fire({
      title: 'Confirmer l\'envoi',
      text: `Envoyer le message aux étudiants de ${selectedDepartment.name} ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, envoyer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#25D366',
    })

    if (!result.isConfirmed) return

    try {
      setSending(true)
      const response = await inscriptionService.sendWhatsAppInvitation({
        department_id: parseInt(formData.department_id),
        message: formData.message,
        cohort: formData.cohort || undefined,
      })

      // Si le broadcast est en queue, afficher un message différent
      if (response.status === 'queued') {
        Swal.fire({
          title: 'Diffusion lancée !',
          html: `
            <p>La diffusion a été mise en file d'attente</p>
            <ul style="text-align: left; margin-top: 15px;">
              <li>Total étudiants: ${response.total_students}</li>
              <li>Les emails seront envoyés progressivement</li>
            </ul>
          `,
          icon: 'success',
        })
      } else {
        // Affichage classique si envoi synchrone
        Swal.fire({
          title: 'Succès !',
          html: `
            <p>Message envoyé avec succès</p>
            <ul style="text-align: left; margin-top: 15px;">
              <li>Total étudiants: ${response.total_students}</li>
              <li>Emails envoyés: ${response.emails_sent}</li>
              ${response.emails_failed > 0 ? `<li style="color: red;">Emails échoués: ${response.emails_failed}</li>` : ''}
            </ul>
          `,
          icon: 'success',
        })
      }

      onClose()
      setFormData({ department_id: '', message: '', cohort: '' })
    } catch (error: any) {
      console.error('Erreur envoi:', error)
      Swal.fire('Erreur', error.response?.data?.message || 'Erreur lors de l\'envoi', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg">
      <CModalHeader>
        <CModalTitle>Envoyer un message WhatsApp</CModalTitle>
      </CModalHeader>
      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          {loading ? (
            <div className="text-center py-4">
              <CSpinner color="primary" />
            </div>
          ) : (
            <>
              <CAlert color="info" className="mb-4">
                <strong>Information :</strong> Un email sera envoyé à tous les étudiants de la filière
                sélectionnée avec le message et le lien du groupe WhatsApp.
              </CAlert>

              <CRow className="mb-3">
                <CCol>
                  <CFormLabel>Filière *</CFormLabel>
                  <CFormSelect
                    value={formData.department_id}
                    onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner une filière</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.title}
                        {/* {!dept.whatsapp_link && ' (⚠️ Lien WhatsApp non configuré)'} */}
                      </option>
                    ))}
                  </CFormSelect>
                  {selectedDepartment && !selectedDepartment.whatsapp_link && (
                    <small className="text-danger">
                      Cette filière n'a pas de lien WhatsApp configuré. Configurez-le dans le module RH.
                    </small>
                  )}
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol>
                  <CFormLabel>Cohorte (optionnel)</CFormLabel>
                  <CFormSelect
                    value={formData.cohort}
                    onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                  >
                    <option value="">Toutes les cohortes</option>
                    <option value="A">Cohorte A</option>
                    <option value="B">Cohorte B</option>
                    <option value="C">Cohorte C</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol>
                  <CFormLabel>Message *</CFormLabel>
                  <CFormTextarea
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Écrivez votre message ici..."
                    required
                  />
                  <small className="text-muted">
                    Ce message sera envoyé par email avec le lien du groupe WhatsApp
                  </small>
                </CCol>
              </CRow>
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={onClose} disabled={sending}>
            Annuler
          </CButton>
          <CButton color="success" type="submit" disabled={sending || !selectedDepartment?.whatsapp_link}>
            {sending ? (
              <>
                <CSpinner size="sm" className="me-2" />
                Envoi en cours...
              </>
            ) : (
              <>
                <CIcon icon={cilSend} className="me-2" />
                Envoyer
              </>
            )}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

export default WhatsAppBroadcastModal
