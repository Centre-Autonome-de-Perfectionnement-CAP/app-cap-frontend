// src/views/pages/stages/StageDetailModal.tsx
// Fiche d'une demande de stage : identité, pièces, échanges avec le
// demandeur, notes de service, historique ; actions du responsable.

import { useCallback, useEffect, useState } from 'react'
import {
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CButton, CSpinner, CFormTextarea,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilSend, cilBan, cilCheckAlt, cilPencil, cilFile, cilHistory, cilCommentBubble, cilDescription, cilUser, cilCalendarCheck,
} from '@coreui/icons'
import stageService, { type StageDetail, type StageTerms } from '@/services/stage.service'
import { showSuccess, showError, friendlyError } from '@/components/common/ActionResult'
import TermsForm, { validateTerms } from './TermsForm'
import StageFileViewer from './StageFileViewer'
import PresencePanel from './PresencePanel'
import { STATUS_STYLE, HISTORY_LABELS, frDate, frDateTime, horairesLabel, durationLabel } from './stageUtils'

interface Props {
  idOrRef: number | string | null
  onClose: () => void
  onChanged: () => void
}

type Mode = 'view' | 'propose' | 'reject' | 'rectify'

const StageDetailModal = ({ idOrRef, onClose, onChanged }: Props) => {
  const [detail, setDetail] = useState<StageDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState<Mode>('view')
  const [terms, setTerms] = useState<StageTerms | null>(null)
  const [note, setNote] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [viewerKey, setViewerKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (idOrRef === null) return
    setLoading(true)
    try {
      setDetail(await stageService.get(idOrRef))
    } catch (e) {
      await showError('Dossier indisponible', friendlyError(e))
      onClose()
    } finally {
      setLoading(false)
    }
  }, [idOrRef, onClose])

  useEffect(() => {
    setDetail(null); setMode('view'); setFormError(null)
    if (idOrRef !== null) load()
  }, [idOrRef, load])

  const openMode = (m: Mode) => {
    if (!detail) return
    setFormError(null)
    if (m === 'propose') { setTerms(detail.suggested_terms); setNote('') }
    if (m === 'rectify') { setTerms(detail.terms); setNote('') }
    if (m === 'reject') setNote(detail.default_rejection_reason)
    setMode(m)
  }

  const run = async (action: () => Promise<any>, title: string) => {
    setBusy(true); setFormError(null)
    try {
      const res = await action()
      if (res?.data) setDetail(res.data)
      setMode('view')
      onChanged()
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

  const st = detail ? STATUS_STYLE[detail.status] : null
  const lastCounter = detail?.status === 'counter_proposed'
    ? [...detail.exchanges].reverse().find(x => x.kind === 'counter') : null

  return (
    <>
      <CModal visible={idOrRef !== null} onClose={onClose} size="xl" fullscreen="md" scrollable backdrop={mode === 'view' ? true : 'static'}>
        <CModalHeader>
          <CModalTitle style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {detail ? (
              <>
                <span style={{ fontFamily: 'monospace', color: '#0f766e', fontWeight: 800 }}>{detail.reference}</span>
                <span>{detail.nom_complet}</span>
                {st && <span className="stg-pill" style={{ color: st.color, background: st.bg }}>{detail.status_label}</span>}
              </>
            ) : 'Demande de stage'}
          </CModalTitle>
        </CModalHeader>

        <CModalBody style={{ background: '#f8fafc' }}>
          {(loading || !detail) && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, padding: 48, color: '#64748b' }}>
              <CSpinner size="sm" color="primary" />Chargement…
            </div>
          )}

          {detail && mode === 'view' && (
            <div className="stg-grid">
              <div className="stg-col">
                {lastCounter && (
                  <Section icon={cilCommentBubble} title="Contre-proposition du demandeur" tone="#7c3aed">
                    <p style={{ margin: 0, fontWeight: 700 }}>
                      Du {frDate(lastCounter.date_debut, true)} au {frDate(lastCounter.date_fin, true)}
                      <span style={{ color: '#64748b', fontWeight: 600 }}> · {durationLabel(lastCounter.date_debut, lastCounter.date_fin)}</span>
                    </p>
                    {lastCounter.message && <p className="stg-quote">{lastCounter.message}</p>}
                  </Section>
                )}

                {detail.status === 'proposal_sent' && detail.proposal_expires_at && (
                  <div className="stg-info">
                    Proposition envoyée le {frDateTime(detail.proposal_sent_at)}. En attente de la réponse du demandeur
                    (relance automatique à 3 jours, expiration le {frDate(detail.proposal_expires_at, true)}).
                  </div>
                )}

                {detail.terms && (
                  <Section icon={cilCheckAlt} title="Conditions retenues" tone="#059669">
                    <Terms t={detail.terms} />
                  </Section>
                )}

                {detail.status === 'rejected' && detail.rejection_reason && (
                  <Section icon={cilBan} title="Motif du rejet" tone="#e11d48">
                    <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{detail.rejection_reason}</p>
                  </Section>
                )}

                <Section icon={cilUser} title="Le demandeur">
                  <dl className="stg-dl">
                    <Row l="Né(e) le" v={`${frDate(detail.date_naissance, true)} à ${detail.lieu_naissance}`} />
                    <Row l="Nationalité" v={detail.nationalite} />
                    <Row l="Établissement" v={detail.etablissement} />
                    <Row l="Formation" v={detail.formation} />
                    <Row l="Début souhaité" v={detail.date_debut_souhaitee ? frDate(detail.date_debut_souhaitee, true) : 'Non précisé'} />
                    <Row l="Durée souhaitée" v={detail.duree_souhaitee} />
                    <Row l="Thème / service" v={detail.theme_souhaite || '—'} />
                    <Row l="WhatsApp" v={<a href={`https://wa.me/${detail.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">{detail.whatsapp}</a>} />
                    <Row l="Email" v={<a href={`mailto:${detail.email}`}>{detail.email}</a>} />
                    <Row l="Déposée le" v={frDateTime(detail.created_at)} />
                  </dl>
                </Section>

                <Section icon={cilFile} title={`Pièces (${detail.files.length})`}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {detail.files.map(f => (
                      <button key={f.key} type="button" className="stg-file" onClick={() => setViewerKey(f.key)}>
                        <CIcon icon={cilFile} style={{ width: 16, color: f.ext === 'pdf' ? '#e11d48' : '#0284c7' }} />
                        {f.label}
                      </button>
                    ))}
                    {detail.files.length === 0 && <span style={{ color: '#94a3b8' }}>Aucune pièce disponible.</span>}
                  </div>
                </Section>
              </div>

              <div className="stg-col">
                {detail.status === 'accepted' && (
                  <Section icon={cilCalendarCheck} title="Présence et assiduité" tone="#059669">
                    <PresencePanel
                      stageId={detail.id}
                      onConfirmShift={(newEnd, motif) => {
                        if (!detail.terms) return
                        setTerms({ ...detail.terms, date_fin: newEnd })
                        setNote(motif)
                        setFormError(null)
                        setMode('rectify')
                      }}
                    />
                  </Section>
                )}
                {detail.notes.length > 0 && (
                  <Section icon={cilDescription} title="Notes de service">
                    {detail.notes.map(n => (
                      <div key={n.id} className="stg-item">
                        <strong>{n.kind === 'rectificative' ? 'Rectificative' : 'Initiale'} · {n.number}</strong>
                        <span className="stg-muted">Émise le {frDateTime(n.issued_at)}{n.issued_by ? ` par ${n.issued_by}` : ' (accord du demandeur)'}</span>
                        {n.motif && <span className="stg-muted">Motif : {n.motif}</span>}
                      </div>
                    ))}
                    <p className="stg-muted" style={{ margin: '6px 0 0' }}>Le document PDF sera disponible dès l'intégration du modèle officiel.</p>
                  </Section>
                )}

                <Section icon={cilCommentBubble} title="Échanges avec le demandeur">
                  {detail.exchanges.length === 0 && <span className="stg-muted">Aucun échange pour l'instant.</span>}
                  {detail.exchanges.map(x => (
                    <div key={x.id} className="stg-msg" data-staff={x.author === 'staff' ? '1' : '0'}>
                      <span className="stg-muted">
                        {x.author === 'staff' ? (x.author_name || 'Responsable de division') : 'Demandeur'} · {frDateTime(x.at)}
                      </span>
                      <strong>
                        {x.kind === 'accept' ? 'Proposition acceptée'
                          : `${x.kind === 'counter' ? 'Dates proposées' : 'Proposition'} : ${frDate(x.date_debut)} → ${frDate(x.date_fin)}`}
                      </strong>
                      {x.message && <span style={{ whiteSpace: 'pre-line' }}>{x.message}</span>}
                    </div>
                  ))}
                </Section>

                <Section icon={cilHistory} title="Historique">
                  {detail.history.map(h => (
                    <div key={h.id} className="stg-hist">
                      <span className="stg-dot" />
                      <div>
                        <strong>{HISTORY_LABELS[h.action] ?? h.action}</strong>
                        <span className="stg-muted">
                          {frDateTime(h.at)} · {h.actor === 'staff' ? (h.user_name || 'Personnel') : h.actor === 'demandeur' ? 'Demandeur' : 'Automatique'}
                        </span>
                        {h.comment && <span style={{ whiteSpace: 'pre-line' }}>{h.comment}</span>}
                      </div>
                    </div>
                  ))}
                </Section>
              </div>
            </div>
          )}

          {detail && (mode === 'propose' || mode === 'rectify') && terms && (
            <div className="stg-panel">
              <h6 style={{ fontWeight: 800 }}>
                {mode === 'propose' ? 'Proposition au demandeur' : 'Modifier les conditions (note rectificative)'}
              </h6>
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
                notePlaceholder={mode === 'propose' ? 'Ex. : Bienvenue ! Merci de confirmer ces dates.' : 'Ex. : prolongation demandée par le service.'}
                allowPastStart={mode === 'rectify'}
              />
            </div>
          )}

          {detail && mode === 'reject' && (
            <div className="stg-panel">
              <h6 style={{ fontWeight: 800 }}>Ne pas retenir la demande</h6>
              <p className="stg-muted">Le motif ci-dessous (modifiable) sera envoyé au demandeur par WhatsApp et par email. Le formulaire de demande reste ouvert.</p>
              <CFormTextarea rows={5} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} />
            </div>
          )}

          {formError && <div className="stg-error">{formError}</div>}
        </CModalBody>

        {detail && (
          <CModalFooter style={{ justifyContent: 'space-between', gap: 8 }}>
            {mode === 'view' ? (
              <>
                <CButton color="secondary" variant="ghost" onClick={onClose}>Fermer</CButton>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
                  {detail.can.reject && (
                    <CButton color="danger" variant="outline" onClick={() => openMode('reject')}>
                      <CIcon icon={cilBan} className="me-1" />Ne pas retenir
                    </CButton>
                  )}
                  {detail.can.rectify && (
                    <CButton color="primary" variant="outline" onClick={() => openMode('rectify')}>
                      <CIcon icon={cilPencil} className="me-1" />Modifier les conditions
                    </CButton>
                  )}
                  {detail.can.propose && (
                    <CButton color={detail.can.accept_counter ? 'primary' : 'success'} variant={detail.can.accept_counter ? 'outline' : undefined}
                      style={detail.can.accept_counter ? undefined : { color: '#fff' }} onClick={() => openMode('propose')}>
                      <CIcon icon={cilSend} className="me-1" />{detail.status === 'submitted' ? 'Faire la proposition' : 'Nouvelle proposition'}
                    </CButton>
                  )}
                  {detail.can.accept_counter && (
                    <CButton color="success" style={{ color: '#fff' }} disabled={busy}
                      onClick={() => run(() => stageService.acceptCounter(detail.id), 'Contre-proposition acceptée')}>
                      {busy ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilCheckAlt} className="me-1" />}
                      Accepter ses dates
                    </CButton>
                  )}
                </div>
              </>
            ) : (
              <>
                <CButton color="secondary" variant="ghost" onClick={() => { setMode('view'); setFormError(null) }} disabled={busy}>Retour</CButton>
                <CButton color={mode === 'reject' ? 'danger' : 'success'} style={{ color: '#fff' }} onClick={submit} disabled={busy}>
                  {busy && <CSpinner size="sm" className="me-1" />}
                  {mode === 'propose' ? 'Envoyer la proposition' : mode === 'rectify' ? 'Émettre la note rectificative' : 'Confirmer et informer le demandeur'}
                </CButton>
              </>
            )}
          </CModalFooter>
        )}

        <style>{`
          .stg-pill { font-size: .72rem; font-weight: 800; padding: 3px 10px; border-radius: 999px; }
          .stg-grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 14px; }
          .stg-col { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
          @media (max-width: 991px) { .stg-grid { grid-template-columns: minmax(0, 1fr); } }
          .stg-sec { background: #fff; border: 1px solid #e6ebf2; border-radius: 12px; padding: 14px 16px; }
          .stg-sec h6 { display: flex; align-items: center; gap: 8px; font-size: .86rem; font-weight: 800; margin: 0 0 10px; color: #0f172a; }
          .stg-dl { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 6px 14px; margin: 0; font-size: .88rem; }
          .stg-dl dt { color: #64748b; font-weight: 600; }
          .stg-dl dd { margin: 0; color: #0f172a; font-weight: 600; overflow-wrap: anywhere; }
          .stg-muted { display: block; color: #64748b; font-size: .8rem; }
          .stg-quote { margin: 8px 0 0; padding: 8px 12px; border-left: 3px solid #c4b5fd; background: #faf5ff; border-radius: 6px; white-space: pre-line; }
          .stg-info { background: #fffbeb; border: 1px solid #fde68a; color: #78350f; border-radius: 12px; padding: 10px 14px; font-size: .86rem; }
          .stg-file { display: inline-flex; align-items: center; gap: 6px; border: 1px solid #dbe3ec; background: #fff; border-radius: 10px; padding: 7px 12px; font-size: .84rem; font-weight: 600; color: #1e293b; cursor: pointer; }
          .stg-file:hover { border-color: #0f766e; color: #0f766e; }
          .stg-item, .stg-msg { display: flex; flex-direction: column; gap: 2px; padding: 9px 11px; border-radius: 10px; background: #f8fafc; margin-bottom: 8px; font-size: .86rem; }
          .stg-msg[data-staff='1'] { background: #f0fdfa; }
          .stg-msg[data-staff='0'] { background: #f5f3ff; }
          .stg-hist { display: flex; gap: 10px; font-size: .85rem; padding: 6px 0; }
          .stg-hist > div { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
          .stg-dot { width: 9px; height: 9px; border-radius: 50%; background: #0f766e; margin-top: 6px; flex-shrink: 0; }
          .stg-panel { background: #fff; border: 1px solid #e6ebf2; border-radius: 12px; padding: 16px; }
          .stg-error { margin-top: 12px; background: #fff1f2; border: 1px solid #fecdd3; color: #9f1239; border-radius: 10px; padding: 10px 14px; font-size: .88rem; }
        `}</style>
      </CModal>

      {detail && (
        <StageFileViewer
          visible={viewerKey !== null}
          stageId={detail.id}
          files={detail.files}
          initialKey={viewerKey}
          onClose={() => setViewerKey(null)}
        />
      )}
    </>
  )
}

const Section = ({ icon, title, tone = '#0f766e', children }: { icon: any; title: string; tone?: string; children: React.ReactNode }) => (
  <section className="stg-sec">
    <h6><CIcon icon={icon} style={{ width: 16, color: tone }} />{title}</h6>
    {children}
  </section>
)

const Row = ({ l, v }: { l: string; v: React.ReactNode }) => (<><dt>{l}</dt><dd>{v}</dd></>)

const Terms = ({ t }: { t: StageTerms }) => (
  <dl className="stg-dl">
    <Row l="Service" v={t.service} />
    <Row l="Lieu" v={t.lieu} />
    <Row l="Début" v={frDate(t.date_debut, true)} />
    <Row l="Fin" v={frDate(t.date_fin, true)} />
    <Row l="Durée" v={durationLabel(t.date_debut, t.date_fin) ?? '—'} />
    <Row l="Horaires" v={horairesLabel(t.horaires)} />
  </dl>
)

export default StageDetailModal
