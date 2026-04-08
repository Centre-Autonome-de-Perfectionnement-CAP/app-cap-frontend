// src/components/document-request/index.ts
export { WorkflowBadge, WorkflowTimeline } from './WorkflowBadge'
export { default as MotifModal }            from './MotifModal'
export { default as DossierFiles }          from './DossierFiles'

// src/hooks/attestation/index.ts — ajouter à l'export existant :
// export { default as useDocumentRequests } from './useDocumentRequests'

// src/views/pages/attestation/workflow/index.ts
export { default as WorkflowRouter }          from '../../views/pages/demandes/WorkflowRouter'
export { default as ChefDivisionDashboard }    from '../../views/pages/demandes/dashboards/ChefDivisionDashboard'
export { default as ComptableDashboard }       from '../../views/pages/demandes/dashboards/ComptableDashboard'
export { default as ChefCapDashboard }         from '../../views/pages/demandes/dashboards/ChefCapDashboard'
export { default as DirecteurDashboard }       from '../../views/pages/demandes/dashboards/DirecteurDashboard'
