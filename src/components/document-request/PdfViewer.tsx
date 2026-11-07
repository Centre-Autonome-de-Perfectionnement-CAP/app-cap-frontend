// src/components/document-request/PdfViewer.tsx
//
// Affichage d'un PDF dans la page, sans dépendre du lecteur PDF du navigateur.
// Avec un simple <iframe>, certains navigateurs (téléphones Android, Chrome
// réglé sur « Télécharger les PDF », etc.) TÉLÉCHARGENT le fichier au lieu de
// l'afficher. Ici, chaque page est dessinée avec pdf.js : le document s'affiche
// toujours, et ne se télécharge que si l'utilisateur clique sur « Télécharger ».
// Seules les pages visibles (et leurs voisines) sont dessinées : la première
// page s'affiche vite, même pour un long rapport.

import { useEffect, useRef, useState } from 'react'
import { CButton, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilZoomIn, cilZoomOut, cilFullscreen, cilFile, cilCloudDownload } from '@coreui/icons'

import { loadPdfJs } from './pdfEngine'
import type { PdfStream } from './progressiveFile'

interface Props {
  /** Fichier complet en mémoire… */
  src?: string | null
  /** …ou PDF lu par tranches : la 1re page s'affiche sans attendre la fin. */
  stream?: PdfStream
  title: string
  onDownload: () => void
}

// pdf.js refuse d'ouvrir un document pendant qu'il en libère un autre sur le
// même worker : chaque libération est attendue avant l'ouverture suivante.
let releasing: Promise<unknown> = Promise.resolve()

const PdfViewer = ({ src, stream, title, onDownload }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const pagesRef  = useRef<HTMLDivElement>(null)
  const [doc,     setDoc]     = useState<any>(null)
  const [zoom,    setZoom]    = useState(1)
  const [loading, setLoading] = useState(true)
  const [failed,  setFailed]  = useState(false)
  const [pages,   setPages]   = useState(0)
  const fetched = useRef(false)

  // 1) Ouverture du document : une seule fois par fichier.
  useEffect(() => {
    let cancelled = false
    let task: any = null
    setDoc(null); setLoading(true); setFailed(false); setPages(0)

    ;(async () => {
      try {
        const pdfjs = await loadPdfJs()
        await releasing
        if (cancelled) return
        if (stream) {
          const transport = new pdfjs.PDFDataRangeTransport(stream.total, stream.head)
          transport.requestDataRange = (begin: number, end: number) => {
            stream.read(begin, end - begin)
              .then(chunk => { if (!cancelled) transport.onDataRange(begin, chunk) })
              .catch(() => { if (!cancelled) { setFailed(true); setLoading(false) } })
          }
          // Seules les parties utiles à l'affichage sont demandées d'abord ;
          // le reste suit une fois la 1re page dessinée (voir plus bas).
          task = pdfjs.getDocument({ range: transport, rangeChunkSize: 256 * 1024, disableAutoFetch: true })
        } else {
          task = pdfjs.getDocument({ url: src as string })
        }
        const opened = await task.promise
        if (cancelled) return
        setPages(opened.numPages)
        setDoc(opened)

      } catch {
        if (!cancelled) { setFailed(true); setLoading(false) }
      }
    })()

    return () => {
      cancelled = true
      if (task) releasing = releasing.then(() => task.destroy()).catch(() => undefined)
    }
  }, [src, stream])

  // 2) Pages : emplacements à la bonne taille tout de suite, dessin seulement
  // quand une page approche de l'écran ; tout est redessiné à chaque zoom.
  useEffect(() => {
    const container = pagesRef.current
    const scroller = scrollRef.current
    if (!doc || !container || !scroller) return
    let cancelled = false
    const renders: any[] = []
    const drawn = new Set<number>()
    container.innerHTML = ''
    setLoading(true)

    const available = Math.max(320, scroller.clientWidth - 48)
    // Netteté suffisante, deux fois moins de calcul qu'une résolution double.
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5)

    const draw = async (n: number, slot: HTMLDivElement) => {
      if (drawn.has(n) || cancelled) return
      drawn.add(n)
      try {
        const page = await doc.getPage(n)
        if (cancelled) return
        const base = page.getViewport({ scale: 1 })
        const scale = (available / base.width) * zoom
        const viewport = page.getViewport({ scale: scale * ratio })
        const canvas = document.createElement('canvas')
        canvas.width  = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        canvas.style.width  = `${Math.floor(viewport.width / ratio)}px`
        canvas.style.height = `${Math.floor(viewport.height / ratio)}px`
        canvas.style.display = 'block'
        canvas.setAttribute('aria-label', `${title} - page ${n}`)
        slot.style.width = canvas.style.width
        slot.style.height = canvas.style.height
        const render = page.render({ canvasContext: canvas.getContext('2d')!, viewport })
        renders.push(render)
        await render.promise
        if (cancelled) return
        slot.replaceChildren(canvas)
        if (n === 1) {
          setLoading(false)
          // 1re page affichée : le reste du fichier arrive en arrière-plan,
          // puis il est gardé pour le téléchargement et une prochaine ouverture.
          if (stream && !fetched.current) {
            fetched.current = true
            doc.getData().then((data: Uint8Array) => stream.complete(data)).catch(() => undefined)
          }
        }
      } catch {
        // Dessin interrompu par un nouveau zoom : rien à signaler.
        if (!cancelled && n === 1) { setFailed(true); setLoading(false) }
      }
    }

    let observer: IntersectionObserver | null = null
    ;(async () => {
      try {
        // Taille de la 1re page pour réserver la place de toutes les pages.
        const first = (await doc.getPage(1)).getViewport({ scale: 1 })
        if (cancelled) return
        const w = Math.floor(available * zoom)
        const h = Math.floor(first.height * (w / first.width))
        const slots: HTMLDivElement[] = []
        for (let n = 1; n <= doc.numPages; n++) {
          const slot = document.createElement('div')
          slot.dataset.page = String(n)
          Object.assign(slot.style, {
            width: `${w}px`, height: `${h}px`, margin: '0 auto 16px', background: '#fff',
            boxShadow: '0 2px 10px rgba(15,23,42,0.12)',
          })
          container.appendChild(slot)
          slots.push(slot)
        }
        observer = new IntersectionObserver(entries => {
          entries.forEach(e => {
            if (!e.isIntersecting) return
            const n = Number((e.target as HTMLElement).dataset.page)
            draw(n, e.target as HTMLDivElement)
            // La page suivante est préparée d'avance pour un défilement fluide.
            if (slots[n]) draw(n + 1, slots[n])
          })
        }, { root: scroller, rootMargin: '600px 0px' })
        slots.forEach(s => observer!.observe(s))
        draw(1, slots[0])
      } catch {
        if (!cancelled) { setFailed(true); setLoading(false) }
      }
    })()

    return () => {
      cancelled = true
      observer?.disconnect()
      renders.forEach(r => { try { r.cancel() } catch { /* déjà terminé */ } })
    }
  }, [doc, zoom, title, stream])

  if (failed) return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 20, textAlign: 'center' }}>
      <CIcon icon={cilFile} style={{ width: 40, color: '#64748b' }} />
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
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', minWidth: 42, textAlign: 'center' }}>
          {Math.round(zoom * 100)}%
        </span>
        <CButton size="sm" color="light" onClick={() => setZoom(z => Math.min(3, +(z + 0.25).toFixed(2)))} title="Zoomer">
          <CIcon icon={cilZoomIn} style={{ width: 14 }} />
        </CButton>
        <CButton size="sm" color="light" onClick={() => setZoom(1)} title="Ajuster a la largeur">
          <CIcon icon={cilFullscreen} style={{ width: 14 }} />
        </CButton>
        {pages > 1 && (
          <span style={{ fontSize: '0.875rem', color: '#64748b', marginLeft: 4 }}>{pages} pages</span>
        )}
      </div>

      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '16px 24px', background: '#f1f5f9' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 40 }}>
            <CSpinner color="primary" />
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Affichage du document…</span>
          </div>
        )}
        <div ref={pagesRef} />
      </div>
    </div>
  )
}

export default PdfViewer
