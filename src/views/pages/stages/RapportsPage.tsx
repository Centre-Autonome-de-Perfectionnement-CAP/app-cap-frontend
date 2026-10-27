// src/views/pages/stages/RapportsPage.tsx
// Rapports déposés par les stagiaires : à lire, commenter, valider.

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CButton, CCard, CCardBody, CFormCheck, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload, cilDescription } from '@coreui/icons'
import stageService, { type ReportSummary } from '@/services/stage.service'
import { friendlyError } from '@/components/common/ActionResult'
import { useAuth } from '@/contexts'
import { PageHead, Empty, Pill, StagesStyles } from './StagesUi'
import { frDateTime } from './stageUtils'
import ReportModal from './ReportModal'

const STATUS: Record<ReportSummary['status'], { color: string; bg: string }> = {
  submitted:           { color: '#2563eb', bg: '#eff6ff' },
  supervisor_approved: { color: '#059669', bg: '#ecfdf5' },
  supervisor_rejected: { color: '#ea580c', bg: '#fff7ed' },
  approved:            { color: '#047857', bg: '#d1fae5' },
  rejected:            { color: '#e11d48', bg: '#fff1f2' },
}

const FILTERS = [['to_review', 'À examiner'], ['approved', 'Validés'], ['rejected', 'À corriger'], ['all', 'Tous']] as const

const RapportsPage = () => {
  const { role } = useAuth()
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState<string>('to_review')
  const [mine, setMine] = useState(role === 'superviseur')
  const [rows, setRows] = useState<ReportSummary[] | null>(null)
  const [toReview, setToReview] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<number | null>(() => (params.get('rapport') ? Number(params.get('rapport')) : null))

  const load = useCallback(async () => {
    setError(null)
    try {
      const r = await stageService.reports(status, mine)
      setRows(r.data); setToReview(r.to_review)
    } catch (e) { setError(friendlyError(e)) }
  }, [status, mine])
  useEffect(() => { load() }, [load])

  const close = () => {
    setOpenId(null)
    if (params.has('rapport')) { params.delete('rapport'); setParams(params, { replace: true }) }
  }

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title="Rapports des stagiaires"
        subtitle={`${toReview} rapport(s) à examiner. Le responsable de division a le dernier mot.`}
        actions={<CButton color="secondary" variant="outline" size="sm" onClick={load} title="Actualiser"><CIcon icon={cilReload} /></CButton>}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {FILTERS.map(([k, l]) => (
          <CButton key={k} size="sm" color="primary" variant={status === k ? undefined : 'outline'} onClick={() => setStatus(k)}>{l}</CButton>
        ))}
        <CFormCheck className="ms-2" id="rpt-mine" label="Seulement mes stagiaires" checked={mine} onChange={e => setMine(e.target.checked)} />
      </div>

      {error && <div className="stg-err">{error}</div>}
      {!rows && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
      {rows && rows.length === 0 && <CCard className="border-0 shadow-sm"><CCardBody><Empty text="Aucun rapport dans cette catégorie." /></CCardBody></CCard>}

      <div className="stg-list">
        {rows?.map(r => (
          <button key={r.id} type="button" className="stg-card stg-row2" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setOpenId(r.id)}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: r.kind === 'final' ? '#f5f3ff' : '#f0fdfa', color: r.kind === 'final' ? '#7c3aed' : '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CIcon icon={cilDescription} style={{ width: 18 }} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ color: '#0f172a' }}>{r.stage?.nom_complet}</strong>
              <span className="stg-muted" style={{ display: 'block' }}>{r.label} · version {r.current_version}{r.late ? ' · en retard' : ''}</span>
            </span>
            <Pill color={STATUS[r.status].color} bg={STATUS[r.status].bg}>{r.status_label}</Pill>
            <span className="stg-muted">{frDateTime(r.submitted_at)}</span>
          </button>
        ))}
      </div>

      <ReportModal reportId={openId} onClose={close} onChanged={load} />
    </div>
  )
}

export default RapportsPage
