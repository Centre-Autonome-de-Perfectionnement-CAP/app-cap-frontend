// src/views/pages/rh/contrats/components/ContratFormFields.tsx
// Extrait tel quel de Contrats.tsx
import React, { useEffect, useState } from 'react'
import rhService from '@/services/rh.service'
import type { AcademicYear, Cycle, ProfessorProgram } from '@/types/rh.types'
import Icon from '../Contrats.icons'
import { DIVISIONS, REGROUPEMENTS, STATUS_OPTIONS } from '../Contrats.constants'
import { formatDate, validateDatesInAcademicYear } from '../Contrats.helpers'
import type { FormState, Professor } from '../Contrats.types'
import SearchableSelect from './SearchableSelect'
import MultiSelect from './MultiSelect'

const ContratFormFields: React.FC<{
  form: FormState; professors: Professor[]; isEdit: boolean;
  onFieldChange: (name: string, value: string | number[] | Record<number, string>) => void;
  onSubmit: (e: React.FormEvent) => void; onCancel: () => void;
  loading: boolean; error: string; submitLabel: string;
  selectedAcademicYear?: AcademicYear;
}> = ({ form, professors, isEdit, onFieldChange, onSubmit, onCancel, loading, error, submitLabel, selectedAcademicYear }) => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [cycles, setCycles]               = useState<Cycle[]>([]);
  const [programs, setPrograms]           = useState<ProfessorProgram[]>([]);
  const [dateError, setDateError]         = useState<string>('');
  const [localAmounts, setLocalAmounts] = useState<Record<number, string>>(form.program_amounts ?? {});
  useEffect(() => {
    rhService.getAcademicYears().then(setAcademicYears).catch(() => {});
    rhService.getCycles().then(setCycles).catch(() => {});
  }, []);
  useEffect(() => {
  setLocalAmounts(form.program_amounts ?? {});
}, [form.program_ids]);

  useEffect(() => {
  if (form.professor_id) {
    rhService.getProfessorPrograms(form.professor_id)
      .then(data => {
        console.log('programs détail:', JSON.stringify(data, null, 2));
        setPrograms(data);
      })
      .catch(() => setPrograms([]));
  } else { setPrograms([]); }
}, [form.professor_id]);
  // Validation des dates par rapport à l'année académique sélectionnée
  useEffect(() => {
    if (form.academic_year_id && form.start_date) {
      const selectedYear = academicYears.find(y => String(y.id) === form.academic_year_id);
      // Utilisation de year_start et year_end au lieu de start_date et end_date
      if (selectedYear && selectedYear.year_start && selectedYear.year_end) {
        const errorMsg = validateDatesInAcademicYear(
          form.start_date,
          form.end_date || null,
          selectedYear.year_start,
          selectedYear.year_end
        );
        setDateError(errorMsg || '');
      } else {
        setDateError('');
      }
    } else {
      setDateError('');
    }
  }, [form.academic_year_id, form.start_date, form.end_date, academicYears]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    onFieldChange(name, value);

    if (name === 'start_date' || name === 'end_date' || name === 'academic_year_id') {
      setDateError('');
    }
  };

  const profOptions   = professors.map(p => ({ value: p.id, label: p.full_name }));
  const yearOptions   = academicYears.map(y => ({ value: y.id, label: y.academic_year }));
  const cycleOptions  = cycles.map(c => ({ value: c.id, label: c.name }));
  const progOptions   = programs.map(p => ({
    value:  p.id,
    label:  `(${p.course_element?.code ?? '?'}) ${p.course_element?.name ?? p.label}`,
    sub:    p.class_group?.name ?? '',
  }));

  // Récupérer l'année académique sélectionnée - utilisation de year_start et year_end
  const selectedYear = academicYears.find(y => String(y.id) === form.academic_year_id);

  return (
    <form onSubmit={onSubmit} autoComplete="off">
      <p className="ctr-section-title">Informations générales</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label className="ctr-label">Division *</label>
          <select className="ctr-input ctr-select" name="division" value={form.division} onChange={handleChange} required>
            <option value="">Sélectionner…</option>
            {DIVISIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label className="ctr-label">Regroupement *</label>
          <select className="ctr-input ctr-select" name="regroupement" value={form.regroupement} onChange={handleChange} required>
            <option value="">Sélectionner…</option>
            {REGROUPEMENTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div style={{ gridColumn: '1/-1' }}>
          <label className="ctr-label">Professeur *</label>
          <SearchableSelect options={profOptions} value={form.professor_id}
            placeholder="Sélectionner un professeur…"
            onChange={v => onFieldChange('professor_id', v)} />
        </div>
        <div>
          <label className="ctr-label">Année académique *</label>
          <SearchableSelect options={yearOptions} value={form.academic_year_id}
            placeholder="Sélectionner une année…"
            onChange={v => onFieldChange('academic_year_id', v)} />
          {/* Utilisation de year_start et year_end */}
          {selectedYear && selectedYear.year_start && selectedYear.year_end && (
            <p className="ctr-hint" style={{ color: '#059669' }}>
                Année valable du {formatDate(selectedYear.year_start)} au {formatDate(selectedYear.year_end)}
            </p>
          )}
        </div>
        <div>
          <label className="ctr-label">Cycle</label>
          <SearchableSelect options={cycleOptions} value={form.cycle_id}
            placeholder="Sélectionner un cycle…"
            onChange={v => onFieldChange('cycle_id', v)} />
        </div>
      </div>

      <p className="ctr-section-title">Programmes associés</p>
      <div>
        <label className="ctr-label">Programmes (ECUE) *</label>
        <MultiSelect options={progOptions} value={form.program_ids}
          placeholder={form.professor_id ? "Sélectionner les programmes…" : "Sélectionnez d'abord un professeur"}
          onChange={ids => {
            // Keep existing amounts, remove deselected programs
            const newAmounts = { ...form.program_amounts };
            Object.keys(newAmounts).forEach(k => {
              if (!(ids as number[]).includes(Number(k))) delete newAmounts[Number(k)];
            });
            onFieldChange('program_ids', ids);
            onFieldChange('program_amounts', newAmounts);
          }} />
        <p className="ctr-hint">Obligatoire — les programmes listés correspondent aux cours assignés au professeur sélectionné.</p>
      </div>

      {/* ── Montant par heure pour chaque programme sélectionné ── */}
      {form.program_ids.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <label className="ctr-label" style={{ marginBottom: 8 }}>
            Montant / heure par programme
            <span style={{ fontWeight: 400, color: '#6b7280', marginLeft: 6 }}>(optionnel)</span>
          </label>
          <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            {/* header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 140px 120px', gap: 0, background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
              {['Programme (ECUE)', 'Heures', 'Montant / heure (FCFA)', 'Total estimé'].map(h => (
                <div key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</div>
              ))}
            </div>
            {/* rows */}
            {form.program_ids.map((pid, idx) => {
              const prog   = programs.find(p => p.id === pid);
              if (!prog) return null;
              const name   = `(${prog.course_element?.code ?? '?'}) ${prog.course_element?.name ?? prog.label}`;
              const classe = prog.class_group?.name ?? '';
              const hours  = prog.course_element?.hours ?? prog.hours ?? null;
              const amt = localAmounts[pid] ?? '';
              const total  = amt !== '' && hours !== null && hours !== undefined && !isNaN(parseFloat(amt))
                ? parseFloat(amt) * Number(hours)
                : null;

return (

                <div key={pid} style={{
                  display: 'grid', gridTemplateColumns: '1fr 80px 140px 120px',
                  background: idx % 2 === 0 ? '#fff' : '#fafafa',
                  borderBottom: idx < form.program_ids.length - 1 ? '1px solid #f3f4f6' : 'none',
                  alignItems: 'center',
                }}>
                  <div style={{ padding: '10px 12px' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{name}</div>
                    {classe && <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>{classe}</div>}
                  </div>
                  <div style={{ padding: '10px 12px', fontSize: 13, color: '#374151', textAlign: 'center' }}>
                   {hours !== null && hours !== undefined ? `${hours} h` : <span style={{ color: '#d1d5db' }}>—</span>}
                  </div>
                  <div style={{ padding: '6px 12px' }}>
                    <input
                      className="ctr-input"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="ex: 25000"
                      value={amt}
                      onChange={e => {
  const newAmounts = { ...localAmounts, [pid]: e.target.value };
  setLocalAmounts(newAmounts);
  onFieldChange('program_amounts', newAmounts);
}}
                      style={{ height: 34, fontSize: 13 }}
                    />
                  </div>
                  <div style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: total ? '#059669' : '#d1d5db', textAlign: 'right', paddingRight: 16 }}>
                    {total !== null ? `${Number(total).toLocaleString('fr-FR')} FCFA` : '—'}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="ctr-hint" style={{ marginTop: 6 }}>
            Le montant total du contrat sera automatiquement calculé comme la somme des montants par programme.
          </p>
        </div>
      )}

      <p className="ctr-section-title">Dates</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label className="ctr-label">Date de début *</label>
          <input
            className="ctr-input"
            type="date"
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            required
            // Utilisation de year_start et year_end
            min={selectedYear?.year_start ? selectedYear.year_start.substring(0, 10) : undefined}

          />
        </div>
        <div>
          <label className="ctr-label">Date de fin</label>
          <input
            className="ctr-input"
            type="date"
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            min={form.start_date || (selectedYear?.year_start ? selectedYear.year_start.substring(0, 10) : undefined)}

          />
        </div>

      </div>

      {dateError && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#991b1b', fontSize: 13 }}>
          ⚠️ {dateError}
        </div>
      )}

      {isEdit && (
        <>
          <p className="ctr-section-title">Statut du contrat</p>
          <div>
            <label className="ctr-label">Statut *</label>
            <select className="ctr-input ctr-select" name="status" value={form.status} onChange={handleChange} required>
              {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </>
      )}

      {error && (
        <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 8, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#991b1b', fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
        <button type="button" className="ctr-btn ctr-btn-ghost" onClick={onCancel} disabled={loading}>Annuler</button>
        <button
          type="submit"
          className="ctr-btn ctr-btn-primary"
          disabled={loading || !!dateError}
        >
          {loading ? <><Icon.Loader /> Enregistrement…</> : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ContratFormFields
