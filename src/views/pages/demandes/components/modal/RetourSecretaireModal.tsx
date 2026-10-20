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
import type { DocumentRequest } from '@/types/document-request.types'
import { ReportedIssue } from '../ui/StatusNote'

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

  const borderColor = hasStarted && !isValid ? '#fcd34d' : '#e2e8f0'

  const handleConfirm = () => {
    if (!isValid || loading) return
    onConfirm(comment.trim())
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center">

      <CModalHeader style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
        <CModalTitle>
          <div style={{ fontWeight: 800, fontSize: '1.02rem', color: '#0f172a' }}>Renvoyer à la Secrétaire</div>
          <div style={{ fontWeight: 500, fontSize: '0.875rem', color: '#64748b', marginTop: 2 }}>
            Réf. {demande?.reference ?? ''}
          </div>
        </CModalTitle>
      </CModalHeader>

      <CModalBody style={{ padding: '20px 24px' }}>
        <ReportedIssue from={demande?.rejected_by} reason={demande?.rejected_reason} />

        <label htmlFor="retour-secretaire-comment" style={{
          display: 'block', fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', marginBottom: 4,
        }}>
          Qu'avez-vous vérifié ou corrigé ?
        </label>
        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 10px' }}>
          Quelques mots suffisent. La Secrétaire les verra dans l'historique du dossier.
        </p>

        <CFormTextarea
          id="retour-secretaire-comment"
          rows={4}
          value={comment}
          onChange={e => setComment(e.target.value.slice(0, 1000))}
          placeholder="Ex : reçu de paiement vérifié, le dossier est complet."
          style={{
            fontSize: '0.95rem', lineHeight: 1.6, borderRadius: 10,
            border: `1.5px solid ${borderColor}`, padding: '12px 14px',
            resize: 'vertical', minHeight: 110, color: '#1f2937',
          }}
          disabled={loading}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.875rem' }}>
          <span style={{ color: hasStarted && !isValid ? '#b45309' : '#94a3b8' }}>
            {hasStarted && !isValid ? `Encore ${MIN_CHARS - charCount} caractère(s)` : 'Obligatoire'}
          </span>
          <span style={{ color: '#64748b' }}>{comment.length} / 1000</span>
        </div>
      </CModalBody>

      <CModalFooter style={{ borderTop: '1px solid #f1f5f9', padding: '14px 24px', gap: 10 }}>
        <CButton
          color="secondary"
          variant="ghost"
          onClick={onClose}
          disabled={loading}
          style={{ fontWeight: 600, fontSize: '0.9rem', padding: '8px 18px', borderRadius: 8 }}
        >
          Annuler
        </CButton>
        <CButton
          color="primary"
          disabled={!isValid || loading}
          onClick={handleConfirm}
          style={{ fontWeight: 700, fontSize: '0.9rem', padding: '8px 20px', borderRadius: 8 }}
        >
          {loading ? 'Envoi…' : 'Renvoyer à la Secrétaire'}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default RetourSecretaireModal
