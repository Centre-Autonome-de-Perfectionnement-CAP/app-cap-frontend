// src/views/pages/demandes/components/modal/SecretaireModals.tsx
// ResendModal refait : 2 choix clairs, liste acteurs cachée par défaut.
// Modal plus court, moins de surcharge visuelle.

import { useState } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilInfo, cilArrowCircleRight, cilCheckCircle } from '@coreui/icons'
import type { DocumentRequest, ChefDivisionType } from '@/types/document-request.types'
import { RESEND_OPTIONS, CHEF_DIVISION_LABELS, ROLE_LABELS } from '@/types/document-request.types'
import RadioCard from '../ui/RadioCard'

// ─── ChefDivisionPicker ───────────────────────────────────────────────────────

interface ChefDivisionPickerProps {
  value: ChefDivisionType
  onChange: (v: ChefDivisionType) => void
}

export const ChefDivisionPicker = ({ value, onChange }: ChefDivisionPickerProps) => (
  <div style={{ marginTop: 14 }}>
    <p style={{
      fontWeight: 700, fontSize: '0.875rem', marginBottom: 10,
      display: 'flex', alignItems: 'center', gap: 6, color: '#374151',
    }}>
      <CIcon icon={cilInfo} style={{ width: 15 }} />
      Quel Responsable Division ?
    </p>
    <div style={{ display: 'flex', gap: 10 }}>
      {(['formation_distance', 'formation_continue'] as ChefDivisionType[]).map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            flex: 1, padding: '10px', borderRadius: 8, cursor: 'pointer',
            border: `2px solid ${value === t ? '#7c3aed' : '#e5e7eb'}`,
            background: value === t ? '#7c3aed' : 'white',
            color: value === t ? '#ffffff' : '#374151',
            fontWeight: 700, fontSize: '0.875rem', transition: 'all 0.15s',
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
      <CModalHeader style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
        <CModalTitle style={{ fontWeight: 800, fontSize: '1rem' }}>
          Choisir le Responsable Division
        </CModalTitle>
      </CModalHeader>
      <CModalBody style={{ padding: '24px' }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 16 }}>
          Sélectionnez le responsable de division concerné par ce dossier.
        </p>
        <ChefDivisionPicker value={type} onChange={setType} />
      </CModalBody>
      <CModalFooter style={{ padding: '14px 24px', gap: 10 }}>
        <CButton color="secondary" variant="ghost" onClick={onClose}
          style={{ fontWeight: 600, fontSize: '0.875rem' }}>Annuler</CButton>
        <CButton color="primary" onClick={() => onConfirm(type)}
          style={{ fontWeight: 700, fontSize: '0.875rem', padding: '8px 22px' }}>Confirmer</CButton>
      </CModalFooter>
    </CModal>
  )
}

// ─── ResendModal ──────────────────────────────────────────────────────────────
//
// Mode circuit actif :
//   • Option "Sortir du circuit" (recommandée) = renvoyer à l'origin
//   • Option "Envoyer à un acteur" = affiche la liste uniquement si choisie
//
// Mode normal :
//   • Choix binaire : "Sortir" (absent) | "Renvoyer à un acteur"
//   • Liste acteurs masquée jusqu'au choix

type MainChoice = 'origin' | 'actor' | ''

interface ResendModalProps {
  demande: DocumentRequest | null
  visible: boolean
  onClose: () => void
  onConfirm: (resendTo: string, chefDivType?: ChefDivisionType) => void
}

export const ResendModal = ({ demande, visible, onClose, onConfirm }: ResendModalProps) => {
  const [mainChoice,  setMainChoice]  = useState<MainChoice>('')
  const [actorChoice, setActorChoice] = useState('')
  const [chefDivType, setChefDivType] = useState<ChefDivisionType>('formation_distance')

  if (!demande) return null

  const isInCircuit = !!demande.is_in_correction_circuit
  const originLabel = demande.correction_origin_role
    ? (ROLE_LABELS[demande.correction_origin_role] ?? demande.correction_origin_role)
    : null

  const handleClose = () => {
    setMainChoice('')
    setActorChoice('')
    onClose()
  }

  const handleConfirm = () => {
    if (mainChoice === 'origin') {
      onConfirm('origin')
    } else if (mainChoice === 'actor' && actorChoice) {
      onConfirm(actorChoice, actorChoice === 'chef-division' ? chefDivType : undefined)
    }
  }

  const canConfirm = mainChoice === 'origin' || (mainChoice === 'actor' && !!actorChoice)

  const confirmLabel = mainChoice === 'origin'
    ? `Sortir du circuit → ${originLabel ?? 'origine'}`
    : mainChoice === 'actor' && actorChoice
      ? `Envoyer à ${RESEND_OPTIONS.find(o => o.value === actorChoice)?.label ?? actorChoice}`
      : 'Confirmer'

  return (
    <CModal visible={visible} onClose={handleClose} alignment="center" size="lg">

      {/* ── Header ── */}
      <CModalHeader style={{
        background: isInCircuit ? '#fef2f2' : '#eff6ff',
        borderBottom: `1.5px solid ${isInCircuit ? '#fecaca' : '#bfdbfe'}`,
        padding: '18px 24px',
      }}>
        <CModalTitle style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: '50%',
            background: isInCircuit ? '#dc2626' : '#2563eb',
            color: '#fff', fontSize: '1.1rem', fontWeight: 900, flexShrink: 0,
          }}>
            {isInCircuit ? '⟳' : '→'}
          </span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>
              {isInCircuit ? 'Gérer la navette' : 'Renvoyer le dossier'}
            </div>
            <div style={{ fontWeight: 500, fontSize: '0.82rem', color: isInCircuit ? '#7f1d1d' : '#1e40af', marginTop: 1 }}>
              Réf. {demande.reference}
            </div>
          </div>
        </CModalTitle>
      </CModalHeader>

      {/* ── Body ── */}
      <CModalBody style={{ padding: '20px 24px' }}>

        {/* Raison du rejet si présente */}
        {demande.rejected_reason && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            borderLeft: '4px solid #dc2626',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            fontSize: '0.875rem', color: '#991b1b', lineHeight: 1.6,
          }}>
            <strong>Problème signalé :</strong> {demande.rejected_reason}
          </div>
        )}

        {/* ── CHOIX PRINCIPAL ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: mainChoice === 'actor' ? 16 : 0 }}>

          {/* Option : Sortir du circuit (si circuit actif) */}
          {isInCircuit && originLabel && (
            <div
              onClick={() => { setMainChoice('origin'); setActorChoice('') }}
              style={{
                padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                border: `2px solid ${mainChoice === 'origin' ? '#15803d' : '#bbf7d0'}`,
                background: mainChoice === 'origin' ? '#f0fdf4' : '#f9fefb',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  border: `2px solid ${mainChoice === 'origin' ? '#15803d' : '#86efac'}`,
                  background: mainChoice === 'origin' ? '#15803d' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {mainChoice === 'origin' && (
                    <CIcon icon={cilCheckCircle} style={{ width: 11, color: '#fff' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#14532d' }}>
                    Sortir du circuit — renvoyer à <em>{originLabel}</em>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#166534', marginTop: 2 }}>
                    Correction terminée. Reprend le workflow normal.
                  </div>
                </div>
                <span style={{
                  fontSize: '0.72rem', padding: '2px 9px', borderRadius: 5,
                  background: '#dcfce7', color: '#15803d', fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}>
                  Recommandé
                </span>
              </div>
            </div>
          )}

          {/* Option : Envoyer à un acteur */}
          <div
            onClick={() => setMainChoice('actor')}
            style={{
              padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
              border: `2px solid ${mainChoice === 'actor' ? '#2563eb' : '#dbeafe'}`,
              background: mainChoice === 'actor' ? '#eff6ff' : '#f9fafb',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                border: `2px solid ${mainChoice === 'actor' ? '#2563eb' : '#93c5fd'}`,
                background: mainChoice === 'actor' ? '#2563eb' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {mainChoice === 'actor' && (
                  <CIcon icon={cilCheckCircle} style={{ width: 11, color: '#fff' }} />
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#1e3a8a' }}>
                  {isInCircuit ? "Envoyer à quelqu'un d'autre" : "Renvoyer à un acteur"}
                </div>
                {isInCircuit && (
                  <div style={{ fontSize: '0.82rem', color: '#3730a3', marginTop: 2 }}>
                    L'acteur devra obligatoirement vous renvoyer le dossier.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── LISTE ACTEURS (affichée uniquement si "actor" sélectionné) ── */}
        {mainChoice === 'actor' && (
          <div style={{
            marginTop: 4,
            borderTop: '1px solid #e5e7eb',
            paddingTop: 14,
          }}>
            <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 10, fontWeight: 600 }}>
              Choisir l'acteur destinataire :
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {RESEND_OPTIONS.map(opt => (
                <RadioCard
                  key={opt.value}
                  value={opt.value}
                  selected={actorChoice}
                  onSelect={setActorChoice}
                  label={opt.label}
                  color="#2563eb"
                />
              ))}
            </div>
            {actorChoice === 'chef-division' && (
              <ChefDivisionPicker value={chefDivType} onChange={setChefDivType} />
            )}
          </div>
        )}
      </CModalBody>

      {/* ── Footer ── */}
      <CModalFooter style={{
        borderTop: '1px solid #f3f4f6', padding: '14px 24px',
        gap: 10, background: '#fafafa',
      }}>
        <CButton
          color="secondary"
          variant="ghost"
          onClick={handleClose}
          style={{ fontWeight: 600, fontSize: '0.875rem', padding: '8px 18px', borderRadius: 7 }}
        >
          Annuler
        </CButton>
        <CButton
          color={mainChoice === 'origin' ? 'success' : 'primary'}
          disabled={!canConfirm}
          onClick={handleConfirm}
          style={{
            fontWeight: 700, fontSize: '0.875rem', padding: '8px 20px', borderRadius: 7,
            display: 'flex', alignItems: 'center', gap: 8,
            opacity: canConfirm ? 1 : 0.5,
          }}
        >
          <CIcon icon={cilArrowCircleRight} style={{ width: 15 }} />
          {confirmLabel}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
