// src/views/pages/demandes/WorkflowRouter.tsx
// Switch rôle → dashboard approprié.
// Nouveau circuit :
//   Secrétaire → Comptable → Resp. Division → Chef CAP →
//   Sec. Dir. Adjointe → Dir. Adjointe → Sec. Directeur → Directeur → Secrétaire (clôture)

import { useContext } from 'react'
import { AuthContext } from '@/contexts'
import { CAlert } from '@coreui/react'
import SecretaireDashboard        from './dashboards/SecretaireDashboard'
import ComptableDashboard         from './dashboards/ComptableDashboard'
import ChefDivisionDashboard      from './dashboards/ChefDivisionDashboard'
import ChefCapDashboard           from './dashboards/ChefCapDashboard'
import SecDirAdjointeDashboard    from './dashboards/SecDirAdjointeDashboard'
import DirectriceAdjointeDashboard from './dashboards/DirectriceAdjointeDashboard'
import SecDirecteurDashboard      from './dashboards/SecDirecteurDashboard'
import DirecteurDashboard         from './dashboards/DirecteurDashboard'

const WorkflowRouter = () => {
  const auth = useContext(AuthContext)
  const role = (auth?.role ?? null) as string | null

  switch (role) {
    case 'secretaire':
    case 'admin':
      return <SecretaireDashboard />
    case 'comptable':
      return <ComptableDashboard />
    case 'chef-division':
      return <ChefDivisionDashboard />
    case 'chef-cap':
      return <ChefCapDashboard />
    case 'sec-da':
      return <SecDirAdjointeDashboard />
    case 'directrice-adjointe':
      return <DirectriceAdjointeDashboard />
    case 'sec-dir':
      return <SecDirecteurDashboard />
    case 'directeur':
      return <DirecteurDashboard />
    default:
      return (
        <CAlert color="warning" className="m-4">
          Ce module n'est pas accessible avec votre rôle.
        </CAlert>
      )
  }
}

export default WorkflowRouter
