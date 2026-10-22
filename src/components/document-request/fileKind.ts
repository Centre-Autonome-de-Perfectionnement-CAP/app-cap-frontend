// src/components/document-request/fileKind.ts
//
// Nature réelle d'un fichier, lue dans son contenu : sert à tous les
// visualiseurs (Demandes, Stages) pour choisir l'affichage.

/** Nature réelle du fichier, lue dans son contenu (pas dans son nom). */
export type FileKind = 'pdf' | 'image' | 'other'

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
export async function retype(rawUrl: string, path: string): Promise<{ url: string; kind: FileKind; ext: string }> {
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
