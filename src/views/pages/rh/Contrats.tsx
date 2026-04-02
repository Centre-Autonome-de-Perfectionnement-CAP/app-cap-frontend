import React, { useCallback, useEffect, useRef, useState } from 'react';
import rhService from '@/services/rh.service';
import { getAssetUrl } from '@/utils/assets'; // adapte ce chemin si nécessaire
import type {
  Contrat,
  AcademicYear,
  Cycle,
  ContratStatus,
  CreateContratPayload,
  UpdateContratPayload,
  ProfessorProgram,
} from '@/types/rh.types';

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
  cancelled:  { label: 'Résilié',    color: '#7f1d1d', bg: '#fef2f2', dot: '#ef4444' },
  transfered: { label: 'Transféré',  color: '#3b0764', bg: '#faf5ff', dot: '#a855f7' },
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
  .ctr-pdf-preview h1 { font-size: 14pt; text-align: center; text-transform: uppercase; font-weight: bold; margin: 0 0 6px; letter-spacing: .04em; }
  .ctr-pdf-preview .art { margin-bottom: 14px; }
  .ctr-pdf-preview .art-title { font-weight: bold; text-decoration: underline; margin-bottom: 6px; font-size: 11.5pt; }
  .ctr-pdf-preview table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt; }
  .ctr-pdf-preview th, .ctr-pdf-preview td { border: 1px solid #333; padding: 5px 8px; }
  .ctr-pdf-preview th { background: #f0f0f0; font-weight: bold; text-align: left; }
  .ctr-pdf-preview .sig-zone { display: flex; justify-content: space-between; margin-top: 48px; }
  .ctr-pdf-preview .sig-box  { width: 42%; text-align: center; }
  .ctr-pdf-preview .sig-line { border-top: 1px solid #000; margin-top: 72px; padding-top: 5px; font-size: 10pt; }
`;

// ─── Inject styles ─────────────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('ctr-styles')) {
  const s = document.createElement('style');
  s.id = 'ctr-styles';
  s.textContent = GLOBAL_STYLE;
  document.head.appendChild(s);
}

// ─── SVG Icons ─────────────────────────────────────────────────────────────────
const Icon = {
  Plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  FileText: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  Send: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  Edit: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  Trash: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  Download: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Check: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  AlertTriangle: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Info: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  Loader: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin .8s linear infinite' }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  ChevronDown: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
  ChevronUp: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>,
  Search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Printer: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  Mail: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
};

// Inject spin keyframe
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

// ─── useClickOutside ───────────────────────────────────────────────────────────
function useClickOutside(cb: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [cb]);
  return ref;
}

// ─── Generic Modal ─────────────────────────────────────────────────────────────
const Modal: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  footer?: React.ReactNode;
}> = ({ title, subtitle, onClose, children, wide, footer }) => (
  <div className="ctr-modal-backdrop" onClick={onClose}>
    <div
      className="ctr-modal"
      style={{ width: wide ? 900 : 680, maxWidth: '97vw' }}
      onClick={e => e.stopPropagation()}
    >
      <div className="ctr-modal-header">
        <div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>{title}</h2>
          {subtitle && <p style={{ margin: '2px 0 0', fontSize: 13, color: '#6b7280' }}>{subtitle}</p>}
        </div>
        <button className="ctr-modal-close" onClick={onClose}><Icon.X /></button>
      </div>
      <div className="ctr-modal-body">{children}</div>
      {footer && <div className="ctr-modal-footer">{footer}</div>}
    </div>
  </div>
);

// ─── Confirm Modal ─────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  title: string;
  message: string;
  detail?: string;
  confirmLabel: string;
  confirmClass?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title, message, detail, confirmLabel, confirmClass = 'ctr-btn-danger',
  icon, iconBg = '#fef2f2', iconColor = '#dc2626',
  loading, onConfirm, onCancel,
}) => (
  <div className="ctr-modal-backdrop" onClick={onCancel}>
    <div className="ctr-modal" style={{ width: 460, maxWidth: '97vw' }} onClick={e => e.stopPropagation()}>
      <div className="ctr-modal-body" style={{ paddingTop: 36, paddingBottom: 32 }}>
        <div className="ctr-confirm-body">
          <div className="ctr-confirm-icon" style={{ background: iconBg, color: iconColor }}>
            {icon ?? <Icon.AlertTriangle />}
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: '#111827' }}>{title}</h3>
          <p style={{ margin: '0 0 6px', fontSize: 14, color: '#374151' }}>{message}</p>
          {detail && <p style={{ margin: 0, fontSize: 12.5, color: '#6b7280' }}>{detail}</p>}
        </div>
      </div>
      <div className="ctr-modal-footer">
        <button className="ctr-btn ctr-btn-ghost" onClick={onCancel} disabled={loading}>Annuler</button>
        <button className={`ctr-btn ${confirmClass}`} onClick={onConfirm} disabled={loading}>
          {loading ? <><Icon.Loader /> En cours…</> : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ─── ProfessorSelect ───────────────────────────────────────────────────────────
const ProfessorSelect: React.FC<{ professors: Professor[]; value: string; onChange: (v: string) => void; required?: boolean }> = ({ professors, value, onChange, required }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(useCallback(() => setOpen(false), []));
  const filtered = professors.filter(p => p.full_name.toLowerCase().includes(search.toLowerCase()));
  const selected = professors.find(p => String(p.id) === value);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className={`ctr-dropdown-trigger${open ? ' open' : ''}`} onClick={() => setOpen(v => !v)} tabIndex={0}>
        <span style={{ color: selected ? '#111827' : '#9ca3af', fontSize: 14 }}>
          {selected ? selected.full_name : 'Sélectionner un professeur'}
        </span>
        {open ? <Icon.ChevronUp /> : <Icon.ChevronDown />}
      </div>
      {open && (
        <div className="ctr-dropdown-menu">
          <div className="ctr-dropdown-search">
            <input autoFocus type="text" placeholder="Rechercher par nom…" value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} />
          </div>
          <div className="ctr-dropdown-list">
            {filtered.length === 0
              ? <div className="ctr-dropdown-empty">Aucun résultat</div>
              : filtered.map(p => (
                <div key={p.id} className={`ctr-dropdown-item${String(p.id) === value ? ' selected' : ''}`}
                  onClick={() => { onChange(String(p.id)); setSearch(''); setOpen(false); }}>
                  {p.full_name}
                  {String(p.id) === value && <Icon.Check />}
                </div>
              ))}
          </div>
        </div>
      )}
      <input type="text" required={required} value={value} readOnly tabIndex={-1} style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} />
    </div>
  );
};

// ─── AcademicYearSelect ────────────────────────────────────────────────────────
const AcademicYearSelect: React.FC<{ value: string; onChange: (v: string) => void; required?: boolean }> = ({ value, onChange, required }) => {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(useCallback(() => setOpen(false), []));
  useEffect(() => {
    rhService.getAcademicYears().then(list => {
      const sorted = [...list].sort((a, b) => (b.academic_year ?? '').localeCompare(a.academic_year ?? ''));
      setYears(sorted);
      if (!value && sorted[0]) onChange(String(sorted[0].id));
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const selected = years.find(y => String(y.id) === value);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className={`ctr-dropdown-trigger${open ? ' open' : ''}`} onClick={() => setOpen(v => !v)} tabIndex={0}>
        <span style={{ color: selected ? '#111827' : '#9ca3af', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          {selected ? selected.academic_year : 'Sélectionner une année'}
          {selected?.is_current && <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 700, background: '#f0fdf4', padding: '1px 7px', borderRadius: 999, border: '1px solid #bbf7d0' }}>Courante</span>}
        </span>
        {open ? <Icon.ChevronUp /> : <Icon.ChevronDown />}
      </div>
      {open && (
        <div className="ctr-dropdown-menu">
          <div className="ctr-dropdown-list">
            {years.map(y => (
              <div key={y.id} className={`ctr-dropdown-item${String(y.id) === value ? ' selected' : ''}`}
                onClick={() => { onChange(String(y.id)); setOpen(false); }}>
                <span>{y.academic_year}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {y.is_current && <span style={{ fontSize: 10, color: '#16a34a', background: '#f0fdf4', padding: '1px 6px', borderRadius: 999 }}>Courante</span>}
                  {String(y.id) === value && <Icon.Check />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <input type="text" required={required} value={value} readOnly tabIndex={-1} style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} />
    </div>
  );
};

// ─── CycleSelect ───────────────────────────────────────────────────────────────
const CycleSelect: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(useCallback(() => setOpen(false), []));
  useEffect(() => { rhService.getCycles().then(setCycles).catch(() => {}); }, []);
  const selected = cycles.find(c => String(c.id) === value);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div className={`ctr-dropdown-trigger${open ? ' open' : ''}`} onClick={() => setOpen(v => !v)} tabIndex={0}>
        <span style={{ color: selected ? '#111827' : '#9ca3af', fontSize: 14 }}>{selected ? selected.name : 'Cycle (optionnel)'}</span>
        {open ? <Icon.ChevronUp /> : <Icon.ChevronDown />}
      </div>
      {open && (
        <div className="ctr-dropdown-menu">
          <div className="ctr-dropdown-list">
            <div className="ctr-dropdown-item" style={{ color: '#9ca3af' }} onClick={() => { onChange(''); setOpen(false); }}>— Aucun —</div>
            {cycles.map(c => (
              <div key={c.id} className={`ctr-dropdown-item${String(c.id) === value ? ' selected' : ''}`}
                onClick={() => { onChange(String(c.id)); setOpen(false); }}>
                {c.name}
                {String(c.id) === value && <Icon.Check />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── ProgramsMultiSelect ───────────────────────────────────────────────────────
const ProgramsMultiSelect: React.FC<{ professorId: string; selectedIds: number[]; onChange: (ids: number[]) => void }> = ({ professorId, selectedIds, onChange }) => {
  const [programs, setPrograms] = useState<ProfessorProgram[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(useCallback(() => setOpen(false), []));
  useEffect(() => {
    if (!professorId) { setPrograms([]); return; }
    setLoading(true);
    rhService.getProfessorPrograms(professorId).then(d => { setPrograms(d); setLoading(false); }).catch(() => setLoading(false));
  }, [professorId]);
  if (!professorId) return null;
  const filtered = programs.filter(p => p.label.toLowerCase().includes(search.toLowerCase()));
  const selectedPrograms = programs.filter(p => selectedIds.includes(p.id));
  const toggle = (id: number) => onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <label className="ctr-label">Programmes <span style={{ fontWeight: 400, color: '#9ca3af' }}>— matières et classes liées à ce contrat</span></label>
      <div ref={ref} style={{ position: 'relative' }}>
        <div className={`ctr-dropdown-trigger${open ? ' open' : ''}`}
          onClick={() => !loading && setOpen(v => !v)}
          style={{ height: 'auto', minHeight: 40, padding: '6px 12px', flexWrap: 'wrap', gap: 5, alignItems: selectedPrograms.length ? 'flex-start' : 'center', cursor: loading ? 'wait' : 'pointer' }}>
          {loading
            ? <span style={{ color: '#9ca3af', fontSize: 13 }}>Chargement des programmes…</span>
            : selectedPrograms.length === 0
              ? <span style={{ color: '#9ca3af', fontSize: 14 }}>Cliquer pour sélectionner les programmes</span>
              : selectedPrograms.map(p => (
                <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#eff6ff', color: '#1d4ed8', padding: '3px 8px 3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                  {p.label}
                  <span onClick={e => { e.stopPropagation(); toggle(p.id); }} style={{ cursor: 'pointer', opacity: .7, lineHeight: 1 }}><Icon.X /></span>
                </span>
              ))
          }
          <span style={{ marginLeft: 'auto', flexShrink: 0 }}>{open ? <Icon.ChevronUp /> : <Icon.ChevronDown />}</span>
        </div>
        {open && (
          <div className="ctr-dropdown-menu">
            <div className="ctr-dropdown-search">
              <input autoFocus type="text" placeholder="Rechercher un programme…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="ctr-dropdown-list">
              {filtered.length === 0
                ? <div className="ctr-dropdown-empty">Aucun programme</div>
                : filtered.map(p => (
                  <div key={p.id} className={`ctr-dropdown-item${selectedIds.includes(p.id) ? ' selected' : ''}`}
                    onClick={() => toggle(p.id)}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.course_element?.code} — {p.course_element?.name}</div>
                      {p.class_group && <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 1 }}>{p.class_group.name}</div>}
                    </div>
                    {selectedIds.includes(p.id) && <Icon.Check />}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── FormState ─────────────────────────────────────────────────────────────────
interface FormState {
  division: string; professor_id: string; academic_year_id: string;
  cycle_id: string; regroupement: string; start_date: string; end_date: string;
  amount: string; notes: string; status: string; program_ids: number[];
}
const emptyForm: FormState = {
  division: '', professor_id: '', academic_year_id: '',
  cycle_id: '', regroupement: '', start_date: '', end_date: '',
  amount: '', notes: '', status: 'pending', program_ids: [],
};

// ─── ContratFormFields ─────────────────────────────────────────────────────────
const ContratFormFields: React.FC<{
  form: FormState;
  professors: Professor[];
  onFieldChange: (name: string, value: string | number[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  loading: boolean;
  error?: string;
  submitLabel: string;
  isEdit: boolean;
}> = ({ form, professors, onFieldChange, onSubmit, onCancel, loading, error, submitLabel, isEdit }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    onFieldChange(e.target.name, e.target.value);

  return (
    <form onSubmit={onSubmit}>
      <p className="ctr-section-title">Identification</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label className="ctr-label">Division *</label>
          <select className="ctr-input ctr-select" name="division" value={form.division} onChange={handleChange} required>
            <option value="">Sélectionner une division</option>
            {DIVISIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        <div>
          <label className="ctr-label">Regroupement *</label>
          <select className="ctr-input ctr-select" name="regroupement" value={form.regroupement} onChange={handleChange} required>
            <option value="">Sélectionner</option>
            {REGROUPEMENTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label className="ctr-label">Année académique *</label>
          <AcademicYearSelect value={form.academic_year_id} onChange={v => onFieldChange('academic_year_id', v)} required />
        </div>
        <div>
          <label className="ctr-label">Cycle</label>
          <CycleSelect value={form.cycle_id} onChange={v => onFieldChange('cycle_id', v)} />
        </div>
      </div>

      <p className="ctr-section-title">Enseignant & Programmes</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>
        <div>
          <label className="ctr-label">Professeur *</label>
          <ProfessorSelect professors={professors} value={form.professor_id} onChange={v => onFieldChange('professor_id', v)} required />
        </div>
        <ProgramsMultiSelect professorId={form.professor_id} selectedIds={form.program_ids} onChange={ids => onFieldChange('program_ids', ids)} />
      </div>

      <p className="ctr-section-title">Période & Rémunération</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div>
          <label className="ctr-label">Date de début *</label>
          <input className="ctr-input" type="date" name="start_date" value={form.start_date} onChange={handleChange} required />
        </div>
        <div>
          <label className="ctr-label">Date de fin</label>
          <input className="ctr-input" type="date" name="end_date" value={form.end_date} onChange={handleChange} min={form.start_date || undefined} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="ctr-label">Montant (FCFA) *</label>
          <input className="ctr-input" type="number" name="amount" value={form.amount} onChange={handleChange} required min="100" step="any" placeholder="Minimum 100 FCFA" />
          {form.amount !== '' && Number(form.amount) < 100 && (
            <p className="ctr-err">Le montant minimum est de 100 FCFA</p>
          )}
        </div>
      </div>

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
        <button type="submit" className="ctr-btn ctr-btn-primary" disabled={loading}>
          {loading ? <><Icon.Loader /> Enregistrement…</> : submitLabel}
        </button>
      </div>
    </form>
  );
};

// ─── PDF Print Modal ───────────────────────────────────────────────────────────
const ContratPdfModal: React.FC<{ contrat: Contrat; onClose: () => void }> = ({ contrat, onClose }) => {
  const prof = contrat.professor as Professor | undefined;
  const cycle      = contrat.cycle?.name ?? '—';
  const reg        = contrat.regroupement === '1' ? 'I' : contrat.regroupement === '2' ? 'II' : '—';
  const division   = contrat.division ?? '—';
  const programmes = contrat.course_element_professors ?? [];
  const printRef   = useRef<HTMLDivElement>(null);
  const daysCount  = (() => {
    if (!contrat.start_date || !contrat.end_date) return '…';
    const ms = new Date(contrat.end_date.substring(0, 10)).getTime() - new Date(contrat.start_date.substring(0, 10)).getTime();
    return Math.max(1, Math.round(ms / 86400000));
  })();
  const daysWord = (() => {
    const n = typeof daysCount === 'number' ? daysCount : parseInt(String(daysCount));
    if (isNaN(n)) return '…';
    const words: Record<number, string> = { 1:'un', 2:'deux', 3:'trois', 4:'quatre', 5:'cinq', 6:'six', 7:'sept', 8:'huit', 9:'neuf', 10:'dix',
      11:'onze', 12:'douze', 13:'treize', 14:'quatorze', 15:'quinze', 16:'seize', 17:'dix-sept', 18:'dix-huit', 19:'dix-neuf', 20:'vingt',
      21:'vingt et un', 22:'vingt-deux', 25:'vingt-cinq', 30:'trente', 32:'trente-deux' };
    return words[n] ?? String(n);
  })();

  const handlePrint = () => {
    const content = printRef.current?.innerHTML ?? '';
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title></title>
  <style>
    @page {
      size: A4;
      margin: 1.8cm 2cm 2cm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10.5pt;
      color: #000;
      line-height: 1.55;
      background: #fff;
    }
    /* ── En-tête ── */
    .doc-header { display: flex; align-items: center; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid #000; }
    .doc-header-logo { width: 74px; flex-shrink: 0; }
    .doc-header-logo img { width: 72px; height: 72px; object-fit: contain; display: block; }
    .doc-header-text { flex: 1; text-align: center; }
    .doc-header .inst-line { font-weight: bold; text-transform: uppercase; font-size: 10.5pt; line-height: 1.7; color: #000; }
    .doc-header .inst-dots { color: #000; letter-spacing: 5px; font-size: 9.5pt; margin-top: 3px; }
    /* ── Titre ── */
    .doc-title { text-align: center; margin: 10px 0 4px; }
    .doc-title .title-main { font-size: 12pt; font-weight: bold; text-transform: uppercase; color: #000; }
    /* ── Référence ── */
    .doc-ref { text-align: center; font-size: 10pt; font-style: italic; margin: 6px 0 16px; color: #000; }
    /* ── Corps ── */
    p { margin: 3px 0 7px; text-align: justify; }
    .indent { padding-left: 18px; }
    strong { font-weight: bold; }
    em { font-style: italic; }
    /* ── Articles ── */
    .art { margin-bottom: 10px; page-break-inside: avoid; }
    .art-title { font-weight: bold; text-decoration: underline; margin-bottom: 4px; font-size: 10.5pt; }
    /* ── Tableau ── */
    table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9.5pt; }
    th { border: 1px solid #999; padding: 5px 6px; background: #efefef; color: #000; font-weight: bold; text-align: center; }
    td { border: 1px solid #999; padding: 4px 6px; vertical-align: middle; }
    tr:nth-child(even) td { background: #f8f8f8; }
    /* ── Listes ── */
    ul { margin: 4px 0 6px; padding-left: 22px; }
    li { margin-bottom: 2px; }
    /* ── Signatures ── */
    .sig-row1 { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 20px; }
    .sig-left { width: 40%; text-align: center; }
    .sig-right { width: 34%; text-align: center; }
    .sig-italic { font-style: italic; font-size: 10.5pt; margin: 0 0 48px; }
    .sig-dotline { border-bottom: 1px dotted #555; width: 80%; margin: 0 auto 6px; }
    .sig-name-bold { font-weight: bold; font-size: 10.5pt; margin: 0; }
    .sig-name-underline { font-weight: bold; text-decoration: underline; font-size: 10.5pt; margin: 0 0 1px; }
    .sig-cap-bold { font-weight: bold; font-size: 10.5pt; margin: 0 0 1px; }
    .sig-sub-italic { font-style: italic; font-size: 10pt; margin: 0 0 48px; }
    .sig-title-sm { font-size: 9.5pt; margin: 0; }
    .sig-director { text-align: center; margin-top: 28px; width: 38%; margin-left: auto; margin-right: auto; }
    .sig-dir-title { font-weight: bold; font-size: 10.5pt; margin: 0 0 48px; }
    /* ── Note bas ── */
    .footnote { font-size: 8pt; border-top: 1px solid #888; margin-top: 14px; padding-top: 3px; color: #333; }
    @media print {
      html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>${content}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

  /* ── Styles inline pour la prévisualisation ── */
  const S = {
    header: { textAlign: 'center' as const, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #000' },
    instLine: { fontWeight: 'bold', textTransform: 'uppercase' as const, fontSize: '11pt', lineHeight: 1.7, color: '#000' },
    instDots: { color: '#000', letterSpacing: '5px', fontSize: '9.5pt', marginTop: 3 },
    title: { textAlign: 'center' as const, margin: '10px 0 4px' },
    titleMain: { fontSize: '12pt', fontWeight: 'bold', textTransform: 'uppercase' as const, color: '#000' },
    ref: { textAlign: 'center' as const, fontSize: '10pt', fontStyle: 'italic' as const, margin: '6px 0 18px', color: '#000' },
    artTitle: { fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5, fontSize: '10.5pt' },
    p: { margin: '3px 0 7px', textAlign: 'justify' as const },
    pIndent: { margin: '3px 0 7px', textAlign: 'justify' as const, paddingLeft: 18 },
    th: { border: '1px solid #999', padding: '5px 6px', background: '#efefef', color: '#000', fontWeight: 'bold', textAlign: 'center' as const },
    td: { border: '1px solid #999', padding: '4px 6px', verticalAlign: 'middle' as const },
  };


  const EPAC_LOGO = 'data:image/jpeg;base64,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';
  const CAP_LOGO  = getAssetUrl('images/cap-1.png');

  const headerHtml = (
    <div>
      {/* En-tête avec logos gauche/droite et texte centré */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #000' }}>
        {/* Logo EPAC — gauche */}
        <div style={{ width: 70, flexShrink: 0 }}>
          <img src={EPAC_LOGO} alt="EPAC" style={{ width: 72, height: 72, objectFit: 'contain', display: 'block' }} />
        </div>
        {/* Texte centré */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={S.instLine}>UNIVERSITE D'ABOMEY-CALAVI</div>
          <div style={S.instLine}>ECOLE POLYTECHNIQUE D'ABOMEY –CALAVI</div>
          <div style={S.instLine}>CENTRE AUTONOME DE PERFECTIONNEMENT</div>
          <div style={S.instDots}>………………………………</div>
        </div>
        {/* Logo CAP — droite */}
        <div style={{ width: 70, flexShrink: 0, textAlign: 'right' }}>
          <img src={CAP_LOGO} alt="CAP" style={{ width: 72, height: 72, objectFit: 'contain', display: 'block', marginLeft: 'auto' }} />
        </div>
      </div>
      {/* Titre */}
      <div style={S.title}>
        <span style={S.titleMain}>
          (Regroupement {reg} — Cycle : {cycle}) CONTRAT DE PRESTATION D'ENSEIGNEMENT
        </span>
      </div>
    </div>
  );

  return (
    <Modal
      title={`Contrat N° ${contrat.contrat_number}`}
      subtitle="Aperçu du contrat de prestation d'enseignement"
      onClose={onClose}
      wide
      footer={
        <>
          <button className="ctr-btn ctr-btn-ghost" onClick={onClose}>Fermer</button>
          <button className="ctr-btn ctr-btn-primary" onClick={handlePrint}>
            <Icon.Printer /> Imprimer / Exporter PDF
          </button>
        </>
      }
    >
      {/* Scrollable preview */}
      <div style={{ background: '#e8edf4', padding: '24px', borderRadius: 10, marginBottom: 4 }}>
        <div style={{ background: '#fff', borderRadius: 6, boxShadow: '0 2px 24px rgba(26,58,92,.13)', padding: '32px 40px 36px', fontFamily: 'Times New Roman, serif', fontSize: '10.5pt', lineHeight: 1.55, color: '#1a1a1a', maxWidth: 760, margin: '0 auto' }}>
          <div ref={printRef}>
            {headerHtml}

            {/* Référence */}
            <p style={S.ref}>
              <strong>N° {contrat.contrat_number} /UAC/ EPAC/CAP/{division}/</strong> du {formatDate(contrat.start_date)}
            </p>

            {/* Parties */}
            <p style={{ marginBottom: 10 }}><strong>Entre :</strong></p>
            <p style={{ marginBottom: 10, textAlign: 'justify' }}>
              Le Centre Autonome de Perfectionnement de l'École Polytechnique d'Abomey-Calavi de l'Université
              d'Abomey-Calavi, Représenté par son Chef, Monsieur <strong>Fidèle Paul TCHOBO</strong>,
              Tél : (229) 01 99 54 62 67, <strong>E-mail professionnel</strong> : <strong>contact@cap-epac.online</strong>,
              ci-après dénommé <strong>CAP</strong> d'une part,
            </p>
            <p style={{ marginBottom: 10 }}><strong>Et</strong></p>
            <p style={{ marginBottom: 4 }}><strong>Monsieur / Madame :</strong> <strong>{prof?.full_name ?? '…………………………………………………………………………………………'}</strong></p>
            <p style={{ marginBottom: 4 }}><strong>Nationalité :</strong> <strong>{prof?.nationality ?? '…………………………………………'}</strong></p>
            <p style={{ marginBottom: 4 }}><strong>Profession :</strong> <strong>{prof?.profession ?? '……………………………………………'}</strong></p>
            <p style={{ marginBottom: 4 }}><strong>Domicilié(e) à :</strong> <strong>{prof?.city ?? '……………………………'}</strong> / Parcelle <strong>{prof?.plot_number ?? '………………………'}</strong>, Maison : <strong>{prof?.house_number ?? '………………………'}</strong></p>
            <p style={{ marginBottom: 4 }}><strong>IFU :</strong> <strong>{prof?.ifu_number ?? '…………………………………………………'}</strong></p>
            <p style={{ marginBottom: 4 }}><strong>RIB :</strong> N° <strong>[{prof?.rib_number ?? 'Code banque - Code guichet - Numéro de compte - Clé RIB'}]</strong> / <strong>Banque :</strong> <strong>{prof?.bank ?? '………………………'}</strong></p>
            <p style={{ marginBottom: 4 }}><strong>Adresse :</strong> <strong>{[prof?.city, prof?.district].filter(Boolean).join(', ') || '………………………'}</strong> / <strong>Email :</strong> {prof?.email ?? '………………………………'} / <strong>Tél. :</strong> <strong>{prof?.phone ?? '…………………………………'}</strong></p>
            <p style={{ marginBottom: 10 }}>ci-après dénommé « <strong>L'ENSEIGNANT PRESTATAIRE</strong> » d'autre part,</p>
            <p style={{ marginBottom: 10, textAlign: 'justify' }}>
              qui déclare être disponible pour fournir les prestations objet du présent contrat, ci-après dénommé<br/>
              « <strong>PRESTATIONS D'ENSEIGNEMENT</strong> »,
            </p>
            <p style={{ marginBottom: 10, textAlign: 'justify' }}>
              Considérant que le CAP est disposé à faciliter à l'enseignant prestataire l'exécution de ses prestations, conformément aux clauses et conditions du présent contrat ;
            </p>
            <p style={{ marginBottom: 16 }}>Les parties au présent contrat ont convenu de ce qui suit :</p>

            {/* Art. 1 */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5 }}>1. Objet du contrat</p>
              <p style={{ marginLeft: 20, textAlign: 'justify' }}>Le présent contrat a pour objet la fourniture de prestations d'enseignement au CAP dans les conditions de délai, normes académiques et de qualité conformément aux clauses et conditions ci-après énoncées.</p>
            </div>

            {/* Art. 2 */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5 }}>2. Nature des prestations</p>
              <p style={{ marginLeft: 20, textAlign: 'justify' }}>
                Le Centre retient par la présente les prestations de l'enseignant pour l'exécution de <strong>{programmes.length > 0 ? `${daysWord.charAt(0).toUpperCase() + daysWord.slice(1)} (${daysCount})` : 'Trente-deux (32)'} heures</strong> d'enseignement des cours de :
              </p>
              {programmes.length > 0 ? (
                <ul style={{ marginLeft: 20 }}>{programmes.map(p => (
                  <li key={p.id}>
                    <strong>({p.course_element?.code ?? '—'})</strong> : {p.course_element?.name ?? '—'}{p.class_group ? ` en ${p.class_group.name}` : ''}
                  </li>
                ))}</ul>
              ) : (
                <ul style={{ marginLeft: 20 }}>
                  <li><strong>(Code ECU)</strong> : [Intitulé de l'ECU] en [Filière et année d'étude] et pendant [……] heures</li>
                </ul>
              )}
              <p style={{ marginLeft: 20, fontStyle: 'italic' }}>
                conformément aux exigences énumérées dans le cahier de charges joint au présent contrat.
              </p>
            </div>

            {/* Art. 3 */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5 }}>3. Date de démarrage et calendrier</p>
              <p style={{ marginLeft: 20, textAlign: 'justify' }}>
                La durée de la prestation est de <strong>{daysCount} ({daysWord}.) jours</strong> ouvrables à partir de : <strong>{formatDate(contrat.start_date)}</strong>
              </p>
              <table style={{ marginLeft: 0, marginTop: 8, fontSize: '10pt' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #999', padding: '5px 6px', background: '#efefef', color: '#000', fontWeight: 'bold', textAlign: 'center' }}>Département</th>
                    <th style={{ border: '1px solid #999', padding: '5px 6px', background: '#efefef', color: '#000', fontWeight: 'bold', textAlign: 'center' }}>Année d'étude</th>
                    <th style={{ border: '1px solid #999', padding: '5px 6px', background: '#efefef', color: '#000', fontWeight: 'bold', textAlign: 'center' }}>ECUE<sup>1</sup></th>
                    <th style={{ border: '1px solid #999', padding: '5px 6px', background: '#efefef', color: '#000', fontWeight: 'bold', textAlign: 'center' }}>Nbre d'heures</th>
                    <th style={{ border: '1px solid #999', padding: '5px 6px', background: '#efefef', color: '#000', fontWeight: 'bold', textAlign: 'center' }}>Date de démarrage</th>
                    <th style={{ border: '1px solid #999', padding: '5px 6px', background: '#efefef', color: '#000', fontWeight: 'bold', textAlign: 'center' }}>Date de fin</th>
                  </tr>
                </thead>
                <tbody>
                  {programmes.length > 0 ? programmes.map((p, i) => (
                    <tr key={p.id}>
                      <td style={{ ...S.td, ...(i % 2 === 1 ? { background: '#f8f8f8' } : {}) }}>{p.course_element?.teaching_unit?.name ?? '—'}</td>
                      <td style={{ ...S.td, ...(i % 2 === 1 ? { background: '#f8f8f8' } : {}) }}>{p.class_group?.name ?? '—'}</td>
                      <td style={{ ...S.td, ...(i % 2 === 1 ? { background: '#f8f8f8' } : {}) }}>{p.course_element?.name ?? '—'}</td>
                      <td style={{ ...S.td, textAlign: 'center', ...(i % 2 === 1 ? { background: '#f8f8f8' } : {}) }}>—</td>
                      <td style={{ ...S.td, ...(i % 2 === 1 ? { background: '#f8f8f8' } : {}) }}>{formatDate(contrat.start_date)}</td>
                      <td style={{ ...S.td, ...(i % 2 === 1 ? { background: '#f8f8f8' } : {}) }}>{formatDate(contrat.end_date)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td style={S.td}>………………</td>
                      <td style={S.td}>………</td>
                      <td style={S.td}>………………………</td>
                      <td style={{ ...S.td, textAlign: 'center' }}>…</td>
                      <td style={S.td}>JJ/MM/20..</td>
                      <td style={S.td}>JJ/MM/20..</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Art. 4 */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5 }}>4- Temps de présence</p>
              <p style={{ marginLeft: 20, textAlign: 'justify' }}>
                Dans l'exécution du présent contrat, « L'ENSEIGNANT PRESTATAIRE », <strong>{prof?.full_name ?? '[Nom de l\'Enseignant ici]'}</strong> assurera également la surveillance des évaluations. En outre, il surveillera les travaux de recherche des apprenants dans les conditions prévues par les textes du CAP.
              </p>
              <p style={{ marginLeft: 20, textAlign: 'justify' }}>
                Conformément à l'arrêté N°0388/MESRS/DC/SGM/DPAF/DGES/CJ/SA/05 du 03/08/2022, au CAP, les charges horaires des prestataires d'enseignement, sont fixées comme suit :
              </p>
              <ul style={{ marginLeft: 20 }}>
                <li>une heure (01) de Cours Théorique équivaut à une heure et demie (1h30) de travaux dirigés ;</li>
                <li>une heure (01) de Cours Théorique équivaut à deux (02) heures de travaux Pratiques ;</li>
                <li>une heure (01) de Cours Théorique équivaut à cinq (05) heures d'ateliers / sorties pédagogiques / Stage</li>
              </ul>
            </div>

            {/* Art. 5 */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5 }}>5- Termes de paiement et prélèvements</p>
              <p style={{ marginLeft: 20, textAlign: 'justify' }}>
                Les honoraires pour les prestations d'enseignement sont de <strong>{formatAmount(contrat.amount)}</strong> brut par heure exécutée conformément aux exigences du CAP.
              </p>
              <p style={{ marginLeft: 20, textAlign: 'justify' }}>
                Les paiements sont effectués en Francs CFA à la fin des prestations (dépôt de sujet, corrigé type et copies corrigées) dûment constatées par une attestation de service fait, par virement bancaire après le prélèvement de l'AIB.
              </p>
            </div>

            {/* Art. 6 */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5 }}>6. Normes de Performance</p>
              <p style={{ marginLeft: 20, textAlign: 'justify' }}>
                L'enseignant prestataire s'engage à fournir les prestations conformément aux normes professionnelles, d'éthique et déontologiques, de compétence et d'intégrité les plus exigeantes. Il est systématiquement mis fin au présent contrat en cas de défaillance du prestataire constatée et motivée par écrit au CAP.
              </p>
            </div>

            {/* Art. 7 */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5 }}>7. Droit de propriété, de devoir de réserve et de non-concurrence</p>
              <p style={{ marginLeft: 20, textAlign: 'justify' }}>
                Pendant la durée d'exécution du présent contrat et les cinq années suivant son expiration, l'enseignant prestataire ne divulguera aucune information exclusive ou confidentielle concernant la prestation, le présent contrat, les affaires ou les documents du CAP sans avoir obtenu au préalable l'autorisation écrite de l'Unité de formation et de recherche concernée.
              </p>
              <p style={{ marginLeft: 20, textAlign: 'justify' }}>
                Tous les rapports ou autres documents, que l'enseignant prestataire préparera pour le compte du CAP dans le cadre du présent contrat deviendront et demeureront la propriété du CAP.
              </p>
              <p style={{ marginLeft: 20, textAlign: 'justify' }}>
                Ne sont pas pris en compte les cours et autres documents préparés par l'enseignant pour l'exécution de ses prestations.
              </p>
            </div>

            {/* Art. 8 */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 5 }}>8. Règlement des litiges</p>
              <p style={{ marginLeft: 20, textAlign: 'justify' }}>
                Pour tout ce qui n'est pas prévu au présent contrat, les parties se référeront aux lois béninoises en la matière. Tout litige survenu lors de l'exécution du présent contrat sera soumis aux juridictions compétentes, s'il n'est pas réglé à l'amiable ou par tout autre mode de règlement agréé par les deux parties.
              </p>
            </div>

            <p style={{ ...S.p, marginBottom: 24 }}>
              Fait en Trois (03) copies originales à l'Université d'Abomey-Calavi, le <strong>{formatDate(contrat.start_date)}</strong>
            </p>

            {/* ── Signatures — disposition exacte du document Word ── */}
            {/*
              Word layout (page ~595pt wide, margins ~27pt left, ~27pt right):
              Shape 0  left=27pt  w=240pt  → Enseignant label    (gauche)
              Shape 1  left=370pt w=205pt  → Pour le CAP + Chef + Fidèle  (droite)
              Shape 2  left=218pt w=225pt  → Le Directeur + Guy Alain     (centre)
              Shape 3  left=27pt  w=240pt  → ligne pointillée + nom        (sous enseignant)
            */}
            <div style={{ position: 'relative', marginTop: 20 }}>

              {/* Rangée 1 : Enseignant (gauche) + Pour le CAP (droite) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

                {/* GAUCHE : L'enseignant prestataire */}
                <div style={{ width: '40%', textAlign: 'center' }}>
                  <p style={{ fontStyle: 'italic', fontSize: '10.5pt', margin: '0 0 48px' }}>L'enseignant (e) prestataire,</p>
                  {/* Ligne pointillée de signature */}
                  <div style={{ borderBottom: '1px dotted #555', width: '80%', margin: '0 auto 6px' }} />
                  <p style={{ fontWeight: 'bold', fontSize: '10.5pt', margin: 0 }}>{prof?.full_name ?? '……………………………'}</p>
                </div>

                {/* DROITE : Pour le CAP, Le Chef, Fidèle Paul TCHOBO */}
                <div style={{ width: '34%', textAlign: 'center' }}>
                  <p style={{ fontWeight: 'bold', fontSize: '10.5pt', margin: '0 0 1px' }}>Pour le CAP,</p>
                  <p style={{ fontStyle: 'italic', fontSize: '10pt', margin: '0 0 48px' }}>Le Chef,</p>
                  <p style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '10.5pt', margin: '0 0 1px' }}>Fidèle Paul TCHOBO</p>
                  <p style={{ fontSize: '9.5pt', margin: 0 }}>Professeur Titulaire de Chimie Alimentaire</p>
                  <p style={{ fontSize: '9.5pt', margin: 0 }}><u>et</u> Chimie Analytique</p>
                </div>
              </div>

              {/* Rangée 2 : Le Directeur — centré entre les deux colonnes */}
              <div style={{ textAlign: 'center', marginTop: 28, width: '38%', marginLeft: 'auto', marginRight: 'auto' }}>
                <p style={{ fontWeight: 'bold', fontSize: '10.5pt', margin: '0 0 48px' }}>Le Directeur</p>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '10.5pt', margin: '0 0 1px' }}>Guy Alain ALITONOU</p>
                <p style={{ fontSize: '9.5pt', margin: 0 }}>Professeur Titulaire de Chimie organique</p>
                <p style={{ fontSize: '9.5pt', margin: 0 }}>et chimie des substances naturelles</p>
              </div>

            </div>

            {/* Note de bas de page */}
            <div style={{ borderTop: '1px solid #555', marginTop: 16, paddingTop: 4, fontSize: '8.5pt', fontFamily: 'Times New Roman, serif' }}>
              <sup>1</sup> ECUE : Élément Constitutif de l'Unité d'Enseignement
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const Contrats: React.FC = () => {
  const [contrats, setContrats]         = useState<Contrat[]>([]);
  const [professors, setProfessors]     = useState<Professor[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  // Modal states
  const [showCreate, setShowCreate]         = useState(false);
  const [editingContrat, setEditingContrat] = useState<Contrat | null>(null);
  const [pdfContrat, setPdfContrat]         = useState<Contrat | null>(null);
  const [pdfLoading, setPdfLoading]         = useState<number | null>(null); // id du contrat en chargement

  // Ouvre le PDF en rechargeant le contrat complet depuis l'API (pour avoir tous les champs du professeur)
  const openPdf = useCallback((c: Contrat) => {
    setPdfLoading(c.id);

    // Récupère le token Sanctum depuis le localStorage (clé standard de l'app)
    const token = localStorage.getItem('token')
      ?? localStorage.getItem('auth_token')
      ?? localStorage.getItem('sanctum_token')
      ?? '';

    const fetchFn: Promise<any> = typeof (rhService as any).getContrat === 'function'
      ? (rhService as any).getContrat(c.id)
      : fetch(`/api/rh/contrats/${c.id}`, {
          headers: {
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        }).then(r => r.json());

    fetchFn
      .then((r: any) => {
        const fresh = r.data ?? r ?? c;
        setPdfContrat(fresh);
      })
      .catch(() => setPdfContrat(c))  // fallback sur l'objet en mémoire
      .finally(() => setPdfLoading(null));
  }, []);

  // Confirm modals
  const [deleteConfirm, setDeleteConfirm] = useState<Contrat | null>(null);
  const [transferConfirm, setTransferConfirm] = useState<Contrat | null>(null);
  const [deleteLoading, setDeleteLoading]     = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  // Forms
  const [createForm, setCreateForm] = useState<FormState>({ ...emptyForm });
  const [editForm, setEditForm]     = useState<FormState>({ ...emptyForm });
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading]     = useState(false);
  const [createError, setCreateError]     = useState('');
  const [editError, setEditError]         = useState('');

  const { toasts, add: addToast, remove: removeToast } = useToasts();

  const reload = useCallback(() => {
    setLoading(true);
    rhService.getContrats()
      .then(r => { setContrats(r.data || []); setLoading(false); })
      .catch(() => { setError('Impossible de charger les contrats'); setLoading(false); });
  }, []);

  useEffect(() => {
    reload();
    rhService.getProfessors().then(r => setProfessors((r.data || []) as Professor[])).catch(() => {});
  }, [reload]);

  // ── Open edit ─────────────────────────────────────────────────────────────
  const openEdit = (c: Contrat) => {
    setEditForm({
      division:        c.division ?? '',
      professor_id:    String(c.professor_id),
      academic_year_id: String(c.academic_year_id),
      cycle_id:        c.cycle_id ? String(c.cycle_id) : '',
      regroupement:    c.regroupement ?? '',
      start_date:      c.start_date?.substring(0, 10) ?? '',
      end_date:        c.end_date?.substring(0, 10) ?? '',
      amount:          String(c.amount),
      notes:           c.notes ?? '',
      status:          c.status,
      program_ids:     (c.course_element_professors ?? []).map(p => p.id),
    });
    setEditingContrat(c);
    setEditError('');
  };

  const closeEdit   = () => { setEditingContrat(null); setEditError(''); };
  const closeCreate = () => { setShowCreate(false); setCreateError(''); setCreateForm({ ...emptyForm }); };

  const onFieldChange = (setter: React.Dispatch<React.SetStateAction<FormState>>) =>
    (name: string, value: string | number[]) => setter(f => ({ ...f, [name]: value }));

  // ── Payloads ──────────────────────────────────────────────────────────────
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
    ...buildCreate(f), status: f.status as ContratStatus,
    course_element_professor_ids: f.program_ids,
  });

  // ── Validation ────────────────────────────────────────────────────────────
  const validate = (f: FormState): string | null => {
    if (!f.division)         return 'Veuillez sélectionner une division.';
    if (!f.professor_id)     return 'Veuillez sélectionner un professeur.';
    if (!f.academic_year_id) return 'Veuillez sélectionner une année académique.';
    if (!f.regroupement)     return 'Veuillez sélectionner un regroupement.';
    if (!f.start_date)       return 'La date de début est obligatoire.';
    if (!f.amount || Number(f.amount) < 100) return "Le montant doit être d'au moins 100 FCFA.";
    return null;
  };

  // ── Create ────────────────────────────────────────────────────────────────
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate(createForm);
    if (err) { setCreateError(err); return; }
    setCreateLoading(true); setCreateError('');
    try {
      await rhService.createContrat(buildCreate(createForm));
      addToast('success', 'Contrat créé', 'Le contrat a été créé avec succès.');
      reload();
      setTimeout(closeCreate, 300);
    } catch (err: any) {
      setCreateError(err?.response?.data ? extractError(err.response.data, err?.response?.status || 500) : err.message || 'Erreur');
    } finally { setCreateLoading(false); }
  };

  // ── Update ────────────────────────────────────────────────────────────────
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContrat) return;
    const err = validate(editForm);
    if (err) { setEditError(err); return; }
    setEditLoading(true); setEditError('');
    try {
      await rhService.updateContrat(editingContrat.id, buildUpdate(editForm));
      addToast('success', 'Contrat modifié', 'Les modifications ont été enregistrées.');
      reload();
      setTimeout(closeEdit, 300);
    } catch (err: any) {
      setEditError(err?.response?.data ? extractError(err.response.data, err?.response?.status || 500) : err.message || 'Erreur');
    } finally { setEditLoading(false); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      await rhService.deleteContrat(deleteConfirm.id);
      addToast('success', 'Contrat supprimé', `Le contrat ${deleteConfirm.contrat_number} a été supprimé.`);
      setDeleteConfirm(null);
      reload();
    } catch (err: any) {
      addToast('error', 'Erreur de suppression', err?.response?.data?.message ?? err.message ?? 'Une erreur est survenue');
    } finally { setDeleteLoading(false); }
  };

  // ── Transfer ──────────────────────────────────────────────────────────────
  // Sets status to 'transfered' then triggers email notification via backend
  // Dans Contrats.tsx

const handleTransferConfirm = async () => {
  const c = transferConfirm;
  if (!c) return;
  setTransferLoading(true);
  try {
    // D'abord mettre à jour le statut
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
    
    // Ensuite envoyer l'email
    await rhService.sendTransferEmail(c.id);
    
    addToast('success', 'Contrat transféré', `Un e-mail de notification a été envoyé à ${c.professor?.full_name ?? "l'enseignant"}.`);
    setTransferConfirm(null);
    reload();
  } catch (err: any) {
    addToast('error', 'Erreur de transfert', err?.response?.data?.message ?? err.message ?? 'Une erreur est survenue');
  } finally { 
    setTransferLoading(false); 
  }
};

  const COLS = ['N° Contrat', 'Division', 'Cycle', 'Regroupement', 'Professeur', 'Année', 'Programmes', 'Début', 'Fin', 'Montant', 'Statut', 'Actions'];

  return (
    <div className="ctr-root" style={{ padding: '28px 32px', minHeight: '100vh', background: '#f8f9fb' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#0f172a', letterSpacing: '-.02em' }}>Contrats d'enseignement</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6c648b' }}>
            {loading ? 'Chargement…' : `${contrats.length} contrat${contrats.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      <button
     className="ctr-btn"
     style={{ height: 38, background: '#4F46E5', color: '#fff', border: 'none' }}
     onClick={() => { setShowCreate(true); setCreateError(''); setCreateForm({ ...emptyForm }); }}
   >
     <Icon.Plus /> Nouveau contrat
   </button>
      </div>

      {/* ── Table card ──────────────────────────────────────────────────────── */}
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
                {contrats.length === 0 ? (
                  <tr>
                    <td colSpan={COLS.length} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                      <div style={{ fontSize: 13 }}>Aucun contrat enregistré</div>
                    </td>
                  </tr>
                ) : contrats.map(c => {
                  const st = STATUS_CONFIG[c.status] ?? { label: c.status, color: '#374151', bg: '#f9fafb', dot: '#9ca3af' };
                  const isTransferred = c.status === 'transfered';
                  return (
                    <tr key={c.id}>
                      {/* N° */}
                      <td>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: '#1a1a2e', fontSize: 13 }}>
                          {c.contrat_number || `#${c.id}`}
                        </span>
                      </td>
                      {/* Division */}
                      <td>
                        {c.division
                          ? <span style={{ background: c.division === 'RD-FC' ? '#faf5ff' : '#fdf2f8', color: c.division === 'RD-FC' ? '#7c3aed' : '#9d174d', padding: '3px 10px', borderRadius: 999, fontSize: 11.5, fontWeight: 700 }}>{c.division}</span>
                          : <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                      {/* Cycle */}
                      <td style={{ color: '#64748b', fontSize: 13 }}>{c.cycle?.name ?? <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      {/* Regroupement */}
                      <td style={{ color: '#64748b', fontSize: 13 }}>{c.regroupement ? `Reg. ${c.regroupement === '1' ? 'I' : 'II'}` : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                      {/* Professeur */}
                      <td>
                        <span style={{ fontWeight: 500, color: '#0f172a', fontSize: 13 }}>
                          {c.professor?.full_name ?? `Prof. #${c.professor_id}`}
                        </span>
                      </td>
                      {/* Année */}
                      <td style={{ color: '#64748b', fontSize: 13, whiteSpace: 'nowrap' }}>
                        {(c as any).academic_year?.academic_year ?? <span style={{ color: '#d1d5db' }}>—</span>}
                      </td>
                      {/* Programmes */}
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
                      {/* Début / Fin */}
                      <td style={{ color: '#64748b', fontSize: 12.5, whiteSpace: 'nowrap' }}>{formatDate(c.start_date)}</td>
                      <td style={{ color: '#64748b', fontSize: 12.5, whiteSpace: 'nowrap' }}>{formatDate(c.end_date)}</td>
                      {/* Montant */}
                      <td>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, color: '#0f172a', fontSize: 12.5 }}>{formatAmount(c.amount)}</span>
                      </td>
                      {/* Statut */}
                      <td>
                        <span className="ctr-badge" style={{ background: st.bg, color: st.color }}>
                          <span className="ctr-badge-dot" style={{ background: st.dot }} />
                          {st.label}
                        </span>
                      </td>
                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          {/* Voir PDF */}
                          <button
                            className="ctr-btn-icon"
                            title="Aperçu du contrat"
                            onClick={() => openPdf(c)}
                            disabled={pdfLoading === c.id}
                            style={pdfLoading === c.id ? { opacity: 0.6 } : {}}
                          >
                            {pdfLoading === c.id
                              ? <span style={{ fontSize: 11, fontFamily: 'monospace' }}>…</span>
                              : <Icon.FileText />
                            }
                          </button>
                          {/* Transférer */}
                          <button
                            className="ctr-btn-icon"
                            title={isTransferred ? 'Contrat déjà transféré' : 'Transférer et notifier l\'enseignant'}
                            disabled={isTransferred}
                            onClick={() => !isTransferred && setTransferConfirm(c)}
                            style={isTransferred ? {} : { borderColor: '#c4b5fd', color: '#7c3aed' }}
                          >
                            <Icon.Send />
                          </button>
                          {/* Modifier */}
                          <button className="ctr-btn-icon" title="Modifier" onClick={() => openEdit(c)}>
                            <Icon.Edit />
                          </button>
                          {/* Supprimer */}
                          <button className="ctr-btn-icon" title="Supprimer" onClick={() => setDeleteConfirm(c)} style={{ borderColor: '#fecaca', color: '#dc2626' }}>
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

      {/* ── MODAL CRÉATION ──────────────────────────────────────────────────── */}
      {showCreate && (
        <Modal title="Nouveau contrat" subtitle="Renseigner les informations du contrat de prestation" onClose={closeCreate}>
          <ContratFormFields
            form={createForm} professors={professors}
            onFieldChange={onFieldChange(setCreateForm)}
            onSubmit={handleCreateSubmit} onCancel={closeCreate}
            loading={createLoading} error={createError}
            submitLabel="Créer le contrat" isEdit={false}
          />
        </Modal>
      )}

      {/* ── MODAL ÉDITION ───────────────────────────────────────────────────── */}
      {editingContrat && (
        <Modal
          title={`Modifier le contrat`}
          subtitle={`Contrat N° ${editingContrat.contrat_number || `#${editingContrat.id}`}`}
          onClose={closeEdit}
        >
          <ContratFormFields
            form={editForm} professors={professors}
            onFieldChange={onFieldChange(setEditForm)}
            onSubmit={handleEditSubmit} onCancel={closeEdit}
            loading={editLoading} error={editError}
            submitLabel="Enregistrer les modifications" isEdit={true}
          />
        </Modal>
      )}

      {/* ── MODAL PDF ───────────────────────────────────────────────────────── */}
      {pdfContrat && <ContratPdfModal contrat={pdfContrat} onClose={() => setPdfContrat(null)} />}

      {/* ── CONFIRM DELETE ──────────────────────────────────────────────────── */}
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

      {/* ── CONFIRM TRANSFER ────────────────────────────────────────────────── */}
      {transferConfirm && (
        <ConfirmModal
          title="Transférer le contrat"
          message={`Le contrat N° ${transferConfirm.contrat_number} passera au statut « Transféré ».`}
          detail={`Un e-mail de notification sera automatiquement envoyé à ${transferConfirm.professor?.full_name ?? "l'enseignant"} avec un lien pour consulter et valider le contrat.`}
          confirmLabel="Confirmer le transfert"
          confirmClass="ctr-btn-purple"
          iconBg="#faf5ff"
          iconColor="#7c3aed"
          icon={<Icon.Mail />}
          loading={transferLoading}
          onConfirm={handleTransferConfirm}
          onCancel={() => setTransferConfirm(null)}
        />
      )}

      {/* ── TOASTS ──────────────────────────────────────────────────────────── */}
      <ToastContainer toasts={toasts} remove={removeToast} />
    </div>
  );
};

export default Contrats;