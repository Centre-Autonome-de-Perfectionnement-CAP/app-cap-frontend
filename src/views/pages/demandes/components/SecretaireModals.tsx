// src/views/pages/demandes/components/SecretaireModals.tsx
// Modaux spécifiques au secrétaire : choix Responsable Division + renvoi depuis correction.

import { useState } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilInfo } from '@coreui/icons'
import type { DocumentRequest, ChefDivisionType } from '@/types/document-request.types'
import { CHEF_DIVISION_LABELS, RESEND_OPTIONS } from '@/types/document-request.types'

// ─── Choix du chef de division ────────────────────────────────────────────────

interface ChefDivisionModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (type: ChefDivisionType) => void
}

export const ChefDivisionModal = ({ visible, onClose, onConfirm }: ChefDivisionModalProps) => (
  <CModal visible={visible} onClose={onClose} alignment="center">
    <CModalHeader>
      <CModalTitle>Choisir le Responsable Division</CModalTitle>
    </CModalHeader>
    <CModalBody>
      <p className="text-muted small mb-3">
        Sélectionnez le chef de division concerné par ce dossier.
      </p>
      <div className="d-flex gap-3">
        {(['formation_distance', 'formation_continue'] as ChefDivisionType[]).map(type => (
          <CButton
            key={type}
            color="primary"
            variant="outline"
            className="flex-fill py-3 fw-bold"
            onClick={() => onConfirm(type)}
          >
            {CHEF_DIVISION_LABELS[type]}
          </CButton>
        ))}
      </div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" onClick={onClose}>Annuler</CButton>
    </CModalFooter>
  </CModal>
)

// ─── Renvoi depuis secretaire_correction ─────────────────────────────────────

interface ResendModalProps {
  demande: DocumentRequest | null
  visible: boolean
  onClose: () => void
  onConfirm: (resendTo: string, chefDivType?: ChefDivisionType) => void
}

export const ResendModal = ({ demande, visible, onClose, onConfirm }: ResendModalProps) => {
  const [resendTo,    setResendTo]    = useState('')
  const [chefDivType, setChefDivType] = useState<ChefDivisionType>('formation_distance')

  if (!demande) return null

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader>
        <CModalTitle>Renvoyer le dossier</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {demande.rejected_by && (
          <CAlert color="danger" className="py-2 mb-3 small">
            <strong>Rejeté par :</strong> {demande.rejected_by}<br />
            {demande.rejected_reason && (
              <><strong>Motif :</strong> {demande.rejected_reason}</>
            )}
          </CAlert>
        )}

        <p className="fw-semibold small mb-2">Renvoyer à quel niveau ?</p>

        <div className="d-flex flex-column gap-2 mb-3">
          {RESEND_OPTIONS.map(opt => {
            const isSelected = resendTo === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setResendTo(opt.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  border: `2px solid ${isSelected ? '#3b82f6' : '#e5e7eb'}`,
                  background: isSelected ? '#eff6ff' : 'white',
                  borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
                  textAlign: 'left',
                  color: isSelected ? '#1d4ed8' : '#374151',
                  fontWeight: isSelected ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {/* Indicateur radio */}
                <div style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${isSelected ? '#3b82f6' : '#d1d5db'}`,
                  background: isSelected ? '#3b82f6' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isSelected && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />
                  )}
                </div>
                {opt.label}
              </button>
            )
          })}
        </div>

        {resendTo === 'chef_division' && (
          <div>
            <p className="fw-semibold small mb-2">
              <CIcon icon={cilInfo} className="me-1" />
              Quel Responsable Division ?
            </p>
            <div className="d-flex gap-2">
              {(['formation_distance', 'formation_continue'] as ChefDivisionType[]).map(t => (
                <CButton
                  key={t}
                  size="sm"
                  color={chefDivType === t ? 'primary' : 'light'}
                  onClick={() => setChefDivType(t)}
                >
                  {CHEF_DIVISION_LABELS[t]}
                </CButton>
              ))}
            </div>
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose}>Annuler</CButton>
        <CButton
          color="primary"
          onClick={() => resendTo && onConfirm(
            resendTo,
            resendTo === 'chef_division' ? chefDivType : undefined,
          )}
          disabled={!resendTo}
        >
          Renvoyer
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
