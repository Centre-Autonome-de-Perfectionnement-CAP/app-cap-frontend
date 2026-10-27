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
      <CModalHeader style={{ borderBottom: '1.5px solid #f1f5f9', padding: '18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CIcon icon={cilTrash} style={{ width: 16, height: 16 }} />
          </div>
          <CModalTitle style={{ fontSize: '1.2rem', fontWeight: 800, color: '#dc2626', margin: 0 }}>
            Confirmer la suppression
          </CModalTitle>
        </div>
      </CModalHeader>
      <CModalBody style={{ fontSize: '1rem', padding: '24px', color: '#334155' }}>
        Voulez-vous vraiment supprimer définitivement <strong>{label}</strong> ? Cette action est irréversible.
        {error && <div style={{ color: '#dc2626', fontWeight: 600, marginTop: 12, fontSize: '0.92rem' }}>{error}</div>}
      </CModalBody>
      <CModalFooter style={{ borderTop: '1.5px solid #f1f5f9', padding: '14px 24px' }}>
        <CButton
          color="light"
          style={{ fontWeight: 700, fontSize: '0.92rem', border: '1.5px solid #cbd5e1', borderRadius: 8, padding: '6px 16px' }}
          onClick={onCancel}
          disabled={deleting}
        >
          Annuler
        </CButton>
        <CButton
          color="danger"
          style={{ fontWeight: 700, fontSize: '0.92rem', borderRadius: 8, padding: '6px 18px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          onClick={handleConfirm}
          disabled={deleting}
        >
          {deleting ? <CSpinner size="sm" /> : <><CIcon icon={cilTrash} /> Supprimer</>}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default ConfirmDeleteModal
