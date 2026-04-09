// src/components/document-request/MotifModal.tsx

import React, { useState, useRef } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CFormTextarea, CFormLabel, CAlert,
} from '@coreui/react'

// --- Sous-composant pour le bouton stylé ---
const COLOR_HEX: Record<string, string> = {
  danger: '#dc2626',
  primary: '#2563eb',
  success: '#059669',
  warning: '#d97706',
}

const ConfirmDangerButton = ({
  label,
  color = 'danger',
  disabled = false,
  onClick,
}: {
  label: string
  color?: string
  disabled?: boolean
  onClick: () => void
}) => {
  const hex = COLOR_HEX[color] ?? '#dc2626'

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        background: disabled ? '#d1d5db' : hex,
        border: `2px solid ${disabled ? '#d1d5db' : hex}`,
        color: '#ffffff', // Forçage du blanc
        borderRadius: 7,
        padding: '6px 16px',
        fontWeight: 600,
        fontSize: '0.88rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        transition: 'opacity 0.15s',
        outline: 'none',
        display: 'inline-flex',
        alignItems: 'center',
      }}
      onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.opacity = '0.85' }}
      onMouseLeave={e => { if (!disabled) (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
    >
      {label}
    </button>
  )
}

// --- Composant Principal ---
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
  const [motif, setMotif] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
        <ConfirmDangerButton
          label={loading ? 'En cours…' : confirmLabel}
          color={confirmColor}
          disabled={loading}
          onClick={handleConfirm}
        />
      </CModalFooter>
    </CModal>
  )
}

export default MotifModal