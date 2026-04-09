// src/views/pages/demandes/components/table/TableCells.tsx
// ─── Cellules atomiques partagées par tous les tableaux ───────────────────────

import React from 'react'
import { CTableDataCell, CBadge, CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilExternalLink } from '@coreui/icons'
import { WorkflowBadge } from '@/components/document-request'
import type { DocumentRequest } from '@/types/document-request.types'
import { TYPE_LABELS, CHEF_DIVISION_LABELS } from '@/types/document-request.types'

export const ReferenceCell = ({ d }: { d: DocumentRequest }) => (
  <CTableDataCell>
    <code style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2563eb', letterSpacing: '-0.01em' }}>
      #{d.reference}
    </code>
  </CTableDataCell>
)

export const EtudiantCell = ({ d, showDept = true }: { d: DocumentRequest; showDept?: boolean }) => (
  <CTableDataCell>
    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>
      {d.last_name} {d.first_names}
    </div>
    <small style={{ color: '#9ca3af', fontSize: '0.73rem' }}>
      {d.matricule || '—'}{showDept && d.department ? ` · ${d.department}` : ''}
    </small>
  </CTableDataCell>
)

export const TypeCell = ({ d }: { d: DocumentRequest }) => (
  <CTableDataCell>
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 5,
      fontSize: '0.72rem',
      fontWeight: 500,
      background: '#f1f5f9',
      color: '#475569',
      border: '1px solid #e2e8f0',
    }}>
      {TYPE_LABELS[d.type] ?? d.type}
    </span>
  </CTableDataCell>
)

export const DateCell = ({ d }: { d: DocumentRequest }) => (
  <CTableDataCell>
    <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
      {d.submitted_at ? new Date(d.submitted_at).toLocaleDateString('fr-FR') : '—'}
    </span>
  </CTableDataCell>
)

export const StatutCell = ({ d }: { d: DocumentRequest }) => (
  <CTableDataCell>
    <WorkflowBadge status={d.status} size="sm" />
    {d.chef_division_type && (
      <div style={{ marginTop: 4 }}>
        <span style={{
          fontSize: '0.62rem', padding: '1px 6px', borderRadius: 4,
          background: '#e0f2fe', color: '#0369a1', fontWeight: 500,
        }}>
          {CHEF_DIVISION_LABELS[d.chef_division_type]}
        </span>
      </div>
    )}
  </CTableDataCell>
)

export const ChefDivisionTypeCell = ({ d }: { d: DocumentRequest }) => (
  <CTableDataCell>
    {d.chef_division_type
      ? <CBadge color="info" style={{ fontSize: '0.72rem' }}>{CHEF_DIVISION_LABELS[d.chef_division_type]}</CBadge>
      : <span style={{ color: '#d1d5db' }}>—</span>}
  </CTableDataCell>
)

export const SignatureTypeCell = ({ d }: { d: DocumentRequest }) => (
  <CTableDataCell>
    {d.signature_type
      ? <CBadge color={d.signature_type === 'paraphe' ? 'primary' : 'success'} style={{ fontSize: '0.72rem' }}>
          {d.signature_type === 'paraphe' ? 'Paraphe' : 'Signature complète'}
        </CBadge>
      : <span style={{ color: '#d1d5db' }}>—</span>}
  </CTableDataCell>
)

/** ActionCell — bouton standardisé dans la colonne Actions */
export const ActionCell = ({ onOpen }: { onOpen: () => void }) => (
  <CTableDataCell style={{ textAlign: 'center' }}>
    <CButton
      size="sm"
      onClick={e => { e.stopPropagation(); onOpen() }}
      title="Ouvrir le dossier"
      style={{
        background: '#2563eb',
        border: 'none',
        borderRadius: 7,
        padding: '5px 10px',
        color: '#fff',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: '0.75rem',
        fontWeight: 500,
        transition: 'background 0.15s, transform 0.1s',
      }}
      onMouseEnter={e => {
        const b = e.currentTarget as HTMLButtonElement
        b.style.background = '#1d4ed8'
        b.style.transform = 'scale(1.04)'
      }}
      onMouseLeave={e => {
        const b = e.currentTarget as HTMLButtonElement
        b.style.background = '#2563eb'
        b.style.transform = 'scale(1)'
      }}
    >
      <CIcon icon={cilExternalLink} style={{ width: 13, height: 13 }} />
      Ouvrir
    </CButton>
  </CTableDataCell>
)
