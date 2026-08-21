// src/views/pages/rh/contrats/components/MultiSelect.tsx
// Extrait tel quel de Contrats.tsx
import React, { useState } from 'react'
import Icon from '../Contrats.icons'
import useClickOutside from '../hooks/useClickOutside'

// ─── MultiSelect pour les programmes ──────────────────────────────────────────
const MultiSelect: React.FC<{
  options: { value: number; label: string; sub?: string }[];
  value: number[]; placeholder?: string;
  onChange: (val: number[]) => void;
}> = ({ options, value, placeholder = 'Sélectionner…', onChange }) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useClickOutside(() => setOpen(false));
  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(q.toLowerCase()) ||
    (o.sub && o.sub.toLowerCase().includes(q.toLowerCase()))
  );
  const toggle = (id: number) => {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  };
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" className={`ctr-dropdown-trigger${open ? ' open' : ''}`} onClick={() => setOpen(v => !v)}>
        <span style={{ color: value.length > 0 ? '#111827' : '#9ca3af', fontSize: 14 }}>
          {value.length > 0 ? `${value.length} programme(s) sélectionné(s)` : placeholder}
        </span>
        {open ? <Icon.ChevronUp /> : <Icon.ChevronDown />}
      </button>
      {open && (
        <div className="ctr-dropdown-menu" style={{ zIndex: 800 }}>
          <div className="ctr-dropdown-search"><input placeholder="Rechercher…" value={q} onChange={e => setQ(e.target.value)} autoFocus /></div>
          <div className="ctr-dropdown-list">
            {filtered.length === 0
              ? <div className="ctr-dropdown-empty">Aucun programme disponible</div>
              : filtered.map(o => (
                <div key={o.value} className={`ctr-dropdown-item${value.includes(o.value) ? ' selected' : ''}`} onClick={() => toggle(o.value)}>
                  <div>
                    <div style={{ fontWeight: value.includes(o.value) ? 600 : 400 }}>{o.label}</div>
                    {o.sub && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{o.sub}</div>}
                  </div>
                  {value.includes(o.value) && <Icon.Check />}
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
};


export default MultiSelect
