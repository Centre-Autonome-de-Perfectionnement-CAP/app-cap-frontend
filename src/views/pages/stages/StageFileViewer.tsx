// src/views/pages/stages/StageFileViewer.tsx
// Visualiseur des documents du module Stages : même cadre que celui des
// Demandes (ViewerFrame), type réel du fichier lu dans son contenu (une photo
// compressée ou mal nommée s'affiche quand même). Les pièces d'un dossier
// s'ouvrent par tranches : un PDF s'affiche dès ses premières pages.

import { useEffect, useState } from 'react'
import ViewerFrame from '@/components/document-request/ViewerFrame'
import { retype, type FileKind } from '@/components/document-request/fileKind'
import { openProgressive, type PdfStream } from '@/components/document-request/progressiveFile'
import stageService from '@/services/stage.service'
import { friendlyError } from '@/components/common/ActionResult'
import { saveLocalFile, type LocalFile } from '@/utils/base64File'

interface Props {
  visible: boolean
  /** Pièces d'une demande de stage (chargeur par défaut). */
  stageId?: number
  files: { key: string; label: string }[]
  initialKey: string | null
  onClose: () => void
  /** Autre source (scan d'une attestation, justificatif, rapport…). */
  loader?: (key: string) => Promise<LocalFile>
  /** Titre affiché au-dessus du document (par défaut : son libellé). */
  title?: string
}

type Shown = { url: string | null; name: string; kind: FileKind; stream?: PdfStream; full: () => Promise<string> }

const StageFileViewer = ({ visible, stageId, files, initialKey, onClose, loader, title }: Props) => {
  const [key, setKey] = useState<string | null>(initialKey)
  const [file, setFile] = useState<Shown | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (visible) setKey(initialKey) }, [visible, initialKey])

  useEffect(() => {
    if (!visible || !key) return
    let alive = true
    let url: string | null = null
    setFile(null); setError(null)
    const label = files.find(f => f.key === key)?.label ?? key
    // Autre source (scan, justificatif…) : fichier complet, libéré à la fermeture.
    const shown: Promise<Shown> = loader
      ? loader(key).then(async f => {
        const t = await retype(f.url, f.name)
        url = t.url
        return { url: t.url, name: f.name, kind: t.kind, full: () => Promise.resolve(t.url) }
      })
      // Pièce du dossier : par tranches, gardée en mémoire pour la session.
      : openProgressive(`stage-${stageId}-${key}`, stageService.fileChunks(stageId as number, key), label)
    shown
      .then(f => { if (alive) setFile(f); else if (url) URL.revokeObjectURL(url) })
      .catch(e => { if (alive) setError(friendlyError(e)) })
    return () => { alive = false; if (url) URL.revokeObjectURL(url) }
  }, [visible, key, stageId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null

  const index = Math.max(0, files.findIndex(f => f.key === key))
  const current = files[index]

  const download = () => {
    if (!file) return
    file.full().then(u => saveLocalFile(u, file.name)).catch(e => setError(friendlyError(e)))
  }

  return (
    <ViewerFrame
      title={title ?? current?.label ?? 'Document'}
      subtitle={title && current ? current.label : undefined}
      items={files.map(f => ({ id: f.key, label: f.label }))}
      index={index}
      onIndex={i => setKey(files[i]?.key ?? null)}
      loading={!file && !error}
      error={error}
      file={file}
      onDownload={download}
      onClose={onClose}
    />
  )
}

export default StageFileViewer
