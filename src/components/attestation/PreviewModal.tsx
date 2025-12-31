import React, { useState, useEffect } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CSpinner,
  CRow,
  CCol,
  CFormInput,
  CFormLabel,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilPencil } from '@coreui/icons'

interface PreviewModalProps {
  visible: boolean
  onClose: () => void
  birthCertificateUrl?: string
  attestationUrl?: string
  studentName: string
  studentFirstNames: string
  onUpdateNames: (lastName: string, firstNames: string) => Promise<void>
  onValidateAndDownload: () => Promise<void>
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  visible,
  onClose,
  birthCertificateUrl,
  attestationUrl,
  studentName,
  studentFirstNames,
  onUpdateNames,
  onValidateAndDownload,
}) => {
  const [editMode, setEditMode] = useState(false)
  const [lastName, setLastName] = useState(studentName)
  const [firstNames, setFirstNames] = useState(studentFirstNames)
  const [updating, setUpdating] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    setLastName(studentName)
    setFirstNames(studentFirstNames)
  }, [studentName, studentFirstNames])

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      await onUpdateNames(lastName, firstNames)
      setEditMode(false)
      alert('Noms mis à jour avec succès')
    } catch (error) {
      alert('Erreur lors de la mise à jour')
    } finally {
      setUpdating(false)
    }
  }

  const handleValidateAndDownload = async () => {
    setDownloading(true)
    try {
      await onValidateAndDownload()
      onClose()
    } catch (error) {
      alert('Erreur lors du téléchargement')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      size="xl"
      backdrop="static"
    >
      <CModalHeader>
        <CModalTitle>Prévisualisation et Vérification</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {editMode ? (
          <div className="mb-3">
            <CRow>
              <CCol md={6}>
                <CFormLabel>Nom</CFormLabel>
                <CFormInput
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Prénoms</CFormLabel>
                <CFormInput
                  value={firstNames}
                  onChange={(e) => setFirstNames(e.target.value)}
                />
              </CCol>
            </CRow>
            <div className="mt-3">
              <CButton color="primary" onClick={handleUpdate} disabled={updating}>
                {updating ? <CSpinner size="sm" /> : 'Enregistrer'}
              </CButton>
              <CButton color="secondary" className="ms-2" onClick={() => setEditMode(false)}>
                Annuler
              </CButton>
            </div>
          </div>
        ) : (
          <CRow style={{ height: '600px' }}>
            <CCol md={6} className="border-end">
              <h5 className="mb-3">Acte de Naissance</h5>
              {birthCertificateUrl ? (
                <iframe
                  src={birthCertificateUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="Acte de naissance"
                />
              ) : (
                <div className="text-center text-muted">Acte de naissance non disponible</div>
              )}
            </CCol>
            <CCol md={6}>
              <h5 className="mb-3">Attestation/Certificat</h5>
              {attestationUrl ? (
                <iframe
                  src={attestationUrl}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title="Attestation"
                />
              ) : (
                <div className="text-center">
                  <CSpinner color="primary" />
                  <p className="mt-2">Chargement de l'aperçu...</p>
                </div>
              )}
            </CCol>
          </CRow>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>
          Annuler
        </CButton>
        {!editMode && (
          <>
            <CButton color="warning" onClick={() => setEditMode(true)}>
              <CIcon icon={cilPencil} className="me-1" />
              Modifier les noms
            </CButton>
            <CButton
              color="success"
              onClick={handleValidateAndDownload}
              disabled={downloading}
            >
              {downloading ? <CSpinner size="sm" /> : <CIcon icon={cilCloudDownload} className="me-1" />}
              Valider et Télécharger
            </CButton>
          </>
        )}
      </CModalFooter>
    </CModal>
  )
}

export default PreviewModal
