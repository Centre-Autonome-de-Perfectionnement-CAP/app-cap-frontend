// src/views/pages/demandes/components/index.ts
export { default as DashboardShell }    from './DashboardShell'
export { default as DemandeStat }       from './DemandeStat'
export { default as DemandeSearchBar }  from './DemandeSearchBar'
export { default as DemandeTable }      from './DemandeTable'
export { default as DemandeDetailBase } from './DemandeDetailBase'
export { default as DemandeModalShell } from './DemandeModalShell'
export { default as ConfirmCheckbox }   from './ConfirmCheckbox'
export { default as FinancialPanel }    from './FinancialPanel'
export { ChefDivisionModal, ResendModal } from './SecretaireModals'

// Cellules de tableau prédéfinies
export {
  ReferenceCell, EtudiantCell, TypeCell, DateCell,
  StatutCell, ChefDivisionTypeCell, SignatureTypeCell, ActionCell,
} from './DemandeTable'

export type { ColumnDef } from './DemandeTable'
