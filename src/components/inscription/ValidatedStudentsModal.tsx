import React, { useState } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormCheck,
  CSpinner,
} from '@coreui/react'

interface ValidatedStudentsModalProps {
  visible: boolean
  onClose: () => void
  onExport: (type: string) => Promise<void>
}

const ValidatedStudentsModal: React.FC<ValidatedStudentsModalProps> = ({
  visible,
  onClose,
  onExport,
}) => {
  const [selectedType, setSelectedType] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    if (!selectedType) return

    setLoading(true)
    try {
      await onExport(selectedType)
      onClose()
      setSelectedType('')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
      setSelectedType('')
    }
  }

  return (
    <CModal visible={visible} onClose={handleClose} backdrop="static">
      <CModalHeader>
        <CModalTitle>Export des Étudiants Validés</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p className="mb-3">
          Sélectionnez le type d'étudiants à exporter :
        </p>
        
        <div className="mb-3">
          <CFormCheck
            type="radio"
            name="studentType"
            id="prepa"
            label="Classes Préparatoires (validés CUCA)"
            value="prepa"
            checked={selectedType === 'prepa'}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="mb-3">
          <CFormCheck
            type="radio"
            name="studentType"
            id="licence"
            label="Licence / Master (validés CUO)"
            value="licence"
            checked={selectedType === 'licence'}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={loading}
          />
        </div>
        
        <div className="mb-3">
          <CFormCheck
            type="radio"
            name="studentType"
            id="specialite"
            label="Première Année de Spécialité (validés CUO)"
            value="specialite"
            checked={selectedType === 'specialite'}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={loading}
          />
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton 
          color="secondary" 
          onClick={handleClose}
          disabled={loading}
        >
          Annuler
        </CButton>
        <CButton 
          color="primary" 
          onClick={handleExport}
          disabled={!selectedType || loading}
        >
          {loading ? (
            <>
              <CSpinner size="sm" className="me-2" />
              Export en cours...
            </>
          ) : (
            'Exporter PDF'
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ValidatedStudentsModal