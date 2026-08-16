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

  const handleRetry = async (id: number) => {
    setRetryingId(id)
    try {
      const res = await whatsappService.retryMessage(id)
      if (res.success) success('Message renvoyé avec succès.')
      else error('Le renvoi a échoué — vérifiez le motif.')
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
        <CCol xs="auto">
          <span className="text-muted small">{total} message{total > 1 ? 's' : ''}</span>
        </CCol>
        {modules.length > 0 && (
          <CCol xs="auto" className="ms-auto">
            <CFormSelect
              size="sm"
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
          <CTable hover responsive small>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Module</CTableHeaderCell>
                <CTableHeaderCell>Destinataire</CTableHeaderCell>
                <CTableHeaderCell>Message</CTableHeaderCell>
                <CTableHeaderCell>Contexte</CTableHeaderCell>
                <CTableHeaderCell>Tentatives</CTableHeaderCell>
                {status === 'failed' && <CTableHeaderCell>Erreur</CTableHeaderCell>}
                <CTableHeaderCell>
                  {status === 'sent' ? 'Envoyé le' : 'Mis en file le'}
                </CTableHeaderCell>
                {status === 'failed' && <CTableHeaderCell>Action</CTableHeaderCell>}
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {rows.map((row) => (
                <CTableRow key={row.id}>
                  <CTableDataCell>
                    <CBadge color="info">{row.module ?? 'inconnu'}</CBadge>
                  </CTableDataCell>

                  <CTableDataCell className="text-nowrap">{row.recipient}</CTableDataCell>

                  <CTableDataCell style={{ maxWidth: 280 }}>
                    {row.media_type !== 'text' && (
                      <CBadge color="secondary" className="me-1">
                        {row.file_name}
                      </CBadge>
                    )}
                    <span
                      className="text-truncate d-inline-block align-middle"
                      style={{ maxWidth: 240 }}
                      title={row.message ?? ''}
                    >
                      {row.message || <span className="text-muted fst-italic">—</span>}
                    </span>
                  </CTableDataCell>

                  <CTableDataCell>
                    <span className="text-muted small">{row.context ?? '—'}</span>
                  </CTableDataCell>

                  <CTableDataCell>
                    <CBadge color={row.attempts > 1 ? 'warning' : 'secondary'}>
                      {row.attempts}
                    </CBadge>
                  </CTableDataCell>

                  {status === 'failed' && (
                    <CTableDataCell className="text-danger small" style={{ maxWidth: 200 }}>
                      {row.last_error ?? '—'}
                    </CTableDataCell>
                  )}

                  <CTableDataCell className="text-nowrap small">
                    {(status === 'sent' ? row.sent_at : row.queued_at)
                      ? new Date((status === 'sent' ? row.sent_at : row.queued_at) as string)
                          .toLocaleString('fr-FR')
                      : '—'}
                  </CTableDataCell>

                  {status === 'failed' && (
                    <CTableDataCell>
                      <CButton
                        color="ghost"
                        size="sm"
                        disabled={retryingId === row.id}
                        onClick={() => handleRetry(row.id)}
                        title="Réessayer l'envoi"
                      >
                        {retryingId === row.id
                          ? <CSpinner size="sm" />
                          : <CIcon icon={cilReload} />
                        }
                      </CButton>
                    </CTableDataCell>
                  )}
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>

          {lastPage > 1 && (
            <CPagination align="center" className="mt-3" size="sm">
              <CPaginationItem disabled={page <= 1} onClick={() => load(page - 1)}>
                Précédent
              </CPaginationItem>
              {Array.from({ length: lastPage }, (_, i) => i + 1).map((n) => (
                <CPaginationItem key={n} active={page === n} onClick={() => load(n)}>
                  {n}
                </CPaginationItem>
              ))}
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
