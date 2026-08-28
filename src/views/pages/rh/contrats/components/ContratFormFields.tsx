// src/views/pages/rh/contrats/components/ContratFormFields.tsx
// Formulaire de contrat avec cascade intelligente, anti-doublon et cohérence relationnelle
import React, { useEffect, useState, useMemo } from 'react'
import rhService from '@/services/rh.service'
import type { AcademicYear, Cycle, ProfessorProgram } from '@/types/rh.types'
import Icon from '../Contrats.icons'
import { DIVISIONS, REGROUPEMENTS, STATUS_OPTIONS } from '../Contrats.constants'
import { formatDate, validateDatesInAcademicYear } from '../Contrats.helpers'
import type { FormState, Professor } from '../Contrats.types'
import SearchableSelect from './SearchableSelect'

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
  const [localAmounts, setLocalAmounts]   = useState<Record<number, string>>(form.program_amounts ?? {});
  const [localHours, setLocalHours]       = useState<Record<number, string>>(form.program_hours ?? {});
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [addCourseSearch, setAddCourseSearch] = useState('');

  useEffect(() => {
    rhService.getAcademicYears().then(setAcademicYears).catch(() => {});
    rhService.getCycles().then(setCycles).catch(() => {});
  }, []);

  useEffect(() => {
    setLocalAmounts(form.program_amounts ?? {});
  }, [form.program_ids, form.program_amounts]);

  useEffect(() => {
    const updatedHours: Record<number, string> = { ...(form.program_hours ?? {}) };
    let changed = false;
    (form.program_ids ?? []).forEach(pid => {
      if (updatedHours[pid] === undefined || updatedHours[pid] === '') {
        const prog = programs.find(p => p.id === pid);
        const h = prog?.course_element?.hours ?? prog?.hours;
        if (h !== undefined && h !== null && h > 0) {
          updatedHours[pid] = String(h);
          changed = true;
        }
      }
    });
    setLocalHours(updatedHours);
    if (changed) {
      onFieldChange('program_hours', updatedHours);
    }
  }, [form.program_ids, programs]);

  useEffect(() => {
    if (form.professor_id) {
      rhService.getProfessorPrograms(form.professor_id)
        .then(data => setPrograms(data))
        .catch(() => setPrograms([]));
    } else { setPrograms([]); }
  }, [form.professor_id]);

  // Validation des dates par rapport à l'année académique sélectionnée
  useEffect(() => {
    if (form.academic_year_id && form.start_date) {
      const selectedYearInfo = academicYears.find(y => String(y.id) === form.academic_year_id);
      if (selectedYearInfo && selectedYearInfo.year_start && selectedYearInfo.year_end) {
        const errorMsg = validateDatesInAcademicYear(
          form.start_date,
          form.end_date || null,
          selectedYearInfo.year_start,
          selectedYearInfo.year_end
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

  // ── Cascade & Filtrage du Cycle selon la Division ──
  const cycleOptions = useMemo(() => cycles.map(c => ({ value: c.id, label: c.name })), [cycles]);

  const filteredCycles = useMemo(() => {
    if (!form.division) return cycleOptions;
    return cycleOptions.filter(c => {
      const name = c.label.toLowerCase();
      if (form.division === 'RD-FAD') {
        return name.includes('licence');
      } else if (form.division === 'RD-FC') {
        return name.includes('master') || name.includes('ingénieur') || name.includes('ingénierie');
      }
      return true;
    });
  }, [form.division, cycleOptions]);

  // Auto-sélection et verrouillage du cycle si un seul choix
  useEffect(() => {
    if (form.division && filteredCycles.length === 1) {
      if (String(form.cycle_id) !== String(filteredCycles[0].value)) {
        onFieldChange('cycle_id', String(filteredCycles[0].value));
      }
    } else if (form.division && filteredCycles.length > 0) {
      // Si la division change et que le cycle actuel n'est plus valide, on l'efface
      const isStillValid = filteredCycles.some(c => String(c.value) === String(form.cycle_id));
      if (form.cycle_id && !isStillValid) {
        onFieldChange('cycle_id', '');
        // Et on efface les cours car ils ne correspondent plus
        onFieldChange('program_ids', []);
        onFieldChange('program_amounts', {});
        onFieldChange('program_hours', {});
      }
    }
  }, [form.division, filteredCycles, form.cycle_id]);

  // ── Cours filtrés selon le cycle et l'année sélectionnés ──
  const availableCourses = useMemo(() => {
    let filtered = programs;
    // Filtrer par cycle (Tolérance pour les cours n'ayant pas de cycle défini en DB)
    if (form.cycle_id) {
      filtered = filtered.filter(p => !p.cycle_id || String(p.cycle_id) === String(form.cycle_id));
    }
    // Filtrer par année académique (Tolérance pour les cours n'ayant pas d'année définie en DB)
    if (form.academic_year_id) {
      filtered = filtered.filter(p => !p.academic_year_id || String(p.academic_year_id) === String(form.academic_year_id));
    }
    // Exclure les cours déjà sélectionnés (anti-doublon)
    const selectedIds = new Set(form.program_ids);
    filtered = filtered.filter(p => !selectedIds.has(p.id));
    return filtered;
  }, [programs, form.cycle_id, form.academic_year_id, form.program_ids]);

  // Cours filtrés + recherche pour le menu "Ajouter un cours"
  const filteredAddCourses = useMemo(() => {
    if (!addCourseSearch.trim()) return availableCourses;
    const q = addCourseSearch.toLowerCase();
    return availableCourses.filter(p => {
      const label = `${p.course_element?.code ?? ''} ${p.course_element?.name ?? p.label} ${p.class_group_name ?? ''} ${p.department_name ?? ''}`.toLowerCase();
      return label.includes(q);
    });
  }, [availableCourses, addCourseSearch]);

  // ── Ajouter un cours ──
  const handleAddCourse = (prog: ProfessorProgram) => {
    const newIds = [...form.program_ids, prog.id];
    onFieldChange('program_ids', newIds);

    // Auto-sélection du cycle et de l'année si pas encore choisis
    if (!form.cycle_id && prog.cycle_id) {
      onFieldChange('cycle_id', String(prog.cycle_id));
    }
    if (!form.academic_year_id && prog.academic_year_id) {
      onFieldChange('academic_year_id', String(prog.academic_year_id));
    }

    // Pré-remplir les heures si disponibles
    const h = prog.course_element?.hours ?? prog.hours;
    if (h && h > 0) {
      const newHours = { ...localHours, [prog.id]: String(h) };
      setLocalHours(newHours);
      onFieldChange('program_hours', newHours);
    }

    setShowAddCourse(false);
    setAddCourseSearch('');
  };

  // ── Supprimer un cours ──
  const handleRemoveCourse = (pid: number) => {
    const newIds = form.program_ids.filter(id => id !== pid);
    const newAmounts = { ...localAmounts };
    delete newAmounts[pid];
    const newHours = { ...localHours };
    delete newHours[pid];

    onFieldChange('program_ids', newIds);
    onFieldChange('program_amounts', newAmounts);
    onFieldChange('program_hours', newHours);
    setLocalAmounts(newAmounts);
    setLocalHours(newHours);
  };

  // ── Calcul du total global ──
  const grandTotal = useMemo(() => {
    let total = 0;
    form.program_ids.forEach(pid => {
      const prog = programs.find(p => p.id === pid);
      const defaultHours = prog?.course_element?.hours ?? prog?.hours ?? 0;
      const hStr = localHours[pid] !== undefined ? localHours[pid] : (defaultHours > 0 ? String(defaultHours) : '');
      const hours = hStr !== '' ? parseFloat(hStr) : 0;
      const amt = localAmounts[pid] ?? '';
      if (amt !== '' && !isNaN(parseFloat(amt)) && hours > 0) {
        total += parseFloat(amt) * hours;
      }
    });
    return total;
  }, [form.program_ids, localAmounts, localHours, programs]);

  const profOptions   = professors.map(p => ({ value: p.id, label: p.full_name }));
  const yearOptions   = academicYears.map(y => ({ value: y.id, label: y.academic_year }));

  // Récupérer l'année académique sélectionnée
  const currentSelectedYear = academicYears.find(y => String(y.id) === form.academic_year_id);

  return (
    <form onSubmit={onSubmit} autoComplete="off">
      <p className="ctr-section-title">Informations générales</p>
      {/* ── RÉORGANISATION HIERARCHIQUE ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        
        {/* Ligne 1 : Année & Division */}
        <div>
          <label className="ctr-label">Année académique *</label>
          <SearchableSelect options={yearOptions} value={form.academic_year_id}
            placeholder="Sélectionner une année…"
            onChange={v => onFieldChange('academic_year_id', v)} />
          {currentSelectedYear && currentSelectedYear.year_start && currentSelectedYear.year_end && (
            <p className="ctr-hint" style={{ color: '#059669' }}>
                Valable du {formatDate(currentSelectedYear.year_start)} au {formatDate(currentSelectedYear.year_end)}
            </p>
          )}
        </div>
        <div>
          <label className="ctr-label">Division *</label>
          <select className="ctr-input ctr-select" name="division" value={form.division} onChange={handleChange} required>
            <option value="">Sélectionner…</option>
            {DIVISIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>

        {/* Ligne 2 : Cycle & Regroupement */}
        <div>
          <label className="ctr-label">Cycle *</label>
          {filteredCycles.length === 1 && form.division ? (
            <div style={{ padding: '8px 12px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, color: '#374151', fontSize: 13 }}>
              {filteredCycles[0].label} <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>(Déduit auto)</span>
            </div>
          ) : (
            <SearchableSelect options={filteredCycles} value={form.cycle_id}
              placeholder={!form.division ? "Sélectionnez d'abord une division…" : "Sélectionner un cycle…"}
              onChange={v => onFieldChange('cycle_id', v)} />
          )}
        </div>
        <div>
          <label className="ctr-label">Regroupement *</label>
          <select className="ctr-input ctr-select" name="regroupement" value={form.regroupement} onChange={handleChange} required>
            <option value="">Sélectionner…</option>
            {REGROUPEMENTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {/* Ligne 3 : Professeur */}
        <div style={{ gridColumn: '1/-1' }}>
          <label className="ctr-label">Professeur *</label>
          <SearchableSelect options={profOptions} value={form.professor_id}
            placeholder="Sélectionner un professeur…"
            onChange={v => {
              onFieldChange('professor_id', v);
              onFieldChange('program_ids', []);
              onFieldChange('program_amounts', {});
              onFieldChange('program_hours', {});
              setLocalAmounts({});
              setLocalHours({});
            }} />
        </div>
      </div>

      {/* ── Section Cours du contrat ── */}
      <p className="ctr-section-title">Cours du contrat</p>

      {!form.professor_id && (
        <div style={{ padding: '16px', background: '#f9fafb', borderRadius: 8, color: '#6b7280', fontSize: 13, textAlign: 'center' }}>
          Sélectionnez d'abord un professeur pour voir ses cours disponibles.
        </div>
      )}

      {form.professor_id && (
        <div>
          {/* Tableau des cours ajoutés */}
          {form.program_ids.length > 0 && (
            <div style={{ border: '1.5px solid #e5e7eb', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
              {/* header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 130px 110px 40px', gap: 0, background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                {['Programme (ECUE)', 'Heures', 'Taux / h (FCFA)', 'Total estimé', ''].map(h => (
                  <div key={h || 'del'} style={{ padding: '8px 10px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</div>
                ))}
              </div>
              {/* rows */}
              {form.program_ids.map((pid, idx) => {
                const prog = programs.find(p => p.id === pid);
                if (!prog) return null;
                const name = `(${prog.course_element?.code ?? '?'}) ${prog.course_element?.name ?? prog.label}`;
                const meta = [
                  prog.class_group_name || prog.class_group?.name,
                  prog.department_name,
                  prog.cycle_name,
                ].filter(Boolean).join(' · ');
                const defaultHours = prog.course_element?.hours ?? prog.hours ?? 0;
                const currentHoursStr = localHours[pid] !== undefined ? localHours[pid] : (defaultHours > 0 ? String(defaultHours) : '');
                const currentHours = currentHoursStr !== '' ? parseFloat(currentHoursStr) : 0;
                const amt = localAmounts[pid] ?? '';
                const total = amt !== '' && currentHours > 0 && !isNaN(parseFloat(amt))
                  ? parseFloat(amt) * currentHours
                  : null;

                return (
                  <div key={pid} style={{
                    display: 'grid', gridTemplateColumns: '1fr 90px 130px 110px 40px',
                    background: idx % 2 === 0 ? '#fff' : '#fafafa',
                    borderBottom: idx < form.program_ids.length - 1 ? '1px solid #f3f4f6' : 'none',
                    alignItems: 'center',
                  }}>
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{name}</div>
                      {meta && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{meta}</div>}
                    </div>
                    <div style={{ padding: '4px 6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <input
                          className="ctr-input"
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          value={currentHoursStr}
                          onChange={e => {
                            const newHours = { ...localHours, [pid]: e.target.value };
                            setLocalHours(newHours);
                            onFieldChange('program_hours', newHours);
                          }}
                          style={{ height: 32, fontSize: 12, textAlign: 'center', padding: '0 4px' }}
                        />
                        <span style={{ fontSize: 11, color: '#6b7280' }}>h</span>
                      </div>
                    </div>
                    <div style={{ padding: '4px 6px' }}>
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
                        style={{ height: 32, fontSize: 12 }}
                      />
                    </div>
                    <div style={{ padding: '8px 6px', fontSize: 12, fontWeight: 600, color: total ? '#059669' : '#d1d5db', textAlign: 'right' }}>
                      {total !== null ? `${Number(total).toLocaleString('fr-FR')} F` : '—'}
                    </div>
                    <div style={{ padding: '4px', display: 'flex', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleRemoveCourse(pid)}
                        style={{
                          width: 28, height: 28, borderRadius: 6, border: '1px solid #fecaca',
                          background: '#fef2f2', color: '#dc2626', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, transition: 'all .15s',
                        }}
                        title="Retirer ce cours"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
              {/* Total global */}
              {grandTotal > 0 && (
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 90px 130px 110px 40px',
                  background: '#f0fdf4', borderTop: '2px solid #059669', padding: '0',
                }}>
                  <div style={{ padding: '10px 10px', fontSize: 13, fontWeight: 700, color: '#059669' }}>
                    Montant total du contrat
                  </div>
                  <div></div>
                  <div></div>
                  <div style={{ padding: '10px 6px', fontSize: 13, fontWeight: 700, color: '#059669', textAlign: 'right' }}>
                    {Number(grandTotal).toLocaleString('fr-FR')} F
                  </div>
                  <div></div>
                </div>
              )}
            </div>
          )}

          {/* Bouton + Ajouter un cours */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="ctr-btn ctr-btn-ghost"
              style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed', height: 42, fontSize: 13 }}
              onClick={() => {
                setShowAddCourse(!showAddCourse);
                setAddCourseSearch('');
              }}
              disabled={availableCourses.length === 0 && !showAddCourse}
            >
              {availableCourses.length === 0 && form.program_ids.length > 0
                ? '✓ Tous les cours disponibles ont été ajoutés'
                : '＋ Ajouter un cours'
              }
            </button>

            {showAddCourse && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 800,
                background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 10,
                boxShadow: '0 10px 40px rgba(0,0,0,.12)', overflow: 'hidden',
              }}>
                <div style={{ padding: 10, borderBottom: '1px solid #f3f4f6' }}>
                  <input
                    type="text"
                    className="ctr-input"
                    placeholder="Rechercher un cours…"
                    value={addCourseSearch}
                    onChange={e => setAddCourseSearch(e.target.value)}
                    autoFocus
                    style={{ height: 36, fontSize: 13 }}
                  />
                </div>
                <div style={{ maxHeight: 240, overflowY: 'auto', padding: 4 }}>
                  {filteredAddCourses.length === 0 ? (
                    <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                      {programs.length === 0
                        ? 'Aucun cours assigné à ce professeur'
                        : availableCourses.length === 0
                          ? 'Aucun cours strictement compatible avec le cycle et l\'année sélectionnés'
                          : 'Aucun résultat pour cette recherche'
                      }
                    </div>
                  ) : (
                    filteredAddCourses.map(prog => {
                      const meta = [
                        prog.class_group_name || prog.class_group?.name,
                        prog.department_name,
                        prog.cycle_name,
                        prog.academic_year_name,
                      ].filter(Boolean).join(' · ');
                      return (
                        <div
                          key={prog.id}
                          onClick={() => handleAddCourse(prog)}
                          style={{
                            padding: '10px 12px', borderRadius: 6, cursor: 'pointer',
                            transition: 'background .1s', fontSize: 13,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f3f4f6')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ fontWeight: 600, color: '#111827' }}>
                            ({prog.course_element?.code ?? '?'}) {prog.course_element?.name ?? prog.label}
                          </div>
                          {meta && (
                            <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 2 }}>
                              {meta}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {form.program_ids.length === 0 && (
            <p className="ctr-hint" style={{ marginTop: 8, color: '#dc2626' }}>
              ⚠ Au moins un cours est obligatoire pour créer un contrat.
            </p>
          )}
          {form.program_ids.length > 0 && (
            <p className="ctr-hint" style={{ marginTop: 6 }}>
              Le montant total du contrat est automatiquement calculé (Taux/h × Heures) par cours.
            </p>
          )}
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
            min={currentSelectedYear?.year_start ? currentSelectedYear.year_start.substring(0, 10) : undefined}
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
            min={form.start_date || (currentSelectedYear?.year_start ? currentSelectedYear.year_start.substring(0, 10) : undefined)}
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
          disabled={loading || !!dateError || form.program_ids.length === 0}
        >
          {loading ? <><Icon.Loader /> Enregistrement…</> : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ContratFormFields
