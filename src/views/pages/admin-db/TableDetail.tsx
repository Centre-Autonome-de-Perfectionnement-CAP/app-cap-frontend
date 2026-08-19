// src/views/pages/admin-db/TableDetail.tsx
//
// Studio de données : vue détaillée, recherche rapide, export CSV et actions CRUD directes.

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CButton, CSpinner, CAlert, CFormInput, CBadge,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilArrowLeft, cilPlus, cilPencil, cilTrash, cilReload, cilCloudDownload,
  cilSearch, cilColumns,
} from '@coreui/icons'
import adminDbService, { type AdminTableData } from '@/services/adminDb.service'
import RecordFormModal from './components/RecordFormModal'
import ConfirmDeleteModal from './components/ConfirmDeleteModal'
import { ADMIN_DB_BASE_PATH } from './constants'

const formatCell = (value: any): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.88rem' }}>NULL</span>
  }
  if (value === '') {
    return <span style={{ color: '#cbd5e1', fontSize: '0.85rem' }}>—</span>
  }
  if (typeof value === 'boolean' || value === 1 && typeof value === 'number' && (value === 0 || value === 1)) {
    // Si c'est un pur booléen
    if (typeof value === 'boolean') {
      return (
        <CBadge color={value ? 'success' : 'secondary'} shape="rounded-pill" style={{ fontSize: '0.78rem', padding: '3px 8px' }}>
          {value ? 'true' : 'false'}
        </CBadge>
      )
    }
  }
  const str = String(value)
  if (str.length > 50) {
    return <span title={str}>{str.substring(0, 48)}…</span>
  }
  return str
}

const TableDetail = () => {
  const { table } = useParams<{ table: string }>()
  const navigate = useNavigate()

  const [data, setData]       = useState<AdminTableData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [page, setPage]       = useState(1)
  const [filterQuery, setFilterQuery] = useState('')

  const [editingRow, setEditingRow]   = useState<Record<string, any> | null>(null)
  const [creating, setCreating]       = useState(false)
  const [deletingRow, setDeletingRow] = useState<Record<string, any> | null>(null)

  const load = useCallback(() => {
    if (!table) return
    setLoading(true)
    setError(null)
    adminDbService
      .getTableData(table, page)
      .then((res) => setData(res.data))
      .catch(() => setError('Impossible de charger cette table.'))
      .finally(() => setLoading(false))
  }, [table, page])

  useEffect(() => {
    load()
  }, [load])

  const columns = data?.columns ?? []
  const rows = data?.rows ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1

  // Filtre client sur les lignes actuellement chargées
  const filteredRows = useMemo(() => {
    if (!filterQuery.trim()) return rows
    const q = filterQuery.toLowerCase().trim()
    return rows.filter((r) =>
      Object.values(r).some((v) => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
    )
  }, [rows, filterQuery])

  // Export CSV
  const exportCsv = () => {
    if (!rows.length || !columns.length) return
    const headers = columns.join(';')
    const csvRows = rows.map((r) =>
      columns.map((c) => {
        const val = r[c] ?? ''
        const escaped = String(val).replace(/"/g, '""')
        return `"${escaped}"`
      }).join(';')
    )
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...csvRows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `${table}_export_page_${page}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!table) return null

  return (
    <div style={{ padding: '28px 36px', background: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 1600, margin: '0 auto' }}>
        
        {/* Navigation & Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CButton
              color="light"
              onClick={() => navigate(ADMIN_DB_BASE_PATH)}
              style={{
                fontSize: '0.9rem',
                fontWeight: 700,
                border: '1.5px solid #cbd5e1',
                borderRadius: 8,
                background: '#ffffff',
                padding: '6px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <CIcon icon={cilArrowLeft} />
              Toutes les tables
            </CButton>

            <span style={{ color: '#94a3b8' }}>/</span>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
              {table}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CButton
              color="light"
              onClick={load}
              disabled={loading}
              title="Rafraîchir les données"
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                border: '1.5px solid #cbd5e1',
                borderRadius: 8,
                background: '#ffffff',
                padding: '8px 14px',
              }}
            >
              <CIcon icon={cilReload} style={{ marginRight: 6 }} />
              Actualiser
            </CButton>

            <CButton
              color="light"
              onClick={exportCsv}
              disabled={!rows.length}
              title="Exporter cette page en CSV"
              style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                border: '1.5px solid #cbd5e1',
                borderRadius: 8,
                background: '#ffffff',
                padding: '8px 14px',
              }}
            >
              <CIcon icon={cilCloudDownload} style={{ marginRight: 6 }} />
              Export CSV
            </CButton>

            <CButton
              color="primary"
              onClick={() => setCreating(true)}
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                padding: '8px 20px',
                borderRadius: 8,
                background: '#4f46e5',
                borderColor: '#4f46e5',
                boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
              }}
            >
              <CIcon icon={cilPlus} style={{ marginRight: 6 }} />
              Nouvelle ligne
            </CButton>
          </div>
        </div>

        {/* Header Table Info & Search */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: 12,
            border: '1.5px solid #e2e8f0',
            padding: '18px 24px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: 'monospace' }}>
              {table}
            </h2>
            <span
              style={{
                fontSize: '0.85rem',
                fontWeight: 700,
                padding: '3px 10px',
                borderRadius: 20,
                background: '#eef2ff',
                color: '#4f46e5',
              }}
            >
              {data?.total ?? 0} ligne{(data?.total ?? 0) > 1 ? 's' : ''} au total
            </span>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#64748b',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <CIcon icon={cilColumns} style={{ width: 14, height: 14 }} />
              {columns.length} colonnes
            </span>
          </div>

          <div style={{ width: 320, position: 'relative' }}>
            <CIcon
              icon={cilSearch}
              style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', width: 16, height: 16 }}
            />
            <CFormInput
              type="text"
              placeholder="Filtrer dans la page..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              style={{
                height: 38,
                paddingLeft: 36,
                fontSize: '0.9rem',
                borderRadius: 8,
                border: '1.5px solid #cbd5e1',
              }}
            />
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '80px 0', background: '#ffffff', borderRadius: 12, border: '1.5px solid #e2e8f0' }}>
            <CSpinner color="primary" style={{ width: 40, height: 40 }} />
            <p style={{ marginTop: 14, color: '#64748b', fontWeight: 600 }}>Chargement des données de {table}...</p>
          </div>
        )}

        {error && (
          <CAlert color="danger" style={{ fontSize: '1rem', fontWeight: 600, borderRadius: 10 }}>
            {error}
          </CAlert>
        )}

        {!loading && !error && (
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto', maxHeight: '68vh' }}>
              <CTable hover style={{ marginBottom: 0, fontSize: '0.92rem', borderCollapse: 'separate', borderSpacing: 0 }}>
                <CTableHead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <CTableRow style={{ background: '#f1f5f9' }}>
                    <CTableHeaderCell
                      style={{
                        padding: '12px 14px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: '#475569',
                        textTransform: 'uppercase',
                        borderBottom: '2px solid #cbd5e1',
                        whiteSpace: 'nowrap',
                        width: 100,
                        textAlign: 'center',
                        background: '#f1f5f9',
                      }}
                    >
                      Actions
                    </CTableHeaderCell>
                    {columns.map((col) => (
                      <CTableHeaderCell
                        key={col}
                        style={{
                          padding: '12px 16px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          color: '#334155',
                          fontFamily: 'monospace',
                          borderBottom: '2px solid #cbd5e1',
                          whiteSpace: 'nowrap',
                          background: '#f1f5f9',
                        }}
                      >
                        {col}
                      </CTableHeaderCell>
                    ))}
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {filteredRows.length === 0 && (
                    <CTableRow>
                      <CTableDataCell
                        colSpan={columns.length + 1}
                        style={{ textAlign: 'center', padding: 48, fontSize: '1rem', color: '#94a3b8' }}
                      >
                        {filterQuery ? `Aucune ligne ne correspond à « ${filterQuery} »` : 'Aucune donnée enregistrée dans cette table.'}
                      </CTableDataCell>
                    </CTableRow>
                  )}
                  {filteredRows.map((row, i) => (
                    <CTableRow key={row.id ?? i} style={{ transition: 'background 0.1s' }}>
                      <CTableDataCell
                        style={{
                          padding: '8px 12px',
                          textAlign: 'center',
                          whiteSpace: 'nowrap',
                          borderBottom: '1px solid #f1f5f9',
                        }}
                      >
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            title="Modifier"
                            onClick={() => setEditingRow(row)}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 6,
                              border: '1.5px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#4f46e5',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <CIcon icon={cilPencil} style={{ width: 14, height: 14 }} />
                          </button>
                          <button
                            title="Supprimer"
                            onClick={() => setDeletingRow(row)}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 6,
                              border: '1.5px solid #fecaca',
                              background: '#fff',
                              color: '#dc2626',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <CIcon icon={cilTrash} style={{ width: 14, height: 14 }} />
                          </button>
                        </div>
                      </CTableDataCell>
                      {columns.map((col) => (
                        <CTableDataCell
                          key={col}
                          style={{
                            padding: '10px 16px',
                            color: '#1e293b',
                            borderBottom: '1px solid #f1f5f9',
                            whiteSpace: 'nowrap',
                            fontFamily: col === 'id' || col.endsWith('_id') || col === 'uuid' ? 'monospace' : 'inherit',
                            fontWeight: col === 'id' ? 700 : 400,
                          }}
                        >
                          {formatCell(row[col])}
                        </CTableDataCell>
                      ))}
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>

            {/* Pagination footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 24px',
                borderTop: '1.5px solid #e2e8f0',
                background: '#f8fafc',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>
                Page {data?.page ?? 1} sur {totalPages} (Lignes {(page - 1) * (data?.perPage ?? 50) + 1} à {Math.min(page * (data?.perPage ?? 50), data?.total ?? 0)} sur {data?.total ?? 0})
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CButton
                  color="light"
                  disabled={page <= 1}
                  style={{ border: '1.5px solid #cbd5e1', fontWeight: 700, fontSize: '0.88rem', borderRadius: 8, padding: '6px 16px' }}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Précédent
                </CButton>

                <span
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    color: '#0f172a',
                  }}
                >
                  {page} / {totalPages}
                </span>

                <CButton
                  color="light"
                  disabled={(data?.page ?? 1) >= totalPages}
                  style={{ border: '1.5px solid #cbd5e1', fontWeight: 700, fontSize: '0.88rem', borderRadius: 8, padding: '6px 16px' }}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Suivant
                </CButton>
              </div>
            </div>
          </div>
        )}
      </div>

      {(creating || editingRow) && (
        <RecordFormModal
          columns={columns}
          initialValues={editingRow}
          onClose={() => {
            setCreating(false)
            setEditingRow(null)
          }}
          onSubmit={async (values) => {
            if (editingRow) {
              await adminDbService.updateRow(table, editingRow.id, values)
            } else {
              await adminDbService.createRow(table, values)
            }
            setCreating(false)
            setEditingRow(null)
            load()
          }}
        />
      )}

      {deletingRow && (
        <ConfirmDeleteModal
          label={`la ligne #${deletingRow.id ?? ''}`}
          onCancel={() => setDeletingRow(null)}
          onConfirm={async () => {
            await adminDbService.deleteRow(table, deletingRow.id)
            setDeletingRow(null)
            load()
          }}
        />
      )}
    </div>
  )
}

export default TableDetail
