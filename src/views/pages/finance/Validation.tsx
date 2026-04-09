import { useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormTextarea,
  CAlert,
  CBadge,
  CFormInput,
  CPagination,
  CPaginationItem,
  CNav,
  CNavItem,
  CNavLink,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckCircle, cilXCircle, cilFile, cilSearch, cilInfo } from '@coreui/icons'
import { LoadingSpinner } from '@/components'
import useValidation from '@/hooks/finance/useValidation'
import { formatDate, formatDateTime } from '@/utils/date.utils'
import Swal from 'sweetalert2'

const Validation = () => {
  const {
    pendingPayments,
    loading,
    error,
    validatePayment,
    rejectPayment,
    downloadReceipt,
    searchPayments,
    pagination,
    activeTab,
    changeTab,
  } = useValidation()

  const [showValidateModal, setShowValidateModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [observation, setObservation] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')

  const handleValidate = (payment: any) => {
    setSelectedPayment(payment)
    setShowValidateModal(true)
  }

  const handleReject = (payment: any) => {
    setSelectedPayment(payment)
    setShowRejectModal(true)
  }

  const handleViewReceipt = async (payment: any) => {
    try {
      const url = await downloadReceipt(payment.id)
      setReceiptUrl(url)
      setShowReceiptModal(true)
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
    }
  }

  const handleViewDetails = (payment: any) => {
    setSelectedPayment(payment)
    setShowDetailsModal(true)
  }

  const confirmValidation = async () => {
    if (selectedPayment) {
      try {
        // Afficher le loading
        Swal.fire({
          title: 'Validation en cours...',
          text: 'Veuillez patienter',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading()
          }
        })

        await validatePayment(selectedPayment.id, { observation })
        
        // Fermer le loading et afficher le succès
        Swal.fire({
          icon: 'success',
          title: 'Validation réussie !',
          text: `Le paiement de ${selectedPayment.amount?.toLocaleString()} FCFA a été validé avec succès.`,
          confirmButtonText: 'OK',
          timer: 3000,
          timerProgressBar: true
        })

        setShowValidateModal(false)
        setObservation('')
        setSelectedPayment(null)
      } catch (error: any) {
        console.error('Erreur lors de la validation:', error)
        
        // Afficher l'erreur
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.message || 'Une erreur est survenue lors de la validation',
          confirmButtonText: 'OK'
        })
      }
    }
  }

  const confirmRejection = async () => {
    if (selectedPayment && rejectionReason.trim()) {
      try {
        // Afficher le loading
        Swal.fire({
          title: 'Rejet en cours...',
          text: 'Veuillez patienter',
          allowOutsideClick: false,
          allowEscapeKey: false,
          didOpen: () => {
            Swal.showLoading()
          }
        })

        await rejectPayment(selectedPayment.id, { motif: rejectionReason })
        
        // Fermer le loading et afficher le succès
        Swal.fire({
          icon: 'success',
          title: 'Rejet effectué !',
          text: `Le paiement de ${selectedPayment.amount?.toLocaleString()} FCFA a été rejeté.`,
          confirmButtonText: 'OK',
          timer: 3000,
          timerProgressBar: true
        })

        setShowRejectModal(false)
        setRejectionReason('')
        setSelectedPayment(null)
      } catch (error: any) {
        console.error('Erreur lors du rejet:', error)
        
        // Afficher l'erreur
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.message || 'Une erreur est survenue lors du rejet',
          confirmButtonText: 'OK'
        })
      }
    }
  }

  const handleSearch = () => {
    searchPayments(searchTerm)
  }

  const handlePageChange = (page: number) => {
    searchPayments(searchTerm, page)
  }

  if (loading) {
    return <LoadingSpinner fullPage message="Chargement des paiements en attente..." />
  }

  return (
    <>
      <CCard>
        <CCardHeader className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Validation des Quittances</h5>
          <div className="d-flex gap-2">
            <CFormInput
              placeholder="Rechercher par matricule, nom..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '300px' }}
            />
            <CButton color="primary" onClick={handleSearch}>
              <CIcon icon={cilSearch} />
            </CButton>
          </div>
        </CCardHeader>
        <CCardBody>
          {error && (
            <CAlert color="danger" className="mb-3">
              {error}
            </CAlert>
          )}

          {/* Onglets */}
          <CNav variant="tabs" className="mb-3">
            <CNavItem>
              <CNavLink
                active={activeTab === 'pending'}
                onClick={() => changeTab('pending')}
                style={{ cursor: 'pointer' }}
              >
                En attente
                {activeTab === 'pending' && pagination?.total > 0 && (
                  <CBadge color="warning" className="ms-2">{pagination.total}</CBadge>
                )}
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === 'approved'}
                onClick={() => changeTab('approved')}
                style={{ cursor: 'pointer' }}
              >
                Validés
                {activeTab === 'approved' && pagination?.total > 0 && (
                  <CBadge color="success" className="ms-2">{pagination.total}</CBadge>
                )}
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink
                active={activeTab === 'rejected'}
                onClick={() => changeTab('rejected')}
                style={{ cursor: 'pointer' }}
              >
                Rejetés
                {activeTab === 'rejected' && pagination?.total > 0 && (
                  <CBadge color="danger" className="ms-2">{pagination.total}</CBadge>
                )}
              </CNavLink>
            </CNavItem>
          </CNav>

          <CTable hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>N°</CTableHeaderCell>
                <CTableHeaderCell>Matricule</CTableHeaderCell>
                <CTableHeaderCell>Nom et Prénoms</CTableHeaderCell>
                <CTableHeaderCell>Montant</CTableHeaderCell>
                <CTableHeaderCell>Date de paiement</CTableHeaderCell>
                {activeTab !== 'pending' && (
                  <CTableHeaderCell>Date de modification</CTableHeaderCell>
                )}
                <CTableHeaderCell>Quittance</CTableHeaderCell>
                <CTableHeaderCell>Observations</CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {pendingPayments?.data?.length > 0 ? pendingPayments.data.map((payment: any, index: number) => (
                <CTableRow key={payment.id}>
                  <CTableDataCell>
                    {(pagination?.current_page - 1) * (pagination?.per_page || 10) + index + 1}
                  </CTableDataCell>
                  <CTableDataCell>{payment.student_id_number}</CTableDataCell>
                  <CTableDataCell>
                    {payment.student 
                      ? `${payment.student_pending_student.pending_student.personal_information.first_names} ${payment.student_pending_student.pending_student.personal_information.last_name}`
                      : payment.studentPendingStudent
                      ? `${payment.studentPendingStudent.first_name} ${payment.studentPendingStudent.last_name}`
                      : 'N/A'
                    }
                  </CTableDataCell>
                  <CTableDataCell>{payment.amount?.toLocaleString()} FCFA</CTableDataCell>
                  <CTableDataCell>
                    {formatDate(payment.payment_date)}
                  </CTableDataCell>
                  {activeTab !== 'pending' && (
                    <CTableDataCell>
                      <span className="text-muted small">
                        {formatDateTime(payment.updated_at)}
                      </span>
                    </CTableDataCell>
                  )}
                  <CTableDataCell>
                    <CButton
                      color="info"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewReceipt(payment)}
                      className="d-flex align-items-center gap-1"
                    >
                      <CIcon icon={cilFile} />
                      <span>Voir la quittance</span>
                    </CButton>
                  </CTableDataCell>
                  <CTableDataCell>
                    <span className="text-muted small">
                      {payment.observation || 'Aucune observation'}
                    </span>
                  </CTableDataCell>
                  <CTableDataCell>
                    <div className="d-flex gap-1">
                      <CButton
                        color="info"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(payment)}
                        title="Voir les détails"
                      >
                        <CIcon icon={cilInfo} />
                      </CButton>
                      {activeTab === 'pending' && (
                        <>
                          <CButton
                            color="success"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleValidate(payment)}
                            title="Valider"
                          >
                            <CIcon icon={cilCheckCircle} />
                          </CButton>
                          <CButton
                            color="danger"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(payment)}
                            title="Rejeter"
                          >
                            <CIcon icon={cilXCircle} />
                          </CButton>
                        </>
                      )}
                    </div>
                  </CTableDataCell>
                </CTableRow>
              )) : (
                <CTableRow>
                  <CTableDataCell colSpan={9} className="text-center text-muted py-4">
                    {activeTab === 'pending' && 'Aucun paiement en attente de validation'}
                    {activeTab === 'approved' && 'Aucun paiement validé'}
                    {activeTab === 'rejected' && 'Aucun paiement rejeté'}
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>

          {pagination && pagination.last_page > 1 && (
            <CPagination className="justify-content-center mt-3">
              <CPaginationItem
                disabled={pagination.current_page === 1}
                onClick={() => handlePageChange(pagination.current_page - 1)}
              >
                Précédent
              </CPaginationItem>
              {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                <CPaginationItem
                  key={page}
                  active={page === pagination.current_page}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </CPaginationItem>
              ))}
              <CPaginationItem
                disabled={pagination.current_page === pagination.last_page}
                onClick={() => handlePageChange(pagination.current_page + 1)}
              >
                Suivant
              </CPaginationItem>
            </CPagination>
          )}
        </CCardBody>
      </CCard>

      {/* Modal de validation */}
      <CModal visible={showValidateModal} onClose={() => setShowValidateModal(false)}>
        <CModalHeader>
          <CModalTitle>Valider le paiement</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Êtes-vous sûr de vouloir valider ce paiement de{' '}
            <strong>{selectedPayment?.amount?.toLocaleString()} FCFA</strong> ?
          </p>
          <CFormTextarea
            label="Observations (optionnel)"
            value={observation}
            onChange={(e) => setObservation(e.target.value)}
            rows={3}
            placeholder="Ajouter des observations..."
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowValidateModal(false)}>
            Annuler
          </CButton>
          <CButton color="success" onClick={confirmValidation}>
            Valider
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal de rejet */}
      <CModal visible={showRejectModal} onClose={() => setShowRejectModal(false)}>
        <CModalHeader>
          <CModalTitle>Rejeter le paiement</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Pourquoi rejetez-vous ce paiement de{' '}
            <strong>{selectedPayment?.amount?.toLocaleString()} FCFA</strong> ?
          </p>
          <CFormTextarea
            label="Motif de rejet *"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
            placeholder="Expliquez le motif du rejet..."
            required
          />
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowRejectModal(false)}>
            Annuler
          </CButton>
          <CButton 
            color="danger" 
            onClick={confirmRejection}
            disabled={!rejectionReason.trim()}
          >
            Rejeter
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal de visualisation de quittance */}
      <CModal visible={showReceiptModal} onClose={() => setShowReceiptModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Quittance de paiement</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {receiptUrl && (
            <iframe
              src={receiptUrl}
              width="100%"
              height="600px"
              title="Quittance de paiement"
            />
          )}
        </CModalBody>
      </CModal>

      {/* Modal des détails du paiement */}
      <CModal visible={showDetailsModal} onClose={() => setShowDetailsModal(false)} size="lg">
        <CModalHeader>
          <CModalTitle>Détails du paiement</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedPayment && (
            <div className="row g-3">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold text-muted small">Matricule</label>
                  <p className="mb-0">{selectedPayment.student_id_number}</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold text-muted small">Nom et Prénoms</label>
                  <p className="mb-0">
                    {selectedPayment.student 
                      ? `${selectedPayment.student_pending_student.pending_student.personal_information.first_names} ${selectedPayment.student_pending_student.pending_student.personal_information.last_name}`
                      : selectedPayment.studentPendingStudent
                      ? `${selectedPayment.studentPendingStudent.first_name} ${selectedPayment.studentPendingStudent.last_name}`
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold text-muted small">Référence</label>
                  <p className="mb-0">{selectedPayment.reference}</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold text-muted small">Montant</label>
                  <p className="mb-0 fw-bold text-primary">{selectedPayment.amount?.toLocaleString()} FCFA</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold text-muted small">Numéro de compte</label>
                  <p className="mb-0">{selectedPayment.account_number}</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold text-muted small">Date de versement</label>
                  <p className="mb-0">{formatDate(selectedPayment.payment_date)}</p>
                </div>
              </div>
              <div className="col-12">
                <div className="mb-3">
                  <label className="form-label fw-bold text-muted small">Motif</label>
                  <p className="mb-0">{selectedPayment.purpose || 'Non spécifié'}</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold text-muted small">Email</label>
                  <p className="mb-0">{selectedPayment.email || 'Non renseigné'}</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold text-muted small">Contact</label>
                  <p className="mb-0">{selectedPayment.contact || 'Non renseigné'}</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold text-muted small">Statut</label>
                  <p className="mb-0">
                    <CBadge color={
                      selectedPayment.status === 'approved' ? 'success' :
                      selectedPayment.status === 'rejected' ? 'danger' : 'warning'
                    }>
                      {selectedPayment.status === 'approved' ? 'Validé' :
                       selectedPayment.status === 'rejected' ? 'Rejeté' : 'En attente'}
                    </CBadge>
                  </p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-bold text-muted small">Date de soumission</label>
                  <p className="mb-0">{formatDateTime(selectedPayment.created_at)}</p>
                </div>
              </div>
              {selectedPayment.observation && (
                <div className="col-12">
                  <div className="mb-3">
                    <label className="form-label fw-bold text-muted small">Observations</label>
                    <p className="mb-0">{selectedPayment.observation}</p>
                  </div>
                </div>
              )}
              <div className="col-12">
                <CButton
                  color="info"
                  onClick={() => handleViewReceipt(selectedPayment)}
                  className="w-100"
                >
                  <CIcon icon={cilFile} className="me-2" />
                  Voir la quittance
                </CButton>
              </div>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setShowDetailsModal(false)}>
            Fermer
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Validation