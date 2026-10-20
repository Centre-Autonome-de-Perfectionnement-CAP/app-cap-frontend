// src/views/pages/demandes/components/modal/DemandeDetailBase.tsx
// - Les fichiers sont retirés de cet onglet (déplacés dans l'onglet "Fichiers")
// - Suppression des doublons de commentaires/statuts
// - Date ET heure de soumission correctes
// - Texte ≥ 14px

import { CRow, CCol } from '@coreui/react'
import type { DocumentRequest } from '@/types/document-request.types'
import { TYPE_LABELS, RESPONSABLE_DIVISION_LABELS, isLegacyDemande } from '@/types/document-request.types'
import { LegacyBadge } from './LegacyDeclarationPanel'
import DossierFilesSplit from '@/components/document-request/DossierFilesSplit'

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
      fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.07em', color: '#64748b', marginBottom: 12,
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
      <span style={{ color: '#64748b' }}>{label} : </span>
      <span style={{ fontWeight: 500, color: '#374151' }}>{value}</span>
    </p>
  )
}

const ValidationBadge = ({
  children, color, bg,
}: { children: React.ReactNode; color: string; bg: string }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: '0.875rem', padding: '3px 10px', borderRadius: 5,
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

const DemandeDetailBase = ({ demande, children, onRefresh }: Props) => {
  const submittedAt = formatDateTime(demande.submitted_at)

  return (
    <>
      <CRow className="g-3">
        {/* Bloc Étudiant */}
        <CCol md={6}>
          <InfoBlock title="Étudiant">
            <p style={{ fontWeight: 700, fontSize: '1rem', color: '#111827', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {demande.last_name} {demande.first_names}
              {isLegacyDemande(demande) && <LegacyBadge status={demande.legacy_declaration_status} />}
            </p>
            <InfoLine label="Matricule" value={demande.matricule} />
            <InfoLine label="Filière"   value={demande.department} />
            <InfoLine label="Année"     value={demande.academic_year} />
            <InfoLine label="WhatsApp"  value={demande.demandeur_whatsapp} />
            <InfoLine label="Email"     value={demande.email} />
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
                <span style={{ color: '#64748b' }}>Soumis le : </span>
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
                  fontSize: '0.875rem', padding: '3px 10px', borderRadius: 5,
                  background: '#e0f2fe', color: '#0369a1', fontWeight: 600,
                }}>
                  {RESPONSABLE_DIVISION_LABELS[demande.responsable_division_type]}
                </span>
              )}
              {demande.signature_type && (
                <span style={{
                  fontSize: '0.875rem', padding: '3px 10px', borderRadius: 5,
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

      {/* Fichiers du dossier — liste avec actions pour la secrétaire */}
      <div style={{ marginTop: 16 }}>
        <DossierFilesSplit
          demandeId={demande.id}
          demande={demande}
          status={demande.status}
          files={demande.files}
          complementFiles={demande.complement_files}
          secretaryFiles={(demande as any).secretary_files}
          onRefresh={onRefresh}
        />
      </div>

      {/* Commentaires et motifs des acteurs (rejets, retours) : plus affichés
          ici. Le motif utile est rappelé dans la fenêtre de l'action
          concernée ; tout reste consultable dans l'onglet « Historique ». */}
    </>
  )
}

export default DemandeDetailBase
