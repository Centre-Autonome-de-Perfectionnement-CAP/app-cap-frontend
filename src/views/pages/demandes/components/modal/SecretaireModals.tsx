// src/views/pages/demandes/components/modal/SecretaireModals.tsx
// ResendModal : une question simple (« À qui envoyer le dossier ? »),
// le point signalé rappelé en tête, présentation sobre.

import { useState } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton,
} from '@coreui/react'
import type { DocumentRequest } from '@/types/document-request.types'
import { RESEND_OPTIONS, ROLE_LABELS } from '@/types/document-request.types'
import RadioCard from '../ui/RadioCard'
import { ReportedIssue } from '../ui/StatusNote'

// ChefDivisionPicker and ChefDivisionModal removed due to backend auto-detection

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
  onConfirm: (resendTo: string) => void
}

export const ResendModal = ({ demande, visible, onClose, onConfirm }: ResendModalProps) => {
  const [mainChoice,  setMainChoice]  = useState<MainChoice>('')
  const [actorChoice, setActorChoice] = useState('')

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
      onConfirm(actorChoice)
    }
  }

  const canConfirm = mainChoice === 'origin' || (mainChoice === 'actor' && !!actorChoice)

  const confirmLabel = mainChoice === 'origin'
    ? `Renvoyer à ${originLabel ?? "l'acteur d'origine"}`
    : mainChoice === 'actor' && actorChoice
      ? `Envoyer à ${RESEND_OPTIONS.find(o => o.value === actorChoice)?.label ?? actorChoice}`
      : 'Choisissez un destinataire'

  const Choice = ({ value, title, hint, badge }: { value: MainChoice; title: React.ReactNode; hint?: string; badge?: string }) => {
    const on = mainChoice === value
    return (
      <div
        role="radio"
        aria-checked={on}
        tabIndex={0}
        onClick={() => { setMainChoice(value); if (value === 'origin') setActorChoice('') }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMainChoice(value) } }}
        style={{
          padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
          border: `1.5px solid ${on ? '#2563eb' : '#e2e8f0'}`,
          background: on ? '#eff6ff' : '#fff',
          transition: 'border-color 0.15s, background 0.15s',
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <span style={{
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
          border: `2px solid ${on ? '#2563eb' : '#cbd5e1'}`,
          boxShadow: on ? 'inset 0 0 0 3px #fff' : 'none',
          background: on ? '#2563eb' : '#fff',
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.93rem', color: '#0f172a' }}>{title}</div>
          {hint && <div style={{ fontSize: '0.83rem', color: '#64748b', marginTop: 2 }}>{hint}</div>}
        </div>
        {badge && (
          <span style={{
            fontSize: '0.72rem', padding: '2px 9px', borderRadius: 999,
            background: '#f1f5f9', color: '#334155', fontWeight: 700, whiteSpace: 'nowrap',
          }}>
            {badge}
          </span>
        )}
      </div>
    )
  }

  return (
    <CModal visible={visible} onClose={handleClose} alignment="center">

      <CModalHeader style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
        <CModalTitle>
          <div style={{ fontWeight: 800, fontSize: '1.02rem', color: '#0f172a' }}>Renvoyer le dossier</div>
          <div style={{ fontWeight: 500, fontSize: '0.82rem', color: '#64748b', marginTop: 2 }}>
            Réf. {demande.reference}
          </div>
        </CModalTitle>
      </CModalHeader>

      <CModalBody style={{ padding: '20px 24px' }}>
        <ReportedIssue
          from={demande.rejected_by || originLabel}
          reason={demande.rejected_reason}
        />

        <p style={{ fontSize: '0.88rem', color: '#334155', fontWeight: 600, marginBottom: 10 }}>
          À qui envoyer le dossier ?
        </p>

        <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {isInCircuit && originLabel && (
            <Choice
              value="origin"
              title={<>Renvoyer à {originLabel}</>}
              hint="La correction est faite : le dossier reprend son parcours normal."
              badge="Conseillé"
            />
          )}
          <Choice
            value="actor"
            title={isInCircuit && originLabel ? 'Envoyer à un autre acteur' : 'Choisir un acteur'}
            hint={isInCircuit ? 'Cet acteur vous renverra le dossier une fois sa vérification faite.' : undefined}
          />
        </div>

        {mainChoice === 'actor' && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
        )}
      </CModalBody>

      <CModalFooter style={{ borderTop: '1px solid #f1f5f9', padding: '14px 24px', gap: 10 }}>
        <CButton
          color="secondary"
          variant="ghost"
          onClick={handleClose}
          style={{ fontWeight: 600, fontSize: '0.9rem', padding: '8px 18px', borderRadius: 8 }}
        >
          Annuler
        </CButton>
        <CButton
          color="primary"
          disabled={!canConfirm}
          onClick={handleConfirm}
          style={{ fontWeight: 700, fontSize: '0.9rem', padding: '8px 20px', borderRadius: 8 }}
        >
          {confirmLabel}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}
