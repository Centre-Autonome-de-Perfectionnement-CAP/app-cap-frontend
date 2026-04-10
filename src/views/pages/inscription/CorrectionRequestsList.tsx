import { useState, useEffect, useCallback } from 'react'
import {
  CCard, CCardBody, CCardHeader, CBadge,
  CTable, CTableHead, CTableRow, CTableHeaderCell,
  CTableBody, CTableDataCell, CButton, CSpinner,
  CAlert, CFormSelect, CFormInput, CModal,
  CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import correctionsService, { type CorrectionRequest } from '@/services/corrections.service'

const STATUS_BADGE: Record<string, { color: 'warning' | 'success' | 'danger'; label: string }> = {
  pending:  { color: 'warning', label: 'En attente' },
  approved: { color: 'success', label: 'Approuvé' },
  rejected: { color: 'danger',  label: 'Refusé' },
}

const CorrectionRequestsList = () => {
  const [requests, setRequests] = useState<CorrectionRequest[]>([])
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [selectedRequest, setSelectedRequest] = useState<CorrectionRequest | null>(null)
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await correctionsService.getCorrectionRequests({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        student_id_number: search || undefined,
      })
      setRequests(result?.data ?? [])
      setCounts(result?.counts ?? { pending: 0, approved: 0, rejected: 0 })
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des demandes.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const openModal = (request: CorrectionRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setModalAction(action)
    setRejectionReason('')
  }

  const closeModal = () => {
    setSelectedRequest(null)
    setModalAction(null)
    setRejectionReason('')
  }

  const handleAction = async () => {
    if (!selectedRequest || !modalAction) return
    if (modalAction === 'reject' && !rejectionReason.trim()) return

    setActionLoading(true)
    try {
      if (modalAction === 'approve') {
        await correctionsService.approveRequest(selectedRequest.id)
        setSuccessMessage('Demande approuvée. Les informations ont été mises à jour.')
      } else {
        await correctionsService.rejectRequest(selectedRequest.id, rejectionReason.trim())
        setSuccessMessage('Demande rejetée. L\'étudiant a été notifié par email.')
      }
      closeModal()
      loadRequests()
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.')
    } finally {
      setActionLoading(false)
    }
  }

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) return value.join(', ')
    return String(value ?? '—')
  }

  return (
    <>
      {successMessage && (
        <CAlert color="success" dismissible onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </CAlert>
      )}
      {error && (
        <CAlert color="danger" dismissible onClose={() => setError(null)}>
          {error}
        </CAlert>
      )}

      {/* Compteurs */}
      <div className="d-flex gap-3 mb-4 flex-wrap">
        {[
          { key: 'pending', label: 'En attente', color: '#f9a825', bg: '#fff8e1' },
          { key: 'approved', label: 'Approuvées', color: '#2e7d32', bg: '#e8f5e9' },
          { key: 'rejected', label: 'Refusées', color: '#c62828', bg: '#ffebee' },
        ].map(c => (
          <div
            key={c.key}
            style={{
              background: c.bg,
              borderLeft: `4px solid ${c.color}`,
              borderRadius: 8,
              padding: '10px 20px',
              cursor: 'pointer',
              opacity: statusFilter === c.key ? 1 : 0.6,
            }}
            onClick={() => setStatusFilter(c.key)}
          >
            <div style={{ fontSize: 22, fontWeight: 'bold', color: c.color }}>
              {counts[c.key as keyof typeof counts]}
            </div>
            <div style={{ fontSize: 12, color: '#555' }}>{c.label}</div>
          </div>
        ))}
      </div>

      <CCard>
        <CCardHeader className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          <strong>
            Corrections d'informations personnelles
            {counts.pending > 0 && (
              <CBadge color="warning" className="ms-2">{counts.pending} en attente</CBadge>
            )}
          </strong>
          <div className="d-flex gap-2 flex-wrap">
            <CFormInput
              placeholder="Rechercher par matricule..."
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              style={{ width: 220 }}
              size="sm"
            />
            <CFormSelect
              value={statusFilter}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              style={{ width: 150 }}
              size="sm"
            >
              <option value="all">Tous</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvés</option>
              <option value="rejected">Refusés</option>
            </CFormSelect>
          </div>
        </CCardHeader>

        <CCardBody>
          {loading ? (
            <div className="text-center py-5">
              <CSpinner color="primary" />
              <p className="mt-2 text-muted">Chargement...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <div style={{ fontSize: 40 }}>📭</div>
              <p>Aucune demande trouvée.</p>
            </div>
          ) : (
            <CTable hover responsive bordered small>
              <CTableHead color="light">
                <CTableRow>
                  <CTableHeaderCell>Matricule</CTableHeaderCell>
                  <CTableHeaderCell>Champs modifiés</CTableHeaderCell>
                  <CTableHeaderCell>Justification</CTableHeaderCell>
                  <CTableHeaderCell>Date</CTableHeaderCell>
                  <CTableHeaderCell>Statut</CTableHeaderCell>
                  <CTableHeaderCell>Actions</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {requests.map(req => {
                  const badge = STATUS_BADGE[req.status]
                  return (
                    <CTableRow key={req.id}>
                      <CTableDataCell>
                        <code style={{ fontWeight: 'bold' }}>{req.student_id_number}</code>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div className="d-flex flex-column gap-1">
                          {req.changed_fields.map(field => (
                            <div key={field} style={{ fontSize: 12 }}>
                              <strong>{correctionsService.FIELD_LABELS[field] ?? field} :</strong>
                              <br />
                              <span style={{ color: '#c62828', textDecoration: 'line-through' }}>
                                {formatValue(req.current_values[field])}
                              </span>
                              {' → '}
                              <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>
                                {formatValue(req.suggested_values[field])}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell style={{ maxWidth: 200, fontSize: 12 }}>
                        {req.justification || <span className="text-muted">—</span>}
                      </CTableDataCell>
                      <CTableDataCell style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        {req.created_at}
                      </CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={badge.color}>{badge.label}</CBadge>
                        {req.status === 'rejected' && req.rejection_reason && (
                          <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
                            Motif: {req.rejection_reason}
                          </div>
                        )}
                        {req.reviewed_by && (
                          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                            par {req.reviewed_by.name}
                          </div>
                        )}
                      </CTableDataCell>
                      <CTableDataCell>
                        {req.status === 'pending' && (
                          <div className="d-flex gap-1">
                            <CButton
                              color="success"
                              size="sm"
                              variant="outline"
                              onClick={() => openModal(req, 'approve')}
                            >
                              ✓ Approuver
                            </CButton>
                            <CButton
                              color="danger"
                              size="sm"
                              variant="outline"
                              onClick={() => openModal(req, 'reject')}
                            >
                              ✗ Rejeter
                            </CButton>
                          </div>
                        )}
                      </CTableDataCell>
                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      {/* Modale de confirmation */}
      <CModal visible={!!selectedRequest} onClose={closeModal} size="lg">
        <CModalHeader>
          <CModalTitle>
            {modalAction === 'approve' ? '✅ Approuver la correction' : '❌ Rejeter la correction'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedRequest && (
            <>
              <p>
                <strong>Matricule :</strong>{' '}
                <code>{selectedRequest.student_id_number}</code>
              </p>

              <table className="table table-sm table-bordered mb-3">
                <thead>
                  <tr style={{ background: '#f5f5f5' }}>
                    <th>Champ</th>
                    <th>Valeur actuelle</th>
                    <th>Valeur proposée</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRequest.changed_fields.map(field => (
                    <tr key={field}>
                      <td><strong>{correctionsService.FIELD_LABELS[field] ?? field}</strong></td>
                      <td style={{ color: '#c62828' }}>{formatValue(selectedRequest.current_values[field])}</td>
                      <td style={{ color: '#2e7d32', fontWeight: 'bold' }}>{formatValue(selectedRequest.suggested_values[field])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedRequest.justification && (
                <div style={{ background: '#f5f5f5', padding: '10px 15px', borderRadius: 6, marginBottom: 16, fontSize: 14 }}>
                  <strong>Justification de l'étudiant :</strong>{' '}
                  {selectedRequest.justification}
                </div>
              )}

              {modalAction === 'approve' && (
                <CAlert color="info">
                  En approuvant, les informations de l'étudiant seront immédiatement mises à jour
                  en base de données et il sera notifié par email.
                </CAlert>
              )}

              {modalAction === 'reject' && (
                <>
                  <CAlert color="warning">
                    En rejetant, les informations ne seront pas modifiées.
                    L'étudiant sera notifié par email avec le motif du refus.
                  </CAlert>
                  <div>
                    <label className="form-label fw-semibold">
                      Motif du refus <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Ex: Les justificatifs fournis ne sont pas suffisants..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={closeModal} disabled={actionLoading}>
            Annuler
          </CButton>
          <CButton
            color={modalAction === 'approve' ? 'success' : 'danger'}
            onClick={handleAction}
            disabled={actionLoading || (modalAction === 'reject' && !rejectionReason.trim())}
          >
            {actionLoading ? (
              <><CSpinner size="sm" className="me-2" /> Traitement...</>
            ) : (
              modalAction === 'approve' ? '✅ Confirmer l\'approbation' : '❌ Confirmer le refus'
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default CorrectionRequestsList
