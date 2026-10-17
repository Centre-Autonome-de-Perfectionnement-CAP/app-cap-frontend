// src/components/document-request/DossierFilesSplit.tsx
// Affiche toutes les pièces jointes d'un dossier.
// Pour la secrétaire : ajout via mini-modal, modification (fichier + nom + commentaire),
// suppression avec confirmation inline.

import { useState, useRef } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilFile, cilDescription, cilSpreadsheet, cilImage,
  cilPlus, cilPencil, cilTrash, cilCheck, cilX, cilCloudUpload,
  cilCheckCircle,
} from '@coreui/icons'
import HttpService from '@/services/http.service'
import { useAuth, useToast } from '@/contexts'
import AttachmentViewerModal, {
  type AttachmentViewerFile,
  type AttachmentSource,
} from './AttachmentViewerModal'
import type { DocumentRequest } from '@/types/document-request.types'

// ─── Libellés clés → noms lisibles ───────────────────────────────────────────

const FILE_LABELS: Record<string, string> = {
  demande_manuscrite:       'Demande manuscrite',
  acte_naissance:           'Acte de naissance',
  attestation_succes_file:  'Attestation de succès',
  quittance:                'Quittance',
  recu_paiement:            'Reçu de paiement',
  bulletin:                 'Bulletin de notes',
}

// ─── Icônes & couleurs par extension ─────────────────────────────────────────

interface FileMeta { icon: any; color: string; bg: string; label: string }

function fileMetaFromName(name: string): FileMeta {
  const ext = (name.split('.').pop() ?? '').toLowerCase()
  switch (ext) {
    case 'pdf':
      return { icon: cilFile,        color: '#dc2626', bg: '#fef2f2', label: 'PDF'  }
    case 'doc':
    case 'docx':
      return { icon: cilDescription, color: '#2563eb', bg: '#eff6ff', label: 'Word' }
    case 'xls':
    case 'xlsx':
      return { icon: cilSpreadsheet, color: '#16a34a', bg: '#f0fdf4', label: 'Excel'}
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'webp':
      return { icon: cilImage,       color: '#7c3aed', bg: '#faf5ff', label: 'Image'}
    default:
      return { icon: cilFile,        color: '#64748b', bg: '#f8fafc', label: ext.toUpperCase() || 'Fichier' }
  }
}

// ─── Carte fichier cliquable ──────────────────────────────────────────────────

const FileCard = ({
  name, path, date, comment, isEditable, onClick, onEdit, onDelete,
}: {
  name: string
  path: string
  date?: string | null
  comment?: string | null
  isEditable: boolean
  onClick: () => void
  onEdit?: () => void
  onDelete?: () => void
}) => {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const meta = fileMetaFromName(path || name)

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 10,
      padding: '10px 12px',
      transition: 'box-shadow 0.15s',
    }}>
      {/* Icône extension */}
      <div
        onClick={onClick}
        style={{
          width: 36, height: 36, borderRadius: 8,
          background: meta.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, cursor: 'pointer',
        }}
      >
        <CIcon icon={meta.icon} style={{ width: 18, color: meta.color }} />
      </div>

      {/* Nom + date + commentaire */}
      <div
        onClick={onClick}
        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
      >
        <div style={{
          fontWeight: 600, fontSize: '0.84rem', color: '#1e293b',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: '0.68rem', fontWeight: 600, padding: '1px 6px',
            borderRadius: 4, background: meta.bg, color: meta.color,
          }}>
            {meta.label}
          </span>
          {date && (
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              {new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              {' '}
              {new Date(date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        {comment && (
          <div style={{
            marginTop: 4, fontSize: '0.76rem', color: '#64748b',
            fontStyle: 'italic',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {comment}
          </div>
        )}
      </div>

      {/* Actions secrétaire */}
      {isEditable && (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
          {confirmDelete ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: '#fef2f2', border: '1px solid #fca5a5',
              borderRadius: 7, padding: '3px 8px',
            }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b91c1c' }}>
                Supprimer ?
              </span>
              <CButton size="sm" color="danger"
                style={{ padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700, color: '#fff' }}
                onClick={onDelete}
              >
                Oui
              </CButton>
              <CButton size="sm" color="secondary" variant="outline"
                style={{ padding: '1px 7px', fontSize: '0.7rem' }}
                onClick={() => setConfirmDelete(false)}
              >
                Non
              </CButton>
            </div>
          ) : (
            <>
              <CButton
                size="sm" color="secondary" variant="ghost"
                style={{ padding: '3px 7px' }}
                onClick={onEdit}
                title="Modifier"
              >
                <CIcon icon={cilPencil} style={{ width: 13 }} />
              </CButton>
              <CButton
                size="sm" color="danger" variant="ghost"
                style={{ padding: '3px 7px' }}
                onClick={() => setConfirmDelete(true)}
                title="Supprimer"
              >
                <CIcon icon={cilTrash} style={{ width: 13 }} />
              </CButton>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Mini-modal ajout / modification ─────────────────────────────────────────

interface FileFormModalProps {
  visible: boolean
  mode: 'add' | 'edit'
  initial?: { name: string; comment: string }
  loading: boolean
  onClose: () => void
  onSubmit: (data: { file: File | null; name: string; comment: string }) => void
}

const FileFormModal = ({
  visible, mode, initial, loading, onClose, onSubmit,
}: FileFormModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file,    setFile]    = useState<File | null>(null)
  const [name,    setName]    = useState(initial?.name    ?? '')
  const [comment, setComment] = useState(initial?.comment ?? '')
  const [fileErr, setFileErr] = useState<string | null>(null)

  // Réinitialise l'état à chaque ouverture
  const handleOpen = () => {
    setFile(null)
    setName(initial?.name    ?? '')
    setComment(initial?.comment ?? '')
    setFileErr(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setFileErr(null)
    if (f && !name) setName(f.name)
    else if (f)     setName(f.name)
  }

  const handleSubmit = () => {
    if (mode === 'add' && !file) {
      setFileErr('Veuillez choisir un fichier.')
      return
    }
    onSubmit({ file, name: name.trim() || (file?.name ?? ''), comment: comment.trim() })
  }

  const isAdd = mode === 'add'

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      alignment="center"
      size="sm"
      backdrop="static"
      onShow={handleOpen}
    >
      <CModalHeader style={{ borderBottom: '1px solid #e2e8f0', padding: '14px 20px' }}>
        <CModalTitle style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f172a' }}>
          {isAdd ? 'Ajouter un fichier' : 'Modifier le fichier'}
        </CModalTitle>
      </CModalHeader>

      <CModalBody style={{ padding: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Champ fichier */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              {isAdd ? 'Fichier *' : 'Remplacer le fichier'}
              {!isAdd && <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>(laisser vide pour conserver)</span>}
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px',
                border: `1.5px dashed ${fileErr ? '#fca5a5' : '#cbd5e1'}`,
                borderRadius: 8, cursor: 'pointer',
                background: file ? '#f0fdf4' : '#f8fafc',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              <CIcon icon={cilCloudUpload} style={{ width: 16, color: file ? '#15803d' : '#94a3b8', flexShrink: 0 }} />
              <span style={{
                fontSize: '0.8rem', fontWeight: 500,
                color: file ? '#15803d' : '#64748b',
                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {file ? file.name : 'Choisir un fichier…'}
              </span>
              {file && (
                <CIcon
                  icon={cilCheck}
                  style={{ width: 14, color: '#15803d', flexShrink: 0 }}
                />
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              onChange={handleFileChange}
            />
            {fileErr && (
              <p style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: 4 }}>{fileErr}</p>
            )}
          </div>

          {/* Nom */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Nom du fichier
              <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>(facultatif)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nom affiché du fichier"
              style={{
                width: '100%', padding: '8px 12px', fontSize: '0.84rem',
                border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none',
                color: '#1e293b',
              }}
              onFocus={e => { e.target.style.borderColor = '#6366f1' }}
              onBlur={e  => { e.target.style.borderColor = '#e2e8f0' }}
            />
          </div>

          {/* Commentaire */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#374151', marginBottom: 6 }}>
              Commentaire
              <span style={{ fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>(facultatif)</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Note interne sur ce fichier…"
              rows={3}
              style={{
                width: '100%', padding: '8px 12px', fontSize: '0.84rem',
                border: '1.5px solid #e2e8f0', borderRadius: 8, outline: 'none',
                color: '#1e293b', resize: 'vertical', fontFamily: 'inherit',
              }}
              onFocus={e => { e.target.style.borderColor = '#6366f1' }}
              onBlur={e  => { e.target.style.borderColor = '#e2e8f0' }}
            />
          </div>
        </div>
      </CModalBody>

      <CModalFooter style={{ borderTop: '1px solid #e2e8f0', padding: '12px 20px', gap: 8, justifyContent: 'flex-end' }}>
        <CButton color="secondary" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
          Annuler
        </CButton>
        <CButton
          color="primary" size="sm"
          onClick={handleSubmit}
          disabled={loading}
          style={{ fontWeight: 700, minWidth: 100 }}
        >
          {loading
            ? <CSpinner size="sm" />
            : isAdd ? 'Ajouter' : 'Enregistrer'
          }
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

// ─── Pill onglet ──────────────────────────────────────────────────────────────

const Pill = ({ label, count, active, onClick, accent }: {
  label: string; count: number; active: boolean; onClick: () => void; accent: string
}) => (
  <button onClick={onClick} style={{
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
    fontWeight: active ? 700 : 500, fontSize: '0.78rem',
    color: active ? '#fff' : '#6b7280',
    background: active ? accent : '#f1f5f9',
    transition: 'all 0.15s',
    boxShadow: active ? `0 2px 6px ${accent}44` : 'none',
  }}>
    {label}
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 17, height: 17, borderRadius: '50%', fontSize: '0.65rem', fontWeight: 700,
      background: active ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
      color: active ? '#fff' : '#374151',
    }}>
      {count}
    </span>
  </button>
)

// ─── Section label ─────────────────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.07em', color: '#94a3b8', margin: '0 0 8px',
  }}>
    {children}
  </p>
)

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  demandeId?: number
  demande?: DocumentRequest
  status?: string
  files: Record<string, string> | null | string
  complementFiles: Record<string, string> | null | string
  secretaryFiles?: { id: string; path: string; original_name: string; comment?: string; uploaded_at: string }[] | null | string
  onRefresh?: () => Promise<void>
}

function parseKV(raw: any): Record<string, string> {
  if (!raw) return {}
  if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return {} } }
  return raw
}

function parseArray(raw: any): any[] {
  if (!raw) return []
  if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return [] } }
  return Array.isArray(raw) ? raw : []
}

// ─── DossierFilesSplit ────────────────────────────────────────────────────────

const DossierFilesSplit = ({
  demandeId, demande, status,
  files, complementFiles, secretaryFiles, onRefresh,
}: Props) => {
  const { role } = useAuth()
  const toast    = useToast()

  const initial    = parseKV(files)
  const complement = parseKV(complementFiles)
  const secFiles   = parseArray(secretaryFiles)

  const hasComplement     = Object.keys(complement).length > 0
  const hasSecretaryFiles = secFiles.length > 0
  const isEditable = role === 'secretaire' && (status === 'submitted' || status === 'secretary_correction')

  const [tab, setTab]         = useState<'initial' | 'complement'>('initial')
  const [viewerFile, setViewerFile] = useState<AttachmentViewerFile | null>(null)

  // ── État des modals d'ajout / modification ────────────────────────────────
  const [addModal,    setAddModal]    = useState(false)
  const [editModal,   setEditModal]   = useState(false)
  const [editTarget,  setEditTarget]  = useState<any>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [successMsg,  setSuccessMsg]  = useState<string | null>(null)

  // ── Chargement fichier secrétaire via visualiseur ─────────────────────────
  const openStudentFile = (source: AttachmentSource, key: string, path: string, label: string, uploadedAt?: string | null) => {
    setViewerFile({ source, key, path, label, uploadedAt: uploadedAt ?? null })
  }

  const openSecretaryFile = (f: any) => {
    setViewerFile({
      source: 'secretary', key: f.id, path: f.path,
      label: f.original_name, uploadedAt: f.uploaded_at, comment: f.comment,
    })
  }

  // ── Ajout ─────────────────────────────────────────────────────────────────
  const handleAdd = async ({ file, name, comment }: { file: File | null; name: string; comment: string }) => {
    if (!file || !demandeId) return
    setFormLoading(true)
    try {
      const fd = new FormData()
      fd.append('files[0][file]',    file)
      fd.append('files[0][name]',    name || file.name)
      fd.append('files[0][comment]', comment)
      await HttpService.post(`/attestations/document-requests/${demandeId}/secretary-files`, fd)
      setAddModal(false)
      await onRefresh?.()
      setSuccessMsg('Le fichier a été ajouté et est maintenant visible dans le dossier.')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Erreur lors de l\'ajout.')
    } finally {
      setFormLoading(false)
    }
  }

  // ── Modification ──────────────────────────────────────────────────────────
  const handleEdit = async ({ file, name, comment }: { file: File | null; name: string; comment: string }) => {
    if (!editTarget || !demandeId) return
    setFormLoading(true)
    try {
      if (file) {
        // Remplace le fichier ET met à jour nom + commentaire
        const fd = new FormData()
        fd.append('file',    file)
        fd.append('name',    name || file.name)
        fd.append('comment', comment)
        await HttpService.post(
          `/attestations/document-requests/${demandeId}/secretary-files/${editTarget.id}/replace`,
          fd,
        )
      } else {
        // Pas de nouveau fichier : PATCH commentaire uniquement
        await HttpService.patch(
          `/attestations/document-requests/${demandeId}/secretary-files/${editTarget.id}`,
          { comment, name },
        )
      }
      setEditModal(false)
      setEditTarget(null)
      await onRefresh?.()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Erreur lors de la modification.')
    } finally {
      setFormLoading(false)
    }
  }

  // ── Suppression ───────────────────────────────────────────────────────────
  const handleDelete = async (fileId: string) => {
    if (!demandeId) return
    try {
      await HttpService.delete(`/attestations/document-requests/${demandeId}/secretary-files/${fileId}`)
      await onRefresh?.()
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la suppression.')
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* ── Pièces étudiantes ─────────────────────────────────────────────── */}
      <div>
        {hasComplement ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <SectionLabel>Pièces jointes de l'étudiant</SectionLabel>
              <div style={{ display: 'flex', gap: 6 }}>
                <Pill label="Initiales"       count={Object.keys(initial).length}    active={tab === 'initial'}    onClick={() => setTab('initial')}    accent="#2563eb" />
                <Pill label="Complémentaires" count={Object.keys(complement).length} active={tab === 'complement'} onClick={() => setTab('complement')} accent="#7c3aed" />
              </div>
            </div>
            <div style={{
              border: `1.5px solid ${tab === 'complement' ? '#ede9fe' : '#e2e8f0'}`,
              borderRadius: 10, padding: '12px 14px',
              background: tab === 'complement' ? '#faf5ff' : '#f8fafc',
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(tab === 'initial' ? initial : complement).map(([key, path]) => (
                  <FileCard
                    key={key}
                    name={FILE_LABELS[key] ?? key.replace(/_/g, ' ')}
                    path={path}
                    isEditable={false}
                    onClick={() => openStudentFile(tab as AttachmentSource, key, path, FILE_LABELS[key] ?? key, demande?.submitted_at)}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <SectionLabel>Pièces jointes de l'étudiant</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.keys(initial).length === 0
                ? <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Aucune pièce jointe.</p>
                : Object.entries(initial).map(([key, path]) => (
                    <FileCard
                      key={key}
                      name={FILE_LABELS[key] ?? key.replace(/_/g, ' ')}
                      path={path}
                      isEditable={false}
                      onClick={() => openStudentFile('initial', key, path, FILE_LABELS[key] ?? key, demande?.submitted_at)}
                    />
                  ))
              }
            </div>
          </>
        )}
      </div>

      {/* ── Pièces du secrétariat ─────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <SectionLabel>Pièces du secrétariat</SectionLabel>
          {isEditable && (
            <button
              onClick={() => setAddModal(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 12px', borderRadius: 20,
                border: '1.5px dashed #a5b4fc',
                background: 'transparent',
                color: '#4f46e5', fontSize: '0.78rem', fontWeight: 600,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e0e7ff' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <CIcon icon={cilPlus} style={{ width: 12 }} />
              Ajouter un fichier
            </button>
          )}
        </div>

        {!hasSecretaryFiles && (
          <p style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            {isEditable ? 'Aucun fichier ajouté. Utilisez le bouton ci-dessus.' : 'Aucun fichier du secrétariat.'}
          </p>
        )}

        {hasSecretaryFiles && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {secFiles.map((f: any, i: number) => (
              <FileCard
                key={f.id || i}
                name={f.original_name}
                path={f.path}
                date={f.uploaded_at}
                comment={f.comment}
                isEditable={isEditable}
                onClick={() => openSecretaryFile(f)}
                onEdit={() => { setEditTarget(f); setEditModal(true) }}
                onDelete={() => handleDelete(f.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ajout / modification ───────────────────────────────────── */}
      <FileFormModal
        visible={addModal}
        mode="add"
        loading={formLoading}
        onClose={() => setAddModal(false)}
        onSubmit={handleAdd}
      />

      <FileFormModal
        visible={editModal}
        mode="edit"
        initial={editTarget ? { name: editTarget.original_name ?? '', comment: editTarget.comment ?? '' } : undefined}
        loading={formLoading}
        onClose={() => { setEditModal(false); setEditTarget(null) }}
        onSubmit={handleEdit}
      />

      {/* ── Modal de succès ajout ─────────────────────────────────────── */}
      <CModal
        visible={!!successMsg}
        onClose={() => setSuccessMsg(null)}
        alignment="center"
        backdrop="static"
        keyboard={false}
        size="sm"
      >
        <CModalBody style={{ textAlign: 'center', padding: '32px 24px 16px' }}>
          <div style={{ marginBottom: 16 }}>
            <CIcon icon={cilCheckCircle} style={{ width: 48, height: 48, color: '#059669' }} />
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginBottom: 8 }}>
            Fichier ajouté avec succès
          </div>
          <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
            {successMsg}
          </div>
        </CModalBody>
        <CModalFooter style={{ justifyContent: 'center', borderTop: 'none', paddingBottom: 24 }}>
          <CButton
            color="success"
            style={{ fontWeight: 700, minWidth: 100 }}
            onClick={() => setSuccessMsg(null)}
          >
            OK
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ── Visualiseur plein écran ────────────────────────────────────────── */}
      <AttachmentViewerModal
        demandeId={demandeId ?? 0}
        demande={demande}
        file={viewerFile}
        onClose={() => setViewerFile(null)}
      />
    </div>
  )
}

export default DossierFilesSplit
