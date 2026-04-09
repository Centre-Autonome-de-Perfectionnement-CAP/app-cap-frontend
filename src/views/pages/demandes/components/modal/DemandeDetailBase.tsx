// src/views/pages/demandes/components/modal/DemandeDetailBase.tsx

import { CRow, CCol, CAlert } from '@coreui/react'
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

const InfoBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', height: '100%', background: '#f8fafc' }}>
    <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8', marginBottom: 10 }}>
      {title}
    </p>
    {children}
  </div>
)

const InfoLine = ({ label, value }: { label: string; value?: string | null }) => (
  <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 5 }}>
    <span style={{ color: '#9ca3af' }}>{label} : </span>
    <span style={{ fontWeight: 500, color: '#374151' }}>{value || '—'}</span>
  </p>
)

const DemandeDetailBase = ({ demande, children, showTimeline = true }: Props) => (
  <>
    {showTimeline && (
      <WorkflowTimeline
        currentStatus={demande.status}
        isRejected={demande.status === 'rejected' || demande.status === 'secretaire_correction'}
      />
    )}

    <CRow className="mt-3 g-2">
      <CCol md={6}>
        <InfoBlock title="Étudiant">
          <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: 8 }}>
            {demande.last_name} {demande.first_names}
          </p>
          <InfoLine label="Matricule" value={demande.matricule} />
          <InfoLine label="Filière"   value={demande.department} />
          <InfoLine label="Année"     value={demande.academic_year} />
        </InfoBlock>
      </CCol>

      <CCol md={6}>
        <InfoBlock title="Document demandé">
          <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: 8 }}>
            {TYPE_LABELS[demande.type] ?? demande.type}
          </p>
          <InfoLine
            label="Soumis le"
            value={demande.submitted_at ? new Date(demande.submitted_at).toLocaleDateString('fr-FR') : undefined}
          />
          {demande.chef_division_reviewed_at && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: '0.72rem', padding: '2px 8px', borderRadius: 5,
              background: '#dcfce7', color: '#166534', fontWeight: 600, marginTop: 4,
            }}>
              <CIcon icon={cilCheckCircle} style={{ width: 11 }} />
              Validé — Responsable Division
            </span>
          )}
          {demande.chef_division_type && (
            <div style={{ marginTop: 6 }}>
              <span style={{
                fontSize: '0.72rem', padding: '2px 8px', borderRadius: 5,
                background: '#e0f2fe', color: '#0369a1', fontWeight: 600,
              }}>
                {CHEF_DIVISION_LABELS[demande.chef_division_type]}
              </span>
            </div>
          )}
          {demande.signature_type && (
            <div style={{ marginTop: 6 }}>
              <span style={{
                fontSize: '0.72rem', padding: '2px 8px', borderRadius: 5,
                background: demande.signature_type === 'paraphe' ? '#ede9fe' : '#dcfce7',
                color: demande.signature_type === 'paraphe' ? '#5b21b6' : '#166534',
                fontWeight: 600,
              }}>
                {demande.signature_type === 'paraphe' ? 'Paraphe Chef CAP' : 'Signature Chef CAP'}
              </span>
            </div>
          )}
        </InfoBlock>
      </CCol>
    </CRow>

    {children}

    <div style={{ marginTop: 16 }}>
      <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#94a3b8', marginBottom: 8 }}>
        Pièces jointes
      </p>
      <DossierFiles files={demande.files} />
    </div>

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
    {demande.status === 'secretaire_correction' && (demande.rejected_by || demande.rejected_reason) && (
      <CAlert color="danger" className="mt-2 py-2 small mb-0">
        <CIcon icon={cilWarning} className="me-1" />
        {demande.rejected_by && <><strong>Rejeté par {demande.rejected_by} :</strong>{' '}</>}
        {demande.rejected_reason}
      </CAlert>
    )}
  </>
)

export default DemandeDetailBase
