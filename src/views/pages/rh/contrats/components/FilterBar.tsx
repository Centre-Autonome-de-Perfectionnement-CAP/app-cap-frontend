// src/views/pages/rh/contrats/components/FilterBar.tsx
// Extrait tel quel de Contrats.tsx
import React from 'react'
import Icon from '../Contrats.icons'
import { FILTER_DIVISION_OPTS, FILTER_REG_OPTS, FILTER_STATUS_OPTS, STATUS_OPTIONS } from '../Contrats.constants'
import type { FilterState, Professor } from '../Contrats.types'

const FilterBar: React.FC<{
  filters: FilterState;
  professors: Professor[];
  cycles: { id: number; name: string }[];
  academicYears: { id: number; academic_year: string }[];
  total: number;
  filtered: number;
  onChange: (f: FilterState) => void;
  onReset: () => void;
}> = ({ filters, professors, cycles, academicYears, total, filtered, onChange, onReset }) => {
  const set = (key: keyof FilterState) => (val: string) => onChange({ ...filters, [key]: val });
  const hasActive = Object.values(filters).some(v => v !== '');
  const activeCount = Object.values(filters).filter(v => v !== '').length;

  const profOpts = [
    { value: '', label: 'Tous les professeurs' },
    ...professors.map(p => ({ value: String(p.id), label: p.full_name })),
  ];
  const cycleOpts = [
    { value: '', label: 'Tous les cycles' },
    ...cycles.map(c => ({ value: String(c.id), label: c.name })),
  ];
  const yearOpts = [
    { value: '', label: 'Toutes les années' },
    ...academicYears.map(y => ({ value: y.academic_year, label: y.academic_year })),
  ];

  const chipLabel = (key: keyof FilterState, val: string): string => {
    if (!val) return '';
    switch (key) {
      case 'search':        return `Recherche : "${val}"`;
      case 'division':      return `Division : ${val}`;
      case 'cycle_id':      return `Cycle : ${cycles.find(c => String(c.id) === val)?.name ?? val}`;
      case 'regroupement':  return `Reg. ${val === '1' ? 'I' : 'II'}`;
      case 'professor_id':  return `Prof. : ${professors.find(p => String(p.id) === val)?.full_name ?? val}`;
      case 'academic_year': return `Année : ${val}`;
      case 'status':        return `Statut : ${STATUS_OPTIONS.find(s => s.value === val)?.label ?? val}`;
      default: return val;
    }
  };

  return (
    <div className="ctr-filters">
      <div className="ctr-filters-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6b7280', marginRight: 4, alignSelf: 'center' }}>
          <Icon.Filter />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>
            Filtres {hasActive && <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, background: '#4F46E5', color: '#fff', borderRadius: '50%', fontSize: 10, fontWeight: 800, marginLeft: 4 }}>{activeCount}</span>}
          </span>
        </div>

        <div className="ctr-filters-field" style={{ flex: '1 1 200px', minWidth: 180 }}>
          <span className="ctr-filters-label">N° / Professeur</span>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', pointerEvents: 'none' }}><Icon.Search /></span>
            <input
              className="ctr-input"
              style={{ paddingLeft: 32 }}
              placeholder="Rechercher…"
              value={filters.search}
              onChange={e => set('search')(e.target.value)}
            />
          </div>
        </div>

        <div className="ctr-filters-field" style={{ flex: '0 0 130px' }}>
          <span className="ctr-filters-label">Division</span>
          <select className="ctr-input ctr-select" value={filters.division} onChange={e => set('division')(e.target.value)}>
            {FILTER_DIVISION_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="ctr-filters-field" style={{ flex: '0 0 170px' }}>
          <span className="ctr-filters-label">Cycle</span>
          <select className="ctr-input ctr-select" value={filters.cycle_id} onChange={e => set('cycle_id')(e.target.value)}>
            {cycleOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="ctr-filters-field" style={{ flex: '0 0 150px' }}>
          <span className="ctr-filters-label">Regroupement</span>
          <select className="ctr-input ctr-select" value={filters.regroupement} onChange={e => set('regroupement')(e.target.value)}>
            {FILTER_REG_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="ctr-filters-field" style={{ flex: '1 1 200px', minWidth: 180 }}>
          <span className="ctr-filters-label">Professeur</span>
          <select className="ctr-input ctr-select" value={filters.professor_id} onChange={e => set('professor_id')(e.target.value)}>
            {profOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="ctr-filters-field" style={{ flex: '0 0 155px' }}>
          <span className="ctr-filters-label">Année académique</span>
          <select className="ctr-input ctr-select" value={filters.academic_year} onChange={e => set('academic_year')(e.target.value)}>
            {yearOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="ctr-filters-field" style={{ flex: '0 0 145px' }}>
          <span className="ctr-filters-label">Statut</span>
          <select className="ctr-input ctr-select" value={filters.status} onChange={e => set('status')(e.target.value)}>
            {FILTER_STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {hasActive && (
          <div className="ctr-filters-field" style={{ flex: '0 0 auto', alignSelf: 'flex-end' }}>
            <button type="button" className="ctr-btn ctr-btn-ghost" style={{ height: 40 }} onClick={onReset}>
              <Icon.X /> Effacer
            </button>
          </div>
        )}
      </div>

      {hasActive && (
        <div className="ctr-filters-active">
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em', marginRight: 4 }}>Actifs :</span>
          {(Object.entries(filters) as [keyof FilterState, string][])
            .filter(([, v]) => v !== '')
                         .map(([key, val]) => (
              <span key={key} className="ctr-filters-chip">
                {chipLabel(key, val)}
                <span className="ctr-filters-chip-remove" onClick={() => onChange({ ...filters, [key]: '' })}>
                  <Icon.Close />
                </span>
              </span>
            ))
          }
          <span className="ctr-result-count">
            {filtered === total ? `${total} contrat${total !== 1 ? 's' : ''}` : `${filtered} / ${total} contrat${total !== 1 ? 's' : ''}`}
          </span>
        </div>
      )}
    </div>
  );
};


export default FilterBar
