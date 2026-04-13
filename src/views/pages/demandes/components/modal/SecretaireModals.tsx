// src/views/pages/demandes/components/modal/SecretaireModals.tsx

import { useState } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilInfo } from '@coreui/icons'
import type { DocumentRequest, ChefDivisionType } from '@/types/document-request.types'
import { RESEND_OPTIONS, CHEF_DIVISION_LABELS } from '@/types/document-request.types'
import RadioCard from '../ui/RadioCard'

// ─── Sélecteur de type chef division (boutons inline) ─────────────────────────

interface ChefDivisionPickerProps {
  value: ChefDivisionType
  onChange: (v: ChefDivisionType) => void
}

export const ChefDivisionPicker = ({ value, onChange }: ChefDivisionPickerProps) => (
  <div>
    <p style={{ fontWeight: 600, fontSize: '0.83rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
      <CIcon icon={cilInfo} style={{ width: 14 }} />
      Quel Responsable Division ?
    </p>
    <div style={{ display: 'flex', gap: 8 }}>
      {(['formation_distance', 'formation_continue'] as ChefDivisionType[]).map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            flex: 1, padding: '10px 10px', borderRadius: 8, cursor: 'pointer',
            border: `2px solid ${value === t ? '#7c3aed' : '#e5e7eb'}`,
            background: value === t ? '#7c3aed' : 'white',
            color: value === t ? '#ffffff' : '#374151',
            fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.15s',
          }}
        >
          {CHEF_DIVISION_LABELS[t]}
        </button>
      ))}
    </div>
  </div>
)

// ─── Modal de choix chef division (utilisée par Comptable) ────────────────────

interface ChefDivisionModalProps {
  visible: boolean
  onClose: () => void
  onConfirm: (type: ChefDivisionType) => void
}

export const ChefDivisionModal = ({ visible, onClose, onConfirm }: ChefDivisionModalProps) => {
  const [type, setType] = useState<ChefDivisionType>('formation_distance')

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">
      <CModalHeader>
        <CModalTitle>Choisir le Responsable Division</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <p style={{ fontSize: '0.83rem', color: '#6b7280', marginBottom: 16 }}>
          Sélectionnez le responsable de division concerné par ce dossier.
        </p>
        <ChefDivisionPicker value={type} onChange={setType} />
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={onClose}>Annuler</CButton>
        <CButton color="primary" onClick={() => onConfirm(type)}>Confirmer</CButton>
      </CModalFooter>
    </CModal>
  )
}

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
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
            padding: '10px 14px', marginBottom: 14, fontSize: '0.82rem',
          }}>
            <strong>Rejeté par :</strong> {demande.rejected_by}<br />
            {demande.rejected_reason && <><strong>Motif :</strong> {demande.rejected_reason}</>}
          </div>
        )}

        <p style={{ fontWeight: 600, fontSize: '0.84rem', marginBottom: 10 }}>
          Renvoyer à quel niveau ?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {RESEND_OPTIONS.map(opt => (
            <RadioCard
              key={opt.value}
              value={opt.value}
              selected={resendTo}
              onSelect={setResendTo}
              label={opt.label}
              color="#2563eb"
            />
          ))}
        </div>

        {/* Choix du type chef division si on renvoie à ce niveau */}
        {resendTo === 'chef_division' && (
          <ChefDivisionPicker value={chefDivType} onChange={setChefDivType} />
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={onClose}>Annuler</CButton>
        <CButton
          color="primary"
          disabled={!resendTo}
          onClick={() => resendTo && onConfirm(resendTo, resendTo === 'chef_division' ? chefDivType : undefined)}
        >
          Renvoyer
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
