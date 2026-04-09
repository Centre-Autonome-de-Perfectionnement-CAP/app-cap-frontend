// src/views/pages/demandes/components/table/DemandeTable.tsx
// Tableau générique partagé par tous les dashboards.
// La dernière colonne est toujours "Actions" avec fond distinct.

import React from 'react'
import {
  CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilInbox } from '@coreui/icons'
import type { DocumentRequest } from '@/types/document-request.types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ColumnDef {
  header: string
  width?: number
  isAction?: boolean   // marque la colonne Actions pour lui appliquer le style spécial
  render: (d: DocumentRequest) => React.ReactNode
}

interface Props {
  demandes: DocumentRequest[]
  loading: boolean
  columns: ColumnDef[]
  emptyMessage?: string
  onRowClick: (d: DocumentRequest) => void
}

// ─── Styles partagés ──────────────────────────────────────────────────────────

const TH_BASE: React.CSSProperties = {
  fontSize: '0.7rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  padding: '10px 14px',
  border: 'none',
  whiteSpace: 'nowrap',
}

const TH_NORMAL: React.CSSProperties = {
  ...TH_BASE,
  color: '#64748b',
  background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)',
}

const TH_ACTION: React.CSSProperties = {
  ...TH_BASE,
  color: '#1e40af',
  background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
  borderLeft: '2px solid #93c5fd',
  textAlign: 'center',
}

// ─── Composant ────────────────────────────────────────────────────────────────

const DemandeTable = ({
  demandes, loading, columns,
  emptyMessage = 'Aucun dossier en attente',
  onRowClick,
}: Props) => {
  if (loading) return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <CSpinner color="primary" style={{ width: 32, height: 32 }} />
      <div style={{ color: '#9ca3af', fontSize: '0.82rem', marginTop: 10 }}>Chargement…</div>
    </div>
  )

  if (demandes.length === 0) return (
    <div style={{ textAlign: 'center', padding: '56px 0', color: '#9ca3af' }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: '#f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 14px',
      }}>
        <CIcon icon={cilInbox} style={{ width: 26, height: 26, color: '#cbd5e1' }} />
      </div>
      <div style={{ fontWeight: 600, color: '#94a3b8', fontSize: '0.88rem' }}>{emptyMessage}</div>
    </div>
  )

  return (
    <CTable hover responsive style={{ marginBottom: 0, fontSize: '0.85rem' }}>
      <CTableHead>
        <CTableRow style={{ borderBottom: '2px solid #e2e8f0' }}>
          {columns.map((col, i) => (
            <CTableHeaderCell
              key={i}
              style={{
                ...(col.isAction ? TH_ACTION : TH_NORMAL),
                ...(col.width ? { width: col.width } : {}),
              }}
            >
              {col.header}
            </CTableHeaderCell>
          ))}
        </CTableRow>
      </CTableHead>

      <CTableBody>
        {demandes.map((d, rowIdx) => (
          <CTableRow
            key={d.id}
            onClick={() => onRowClick(d)}
            style={{
              cursor: 'pointer',
              transition: 'background 0.12s',
              borderBottom: '1px solid #f1f5f9',
              background: rowIdx % 2 === 0 ? '#ffffff' : '#fafbfc',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f0f7ff')}
            onMouseLeave={e => (e.currentTarget.style.background = rowIdx % 2 === 0 ? '#ffffff' : '#fafbfc')}
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
