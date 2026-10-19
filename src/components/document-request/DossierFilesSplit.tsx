// src/components/document-request/DossierFilesSplit.tsx
// Affiche toutes les pièces jointes d'un dossier.
// Pour la secrétaire : zone « Pièces du secrétariat » bien visible, ajout par
// bouton, clic ou glisser-déposer ; modification du nom, du commentaire et du
// fichier ; suppression avec confirmation. Chaque action se termine par le
// modal central de résultat. Un clic sur une pièce ouvre le visualiseur plein
// écran, d'où l'on passe d'un document à l'autre et où l'on commente.

import { useState, useRef } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilFile, cilDescription, cilSpreadsheet, cilImage,
  cilPlus, cilPencil, cilTrash, cilCloudUpload,
} from '@coreui/icons'
import HttpService from '@/services/http.service'
import { useAuth } from '@/contexts'
import { showSuccess, showError, friendlyError } from '@/components/common/ActionResult'
import useFileComments from './useFileComments'
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

// ─── Fenêtre ajout / modification d'un document du secrétariat ───────────────
//
// Une seule fenêtre, simple : on choisit (ou glisse) le fichier, on peut en
// changer avant d'enregistrer, on lui donne un nom et un commentaire
// facultatif. En modification, le fichier actuel est conservé tant qu'on
// n'en choisit pas un autre.

const ACCEPT_EXT = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx']
const MAX_BYTES  = 10 * 1024 * 1024

const baseName = (n: string) => n.replace(/\.[^.]+$/, '')

const checkFile = (f: File): string | null => {
  const ext = (f.name.split('.').pop() ?? '').toLowerCase()
  if (!ACCEPT_EXT.includes(ext)) return 'Ce type de fichier n\'est pas accepté. Utilisez un PDF, une image (JPG, PNG), un fichier Word ou Excel.'
  if (f.size > MAX_BYTES) return 'Ce fichier dépasse 10 Mo. Choisissez un fichier plus léger.'
  return null
}

const formatSize = (b: number) => b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} Ko` : `${(b / 1024 / 1024).toFixed(1)} Mo`

interface FileFormModalProps {
  visible: boolean
  mode: 'add' | 'edit'
  initial?: { name: string; comment: string; currentFile?: string }
  presetFile?: File | null
  loading: boolean
  onClose: () => void
  onSubmit: (data: { file: File | null; name: string; comment: string }) => void
}

const fieldLabel: React.CSSProperties = { display: 'block', fontSize: '0.86rem', fontWeight: 700, color: '#1e293b', marginBottom: 6 }
const optional: React.CSSProperties = { fontWeight: 400, color: '#94a3b8', marginLeft: 6 }
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', fontSize: '0.92rem',
  border: '1.5px solid #e2e8f0', borderRadius: 10, outline: 'none', color: '#1e293b',
}

const FileFormModal = ({
  visible, mode, initial, presetFile, loading, onClose, onSubmit,
}: FileFormModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file,     setFile]     = useState<File | null>(null)
  const [name,     setName]     = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [comment,  setComment]  = useState('')
  const [fileErr,  setFileErr]  = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const isAdd = mode === 'add'

  // Réinitialise l'état à chaque ouverture
  const handleOpen = () => {
    setName(initial?.name ?? '')
    setNameTouched(!isAdd)
    setComment(initial?.comment ?? '')
    setFileErr(null)
    setDragOver(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (presetFile) pick(presetFile, true)
    else setFile(null)
  }

  const pick = (f: File | null, fresh = false) => {
    if (!f) return
    const err = checkFile(f)
    if (err) { setFileErr(err); return }
    setFile(f)
    setFileErr(null)
    // Le nom suit le fichier tant que l'utilisatrice ne l'a pas saisi elle-même
    if (fresh || !nameTouched) setName(baseName(f.name))
  }

  const handleSubmit = () => {
    if (isAdd && !file) {
      setFileErr('Choisissez d\'abord le document à ajouter.')
      return
    }
    onSubmit({ file, name: name.trim() || (file ? baseName(file.name) : ''), comment: comment.trim() })
  }

  const meta = file ? fileMetaFromName(file.name) : null

  return (
    <CModal
      visible={visible}
      onClose={onClose}
      alignment="center"
      backdrop="static"
      onShow={handleOpen}
    >
      <CModalHeader style={{ borderBottom: '1px solid #e2e8f0', padding: '16px 22px' }}>
        <CModalTitle style={{ fontSize: '1.02rem', fontWeight: 800, color: '#0f172a' }}>
          {isAdd ? 'Ajouter un document au dossier' : 'Modifier le document'}
        </CModalTitle>
      </CModalHeader>

      <CModalBody style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Fichier */}
          <div>
            <span style={fieldLabel}>
              {isAdd ? 'Document' : 'Fichier'}
              {!isAdd && <span style={optional}>(gardez l'actuel ou choisissez-en un autre)</span>}
            </span>

            {file ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', border: '1.5px solid #bbf7d0', borderRadius: 12, background: '#f0fdf4',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 9, background: '#fff', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CIcon icon={meta!.icon} style={{ width: 18, color: meta!.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#14532d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#15803d' }}>
                    {isAdd ? 'Prêt à être ajouté' : 'Remplacera le fichier actuel'} · {formatSize(file.size)}
                  </div>
                </div>
                <CButton size="sm" color="secondary" variant="outline" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}
                  onClick={() => fileInputRef.current?.click()} disabled={loading}>
                  Changer
                </CButton>
                {!isAdd && (
                  <CButton size="sm" color="secondary" variant="ghost" style={{ fontWeight: 600 }}
                    onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }} disabled={loading}>
                    Annuler
                  </CButton>
                )}
              </div>
            ) : (
              <>
                {!isAdd && initial?.currentFile && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                    padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 10, background: '#f8fafc',
                  }}>
                    <CIcon icon={fileMetaFromName(initial.currentFile).icon} style={{ width: 16, color: fileMetaFromName(initial.currentFile).color }} />
                    <span style={{ flex: 1, fontSize: '0.86rem', color: '#334155' }}>Fichier actuel conservé</span>
                  </div>
                )}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click() } }}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); pick(e.dataTransfer.files?.[0] ?? null) }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    padding: isAdd ? '26px 16px' : '16px', textAlign: 'center',
                    border: `2px dashed ${fileErr ? '#fca5a5' : dragOver ? '#2563eb' : '#cbd5e1'}`,
                    borderRadius: 12, cursor: 'pointer',
                    background: dragOver ? '#eff6ff' : '#f8fafc',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <CIcon icon={cilCloudUpload} style={{ width: 26, color: '#2563eb' }} />
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1e293b' }}>
                    {isAdd ? 'Cliquez pour choisir le document' : 'Choisir un autre fichier'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    ou glissez-le ici · PDF, image, Word ou Excel · 10 Mo maximum
                  </span>
                </div>
              </>
            )}

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              onChange={e => pick(e.target.files?.[0] ?? null)}
            />
            {fileErr && (
              <p role="alert" style={{ fontSize: '0.82rem', color: '#b91c1c', marginTop: 6, marginBottom: 0 }}>{fileErr}</p>
            )}
          </div>

          {/* Nom */}
          <div>
            <label htmlFor="sec-file-name" style={fieldLabel}>
              Nom du document
            </label>
            <input
              id="sec-file-name"
              type="text"
              value={name}
              maxLength={200}
              onChange={e => { setName(e.target.value); setNameTouched(true) }}
              placeholder="Ex : Relevé de notes vérifié"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#2563eb' }}
              onBlur={e  => { e.target.style.borderColor = '#e2e8f0' }}
            />
          </div>

          {/* Commentaire */}
          <div>
            <label htmlFor="sec-file-comment" style={fieldLabel}>
              Commentaire
              <span style={optional}>(facultatif)</span>
            </label>
            <textarea
              id="sec-file-comment"
              value={comment}
              maxLength={1000}
              onChange={e => setComment(e.target.value)}
              placeholder="Ex : copie certifiée conforme reçue au guichet."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              onFocus={e => { e.target.style.borderColor = '#2563eb' }}
              onBlur={e  => { e.target.style.borderColor = '#e2e8f0' }}
            />
          </div>
        </div>
      </CModalBody>

      <CModalFooter style={{ borderTop: '1px solid #e2e8f0', padding: '14px 22px', gap: 8, justifyContent: 'flex-end' }}>
        <CButton color="secondary" variant="ghost" onClick={onClose} disabled={loading} style={{ fontWeight: 600 }}>
          Annuler
        </CButton>
        <CButton
          color="primary"
          onClick={handleSubmit}
          disabled={loading || (isAdd && !file)}
          style={{ fontWeight: 700, minWidth: 130 }}
        >
          {loading
            ? <CSpinner size="sm" />
            : isAdd ? 'Ajouter au dossier' : 'Enregistrer'
          }
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

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

// ─── Ligne d'un document du secrétariat (actions écrites en toutes lettres) ──

const SecretaryFileRow = ({
  f, isEditable, comments, onOpen, onEdit, onDelete,
}: {
  f: any
  isEditable: boolean
  comments: number
  onOpen: () => void
  onEdit: () => void
  onDelete: () => Promise<void>
}) => {
  const [confirm, setConfirm] = useState(false)
  const [busy,    setBusy]    = useState(false)
  const meta = fileMetaFromName(f.path || f.original_name || '')
  const date = f.uploaded_at ? new Date(f.uploaded_at) : null

  const actionBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    border: '1px solid #e2e8f0', background: '#fff', color: '#334155',
    borderRadius: 8, padding: '6px 11px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
  }

  return (
    <div style={{
      border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff',
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button type="button" onClick={onOpen} title="Ouvrir le document" style={{
          width: 40, height: 40, borderRadius: 10, background: meta.bg, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <CIcon icon={meta.icon} style={{ width: 19, color: meta.color }} />
        </button>

        <button type="button" onClick={onOpen} style={{
          flex: '1 1 140px', minWidth: 0, textAlign: 'left', border: 'none', background: 'none', padding: 0, cursor: 'pointer',
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {f.original_name}
          </div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 2 }}>
            {meta.label}
            {date && !Number.isNaN(date.getTime()) && (
              <> · ajouté le {date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })} à {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</>
            )}
            {comments > 0 && <> · {comments} commentaire{comments > 1 ? 's' : ''}</>}
          </div>
        </button>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 'auto' }}>
          <button type="button" style={actionBtn} onClick={onOpen}>Ouvrir</button>
          {isEditable && !confirm && (
            <>
              <button type="button" style={actionBtn} onClick={onEdit}>
                <CIcon icon={cilPencil} style={{ width: 13 }} />
                Modifier
              </button>
              <button type="button" style={{ ...actionBtn, color: '#b91c1c' }} onClick={() => setConfirm(true)}>
                <CIcon icon={cilTrash} style={{ width: 13 }} />
                Supprimer
              </button>
            </>
          )}
        </div>
      </div>

      {f.comment && (
        <div style={{
          marginTop: 10, padding: '8px 12px', borderRadius: 8, background: '#f8fafc',
          fontSize: '0.85rem', color: '#475569', lineHeight: 1.5, whiteSpace: 'pre-wrap',
        }}>
          {f.comment}
        </div>
      )}

      {confirm && (
        <div style={{
          marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          padding: '10px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca',
        }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#991b1b', marginRight: 'auto' }}>
            Supprimer ce document du dossier ?
          </span>
          <CButton size="sm" color="secondary" variant="outline" disabled={busy} onClick={() => setConfirm(false)}>
            Non, garder
          </CButton>
          <CButton size="sm" color="danger" disabled={busy} style={{ color: '#fff', fontWeight: 700 }}
            onClick={async () => { setBusy(true); try { await onDelete() } finally { setBusy(false); setConfirm(false) } }}>
            {busy ? <CSpinner size="sm" /> : 'Oui, supprimer'}
          </CButton>
        </div>
      )}
    </div>
  )
}

// ─── DossierFilesSplit ────────────────────────────────────────────────────────

const studentLabel = (key: string) => FILE_LABELS[key] ?? key.replace(/_/g, ' ')

/**
 * Tous les documents d'un dossier, dans l'ordre : pièces de l'étudiant,
 * compléments, pièces du secrétariat. Sert au visualiseur (bouton « Voir les
 * documents » du pied de la fiche, et « Ouvrir » des pièces du secrétariat).
 */
export function buildDossierFiles(demande: {
  files?: any; complement_files?: any; secretary_files?: any; submitted_at?: string | null
}): AttachmentViewerFile[] {
  const initial    = parseKV(demande.files)
  const complement = parseKV(demande.complement_files)
  const secFiles   = parseArray(demande.secretary_files)
  return [
    ...Object.entries(initial).map(([key, path]) => ({
      source: 'initial' as AttachmentSource, key, path, label: studentLabel(key), uploadedAt: demande.submitted_at ?? null,
    })),
    ...Object.entries(complement).map(([key, path]) => ({
      source: 'complement' as AttachmentSource, key, path, label: `${studentLabel(key)} (complément)`, uploadedAt: null,
    })),
    ...secFiles.map((f: any) => ({
      source: 'secretary' as AttachmentSource, key: f.id, path: f.path,
      label: f.original_name, uploadedAt: f.uploaded_at, comment: f.comment,
    })),
  ]
}

const DossierFilesSplit = ({
  demandeId, demande, status,
  files, complementFiles, secretaryFiles, onRefresh,
}: Props) => {
  const { role } = useAuth()

  const secFiles   = parseArray(secretaryFiles)

  const hasSecretaryFiles = secFiles.length > 0
  const isEditable = role === 'secretaire' && (status === 'submitted' || status === 'secretary_correction')

  const [viewerFile, setViewerFile] = useState<AttachmentViewerFile | null>(null)
  const comments = useFileComments(demandeId)

  // ── Fenêtres ajout / modification ─────────────────────────────────────────
  const [addModal,    setAddModal]    = useState(false)
  const [presetFile,  setPresetFile]  = useState<File | null>(null)
  const [editModal,   setEditModal]   = useState(false)
  const [editTarget,  setEditTarget]  = useState<any>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [dropOver,    setDropOver]    = useState(false)

  // ── Tous les documents du dossier (pour le visualiseur) ───────────────────
  const allFiles = buildDossierFiles({
    files, complement_files: complementFiles, secretary_files: secretaryFiles, submitted_at: demande?.submitted_at,
  })
  const open = (source: AttachmentSource, key: string) =>
    setViewerFile(allFiles.find(f => f.source === source && f.key === key) ?? null)

  const openAdd = (f: File | null = null) => { setPresetFile(f); setAddModal(true) }

  // ── Ajout ─────────────────────────────────────────────────────────────────
  const handleAdd = async ({ file, name, comment }: { file: File | null; name: string; comment: string }) => {
    if (!file || !demandeId) return
    setFormLoading(true)
    try {
      const fd = new FormData()
      fd.append('files[0][file]',    file)
      fd.append('files[0][name]',    name || baseName(file.name))
      fd.append('files[0][comment]', comment)
      await HttpService.post(`/attestations/document-requests/${demandeId}/secretary-files`, fd)
      setAddModal(false)
      await onRefresh?.()
      await showSuccess('Document ajouté', `« ${name || baseName(file.name)} » fait maintenant partie du dossier. Tous les acteurs peuvent le consulter.`)
    } catch (err: any) {
      await showError("Le document n'a pas été ajouté", friendlyError(err))
    } finally {
      setFormLoading(false)
    }
  }

  // ── Modification (nom, commentaire et/ou fichier) ─────────────────────────
  const handleEdit = async ({ file, name, comment }: { file: File | null; name: string; comment: string }) => {
    if (!editTarget || !demandeId) return
    setFormLoading(true)
    try {
      if (file) {
        const fd = new FormData()
        fd.append('file',    file)
        fd.append('name',    name || baseName(file.name))
        fd.append('comment', comment)
        await HttpService.post(
          `/attestations/document-requests/${demandeId}/secretary-files/${editTarget.id}/replace`,
          fd,
        )
      } else {
        await HttpService.patch(
          `/attestations/document-requests/${demandeId}/secretary-files/${editTarget.id}`,
          { comment, name },
        )
      }
      setEditModal(false)
      setEditTarget(null)
      await onRefresh?.()
      await showSuccess('Document modifié', file ? 'Le fichier a été remplacé et les informations mises à jour.' : 'Le nom et le commentaire ont été mis à jour.')
    } catch (err: any) {
      await showError("La modification n'a pas été enregistrée", friendlyError(err))
    } finally {
      setFormLoading(false)
    }
  }

  // ── Suppression ───────────────────────────────────────────────────────────
  const handleDelete = async (f: any) => {
    if (!demandeId) return
    try {
      await HttpService.delete(`/attestations/document-requests/${demandeId}/secretary-files/${f.id}`)
      await onRefresh?.()
      await showSuccess('Document supprimé', `« ${f.original_name} » a été retiré du dossier.`)
    } catch (err: any) {
      await showError("Le document n'a pas été supprimé", friendlyError(err))
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Les pièces de l'étudiant ne sont plus listées ici : elles s'ouvrent
          avec « Voir les documents », en bas à gauche de la fiche. */}

      {/* ── Pièces du secrétariat ─────────────────────────────────────────── */}
      <section
        aria-label="Pièces du secrétariat"
        onDragOver={isEditable ? e => { e.preventDefault(); setDropOver(true) } : undefined}
        onDragLeave={isEditable ? () => setDropOver(false) : undefined}
        onDrop={isEditable ? e => { e.preventDefault(); setDropOver(false); openAdd(e.dataTransfer.files?.[0] ?? null) } : undefined}
        style={{
          border: `1.5px solid ${dropOver ? '#2563eb' : '#e2e8f0'}`,
          borderRadius: 14, background: dropOver ? '#eff6ff' : '#fbfdff',
          padding: '16px 18px',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>
              Pièces du secrétariat
              {hasSecretaryFiles && (
                <span style={{ marginLeft: 8, fontSize: '0.78rem', fontWeight: 700, color: '#475569', background: '#f1f5f9', borderRadius: 999, padding: '1px 8px' }}>
                  {secFiles.length}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 2 }}>
              {isEditable
                ? 'Documents que vous joignez au dossier. Tous les acteurs du circuit les verront.'
                : 'Documents joints au dossier par le secrétariat.'}
            </div>
          </div>
          {isEditable && (
            <CButton color="primary" onClick={() => openAdd()} style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 10, padding: '8px 16px' }}>
              <CIcon icon={cilPlus} style={{ width: 15 }} />
              Ajouter un document
            </CButton>
          )}
        </div>

        {!hasSecretaryFiles && (
          isEditable ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => openAdd()}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAdd() } }}
              style={{
                border: '2px dashed #cbd5e1', borderRadius: 12, padding: '22px 16px',
                textAlign: 'center', cursor: 'pointer', background: '#fff',
              }}
            >
              <CIcon icon={cilCloudUpload} style={{ width: 26, color: '#2563eb' }} />
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e293b', marginTop: 6 }}>
                Aucun document pour le moment
              </div>
              <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 2 }}>
                Cliquez ici ou glissez un fichier pour l'ajouter.
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>Aucun document du secrétariat.</p>
          )
        )}

        {hasSecretaryFiles && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {secFiles.map((f: any, i: number) => (
              <SecretaryFileRow
                key={f.id || i}
                f={f}
                isEditable={isEditable}
                comments={comments.countFor('secretary', f.id)}
                onOpen={() => open('secretary', f.id)}
                onEdit={() => { setEditTarget(f); setEditModal(true) }}
                onDelete={() => handleDelete(f)}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Fenêtres ajout / modification ─────────────────────────────────── */}
      <FileFormModal
        visible={addModal}
        mode="add"
        presetFile={presetFile}
        loading={formLoading}
        onClose={() => { setAddModal(false); setPresetFile(null) }}
        onSubmit={handleAdd}
      />

      <FileFormModal
        visible={editModal}
        mode="edit"
        initial={editTarget ? { name: editTarget.original_name ?? '', comment: editTarget.comment ?? '', currentFile: editTarget.path } : undefined}
        loading={formLoading}
        onClose={() => { setEditModal(false); setEditTarget(null) }}
        onSubmit={handleEdit}
      />

      {/* ── Visualiseur plein écran ────────────────────────────────────────── */}
      <AttachmentViewerModal
        demandeId={demandeId ?? 0}
        demande={demande}
        file={viewerFile}
        files={allFiles}
        onClose={() => setViewerFile(null)}
        onCommentsChanged={() => { void comments.reload() }}
      />
    </div>
  )
}

export default DossierFilesSplit
