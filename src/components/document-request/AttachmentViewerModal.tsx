// src/components/document-request/AttachmentViewerModal.tsx
//
// Visualiseur des pièces d'un dossier, en plein écran : il se superpose à
// l'application comme une fenêtre à part (autant de place qu'un onglet).
//
//  - liste des documents du dossier à gauche : on passe de l'un à l'autre
//    d'un clic, ou avec les boutons Précédent / Suivant (flèches du clavier) ;
//  - document au centre, aussi grand que possible ;
//  - à droite : commentaires des acteurs sur ce document, et informations
//    du dossier ;
//  - sur téléphone : liste remplacée par un menu déroulant, panneau de
//    droite affiché à la demande.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudDownload, cilFile, cilWarning, cilX,
  cilZoomIn, cilZoomOut, cilFullscreen,
  cilChevronLeft, cilChevronRight, cilCommentBubble, cilImage, cilDescription, cilSpreadsheet,
} from '@coreui/icons'
import documentRequestService from '@/services/document-request.service'
import type { DocumentRequest } from '@/types/document-request.types'
import { TYPE_LABELS } from '@/types/document-request.types'
import FileCommentsPanel from './FileCommentsPanel'
import useFileComments from './useFileComments'

// ─── Types publics ────────────────────────────────────────────────────────────

export type AttachmentSource = 'initial' | 'complement' | 'secretary'

const ORIGIN_LABELS: Record<AttachmentSource, string> = {
  initial:    "Pièce fournie par l'étudiant",
  complement: "Complément fourni par l'étudiant",
  secretary:  'Ajouté par le secrétariat',
}

const GROUP_LABELS: Record<AttachmentSource, string> = {
  initial:    "Pièces de l'étudiant",
  complement: 'Compléments',
  secretary:  'Pièces du secrétariat',
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
    + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const iconFor = (path: string) => {
  const ext = extensionOf(path)
  if (ext === 'pdf') return { icon: cilFile, color: '#dc2626' }
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return { icon: cilImage, color: '#7c3aed' }
  if (['doc', 'docx'].includes(ext)) return { icon: cilDescription, color: '#2563eb' }
  if (['xls', 'xlsx'].includes(ext)) return { icon: cilSpreadsheet, color: '#16a34a' }
  return { icon: cilFile, color: '#64748b' }
}

const useIsNarrow = (bp = 900) => {
  const get = () => typeof window !== 'undefined' && window.innerWidth < bp
  const [narrow, setNarrow] = useState(get)
  useEffect(() => {
    const on = () => setNarrow(get())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return narrow
}

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.isContentEditable)
}

const resultModalOpen = () => !!document.querySelector('[data-action-result] [role="alertdialog"]')

// ─── Image avec zoom ──────────────────────────────────────────────────────────

const ImageViewer = ({ src, alt }: { src: string; alt: string }) => {
  const [zoom, setZoom] = useState(1)
  useEffect(() => { setZoom(1) }, [src])
  const zbtn: React.CSSProperties = {
    border: 'none', background: 'transparent', color: '#e2e8f0',
    padding: '6px 8px', borderRadius: 6, cursor: 'pointer', display: 'inline-flex',
  }
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 2,
        display: 'flex', gap: 2, alignItems: 'center',
        background: 'rgba(15,23,42,0.85)', borderRadius: 10, padding: '4px 6px',
      }}>
        <button type="button" style={zbtn} title="Dézoomer" onClick={() => setZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)))}>
          <CIcon icon={cilZoomOut} style={{ width: 16 }} />
        </button>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#fff', minWidth: 46, textAlign: 'center' }}>
          {Math.round(zoom * 100)} %
        </span>
        <button type="button" style={zbtn} title="Zoomer" onClick={() => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))}>
          <CIcon icon={cilZoomIn} style={{ width: 16 }} />
        </button>
        <button type="button" style={zbtn} title="Taille d'origine" onClick={() => setZoom(1)}>
          <CIcon icon={cilFullscreen} style={{ width: 16 }} />
        </button>
      </div>
      <div style={{
        flex: 1, overflow: 'auto', display: 'flex',
        alignItems: zoom <= 1 ? 'center' : 'flex-start',
        justifyContent: zoom <= 1 ? 'center' : 'flex-start',
        padding: 16,
      }}>
        <img src={src} alt={alt} style={{
          transform: `scale(${zoom})`, transformOrigin: zoom <= 1 ? 'center' : 'top left',
          maxWidth: zoom <= 1 ? '100%' : 'none',
          maxHeight: zoom <= 1 ? '100%' : 'none',
          transition: 'transform 0.15s ease',
          background: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        }} />
      </div>
    </div>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

type Cached = { url: string; filename?: string }
type Side = 'comments' | 'infos'

const AttachmentViewerModal = ({ demandeId, demande, file, files, onClose, onCommentsChanged }: Props) => {
  const narrow = useIsNarrow()

  // Liste des documents : celle fournie, sinon le seul document ouvert
  const list = useMemo<AttachmentViewerFile[]>(() => {
    if (files && files.length > 0) {
      return file && !files.some(f => sameFile(f, file)) ? [file, ...files] : files
    }
    return file ? [file] : []
  }, [files, file])

  const [index,     setIndex]     = useState(0)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [current,   setCurrent]   = useState<Cached | null>(null)
  const [side,      setSide]      = useState<Side>('comments')
  const [sideOpen,  setSideOpen]  = useState(true)
  const cache = useRef<Map<string, Cached>>(new Map())

  const comments = useFileComments(file ? demandeId : undefined)

  // Ouverture : se placer sur le document cliqué
  useEffect(() => {
    if (!file) return
    const i = list.findIndex(f => sameFile(f, file))
    setIndex(i >= 0 ? i : 0)
    setSide('comments')
    setSideOpen(!narrow)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  // Fermeture : libérer les documents chargés en mémoire
  useEffect(() => {
    if (file) return
    cache.current.forEach(c => URL.revokeObjectURL(c.url))
    cache.current.clear()
    setCurrent(null)
  }, [file])
  useEffect(() => () => {
    cache.current.forEach(c => URL.revokeObjectURL(c.url))
    cache.current.clear()
  }, [])

  // Pas de défilement de la page derrière
  useEffect(() => {
    if (!file) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [file])

  const active = file ? list[Math.min(index, list.length - 1)] ?? null : null
  const total  = list.length

  // Chargement du document affiché (avec cache pour passer de l'un à l'autre sans attendre)
  useEffect(() => {
    if (!active) return
    const id = `${active.source}:${active.key}`
    const hit = cache.current.get(id)
    if (hit) { setCurrent(hit); setError(null); setLoading(false); return }
    let cancelled = false
    setLoading(true); setError(null); setCurrent(null)
    documentRequestService.previewFile(demandeId, active.source, active.key)
      .then(r => {
        const entry = { url: r.url, filename: r.filename }
        cache.current.set(id, entry)
        if (!cancelled) setCurrent(entry)
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || "Ce document n'a pas pu être chargé.")
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.source, active?.key, demandeId])

  const go = useCallback((delta: number) => {
    if (total < 2) return
    setIndex(i => (i + delta + total) % total)
  }, [total])

  // Clavier : flèches = document précédent / suivant ; Échap = fermer
  useEffect(() => {
    if (!file) return
    const onKey = (e: KeyboardEvent) => {
      if (resultModalOpen()) return
      if (e.key === 'Escape') {
        // La fiche du dossier (modal CoreUI) écoute aussi Échap : on ne ferme
        // que le visualiseur.
        e.stopPropagation()
        if (isTyping(e.target)) { (e.target as HTMLElement).blur(); return }
        onClose()
      } else if (!isTyping(e.target) && e.key === 'ArrowRight') {
        go(1)
      } else if (!isTyping(e.target) && e.key === 'ArrowLeft') {
        go(-1)
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [file, onClose, go])

  if (!file || !active) return null

  const ext       = extensionOf(active.path)
  const isPdf     = ext === 'pdf'
  const isImage   = ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
  const dateLabel = formatDateTime(active.uploadedAt)
  const nbComments = comments.countFor(active.source, active.key)

  const downloadName = active.source === 'secretary'
    ? (current?.filename || active.label)
    : `${active.label}.${ext || 'pdf'}`

  const handleDownload = () => {
    if (!current) return
    const a = document.createElement('a')
    a.href = current.url; a.download = downloadName
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  const refreshComments = async () => {
    await comments.reload()
    onCommentsChanged?.()
  }

  // Groupes pour la liste de gauche
  const groups = (['initial', 'complement', 'secretary'] as AttachmentSource[])
    .map(src => ({ src, items: list.map((f, i) => ({ f, i })).filter(x => x.f.source === src) }))
    .filter(g => g.items.length > 0)

  // ── Styles communs ──
  const barBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)',
    color: '#f8fafc', borderRadius: 8, padding: '7px 12px',
    fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
  }
  const tabBtn = (on: boolean): React.CSSProperties => ({
    flex: 1, border: 'none', background: 'none', cursor: 'pointer',
    padding: '12px 8px', fontSize: '0.86rem', fontWeight: on ? 700 : 500,
    color: on ? '#0f172a' : '#64748b',
    borderBottom: `2px solid ${on ? '#2563eb' : 'transparent'}`,
  })

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Document : ${active.label}`}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        background: '#1e293b',
      }}
    >
      {/* ── Barre du haut ─────────────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, background: '#0f172a', color: '#f8fafc',
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: narrow ? 'wrap' : 'nowrap',
      }}>
        <button type="button" onClick={onClose} style={barBtn} title="Fermer (Échap)">
          <CIcon icon={cilX} style={{ width: 16 }} />
          Fermer
        </button>

        <div style={narrow ? { flexBasis: '100%', order: 5, minWidth: 0 } : { minWidth: 0, flex: 1 }}>
          {narrow && total > 1 ? (
            <select
              value={index}
              onChange={e => setIndex(Number(e.target.value))}
              aria-label="Choisir un document"
              style={{
                width: '100%', background: '#1e293b', color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8,
                padding: '7px 10px', fontSize: '0.88rem', fontWeight: 600,
              }}
            >
              {list.map((f, i) => (
                <option key={`${f.source}:${f.key}`} value={i}>{i + 1}. {f.label}</option>
              ))}
            </select>
          ) : (
            <>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {active.label}
              </div>
              <div style={{ fontSize: '0.76rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {ORIGIN_LABELS[active.source]}{dateLabel ? ` · ${dateLabel}` : ''}
              </div>
            </>
          )}
        </div>

        {total > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: narrow ? 'auto' : undefined }}>
            <button type="button" onClick={() => go(-1)} style={barBtn} title="Document précédent (flèche gauche)">
              <CIcon icon={cilChevronLeft} style={{ width: 14 }} />
              {!narrow && 'Précédent'}
            </button>
            <span style={{ fontSize: '0.82rem', color: '#cbd5e1', minWidth: 44, textAlign: 'center' }}>
              {index + 1} / {total}
            </span>
            <button type="button" onClick={() => go(1)} style={barBtn} title="Document suivant (flèche droite)">
              {!narrow && 'Suivant'}
              <CIcon icon={cilChevronRight} style={{ width: 14 }} />
            </button>
          </div>
        )}

        <button type="button" onClick={handleDownload} disabled={!current} style={{ ...barBtn, opacity: current ? 1 : 0.5 }} title="Télécharger">
          <CIcon icon={cilCloudDownload} style={{ width: 15 }} />
          {!narrow && 'Télécharger'}
        </button>

        <button
          type="button"
          onClick={() => { if (sideOpen && side === 'comments') setSideOpen(false); else { setSide('comments'); setSideOpen(true) } }}
          style={{ ...barBtn, background: sideOpen && side === 'comments' ? '#2563eb' : barBtn.background, borderColor: sideOpen && side === 'comments' ? '#2563eb' : 'rgba(255,255,255,0.18)' }}
          title="Commentaires sur ce document"
        >
          <CIcon icon={cilCommentBubble} style={{ width: 15 }} />
          {!narrow && 'Commentaires'}
          {nbComments > 0 && (
            <span style={{ background: '#fff', color: '#1d4ed8', borderRadius: 999, padding: '0 7px', fontSize: '0.72rem', fontWeight: 800 }}>
              {nbComments}
            </span>
          )}
        </button>
      </div>

      {/* ── Corps ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, position: 'relative' }}>

        {/* Liste des documents */}
        {!narrow && total > 1 && (
          <nav aria-label="Documents du dossier" style={{
            width: 250, flexShrink: 0, overflowY: 'auto',
            background: '#0f172a', borderRight: '1px solid rgba(255,255,255,0.08)',
            padding: '12px 8px',
          }}>
            {groups.map(g => (
              <div key={g.src} style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  color: '#64748b', padding: '0 8px 6px',
                }}>
                  {GROUP_LABELS[g.src]}
                </div>
                {g.items.map(({ f, i }) => {
                  const on = i === index
                  const ic = iconFor(f.path)
                  const n  = comments.countFor(f.source, f.key)
                  return (
                    <button
                      key={`${f.source}:${f.key}`}
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-current={on ? 'true' : undefined}
                      style={{
                        width: '100%', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 8,
                        border: 'none', borderRadius: 8, cursor: 'pointer',
                        padding: '8px 8px', marginBottom: 2,
                        background: on ? 'rgba(37,99,235,0.22)' : 'transparent',
                        color: on ? '#fff' : '#cbd5e1',
                      }}
                    >
                      <CIcon icon={ic.icon} style={{ width: 15, color: on ? '#93c5fd' : ic.color, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '0.84rem', fontWeight: on ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {f.label}
                      </span>
                      {n > 0 && (
                        <span title={`${n} commentaire(s)`} style={{
                          fontSize: '0.7rem', fontWeight: 700, borderRadius: 999, padding: '0 6px',
                          background: on ? '#fff' : 'rgba(255,255,255,0.12)', color: on ? '#1d4ed8' : '#e2e8f0',
                        }}>
                          {n}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </nav>
        )}

        {/* Document */}
        <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {loading && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#cbd5e1' }}>
              <CSpinner color="light" />
              <span style={{ fontSize: '0.9rem' }}>Ouverture du document…</span>
            </div>
          )}
          {!loading && error && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24, textAlign: 'center' }}>
              <CIcon icon={cilWarning} style={{ width: 36, color: '#fca5a5' }} />
              <span style={{ fontSize: '0.95rem', color: '#f1f5f9', fontWeight: 600 }}>{error}</span>
              {total > 1 && <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Vous pouvez passer au document suivant.</span>}
            </div>
          )}
          {!loading && !error && current && isPdf && (
            <iframe key={current.url} src={current.url} title={active.label} style={{ flex: 1, width: '100%', border: 'none', background: '#fff' }} />
          )}
          {!loading && !error && current && isImage && (
            <ImageViewer src={current.url} alt={active.label} />
          )}
          {!loading && !error && current && !isPdf && !isImage && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center' }}>
              <CIcon icon={iconFor(active.path).icon} style={{ width: 44, color: '#94a3b8' }} />
              <span style={{ fontSize: '0.95rem', color: '#e2e8f0' }}>
                Ce type de fichier ne s'affiche pas ici.
              </span>
              <button type="button" onClick={handleDownload} style={{ ...barBtn, background: '#2563eb', borderColor: '#2563eb', padding: '10px 18px' }}>
                <CIcon icon={cilCloudDownload} style={{ width: 15 }} />
                Télécharger pour l'ouvrir
              </button>
            </div>
          )}
        </main>

        {/* Panneau de droite : commentaires / infos */}
        {sideOpen && (
          <aside style={{
            width: narrow ? '100%' : 360, flexShrink: 0,
            position: narrow ? 'absolute' : 'relative', inset: narrow ? 0 : undefined, zIndex: 3,
            background: '#fff', display: 'flex', flexDirection: 'column', minHeight: 0,
            borderLeft: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
              <button type="button" style={tabBtn(side === 'comments')} onClick={() => setSide('comments')}>
                Commentaires{nbComments > 0 ? ` (${nbComments})` : ''}
              </button>
              <button type="button" style={tabBtn(side === 'infos')} onClick={() => setSide('infos')}>
                Infos du dossier
              </button>
              <button type="button" onClick={() => setSideOpen(false)} title="Masquer le panneau"
                style={{ border: 'none', background: 'none', padding: '0 14px', cursor: 'pointer', color: '#64748b' }}>
                <CIcon icon={cilX} style={{ width: 14 }} />
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {side === 'comments' ? (
                <FileCommentsPanel
                  demandeId={demandeId}
                  source={active.source}
                  fileKey={active.key}
                  comments={comments.comments}
                  historyVisible={comments.historyVisible}
                  loaded={comments.loaded}
                  onChanged={refreshComments}
                />
              ) : (
                <div style={{ overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {active.source === 'secretary' && active.comment && (
                    <InfoBox title="Note du secrétariat sur ce document" accent>
                      <p style={{ fontSize: '0.88rem', color: '#166534', margin: 0, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                        {active.comment}
                      </p>
                    </InfoBox>
                  )}
                  {demande && (
                    <>
                      <InfoBox title="Étudiant">
                        <p style={{ fontWeight: 700, fontSize: '0.95rem', color: '#111827', marginBottom: 8 }}>
                          {demande.last_name} {demande.first_names}
                        </p>
                        <InfoLine label="Matricule"        value={demande.matricule} />
                        <InfoLine label="Filière"          value={demande.department} />
                        <InfoLine label="Niveau"           value={(demande as any).study_level} />
                        <InfoLine label="Année académique" value={demande.academic_year} />
                      </InfoBox>
                      <InfoBox title="Demande">
                        <InfoLine label="Document"  value={TYPE_LABELS[demande.type] ?? demande.type} />
                        <InfoLine label="Référence" value={demande.reference} />
                      </InfoBox>
                    </>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

// ─── Blocs d'information ──────────────────────────────────────────────────────

const InfoBox = ({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) => (
  <div style={{
    border: `1px solid ${accent ? '#bbf7d0' : '#e2e8f0'}`,
    borderRadius: 10, padding: '12px 14px',
    background: accent ? '#f0fdf4' : '#f8fafc',
  }}>
    <p style={{
      fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.07em', color: accent ? '#15803d' : '#94a3b8', marginBottom: 8,
    }}>
      {title}
    </p>
    {children}
  </div>
)

const InfoLine = ({ label, value }: { label: string; value?: string | null }) => {
  if (!value) return null
  return (
    <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 5 }}>
      <span style={{ color: '#9ca3af' }}>{label} : </span>
      <span style={{ fontWeight: 600, color: '#374151' }}>{value}</span>
    </p>
  )
}

export default AttachmentViewerModal
