// src/views/pages/stages/BinomesPage.tsx
// Binômes : toujours deux stagiaires. Quatre listes, comme la page des
// stagiaires : binômes formés (avec leur origine), demandes de stage faites en
// binôme et encore à l'étude, propositions entre stagiaires en attente de
// réponse, et stagiaires sans binôme (en cocher deux pour les réunir).

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CButton, CCard, CCardBody, CFormCheck, CFormInput, CFormLabel, CFormSelect, CInputGroup, CInputGroupText, CSpinner,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilReload, cilSearch, cilX } from '@coreui/icons'
import stageService, { type BinomesOverview, type BinomeMember, type StageTeam } from '@/services/stage.service'
import { showSuccess, showError, friendlyError } from '@/components/common/ActionResult'
import { PageHead, Empty, Pill, StagesStyles, FilterTabs, useOpenDossier } from './StagesUi'
import { frDate } from './stageUtils'

type Tab = 'binomes' | 'demandes' | 'propositions' | 'libres'
const TABS: Record<Tab, string> = {
  binomes: 'Binômes', demandes: 'Demandes en binôme', propositions: 'Propositions en attente', libres: 'Sans binôme',
}
const ORIGIN: Record<StageTeam['origin'], { label: string; color: string; bg: string }> = {
  responsable: { label: 'Formé par le responsable', color: '#0f766e', bg: '#f0fdfa' },
  stagiaires: { label: 'Choisi par les stagiaires', color: '#1d4ed8', bg: '#eff6ff' },
  demande: { label: 'Demandé en binôme', color: '#7c3aed', bg: '#f5f3ff' },
}

const matches = (q: string, people: BinomeMember[]) =>
  !q || people.some(m => `${m.nom_complet} ${m.reference} ${m.etablissement ?? ''}`.toLowerCase().includes(q))

/** Référence et nom ; ouvre le dossier. */
const PersonLink = ({ m, onOpen }: { m: BinomeMember; onOpen: (ref: string) => void }) => (
  <button type="button" className="bin-person" onClick={() => onOpen(m.reference)} title="Ouvrir le dossier">
    <span className="stg-ref">{m.reference}</span><span className="bin-name">{m.nom_complet}</span>
  </button>
)

const BinomesPage = () => {
  const [params, setParams] = useSearchParams()
  const asked = params.get('onglet') as Tab | null
  const tab: Tab = asked && asked in TABS ? asked : 'binomes'
  const setTab = (t: Tab) => setParams(p => { const n = new URLSearchParams(p); n.set('onglet', t); return n }, { replace: true })

  const [data, setData] = useState<BinomesOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<number[]>([])
  const [forming, setForming] = useState(false)
  const [dissolving, setDissolving] = useState<StageTeam | null>(null)
  const [busy, setBusy] = useState(false)
  const openDossier = useOpenDossier(`Binômes · ${TABS[tab]}`)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setData(await stageService.binomes()) } catch (e) { setError(friendlyError(e)) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])
  useEffect(() => { setSelected([]) }, [tab])

  const needle = q.trim().toLowerCase()
  const lists = useMemo(() => data && {
    binomes: data.teams.filter(t => matches(needle, t.members) || t.name.toLowerCase().includes(needle)),
    demandes: data.requests.filter(t => matches(needle, t.members)),
    propositions: data.invites.filter(i => matches(needle, [i.from, i.to])),
    libres: data.candidates.filter(m => matches(needle, [m])),
  }, [data, needle])

  const dissolve = async () => {
    if (!dissolving) return
    setBusy(true)
    try {
      const res: any = await stageService.dissolveBinome(dissolving.id)
      setDissolving(null)
      await load()
      await showSuccess('Binôme défait', res?.message)
    } catch (e) {
      await showError('Action impossible', friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  const toggle = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : s.length < 2 ? [...s, id] : [s[1], id])
  const pair = selected.length === 2 ? [selected[0], selected[1]] as [number, number] : undefined

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title={tab === 'binomes' ? 'Binômes' : `Binômes · ${TABS[tab]}`}
        subtitle="Toujours deux stagiaires. Un clic sur un nom ouvre son dossier."
        actions={<>
          <CButton color="secondary" variant="outline" size="sm" onClick={load} disabled={loading} title="Actualiser"><CIcon icon={cilReload} /></CButton>
          <CButton color="primary" size="sm" disabled={!data || data.candidates.length < 2} onClick={() => { setSelected([]); setForming(true) }}>
            <CIcon icon={cilPlus} className="me-1" />Former un binôme
          </CButton>
        </>}
      />

      <FilterTabs
        options={(Object.keys(TABS) as Tab[]).map(k => ({ key: k, label: TABS[k], count: lists?.[k].length }))}
        value={tab}
        onChange={setTab}
      />

      <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <CCardBody>
          <CInputGroup style={{ marginBottom: 12 }}>
            <CInputGroupText style={{ background: '#fff' }}><CIcon icon={cilSearch} style={{ width: 16, color: '#94a3b8' }} /></CInputGroupText>
            <CFormInput value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher : nom, référence, établissement…" maxLength={100} />
            {q && <CButton color="secondary" variant="outline" onClick={() => setQ('')} title="Effacer"><CIcon icon={cilX} /></CButton>}
          </CInputGroup>

          {error && <div className="stg-err">{error}</div>}
          {!data && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}

          {lists && tab === 'binomes' && (lists.binomes.length === 0
            ? <Empty text={needle ? 'Aucun binôme ne correspond à la recherche.' : 'Aucun binôme pour l\'instant. Les stagiaires peuvent aussi en proposer un depuis leur espace.'} />
            : (
              <div style={{ overflowX: 'auto' }}>
                <table className="stg-table" style={{ minWidth: 760 }}>
                  <thead><tr><th>Binôme</th><th>Stagiaires</th><th>Fin de stage</th><th>Formé le</th><th /></tr></thead>
                  <tbody>
                    {lists.binomes.map(t => (
                      <tr key={t.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{t.name}</div>
                          <Pill color={ORIGIN[t.origin].color} bg={ORIGIN[t.origin].bg}>{ORIGIN[t.origin].label}</Pill>
                        </td>
                        <td>{t.members.map(m => <PersonLink key={m.id} m={m} onOpen={openDossier} />)}</td>
                        <td>{t.members.map(m => <div key={m.id} className="bin-line">{frDate(m.date_fin)}</div>)}</td>
                        <td className="stg-muted">{frDate(t.created_at)}</td>
                        <td style={{ textAlign: 'right' }}><CButton size="sm" color="danger" variant="ghost" onClick={() => setDissolving(t)}>Défaire</CButton></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {lists && tab === 'demandes' && (lists.demandes.length === 0
            ? <Empty text="Aucune demande de stage en binôme à l'étude." />
            : (
              <div style={{ overflowX: 'auto' }}>
                <table className="stg-table" style={{ minWidth: 640 }}>
                  <thead><tr><th>Demandeurs</th><th>Reçue le</th><th>À savoir</th></tr></thead>
                  <tbody>
                    {lists.demandes.map(t => (
                      <tr key={t.id}>
                        <td>{t.members.map(m => <PersonLink key={m.id} m={m} onOpen={openDossier} />)}</td>
                        <td className="stg-muted">{frDate(t.created_at)}</td>
                        <td className="stg-muted">Les deux demandes sont décidées ensemble, aux mêmes service et dates.</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {lists && tab === 'propositions' && (lists.propositions.length === 0
            ? <Empty text="Aucune proposition de binôme en attente de réponse." />
            : (
              <div style={{ overflowX: 'auto' }}>
                <table className="stg-table" style={{ minWidth: 700 }}>
                  <thead><tr><th>Proposé par</th><th>À</th><th>Étape</th><th>Sans réponse, expire le</th></tr></thead>
                  <tbody>
                    {lists.propositions.map(i => (
                      <tr key={i.id}>
                        <td><PersonLink m={i.from} onOpen={openDossier} /></td>
                        <td><PersonLink m={i.to} onOpen={openDossier} /></td>
                        <td>{i.phase === 'demande' ? 'Demande de stage' : 'En stage'}</td>
                        <td className="stg-muted">{frDate(i.expires_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {lists && tab === 'libres' && (lists.libres.length === 0
            ? <Empty text="Tous les stagiaires en cours ou à venir sont en binôme." />
            : (
              <>
                <div className="stg-muted" style={{ marginBottom: 8 }}>Cochez deux stagiaires pour les réunir en binôme.</div>
                <div style={{ overflowX: 'auto' }}>
                  <table className="stg-table" style={{ minWidth: 640 }}>
                    <thead><tr><th style={{ width: 34 }} /><th>Stagiaire</th><th>Établissement</th><th>Période</th></tr></thead>
                    <tbody>
                      {lists.libres.map(m => (
                        <tr key={m.id}>
                          <td><CFormCheck checked={selected.includes(m.id)} onChange={() => toggle(m.id)} aria-label={`Choisir ${m.nom_complet}`} /></td>
                          <td><PersonLink m={m} onOpen={openDossier} /></td>
                          <td className="stg-muted">{m.etablissement}</td>
                          <td className="stg-muted">{frDate(m.date_debut)} → {frDate(m.date_fin)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ))}
        </CCardBody>
      </CCard>

      {selected.length > 0 && (
        <div className="stg-bar-sel">
          <strong style={{ marginRight: 'auto' }}>{selected.length} / 2 sélectionné(s)</strong>
          <CButton color="light" size="sm" disabled={selected.length !== 2} onClick={() => setForming(true)}>Former ce binôme</CButton>
          <CButton color="link" size="sm" style={{ color: '#fff' }} onClick={() => setSelected([])}>Annuler</CButton>
        </div>
      )}

      <FormBinomeModal visible={forming} preset={pair} onClose={() => setForming(false)} onDone={() => { setForming(false); setSelected([]); load() }} />

      <CModal visible={!!dissolving} onClose={() => setDissolving(null)} alignment="center">
        <CModalHeader><CModalTitle style={{ fontSize: '1rem' }}>Défaire « {dissolving?.name} » ?</CModalTitle></CModalHeader>
        <CModalBody>Les deux stagiaires sont prévenus et pourront former un autre binôme. Rien d'autre ne change.</CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setDissolving(null)}>Annuler</CButton>
          <CButton color="danger" style={{ color: '#fff' }} disabled={busy} onClick={dissolve}>{busy && <CSpinner size="sm" className="me-1" />}Défaire le binôme</CButton>
        </CModalFooter>
      </CModal>

      <style>{`
        .bin-person { all: unset; box-sizing: border-box; display: flex; align-items: baseline; gap: 8px; padding: 2px 0; cursor: pointer; }
        .bin-person:hover .bin-name { text-decoration: underline; }
        .bin-person:focus-visible { outline: 2px solid #0f766e; outline-offset: 2px; border-radius: 4px; }
        .bin-name { font-weight: 600; color: #0f172a; }
        .bin-line { padding: 2px 0; white-space: nowrap; }
      `}</style>
    </div>
  )
}

/**
 * Former un binôme : deux stagiaires libres, nom facultatif. Depuis la liste
 * des stagiaires, les deux choisis arrivent déjà sélectionnés (`preset`).
 */
export const FormBinomeModal = ({ visible, preset, onClose, onDone }: {
  visible: boolean
  preset?: [number, number]
  onClose: () => void
  onDone: () => void
}) => {
  const [candidates, setCandidates] = useState<BinomeMember[] | null>(null)
  const [pair, setPair] = useState<[string, string]>(['', ''])
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) return
    setCandidates(null); setName(''); setErr(null)
    setPair(preset ? [String(preset[0]), String(preset[1])] : ['', ''])
    stageService.binomes().then(d => setCandidates(d.candidates)).catch(e => setErr(friendlyError(e)))
  }, [visible, preset])

  // Déjà en binôme : le serveur le refuse ; on le dit tout de suite.
  const taken = candidates && preset ? preset.filter(id => !candidates.some(m => m.id === id)).length : 0

  const save = async () => {
    if (!pair[0] || !pair[1]) { setErr('Choisissez les deux stagiaires.'); return }
    setBusy(true); setErr(null)
    try {
      const res: any = await stageService.formBinome([Number(pair[0]), Number(pair[1])], name)
      onDone()
      await showSuccess('Binôme formé', res?.message)
    } catch (e) {
      setErr(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" fullscreen="sm">
      <CModalHeader><CModalTitle style={{ fontSize: '1rem' }}>Former un binôme</CModalTitle></CModalHeader>
      <CModalBody>
        {!candidates && !err && <CSpinner size="sm" color="primary" />}
        {candidates && taken > 0 && (
          <div className="stg-err">Un des stagiaires choisis est déjà en binôme (ou son stage est terminé). Défaites d'abord son binôme.</div>
        )}
        {candidates && taken === 0 && <>
          <PickIntern label="Premier stagiaire" value={pair[0]} exclude={pair[1]} candidates={candidates} onChange={v => setPair([v, pair[1]])} />
          <PickIntern label="Second stagiaire" value={pair[1]} exclude={pair[0]} candidates={candidates} onChange={v => setPair([pair[0], v])} />
          <CFormLabel className="fw-semibold small">Nom <span className="stg-muted">(facultatif)</span></CFormLabel>
          <CFormInput value={name} maxLength={80} onChange={e => setName(e.target.value)} placeholder="Exemple : Binôme Réseaux 1" />
          <div className="stg-muted" style={{ marginTop: 8 }}>Les deux stagiaires et leurs superviseurs sont prévenus.</div>
        </>}
        {err && <div className="stg-err" style={{ marginTop: 12 }}>{err}</div>}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={onClose}>Annuler</CButton>
        <CButton color="primary" onClick={save} disabled={busy || !candidates || taken > 0}>{busy && <CSpinner size="sm" className="me-1" />}Former le binôme</CButton>
      </CModalFooter>
    </CModal>
  )
}

const PickIntern = ({ label, value, exclude, candidates, onChange }: {
  label: string; value: string; exclude: string; candidates: BinomeMember[]; onChange: (v: string) => void
}) => (
  <div className="mb-3">
    <CFormLabel className="fw-semibold small">{label}</CFormLabel>
    <CFormSelect value={value} onChange={e => onChange(e.target.value)} aria-label={label}>
      <option value="">Choisir…</option>
      {candidates.filter(m => String(m.id) !== exclude).map(m => (
        <option key={m.id} value={m.id}>{m.nom_complet} - {m.reference} (jusqu'au {frDate(m.date_fin)})</option>
      ))}
    </CFormSelect>
  </div>
)

export default BinomesPage
