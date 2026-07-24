// src/views/pages/admin-db/TableDetail.tsx
//
// Tableau CRUD générique : colonnes et lignes lues dynamiquement depuis le
// backend (aucune colonne codée en dur ici), avec création / édition /
// suppression. Style gros texte, couleurs simples, icônes uniquement.

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  CTable, CTableHead, CTableRow, CTableHeaderCell, CTableBody, CTableDataCell,
  CButton, CSpinner, CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilArrowLeft, cilPlus, cilPencil, cilTrash } from '@coreui/icons'
import adminDbService, { type AdminTableData } from '@/services/adminDb.service'
import RecordFormModal from './components/RecordFormModal'
import ConfirmDeleteModal from './components/ConfirmDeleteModal'
import { ADMIN_DB_BASE_PATH } from './constants'

const formatCell = (value: any): string => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non'
  return String(value)
}

const TableDetail = () => {
  const { table } = useParams<{ table: string }>()
  const navigate = useNavigate()

  const [data, setData]       = useState<AdminTableData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [page, setPage]       = useState(1)

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
      .catch(() => setError('Impossible de charger cette table. Vérifiez qu\'elle est bien autorisée.'))
      .finally(() => setLoading(false))
  }, [table, page])

  useEffect(() => {
    load()
  }, [load])

  if (!table) return null

  const columns = data?.columns ?? []
  const rows = data?.rows ?? []
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1

  return (
    <div style={{ padding: 32, background: '#ffffff', minHeight: '100vh' }}>
      <CButton
        color="light"
        onClick={() => navigate(ADMIN_DB_BASE_PATH)}
        style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 20, border: '2px solid #e5e7eb' }}
      >
        <CIcon icon={cilArrowLeft} style={{ marginRight: 8 }} />
        Retour aux tables
      </CButton>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#111827', margin: 0, fontFamily: 'monospace' }}>
          {table}
        </h1>
        <CButton
          color="primary"
          onClick={() => setCreating(true)}
          style={{ fontSize: '1.05rem', fontWeight: 700, padding: '10px 22px' }}
        >
          <CIcon icon={cilPlus} style={{ marginRight: 8 }} />
          Nouvelle entrée
        </CButton>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <CSpinner color="primary" style={{ width: 40, height: 40 }} />
        </div>
      )}

      {error && (
        <CAlert color="danger" style={{ fontSize: '1.05rem', fontWeight: 600 }}>
          {error}
        </CAlert>
      )}

      {!loading && !error && (
        <>
          <div style={{ overflowX: 'auto', border: '2px solid #e5e7eb', borderRadius: 14 }}>
            <CTable hover responsive style={{ marginBottom: 0, fontSize: '1.02rem' }}>
              <CTableHead>
                <CTableRow style={{ background: '#f3f4f6' }}>
                  {columns.map((col) => (
                    <CTableHeaderCell
                      key={col}
                      style={{
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        color: '#111827',
                        padding: '16px',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {col}
                    </CTableHeaderCell>
                  ))}
                  <CTableHeaderCell
                    style={{ fontSize: '0.95rem', fontWeight: 800, color: '#111827', padding: '16px', textAlign: 'center' }}
                  >
                    Actions
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {rows.length === 0 && (
                  <CTableRow>
                    <CTableDataCell
                      colSpan={columns.length + 1}
                      style={{ textAlign: 'center', padding: 36, fontSize: '1.1rem', color: '#6b7280' }}
                    >
                      Aucune donnée.
                    </CTableDataCell>
                  </CTableRow>
                )}
                {rows.map((row, i) => (
                  <CTableRow key={row.id ?? i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    {columns.map((col) => (
                      <CTableDataCell key={col} style={{ padding: '14px 16px', fontSize: '1rem', color: '#1f2937' }}>
                        {formatCell(row[col])}
                      </CTableDataCell>
                    ))}
                    <CTableDataCell style={{ padding: '14px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <CButton
                        color="light"
                        size="sm"
                        style={{ border: '2px solid #e5e7eb', marginRight: 8 }}
                        onClick={() => setEditingRow(row)}
                      >
                        <CIcon icon={cilPencil} />
                      </CButton>
                      <CButton
                        color="light"
                        size="sm"
                        style={{ border: '2px solid #fecaca', color: '#dc2626' }}
                        onClick={() => setDeletingRow(row)}
                      >
                        <CIcon icon={cilTrash} />
                      </CButton>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginTop: 24 }}>
            <CButton
              color="light"
              disabled={page <= 1}
              style={{ border: '2px solid #e5e7eb', fontWeight: 700, fontSize: '1rem' }}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Précédent
            </CButton>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#374151' }}>
              Page {data?.page ?? 1} / {totalPages}
            </span>
            <CButton
              color="light"
              disabled={(data?.page ?? 1) >= totalPages}
              style={{ border: '2px solid #e5e7eb', fontWeight: 700, fontSize: '1rem' }}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
            </CButton>
          </div>
        </>
      )}

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
          label={`la ligne #${deletingRow.id}`}
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
