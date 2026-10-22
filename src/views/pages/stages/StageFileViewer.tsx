// src/views/pages/stages/StageFileViewer.tsx
// Visualiseur des documents du module Stages : même cadre que celui des
// Demandes (ViewerFrame), type réel du fichier lu dans son contenu (une photo
// compressée ou mal nommée s'affiche quand même).

import { useEffect, useState } from 'react'
import ViewerFrame from '@/components/document-request/ViewerFrame'
import { retype, type FileKind } from '@/components/document-request/fileKind'
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

type Shown = { url: string; name: string; kind: FileKind }

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
    const load = loader ?? ((k: string) => stageService.fileContent(stageId as number, k))
    load(key)
      .then(async f => {
        const t = await retype(f.url, f.name)
        url = t.url
        if (alive) setFile({ url: t.url, name: f.name, kind: t.kind })
        else URL.revokeObjectURL(t.url)
      })
      .catch(e => { if (alive) setError(friendlyError(e)) })
    return () => { alive = false; if (url) URL.revokeObjectURL(url) }
  }, [visible, key, stageId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible) return null

  const index = Math.max(0, files.findIndex(f => f.key === key))
  const current = files[index]

  const download = () => { if (file) saveLocalFile(file.url, file.name) }

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
