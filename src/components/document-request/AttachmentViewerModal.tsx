// src/components/document-request/AttachmentViewerModal.tsx
//
// Visualiseur plein écran — style original conservé, agrandi à tout l'écran
// (comme un document ouvert dans un autre onglet).
// Panneau latéral rétractable via bouton toggle, avec les commentaires des
// acteurs sur le document. Précédent / Suivant (ou flèches du clavier) et
// liste déroulante pour passer d'un document du dossier à l'autre.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CButton, CSpinner, CFormSelect } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudDownload, cilFile, cilWarning,
  cilZoomIn, cilZoomOut, cilFullscreen,
  cilChevronRight, cilChevronLeft,
} from '@coreui/icons'
import type { DocumentRequest } from '@/types/document-request.types'
import { TYPE_LABELS } from '@/types/document-request.types'
import FileCommentsPanel from './FileCommentsPanel'
import { getDossierFile, peekDossierFile, prefetchDossierFiles } from './dossierFileCache'
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
const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.isContentEditable)
}
const resultModalOpen = () => !!document.querySelector('[data-action-result] [role="alertdialog"]')

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

// ─── Visualiseur image avec zoom ──────────────────────────────────────────────

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
        <CButton size="sm" color="light" onClick={() => setZoom(1)} title="Reinitialiser">
          <CIcon icon={cilFullscreen} style={{ width: 14 }} />
        </CButton>
      </div>
      <div style={{
        flex: 1, overflow: 'auto', display: 'flex',
        alignItems: zoom <= 1 ? 'center' : 'flex-start',
        justifyContent: zoom <= 1 ? 'center' : 'flex-start',
        background: '#f1f5f9', borderRadius: 10,
      }}>
        <img src={src} alt={alt} style={{
          transform: `scale(${zoom})`, transformOrigin: 'top left',
          maxWidth: zoom <= 1 ? '100%' : 'none',
          maxHeight: zoom <= 1 ? '100%' : 'none',
          transition: 'transform 0.15s ease',
        }} />
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

const AttachmentViewerModal = ({ demandeId, demande, file, files, onClose, onCommentsChanged }: Props) => {
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [blobUrl,     setBlobUrl]     = useState<string | null>(null)
  const [filename,    setFilename]    = useState<string | undefined>(undefined)
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
    if (file) {
      document.body.style.overflow = 'hidden'
      // Sur téléphone, le document d'abord : le panneau s'ouvre à la demande.
      setSidebarOpen(window.innerWidth >= 900)
      const i = list.findIndex(f => sameFile(f, file))
      setIndex(i >= 0 ? i : 0)
    } else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  const active = file ? (list[Math.min(index, list.length - 1)] ?? file) : null
  const total  = list.length

  const go = useCallback((delta: number) => {
    if (total < 2) return
    setIndex(i => (i + delta + total) % total)
  }, [total])

  // Clavier : Échap = fermer (le visualiseur seulement), flèches = document précédent / suivant
  useEffect(() => {
    if (!file) return
    const handler = (e: KeyboardEvent) => {
      if (resultModalOpen()) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        if (isTyping(e.target)) { (e.target as HTMLElement).blur(); return }
        onClose()
      } else if (!isTyping(e.target) && e.key === 'ArrowRight') go(1)
      else if (!isTyping(e.target) && e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', handler, true)
    return () => window.removeEventListener('keydown', handler, true)
  }, [file, onClose, go])

  useEffect(() => {
    if (!active) { setBlobUrl(null); setError(null); return }
    // Déjà en mémoire : affichage immédiat
    const hit = peekDossierFile(demandeId, active)
    if (hit) { setBlobUrl(hit.url); setFilename(hit.filename); setError(null); setLoading(false) }
    else {
      setBlobUrl(null); setLoading(true); setError(null)
    }
    let cancelled = false
    if (!hit) {
      getDossierFile(demandeId, active)
        .then(result => { if (!cancelled) { setBlobUrl(result.url); setFilename(result.filename) } })
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

  const ext         = extensionOf(active.path)
  const isPdf       = ext === 'pdf'
  const isImage     = ['jpg', 'jpeg', 'png'].includes(ext)
  const dateLabel   = formatDateTime(active.uploadedAt)
  const originStyle = ORIGIN_STYLES[active.source]
  const hasSidebar  = true
  const nbComments  = comments.countFor(active.source, active.key)

  const downloadName = active.source === 'secretary'
    ? (filename || active.label)
    : `${active.label}.${ext || 'pdf'}`

  const handleDownload = () => {
    if (!blobUrl) return
    const a = document.createElement('a')
    a.href = blobUrl; a.download = downloadName
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  const content = (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100vw', height: '100vh',
        background: '#ffffff', borderRadius: 0,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
        overflow: 'hidden',
      }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{
          borderBottom: '1px solid #e2e8f0', padding: '16px 24px',
          flexShrink: 0, background: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
            <CIcon icon={cilFile} style={{ width: 18, color: '#475569' }} />
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{active.label}</span>
            <span style={{
              fontSize: '0.72rem', fontWeight: 600, padding: '3px 10px', borderRadius: 6,
              background: originStyle.bg, color: originStyle.color,
            }}>
              {ORIGIN_LABELS[active.source]}
            </span>
          </div>

          {/* Passer d'un document du dossier à l'autre */}
          {total > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <CFormSelect
                size="sm"
                value={index}
                onChange={e => setIndex(Number(e.target.value))}
                aria-label="Choisir un document du dossier"
                style={{ width: 260, maxWidth: '100%' }}
              >
                {list.map((f, i) => (
                  <option key={`${f.source}:${f.key}`} value={i}>{i + 1}. {f.label}</option>
                ))}
              </CFormSelect>
              <CButton size="sm" color="secondary" variant="outline" onClick={() => go(-1)} title="Document précédent (flèche gauche)">
                <CIcon icon={cilChevronLeft} style={{ width: 12 }} className="me-1" />Précédent
              </CButton>
              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{index + 1} / {total}</span>
              <CButton size="sm" color="secondary" variant="outline" onClick={() => go(1)} title="Document suivant (flèche droite)">
                Suivant<CIcon icon={cilChevronRight} style={{ width: 12 }} className="ms-1" />
              </CButton>
            </div>
          )}
          </div>
          {dateLabel && (
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 6, fontWeight: 500 }}>
              Ajoute le {dateLabel}
            </div>
          )}
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: 20, display: 'flex', gap: 0, minHeight: 0, overflow: 'hidden' }}>

          {/* Zone de visualisation */}
          <div style={{
            flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
            background: '#f1f5f9',
            borderRadius: hasSidebar && sidebarOpen ? '10px 0 0 10px' : 10,
            overflow: 'hidden',
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
              <iframe src={blobUrl} title={active.label} style={{ flex: 1, width: '100%', border: 'none' }} />
            )}
            {!loading && !error && blobUrl && isImage && (
              <ImageViewer src={blobUrl} alt={active.label} />
            )}
            {!loading && !error && blobUrl && !isPdf && !isImage && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20, textAlign: 'center' }}>
                <CIcon icon={cilFile} style={{ width: 40, color: '#94a3b8' }} />
                <span style={{ fontSize: '0.9rem', color: '#475569' }}>
                  Apercu non disponible pour ce type de fichier.
                </span>
                <CButton color="primary" onClick={handleDownload}>
                  <CIcon icon={cilCloudDownload} className="me-2" style={{ width: 14 }} />
                  Telecharger pour consulter
                </CButton>
              </div>
            )}
          </div>

          {/* Bouton toggle panneau lateral */}
          {hasSidebar && (
            <div style={{
              display: 'flex', alignItems: 'center',
              background: '#f1f5f9',
              borderLeft: '1px solid #e2e8f0',
            }}>
              <button
                onClick={() => setSidebarOpen(o => !o)}
                title={sidebarOpen ? 'Masquer le panneau' : 'Afficher le panneau'}
                style={{
                  width: 20, height: '100%', background: 'transparent', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#94a3b8', padding: 0,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#475569' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8' }}
              >
                <CIcon icon={sidebarOpen ? cilChevronRight : cilChevronLeft} style={{ width: 12 }} />
              </button>
            </div>
          )}

          {/* Panneau lateral retractable */}
          {hasSidebar && sidebarOpen && (
            <div style={{
              width: 340, maxWidth: window.innerWidth < 900 ? '85vw' : '45vw', flexShrink: 0,
              display: 'flex', flexDirection: 'column', gap: 14,
              overflowY: 'auto',
              borderLeft: '1px solid #e2e8f0',
              background: '#fff',
              padding: '0 0 0 16px',
            }}>
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
                  <p style={{ fontSize: '0.84rem', color: '#166534', margin: 0, lineHeight: 1.5 }}>
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
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div style={{
          background: '#f8fafc', borderTop: '1px solid #e2e8f0',
          padding: '14px 24px', flexShrink: 0,
          display: 'flex', justifyContent: 'flex-end', gap: 8,
        }}>
          <CButton color="secondary" variant="ghost" onClick={onClose}>Fermer</CButton>
          <CButton color="primary" onClick={handleDownload} disabled={!blobUrl}>
            <CIcon icon={cilCloudDownload} className="me-2" style={{ width: 14 }} />
            Telecharger
          </CButton>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export default AttachmentViewerModal
