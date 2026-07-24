// src/views/pages/admin-db/components/ConfirmDeleteModal.tsx
//
// Confirmation obligatoire avant toute suppression (action définitive).

import { useState } from 'react'
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilTrash } from '@coreui/icons'

interface Props {
  label: string
  onCancel: () => void
  onConfirm: () => Promise<void>
}

const ConfirmDeleteModal = ({ label, onCancel, onConfirm }: Props) => {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setDeleting(true)
    setError(null)
    try {
      await onConfirm()
    } catch (e: any) {
      setError(e?.message || 'Erreur lors de la suppression.')
      setDeleting(false)
    }
  }

  return (
    <CModal visible onClose={onCancel} alignment="center">
      <CModalHeader>
        <CModalTitle style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626' }}>
          <CIcon icon={cilTrash} style={{ marginRight: 10 }} />
          Confirmer la suppression
        </CModalTitle>
      </CModalHeader>
      <CModalBody style={{ fontSize: '1.1rem' }}>
        Voulez-vous vraiment supprimer {label} ? Cette action est définitive.
        {error && <div style={{ color: '#dc2626', fontWeight: 600, marginTop: 12 }}>{error}</div>}
      </CModalBody>
      <CModalFooter>
        <CButton
          color="light"
          style={{ fontWeight: 700, fontSize: '1rem', border: '2px solid #e5e7eb' }}
          onClick={onCancel}
          disabled={deleting}
        >
          Annuler
        </CButton>
        <CButton color="danger" style={{ fontWeight: 700, fontSize: '1rem' }} onClick={handleConfirm} disabled={deleting}>
          {deleting ? <CSpinner size="sm" /> : 'Supprimer'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ConfirmDeleteModal
