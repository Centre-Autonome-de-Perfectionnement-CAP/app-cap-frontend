// src/views/pages/demandes/components/modal/LegacyDeclarationPanel.tsx
// Demande d'un ANCIEN ÉTUDIANT (déclaré, inscrit avant 2023).
// Décision D1 : la secrétaire (ou l'admin) vérifie et valide la déclaration
// depuis le dossier ; « Valider → Comptable » reste bloqué tant qu'elle n'est
// pas validée. Un rejet de la déclaration rejette en cascade les demandes
// ouvertes de l'étudiant (notifié par email + WhatsApp).

import { useState } from 'react'
import { CAlert } from '@coreui/react'
import { showSuccess, showError, friendlyError } from '@/components/common/ActionResult'
import CIcon from '@coreui/icons-react'
import { cilBan, cilCheckAlt, cilHistory } from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import legacyStudentAdminService from '@/services/legacyStudentAdminService'
import type { DocumentRequest, LegacyDeclarationStatus } from '@/types/document-request.types'
import ActionButton from '../ui/ActionButton'

const STATUS_UI: Record<LegacyDeclarationStatus, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: 'Déclaration à vérifier', color: '#92400e', bg: '#fffbeb', border: '#f59e0b' },
  validated: { label: 'Déclaration validée',     color: '#166534', bg: '#f0fdf4', border: '#22c55e' },
  rejected:  { label: 'Déclaration rejetée',     color: '#991b1b', bg: '#fef2f2', border: '#ef4444' },
}

export const LegacyBadge = ({ status }: { status?: LegacyDeclarationStatus | null }) => {
  const ui = status ? STATUS_UI[status] : null
  return (
    <span
      title={ui?.label ?? 'Ancien étudiant'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: '0.875rem', fontWeight: 700, padding: '2px 8px', borderRadius: 5,
        background: ui?.bg ?? '#eef2ff', color: ui?.color ?? '#3730a3',
        border: `1px solid ${ui?.border ?? '#c7d2fe'}`, whiteSpace: 'nowrap',
      }}
    >
      <CIcon icon={cilHistory} size="sm" />
      Ancien étudiant{status === 'pending' ? ' · à vérifier' : ''}
    </span>
  )
}

const Line = ({ label, value }: { label: string; value?: string | number | null }) =>
  value ? (
    <div style={{ fontSize: '0.875rem', color: '#374151', marginBottom: 4 }}>
      <span style={{ color: '#6b7280' }}>{label} : </span><strong>{value}</strong>
    </div>
  ) : null

interface Props {
  demande: DocumentRequest
  /** Actions de validation / rejet (secrétaire et admin uniquement). */
  canDecide?: boolean
  onChanged: () => Promise<void>
}

const LegacyDeclarationPanel = ({ demande, canDecide = false, onChanged }: Props) => {
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)

  const status = (demande.legacy_declaration_status ?? 'pending') as LegacyDeclarationStatus
  const ui     = STATUS_UI[status]
  const id     = demande.legacy_student_id

  const validate = async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      await legacyStudentAdminService.validate(id)
      await onChanged()
      await showSuccess('Déclaration validée', "L'ancien étudiant est prévenu. Ses demandes peuvent maintenant être transmises au Comptable.")
    } catch (e: any) {
      await showError("La déclaration n'a pas été validée", friendlyError(e))
    } finally {
      setLoading(false)
    }
  }

  const reject = async (motif: string) => {
    if (!id) return
    try {
      await legacyStudentAdminService.reject(id, motif)
    } catch (e: any) {
      const msg = friendlyError(e)
      await showError("La déclaration n'a pas été rejetée", msg)
      throw new Error(msg)
    }
    await onChanged()
    await showSuccess('Déclaration rejetée', "L'ancien étudiant est informé du motif par e-mail et WhatsApp.")
  }

  return (
    <div style={{
      background: ui.bg, border: `1.5px solid ${ui.border}`, borderLeft: `5px solid ${ui.border}`,
      borderRadius: 12, padding: '14px 16px', marginBottom: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, color: ui.color, fontSize: '0.95rem' }}>
          Ancien étudiant - {ui.label}
        </div>
        {canDecide && status === 'pending' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <ActionButton
              label="Rejeter la déclaration"
              icon={cilBan}
              color="danger"
              variant="outline"
              disabled={loading}
              onClick={() => setRejectOpen(true)}
            />
            <ActionButton
              label="Valider la déclaration"
              icon={cilCheckAlt}
              color="success"
              loading={loading}
              disabled={loading}
              onClick={validate}
            />
          </div>
        )}
      </div>

      <div style={{ marginTop: 10 }}>
        <Line label="Année d'inscription" value={demande.legacy_enrollment_year} />
        <Line label="Cycle déclaré"       value={demande.legacy_cycle} />
        <Line label="Lieu de naissance"   value={demande.legacy_place_of_birth} />
        <Line label="Email déclaré"       value={demande.legacy_email} />
        <Line label="Téléphone déclaré"   value={demande.legacy_phone} />
        <Line label="Année du bulletin demandée" value={demande.bulletin_year} />
      </div>

      {status === 'pending' && (
        <div style={{ fontSize: '0.875rem', color: '#78350f', marginTop: 8 }}>
          Vérifiez l'identité et le cursus dans les registres avant de valider.
          La transmission au comptable est bloquée tant que la déclaration n'est pas validée.
        </div>
      )}
      {status === 'rejected' && demande.legacy_rejection_reason && (
        <div style={{ fontSize: '0.875rem', color: '#991b1b', marginTop: 8 }}>
          Motif : {demande.legacy_rejection_reason}
        </div>
      )}

      {error && <CAlert color="danger" className="mt-2 mb-0 py-2" style={{ fontSize: '0.875rem' }}>{error}</CAlert>}

      <MotifModal
        visible={rejectOpen}
        title="Rejeter la déclaration de l'ancien étudiant"
        placeholder="Motif envoyé à l'étudiant (email + WhatsApp). Toutes ses demandes en cours seront rejetées."
        confirmLabel="Rejeter la déclaration"
        confirmColor="danger"
        onClose={() => setRejectOpen(false)}
        onConfirm={reject}
      />
    </div>
  )
}

export default LegacyDeclarationPanel
