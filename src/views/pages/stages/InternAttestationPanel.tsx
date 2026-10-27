// src/views/pages/stages/InternAttestationPanel.tsx
// Attestation d'un stagiaire dans sa fiche : conditions, attestations,
// préparation anticipée et attestation exceptionnelle (responsable).

import { useCallback, useEffect, useState } from 'react'
import { CButton, CSpinner } from '@coreui/react'
import stageService, { type StageAttestationOverview } from '@/services/stage.service'
import { showSuccess, friendlyError } from '@/components/common/ActionResult'
import AttestationModal, { ATT_STATUS, EligibilityBox } from './AttestationModal'
import ExceptionalAttestationModal from './ExceptionalAttestationModal'
import { frDate } from './stageUtils'

interface Props { stage: { id: number; nom_complet: string }; lead: boolean }

const InternAttestationPanel = ({ stage, lead }: Props) => {
  const [data, setData] = useState<StageAttestationOverview | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)
  const [exceptional, setExceptional] = useState(false)

  const load = useCallback(() => {
    stageService.stageAttestation(stage.id).then(d => { setData(d); setErr(null) }).catch(e => setErr(friendlyError(e)))
  }, [stage.id])
  useEffect(() => { load() }, [load])

  const prepare = async () => {
    setBusy(true); setErr(null)
    try {
      const res: any = await stageService.prepareAttestation(stage.id)
      load()
      setOpenId(res.data.id)
      await showSuccess('Attestation pré-remplie', res?.message)
    } catch (e) {
      setErr(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  if (!data && !err) return <CSpinner size="sm" color="primary" />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {err && <div className="stg-err" style={{ marginBottom: 0 }}>{err}</div>}
      {data && <>
        <EligibilityBox e={data.eligibility} />
        {data.items.length === 0 && (
          <div className="stg-muted">Préparée automatiquement le {frDate(data.prepare_day, true)} (une semaine avant la fin).</div>
        )}
        {data.items.map(a => (
          <button key={a.id} type="button" onClick={() => setOpenId(a.id)}
            style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '.875rem' }}>
            <span style={{ flex: 1, fontWeight: 600 }}>{a.numero ?? a.kind_label}</span>
            <span className="stg-pill" style={{ color: ATT_STATUS[a.status].color, background: ATT_STATUS[a.status].bg }}>{a.status_label}</span>
          </button>
        ))}
        {lead && !data.has_open && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <CButton size="sm" color="primary" variant="outline" disabled={busy} onClick={prepare}>
              {busy && <CSpinner size="sm" className="me-1" />}Préparer l'attestation
            </CButton>
            {!data.eligibility.eligible && (
              <CButton size="sm" color="warning" variant="outline" onClick={() => setExceptional(true)}>Attestation exceptionnelle</CButton>
            )}
          </div>
        )}
      </>}
      <AttestationModal attestationId={openId} lead={lead} onClose={() => setOpenId(null)} onChanged={load} />
      <ExceptionalAttestationModal visible={exceptional} stage={stage} onClose={() => setExceptional(false)}
        onDone={a => { setExceptional(false); load(); setOpenId(a.id) }} />
    </div>
  )
}

export default InternAttestationPanel
