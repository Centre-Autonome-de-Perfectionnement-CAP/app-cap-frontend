// src/views/pages/demandes/components/modal/SousReservePanel.tsx
// - Largeur complète (plus de maxWidth: 680)
// - Meilleure répartition sur toute la largeur disponible
// - Hiérarchie visuelle améliorée

import { useState, useEffect } from 'react'
import { CRow, CCol, CSpinner, CFormTextarea } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilWarning, cilCheckCircle, cilHistory, cilCommentBubble } from '@coreui/icons'
import documentRequestService from '@/services/document-request.service'
import type { HistoryEntry } from './HistoriquePanel'
import type { DocumentRequest } from '@/types/document-request.types'

interface Props {
  demande: DocumentRequest
  canClearFlag?: boolean
  onFlagCleared?: () => void
}

const SousReservePanel = ({ demande, canClearFlag = false, onFlagCleared }: Props) => {
  const [flagEntry, setFlagEntry] = useState<HistoryEntry | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [clearing,  setClearing]  = useState(false)
  const [comment,   setComment]   = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    documentRequestService.getHistory(demande.id)
      .then(res => {
        if (cancelled) return
        const entries: HistoryEntry[] = res.data ?? []
        const lastFlagged = [...entries]
          .reverse()
          .find(e => e.action_type === 'validation_flagged')
        setFlagEntry(lastFlagged ?? null)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [demande.id])

  const handleClearFlag = async () => {
    setClearing(true)
    try {
      await documentRequestService.transition(demande.id, {
        action: 'clear_flag',
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      } as any)
      onFlagCleared?.()
    } catch (e) {
      console.error(e)
    } finally {
      setClearing(false)
    }
  }

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '48px 0' }}>
      <CSpinner color="primary" style={{ width: 26, height: 26 }} />
      <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: 10 }}>
        Chargement de la réserve…
      </div>
    </div>
  )

  return (
    <div>
      {/* ── En-tête réserve ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#fffbeb', border: '1px solid #fcd34d',
        borderLeft: '4px solid #d97706',
        borderRadius: 10, padding: '14px 18px', marginBottom: 24,
      }}>
        <CIcon icon={cilWarning} style={{ width: 22, color: '#d97706', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#78350f' }}>
            Réserve active sur ce dossier
          </div>
          <div style={{ fontSize: '0.875rem', color: '#92400e', marginTop: 3, lineHeight: 1.5 }}>
            Une validation sous réserve a été émise. Le dossier doit être corrigé avant de poursuivre.
          </div>
        </div>
      </div>

      <CRow className="g-4">
        {/* Colonne gauche : détail de la réserve */}
        <CCol md={canClearFlag ? 5 : 12}>
          <div style={{
            fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.07em', color: '#64748b', marginBottom: 10,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <CIcon icon={cilHistory} style={{ width: 13 }} />
            Réserve émise par
            <span style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
          </div>

          {flagEntry ? (
            <div style={{
              background: '#fafafa', border: '1px solid #e2e8f0',
              borderRadius: 10, padding: '16px 18px', height: 'calc(100% - 30px)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: '0.925rem', color: '#111827' }}>
                  {flagEntry.actor_name}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                  {new Date(flagEntry.created_at).toLocaleDateString('fr-FR', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  } as any)}
                  {' à '}
                  {new Date(flagEntry.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              {flagEntry.comment ? (
                <div style={{
                  fontSize: '0.875rem', color: '#374151', lineHeight: 1.65,
                  background: '#fffbeb', border: '1px solid #fcd34d',
                  borderRadius: 7, padding: '10px 14px',
                  fontStyle: 'italic',
                }}>
                  <CIcon icon={cilCommentBubble} style={{ width: 14, color: '#d97706', marginRight: 6 }} />
                  {flagEntry.comment}
                </div>
              ) : (
                <div style={{ fontSize: '0.875rem', color: '#9ca3af', fontStyle: 'italic' }}>
                  Aucun commentaire fourni lors de la mise sous réserve.
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '0.875rem', color: '#9ca3af', padding: '16px 0' }}>
              Aucune entrée de réserve trouvée dans l'historique.
            </div>
          )}
        </CCol>

        {/* Colonne droite : traitement (secrétaire) */}
        {canClearFlag && (
          <CCol md={7}>
            <div style={{
              fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.07em', color: '#64748b', marginBottom: 10,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <CIcon icon={cilCheckCircle} style={{ width: 13 }} />
              Traitement de la réserve
              <span style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>

            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: 10, padding: '18px 20px',
            }}>
              <label style={{
                display: 'block', fontWeight: 600,
                fontSize: '0.875rem', color: '#374151', marginBottom: 8,
              }}>
                Commentaire de correction
                <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6 }}>(optionnel)</span>
              </label>
              <CFormTextarea
                rows={4}
                value={comment}
                onChange={e => setComment(e.target.value.slice(0, 500))}
                placeholder="Ex : Reçu de paiement vérifié et conforme. Dossier complet."
                disabled={clearing}
                style={{
                  fontSize: '0.875rem', lineHeight: 1.6,
                  borderRadius: 8, border: '1.5px solid #e2e8f0',
                  padding: '10px 14px', resize: 'vertical',
                  color: '#1f2937', marginBottom: 4,
                }}
              />
              <div style={{
                textAlign: 'right', fontSize: '0.78rem',
                color: '#9ca3af', marginBottom: 16,
              }}>
                {comment.length} / 500
              </div>

              <button
                onClick={handleClearFlag}
                disabled={clearing}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: clearing ? '#d1d5db' : '#059669',
                  border: 'none', color: '#fff',
                  borderRadius: 8, padding: '10px 20px',
                  fontSize: '0.875rem', fontWeight: 700,
                  cursor: clearing ? 'not-allowed' : 'pointer',
                  transition: 'background 0.15s',
                  boxShadow: clearing ? 'none' : '0 2px 8px rgba(5,150,105,0.25)',
                  width: '100%', justifyContent: 'center',
                }}
              >
                {clearing
                  ? <><CSpinner size="sm" style={{ width: 14, height: 14 }} />Traitement en cours…</>
                  : <><CIcon icon={cilCheckCircle} style={{ width: 16 }} />Marquer la réserve comme levée</>
                }
              </button>

              <p style={{ marginTop: 10, fontSize: '0.78rem', color: '#9ca3af', lineHeight: 1.5 }}>
                Cette action supprime le flag de réserve et enregistre l'action dans l'historique.
              </p>
            </div>
          </CCol>
        )}
      </CRow>

      {/* Message si pas de droit */}
      {!canClearFlag && (
        <div style={{
          marginTop: 16,
          background: '#f8fafc', border: '1px solid #e2e8f0',
          borderRadius: 10, padding: '14px 18px',
          fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6,
        }}>
          Seule la secrétaire peut lever cette réserve après correction du dossier.
        </div>
      )}
    </div>
  )
}

export default SousReservePanel
