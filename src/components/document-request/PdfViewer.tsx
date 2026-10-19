// src/components/document-request/PdfViewer.tsx
//
// Affichage d'un PDF dans la page, sans dépendre du lecteur PDF du navigateur.
// Avec un simple <iframe>, certains navigateurs (téléphones Android, Chrome
// réglé sur « Télécharger les PDF », etc.) TÉLÉCHARGENT le fichier au lieu de
// l'afficher. Ici, chaque page est dessinée avec pdf.js : le document s'affiche
// toujours, et ne se télécharge que si l'utilisateur clique sur « Télécharger ».

import { useEffect, useRef, useState } from 'react'
import { CButton, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilZoomIn, cilZoomOut, cilFullscreen, cilFile, cilCloudDownload } from '@coreui/icons'

type PdfJs = typeof import('pdfjs-dist')

// pdf.js (≈ 1 Mo) n'est chargé qu'à la première ouverture d'un PDF.
let pdfjsPromise: Promise<PdfJs> | null = null
const loadPdfJs = (): Promise<PdfJs> => {
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
    })
  }
  return pdfjsPromise
}

interface Props {
  src: string
  title: string
  onDownload: () => void
}

const PdfViewer = ({ src, title, onDownload }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const pagesRef  = useRef<HTMLDivElement>(null)
  const [zoom,    setZoom]    = useState(1)
  const [loading, setLoading] = useState(true)
  const [failed,  setFailed]  = useState(false)
  const [pages,   setPages]   = useState(0)

  useEffect(() => {
    let cancelled = false
    let doc: any = null
    const container = pagesRef.current
    if (!container) return
    container.innerHTML = ''
    setLoading(true); setFailed(false)

    ;(async () => {
      try {
        const pdfjs = await loadPdfJs()
        doc = await pdfjs.getDocument({ url: src }).promise
        if (cancelled) return
        setPages(doc.numPages)
        const available = Math.max(320, (scrollRef.current?.clientWidth ?? 900) - 48)
        const ratio = Math.min(window.devicePixelRatio || 1, 2)

        for (let n = 1; n <= doc.numPages; n++) {
          if (cancelled) return
          const page = await doc.getPage(n)
          const base = page.getViewport({ scale: 1 })
          const scale = (available / base.width) * zoom
          const viewport = page.getViewport({ scale: scale * ratio })

          const canvas = document.createElement('canvas')
          canvas.width  = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          canvas.style.width  = `${Math.floor(viewport.width / ratio)}px`
          canvas.style.height = `${Math.floor(viewport.height / ratio)}px`
          canvas.style.display = 'block'
          canvas.style.margin = '0 auto 16px'
          canvas.style.background = '#fff'
          canvas.style.boxShadow = '0 2px 10px rgba(15,23,42,0.12)'
          canvas.setAttribute('aria-label', `${title} — page ${n}`)
          container.appendChild(canvas)

          await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise
          if (n === 1 && !cancelled) setLoading(false)
        }
        if (!cancelled) setLoading(false)
      } catch {
        if (!cancelled) { setFailed(true); setLoading(false) }
      }
    })()

    return () => {
      cancelled = true
      try { doc?.destroy() } catch { /* déjà libéré */ }
    }
  }, [src, zoom, title])

  if (failed) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20, textAlign: 'center' }}>
      <CIcon icon={cilFile} style={{ width: 40, color: '#94a3b8' }} />
      <span style={{ fontSize: '0.9rem', color: '#475569' }}>
        Ce PDF n'a pas pu s'afficher (fichier endommagé ou protégé).
      </span>
      <CButton color="primary" onClick={onDownload}>
        <CIcon icon={cilCloudDownload} className="me-2" style={{ width: 14 }} />
        Telecharger pour consulter
      </CButton>
    </div>
  )

  return (
    <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{
        position: 'absolute', top: 10, right: 10, zIndex: 2,
        display: 'flex', gap: 4, alignItems: 'center',
        background: 'rgba(255,255,255,0.92)', borderRadius: 8,
        padding: '4px 6px', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
      }}>
        <CButton size="sm" color="light" onClick={() => setZoom(z => Math.max(0.5, +(z - 0.25).toFixed(2)))} title="Dézoomer">
          <CIcon icon={cilZoomOut} style={{ width: 14 }} />
        </CButton>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', minWidth: 42, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <CButton size="sm" color="light" onClick={() => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))} title="Zoomer">
          <CIcon icon={cilZoomIn} style={{ width: 14 }} />
        </CButton>
        <CButton size="sm" color="light" onClick={() => setZoom(1)} title="Ajuster a la largeur">
          <CIcon icon={cilFullscreen} style={{ width: 14 }} />
        </CButton>
        {pages > 1 && (
          <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: 4 }}>{pages} pages</span>
        )}
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '16px 24px', background: '#f1f5f9' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 40 }}>
            <CSpinner color="primary" />
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Affichage du document…</span>
          </div>
        )}
        <div ref={pagesRef} />
      </div>
    </div>
  )
}

export default PdfViewer
