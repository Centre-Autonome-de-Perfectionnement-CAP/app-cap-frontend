// src/views/pages/stages/PersonPicker.tsx
// Choix d'une personne dans une liste avec recherche. Les stagiaires suivis
// (mine) viennent en premier, sur fond vert, pour être trouvés d'un coup d'œil.

import { useMemo, useState } from 'react'
import { CFormInput } from '@coreui/react'

export interface PickerPerson { id: number; name: string; mine?: boolean; hint?: string | null }

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

const PersonPicker = ({ people, value, onChange, loading, placeholder = 'Exemple : AKODOGBO', mineLabel = 'Mon stagiaire' }: {
  people: PickerPerson[] | null
  value: number | null
  onChange: (id: number) => void
  loading?: boolean
  placeholder?: string
  mineLabel?: string
}) => {
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean)
    return (people ?? [])
      .filter(p => words.every(w => norm(p.name).includes(w)))
      .sort((a, b) => Number(!!b.mine) - Number(!!a.mine))
  }, [people, q])

  return (
    <div className="pp">
      <CFormInput value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder} aria-label="Rechercher par nom" />
      <div className="pp-list" role="listbox">
        {(loading || !people) && <div className="pp-empty">Chargement…</div>}
        {people && list.length === 0 && <div className="pp-empty">Personne ne correspond.</div>}
        {list.map(p => (
          <button key={p.id} type="button" role="option" aria-selected={value === p.id}
            className={`pp-item${p.mine ? ' pp-mine' : ''}${value === p.id ? ' pp-on' : ''}`} onClick={() => onChange(p.id)}>
            <span className="pp-name">{p.name}</span>
            {p.hint && <span className="pp-hint">{p.hint}</span>}
            {p.mine && <span className="pp-tag">{mineLabel}</span>}
          </button>
        ))}
      </div>
      <style>{`
        .pp-list { margin-top: 6px; max-height: 240px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 10px; padding: 4px; display: flex; flex-direction: column; gap: 3px; }
        .pp-item { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; width: 100%; text-align: left; border: 1px solid transparent; border-radius: 8px; background: #fff; padding: 8px 10px; font-size: .875rem; color: #0f172a; }
        .pp-item:hover { background: #f8fafc; }
        .pp-mine { background: #ecfdf5; }
        .pp-mine:hover { background: #d1fae5; }
        .pp-on, .pp-on:hover { border-color: #0f766e; box-shadow: inset 0 0 0 1px #0f766e; }
        .pp-name { font-weight: 600; }
        .pp-hint { color: #64748b; }
        .pp-tag { margin-left: auto; font-size: .875rem; font-weight: 700; color: #047857; }
        .pp-empty { padding: 10px; color: #64748b; font-size: .875rem; }
      `}</style>
    </div>
  )
}

export default PersonPicker
