// src/views/pages/stages/BibliothequePage.tsx
// Bibliothèque des travaux : ce que les stagiaires proposent, les brouillons,
// ce qui est publié. « Reprendre » un rapport final validé ou un mémoire
// soutenu ; « Ajouter » un travail à la main. Chaque fiche s'ouvre dans sa page.

import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  CButton, CCard, CCardBody, CFormInput, CInputGroup, CInputGroupText, CSpinner,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilReload, cilSearch, cilX, cilCloudDownload } from '@coreui/icons'
import bibliothequeService, { type Candidate, type WorkRow, type WorkStatus } from '@/services/bibliotheque.service'
import { showError, friendlyError } from '@/components/common/ActionResult'
import { PageHead, Empty, Pill, StagesStyles, FilterTabs } from './StagesUi'
import { WORK_STATUS, frDate } from './stageUtils'

type Tab = 'all' | WorkStatus
const TABS: Record<Tab, string> = { proposed: 'À traiter', draft: 'Brouillons', published: 'Publiés', unpublished: 'Retirés', all: 'Tous' }

const BibliothequePage = () => {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const asked = params.get('onglet') as Tab | null
  const tab: Tab = asked && asked in TABS ? asked : 'proposed'
  const setTab = (t: Tab) => setParams(p => { const n = new URLSearchParams(p); n.set('onglet', t); return n }, { replace: true })

  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [data, setData] = useState<{ works: WorkRow[]; counts: Partial<Record<WorkStatus, number>> } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)

  useEffect(() => { const t = window.setTimeout(() => setSearch(q.trim()), 350); return () => window.clearTimeout(t) }, [q])

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setData(await bibliothequeService.list(tab === 'all' ? undefined : tab, search)) } catch (e) { setError(friendlyError(e)) } finally { setLoading(false) }
  }, [tab, search])
  useEffect(() => { load() }, [load])

  const counts = data?.counts ?? {}
  const total = Object.values(counts).reduce((a, b) => a + (b ?? 0), 0)
  const open = (id: number | 'nouveau') => navigate(`/stages/bibliotheque/${id}`, { state: { from: `/stages/bibliotheque?onglet=${tab}`, fromLabel: `Bibliothèque · ${TABS[tab]}` } })

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title={`Bibliothèque · ${TABS[tab]}`}
        subtitle="Rapports de fin de formation et mémoires. Vous seul décidez de ce qui est publié."
        actions={<>
          <CButton color="secondary" variant="outline" size="sm" onClick={load} disabled={loading} title="Actualiser"><CIcon icon={cilReload} /></CButton>
          <CButton color="primary" variant="outline" size="sm" onClick={() => setPicking(true)}><CIcon icon={cilCloudDownload} className="me-1" />Reprendre un travail</CButton>
          <CButton color="primary" size="sm" onClick={() => open('nouveau')}><CIcon icon={cilPlus} className="me-1" />Ajouter un travail</CButton>
        </>}
      />

      <FilterTabs
        options={(Object.keys(TABS) as Tab[]).map(k => ({ key: k, label: TABS[k], count: k === 'all' ? total : counts[k] ?? 0 }))}
        value={tab}
        onChange={setTab}
      />

      <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <CCardBody>
          <CInputGroup style={{ marginBottom: 12 }}>
            <CInputGroupText style={{ background: '#fff' }}><CIcon icon={cilSearch} style={{ width: 16, color: '#94a3b8' }} /></CInputGroupText>
            <CFormInput value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher : titre, auteur, mot-clé, filière…" maxLength={100} />
            {q && <CButton color="secondary" variant="outline" onClick={() => setQ('')} title="Effacer"><CIcon icon={cilX} /></CButton>}
          </CInputGroup>

          {error && <div className="stg-err">{error}</div>}
          {!data && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
          {data && data.works.length === 0 && (
            <Empty text={tab === 'proposed'
              ? 'Aucune proposition. Les stagiaires proposent leur rapport de fin de formation en déposant leur rapport final.'
              : `Rien dans « ${TABS[tab]} ».`} />
          )}

          {data && data.works.length > 0 && (
            <div style={{ overflowX: 'auto', opacity: loading ? 0.6 : 1 }}>
              <table className="stg-table" style={{ minWidth: 820 }}>
                <thead><tr><th>Travail</th><th>Formation</th><th>Statut</th><th>Lectures</th><th /></tr></thead>
                <tbody>
                  {data.works.map(w => (
                    <tr key={w.id}>
                      <td style={{ maxWidth: 420 }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{w.title}</div>
                        <div className="stg-muted">{w.kind_label}{w.year ? ` · ${w.year}` : ''} · {w.authors || 'Auteur à indiquer'}</div>
                      </td>
                      <td className="stg-muted">{w.formation || '-'}</td>
                      <td>
                        <Pill color={WORK_STATUS[w.status].color} bg={WORK_STATUS[w.status].bg}>{w.status_label}</Pill>
                        {w.status === 'published' && <div className="stg-muted">{w.visibility === 'public' ? 'Public' : 'Par lien'} · {frDate(w.published_at)}</div>}
                      </td>
                      <td className="stg-muted">{w.status === 'published' ? `${w.views} vue(s) · ${w.downloads} PDF` : '-'}</td>
                      <td style={{ textAlign: 'right' }}><CButton size="sm" color="primary" onClick={() => open(w.id)}>Ouvrir</CButton></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CCardBody>
      </CCard>

      <CandidatesModal visible={picking} onClose={() => setPicking(false)} onPicked={id => { setPicking(false); open(id) }} />
    </div>
  )
}

/** Rapports finaux validés et mémoires soutenus pas encore dans la bibliothèque. */
const CandidatesModal = ({ visible, onClose, onPicked }: { visible: boolean; onClose: () => void; onPicked: (id: number) => void }) => {
  const [list, setList] = useState<{ reports: Candidate[]; defenses: Candidate[] } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setList(null)
    bibliothequeService.candidates().then(setList).catch(e => { onClose(); showError('Chargement impossible', friendlyError(e)) })
  }, [visible, onClose])

  const pick = async (c: Candidate) => {
    setBusy(`${c.type}-${c.id}`)
    try { onPicked((await bibliothequeService.import(c.type, c.id)).id) } catch (e) { await showError('Action impossible', friendlyError(e)) } finally { setBusy(null) }
  }

  return (
    <CModal visible={visible} onClose={onClose} size="lg" alignment="center" scrollable fullscreen="md">
      <CModalHeader><CModalTitle style={{ fontSize: '1rem' }}>Reprendre un travail</CModalTitle></CModalHeader>
      <CModalBody>
        {!list && <CSpinner size="sm" color="primary" />}
        {list && <>
          <CandidateList title="Rapports finaux validés" items={list.reports} busy={busy} onPick={pick}
            empty="Aucun rapport final validé en attente (ceux proposés par les stagiaires sont déjà dans « À traiter »)." />
          <CandidateList title="Mémoires soutenus" items={list.defenses} busy={busy} onPick={pick} empty="Aucun mémoire soutenu en attente." />
        </>}
      </CModalBody>
      <CModalFooter><CButton color="secondary" variant="ghost" onClick={onClose}>Fermer</CButton></CModalFooter>
    </CModal>
  )
}

const CandidateList = ({ title, items, empty, busy, onPick }: {
  title: string; items: Candidate[]; empty: string; busy: string | null; onPick: (c: Candidate) => void
}) => (
  <div style={{ marginBottom: 16 }}>
    <strong>{title}</strong>
    {items.length === 0 ? <div className="stg-muted" style={{ marginTop: 6 }}>{empty}</div> : items.map(c => (
      <div key={`${c.type}-${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>{c.title}</div>
          <div className="stg-muted">{c.authors} · {c.reference}{c.year ? ` · ${c.year}` : ''}{c.detail ? ` · ${c.detail}` : ''}</div>
        </div>
        <CButton size="sm" color="primary" variant="outline" disabled={!!busy} onClick={() => onPick(c)}>
          {busy === `${c.type}-${c.id}` && <CSpinner size="sm" className="me-1" />}Reprendre
        </CButton>
      </div>
    ))}
  </div>
)

export default BibliothequePage
