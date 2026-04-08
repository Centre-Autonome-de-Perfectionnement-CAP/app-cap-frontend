// src/views/pages/demandes/components/DemandeModalShell.tsx
// Coquille CModal partagée — header standardisé + footer. Chaque dashboard passe ses boutons.

import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CBadge } from '@coreui/react'
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
    <CModalHeader className="border-bottom">
      <CModalTitle className="d-flex align-items-center gap-2 flex-wrap">
        <span>{title ?? 'Demande'}</span>
        <code className="text-muted" style={{ fontSize: '0.85rem' }}>#{demande.reference}</code>
        {showStatusBadge && <WorkflowBadge status={demande.status} size="sm" />}
        {demande.chef_division_type && (
          <CBadge color="info" style={{ fontSize: '0.7rem' }}>
            {CHEF_DIVISION_LABELS[demande.chef_division_type]}
          </CBadge>
        )}
      </CModalTitle>
    </CModalHeader>
    <CModalBody>{children}</CModalBody>
    <CModalFooter className="flex-wrap gap-2" style={{ background: '#f8fafc' }}>
      {footer}
    </CModalFooter>
  </CModal>
)

export default DemandeModalShell
