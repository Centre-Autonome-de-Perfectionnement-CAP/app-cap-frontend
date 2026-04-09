// src/views/pages/demandes/components/modal/DemandeModalShell.tsx

import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter } from '@coreui/react'
import { WorkflowBadge } from '@/components/document-request'
import type { DocumentRequest } from '@/types/document-request.types'
import { CHEF_DIVISION_LABELS } from '@/types/document-request.types'

interface Props {
  demande: DocumentRequest
  visible: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer: React.ReactNode
  showStatusBadge?: boolean
}

const DemandeModalShell = ({
  demande, visible, onClose,
  title, children, footer,
  showStatusBadge = true,
}: Props) => (
  <CModal visible={visible} onClose={onClose} size="lg" alignment="center" scrollable>
    <CModalHeader style={{ borderBottom: '1px solid #f1f5f9', padding: '14px 20px' }}>
      <CModalTitle style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: '1rem' }}>
        <span style={{ fontWeight: 700, color: '#111827' }}>{title ?? 'Demande'}</span>
        <code style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>#{demande.reference}</code>
        {showStatusBadge && <WorkflowBadge status={demande.status} size="sm" />}
        {demande.chef_division_type && (
          <span style={{
            fontSize: '0.68rem', padding: '2px 8px', borderRadius: 5,
            background: '#e0f2fe', color: '#0369a1', fontWeight: 600,
          }}>
            {CHEF_DIVISION_LABELS[demande.chef_division_type]}
          </span>
        )}
      </CModalTitle>
    </CModalHeader>

    <CModalBody style={{ padding: '20px 24px' }}>{children}</CModalBody>

    <CModalFooter style={{
      background: '#f8fafc',
      borderTop: '1px solid #f1f5f9',
      padding: '12px 20px',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'flex-end',
    }}>
      {footer}
    </CModalFooter>
  </CModal>
)

export default DemandeModalShell
