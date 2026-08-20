// src/views/pages/demandes/components/modal/DemandeModalShell.tsx
// CORRECTIFS :
//  - Responsivité mobile (footer wrap, barre workflow scrollable, tabs scrollables)
//  - CModalBody avec overflow-y: auto + max-height pour ne jamais dépasser la fenêtre
//  - FullViewer et FileManager portés dans des portails (pas de conflit z-index)
//  - Fermeture Échap sur le FullViewer
//  - Backdrop noir impossible (reset propre dans handleClose)

import { useState, useEffect, useCallback } from 'react'
import { CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilDescription, cilHistory, cilWarning,
  cilFolderOpen, cilArrowLeft, cilX, cilPlus,
} from '@coreui/icons'
import { WorkflowBadge } from '@/components/document-request'
import type { DocumentRequest } from '@/types/document-request.types'
import { RESPONSABLE_DIVISION_LABELS } from '@/types/document-request.types'
import HistoriquePanel from './HistoriquePanel'
import SousReservePanel from './SousReservePanel'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'details' | 'reserve' | 'historique'
type ViewerMode = 'closed' | 'manager' | 'viewer'

interface FileItem {
  id: number | string
  name: string
  url: string
  category: 'soumission' | 'complement' | 'secretaire' | 'autre'
  mime?: string
}

interface Props {
  demande: DocumentRequest
  visible: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  footer: React.ReactNode
  showStatusBadge?: boolean
  canClearFlag?: boolean
  onFlagCleared?: () => void
  onRefresh?: () => Promise<void>
}

// ─── Workflow progress bar ──────────────────────────────────────────────────────

const WORKFLOW_STEPS = [
  { key: 'submitted',                        label: 'Soumis'         },
  { key: 'accounting_review',                label: 'Comptabilité'   },
  { key: 'division_manager_review',          label: 'Resp. Division' },
  { key: 'cap_manager_review',               label: 'Chef CAP'       },
  { key: 'deputy_director_secretary_review', label: 'Sec. Dir. Adj.' },
  { key: 'deputy_director_review',           label: 'Dir. Adjointe'  },
  { key: 'director_secretary_review',        label: 'Sec. Directeur' },
  { key: 'director_review',                  label: 'Directeur'      },
  { key: 'ready_for_pickup',                 label: 'Prêt'           },
  { key: 'picked_up',                        label: 'Remis'          },
]

const WorkflowProgress = ({ status }: { status: string }) => {
  const currentIdx = WORKFLOW_STEPS.findIndex(s => s.key === status)
  const isRejected = status === 'rejected' || status === 'secretary_correction'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      overflowX: 'auto', paddingBottom: 6,
      // scrollbar visible mais fine sur mobile
      WebkitOverflowScrolling: 'touch',
    }}>
      {WORKFLOW_STEPS.map((step, idx) => {
        const done    = currentIdx > idx
        const current = currentIdx === idx
        const future  = currentIdx < idx

        const color = isRejected && current
          ? '#dc2626'
          : current ? '#2563eb'
          : done    ? '#059669'
          : '#d1d5db'

        const bg = isRejected && current
          ? '#fef2f2'
          : current ? '#eff6ff'
          : done    ? '#ecfdf5'
          : '#f9fafb'

        return (
          <div key={step.key} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: bg,
                border: `2px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 800,
                color,
                boxShadow: current ? `0 0 0 3px ${color}22` : 'none',
                transition: 'all 0.2s',
              }}>
                {done ? '✓' : isRejected && current ? '✕' : idx + 1}
              </div>
              <span style={{
                fontSize: '0.6rem', fontWeight: current ? 700 : 500,
                color: current ? color : future ? '#9ca3af' : '#6b7280',
                whiteSpace: 'nowrap', maxWidth: 52, textAlign: 'center', lineHeight: 1.2,
              }}>
                {step.label}
              </span>
            </div>
            {idx < WORKFLOW_STEPS.length - 1 && (
              <div style={{
                width: 14, height: 2, flexShrink: 0,
                background: done ? '#059669' : '#e5e7eb',
                margin: '0 1px', marginBottom: 16,
                transition: 'background 0.2s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Bouton onglet ──────────────────────────────────────────────────────────────

const TabBtn = ({
  label, active, onClick, icon, dot, highlight,
}: {
  label: string; active: boolean; onClick: () => void
  icon: any; dot?: boolean; highlight?: boolean
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '8px 12px',
      borderRadius: '8px 8px 0 0',
      border: 'none',
      borderBottom: active
        ? `2px solid ${highlight ? '#d97706' : '#2563eb'}`
        : '2px solid transparent',
      cursor: 'pointer',
      fontWeight: active ? 700 : 500,
      fontSize: '0.82rem',
      color: active
        ? (highlight ? '#d97706' : '#2563eb')
        : '#6b7280',
      background: active
        ? (highlight ? '#fffbeb' : '#f8faff')
        : 'transparent',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    }}
  >
    <CIcon icon={icon} style={{ width: 13, flexShrink: 0 }} />
    {label}
    {dot && (
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: '#d97706', flexShrink: 0,
        display: 'inline-block',
      }} />
    )}
  </button>
)

// ─── Helpers fichiers ───────────────────────────────────────────────────────────

const CATEGORY_META: Record<FileItem['category'], { label: string; color: string; bg: string; border: string }> = {
  soumission: { label: 'Soumission',  color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  complement: { label: 'Complément',  color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  secretaire: { label: 'Secrétariat', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc' },
  autre:      { label: 'Autres',      color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
}

const getMimeIcon = (mime?: string, name?: string) => {
  const ext = name?.split('.').pop()?.toLowerCase() ?? ''
  if (mime?.includes('pdf') || ext === 'pdf')   return '📄'
  if (mime?.includes('image') || ['jpg','jpeg','png','gif','webp'].includes(ext)) return '🖼️'
  if (['doc','docx'].includes(ext))              return '📝'
  if (['xls','xlsx'].includes(ext))              return '📊'
  return '📁'
}

const buildFileList = (demande: DocumentRequest): FileItem[] => {
  const items: FileItem[] = []

  const normalize = (raw: any): any[] => {
    if (!raw) return []
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw) } catch { return [] }
    }
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'object') {
      return Object.entries(raw).map(([key, val]) => ({
        id:            key,
        original_name: key,
        url:           typeof val === 'string' ? val : (val as any)?.url ?? '',
        mime_type:     undefined,
      }))
    }
    return []
  }

  const pushAll = (raw: any, cat: FileItem['category']) => {
    normalize(raw).forEach((f: any, i: number) => {
      items.push({
        id:       f.id ?? `${cat}-${i}`,
        name:     f.original_name ?? f.name ?? f.file_name ?? `Fichier ${i + 1}`,
        url:      f.url ?? f.path ?? f.file_path ?? '',
        category: cat,
        mime:     f.mime_type ?? f.mime ?? undefined,
      })
    })
  }

  pushAll(demande.files,            'soumission')
  pushAll(demande.complement_files, 'complement')
  pushAll(demande.secretary_files,  'secretaire')
  return items
}

// ─── Gestionnaire de fichiers ───────────────────────────────────────────────────

interface FileManagerProps {
  files: FileItem[]
  onSelect: (file: FileItem) => void
  onClose: () => void
  activeDocSlot?: 'left' | 'right' | null
}

const FileManager = ({ files, onSelect, onClose, activeDocSlot }: FileManagerProps) => {
  const categories = (Object.keys(CATEGORY_META) as FileItem['category'][]).filter(
    cat => files.some(f => f.category === cat)
  )

  // Fermeture Échap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.6)',
      zIndex: 1060,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 680,
        maxHeight: '85vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <CIcon icon={cilFolderOpen} style={{ width: 18, color: '#60a5fa' }} />
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
              Gestionnaire de documents
            </span>
            <span style={{
              fontSize: '0.7rem', background: 'rgba(255,255,255,0.12)',
              color: '#94a3b8', padding: '2px 8px', borderRadius: 20, fontWeight: 600,
            }}>
              {files.length} fichier{files.length > 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {activeDocSlot && (
              <span style={{
                fontSize: '0.7rem', color: '#fbbf24', fontWeight: 600,
                background: 'rgba(251,191,36,0.12)', padding: '3px 8px', borderRadius: 20,
              }}>
                Remplace : {activeDocSlot === 'left' ? 'gauche' : 'droit'}
              </span>
            )}
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 7, padding: '5px 8px', cursor: 'pointer', color: '#94a3b8',
              display: 'flex', alignItems: 'center',
            }}>
              <CIcon icon={cilX} style={{ width: 13 }} />
            </button>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div style={{ overflowY: 'auto', padding: '18px 20px', flex: 1 }}>
          {categories.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>
              <span style={{ fontSize: '2.5rem' }}>📂</span>
              <p style={{ marginTop: 12, fontWeight: 600 }}>Aucun fichier disponible</p>
            </div>
          ) : (
            categories.map(cat => {
              const meta  = CATEGORY_META[cat]
              const group = files.filter(f => f.category === cat)
              return (
                <div key={cat} style={{ marginBottom: 22 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 4, height: 16, borderRadius: 2, background: meta.color }} />
                    <span style={{
                      fontSize: '0.75rem', fontWeight: 700,
                      color: meta.color, textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>
                      {meta.label}
                    </span>
                    <span style={{
                      fontSize: '0.68rem', color: '#94a3b8',
                      background: '#f1f5f9', padding: '1px 7px', borderRadius: 10,
                    }}>
                      {group.length}
                    </span>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                    gap: 8,
                  }}>
                    {group.map(file => (
                      <button
                        key={file.id}
                        onClick={() => onSelect(file)}
                        style={{
                          background: meta.bg,
                          border: `1.5px solid ${meta.border}`,
                          borderRadius: 10,
                          padding: '12px 12px 10px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s',
                          display: 'flex', flexDirection: 'column', gap: 7,
                        }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLButtonElement
                          el.style.borderColor = meta.color
                          el.style.boxShadow = `0 4px 12px ${meta.color}22`
                          el.style.transform = 'translateY(-1px)'
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLButtonElement
                          el.style.borderColor = meta.border
                          el.style.boxShadow = 'none'
                          el.style.transform = 'none'
                        }}
                      >
                        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>
                          {getMimeIcon(file.mime, file.name)}
                        </span>
                        <span style={{
                          fontSize: '0.78rem', fontWeight: 600, color: '#1e293b',
                          wordBreak: 'break-word', lineHeight: 1.3,
                          display: '-webkit-box', WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {file.name}
                        </span>
                        <span style={{
                          fontSize: '0.65rem', color: meta.color, fontWeight: 600,
                          background: `${meta.color}14`,
                          padding: '2px 6px', borderRadius: 5, alignSelf: 'flex-start',
                        }}>
                          {meta.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Panneau d'un document dans le visualiseur ──────────────────────────────────

const isPdf  = (f: FileItem) => f.mime?.includes('pdf')  || f.name.toLowerCase().endsWith('.pdf')
const isImg  = (f: FileItem) => f.mime?.includes('image') ||
  ['jpg','jpeg','png','gif','webp'].includes(f.name.split('.').pop()?.toLowerCase() ?? '')

interface ViewerPanelProps {
  file: FileItem
  isActive: boolean
  onActivate: () => void
  onClose: () => void
  showClose: boolean
  onBackToManager: () => void
}

const ViewerPanel = ({ file, isActive, onActivate, onClose, showClose, onBackToManager }: ViewerPanelProps) => (
  <div
    onClick={onActivate}
    style={{
      flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
      border: isActive ? '2px solid #2563eb' : '2px solid #e2e8f0',
      borderRadius: 10, overflow: 'hidden',
      boxShadow: isActive ? '0 0 0 3px #2563eb22' : 'none',
      transition: 'border-color 0.15s, box-shadow 0.15s',
      cursor: 'pointer',
      background: '#fff',
      minHeight: 0,
    }}
  >
    {/* Barre outil */}
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '7px 10px',
      background: isActive ? '#eff6ff' : '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      minHeight: 40,
      flexShrink: 0,
      flexWrap: 'wrap',
    }}>
      <button
        onClick={e => { e.stopPropagation(); onBackToManager() }}
        title="Retour au gestionnaire"
        style={{
          background: '#fff', border: '1px solid #d1d5db',
          borderRadius: 5, padding: '3px 7px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
          fontSize: '0.7rem', color: '#374151', fontWeight: 600,
        }}
      >
        <CIcon icon={cilArrowLeft} style={{ width: 11 }} />
        Fichiers
      </button>

      {isActive && (
        <span style={{
          fontSize: '0.65rem', fontWeight: 700, color: '#2563eb',
          background: '#dbeafe', padding: '1px 6px', borderRadius: 20,
          flexShrink: 0,
        }}>
          Actif
        </span>
      )}

      <span style={{
        flex: 1, minWidth: 0,
        fontSize: '0.75rem', fontWeight: 600, color: '#1e293b',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {getMimeIcon(file.mime, file.name)} {file.name}
      </span>

      {showClose && (
        <button
          onClick={e => { e.stopPropagation(); onClose() }}
          title="Fermer ce document"
          style={{
            background: '#fee2e2', border: '1px solid #fca5a5',
            borderRadius: 5, padding: '3px 6px',
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            color: '#dc2626', flexShrink: 0,
          }}
        >
          <CIcon icon={cilX} style={{ width: 11 }} />
        </button>
      )}
    </div>

    {/* Zone affichage */}
    <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
      {isPdf(file) ? (
        <iframe
          src={file.url}
          style={{ width: '100%', height: '100%', border: 'none', minHeight: 400 }}
          title={file.name}
        />
      ) : isImg(file) ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16, height: '100%',
        }}>
          <img src={file.url} alt={file.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 6 }} />
        </div>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 12, padding: 24, height: '100%', color: '#64748b',
        }}>
          <span style={{ fontSize: '2.5rem' }}>{getMimeIcon(file.mime, file.name)}</span>
          <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{file.name}</span>
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '7px 16px', background: '#2563eb', color: '#fff',
              borderRadius: 7, textDecoration: 'none', fontWeight: 600, fontSize: '0.82rem',
            }}
          >
            Ouvrir / Télécharger
          </a>
        </div>
      )}
    </div>
  </div>
)

// ─── Viewer principal ──────────────────────────────────────────────────────────

interface ViewerState {
  left: FileItem | null
  right: FileItem | null
  active: 'left' | 'right'
}

interface FullViewerProps {
  initialFile: FileItem
  allFiles: FileItem[]
  onClose: () => void
}

const FullViewer = ({ initialFile, allFiles, onClose }: FullViewerProps) => {
  const [state, setState] = useState<ViewerState>({ left: initialFile, right: null, active: 'left' })
  const [showManager, setShowManager] = useState(false)

  const hasTwo = !!(state.left && state.right)

  // Fermeture Échap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !showManager) onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, showManager])

  const handleSelectFile = (file: FileItem) => {
    setShowManager(false)
    setState(prev => {
      if (!prev.left) return { ...prev, left: file, active: 'left' }
      if (!prev.right) return { ...prev, right: file, active: prev.active }
      if (prev.active === 'left') return { ...prev, left: file }
      return { ...prev, right: file }
    })
  }

  const closeLeft  = () => setState(prev => ({ ...prev, left: prev.right, right: null, active: 'left' }))
  const closeRight = () => setState(prev => ({ ...prev, right: null, active: 'left' }))

  return (
    <>
      {showManager && (
        <FileManager
          files={allFiles}
          onSelect={handleSelectFile}
          onClose={() => setShowManager(false)}
          activeDocSlot={hasTwo ? state.active : null}
        />
      )}

      <div style={{
        position: 'fixed', inset: 0,
        background: '#0f172a',
        zIndex: 1055,
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Barre supérieure */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 16px',
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          flexShrink: 0,
          minHeight: 48,
          flexWrap: 'wrap',
        }}>
          <span style={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.88rem' }}>
            <CIcon icon={cilFolderOpen} style={{ width: 15, marginRight: 6 }} />
            Visualiseur de documents
          </span>
          <div style={{ flex: 1 }} />
          {!hasTwo && (
            <button
              onClick={() => setShowManager(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: '#334155', border: '1px solid #475569',
                borderRadius: 7, padding: '5px 12px',
                color: '#e2e8f0', fontWeight: 600, fontSize: '0.8rem',
                cursor: 'pointer',
              }}
            >
              <CIcon icon={cilPlus} style={{ width: 12 }} />
              Ajouter un document
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: 7, padding: '5px 12px',
              color: '#f87171', fontWeight: 600, fontSize: '0.8rem',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <CIcon icon={cilX} style={{ width: 12 }} />
            Fermer
          </button>
        </div>

        {/* Zone documents */}
        <div style={{
          flex: 1, minHeight: 0,
          display: 'flex', gap: 6,
          padding: '8px 10px 10px',
          flexWrap: 'nowrap',
          overflow: 'hidden',
        }}>
          {state.left && (
            <ViewerPanel
              file={state.left}
              isActive={state.active === 'left'}
              onActivate={() => setState(p => ({ ...p, active: 'left' }))}
              onClose={closeLeft}
              showClose={hasTwo}
              onBackToManager={() => {
                setState(p => ({ ...p, active: 'left' }))
                setShowManager(true)
              }}
            />
          )}
          {state.right && (
            <ViewerPanel
              file={state.right}
              isActive={state.active === 'right'}
              onActivate={() => setState(p => ({ ...p, active: 'right' }))}
              onClose={closeRight}
              showClose
              onBackToManager={() => {
                setState(p => ({ ...p, active: 'right' }))
                setShowManager(true)
              }}
            />
          )}
        </div>
      </div>
    </>
  )
}

// ─── Shell principal ────────────────────────────────────────────────────────────

const DemandeModalShell = ({
  demande, visible, onClose,
  title, children, footer,
  showStatusBadge = true,
  canClearFlag = false,
  onFlagCleared,
  onRefresh,
}: Props) => {
  const hasFlag = !!(demande as any).has_flag
  const [activeTab, setActiveTab]       = useState<Tab>('details')
  const [viewerMode, setViewerMode]     = useState<ViewerMode>('closed')
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null)
  const allFiles = buildFileList(demande)

  const handleClose = useCallback(() => {
    setActiveTab('details')
    setViewerMode('closed')
    setSelectedFile(null)
    onClose()
  }, [onClose])

  // Fermeture propre sur Échap pour le shell lui-même
  useEffect(() => {
    if (!visible) {
      // Reset des états overlays si la modal se ferme de l'extérieur
      setViewerMode('closed')
      setSelectedFile(null)
    }
  }, [visible])

  const openManager = () => setViewerMode('manager')

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file)
    setViewerMode('viewer')
  }

  return (
    <>
      {/* ── Visualiseur plein écran ── */}
      {viewerMode === 'viewer' && selectedFile && (
        <FullViewer
          initialFile={selectedFile}
          allFiles={allFiles}
          onClose={() => {
            setViewerMode('closed')
            setSelectedFile(null)
          }}
        />
      )}

      {/* ── Gestionnaire de fichiers ── */}
      {viewerMode === 'manager' && (
        <FileManager
          files={allFiles}
          onSelect={handleFileSelect}
          onClose={() => setViewerMode('closed')}
        />
      )}

      {/* ── Modal principal ── */}
      <CModal
        visible={visible}
        onClose={handleClose}
        size="xl"
        alignment="center"
        scrollable
      >
        {/* ── Header ── */}
        <CModalHeader style={{
          borderBottom: '1px solid #e2e8f0',
          padding: '14px 20px 0',
          background: '#fff',
        }}>
          <div style={{ width: '100%' }}>
            {/* Titre + badges */}
            <CModalTitle style={{
              display: 'flex', alignItems: 'center', gap: 7,
              flexWrap: 'wrap', marginBottom: 8,
            }}>
              <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>
                {title ?? 'Dossier'}
              </span>
              <code style={{
                fontSize: '0.78rem', color: '#64748b', fontWeight: 600,
                background: '#f1f5f9', padding: '2px 7px', borderRadius: 5,
              }}>
                #{demande.reference}
              </code>
              {showStatusBadge && <WorkflowBadge status={demande.status} size="sm" />}
              {demande.responsable_division_type && (
                <span style={{
                  fontSize: '0.72rem', padding: '2px 7px', borderRadius: 5,
                  background: '#e0f2fe', color: '#0369a1', fontWeight: 600,
                }}>
                  {RESPONSABLE_DIVISION_LABELS[demande.responsable_division_type]}
                </span>
              )}
              {hasFlag && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  fontSize: '0.72rem', padding: '2px 7px', borderRadius: 5,
                  background: '#fffbeb', color: '#d97706', fontWeight: 700,
                  border: '1px solid #fcd34d',
                }}>
                  <CIcon icon={cilWarning} style={{ width: 11 }} />
                  Réserve active
                </span>
              )}
            </CModalTitle>

            {/* Barre de progression workflow */}
            <div style={{ marginBottom: 8 }}>
              <WorkflowProgress status={demande.status} />
            </div>

            {/* Onglets — scrollables horizontalement sur mobile */}
            <div style={{
              display: 'flex', gap: 1,
              borderBottom: '1px solid #e2e8f0',
              marginBottom: -1,
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}>
              <TabBtn
                label="Détails"
                icon={cilDescription}
                active={activeTab === 'details'}
                onClick={() => setActiveTab('details')}
              />
              {hasFlag && (
                <TabBtn
                  label="Sous réserve"
                  icon={cilWarning}
                  active={activeTab === 'reserve'}
                  onClick={() => setActiveTab('reserve')}
                  dot
                  highlight
                />
              )}
              <TabBtn
                label="Historique"
                icon={cilHistory}
                active={activeTab === 'historique'}
                onClick={() => setActiveTab('historique')}
              />
            </div>
          </div>
        </CModalHeader>

        {/* ── Body — scrollable avec max-height pour éviter les débordements ── */}
        <CModalBody style={{
          padding: '20px 20px',
          overflowY: 'auto',
          // Laisse le CModal scrollable gérer la hauteur
          minHeight: 200,
        }}>
          {activeTab === 'details' && children}

          {activeTab === 'reserve' && hasFlag && (
            <SousReservePanel
              demande={demande}
              canClearFlag={canClearFlag}
              onFlagCleared={() => {
                onFlagCleared?.()
                setActiveTab('details')
              }}
            />
          )}

          {activeTab === 'historique' && (
            <HistoriquePanel
              demandeId={demande.id}
              hasFlag={false}
              canClearFlag={false}
            />
          )}
        </CModalBody>

        {/* ── Footer — responsive ── */}
        <CModalFooter style={{
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          padding: '12px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {/* Bouton pièces jointes — côté gauche */}
          <button
            onClick={openManager}
            disabled={allFiles.length === 0}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '9px 16px',
              background: allFiles.length === 0
                ? '#f1f5f9'
                : 'linear-gradient(135deg, #1e3a5f, #2563eb)',
              color: allFiles.length === 0 ? '#94a3b8' : '#fff',
              border: 'none',
              borderRadius: 9,
              fontWeight: 700, fontSize: '0.82rem',
              cursor: allFiles.length === 0 ? 'not-allowed' : 'pointer',
              boxShadow: allFiles.length === 0 ? 'none' : '0 3px 10px rgba(37,99,235,0.3)',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
          >
            <CIcon icon={cilFolderOpen} style={{ width: 14, flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap' }}>
              Documents
              {allFiles.length > 0 && (
                <span style={{
                  marginLeft: 6,
                  background: 'rgba(255,255,255,0.22)',
                  borderRadius: 20, padding: '0 6px',
                  fontSize: '0.7rem', fontWeight: 700,
                }}>
                  {allFiles.length}
                </span>
              )}
            </span>
          </button>

          {/* Actions métier — côté droit, wrap sur mobile */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            // Sur très petits écrans, s'étale en pleine largeur
            flex: '1 1 auto',
            justifyContent: 'flex-end',
          }}>
            {footer}
          </div>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default DemandeModalShell
