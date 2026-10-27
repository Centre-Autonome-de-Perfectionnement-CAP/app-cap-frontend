// src/components/document-request/AttachmentViewerModal.tsx
//
// Visualiseur des pièces d'une demande (cadre commun : ViewerFrame), avec
// les informations du dossier et les commentaires des acteurs dans le
// panneau latéral.

import { useEffect, useMemo, useState } from 'react'
import type { DocumentRequest } from '@/types/document-request.types'
import { TYPE_LABELS } from '@/types/document-request.types'
import FileCommentsPanel from './FileCommentsPanel'
import ViewerFrame from './ViewerFrame'
import { saveLocalFile } from '@/utils/base64File'
import { getDossierFile, peekDossierFile, prefetchDossierFiles, type FileKind } from './dossierFileCache'
import useFileComments from './useFileComments'

// ─── Types publics ────────────────────────────────────────────────────────────

export type AttachmentSource = 'initial' | 'complement' | 'secretary'

const ORIGIN_LABELS: Record<AttachmentSource, string> = {
  initial:    'Document fourni lors de la demande',
  complement: 'Document fourni lors du complement',
  secretary:  'Document ajoute par la secretaire',
}

const ORIGIN_STYLES: Record<AttachmentSource, { bg: string; color: string }> = {
  initial:    { bg: '#eff6ff', color: '#2563eb' },
  complement: { bg: '#faf5ff', color: '#7c3aed' },
  secretary:  { bg: '#f0fdf4', color: '#15803d' },
}

export interface AttachmentViewerFile {
  source: AttachmentSource
  key: string
  path: string
  label: string
  uploadedAt?: string | null
  comment?: string | null
}

interface Props {
  demandeId: number
  demande?: DocumentRequest
  /** Document à ouvrir (null = visualiseur fermé). */
  file: AttachmentViewerFile | null
  /** Tous les documents du dossier, pour passer de l'un à l'autre. */
  files?: AttachmentViewerFile[]
  onClose: () => void
  /** Appelé après l'ajout / la modification d'un commentaire. */
  onCommentsChanged?: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const extensionOf = (path: string) => (path.split('.').pop() || '').toLowerCase()
const sameFile = (a: AttachmentViewerFile, b: AttachmentViewerFile) => a.source === b.source && a.key === b.key

const formatDateTime = (iso?: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    + ' a ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ─── Blocs info panneau lateral ───────────────────────────────────────────────

const InfoBlock = ({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) => (
  <div style={{
    border: `1px solid ${accent ? '#bbf7d0' : '#e2e8f0'}`,
    borderRadius: 10, padding: '14px 16px',
    background: accent ? '#f0fdf4' : '#f8fafc',
  }}>
    <p style={{
      fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase',
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
    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 6 }}>
      <span style={{ color: '#64748b' }}>{label} : </span>
      <span style={{ fontWeight: 600, color: '#374151' }}>{value}</span>
    </p>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

const AttachmentViewerModal = ({ demandeId, demande, file, files, onClose, onCommentsChanged }: Props) => {
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [blobUrl,     setBlobUrl]     = useState<string | null>(null)
  const [filename,    setFilename]    = useState<string | undefined>(undefined)
  const [kind,        setKind]        = useState<FileKind | null>(null)
  const [realExt,     setRealExt]     = useState('')
  const [index,       setIndex]       = useState(0)

  // Liste des documents : celle fournie, sinon le seul document ouvert
  const list = useMemo<AttachmentViewerFile[]>(() => {
    if (files && files.length > 0) {
      return file && !files.some(f => sameFile(f, file)) ? [file, ...files] : files
    }
    return file ? [file] : []
  }, [files, file])

  const comments = useFileComments(file ? demandeId : undefined)

  // Les URL des documents appartiennent au cache partagé (dossierFileCache) :
  // elles ne sont pas libérées ici, pour un réaffichage instantané.

  useEffect(() => {
    if (!file) return
    const i = list.findIndex(f => sameFile(f, file))
    setIndex(i >= 0 ? i : 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  const active = file ? (list[Math.min(index, list.length - 1)] ?? file) : null
  const total  = list.length

  useEffect(() => {
    if (!active) { setBlobUrl(null); setError(null); return }
    // Déjà en mémoire : affichage immédiat
    const hit = peekDossierFile(demandeId, active)
    if (hit) { setBlobUrl(hit.url); setFilename(hit.filename); setKind(hit.kind); setRealExt(hit.ext); setError(null); setLoading(false) }
    else {
      setBlobUrl(null); setLoading(true); setError(null)
    }
    let cancelled = false
    if (!hit) {
      getDossierFile(demandeId, active)
        .then(result => { if (!cancelled) { setBlobUrl(result.url); setFilename(result.filename); setKind(result.kind); setRealExt(result.ext) } })
        .catch((err: any) => {
          if (!cancelled) setError(err?.message || 'Impossible de charger ce document.')
        })
        .finally(() => { if (!cancelled) setLoading(false) })
    }
    // Précharge les documents voisins (Précédent / Suivant)
    if (total > 1) {
      const i = list.findIndex(f => sameFile(f, active))
      prefetchDossierFiles(demandeId, [list[(i + 1) % total], list[(i - 1 + total) % total]])
    }
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.source, active?.key, demandeId])

  if (!file || !active) return null

  // Affichage selon le contenu réel du fichier (voir dossierFileCache)
  const ext         = realExt || extensionOf(active.path)
  const dateLabel   = formatDateTime(active.uploadedAt)
  const originStyle = ORIGIN_STYLES[active.source]
  const nbComments  = comments.countFor(active.source, active.key)

  const downloadName = active.source === 'secretary'
    ? (filename || active.label)
    : `${active.label}.${ext || 'pdf'}`

  const handleDownload = () => { if (blobUrl) saveLocalFile(blobUrl, downloadName) }

  return (
    <ViewerFrame
      title={active.label}
      badge={
        <span style={{
          fontSize: '0.875rem', fontWeight: 600, padding: '3px 10px', borderRadius: 6,
          background: originStyle.bg, color: originStyle.color,
        }}>
          {ORIGIN_LABELS[active.source]}
        </span>
      }
      subtitle={dateLabel ? `Ajoute le ${dateLabel}` : undefined}
      items={list.map(f => ({ id: `${f.source}:${f.key}`, label: f.label }))}
      index={index}
      onIndex={setIndex}
      loading={loading}
      error={error}
      file={blobUrl && kind ? { url: blobUrl, kind } : null}
      onDownload={handleDownload}
      onClose={onClose}
      sidebar={<>
        {demande && (
          <>
            <InfoBlock title="Etudiant">
              <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827', marginBottom: 8 }}>
                {demande.last_name} {demande.first_names}
              </p>
              <InfoLine label="Matricule"        value={demande.matricule} />
              <InfoLine label="Filiere"          value={demande.department} />
              <InfoLine label="Niveau"           value={(demande as any).study_level} />
              <InfoLine label="Annee academique" value={demande.academic_year} />
            </InfoBlock>
            <InfoBlock title="Demande">
              <InfoLine label="Type"      value={TYPE_LABELS[demande.type] ?? demande.type} />
              <InfoLine label="Reference" value={demande.reference} />
            </InfoBlock>
          </>
        )}
        {active.source === 'secretary' && active.comment && (
          <InfoBlock title="Commentaire" accent>
            <p style={{ fontSize: '0.875rem', color: '#166534', margin: 0, lineHeight: 1.5 }}>
              {active.comment}
            </p>
          </InfoBlock>
        )}
        <InfoBlock title={`Commentaires des acteurs${nbComments ? ` (${nbComments})` : ''}`}>
          <div style={{ margin: '0 -16px -14px' }}>
            <FileCommentsPanel
              demandeId={demandeId}
              source={active.source}
              fileKey={active.key}
              comments={comments.comments}
              historyVisible={comments.historyVisible}
              loaded={comments.loaded}
              onChanged={async () => { await comments.reload(); onCommentsChanged?.() }}
            />
          </div>
        </InfoBlock>
      </>}
    />
  )
}

export default AttachmentViewerModal
