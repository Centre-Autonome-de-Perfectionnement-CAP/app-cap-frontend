// src/views/pages/stages/BinomesPage.tsx
// Binômes : toujours deux stagiaires. On forme un binôme avec deux stagiaires
// encore libres (en cours ou à venir) ; un stagiaire déjà en binôme n'est plus
// proposé. Les stagiaires peuvent aussi se choisir depuis leur espace.

import { useCallback, useEffect, useState } from 'react'
import {
  CButton, CCard, CCardBody, CFormInput, CFormLabel, CFormSelect, CSpinner,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilGroup, cilReload } from '@coreui/icons'
import stageService, { type BinomesOverview, type BinomeMember, type StageTeam } from '@/services/stage.service'
import { showSuccess, showError, friendlyError } from '@/components/common/ActionResult'
import { PageHead, Empty, StagesStyles, useOpenDossier } from './StagesUi'
import { frDate } from './stageUtils'

const BinomesPage = () => {
  const [data, setData] = useState<BinomesOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [forming, setForming] = useState(false)
  const [dissolving, setDissolving] = useState<StageTeam | null>(null)
  const [busy, setBusy] = useState(false)
  const openDossier = useOpenDossier('Binômes')

  const load = useCallback(async () => {
    setError(null)
    try { setData(await stageService.binomes()) } catch (e) { setError(friendlyError(e)) }
  }, [])
  useEffect(() => { load() }, [load])

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

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title="Binômes"
        subtitle={data ? `${data.teams.length} binôme(s) · ${data.candidates.length} stagiaire(s) sans binôme` : 'Deux stagiaires qui travaillent ensemble.'}
        actions={<>
          <CButton color="secondary" variant="outline" size="sm" onClick={load} title="Actualiser"><CIcon icon={cilReload} /></CButton>
          <CButton color="primary" size="sm" disabled={!data || data.candidates.length < 2} onClick={() => setForming(true)}>
            <CIcon icon={cilPlus} className="me-1" />Former un binôme
          </CButton>
        </>}
      />
      {error && <div className="stg-err">{error}</div>}
      {!data && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
      {data && data.teams.length === 0 && (
        <CCard className="border-0 shadow-sm"><CCardBody><Empty text="Aucun binôme pour l'instant. Les stagiaires peuvent aussi en proposer un depuis leur espace." /></CCardBody></CCard>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {data?.teams.map(t => (
          <div key={t.id} className="stg-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 32, height: 32, borderRadius: 9, background: '#f0fdfa', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CIcon icon={cilGroup} style={{ width: 16 }} />
              </span>
              <strong style={{ flex: 1, minWidth: 0 }}>{t.name}</strong>
              <CButton size="sm" color="danger" variant="ghost" onClick={() => setDissolving(t)}>Défaire</CButton>
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {t.members.map(m => (
                <button key={m.id} type="button" onClick={() => openDossier(m.reference)} className="bin-member">
                  <span className="stg-ref">{m.reference}</span>
                  <span style={{ flex: 1, minWidth: 0, fontWeight: 600, color: '#0f172a' }}>{m.nom_complet}</span>
                  <span className="stg-muted">jusqu'au {frDate(m.date_fin)}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <FormBinomeModal visible={forming} onClose={() => setForming(false)} onDone={() => { setForming(false); load() }} />

      <CModal visible={!!dissolving} onClose={() => setDissolving(null)} alignment="center">
        <CModalHeader><CModalTitle style={{ fontSize: '1rem' }}>Défaire « {dissolving?.name} » ?</CModalTitle></CModalHeader>
        <CModalBody>Les deux stagiaires sont prévenus et pourront former un autre binôme. Rien d'autre ne change.</CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setDissolving(null)}>Annuler</CButton>
          <CButton color="danger" style={{ color: '#fff' }} disabled={busy} onClick={dissolve}>{busy && <CSpinner size="sm" className="me-1" />}Défaire le binôme</CButton>
        </CModalFooter>
      </CModal>

      <style>{`
        .bin-member { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px;
          border: 1px solid #eef2f7; border-radius: 10px; cursor: pointer; font-size: .9rem; }
        .bin-member:hover { background: #f8fafc; border-color: #cbd5e1; }
        .bin-member:focus-visible { outline: 2px solid #0f766e; outline-offset: 2px; }
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
