// src/views/pages/demandes/components/modal/SecretaireModals.tsx

import { useState } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilInfo, cilCheckCircle, cilArrowCircleRight } from '@coreui/icons'
import type { DocumentRequest, ChefDivisionType } from '@/types/document-request.types'
import { RESEND_OPTIONS, CHEF_DIVISION_LABELS, ROLE_LABELS } from '@/types/document-request.types'
import RadioCard from '../ui/RadioCard'

// ─── ChefDivisionPicker ───────────────────────────────────────────────────────

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

// ─── ChefDivisionModal ────────────────────────────────────────────────────────

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

// ─── ResendModal ──────────────────────────────────────────────────────────────
//
// Gère deux modes selon is_in_correction_circuit :
//
//   MODE CIRCUIT ACTIF :
//     - Section verte "Sortir du circuit" (retour à l'acteur d'origine)
//     - Section orange "Continuer la correction" (renvoyer à un acteur)
//
//   MODE NORMAL :
//     - Liste standard des acteurs

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

  const isInCircuit = !!demande.is_in_correction_circuit
  const originLabel = demande.correction_origin_role
    ? (ROLE_LABELS[demande.correction_origin_role] ?? demande.correction_origin_role)
    : null

  const handleConfirm = () => {
    if (!resendTo) return
    // Les valeurs de RESEND_OPTIONS utilisent des tirets (ex: 'chef-division')
    // conformes au backend WorkflowConstants.
    // La valeur 'origin' est spéciale : déclenche la sortie du circuit.
    onConfirm(resendTo, resendTo === 'chef-division' ? chefDivType : undefined)
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" size="lg">
      <CModalHeader>
        <CModalTitle style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isInCircuit ? (
            <>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 22, height: 22, borderRadius: '50%',
                background: '#dc2626', color: '#fff', fontSize: '0.7rem', fontWeight: 900,
              }}>⟳</span>
              Circuit de correction — {demande.reference}
            </>
          ) : 'Renvoyer le dossier'}
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        {/* Contexte du rejet */}
        {demande.rejected_by && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
            padding: '10px 14px', marginBottom: 14, fontSize: '0.82rem',
          }}>
            <strong>Rejeté par :</strong> {demande.rejected_by}
            {demande.rejected_reason && <><br /><strong>Motif :</strong> {demande.rejected_reason}</>}
          </div>
        )}

        {/* ── MODE CIRCUIT ACTIF ──────────────────────────────────────────── */}
        {isInCircuit && originLabel && (
          <div style={{ marginBottom: 20 }}>
            {/* Section "Sortir du circuit" */}
            <div style={{
              fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: '#15803d', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>✅ Correction terminée</span>
              <span style={{ flex: 1, height: 1, background: '#bbf7d0' }} />
            </div>

            <div
              onClick={() => setResendTo('origin')}
              style={{
                padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                border: `2px solid ${resendTo === 'origin' ? '#15803d' : '#bbf7d0'}`,
                background: resendTo === 'origin' ? '#f0fdf4' : '#f9fefb',
                transition: 'all 0.15s', marginBottom: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                  border: `2px solid ${resendTo === 'origin' ? '#15803d' : '#86efac'}`,
                  background: resendTo === 'origin' ? '#15803d' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {resendTo === 'origin' && (
                    <CIcon icon={cilCheckCircle} style={{ width: 11, color: '#fff' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#14532d', marginBottom: 3 }}>
                    Sortir du circuit de correction
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#166534', lineHeight: 1.4 }}>
                    Renvoyer à <strong>{originLabel}</strong> — reprise du workflow normal.
                  </div>
                </div>
                <CBadge color="success" style={{ fontSize: '0.65rem', alignSelf: 'center' }}>
                  Recommandé
                </CBadge>
              </div>
            </div>

            {/* Section "Continuer la correction" */}
            <div style={{
              fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.08em', color: '#b45309', marginBottom: 8,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>🔄 Continuer la correction</span>
              <span style={{ flex: 1, height: 1, background: '#fed7aa' }} />
            </div>
            <p style={{ fontSize: '0.78rem', color: '#78350f', marginBottom: 10 }}>
              Envoyer le dossier à un acteur pour correction supplémentaire.
              Il vous le renverra ensuite obligatoirement.
            </p>
          </div>
        )}

        {/* ── LISTE DES ACTEURS ───────────────────────────────────────────── */}
        {!isInCircuit && (
          <p style={{ fontWeight: 600, fontSize: '0.84rem', marginBottom: 10 }}>
            Renvoyer à quel niveau ?
          </p>
        )}

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

        {/* Sélecteur division si renvoi chef-division */}
        {resendTo === 'chef-division' && (
          <ChefDivisionPicker value={chefDivType} onChange={setChefDivType} />
        )}
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={onClose}>Annuler</CButton>
        <CButton
          color={resendTo === 'origin' ? 'success' : 'primary'}
          disabled={!resendTo}
          onClick={handleConfirm}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <CIcon icon={cilArrowCircleRight} style={{ width: 15 }} />
          {resendTo === 'origin'
            ? 'Sortir du circuit'
            : resendTo
              ? `Renvoyer à ${RESEND_OPTIONS.find(o => o.value === resendTo)?.label ?? resendTo}`
              : 'Renvoyer'
          }
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
