// src/views/pages/stages/SuiviPage.tsx
// Suivi global des stagiaires : assiduité, rapports, attestation, sur une
// seule vue, exportable en Excel.

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CButton, CCard, CCardBody, CFormInput, CInputGroup, CInputGroupText, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch, cilReload } from '@coreui/icons'
import stageService, { type FollowRow, type InternScope } from '@/services/stage.service'
import { friendlyError } from '@/components/common/ActionResult'
import { useAuth } from '@/contexts'
import { isStagesLead } from './StagesGuard'
import StageDetailModal from './StageDetailModal'
import { ATT_STATUS } from './AttestationModal'
import { PageHead, Empty, Pill, StagesStyles, ExportButton } from './StagesUi'
import { frDate } from './stageUtils'

const SCOPES: [InternScope, string][] = [
  ['mine', 'Mes stagiaires'], ['current', 'En cours'], ['upcoming', 'À venir'], ['finished', 'Terminés'], ['unsupervised', 'Sans superviseur'], ['all', 'Tous'],
]

const SuiviPage = () => {
  const { role } = useAuth()
  const lead = isStagesLead(role as string)
  const [params] = useSearchParams()
  const initial = SCOPES.some(([k]) => k === params.get('scope')) ? (params.get('scope') as InternScope) : (lead ? 'current' : 'mine')
  const [scope, setScope] = useState<InternScope>(initial)
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<FollowRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)
  const [seuil, setSeuil] = useState(80)

  useEffect(() => { const t = setTimeout(() => setSearch(q), 350); return () => clearTimeout(t) }, [q])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { const r = await stageService.follow(scope, search); setRows(r.data); setSeuil(r.seuil) } catch (e) { setError(friendlyError(e)) } finally { setLoading(false) }
  }, [scope, search])
  useEffect(() => { load() }, [load])

  const scopes = SCOPES.filter(([k]) => lead ? k !== 'mine' : true)
  const exportPath = `stagiaires?scope=${scope}${search.trim() ? `&q=${encodeURIComponent(search.trim())}` : ''}`

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title="Suivi des stagiaires"
        subtitle="Assiduité, rapports et attestation de chaque stagiaire."
        actions={<>
          <ExportButton path={exportPath} />
          <CButton color="secondary" variant="outline" size="sm" onClick={load} disabled={loading} title="Actualiser"><CIcon icon={cilReload} /></CButton>
        </>}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {scopes.map(([k, l]) => (
          <CButton key={k} size="sm" color="primary" variant={scope === k ? undefined : 'outline'} onClick={() => setScope(k)}>{l}</CButton>
        ))}
        <CInputGroup size="sm" style={{ maxWidth: 300, marginLeft: 'auto' }}>
          <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
          <CFormInput placeholder="Nom, référence, établissement…" value={q} onChange={e => setQ(e.target.value)} maxLength={100} />
        </CInputGroup>
      </div>

      {error && <div className="stg-err">{error}</div>}
      <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <CCardBody style={{ padding: 0 }}>
          {!rows && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
          {rows && rows.length === 0 && <Empty text="Aucun stagiaire dans cette catégorie." />}
          {rows && rows.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="sv-table">
                <thead>
                  <tr>
                    <th>Stagiaire</th><th>Période</th><th>Superviseur(s)</th><th>Assiduité</th><th>Rapports</th><th>Rapport final</th><th>Attestation</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.id} onClick={() => setOpenId(r.id)} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter') setOpenId(r.id) }}>
                      <td>
                        <strong style={{ color: '#0f172a' }}>{r.nom_complet}</strong>
                        <div className="stg-muted">{r.reference} · {r.etablissement}</div>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {frDate(r.date_debut_reelle ?? r.date_debut)} → {frDate(r.date_fin)}
                        {r.fin_proche && <div><Pill color="#7c3aed" bg="#f5f3ff">Fin proche</Pill></div>}
                      </td>
                      <td>{r.supervisors.length ? r.supervisors.map(s => s.name).join(', ') : <span style={{ color: '#d97706' }}>Aucun</span>}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {!r.activated ? <span className="stg-muted">{r.phase === 'upcoming' ? 'Pas commencé' : 'Non activé'}</span>
                          : r.taux === null ? <span className="stg-muted">—</span>
                            : <>
                              <strong style={{ color: r.jours_ouvres >= 5 && r.taux < seuil ? '#c2410c' : '#047857' }}>{r.taux} %</strong>
                              <div className="stg-muted">{r.absences} abs. · {r.retards} retard(s)</div>
                            </>}
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {r.activated ? <>
                          {r.rapports.validated}/{r.rapports.deposited} validé(s)
                          {r.rapports.missing > 0 && <div style={{ color: '#be123c', fontSize: '.875rem' }}>{r.rapports.missing} manquant(s)</div>}
                        </> : <span className="stg-muted">—</span>}
                      </td>
                      <td>{r.rapports.final_validated
                        ? <Pill color="#047857" bg="#ecfdf5">Validé</Pill>
                        : <span className="stg-muted">Non validé</span>}</td>
                      <td>{r.attestation
                        ? <Pill color={ATT_STATUS[r.attestation.status].color} bg={ATT_STATUS[r.attestation.status].bg}>{r.attestation.numero ?? r.attestation.label}</Pill>
                        : <span className="stg-muted">—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CCardBody>
      </CCard>

      <StageDetailModal idOrRef={openId} onClose={() => setOpenId(null)} onChanged={load} />
      <style>{`
        .sv-table { width: 100%; border-collapse: collapse; font-size: .88rem; min-width: 900px; }
        .sv-table th { text-align: left; font-size: .875rem; text-transform: uppercase; letter-spacing: .03em; color: #64748b; background: #f8fafc; padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
        .sv-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; color: #334155; }
        .sv-table tbody tr { cursor: pointer; }
        .sv-table tbody tr:hover { background: #f8fafc; }
        .sv-table tbody tr:focus-visible { outline: 2px solid #0f766e; outline-offset: -2px; }
      `}</style>
    </div>
  )
}

export default SuiviPage
