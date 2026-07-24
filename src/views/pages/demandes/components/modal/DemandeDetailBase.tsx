// src/views/pages/demandes/components/modal/DemandeDetailBase.tsx
// - Les fichiers sont retirés de cet onglet (déplacés dans l'onglet "Fichiers")
// - Suppression des doublons de commentaires/statuts
// - Date ET heure de soumission correctes
// - Texte ≥ 14px

import { CRow, CCol, CAlert } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilWarning, cilInfo } from '@coreui/icons'
import type { DocumentRequest } from '@/types/document-request.types'
import { TYPE_LABELS, RESPONSABLE_DIVISION_LABELS } from '@/types/document-request.types'

interface Props {
  demande: DocumentRequest
  children?: React.ReactNode
  showTimeline?: boolean
  onRefresh?: () => Promise<void>
}

const InfoBlock = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{
    border: '1px solid #e2e8f0', borderRadius: 10,
    padding: '16px 18px', height: '100%', background: '#f8fafc',
  }}>
    <p style={{
      fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.07em', color: '#94a3b8', marginBottom: 12,
    }}>
      {title}
    </p>
    {children}
  </div>
)

const InfoLine = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null
  return (
    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 6 }}>
      <span style={{ color: '#9ca3af' }}>{label} : </span>
      <span style={{ fontWeight: 500, color: '#374151' }}>{value}</span>
    </p>
  )
}

const ValidationBadge = ({
  children, color, bg,
}: { children: React.ReactNode; color: string; bg: string }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: '0.8rem', padding: '3px 10px', borderRadius: 5,
    background: bg, color, fontWeight: 600,
  }}>
    {children}
  </span>
)

const formatDateTime = (iso?: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  }) + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const DemandeDetailBase = ({ demande, children }: Props) => {
  const submittedAt = formatDateTime(demande.submitted_at)

  // Le rejet ne s'affiche que si c'est une correction secrétaire et qu'il y a une raison
  const showRejection = demande.status === 'secretary_correction'
    && (demande.rejected_by || demande.rejected_reason)

  return (
    <>
      <CRow className="g-3">
        {/* Bloc Étudiant */}
        <CCol md={6}>
          <InfoBlock title="Étudiant">
            <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 10 }}>
              {demande.last_name} {demande.first_names}
            </p>
            <InfoLine label="Matricule" value={demande.matricule} />
            <InfoLine label="Filière"   value={demande.department} />
            <InfoLine label="Année"     value={demande.academic_year} />
          </InfoBlock>
        </CCol>

        {/* Bloc Document */}
        <CCol md={6}>
          <InfoBlock title="Document demandé">
            <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 10 }}>
              {TYPE_LABELS[demande.type] ?? demande.type}
            </p>
            {submittedAt && (
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 10 }}>
                <span style={{ color: '#9ca3af' }}>Soumis le : </span>
                <span style={{ fontWeight: 500, color: '#374151' }}>{submittedAt}</span>
              </p>
            )}

            {/* Badges de validation intermédiaires */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {demande.comptable_reviewed_at && (
                <ValidationBadge color="#164e63" bg="#ecfeff">✓ Comptabilité</ValidationBadge>
              )}
              {demande.responsable_division_reviewed_at && (
                <ValidationBadge color="#166534" bg="#dcfce7">✓ Resp. Division</ValidationBadge>
              )}
              {demande.directrice_adjointe_reviewed_at && (
                <ValidationBadge color="#3b0764" bg="#f5f3ff">✓ Dir. Adjointe</ValidationBadge>
              )}
              {demande.responsable_division_type && (
                <span style={{
                  fontSize: '0.8rem', padding: '3px 10px', borderRadius: 5,
                  background: '#e0f2fe', color: '#0369a1', fontWeight: 600,
                }}>
                  {RESPONSABLE_DIVISION_LABELS[demande.responsable_division_type]}
                </span>
              )}
              {demande.signature_type && (
                <span style={{
                  fontSize: '0.8rem', padding: '3px 10px', borderRadius: 5,
                  background: demande.signature_type === 'paraphe' ? '#ede9fe' : '#dcfce7',
                  color: demande.signature_type === 'paraphe' ? '#5b21b6' : '#166534',
                  fontWeight: 600,
                }}>
                  {demande.signature_type === 'paraphe' ? 'Paraphe Chef CAP' : 'Signature Chef CAP'}
                </span>
              )}
            </div>
          </InfoBlock>
        </CCol>
      </CRow>

      {/* Contenu additionnel (ex. SecretaryFileUploader) */}
      {children && <div style={{ marginTop: 16 }}>{children}</div>}

      {/* Commentaires des acteurs — affichés une seule fois chacun */}
      {demande.comptable_comment && (
        <CAlert color="info" className="mt-3 py-2 mb-0" style={{ fontSize: '0.875rem' }}>
          <CIcon icon={cilInfo} className="me-1" />
          <strong>Comptable :</strong> {demande.comptable_comment}
        </CAlert>
      )}
      {demande.responsable_division_comment && (
        <CAlert color="warning" className="mt-2 py-2 mb-0" style={{ fontSize: '0.875rem' }}>
          <CIcon icon={cilInfo} className="me-1" />
          <strong>Responsable Division :</strong> {demande.responsable_division_comment}
        </CAlert>
      )}

      {/* Rejet — affiché une seule fois, proprement */}
      {showRejection && (
        <CAlert color="danger" className="mt-2 py-2 mb-0" style={{ fontSize: '0.875rem' }}>
          <CIcon icon={cilWarning} className="me-1" />
          {demande.rejected_by && (
            <strong>Rejeté par {demande.rejected_by}{demande.rejected_reason ? ' : ' : ''}</strong>
          )}
          {demande.rejected_reason}
        </CAlert>
      )}
    </>
  )
}

export default DemandeDetailBase
