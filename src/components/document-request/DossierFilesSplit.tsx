// src/components/document-request/DossierFilesSplit.tsx
// Affiche les pièces initiales et complémentaires de façon distincte.
// La section "complémentaires" n'apparaît que lorsqu'il y en a.

import { useState } from 'react'
import { CButton, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilFile, cilPlus, cilTrash, cilPencil, cilCheck } from '@coreui/icons'
import HttpService from '@/services/http.service'
import { useAuth, useToast } from '@/contexts'
import AttachmentViewerModal, { type AttachmentViewerFile, type AttachmentSource } from './AttachmentViewerModal'
import type { DocumentRequest } from '@/types/document-request.types'

// ─── Libellés ─────────────────────────────────────────────────────────────────

const FILE_LABELS: Record<string, string> = {
  demande_manuscrite:       'Demande manuscrite',
  acte_naissance:           'Acte de naissance',
  attestation_succes_file:  "Attestation de succès",
  quittance:                'Quittance',
  recu_paiement:            'Reçu de paiement',
  bulletin:                 'Bulletin de notes',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseFiles(raw: Record<string, string> | null | string): Record<string, string> {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return {} }
  }
  return raw
}

// ─── FileChip ─────────────────────────────────────────────────────────────────
// Ouvre désormais le visualiseur intégré (modal) au lieu d'un nouvel onglet.

const FileChip = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <CButton
    color="light"
    size="sm"
    onClick={onClick}
    className="d-flex align-items-center gap-1"
    style={{ fontSize: '0.78rem' }}
  >
    <CIcon icon={cilFile} size="sm" />
    {label}
    <CIcon icon={cilCloudDownload} size="sm" className="ms-1 text-muted" />
  </CButton>
)

// ─── FileGrid — liste de fichiers ─────────────────────────────────────────────

const FileGrid = ({
  files, source, onOpen,
}: {
  files: Record<string, string>
  source: AttachmentSource
  onOpen: (source: AttachmentSource, key: string, path: string, label: string) => void
}) => {
  const entries = Object.entries(files)
  if (entries.length === 0) {
    return <p className="text-muted small mb-0">Aucun fichier joint.</p>
  }
  return (
    <div className="d-flex flex-wrap gap-2">
      {entries.map(([key, path]) => (
        <FileChip
          key={key}
          label={FILE_LABELS[key] ?? key}
          onClick={() => onOpen(source, key, path, FILE_LABELS[key] ?? key)}
        />
      ))}
    </div>
  )
}

// ─── Pill — tab selector ──────────────────────────────────────────────────────

const Pill = ({
  label, count, active, onClick, accent,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
  accent: string
}) => (
  <button
    onClick={onClick}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '5px 14px',
      borderRadius: 20,
      border: 'none',
      cursor: 'pointer',
      fontWeight: active ? 700 : 500,
      fontSize: '0.78rem',
      color: active ? '#fff' : '#6b7280',
      background: active ? accent : '#f1f5f9',
      transition: 'all 0.15s',
      boxShadow: active ? `0 2px 8px ${accent}55` : 'none',
    }}
  >
    {label}
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 18,
        height: 18,
        borderRadius: '50%',
        fontSize: '0.68rem',
        fontWeight: 700,
        background: active ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
        color: active ? '#fff' : '#374151',
      }}
    >
      {count}
    </span>
  </button>
)

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  demandeId?: number
  demande?: DocumentRequest
  status?: string
  files: Record<string, string> | null | string
  complementFiles: Record<string, string> | null | string
  secretaryFiles?: { id: string, path: string, original_name: string, comment?: string, uploaded_at: string }[] | null | string
  onRefresh?: () => Promise<void>
}

// ─── DossierFilesSplit ────────────────────────────────────────────────────────

const DossierFilesSplit = ({ demandeId, demande, status, files, complementFiles, secretaryFiles, onRefresh }: Props) => {
  const { role } = useAuth()
  const initial    = parseFiles(files)
  const complement = parseFiles(complementFiles)
  
  let secFiles: any[] = []
  if (secretaryFiles) {
    if (typeof secretaryFiles === 'string') {
      try { secFiles = JSON.parse(secretaryFiles) } catch { secFiles = [] }
    } else {
      secFiles = secretaryFiles
    }
  }

  const hasComplement = Object.keys(complement).length > 0
  const hasSecretaryFiles = secFiles.length > 0

  const isEditable = role === 'secretaire' && (status === 'submitted' || status === 'secretary_correction')

  const [tab, setTab] = useState<'initial' | 'complement'>('initial')

  // ── Visualiseur intégré ──────────────────────────────────────────────────
  const [viewerFile, setViewerFile] = useState<AttachmentViewerFile | null>(null)

  const openStudentFile = (source: AttachmentSource, key: string, path: string, label: string) => {
    setViewerFile({
      source,
      key,
      path,
      label,
      uploadedAt: source === 'initial' ? demande?.submitted_at : null,
    })
  }

  const openSecretaryFile = (f: any) => {
    setViewerFile({
      source: 'secretary',
      key: f.id,
      path: f.path,
      label: f.original_name,
      uploadedAt: f.uploaded_at,
      comment: f.comment,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Pièces étudiantes ── */}
      {!hasComplement ? (
        <div>
          <p
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: '#94a3b8',
              marginBottom: 8,
            }}
          >
            Pièces jointes étudiantes
          </p>
          <FileGrid files={initial} source="initial" onOpen={openStudentFile} />
        </div>
      ) : (
        <div>
          {/* En-tête */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <p
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: '#94a3b8',
                margin: 0,
              }}
            >
              Pièces jointes étudiantes
            </p>

            {/* Pills */}
            <div style={{ display: 'flex', gap: 6 }}>
              <Pill
                label="Initiales"
                count={Object.keys(initial).length}
                active={tab === 'initial'}
                onClick={() => setTab('initial')}
                accent="#2563eb"
              />
              <Pill
                label="Complémentaires"
                count={Object.keys(complement).length}
                active={tab === 'complement'}
                onClick={() => setTab('complement')}
                accent="#7c3aed"
              />
            </div>
          </div>

          {/* Panneau actif */}
          <div
            style={{
              border: `1.5px solid ${tab === 'complement' ? '#ede9fe' : '#e2e8f0'}`,
              borderRadius: 10,
              padding: '12px 14px',
              background: tab === 'complement' ? '#faf5ff' : '#f8fafc',
              transition: 'all 0.2s',
            }}
          >
            {/* Badge contextuel */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              {tab === 'complement' ? (
                <>
                  <CIcon icon={cilPlus} style={{ width: 13, color: '#7c3aed' }} />
                  <span
                    style={{
                      fontSize: '0.70rem',
                      fontWeight: 600,
                      color: '#7c3aed',
                      background: '#ede9fe',
                      padding: '2px 8px',
                      borderRadius: 5,
                    }}
                  >
                    Pièces déposées en complément :
                  </span>
                </>
              ) : (
                <>
                  <CIcon icon={cilFile} style={{ width: 13, color: '#2563eb' }} />
                  <span
                    style={{
                      fontSize: '0.70rem',
                      fontWeight: 600,
                      color: '#2563eb',
                      background: '#eff6ff',
                      padding: '2px 8px',
                      borderRadius: 5,
                    }}
                  >
                    Pièces déposées à la soumission :
                  </span>
                </>
              )}
            </div>

            <FileGrid
              files={tab === 'initial' ? initial : complement}
              source={tab}
              onOpen={openStudentFile}
            />
          </div>
        </div>
      )}

      {/* ── Pièces de la secrétaire ── */}
      {hasSecretaryFiles && (
        <div>
          <p
            style={{
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              color: '#94a3b8',
              marginBottom: 8,
            }}
          >
            Pièces jointes du secrétariat
          </p>
          <div style={{
            border: '1.5px solid #e2e8f0',
            borderRadius: 10,
            padding: '12px 14px',
            background: '#f8fafc',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {secFiles.map((f, i) => (
                <SecretaryFileRow
                  key={f.id || i}
                  demandeId={demandeId}
                  file={f}
                  onRefresh={onRefresh}
                  isEditable={!!isEditable}
                  onOpen={openSecretaryFile}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <AttachmentViewerModal
        demandeId={demandeId ?? 0}
        demande={demande}
        file={viewerFile}
        onClose={() => setViewerFile(null)}
      />
    </div>
  )
}

const SecretaryFileRow = ({
  demandeId,
  file,
  onRefresh,
  isEditable,
  onOpen,
}: {
  demandeId?: number
  file: any
  onRefresh?: () => Promise<void>
  isEditable: boolean
  onOpen: (file: any) => void
}) => {
  const [editing, setEditing] = useState(false)
  const [comment, setComment] = useState(file.comment || '')
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const toast = useToast()

  const handleSaveComment = async () => {
    if (!demandeId || !file.id) return
    setLoading(true)
    try {
      await HttpService.patch(`/attestations/document-requests/${demandeId}/secretary-files/${file.id}`, { comment })
      setEditing(false)
      toast.success("Commentaire mis à jour avec succès.")
      if (onRefresh) await onRefresh()
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || "Erreur lors de la mise à jour du commentaire.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!demandeId || !file.id) return
    setLoading(true)
    try {
      await HttpService.delete(`/attestations/document-requests/${demandeId}/secretary-files/${file.id}`)
      toast.success("Fichier supprimé avec succès.")
      if (onRefresh) await onRefresh()
    } catch (err: any) {
      console.error(err)
      toast.error(err?.message || "Erreur lors de la suppression du fichier.")
    } finally {
      setLoading(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      background: '#fff', border: '1px solid #f1f5f9',
      borderRadius: 8, padding: '8px 12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileChip label={file.original_name} onClick={() => onOpen(file)} />
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            ({new Date(file.uploaded_at).toLocaleDateString('fr-FR')} à {new Date(file.uploaded_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })})
          </span>
        </div>
        
        {isEditable && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {confirmDelete ? (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#fef2f2',
                padding: '2px 8px',
                borderRadius: 6,
                border: '1px solid #fca5a5'
              }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b91c1c' }}>Supprimer ?</span>
                <CButton
                  color="danger"
                  size="sm"
                  style={{ color: '#fff', padding: '1px 6px', fontSize: '0.68rem', fontWeight: 700 }}
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? <CSpinner size="sm" style={{ width: 10, height: 10 }} /> : 'Oui'}
                </CButton>
                <CButton
                  color="secondary"
                  variant="outline"
                  size="sm"
                  style={{ padding: '1px 6px', fontSize: '0.68rem', fontWeight: 600 }}
                  onClick={() => setConfirmDelete(false)}
                  disabled={loading}
                >
                  Non
                </CButton>
              </div>
            ) : (
              <>
                <CButton
                  color="secondary"
                  variant="ghost"
                  size="sm"
                  style={{ padding: '2px 6px' }}
                  onClick={() => setEditing(!editing)}
                  disabled={loading}
                >
                  <CIcon icon={cilPencil} style={{ width: 14 }} />
                </CButton>
                <CButton
                  color="danger"
                  variant="ghost"
                  size="sm"
                  style={{ padding: '2px 6px' }}
                  onClick={() => setConfirmDelete(true)}
                  disabled={loading}
                >
                  <CIcon icon={cilTrash} style={{ width: 14 }} />
                </CButton>
              </>
            )}
          </div>
        )}
      </div>

      {(editing || file.comment) && (
        <div style={{
          marginTop: 8, fontSize: '0.8rem', color: '#475569',
          background: '#f8fafc', padding: '6px 10px', borderRadius: 6,
          borderLeft: '3px solid #cbd5e1',
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          {editing ? (
            <>
              <input
                type="text"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Ajouter un commentaire..."
                style={{ flex: 1, padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: 4 }}
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') handleSaveComment() }}
              />
              <CButton size="sm" color="success" style={{ color: 'white', padding: '4px 8px' }} onClick={handleSaveComment} disabled={loading}>
                <CIcon icon={cilCheck} style={{ width: 14 }} />
              </CButton>
            </>
          ) : (
            <div style={{ flex: 1 }}>{file.comment}</div>
          )}
        </div>
      )}
    </div>
  )
}

export default DossierFilesSplit
