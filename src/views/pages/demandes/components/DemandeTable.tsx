// src/views/pages/demandes/components/DemandeTable.tsx
// Tableau générique partagé par tous les dashboards.
// ⚠ ActionCell reçoit maintenant onOpen correctement câblé depuis chaque dashboard.

import React from 'react'
import {
  CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CButton, CSpinner, CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilInbox, cilExternalLink,
} from '@coreui/icons'
import { WorkflowBadge } from '@/components/document-request'
import type { DocumentRequest } from '@/types/document-request.types'
import { TYPE_LABELS, CHEF_DIVISION_LABELS } from '@/types/document-request.types'

// ─── Cellules prédéfinies réutilisables ───────────────────────────────────────

export const ReferenceCell = ({ d }: { d: DocumentRequest }) => (
  <CTableDataCell>
    <code className="text-primary" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
      #{d.reference}
    </code>
  </CTableDataCell>
)

export const EtudiantCell = ({ d, showDept = true }: { d: DocumentRequest; showDept?: boolean }) => (
  <CTableDataCell>
    <div className="fw-semibold" style={{ fontSize: '0.88rem', color: '#111827' }}>
      {d.last_name} {d.first_names}
    </div>
    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
      {d.matricule || '—'}{showDept && d.department ? ` · ${d.department}` : ''}
    </small>
  </CTableDataCell>
)

export const TypeCell = ({ d }: { d: DocumentRequest }) => (
  <CTableDataCell>
    <CBadge color="light" textColor="dark" style={{ fontSize: '0.72rem', fontWeight: 500 }}>
      {TYPE_LABELS[d.type] ?? d.type}
    </CBadge>
  </CTableDataCell>
)

export const DateCell = ({ d }: { d: DocumentRequest }) => (
  <CTableDataCell>
    <small className="text-muted">
      {d.submitted_at ? new Date(d.submitted_at).toLocaleDateString('fr-FR') : '—'}
    </small>
  </CTableDataCell>
)

export const StatutCell = ({ d }: { d: DocumentRequest }) => (
  <CTableDataCell>
    <WorkflowBadge status={d.status} size="sm" />
    {d.chef_division_type && (
      <div className="mt-1">
        <CBadge color="light" textColor="dark" style={{ fontSize: '0.62rem' }}>
          {CHEF_DIVISION_LABELS[d.chef_division_type]}
        </CBadge>
      </div>
    )}
  </CTableDataCell>
)

export const ChefDivisionTypeCell = ({ d }: { d: DocumentRequest }) => (
  <CTableDataCell>
    {d.chef_division_type
      ? <CBadge color="info">{CHEF_DIVISION_LABELS[d.chef_division_type]}</CBadge>
      : <span className="text-muted">—</span>}
  </CTableDataCell>
)

export const SignatureTypeCell = ({ d }: { d: DocumentRequest }) => (
  <CTableDataCell>
    {d.signature_type
      ? <CBadge color={d.signature_type === 'paraphe' ? 'primary' : 'success'}>
          {d.signature_type === 'paraphe' ? 'Paraphe' : 'Signature complète'}
        </CBadge>
      : <span className="text-muted">—</span>}
  </CTableDataCell>
)

/** ActionCell — onOpen doit être correctement passé (pas un no-op) */
export const ActionCell = ({ onOpen }: { onOpen: () => void }) => (
  <CTableDataCell>
    <CButton
      color="primary" size="sm" variant="ghost"
      onClick={e => { e.stopPropagation(); onOpen() }}
      title="Ouvrir le dossier"
    >
      <CIcon icon={cilExternalLink} />
    </CButton>
  </CTableDataCell>
)

// ─── Composant tableau principal ──────────────────────────────────────────────

export interface ColumnDef {
  header: string
  width?: number
  render: (d: DocumentRequest) => React.ReactNode
}

interface Props {
  demandes: DocumentRequest[]
  loading: boolean
  columns: ColumnDef[]
  emptyMessage?: string
  onRowClick: (d: DocumentRequest) => void
}

const DemandeTable = ({
  demandes, loading, columns,
  emptyMessage = 'Aucun dossier en attente',
  onRowClick,
}: Props) => {
  if (loading) return (
    <div className="text-center py-5">
      <CSpinner color="primary" />
      <div className="text-muted small mt-2">Chargement…</div>
    </div>
  )

  if (demandes.length === 0) return (
    <div className="text-center py-5 text-muted">
      <div style={{
        width: 56, height: 56, borderRadius: '50%', background: '#f3f4f6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 12px',
      }}>
        <CIcon icon={cilInbox} style={{ width: 28, height: 28, color: '#9ca3af' }} />
      </div>
      <div className="fw-semibold" style={{ color: '#6b7280' }}>{emptyMessage}</div>
    </div>
  )

  return (
    <CTable hover responsive className="align-middle mb-0">
      <CTableHead style={{
        background: 'linear-gradient(to right, #f8fafc, #f1f5f9)',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: '#6b7280',
      }}>
        <CTableRow>
          {columns.map((col, i) => (
            <CTableHeaderCell key={i} style={col.width ? { width: col.width } : {}}>
              {col.header}
            </CTableHeaderCell>
          ))}
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {demandes.map(d => (
          <CTableRow
            key={d.id}
            style={{ cursor: 'pointer', transition: 'background 0.1s' }}
            onClick={() => onRowClick(d)}
          >
            {columns.map((col, i) => (
              <React.Fragment key={i}>{col.render(d)}</React.Fragment>
            ))}
          </CTableRow>
        ))}
      </CTableBody>
    </CTable>
  )
}

export default DemandeTable
