// src/views/pages/stages/PresencePanel.tsx
// Fiche d'un stagiaire accepté : activation de l'espace, décalage de prise
// de service, assiduité, appareil (empreinte), journées.

import { useCallback, useEffect, useState } from 'react'
import { CButton, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilFingerprint, cilWarning, cilCalendarCheck } from '@coreui/icons'
import stageService, { type InternPresence } from '@/services/stage.service'
import { showSuccess, showError, friendlyError } from '@/components/common/ActionResult'
import { frDate, frDateTime } from './stageUtils'

const DAY = {
  present:     { label: 'Présent',      color: '#059669', bg: '#ecfdf5' },
  half:        { label: 'Demi-journée', color: '#0284c7', bg: '#f0f9ff' },
  absent:      { label: 'Absent',       color: '#e11d48', bg: '#fff1f2' },
  justified:   { label: 'Justifié',     color: '#7c3aed', bg: '#f5f3ff' },
  in_progress: { label: 'En cours',     color: '#64748b', bg: '#f1f5f9' },
} as const

const FAIL: Record<string, string> = {
  out_of_zone: 'hors zone', imprecise: 'position imprécise', webauthn: 'empreinte refusée', not_allowed: 'hors horaire',
}

const time = (iso?: string) => iso
  ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Porto-Novo' }).replace(':', 'h')
  : '—'

interface Props {
  stageId: number
  /** Ouvre la modification des conditions avec une nouvelle date de fin pré-remplie. */
  onConfirmShift: (newEnd: string, motif: string) => void
}

const PresencePanel = ({ stageId, onConfirmShift }: Props) => {
  const [data, setData] = useState<InternPresence | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  const load = useCallback(async () => {
    try { setData(await stageService.presence(stageId)); setError(null) } catch (e) { setError(friendlyError(e)) }
  }, [stageId])
  useEffect(() => { load() }, [load])

  const reset = async () => {
    setBusy(true); setConfirmReset(false)
    try {
      const res: any = await stageService.resetDevice(stageId)
      await load()
      await showSuccess('Empreinte réinitialisée', res?.message)
    } catch (e) {
      await showError('Action impossible', friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  if (error) return <div className="stg-error">{error}</div>
  if (!data) return <div style={{ padding: 16, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>

  const s = data.summary
  const activeDevice = data.account?.devices.find(d => !d.revoked_at)
  const fails = Object.entries(data.failures ?? {})
  const days = showAll ? data.days : data.days.slice(0, 10)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {!data.account && (
        <div className="stg-info">
          Espace stagiaire pas encore activé.
          {data.activation.sent_at
            ? ` Lien envoyé le ${frDateTime(data.activation.sent_at)}${data.activation.reminders ? ` (${data.activation.reminders} rappel(s))` : ''}.`
            : " Le lien partira le premier jour, 2 heures après l'heure d'arrivée."}
        </div>
      )}

      {data.shift && !data.shift.applied && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 800, color: '#92400e' }}>
            <CIcon icon={cilWarning} style={{ width: 16 }} />Prise de service décalée
          </div>
          <div style={{ fontSize: '.86rem', color: '#78350f', marginTop: 4 }}>
            Prévue le {frDate(data.shift.planned, true)}, effective le {frDate(data.shift.real, true)}.
            Pour garder la même durée, la fin passerait au <strong>{frDate(data.shift.suggested_end, true)}</strong>.
          </div>
          <CButton size="sm" color="warning" className="mt-2" style={{ color: '#fff' }}
            onClick={() => onConfirmShift(data.shift!.suggested_end, `Prise de service effective le ${frDate(data.shift!.real, true)} au lieu du ${frDate(data.shift!.planned, true)} : fin décalée d'autant.`)}>
            <CIcon icon={cilCalendarCheck} className="me-1" />Confirmer ou ajuster la nouvelle fin
          </CButton>
        </div>
      )}

      {data.account && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8 }}>
          {[
            ['Assiduité', s.taux !== null ? `${s.taux} %` : '—', s.taux !== null && s.taux < 80 ? '#d97706' : '#059669'],
            ['Jours ouvrés', String(s.jours_ouvres), '#0f172a'],
            ['Absences', String(s.absences), s.absences ? '#e11d48' : '#0f172a'],
            ['Retards', String(s.retards), s.retards ? '#d97706' : '#0f172a'],
            ['Justifiés', String(s.justifies), '#7c3aed'],
          ].map(([l, v, c]) => (
            <div key={l} style={{ background: '#fff', border: '1px solid #e6ebf2', borderRadius: 10, padding: '8px 10px' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: c }}>{v}</div>
              <div style={{ fontSize: '.72rem', fontWeight: 600, color: '#64748b' }}>{l}</div>
            </div>
          ))}
        </div>
      )}

      {data.account && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: '.84rem' }}>
          <CIcon icon={cilFingerprint} style={{ width: 18, color: activeDevice ? '#059669' : '#d97706' }} />
          <span style={{ flex: 1, minWidth: 180 }}>
            {activeDevice
              ? <>Empreinte enregistrée {activeDevice.device_label ? `(${activeDevice.device_label})` : ''} le {frDate(activeDevice.created_at)}{activeDevice.last_used_at ? `, dernier usage le ${frDateTime(activeDevice.last_used_at)}` : ''}</>
              : 'Aucune empreinte enregistrée : le stagiaire doit l\'enregistrer depuis son espace.'}
            <span className="stg-muted">
              Activé le {frDateTime(data.account.activated_at)} · règlement {data.account.reglement_accepted_at ? `accepté le ${frDate(data.account.reglement_accepted_at)}` : 'non accepté'}
            </span>
          </span>
          {activeDevice && !confirmReset && (
            <CButton size="sm" color="secondary" variant="outline" disabled={busy} onClick={() => setConfirmReset(true)}>
              {busy && <CSpinner size="sm" className="me-1" />}Changement de téléphone
            </CButton>
          )}
          {activeDevice && confirmReset && (
            <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontWeight: 700, color: '#9f1239' }}>Désactiver cette empreinte ?</span>
              <CButton size="sm" color="secondary" variant="ghost" onClick={() => setConfirmReset(false)}>Non</CButton>
              <CButton size="sm" color="danger" style={{ color: '#fff' }} onClick={reset}>Oui</CButton>
            </span>
          )}
        </div>
      )}

      {fails.length > 0 && (
        <div className="stg-muted">
          Pointages refusés sur 30 jours : {fails.map(([r, n]) => `${n} ${FAIL[r] ?? r}`).join(' · ')}
        </div>
      )}

      {data.days.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="table table-sm" style={{ fontSize: '.82rem', marginBottom: 0 }}>
            <thead><tr><th>Jour</th><th>Arrivée</th><th>Pause</th><th>Retour</th><th>Sortie</th><th>État</th></tr></thead>
            <tbody>
              {days.map(d => (
                <tr key={d.day}>
                  <td style={{ whiteSpace: 'nowrap' }}>{frDate(d.day)}</td>
                  {(['arrivee', 'pause_debut', 'pause_fin', 'sortie'] as const).map(k => {
                    const p = d.punches[k]
                    return (
                      <td key={k} style={{ whiteSpace: 'nowrap' }}>
                        {time(p?.at)}
                        {p && p.late_minutes > 0 && <span style={{ color: '#d97706', fontWeight: 700 }}> +{p.late_minutes}′</span>}
                        {p?.early && <span style={{ color: '#7c3aed', fontWeight: 700 }}> ↑</span>}
                      </td>
                    )
                  })}
                  <td><span className="stg-pill" style={{ color: DAY[d.status].color, background: DAY[d.status].bg }}>{DAY[d.status].label}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.days.length > 10 && (
            <CButton size="sm" color="link" onClick={() => setShowAll(v => !v)}>{showAll ? 'Voir moins' : `Voir les ${data.days.length} jours`}</CButton>
          )}
        </div>
      )}
    </div>
  )
}

export default PresencePanel
