import React, { useCallback, useEffect, useRef, useState } from 'react';
import rhService from '@/services/rh.service';
import { getAssetUrl } from '@/utils/assets';
import type {
  Contrat,
  AcademicYear,
  Cycle,
  ContratStatus,
  CreateContratPayload,
  UpdateContratPayload,
  ProfessorProgram,
} from '@/types/rh.types';

// ─── Constantes rôles (droits d'accès page Contrats) ─────────────────────────
const ROLE_CHEF_CAP = 3;   // accès complet SAUF supports de cours
const ROLE_RD_FC    = 13;  // supports uniquement RD-FC ; autres boutons bloqués
const ROLE_RD_FAD   = 12;  // supports uniquement RD-FAD ; autres boutons bloqués

// ─── Types locaux ──────────────────────────────────────────────────────────────
type Professor = {
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
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: number; type: ToastType; title: string; message?: string }

// ─── Constantes ────────────────────────────────────────────────────────────────
const DIVISIONS = [
  { value: 'RD-FAD', label: 'RD-FAD — Responsable Division-Formation à Distance' },
  { value: 'RD-FC',  label: 'RD-FC — Responsable Division-Formation Continue' },
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
  { value: 'cancelled',  label: 'Résilié' },
  { value: 'transfered', label: 'Transféré' },
];
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:    { label: 'En attente', color: '#92400e', bg: '#fffbeb', dot: '#f59e0b' },
  signed:     { label: 'Signé',      color: '#065f46', bg: '#f0fdf4', dot: '#10b981' },
  ongoing:    { label: 'En cours',   color: '#1e3a8a', bg: '#eff6ff', dot: '#3b82f6' },
  completed:  { label: 'Terminé',    color: '#374151', bg: '#f9fafb', dot: '#9ca3af' },
  cancelled:  { label: 'Rejeté',     color: '#7f1d1d', bg: '#fef2f2', dot: '#ef4444' },
  transfered: { label: 'Transféré',  color: '#3b0764', bg: '#faf5ff', dot: '#a855f7' },
  resiliated: { label: 'Résilié',     color: 'red'    },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (d?: string) => {
  if (!d) return '—';
  const [y, m, day] = d.substring(0, 10).split('-');
  return `${day}/${m}/${y}`;
};
const formatAmount = (a: number) => Number(a).toLocaleString('fr-FR') + ' FCFA';
const extractError = (data: any, status: number): string => {
  if (status === 422 && data.errors) {
    const msgs = Object.values(data.errors).flat() as string[];
    return msgs[0] ?? 'Données invalides';
  }
  return data?.message ?? 'Une erreur est survenue';
};

// ─── Validation des dates par rapport à l'année académique ────────────────────
const validateDatesInAcademicYear = (startDate: string, endDate: string | null, academicYearStart: string, academicYearEnd: string): string | null => {
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
const GLOBAL_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  .ctr-root * { box-sizing: border-box; }
  .ctr-root { font-family: 'DM Sans', sans-serif; }

  .ctr-btn { display: inline-flex; align-items: center; gap: 7px; padding: 0 18px; height: 38px; border-radius: 8px; border: none; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all .18s; white-space: nowrap; }
  .ctr-btn:disabled { opacity: .5; cursor: not-allowed; }
  .ctr-btn-primary   { background: #1a1a2e; color: #fff; }
  .ctr-btn-primary:hover:not(:disabled) { background: #16213e; box-shadow: 0 4px 16px rgba(26,26,46,.25); }
  .ctr-btn-success   { background: #059669; color: #fff; }
  .ctr-btn-success:hover:not(:disabled) { background: #047857; box-shadow: 0 4px 16px rgba(5,150,105,.3); }
  .ctr-btn-danger    { background: #dc2626; color: #fff; }
  .ctr-btn-danger:hover:not(:disabled)  { background: #b91c1c; }
  .ctr-btn-ghost     { background: transparent; color: #6b7280; border: 1.5px solid #e5e7eb; }
  .ctr-btn-ghost:hover:not(:disabled)   { background: #f9fafb; color: #111827; }
  .ctr-btn-purple    { background: #7c3aed; color: #fff; }
  .ctr-btn-purple:hover:not(:disabled)  { background: #6d28d9; box-shadow: 0 4px 16px rgba(124,58,237,.3); }
  .ctr-btn-orange    { background: #ea580c; color: #fff; }
  .ctr-btn-orange:hover:not(:disabled)  { background: #c2410c; box-shadow: 0 4px 16px rgba(234,88,12,.3); }
  .ctr-btn-icon { width: 34px; height: 34px; padding: 0; display: inline-flex; align-items: center; justify-content: center; border-radius: 8px; border: 1.5px solid #e5e7eb; background: #fff; cursor: pointer; transition: all .15s; color: #6b7280; }
  .ctr-btn-icon:hover { border-color: #d1d5db; background: #f9fafb; color: #111827; }
  .ctr-btn-icon:disabled { opacity: .4; cursor: not-allowed; }

  .ctr-input { width: 100%; height: 40px; padding: 0 12px; border-radius: 8px; border: 1.5px solid #e5e7eb; font-size: 14px; font-family: inherit; background: #fff; color: #111827; outline: none; transition: border-color .15s, box-shadow .15s; }
  .ctr-input:focus { border-color: #1a1a2e; box-shadow: 0 0 0 3px rgba(26,26,46,.08); }
  .ctr-input::placeholder { color: #9ca3af; }
  .ctr-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 10px center; padding-right: 36px; cursor: pointer; }
  .ctr-textarea { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1.5px solid #e5e7eb; font-size: 14px; font-family: inherit; resize: vertical; min-height: 80px; outline: none; transition: border-color .15s; }
  .ctr-textarea:focus { border-color: #1a1a2e; box-shadow: 0 0 0 3px rgba(26,26,46,.08); }
  .ctr-label { display: block; font-size: 12.5px; font-weight: 600; color: #374151; margin-bottom: 5px; letter-spacing: .01em; }
  .ctr-hint  { font-size: 11.5px; color: #6b7280; margin-top: 4px; }
  .ctr-err   { font-size: 11.5px; color: #dc2626; margin-top: 4px; }

  /* Dropdown */
  .ctr-dropdown-trigger { width: 100%; height: 40px; padding: 0 12px; border-radius: 8px; border: 1.5px solid #e5e7eb; font-size: 14px; font-family: inherit; background: #fff; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: border-color .15s; user-select: none; }
  .ctr-dropdown-trigger:focus { border-color: #1a1a2e; box-shadow: 0 0 0 3px rgba(26,26,46,.08); outline: none; }
  .ctr-dropdown-trigger.open { border-color: #1a1a2e; }
  .ctr-dropdown-menu { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 700; background: #fff; border: 1.5px solid #e5e7eb; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,.12); overflow: hidden; animation: dropIn .12s ease; }
  @keyframes dropIn { from { opacity:0; transform: translateY(-6px) } to { opacity:1; transform: translateY(0) } }
  .ctr-dropdown-search { padding: 10px; border-bottom: 1px solid #f3f4f6; }
  .ctr-dropdown-search input { width: 100%; height: 34px; padding: 0 10px; border-radius: 6px; border: 1.5px solid #e5e7eb; font-size: 13px; font-family: inherit; outline: none; }
  .ctr-dropdown-list { max-height: 220px; overflow-y: auto; padding: 4px; }
  .ctr-dropdown-item { padding: 9px 12px; border-radius: 6px; cursor: pointer; font-size: 13.5px; display: flex; align-items: center; justify-content: space-between; transition: background .1s; }
  .ctr-dropdown-item:hover { background: #f3f4f6; }
  .ctr-dropdown-item.selected { background: #eff6ff; color: #1d4ed8; font-weight: 600; }
  .ctr-dropdown-empty { padding: 16px; text-align: center; color: #9ca3af; font-size: 13px; }

  /* Badge statut */
  .ctr-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
  .ctr-badge-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

  /* Section title */
  .ctr-section-title { font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .08em; margin: 20px 0 12px; padding-bottom: 8px; border-bottom: 1px solid #f3f4f6; }

  /* Table */
  .ctr-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  .ctr-table th { padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: .06em; white-space: nowrap; background: #fafafa; border-bottom: 1.5px solid #f3f4f6; position: sticky; top: 0; }
  .ctr-table td { padding: 14px 14px; border-bottom: 1px solid #f9fafb; color: #374151; vertical-align: middle; }
  .ctr-table tbody tr { transition: background .12s; }
  .ctr-table tbody tr:hover { background: #fafafa; }
  .ctr-table tbody tr:last-child td { border-bottom: none; }

  /* Modal */
  .ctr-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.45); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 16px; animation: fadeIn .18s; }
  @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
  .ctr-modal { background: #fff; border-radius: 16px; box-shadow: 0 32px 80px rgba(0,0,0,.2); display: flex; flex-direction: column; max-height: 92vh; animation: slideUp .2s ease; overflow: hidden; }
  @keyframes slideUp { from { opacity:0; transform: translateY(20px) } to { opacity:1; transform: translateY(0) } }
  .ctr-modal-header { padding: 24px 28px 20px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
  .ctr-modal-body   { flex: 1; overflow-y: auto; padding: 24px 28px; }
  .ctr-modal-footer { padding: 16px 28px; border-top: 1px solid #f3f4f6; display: flex; gap: 10px; justify-content: flex-end; flex-shrink: 0; }
  .ctr-modal-close  { width: 32px; height: 32px; border-radius: 8px; border: none; background: #f3f4f6; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #6b7280; transition: all .15s; }
  .ctr-modal-close:hover { background: #e5e7eb; color: #111827; }

  /* Toast */
  .ctr-toasts { position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; }
  .ctr-toast { pointer-events: all; min-width: 300px; max-width: 400px; background: #fff; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,.14); border: 1.5px solid #f3f4f6; padding: 14px 16px; display: flex; align-items: flex-start; gap: 12px; animation: toastIn .25s cubic-bezier(.22,1,.36,1); }
  @keyframes toastIn { from { opacity:0; transform: translateX(20px) } to { opacity:1; transform: translateX(0) } }
  .ctr-toast-icon { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .ctr-toast-content { flex: 1; }
  .ctr-toast-title   { font-size: 13.5px; font-weight: 700; color: #111827; margin-bottom: 2px; }
  .ctr-toast-msg     { font-size: 12.5px; color: #6b7280; line-height: 1.4; }

  /* Confirm modal */
  .ctr-confirm-body { text-align: center; padding: 8px 0 4px; }
  .ctr-confirm-icon { width: 56px; height: 56px; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }

  /* PDF preview */
  .ctr-pdf-preview { font-family: 'Georgia', serif; font-size: 11pt; line-height: 1.65; color: #111; padding: 24px 0; }

  /* Upload zone */
  .ctr-upload-zone { border: 2px dashed #d1d5db; border-radius: 12px; padding: 32px 24px; text-align: center; cursor: pointer; transition: all .2s; background: #fafafa; }
  .ctr-upload-zone:hover, .ctr-upload-zone.drag { border-color: #ea580c; background: #fff7ed; }
  .ctr-upload-zone.has-file { border-color: #059669; background: #f0fdf4; }

  /* Lock badge */
  .ctr-lock-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

  /* Rejection badge */
  .ctr-reject-badge { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }

  /* Filter bar */
  .ctr-filters { background: #fff; border-radius: 12px; border: 1.5px solid #f1f5f9; box-shadow: 0 1px 6px rgba(0,0,0,.04); padding: 16px 20px; margin-bottom: 16px; }
  .ctr-filters-row { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; }
  .ctr-filters-field { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .ctr-filters-label { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .06em; white-space: nowrap; }
  .ctr-filters-chip { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #eff6ff; color: #1d4ed8; border: 1.5px solid #bfdbfe; cursor: pointer; transition: all .15s; }
  .ctr-filters-chip:hover { background: #dbeafe; }
  .ctr-filters-chip-remove { width: 14px; height: 14px; display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; background: #93c5fd; color: #1d4ed8; font-size: 10px; line-height: 1; cursor: pointer; margin-left: 2px; }
  .ctr-filters-active { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f3f4f6; align-items: center; }
  .ctr-result-count { font-size: 12.5px; color: #6b7280; margin-left: auto; white-space: nowrap; }
`;

if (typeof document !== 'undefined' && !document.getElementById('ctr-styles')) {
  const s = document.createElement('style');
  s.id = 'ctr-styles';
  s.textContent = GLOBAL_STYLE;
  document.head.appendChild(s);
}

// ─── SVG Icons ─────────────────────────────────────────────────────────────────
const Icon = {
  Plus:          () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  FileText:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  FilePdf:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><path d="M9 11h1.5a1.5 1.5 0 0 1 0 3H9v-3z"/></svg>,
  FileUpload:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Send:          () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Refresh:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>,
  Edit:          () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash:         () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Download:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Check:         () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  X:             () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  AlertTriangle: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Info:          () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  Loader:        () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin .8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  ChevronDown:   () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  ChevronUp:     () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>,
  Search:        () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Printer:       () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  Mail:          () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  ShieldCheck:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  BookOpen:      () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  Lock:          () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  ExternalLink:  () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
  Filter:        () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Close:         () => <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  MessageX:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  // WhatsApp icon added as a component
  WhatsApp:      () => <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
  </svg>,
};

if (typeof document !== 'undefined' && !document.getElementById('ctr-spin')) {
  const s = document.createElement('style');
  s.id = 'ctr-spin';
  s.textContent = '@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }';
  document.head.appendChild(s);
}

// ─── Toast system ──────────────────────────────────────────────────────────────
const TOAST_ICONS: Record<ToastType, { bg: string; color: string; icon: React.ReactNode }> = {
  success: { bg: '#f0fdf4', color: '#16a34a', icon: <Icon.Check /> },
  error:   { bg: '#fef2f2', color: '#dc2626', icon: <Icon.X /> },
  warning: { bg: '#fffbeb', color: '#d97706', icon: <Icon.AlertTriangle /> },
  info:    { bg: '#eff6ff', color: '#2563eb', icon: <Icon.Info /> },
};

const ToastContainer: React.FC<{ toasts: Toast[]; remove: (id: number) => void }> = ({ toasts, remove }) => (
  <div className="ctr-toasts">
    {toasts.map(t => {
      const cfg = TOAST_ICONS[t.type];
      return (
        <div key={t.id} className="ctr-toast">
          <div className="ctr-toast-icon" style={{ background: cfg.bg, color: cfg.color }}>{cfg.icon}</div>
          <div className="ctr-toast-content">
            <div className="ctr-toast-title">{t.title}</div>
            {t.message && <div className="ctr-toast-msg">{t.message}</div>}
          </div>
          <button onClick={() => remove(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0', lineHeight: 1 }}>
            <Icon.X />
          </button>
        </div>
      );
    })}
  </div>
);

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let nextId = useRef(0);
  const add = useCallback((type: ToastType, title: string, message?: string, duration = 4500) => {
    const id = ++nextId.current;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);
  const remove = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return { toasts, add, remove };
}

function useClickOutside(cb: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [cb]);
  return ref;
}

// ─── Modal générique ───────────────────────────────────────────────────────────
const Modal: React.FC<{
  title: string; subtitle?: string; onClose: () => void; wide?: boolean;
  footer?: React.ReactNode; children: React.ReactNode;
}> = ({ title, subtitle, onClose, wide, footer, children }) => (
  <div className="ctr-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="ctr-modal" style={{ width: wide ? 'min(90vw, 820px)' : 'min(90vw, 560px)' }}>
      <div className="ctr-modal-header">
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, color: '#0f172a' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{subtitle}</div>}
        </div>
        <button className="ctr-modal-close" onClick={onClose}><Icon.X /></button>
      </div>
      <div className="ctr-modal-body">{children}</div>
      {footer && <div className="ctr-modal-footer">{footer}</div>}
    </div>
  </div>
);

// ─── ConfirmModal ──────────────────────────────────────────────────────────────
const ConfirmModal: React.FC<{
  title: string; message: string; detail?: string;
  confirmLabel: string; confirmClass: string;
  loading: boolean; onConfirm: () => void; onCancel: () => void;
  iconBg?: string; iconColor?: string; icon?: React.ReactNode;
}> = ({ title, message, detail, confirmLabel, confirmClass, loading, onConfirm, onCancel, iconBg = '#fef2f2', iconColor = '#dc2626', icon }) => (
  <div className="ctr-modal-backdrop" onClick={e => e.target === e.currentTarget && onCancel()}>
    <div className="ctr-modal" style={{ width: 'min(90vw, 440px)' }}>
      <div className="ctr-modal-body">
        <div className="ctr-confirm-body">
          <div className="ctr-confirm-icon" style={{ background: iconBg, color: iconColor }}>
            {icon ?? <Icon.AlertTriangle />}
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: 14, color: '#374151', marginBottom: 6 }}>{message}</div>
          {detail && <div style={{ fontSize: 12.5, color: '#6b7280' }}>{detail}</div>}
        </div>
      </div>
      <div className="ctr-modal-footer">
        <button className="ctr-btn ctr-btn-ghost" onClick={onCancel} disabled={loading}>Annuler</button>
        <button className={`ctr-btn ${confirmClass}`} onClick={onConfirm} disabled={loading}>
          {loading ? <><Icon.Loader /> Traitement…</> : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ─── SuccessModal ──────────────────────────────────────────────────────────────
const SuccessModal: React.FC<{
  title: string; message: string; detail?: string;
  iconBg?: string; iconColor?: string; icon?: React.ReactNode;
  whatsapp?: { phone?: string; text: string };   // ← NOUVEAU
  onClose: () => void;
}> = ({ title, message, detail, iconBg = '#f0fdf4', iconColor = '#16a34a', icon, whatsapp, onClose }) => {

  const openWhatsapp = () => {
    const phone   = whatsapp?.phone ? whatsapp.phone.replace(/\D/g, '') : '';
    const encoded = encodeURIComponent(whatsapp?.text ?? '');
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      // Mobile : ouvre directement l'app WhatsApp
      const nativeUrl = phone
        ? `whatsapp://send?phone=${phone}&text=${encoded}`
        : `whatsapp://send?text=${encoded}`;
      window.location.href = nativeUrl;
    } else {
      // Desktop : tente whatsapp:// (app desktop), sinon bascule sur wa.me
      const nativeUrl = phone
        ? `whatsapp://send?phone=${phone}&text=${encoded}`
        : `whatsapp://send?text=${encoded}`;
      const webUrl = phone
        ? `https://wa.me/${phone}?text=${encoded}`
        : `https://wa.me/?text=${encoded}`;
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      iframe.src = nativeUrl;
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.open(webUrl, '_blank');
      }, 1500);
    }
  };

  return (
    <div className="ctr-modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="ctr-modal" style={{ width: 'min(90vw, 440px)' }}>
        <div className="ctr-modal-body">
          <div className="ctr-confirm-body">
            <div className="ctr-confirm-icon" style={{ background: iconBg, color: iconColor }}>
              {icon ?? <Icon.Check />}
            </div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#0f172a', marginBottom: 8 }}>{title}</div>
            <div style={{ fontSize: 14, color: '#374151', marginBottom: detail ? 6 : 0 }}>{message}</div>
            {detail && <div style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.5 }}>{detail}</div>}
          </div>
        </div>
        <div className="ctr-modal-footer" style={{ justifyContent: 'center', borderTop: '1px solid #f3f4f6', gap: 10, flexWrap: 'wrap' }}>
          {whatsapp && (
            <button
              className="ctr-btn"
              onClick={openWhatsapp}
              style={{ background: '#25d366', color: '#fff', gap: 8 }}
            >
              <Icon.WhatsApp />
              Transférer une copie via WhatsApp
            </button>
          )}
          <button className="ctr-btn ctr-btn-success" onClick={onClose} style={{ minWidth: 100, justifyContent: 'center' }}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── SearchableSelect ──────────────────────────────────────────────────────────
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

// ─── Form types ────────────────────────────────────────────────────────────────
interface FormState {
  division: string; professor_id: string; academic_year_id: string; cycle_id: string;
  regroupement: string; start_date: string; end_date: string; amount: string; notes: string;
  status: string; program_ids: number[];
  /** Montant par heure pour chaque programme sélectionné (clé = program id) */
  program_amounts: Record<number, string>;
}
const emptyForm: FormState = {
  division: '', professor_id: '', academic_year_id: '', cycle_id: '',
  regroupement: '', start_date: '', end_date: '', amount: '0', notes: '',
  status: 'pending', program_ids: [],
  program_amounts: {},
};

// ─── ContratFormFields ─────────────────────────────────────────────────────────
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


// ─── AdminCourseSupportModal (version corrigée avec gestion correcte des monographies) ──────────────────────────────────────────────

const AdminCourseSupportModal: React.FC<{
  contrat: Contrat;
  onClose: () => void;
  onSaved: () => void;
  divisionFilter?: string | null;
}> = ({ contrat, onClose, onSaved, divisionFilter = null }) => {

  const divisionMismatch = divisionFilter !== null && contrat.division !== divisionFilter;
  const programs = contrat.course_element_professors ?? [];

  type SupportEntry = { title: string; file?: string; url?: string };
  type MonoData = {
    number_monographie: string;
    amount_monographie: string;
    saving: boolean;
    saved: boolean;
    error: string | null;
    hasExisting: boolean;      // true si des valeurs existent déjà en BDD
    isEditing: boolean;        // true si l'utilisateur est en train de modifier
  };
  type ProgState = { supports: SupportEntry[]; loading: boolean; error: string | null; mono: MonoData };

  const defaultMono = (existingNumber?: number | null, existingAmount?: number | null): MonoData => {
    const hasNumber = existingNumber !== null && existingNumber !== undefined && existingNumber !== 0;
    const hasAmount = existingAmount !== null && existingAmount !== undefined && existingAmount !== 0;
    const hasValues = hasNumber || hasAmount;

    return {
      number_monographie: hasNumber ? String(existingNumber) : '',
      amount_monographie: hasAmount ? String(existingAmount) : '',
      saving: false,
      saved: false,
      error: null,
      hasExisting: hasValues,
      isEditing: !hasValues, // Si des valeurs existent, on est en lecture seule
    };
  };

  // État principal
  const [progStates, setProgStates] = useState<Record<number, ProgState>>({});
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [newTitle, setNewTitle] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fonction pour charger les supports ET les monographies depuis l'API
  const loadProgramData = useCallback(async (program: ProfessorProgram) => {
    // Initialiser l'état du programme avec les valeurs du contrat (si disponibles)
    const existingNumber = program.number_monographie ?? null;
    const existingAmount = program.amount_monographie ?? null;

    setProgStates(prev => ({
      ...prev,
      [program.id]: {
        supports: [],
        loading: true,
        error: null,
        mono: defaultMono(existingNumber, existingAmount),
      },
    }));

    try {
      const http = (await import('@/services/http.service')).default;

      // Appel API qui retourne : { success, data, number_monographie, amount_monographie }
      const res = await (http as any).get(
        `rh/contrats/${contrat.id}/programs/${program.id}/supports`
      );

      const body = res ?? {};
      const supports: SupportEntry[] = Array.isArray(body.data) ? body.data : [];

      // Récupérer les valeurs de monographie depuis la réponse API
      const nbRaw = body.number_monographie ?? existingNumber ?? null;
      const amtRaw = body.amount_monographie ?? existingAmount ?? null;

      const hasNumber = nbRaw !== null && nbRaw !== undefined && nbRaw !== 0;
      const hasAmount = amtRaw !== null && amtRaw !== undefined && amtRaw !== 0;
      const hasExisting = hasNumber || hasAmount;

      setProgStates(prev => ({
        ...prev,
        [program.id]: {
          supports,
          loading: false,
          error: null,
          mono: {
            number_monographie: hasNumber ? String(nbRaw) : '',
            amount_monographie: hasAmount ? String(amtRaw) : '',
            saving: false,
            saved: false,
            error: null,
            hasExisting: hasExisting,
            isEditing: !hasExisting, // Si valeurs existent, mode lecture seule
          },
        },
      }));
    } catch (err: any) {
      setProgStates(prev => ({
        ...prev,
        [program.id]: {
          supports: [],
          loading: false,
          error: err?.message ?? 'Erreur de chargement',
          mono: defaultMono(program.number_monographie ?? null, program.amount_monographie ?? null),
        },
      }));
    }
  }, [contrat.id]);

  // Charger tous les programmes à l'ouverture
  useEffect(() => {
    setProgStates({});
    setSelectedIdx(0);
    setNewTitle('');
    setNewFile(null);
    setAddError(null);
    setAddSuccess(false);

    programs.forEach(program => loadProgramData(program));
  }, [contrat.id, programs, loadProgramData]);

  // Recharger un programme spécifique
  const reloadProgram = useCallback((program: ProfessorProgram) => {
    loadProgramData(program);
  }, [loadProgramData]);

  const currentProg = programs[selectedIdx];
  const currentState = currentProg ? progStates[currentProg.id] : undefined;
  const currentSupports = currentState?.supports ?? [];
  const isLoading = currentState?.loading ?? false;
  const mono = currentState?.mono ?? defaultMono(null, null);

  const setMono = (key: 'number_monographie' | 'amount_monographie', value: string) => {
    if (!currentProg) return;
    setProgStates(prev => ({
      ...prev,
      [currentProg.id]: {
        ...prev[currentProg.id],
        mono: {
          ...(prev[currentProg.id]?.mono ?? defaultMono(null, null)),
          [key]: value,
          saved: false,
          error: null,
        },
      },
    }));
  };

  // Activer le mode édition (rendre les champs modifiables)
  const enableEditing = () => {
    if (!currentProg) return;
    setProgStates(prev => ({
      ...prev,
      [currentProg.id]: {
        ...prev[currentProg.id],
        mono: {
          ...(prev[currentProg.id]?.mono ?? defaultMono(null, null)),
          isEditing: true,
          error: null,
        },
      },
    }));
  };

  // Annuler l'édition et revenir aux valeurs originales
  const cancelEditing = () => {
    if (!currentProg) return;
    const existingNumber = currentProg.number_monographie ?? null;
    const existingAmount = currentProg.amount_monographie ?? null;
    const hasNumber = existingNumber !== null && existingNumber !== undefined && existingNumber !== 0;
    const hasAmount = existingAmount !== null && existingAmount !== undefined && existingAmount !== 0;

    setProgStates(prev => ({
      ...prev,
      [currentProg.id]: {
        ...prev[currentProg.id],
        mono: {
          ...(prev[currentProg.id]?.mono ?? defaultMono(null, null)),
          number_monographie: hasNumber ? String(existingNumber) : '',
          amount_monographie: hasAmount ? String(existingAmount) : '',
          isEditing: false,
          saved: false,
          error: null,
        },
      },
    }));
  };

  // Sauvegarder la monographie
  const handleSaveMono = async () => {
    if (!currentProg) return;

    const nb = parseInt(mono.number_monographie, 10);
    const amt = parseFloat(mono.amount_monographie);

    if (isNaN(nb) || nb < 0) {
      setMono('number_monographie', mono.number_monographie);
      setProgStates(prev => ({
        ...prev,
        [currentProg.id]: {
          ...prev[currentProg.id],
          mono: { ...prev[currentProg.id]!.mono, error: 'Nombre de monographies invalide.' },
        },
      }));
      return;
    }
    if (isNaN(amt) || amt < 0) {
      setProgStates(prev => ({
        ...prev,
        [currentProg.id]: {
          ...prev[currentProg.id],
          mono: { ...prev[currentProg.id]!.mono, error: 'Montant invalide.' },
        },
      }));
      return;
    }

    setProgStates(prev => ({
      ...prev,
      [currentProg.id]: {
        ...prev[currentProg.id],
        mono: { ...prev[currentProg.id]!.mono, saving: true, error: null, saved: false },
      },
    }));

    try {
      const http = (await import('@/services/http.service')).default;
      await (http as any).put(
        `rh/contrats/${contrat.id}/programs/${currentProg.id}/monographie`,
        { number_monographie: nb, amount_monographie: amt }
      );

      // Mettre à jour le programme courant avec les nouvelles valeurs
      const updatedProgram = { ...currentProg, number_monographie: nb, amount_monographie: amt };

      setProgStates(prev => ({
        ...prev,
        [currentProg.id]: {
          ...prev[currentProg.id],
          mono: {
            ...prev[currentProg.id]!.mono,
            saving: false,
            saved: true,
            hasExisting: true,
            isEditing: false, // Retour en mode lecture seule après sauvegarde
            error: null,
          },
        },
      }));

      // Mettre à jour le contrat parent
      onSaved();

      setTimeout(() => {
        setProgStates(prev => ({
          ...prev,
          [currentProg.id]: {
            ...prev[currentProg.id],
            mono: { ...prev[currentProg.id]!.mono, saved: false },
          },
        }));
      }, 3000);
    } catch (err: any) {
      setProgStates(prev => ({
        ...prev,
        [currentProg.id]: {
          ...prev[currentProg.id],
          mono: {
            ...prev[currentProg.id]!.mono,
            saving: false,
            error: err?.response?.data?.message ?? err.message ?? 'Erreur lors de la sauvegarde.',
          },
        },
      }));
    }
  };

  // Ajouter un support
  const handleAdd = async () => {
    if (!currentProg) return;
    if (!newTitle.trim()) { setAddError('Veuillez saisir un titre.'); return; }
    if (!newFile) { setAddError('Veuillez sélectionner un fichier PDF.'); return; }

    setAddError(null);
    setAdding(true);
    setAddSuccess(false);

    try {
      const fd = new FormData();
      fd.append('title', newTitle.trim());
      fd.append('pdf_file', newFile);

      const http = (await import('@/services/http.service')).default;
      await http.post(`rh/contrats/${contrat.id}/programs/${currentProg.id}/supports`, fd);

      setNewTitle('');
      setNewFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 3500);

      await reloadProgram(currentProg);
    } catch (err: any) {
      setAddError(err?.message ?? "Erreur lors de l'ajout.");
    } finally {
      setAdding(false);
    }
  };

  // Supprimer un support
  const handleDelete = async (idx: number) => {
    if (!currentProg) return;
    setDeleting(idx);
    try {
      const http = (await import('@/services/http.service')).default;
      await http.delete(`rh/contrats/${contrat.id}/programs/${currentProg.id}/supports/${idx}`);
      await reloadProgram(currentProg);
    } catch (err: any) {
      alert('Erreur de suppression : ' + (err?.message ?? ''));
    } finally {
      setDeleting(null);
    }
  };

  const progLabel = (p: ProfessorProgram) =>
    `${p.course_element?.name ?? p.label ?? '—'} — ${p.class_group?.name ?? '—'}`;

  // Icônes
  const IcoPdf = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="15" x2="15" y2="15"/><path d="M9 11h1.5a1.5 1.5 0 0 1 0 3H9v-3z"/></svg>;
  const IcoLink = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;
  const IcoUp = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;
  const IcoSave = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>;
  const IcoCoin = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="6" x2="12" y2="8"/><line x1="12" y1="16" x2="12" y2="18"/><line x1="9" y1="12" x2="15" y2="12"/></svg>;
  const IcoHash = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>;
  const IcoEdit = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
  const IcoLock = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;

  const SectionHead = ({ icon, label, count }: { icon: React.ReactNode; label: string; count?: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 28, height: 28, borderRadius: 7, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{label}</span>
      {count !== undefined && (
        <span style={{ marginLeft: 2, background: '#e2e8f0', color: '#64748b', borderRadius: 999, padding: '1px 9px', fontSize: 11.5, fontWeight: 700 }}>
          {count}
        </span>
      )}
    </div>
  );

  const Divider = () => <div style={{ height: 1, background: '#f1f5f9', margin: '20px 0' }} />;

  // Blocage si division ne correspond pas
  if (divisionMismatch) {
    const divLabel = divisionFilter === 'RD-FC' ? 'Formation Continue (RD-FC)' : 'Formation à Distance (RD-FAD)';
    return (
      <Modal
        title="Supports de cours"
        subtitle={`Contrat N° ${contrat.contrat_number} — ${contrat.professor?.full_name ?? ''}`}
        onClose={onClose}
        wide
        footer={<button className="ctr-btn ctr-btn-ghost" onClick={onClose}>Fermer</button>}
      >
        <div style={{ padding: '48px 24px', textAlign: 'center' }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#dc2626' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          </div>
          <p style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', margin: '0 0 8px' }}>Accès restreint</p>
          <p style={{ fontSize: 14, color: '#374151', margin: '0 0 6px' }}>
            Vous n'avez accès qu'aux supports de la division <strong>{divLabel}</strong>.
          </p>
          <p style={{ fontSize: 12.5, color: '#9ca3af', margin: 0 }}>
            Ce contrat appartient à la division <strong>{contrat.division ?? 'non définie'}</strong>.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Supports de cours"
      subtitle={`Contrat N° ${contrat.contrat_number} — ${contrat.professor?.full_name ?? ''}`}
      onClose={onClose}
      wide
      footer={<button className="ctr-btn ctr-btn-ghost" onClick={onClose}>Fermer</button>}
    >
      {programs.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#94a3b8' }}>
            <Icon.FileText />
          </div>
          Aucun programme associé à ce contrat.
        </div>
      ) : (
        <>
          {/* Sélecteur de programme */}
          <div style={{ marginBottom: 20 }}>
            <label className="ctr-label">Programme sélectionné</label>
            <select
              className="ctr-input ctr-select"
              value={selectedIdx}
              onChange={e => {
                setSelectedIdx(Number(e.target.value));
                setNewTitle('');
                setNewFile(null);
                setAddError(null);
                setAddSuccess(false);
              }}
            >
              {programs.map((p, idx) => (
                <option key={p.id} value={idx}>{progLabel(p)}</option>
              ))}
            </select>
            {currentProg && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {currentProg.course_element?.teaching_unit?.name && (
                  <span style={{ fontSize: 11.5, fontWeight: 600, background: '#eff6ff', color: '#1d4ed8', padding: '2px 9px', borderRadius: 999, border: '1px solid #bfdbfe' }}>
                    UE : {currentProg.course_element.teaching_unit.name}
                  </span>
                )}
                {currentProg.class_group?.name && (
                  <span style={{ fontSize: 11.5, fontWeight: 600, background: '#f0fdf4', color: '#166534', padding: '2px 9px', borderRadius: 999, border: '1px solid #bbf7d0' }}>
                    {currentProg.class_group.name}
                  </span>
                )}
                <span style={{ fontSize: 11.5, fontWeight: 600, background: '#f5f3ff', color: '#5b21b6', padding: '2px 9px', borderRadius: 999, border: '1px solid #ddd6fe' }}>
                  {currentSupports.length} support{currentSupports.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          <Divider />

          {/* Layout 2 colonnes : supports + upload */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 4 }}>

            {/* Colonne gauche : supports existants */}
            <div>
              <SectionHead icon={<IcoPdf />} label="Supports existants" count={isLoading ? undefined : currentSupports.length} />

              {isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9ca3af', fontSize: 13, padding: '12px 0' }}>
                  <Icon.Loader /> Chargement…
                </div>
              ) : currentState?.error ? (
                <div style={{ padding: '10px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12.5 }}>
                  {currentState.error}
                </div>
              ) : currentSupports.length === 0 ? (
                <div style={{ border: '1.5px dashed #e2e8f0', borderRadius: 10, padding: '28px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', color: '#cbd5e1' }}>
                    <IcoPdf />
                  </div>
                  Aucun support uploadé
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {currentSupports.map((s, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: '1.5px solid #f1f5f9', background: '#fff' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 7, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48', flexShrink: 0 }}>
                        <IcoPdf />
                      </div>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.title}
                      </span>
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        {s.url && (
                          <a href={s.url} target="_blank" rel="noopener noreferrer"
                            className="ctr-btn-icon"
                            style={{ width: 28, height: 28, borderColor: '#bfdbfe', color: '#2563eb', background: '#eff6ff', textDecoration: 'none' }}
                            title="Ouvrir">
                            <IcoLink />
                          </a>
                        )}
                        <button className="ctr-btn-icon"
                          style={{ width: 28, height: 28, borderColor: '#fecaca', color: '#dc2626' }}
                          disabled={deleting === idx}
                          onClick={() => handleDelete(idx)}
                          title="Supprimer">
                          {deleting === idx ? <Icon.Loader /> : <Icon.Trash />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Colonne droite : ajouter un support */}
            <div>
              <SectionHead icon={<IcoUp />} label="Ajouter un support" />

              {addSuccess && (
                <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: 12.5, fontWeight: 600 }}>
                  <Icon.Check /> Support ajouté avec succès
                </div>
              )}
              {addError && (
                <div style={{ marginBottom: 12, padding: '9px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12.5 }}>
                  {addError}
                </div>
              )}

              <div style={{ marginBottom: 10 }}>
                <label className="ctr-label">Titre du support <span style={{ color: '#dc2626' }}>*</span></label>
                <input className="ctr-input" placeholder="Ex : Cours Chapitre 1 — Introduction"
                  value={newTitle} onChange={e => setNewTitle(e.target.value)} disabled={adding} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="ctr-label">Fichier PDF <span style={{ color: '#dc2626' }}>*</span></label>
                <div
                  style={{ border: `1.5px dashed ${newFile ? '#059669' : '#d1d5db'}`, borderRadius: 9, padding: '16px', textAlign: 'center', cursor: 'pointer', background: newFile ? '#f0fdf4' : '#fafafa', transition: 'all .18s' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {newFile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                        <IcoPdf />
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: '#065f46' }}>{newFile.name}</span>
                      <span style={{ fontSize: 11.5, color: '#6b7280' }}>{(newFile.size / 1024).toFixed(1)} Ko — Cliquer pour changer</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <IcoUp />
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: '#475569' }}>Cliquer pour sélectionner</span>
                      <span style={{ fontSize: 11.5, color: '#9ca3af' }}>PDF uniquement</span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: 'none' }}
                  onChange={e => setNewFile(e.target.files?.[0] ?? null)} disabled={adding} />
              </div>

              <button className="ctr-btn ctr-btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleAdd} disabled={adding || !newTitle.trim() || !newFile}>
                {adding ? <><Icon.Loader /> Envoi en cours…</> : <><Icon.Plus /> Ajouter le support</>}
              </button>
            </div>
          </div>

          <Divider />

          {/* Section Monographie */}
          <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '18px 20px' }}>

            {/* En-tête avec badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <SectionHead icon={<IcoCoin />} label="Monographie — Programme courant" />
              {mono.hasExisting && !mono.isEditing && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: '#fef9c3', color: '#713f12', border: '1px solid #fde68a' }}>
                  <IcoLock /> Déjà définie
                </span>
              )}
            </div>

            <p style={{ fontSize: 12.5, color: '#64748b', marginTop: -6, marginBottom: 16 }}>
              Nombre de monographies et montant pour le programme sélectionné. Stockés par programme dans le contrat.
            </p>

            {/* Bandeau d'info si des valeurs existent et qu'on est en lecture seule */}
            {mono.hasExisting && !mono.isEditing && (
              <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 9, background: '#fffbeb', border: '1.5px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#78350f', fontWeight: 500 }}>
                  <IcoLock />
                  Monographie déjà définie — souhaitez-vous modifier ces valeurs ?
                </div>
                <button
                  className="ctr-btn"
                  style={{ height: 32, padding: '0 14px', fontSize: 12.5, background: '#d97706', color: '#fff', flexShrink: 0 }}
                  onClick={enableEditing}
                >
                  <IcoEdit /> Modifier
                </button>
              </div>
            )}

            {/* Affichage des valeurs si elles existent et qu'on est en lecture seule */}
            {mono.hasExisting && !mono.isEditing && (
              <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 9, background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#166534' }}>Nombre de monographies actuel :</span>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#065f46', margin: '4px 0 0' }}>{mono.number_monographie || '—'}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: '#166534' }}>Montant monographie actuel :</span>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#065f46', margin: '4px 0 0' }}>{mono.amount_monographie ? formatAmount(parseFloat(mono.amount_monographie)) : '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Champs de saisie - visibles uniquement si pas de valeurs existantes OU en mode édition */}
            {(!mono.hasExisting || mono.isEditing) && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label className="ctr-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <IcoHash /> Nombre de monographies
                    </label>
                    <input
                      className="ctr-input"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Ex : 3"
                      value={mono.number_monographie}
                      onChange={e => setMono('number_monographie', e.target.value)}
                      disabled={mono.saving}
                      style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600 }}
                    />
                  </div>
                  <div>
                    <label className="ctr-label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <IcoCoin /> Montant monographie (FCFA)
                    </label>
                    <input
                      className="ctr-input"
                      type="number"
                      min="0"
                      step="any"
                      placeholder="Ex : 15000"
                      value={mono.amount_monographie}
                      onChange={e => setMono('amount_monographie', e.target.value)}
                      disabled={mono.saving}
                      style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600 }}
                    />
                  </div>
                </div>

                {mono.saved && (
                  <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: 12.5, fontWeight: 600 }}>
                    <Icon.Check /> Monographie enregistrée avec succès
                  </div>
                )}
                {mono.error && (
                  <div style={{ marginBottom: 12, padding: '9px 12px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', fontSize: 12.5 }}>
                    {mono.error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  {mono.hasExisting && mono.isEditing && (
                    <button className="ctr-btn ctr-btn-ghost" onClick={cancelEditing} disabled={mono.saving}>
                      Annuler
                    </button>
                  )}
                  <button
                    className="ctr-btn ctr-btn-primary"
                    onClick={handleSaveMono}
                    disabled={mono.saving || mono.number_monographie === '' || mono.amount_monographie === ''}
                  >
                    {mono.saving
                      ? <><Icon.Loader /> Enregistrement…</>
                      : <><IcoSave /> Enregistrer la monographie</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </Modal>
  );
};

// ─── Modal Upload PDF ──────────────────────────────────────────────────────────
const UploadPdfModal: React.FC<{
  contrat: Contrat;
  onClose: () => void;
  onSuccess: (updated: Contrat) => void;
}> = ({ contrat, onClose, onSuccess }) => {
  const [file, setFile]         = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const inputRef                = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    setError('');
    if (!f) { setFile(null); return; }
    if (f.type !== 'application/pdf') { setError('Veuillez sélectionner un fichier PDF.'); return; }
    if (f.size > 10 * 1024 * 1024) { setError('Le fichier est trop volumineux (max 10 Mo).'); return; }
    setFile(f);
  };

  const handleSubmit = async () => {
    if (!file) { setError('Veuillez sélectionner un fichier PDF.'); return; }
    setLoading(true); setError('');
    try {
      const updated = await rhService.uploadContratPdf(contrat.id, file);
      onSuccess(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err.message ?? "Erreur lors de l'upload.");
    } finally { setLoading(false); }
  };

  return (
    <Modal
      title="Uploader le PDF final"
      subtitle={`Contrat N° ${contrat.contrat_number} — remplace le PDF actuel`}
      onClose={onClose}
      footer={
        <>
          <button className="ctr-btn ctr-btn-ghost" onClick={onClose} disabled={loading}>Annuler</button>
          <button className="ctr-btn ctr-btn-orange" onClick={handleSubmit} disabled={loading || !file}>
            {loading ? <><Icon.Loader /> Upload en cours…</> : <><Icon.FileUpload /> Enregistrer le PDF</>}
          </button>
        </>
      }
    >
      <div
        className={`ctr-upload-zone${dragging ? ' drag' : ''}${file ? ' has-file' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0] ?? null); }}
      >
        {file ? (
          <div>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', margin: '0 auto 8px' }}>
              <Icon.FilePdf />
            </div>
            <div style={{ fontWeight: 700, color: '#065f46', fontSize: 14 }}>{file.name}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{(file.size / 1024).toFixed(1)} Ko — Cliquez pour changer</div>
          </div>
        ) : (
          <div>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', margin: '0 auto 8px' }}>
              <Icon.FileUpload />
            </div>
            <div style={{ fontWeight: 600, color: '#ea580c', fontSize: 14 }}>Cliquez ou glissez le PDF ici</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Format PDF uniquement — max 10 Mo</div>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }}
        onChange={e => handleFile(e.target.files?.[0] ?? null)} />
      {contrat.pdf_url && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#f0f9ff', border: '1px solid #bae6fd', fontSize: 12.5, color: '#0369a1' }}>
          <strong>PDF actuel :</strong>{' '}
          <a href={contrat.pdf_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0369a1' }}>
            Voir le PDF stocké <Icon.ExternalLink />
          </a>
          {contrat.pdf_uploaded_at && (
            <span style={{ marginLeft: 8, color: '#6b7280' }}>(uploadé le {formatDate(contrat.pdf_uploaded_at)})</span>
          )}
        </div>
      )}
      {error && (
        <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#991b1b', fontSize: 13 }}>
          {error}
        </div>
      )}
    </Modal>
  );
};

// ─── FilterBar ─────────────────────────────────────────────────────────────────
interface FilterState {
  search:        string;
  division:      string;
  cycle_id:      string;
  regroupement:  string;
  professor_id:  string;
  academic_year: string;
  status:        string;
}
const emptyFilters: FilterState = {
  search: '', division: '', cycle_id: '', regroupement: '',
  professor_id: '', academic_year: '', status: '',
};

const FILTER_DIVISION_OPTS = [
  { value: '', label: 'Toutes les divisions' },
  { value: 'RD-FAD', label: 'RD-FAD' },
  { value: 'RD-FC',  label: 'RD-FC' },
];
const FILTER_REG_OPTS = [
  { value: '', label: 'Tous' },
  { value: '1', label: 'Regroupement I' },
  { value: '2', label: 'Regroupement II' },
];
const FILTER_STATUS_OPTS = [
  { value: '', label: 'Tous les statuts' },
  ...STATUS_OPTIONS,
];

function applyFilters(contrats: Contrat[], f: FilterState): Contrat[] {
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

// ─── Main Component ────────────────────────────────────────────────────────────
const Contrats: React.FC = () => {
  // ─── Rôle de l'utilisateur connecté (récupéré via /auth/me) ────────────────
  const [currentRoleId, setCurrentRoleId] = useState<number | null>(null);

  useEffect(() => {
    // On récupère le rôle via la route auth/me — HttpService ajoute le token automatiquement
    import('@/services/http.service').then(({ default: http }) => {
      (http as any).get('auth/me')
        .then((res: any) => {
          // La réponse peut être { data: { role_id } } ou { role_id } directement
          const roleId = res?.data?.role_id ?? res?.role_id ?? null;
          setCurrentRoleId(roleId !== null ? Number(roleId) : null);
        })
        .catch(() => { /* silencieux — on laisse null, pas de restriction */ });
    });
  }, []);

  // Dérivations des droits
  const isChefCAP    = currentRoleId === ROLE_CHEF_CAP;   // 3 : complet sauf supports
  const isRdFC       = currentRoleId === ROLE_RD_FC;      // 13 : supports RD-FC seulement
  const isRdFAD      = currentRoleId === ROLE_RD_FAD;     // 12 : supports RD-FAD seulement
  const isRestricted = isRdFC || isRdFAD;                 // boutons hors-supports bloqués

  const supportDivisionFilter: string | null =
    isRdFC ? 'RD-FC' : isRdFAD ? 'RD-FAD' : null;

  const [contrats, setContrats]           = useState<Contrat[]>([]);
  const [professors, setProfessors]       = useState<Professor[]>([]);
  const [cycles, setCycles]               = useState<{ id: number; name: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  const [filters, setFilters] = useState<FilterState>({ ...emptyFilters });

  // Modal states
  const [showCreate, setShowCreate]             = useState(false);
  const [editingContrat, setEditingContrat]     = useState<Contrat | null>(null);
  const [uploadPdfContrat, setUploadPdfContrat] = useState<Contrat | null>(null);
  const [supportContrat, setSupportContrat]     = useState<Contrat | null>(null);
  const [modalOpenKey, setModalOpenKey]         = useState(0);

  // Confirm modals
  const [deleteConfirm, setDeleteConfirm]       = useState<Contrat | null>(null);
  const [transferConfirm, setTransferConfirm]   = useState<Contrat | null>(null);
  const [authorizeConfirm, setAuthorizeConfirm] = useState<Contrat | null>(null);
  const [relaunchConfirm, setRelaunchConfirm]   = useState<Contrat | null>(null);

  // Success modal
  type SuccessInfo = { title: string; message: string; detail?: string; iconBg?: string; iconColor?: string; whatsapp?: { phone?: string; text: string }; icon?: React.ReactNode };
  const [successModal, setSuccessModal] = useState<SuccessInfo | null>(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);
  const showSuccess = useCallback((info: SuccessInfo) => setSuccessModal(info), []);

  const [deleteLoading, setDeleteLoading]       = useState(false);
  const [transferLoading, setTransferLoading]   = useState(false);
  const [authorizeLoading, setAuthorizeLoading] = useState(false);
  const [relaunchLoading, setRelaunchLoading]   = useState(false);

  // Forms
  const [createForm, setCreateForm]         = useState<FormState>({ ...emptyForm });
  const [editForm, setEditForm]             = useState<FormState>({ ...emptyForm });
  const [createLoading, setCreateLoading]   = useState(false);
  const [editLoading, setEditLoading]       = useState(false);
  const [createError, setCreateError]       = useState('');
  const [editError, setEditError]           = useState('');

  const { toasts, add: addToast, remove: removeToast } = useToasts();

  const reload = useCallback((onDone?: (freshContrats: Contrat[]) => void) => {
    setLoading(true);
    rhService.getContrats()
      .then(r => {
        const list = r.data || [];
        setContrats(list);
        setLoading(false);
        onDone?.(list);
      })
      .catch(() => { setError('Impossible de charger les contrats'); setLoading(false); });
  }, []);

  useEffect(() => {
    reload();
    rhService.getProfessors().then(r => setProfessors((r.data || []) as Professor[])).catch(() => {});
    rhService.getCycles().then(setCycles).catch(() => {});
    rhService.getAcademicYears().then(setAcademicYears).catch(() => {});
  }, [reload]);

  // Récupérer l'année académique sélectionnée pour le formulaire
  const getSelectedAcademicYear = (academicYearId: string) => {
    return academicYears.find(y => String(y.id) === academicYearId);
  };

  // Validation des dates pour la création/modification
  const validateContractDates = (formData: FormState): string | null => {
    if (!formData.academic_year_id) return null;
    const selectedYear = academicYears.find(y => String(y.id) === formData.academic_year_id);
    // Utilisation de year_start et year_end
    if (!selectedYear || !selectedYear.year_start || !selectedYear.year_end) {
      return "L'année académique sélectionnée n'a pas de dates valides";
    }

    return validateDatesInAcademicYear(
      formData.start_date,
      formData.end_date || null,
      selectedYear.year_start,
      selectedYear.year_end
    );
  };

  // ─── Ouvrir PDF stocké ───────────────────────────────────────────────────────
  const openPdf = useCallback((c: Contrat) => {
    if (c.pdf_url) {
      window.open(c.pdf_url, '_blank');
    } else {
      addToast('info', 'Aucun PDF stocké',
        'Le PDF sera disponible après validation du contrat par le professeur. Vous pouvez aussi l\'uploader via le bouton "Autoriser".');
    }
  }, [addToast]);

  const openEdit = (c: Contrat) => {
    if (c.is_locked) {
      addToast('warning', 'Contrat verrouillé', 'Ce contrat a été validé ou autorisé. Aucune modification n\'est possible.');
      return;
    }
    // Pré-remplir les montants/heure existants depuis les programmes du contrat
    const existingAmounts: Record<number, string> = {};
    (c.course_element_professors ?? []).forEach(p => {
      const amt = (p as any).amount_program;
      if (amt !== undefined && amt !== null) {
        existingAmounts[p.id] = String(amt);
      }
    });
    setEditForm({
      division:         c.division ?? '',
      professor_id:     String(c.professor_id),
      academic_year_id: String(c.academic_year_id),
      cycle_id:         c.cycle_id ? String(c.cycle_id) : '',
      regroupement:     c.regroupement ?? '',
      start_date:       c.start_date?.substring(0, 10) ?? '',
      end_date:         c.end_date?.substring(0, 10) ?? '',
      amount:           '0',
      notes:            c.notes ?? '',
      status:           c.status,
      program_ids:      (c.course_element_professors ?? []).map(p => p.id),
      program_amounts:  existingAmounts,
    });
    setEditingContrat(c);
    setEditError('');
  };

  const closeEdit   = () => { setEditingContrat(null); setEditError(''); };
  const closeCreate = () => { setShowCreate(false); setCreateError(''); setCreateForm({ ...emptyForm }); };

  const onFieldChange = (setter: React.Dispatch<React.SetStateAction<FormState>>) =>
    (name: string, value: string | number[] | Record<number, string>) => setter(f => ({ ...f, [name]: value }));

  const buildCreate = (f: FormState): CreateContratPayload => {
    console.log('program_amounts envoyé:', f.program_amounts);
    // Calcul automatique du montant total = somme des (montant/heure × heures) par programme
    // Si aucun montant renseigné, on envoie 0
    const filteredAmounts = Object.fromEntries(
      Object.entries(f.program_amounts)
        .filter(([, v]) => v !== '' && !isNaN(parseFloat(v)))
        .map(([k, v]) => [k, parseFloat(v)])
    );
    const totalAmount = Object.values(filteredAmounts).reduce((sum, v) => sum + v, 0);

    return {
      division:                     f.division || null,
      professor_id:                 Number(f.professor_id),
      academic_year_id:             Number(f.academic_year_id),
      cycle_id:                     f.cycle_id ? Number(f.cycle_id) : null,
      regroupement:                 f.regroupement || null,
      start_date:                   f.start_date,
      end_date:                     f.end_date || null,
      amount:                       totalAmount,
      notes:                        f.notes || null,
      course_element_professor_ids: f.program_ids.length ? f.program_ids : undefined,
      program_amounts:              Object.keys(filteredAmounts).length ? filteredAmounts : undefined,
    };
  };
  const buildUpdate = (f: FormState): UpdateContratPayload => ({
    ...buildCreate(f), status: f.status as ContratStatus,
    course_element_professor_ids: f.program_ids,
  });

  const validate = (f: FormState): string | null => {
    if (!f.division)         return 'Veuillez sélectionner une division.';
    if (!f.professor_id)     return 'Veuillez sélectionner un professeur.';
    if (!f.academic_year_id) return 'Veuillez sélectionner une année académique.';
    if (!f.regroupement)     return 'Veuillez sélectionner un regroupement.';
    if (!f.cycle_id)         return 'Veuillez sélectionner un cycle.';
    if (!f.program_ids || f.program_ids.length === 0) return 'Veuillez sélectionner au moins un programme (ECUE).';

    if (!f.start_date)       return 'La date de début est obligatoire.';

    // Validation des dates par rapport à l'année académique
    const dateValidationError = validateContractDates(f);
    if (dateValidationError) return dateValidationError;

    return null;
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(createForm);
    if (err) { setCreateError(err); return; }
    setCreateLoading(true); setCreateError('');
    try {
      await rhService.createContrat(buildCreate(createForm));
      reload();
      closeCreate();
      showSuccess({
        title: 'Contrat créé avec succès',
        message: 'Le nouveau contrat de prestation a bien été enregistré.',
        detail: 'Vous pouvez maintenant le transférer au professeur pour signature.',
        iconBg: '#f0fdf4', iconColor: '#16a34a', icon: <Icon.Check />,
      });
    } catch (err: any) {
      setCreateError(err?.response?.data ? extractError(err.response.data, err?.response?.status || 500) : err.message || 'Erreur');
    } finally { setCreateLoading(false); }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContrat) return;
    const err = validate(editForm);
    if (err) { setEditError(err); return; }
    setEditLoading(true); setEditError('');
    try {
      await rhService.updateContrat(editingContrat.id, buildUpdate(editForm));
      reload();
      closeEdit();
      showSuccess({
        title: 'Contrat modifié',
        message: 'Les modifications ont été enregistrées avec succès.',
        iconBg: '#eff6ff', iconColor: '#2563eb', icon: <Icon.Check />,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? (err?.response?.data ? extractError(err.response.data, err?.response?.status || 500) : err.message || 'Erreur');
      setEditError(msg);
    } finally { setEditLoading(false); }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await rhService.deleteContrat(deleteConfirm.id);
      const num = deleteConfirm.contrat_number;
      setDeleteConfirm(null);
      reload();
      showSuccess({
        title: 'Contrat supprimé',
        message: `Le contrat ${num} a été supprimé définitivement.`,
        iconBg: '#fef2f2', iconColor: '#dc2626', icon: <Icon.Trash />,
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err.message ?? 'Une erreur est survenue';
      addToast('error', 'Erreur de suppression', msg);
      setDeleteConfirm(null);
    } finally { setDeleteLoading(false); }
  };

 const handleTransferConfirm = async () => {
  const c = transferConfirm;
  if (!c) return;
  setTransferLoading(true);
  try {
    await rhService.updateContrat(c.id, {
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
    await rhService.sendTransferEmail(c.id);
    const profName = c.professor?.full_name ?? "l'enseignant";

    // Construction du message WhatsApp — texte fluide, lien cliquable
    const contratUrl = `${window.location.origin}/services/professor/login`;
    const programsList = (c.course_element_professors ?? [])
      .map(p => `- ${p.course_element?.code ?? p.label} : ${p.course_element?.name ?? ''}`)
      .join('\n');

    const divisionLabel     = c.division === 'RD-FC' ? 'Formation Continue (RD-FC)' : 'Formation à Distance (RD-FAD)';
    const regroupementLabel = c.regroupement === '1' ? 'Regroupement I' : 'Regroupement II';
    const periodeLabel      = `${formatDate(c.start_date)} au ${c.end_date ? formatDate(c.end_date) : 'Non spécifiée'}`;
    const professorEmail    = c.professor?.email ?? 'votre adresse e-mail';

    const academicYearLabel = c.academic_year?.academic_year ?? 'l\'année académique en cours';

    const whatsappMessage = `Bonjour ${profName},

Le Centre Autonome de Perfectionnement (CAP) de l'École Polytechnique d'Abomey-Calavi vous a adressé un contrat d'enseignement pour l'année académique ${academicYearLabel}. Veuillez en prendre connaissance et procéder à sa validation dans les meilleurs délais.

Votre contrat de prestation N° ${c.contrat_number} est disponible et en attente de votre signature.

Détails du contrat :
Division : ${divisionLabel}
Regroupement : ${regroupementLabel}
Cycle : ${c.cycle?.name || 'Non spécifié'}
Période : du ${periodeLabel}
Montant : ${formatAmount(Number(c.amount))}

Programmes concernés :
${programsList || 'Aucun programme renseigné'}

Procédure de signature :
1. Connectez-vous à votre espace sur le lien ci-dessous
2. Consultez votre e-mail (${professorEmail}) pour le lien de signature sécurisé
3. Vérifiez toutes les informations du contrat
4. Signez électroniquement

Accéder à votre espace :
${contratUrl}

Attention : Ce lien est valable pendant 72 heures à compter de la réception de ce message. Passé ce délai, veuillez contacter le service RH du CAP.

Ce lien est strictement personnel et confidentiel.

Cordialement,
Service des Ressources Humaines — CAP-EPAC`;
    setTransferConfirm(null);
    reload();
    showSuccess({
      title: 'Contrat transféré',
      message: `Le contrat N° ${c.contrat_number} a été transféré à ${profName}.`,
      detail: `Un e-mail de notification a été envoyé à ${profName} avec un lien pour consulter et valider le contrat.`,
      iconBg: '#faf5ff', iconColor: '#7c3aed', icon: <Icon.Mail />,
      whatsapp: {
        phone: c.professor?.phone ?? undefined,
        text: whatsappMessage,
      },
    });
  } catch (err: any) {
    addToast('error', 'Erreur de transfert', err?.response?.data?.message ?? err.message ?? 'Une erreur est survenue');
  } finally {
    setTransferLoading(false);
  }
};
  const handleAuthorizeConfirm = async () => {
    const c = authorizeConfirm;
    if (!c) return;
    setAuthorizeLoading(true);
    try {
      await rhService.authorizeContrat(c.id);
      setAuthorizeConfirm(null);
      reload();
      showSuccess({
        title: 'Contrat autorisé',
        message: `Le contrat N° ${c.contrat_number} est maintenant autorisé et verrouillé.`,
        detail: 'Le contrat est passé au statut « En cours ». Cette action est irréversible.',
        iconBg: '#f0fdf4', iconColor: '#059669', icon: <Icon.ShieldCheck />,
      });
    } catch (err: any) {
      addToast('error', 'Erreur d\'autorisation', err?.response?.data?.message ?? err.message ?? 'Une erreur est survenue');
      setAuthorizeConfirm(null);
    } finally {
      setAuthorizeLoading(false);
    }
  };

  const handleRelaunchConfirm = async () => {
    const c = relaunchConfirm;
    if (!c) return;
    setRelaunchLoading(true);
    try {
      await rhService.updateContrat(c.id, {
        division:                     c.division ?? null,
        professor_id:                 c.professor_id,
        academic_year_id:             c.academic_year_id,
        cycle_id:                     c.cycle_id ?? null,
        regroupement:                 c.regroupement ?? null,
        start_date:                   c.start_date?.substring(0, 10) ?? '',
        end_date:                     c.end_date?.substring(0, 10) ?? null,
        amount:                       Number(c.amount),
        notes:                        c.notes ?? null,
        status:                       'pending' as ContratStatus,
        course_element_professor_ids: (c.course_element_professors ?? []).map(p => p.id),
      });
      setRelaunchConfirm(null);
      reload();
      showSuccess({
        title: 'Contrat relancé',
        message: `Le contrat N° ${c.contrat_number} est de nouveau en attente.`,
        detail: "Vous pouvez le modifier puis le retransférer à l'enseignant.",
        iconBg: '#fff7ed', iconColor: '#ea580c', icon: <Icon.Refresh />,
      });
    } catch (err: any) {
      addToast('error', 'Erreur', err?.response?.data?.message ?? err.message ?? 'Une erreur est survenue');
      setRelaunchConfirm(null);
    } finally {
      setRelaunchLoading(false);
    }
  };

  const filteredContrats = applyFilters(contrats, filters);

  const COLS = ['N° Contrat', 'Division', 'Cycle', 'Regroupement', 'Professeur', 'Année', 'Programmes', 'Début', 'Fin', 'Montant', 'Statut', 'Actions'];

  return (
    <div className="ctr-root" style={{ padding: '28px 32px', minHeight: '100vh', background: '#f8f9fb' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-.02em' }}>Contrats d'enseignement</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6c648b' }}>
            {loading ? 'Chargement…' : filteredContrats.length !== contrats.length
              ? `${filteredContrats.length} / ${contrats.length} contrat${contrats.length !== 1 ? 's' : ''}`
              : `${contrats.length} contrat${contrats.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {!isRestricted && (
          <button
            className="ctr-btn"
            style={{ height: 38, background: '#4F46E5', color: '#fff', border: 'none' }}
            onClick={() => { setShowCreate(true); setCreateError(''); setCreateForm({ ...emptyForm }); }}
          >
            <Icon.Plus /> Nouveau contrat
          </button>
        )}
      </div>

      {!loading && !error && (
        <FilterBar
          filters={filters}
          professors={professors}
          cycles={cycles}
          academicYears={academicYears}
          total={contrats.length}
          filtered={filteredContrats.length}
          onChange={setFilters}
          onReset={() => setFilters({ ...emptyFilters })}
        />
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: '#6b7280' }}>
          <Icon.Loader /><span style={{ marginLeft: 10 }}>Chargement des contrats…</span>
        </div>
      ) : error ? (
        <div style={{ padding: '20px 24px', borderRadius: 10, background: '#fef2f2', border: '1.5px solid #fecaca', color: '#991b1b', fontSize: 14 }}>
          {error}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1.5px solid #f1f5f9', boxShadow: '0 1px 8px rgba(0,0,0,.04)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="ctr-table">
              <thead>
                <tr>
                  {COLS.map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filteredContrats.length === 0 ? (
                  <tr>
                    <td colSpan={COLS.length} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                      <div style={{ fontSize: 13 }}>
                        {contrats.length === 0
                          ? 'Aucun contrat enregistré'
                          : 'Aucun contrat ne correspond aux filtres sélectionnés.'}
                      </div>
                    </td>
                  </tr>
                ) : filteredContrats.map(c => {
                  const st            = STATUS_CONFIG[c.status] ?? { label: c.status, color: '#374151', bg: '#f9fafb', dot: '#9ca3af' };
                  const isTransferred = c.status === 'transfered';
                  const isCancelled   = c.status === 'cancelled';
                  const isLocked      = c.is_locked === true;
                  const isValidated   = c.is_validated === true;
                  const isAuthorized  = (c as any).is_authorized === true;
                  const hasPdf        = !!c.pdf_url;

                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>{c.contrat_number || `#${c.id}`}</span>
                          {isLocked && (
                            <span className="ctr-lock-badge">
                              <Icon.Lock /> Verrouillé
                            </span>
                          )}
                          {isCancelled && (
                            <span className="ctr-reject-badge">
                              <Icon.MessageX /> Rejeté
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{c.division ? <span style={{ background: c.division === 'RD-FC' ? '#faf5ff' : '#fdf2f8', color: c.division === 'RD-FC' ? '#7c3aed' : '#9d174d', padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700 }}>{c.division}</span> : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      <td style={{ color: '#64748b', fontSize: 13 }}>{c.cycle?.name ?? <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      <td style={{ color: '#64748b', fontSize: 13 }}>{c.regroupement ? `Reg. ${c.regroupement === '1' ? 'I' : 'II'}` : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      <td><span style={{ fontWeight: 500, color: '#0f172a', fontSize: 13 }}>{c.professor?.full_name ?? `Prof. #${c.professor_id}`}</span></td>
                      <td style={{ color: '#64748b', fontSize: 13, whiteSpace: 'nowrap' }}>{(c as any).academic_year?.academic_year ?? <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      <td style={{ maxWidth: 190 }}>
                        {c.course_element_professors && c.course_element_professors.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                            {c.course_element_professors.slice(0, 2).map(p => (
                              <span key={p.id} style={{ fontSize: 11, background: '#f0fdf4', color: '#166534', padding: '2px 7px', borderRadius: 4, border: '1px solid #dcfce7', fontWeight: 600 }}>
                                {p.course_element?.code ?? p.label}
                              </span>
                            ))}
                            {c.course_element_professors.length > 2 && (
                              <span style={{ fontSize: 11, color: '#9ca3af', alignSelf: 'center' }}>+{c.course_element_professors.length - 2}</span>
                            )}
                          </div>
                        ) : <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                      <td style={{ color: '#64748b', fontSize: 12.5, whiteSpace: 'nowrap' }}>{formatDate(c.start_date)}</td>
                      <td style={{ color: '#64748b', fontSize: 12.5, whiteSpace: 'nowrap' }}>{formatDate(c.end_date)}</td>
                      <td>
  <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: '#0f172a', fontSize: 12.5 }}>
    {(() => {
  const progs = c.course_element_professors ?? [];
  const total = progs.reduce((sum, p) => {
    const hours = (p as any).hours ?? p.course_element?.hours ?? 0;
    const amt   = (p as any).amount_program ?? 0;
    return sum + (parseFloat(amt) * Number(hours));
  }, 0);
  return total > 0 ? formatAmount(total) : formatAmount(c.amount);
})()}
  </span>
</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span className="ctr-badge" style={{ background: st.bg, color: st.color }}>
                            <span className="ctr-badge-dot" style={{ background: st.dot }} />
                            {st.label}
                          </span>
                          {isCancelled && c.rejection_reason && (
                            <span
                              title={c.rejection_reason}
                              style={{
                                fontSize: 10.5,
                                color: '#b91c1c',
                                fontStyle: 'italic',
                                maxWidth: 150,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                                cursor: 'help',
                              }}
                            >
                              ↳ {c.rejection_reason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>

                          {/* PDF — visible pour tous */}
                          <button
                            className="ctr-btn-icon"
                            title={hasPdf ? 'Voir le PDF stocké' : 'Aperçu du contrat (PDF non encore disponible)'}
                            onClick={() => openPdf(c)}
                            style={hasPdf ? { borderColor: '#86efac', color: '#16a34a', background: '#f0fdf4' } : {}}
                          >
                            {hasPdf ? <Icon.FilePdf /> : <Icon.FileText />}
                          </button>

                          {/* Relancer / Transférer — visible mais désactivé si restreint */}
                          {isCancelled ? (
                            <button
                              className="ctr-btn-icon"
                              title={
                                isRestricted ? "Droit d'accès non requis"
                                  : c.rejection_reason
                                  ? `Relancer ce contrat (motif : ${c.rejection_reason})`
                                  : 'Relancer ce contrat rejeté'
                              }
                              disabled={isRestricted}
                              onClick={() => { if (!isRestricted) setRelaunchConfirm(c); }}
                              style={isRestricted ? { opacity: 0.4 } : { borderColor: '#fed7aa', color: '#ea580c', background: '#fff7ed' }}
                            >
                              <Icon.Refresh />
                            </button>
                          ) : (
                            <button
                              className="ctr-btn-icon"
                              title={
                                isRestricted ? "Droit d'accès non requis"
                                  : isLocked ? 'Contrat verrouillé'
                                  : isTransferred ? 'Contrat déjà transféré'
                                  : "Transférer et notifier l'enseignant"
                              }
                              disabled={isTransferred || isLocked || isRestricted}
                              onClick={() => { if (!isTransferred && !isLocked && !isRestricted) setTransferConfirm(c); }}
                              style={(!isTransferred && !isLocked && !isRestricted) ? { borderColor: '#c4b5fd', color: '#7c3aed' } : (isRestricted ? { opacity: 0.4 } : {})}
                            >
                              <Icon.Send />
                            </button>
                          )}

                          {/* Autoriser / Upload — visible mais désactivé si restreint */}
                          <button
                            className="ctr-btn-icon"
                            title={
                              isRestricted ? "Droit d'accès non requis"
                                : isAuthorized ? 'Contrat déjà autorisé — uploader un nouveau PDF'
                                : isValidated ? 'Autoriser le contrat / Uploader le PDF final'
                                : "Le contrat doit d'abord être signé par le professeur"
                            }
                            disabled={isRestricted || (!isValidated && !isAuthorized)}
                            onClick={() => { if (!isRestricted) setUploadPdfContrat(c); }}
                            style={
                              isRestricted ? { opacity: 0.4 }
                                : isAuthorized ? { borderColor: '#86efac', color: '#16a34a', background: '#f0fdf4' }
                                : isValidated  ? { borderColor: '#fed7aa', color: '#ea580c', background: '#fff7ed' }
                                : {}
                            }
                          >
                            <Icon.ShieldCheck />
                          </button>

                          {/* Supports de cours — bloqué pour role_id=3, filtré pour 12/13 */}
                          <button
                            className="ctr-btn-icon"
                            title={
                              isChefCAP
                                ? "Droit d'accès non requis"
                                : 'Supports de cours — voir et gérer les PDFs et monographies'
                            }
                            onClick={() => {
                              if (isChefCAP) {
                                setShowAccessDenied(true);
                              } else {
                                setSupportContrat(c);
                                setModalOpenKey(k => k + 1);
                              }
                            }}
                            style={
                              isChefCAP
                                ? { borderColor: '#fecaca', color: '#dc2626', background: '#fef2f2', opacity: 0.75 }
                                : { borderColor: '#c7d2fe', color: '#4338ca', background: '#eef2ff' }
                            }
                          >
                            <Icon.BookOpen />
                          </button>

                          {/* Modifier — visible mais désactivé si restreint */}
                          <button
                            className="ctr-btn-icon"
                            title={
                              isRestricted ? "Droit d'accès non requis"
                                : isLocked ? 'Contrat verrouillé — modification impossible'
                                : 'Modifier'
                            }
                            disabled={isLocked || isRestricted}
                            onClick={() => { if (!isRestricted) openEdit(c); }}
                            style={isRestricted ? { opacity: 0.4 } : {}}
                          >
                            <Icon.Edit />
                          </button>

                          {/* Supprimer — visible mais désactivé si restreint */}
                          <button
                            className="ctr-btn-icon"
                            title={
                              isRestricted ? "Droit d'accès non requis"
                                : isLocked ? 'Contrat verrouillé — suppression impossible'
                                : 'Supprimer'
                            }
                            disabled={isLocked || isRestricted}
                            onClick={() => { if (!isLocked && !isRestricted) setDeleteConfirm(c); }}
                            style={
                              isRestricted ? { opacity: 0.4 }
                                : isLocked ? {}
                                : { borderColor: '#fecaca', color: '#dc2626' }
                            }
                          >
                            <Icon.Trash />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals CRUD */}
      {showCreate && (
        <Modal title="Nouveau contrat" subtitle="Renseigner les informations du contrat de prestation" onClose={closeCreate}>
          <ContratFormFields
            form={createForm}
            professors={professors}
            selectedAcademicYear={getSelectedAcademicYear(createForm.academic_year_id)}
            onFieldChange={onFieldChange(setCreateForm)}
            onSubmit={handleCreateSubmit}
            onCancel={closeCreate}
            loading={createLoading}
            error={createError}
            submitLabel="Créer le contrat"
            isEdit={false}
          />
        </Modal>
      )}

      {editingContrat && (
        <Modal title="Modifier le contrat" subtitle={`Contrat N° ${editingContrat.contrat_number || `#${editingContrat.id}`}`} onClose={closeEdit}>
          <ContratFormFields
            form={editForm}
            professors={professors}
            selectedAcademicYear={getSelectedAcademicYear(editForm.academic_year_id)}
            onFieldChange={onFieldChange(setEditForm)}
            onSubmit={handleEditSubmit}
            onCancel={closeEdit}
            loading={editLoading}
            error={editError}
            submitLabel="Enregistrer les modifications"
            isEdit={true}
          />
        </Modal>
      )}

      {/* Modal Upload PDF / Autoriser */}
      {uploadPdfContrat && (
        <UploadPdfModal
          contrat={uploadPdfContrat}
          onClose={() => setUploadPdfContrat(null)}
          onSuccess={(updated) => {
            setUploadPdfContrat(null);
            showSuccess({
              title: 'PDF enregistré',
              message: 'Le PDF du contrat a été mis à jour avec succès.',
              iconBg: '#fff7ed', iconColor: '#ea580c', icon: <Icon.FilePdf />,
            });
            if (!uploadPdfContrat.is_authorized && uploadPdfContrat.is_validated) {
              setAuthorizeConfirm(updated);
            } else {
              reload();
            }
          }}
        />
      )}

      {/* Modal accès refusé — role_id = 3 sur bouton supports */}
      {showAccessDenied && (
        <div className="ctr-modal-backdrop" onClick={() => setShowAccessDenied(false)}>
          <div className="ctr-modal" style={{ width: 'min(90vw, 420px)' }} onClick={e => e.stopPropagation()}>
            <div className="ctr-modal-header">
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>Accès refusé</div>
              </div>
              <button className="ctr-modal-close" onClick={() => setShowAccessDenied(false)}>
                <Icon.X />
              </button>
            </div>
            <div className="ctr-modal-body">
              <div className="ctr-confirm-body">
                <div className="ctr-confirm-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>
                </div>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', margin: '0 0 8px' }}>
                  Droit d'accès non requis
                </p>
                <p style={{ fontSize: 13.5, color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                  Vous n'avez pas les permissions nécessaires pour accéder aux supports de cours.
                </p>
              </div>
            </div>
            <div className="ctr-modal-footer" style={{ justifyContent: 'center' }}>
              <button className="ctr-btn ctr-btn-ghost" onClick={() => setShowAccessDenied(false)} style={{ minWidth: 100 }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Supports de cours (Admin) */}
      {supportContrat && (
        <AdminCourseSupportModal
          key={`support-${supportContrat.id}-${modalOpenKey}`}
          contrat={supportContrat}
          divisionFilter={supportDivisionFilter}
          onClose={() => setSupportContrat(null)}
          onSaved={() => {
            reload(freshList => {
              const fresh = freshList.find(c => c.id === supportContrat.id);
              if (fresh) setSupportContrat(fresh);
            });
          }}
        />
      )}

      {/* Confirm : Supprimer */}
      {deleteConfirm && (
        <ConfirmModal
          title="Supprimer le contrat"
          message={`Le contrat N° ${deleteConfirm.contrat_number} sera définitivement supprimé.`}
          detail="Cette action est irréversible."
          confirmLabel="Supprimer définitivement"
          confirmClass="ctr-btn-danger"
          loading={deleteLoading}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Confirm : Transférer */}
      {transferConfirm && (
        <ConfirmModal
          title="Transférer le contrat"
          message={`Le contrat N° ${transferConfirm.contrat_number} passera au statut « Transféré ».`}
          detail={`Un e-mail de notification sera automatiquement envoyé à ${transferConfirm.professor?.full_name ?? "l'enseignant"} avec un lien pour consulter et valider le contrat.`}
          confirmLabel="Confirmer le transfert"
          confirmClass="ctr-btn-purple"
          iconBg="#faf5ff" iconColor="#7c3aed"
          icon={<Icon.Mail />}
          loading={transferLoading}
          onConfirm={handleTransferConfirm}
          onCancel={() => setTransferConfirm(null)}
        />
      )}

      {/* Confirm : Autoriser */}
      {authorizeConfirm && (
        <ConfirmModal
          title="Autoriser le contrat"
          message={`Confirmez-vous l'autorisation du contrat N° ${authorizeConfirm.contrat_number} ?`}
          detail="Le contrat passera au statut « En cours » et sera définitivement verrouillé. Cette action est irréversible."
          confirmLabel="Autoriser le contrat"
          confirmClass="ctr-btn-success"
          iconBg="#f0fdf4" iconColor="#059669"
          icon={<Icon.ShieldCheck />}
          loading={authorizeLoading}
          onConfirm={handleAuthorizeConfirm}
          onCancel={() => { setAuthorizeConfirm(null); reload(); }}
        />
      )}

      {/* Confirm : Relancer un contrat rejeté */}
      {relaunchConfirm && (
        <ConfirmModal
          title="Relancer le contrat rejeté"
          message={`Remettre le contrat N° ${relaunchConfirm.contrat_number} en statut « En attente » ?`}
          detail={
            relaunchConfirm.rejection_reason
              ? `Motif du rejet : « ${relaunchConfirm.rejection_reason} ». Vous pourrez le modifier puis le retransférer à l'enseignant.`
              : "Vous pourrez modifier le contrat puis le retransférer à l'enseignant."
          }
          confirmLabel="Relancer le contrat"
          confirmClass="ctr-btn-orange"
          iconBg="#fff7ed" iconColor="#ea580c"
          icon={<Icon.Refresh />}
          loading={relaunchLoading}
          onConfirm={handleRelaunchConfirm}
          onCancel={() => setRelaunchConfirm(null)}
        />
      )}

      {/* Success Modal */}
      {successModal && (
        <SuccessModal
          title={successModal.title}
          message={successModal.message}
          detail={successModal.detail}
          iconBg={successModal.iconBg}
          iconColor={successModal.iconColor}
          icon={successModal.icon}
          whatsapp={successModal.whatsapp}
          onClose={() => setSuccessModal(null)}
        />
      )}

      <ToastContainer toasts={toasts} remove={removeToast} />
    </div>
  );
};

export default Contrats;
