// src/components/document-request/dossierFileCache.ts
//
// Documents d'un dossier pour le visualiseur (voir progressiveFile) :
//  - un document déjà ouvert s'affiche instantanément (pas de 2e téléchargement) ;
//  - un PDF s'affiche dès ses premières pages, le reste arrive en arrière-plan ;
//  - les documents du dossier sont préchargés en arrière-plan dès l'ouverture
//    de la fiche, 2 à la fois, le premier en priorité ;
//  - un même document n'est jamais téléchargé deux fois en parallèle.
// La clé inclut le chemin et la date d'ajout : un fichier remplacé est
// rechargé.

import documentRequestService from '@/services/document-request.service'
import type { AttachmentViewerFile } from './AttachmentViewerModal'
import { openProgressive, peekOpened, type Opened } from './progressiveFile'
import type { FileKind } from './fileKind'

export type { FileKind }

const CONCURRENCY = 2

const inFlight = new Map<string, Promise<Opened>>()

const keyOf = (demandeId: number, f: AttachmentViewerFile) =>
  `dossier|${demandeId}|${f.source}|${f.key}|${f.path}|${f.uploadedAt ?? ''}`

/** Document déjà reçu en entier (affichage immédiat), sinon null. */
export function peekDossierFile(demandeId: number, f: AttachmentViewerFile): Opened | null {
  return peekOpened(keyOf(demandeId, f))
}

/** Ouvre un document (depuis la mémoire, une ouverture en cours, ou le serveur). */
export function getDossierFile(demandeId: number, f: AttachmentViewerFile): Promise<Opened> {
  const k = keyOf(demandeId, f)
  const hit = peekOpened(k)
  if (hit) return Promise.resolve(hit)
  const pending = inFlight.get(k)
  if (pending) return pending

  const p = openProgressive(k, documentRequestService.previewChunks(demandeId, f.source, f.key), f.path.split('/').pop() || f.key)
    .finally(() => { inFlight.delete(k) })
  inFlight.set(k, p)
  return p
}

/** Précharge les documents en entier en arrière-plan (erreurs ignorées : elles s'afficheront à l'ouverture). */
export function prefetchDossierFiles(demandeId: number, files: AttachmentViewerFile[]): void {
  if (!demandeId || files.length === 0) return
  const queue = files.filter(f => !peekDossierFile(demandeId, f))
  let i = 0
  const next = (): Promise<void> => {
    if (i >= queue.length) return Promise.resolve()
    const f = queue[i++]
    return getDossierFile(demandeId, f).then(o => o.full()).then(() => undefined, () => undefined).then(next)
  }
  for (let n = 0; n < CONCURRENCY; n++) void next()
}
