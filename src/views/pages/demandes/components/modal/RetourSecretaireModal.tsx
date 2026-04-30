// src/views/pages/demandes/components/modal/RetourSecretaireModal.tsx
//
// Modal partagée utilisée par tous les acteurs (Comptable, Chef Division,
// Chef CAP, Sec. Dir. Adjointe, Directrice Adjointe, Sec. Directeur, Directeur)
// pour renvoyer un dossier à la Secrétaire avec un commentaire OBLIGATOIRE.

import { useState, useEffect } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CFormTextarea,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilWarning, cilArrowLeft, cilCheckCircle } from '@coreui/icons'
import type { DocumentRequest } from '@/types/document-request.types'

interface Props {
  visible: boolean
  demande: DocumentRequest | null
  loading?: boolean
  onClose: () => void
  onConfirm: (comment: string) => void
}

const MIN_CHARS = 5

const RetourSecretaireModal = ({ visible, demande, loading = false, onClose, onConfirm }: Props) => {
  const [comment, setComment] = useState('')

  // Réinitialiser le commentaire à chaque ouverture
  useEffect(() => {
    if (visible) setComment('')
  }, [visible])

  const charCount  = comment.trim().length
  const isValid    = charCount >= MIN_CHARS
  const hasStarted = comment.length > 0

  const borderColor = !hasStarted
    ? '#e5e7eb'
    : isValid
      ? '#22c55e'
      : '#fca5a5'

  const handleConfirm = () => {
    if (!isValid || loading) return
    onConfirm(comment.trim())
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" size="lg">

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <CModalHeader style={{
        background: 'linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)',
        borderBottom: '2px solid #fed7aa',
        padding: '22px 28px',
      }}>
        <CModalTitle style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            color: '#fff', fontSize: '1.25rem', fontWeight: 900, flexShrink: 0,
            boxShadow: '0 4px 12px rgba(249,115,22,0.35)',
          }}>↩</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#111827', lineHeight: 1.2 }}>
              Renvoyer à la Secrétaire
            </div>
            <div style={{ fontWeight: 500, fontSize: '0.82rem', color: '#92400e', marginTop: 3 }}>
              {demande?.reference ?? ''} — Commentaire obligatoire
            </div>
          </div>
        </CModalTitle>
      </CModalHeader>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <CModalBody style={{ padding: '28px 32px' }}>

        {/* Bandeau d'information */}
        <div style={{
          background: 'linear-gradient(135deg, #fffbeb 0%, #fff7ed 100%)',
          border: '1.5px solid #fcd34d',
          borderLeft: '4px solid #f59e0b',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 14,
        }}>
          <CIcon icon={cilWarning} style={{ width: 22, color: '#d97706', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.97rem', color: '#78350f', marginBottom: 5 }}>
              Expliquez ce que vous avez corrigé
            </div>
            <div style={{ fontSize: '0.88rem', color: '#92400e', lineHeight: 1.65 }}>
              La Secrétaire doit comprendre l'état du dossier après votre correction.
              Ce commentaire sera enregistré dans l'historique et visible par tous les acteurs.
            </div>
          </div>
        </div>

        {/* Zone de commentaire */}
        <div>
          <label style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontWeight: 700, fontSize: '1rem', color: '#111827',
            marginBottom: 10,
          }}>
            Votre commentaire
            <span style={{ color: '#dc2626', fontSize: '1.1rem' }}>*</span>
          </label>

          <CFormTextarea
            rows={5}
            value={comment}
            onChange={e => setComment(e.target.value.slice(0, 1000))}
            placeholder="Ex : J'ai vérifié le reçu de paiement — il est bien présent. Le dossier est maintenant complet et peut reprendre le circuit normal…"
            style={{
              fontSize: '0.98rem',
              lineHeight: 1.7,
              borderRadius: 12,
              border: `2px solid ${borderColor}`,
              padding: '14px 16px',
              resize: 'vertical',
              minHeight: 130,
              transition: 'border-color 0.2s, box-shadow 0.2s',
              boxShadow: isValid ? '0 0 0 3px rgba(34,197,94,0.12)' : 'none',
              color: '#1f2937',
            }}
            disabled={loading}
          />

          {/* Indicateur de progression */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 8, fontSize: '0.82rem',
          }}>
            <span style={{ color: !hasStarted ? '#9ca3af' : isValid ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
              {!hasStarted
                ? `Minimum ${MIN_CHARS} caractères requis`
                : isValid
                  ? <><CIcon icon={cilCheckCircle} style={{ width: 14, marginRight: 4 }} />Commentaire valide</>
                  : `Encore ${MIN_CHARS - charCount} caractère(s) requis`
              }
            </span>
            <span style={{ color: '#9ca3af' }}>
              {comment.length} / 1000
            </span>
          </div>
        </div>
      </CModalBody>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <CModalFooter style={{
        borderTop: '1px solid #f3f4f6',
        padding: '18px 28px',
        gap: 12,
        background: '#fafafa',
      }}>
        <CButton
          color="secondary"
          variant="ghost"
          onClick={onClose}
          disabled={loading}
          style={{ fontWeight: 600, fontSize: '0.95rem', padding: '10px 22px', borderRadius: 8 }}
        >
          Annuler
        </CButton>

        <CButton
          color="warning"
          disabled={!isValid || loading}
          onClick={handleConfirm}
          style={{
            fontWeight: 700,
            fontSize: '0.97rem',
            padding: '10px 26px',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: isValid ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : undefined,
            border: 'none',
            color: '#fff',
            boxShadow: isValid ? '0 4px 12px rgba(249,115,22,0.3)' : 'none',
            opacity: isValid ? 1 : 0.55,
            transition: 'all 0.2s',
          }}
        >
          {loading ? (
            <span>Envoi…</span>
          ) : (
            <>
              <CIcon icon={cilArrowLeft} style={{ width: 17 }} />
              Renvoyer à la Secrétaire
            </>
          )}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default RetourSecretaireModal
