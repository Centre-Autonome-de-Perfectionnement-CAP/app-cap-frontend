// src/views/pages/stages/AvisPage.tsx
// Avis des stagiaires (suggestions, plaintes, avis positifs ou négatifs),
// anonymes par défaut ; ceux sur l'encadrement ne sont vus que des
// responsables. Onglet « Notation » (responsables) : notes du stage données
// par les stagiaires, toujours anonymes.

import { useCallback, useEffect, useState } from 'react'
import { CButton, CFormSelect, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBullhorn, cilPaperclip, cilTrash } from '@coreui/icons'
import feedbackService, { frNum, type Feedback, type RatingsBoard } from '@/services/stageFeedback.service'
import { friendlyError } from '@/components/common/ActionResult'
import { useAuth } from '@/contexts'
import { isStagesLead } from './StagesGuard'
import { PageHead, Empty, FilterTabs, Pill, StagesStyles } from './StagesUi'
import { frDateTime } from './stageUtils'

const TYPE_TONE: Record<string, [string, string]> = {
  suggestion: ['#1d4ed8', '#eff6ff'], plainte: ['#b91c1c', '#fef2f2'], positif: ['#047857', '#ecfdf5'], negatif: ['#b45309', '#fffbeb'],
}

const AvisPage = () => {
  const { role } = useAuth()
  const lead = isStagesLead(role as string)
  const [tab, setTab] = useState<'avis' | 'notation'>('avis')
  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead title="Avis des stagiaires" subtitle="Suggestions, plaintes et avis envoyés par les stagiaires, anonymes par défaut." />
      {lead && <FilterTabs options={[{ key: 'avis', label: 'Avis' }, { key: 'notation', label: 'Notation du stage' }]} value={tab} onChange={setTab} />}
      {tab === 'avis' ? <Messages /> : <Notation />}
    </div>
  )
}

const Messages = () => {
  const [items, setItems] = useState<Feedback[] | null>(null)
  const [types, setTypes] = useState<Record<string, string>>({})
  const [subjects, setSubjects] = useState<Record<string, string>>({})
  const [type, setType] = useState('')
  const [subject, setSubject] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Feedback | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const r = await feedbackService.feedbacks(type || undefined, subject || undefined)
      setItems(r.items); setTypes(r.types); setSubjects(r.subjects)
    } catch (e) { setError(friendlyError(e)) }
  }, [type, subject])
  useEffect(() => { load() }, [load])

  const run = async (id: number, fn: () => Promise<unknown>, reload = true) => {
    setBusy(id); setError(null)
    try { await fn(); if (reload) await load() } catch (e) { setError(friendlyError(e)) } finally { setBusy(null) }
  }
  const fresh = items?.filter(f => f.new).length ?? 0

  return <>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <CFormSelect size="sm" style={{ width: 'auto' }} value={type} onChange={e => setType(e.target.value)} aria-label="Type">
        <option value="">Tous les types</option>
        {Object.entries(types).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </CFormSelect>
      <CFormSelect size="sm" style={{ width: 'auto' }} value={subject} onChange={e => setSubject(e.target.value)} aria-label="Sujet">
        <option value="">Tous les sujets</option>
        {Object.entries(subjects).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </CFormSelect>
      {fresh > 0 && <span className="stg-muted">{fresh} nouveau{fresh > 1 ? 'x' : ''}</span>}
    </div>
    {error && <div className="stg-err">{error}</div>}
    {!items && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
    {items && items.length === 0 && <div className="stg-card"><Empty text="Aucun avis pour le moment." /></div>}
    <div className="stg-list">
      {items?.map(f => {
        const [color, bg] = TYPE_TONE[f.type] ?? ['#334155', '#f1f5f9']
        return (
          <div key={f.id} className="stg-card" style={f.new ? { borderColor: '#0f766e', boxShadow: 'inset 3px 0 0 #0f766e' } : undefined}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <Pill color={color} bg={bg}>{f.type_label}</Pill>
              <span className="stg-chip">{f.subject_label}</span>
              {f.new && <Pill color="#0f766e" bg="#f0fdfa">Nouveau</Pill>}
              {f.published && <Pill color="#6d28d9" bg="#f5f3ff">Sur la page publique</Pill>}
              <span className="stg-muted" style={{ marginLeft: 'auto' }}>{f.author ?? 'Anonyme'} · {frDateTime(f.created_at)}</span>
            </div>
            <div style={{ marginTop: 8, whiteSpace: 'pre-line', color: '#0f172a', overflowWrap: 'anywhere' }}>{f.message}</div>
            {(f.file_name || f.can_publish || f.can_delete) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {f.file_name && (
                  <CButton size="sm" color="secondary" variant="outline" disabled={busy === f.id} onClick={() => run(f.id, () => feedbackService.downloadFeedbackFile(f), false)}>
                    <CIcon icon={cilPaperclip} className="me-1" />{f.file_name}
                  </CButton>
                )}
                {f.can_publish && (
                  <CButton size="sm" color="primary" variant="outline" disabled={busy === f.id} onClick={() => run(f.id, () => feedbackService.publishFeedback(f.id, !f.published))}>
                    <CIcon icon={cilBullhorn} className="me-1" />{f.published ? 'Retirer de la page publique' : 'Afficher sur la page publique'}
                  </CButton>
                )}
                {f.can_delete && (
                  <CButton size="sm" color="danger" variant="ghost" onClick={() => setConfirmDelete(f)}><CIcon icon={cilTrash} className="me-1" />Supprimer</CButton>
                )}
              </div>
            )}
            {f.public_ok && !f.can_publish && f.type === 'positif' && !f.published && <div className="stg-muted mt-1">L'auteur accepte que cet avis soit cité publiquement.</div>}
          </div>
        )
      })}
    </div>
    <CModal visible={!!confirmDelete} onClose={() => setConfirmDelete(null)} alignment="center">
      <CModalHeader><CModalTitle>Supprimer l'avis</CModalTitle></CModalHeader>
      <CModalBody>Supprimer définitivement cet avis ?</CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={() => setConfirmDelete(null)}>Annuler</CButton>
        <CButton color="danger" style={{ color: '#fff' }} onClick={() => { const f = confirmDelete; setConfirmDelete(null); if (f) run(f.id, () => feedbackService.deleteFeedback(f.id)) }}>Supprimer</CButton>
      </CModalFooter>
    </CModal>
  </>
}

const Stars = ({ value }: { value: number | null }) => (
  <span style={{ fontWeight: 800, color: value == null ? '#94a3b8' : value >= 4 ? '#047857' : value >= 3 ? '#b45309' : '#b91c1c' }}>
    {value == null ? '-' : `${frNum(value, 1)} / 5`}
  </span>
)

const Notation = () => {
  const [b, setB] = useState<RatingsBoard | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => { feedbackService.ratings().then(setB).catch(e => setError(friendlyError(e))) }, [])

  if (error) return <div className="stg-err">{error}</div>
  if (!b) return <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>
  if (b.count === 0) return <div className="stg-card"><Empty text="Aucune note pour le moment." /></div>
  const monthLabel = (m: string) => new Date(`${m}-01T12:00:00`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return <>
    <div className="stg-muted">{b.count} note{b.count > 1 ? 's' : ''} sur les 12 derniers mois, toutes anonymes. Ces résultats ne sont visibles que des responsables.</div>
    <div className="stg-cards">
      {b.criteria.map(c => (
        <div key={c.key} className="stg-card">
          <div className="stg-muted">{c.label}</div>
          <div style={{ fontSize: '1.25rem' }}><Stars value={c.average} /></div>
        </div>
      ))}
    </div>
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <div className="stg-card">
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Mois par mois</div>
        {b.months.map(m => (
          <div key={m.month} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ textTransform: 'capitalize' }}>{monthLabel(m.month)} <span className="stg-muted">({m.count})</span></span><Stars value={m.average} />
          </div>
        ))}
      </div>
      <div className="stg-card">
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Superviseurs</div>
        {b.supervisors.length === 0 && <div className="stg-muted">Aucune note de superviseur.</div>}
        {b.supervisors.map(s => (
          <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
            <span>{s.name} <span className="stg-muted">({s.count})</span></span><Stars value={s.average} />
          </div>
        ))}
      </div>
    </div>
    {b.comments.length > 0 && (
      <div className="stg-card">
        <div style={{ fontWeight: 800, marginBottom: 6 }}>Commentaires</div>
        {b.comments.map((c, i) => (
          <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ whiteSpace: 'pre-line' }}>{c.comment}</div>
            <div className="stg-muted">{c.period}</div>
          </div>
        ))}
      </div>
    )}
  </>
}

export default AvisPage
