import React, { useCallback, useEffect, useRef, useState } from 'react';
import rhService from '@/services/rh.service';
import type {
  Contrat,
  AcademicYear,
  Cycle,
  ContratStatus,
  CreateContratPayload,
  UpdateContratPayload,
  ProfessorProgram,
} from '@/types/rh.types';

// ─── Types locaux ─────────────────────────────────────────────────────────────
type Professor = { id: number; full_name: string };

// ─── Constantes ───────────────────────────────────────────────────────────────
const DIVISIONS = [
  { value: 'RD-FAD', label: 'RD-FAD — Formation à Distance' },
  { value: 'RD-FC',  label: 'RD-FC — Formation Continue' },
];

const REGROUPEMENTS = [
  { value: '1', label: 'Regroupement I' },
  { value: '2', label: 'Regroupement II' },
];

const STATUS_OPTIONS: { value: ContratStatus; label: string }[] = [
  { value: 'pending',    label: 'En attente' },
  { value: 'signed',     label: 'Signé' },
  { value: 'ongoing',    label: 'En cours' },
  { value: 'completed',  label: 'Terminé' },
  { value: 'cancelled',  label: 'Annulé' },
  { value: 'transfered', label: 'Transféré' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: 'En attente', color: '#92400e', bg: '#fef3c7' },
  signed:     { label: 'Signé',      color: '#065f46', bg: '#d1fae5' },
  ongoing:    { label: 'En cours',   color: '#1e40af', bg: '#dbeafe' },
  completed:  { label: 'Terminé',    color: '#374151', bg: '#f3f4f6' },
  cancelled:  { label: 'Annulé',     color: '#991b1b', bg: '#fee2e2' },
  transfered: { label: 'Transféré',  color: '#5b21b6', bg: '#ede9fe' },
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = {
  input: {
    width: '100%', padding: '8px 10px', borderRadius: '6px',
    border: '1px solid #d1d5db', fontSize: '14px',
    boxSizing: 'border-box' as const, backgroundColor: '#fff',
  },
  label: {
    display: 'block', marginBottom: '4px',
    fontWeight: 600, fontSize: '13px', color: '#374151',
  },
  sectionTitle: {
    fontSize: '13px', fontWeight: 700, color: '#6b7280',
    textTransform: 'uppercase' as const, letterSpacing: '0.05em',
    margin: '16px 0 8px',
    paddingBottom: '4px', borderBottom: '1px solid #e5e7eb',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate   = (d?: string) => {
  if (!d) return '—';
  // substring(0,10) → "YYYY-MM-DD" → évite le décalage UTC
  const [y, m, day] = d.substring(0, 10).split('-');
  return `${day}/${m}/${y}`;
};
const formatAmount = (a: number) => Number(a).toLocaleString('fr-FR') + ' FCFA';

// ─── useClickOutside ──────────────────────────────────────────────────────────
function useClickOutside(cb: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [cb]);
  return ref;
}

// ─── ProfessorSelect ──────────────────────────────────────────────────────────
const ProfessorSelect: React.FC<{
  professors: Professor[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}> = ({ professors, value, onChange, required }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen]     = useState(false);
  const close               = useCallback(() => setOpen(false), []);
  const ref                 = useClickOutside(close);

  const filtered = professors.filter(p =>
    p.full_name.toLowerCase().includes(search.toLowerCase())
  );
  const selected = professors.find(p => String(p.id) === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{ ...S.input, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
      >
        <span style={{ color: selected ? '#111827' : '#9ca3af' }}>
          {selected ? selected.full_name : '— Sélectionner un professeur —'}
        </span>
        <span style={{ color: '#6b7280', fontSize: '11px' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 600,
          background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: '2px',
        }}>
          <div style={{ padding: '8px' }}>
            <input
              autoFocus type="text" placeholder="🔍 Rechercher par nom…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              style={{ ...S.input, fontSize: '13px', padding: '6px 8px' }}
            />
          </div>
          <ul style={{ margin: 0, padding: '4px 0', listStyle: 'none', maxHeight: '200px', overflowY: 'auto' }}>
            {filtered.length === 0
              ? <li style={{ padding: '10px 12px', color: '#9ca3af', fontSize: '13px' }}>Aucun résultat</li>
              : filtered.map(p => (
                <li key={p.id}
                  onClick={() => { onChange(String(p.id)); setSearch(''); setOpen(false); }}
                  style={{
                    padding: '8px 12px', cursor: 'pointer', fontSize: '14px',
                    backgroundColor: String(p.id) === value ? '#dbeafe' : 'transparent',
                    color: String(p.id) === value ? '#1e40af' : '#111827',
                    fontWeight: String(p.id) === value ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (String(p.id) !== value) (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6'; }}
                  onMouseLeave={e => { if (String(p.id) !== value) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                >
                  {p.full_name}
                </li>
              ))
            }
          </ul>
        </div>
      )}
      <input type="text" required={required} value={value} readOnly tabIndex={-1}
        style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} />
    </div>
  );
};

// ─── AcademicYearSelect ───────────────────────────────────────────────────────
// BUG CORRIGÉ : le "0" parasite venait du badge "● Courante" rendu
// en inline dans le <span> parent — maintenant isolé proprement
const AcademicYearSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}> = ({ value, onChange, required }) => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [open, setOpen]   = useState(false);
  const close             = useCallback(() => setOpen(false), []);
  const ref               = useClickOutside(close);
  const [err, setErr]     = useState('');

  useEffect(() => {
    rhService.getAcademicYears()
      .then(list => {
        // tri du plus récent au plus ancien sur le champ academic_year (ex: "2024-2025")
        const sorted = [...list].sort((a, b) =>
          (b.academic_year ?? '').localeCompare(a.academic_year ?? '')
        );
        setYears(sorted);
        // pré-sélection de l'année la plus récente si rien n'est encore sélectionné
        if (!value && sorted[0]) onChange(String(sorted[0].id));
      })
      .catch(() => setErr('Impossible de charger les années'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CORRECTION BUG "0" :
  // On ne mélange plus le label texte avec le badge dans le même nœud texte.
  // selected?.academic_year ne doit contenir QUE la chaîne "2024-2025".
  const selected = years.find(y => String(y.id) === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{ ...S.input, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
      >
        {/* label dans un span dédié — jamais de contenu adjacent direct */}
        <span style={{ color: selected ? '#111827' : '#9ca3af', flex: 1 }}>
          {selected ? selected.academic_year : '— Sélectionner une année —'}
        </span>
        {selected?.is_current && (
          <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700, marginRight: '6px',
            backgroundColor: '#dcfce7', padding: '1px 6px', borderRadius: '4px' }}>
            Courante
          </span>
        )}
        <span style={{ color: '#6b7280', fontSize: '11px', flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 600,
          background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: '2px',
        }}>
          <ul style={{ margin: 0, padding: '4px 0', listStyle: 'none', maxHeight: '200px', overflowY: 'auto' }}>
            {years.length === 0
              ? <li style={{ padding: '10px 12px', color: '#9ca3af', fontSize: '13px' }}>{err || 'Chargement…'}</li>
              : years.map(y => (
                <li key={y.id}
                  onClick={() => { onChange(String(y.id)); setOpen(false); }}
                  style={{
                    padding: '8px 12px', cursor: 'pointer', fontSize: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                    backgroundColor: String(y.id) === value ? '#dbeafe' : 'transparent',
                    color: String(y.id) === value ? '#1e40af' : '#111827',
                    fontWeight: String(y.id) === value ? 600 : 400,
                  }}
                  onMouseEnter={e => { if (String(y.id) !== value) (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6'; }}
                  onMouseLeave={e => { if (String(y.id) !== value) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                >
                  {/* Texte de l'année SEUL dans son propre span */}
                  <span>{y.academic_year}</span>
                  {y.is_current && (
                    <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700,
                      backgroundColor: '#dcfce7', padding: '1px 5px', borderRadius: '3px', flexShrink: 0 }}>
                      Courante
                    </span>
                  )}
                </li>
              ))
            }
          </ul>
        </div>
      )}
      <input type="text" required={required} value={value} readOnly tabIndex={-1}
        style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} />
    </div>
  );
};

// ─── CycleSelect ──────────────────────────────────────────────────────────────
const CycleSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [open, setOpen]     = useState(false);
  const close               = useCallback(() => setOpen(false), []);
  const ref                 = useClickOutside(close);

  useEffect(() => { rhService.getCycles().then(setCycles).catch(() => {}); }, []);

  const selected = cycles.find(c => String(c.id) === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{ ...S.input, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
      >
        <span style={{ color: selected ? '#111827' : '#9ca3af' }}>
          {selected ? selected.name : '— Cycle (optionnel) —'}
        </span>
        <span style={{ color: '#6b7280', fontSize: '11px' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 600,
          background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: '2px',
        }}>
          <ul style={{ margin: 0, padding: '4px 0', listStyle: 'none', maxHeight: '180px', overflowY: 'auto' }}>
            <li onClick={() => { onChange(''); setOpen(false); }}
              style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '14px', color: '#9ca3af' }}>
              — Aucun —
            </li>
            {cycles.map(c => (
              <li key={c.id}
                onClick={() => { onChange(String(c.id)); setOpen(false); }}
                style={{
                  padding: '8px 12px', cursor: 'pointer', fontSize: '14px',
                  backgroundColor: String(c.id) === value ? '#dbeafe' : 'transparent',
                  color: String(c.id) === value ? '#1e40af' : '#111827',
                  fontWeight: String(c.id) === value ? 600 : 400,
                }}
                onMouseEnter={e => { if (String(c.id) !== value) (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6'; }}
                onMouseLeave={e => { if (String(c.id) !== value) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
              >
                {c.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─── ProgramsMultiSelect ──────────────────────────────────────────────────────
const ProgramsMultiSelect: React.FC<{
  professorId: string;
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}> = ({ professorId, selectedIds, onChange }) => {
  const [programs, setPrograms] = useState<ProfessorProgram[]>([]);
  const [loading, setLoading]   = useState(false);
  const [search, setSearch]     = useState('');
  const [open, setOpen]         = useState(false);
  const close                   = useCallback(() => setOpen(false), []);
  const ref                     = useClickOutside(close);

  useEffect(() => {
    if (!professorId) { setPrograms([]); return; }
    setLoading(true);
    rhService.getProfessorPrograms(professorId)
      .then(data => { setPrograms(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [professorId]);

  const filtered         = programs.filter(p => p.label.toLowerCase().includes(search.toLowerCase()));
  const selectedPrograms = programs.filter(p => selectedIds.includes(p.id));
  const toggle           = (id: number) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);

  if (!professorId) return null;

  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <label style={S.label}>
        Programmes (Matières + Classes)
        <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: '6px' }}>
          — sélectionnez les cours concernés par ce contrat
        </span>
      </label>
      <div ref={ref} style={{ position: 'relative' }}>
        <div
          onClick={() => !loading && setOpen(v => !v)}
          style={{
            ...S.input, cursor: loading ? 'wait' : 'pointer',
            minHeight: '40px', display: 'flex', alignItems: 'flex-start',
            flexWrap: 'wrap', gap: '4px', userSelect: 'none',
          }}
        >
          {loading ? (
            <span style={{ color: '#9ca3af', alignSelf: 'center' }}>Chargement des programmes…</span>
          ) : selectedPrograms.length === 0 ? (
            <span style={{ color: '#9ca3af', alignSelf: 'center' }}>
              — Cliquer pour sélectionner un ou plusieurs programmes —
            </span>
          ) : selectedPrograms.map(p => (
            <span key={p.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: '4px',
              backgroundColor: '#dbeafe', color: '#1e40af',
              padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
            }}>
              {p.label}
              <button type="button"
                onClick={e => { e.stopPropagation(); toggle(p.id); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1e40af', fontSize: '14px', lineHeight: 1, padding: '0 2px' }}>
                ×
              </button>
            </span>
          ))}
          <span style={{ marginLeft: 'auto', color: '#6b7280', fontSize: '11px', alignSelf: 'center' }}>
            {open ? '▲' : '▼'}
          </span>
        </div>

        {open && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 600,
            background: '#fff', border: '1px solid #d1d5db', borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)', marginTop: '2px',
          }}>
            <div style={{ padding: '8px', borderBottom: '1px solid #f3f4f6' }}>
              <input autoFocus type="text" placeholder="🔍 Filtrer les programmes…"
                value={search} onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
                style={{ ...S.input, fontSize: '13px', padding: '6px 8px' }} />
            </div>
            <div style={{ padding: '6px 12px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => onChange(filtered.map(p => p.id))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#2563eb', fontWeight: 600 }}>
                Tout sélectionner
              </button>
              <button type="button" onClick={() => onChange([])}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                Tout désélectionner
              </button>
              <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#6b7280' }}>
                {selectedIds.length}/{programs.length} sélectionné(s)
              </span>
            </div>
            <ul style={{ margin: 0, padding: '4px 0', listStyle: 'none', maxHeight: '220px', overflowY: 'auto' }}>
              {filtered.length === 0
                ? <li style={{ padding: '12px', color: '#9ca3af', fontSize: '13px', textAlign: 'center' }}>Aucun programme trouvé</li>
                : filtered.map(p => {
                  const isSelected = selectedIds.includes(p.id);
                  return (
                    <li key={p.id} onClick={() => toggle(p.id)}
                      style={{
                        padding: '10px 12px', cursor: 'pointer',
                        backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                        borderBottom: '1px solid #f9fafb',
                        display: 'flex', alignItems: 'center', gap: '10px',
                      }}
                      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = '#f9fafb'; }}
                      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                    >
                      <span style={{
                        width: '16px', height: '16px', flexShrink: 0,
                        border: `2px solid ${isSelected ? '#2563eb' : '#d1d5db'}`,
                        borderRadius: '3px', backgroundColor: isSelected ? '#2563eb' : '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <span style={{ color: '#fff', fontSize: '11px', lineHeight: 1 }}>✓</span>}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }}>
                          {p.course_element.code} — {p.course_element.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          UE : {p.course_element.teaching_unit.name}
                          {p.class_group && <> &nbsp;·&nbsp; Classe : <strong>{p.class_group.name}</strong></>}
                          {p.is_primary && (
                            <span style={{ marginLeft: '8px', fontSize: '10px', backgroundColor: '#d1fae5', color: '#065f46', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                              Principal
                            </span>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })
              }
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Formulaire ───────────────────────────────────────────────────────────────
const emptyForm = {
  division:         '',
  professor_id:     '',
  academic_year_id: '',
  cycle_id:         '',
  regroupement:     '',
  start_date:       '',
  end_date:         '',
  amount:           '',
  status:           'pending' as ContratStatus,
  notes:            '',
  program_ids:      [] as number[],
};
type FormState = typeof emptyForm;

const ContratFormFields: React.FC<{
  form: FormState;
  professors: Professor[];
  onFieldChange: (name: string, value: string | number[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading: boolean;
  message: string;
  submitLabel: string;
  isEdit: boolean;
}> = ({ form, professors, onFieldChange, onSubmit, onCancel, loading, message, submitLabel, isEdit }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    onFieldChange(e.target.name, e.target.value);
  const isError = !!message && !message.startsWith('✅');

  return (
    <form onSubmit={onSubmit} noValidate>
      <p style={S.sectionTitle}>Informations générales</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div>
          <label style={S.label}>Division *</label>
          <select style={S.input} name="division" value={form.division} onChange={handleChange} required>
            <option value="">— Sélectionner —</option>
            {DIVISIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label style={S.label}>Année académique *</label>
          <AcademicYearSelect value={form.academic_year_id} onChange={val => onFieldChange('academic_year_id', val)} required />
        </div>
        <div>
          <label style={S.label}>Cycle</label>
          <CycleSelect value={form.cycle_id} onChange={val => onFieldChange('cycle_id', val)} />
        </div>
        <div>
          <label style={S.label}>Regroupement *</label>
          <select style={S.input} name="regroupement" value={form.regroupement} onChange={handleChange} required>
            <option value="">— Sélectionner —</option>
            {REGROUPEMENTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
      </div>

      <p style={S.sectionTitle}>Professeur & Programmes</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={S.label}>Professeur *</label>
          <ProfessorSelect
            professors={professors}
            value={form.professor_id}
            onChange={val => { onFieldChange('professor_id', val); onFieldChange('program_ids', []); }}
            required
          />
        </div>
        <ProgramsMultiSelect
          professorId={form.professor_id}
          selectedIds={form.program_ids}
          onChange={ids => onFieldChange('program_ids', ids)}
        />
      </div>

      <p style={S.sectionTitle}>Période & Montant</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div>
          <label style={S.label}>Date de début *</label>
          <input style={S.input} type="date" name="start_date" value={form.start_date} onChange={handleChange} required />
        </div>
        <div>
          <label style={S.label}>Date de fin</label>
          <input style={S.input} type="date" name="end_date" value={form.end_date} onChange={handleChange} min={form.start_date || undefined} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={S.label}>Montant (FCFA) *</label>
          <input style={S.input} type="number" name="amount" value={form.amount} onChange={handleChange} required min="100" step="any" placeholder="Minimum 100 FCFA" />
          {form.amount !== '' && Number(form.amount) < 100 && (
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#dc2626' }}>Le montant minimum est de 100 FCFA</p>
          )}
        </div>
      </div>

      {isEdit && (
        <>
          <p style={S.sectionTitle}>Statut du contrat</p>
          <div>
            <label style={S.label}>Statut *</label>
            <select style={S.input} name="status" value={form.status} onChange={handleChange} required>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </>
      )}

      <p style={S.sectionTitle}>Notes</p>
      <textarea style={{ ...S.input, resize: 'vertical', minHeight: '70px' }} name="notes" value={form.notes} onChange={handleChange} placeholder="Informations complémentaires…" />

      {message && (
        <p style={{
          marginTop: '12px', padding: '10px 14px', borderRadius: '6px', fontSize: '13px',
          backgroundColor: isError ? '#fee2e2' : '#d1fae5',
          color: isError ? '#991b1b' : '#065f46',
          border: `1px solid ${isError ? '#fca5a5' : '#6ee7b7'}`,
        }}>
          {message}
        </p>
      )}

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button type="submit" disabled={loading} style={{
          flex: 1, padding: '10px',
          backgroundColor: loading ? '#93c5fd' : '#2563eb',
          color: '#fff', border: 'none', borderRadius: '6px',
          fontSize: '14px', fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          {loading ? 'Enregistrement…' : submitLabel}
        </button>
        <button type="button" onClick={onCancel} disabled={loading} style={{
          flex: 1, padding: '10px',
          backgroundColor: '#f9fafb', color: '#374151',
          border: '1px solid #e5e7eb', borderRadius: '6px',
          fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer',
        }}>
          Annuler
        </button>
      </div>
    </form>
  );
};

// ─── Modal générique ──────────────────────────────────────────────────────────
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }> = ({
  title, onClose, children, wide,
}) => (
  <div
    style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}
    onClick={onClose}
  >
    <div
      style={{
        backgroundColor: '#fff', borderRadius: '10px', padding: '28px',
        width: wide ? '860px' : '680px', maxWidth: '97vw', maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>{title}</h2>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Modal PDF Contrat ────────────────────────────────────────────────────────
/**
 * Génère un aperçu HTML du contrat au format EPAC et propose l'impression.
 * Reproduit la structure du modèle Word fourni.
 */
const ContratPdfModal: React.FC<{ contrat: Contrat; onClose: () => void }> = ({ contrat, onClose }) => {
  const prof = contrat.professor;
  const year = contrat.academicYear?.academic_year ?? '—';
  const cycle = contrat.cycle?.name ?? '—';
  const regroupement = contrat.regroupement === '1' ? 'I' : contrat.regroupement === '2' ? 'II' : '—';
  const division = contrat.division ?? '—';
  const programmes = contrat.course_element_professors ?? [];
  const printRef   = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML ?? '';
    const win     = window.open('', '_blank', 'width=900,height=700');
    if (!win) { alert('Autorisez les popups pour imprimer.'); return; }
    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Contrat ${contrat.contrat_number}</title>
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: Arial, sans-serif; font-size: 11pt; color: #000; line-height: 1.5; }
    h1 { font-size: 13pt; text-align: center; text-transform: uppercase; margin-bottom: 4px; }
    .subtitle { text-align: center; font-size: 10pt; margin-bottom: 18px; }
    .ref { text-align: center; font-size: 10pt; margin-bottom: 20px; }
    .section { margin-bottom: 12px; }
    .section-title { font-weight: bold; font-size: 11pt; margin-bottom: 6px; text-decoration: underline; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { border: 1px solid #000; padding: 5px 8px; font-size: 10pt; }
    th { background: #f0f0f0; font-weight: bold; }
    .sig-zone { display: flex; justify-content: space-between; margin-top: 40px; }
    .sig-box { text-align: center; width: 40%; }
    .sig-line { border-top: 1px solid #000; margin-top: 60px; padding-top: 4px; font-size: 10pt; }
    ul { margin: 6px 0; padding-left: 20px; }
    li { margin-bottom: 3px; }
    .no-print { display: none !important; }
    p { margin: 4px 0 8px; }
  </style>
</head>
<body>${content}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  // Calcule les jours ouvrables approximatifs entre deux dates
  const daysCount = (() => {
    if (!contrat.start_date || !contrat.end_date) return '…';
    const ms = new Date(contrat.end_date.substring(0, 10)).getTime()
             - new Date(contrat.start_date.substring(0, 10)).getTime();
    return Math.max(1, Math.round(ms / 86400000));
  })();

  return (
    <Modal title={`📄 Contrat ${contrat.contrat_number} — Aperçu`} onClose={onClose} wide>
      {/* Bouton imprimer */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <button
          onClick={handlePrint}
          style={{
            backgroundColor: '#2563eb', color: '#fff', padding: '8px 20px',
            borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px',
          }}
        >
          🖨️ Imprimer / Exporter PDF
        </button>
      </div>

      {/* Contenu du contrat */}
      <div ref={printRef} style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', color: '#000', lineHeight: 1.6, padding: '0 8px' }}>

        {/* En-tête */}
        <h1 style={{ fontSize: '13pt', textAlign: 'center', textTransform: 'uppercase', margin: '0 0 4px' }}>
          CONTRAT DE PRESTATION D'ENSEIGNEMENT
        </h1>
        <p style={{ textAlign: 'center', fontSize: '10pt', margin: '0 0 4px' }}>
          (Regroupement {regroupement} — Cycle : {cycle})
        </p>
        <p style={{ textAlign: 'center', fontSize: '10pt', margin: '0 0 20px' }}>
          N° <strong>{contrat.contrat_number}</strong> /UAC/EPAC/CAP/{division}/
          du {formatDate(contrat.start_date)}
        </p>

        <p style={{ marginBottom: '12px' }}><strong>Entre :</strong></p>
        <p style={{ marginBottom: '12px' }}>
          Le Centre Autonome de Perfectionnement de l'École Polytechnique d'Abomey-Calavi de
          l'Université d'Abomey-Calavi, Représenté par son Chef, Monsieur <strong>Fidèle Paul TCHOBO</strong>&nbsp;
          Tél : (229) 01 99 54 62 67 &nbsp; E-mail : contact@cap-epac.online,
          ci-après dénommé <em>CAP</em> d'une part,
        </p>
        <p><strong>Et</strong></p>
        <p style={{ marginBottom: '4px' }}>
          <strong>Monsieur / Madame :</strong> {prof?.full_name ?? '…'}
        </p>
        <p style={{ marginBottom: '4px' }}>
          <strong>Nationalité :</strong> {(contrat as any).professor?.nationality ?? '…………………'}
        </p>
        <p style={{ marginBottom: '4px' }}>
          <strong>Profession :</strong> {(contrat as any).professor?.profession ?? '…………………'}
        </p>
        <p style={{ marginBottom: '4px' }}>
          <strong>Domicilié(e) à :</strong> {(contrat as any).professor?.city ?? '…………'}&nbsp;/&nbsp;
          Parcelle {(contrat as any).professor?.plot_number ?? '…'}, Maison {(contrat as any).professor?.house_number ?? '…'}
        </p>
        <p style={{ marginBottom: '4px' }}>
          <strong>IFU :</strong> {(contrat as any).professor?.ifu_number ?? '…………………………'}
        </p>
        <p style={{ marginBottom: '4px' }}>
          <strong>RIB :</strong> N° {(contrat as any).professor?.rib_number ?? '…'} / Banque : {(contrat as any).professor?.bank ?? '…'}
        </p>
        <p style={{ marginBottom: '4px' }}>
          <strong>Tél. :</strong> {(contrat as any).professor?.phone ?? '…………………'}&nbsp;&nbsp;
          <strong>Email :</strong> {(contrat as any).professor?.email ?? '…………………'}
        </p>
        <p style={{ marginBottom: '16px' }}>
          ci-après dénommé « <strong>L'ENSEIGNANT PRESTATAIRE</strong> » d'autre part.
        </p>

        <p style={{ marginBottom: '16px' }}>
          Les parties au présent contrat ont convenu de ce qui suit :
        </p>

        {/* Art. 1 */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '6px' }}>1. Objet du contrat</p>
          <p>
            Le présent contrat a pour objet la fourniture de prestations d'enseignement au CAP dans les conditions
            de délai, normes académiques et de qualité conformément aux clauses et conditions ci-après énoncées.
          </p>
        </div>

        {/* Art. 2 */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '6px' }}>2. Nature des prestations</p>
          <p>Le Centre retient par la présente les prestations de l'enseignant pour l'exécution des cours de :</p>
          {programmes.length > 0 ? (
            <ul>
              {programmes.map(p => (
                <li key={p.id}>
                  <strong>({p.course_element?.code ?? '—'})</strong> : {p.course_element?.name ?? '—'}
                  {p.class_group ? ` en ${p.class_group.name}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#6b7280', fontStyle: 'italic' }}>Aucun programme sélectionné.</p>
          )}
          <p>conformément aux exigences énumérées dans le cahier des charges joint au présent contrat.</p>
        </div>

        {/* Art. 3 */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '6px' }}>3. Date de démarrage et calendrier</p>
          <p>
            La durée de la prestation est de <strong>{daysCount}</strong> jours ouvrables à partir du&nbsp;
            <strong>{formatDate(contrat.start_date)}</strong>.
          </p>
          {programmes.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>ECUE (Code)</th>
                  <th>Intitulé</th>
                  <th>UE</th>
                  <th>Date début</th>
                  <th>Date fin</th>
                </tr>
              </thead>
              <tbody>
                {programmes.map(p => (
                  <tr key={p.id}>
                    <td>{p.course_element?.code ?? '—'}</td>
                    <td>{p.course_element?.name ?? '—'}</td>
                    <td>{p.course_element?.teaching_unit?.name ?? '—'}</td>
                    <td>{formatDate(contrat.start_date)}</td>
                    <td>{formatDate(contrat.end_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Art. 4 */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '6px' }}>4. Temps de présence</p>
          <p>
            Dans l'exécution du présent contrat, « L'ENSEIGNANT PRESTATAIRE », <strong>{prof?.full_name ?? '…'}</strong>,
            assurera également la surveillance des évaluations. En outre, il surveillera les travaux de recherche
            des apprenants dans les conditions prévues par les textes du CAP.
          </p>
          <p>
            Conformément à l'arrêté N°0388/MESRS/DC/SGM/DPAF/DGES/CJ/SA/05 du 03/08/2022, les charges horaires
            sont fixées comme suit :
          </p>
          <ul>
            <li>1h de Cours Théorique = 1h30 de Travaux Dirigés</li>
            <li>1h de Cours Théorique = 2h de Travaux Pratiques</li>
            <li>1h de Cours Théorique = 5h d'ateliers / sorties pédagogiques / Stage</li>
          </ul>
        </div>

        {/* Art. 5 */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '6px' }}>5. Termes de paiement et prélèvements</p>
          <p>
            Le montant total des honoraires pour les prestations d'enseignement est de&nbsp;
            <strong>{formatAmount(contrat.amount)}</strong> brut, conformément aux exigences du CAP.
          </p>
          <p>
            Les paiements sont effectués en Francs CFA à la fin des prestations (dépôt de sujet, corrigé type
            et copies corrigées) dûment constatées par une attestation de service fait, par virement bancaire
            après prélèvement de l'AIB.
          </p>
        </div>

        {/* Art. 6 */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '6px' }}>6. Normes de Performance</p>
          <p>
            L'enseignant prestataire s'engage à fournir les prestations conformément aux normes professionnelles,
            d'éthique et déontologiques les plus exigeantes. Il est systématiquement mis fin au présent contrat
            en cas de défaillance du prestataire constatée et motivée par écrit au CAP.
          </p>
        </div>

        {/* Art. 7 */}
        <div style={{ marginBottom: '12px' }}>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '6px' }}>7. Droit de propriété et devoir de réserve</p>
          <p>
            Pendant la durée d'exécution du présent contrat et les cinq années suivant son expiration,
            l'enseignant prestataire ne divulguera aucune information exclusive ou confidentielle concernant
            le présent contrat, les affaires ou les documents du CAP sans autorisation écrite préalable.
          </p>
        </div>

        {/* Art. 8 */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '6px' }}>8. Règlement des litiges</p>
          <p>
            Pour tout ce qui n'est pas prévu au présent contrat, les parties se référeront aux lois béninoises.
            Tout litige sera soumis aux juridictions compétentes, s'il n'est pas réglé à l'amiable.
          </p>
        </div>

        {/* Fait à */}
        <p style={{ marginBottom: '24px' }}>
          Fait en trois (03) copies originales à l'Université d'Abomey-Calavi, le&nbsp;
          <strong>{formatDate(contrat.start_date)}</strong>
        </p>

        {/* Signatures */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
          <div style={{ textAlign: 'center', width: '40%' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '60px' }}>Le Chef du CAP</p>
            <p>Monsieur Fidèle Paul TCHOBO</p>
            <div style={{ borderTop: '1px solid #000', marginTop: '8px', paddingTop: '4px', fontSize: '10pt' }}>Signature et cachet</div>
          </div>
          <div style={{ textAlign: 'center', width: '40%' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '60px' }}>L'Enseignant Prestataire</p>
            <p>{prof?.full_name ?? '…'}</p>
            <div style={{ borderTop: '1px solid #000', marginTop: '8px', paddingTop: '4px', fontSize: '10pt' }}>Signature</div>
          </div>
        </div>

        {/* Note bas de page */}
        <p style={{ marginTop: '24px', fontSize: '9pt', color: '#444', borderTop: '1px solid #ccc', paddingTop: '6px' }}>
          ECUE : Élément Constitutif de l'Unité d'Enseignement — Année académique : {year}
        </p>
      </div>
    </Modal>
  );
};

// ─── Page principale ──────────────────────────────────────────────────────────
const Contrats: React.FC = () => {
  const [contrats, setContrats]             = useState<Contrat[]>([]);
  const [professors, setProfessors]         = useState<Professor[]>([]);
  const [refresh, setRefresh]               = useState(false);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);

  const [showCreate, setShowCreate]         = useState(false);
  const [createForm, setCreateForm]         = useState<FormState>({ ...emptyForm });
  const [createLoading, setCreateLoading]   = useState(false);
  const [createMessage, setCreateMessage]   = useState('');

  const [editingContrat, setEditingContrat] = useState<Contrat | null>(null);
  const [editForm, setEditForm]             = useState<FormState>({ ...emptyForm });
  const [editLoading, setEditLoading]       = useState(false);
  const [editMessage, setEditMessage]       = useState('');

  // PDF modal
  const [pdfContrat, setPdfContrat]         = useState<Contrat | null>(null);

  // transfert en cours (map id → boolean)
  const [transferring, setTransferring]     = useState<Record<number, boolean>>({});

  const reload = () => setRefresh(p => !p);

  const extractError = (data: any, status: number): string => {
    if (data?.errors) return (Object.values(data.errors) as string[][]).flat().join(' | ');
    return data?.message || `Erreur HTTP ${status}`;
  };

  // ── Chargements ─────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    rhService.getContrats()
      .then(res => setContrats(res.data || []))
      .catch(err => setError(err.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    rhService.getProfessors().then(res => setProfessors(res.data || [])).catch(() => {});
  }, []);

  // ── Helpers modals ───────────────────────────────────────────────────────────
  const openEdit = (c: Contrat) => {
    setEditingContrat(c);
    setEditMessage('');
    setEditForm({
      division:         c.division                ?? '',
      professor_id:     String(c.professor_id     ?? ''),
      academic_year_id: String(c.academic_year_id ?? ''),
      cycle_id:         String(c.cycle_id         ?? ''),
      regroupement:     c.regroupement            ?? '',
      start_date:       c.start_date?.substring(0, 10) ?? '',
      end_date:         c.end_date?.substring(0, 10)   ?? '',
      amount:           String(c.amount           ?? ''),
      status:           (c.status as ContratStatus) ?? 'pending',
      notes:            c.notes                   ?? '',
      program_ids:      (c.course_element_professors ?? []).map(p => p.id),
    });
  };

  const closeEdit   = () => { setEditingContrat(null); setEditMessage(''); };
  const closeCreate = () => { setShowCreate(false); setCreateMessage(''); setCreateForm({ ...emptyForm }); };

  const handleFieldChange = (setter: React.Dispatch<React.SetStateAction<FormState>>) =>
    (name: string, value: string | number[]) =>
      setter(f => ({ ...f, [name]: value }));

  // ── Payloads ─────────────────────────────────────────────────────────────────
  const buildCreate = (f: FormState): CreateContratPayload => ({
    division:                     f.division || null,
    professor_id:                 Number(f.professor_id),
    academic_year_id:             Number(f.academic_year_id),
    cycle_id:                     f.cycle_id ? Number(f.cycle_id) : null,
    regroupement:                 f.regroupement || null,
    start_date:                   f.start_date,
    end_date:                     f.end_date || null,
    amount:                       parseFloat(f.amount),
    notes:                        f.notes || null,
    course_element_professor_ids: f.program_ids.length ? f.program_ids : undefined,
  });
  const buildUpdate = (f: FormState): UpdateContratPayload => ({
    ...buildCreate(f),
    status:                       f.status as ContratStatus,
    course_element_professor_ids: f.program_ids,
  });

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = (f: FormState): string | null => {
    if (!f.division)         return 'Veuillez sélectionner une division.';
    if (!f.professor_id)     return 'Veuillez sélectionner un professeur.';
    if (!f.academic_year_id) return 'Veuillez sélectionner une année académique.';
    if (!f.regroupement)     return 'Veuillez sélectionner un regroupement.';
    if (!f.start_date)       return 'La date de début est obligatoire.';
    if (!f.amount || Number(f.amount) < 100) return "Le montant doit être d'au moins 100 FCFA.";
    if (f.end_date && f.end_date < f.start_date) return 'La date de fin doit être après la date de début.';
    return null;
  };

  // ── Soumissions ──────────────────────────────────────────────────────────────
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(createForm);
    if (err) { setCreateMessage(err); return; }
    setCreateLoading(true);
    setCreateMessage('');
    try {
      await rhService.createContrat(buildCreate(createForm));
      setCreateMessage('✅ Contrat créé avec succès');
      reload();
      setTimeout(closeCreate, 1500);
    } catch (err: any) {
      setCreateMessage(err?.response?.data ? extractError(err.response.data, err?.response?.status || 500) : err.message || 'Erreur');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContrat) return;
    const err = validate(editForm);
    if (err) { setEditMessage(err); return; }
    setEditLoading(true);
    setEditMessage('');
    try {
      await rhService.updateContrat(editingContrat.id, buildUpdate(editForm));
      setEditMessage('✅ Contrat modifié avec succès');
      reload();
      setTimeout(closeEdit, 1500);
    } catch (err: any) {
      setEditMessage(err?.response?.data ? extractError(err.response.data, err?.response?.status || 500) : err.message || 'Erreur');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce contrat ?')) return;
    try {
      await rhService.deleteContrat(id);
      reload();
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la suppression');
    }
  };

  // ── Transfert ──────────────────────────────────────────────────────────────
  // Passe le statut à "transfered" directement via updateContrat
  const handleTransfer = async (c: Contrat) => {
    if (c.status === 'transfered') return; // déjà transféré
    if (!window.confirm(`Transférer le contrat ${c.contrat_number} ? Le statut passera à "Transféré".`)) return;
    setTransferring(prev => ({ ...prev, [c.id]: true }));
    try {
      await rhService.updateContrat(c.id, {
        // on envoie tous les champs obligatoires pour satisfaire la validation backend
        division:                     c.division ?? null,
        professor_id:                 c.professor_id,
        academic_year_id:             c.academic_year_id,
        cycle_id:                     c.cycle_id ?? null,
        regroupement:                 c.regroupement ?? null,
        start_date:                   c.start_date?.substring(0, 10) ?? '',
        end_date:                     c.end_date?.substring(0, 10) ?? null,
        amount:                       Number(c.amount),
        notes:                        c.notes ?? null,
        status:                       'transfered' as ContratStatus,
        course_element_professor_ids: (c.course_element_professors ?? []).map(p => p.id),
      });
      reload();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? err.message ?? 'Erreur lors du transfert');
    } finally {
      setTransferring(prev => ({ ...prev, [c.id]: false }));
    }
  };

  // ── Tableau ──────────────────────────────────────────────────────────────────
  const COLS = ['N° Contrat', 'Division', 'Cycle', 'Regroupement', 'Professeur', 'Année', 'Programmes', 'Début', 'Fin', 'Montant', 'Statut', 'Actions'];

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>
          Gestion des Contrats
        </h1>
        <button
          onClick={() => { setShowCreate(true); setCreateMessage(''); setCreateForm({ ...emptyForm }); }}
          style={{
            backgroundColor: '#16a34a', color: '#fff', padding: '9px 20px',
            borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
          }}
        >
          + Nouveau contrat
        </button>
      </div>

      {/* Tableau */}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Chargement en cours…</p>
      ) : error ? (
        <p style={{ color: '#dc2626', background: '#fee2e2', padding: '12px', borderRadius: '6px' }}>{error}</p>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                {COLS.map(h => (
                  <th key={h} style={{
                    padding: '12px 14px', textAlign: 'left', fontWeight: 600,
                    color: '#374151', whiteSpace: 'nowrap', borderBottom: '1px solid #e5e7eb',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contrats.length === 0 ? (
                <tr>
                  <td colSpan={COLS.length} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                    Aucun contrat trouvé
                  </td>
                </tr>
              ) : contrats.map((c, idx) => {
                const st = STATUS_CONFIG[c.status] ?? { label: c.status, color: '#000', bg: '#eee' };
                const isTransferred = c.status === 'transfered';
                const isTransferring = transferring[c.id] ?? false;

                return (
                  <tr key={c.id} style={{ backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>

                    {/* N° Contrat */}
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1e40af' }}>
                      {c.contrat_number || `#${c.id}`}
                    </td>

                    {/* Division */}
                    <td style={{ padding: '12px 14px' }}>
                      {c.division
                        ? <span style={{ backgroundColor: c.division === 'RD-FC' ? '#ede9fe' : '#fce7f3', color: c.division === 'RD-FC' ? '#5b21b6' : '#9d174d', padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
                            {c.division}
                          </span>
                        : '—'}
                    </td>

                    {/* Cycle */}
                    <td style={{ padding: '12px 14px', color: '#4b5563' }}>
                      {c.cycle?.name ?? '—'}
                    </td>

                    {/* Regroupement */}
                    <td style={{ padding: '12px 14px', color: '#4b5563' }}>
                      {c.regroupement ? `Regroupement ${c.regroupement === '1' ? 'I' : 'II'}` : '—'}
                    </td>

                    {/* Professeur */}
                    <td style={{ padding: '12px 14px', color: '#4b5563' }}>
                      {c.professor?.full_name ?? `Prof. #${c.professor_id}`}
                    </td>

                    {/* Année — CORRIGÉ : affiche academic_year depuis l'objet lié */}
                    <td style={{ padding: '12px 14px', color: '#4b5563', whiteSpace: 'nowrap' }}>
                      {c.academic_year?.academic_year ?? '—'}
                    </td>

                    {/* Programmes */}
                    <td style={{ padding: '12px 14px', maxWidth: '200px' }}>
                      {c.course_element_professors && c.course_element_professors.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                          {c.course_element_professors.slice(0, 2).map(p => (
                            <span key={p.id} style={{ fontSize: '11px', backgroundColor: '#f0fdf4', color: '#166534', padding: '1px 6px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>
                              {p.course_element?.code ?? p.label}
                            </span>
                          ))}
                          {c.course_element_professors.length > 2 && (
                            <span style={{ fontSize: '11px', color: '#6b7280' }}>
                              +{c.course_element_professors.length - 2}
                            </span>
                          )}
                        </div>
                      ) : '—'}
                    </td>

                    {/* Début */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#4b5563' }}>
                      {formatDate(c.start_date)}
                    </td>

                    {/* Fin */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', color: '#4b5563' }}>
                      {formatDate(c.end_date)}
                    </td>

                    {/* Montant */}
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontWeight: 500 }}>
                      {formatAmount(c.amount)}
                    </td>

                    {/* Statut */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ backgroundColor: st.bg, color: st.color, padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600 }}>
                        {st.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>

                        {/* ── Voir PDF ── */}
                        <button
                          title="Voir le contrat PDF"
                          onClick={() => setPdfContrat(c)}
                          style={{
                            backgroundColor: '#0891b2', color: '#fff',
                            padding: '5px 10px', borderRadius: '6px', border: 'none',
                            cursor: 'pointer', fontSize: '14px',
                            display: 'flex', alignItems: 'center', gap: '4px',
                          }}
                        >
                          📄
                        </button>

                        {/* ── Transférer ── */}
                        <button
                          title={isTransferred ? 'Déjà transféré' : 'Transférer ce contrat'}
                          onClick={() => !isTransferred && !isTransferring && handleTransfer(c)}
                          disabled={isTransferred || isTransferring}
                          style={{
                            backgroundColor: isTransferred ? '#d1d5db' : '#7c3aed',
                            color: isTransferred ? '#9ca3af' : '#fff',
                            padding: '5px 10px', borderRadius: '6px', border: 'none',
                            cursor: isTransferred || isTransferring ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            opacity: isTransferring ? 0.6 : 1,
                          }}
                        >
                          {isTransferring ? '…' : '📤'}
                        </button>

                        {/* ── Modifier ── */}
                        <button
                          onClick={() => openEdit(c)}
                          style={{
                            backgroundColor: '#2563eb', color: '#fff',
                            padding: '5px 10px', borderRadius: '6px', border: 'none',
                            cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                          }}
                        >
                          ✏️
                        </button>

                        {/* ── Supprimer ── */}
                        <button
                          onClick={() => handleDelete(c.id)}
                          style={{
                            backgroundColor: '#dc2626', color: '#fff',
                            padding: '5px 10px', borderRadius: '6px', border: 'none',
                            cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODAL CRÉATION ── */}
      {showCreate && (
        <Modal title="➕ Nouveau contrat" onClose={closeCreate}>
          <ContratFormFields
            form={createForm} professors={professors}
            onFieldChange={handleFieldChange(setCreateForm)}
            onSubmit={handleCreateSubmit} onCancel={closeCreate}
            loading={createLoading} message={createMessage}
            submitLabel="Créer le contrat" isEdit={false}
          />
        </Modal>
      )}

      {/* ── MODAL ÉDITION ── */}
      {editingContrat && (
        <Modal
          title={`✏️ Modifier — Contrat ${editingContrat.contrat_number || `#${editingContrat.id}`}`}
          onClose={closeEdit}
        >
          <ContratFormFields
            form={editForm} professors={professors}
            onFieldChange={handleFieldChange(setEditForm)}
            onSubmit={handleEditSubmit} onCancel={closeEdit}
            loading={editLoading} message={editMessage}
            submitLabel="Enregistrer les modifications" isEdit={true}
          />
        </Modal>
      )}

      {/* ── MODAL PDF ── */}
      {pdfContrat && (
        <ContratPdfModal contrat={pdfContrat} onClose={() => setPdfContrat(null)} />
      )}
    </div>
  );
};

export default Contrats;
