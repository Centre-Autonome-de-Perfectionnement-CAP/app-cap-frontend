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
  fontSize: '0.85rem',
  fontWeight: 750,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  padding: '14px 16px',
  border: 'none',
  whiteSpace: 'nowrap',
}

const TH_NORMAL: React.CSSProperties = {
  ...TH_BASE,
  color: '#475569',
  background: '#f1f5f9',
}

const TH_ACTION: React.CSSProperties = {
  ...TH_BASE,
  color: '#1d4ed8',
  background: '#eff6ff',
  borderLeft: '2px solid #bfdbfe',
  textAlign: 'center',
}

// ─── Composant ────────────────────────────────────────────────────────────────

const DemandeTable = ({
  demandes, loading, columns,
  emptyMessage = 'Aucun dossier en attente',
  onRowClick,
}: Props) => {
  if (loading) return (
    <div style={{ textAlign: 'center', padding: '64px 0' }}>
      <CSpinner color="primary" style={{ width: 36, height: 36 }} />
      <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 12, fontWeight: 500 }}>Chargement…</div>
    </div>
  )

  if (demandes.length === 0) return (
    <div style={{ textAlign: 'center', padding: '72px 0', color: '#64748b' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: '#f1f5f9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}>
        <CIcon icon={cilInbox} style={{ width: 30, height: 30, color: '#94a3b8' }} />
      </div>
      <div style={{ fontWeight: 700, color: '#475569', fontSize: '1rem', letterSpacing: '-0.01em' }}>{emptyMessage}</div>
      <div style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: 4 }}>Aucune action requise pour le moment.</div>
    </div>
  )

  return (
    <CTable hover responsive style={{ marginBottom: 0, fontSize: '0.875rem' }}>
      <CTableHead>
        <CTableRow style={{ borderBottom: '2px solid #cbd5e1' }}>
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
              transition: 'background 0.12s, border-color 0.12s',
              borderBottom: '1px solid #e2e8f0',
              background: rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#eff6ff'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = rowIdx % 2 === 0 ? '#ffffff' : '#f8fafc'
            }}
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
