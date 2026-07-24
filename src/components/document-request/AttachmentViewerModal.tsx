// src/components/document-request/AttachmentViewerModal.tsx
//
// Visualiseur intégré de pièce jointe — remplace l'ouverture dans un nouvel
// onglet (ancien lien direct vers /storage/{path}, non authentifié et source
// des 403 / aperçus PDF vides).
//
// Le fichier est récupéré via documentRequestService.previewFile(), qui passe
// par la route authentifiée (auth:sanctum) du backend et renvoie une URL blob
// locale — cf. HttpService.downloadFile(), déjà utilisé ailleurs dans
// l'application (RH, cours, inscriptions).

import { useEffect, useRef, useState } from 'react'
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudDownload, cilFile, cilWarning, cilZoomIn, cilZoomOut, cilFullscreen,
} from '@coreui/icons'
import documentRequestService from '@/services/document-request.service'
import { useToast } from '@/contexts'
import type { DocumentRequest } from '@/types/document-request.types'
import { TYPE_LABELS } from '@/types/document-request.types'

// ─── Origine du document ──────────────────────────────────────────────────

export type AttachmentSource = 'initial' | 'complement' | 'secretary'

const ORIGIN_LABELS: Record<AttachmentSource, string> = {
  initial:    'Document fourni lors de la demande',
  complement: 'Document fourni lors du complément',
  secretary:  'Document ajouté par la secrétaire',
}

const ORIGIN_STYLES: Record<AttachmentSource, { bg: string; color: string }> = {
  initial:    { bg: '#eff6ff', color: '#2563eb' },
  complement: { bg: '#faf5ff', color: '#7c3aed' },
  secretary:  { bg: '#f0fdf4', color: '#15803d' },
}

export interface AttachmentViewerFile {
  source: AttachmentSource
  /** Clé du fichier (initial/complément) ou id du fichier (secrétariat) */
  key: string
  /** Chemin de stockage — utilisé uniquement pour déduire l'extension côté client */
  path: string
  /** Nom affiché dans l'en-tête du modal */
  label: string
  uploadedAt?: string | null
  comment?: string | null
}

interface Props {
  demandeId: number
  demande?: DocumentRequest
  file: AttachmentViewerFile | null
  onClose: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────

const extensionOf = (path: string) => (path.split('.').pop() || '').toLowerCase()

const formatDateTime = (iso?: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ─── Petits blocs d'info du panneau latéral ────────────────────────────────

const InfoBlock = ({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) => (
  <div style={{
    border: `1px solid ${accent ? '#bbf7d0' : '#e2e8f0'}`,
    borderRadius: 10,
    padding: '14px 16px',
    background: accent ? '#f0fdf4' : '#f8fafc',
  }}>
    <p style={{
      fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.07em', color: accent ? '#15803d' : '#94a3b8', marginBottom: 10,
    }}>
      {title}
    </p>
    {children}
  </div>
)

const InfoLine = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null
  return (
    <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: 6 }}>
      <span style={{ color: '#9ca3af' }}>{label} : </span>
      <span style={{ fontWeight: 600, color: '#374151' }}>{value}</span>
    </p>
  )
}

// ─── Visualiseur image avec zoom ───────────────────────────────────────────

const ImageViewer = ({ src, alt }: { src: string; alt: string }) => {
  const [zoom, setZoom] = useState(1)

  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 2,
        display: 'flex', gap: 4, alignItems: 'center',
        background: 'rgba(255,255,255,0.92)', borderRadius: 8,
        padding: '4px 6px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      }}>
        <CButton size="sm" color="light" onClick={() => setZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)))}>
          <CIcon icon={cilZoomOut} style={{ width: 14 }} />
        </CButton>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', minWidth: 42, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <CButton size="sm" color="light" onClick={() => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))}>
          <CIcon icon={cilZoomIn} style={{ width: 14 }} />
        </CButton>
        <CButton size="sm" color="light" onClick={() => setZoom(1)}>
          <CIcon icon={cilFullscreen} style={{ width: 14 }} />
        </CButton>
      </div>
      <div style={{
        flex: 1, overflow: 'auto', display: 'flex',
        alignItems: zoom <= 1 ? 'center' : 'flex-start',
        justifyContent: zoom <= 1 ? 'center' : 'flex-start',
        background: '#f1f5f9', borderRadius: 10,
      }}>
        <img
          src={src}
          alt={alt}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            maxWidth: zoom <= 1 ? '100%' : 'none',
            maxHeight: zoom <= 1 ? '100%' : 'none',
            transition: 'transform 0.15s ease',
          }}
        />
      </div>
    </div>
  )
}

// ─── Composant principal ───────────────────────────────────────────────────

const AttachmentViewerModal = ({ demandeId, demande, file, onClose }: Props) => {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [blobUrl, setBlobUrl] = useState<string | null>(null)
  const [filename, setFilename] = useState<string | undefined>(undefined)
  const blobUrlRef = useRef<string | null>(null)

  useEffect(() => {
    blobUrlRef.current = blobUrl
  }, [blobUrl])

  useEffect(() => {
    // Nettoyage de l'URL blob précédente à chaque changement de fichier / fermeture
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    }
  }, [])

  useEffect(() => {
    if (!file) {
      setBlobUrl(null)
      setError(null)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setBlobUrl(null)

    documentRequestService.previewFile(demandeId, file.source, file.key)
      .then(result => {
        if (cancelled) return
        setBlobUrl(result.url)
        setFilename(result.filename)
      })
      .catch((err: any) => {
        if (cancelled) return
        const message = err?.message || "Impossible de charger ce document."
        setError(message)
        toast.error(message)
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file?.source, file?.key, demandeId])

  if (!file) return null

  const ext = extensionOf(file.path)
  const isPdf   = ext === 'pdf'
  const isImage = ['jpg', 'jpeg', 'png'].includes(ext)
  const dateLabel = formatDateTime(file.uploadedAt)
  const originStyle = ORIGIN_STYLES[file.source]

  const downloadName = file.source === 'secretary'
    ? (filename || file.label)
    : `${file.label}.${ext || 'pdf'}`

  const handleDownload = () => {
    if (!blobUrl) return
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = downloadName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <CModal visible={!!file} onClose={onClose} size="xl" alignment="center">
      <CModalHeader style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
        <CModalTitle style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <CIcon icon={cilFile} style={{ width: 18, color: '#475569' }} />
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{file.label}</span>
            <span style={{
              fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 6,
              background: originStyle.bg, color: originStyle.color,
            }}>
              {ORIGIN_LABELS[file.source]}
            </span>
          </div>
          {dateLabel && (
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 6, fontWeight: 500 }}>
              Ajouté le {dateLabel}
            </div>
          )}
        </CModalTitle>
      </CModalHeader>

      <CModalBody style={{ padding: 20 }}>
        <div style={{ display: 'flex', gap: 18, height: '68vh', minHeight: 420 }}>
          {/* ── Zone de visualisation ── */}
          <div style={{
            flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
            background: '#f1f5f9', borderRadius: 10, overflow: 'hidden',
          }}>
            {loading && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <CSpinner color="primary" />
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Chargement du document…</span>
              </div>
            )}

            {!loading && error && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20, textAlign: 'center' }}>
                <CIcon icon={cilWarning} style={{ width: 36, color: '#dc2626' }} />
                <span style={{ fontSize: '0.9rem', color: '#7f1d1d', fontWeight: 600 }}>{error}</span>
              </div>
            )}

            {!loading && !error && blobUrl && isPdf && (
              <iframe
                src={blobUrl}
                title={file.label}
                style={{ flex: 1, width: '100%', border: 'none' }}
              />
            )}

            {!loading && !error && blobUrl && isImage && (
              <ImageViewer src={blobUrl} alt={file.label} />
            )}

            {!loading && !error && blobUrl && !isPdf && !isImage && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20, textAlign: 'center' }}>
                <CIcon icon={cilFile} style={{ width: 40, color: '#94a3b8' }} />
                <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                  Aperçu non disponible pour ce type de fichier.
                </span>
                <CButton color="primary" onClick={handleDownload}>
                  <CIcon icon={cilCloudDownload} className="me-2" style={{ width: 14 }} />
                  Télécharger pour consulter
                </CButton>
              </div>
            )}
          </div>

          {/* ── Panneau latéral ── */}
          <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
            {demande && (
              <>
                <InfoBlock title="Étudiant">
                  <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 8 }}>
                    {demande.last_name} {demande.first_names}
                  </p>
                  <InfoLine label="Matricule"       value={demande.matricule} />
                  <InfoLine label="Filière"         value={demande.department} />
                  <InfoLine label="Niveau"          value={demande.study_level} />
                  <InfoLine label="Année académique" value={demande.academic_year} />
                </InfoBlock>

                <InfoBlock title="Demande">
                  <InfoLine label="Type" value={TYPE_LABELS[demande.type] ?? demande.type} />
                  <InfoLine label="Référence" value={demande.reference} />
                </InfoBlock>
              </>
            )}

            {file.source === 'secretary' && file.comment && (
              <InfoBlock title="Commentaire de la secrétaire" accent>
                <p style={{ fontSize: '0.84rem', color: '#166534', margin: 0, lineHeight: 1.5 }}>
                  {file.comment}
                </p>
              </InfoBlock>
            )}
          </div>
        </div>
      </CModalBody>

      <CModalFooter style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '14px 24px' }}>
        <CButton color="secondary" variant="ghost" onClick={onClose}>Fermer</CButton>
        <CButton color="primary" onClick={handleDownload} disabled={!blobUrl}>
          <CIcon icon={cilCloudDownload} className="me-2" style={{ width: 14 }} />
          Télécharger
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default AttachmentViewerModal
