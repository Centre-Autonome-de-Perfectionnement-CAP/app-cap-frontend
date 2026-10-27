// src/views/pages/demandes/components/modal/ContactDemandeurModal.tsx
//
// Modal secrétaire (uniquement) : envoie un message libre + pièces jointes
// au demandeur, par WhatsApp ET email en une seule action.
//
// Comportement :
//   - Envoi ASYNCHRONE côté serveur (13/10/2026) : WhatsApp et email sont mis
//     en file d'envoi indépendamment, avec retry automatique - la réponse est
//     immédiate (plus d'erreur de délai alors que le message part bien)
//   - À la fin : modal de résultat avec succès/échec PAR CANAL, motif exact
//     affiché en cas d'échec (pas de message générique)
//   - En cas d'échec : bouton "Réessayer"
//   - Le modal de résultat NE SE FERME PAS tout seul - il faut cliquer sur OK
//   - Modal centré, bien visible (alignment="center", backdrop="static")

import { useState, useEffect, useRef } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CFormTextarea, CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCommentBubble, cilSend, cilTrash, cilCheckCircle,
  cilBan, cilWarning, cilReload,
} from '@coreui/icons'
import documentRequestService from '@/services/document-request.service'
import type { DocumentRequest } from '@/types/document-request.types'
import { UPLOAD_LIMIT_MB, isTooHeavy } from '@/constants/validation.constants'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChannelResult {
  attempted: boolean
  success: boolean
  queued?: boolean
  reason: string | null
}

interface SendResult {
  whatsapp: ChannelResult
  email: ChannelResult
}

type Phase = 'form' | 'sending' | 'result' | 'error'

interface Props {
  demande: DocumentRequest
  visible: boolean
  onClose: () => void
}

const MAX_FILES     = 5
// Formats acceptés - alignés sur la validation backend (contactDemandeur)
const ACCEPTED_EXT  = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx']

// ─── Ligne de résultat par canal ─────────────────────────────────────────────

const ChannelRow = ({ label, result }: { label: string; result: ChannelResult }) => {
  if (!result.attempted) {
    return (
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: '12px 14px', borderRadius: 10,
        background: '#f8fafc', border: '1.5px solid #e2e8f0',
      }}>
        <CIcon icon={cilBan} style={{ width: 16, color: '#64748b', flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#64748b' }}>{label}</div>
          <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: 2 }}>
            Non tenté - aucune coordonnée enregistrée pour ce dossier.
          </div>
        </div>
      </div>
    )
  }

  const ok = result.success

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '12px 14px', borderRadius: 10,
      background: ok ? '#f0fdf4' : '#fef2f2',
      border: `1.5px solid ${ok ? '#86efac' : '#fca5a5'}`,
    }}>
      <CIcon
        icon={ok ? cilCheckCircle : cilWarning}
        style={{ width: 16, color: ok ? '#16a34a' : '#dc2626', flexShrink: 0, marginTop: 2 }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: ok ? '#166534' : '#991b1b' }}>
          {label} - {ok ? (result.queued ? 'Pris en charge - envoi en cours' : 'Envoyé avec succès') : 'Échec de l\u2019envoi'}
        </div>
        {result.reason && (
          <div style={{ fontSize: '0.875rem', color: ok ? '#92400e' : '#b91c1c', marginTop: 4, lineHeight: 1.5 }}>
            {result.reason}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal principal ─────────────────────────────────────────────────────────

const ContactDemandeurModal = ({ demande, visible, onClose }: Props) => {
  const [phase, setPhase]           = useState<Phase>('form')
  const [message, setMessage]       = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [fileError, setFileError]   = useState<string | null>(null)
  const [result, setResult]         = useState<SendResult | null>(null)
  const [errorMsg, setErrorMsg]     = useState<string | null>(null)
  const fileInputRef                = useRef<HTMLInputElement>(null)

  // Réinitialisation à chaque ouverture
  useEffect(() => {
    if (visible) {
      setPhase('form')
      setMessage('')
      setAttachments([])
      setFileError(null)
      setResult(null)
      setErrorMsg(null)
    }
  }, [visible])

  const nomDemandeur = [demande.last_name, demande.first_names].filter(Boolean).join(' ') || 'ce demandeur'
  const hasContact   = !!(demande.demandeur_whatsapp || demande.email)
  const canSend      = message.trim().length >= 5 && phase === 'form'

  // ── Gestion des pièces jointes ──────────────────────────────────────────────

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return
    setFileError(null)

    const incoming = Array.from(files)
    const extOk    = (f: File) => ACCEPTED_EXT.includes((f.name.split('.').pop() || '').toLowerCase())
    const badType  = incoming.find(f => !extOk(f))
    const tooLarge = incoming.find(f => isTooHeavy(f))
    if (badType) {
      setFileError(`"${badType.name}" : format non accepté (PDF, images, Word, Excel) - fichier ignoré.`)
    } else if (tooLarge) {
      setFileError(`"${tooLarge.name}" dépasse ${UPLOAD_LIMIT_MB.DEFAULT} Mo - fichier ignoré.`)
    }

    const valid = incoming.filter(f => !isTooHeavy(f) && extOk(f))
    const merged = [...attachments, ...valid].slice(0, MAX_FILES)

    if (attachments.length + valid.length > MAX_FILES) {
      setFileError(`Maximum ${MAX_FILES} pièces jointes - le reste a été ignoré.`)
    }

    setAttachments(merged)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = (idx: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx))
  }

  // ── Envoi ────────────────────────────────────────────────────────────────────

  const doSend = async () => {
    setPhase('sending')
    setErrorMsg(null)

    try {
      const response = await documentRequestService.contactDemandeur(demande.id, message.trim(), attachments)
      const data = (response as any)?.data?.data ?? (response as any)?.data
      setResult(data as SendResult)
      setPhase('result')
    } catch (e: any) {
      const backendMessage =
        e?.response?.data?.message ||
        e?.message ||
        "Une erreur inattendue est survenue lors de l'envoi. Veuillez réessayer."
      setErrorMsg(backendMessage)
      setPhase('error')
    }
  }

  const handleOk = () => {
    onClose()
  }

  // ── Rendu ──────────────────────────────────────────────────────────────────

  const overallFailed =
    phase === 'error' ||
    (phase === 'result' && result && (
      (result.whatsapp.attempted && !result.whatsapp.success) ||
      (result.email.attempted && !result.email.success)
    ))

  return (
    <CModal
      visible={visible}
      onClose={phase === 'form' ? onClose : () => {}}
      alignment="center"
      size="lg"
      backdrop="static"
      keyboard={phase === 'form'}
    >
      {/* ── Header ── */}
      <CModalHeader
        closeButton={phase === 'form'}
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
          borderBottom: '2px solid #bfdbfe',
          padding: '22px 28px',
        }}
      >
        <CModalTitle style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#fff', flexShrink: 0,
            boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
          }}>
            <CIcon icon={cilCommentBubble} style={{ width: 20 }} />
          </span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#111827', lineHeight: 1.2 }}>
              Contacter le demandeur
            </div>
            <div style={{ fontWeight: 500, fontSize: '0.875rem', color: '#1e40af', marginTop: 3 }}>
              {demande.reference} - {nomDemandeur}
            </div>
          </div>
        </CModalTitle>
      </CModalHeader>

      {/* ── Body ── */}
      <CModalBody style={{ padding: '26px 30px', minHeight: 200 }}>

        {/* ── Formulaire ── */}
        {phase === 'form' && (
          <>
            {!hasContact && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: '#fffbeb', border: '1.5px solid #fcd34d', borderLeft: '4px solid #f59e0b',
                borderRadius: 10, padding: '14px 16px', marginBottom: 20,
              }}>
                <CIcon icon={cilWarning} style={{ width: 16, color: '#d97706', flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.875rem', color: '#92400e' }}>
                  Ce dossier n'a ni numéro WhatsApp ni email enregistré. L'envoi échouera.
                </div>
              </div>
            )}

            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#334155', marginBottom: 8 }}>
              Message <span className="text-danger">*</span>
            </label>
            <CFormTextarea
              rows={5}
              placeholder={`Écrivez votre message à ${nomDemandeur}...`}
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={3000}
              style={{ borderColor: '#cbd5e1', fontSize: '0.9rem' }}
            />
            <div style={{ textAlign: 'right', fontSize: '0.875rem', color: '#64748b', marginTop: 4 }}>
              {message.length}/3000
            </div>

            <label style={{ display: 'block', fontWeight: 700, fontSize: '0.875rem', color: '#334155', margin: '18px 0 8px' }}>
              Pièces jointes <span style={{ fontWeight: 500, color: '#64748b' }}>(optionnel, max {MAX_FILES}, {UPLOAD_LIMIT_MB.DEFAULT} Mo chacune)</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_EXT.map(e => `.${e}`).join(',')}
              onChange={e => handleFilesSelected(e.target.files)}
              style={{ fontSize: '0.875rem' }}
              disabled={attachments.length >= MAX_FILES}
            />

            {fileError && (
              <div style={{ fontSize: '0.875rem', color: '#dc2626', marginTop: 6 }}>{fileError}</div>
            )}

            {attachments.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {attachments.map((file, idx) => (
                  <div key={idx} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
                    padding: '8px 12px',
                  }}>
                    <span style={{ fontSize: '0.875rem', color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name} <span style={{ color: '#64748b' }}>({(file.size / 1024).toFixed(0)} Ko)</span>
                    </span>
                    <button
                      onClick={() => removeAttachment(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
                    >
                      <CIcon icon={cilTrash} style={{ width: 14, color: '#dc2626' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Chargement ── */}
        {phase === 'sending' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '40px 0', gap: 16,
          }}>
            <CSpinner color="primary" style={{ width: 42, height: 42 }} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#334155' }}>
              Envoi en cours...
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>
              Préparation de l'envoi WhatsApp et email - merci de patienter.
            </div>
          </div>
        )}

        {/* ── Résultat (succès/échec par canal) ── */}
        {phase === 'result' && result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4,
            }}>
              <CIcon
                icon={overallFailed ? cilWarning : cilCheckCircle}
                style={{ width: 22, color: overallFailed ? '#d97706' : '#16a34a' }}
              />
              <span style={{ fontWeight: 800, fontSize: '1rem', color: overallFailed ? '#92400e' : '#166534' }}>
                {overallFailed ? 'Envoi partiellement échoué' : 'Message pris en charge'}
              </span>
            </div>

            <ChannelRow label="WhatsApp" result={result.whatsapp} />
            <ChannelRow label="Email"    result={result.email} />
          </div>
        )}

        {/* ── Erreur bloquante (requête elle-même a échoué) ── */}
        {phase === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CIcon icon={cilBan} style={{ width: 22, color: '#dc2626' }} />
              <span style={{ fontWeight: 800, fontSize: '1rem', color: '#991b1b' }}>
                Échec de l'envoi
              </span>
            </div>
            <div style={{
              background: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: 10,
              padding: '14px 16px', fontSize: '0.875rem', color: '#991b1b', lineHeight: 1.5,
            }}>
              {errorMsg}
            </div>
          </div>
        )}
      </CModalBody>

      {/* ── Footer ── */}
      <CModalFooter style={{ background: '#f8fafc', borderTop: '1px solid #e2e8f0', padding: '14px 28px' }}>
        {phase === 'form' && (
          <>
            <CButton color="secondary" variant="outline" onClick={onClose}>
              Annuler
            </CButton>
            <CButton color="primary" disabled={!canSend} onClick={doSend}>
              <CIcon icon={cilSend} style={{ width: 14, marginRight: 6 }} />
              Envoyer
            </CButton>
          </>
        )}

        {phase === 'sending' && (
          <CButton color="primary" disabled>
            <CSpinner size="sm" style={{ marginRight: 8 }} />
            Envoi en cours...
          </CButton>
        )}

        {(phase === 'result' && overallFailed) && (
          <>
            <CButton color="secondary" variant="outline" onClick={() => setPhase('form')}>
              <CIcon icon={cilReload} style={{ width: 14, marginRight: 6 }} />
              Réessayer
            </CButton>
            <CButton color="primary" onClick={handleOk}>OK</CButton>
          </>
        )}

        {(phase === 'result' && !overallFailed) && (
          <CButton color="success" onClick={handleOk}>
            <CIcon icon={cilCheckCircle} style={{ width: 14, marginRight: 6 }} />
            OK
          </CButton>
        )}

        {phase === 'error' && (
          <>
            <CButton color="secondary" variant="outline" onClick={() => setPhase('form')}>
              <CIcon icon={cilReload} style={{ width: 14, marginRight: 6 }} />
              Réessayer
            </CButton>
            <CButton color="primary" onClick={handleOk}>OK</CButton>
          </>
        )}
      </CModalFooter>
    </CModal>
  )
}

export default ContactDemandeurModal
