// src/views/pages/demandes/components/modal/SecretaireModals.tsx

import { useState } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilInfo, cilCheckCircle, cilArrowCircleRight, cilBan } from '@coreui/icons'
import type { DocumentRequest, ChefDivisionType } from '@/types/document-request.types'
import { RESEND_OPTIONS, CHEF_DIVISION_LABELS, ROLE_LABELS } from '@/types/document-request.types'
import RadioCard from '../ui/RadioCard'

// ─── ChefDivisionPicker ───────────────────────────────────────────────────────

interface ChefDivisionPickerProps {
  value: ChefDivisionType
  onChange: (v: ChefDivisionType) => void
}

export const ChefDivisionPicker = ({ value, onChange }: ChefDivisionPickerProps) => (
  <div style={{ marginTop: 12 }}>
    <p style={{
      fontWeight: 700, fontSize: '0.9rem', marginBottom: 10,
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
            flex: 1, padding: '12px 10px', borderRadius: 10, cursor: 'pointer',
            border: `2px solid ${value === t ? '#7c3aed' : '#e5e7eb'}`,
            background: value === t ? '#7c3aed' : 'white',
            color: value === t ? '#ffffff' : '#374151',
            fontWeight: 700, fontSize: '0.9rem', transition: 'all 0.15s',
            boxShadow: value === t ? '0 4px 10px rgba(124,58,237,0.25)' : 'none',
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
        <CModalTitle style={{ fontWeight: 800, fontSize: '1.1rem' }}>
          Choisir le Responsable Division
        </CModalTitle>
      </CModalHeader>
      <CModalBody style={{ padding: '24px' }}>
        <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: 16 }}>
          Sélectionnez le responsable de division concerné par ce dossier.
        </p>
        <ChefDivisionPicker value={type} onChange={setType} />
      </CModalBody>
      <CModalFooter style={{ padding: '16px 24px', gap: 10 }}>
        <CButton color="secondary" variant="ghost" onClick={onClose}
          style={{ fontWeight: 600, fontSize: '0.92rem' }}>Annuler</CButton>
        <CButton color="primary" onClick={() => onConfirm(type)}
          style={{ fontWeight: 700, fontSize: '0.92rem', padding: '8px 22px' }}>Confirmer</CButton>
      </CModalFooter>
    </CModal>
  )
}

// ─── ResendModal ──────────────────────────────────────────────────────────────
//
// Deux modes :
//
//   MODE CIRCUIT ACTIF (is_in_correction_circuit = true) :
//     1. Section VERTE  "✅ Correction terminée"  → renvoyer à l'acteur d'ORIGINE (sortir)
//     2. Section ORANGE "🔄 Envoyer à quelqu'un d'autre" → boucle supplémentaire
//
//   MODE NORMAL (is_in_correction_circuit = false / non défini) :
//     Liste des acteurs pour un simple renvoi

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
    onConfirm(resendTo, resendTo === 'chef-division' ? chefDivType : undefined)
  }

  const confirmLabel = resendTo === 'origin'
    ? `Sortir du circuit → ${originLabel}`
    : resendTo
      ? `Envoyer à ${RESEND_OPTIONS.find(o => o.value === resendTo)?.label ?? resendTo}`
      : 'Choisir une destination'

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" size="lg">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <CModalHeader style={{
        background: isInCircuit
          ? 'linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)'
          : 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
        borderBottom: `2px solid ${isInCircuit ? '#fca5a5' : '#bfdbfe'}`,
        padding: '22px 28px',
      }}>
        <CModalTitle style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {isInCircuit ? (
            <>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                color: '#fff', fontSize: '1.1rem', fontWeight: 900, flexShrink: 0,
                boxShadow: '0 4px 10px rgba(220,38,38,0.3)',
              }}>⟳</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#111827' }}>
                  Gérer la navette
                </div>
                <div style={{ fontWeight: 500, fontSize: '0.82rem', color: '#7f1d1d', marginTop: 2 }}>
                  Réf. {demande.reference}
                </div>
              </div>
            </>
          ) : (
            <>
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 40, height: 40, borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff', fontSize: '1.1rem', fontWeight: 900, flexShrink: 0,
                boxShadow: '0 4px 10px rgba(37,99,235,0.3)',
              }}>→</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#111827' }}>
                  Renvoyer le dossier
                </div>
                <div style={{ fontWeight: 500, fontSize: '0.82rem', color: '#1e40af', marginTop: 2 }}>
                  Réf. {demande.reference}
                </div>
              </div>
            </>
          )}
        </CModalTitle>
      </CModalHeader>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <CModalBody style={{ padding: '26px 30px' }}>

        {/* Contexte du rejet */}
        {demande.rejected_by && (
          <div style={{
            background: '#fef2f2', border: '1.5px solid #fecaca',
            borderLeft: '4px solid #dc2626',
            borderRadius: 10, padding: '14px 18px', marginBottom: 20,
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#7f1d1d', marginBottom: 4 }}>
              <CIcon icon={cilBan} style={{ width: 15, marginRight: 6 }} />
              Rejet signalé par : {demande.rejected_by}
            </div>
            {demande.rejected_reason && (
              <div style={{ fontSize: '0.88rem', color: '#991b1b', lineHeight: 1.6 }}>
                {demande.rejected_reason}
              </div>
            )}
          </div>
        )}

        {/* ── MODE CIRCUIT ACTIF ─────────────────────────────────────────────── */}
        {isInCircuit && originLabel && (
          <div style={{ marginBottom: 22 }}>

            {/* Section "Sortir du circuit" */}
            <div style={{
              fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.09em', color: '#15803d', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>✅ Correction terminée — Sortir du circuit</span>
              <span style={{ flex: 1, height: 1, background: '#bbf7d0' }} />
            </div>

            <div
              onClick={() => setResendTo('origin')}
              style={{
                padding: '18px 20px', borderRadius: 12, cursor: 'pointer',
                border: `2px solid ${resendTo === 'origin' ? '#15803d' : '#bbf7d0'}`,
                background: resendTo === 'origin'
                  ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
                  : '#f9fefb',
                transition: 'all 0.15s', marginBottom: 20,
                boxShadow: resendTo === 'origin' ? '0 4px 12px rgba(21,128,61,0.15)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                  border: `2px solid ${resendTo === 'origin' ? '#15803d' : '#86efac'}`,
                  background: resendTo === 'origin' ? '#15803d' : 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {resendTo === 'origin' && (
                    <CIcon icon={cilCheckCircle} style={{ width: 13, color: '#fff' }} />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#14532d', marginBottom: 5 }}>
                    Renvoyer à <em>{originLabel}</em> — reprendre le circuit normal
                  </div>
                  <div style={{ fontSize: '0.87rem', color: '#166534', lineHeight: 1.6 }}>
                    Le dossier retourne exactement là où le problème a été signalé.
                    Le circuit de correction sera fermé.
                  </div>
                </div>
                <CBadge color="success" style={{ fontSize: '0.7rem', alignSelf: 'center', padding: '5px 10px', whiteSpace: 'nowrap' }}>
                  Recommandé
                </CBadge>
              </div>
            </div>

            {/* Section "Envoyer à quelqu'un d'autre" */}
            <div style={{
              fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.09em', color: '#b45309', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>🔄 Envoyer à quelqu'un d'autre</span>
              <span style={{ flex: 1, height: 1, background: '#fed7aa' }} />
            </div>
            <p style={{ fontSize: '0.88rem', color: '#78350f', marginBottom: 14, lineHeight: 1.6 }}>
              Envoyer le dossier à un autre acteur pour une vérification complémentaire.
              Cet acteur devra vous le renvoyer obligatoirement.
            </p>
          </div>
        )}

        {/* ── TITRE MODE NORMAL ─────────────────────────────────────────────── */}
        {!isInCircuit && (
          <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 14, color: '#111827' }}>
            Choisir le niveau de renvoi
          </p>
        )}

        {/* ── LISTE DES ACTEURS ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 14 }}>
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

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <CModalFooter style={{
        borderTop: '1px solid #f3f4f6', padding: '18px 28px',
        gap: 12, background: '#fafafa',
      }}>
        <CButton color="secondary" variant="ghost" onClick={onClose}
          style={{ fontWeight: 600, fontSize: '0.95rem', padding: '10px 22px', borderRadius: 8 }}>
          Annuler
        </CButton>
        <CButton
          color={resendTo === 'origin' ? 'success' : 'primary'}
          disabled={!resendTo}
          onClick={handleConfirm}
          style={{
            fontWeight: 700, fontSize: '0.95rem', padding: '10px 26px', borderRadius: 8,
            display: 'flex', alignItems: 'center', gap: 10,
            background: !resendTo
              ? undefined
              : resendTo === 'origin'
                ? 'linear-gradient(135deg, #15803d 0%, #166534 100%)'
                : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            border: 'none', color: '#fff',
            boxShadow: resendTo ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
            opacity: resendTo ? 1 : 0.5,
          }}
        >
          <CIcon icon={cilArrowCircleRight} style={{ width: 17 }} />
          {confirmLabel}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
