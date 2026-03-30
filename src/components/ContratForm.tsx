import React, { useState, useEffect } from 'react';
import styles from './ContratForm.module.css'; // Importer les styles

type Professor = {
  id: number;
  full_name: string;
};

type AcademicYear = {
  id: number;
  academic_year: string;
  created_at: string;
};

type Props = {
  onSuccess: () => void;
};

const ContratForm: React.FC<Props> = ({ onSuccess }) => {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [form, setForm] = useState({
    contrat_number: '',
    division: '',
    professor_id: '',
    academic_year_id: '',
    start_date: '',
    end_date: '',
    amount: '',
    status: 'pending',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:8001/rh/professors')
      .then(res => res.json())
      .then(data => setProfessors(data.data || []))
      .catch(err => console.error(err));

    fetch('http://localhost:8001/rh/academic-years')
      .then(res => res.json())
      .then((data: { data: AcademicYear[] }) => {
        const sortedYears = data.data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setAcademicYears(sortedYears);
      })
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0) {
      setMessage('Le montant doit être un nombre positif');
      setLoading(false);
      return;
    }

    if (new Date(form.start_date) >= new Date(form.end_date)) {
      setMessage('La date de fin doit être après la date de début');
      setLoading(false);
      return;
    }

    try {
      const payload = { 
        ...form, 
        professor_id: Number(form.professor_id), 
        academic_year_id: Number(form.academic_year_id), 
        amount: parseFloat(form.amount) 
      };
      const res = await fetch('http://localhost:8001/rh/contrats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Contrat créé avec succès');
        setForm({ contrat_number: '', division: '', professor_id: '', academic_year_id: '', start_date: '', end_date: '', amount: '', status: 'pending' });
        onSuccess();
      } else {
        const errors = data.errors || data.message;
        setMessage(`Erreur : ${Array.isArray(errors) ? errors.join(', ') : errors}`);
      }
    } catch (err) {
      setMessage('Erreur serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div>
        <label>Numéro contrat *</label>
        <input 
          type="text" 
          name="contrat_number" 
          value={form.contrat_number} 
          onChange={handleChange} 
          required 
        />
      </div>

      <div>
        <label>Division</label>
        <input 
          type="text" 
          name="division" 
          value={form.division} 
          onChange={handleChange} 
        />
      </div>

      <div>
        <label>Professeur *</label>
        <select 
          name="professor_id" 
          value={form.professor_id} 
          onChange={handleChange} 
          required
        >
          <option value="">-- Choisir --</option>
          {professors.map(p => (
            <option key={p.id} value={p.id}>{p.full_name}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Année académique *</label>
        <select 
          name="academic_year_id" 
          value={form.academic_year_id} 
          onChange={handleChange} 
          required
        >
          <option value="">Sélectionnez une année académique</option>
          {academicYears.map(year => (
            <option key={year.id} value={year.id}>{year.academic_year}</option>
          ))}
        </select>
      </div>

      <div>
        <label>Date début *</label>
        <input 
          type="date" 
          name="start_date" 
          value={form.start_date} 
          onChange={handleChange} 
          required 
        />
      </div>

      <div>
        <label>Date fin</label>
        <input 
          type="date" 
          name="end_date" 
          value={form.end_date} 
          onChange={handleChange} 
        />
      </div>

      <div>
        <label>Montant (FCFA) *</label>
        <input 
          type="number" 
          name="amount" 
          value={form.amount} 
          onChange={handleChange} 
          required 
        />
      </div>

      <div>
        <label>Statut</label>
        <select 
          name="status" 
          value={form.status} 
          onChange={handleChange}
        >
          <option value="pending">En attente</option>
        </select>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Envoi...' : 'Créer le contrat'}
      </button>

      {message && <div className={styles.message}>{message}</div>}
    </form>
  );
};

export default ContratForm;