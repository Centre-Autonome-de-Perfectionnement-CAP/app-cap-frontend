// src/views/pages/rh/contrats/Contrats.types.ts
// Extrait tel quel de Contrats.tsx — types locaux partagés entre les sous-composants.

export type Professor = {
  id: number;
  full_name: string;
  nationality?: string;
  profession?: string;
  city?: string;
  plot_number?: string;
  house_number?: string;
  ifu_number?: string;
  rib_number?: string;
  bank?: string;
  district?: string;
  email?: string;
  phone?: string;
};
export type ToastType = 'success' | 'error' | 'info' | 'warning';
export interface Toast { id: number; type: ToastType; title: string; message?: string }


export interface FormState {
  division: string; professor_id: string; academic_year_id: string; cycle_id: string;
  regroupement: string; start_date: string; end_date: string; amount: string; notes: string;
  status: string; program_ids: number[];
  /** Montant par heure pour chaque programme sélectionné (clé = program id) */
  program_amounts: Record<number, string>;
  /** Volume horaire pour chaque programme sélectionné (clé = program id) */
  program_hours: Record<number, string>;
}
export const emptyForm: FormState = {
  division: '', professor_id: '', academic_year_id: '', cycle_id: '',
  regroupement: '', start_date: '', end_date: '', amount: '0', notes: '',
  status: 'pending', program_ids: [],
  program_amounts: {},
  program_hours: {},
};

// ─── ContratFormFields ─────────────────────────────────────────────────────────

export interface FilterState {
  search:        string;
  division:      string;
  cycle_id:      string;
  regroupement:  string;
  professor_id:  string;
  academic_year: string;
  status:        string;
}
export const emptyFilters: FilterState = {
  search: '', division: '', cycle_id: '', regroupement: '',
  professor_id: '', academic_year: '', status: '',
};

