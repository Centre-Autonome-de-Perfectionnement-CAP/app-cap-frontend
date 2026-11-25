// src/views/pages/stages/PersonNpi.tsx
// NPI d'un stagiaire (le responsable peut le renseigner ou le corriger) et
// autres demandes ou stages de la même personne.

import { useState } from 'react'
import { CButton, CFormInput } from '@coreui/react'
import stageService, { type IdentityCriterion, type OtherStay, type StageDetail } from '@/services/stage.service'
import { showSuccess, friendlyError } from '@/components/common/ActionResult'
import { Pill, useOpenDossier } from './StagesUi'
import { STATUS_STYLE, frDate } from './stageUtils'

export const CRITERIA: Record<IdentityCriterion, string> = {
  npi: 'Même NPI', telephone: 'Même numéro', email: 'Même e-mail', identite: 'Même identité',
}

/** Ligne « NPI » du dossier, avec modification pour le responsable. */
export const NpiRow = ({ detail, lead, onSaved }: { detail: StageDetail; lead: boolean; onSaved: (d: StageDetail) => void }) => {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    const npi = value.replace(/\D/g, '')
    if (npi.length !== 10) { setError('Le NPI comporte 10 chiffres.'); return }
    setBusy(true); setError(null)
    try {
      const res: any = await stageService.updateNpi(detail.id, npi)
      if (res?.data) onSaved(res.data)
      setEditing(false)
      await showSuccess('NPI enregistré')
    } catch (e) {
      setError(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <dt>NPI</dt>
      <dd>
        {editing ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ maxWidth: 220 }}>
              <CFormInput
                value={value} onChange={e => setValue(e.target.value.replace(/[^\d\s]/g, ''))} inputMode="numeric" maxLength={14}
                placeholder="Exemple : 1234567890" autoComplete="off" invalid={!!error} aria-label="NPI"
              />
              {error && <div className="stg-err" style={{ marginTop: 6 }}>{error}</div>}
            </div>
            <CButton size="sm" color="primary" disabled={busy} onClick={save}>Enregistrer</CButton>
            <CButton size="sm" color="secondary" variant="outline" disabled={busy} onClick={() => setEditing(false)}>Annuler</CButton>
          </div>
        ) : (
          <span style={{ display: 'inline-flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {detail.npi ?? <span className="stg-muted">Non renseigné</span>}
            {lead && <CButton size="sm" color="secondary" variant="outline" onClick={() => { setValue(detail.npi ?? ''); setError(null); setEditing(true) }}>{detail.npi ? 'Modifier' : 'Renseigner'}</CButton>}
          </span>
        )}
      </dd>
    </>
  )
}

const period = (s: OtherStay) =>
  s.date_debut && s.date_fin ? `du ${frDate(s.date_debut, true)} au ${frDate(s.date_fin, true)}` : 'dates non arrêtées'

/** Autres demandes ou stages de la même personne : ceux en cours en même temps sont signalés. */
export const OtherStays = ({ stays }: { stays: OtherStay[] }) => {
  const open = useOpenDossier('Dossier')
  if (stays.length === 0) return null
  const parallel = stays.some(s => s.live)

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 6 }}>
        Autres demandes ou stages de cette personne
        {parallel && <span style={{ marginLeft: 8 }}><Pill color="#c2410c" bg="#fff7ed">En même temps : à vérifier</Pill></span>}
      </div>
      {stays.map(s => (
        <div key={s.id} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6, fontSize: '.9rem' }}>
          <button type="button" className="btn btn-link p-0" onClick={() => open(s.reference)}>{s.reference}</button>
          <Pill color={STATUS_STYLE[s.status].color} bg={STATUS_STYLE[s.status].bg}>{s.status_label}</Pill>
          <span className="stg-muted">{period(s)}</span>
          <span className="stg-muted">· {s.why.map(w => CRITERIA[w]).join(', ')}</span>
        </div>
      ))}
    </div>
  )
}
