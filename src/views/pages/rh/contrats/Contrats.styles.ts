// src/views/pages/rh/contrats/Contrats.styles.ts
// Extrait tel quel de Contrats.tsx (aucune modification de contenu) — CSS injecté globalement
// par le composant racine Contrats.tsx via <style>{GLOBAL_STYLE}</style>.

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

export default GLOBAL_STYLE
