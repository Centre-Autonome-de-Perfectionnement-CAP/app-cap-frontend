// src/components/document-request/pdfEngine.ts
// Chargement de pdf.js (≈ 1 Mo), une seule fois. Le visualiseur le demande dès
// son ouverture, pendant que le document se télécharge : l'un n'attend pas l'autre.

export type PdfJs = typeof import('pdfjs-dist')

let pdfjsPromise: Promise<PdfJs> | null = null

export const loadPdfJs = (): Promise<PdfJs> => {
  if (!pdfjsPromise) {
    // Le moteur de rendu tourne dans un « worker » que Vite compile en fichier
    // .js classique : certains serveurs servent mal les fichiers .mjs (type
    // MIME), ce qui empêchait l'affichage des PDF.
    pdfjsPromise = Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?worker'),
    ]).then(([lib, worker]) => {
      const PdfWorker = (worker as any).default as new () => Worker
      lib.GlobalWorkerOptions.workerPort = new PdfWorker()
      return lib
    }).catch(e => { pdfjsPromise = null; throw e })
  }
  return pdfjsPromise
}

/** Préchargement sans attendre (erreurs gérées à l'ouverture du PDF). */
export const preloadPdfJs = () => { loadPdfJs().catch(() => undefined) }
