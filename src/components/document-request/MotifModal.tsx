// src/components/document-request/MotifModal.tsx

import { useState } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CFormTextarea, CFormLabel, CAlert,
} from '@coreui/react'

interface Props {
  visible: boolean
  title: string
  placeholder?: string
  confirmLabel?: string
  confirmColor?: string
  onClose: () => void
  onConfirm: (motif: string) => Promise<void>
}

const MotifModal = ({
  visible, title, placeholder = 'Saisir le motif…',
  confirmLabel = 'Confirmer', confirmColor = 'danger',
  onClose, onConfirm,
}: Props) => {
  const [motif, setMotif]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleClose = () => {
    setMotif('')
    setError('')
    onClose()
  }

  const handleConfirm = async () => {
    if (!motif.trim()) {
      setError('Le motif est obligatoire.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onConfirm(motif.trim())
      setMotif('')
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CModal visible={visible} onClose={handleClose} alignment="center">
      <CModalHeader>
        <CModalTitle>{title}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {error && <CAlert color="danger" className="py-2">{error}</CAlert>}
        <CFormLabel>Motif / Commentaire <span className="text-danger">*</span></CFormLabel>
        <CFormTextarea
          rows={4}
          placeholder={placeholder}
          value={motif}
          onChange={e => setMotif(e.target.value)}
        />
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={handleClose} disabled={loading}>
          Annuler
        </CButton>
        <CButton color={confirmColor as any} onClick={handleConfirm} disabled={loading}>
          {loading ? 'En cours…' : confirmLabel}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default MotifModal
