// src/views/pages/demandes/WorkflowRouter.tsx
// Switch rôle → dashboard approprié. Indépendant du module attestation.

import { useContext } from 'react'
import { AuthContext } from '@/contexts'
import { CAlert } from '@coreui/react'
import SecretaireDashboard   from './dashboards/SecretaireDashboard'
import ChefDivisionDashboard from './dashboards/ChefDivisionDashboard'
import ComptableDashboard    from './dashboards/ComptableDashboard'
import ChefCapDashboard      from './dashboards/ChefCapDashboard'
import DirecteurDashboard    from './dashboards/DirecteurDashboard'

const WorkflowRouter = () => {
  const auth = useContext(AuthContext)
  const role = (auth?.role ?? null) as string | null

  switch (role) {
    case 'secretaire':
    case 'admin':
      return <SecretaireDashboard />
    case 'chef-division':
      return <ChefDivisionDashboard />
    case 'comptable':
      return <ComptableDashboard />
    case 'chef-cap':
      return <ChefCapDashboard />
    case 'directeur-adjoint':
      return <DirecteurDashboard role="directeur-adjoint" />
    case 'directeur':
      return <DirecteurDashboard role="directeur" />
    default:
      return (
        <CAlert color="warning" className="m-4">
          Ce module n'est pas accessible avec votre rôle.
        </CAlert>
      )
  }
}

export default WorkflowRouter
