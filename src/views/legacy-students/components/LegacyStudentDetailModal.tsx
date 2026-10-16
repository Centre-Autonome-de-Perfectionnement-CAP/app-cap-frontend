import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CRow,
  CCol,
  CBadge,
  CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilNotes } from '@coreui/icons'
import type { LegacyStudent } from '@/types/legacyStudent.types'

interface LegacyStudentDetailModalProps {
  student: LegacyStudent | null
  onClose: () => void
  onOpenAcademic?: (student: LegacyStudent) => void
}

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'validated': return 'success'
    case 'pending': return 'warning'
    case 'rejected': return 'danger'
    default: return 'secondary'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'validated': return 'Validé'
    case 'pending': return 'En attente'
    case 'rejected': return 'Rejeté'
    default: return status
  }
}

const LegacyStudentDetailModal = ({ student, onClose, onOpenAcademic }: LegacyStudentDetailModalProps) => {
  if (!student) return null

  return (
    <CModal visible={!!student} onClose={onClose} size="lg">
      <CModalHeader>
        <CModalTitle className="d-flex align-items-center gap-2">
          {student.last_name} {student.first_name}
          <CBadge color={getStatusBadgeColor(student.status)}>
            {getStatusLabel(student.status)}
          </CBadge>
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {student.status === 'rejected' && student.rejection_reason && (
          <CAlert color="danger" className="mb-4">
            <strong>Motif du rejet :</strong> {student.rejection_reason}
          </CAlert>
        )}

        <CRow className="g-3">
          <CCol md={6}>
            <strong>Matricule</strong>
            <p>{student.matricule}</p>
          </CCol>
          <CCol md={6}>
            <strong>Année d'inscription</strong>
            <p>{student.enrollment_year}</p>
          </CCol>
          
          <CCol md={6}>
            <strong>Date de naissance</strong>
            <p>{student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Non renseignée'}</p>
          </CCol>
          <CCol md={6}>
            <strong>Lieu de naissance</strong>
            <p>{student.place_of_birth || 'Non renseigné'}</p>
          </CCol>

          <CCol md={6}>
            <strong>Téléphone</strong>
            <p>{student.phone || 'Non renseigné'}</p>
          </CCol>
          <CCol md={6}>
            <strong>Email</strong>
            <p>{student.email || 'Non renseigné'}</p>
          </CCol>

          <CCol xs={12}>
            <strong>Cycle / Filière</strong>
            <p className="d-flex flex-wrap gap-1 mt-1 align-items-center">
              {student.cycle && (
                <CBadge color="secondary" className="me-1">{student.cycle}</CBadge>
              )}
              {student.department ? (
                <CBadge color="info">{student.department.name}</CBadge>
              ) : (
                <span className="text-muted">Aucune filière renseignée</span>
              )}
            </p>
          </CCol>

          {student.notes_admin && (
            <CCol xs={12}>
              <strong>Notes de l'administration</strong>
              <p className="mb-0 text-break">{student.notes_admin}</p>
            </CCol>
          )}

          {student.status === 'validated' && (student.validated_by || student.validated_at) && (
            <CCol xs={12}>
              <div className="bg-light p-3 rounded mt-2">
                <strong>Historique / journal d'audit</strong>
                <p className="mb-0 mt-1 small">
                  Validé{' '}
                  {student.validated_by && `par ${student.validated_by}`}
                  {student.validated_by && student.validated_at && ' '}
                  {student.validated_at && `le ${new Date(student.validated_at).toLocaleDateString('fr-FR', {
                    year: 'numeric', month: 'long', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}`}
                </p>
              </div>
            </CCol>
          )}

          <CCol xs={12} className="mt-4">
            <small className="text-muted d-block text-end border-top pt-2">
              Inscrit le {new Date(student.created_at).toLocaleDateString('fr-FR', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </small>
          </CCol>
        </CRow>
      </CModalBody>
      <CModalFooter className="d-flex justify-content-between">
        {onOpenAcademic ? (
          <CButton
            color="info"
            className="text-white d-flex align-items-center gap-1"
            onClick={() => {
              onClose()
              onOpenAcademic(student)
            }}
          >
            <CIcon icon={cilNotes} />
            Dossier académique (Notes / Résultats)
          </CButton>
        ) : <div />}
        <CButton color="secondary" onClick={onClose}>Fermer</CButton>
      </CModalFooter>
    </CModal>
  )
}

export default LegacyStudentDetailModal
