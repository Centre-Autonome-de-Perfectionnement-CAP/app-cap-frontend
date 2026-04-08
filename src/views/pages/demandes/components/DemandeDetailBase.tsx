// src/views/pages/demandes/components/DemandeDetailBase.tsx
// Corps de modal partagé : timeline + étudiant + document + pièces jointes + commentaires.

import { CRow, CCol, CAlert, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilWarning, cilCheckCircle, cilInfo } from '@coreui/icons'
import { WorkflowTimeline } from '@/components/document-request'
import DossierFiles from '@/components/document-request/DossierFiles'
import type { DocumentRequest } from '@/types/document-request.types'
import { TYPE_LABELS, CHEF_DIVISION_LABELS } from '@/types/document-request.types'

interface Props {
  demande: DocumentRequest
  children?: React.ReactNode
  showTimeline?: boolean
}

const DemandeDetailBase = ({ demande, children, showTimeline = true }: Props) => (
  <>
    {showTimeline && (
      <WorkflowTimeline
        currentStatus={demande.status}
        isRejected={demande.status === 'rejected' || demande.status === 'secretaire_correction'}
      />
    )}

    {/* Infos étudiant + document */}
    <CRow className="mt-3 g-2">
      <CCol md={6}>
        <div className="border rounded-3 p-3 h-100" style={{ background: '#f8fafc' }}>
          <p className="fw-semibold mb-2 text-uppercase" style={{ fontSize: '0.7rem', color: '#9ca3af', letterSpacing: '0.06em' }}>
            Étudiant
          </p>
          <p className="fw-bold mb-1" style={{ fontSize: '0.95rem', color: '#111827' }}>
            {demande.last_name} {demande.first_names}
          </p>
          <p className="small text-muted mb-1">Matricule : {demande.matricule || '—'}</p>
          <p className="small text-muted mb-1">Filière : {demande.department || '—'}</p>
          <p className="small text-muted mb-0">Année : {demande.academic_year || '—'}</p>
        </div>
      </CCol>

      <CCol md={6}>
        <div className="border rounded-3 p-3 h-100" style={{ background: '#f8fafc' }}>
          <p className="fw-semibold mb-2 text-uppercase" style={{ fontSize: '0.7rem', color: '#9ca3af', letterSpacing: '0.06em' }}>
            Document demandé
          </p>
          <p className="fw-bold mb-1" style={{ fontSize: '0.95rem', color: '#111827' }}>
            {TYPE_LABELS[demande.type] ?? demande.type}
          </p>
          <p className="small text-muted mb-2">
            Soumis le :{' '}
            {demande.submitted_at ? new Date(demande.submitted_at).toLocaleDateString('fr-FR') : '—'}
          </p>
          {demande.chef_division_reviewed_at && (
            <CBadge color="success" className="me-1">
              <CIcon icon={cilCheckCircle} className="me-1" style={{ width: 11 }} />
              Validé — Responsable Division
            </CBadge>
          )}
          {demande.chef_division_type && (
            <div className="mt-1">
              <CBadge color="info">{CHEF_DIVISION_LABELS[demande.chef_division_type]}</CBadge>
            </div>
          )}
          {demande.signature_type && (
            <div className="mt-1">
              <CBadge color={demande.signature_type === 'paraphe' ? 'primary' : 'success'}>
                {demande.signature_type === 'paraphe' ? 'Paraphe Chef CAP' : 'Signature Chef CAP'}
              </CBadge>
            </div>
          )}
        </div>
      </CCol>
    </CRow>

    {/* Slot additionnel (FinancialPanel, choix paraphe, etc.) */}
    {children}

    {/* Pièces jointes */}
    <div className="mt-3">
      <p className="fw-semibold text-uppercase mb-2" style={{ fontSize: '0.7rem', color: '#9ca3af', letterSpacing: '0.06em' }}>
        Pièces jointes
      </p>
      <DossierFiles files={demande.files} />
    </div>

    {/* Commentaires */}
    {demande.chef_division_comment && (
      <CAlert color="warning" className="mt-3 py-2 small mb-0">
        <CIcon icon={cilInfo} className="me-1" />
        <strong>Responsable Division :</strong> {demande.chef_division_comment}
      </CAlert>
    )}
    {demande.comptable_comment && (
      <CAlert color="info" className="mt-2 py-2 small mb-0">
        <CIcon icon={cilInfo} className="me-1" />
        <strong>Comptable :</strong> {demande.comptable_comment}
      </CAlert>
    )}
    {demande.status === 'secretaire_correction' &&
      (demande.rejected_by || demande.rejected_reason) && (
        <CAlert color="danger" className="mt-2 py-2 small mb-0">
          <CIcon icon={cilWarning} className="me-1" />
          {demande.rejected_by && (
            <><strong>Rejeté par {demande.rejected_by} :</strong>{' '}</>
          )}
          {demande.rejected_reason}
        </CAlert>
      )}
  </>
)

export default DemandeDetailBase
