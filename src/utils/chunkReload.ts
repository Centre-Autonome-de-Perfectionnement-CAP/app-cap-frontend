// src/utils/chunkReload.ts
//
// Après une mise en ligne, les fichiers de l'ancienne version sont remplacés.
// Un onglet resté ouvert demande alors un morceau d'application qui n'existe
// plus : sans traitement, la page devient blanche et il faut rafraîchir à la
// main. On recharge automatiquement la page (une seule fois par minute, pour
// ne jamais boucler si le serveur est réellement indisponible).

const KEY = 'cap-chunk-reload-at'
const MIN_INTERVAL_MS = 60_000

const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|ChunkLoadError|Loading chunk [\w-]+ failed/i

export const isChunkLoadError = (error: unknown): boolean => {
  const msg = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '')
  return CHUNK_ERROR.test(msg)
}

/** Recharge la page si ce n'est pas déjà fait il y a moins d'une minute. */
export const reloadForNewVersion = (): boolean => {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0)
    if (Date.now() - last < MIN_INTERVAL_MS) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    // stockage indisponible : on recharge quand même (une fois par chargement)
  }
  window.location.reload()
  return true
}

/** À appeler une fois au démarrage. */
export const installChunkReload = (): void => {
  // Événement émis par Vite quand un import dynamique échoue
  window.addEventListener('vite:preloadError', (event: Event) => {
    if (reloadForNewVersion()) event.preventDefault()
  })
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
    if (isChunkLoadError(event.reason)) reloadForNewVersion()
  })
}
