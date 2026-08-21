// src/views/pages/rh/contrats/Contrats.helpers.ts
// Extrait tel quel de Contrats.tsx — fonctions utilitaires pures.
import type { Contrat } from '@/types/rh.types'
import type { FilterState } from './Contrats.types'

export const formatDate = (d?: string) => {
  if (!d) return '—';
  const [y, m, day] = d.substring(0, 10).split('-');
  return `${day}/${m}/${y}`;
};
export const formatAmount = (a: number) => Number(a).toLocaleString('fr-FR') + ' FCFA';
export const extractError = (data: any, status: number): string => {
  if (status === 422 && data.errors) {
    const msgs = Object.values(data.errors).flat() as string[];
    return msgs[0] ?? 'Données invalides';
  }
  return data?.message ?? 'Une erreur est survenue';
};

// ─── Validation des dates par rapport à l'année académique ────────────────────
export const validateDatesInAcademicYear = (startDate: string, endDate: string | null, academicYearStart: string, academicYearEnd: string): string | null => {
  const start = new Date(startDate);
  const acStart = new Date(academicYearStart);

  if (start < acStart) {
    return `La date de début (${formatDate(startDate)}) ne peut pas être antérieure au début de l'année académique (${formatDate(academicYearStart)})`;
  }

  if (endDate) {
    const end = new Date(endDate);
    if (end < start) {
      return "La date de fin doit être postérieure à la date de début";
    }
  }

  return null;
};

// ─── CSS global injecté une fois ────────────────────────────────────────────────

export const normalizeDivision = (div: string | null | undefined): string | null => {
  if (!div) return null;
  const d = div.toLowerCase().trim();
  if (d === 'formation_distance' || d === 'rd-fad' || d === 'fad') return 'RD-FAD';
  if (d === 'formation_continue' || d === 'rd-fc' || d === 'fc') return 'RD-FC';
  return div;
};

// ─── AdminCourseSupportModal (version corrigée avec gestion correcte des monographies) ──────────────────────────────────────────────


export function applyFilters(contrats: Contrat[], f: FilterState): Contrat[] {
  return contrats.filter(c => {
    if (f.search.trim()) {
      const q = f.search.toLowerCase();
      const matchNum  = c.contrat_number?.toLowerCase().includes(q);
      const matchProf = c.professor?.full_name?.toLowerCase().includes(q);
      if (!matchNum && !matchProf) return false;
    }
    if (f.division     && c.division     !== f.division)                          return false;
    if (f.cycle_id     && String(c.cycle_id) !== f.cycle_id)                      return false;
    if (f.regroupement && c.regroupement  !== f.regroupement)                     return false;
    if (f.professor_id && String(c.professor_id) !== f.professor_id)              return false;
    if (f.academic_year) {
      const yr = (c as any).academic_year?.academic_year ?? c.academicYear?.academic_year ?? '';
      if (!yr.toLowerCase().includes(f.academic_year.toLowerCase())) return false;
    }
    if (f.status && c.status !== f.status) return false;
    return true;
  });
}

