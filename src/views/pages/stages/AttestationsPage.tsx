// src/views/pages/stages/AttestationsPage.tsx
// Attestations de stage : le responsable valide, le secrétariat imprime,
// remet (date) et archive le scan.

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CButton, CCard, CCardBody, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload, cilBadge } from '@coreui/icons'
import stageService, { type Attestation, type AttestationStatus } from '@/services/stage.service'
import { friendlyError } from '@/components/common/ActionResult'
import { useAuth } from '@/contexts'
import { PageHead, Empty, Pill, StagesStyles } from './StagesUi'
import { isStagesLead } from './StagesGuard'
import AttestationModal, { ATT_STATUS } from './AttestationModal'
import { frDate, frDateTime } from './stageUtils'

const FILTERS: [AttestationStatus | 'all', string][] = [
  ['a_valider', 'À valider'], ['a_imprimer', 'À imprimer'], ['imprimee', 'À remettre'], ['remise', 'Remises'], ['annulee', 'Annulées'], ['all', 'Toutes'],
]

const AttestationsPage = () => {
  const { role } = useAuth()
  const lead = isStagesLead(role as string)
  const [params, setParams] = useSearchParams()
  const [status, setStatus] = useState<string>(lead ? 'a_valider' : 'a_imprimer')
  const [rows, setRows] = useState<Attestation[] | null>(null)
  const [counts, setCounts] = useState<Partial<Record<AttestationStatus, number>>>({})
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<number | null>(() => (params.get('attestation') ? Number(params.get('attestation')) : null))

  const load = useCallback(async () => {
    setError(null)
    try {
      const r = await stageService.attestations(status)
      setRows(r.data); setCounts(r.counts)
    } catch (e) { setError(friendlyError(e)) }
  }, [status])
  useEffect(() => { load() }, [load])

  const close = () => {
    setOpenId(null)
    if (params.has('attestation')) { params.delete('attestation'); setParams(params, { replace: true }) }
  }

  const filters = FILTERS.filter(([k]) => lead || !['a_valider', 'annulee'].includes(k))
  const todo = lead ? (counts.a_valider ?? 0) : (counts.a_imprimer ?? 0) + (counts.imprimee ?? 0)

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title="Attestations de stage"
        subtitle={lead
          ? `${todo} attestation(s) à valider. Après validation, le secrétariat imprime et remet l'attestation.`
          : `${todo} attestation(s) à imprimer ou à remettre.`}
        actions={<CButton color="secondary" variant="outline" size="sm" onClick={load} title="Actualiser"><CIcon icon={cilReload} /></CButton>}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {filters.map(([k, l]) => (
          <CButton key={k} size="sm" color="primary" variant={status === k ? undefined : 'outline'} onClick={() => setStatus(k)}>
            {l}{k !== 'all' && counts[k as AttestationStatus] ? ` (${counts[k as AttestationStatus]})` : ''}
          </CButton>
        ))}
      </div>

      {error && <div className="stg-err">{error}</div>}
      {!rows && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
      {rows && rows.length === 0 && <CCard className="border-0 shadow-sm"><CCardBody><Empty text="Aucune attestation dans cette catégorie." /></CCardBody></CCard>}

      <div className="stg-list">
        {rows?.map(a => (
          <button key={a.id} type="button" className="stg-card stg-row2" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={() => setOpenId(a.id)}>
            <span style={{ width: 38, height: 38, borderRadius: 10, background: ATT_STATUS[a.status].bg, color: ATT_STATUS[a.status].color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CIcon icon={cilBadge} style={{ width: 18 }} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ color: '#0f172a' }}>{a.stage?.nom_complet}</strong>
              <span className="stg-muted" style={{ display: 'block' }}>
                {a.numero ? `N° ${a.numero} · ` : ''}{a.kind !== 'normale' ? `${a.kind_label} · ` : ''}fin du stage le {frDate(a.stage?.date_fin)}
                {a.delivered_on ? ` · remise le ${frDate(a.delivered_on)}` : ''}
              </span>
            </span>
            <Pill color={ATT_STATUS[a.status].color} bg={ATT_STATUS[a.status].bg}>{a.status_label}</Pill>
            <span className="stg-muted">{frDateTime(a.updated_at)}</span>
          </button>
        ))}
      </div>

      <AttestationModal attestationId={openId} lead={lead} onClose={close} onChanged={load} />
    </div>
  )
}

export default AttestationsPage
