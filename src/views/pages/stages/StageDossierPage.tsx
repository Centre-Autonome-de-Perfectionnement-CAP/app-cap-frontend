// src/views/pages/stages/StageDossierPage.tsx
// Dossier d'une demande de stage ou d'un stagiaire, sur sa propre page :
//  - demande en cours d'étude : demandeur, pièces, échanges, décision ;
//  - stagiaire (demande acceptée) : onglets Résumé, Présence, Rapports,
//    Attestation, Historique, avec l'encadrement (superviseurs, binôme).
// Le fil d'Ariane ramène à la liste d'origine, filtre compris.

import { useCallback, useEffect, useState } from 'react'
import { useLocation, useParams, useSearchParams } from 'react-router-dom'
import { CButton, CCard, CCardBody, CSpinner, CFormTextarea } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSend, cilBan, cilCheckAlt, cilPencil, cilFile, cilHistory, cilCommentBubble, cilDescription, cilUser,
  cilCalendarCheck, cilBadge, cilPeople, cilGroup, cilReload,
} from '@coreui/icons'
import stageService, { type StageDetail, type StageTerms } from '@/services/stage.service'
import { showSuccess, showError, friendlyError } from '@/components/common/ActionResult'
import TermsForm, { validateTerms } from './TermsForm'
import StageFileViewer from './StageFileViewer'
import PresencePanel from './PresencePanel'
import InternReportsPanel from './InternReportsPanel'
import InternAttestationPanel from './InternAttestationPanel'
import SupervisorAssignModal from './SupervisorAssignModal'
import { Breadcrumb, CodeBadges, FilterTabs, Pill, StagesStyles, useOpenDossier } from './StagesUi'
import {
  STATUS_STYLE, HISTORY_LABELS, PHASE, WA_GROUP, frDate, frDateTime, horairesLabel, durationLabel,
} from './stageUtils'

type Mode = 'view' | 'propose' | 'reject' | 'rectify'
type Tab = 'resume' | 'presence' | 'rapports' | 'attestation' | 'historique'

const StageDossierPage = () => {
  const { ref = '' } = useParams()
  const { state } = useLocation() as { state: { from?: string; fromLabel?: string } | null }
  const [params, setParams] = useSearchParams()

  const [detail, setDetail] = useState<StageDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<Mode>('view')
  const [terms, setTerms] = useState<StageTerms | null>(null)
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [viewerKey, setViewerKey] = useState<string | null>(null)
  const [noteView, setNoteView] = useState<number | null>(null)
  const [assignOpen, setAssignOpen] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try { setDetail(await stageService.get(ref)) } catch (e) { setError(friendlyError(e)) }
  }, [ref])
  useEffect(() => { setDetail(null); setMode('view'); load() }, [load])

  const accepted = detail?.status === 'accepted'
  const tabs: { key: Tab; label: string }[] = accepted ? [
    { key: 'resume', label: 'Résumé' },
    { key: 'presence', label: 'Présence' },
    ...(detail?.activated_at ? [{ key: 'rapports' as Tab, label: 'Rapports' }, { key: 'attestation' as Tab, label: 'Attestation' }] : []),
    { key: 'historique', label: 'Historique' },
  ] : []
  const tab: Tab = tabs.some(t => t.key === params.get('onglet')) ? (params.get('onglet') as Tab) : 'resume'
  const setTab = (t: Tab) => setParams(p => { const n = new URLSearchParams(p); if (t === 'resume') n.delete('onglet'); else n.set('onglet', t); return n }, { replace: true })

  // Retour : la liste d'où l'on vient, sinon la liste naturelle du dossier.
  const back = state?.from
    ? { label: state.fromLabel ?? 'Retour', to: state.from }
    : accepted ? { label: 'Stagiaires', to: '/stages/stagiaires' } : { label: 'Demandes de stage', to: '/stages/demandes' }

  const openMode = (m: Mode) => {
    if (!detail) return
    setFormError(null)
    if (m === 'propose') { setTerms(detail.suggested_terms); setNote('') }
    if (m === 'rectify') { setTerms(detail.terms); setNote('') }
    if (m === 'reject') setNote(detail.default_rejection_reason)
    setMode(m)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const run = async (action: () => Promise<any>, title: string) => {
    setBusy(true); setFormError(null)
    try {
      const res = await action()
      if (res?.data) setDetail(res.data)
      setMode('view')
      await showSuccess(title, res?.message)
    } catch (e) {
      setFormError(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  const submit = () => {
    if (!detail) return
    if (mode === 'propose' && terms) {
      const err = validateTerms(terms)
      if (err) { setFormError(err); return }
      return run(() => stageService.propose(detail.id, terms, note.trim() || undefined), 'Proposition envoyée')
    }
    if (mode === 'rectify' && terms) {
      const err = validateTerms(terms, { allowPastStart: true })
      if (err) { setFormError(err); return }
      if (!note.trim()) { setFormError('Le motif de la modification est obligatoire.'); return }
      return run(() => stageService.rectify(detail.id, terms, note.trim()), 'Note rectificative émise')
    }
    if (mode === 'reject') {
      if (!note.trim()) { setFormError('Le motif est obligatoire.'); return }
      return run(() => stageService.reject(detail.id, note.trim()), 'Demande non retenue')
    }
  }

  const openPartner = useOpenDossier(detail?.reference ?? 'Dossier')

  const splitPair = async () => {
    if (!detail?.pair) return
    setBusy(true)
    try {
      const res: any = await stageService.dissolveBinome(detail.pair.team_id)
      await load()
      await showSuccess('Binôme séparé', res?.message)
    } catch (e) {
      await showError('Action impossible', friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  const selfFollow = async (action: 'add' | 'remove') => {
    if (!detail) return
    setBusy(true)
    try {
      const res: any = await stageService.setSupervisor([detail.id], detail.me.id, action)
      await load()
      await showSuccess(action === 'add' ? 'Stagiaire suivi' : 'Stagiaire retiré de votre suivi', res?.message)
    } catch (e) {
      await showError('Action impossible', friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  if (error) return (
    <div className="stg-page">
      <StagesStyles />
      <Breadcrumb items={[{ label: back.label, to: back.to }, { label: ref }]} />
      <div className="stg-err">{error}</div>
    </div>
  )
  if (!detail) return (
    <div className="stg-page">
      <StagesStyles />
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: 48, color: '#64748b' }}>
        <CSpinner size="sm" color="primary" />Chargement du dossier…
      </div>
    </div>
  )

  const st = STATUS_STYLE[detail.status]
  const suivi = detail.suivi
  const lead = detail.me.is_lead
  const lastCounter = detail.status === 'counter_proposed'
    ? [...detail.exchanges].reverse().find(x => x.kind === 'counter') : null

  const actions = mode === 'view' && (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {accepted && lead && suivi?.phase !== 'finished' && (
        <CButton color="primary" variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
          <CIcon icon={cilPeople} className="me-1" />{suivi?.supervisors.length ? 'Changer de superviseur' : 'Attribuer un superviseur'}
        </CButton>
      )}
      {accepted && !lead && suivi && (suivi.supervised_by_me
        ? <CButton color="secondary" variant="outline" size="sm" disabled={busy} onClick={() => selfFollow('remove')}>Ne plus suivre</CButton>
        : <CButton color="success" size="sm" style={{ color: '#fff' }} disabled={busy || suivi.phase === 'finished'} onClick={() => selfFollow('add')}>Suivre ce stagiaire</CButton>)}
      {detail.can.rectify && (
        <CButton color="primary" variant="outline" size="sm" onClick={() => openMode('rectify')}>
          <CIcon icon={cilPencil} className="me-1" />Modifier les conditions
        </CButton>
      )}
      {detail.can.reject && (
        <CButton color="danger" variant="outline" size="sm" onClick={() => openMode('reject')}>
          <CIcon icon={cilBan} className="me-1" />Ne pas retenir
        </CButton>
      )}
      {detail.can.propose && (
        <CButton color={detail.can.accept_counter ? 'primary' : 'success'} variant={detail.can.accept_counter ? 'outline' : undefined} size="sm"
          style={detail.can.accept_counter ? undefined : { color: '#fff' }} onClick={() => openMode('propose')}>
          <CIcon icon={cilSend} className="me-1" />{detail.status === 'submitted' ? 'Faire la proposition' : 'Nouvelle proposition'}
        </CButton>
      )}
      {detail.can.accept_counter && (
        <CButton color="success" size="sm" style={{ color: '#fff' }} disabled={busy}
          onClick={() => run(() => stageService.acceptCounter(detail.id), 'Contre-proposition acceptée')}>
          {busy ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilCheckAlt} className="me-1" />}Accepter ses dates
        </CButton>
      )}
      <CButton color="secondary" variant="outline" size="sm" onClick={load} title="Actualiser"><CIcon icon={cilReload} /></CButton>
    </div>
  )

  // ── Blocs ────────────────────────────────────────────────────────────────
  const blocks = {
    counter: lastCounter && (
      <Section icon={cilCommentBubble} title="Contre-proposition du demandeur" tone="#7c3aed">
        <p style={{ margin: 0, fontWeight: 700 }}>
          Du {frDate(lastCounter.date_debut, true)} au {frDate(lastCounter.date_fin, true)}
          <span style={{ color: '#64748b', fontWeight: 600 }}> · {durationLabel(lastCounter.date_debut, lastCounter.date_fin)}</span>
        </p>
        {lastCounter.message && <p className="dos-quote">{lastCounter.message}</p>}
      </Section>
    ),
    waiting: detail.status === 'proposal_sent' && detail.proposal_expires_at && (
      <div className="dos-info">
        Proposition envoyée le {frDateTime(detail.proposal_sent_at)}. En attente de la réponse du demandeur
        (relance automatique à 3 jours, expiration le {frDate(detail.proposal_expires_at, true)}).
      </div>
    ),
    terms: detail.terms && (
      <Section icon={cilCheckAlt} title="Conditions retenues" tone="#059669">
        <Terms t={detail.terms} />
      </Section>
    ),
    pair: detail.pair && !accepted && (
      <div className="dos-info" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: '#f0fdfa', borderColor: '#99f6e4', color: '#134e4a' }}>
        <CIcon icon={cilGroup} style={{ width: 18 }} />
        <span style={{ flex: 1, minWidth: 220 }}>
          Demande en binôme avec <button type="button" className="dos-link" onClick={() => openPartner(detail.pair!.reference)}>{detail.pair.nom_complet} ({detail.pair.reference})</button>
          {' - '}{detail.pair.status_label}. Proposition et décision valent pour les deux : mêmes service et dates.
        </span>
        {lead && <CButton size="sm" color="secondary" variant="outline" disabled={busy} onClick={splitPair}>Séparer le binôme</CButton>}
      </div>
    ),
    rejection: detail.status === 'rejected' && detail.rejection_reason && (
      <Section icon={cilBan} title="Motif du rejet" tone="#e11d48">
        <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{detail.rejection_reason}</p>
      </Section>
    ),
    team: suivi && (
      <Section icon={cilPeople} title="Encadrement" tone="#0f766e">
        <dl className="dos-dl">
          <Row l="Superviseur(s)" v={suivi.supervisors.length
            ? suivi.supervisors.map(s => s.name).join(', ')
            : <span style={{ color: '#b45309', fontWeight: 700 }}>Aucun</span>} />
          <Row l="Binôme" v={suivi.team?.name ? <span className="stg-chip"><CIcon icon={cilGroup} style={{ width: 12 }} />{suivi.team.name}</span> : '—'} />
          <Row l="Groupe WhatsApp" v={suivi.whatsapp_group ? <Pill color={WA_GROUP[suivi.whatsapp_group].color} bg={WA_GROUP[suivi.whatsapp_group].bg}>{WA_GROUP[suivi.whatsapp_group].label}</Pill> : '—'} />
          <Row l="Espace stagiaire" v={detail.activated_at ? `Activé le ${frDateTime(detail.activated_at)}` : 'Pas encore activé'} />
        </dl>
      </Section>
    ),
    attention: suivi && suivi.codes.length > 0 && (
      <Section icon={cilBadge} title="À surveiller" tone="#c2410c">
        {suivi.codes.map(c => (
          <div key={c.code} style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 6, fontSize: '.9rem' }}>
            <CodeBadges codes={[c]} />
            <span>{c.detail}</span>
          </div>
        ))}
      </Section>
    ),
    person: (
      <Section icon={cilUser} title={accepted ? 'Le stagiaire' : 'Le demandeur'}>
        <dl className="dos-dl">
          <Row l="Né(e) le" v={`${frDate(detail.date_naissance, true)} à ${detail.lieu_naissance}`} />
          <Row l="Nationalité" v={detail.nationalite} />
          <Row l="Établissement" v={detail.etablissement} />
          <Row l="Formation" v={detail.formation} />
          {!accepted && <Row l="Début souhaité" v={detail.date_debut_souhaitee ? frDate(detail.date_debut_souhaitee, true) : 'Non précisé'} />}
          {!accepted && <Row l="Durée souhaitée" v={detail.duree_souhaitee} />}
          <Row l="Thème / service" v={detail.theme_souhaite || '—'} />
          <Row l="WhatsApp" v={<a href={`https://wa.me/${detail.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{detail.whatsapp}</a>} />
          <Row l="Email" v={<a href={`mailto:${detail.email}`}>{detail.email}</a>} />
          <Row l="Demande déposée le" v={frDateTime(detail.created_at)} />
        </dl>
      </Section>
    ),
    files: (
      <Section icon={cilFile} title={`Pièces (${detail.files.length})`}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {detail.files.map(f => (
            <button key={f.key} type="button" className="dos-file" onClick={() => setViewerKey(f.key)}>
              <CIcon icon={cilFile} style={{ width: 16, color: f.ext === 'pdf' ? '#e11d48' : '#0284c7' }} />{f.label}
            </button>
          ))}
          {detail.files.length === 0 && <span className="stg-muted">Aucune pièce disponible.</span>}
        </div>
      </Section>
    ),
    notes: detail.notes.length > 0 && (
      <Section icon={cilDescription} title="Notes de service">
        {detail.notes.map(n => (
          <div key={n.id} className="dos-item">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <strong style={{ flex: 1 }}>{n.kind === 'rectificative' ? 'Rectificative' : 'Initiale'} · {n.number}</strong>
              <CButton size="sm" color="primary" variant="outline" onClick={() => setNoteView(n.id)}>
                <CIcon icon={cilFile} className="me-1" />Voir
              </CButton>
            </span>
            <span className="stg-muted">Émise le {frDateTime(n.issued_at)}{n.issued_by ? ` par ${n.issued_by}` : ' (accord du demandeur)'}</span>
            {n.motif && <span className="stg-muted">Motif : {n.motif}</span>}
          </div>
        ))}
      </Section>
    ),
    exchanges: (
      <Section icon={cilCommentBubble} title="Échanges avec le demandeur">
        {detail.exchanges.length === 0 && <span className="stg-muted">Aucun échange.</span>}
        {detail.exchanges.map(x => (
          <div key={x.id} className="dos-msg" data-staff={x.author === 'staff' ? '1' : '0'}>
            <span className="stg-muted">{x.author === 'staff' ? (x.author_name || 'Responsable de division') : 'Demandeur'} · {frDateTime(x.at)}</span>
            <strong>
              {x.kind === 'accept' ? 'Proposition acceptée'
                : `${x.kind === 'counter' ? 'Dates proposées' : 'Proposition'} : ${frDate(x.date_debut)} → ${frDate(x.date_fin)}`}
            </strong>
            {x.message && <span style={{ whiteSpace: 'pre-line' }}>{x.message}</span>}
          </div>
        ))}
      </Section>
    ),
    history: (
      <Section icon={cilHistory} title="Historique">
        {detail.history.map(h => (
          <div key={h.id} className="dos-hist">
            <span className="dos-dot" />
            <div>
              <strong>{HISTORY_LABELS[h.action] ?? h.action}</strong>
              <span className="stg-muted">{frDateTime(h.at)} · {h.actor === 'staff' ? (h.user_name || 'Personnel') : h.actor === 'demandeur' ? 'Demandeur' : 'Automatique'}</span>
              {h.comment && <span style={{ whiteSpace: 'pre-line' }}>{h.comment}</span>}
            </div>
          </div>
        ))}
      </Section>
    ),
  }

  return (
    <div className="stg-page">
      <StagesStyles />
      <Breadcrumb items={[{ label: back.label, to: back.to }, { label: detail.reference }]} />

      {/* ── En-tête du dossier ─────────────────────────────────────────── */}
      <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
        <CCardBody style={{ display: 'flex', gap: 14, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="stg-ref" style={{ fontSize: '1rem' }}>{detail.reference}</span>
              {accepted && suivi
                ? <Pill color={PHASE[suivi.phase].color} bg={PHASE[suivi.phase].bg}>{PHASE[suivi.phase].label}</Pill>
                : <Pill color={st.color} bg={st.bg}>{detail.status_label}</Pill>}
              {suivi && <CodeBadges codes={suivi.codes} />}
            </div>
            <h4 style={{ margin: '4px 0 2px', fontWeight: 800 }}>{detail.nom_complet}</h4>
            <span className="stg-muted">
              {detail.terms
                ? `${frDate(detail.terms.date_debut)} → ${frDate(detail.terms.date_fin)} · ${detail.terms.service}`
                : `${detail.formation} · ${detail.etablissement}`}
            </span>
          </div>
          {actions}
        </CCardBody>
      </CCard>

      {/* ── Formulaires (proposition, rectification, rejet) ───────────── */}
      {mode !== 'view' && (
        <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <CCardBody>
            {(mode === 'propose' || mode === 'rectify') && terms && <>
              <h6 style={{ fontWeight: 800 }}>{mode === 'propose' ? 'Proposition au demandeur' : 'Modifier les conditions (note rectificative)'}</h6>
              <p className="stg-muted" style={{ marginTop: -2 }}>
                {mode === 'propose'
                  ? 'Tout est pré-rempli. Si les dates sont exactement celles demandées, la note de service part directement ; sinon le demandeur reçoit la proposition et peut accepter ou proposer d\'autres dates.'
                  : 'Une note de service rectificative numérotée sera émise et envoyée automatiquement au stagiaire.'}
              </p>
              <TermsForm
                value={terms}
                onChange={setTerms}
                note={note}
                onNoteChange={setNote}
                noteLabel={mode === 'propose' ? 'Message au demandeur' : 'Motif de la modification'}
                noteRequired={mode === 'rectify'}
                notePlaceholder={mode === 'propose' ? 'Exemple : Bienvenue ! Merci de confirmer ces dates.' : 'Exemple : prolongation demandée par le service.'}
                allowPastStart={mode === 'rectify'}
              />
            </>}
            {mode === 'reject' && <>
              <h6 style={{ fontWeight: 800 }}>Ne pas retenir la demande</h6>
              <p className="stg-muted">Le motif ci-dessous (modifiable) sera envoyé au demandeur par WhatsApp et par email. Le formulaire de demande reste ouvert.</p>
              <CFormTextarea rows={5} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} />
            </>}
            {formError && <div className="stg-err" style={{ marginTop: 12 }}>{formError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <CButton color="secondary" variant="ghost" onClick={() => { setMode('view'); setFormError(null) }} disabled={busy}>Annuler</CButton>
              <CButton color={mode === 'reject' ? 'danger' : 'success'} style={{ color: '#fff' }} onClick={submit} disabled={busy}>
                {busy && <CSpinner size="sm" className="me-1" />}
                {mode === 'propose' ? 'Envoyer la proposition' : mode === 'rectify' ? 'Émettre la note rectificative' : 'Confirmer et informer le demandeur'}
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* ── Contenu ───────────────────────────────────────────────────── */}
      {mode === 'view' && accepted && (
        <>
          <FilterTabs options={tabs} value={tab} onChange={setTab} />
          {tab === 'resume' && (
            <div className="dos-grid">
              <div className="dos-col">{blocks.attention}{blocks.terms}{blocks.team}{blocks.notes}</div>
              <div className="dos-col">{blocks.person}{blocks.files}{blocks.exchanges}</div>
            </div>
          )}
          {tab === 'presence' && (
            <Section icon={cilCalendarCheck} title="Présence et assiduité" tone="#059669">
              <PresencePanel
                stageId={detail.id}
                onConfirmShift={(newEnd, motif) => {
                  if (!detail.terms) return
                  setTerms({ ...detail.terms, date_fin: newEnd })
                  setNote(motif)
                  setFormError(null)
                  setMode('rectify')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            </Section>
          )}
          {tab === 'rapports' && <Section icon={cilFile} title="Rapports" tone="#7c3aed"><InternReportsPanel stageId={detail.id} /></Section>}
          {tab === 'attestation' && (
            <Section icon={cilBadge} title="Attestation" tone="#0f766e">
              <InternAttestationPanel stage={{ id: detail.id, nom_complet: detail.nom_complet }} lead={lead} />
            </Section>
          )}
          {tab === 'historique' && blocks.history}
        </>
      )}

      {mode === 'view' && !accepted && (
        <div className="dos-grid">
          <div className="dos-col">{blocks.pair}{blocks.counter}{blocks.waiting}{blocks.terms}{blocks.rejection}{blocks.person}{blocks.files}</div>
          <div className="dos-col">{blocks.notes}{blocks.exchanges}{blocks.history}</div>
        </div>
      )}

      <StageFileViewer
        visible={noteView !== null}
        stageId={detail.id}
        files={detail.notes.map(n => ({ key: String(n.id), label: `Note ${n.kind === 'rectificative' ? 'rectificative' : 'de service'} · ${n.number}` }))}
        initialKey={noteView !== null ? String(noteView) : null}
        title="Notes de service"
        loader={key => stageService.notePdf(detail.id, Number(key))}
        onClose={() => setNoteView(null)}
      />
      <StageFileViewer
        visible={viewerKey !== null}
        stageId={detail.id}
        files={detail.files}
        initialKey={viewerKey}
        onClose={() => setViewerKey(null)}
      />
      {lead && accepted && (
        <SupervisorAssignModal visible={assignOpen} ids={[detail.id]} title={`Superviseur de ${detail.nom_complet}`}
          onClose={() => setAssignOpen(false)} onDone={() => { setAssignOpen(false); load() }} />
      )}

      <style>{`
        .dos-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 14px; }
        .dos-col { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
        @media (max-width: 991px) { .dos-grid { grid-template-columns: minmax(0, 1fr); } }
        .dos-sec { background: #fff; border: 1px solid #e6ebf2; border-radius: 12px; padding: 14px 16px; }
        .dos-sec h6 { display: flex; align-items: center; gap: 8px; font-size: .9rem; font-weight: 800; margin: 0 0 10px; color: #0f172a; }
        .dos-dl { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 6px 14px; margin: 0; font-size: .9rem; }
        .dos-dl dt { color: #64748b; font-weight: 600; }
        .dos-dl dd { margin: 0; color: #0f172a; font-weight: 600; overflow-wrap: anywhere; }
        .dos-quote { margin: 8px 0 0; padding: 8px 12px; border-left: 3px solid #c4b5fd; background: #faf5ff; border-radius: 6px; white-space: pre-line; }
        .dos-info { background: #fffbeb; border: 1px solid #fde68a; color: #78350f; border-radius: 12px; padding: 10px 14px; font-size: .875rem; }
        .dos-file { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #dbe3ec; background: #fff; border-radius: 10px; padding: 7px 12px; font-size: .875rem; font-weight: 600; color: #1e293b; cursor: pointer; }
        .dos-file:hover { border-color: #0f766e; color: #0f766e; }
        .dos-link { all: unset; cursor: pointer; font-weight: 700; color: #0f766e; text-decoration: underline; }
        .dos-item, .dos-msg { display: flex; flex-direction: column; gap: 2px; padding: 9px 11px; border-radius: 10px; background: #f8fafc; margin-bottom: 8px; font-size: .875rem; }
        .dos-msg[data-staff='1'] { background: #f0fdfa; }
        .dos-msg[data-staff='0'] { background: #f5f3ff; }
        .dos-hist { display: flex; gap: 10px; font-size: .875rem; padding: 6px 0; }
        .dos-hist > div { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .dos-dot { width: 9px; height: 9px; border-radius: 50%; background: #0f766e; margin-top: 6px; flex-shrink: 0; }
      `}</style>
    </div>
  )
}

const Section = ({ icon, title, tone = '#0f766e', children }: { icon: any; title: string; tone?: string; children: React.ReactNode }) => (
  <section className="dos-sec">
    <h6><CIcon icon={icon} style={{ width: 16, color: tone }} />{title}</h6>
    {children}
  </section>
)

const Row = ({ l, v }: { l: string; v: React.ReactNode }) => (<><dt>{l}</dt><dd>{v}</dd></>)

const Terms = ({ t }: { t: StageTerms }) => (
  <dl className="dos-dl">
    <Row l="Service" v={t.service} />
    <Row l="Lieu" v={t.lieu} />
    <Row l="Début" v={frDate(t.date_debut, true)} />
    <Row l="Fin" v={frDate(t.date_fin, true)} />
    <Row l="Durée" v={durationLabel(t.date_debut, t.date_fin) ?? '—'} />
    <Row l="Horaires" v={horairesLabel(t.horaires)} />
  </dl>
)

export default StageDossierPage
