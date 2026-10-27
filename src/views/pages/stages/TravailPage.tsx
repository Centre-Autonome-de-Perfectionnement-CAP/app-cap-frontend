// src/views/pages/stages/TravailPage.tsx
// Fiche d'un travail de la bibliothèque : informations (préremplies depuis le
// dossier, modifiables), personnes et leurs contacts (jamais publiés),
// document, publication (publique ou par lien), messages reçus.
// « nouveau » : travail ajouté à la main.

import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  CButton, CCard, CCardBody, CCol, CFormCheck, CFormInput, CFormLabel, CFormSelect, CFormTextarea, CRow, CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus, cilTrash, cilExternalLink, cilCopy } from '@coreui/icons'
import bibliothequeService, { type PersonRole, type WorkDetail, type WorkForm, type WorkPerson } from '@/services/bibliotheque.service'
import { showSuccess, showError, friendlyError } from '@/components/common/ActionResult'
import { Breadcrumb, Pill, StagesStyles } from './StagesUi'
import { STUDY_CYCLES, WORK_STATUS, frDateTime, studyYears } from './stageUtils'
import StageFileViewer from './StageFileViewer'
import { UPLOAD_LIMIT_MB, isTooHeavy } from '@/constants/validation.constants'

const ROLES: Record<PersonRole, string> = { auteur: 'Auteur', maitre: 'Maître de mémoire', superviseur: 'Superviseur' }
const LICENSES = { tous_droits: 'Tous droits réservés', cc_by_nc: 'Creative Commons BY-NC (partage permis, sans usage commercial)' }
const EMPTY: WorkForm = {
  kind: 'memoire', title: '', summary: '', keywords: '', year: String(new Date().getFullYear()),
  etablissement: '', universite: "Université d'Abomey-Calavi", filiere: '', cycle: '', annee_etude: '',
  people: [{ role: 'auteur', name: '', fonction: null, email: null, phone: null }],
}

const toForm = (w: WorkDetail): WorkForm => ({
  kind: w.kind, title: w.title, summary: w.summary ?? '', keywords: w.keywords.join(', '), year: w.year ? String(w.year) : '',
  etablissement: w.etablissement ?? '', universite: w.universite ?? '', filiere: w.filiere ?? '',
  cycle: w.cycle ?? '', annee_etude: w.annee_etude ? String(w.annee_etude) : '', people: w.people,
})

const TravailPage = () => {
  const { id } = useParams()
  const isNew = id === 'nouveau'
  const navigate = useNavigate()
  const { state } = useLocation() as { state: { from?: string; fromLabel?: string } | null }
  const back = { label: state?.fromLabel ?? 'Bibliothèque', to: state?.from ?? '/stages/bibliotheque' }

  const [work, setWork] = useState<WorkDetail | null>(null)
  const [form, setForm] = useState<WorkForm>(EMPTY)
  const [file, setFile] = useState<File | null>(null)
  const [pub, setPub] = useState({ visibility: 'public' as 'public' | 'link', downloadable: true, license: 'tous_droits' })
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [viewing, setViewing] = useState(false)

  const apply = (w: WorkDetail) => {
    setWork(w); setForm(toForm(w))
    setPub({ visibility: w.status === 'published' ? w.visibility : 'public', downloadable: w.downloadable, license: w.license })
  }

  const load = useCallback(async () => {
    if (isNew) return
    try { apply(await bibliothequeService.show(Number(id))) } catch (e) { setError(friendlyError(e)) }
  }, [id, isNew])
  useEffect(() => { load() }, [load])

  const set = <K extends keyof WorkForm>(k: K, v: WorkForm[K]) => setForm(f => ({ ...f, [k]: v }))
  const setPerson = (i: number, patch: Partial<WorkPerson>) => set('people', form.people.map((p, j) => (j === i ? { ...p, ...patch } : p)))

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key); setError(null)
    try { await fn() } catch (e) { setError(friendlyError(e)) } finally { setBusy(null) }
  }

  const save = () => run('save', async () => {
    if (isNew) {
      if (!file) { setError('Ajoutez le PDF du travail.'); return }
      const w = await bibliothequeService.create(form, file)
      navigate(`/stages/bibliotheque/${w.id}`, { replace: true, state })
      await showSuccess('Travail ajouté', 'Il est en brouillon : publiez-le quand la fiche est prête.')
      return
    }
    apply(await bibliothequeService.update(work!.id, form))
    await showSuccess('Fiche enregistrée')
  })

  const pickFile = (f: File | null) => {
    if (f && isTooHeavy(f, UPLOAD_LIMIT_MB.REPORT)) { setError(`Le PDF ne doit pas dépasser ${UPLOAD_LIMIT_MB.REPORT} Mo.`); return }
    setFile(f)
    if (f && work) run('file', async () => { apply(await bibliothequeService.replaceFile(work.id, f)); setFile(null) })
  }

  const publish = () => run('publish', async () => {
    apply(await bibliothequeService.publish(work!.id, pub))
    await showSuccess('Publié', pub.visibility === 'public' ? 'Visible par tous et trouvable par les moteurs de recherche.' : 'Seules les personnes qui ont le lien le voient.')
  })

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); await showSuccess('Lien copié', text) } catch { await showError('Copie impossible', text) }
  }

  if (!isNew && !work) {
    return (
      <div className="stg-page"><StagesStyles />
        <Breadcrumb items={[{ label: back.label, to: back.to }, { label: 'Travail' }]} />
        {error ? <div className="stg-err">{error}</div> : <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
      </div>
    )
  }

  const published = work?.status === 'published'
  const years = studyYears(form.cycle)

  return (
    <div className="stg-page">
      <StagesStyles />
      <Breadcrumb items={[{ label: back.label, to: back.to }, { label: isNew ? 'Nouveau travail' : form.title || 'Travail' }]} />
      <div className="stg-card" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '1.25rem', margin: 0 }}>{isNew ? 'Ajouter un travail' : form.title}</h1>
          {work && <div className="stg-muted">{work.kind_label}{work.source_type === 'stage_report' ? ' · proposé par le stagiaire' : work.source_type === 'defense' ? ' · mémoire de soutenance' : ' · ajouté à la main'}</div>}
        </div>
        {work && <Pill color={WORK_STATUS[work.status].color} bg={WORK_STATUS[work.status].bg}>{work.status_label}</Pill>}
      </div>
      {error && <div className="stg-err">{error}</div>}

      <CRow className="g-3">
        <CCol lg={7}>
          <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}><CCardBody>
            <strong>Fiche</strong>
            <CRow className="g-3 mt-0">
              <CCol md={5}>
                <CFormLabel className="fw-semibold small">Type</CFormLabel>
                <CFormSelect value={form.kind} onChange={e => set('kind', e.target.value as WorkForm['kind'])}>
                  <option value="rapport_stage">Rapport de fin de formation</option>
                  <option value="memoire">Mémoire</option>
                </CFormSelect>
              </CCol>
              <CCol md={7}>
                <CFormLabel className="fw-semibold small">Titre (thème)</CFormLabel>
                <CFormInput value={form.title} maxLength={300} onChange={e => set('title', e.target.value)} />
              </CCol>
              <CCol xs={12}>
                <CFormLabel className="fw-semibold small">Résumé</CFormLabel>
                <CFormTextarea rows={5} maxLength={3000} value={form.summary} onChange={e => set('summary', e.target.value)}
                  placeholder="Exemple : Mise en place d'une supervision centralisée du réseau…" />
                <div className="stg-muted">C'est ce que lisent les visiteurs et les moteurs de recherche.</div>
              </CCol>
              <CCol md={8}>
                <CFormLabel className="fw-semibold small">Mots-clés</CFormLabel>
                <CFormInput value={form.keywords} maxLength={400} onChange={e => set('keywords', e.target.value)} placeholder="Exemple : réseau, supervision, Zabbix" />
              </CCol>
              <CCol md={4}>
                <CFormLabel className="fw-semibold small">Année</CFormLabel>
                <CFormInput type="number" min={1990} max={2100} value={form.year} onChange={e => set('year', e.target.value)} />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold small">Établissement</CFormLabel>
                <CFormInput value={form.etablissement} maxLength={150} onChange={e => set('etablissement', e.target.value)} />
              </CCol>
              <CCol md={6}>
                <CFormLabel className="fw-semibold small">Université</CFormLabel>
                <CFormInput value={form.universite} maxLength={150} onChange={e => set('universite', e.target.value)} />
              </CCol>
              <CCol md={5}>
                <CFormLabel className="fw-semibold small">Filière</CFormLabel>
                <CFormInput value={form.filiere} maxLength={150} onChange={e => set('filiere', e.target.value)} />
              </CCol>
              <CCol xs={6} md={4}>
                <CFormLabel className="fw-semibold small">Niveau</CFormLabel>
                <CFormSelect value={form.cycle} onChange={e => setForm(f => ({ ...f, cycle: e.target.value, annee_etude: '' }))}>
                  <option value="">—</option>
                  {STUDY_CYCLES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </CFormSelect>
              </CCol>
              <CCol xs={6} md={3}>
                <CFormLabel className="fw-semibold small">Année</CFormLabel>
                <CFormSelect value={form.annee_etude} disabled={years.length === 0} onChange={e => set('annee_etude', e.target.value)}>
                  <option value="">—</option>
                  {years.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                </CFormSelect>
              </CCol>
            </CRow>

            <div style={{ display: 'flex', alignItems: 'center', marginTop: 22 }}>
              <strong style={{ flex: 1 }}>Personnes</strong>
              <CButton size="sm" color="primary" variant="ghost" disabled={form.people.length >= 12}
                onClick={() => set('people', [...form.people, { role: 'auteur', name: '', fonction: null, email: null, phone: null }])}>
                <CIcon icon={cilPlus} className="me-1" />Ajouter
              </CButton>
            </div>
            <div className="stg-muted" style={{ marginBottom: 8 }}>Les emails et numéros ne sont jamais publiés : ils servent au bouton « Contacter ».</div>
            {form.people.map((p, i) => (
              <div key={i} className="trv-person">
                <CFormSelect size="sm" value={p.role} onChange={e => setPerson(i, { role: e.target.value as PersonRole })} aria-label="Rôle">
                  {Object.entries(ROLES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </CFormSelect>
                <CFormInput size="sm" className="name" value={p.name} maxLength={150} onChange={e => setPerson(i, { name: e.target.value })} placeholder="Nom et prénoms" aria-label="Nom" />
                <CButton size="sm" className="del" color="danger" variant="ghost" disabled={form.people.length === 1} onClick={() => set('people', form.people.filter((_, j) => j !== i))} title="Retirer"><CIcon icon={cilTrash} /></CButton>
                <CFormInput size="sm" value={p.fonction ?? ''} maxLength={150} onChange={e => setPerson(i, { fonction: e.target.value || null })} placeholder="Fonction (facultatif)" aria-label="Fonction" />
                <CFormInput size="sm" type="email" value={p.email ?? ''} maxLength={254} onChange={e => setPerson(i, { email: e.target.value || null })} placeholder="Email" aria-label="Email" />
                <CFormInput size="sm" value={p.phone ?? ''} maxLength={30} onChange={e => setPerson(i, { phone: e.target.value || null })} placeholder="Téléphone" aria-label="Téléphone" />
              </div>
            ))}

            {isNew && (
              <div style={{ marginTop: 18 }}>
                <CFormLabel className="fw-semibold small">Document (PDF, {UPLOAD_LIMIT_MB.REPORT} Mo maximum)</CFormLabel>
                <CFormInput type="file" accept="application/pdf" onChange={e => pickFile(e.target.files?.[0] ?? null)} />
              </div>
            )}
            <div style={{ marginTop: 18 }}>
              <CButton color="primary" disabled={!!busy || !form.title.trim()} onClick={save}>
                {busy === 'save' && <CSpinner size="sm" className="me-1" />}{isNew ? 'Ajouter le travail' : 'Enregistrer la fiche'}
              </CButton>
            </div>
          </CCardBody></CCard>
        </CCol>

        {work && (
          <CCol lg={5}>
            <CCard className="border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}><CCardBody>
              <strong>Document</strong>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                {work.has_file && <CButton size="sm" color="secondary" variant="outline" onClick={() => setViewing(true)}>Voir le PDF</CButton>}
                <label className="btn btn-sm btn-outline-primary mb-0">
                  {busy === 'file' && <CSpinner size="sm" className="me-1" />}{work.has_file ? 'Remplacer le PDF' : 'Ajouter le PDF'}
                  <input type="file" accept="application/pdf" hidden onChange={e => pickFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              {!work.has_file && work.source_type === 'stage_report' && (
                <div className="stg-muted" style={{ marginTop: 8 }}>Le rapport validé du stagiaire est repris automatiquement à la publication.</div>
              )}
            </CCardBody></CCard>

            <CCard className="border-0 shadow-sm mb-3" style={{ borderRadius: 14 }}><CCardBody>
              <strong>Publication</strong>
              {work.source_type === 'stage_report' && !work.authors_consent && (
                <div className="stg-err" style={{ marginTop: 8 }}>Le stagiaire n'a pas donné son accord pour la publication.</div>
              )}
              <div style={{ marginTop: 10 }}>
                <CFormCheck type="radio" name="vis" id="vis-public" checked={pub.visibility === 'public'} onChange={() => setPub(p => ({ ...p, visibility: 'public' }))}
                  label="Public : visible par tous, trouvable sur Google" />
                <CFormCheck type="radio" name="vis" id="vis-link" checked={pub.visibility === 'link'} onChange={() => setPub(p => ({ ...p, visibility: 'link' }))}
                  label="Par lien : seules les personnes à qui vous donnez le lien" />
                <CFormCheck className="mt-2" id="dl" checked={pub.downloadable} onChange={e => setPub(p => ({ ...p, downloadable: e.target.checked }))}
                  label="Document complet en accès libre (sinon, seule la fiche est visible)" />
                <CFormLabel className="fw-semibold small mt-2">Licence</CFormLabel>
                <CFormSelect size="sm" value={pub.license} onChange={e => setPub(p => ({ ...p, license: e.target.value }))}>
                  {Object.entries(LICENSES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </CFormSelect>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                <CButton color="success" style={{ color: '#fff' }} disabled={!!busy} onClick={publish}>
                  {busy === 'publish' && <CSpinner size="sm" className="me-1" />}{published ? 'Mettre à jour la publication' : 'Publier'}
                </CButton>
                {published && <CButton color="danger" variant="outline" disabled={!!busy} onClick={() => run('unpublish', async () => apply(await bibliothequeService.unpublish(work.id)))}>Retirer</CButton>}
              </div>
              {published && (
                <div className="trv-links">
                  {work.visibility === 'public' ? (
                    <div><span className="stg-muted">Adresse publique</span>
                      <div className="trv-link"><a href={work.url!} target="_blank" rel="noreferrer">{work.url} <CIcon icon={cilExternalLink} style={{ width: 12 }} /></a>
                        <CButton size="sm" color="secondary" variant="ghost" onClick={() => copy(work.url!)} title="Copier"><CIcon icon={cilCopy} /></CButton></div>
                    </div>
                  ) : (
                    <div><span className="stg-muted">Lien à partager</span>
                      <div className="trv-link"><a href={work.share_url} target="_blank" rel="noreferrer">{work.share_url}</a>
                        <CButton size="sm" color="secondary" variant="ghost" onClick={() => copy(work.share_url)} title="Copier"><CIcon icon={cilCopy} /></CButton></div>
                      <CButton size="sm" color="link" className="p-0" onClick={() => run('link', async () => apply(await bibliothequeService.renewLink(work.id)))}>Créer un nouveau lien (l'ancien ne marchera plus)</CButton>
                    </div>
                  )}
                  <div className="stg-muted">{work.views} vue(s) · {work.downloads} ouverture(s) du PDF</div>
                </div>
              )}
              {!published && (
                <CButton size="sm" color="danger" variant="ghost" className="mt-3 px-0" disabled={!!busy}
                  onClick={() => run('delete', async () => { await bibliothequeService.remove(work.id); navigate(back.to, { replace: true }) })}>
                  <CIcon icon={cilTrash} className="me-1" />Supprimer ce travail
                </CButton>
              )}
            </CCardBody></CCard>

            <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}><CCardBody>
              <strong>Messages reçus</strong>
              {work.messages.length === 0
                ? <div className="stg-muted" style={{ marginTop: 6 }}>Aucun message pour l'instant.</div>
                : work.messages.map(m => (
                  <div key={m.id} style={{ borderTop: '1px solid #f1f5f9', padding: '10px 0' }}>
                    <div style={{ fontWeight: 600 }}>{m.sender_name} <span className="stg-muted">→ {m.to_name ?? '—'} · {frDateTime(m.created_at)}</span></div>
                    <div className="stg-muted">{m.sender_email}</div>
                    <div style={{ whiteSpace: 'pre-line', marginTop: 4 }}>{m.message}</div>
                  </div>
                ))}
            </CCardBody></CCard>
          </CCol>
        )}
      </CRow>

      {work && (
        <StageFileViewer visible={viewing} files={[{ key: 'pdf', label: work.title }]} initialKey="pdf"
          loader={() => bibliothequeService.file(work.id)} onClose={() => setViewing(false)} />
      )}

      <style>{`
        .trv-person { display: grid; grid-template-columns: 170px 1fr 1fr auto; gap: 6px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
        .trv-person .name { grid-column: span 2; }
        .trv-person .del { grid-row: span 2; align-self: center; }
        .trv-links { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
        .trv-link { display: flex; align-items: center; gap: 4px; min-width: 0; }
        .trv-link a { overflow-wrap: anywhere; font-size: .9rem; }
        @media (max-width: 576px) { .trv-person { grid-template-columns: 1fr auto; } .trv-person .name { grid-column: auto; } .trv-person .del { grid-row: auto; } }
      `}</style>
    </div>
  )
}

export default TravailPage
