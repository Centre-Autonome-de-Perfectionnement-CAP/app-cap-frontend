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

// ─── Types locaux ──────────────────────────────────────────────────────────────
type Professor = { id: number; full_name: string };
type ToastType = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: number; type: ToastType; title: string; message?: string }

// ─── Constantes ────────────────────────────────────────────────────────────────
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
  const prof       = contrat.professor;
  const year       = (contrat as any).academicYear?.academic_year ?? '—';
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

  const handlePrint = () => {
    const content = printRef.current?.innerHTML ?? '';
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>Contrat N° ${contrat.contrat_number}</title>
  <style>
    @page { size: A4; margin: 2.2cm 2cm; }
    * { box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; line-height: 1.65; margin: 0; }
    .header-band { background: #1a1a2e; color: #fff; padding: 14px 0 10px; text-align: center; margin-bottom: 28px; }
    .header-band h1 { margin: 0; font-size: 13pt; letter-spacing: .06em; font-weight: 700; }
    .header-band .sub { margin: 4px 0 0; font-size: 9.5pt; opacity: .8; }
    .ref { text-align: center; font-size: 10.5pt; margin-bottom: 22px; font-style: italic; color: #333; }
    .parties { margin-bottom: 18px; }
    .art { margin-bottom: 14px; page-break-inside: avoid; }
    .art-title { font-weight: bold; text-decoration: underline; margin-bottom: 6px; font-size: 11pt; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt; }
    th, td { border: 1px solid #555; padding: 5px 8px; }
    th { background: #e8e8e8; font-weight: bold; }
    ul { margin: 6px 0; padding-left: 22px; }
    li { margin-bottom: 3px; }
    .sig-zone { display: flex; justify-content: space-between; margin-top: 50px; }
    .sig-box { width: 42%; text-align: center; }
    .sig-label { font-weight: bold; margin-bottom: 4px; font-size: 10.5pt; }
    .sig-line { border-top: 1px solid #000; margin-top: 80px; padding-top: 5px; font-size: 10pt; }
    p { margin: 4px 0 8px; }
  </style>
</head>
<body>${content}</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 400);
  };

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
      <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: 10, marginBottom: 4 }}>
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 4px 20px rgba(0,0,0,.09)', padding: '0', overflow: 'hidden' }}>
          <div ref={printRef}>
            {/* Header band */}
            <div style={{ background: '#1a1a2e', color: '#fff', padding: '18px 0 14px', textAlign: 'center', marginBottom: 28 }}>
              <h1 style={{ margin: 0, fontSize: '14pt', letterSpacing: '.06em', fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                CONTRAT DE PRESTATION D'ENSEIGNEMENT
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '10pt', opacity: .8, fontFamily: 'Georgia, serif' }}>
                Regroupement {reg} — Cycle : {cycle}
              </p>
            </div>

            <div style={{ padding: '0 32px 32px', fontFamily: 'Georgia, serif' }}>
              {/* Ref */}
              <p style={{ textAlign: 'center', fontSize: '10.5pt', marginBottom: 24, fontStyle: 'italic', color: '#444' }}>
                N° <strong>{contrat.contrat_number}</strong> /UAC/EPAC/CAP/{division}/ du {formatDate(contrat.start_date)}
              </p>

              {/* Parties */}
              <p style={{ marginBottom: 12 }}><strong>Entre :</strong></p>
              <p style={{ marginBottom: 12 }}>
                Le Centre Autonome de Perfectionnement de l'École Polytechnique d'Abomey-Calavi de l'Université d'Abomey-Calavi,
                Représenté par son Chef, Monsieur <strong>Fidèle Paul TCHOBO</strong>,
                Tél : (229) 01 99 54 62 67, E-mail : contact@cap-epac.online,
                ci-après dénommé <em>CAP</em> d'une part,
              </p>
              <p><strong>Et</strong></p>
              <p style={{ marginBottom: 4 }}><strong>Monsieur / Madame :</strong> {prof?.full_name ?? '…'}</p>
              <p style={{ marginBottom: 4 }}><strong>Nationalité :</strong> {(contrat as any).professor?.nationality ?? '………………'}</p>
              <p style={{ marginBottom: 4 }}><strong>Profession :</strong> {(contrat as any).professor?.profession ?? '………………'}</p>
              <p style={{ marginBottom: 4 }}><strong>Domicilié(e) à :</strong> {(contrat as any).professor?.city ?? '………'} / Parcelle {(contrat as any).professor?.plot_number ?? '…'}, Maison {(contrat as any).professor?.house_number ?? '…'}</p>
              <p style={{ marginBottom: 4 }}><strong>IFU :</strong> {(contrat as any).professor?.ifu_number ?? '………………………'}</p>
              <p style={{ marginBottom: 4 }}><strong>RIB :</strong> N° {(contrat as any).professor?.rib_number ?? '…'} / Banque : {(contrat as any).professor?.bank ?? '…'}</p>
              <p style={{ marginBottom: 4 }}><strong>Tél. :</strong> {(contrat as any).professor?.phone ?? '……………'} &nbsp; <strong>Email :</strong> {(contrat as any).professor?.email ?? '……………'}</p>
              <p style={{ marginBottom: 18 }}>ci-après dénommé « <strong>L'ENSEIGNANT PRESTATAIRE</strong> » d'autre part.</p>
              <p style={{ marginBottom: 18 }}>Les parties au présent contrat ont convenu de ce qui suit :</p>

              {/* Art. 1 */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 6 }}>1. Objet du contrat</p>
                <p>Le présent contrat a pour objet la fourniture de prestations d'enseignement au CAP dans les conditions de délai, normes académiques et de qualité conformément aux clauses et conditions ci-après énoncées.</p>
              </div>

              {/* Art. 2 */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 6 }}>2. Nature des prestations</p>
                <p>Le Centre retient par la présente les prestations de l'enseignant pour l'exécution des cours de :</p>
                {programmes.length > 0 ? (
                  <ul>{programmes.map(p => (
                    <li key={p.id}><strong>({p.course_element?.code ?? '—'})</strong> : {p.course_element?.name ?? '—'}{p.class_group ? ` en ${p.class_group.name}` : ''}</li>
                  ))}</ul>
                ) : <p style={{ color: '#666', fontStyle: 'italic' }}>Aucun programme sélectionné.</p>}
                <p>conformément aux exigences énumérées dans le cahier des charges joint au présent contrat.</p>
              </div>

              {/* Art. 3 */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 6 }}>3. Date de démarrage et calendrier</p>
                <p>La durée de la prestation est de <strong>{daysCount}</strong> jours ouvrables à partir du <strong>{formatDate(contrat.start_date)}</strong>.</p>
                {programmes.length > 0 && (
                  <table>
                    <thead><tr><th>ECUE (Code)</th><th>Intitulé</th><th>UE</th><th>Date début</th><th>Date fin</th></tr></thead>
                    <tbody>{programmes.map(p => (
                      <tr key={p.id}>
                        <td>{p.course_element?.code ?? '—'}</td>
                        <td>{p.course_element?.name ?? '—'}</td>
                        <td>{p.course_element?.teaching_unit?.name ?? '—'}</td>
                        <td>{formatDate(contrat.start_date)}</td>
                        <td>{formatDate(contrat.end_date)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                )}
              </div>

              {/* Art. 4 */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 6 }}>4. Temps de présence</p>
                <p>Dans l'exécution du présent contrat, « L'ENSEIGNANT PRESTATAIRE », <strong>{prof?.full_name ?? '…'}</strong>, assurera également la surveillance des évaluations. En outre, il surveillera les travaux de recherche des apprenants dans les conditions prévues par les textes du CAP.</p>
                <p>Conformément à l'arrêté N°0388/MESRS/DC/SGM/DPAF/DGES/CJ/SA/05 du 03/08/2022, les charges horaires sont fixées comme suit :</p>
                <ul>
                  <li>1h de Cours Théorique = 1h30 de Travaux Dirigés</li>
                  <li>1h de Cours Théorique = 2h de Travaux Pratiques</li>
                  <li>1h de Cours Théorique = 5h d'ateliers / sorties pédagogiques / Stage</li>
                </ul>
              </div>

              {/* Art. 5 */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 6 }}>5. Termes de paiement et prélèvements</p>
                <p>Le montant total des honoraires pour les prestations d'enseignement est de <strong>{formatAmount(contrat.amount)}</strong> brut, conformément aux exigences du CAP.</p>
                <p>Les paiements sont effectués en Francs CFA à la fin des prestations (dépôt de sujet, corrigé type et copies corrigées) dûment constatées par une attestation de service fait, par virement bancaire après prélèvement de l'AIB.</p>
              </div>

              {/* Art. 6 */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 6 }}>6. Normes de Performance</p>
                <p>L'enseignant prestataire s'engage à fournir les prestations conformément aux normes professionnelles, d'éthique et déontologiques les plus exigeantes. Il est systématiquement mis fin au présent contrat en cas de défaillance du prestataire constatée et motivée par écrit au CAP.</p>
              </div>

              {/* Art. 7 */}
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 6 }}>7. Droit de propriété et devoir de réserve</p>
                <p>Pendant la durée d'exécution du présent contrat et les cinq années suivant son expiration, l'enseignant prestataire ne divulguera aucune information exclusive ou confidentielle concernant le présent contrat, les affaires ou les documents du CAP sans autorisation écrite préalable.</p>
              </div>

              {/* Art. 8 */}
              <div style={{ marginBottom: 28 }}>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: 6 }}>8. Règlement des litiges</p>
                <p>Tout différend relatif à l'interprétation ou à l'exécution du présent contrat sera réglé à l'amiable entre les parties. À défaut de règlement amiable, le différend sera soumis à la juridiction compétente du Bénin.</p>
                <p>Fait à Abomey-Calavi le <strong>{formatDate(contrat.start_date)}</strong>, en deux (2) exemplaires originaux.</p>
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 48 }}>
                <div style={{ width: '42%', textAlign: 'center' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: 4 }}>Pour le CAP</p>
                  <p style={{ fontSize: '10pt', color: '#555', marginBottom: 4 }}>Le Chef du CAP</p>
                  <div style={{ borderTop: '1.5px solid #000', marginTop: 80, paddingTop: 5, fontSize: '10pt' }}>
                    Fidèle Paul TCHOBO
                  </div>
                </div>
                <div style={{ width: '42%', textAlign: 'center' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: 4 }}>L'Enseignant Prestataire</p>
                  <p style={{ fontSize: '10pt', color: '#555', marginBottom: 4 }}>Lu et approuvé</p>
                  <div style={{ borderTop: '1.5px solid #000', marginTop: 80, paddingTop: 5, fontSize: '10pt' }}>
                    {prof?.full_name ?? '……………………………'}
                  </div>
                </div>
              </div>
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
      addToast('success', 'Contrat transféré', `Un e-mail de notification a été envoyé à ${c.professor?.full_name ?? "l'enseignant"}.`);
      setTransferConfirm(null);
      reload();
    } catch (err: any) {
      addToast('error', 'Erreur de transfert', err?.response?.data?.message ?? err.message ?? 'Une erreur est survenue');
    } finally { setTransferLoading(false); }
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
     style={{ height: 40, background: '#4F46E5', color: '#fff', border: 'none' }}
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
                          <button className="ctr-btn-icon" title="Aperçu du contrat" onClick={() => setPdfContrat(c)}>
                            <Icon.FileText />
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
