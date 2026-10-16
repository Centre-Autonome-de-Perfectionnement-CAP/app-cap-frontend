import { useState, useEffect } from 'react'
import {
  CButton,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CBadge,
  CSpinner,
} from '@coreui/react'

interface RejectReasonModalProps {
  visible: boolean
  studentName?: string
  onClose: () => void
  onConfirm: (reason: string) => void
  confirming?: boolean
}

const COMMON_REASONS = [
  'Matricule introuvable dans les archives',
  'Incohérence sur la filière',
  'Informations incomplètes',
  'Doublon détecté',
]

const RejectReasonModal = ({ visible, studentName, onClose, onConfirm, confirming }: RejectReasonModalProps) => {
  const [reason, setReason] = useState('')
  const [error, setError] = useState(false)

  // Réinitialisation à chaque ouverture
  useEffect(() => {
    if (visible) {
      setReason('')
      setError(false)
    }
  }, [visible])

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError(true)
      return
    }
    setError(false)
    onConfirm(reason.trim())
  }

  const handleSuggestionClick = (suggestion: string) => {
    setReason(prev => {
      const current = prev.trim()
      if (!current) return suggestion
      return `${current} - ${suggestion}`
    })
    setError(false)
  }

  return (
    <CModal visible={visible} onClose={onClose} backdrop="static">
      <CModalHeader>
        <CModalTitle>Motif de rejet</CModalTitle>
      </CModalHeader>
      
      <CModalBody>
        <p className="fw-semibold mb-3">
          {studentName 
            ? `Rejeter le dossier de ${studentName} ?` 
            : 'Rejeter les dossiers sélectionnés ?'}
        </p>

        <CFormTextarea
          rows={4}
          placeholder="Précisez le motif du rejet..."
          value={reason}
          onChange={e => {
            setReason(e.target.value)
            if (e.target.value.trim()) setError(false)
          }}
          invalid={error}
        />
        {error && <div className="invalid-feedback d-block">Le motif est obligatoire</div>}

        <div className="mt-3">
          <small className="text-muted d-block mb-2">Suggestions de motifs fréquents :</small>
          <div className="d-flex flex-wrap gap-2">
            {COMMON_REASONS.map((suggestion, idx) => (
              <CBadge 
                key={idx} 
                color="secondary" 
                style={{ cursor: 'pointer', opacity: 0.8 }}
                onClick={() => handleSuggestionClick(suggestion)}
                className="p-2 hover-opacity-100"
              >
                {suggestion}
              </CBadge>
            ))}
          </div>
        </div>
      </CModalBody>
      
      <CModalFooter>
        <CButton color="secondary" onClick={onClose} disabled={confirming}>
          Annuler
        </CButton>
        <CButton 
          color="danger" 
          onClick={handleConfirm} 
          disabled={!reason.trim() || confirming}
        >
          {confirming ? <CSpinner size="sm" className="me-2" /> : null}
          Confirmer le rejet
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default RejectReasonModal
