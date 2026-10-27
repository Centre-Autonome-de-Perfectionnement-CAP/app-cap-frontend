// src/components/document-request/dossierFileCache.ts
//
// Cache des documents d'un dossier pour le visualiseur.
//  - un document déjà ouvert s'affiche instantanément (pas de 2e téléchargement) ;
//  - les documents du dossier sont préchargés en arrière-plan dès l'ouverture
//    de la fiche, 2 à la fois, le premier en priorité ;
//  - un même document n'est jamais téléchargé deux fois en parallèle ;
//  - au-delà de MAX_ENTRIES, les plus anciens sont libérés de la mémoire.
// La clé inclut le chemin et la date d'ajout : un fichier remplacé est
// rechargé.

import documentRequestService from '@/services/document-request.service'
import type { AttachmentViewerFile } from './AttachmentViewerModal'
import { retype, type FileKind } from './fileKind'

export type { FileKind }

export interface CachedFile { url: string; filename?: string; kind: FileKind; ext: string }

const MAX_ENTRIES = 40
const CONCURRENCY = 2

const done     = new Map<string, CachedFile>()           // ordre d'insertion = ancienneté
const inFlight = new Map<string, Promise<CachedFile>>()

const keyOf = (demandeId: number, f: AttachmentViewerFile) =>
  `${demandeId}|${f.source}|${f.key}|${f.path}|${f.uploadedAt ?? ''}`

const remember = (k: string, v: CachedFile) => {
  done.delete(k)
  done.set(k, v)
  while (done.size > MAX_ENTRIES) {
    const [oldKey, oldVal] = done.entries().next().value as [string, CachedFile]
    URL.revokeObjectURL(oldVal.url)
    done.delete(oldKey)
  }
}

/** Document déjà en mémoire (affichage immédiat), sinon null. */
export function peekDossierFile(demandeId: number, f: AttachmentViewerFile): CachedFile | null {
  return done.get(keyOf(demandeId, f)) ?? null
}

/** Récupère un document (depuis le cache, un téléchargement en cours, ou le serveur). */
export function getDossierFile(demandeId: number, f: AttachmentViewerFile): Promise<CachedFile> {
  const k = keyOf(demandeId, f)
  const hit = done.get(k)
  if (hit) return Promise.resolve(hit)
  const pending = inFlight.get(k)
  if (pending) return pending

  const p = documentRequestService.previewFileContent(demandeId, f.source, f.key)
    .then(async r => {
      const t = await retype(r.url, r.filename || f.path)
      const v: CachedFile = { url: t.url, filename: r.filename, kind: t.kind, ext: t.ext }
      remember(k, v)
      return v
    })
    .finally(() => { inFlight.delete(k) })
  inFlight.set(k, p)
  return p
}

/** Précharge les documents en arrière-plan (erreurs ignorées : elles s'afficheront à l'ouverture). */
export function prefetchDossierFiles(demandeId: number, files: AttachmentViewerFile[]): void {
  if (!demandeId || files.length === 0) return
  const queue = files.filter(f => !done.has(keyOf(demandeId, f)))
  let i = 0
  const next = (): Promise<void> => {
    if (i >= queue.length) return Promise.resolve()
    const f = queue[i++]
    return getDossierFile(demandeId, f).then(() => undefined, () => undefined).then(next)
  }
  for (let n = 0; n < CONCURRENCY; n++) void next()
}
