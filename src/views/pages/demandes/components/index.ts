// src/views/pages/demandes/components/index.ts
// ─── Barrel unique — tout ce dont les dashboards ont besoin ──────────────────

// Tableau
export { default as DemandeTable }      from './table/DemandeTable'
export { default as useActionColumns }  from './table/useActionColumns'
export {
  ReferenceCell, EtudiantCell, TypeCell, DateCell,
  StatutCell, ChefDivisionTypeCell, SignatureTypeCell, ActionCell,
} from './table/TableCells'
export type { ColumnDef } from './table/DemandeTable'

// UI primitives
export { default as StatCard }          from './ui/StatCard'
export { default as TabBar }            from './ui/TabBar'
export { default as ActionButton }      from './ui/ActionButton'
export { default as RadioCard }         from './ui/RadioCard'

// Modal / Shell
export { default as DashboardShell }    from './modal/DashboardShell'
export { default as DemandeModalShell } from './modal/DemandeModalShell'
export { default as DemandeDetailBase } from './modal/DemandeDetailBase'
export { default as DemandeSearchBar }  from './modal/DemandeSearchBar'
export { default as FinancialPanel }    from './modal/FinancialPanel'
export { default as ConfirmCheckbox }   from './modal/ConfirmCheckbox'
export { ChefDivisionModal, ResendModal } from './modal/SecretaireModals'

// Constants (re-exportées pour que les dashboards n'aient qu'un import)
export { STATUS_COLORS, SECRETAIRE_TABS, SECRETAIRE_STAT_TABS } from '../constants/workflow'
export type { TabConfig, StatConfig } from '../constants/workflow'
