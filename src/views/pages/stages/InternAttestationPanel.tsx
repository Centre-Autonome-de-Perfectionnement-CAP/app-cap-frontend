// src/views/pages/stages/InternAttestationPanel.tsx
// Attestations d'un stagiaire dans sa fiche : conditions et attestation de
// stage (préparation anticipée, attestation exceptionnelle), puis, pour un
// ancien stagiaire venu travailler au CAP, ses attestations de service fait.
// Chaque attestation est une carte qui s'ouvre d'un clic.

import { useCallback, useEffect, useState } from 'react'
import { CButton, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBadge, cilChevronRight } from '@coreui/icons'
import stageService, { type StageAttestationOverview, type WorkAttestation } from '@/services/stage.service'
import { showSuccess, friendlyError } from '@/components/common/ActionResult'
import AttestationModal, { ATT_STATUS, EligibilityBox } from './AttestationModal'
import ExceptionalAttestationModal from './ExceptionalAttestationModal'
import WorkAttestationModal, { WORK_STATUS } from './WorkAttestationModal'
import WorkAttestationButton from './WorkAttestationButton'
import { frDate, frDateTime } from './stageUtils'

interface Props { stage: { id: number; nom_complet: string; whatsapp: string | null }; lead: boolean }

/** Une attestation : carte cliquable (survol, flèche, « Ouvrir »). */
const AttestationCard = ({ title, detail, tone, label, onOpen }: {
  title: string; detail: string; tone: { color: string; bg: string }; label: string; onOpen: () => void
}) => (
  <button type="button" className="att-card" onClick={onOpen} title="Ouvrir l'attestation">
    <span className="att-card-ico" style={{ color: tone.color, background: tone.bg }}><CIcon icon={cilBadge} style={{ width: 18 }} /></span>
    <span style={{ flex: 1, minWidth: 0 }}>
      <strong style={{ color: '#0f172a', display: 'block' }}>{title}</strong>
      <span className="stg-muted">{detail}</span>
    </span>
    <span className="stg-pill" style={{ color: tone.color, background: tone.bg }}>{label}</span>
    <span className="att-card-open">Ouvrir <CIcon icon={cilChevronRight} style={{ width: 14 }} /></span>
  </button>
)

const InternAttestationPanel = ({ stage, lead }: Props) => {
  const [data, setData] = useState<StageAttestationOverview | null>(null)
  const [works, setWorks] = useState<WorkAttestation[] | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)
  const [workId, setWorkId] = useState<number | null>(null)
  const [exceptional, setExceptional] = useState(false)

  const load = useCallback(() => {
    stageService.stageAttestation(stage.id).then(d => { setData(d); setErr(null) }).catch(e => setErr(friendlyError(e)))
    if (lead) stageService.stageWorkAttestations(stage.id).then(setWorks).catch(() => setWorks([]))
  }, [stage.id, lead])
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {err && <div className="stg-err" style={{ marginBottom: 0 }}>{err}</div>}
      {data && <>
        <div className="att-sec">Attestation de stage</div>
        <EligibilityBox e={data.eligibility} />
        {data.items.length === 0 && (
          <div className="stg-muted">Préparée automatiquement le {frDate(data.prepare_day, true)} (une semaine avant la fin).</div>
        )}
        {data.items.map(a => (
          <AttestationCard key={a.id} onOpen={() => setOpenId(a.id)} tone={ATT_STATUS[a.status]} label={a.status_label}
            title={a.numero ? `Attestation N° ${a.numero}` : `Attestation de stage${a.kind !== 'normale' ? ` (${a.kind_label.toLowerCase()})` : ''}`}
            detail={a.delivered_on ? `Remise le ${frDate(a.delivered_on, true)}` : `Mise à jour le ${frDateTime(a.updated_at)}`} />
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

      {lead && (
        <>
          <div className="att-sec" style={{ marginTop: 8 }}>Attestations de service fait</div>
          <div className="stg-muted">Pour un ancien stagiaire venu ensuite travailler au CAP.</div>
          {works?.map(w => (
            <AttestationCard key={w.id} onOpen={() => setWorkId(w.id)} tone={WORK_STATUS[w.status]} label={w.status_label}
              title={w.numero ? `Attestation de service fait N° ${w.numero}` : 'Attestation de service fait'}
              detail={w.date_debut ? `Du ${frDate(w.date_debut)} au ${frDate(w.date_fin)}` : w.status === 'invitee' ? `Lien valable jusqu'au ${frDate(w.expires_at)}` : 'Période à compléter'} />
          ))}
          <div><WorkAttestationButton stage={stage} onCreated={(id, mode) => { load(); if (mode === 'remplir') setWorkId(id) }} /></div>
        </>
      )}

      <AttestationModal attestationId={openId} lead={lead} onClose={() => setOpenId(null)} onChanged={load} />
      {lead && <WorkAttestationModal attestationId={workId} lead={lead} onClose={() => setWorkId(null)} onChanged={load} />}
      <ExceptionalAttestationModal visible={exceptional} stage={stage} onClose={() => setExceptional(false)}
        onDone={a => { setExceptional(false); load(); setOpenId(a.id) }} />
      <style>{`
        .att-sec { font-weight: 800; color: #0f172a; font-size: .95rem; }
        .att-card { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; width: 100%;
          padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; cursor: pointer; transition: border-color .15s, box-shadow .15s; }
        .att-card:hover, .att-card:focus-visible { border-color: #0f766e; box-shadow: 0 2px 10px rgba(15, 118, 110, .12); }
        .att-card-ico { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .att-card-open { color: #0f766e; font-weight: 700; font-size: .875rem; display: inline-flex; align-items: center; gap: 2px; }
      `}</style>
    </div>
  )
}

export default InternAttestationPanel
