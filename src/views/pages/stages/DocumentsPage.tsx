// src/views/pages/stages/DocumentsPage.tsx
// Documents et références : fichiers (modèles, règlement, tutoriels…) et
// liens, ajoutés par le personnel, visibles de tous les stagiaires en stage.
// Les nouveautés sont annoncées à tous dans le récapitulatif du soir.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CButton, CFormInput, CFormLabel, CFormSelect, CFormTextarea, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilExternalLink, cilFile, cilLink, cilPlus, cilTrash } from '@coreui/icons'
import feedbackService, { type StageDocument } from '@/services/stageFeedback.service'
import { friendlyError, showSuccess } from '@/components/common/ActionResult'
import { PageHead, Empty, FilterTabs, StagesStyles } from './StagesUi'
import { frDate } from './stageUtils'

const DocumentsPage = () => {
  const [items, setItems] = useState<StageDocument[] | null>(null)
  const [categories, setCategories] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState<number | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<StageDocument | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const r = await feedbackService.documents()
      setItems(r.items); setCategories(r.categories)
    } catch (e) { setError(friendlyError(e)) }
  }, [])
  useEffect(() => { load() }, [load])

  const tabs = useMemo(() => [
    { key: 'all', label: 'Tous', count: items?.length },
    ...Object.entries(categories).map(([key, label]) => ({ key, label, count: items?.filter(d => d.category === key).length }))
      .filter(t => t.count),
  ], [categories, items])
  const shown = items?.filter(d => filter === 'all' || d.category === filter) ?? null

  const open = async (d: StageDocument) => {
    if (d.kind === 'link') { window.open(d.url as string, '_blank', 'noopener,noreferrer'); return }
    setBusy(d.id)
    try { await feedbackService.downloadDocument(d) } catch (e) { setError(friendlyError(e)) } finally { setBusy(null) }
  }
  const remove = async () => {
    if (!confirmDelete) return
    setBusy(confirmDelete.id)
    try {
      await feedbackService.deleteDocument(confirmDelete.id)
      setConfirmDelete(null); load()
    } catch (e) { setError(friendlyError(e)) } finally { setBusy(null) }
  }

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title="Documents et références"
        subtitle="Modèles, règlement, tutoriels et liens utiles, visibles de tous les stagiaires."
        actions={<CButton color="primary" size="sm" onClick={() => setAdding(true)}><CIcon icon={cilPlus} className="me-1" />Ajouter</CButton>}
      />
      {tabs.length > 2 && <FilterTabs options={tabs} value={filter} onChange={setFilter} />}
      {error && <div className="stg-err">{error}</div>}
      {!items && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}
      {shown && shown.length === 0 && <div className="stg-card"><Empty text="Aucun document pour le moment." /></div>}

      <div className="stg-list">
        {shown?.map(d => (
          <div key={d.id} className="stg-card stg-row2">
            <span style={{ width: 38, height: 38, borderRadius: 10, background: '#f0fdfa', color: '#0f766e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CIcon icon={d.kind === 'link' ? cilLink : cilFile} style={{ width: 18 }} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <strong style={{ color: '#0f172a', overflowWrap: 'anywhere' }}>{d.title}</strong>
              {d.description && <span style={{ display: 'block', fontSize: '.875rem', color: '#334155' }}>{d.description}</span>}
              <span className="stg-muted" style={{ display: 'block' }}>
                {d.category_label} · ajouté le {frDate(d.created_at)}{d.by ? ` par ${d.by}` : ''}
              </span>
            </span>
            <CButton size="sm" color="primary" variant="outline" disabled={busy === d.id} onClick={() => open(d)}>
              {busy === d.id ? <CSpinner size="sm" /> : <CIcon icon={d.kind === 'link' ? cilExternalLink : cilCloudDownload} className="me-1" />}
              {d.kind === 'link' ? 'Ouvrir' : 'Télécharger'}
            </CButton>
            <CButton size="sm" color="danger" variant="ghost" title={`Supprimer « ${d.title} »`} aria-label={`Supprimer ${d.title}`} onClick={() => setConfirmDelete(d)}>
              <CIcon icon={cilTrash} />
            </CButton>
          </div>
        ))}
      </div>

      {adding && <AddModal categories={categories} onClose={() => setAdding(false)} onAdded={() => { setAdding(false); load() }} />}
      <CModal visible={!!confirmDelete} onClose={() => setConfirmDelete(null)} alignment="center">
        <CModalHeader><CModalTitle>Supprimer le document</CModalTitle></CModalHeader>
        <CModalBody>Supprimer « {confirmDelete?.title} » ? Les stagiaires ne le verront plus.</CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={() => setConfirmDelete(null)}>Annuler</CButton>
          <CButton color="danger" style={{ color: '#fff' }} disabled={busy !== null} onClick={remove}>Supprimer</CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

const AddModal = ({ categories, onClose, onAdded }: { categories: Record<string, string>; onClose: () => void; onAdded: () => void }) => {
  const [kind, setKind] = useState<'file' | 'link'>('file')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const save = async () => {
    if (!title.trim()) { setErr('Donnez un titre au document.'); return }
    if (!category) { setErr('Choisissez la catégorie.'); return }
    if (kind === 'file' && !file) { setErr('Choisissez le fichier.'); return }
    if (kind === 'link' && !url.trim()) { setErr('Saisissez le lien.'); return }
    if (file && file.size > 20 * 1024 * 1024) { setErr('Le fichier dépasse 20 Mo.'); return }
    setBusy(true); setErr(null)
    try {
      await feedbackService.addDocument({ title: title.trim(), category, description: description.trim() || undefined,
        file: kind === 'file' ? file : null, url: kind === 'link' ? url.trim() : undefined })
      showSuccess('Document ajouté', 'Il sera annoncé à tous ce soir.')
      onAdded()
    } catch (e) { setErr(friendlyError(e)) } finally { setBusy(false) }
  }

  return (
    <CModal visible onClose={onClose} alignment="center">
      <CModalHeader><CModalTitle>Ajouter un document</CModalTitle></CModalHeader>
      <CModalBody>
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {(['file', 'link'] as const).map(k => (
            <CButton key={k} size="sm" color="primary" variant={kind === k ? undefined : 'outline'} style={{ flex: 1 }} onClick={() => setKind(k)}>
              <CIcon icon={k === 'file' ? cilFile : cilLink} className="me-1" />{k === 'file' ? 'Un fichier' : 'Un lien'}
            </CButton>
          ))}
        </div>
        <CFormLabel className="fw-semibold">Titre <span className="text-danger">*</span></CFormLabel>
        <CFormInput value={title} maxLength={200} onChange={e => setTitle(e.target.value)} placeholder="Exemple : Modèle de rapport de fin de stage" />
        <CFormLabel className="fw-semibold mt-3">Catégorie <span className="text-danger">*</span></CFormLabel>
        <CFormSelect value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Choisir…</option>
          {Object.entries(categories).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </CFormSelect>
        {kind === 'file' ? <>
          <CFormLabel className="fw-semibold mt-3">Fichier <span className="text-danger">*</span></CFormLabel>
          <CFormInput type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.jpg,.jpeg,.png,.webp" onChange={e => setFile((e.target as HTMLInputElement).files?.[0] ?? null)} />
          <div className="stg-muted mt-1">Word, PDF, PowerPoint, Excel, ZIP ou image, 20 Mo au plus.</div>
        </> : <>
          <CFormLabel className="fw-semibold mt-3">Lien <span className="text-danger">*</span></CFormLabel>
          <CFormInput value={url} maxLength={1000} onChange={e => setUrl(e.target.value)} placeholder="Exemple : https://laravel.com/docs" />
        </>}
        <CFormLabel className="fw-semibold mt-3">Description</CFormLabel>
        <CFormTextarea rows={2} maxLength={500} value={description} onChange={e => setDescription(e.target.value)} placeholder="Exemple : À utiliser pour le rapport final." />
        {err && <div className="stg-err mt-3 mb-0">{err}</div>}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onClose}>Annuler</CButton>
        <CButton color="primary" disabled={busy} onClick={save}>{busy && <CSpinner size="sm" className="me-1" />}Ajouter</CButton>
      </CModalFooter>
    </CModal>
  )
}

export default DocumentsPage
