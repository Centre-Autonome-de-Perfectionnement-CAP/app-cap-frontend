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

/** Nature réelle du fichier, lue dans son contenu (pas dans son nom). */
export type FileKind = 'pdf' | 'image' | 'other'

export interface CachedFile { url: string; filename?: string; kind: FileKind; ext: string }

// ─── Détection du vrai type ───────────────────────────────────────────────────
// Un fichier peut être mal nommé (photo de téléphone en .pdf, PDF servi en
// « application/octet-stream », HEIC…). Un <iframe> sur un type inconnu
// déclenche un téléchargement, et une <img> sur un format non pris en charge
// reste vide. On lit donc les premiers octets pour choisir l'affichage.

const sniff = (b: Uint8Array): { kind: FileKind; mime: string; ext: string } | null => {
  const at = (i: number, ...bytes: number[]) => bytes.every((v, k) => b[i + k] === v)
  const ascii = (i: number, str: string) => at(i, ...Array.from(str).map(c => c.charCodeAt(0)))
  if (ascii(0, '%PDF'))                         return { kind: 'pdf',   mime: 'application/pdf', ext: 'pdf' }
  if (at(0, 0xff, 0xd8, 0xff))                  return { kind: 'image', mime: 'image/jpeg',      ext: 'jpg' }
  if (at(0, 0x89, 0x50, 0x4e, 0x47))            return { kind: 'image', mime: 'image/png',       ext: 'png' }
  if (ascii(0, 'GIF8'))                         return { kind: 'image', mime: 'image/gif',       ext: 'gif' }
  if (ascii(0, 'RIFF') && ascii(8, 'WEBP'))     return { kind: 'image', mime: 'image/webp',      ext: 'webp' }
  if (ascii(4, 'ftyp') && (ascii(8, 'heic') || ascii(8, 'heix') || ascii(8, 'mif1') || ascii(8, 'heif')))
                                                return { kind: 'other', mime: 'image/heic',      ext: 'heic' }
  if (at(0, 0x50, 0x4b, 0x03, 0x04))            return { kind: 'other', mime: 'application/zip', ext: '' } // docx, xlsx…
  return null
}

const kindFromName = (name: string): { kind: FileKind; ext: string } => {
  const ext = (name.split('.').pop() || '').toLowerCase()
  if (ext === 'pdf') return { kind: 'pdf', ext }
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return { kind: 'image', ext }
  return { kind: 'other', ext }
}

/** Relit le fichier téléchargé et le retype selon son contenu réel. */
async function retype(rawUrl: string, path: string): Promise<{ url: string; kind: FileKind; ext: string }> {
  try {
    const blob = await (await fetch(rawUrl)).blob()
    const head = new Uint8Array(await blob.slice(0, 16).arrayBuffer())
    const found = sniff(head)
    const byName = kindFromName(path)
    const kind = found?.kind ?? byName.kind
    const ext  = found?.ext || byName.ext
    const mime = found?.mime
      ?? (kind === 'pdf' ? 'application/pdf' : kind === 'image' ? (blob.type.startsWith('image/') ? blob.type : 'image/jpeg') : blob.type || 'application/octet-stream')
    if (blob.type === mime) return { url: rawUrl, kind, ext }
    const url = URL.createObjectURL(new Blob([blob], { type: mime }))
    URL.revokeObjectURL(rawUrl)
    return { url, kind, ext }
  } catch {
    const byName = kindFromName(path)
    return { url: rawUrl, ...byName }
  }
}

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
