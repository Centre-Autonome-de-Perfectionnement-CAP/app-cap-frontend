// src/views/pages/whatsapp/components/MessagesTable.tsx
//
// Tableau paginé filtrable par statut et module.
// Bouton "Réessayer" sur les lignes en échec.
// Pattern CCardHeader identique à Professors.tsx / WhatsAppGroups.tsx.

import React, { useCallback, useEffect, useState } from 'react'
import {
  CBadge,
  CButton,
  CCol,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload } from '@coreui/icons'
import whatsappService, { type ModuleCount, type WaMessageLogRow } from '@/services/whatsapp.service'
import { useToast } from '@/contexts'

interface Props {
  status: 'sent' | 'failed'
}

const MessagesTable: React.FC<Props> = ({ status }) => {
  const [rows,         setRows]         = useState<WaMessageLogRow[]>([])
  const [page,         setPage]         = useState(1)
  const [lastPage,     setLastPage]     = useState(1)
  const [total,        setTotal]        = useState(0)
  const [loading,      setLoading]      = useState(true)
  const [retryingId,   setRetryingId]   = useState<number | null>(null)
  const [modules,      setModules]      = useState<ModuleCount[]>([])
  const [moduleFilter, setModuleFilter] = useState('')
  const { success, error } = useToast()

  useEffect(() => {
    whatsappService.getModules().then(setModules).catch(() => {})
  }, [])

  const load = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await whatsappService.getMessages(status, p, moduleFilter || undefined)
      setRows(res.data)
      setLastPage(res.last_page)
      setTotal(res.total)
      setPage(res.current_page)
    } catch (e: any) {
      error(e?.message ?? 'Impossible de charger les messages.')
    } finally {
      setLoading(false)
    }
  }, [status, moduleFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(1) }, [load])

  const dateOf = (row: WaMessageLogRow) => {
    const d = status === 'sent' ? row.sent_at : row.queued_at
    return d ? new Date(d).toLocaleString('fr-FR') : '-'
  }

  const handleRetry = async (id: number) => {
    setRetryingId(id)
    try {
      const res = await whatsappService.retryMessage(id)
      if (res.success) success('Message renvoyé avec succès.')
      else error('Le renvoi a échoué - vérifiez le motif.')
      load(page)
    } catch (e: any) {
      error(e?.message ?? 'Erreur lors du renvoi.')
    } finally {
      setRetryingId(null)
    }
  }

  return (
    <>
      {/* Barre de filtres */}
      <CRow className="mb-3 align-items-center g-2">
        <CCol xs={12} sm="auto">
          <span className="text-muted small">{total} message{total > 1 ? 's' : ''}</span>
        </CCol>
        {modules.length > 0 && (
          <CCol xs={12} sm="auto" className="ms-sm-auto">
            <CFormSelect
              aria-label="Filtrer par module"
              style={{ minWidth: 200 }}
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <option value="">Tous les modules</option>
              {modules.map((m) => (
                <option key={m.module} value={m.module}>
                  {m.module} ({m.total})
                </option>
              ))}
            </CFormSelect>
          </CCol>
        )}
      </CRow>

      {/* Tableau */}
      {loading ? (
        <div className="text-center py-5"><CSpinner color="primary" /></div>
      ) : rows.length === 0 ? (
        <p className="text-muted text-center py-4 mb-0">Aucun message dans cette catégorie.</p>
      ) : (
        <>
          {/* Téléphone et tablette : une carte par message */}
          <div className="d-lg-none d-flex flex-column gap-2">
            {rows.map((row) => (
              <div key={row.id} className="border rounded-3 p-3 bg-white">
                <div className="d-flex align-items-start justify-content-between gap-2">
                  <div className="min-w-0">
                    <CBadge color="info" className="me-1">{row.module ?? 'inconnu'}</CBadge>
                    <span className="fw-semibold text-break">{row.recipient}</span>
                  </div>
                  {status === 'failed' && (
                    <CButton color="secondary" variant="outline" size="sm" className="flex-shrink-0"
                      disabled={retryingId === row.id} onClick={() => handleRetry(row.id)}>
                      {retryingId === row.id ? <CSpinner size="sm" /> : <><CIcon icon={cilReload} className="me-1" />Réessayer</>}
                    </CButton>
                  )}
                </div>
                {row.media_type !== 'text' && <CBadge color="secondary" className="mt-2 text-wrap text-break">{row.file_name}</CBadge>}
                <p className="mb-1 mt-2 text-break" style={{ whiteSpace: 'pre-line', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {row.message || <span className="text-muted fst-italic">-</span>}
                </p>
                {status === 'failed' && row.last_error && <p className="text-danger small mb-1 text-break">{row.last_error}</p>}
                <div className="d-flex flex-wrap gap-2 small text-muted">
                  <span>{dateOf(row)}</span>
                  {row.context && <span className="text-break">· {row.context}</span>}
                  <span>· {row.attempts} tentative{row.attempts > 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Ordinateur : tableau à largeurs fixes (aucune colonne ne déborde sur
              une autre) ; textes longs coupés proprement, entiers au survol. */}
          <div className="d-none d-lg-block">
          <CTable hover small align="middle" className="wa-table mb-0">
            <colgroup>
              <col style={{ width: 170 }} />
              <col />
              {status === 'failed' && <col style={{ width: '26%' }} />}
              <col style={{ width: 92 }} />
              <col style={{ width: 150 }} />
              {status === 'failed' && <col style={{ width: 120 }} />}
            </colgroup>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Destinataire</CTableHeaderCell>
                <CTableHeaderCell>Message</CTableHeaderCell>
                {status === 'failed' && <CTableHeaderCell>Erreur</CTableHeaderCell>}
                <CTableHeaderCell className="text-center">Tentatives</CTableHeaderCell>
                <CTableHeaderCell>{status === 'sent' ? 'Envoyé le' : 'Mis en file le'}</CTableHeaderCell>
                {status === 'failed' && <CTableHeaderCell />}
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {rows.map((row) => (
                <CTableRow key={row.id}>
                  <CTableDataCell>
                    <div className="fw-semibold text-truncate" title={row.recipient}>{row.recipient}</div>
                    <CBadge color="info" className="mt-1">{row.module ?? 'inconnu'}</CBadge>
                  </CTableDataCell>

                  <CTableDataCell>
                    {row.media_type !== 'text' && row.file_name && (
                      <div className="text-truncate small fw-semibold text-secondary mb-1" title={row.file_name}>📎 {row.file_name}</div>
                    )}
                    <div className="wa-clamp" title={row.message ?? ''}>
                      {row.message || <span className="text-muted fst-italic">-</span>}
                    </div>
                    {row.context && <div className="text-truncate small text-muted mt-1" title={row.context}>{row.context}</div>}
                  </CTableDataCell>

                  {status === 'failed' && (
                    <CTableDataCell>
                      <div className="wa-clamp text-danger small" title={row.last_error ?? ''}>{row.last_error ?? '-'}</div>
                    </CTableDataCell>
                  )}

                  <CTableDataCell className="text-center">
                    <CBadge color={row.attempts > 1 ? 'warning' : 'secondary'}>{row.attempts}</CBadge>
                  </CTableDataCell>

                  <CTableDataCell className="small">{dateOf(row)}</CTableDataCell>

                  {status === 'failed' && (
                    <CTableDataCell className="text-end">
                      <CButton color="secondary" variant="outline" size="sm" disabled={retryingId === row.id} onClick={() => handleRetry(row.id)}>
                        {retryingId === row.id ? <CSpinner size="sm" /> : <><CIcon icon={cilReload} className="me-1" />Réessayer</>}
                      </CButton>
                    </CTableDataCell>
                  )}
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
          </div>
          <style>{`
            .wa-table { table-layout: fixed; width: 100%; }
            .wa-table td, .wa-table th { overflow: hidden; vertical-align: top; padding-top: .7rem; padding-bottom: .7rem; }
            .wa-table th { white-space: nowrap; }
            .wa-clamp { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; white-space: pre-line; }
          `}</style>

          {/* Pagination compacte : lisible à toutes les tailles, même avec beaucoup de pages */}
          {lastPage > 1 && (
            <CPagination align="center" className="mt-3">
              <CPaginationItem disabled={page <= 1} onClick={() => load(page - 1)}>
                Précédent
              </CPaginationItem>
              <CPaginationItem disabled>Page {page} sur {lastPage}</CPaginationItem>
              <CPaginationItem disabled={page >= lastPage} onClick={() => load(page + 1)}>
                Suivant
              </CPaginationItem>
            </CPagination>
          )}
        </>
      )}
    </>
  )
}

export default MessagesTable
