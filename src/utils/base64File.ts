// src/utils/base64File.ts
// Fichiers reçus en JSON (base64) : convertis en URL locale. Ils ne passent
// jamais par un téléchargement direct, qu'un gestionnaire de téléchargement
// pourrait intercepter.

export interface LocalFile { url: string; name: string; mime: string }

export const base64ToBlobUrl = (content: string, mime: string): string => {
  const bin = atob(content)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: mime }))
}

/** { content, name?, mime? } → fichier local ; `forcedMime` impose le type. */
export const localFileFrom = (res: any, fallbackName: string, forcedMime?: string): LocalFile => {
  if (!res?.content) throw new Error("Ce document n'a pas pu être chargé.")
  const mime = forcedMime ?? String(res.mime || 'application/octet-stream')
  return { url: base64ToBlobUrl(res.content, mime), name: String(res.name || fallbackName), mime }
}
