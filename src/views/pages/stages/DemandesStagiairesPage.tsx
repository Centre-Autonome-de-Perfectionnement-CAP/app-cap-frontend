// src/views/pages/stages/DemandesStagiairesPage.tsx
// Demandes des stagiaires (permissions, prolongations, raccourcissements) :
// n'importe quel superviseur ou le responsable les traite.

import { useCallback, useEffect, useState } from 'react'
import {
  CButton, CCard, CCardBody, CFormCheck, CFormTextarea, CSpinner,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload, cilPaperclip } from '@coreui/icons'
import stageService, { type InternRequestRow } from '@/services/stage.service'
import { showSuccess, friendlyError } from '@/components/common/ActionResult'
import { useAuth } from '@/contexts'
import { PageHead, Empty, Pill, StagesStyles, useOpenDossier } from './StagesUi'
import { frDate, frDateTime } from './stageUtils'
import StageFileViewer from './StageFileViewer'

const STATUS = {
  pending:   { label: 'En attente', color: '#d97706', bg: '#fffbeb' },
  approved:  { label: 'Acceptée',   color: '#059669', bg: '#ecfdf5' },
  rejected:  { label: 'Refusée',    color: '#e11d48', bg: '#fff1f2' },
  cancelled: { label: 'Annulée',    color: '#64748b', bg: '#f1f5f9' },
} as const

const FILTERS = [['pending', 'À traiter'], ['approved', 'Acceptées'], ['rejected', 'Refusées'], ['all', 'Toutes']] as const

const DemandesStagiairesPage = () => {
  const { role } = useAuth()
  const [status, setStatus] = useState<string>('pending')
  const [mine, setMine] = useState(role === 'superviseur')
  const [rows, setRows] = useState<InternRequestRow[] | null>(null)
  const [pending, setPending] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [deciding, setDeciding] = useState<{ row: InternRequestRow; decision: 'approved' | 'rejected' } | null>(null)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [modalErr, setModalErr] = useState<string | null>(null)
  const openDossier = useOpenDossier('Demandes des stagiaires')

  const load = useCallback(async () => {
    setError(null)
    try {
      const res = await stageService.internRequests(status, mine)
      setRows(res.data); setPending(res.pending)
    } catch (e) { setError(friendlyError(e)) }
  }, [status, mine])
  useEffect(() => { load() }, [load])

  // Justificatif ouvert dans le visualiseur commun
  const [fileOf, setFileOf] = useState<InternRequestRow | null>(null)

  const decide = async () => {
    if (!deciding) return
    if (deciding.decision === 'rejected' && !comment.trim()) { setModalErr('Indiquez le motif du refus.'); return }
    setBusy(true); setModalErr(null)
    try {
      const res: any = await stageService.decideInternRequest(deciding.row.id, deciding.decision, comment.trim() || undefined)
      setDeciding(null)
      await load()
      await showSuccess(deciding.decision === 'approved' ? 'Demande acceptée' : 'Demande refusée', res?.message)
    } catch (e) {
      setModalErr(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  const describe = (r: InternRequestRow) => r.kind === 'permission'
    ? `${r.type_label} - ${r.date_from === r.date_to ? frDate(r.date_from, true) : `du ${frDate(r.date_from)} au ${frDate(r.date_to)}`}${r.time_from ? ` à ${r.time_from.replace(':', 'h')}` : ''}`
    : `${r.kind_label} - fin actuelle ${frDate(r.stage.date_fin)}, demandée ${frDate(r.new_date_fin)}`

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title="Demandes des stagiaires"
        subtitle={`Permissions, prolongations et raccourcissements. ${pending} en attente.`}
        actions={<CButton color="secondary" variant="outline" size="sm" onClick={load} title="Actualiser"><CIcon icon={cilReload} /></CButton>}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(([k, l]) => (
          <CButton key={k} size="sm" color="primary" variant={status === k ? undefined : 'outline'} onClick={() => setStatus(k)}>{l}</CButton>
        ))}
        <CFormCheck className="ms-2" id="mine" label="Seulement mes stagiaires" checked={mine} onChange={e => setMine(e.target.checked)} />
      </div>

      {error && <div className="stg-err">{error}</div>}
      {!rows && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
      {rows && rows.length === 0 && <CCard className="border-0 shadow-sm"><CCardBody><Empty text="Aucune demande dans cette catégorie." /></CCardBody></CCard>}

      <div className="stg-list">
        {rows?.map(r => (
          <div key={r.id} className="stg-card">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button type="button" onClick={() => openDossier(r.stage.reference)} style={{ all: 'unset', cursor: 'pointer', fontWeight: 800, color: '#0f172a' }}>{r.stage.nom_complet}</button>
              <span className="stg-muted">{r.stage.reference}</span>
              <Pill color={STATUS[r.status].color} bg={STATUS[r.status].bg}>{STATUS[r.status].label}</Pill>
              <span className="stg-muted" style={{ marginLeft: 'auto' }}>reçue le {frDateTime(r.created_at)}</span>
            </div>
            <div style={{ marginTop: 6, fontWeight: 700, color: '#334155' }}>{describe(r)}</div>
            <div style={{ marginTop: 4, whiteSpace: 'pre-line' }}>{r.motif}</div>
            {r.decision_comment && <div className="stg-muted" style={{ marginTop: 4 }}>Réponse : {r.decision_comment}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {r.has_file && <CButton size="sm" color="secondary" variant="outline" onClick={() => setFileOf(r)}><CIcon icon={cilPaperclip} className="me-1" />Justificatif</CButton>}
              {r.status === 'pending' && (
                <>
                  <CButton size="sm" color="danger" variant="outline" className="ms-auto" onClick={() => { setComment(''); setModalErr(null); setDeciding({ row: r, decision: 'rejected' }) }}>Refuser</CButton>
                  <CButton size="sm" color="success" style={{ color: '#fff' }} onClick={() => { setComment(''); setModalErr(null); setDeciding({ row: r, decision: 'approved' }) }}>Accepter</CButton>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <CModal visible={!!deciding} onClose={() => setDeciding(null)} alignment="center">
        <CModalHeader><CModalTitle style={{ fontSize: '1rem' }}>{deciding?.decision === 'approved' ? 'Accepter la demande' : 'Refuser la demande'}</CModalTitle></CModalHeader>
        <CModalBody>
          {deciding && <p style={{ fontWeight: 600 }}>{deciding.row.stage.nom_complet} - {describe(deciding.row)}</p>}
          {deciding?.decision === 'approved' && deciding.row.kind !== 'permission' && (
            <div className="stg-info" style={{ marginBottom: 10 }}>La date de fin sera modifiée et une note de service rectificative sera émise et envoyée.</div>
          )}
          <CFormTextarea rows={3} maxLength={1000} value={comment} onChange={e => setComment(e.target.value)}
            placeholder={deciding?.decision === 'rejected' ? 'Motif du refus (obligatoire)' : 'Commentaire (facultatif)'} />
          {modalErr && <div className="stg-err" style={{ marginTop: 10 }}>{modalErr}</div>}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setDeciding(null)}>Annuler</CButton>
          <CButton color={deciding?.decision === 'approved' ? 'success' : 'danger'} style={{ color: '#fff' }} disabled={busy} onClick={decide}>
            {busy && <CSpinner size="sm" className="me-1" />}{deciding?.decision === 'approved' ? 'Accepter' : 'Refuser'}
          </CButton>
        </CModalFooter>
      </CModal>

      <StageFileViewer
        visible={fileOf !== null}
        files={fileOf ? [{ key: String(fileOf.id), label: `Justificatif - ${fileOf.stage.nom_complet}` }] : []}
        initialKey={fileOf ? String(fileOf.id) : null}
        loader={k => stageService.internRequestFile(Number(k))}
        onClose={() => setFileOf(null)}
      />
      <style>{`.stg-info { background: #fffbeb; border: 1px solid #fde68a; color: #78350f; border-radius: 10px; padding: 8px 12px; font-size: .875rem; }`}</style>
    </div>
  )
}

export default DemandesStagiairesPage
