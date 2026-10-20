// src/views/pages/stages/StageFileViewer.tsx
// Visualiseur des pièces d'une demande de stage (même principe que celui des
// Demandes : contenu reçu en JSON, PDF dessiné dans la page, images affichées).

import { useEffect, useState } from 'react'
import { CModal, CModalHeader, CModalTitle, CModalBody, CButton, CSpinner, CFormSelect } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilChevronLeft, cilChevronRight } from '@coreui/icons'
import PdfViewer from '@/components/document-request/PdfViewer'
import stageService from '@/services/stage.service'
import { friendlyError } from '@/components/common/ActionResult'

interface Props {
  visible: boolean
  stageId: number
  files: { key: string; label: string }[]
  initialKey: string | null
  onClose: () => void
  /** Autre source (ex. scan d'une attestation) ; par défaut : pièces de la demande. */
  loader?: (key: string) => Promise<Loaded>
  title?: string
}

type Loaded = { url: string; name: string; mime: string }

const StageFileViewer = ({ visible, stageId, files, initialKey, onClose, loader, title }: Props) => {
  const [key, setKey] = useState<string | null>(initialKey)
  const [file, setFile] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (visible) setKey(initialKey) }, [visible, initialKey])

  // Échap ferme uniquement le visualiseur (pas la fiche ouverte dessous).
  useEffect(() => {
    if (!visible) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); onClose() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [visible, onClose])

  useEffect(() => {
    if (!visible || !key) return
    let alive = true
    let url: string | null = null
    setFile(null); setError(null)
    ;(loader ? loader(key) : stageService.fileContent(stageId, key))
      .then(f => { url = f.url; if (alive) setFile(f); else URL.revokeObjectURL(f.url) })
      .catch(e => { if (alive) setError(friendlyError(e)) })
    return () => { alive = false; if (url) URL.revokeObjectURL(url) }
  }, [visible, key, stageId]) // eslint-disable-line react-hooks/exhaustive-deps

  const index = files.findIndex(f => f.key === key)
  const go = (d: number) => {
    const next = files[(index + d + files.length) % files.length]
    if (next) setKey(next.key)
  }
  const download = () => {
    if (!file) return
    const a = document.createElement('a')
    a.href = file.url; a.download = file.name
    document.body.appendChild(a); a.click(); a.remove()
  }

  return (
    <CModal visible={visible} onClose={onClose} fullscreen alignment="center" keyboard={false}>
      <CModalHeader>
        <CModalTitle style={{ fontSize: '1rem' }}>{title ?? 'Pièces de la demande'}</CModalTitle>
      </CModalHeader>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '8px 16px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
        <CButton size="sm" color="light" onClick={() => go(-1)} disabled={files.length < 2} title="Précédent">
          <CIcon icon={cilChevronLeft} />
        </CButton>
        <CFormSelect size="sm" value={key ?? ''} onChange={e => setKey(e.target.value)} style={{ maxWidth: 360, flex: 1 }}>
          {files.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
        </CFormSelect>
        <CButton size="sm" color="light" onClick={() => go(1)} disabled={files.length < 2} title="Suivant">
          <CIcon icon={cilChevronRight} />
        </CButton>
        <CButton size="sm" color="primary" variant="outline" className="ms-auto" onClick={download} disabled={!file}>
          <CIcon icon={cilCloudDownload} className="me-1" />Télécharger
        </CButton>
      </div>
      <CModalBody style={{ padding: 0, display: 'flex', flexDirection: 'column', background: '#f1f5f9' }}>
        {error && <div style={{ padding: 32, textAlign: 'center', color: '#be123c' }}>{error}</div>}
        {!error && !file && (
          <div style={{ padding: 48, display: 'flex', justifyContent: 'center', gap: 10, color: '#64748b' }}>
            <CSpinner size="sm" color="primary" />Chargement du document…
          </div>
        )}
        {file && file.mime === 'application/pdf' && <PdfViewer src={file.url} title={file.name} onDownload={download} />}
        {file && file.mime.startsWith('image/') && (
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', padding: 16 }}>
            <img src={file.url} alt={file.name} style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain', boxShadow: '0 2px 10px rgba(15,23,42,.12)', background: '#fff' }} />
          </div>
        )}
        {file && file.mime !== 'application/pdf' && !file.mime.startsWith('image/') && (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <p style={{ color: '#475569' }}>Aperçu indisponible pour ce format.</p>
            <CButton color="primary" onClick={download}>Télécharger</CButton>
          </div>
        )}
      </CModalBody>
    </CModal>
  )
}

export default StageFileViewer
