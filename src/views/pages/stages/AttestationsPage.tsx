// src/views/pages/stages/AttestationsPage.tsx
// Attestations : de stage et de travail, même circuit. Le responsable valide
// (et invite pour une attestation de travail) ; le secrétariat imprime,
// prévient l'intéressé, remet (date) et archive le scan.

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CButton, CCard, CCardBody, CFormInput, CInputGroup, CInputGroupText, CSpinner,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload, cilBadge, cilSearch, cilX, cilUserPlus } from '@coreui/icons'
import stageService, { type Attestation, type AttestationStatus, type WorkAttestation, type WorkAttestationStatus } from '@/services/stage.service'
import { friendlyError, showSuccess } from '@/components/common/ActionResult'
import { useAuth } from '@/contexts'
import { PageHead, Empty, Pill, StagesStyles, ExportButton, FilterTabs } from './StagesUi'
import { isStagesLead } from './StagesGuard'
import AttestationModal, { ATT_STATUS } from './AttestationModal'
import WorkAttestationModal, { WORK_STATUS } from './WorkAttestationModal'
import { frDate, frDateTime } from './stageUtils'

type Kind = 'stage' | 'travail'

const FILTERS: [AttestationStatus | 'all', string][] = [
  ['a_valider', 'À valider'], ['a_imprimer', 'À imprimer'], ['imprimee', 'À remettre'], ['remise', 'Remises'], ['annulee', 'Annulées'], ['all', 'Toutes'],
]
const WORK_FILTERS: [WorkAttestationStatus | 'all', string][] = [
  ['invitee', 'Liens envoyés'], ['a_valider', 'À vérifier'], ['a_imprimer', 'À imprimer'], ['imprimee', 'À signer et prévenir'],
  ['prete', 'Prêtes, à remettre'], ['remise', 'Remises'], ['annulee', 'Annulées'], ['all', 'Toutes'],
]
const SECRETARIAT: string[] = ['a_imprimer', 'imprimee', 'prete', 'remise', 'all']

const AttestationsPage = () => {
  const { role } = useAuth()
  const lead = isStagesLead(role as string)
  const [params, setParams] = useSearchParams()
  const kind: Kind = params.get('type') === 'travail' ? 'travail' : 'stage'
  const setKind = (k: Kind) => setParams(p => { const n = new URLSearchParams(p); n.delete('attestation'); if (k === 'travail') n.set('type', k); else n.delete('type'); return n }, { replace: true })

  return (
    <div className="stg-page">
      <StagesStyles />
      <FilterTabs
        options={[{ key: 'stage', label: 'Attestations de stage' }, { key: 'travail', label: 'Attestations de travail' }]}
        value={kind}
        onChange={k => setKind(k as Kind)}
      />
      {kind === 'stage' ? <StageAttestations lead={lead} /> : <WorkAttestations lead={lead} />}
    </div>
  )
}

/** Ouvre la fiche demandée dans l'adresse (lien reçu par notification). */
const useOpenFromUrl = () => {
  const [params, setParams] = useSearchParams()
  const [openId, setOpenId] = useState<number | null>(() => (params.get('attestation') ? Number(params.get('attestation')) : null))
  const close = () => {
    setOpenId(null)
    if (params.has('attestation')) { params.delete('attestation'); setParams(params, { replace: true }) }
  }

  return [openId, setOpenId, close] as const
}

const StageAttestations = ({ lead }: { lead: boolean }) => {
  const [status, setStatus] = useState<string>(lead ? 'a_valider' : 'a_imprimer')
  const [rows, setRows] = useState<Attestation[] | null>(null)
  const [counts, setCounts] = useState<Partial<Record<AttestationStatus, number>>>({})
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId, close] = useOpenFromUrl()

  const load = useCallback(async () => {
    setError(null)
    try {
      const r = await stageService.attestations(status)
      setRows(r.data); setCounts(r.counts)
    } catch (e) { setError(friendlyError(e)) }
  }, [status])
  useEffect(() => { load() }, [load])

  const filters = FILTERS.filter(([k]) => lead || !['a_valider', 'annulee'].includes(k))
  const todo = lead ? (counts.a_valider ?? 0) : (counts.a_imprimer ?? 0) + (counts.imprimee ?? 0)

  return (
    <>
      <PageHead
        title="Attestations de stage"
        subtitle={lead
          ? `${todo} attestation(s) à valider. Après validation, le secrétariat imprime et remet l'attestation.`
          : `${todo} attestation(s) à imprimer ou à remettre.`}
        actions={<>
          <ExportButton path={`attestations?status=${status}`} label="Registre (Excel)" />
          <CButton color="secondary" variant="outline" size="sm" onClick={load} title="Actualiser"><CIcon icon={cilReload} /></CButton>
        </>}
      />
      <StatusButtons filters={filters} value={status} counts={counts} onChange={setStatus} />

      {error && <div className="stg-err">{error}</div>}
      {!rows && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
      {rows && rows.length === 0 && <CCard className="border-0 shadow-sm"><CCardBody><Empty text="Aucune attestation dans cette catégorie." /></CCardBody></CCard>}

      <div className="stg-list">
        {rows?.map(a => (
          <Row key={a.id} onOpen={() => setOpenId(a.id)} tone={ATT_STATUS[a.status]} name={a.stage?.nom_complet ?? ''} label={a.status_label} at={a.updated_at}
            detail={<>{a.numero ? `N° ${a.numero} · ` : ''}{a.kind !== 'normale' ? `${a.kind_label} · ` : ''}fin du stage le {frDate(a.stage?.date_fin)}
              {a.delivered_on ? ` · remise le ${frDate(a.delivered_on)}` : ''}</>} />
        ))}
      </div>

      <AttestationModal attestationId={openId} lead={lead} onClose={close} onChanged={load} />
    </>
  )
}

const WorkAttestations = ({ lead }: { lead: boolean }) => {
  const [status, setStatus] = useState<string>(lead ? 'a_valider' : 'a_imprimer')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState<WorkAttestation[] | null>(null)
  const [counts, setCounts] = useState<Partial<Record<WorkAttestationStatus, number>>>({})
  const [error, setError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)
  const [openId, setOpenId, close] = useOpenFromUrl()

  const load = useCallback(async () => {
    setError(null)
    try {
      const r = await stageService.workAttestations(status, search)
      setRows(r.data); setCounts(r.counts)
    } catch (e) { setError(friendlyError(e)) }
  }, [status, search])
  useEffect(() => { load() }, [load])
  useEffect(() => { const t = setTimeout(() => setSearch(q.trim()), 400); return () => clearTimeout(t) }, [q])

  const filters = WORK_FILTERS.filter(([k]) => lead || SECRETARIAT.includes(k))
  const todo = lead ? (counts.a_valider ?? 0) : (counts.a_imprimer ?? 0) + (counts.imprimee ?? 0) + (counts.prete ?? 0)

  return (
    <>
      <PageHead
        title="Attestations de travail"
        subtitle={lead
          ? `${todo} attestation(s) à vérifier. Invitez la personne : elle remplit sa fiche sans compte, vous vérifiez, le secrétariat imprime et la prévient.`
          : `${todo} attestation(s) à imprimer, à faire signer ou à remettre.`}
        actions={<>
          <CButton color="secondary" variant="outline" size="sm" onClick={load} title="Actualiser"><CIcon icon={cilReload} /></CButton>
          {lead && <CButton color="primary" size="sm" onClick={() => setInviting(true)}><CIcon icon={cilUserPlus} className="me-1" />Inviter une personne</CButton>}
        </>}
      />
      <StatusButtons filters={filters} value={status} counts={counts} onChange={setStatus} />
      <CInputGroup>
        <CInputGroupText style={{ background: '#fff' }}><CIcon icon={cilSearch} style={{ width: 16, color: '#94a3b8' }} /></CInputGroupText>
        <CFormInput value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher : nom, numéro, téléphone…" maxLength={100} />
        {q && <CButton color="secondary" variant="outline" onClick={() => setQ('')} title="Effacer"><CIcon icon={cilX} /></CButton>}
      </CInputGroup>

      {error && <div className="stg-err">{error}</div>}
      {!rows && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
      {rows && rows.length === 0 && <CCard className="border-0 shadow-sm"><CCardBody><Empty text="Aucune attestation de travail dans cette catégorie." /></CCardBody></CCard>}

      <div className="stg-list">
        {rows?.map(a => (
          <Row key={a.id} onOpen={() => setOpenId(a.id)} tone={WORK_STATUS[a.status]} name={a.nom_complet ?? a.phone ?? 'Fiche en attente'} label={a.status_label} at={a.updated_at}
            detail={<>{a.numero ? `N° ${a.numero} · ` : ''}
              {a.date_debut ? `du ${frDate(a.date_debut)} au ${frDate(a.date_fin)}` : a.status === 'invitee' ? `lien valable jusqu'au ${frDate(a.expires_at)}` : 'période à compléter'}
              {a.stage?.reference ? ` · ancien stagiaire ${a.stage.reference}` : ''}
              {a.delivered_on ? ` · remise le ${frDate(a.delivered_on)}` : ''}</>} />
        ))}
      </div>

      <WorkAttestationModal attestationId={openId} lead={lead} onClose={close} onChanged={load} />
      {lead && <InviteWorkModal visible={inviting} onClose={() => setInviting(false)} onDone={id => { setInviting(false); load(); setOpenId(id) }} />}
    </>
  )
}

const StatusButtons = ({ filters, value, counts, onChange }: {
  filters: [string, string][]; value: string; counts: Partial<Record<string, number>>; onChange: (k: string) => void
}) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {filters.map(([k, l]) => (
      <CButton key={k} size="sm" color="primary" variant={value === k ? undefined : 'outline'} onClick={() => onChange(k)}>
        {l}{k !== 'all' && counts[k] ? ` (${counts[k]})` : ''}
      </CButton>
    ))}
  </div>
)

const Row = ({ onOpen, tone, name, label, at, detail }: {
  onOpen: () => void; tone: { color: string; bg: string }; name: string; label: string; at: string | null; detail: React.ReactNode
}) => (
  <button type="button" className="stg-card stg-row2" style={{ textAlign: 'left', cursor: 'pointer' }} onClick={onOpen}>
    <span style={{ width: 38, height: 38, borderRadius: 10, background: tone.bg, color: tone.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <CIcon icon={cilBadge} style={{ width: 18 }} />
    </span>
    <span style={{ flex: 1, minWidth: 0 }}>
      <strong style={{ color: '#0f172a' }}>{name}</strong>
      <span className="stg-muted" style={{ display: 'block' }}>{detail}</span>
    </span>
    <Pill color={tone.color} bg={tone.bg}>{label}</Pill>
    <span className="stg-muted">{frDateTime(at)}</span>
  </button>
)

/** Inviter une personne par son numéro WhatsApp : elle reçoit un lien pour remplir sa fiche, sans compte. */
const InviteWorkModal = ({ visible, onClose, onDone }: { visible: boolean; onClose: () => void; onDone: (id: number) => void }) => {
  const [phone, setPhone] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  useEffect(() => { if (visible) { setPhone(''); setErr(null) } }, [visible])

  const send = async () => {
    if (!phone.trim()) { setErr('Indiquez le numéro WhatsApp.'); return }
    setBusy(true); setErr(null)
    try {
      const res: any = await stageService.inviteWorkAttestation(phone.trim())
      onDone(res.data.id)
      await showSuccess('Invitation envoyée', res?.message)
    } catch (e) {
      setErr(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} alignment="center" fullscreen="sm">
      <CModalHeader><CModalTitle style={{ fontSize: '1rem' }}>Attestation de travail : inviter une personne</CModalTitle></CModalHeader>
      <CModalBody>
        <label className="fw-semibold small mb-1" htmlFor="work-phone">Numéro WhatsApp <span className="text-danger">*</span></label>
        <CFormInput id="work-phone" type="tel" inputMode="tel" autoComplete="off" maxLength={20} value={phone} disabled={busy}
          placeholder="Exemple : 01 97 00 00 00" onChange={e => { setPhone(e.target.value.replace(/[^\d+\s.-]/g, '')); setErr(null) }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send() } }} />
        <div style={{ marginTop: 12, background: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: 10, padding: '10px 12px', fontSize: '.875rem', color: '#115e59' }}>
          La personne reçoit sur WhatsApp un lien personnel (7 jours, une seule utilisation), sans compte à créer. Elle indique son identité,
          son diplôme, la période, ses fonctions et ses tâches. Vous vérifiez ensuite chaque point avant de valider.
          Pour un ancien stagiaire, utilisez plutôt le bouton « Attestation de travail » de son dossier : tout est prérempli.
        </div>
        {err && <div className="stg-err" style={{ marginTop: 12 }}>{err}</div>}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="ghost" onClick={onClose}>Annuler</CButton>
        <CButton color="primary" disabled={busy} onClick={send}>{busy && <CSpinner size="sm" className="me-1" />}Envoyer le lien</CButton>
      </CModalFooter>
    </CModal>
  )
}

export default AttestationsPage
