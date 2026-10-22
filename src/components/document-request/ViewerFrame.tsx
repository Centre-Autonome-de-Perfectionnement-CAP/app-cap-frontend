// src/components/document-request/ViewerFrame.tsx
//
// Cadre commun des visualiseurs (Demandes, Stages) : plein écran, comme un
// document ouvert dans un autre onglet. PDF dessiné dans la page, image avec
// zoom, passage d'un document à l'autre (liste, boutons ou flèches du
// clavier), panneau latéral rétractable, Échap pour fermer le visualiseur
// seulement (pas la fiche ouverte dessous).

import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CButton, CSpinner, CFormSelect } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudDownload, cilFile, cilWarning,
  cilZoomIn, cilZoomOut, cilFullscreen,
  cilChevronRight, cilChevronLeft,
} from '@coreui/icons'
import PdfViewer from './PdfViewer'
import type { FileKind } from './fileKind'

const isTyping = (t: EventTarget | null) => {
  const el = t as HTMLElement | null
  return !!el && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT' || el.tagName === 'SELECT' || el.isContentEditable)
}
const resultModalOpen = () => !!document.querySelector('[data-action-result] [role="alertdialog"]')

// ─── Image avec zoom ──────────────────────────────────────────────────────────

const ImageViewer = ({ src, alt, onDownload }: { src: string; alt: string; onDownload: () => void }) => {
  const [zoom, setZoom] = useState(1)
  const [broken, setBroken] = useState(false)
  // Image illisible par le navigateur : message clair au lieu d'une zone vide
  if (broken) return <Unavailable onDownload={onDownload} text="Cette image ne peut pas s'afficher ici (format non pris en charge par le navigateur)." />
  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 2,
        display: 'flex', gap: 4, alignItems: 'center',
        background: 'rgba(255,255,255,0.92)', borderRadius: 8,
        padding: '4px 6px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      }}>
        <CButton size="sm" color="light" onClick={() => setZoom(z => Math.max(0.25, +(z - 0.25).toFixed(2)))} title="Dézoomer">
          <CIcon icon={cilZoomOut} style={{ width: 14 }} />
        </CButton>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', minWidth: 42, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <CButton size="sm" color="light" onClick={() => setZoom(z => Math.min(4, +(z + 0.25).toFixed(2)))} title="Zoomer">
          <CIcon icon={cilZoomIn} style={{ width: 14 }} />
        </CButton>
        <CButton size="sm" color="light" onClick={() => setZoom(1)} title="Réinitialiser">
          <CIcon icon={cilFullscreen} style={{ width: 14 }} />
        </CButton>
      </div>
      <div style={{
        flex: 1, overflow: 'auto', display: 'flex',
        alignItems: zoom <= 1 ? 'center' : 'flex-start',
        justifyContent: zoom <= 1 ? 'center' : 'flex-start',
        background: '#f1f5f9', borderRadius: 10,
      }}>
        <img src={src} alt={alt} onError={() => setBroken(true)} style={{
          transform: `scale(${zoom})`, transformOrigin: 'top left',
          maxWidth: zoom <= 1 ? '100%' : 'none',
          maxHeight: zoom <= 1 ? '100%' : 'none',
          transition: 'transform 0.15s ease',
        }} />
      </div>
    </div>
  )
}

const Unavailable = ({ text, onDownload }: { text: string; onDownload: () => void }) => (
  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20, textAlign: 'center' }}>
    <CIcon icon={cilFile} style={{ width: 40, color: '#64748b' }} />
    <span style={{ fontSize: '0.9rem', color: '#475569' }}>{text}</span>
    <CButton color="primary" onClick={onDownload}>
      <CIcon icon={cilCloudDownload} className="me-2" style={{ width: 14 }} />
      Télécharger pour consulter
    </CButton>
  </div>
)

// ─── Cadre ────────────────────────────────────────────────────────────────────

export interface ViewerFrameProps {
  /** Nom du document affiché. */
  title: ReactNode
  /** À côté du titre (origine du document, statut…). */
  badge?: ReactNode
  /** Sous le titre (date d'ajout…). */
  subtitle?: ReactNode
  /** Documents parcourables ; la liste et les boutons n'apparaissent qu'à partir de 2. */
  items?: { id: string; label: string }[]
  index?: number
  onIndex?: (i: number) => void
  loading: boolean
  error: string | null
  file: { url: string; kind: FileKind } | null
  onDownload: () => void
  onClose: () => void
  /** Panneau latéral (informations, commentaires, décision…). */
  sidebar?: ReactNode
  /** Boutons du pied, à gauche de « Fermer » et « Télécharger ». */
  footer?: ReactNode
}

const ViewerFrame = ({
  title, badge, subtitle, items = [], index = 0, onIndex, loading, error, file,
  onDownload, onClose, sidebar, footer,
}: ViewerFrameProps) => {
  // Sur téléphone, le document d'abord : le panneau s'ouvre à la demande.
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 900)
  const total = items.length
  const go = (delta: number) => { if (total > 1) onIndex?.((index + delta + total) % total) }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Clavier : Échap = fermer (le visualiseur seulement), flèches = document précédent / suivant
  useEffect(() => {
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
  })

  const hasSidebar = !!sidebar
  const label = typeof title === 'string' ? title : 'Document'

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

        {/* ── En-tête ────────────────────────────────────────────────── */}
        <div style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 24px', flexShrink: 0, background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
              <CIcon icon={cilFile} style={{ width: 18, color: '#475569' }} />
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>{title}</span>
              {badge}
            </div>

            {total > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <CFormSelect
                  size="sm"
                  value={index}
                  onChange={e => onIndex?.(Number(e.target.value))}
                  aria-label="Choisir un document"
                  style={{ width: 260, maxWidth: '100%' }}
                >
                  {items.map((f, i) => <option key={f.id} value={i}>{i + 1}. {f.label}</option>)}
                </CFormSelect>
                <CButton size="sm" color="secondary" variant="outline" onClick={() => go(-1)} title="Document précédent (flèche gauche)">
                  <CIcon icon={cilChevronLeft} style={{ width: 12 }} className="me-1" />Précédent
                </CButton>
                <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>{index + 1} / {total}</span>
                <CButton size="sm" color="secondary" variant="outline" onClick={() => go(1)} title="Document suivant (flèche droite)">
                  Suivant<CIcon icon={cilChevronRight} style={{ width: 12 }} className="ms-1" />
                </CButton>
              </div>
            )}
          </div>
          {subtitle && <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: 6, fontWeight: 500 }}>{subtitle}</div>}
        </div>

        {/* ── Corps ──────────────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: 20, display: 'flex', gap: 0, minHeight: 0, overflow: 'hidden' }}>
          <div style={{
            flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
            background: '#f1f5f9',
            borderRadius: hasSidebar && sidebarOpen ? '10px 0 0 10px' : 10,
            overflow: 'hidden',
          }}>
            {loading && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <CSpinner color="primary" />
                <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Chargement du document…</span>
              </div>
            )}
            {!loading && error && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20, textAlign: 'center' }}>
                <CIcon icon={cilWarning} style={{ width: 36, color: '#dc2626' }} />
                <span style={{ fontSize: '0.9rem', color: '#7f1d1d', fontWeight: 600 }}>{error}</span>
              </div>
            )}
            {!loading && !error && file?.kind === 'pdf' && (
              <PdfViewer key={file.url} src={file.url} title={label} onDownload={onDownload} />
            )}
            {!loading && !error && file?.kind === 'image' && (
              <ImageViewer key={file.url} src={file.url} alt={label} onDownload={onDownload} />
            )}
            {!loading && !error && file?.kind === 'other' && (
              <Unavailable onDownload={onDownload} text="Aperçu non disponible pour ce type de fichier." />
            )}
          </div>

          {hasSidebar && (
            <div style={{ display: 'flex', alignItems: 'center', background: '#f1f5f9', borderLeft: '1px solid #e2e8f0' }}>
              <button
                onClick={() => setSidebarOpen(o => !o)}
                title={sidebarOpen ? 'Masquer le panneau' : 'Afficher le panneau'}
                style={{
                  width: 20, height: '100%', background: 'transparent', border: 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#64748b', padding: 0,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#475569' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8' }}
              >
                <CIcon icon={sidebarOpen ? cilChevronRight : cilChevronLeft} style={{ width: 12 }} />
              </button>
            </div>
          )}

          {hasSidebar && sidebarOpen && (
            <div style={{
              width: 340, maxWidth: window.innerWidth < 900 ? '85vw' : '45vw', flexShrink: 0,
              display: 'flex', flexDirection: 'column', gap: 14,
              overflowY: 'auto',
              borderLeft: '1px solid #e2e8f0',
              background: '#fff',
              padding: '0 0 0 16px',
            }}>
              {sidebar}
            </div>
          )}
        </div>

        {/* ── Pied ───────────────────────────────────────────────────── */}
        <div style={{
          background: '#f8fafc', borderTop: '1px solid #e2e8f0',
          padding: '14px 24px', flexShrink: 0,
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}>
          {footer && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginRight: 'auto' }}>{footer}</div>}
          <CButton color="secondary" variant="ghost" onClick={onClose}>Fermer</CButton>
          <CButton color="primary" onClick={onDownload} disabled={!file}>
            <CIcon icon={cilCloudDownload} className="me-2" style={{ width: 14 }} />
            Télécharger
          </CButton>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export default ViewerFrame
