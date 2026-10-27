// src/views/pages/rh/contrats/components/SearchableSelect.tsx
// Extrait tel quel de Contrats.tsx
import React, { useState } from 'react'
import Icon from '../Contrats.icons'
import useClickOutside from '../hooks/useClickOutside'

const SearchableSelect: React.FC<{
  options: { value: string | number; label: string }[];
  value: string; placeholder?: string;
  onChange: (val: string) => void;
}> = ({ options, value, placeholder = 'Sélectionner…', onChange }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useClickOutside(() => setOpen(false));
  const filtered = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));
  const selected = options.find(o => String(o.value) === String(value));
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" className={`ctr-dropdown-trigger${open ? ' open' : ''}`} onClick={() => setOpen(v => !v)}>
        <span style={{ color: selected ? '#111827' : '#9ca3af', fontSize: 14 }}>{selected ? selected.label : placeholder}</span>
        {open ? <Icon.ChevronUp /> : <Icon.ChevronDown />}
      </button>
      {open && (
        <div className="ctr-dropdown-menu">
          <div className="ctr-dropdown-search"><input placeholder="Rechercher…" value={q} onChange={e => setQ(e.target.value)} autoFocus /></div>
          <div className="ctr-dropdown-list">
            {filtered.length === 0
              ? <div className="ctr-dropdown-empty">Aucun résultat</div>
              : filtered.map(o => (
                <div key={o.value} className={`ctr-dropdown-item${String(o.value) === String(value) ? ' selected' : ''}`}
                  onClick={() => { onChange(String(o.value)); setOpen(false); setQ(''); }}>
                  {o.label}
                  {String(o.value) === String(value) && <Icon.Check />}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect
