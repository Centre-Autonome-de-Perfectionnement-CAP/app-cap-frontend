// src/views/pages/demandes/components/table/TableCells.tsx

import React from 'react'
import { CTableDataCell, CBadge, CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilExternalLink, cilWarning } from '@coreui/icons'
import { WorkflowBadge } from '@/components/document-request'
import type { DocumentRequest } from '@/types/document-request.types'
import { TYPE_LABELS, CHEF_DIVISION_LABELS } from '@/types/document-request.types'

export const ReferenceCell = ({ d }: { d: DocumentRequest }) => (
  <CTableDataCell style={{ verticalAlign: 'middle' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <code style={{ fontSize: '0.875rem', fontWeight: 800, color: '#1d4ed8', letterSpacing: '-0.015em', background: '#eff6ff', padding: '3px 8px', borderRadius: 6 }}>
        #{d.reference}
      </code>
      {!!(d as any).has_flag && (
        <CIcon
          icon={cilWarning}
          title="Réserve active"
          style={{ width: 14, color: '#d97706', flexShrink: 0 }}
        />
      )}
    </div>
  </CTableDataCell>
)

export const EtudiantCell = ({ d, showDept = true }: { d: DocumentRequest; showDept?: boolean }) => (
  <CTableDataCell style={{ verticalAlign: 'middle' }}>
    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a' }}>
      {d.last_name} {d.first_names}
    </div>
    <small style={{ color: '#64748b', fontSize: '0.82rem', marginTop: 1, display: 'block', fontWeight: 500 }}>
      {d.matricule || '—'}{showDept && d.department ? ` · ${d.department}` : ''}
    </small>
  </CTableDataCell>
)

export const TypeCell = ({ d }: { d: DocumentRequest }) => (
  <CTableDataCell style={{ verticalAlign: 'middle' }}>
    <span style={{
      display: 'inline-block', padding: '4px 10px', borderRadius: 6,
      fontSize: '0.82rem', fontWeight: 600,
      background: '#f8fafc', color: '#334155', border: '1.5px solid #e2e8f0',
    }}>
      {TYPE_LABELS[d.type] ?? d.type}
    </span>
  </CTableDataCell>
)

export const DateCell = ({ d }: { d: DocumentRequest }) => {
  const dateStr = d.submitted_at || d.created_at
  if (!dateStr) return <CTableDataCell style={{ verticalAlign: 'middle' }}>—</CTableDataCell>

  const dateObj = new Date(dateStr)
  const formattedDate = dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const formattedTime = dateObj.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <CTableDataCell style={{ verticalAlign: 'middle' }}>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: 600 }}>
          {formattedDate}
        </span>
        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 500, marginTop: 2 }}>
          {formattedTime}
        </span>
      </div>
    </CTableDataCell>
  )
}

export const StatutCell = ({ d }: { d: DocumentRequest }) => (
  <CTableDataCell style={{ verticalAlign: 'middle' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <WorkflowBadge status={d.status} size="sm" />
      {!!(d as any).has_flag && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: '0.76rem', padding: '2px 8px', borderRadius: 5,
          background: '#fffbeb', color: '#b45309',
          border: '1px solid #fef3c7', fontWeight: 700,
        }}>
          <CIcon icon={cilWarning} style={{ width: 11 }} />
          Réserve
        </span>
      )}
    </div>
    {d.chef_division_type && (
      <div style={{ marginTop: 5 }}>
        <span style={{
          fontSize: '0.74rem', padding: '2px 7px', borderRadius: 5,
          background: '#e0f2fe', color: '#0369a1', fontWeight: 600,
        }}>
          {CHEF_DIVISION_LABELS[d.chef_division_type]}
        </span>
      </div>
    )}
  </CTableDataCell>
)

export const ChefDivisionTypeCell = ({ d }: { d: DocumentRequest }) => (
  <CTableDataCell style={{ verticalAlign: 'middle' }}>
    {d.chef_division_type
      ? <CBadge color="info" style={{ fontSize: '0.82rem', padding: '5px 8px' }}>{CHEF_DIVISION_LABELS[d.chef_division_type]}</CBadge>
      : <span style={{ color: '#cbd5e1' }}>—</span>}
  </CTableDataCell>
)

export const SignatureTypeCell = ({ d }: { d: DocumentRequest }) => (
  <CTableDataCell style={{ verticalAlign: 'middle' }}>
    {d.signature_type
      ? <CBadge color={d.signature_type === 'paraphe' ? 'primary' : 'success'} style={{ fontSize: '0.82rem', padding: '5px 8px' }}>
          {d.signature_type === 'paraphe' ? 'Paraphe' : 'Signature complète'}
        </CBadge>
      : <span style={{ color: '#cbd5e1' }}>—</span>}
  </CTableDataCell>
)

export const ActionCell = ({ onOpen }: { onOpen: () => void }) => (
  <CTableDataCell style={{ textAlign: 'center', verticalAlign: 'middle' }}>
    <CButton
      size="sm"
      onClick={e => { e.stopPropagation(); onOpen() }}
      title="Ouvrir le dossier"
      style={{
        background: '#2563eb', border: 'none', borderRadius: 6,
        padding: '6px 12px', color: '#fff',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: '0.82rem', fontWeight: 600,
        transition: 'background 0.15s, transform 0.1s',
        boxShadow: '0 2px 6px rgba(37,99,235,0.2)',
      }}
      onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#1d4ed8'; b.style.transform = 'scale(1.04)' }}
      onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = '#2563eb'; b.style.transform = 'scale(1)' }}
    >
      <CIcon icon={cilExternalLink} style={{ width: 14, height: 14 }} />
      Ouvrir
    </CButton>
  </CTableDataCell>
)
