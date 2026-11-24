// src/views/pages/stages/DoublonsPage.tsx
// Doublons probables : une même personne (même NPI, numéro, e-mail ou identité)
// avec plusieurs demandes ou stages en même temps. Deux stages qui se suivent
// ne sont pas des doublons : ils figurent dans l'historique du dossier.

import { useCallback, useEffect, useState } from 'react'
import { CButton, CCard, CCardBody, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload } from '@coreui/icons'
import stageService, { type DuplicateGroup } from '@/services/stage.service'
import { friendlyError } from '@/components/common/ActionResult'
import { Empty, PageHead, Pill, StagesStyles, useOpenDossier } from './StagesUi'
import { CRITERIA } from './PersonNpi'
import { STATUS_STYLE, frDate } from './stageUtils'

const DoublonsPage = () => {
  const [groups, setGroups] = useState<DuplicateGroup[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const open = useOpenDossier('Doublons probables')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setGroups(await stageService.duplicates()) } catch (e) { setError(friendlyError(e)) } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title="Doublons probables"
        subtitle="Une même personne avec plusieurs demandes ou stages en même temps. Ouvrez chaque dossier pour décider."
        actions={<CButton color="secondary" variant="outline" size="sm" onClick={load} disabled={loading} title="Actualiser"><CIcon icon={cilReload} /></CButton>}
      />
      {error && <div className="stg-err">{error}</div>}
      {!groups && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
      {groups && groups.length === 0 && <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}><CCardBody><Empty text="Aucun doublon probable." /></CCardBody></CCard>}
      {groups?.map((g, i) => (
        <CCard key={i} className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <CCardBody>
            <div style={{ marginBottom: 8, color: '#64748b', fontSize: '.9rem' }}>{g.shared.map(c => CRITERIA[c]).join(' · ')}</div>
            {g.people.map(p => (
              <div key={p.id} style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', padding: '6px 0', borderTop: '1px solid #f1f5f9' }}>
                <button type="button" className="btn btn-link p-0 fw-semibold" onClick={() => open(p.reference)}>{p.nom_complet}</button>
                <span className="stg-muted">{p.reference}</span>
                <Pill color={STATUS_STYLE[p.status].color} bg={STATUS_STYLE[p.status].bg}>{p.status_label}</Pill>
                <span className="stg-muted">
                  {p.date_debut && p.date_fin ? `du ${frDate(p.date_debut, true)} au ${frDate(p.date_fin, true)}` : 'dates non arrêtées'} · {p.etablissement}
                </span>
              </div>
            ))}
          </CCardBody>
        </CCard>
      ))}
    </div>
  )
}

export default DoublonsPage
