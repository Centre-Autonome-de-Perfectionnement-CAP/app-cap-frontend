import React, { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
type Professor = {
  id: number;
  full_name: string;
};

type AcademicYear = {
  id: number;
  academic_year: string;
  created_at: string;
};

type Cycle = {
  id: number;
  name: string;
  abbreviation?: string;
};

type Contrat = {
  id: number;
  uuid?: string;
  contrat_number: string;
  division?: string;
  professor_id: number;
  academic_year_id: number;
  cycle_id?: number;
  regroupement?: string;
  start_date: string;
  end_date?: string;
  amount: number;
  status: string;
  notes?: string;
  is_validated?: boolean;
  validation_date?: string;
  professor?: { full_name: string };
  academicYear?: { academic_year: string };
  cycle?: { name: string };
};

// ─── Constantes ───────────────────────────────────────────────────────────────
const DIVISIONS = [
  { value: 'RD-FAD', label: 'Responsable Division-Formation à Distance (RD-FAD)' },
  { value: 'RD-FC',  label: 'Responsable Division-Formation Continue (RD-FC)' },
];

const REGROUPEMENTS = [
  { value: '1', label: 'Regroupement I' },
  { value: '2', label: 'Regroupement II' },
];

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'En attente', color: '#92400e', bg: '#fef3c7' },
  signed:    { label: 'Signé',      color: '#065f46', bg: '#d1fae5' },
  ongoing:   { label: 'En cours',   color: '#1e40af', bg: '#dbeafe' },
  completed: { label: 'Terminé',    color: '#374151', bg: '#f3f4f6' },
  cancelled: { label: 'Annulé',     color: '#991b1b', bg: '#fee2e2' },
};

const TODAY = new Date().toISOString().split('T')[0];

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR');
};

const formatContratNumber = (id: number) => `00${id}`;

// ─── Styles communs ───────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '14px',
  boxSizing: 'border-box',
  backgroundColor: '#fff',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '4px',
  fontWeight: 600,
  fontSize: '13px',
  color: '#374151',
};

// ─── Helper headers ───────────────────────────────────────────────────────────
const getHeaders = () => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// ─── Select professeur avec filtre + scroll ───────────────────────────────────
const ProfessorSelect: React.FC<{
  professors: Professor[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}> = ({ professors, value, onChange, required }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen]     = useState(false);
  const ref                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = professors.filter((p) =>
    (p.full_name || '').toLowerCase().includes(search.toLowerCase())
  );
  const selected = professors.find((p) => String(p.id) === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          ...inputStyle,
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          userSelect: 'none',
        }}
      >
        <span style={{ color: selected ? '#111827' : '#9ca3af' }}>
          {selected ? selected.full_name : '— Sélectionner un professeur —'}
        </span>
        <span style={{ color: '#6b7280', fontSize: '11px' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 500,
          backgroundColor: '#fff', border: '1px solid #d1d5db',
          borderRadius: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: '2px',
        }}>
          <div style={{ padding: '8px 8px 4px' }}>
            <input
              autoFocus
              type="text"
              placeholder="Filtrer par nom ou lettre…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ ...inputStyle, fontSize: '13px', padding: '6px 8px' }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <ul style={{ margin: 0, padding: '4px 0', listStyle: 'none', maxHeight: '180px', overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <li style={{ padding: '10px 12px', color: '#9ca3af', fontSize: '13px' }}>Aucun résultat</li>
            ) : filtered.map((p) => (
              <li
                key={p.id}
                onClick={() => { onChange(String(p.id)); setSearch(''); setOpen(false); }}
                style={{
                  padding: '8px 12px', cursor: 'pointer', fontSize: '14px',
                  backgroundColor: String(p.id) === value ? '#dbeafe' : 'transparent',
                  color: String(p.id) === value ? '#1e40af' : '#111827',
                  fontWeight: String(p.id) === value ? 600 : 400,
                }}
                onMouseEnter={(e) => {
                  if (String(p.id) !== value)
                    (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6';
                }}
                onMouseLeave={(e) => {
                  if (String(p.id) !== value)
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                }}
              >
                {p.full_name}
              </li>
            ))}
          </ul>
        </div>
      )}

      <input
        type="text" required={required} value={value} readOnly tabIndex={-1}
        style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
      />
    </div>
  );
};

// ─── Select année académique ───────────────────────────────────────────────────
const AcademicYearSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}> = ({ value, onChange, required }) => {
  const [years, setYears]     = useState<AcademicYear[]>([]);
  const [open, setOpen]       = useState(false);
  const [loadErr, setLoadErr] = useState('');
  const ref                   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('http://localhost:8001/rh/academic-years', { headers: getHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const list: AcademicYear[] = Array.isArray(data) ? data : (data.data || []);
        const sortedList = list.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setYears(sortedList);
        setLoadErr('');
        if (!value && sortedList[0]) onChange(String(sortedList[0].id));
      })
      .catch((err) => {
        console.error('AcademicYearSelect:', err.message);
        setLoadErr('Impossible de charger les années académiques');
      });
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const sorted   = [...years].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const selected = sorted.find((y) => String(y.id) === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          ...inputStyle, cursor: 'pointer', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', userSelect: 'none',
        }}
      >
        <span style={{ color: selected ? '#111827' : '#9ca3af', fontSize: '14px' }}>
          {selected ? selected.academic_year : '— Sélectionner une année —'}
        </span>
        <span style={{ color: '#6b7280', fontSize: '11px' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 500,
          backgroundColor: '#fff', border: '1px solid #d1d5db',
          borderRadius: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: '2px',
        }}>
          {sorted.length === 0 ? (
            <div style={{ padding: '10px 12px', color: '#9ca3af', fontSize: '13px' }}>
              {loadErr || 'Aucune année disponible'}
            </div>
          ) : (
            <ul style={{ margin: 0, padding: '4px 0', listStyle: 'none', maxHeight: '180px', overflowY: 'auto' }}>
              {sorted.map((y) => (
                <li
                  key={y.id}
                  onClick={() => { onChange(String(y.id)); setOpen(false); }}
                  style={{
                    padding: '8px 12px', cursor: 'pointer', fontSize: '14px',
                    backgroundColor: String(y.id) === value ? '#dbeafe' : 'transparent',
                    color: String(y.id) === value ? '#1e40af' : '#111827',
                    fontWeight: String(y.id) === value ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (String(y.id) !== value)
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    if (String(y.id) !== value)
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  {y.academic_year}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <input
        type="text" required={required} value={value} readOnly tabIndex={-1}
        style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
      />
    </div>
  );
};

// ─── Select cycle ─────────────────────────────────────────────────────────────
const CycleSelect: React.FC<{
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}> = ({ value, onChange, required }) => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [open, setOpen] = useState(false);
  const [loadErr, setLoadErr] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('http://localhost:8001/rh/cycles', { headers: getHeaders() })
      .then(async res => {
        const text = await res.text(); // voir le contenu brut
        console.log('RAW RESPONSE:', text);
        return JSON.parse(text); // seulement après avoir vérifié
      })
      .then(data => {
        const list: Cycle[] = Array.isArray(data) ? data : (data.data || []);
        setCycles(list);
        setLoadErr('');
      })
      .catch(err => {
        console.error('CycleSelect:', err.message);
        setLoadErr('Impossible de charger les cycles');
      });
  }, []);

  const selected = cycles.find(c => String(c.id) === value);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          ...inputStyle, cursor: 'pointer', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', userSelect: 'none',
        }}
      >
        <span style={{ color: selected ? '#111827' : '#9ca3af', fontSize: '14px' }}>
          {selected ? selected.name : '— Sélectionner un cycle —'}
        </span>
        <span style={{ color: '#6b7280', fontSize: '11px' }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 500,
          backgroundColor: '#fff', border: '1px solid #d1d5db',
          borderRadius: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', marginTop: '2px',
        }}>
          {cycles.length === 0 ? (
            <div style={{ padding: '10px 12px', color: '#9ca3af', fontSize: '13px' }}>
              {loadErr || 'Aucun cycle disponible'}
            </div>
          ) : (
            <ul style={{ margin: 0, padding: '4px 0', listStyle: 'none', maxHeight: '180px', overflowY: 'auto' }}>
              {cycles.map(c => (
                <li
                  key={c.id}
                  onClick={() => { onChange(String(c.id)); setOpen(false); }}
                  style={{
                    padding: '8px 12px', cursor: 'pointer', fontSize: '14px',
                    backgroundColor: String(c.id) === value ? '#dbeafe' : 'transparent',
                    color: String(c.id) === value ? '#1e40af' : '#111827',
                    fontWeight: String(c.id) === value ? 600 : 400,
                  }}
                  onMouseEnter={e => {
                    if (String(c.id) !== value)
                      (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={e => {
                    if (String(c.id) !== value)
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  {c.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <input
        type="text" required={required} value={value} readOnly tabIndex={-1}
        style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
      />
    </div>
  );
};

// ─── Formulaire partagé ───────────────────────────────────────────────────────
const emptyForm = {
  division:        '',
  professor_id:    '',
  academic_year_id: '',
  cycle_id:        '',
  regroupement:    '',
  start_date:      '',
  end_date:        '',
  amount:          '',
};

type FormState = typeof emptyForm;

const ContratFormFields: React.FC<{
  form: FormState;
  professors: Professor[];
  onFieldChange: (name: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading: boolean;
  message: string;
  submitLabel: string;
}> = ({ form, professors, onFieldChange, onSubmit, onCancel, loading, message, submitLabel }) => {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => onFieldChange(e.target.name, e.target.value);

  return (
    <form onSubmit={onSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

        {/* Division */}
        <div>
          <label style={labelStyle}>Division *</label>
          <select style={inputStyle} name="division" value={form.division} onChange={handleChange} required>
            <option value="">— Sélectionner —</option>
            {DIVISIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        {/* Année académique */}
        <div>
          <label style={labelStyle}>Année académique *</label>
          <AcademicYearSelect
            value={form.academic_year_id}
            onChange={(val) => onFieldChange('academic_year_id', val)}
            required
          />
        </div>

        {/* Cycle */}
        <div>
          <label style={labelStyle}>Cycle *</label>
          <CycleSelect
            value={form.cycle_id}
            onChange={(val) => onFieldChange('cycle_id', val)}
            required
          />
        </div>

        {/* Regroupement */}
        <div>
          <label style={labelStyle}>Regroupement *</label>
          <select
            style={inputStyle}
            name="regroupement"
            value={form.regroupement}
            onChange={handleChange}
            required
          >
            <option value="">— Sélectionner —</option>
            {REGROUPEMENTS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        {/* Professeur */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Professeur *</label>
          <ProfessorSelect
            professors={professors}
            value={form.professor_id}
            onChange={(val) => onFieldChange('professor_id', val)}
            required
          />
        </div>

        {/* Date de début */}
        <div>
          <label style={labelStyle}>Date de début *</label>
          <input
            style={inputStyle} type="date" name="start_date"
            value={form.start_date} onChange={handleChange} required min={TODAY}
          />
        </div>

        {/* Date de fin */}
        <div>
          <label style={labelStyle}>Date de fin</label>
          <input
            style={inputStyle} type="date" name="end_date"
            value={form.end_date} onChange={handleChange} min={form.start_date || TODAY}
          />
        </div>

        {/* Montant */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Montant (FCFA) *</label>
          <input
            style={inputStyle} type="number" name="amount"
            value={form.amount} onChange={handleChange}
            required min="100" step="any" placeholder="Minimum 100 FCFA"
          />
          {form.amount !== '' && Number(form.amount) < 100 && (
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#dc2626' }}>
              Le montant minimum est de 100 FCFA
            </p>
          )}
        </div>
      </div>

      {/* Message retour */}
      {message && (
        <p style={{
          marginTop: '12px', padding: '10px 14px', borderRadius: '6px', fontSize: '13px',
          backgroundColor: message.startsWith('✅') ? '#d1fae5' : '#fee2e2',
          color: message.startsWith('✅') ? '#065f46' : '#991b1b',
        }}>
          {message}
        </p>
      )}

      {/* Boutons */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
        <button
          type="submit" disabled={loading}
          style={{
            flex: 1, padding: '10px',
            backgroundColor: loading ? '#93c5fd' : '#2563eb',
            color: '#fff', border: 'none', borderRadius: '6px',
            fontSize: '14px', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Enregistrement...' : submitLabel}
        </button>
        <button
          type="button" onClick={onCancel}
          style={{
            flex: 1, padding: '10px',
            backgroundColor: '#f9fafb', color: '#6b7280',
            border: '1px solid #e5e7eb', borderRadius: '6px',
            fontSize: '14px', cursor: 'pointer',
          }}
        >
          Annuler
        </button>
      </div>
    </form>
  );
};

// ─── Modal générique ──────────────────────────────────────────────────────────
const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({
  title, onClose, children,
}) => (
  <div
    style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.55)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000,
    }}
    onClick={onClose}
  >
    <div
      style={{
        backgroundColor: '#fff', borderRadius: '10px', padding: '28px',
        width: '600px', maxWidth: '95vw', maxHeight: '92vh', overflowY: 'auto',
        boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#111827' }}>{title}</h2>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#9ca3af' }}
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Page principale ──────────────────────────────────────────────────────────
const Contrats: React.FC = () => {
  const [contrats, setContrats]             = useState<Contrat[]>([]);
  const [professors, setProfessors]         = useState<Professor[]>([]);
  const [refresh, setRefresh]               = useState(false);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [showCreate, setShowCreate]         = useState(false);
  const [editingContrat, setEditingContrat] = useState<Contrat | null>(null);
  const [editForm, setEditForm]             = useState<FormState>({ ...emptyForm });
  const [createForm, setCreateForm]         = useState<FormState>({ ...emptyForm });
  const [editLoading, setEditLoading]       = useState(false);
  const [editMessage, setEditMessage]       = useState('');
  const [createLoading, setCreateLoading]   = useState(false);
  const [createMessage, setCreateMessage]   = useState('');

  const reload = () => setRefresh((p) => !p);

  const extractError = async (res: Response): Promise<string> => {
    try {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return `Erreur HTTP ${res.status}`;
      const data = await res.json();
      if (data.errors) return (Object.values(data.errors) as string[][]).flat().join(' | ');
      return data.message || `Erreur HTTP ${res.status}`;
    } catch {
      return `Erreur HTTP ${res.status}`;
    }
  };

 

  const buildEditPayload = (form: FormState, currentStatus: string) => ({
    division:         form.division        || null,
    professor_id:     Number(form.professor_id),
    academic_year_id: Number(form.academic_year_id),
    cycle_id:         Number(form.cycle_id),
    regroupement:     form.regroupement,
    start_date:       form.start_date,
    end_date:         form.end_date        || null,
    amount:           parseFloat(form.amount),
    status:           currentStatus,
  });

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch('http://localhost:8001/rh/contrats', { headers: getHeaders() })
      .then((res) => { if (!res.ok) throw new Error('Erreur de chargement'); return res.json(); })
      .then((data) => { setContrats(data.data || []); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [refresh]);

  useEffect(() => {
    fetch('http://localhost:8001/rh/professors', { headers: getHeaders() })
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((data) => setProfessors(data.data || []))
      .catch(() => {});
  }, []);

  const openEdit = (c: Contrat) => {
    setEditingContrat(c);
    setEditMessage('');
    setEditForm({
      division:         c.division                      ?? '',
      professor_id:     String(c.professor_id           ?? ''),
      academic_year_id: String(c.academic_year_id       ?? ''),
      cycle_id:         String(c.cycle_id               ?? ''),
      regroupement:     c.regroupement                  ?? '',
      start_date:       c.start_date ? new Date(c.start_date).toISOString().split('T')[0] : '',
      end_date:         c.end_date   ? new Date(c.end_date).toISOString().split('T')[0]   : '',
      amount:           String(c.amount                 ?? ''),
    });
  };

  const closeEdit   = () => { setEditingContrat(null); setEditMessage(''); };
  const closeCreate = () => { setShowCreate(false); setCreateMessage(''); setCreateForm({ ...emptyForm }); };

  const handleEditFieldChange   = (name: string, value: string) =>
    setEditForm((f) => ({ ...f, [name]: value }));
  const handleCreateFieldChange = (name: string, value: string) =>
    setCreateForm((f) => ({ ...f, [name]: value }));

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContrat) return;
    setEditLoading(true);
    setEditMessage('');
    try {
      const res = await fetch(`http://localhost:8001/rh/contrats/${editingContrat.id}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(buildEditPayload(editForm, editingContrat.status)),
      });
      if (!res.ok) throw new Error(await extractError(res));
      setEditMessage('✅ Contrat modifié avec succès');
      reload();
      setTimeout(() => closeEdit(), 1200);
    } catch (err: any) {
      setEditMessage(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateMessage('');
    try {
      const res = await fetch('http://localhost:8001/rh/contrats', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(buildCreatePayload(createForm)),
      });
      if (!res.ok) throw new Error(await extractError(res));
      setCreateMessage('✅ Contrat créé avec succès');
      reload();
      setTimeout(() => closeCreate(), 1200);
    } catch (err: any) {
      setCreateMessage(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce contrat ?')) return;
    try {
      const res = await fetch(`http://localhost:8001/rh/contrats/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.status === 204) { alert('Contrat supprimé avec succès'); reload(); return; }
      const data = await res.json();
      if (res.ok) { alert(data.message || 'Contrat supprimé avec succès'); reload(); }
      else {
        const errMsg = data.errors
          ? (Object.values(data.errors) as string[][]).flat().join(' | ')
          : data.message || 'Suppression échouée';
        alert(errMsg);
      }
    } catch {
      alert('Erreur réseau — vérifiez la connexion au serveur');
    }
  };

  const TABLE_HEADERS = ['ID', 'N° Contrat', 'Division', 'Cycle', 'Regroupement', 'Professeur', 'Année', 'Début', 'Fin', 'Montant', 'Statut', 'Actions'];

  return (
    <div style={{ padding: '24px', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111827', margin: 0 }}>ListeContrats</h1>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            backgroundColor: '#16a34a', color: '#fff', padding: '8px 18px',
            borderRadius: '6px', border: 'none', cursor: 'pointer',
            fontWeight: 600, fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px',
          }}
        >
          Nouveau contrat
        </button>
      </div>

      {/* Tableau */}
      {loading ? (
        <p style={{ color: '#6b7280' }}>Chargement en cours...</p>
      ) : error ? (
        <p style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '12px', borderRadius: '6px' }}>
          {error}
        </p>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6' }}>
                {TABLE_HEADERS.map((h) => (
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
                  <td colSpan={12} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                    Aucun contrat trouvé
                  </td>
                </tr>
              ) : contrats.map((c, idx) => {
                const status   = statusConfig[c.status] || { label: c.status, color: '#000', bg: '#eee' };
                const divLabel = DIVISIONS.find((d) => d.value === c.division)?.label || c.division || '—';
                return (
                  <tr key={c.id} style={{
                    backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb',
                    borderBottom: '1px solid #f3f4f6',
                  }}>
                    {/* ID */}
                    <td style={{ padding: '12px 14px', color: '#6b7280', fontSize: '13px' }}>
                      {c.id}
                    </td>
                    {/* N° Contrat */}
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1e40af', letterSpacing: '0.5px' }}>
                      {formatContratNumber(c.id)}
                    </td>
                    {/* Division */}
                    <td style={{ padding: '12px 14px' }}>
                      {c.division ? (
                        <span style={{
                          display: 'inline-block',
                          backgroundColor: c.division === 'RD-FC' ? '#ede9fe' : '#fce7f3',
                          color: c.division === 'RD-FAD' ? '#5b21b6' : '#9d174d',
                          padding: '2px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                        }}>
                          {divLabel}
                        </span>
                      ) : '—'}
                    </td>
                    {/* Cycle */}
                    <td style={{ padding: '12px 14px', color: '#4b5563' }}>
                      {c.cycle ? c.cycle.name : '—'}
                    </td>
                    {/* Regroupement */}
                    <td style={{ padding: '12px 14px', color: '#4b5563' }}>
                      {c.regroupement ? `Regroupement ${c.regroupement === '1' ? 'I' : 'II'}` : '—'}
                    </td>
                    {/* Professeur */}
                    <td style={{ padding: '12px 14px', color: '#4b5563' }}>
                      {c.professor ? c.professor.full_name : `Prof. #${c.professor_id}`}
                    </td>
                    {/* Année */}
                    <td style={{ padding: '12px 14px', color: '#4b5563' }}>
                      {c.academicYear ? c.academicYear.academic_year : `Année #${c.academic_year_id}`}
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
                    <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontWeight: 500, color: '#111827' }}>
                      {Number(c.amount).toLocaleString('fr-FR')} FCFA
                    </td>
                    {/* Statut */}
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        display: 'inline-block', backgroundColor: status.bg, color: status.color,
                        padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                      }}>
                        {status.label}
                      </span>
                    </td>
                    {/* Actions */}
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => openEdit(c)}
                          style={{
                            backgroundColor: '#2563eb', color: '#fff',
                            padding: '5px 12px', borderRadius: '6px', border: 'none',
                            cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                          }}
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          style={{
                            backgroundColor: '#dc2626', color: '#fff',
                            padding: '5px 12px', borderRadius: '6px', border: 'none',
                            cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                          }}
                        >
                          Supprimer
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
            form={createForm}
            professors={professors}
            onFieldChange={handleCreateFieldChange}
            onSubmit={handleCreateSubmit}
            onCancel={closeCreate}
            loading={createLoading}
            message={createMessage}
            submitLabel="Créer le contrat"
          />
        </Modal>
      )}

      {/* ── MODAL ÉDITION ── */}
      {editingContrat && (
        <Modal title={`✏️ Modifier — Contrat ${formatContratNumber(editingContrat.id)}`} onClose={closeEdit}>
          <ContratFormFields
            form={editForm}
            professors={professors}
            onFieldChange={handleEditFieldChange}
            onSubmit={handleEditSubmit}
            onCancel={closeEdit}
            loading={editLoading}
            message={editMessage}
            submitLabel="Enregistrer les modifications"
          />
        </Modal>
      )}
    </div>
  );
};

export default Contrats;