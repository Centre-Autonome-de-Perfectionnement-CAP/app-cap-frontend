// src/views/pages/stages/StageSettingsForm.tsx
// Réglages du module (page Réglages) : ouverture des demandes, valeurs par
// défaut, pointage, rapports, attestations, documents PDF et règlement.

import { useEffect, useRef, useState } from 'react'
import {
  CButton, CCard, CCardBody, CSpinner,
  CFormSwitch, CFormLabel, CFormInput, CFormTextarea, CFormSelect, CRow, CCol,
} from '@coreui/react'
import stageService, { type StageSettings } from '@/services/stage.service'
import { showSuccess, friendlyError } from '@/components/common/ActionResult'
import { UPLOAD_LIMIT_MB, isTooHeavy } from '@/constants/validation.constants'

const StageSettingsForm = () => {
  const [form, setForm] = useState<StageSettings | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    stageService.getSettings().then(setForm).catch(e => setError(friendlyError(e)))
  }, [])

  const [locating, setLocating] = useState(false)
  const [accuracy, setAccuracy] = useState<number | null>(null)

  const takePosition = () => {
    if (!('geolocation' in navigator)) { setError('La localisation n\'est pas disponible sur cet appareil.'); return }
    setLocating(true); setError(null)
    navigator.geolocation.getCurrentPosition(
      p => {
        set('lieu_position', { lat: +p.coords.latitude.toFixed(7), lng: +p.coords.longitude.toFixed(7) })
        setAccuracy(Math.round(p.coords.accuracy))
        setLocating(false)
      },
      () => { setError('Position non obtenue. Autorisez la localisation et réessayez, de préférence près d\'une fenêtre.'); setLocating(false) },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    )
  }

  const set = <K extends keyof StageSettings>(k: K, v: StageSettings[K]) => setForm(f => (f ? { ...f, [k]: v } : f))

  const save = async () => {
    if (!form) return
    setBusy(true); setError(null)
    try {
      const saved = await stageService.updateSettings({
        requests_open: form.requests_open,
        closed_message: form.closed_message,
        default_rejection_reason: form.default_rejection_reason,
        default_service: form.default_service,
        default_lieu: form.default_lieu,
        default_horaires: form.default_horaires,
        lieu_position: form.lieu_position,
        lieu_rayon: form.lieu_rayon,
        reglement_text: form.reglement_text,
        permission_delay_days: form.permission_delay_days,
        report_frequency: form.report_frequency,
        report_grace_days: form.report_grace_days,
        final_report_open_days: form.final_report_open_days,
        final_correction_days: form.final_correction_days,
        seuil_assiduite: form.seuil_assiduite,
        attestation_structure: form.attestation_structure,
        numero_suffixe: form.numero_suffixe,
        pdf_ville: form.pdf_ville,
        signataire_titre: form.signataire_titre,
        signataire_nom: form.signataire_nom,
        pdf_pied_de_page: form.pdf_pied_de_page,
        note_signataire_titre: form.note_signataire_titre,
        note_signataire_nom: form.note_signataire_nom,
      })
      setForm(saved)
      await showSuccess('Réglages enregistrés')
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
      <CCardBody>
        {!form && !error && <div style={{ padding: 32, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
        {form && (
          <CRow className="g-3">
            <CCol xs={12}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 14px',
                borderRadius: 12, border: `1px solid ${form.requests_open ? '#a7f3d0' : '#fde68a'}`,
                background: form.requests_open ? '#ecfdf5' : '#fffbeb',
              }}>
                <div>
                  <strong>{form.requests_open ? 'Demandes ouvertes' : 'Demandes fermées'}</strong>
                  <div style={{ fontSize: '.875rem', color: '#475569' }}>
                    {form.requests_open
                      ? 'Le formulaire du site accepte de nouvelles demandes.'
                      : 'Le formulaire du site affiche le message ci-dessous à la place.'}
                  </div>
                </div>
                <CFormSwitch size="xl" checked={form.requests_open} onChange={e => set('requests_open', e.target.checked)} aria-label="Ouvrir ou fermer les demandes" />
              </div>
            </CCol>
            <CCol xs={12}>
              <CFormLabel className="fw-semibold small">Message affiché quand les demandes sont fermées</CFormLabel>
              <CFormTextarea rows={2} maxLength={500} value={form.closed_message} onChange={e => set('closed_message', e.target.value)} />
            </CCol>
            <CCol xs={12}>
              <CFormLabel className="fw-semibold small">Motif de rejet proposé par défaut</CFormLabel>
              <CFormTextarea rows={3} maxLength={1000} value={form.default_rejection_reason} onChange={e => set('default_rejection_reason', e.target.value)} />
            </CCol>
            <CCol xs={12} md={6}>
              <CFormLabel className="fw-semibold small">Service par défaut</CFormLabel>
              <CFormInput maxLength={150} value={form.default_service} onChange={e => set('default_service', e.target.value)} />
            </CCol>
            <CCol xs={12} md={6}>
              <CFormLabel className="fw-semibold small">Lieu par défaut</CFormLabel>
              <CFormInput maxLength={150} value={form.default_lieu} onChange={e => set('default_lieu', e.target.value)} />
            </CCol>
            <CCol xs={12}>
              <CFormLabel className="fw-semibold small mb-1">Horaires par défaut</CFormLabel>
              <CRow className="g-2">
                {([['arrivee', 'Arrivée'], ['pause_debut', 'Début pause'], ['pause_fin', 'Fin pause'], ['sortie', 'Sortie']] as const).map(([k, l]) => (
                  <CCol xs={6} md={3} key={k}>
                    <span style={{ fontSize: '.875rem', color: '#64748b', fontWeight: 600 }}>{l}</span>
                    <CFormInput type="time" value={form.default_horaires[k]}
                      onChange={e => set('default_horaires', { ...form.default_horaires, [k]: e.target.value })} />
                  </CCol>
                ))}
              </CRow>
            </CCol>
            <CCol xs={12}><hr className="my-1" /><strong>Pointage des stagiaires</strong></CCol>
            <CCol xs={12}>
              <div style={{ border: `1px solid ${form.lieu_position ? '#a7f3d0' : '#fde68a'}`, background: form.lieu_position ? '#ecfdf5' : '#fffbeb', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ fontWeight: 700 }}>{form.lieu_position ? 'Position du lieu de stage enregistrée' : 'Position du lieu de stage non relevée'}</div>
                <div style={{ fontSize: '.875rem', color: '#475569' }}>
                  {form.lieu_position
                    ? `${form.lieu_position.lat}, ${form.lieu_position.lng}${accuracy !== null ? ` (précision ±${accuracy} m)` : ''}. Les pointages doivent se faire à moins de ${form.lieu_rayon} m.`
                    : 'Tant qu\'elle n\'est pas relevée, les stagiaires ne peuvent ni confirmer leur présence ni pointer. Relevez-la depuis le lieu de stage, avec votre téléphone.'}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <CButton size="sm" color="primary" onClick={takePosition} disabled={locating}>
                    {locating && <CSpinner size="sm" className="me-1" />}Utiliser ma position actuelle
                  </CButton>
                  {form.lieu_position && <CButton size="sm" color="secondary" variant="ghost" onClick={() => { set('lieu_position', null); setAccuracy(null) }}>Effacer</CButton>}
                </div>
              </div>
            </CCol>
            <CCol xs={6} md={4}>
              <CFormLabel className="fw-semibold small">Rayon autorisé (m)</CFormLabel>
              <CFormInput type="number" min={20} max={500} value={form.lieu_rayon} onChange={e => set('lieu_rayon', Math.max(20, Math.min(500, Number(e.target.value) || 50)))} />
            </CCol>
            <CCol xs={6} md={4}>
              <CFormLabel className="fw-semibold small">Permission après coup (jours ouvrés)</CFormLabel>
              <CFormInput type="number" min={0} max={15} value={form.permission_delay_days} onChange={e => set('permission_delay_days', Math.max(0, Math.min(15, Number(e.target.value) || 0)))} />
            </CCol>
            <CCol xs={12}><hr className="my-1" /><strong>Rapports</strong></CCol>
            <CCol xs={12} md={4}>
              <CFormLabel className="fw-semibold small">Fréquence imposée</CFormLabel>
              <CFormSelect value={form.report_frequency} onChange={e => set('report_frequency', e.target.value as StageSettings['report_frequency'])}>
                <option value="journalier">Journalier</option>
                <option value="hebdomadaire">Hebdomadaire</option>
                <option value="mensuel">Mensuel</option>
              </CFormSelect>
            </CCol>
            <CCol xs={6} md={4}>
              <CFormLabel className="fw-semibold small">Délai après la période (jours ouvrés)</CFormLabel>
              <CFormInput type="number" min={0} max={10} value={form.report_grace_days} onChange={e => set('report_grace_days', Math.max(0, Math.min(10, Number(e.target.value) || 0)))} />
            </CCol>
            <CCol xs={6} md={4}>
              <CFormLabel className="fw-semibold small">Rapport final ouvert (jours avant la fin)</CFormLabel>
              <CFormInput type="number" min={3} max={60} value={form.final_report_open_days} onChange={e => set('final_report_open_days', Math.max(3, Math.min(60, Number(e.target.value) || 14)))} />
            </CCol>
            <CCol xs={6} md={4}>
              <CFormLabel className="fw-semibold small">Version corrigée après soutenance (jours après la fin)</CFormLabel>
              <CFormInput type="number" min={0} max={365} value={form.final_correction_days ?? 90} onChange={e => set('final_correction_days', Math.max(0, Math.min(365, Number(e.target.value) || 0)))} />
            </CCol>
            <CCol xs={12}><hr className="my-1" /><strong>Attestations</strong></CCol>
            <CCol xs={6} md={4}>
              <CFormLabel className="fw-semibold small">Assiduité minimale (%)</CFormLabel>
              <CFormInput type="number" min={50} max={100} value={form.seuil_assiduite} onChange={e => set('seuil_assiduite', Math.max(50, Math.min(100, Number(e.target.value) || 80)))} />
            </CCol>
            <CCol xs={12} md={8}>
              <CFormLabel className="fw-semibold small">Structure d'accueil (« … un stage académique au sein … »)</CFormLabel>
              <CFormInput maxLength={200} value={form.attestation_structure} onChange={e => set('attestation_structure', e.target.value)} />
            </CCol>
            <CCol xs={12}><hr className="my-1" /><strong>Documents PDF (attestation, note de service)</strong></CCol>
            <CCol xs={6} md={4}>
              <CFormLabel className="fw-semibold small">Après le numéro</CFormLabel>
              <CFormInput maxLength={40} value={form.numero_suffixe} onChange={e => set('numero_suffixe', e.target.value.replace(/[^A-Za-z0-9/\-_. ]/g, ''))} />
              <div style={{ fontSize: '.875rem', color: '#64748b' }}>Ex. : N° 22-26/{form.numero_suffixe || '…'}</div>
            </CCol>
            <CCol xs={6} md={4}>
              <CFormLabel className="fw-semibold small">Ville (« …, le »)</CFormLabel>
              <CFormInput maxLength={60} value={form.pdf_ville} onChange={e => set('pdf_ville', e.target.value)} />
            </CCol>
            <CCol xs={12} md={4}>
              <CFormLabel className="fw-semibold small">Pied de page</CFormLabel>
              <CFormInput maxLength={150} value={form.pdf_pied_de_page} onChange={e => set('pdf_pied_de_page', e.target.value)} />
            </CCol>
            <CCol xs={12}><strong style={{ fontSize: '.9rem' }}>Notes de service : signature numérique</strong></CCol>
            <CCol xs={12} md={7}>
              <CFormLabel className="fw-semibold small">Titre du signataire</CFormLabel>
              <CFormInput maxLength={150} value={form.note_signataire_titre} onChange={e => set('note_signataire_titre', e.target.value)} />
            </CCol>
            <CCol xs={12} md={5}>
              <CFormLabel className="fw-semibold small">Nom du signataire</CFormLabel>
              <CFormInput maxLength={100} value={form.note_signataire_nom} onChange={e => set('note_signataire_nom', e.target.value)} placeholder="Exemple : Dr Jean DOSSOU" />
            </CCol>
            <CCol xs={12}>
              <NoteSignatureField meta={form.note_signature} onChange={next => set('note_signature', next.note_signature)} onError={setError} />
            </CCol>
            <CCol xs={12}><strong style={{ fontSize: '.9rem' }}>Attestations : signature à la main</strong></CCol>
            <CCol xs={12} md={5}>
              <CFormLabel className="fw-semibold small">Titre du signataire</CFormLabel>
              <CFormInput maxLength={80} value={form.signataire_titre} onChange={e => set('signataire_titre', e.target.value)} />
            </CCol>
            <CCol xs={12} md={7}>
              <CFormLabel className="fw-semibold small">Nom du signataire</CFormLabel>
              <CFormInput maxLength={100} value={form.signataire_nom} onChange={e => set('signataire_nom', e.target.value)} />
            </CCol>
            <CCol xs={12}><hr className="my-1" /></CCol>
            <CCol xs={12}>
              <CFormLabel className="fw-semibold small">Règlement intérieur (version {form.reglement_version})</CFormLabel>
              <CFormTextarea rows={8} maxLength={10000} value={form.reglement_text} onChange={e => set('reglement_text', e.target.value)} />
              <div style={{ fontSize: '.875rem', color: '#64748b', marginTop: 4 }}>
                Toute modification crée une nouvelle version : chaque stagiaire devra la relire et l'accepter.
                Remplacés automatiquement à l'affichage : {'{horaires}'} (horaires du stagiaire), {'{tolerance}'} (minutes avant retard),
                {' {delai_permission}'} (jours ouvrés), {'{rapports}'} (fréquence des rapports), {'{seuil}'} (assiduité minimale).
              </div>
            </CCol>
            <CCol xs={12}>
              <div style={{ fontSize: '.875rem', color: '#64748b' }}>
                Une proposition sans réponse est relancée après {form.proposal_reminder_days} jours et expire après {form.proposal_expiry_days} jours.
              </div>
            </CCol>
          </CRow>
        )}
        {error && !form && <div className="stg-err">{error}</div>}
      </CCardBody>
      {form && (
        <div className="set-save">
          {error && <div className="stg-err" role="alert" style={{ margin: 0, flex: 1 }}>{error}</div>}
          <CButton color="primary" onClick={save} disabled={busy}>
            {busy && <CSpinner size="sm" className="me-1" />}Enregistrer les réglages
          </CButton>
        </div>
      )}
      <style>{`.set-save { position: sticky; bottom: 0; z-index: 3; display: flex; align-items: center; gap: 12px; justify-content: flex-end; padding: 12px 16px;
        background: rgba(255,255,255,.96); border-top: 1px solid #e2e8f0; border-radius: 0 0 14px 14px; }`}</style>
    </CCard>
  )
}


/**
 * Image de la signature des notes de service. Le serveur retire le fond et
 * coupe les marges ; l'aperçu reprend le cadre du PDF (60 × 24 mm).
 */
const NoteSignatureField = ({ meta, onChange, onError }: {
  meta: StageSettings['note_signature']
  onChange: (s: StageSettings) => void
  onError: (msg: string | null) => void
}) => {
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!meta) { setPreview(null); return }
    let url: string | null = null
    let alive = true
    stageService.noteSignatureImage()
      .then(f => { url = f.url; if (alive) setPreview(f.url); else URL.revokeObjectURL(f.url) })
      .catch(() => alive && setPreview(null))
    return () => { alive = false; if (url) URL.revokeObjectURL(url) }
  }, [meta?.updated_at]) // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (action: () => Promise<StageSettings>) => {
    setBusy(true); onError(null)
    try { onChange(await action()) } catch (e) { onError(friendlyError(e)) } finally { setBusy(false) }
  }

  const pick = (file: File | undefined) => {
    if (input.current) input.current.value = ''
    if (!file) return
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { onError('Choisissez une image PNG, JPG ou WEBP.'); return }
    if (isTooHeavy(file)) { onError(`L'image ne doit pas dépasser ${UPLOAD_LIMIT_MB.DEFAULT} Mo.`); return }
    run(() => stageService.uploadNoteSignature(file))
  }

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12 }}>
      <div style={{
        width: 240, height: 96, border: '1px dashed #cbd5e1', borderRadius: 8, background: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {busy ? <CSpinner size="sm" color="primary" />
          : preview ? <img src={preview} alt="Signature" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          : <span style={{ fontSize: '.875rem', color: '#64748b' }}>Aucune signature</span>}
      </div>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontSize: '.875rem', color: '#475569', marginBottom: 8 }}>
          PNG sans fond de préférence ({UPLOAD_LIMIT_MB.DEFAULT} Mo maximum). Une photo nette sur papier blanc convient aussi : le fond est retiré
          et les marges coupées automatiquement. La signature apparaît sur toutes les notes de service et notes rectificatives.
        </div>
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={e => pick(e.target.files?.[0])} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <CButton size="sm" color="primary" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
            {meta ? 'Remplacer la signature' : 'Choisir une image'}
          </CButton>
          {meta && (
            <CButton size="sm" color="danger" variant="ghost" disabled={busy} onClick={() => run(stageService.deleteNoteSignature)}>
              Retirer
            </CButton>
          )}
        </div>
      </div>
    </div>
  )
}

export default StageSettingsForm
