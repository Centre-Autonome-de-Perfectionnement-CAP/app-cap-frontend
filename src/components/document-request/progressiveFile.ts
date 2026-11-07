// src/components/document-request/progressiveFile.ts
//
// Ouverture d'un document du visualiseur par tranches (JSON base64, à l'abri
// des gestionnaires de téléchargement) :
//  - la 1re tranche donne le type réel et la taille ;
//  - un PDF s'affiche dès ses premières tranches, le reste arrive en
//    arrière-plan (voir PdfViewer) ;
//  - une image ou un petit fichier est chargé en entier ;
//  - un document entièrement reçu reste en mémoire pendant la session : le
//    rouvrir est immédiat (les plus anciens sont libérés au-delà de MAX_ENTRIES).

import { sniffBytes, kindFromName, type FileKind } from './fileKind'

export interface ChunkReply { name?: string; mime?: string; total?: number; content?: string }
/** Charge une tranche [from, from + size[ du fichier. */
export type ChunkLoader = (from: number, size: number) => Promise<ChunkReply>

/** PDF en cours de chargement, lu par tranches par le lecteur. */
export interface PdfStream {
  total: number
  head: Uint8Array
  read: (from: number, size: number) => Promise<Uint8Array>
  /** Fichier complet reçu par le lecteur : gardé pour le téléchargement et la réouverture. */
  complete: (data: Uint8Array) => void
}

export interface Opened {
  name: string
  kind: FileKind
  ext: string
  /** Adresse locale du fichier complet (null tant qu'un PDF arrive par tranches). */
  url: string | null
  stream?: PdfStream
  /** Fichier complet (téléchargement) : immédiat s'il est déjà reçu. */
  full: () => Promise<string>
}

const FIRST = 256 * 1024
const CHUNK = 1024 * 1024
const MAX_ENTRIES = 30

const fromB64 = (s?: string): Uint8Array => {
  const bin = atob(s ?? '')
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

const done = new Map<string, Opened>()
const remember = (key: string, v: Opened) => {
  done.delete(key)
  done.set(key, v)
  while (done.size > MAX_ENTRIES) {
    const [k, old] = done.entries().next().value as [string, Opened]
    if (old.url) URL.revokeObjectURL(old.url)
    done.delete(k)
  }
}

/** Tranche avec deux nouveaux essais (réseau instable). */
const fetchChunk = async (loader: ChunkLoader, from: number, size: number): Promise<ChunkReply> => {
  let last: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await loader(from, size)
    } catch (e) {
      last = e
      if (attempt < 2) await new Promise(r => setTimeout(r, 800 * (attempt + 1)))
    }
  }
  throw last
}
const withRetry = async (loader: ChunkLoader, from: number, size: number): Promise<Uint8Array> =>
  fromB64((await fetchChunk(loader, from, size)).content)

/** Lit [from, from + size[ en tranches d'au plus CHUNK. */
const readRange = async (loader: ChunkLoader, from: number, size: number): Promise<Uint8Array> => {
  const out = new Uint8Array(size)
  let at = 0
  while (at < size) {
    const part = await withRetry(loader, from + at, Math.min(CHUNK, size - at))
    if (part.length === 0) break
    out.set(part, at)
    at += part.length
  }
  return at === size ? out : out.slice(0, at)
}

/** Document déjà reçu en entier pendant la session, sinon null. */
export const peekOpened = (key: string): Opened | null => {
  const hit = done.get(key)
  // Fichier complet : affiché depuis la mémoire, sans lecture par tranches.
  return hit && hit.url ? { ...hit, stream: undefined } : null
}

/**
 * Ouvre un document. `key` identifie le fichier (même clé = même contenu) ;
 * `nameHint` sert si le serveur ne donne pas de nom.
 */
export async function openProgressive(key: string, loader: ChunkLoader, nameHint: string): Promise<Opened> {
  const hit = peekOpened(key)
  if (hit) return hit

  const first = await fetchChunk(loader, 0, FIRST)
  const head = fromB64(first.content)
  const total = first.total ?? head.length
  const name = first.name || nameHint
  const found = sniffBytes(head)
  const byName = kindFromName(name)
  const kind: FileKind = found?.kind ?? byName.kind
  const ext = found?.ext || byName.ext
  const mime = found?.mime ?? (kind === 'pdf' ? 'application/pdf' : first.mime || 'application/octet-stream')

  const finish = (data: Uint8Array): string => {
    const url = URL.createObjectURL(new Blob([data as Uint8Array<ArrayBuffer>], { type: mime }))
    opened.url = url
    remember(key, opened)
    return url
  }

  let fullPromise: Promise<string> | null = null
  const opened: Opened = {
    name, kind, ext, url: null,
    full: () => {
      if (opened.url) return Promise.resolve(opened.url)
      fullPromise ??= readRange(loader, head.length, total - head.length).then(rest => {
        const all = new Uint8Array(head.length + rest.length)
        all.set(head); all.set(rest, head.length)
        return opened.url ?? finish(all)
      }).finally(() => { fullPromise = null })
      return fullPromise
    },
  }

  if (head.length >= total) {
    finish(head)
    return opened
  }
  if (kind === 'pdf') {
    opened.stream = {
      total, head,
      read: (from, size) => readRange(loader, from, size),
      complete: data => { if (!opened.url) finish(data) },
    }
    return opened
  }
  // Image ou autre fichier volumineux : il faut l'avoir en entier.
  await opened.full()
  return opened
}
