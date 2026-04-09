// src/views/pages/demandes/components/modal/SecretaireModals.tsx

import { useState } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilInfo } from '@coreui/icons'
import type { DocumentRequest, ChefDivisionType } from '@/types/document-request.types'
import { CHEF_DIVISION_LABELS, RESEND_OPTIONS } from '@/types/document-request.types'
import RadioCard from '../ui/RadioCard'

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
      <p style={{ fontSize: '0.83rem', color: '#6b7280', marginBottom: 12 }}>
        Sélectionnez le chef de division concerné par ce dossier.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        {(['formation_distance', 'formation_continue'] as ChefDivisionType[]).map(type => (
          <button
            key={type}
            onClick={() => onConfirm(type)}
            style={{
              flex: 1, padding: '14px 10px', borderRadius: 10, cursor: 'pointer',
              border: '2px solid #7c3aed', background: '#f5f3ff',
              color: '#5b21b6', fontWeight: 700, fontSize: '0.88rem',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = '#7c3aed'
              b.style.color = '#ffffff'
            }}
            onMouseLeave={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = '#f5f3ff'
              b.style.color = '#5b21b6'
            }}
          >
            {CHEF_DIVISION_LABELS[type]}
          </button>
        ))}
      </div>
    </CModalBody>
    <CModalFooter>
      <CButton color="secondary" variant="ghost" onClick={onClose}>Annuler</CButton>
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
  const [resendTo,     setResendTo]     = useState('')
  const [chefDivType,  setChefDivType]  = useState<ChefDivisionType>('formation_distance')

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
            {demande.rejected_reason && <><strong>Motif :</strong> {demande.rejected_reason}</>}
          </CAlert>
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

        {resendTo === 'chef_division' && (
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.83rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CIcon icon={cilInfo} style={{ width: 14 }} />
              Quel Responsable Division ?
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['formation_distance', 'formation_continue'] as ChefDivisionType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setChefDivType(t)}
                  style={{
                    flex: 1, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                    border: `2px solid ${chefDivType === t ? '#7c3aed' : '#e5e7eb'}`,
                    background: chefDivType === t ? '#7c3aed' : 'white',
                    color: chefDivType === t ? '#ffffff' : '#374151',
                    fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.15s',
                  }}
                >
                  {CHEF_DIVISION_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
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
