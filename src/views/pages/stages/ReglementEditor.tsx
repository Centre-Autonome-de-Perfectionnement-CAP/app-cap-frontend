// src/views/pages/stages/ReglementEditor.tsx
// Édition du règlement intérieur : barre de mise en forme (gras, important,
// titre, encadré d'alerte, listes) et aperçu identique à l'affichage de
// l'espace stagiaire. Le texte reste simple (balises légères) :
//   ## Titre · !!TITRE!! en 1re ligne d'un bloc (encadré) · 1. liste
//   - puces · **gras** · !!important!! ; une ligne vide sépare les blocs.

import { useRef, useState, type ReactNode } from 'react'
import { CButton, CButtonGroup, CFormTextarea } from '@coreui/react'

const INLINE = /(\*\*[^*\n]+\*\*|!![^!\n]+!!)/g

const Inline = ({ text }: { text: string }) => (
  <>
    {text.split(INLINE).map((part, i) =>
      part.length > 4 && part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong>
      : part.length > 4 && part.startsWith('!!') && part.endsWith('!!') ? <strong key={i} style={{ color: '#be123c' }}>{part.slice(2, -2)}</strong>
      : part,
    )}
  </>
)

const Lines = ({ lines }: { lines: string[] }) => {
  const groups: { kind: 'ol' | 'ul' | 'p'; items: string[] }[] = []
  lines.forEach(raw => {
    const ol = raw.match(/^\s*\d+[.)]\s+(.*)$/)
    const ul = raw.match(/^\s*[-•*]\s+(.*)$/)
    const line = ol ? { kind: 'ol' as const, text: ol[1] } : ul ? { kind: 'ul' as const, text: ul[1] } : { kind: 'p' as const, text: raw }
    const last = groups[groups.length - 1]
    if (last && last.kind === line.kind) last.items.push(line.text)
    else groups.push({ kind: line.kind, items: [line.text] })
  })
  return (
    <>
      {groups.map((g, i) => g.kind === 'p'
        ? <p key={i} className="mb-2">{g.items.map((t, j) => <span key={j} className="d-block"><Inline text={t} /></span>)}</p>
        : g.kind === 'ol'
          ? <ol key={i} className="mb-2 ps-4">{g.items.map((t, j) => <li key={j} className="mb-1"><Inline text={t} /></li>)}</ol>
          : <ul key={i} className="mb-2 ps-4">{g.items.map((t, j) => <li key={j} className="mb-1"><Inline text={t} /></li>)}</ul>)}
    </>
  )
}

/** Aperçu : même rendu que l'espace stagiaire. */
const ReglementPreview = ({ text }: { text: string }) => {
  const blocks = text.replace(/\r\n/g, '\n').split(/\n{2,}/).map(b => b.split('\n').filter(l => l.trim() !== '')).filter(b => b.length)
  return (
    <div style={{ fontSize: 15, lineHeight: 1.6, color: '#334155' }}>
      {blocks.map((lines, i): ReactNode => {
        const first = lines[0].trim()
        if (first.startsWith('## ')) {
          return (
            <section key={i} className="mb-3">
              <div className="fw-bold mb-1" style={{ color: '#0f172a', fontSize: 16 }}><Inline text={first.slice(3)} /></div>
              {lines.length > 1 && <Lines lines={lines.slice(1)} />}
            </section>
          )
        }
        if (/^!![^!]+!!$/.test(first)) {
          return (
            <section key={i} className="mb-3 rounded-3 p-3" style={{ border: '1px solid #fecdd3', background: '#fff1f2' }}>
              <div className="fw-bold mb-1" style={{ color: '#be123c' }}>{first.slice(2, -2)}</div>
              {lines.length > 1 && <Lines lines={lines.slice(1)} />}
            </section>
          )
        }
        return <div key={i} className="mb-3"><Lines lines={lines} /></div>
      })}
    </div>
  )
}

const ReglementEditor = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [preview, setPreview] = useState(false)

  /** Applique une mise en forme à la sélection, puis rend la main à la saisie. */
  const apply = (fn: (text: string, start: number, end: number) => { text: string; start: number; end: number }) => {
    const el = ref.current
    if (!el) return
    const r = fn(value, el.selectionStart, el.selectionEnd)
    onChange(r.text)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(r.start, r.end) })
  }

  /** Entoure la sélection (ou un mot d'exemple) de la marque donnée. */
  const wrap = (mark: string, sample: string) => apply((t, s, e) => {
    const inner = t.slice(s, e) || sample
    return { text: t.slice(0, s) + mark + inner + mark + t.slice(e), start: s + mark.length, end: s + mark.length + inner.length }
  })

  /** Ajoute un préfixe au début de chaque ligne sélectionnée. */
  const prefix = (make: (i: number) => string) => apply((t, s, e) => {
    const from = t.lastIndexOf('\n', s - 1) + 1
    const to = e > s && t[e - 1] === '\n' ? e - 1 : (t.indexOf('\n', e) === -1 ? t.length : t.indexOf('\n', e))
    const lines = t.slice(from, to).split('\n').map((l, i) => make(i) + l.replace(/^(\s*(\d+[.)]|[-•*]|##)\s+)/, ''))
    const block = lines.join('\n')
    return { text: t.slice(0, from) + block + t.slice(to), start: from, end: from + block.length }
  })

  /** Insère un encadré d'alerte comme nouveau bloc. */
  const alertBlock = () => apply((t, s, e) => {
    const title = (t.slice(s, e).trim() || 'TITRE DE L\'ALERTE').toUpperCase()
    const before = t.slice(0, s).replace(/\s*$/, '')
    const insert = `${before ? '\n\n' : ''}!!${title}!!\nTexte de l'alerte.\n\n`
    const text = before + insert + t.slice(e).replace(/^\s*/, '')
    const start = before.length + (before ? 4 : 2)
    return { text, start, end: start + title.length }
  })

  const tools: [string, string, () => void][] = [
    ['Gras', 'Mettre en gras', () => wrap('**', 'texte en gras')],
    ['Important', 'Gras rouge, à ne pas manquer', () => wrap('!!', 'texte important')],
    ['Titre', 'Titre de partie', () => prefix(() => '## ')],
    ['Encadré', "Encadré d'alerte avec un titre", alertBlock],
    ['• Puces', 'Liste à puces', () => prefix(() => '- ')],
    ['1. Numéros', 'Liste numérotée', () => prefix(i => `${i + 1}. `)],
  ]

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        <CButtonGroup size="sm" role="group" aria-label="Mise en forme" className="flex-wrap">
          {tools.map(([label, title, fn]) => (
            <CButton key={label} color="secondary" variant="outline" title={title} disabled={preview} onClick={fn}
              style={label === 'Gras' ? { fontWeight: 700 } : label === 'Important' ? { fontWeight: 700, color: '#be123c' } : undefined}>
              {label}
            </CButton>
          ))}
        </CButtonGroup>
        <CButton size="sm" color="primary" variant={preview ? undefined : 'outline'} className="ms-auto" onClick={() => setPreview(p => !p)}>
          {preview ? 'Modifier' : 'Aperçu'}
        </CButton>
      </div>
      {preview
        ? <div className="rounded-3 border p-3" style={{ background: '#f8fafc', minHeight: 200, maxHeight: 520, overflowY: 'auto' }}><ReglementPreview text={value} /></div>
        : <CFormTextarea ref={ref} rows={14} maxLength={10000} value={value} onChange={e => onChange(e.target.value)}
            style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 14 }} aria-label="Texte du règlement" />}
    </div>
  )
}

export default ReglementEditor
