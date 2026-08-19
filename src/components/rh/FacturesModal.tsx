import React, { useState, useEffect, useRef } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
  CButton, CForm, CFormLabel, CFormSelect, CSpinner, CBadge, CAlert,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudUpload, cilFile, cilX, cilCheckCircle, cilWarning, cilSwapHorizontal,
} from '@coreui/icons'
import RhService from '@/services/rh.service'
import type { Contrat } from '@/types/rh.types'

interface FacturesModalProps {
  visible: boolean
  onClose: () => void
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  signed:     { label: 'Signé',      color: 'success'   },
  ongoing:    { label: 'En cours',   color: 'info'      },
  pending:    { label: 'En attente', color: 'warning'   },
  completed:  { label: 'Terminé',   color: 'secondary' },
  transfered: { label: 'Transféré', color: 'primary'   },
  cancelled:  { label: 'Rejeté',    color: 'danger'    },
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount)

// ─── Dropzone ─────────────────────────────────────────────────────────────────

interface DropzoneProps {
  label: string; accept: string; file: File | null
  onFile: (f: File) => void; onClear: () => void
  icon?: React.ReactNode; required?: boolean
}

const Dropzone: React.FC<DropzoneProps> = ({ label, accept, file, onFile, onClear, icon, required = false }) => {
  const ref = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f) }}
      onClick={() => !file && ref.current?.click()}
      style={{
        border: `2px dashed ${dragging ? '#321fdb' : file ? '#2eb85c' : '#adb5bd'}`,
        borderRadius: 10, padding: '18px 16px',
        background: dragging ? '#f0f1ff' : file ? '#f0fff4' : '#f8f9fa',
        cursor: file ? 'default' : 'pointer', transition: 'all .2s',
        minHeight: 90, display: 'flex', alignItems: 'center', gap: 12,
      }}
    >
      <input ref={ref} type="file" accept={accept} style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }} />
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: file ? '#d4edda' : '#e9ecef',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon || <CIcon icon={cilFile} size="lg" style={{ color: file ? '#2eb85c' : '#6c757d' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#2d3748', marginBottom: 2 }}>
          {label} {required && <span style={{ color: '#e55353' }}>*</span>}
        </div>
        {file ? (
          <div style={{ fontSize: 12, color: '#2eb85c', wordBreak: 'break-all' }}>
            <CIcon icon={cilCheckCircle} size="sm" className="me-1" />
            {file.name} ({(file.size / 1024).toFixed(0)} Ko)
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#718096' }}>
            Glissez ici ou <span style={{ color: '#321fdb', textDecoration: 'underline' }}>cliquez pour sélectionner</span>
          </div>
        )}
      </div>
      {file && (
        <button type="button" onClick={(e) => { e.stopPropagation(); onClear() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e55353', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
          <CIcon icon={cilX} size="sm" />
        </button>
      )}
    </div>
  )
}

// ─── Bannière confirmation remplacement ───────────────────────────────────────

const ReplaceWarning: React.FC<{ existingName: string; onConfirm: () => void; onCancel: () => void; loading: boolean }> =
  ({ existingName, onConfirm, onCancel, loading }) => (
  <div style={{
    background: '#fff8e1', border: '1px solid #ffe082',
    borderRadius: 12, padding: '20px', marginBottom: 20,
  }}>
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: '#fff3cd', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <CIcon icon={cilWarning} style={{ color: '#f59e0b', width: 20, height: 20 }} />
      </div>
      <div>
        <div style={{ fontWeight: 700, color: '#92400e', marginBottom: 4, fontSize: 14 }}>
          Une facture existe déjà pour ce contrat
        </div>
        <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>
          Le fichier <strong>"{existingName}"</strong> a déjà été déposé.
          Voulez-vous le remplacer par le nouveau fichier sélectionné ?
        </div>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
      <CButton size="sm" color="light" onClick={onCancel} disabled={loading}
        style={{ borderRadius: 8, fontWeight: 600, border: '1px solid #e5e7eb' }}>
        Non, annuler
      </CButton>
      <CButton size="sm" color="warning" onClick={onConfirm} disabled={loading}
        style={{ borderRadius: 8, fontWeight: 600, color: '#92400e' }}>
        {loading ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilSwapHorizontal} className="me-1" />}
        Oui, remplacer
      </CButton>
    </div>
  </div>
)

// ─── Modal principal ──────────────────────────────────────────────────────────

const FacturesModal: React.FC<FacturesModalProps> = ({ visible, onClose }) => {
  const [contrats, setContrats]       = useState<Contrat[]>([])
  const [loading, setLoading]         = useState(false)
  const [selectedId, setSelectedId]   = useState<string>('')
  const [factureFile, setFactureFile] = useState<File | null>(null)
  const [uploading, setUploading]     = useState(false)
  const [success, setSuccess]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  // ── État du warning remplacement ────────────────────────────────────────────
  // null = pas de warning ; string = nom du fichier existant retourné par le backend
  const [replaceWarning, setReplaceWarning] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setLoading(true)
    setSuccess(false); setError(null); setSelectedId('')
    setFactureFile(null); setReplaceWarning(null)

    RhService.getMyContrats()
      .then((res) => {
        const eligible = (res.data || []).filter(
          (c: Contrat) => c.status === 'signed' || c.status === 'ongoing',
        )
        setContrats(eligible)
      })
      .catch(() => setError('Impossible de charger vos contrats.'))
      .finally(() => setLoading(false))
  }, [visible])

  const handleSelectContrat = (id: string) => {
    setSelectedId(id)
    setError(null)
    setReplaceWarning(null)
    setFactureFile(null)
  }

  const selectedContrat = contrats.find((c) => String(c.id) === selectedId) ?? null

  // ─── Upload (avec ou sans replace) ─────────────────────────────────────────
  const doUpload = async (replace = false) => {
    setError(null)
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('factures_normalisees[]', factureFile!)
      if (replace) formData.append('replace', '1')

      await RhService.uploadFacturesNormalisees(selectedId, formData)
      setReplaceWarning(null)
      setSuccess(true)
    } catch (err: any) {
      // HttpService transforme l'erreur en { message, status, ...response.data }
      // err contient donc directement has_existing et existing_name du backend
      if (err?.has_existing === true) {
        setReplaceWarning(err.existing_name ?? 'fichier existant')
      } else {
        setError(err?.message ?? "Une erreur s'est produite lors de l'upload.")
      }
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = () => {
    if (!selectedId)   { setError('Veuillez sélectionner un contrat.'); return }
    if (!factureFile)  { setError('Veuillez joindre votre facture normalisée.'); return }
    setError(null)
    doUpload(false)   // Premier essai sans replace
  }

  const handleConfirmReplace = () => doUpload(true)   // L'utilisateur confirme

  const handleCancelReplace = () => {
    setReplaceWarning(null)
    setFactureFile(null)
  }

  const handleClose = () => {
    setSuccess(false); setError(null); setReplaceWarning(null)
    onClose()
  }

  // ─── Rendu ──────────────────────────────────────────────────────────────────
  return (
    <CModal visible={visible} onClose={handleClose} size="lg" alignment="center" backdrop="static">
      <CModalHeader style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: 16 }}>
        <CModalTitle style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 17 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#321fdb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CIcon icon={cilCloudUpload} style={{ color: '#fff' }} />
          </div>
          Déposer mes factures normalisées
        </CModalTitle>
      </CModalHeader>

      <CModalBody style={{ padding: '24px 28px' }}>

        {/* Succès */}
        {success ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#d4edda', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CIcon icon={cilCheckCircle} size="xxl" style={{ color: '#2eb85c' }} />
            </div>
            <h5 style={{ fontWeight: 700, marginBottom: 8, color: '#1a1a2e' }}>Documents déposés avec succès !</h5>
            <p style={{ color: '#6c757d', marginBottom: 24 }}>Vos fichiers ont été transmis à l'administration.</p>
            <CButton color="primary" onClick={handleClose}>Fermer</CButton>
          </div>

        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <CSpinner color="primary" />
            <p className="mt-3 text-medium-emphasis">Chargement de vos contrats…</p>
          </div>

        ) : contrats.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0', background: '#fffbf0', borderRadius: 12, border: '1px dashed #f9a825' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
            <p style={{ fontWeight: 600, color: '#856404', marginBottom: 4 }}>Aucun contrat éligible</p>
            <p style={{ fontSize: 13, color: '#a0785a' }}>Seuls les contrats <strong>Signés</strong> ou <strong>En cours</strong> permettent de déposer des factures.</p>
          </div>

        ) : (
          <CForm>
            {/* Erreur générale */}
            {error && (
              <CAlert color="danger" className="d-flex align-items-center gap-2 mb-4" style={{ borderRadius: 10 }}>
                <CIcon icon={cilWarning} /><span>{error}</span>
              </CAlert>
            )}

            {/* Sélection contrat */}
            <div className="mb-4">
              <CFormLabel style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                Contrat concerné <span style={{ color: '#e55353' }}>*</span>
              </CFormLabel>
              <CFormSelect value={selectedId} onChange={(e) => handleSelectContrat(e.target.value)}
                style={{ borderRadius: 9, padding: '10px 14px', fontSize: 14 }}>
                <option value="">— Sélectionner un contrat —</option>
                {contrats.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    N° {c.contrat_number} — {c.professor?.full_name ?? ''}
                    {c.academicYear?.academic_year ? ` (${c.academicYear.academic_year})` : ''}
                    {' '}— {formatAmount(c.amount)}
                  </option>
                ))}
              </CFormSelect>

              {selectedContrat && (
                <div style={{ marginTop: 12, padding: '12px 16px', background: '#f8f9ff', borderRadius: 9, border: '1px solid #dde1ff', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#718096', marginBottom: 2 }}>Statut</div>
                    <CBadge color={STATUS_LABELS[selectedContrat.status]?.color ?? 'secondary'}>
                      {STATUS_LABELS[selectedContrat.status]?.label ?? selectedContrat.status}
                    </CBadge>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#718096', marginBottom: 2 }}>Montant</div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{formatAmount(selectedContrat.amount)}</div>
                  </div>
                  {selectedContrat.academicYear && (
                    <div>
                      <div style={{ fontSize: 11, color: '#718096', marginBottom: 2 }}>Année académique</div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{selectedContrat.academicYear.academic_year}</div>
                    </div>
                  )}
                  {selectedContrat.cycle && (
                    <div>
                      <div style={{ fontSize: 11, color: '#718096', marginBottom: 2 }}>Cycle</div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{selectedContrat.cycle.name}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', marginBottom: 20 }} />

            {/* Warning remplacement — affiché par-dessus les dropzones */}
            {replaceWarning && (
              <ReplaceWarning
                existingName={replaceWarning}
                onConfirm={handleConfirmReplace}
                onCancel={handleCancelReplace}
                loading={uploading}
              />
            )}

            {/* Dropzones — masquées pendant le warning */}
            {!replaceWarning && (
              <>
                <CFormLabel style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, display: 'block' }}>
                  Documents à joindre
                </CFormLabel>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <Dropzone label="Facture normalisée" accept=".pdf,.jpg,.jpeg,.png"
                      file={factureFile} onFile={setFactureFile} onClear={() => setFactureFile(null)}
                      icon={<CIcon icon={cilFile} size="lg" style={{ color: factureFile ? '#2eb85c' : '#321fdb' }} />}
                      required />
                    <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 4 }}>Formats : PDF, JPG, PNG — Max 5 Mo</div>
                  </div>
                </div>
                <div style={{ marginTop: 20, padding: '12px 16px', background: '#f0f4ff', borderRadius: 9, borderLeft: '4px solid #321fdb', fontSize: 12, color: '#4a5568', lineHeight: 1.6 }}>
                  <strong>Information :</strong> Une seule facture normalisée est acceptée par contrat. Si une facture existe déjà, vous pourrez la remplacer.
                </div>
              </>
            )}
          </CForm>
        )}
      </CModalBody>

      {/* Footer */}
      {!success && !loading && contrats.length > 0 && !replaceWarning && (
        <CModalFooter style={{ borderTop: '2px solid #f0f0f0', padding: '16px 28px', gap: 10 }}>
          <CButton color="light" onClick={handleClose} disabled={uploading} style={{ borderRadius: 8 }}>Annuler</CButton>
          <CButton color="primary" onClick={handleSubmit} disabled={uploading || !selectedId || !factureFile} style={{ borderRadius: 8, minWidth: 160 }}>
            {uploading
              ? <><CSpinner size="sm" className="me-2" />Envoi en cours…</>
              : <><CIcon icon={cilCloudUpload} className="me-2" />Déposer les fichiers</>
            }
          </CButton>
        </CModalFooter>
      )}
    </CModal>
  )
}

export default FacturesModal