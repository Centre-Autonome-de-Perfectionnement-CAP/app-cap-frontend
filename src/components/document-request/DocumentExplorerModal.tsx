// src/components/document-request/DocumentExplorerModal.tsx

import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  CModal, CModalHeader, CModalTitle, CModalBody,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilFolderOpen, cilFile, cilDescription,
  cilSpreadsheet, cilImage, cilDataTransferDown,
} from '@coreui/icons'
import AttachmentViewerModal, {
  type AttachmentViewerFile,
  type AttachmentSource,
} from './AttachmentViewerModal'
import type { DocumentRequest } from '@/types/document-request.types'

// ─── Libellés lisibles ─────────────────────────────────────────────────────

const FILE_LABELS: Record<string, string> = {
  demande_manuscrite:       'Demande manuscrite',
  acte_naissance:           'Acte de naissance',
  attestation_succes_file:  'Attestation de succès',
  quittance:                'Quittance',
  recu_paiement:            'Reçu de paiement',
  bulletin:                 'Bulletin de notes',
}

const humanLabel = (key: string): string =>
  FILE_LABELS[key] ??
  key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

// ─── Icône par extension ───────────────────────────────────────────────────

const FILE_ICON_MAP: { exts: string[]; icon: any; color: string }[] = [
  { exts: ['pdf'],                                       icon: cilFile,             color: '#dc2626' },
  { exts: ['doc', 'docx'],                               icon: cilDescription,      color: '#2563eb' },
  { exts: ['xls', 'xlsx', 'csv'],                        icon: cilSpreadsheet,      color: '#16a34a' },
  { exts: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'], icon: cilImage,            color: '#7c3aed' },
  { exts: ['zip', 'rar', '7z', 'tar', 'gz'],            icon: cilDataTransferDown, color: '#92400e' },
]

function getFileIconMeta(nameOrPath: string) {
  const ext = (nameOrPath.split('.').pop() ?? '').toLowerCase()
  for (const entry of FILE_ICON_MAP) {
    if (entry.exts.includes(ext)) return { icon: entry.icon, color: entry.color }
  }
  return { icon: cilFile, color: '#64748b' }
}

// ─── Catégories ────────────────────────────────────────────────────────────

type FileCategory = 'initial' | 'complement' | 'secretary'

const CATEGORY_META: Record<FileCategory, { label: string; color: string; bg: string }> = {
  initial:    { label: 'Documents soumis',          color: '#2563eb', bg: '#eff6ff' },
  complement: { label: 'Documents complémentaires', color: '#7c3aed', bg: '#f5f3ff' },
  secretary:  { label: 'Documents du secrétariat',  color: '#0891b2', bg: '#ecfeff' },
}

interface ExplorerFile {
  viewerFile: AttachmentViewerFile
  displayLabel: string
  category: FileCategory
}

// ─── Parsers ───────────────────────────────────────────────────────────────

function parseKV(raw: any, category: FileCategory, uploadedAt?: string | null): ExplorerFile[] {
  if (!raw) return []
  let parsed: Record<string, string>
  try { parsed = typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return [] }
  if (typeof parsed !== 'object' || Array.isArray(parsed)) return []
  return Object.entries(parsed).map(([key, path]) => ({
    displayLabel: humanLabel(key),
    category,
    viewerFile: {
      source: (category === 'complement' ? 'complement' : 'initial') as AttachmentSource,
      key,
      path: path as string,
      label: humanLabel(key),
      uploadedAt: uploadedAt ?? null,
    },
  }))
}

function parseSecretary(raw: any): ExplorerFile[] {
  if (!raw) return []
  let arr: any[]
  try { arr = typeof raw === 'string' ? JSON.parse(raw) : raw } catch { return [] }
  if (!Array.isArray(arr)) return []
  return arr.map(f => ({
    displayLabel: f.original_name ?? 'Fichier',
    category: 'secretary' as FileCategory,
    viewerFile: {
      source: 'secretary' as AttachmentSource,
      key: String(f.id),
      path: f.path ?? '',
      label: f.original_name ?? 'Fichier',
      uploadedAt: f.uploaded_at ?? null,
      comment: f.comment ?? null,
    },
  }))
}

function buildFiles(demande: DocumentRequest): ExplorerFile[] {
  return [
    ...parseKV(demande.files,            'initial',    (demande as any).submitted_at),
    ...parseKV(demande.complement_files, 'complement', null),
    ...parseSecretary((demande as any).secretary_files),
  ]
}

// ─── Carte fichier ─────────────────────────────────────────────────────────

const FileCard = ({
  file, meta, onClick,
}: {
  file: ExplorerFile
  meta: typeof CATEGORY_META[FileCategory]
  onClick: () => void
}) => {
  const { icon, color } = getFileIconMeta(file.viewerFile.path || file.displayLabel)
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        padding: '20px 12px 14px',
        background: hovered ? meta.bg : '#fff',
        border: `1.5px solid ${hovered ? meta.color : '#e2e8f0'}`,
        borderRadius: 12,
        cursor: 'pointer',
        width: 130,
        textAlign: 'center',
        transform: hovered ? 'translateY(-3px)' : 'none',
        boxShadow: hovered ? `0 4px 16px ${meta.color}28` : 'none',
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: 48, height: 48,
        background: `${color}14`,
        borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CIcon icon={icon} style={{ width: 26, color }} />
      </div>
      <span style={{
        fontSize: '0.76rem',
        fontWeight: 600,
        color: '#1e293b',
        lineHeight: 1.35,
        wordBreak: 'break-word',
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {file.displayLabel}
      </span>
    </button>
  )
}

// ─── Props ─────────────────────────────────────────────────────────────────

interface Props {
  demande: DocumentRequest
  visible: boolean
  onClose: () => void
}

// ─── DocumentExplorerModal ─────────────────────────────────────────────────

const DocumentExplorerModal = ({ demande, visible, onClose }: Props) => {
  const allFiles = buildFiles(demande)
  const [viewerFile, setViewerFile] = useState<AttachmentViewerFile | null>(null)

  const categories: FileCategory[] = ['initial', 'complement', 'secretary']
  const populated = categories.filter(cat => allFiles.some(f => f.category === cat))

  return (
    <>
      {/* ── Explorateur ── */}
      <CModal
        visible={visible}
        onClose={onClose}
        size="lg"
        alignment="center"
      >
        <CModalHeader style={{
          borderBottom: '1px solid #e2e8f0',
          padding: '18px 24px',
          background: '#fff',
        }}>
          <CModalTitle style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, background: '#eff6ff',
                borderRadius: 10, display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <CIcon icon={cilFolderOpen} style={{ width: 18, color: '#2563eb' }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                  Documents du dossier
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500, marginTop: 2 }}>
                  {allFiles.length} fichier{allFiles.length > 1 ? 's' : ''} — cliquez pour visualiser
                </div>
              </div>
            </div>
          </CModalTitle>
        </CModalHeader>

        <CModalBody style={{ padding: '24px 28px', background: '#f8fafc' }}>
          {allFiles.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 12, padding: '48px 0', color: '#94a3b8',
            }}>
              <CIcon icon={cilFolderOpen} style={{ width: 44, color: '#cbd5e1' }} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Aucun document disponible</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {populated.map(cat => {
                const meta  = CATEGORY_META[cat]
                const group = allFiles.filter(f => f.category === cat)
                return (
                  <div key={cat}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                      <div style={{ width: 4, height: 20, borderRadius: 2, background: meta.color, flexShrink: 0 }} />
                      <span style={{
                        fontSize: '0.75rem', fontWeight: 700, color: meta.color,
                        textTransform: 'uppercase', letterSpacing: '0.07em',
                      }}>
                        {meta.label}
                      </span>
                      <span style={{
                        fontSize: '0.7rem', color: '#94a3b8',
                        background: '#f1f5f9', padding: '1px 8px',
                        borderRadius: 10, fontWeight: 600,
                      }}>
                        {group.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                      {group.map((file, i) => (
                        <FileCard
                          key={`${cat}-${i}`}
                          file={file}
                          meta={meta}
                          onClick={() => setViewerFile(file.viewerFile)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CModalBody>
      </CModal>

      {/* ── Visualiseur — monté via portal directement sur document.body
           pour éviter l'empilement de backdrops CoreUI ── */}
      {createPortal(
        <AttachmentViewerModal
          demandeId={demande.id}
          demande={demande}
          file={viewerFile}
          onClose={() => setViewerFile(null)}
        />,
        document.body,
      )}
    </>
  )
}

export default DocumentExplorerModal
