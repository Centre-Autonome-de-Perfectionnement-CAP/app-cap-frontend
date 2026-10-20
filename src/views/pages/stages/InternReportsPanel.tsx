// src/views/pages/stages/InternReportsPanel.tsx
// Rapports d'un stagiaire dans sa fiche : état de chaque période.
import { useCallback, useEffect, useState } from 'react'
import { CSpinner } from '@coreui/react'
import stageService, { type ReportsOverview, type ReportPeriod } from '@/services/stage.service'
import { friendlyError } from '@/components/common/ActionResult'
import ReportModal from './ReportModal'
import { frDate } from './stageUtils'

const STATE: Record<ReportPeriod['state'], { label: string; color: string; bg: string }> = {
  upcoming:  { label: 'À venir',    color: '#64748b', bg: '#f1f5f9' },
  open:      { label: 'Attendu',    color: '#d97706', bg: '#fffbeb' },
  missing:   { label: 'Non déposé', color: '#e11d48', bg: '#fff1f2' },
  deposited: { label: 'À examiner', color: '#2563eb', bg: '#eff6ff' },
  validated: { label: 'Validé',     color: '#059669', bg: '#ecfdf5' },
  to_fix:    { label: 'À corriger', color: '#ea580c', bg: '#fff7ed' },
}

const InternReportsPanel = ({ stageId }: { stageId: number }) => {
  const [data, setData] = useState<ReportsOverview | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)

  const load = useCallback(() => {
    stageService.internReports(stageId).then(setData).catch(e => setErr(friendlyError(e)))
  }, [stageId])
  useEffect(() => { load() }, [load])

  if (err) return <div className="stg-error">{err}</div>
  if (!data) return <CSpinner size="sm" color="primary" />

  const rows = [...(data.final ? [data.final] : []), ...[...data.items].reverse()]
  return (
    <div>
      <div className="stg-muted" style={{ marginBottom: 8 }}>
        Fréquence : {data.frequency} · {data.stats.deposited} déposé(s), {data.stats.validated} validé(s), {data.stats.missing} manquant(s)
        · rapport final {data.stats.final_validated ? 'validé' : 'non validé'}
      </div>
      {rows.slice(0, 12).map(p => (
        <button key={p.key} type="button" disabled={!p.report} onClick={() => p.report && setOpenId(p.report.id)}
          style={{ all: 'unset', display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 0', borderBottom: '1px solid #f1f5f9', cursor: p.report ? 'pointer' : 'default', fontSize: '.85rem' }}>
          <span style={{ flex: 1, fontWeight: p.kind === 'final' ? 800 : 600 }}>{p.label}</span>
          <span className="stg-muted">{p.report ? `v${p.report.current_version}` : p.closes ? `avant le ${frDate(p.closes)}` : ''}</span>
          <span className="stg-pill" style={{ color: STATE[p.state].color, background: STATE[p.state].bg }}>{STATE[p.state].label}</span>
        </button>
      ))}
      <ReportModal reportId={openId} onClose={() => setOpenId(null)} onChanged={load} />
    </div>
  )
}

export default InternReportsPanel
