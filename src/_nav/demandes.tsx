// src/_nav/demandes.tsx
// Navigation latérale du module "CAP Demandes".
// Remplace _nav/workflow.tsx — indépendant du module attestation.

import CIcon from '@coreui/icons-react'
import { cilTask, cilDescription, cilPen, cilCheckAlt } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'
import type { UserRole } from '@/constants'

const getDemandesNavigation = (role: UserRole | null) => {
  if (role === 'secretaire' || role === 'admin') {
    return [
      { component: CNavTitle, name: 'CAP Demandes' },
      {
        component: CNavItem,
        name: 'Tableau de bord',
        to: '/demandes',
        icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
      },
    ]
  }
  if (role === 'chef-division') {
    return [
      { component: CNavTitle, name: 'Dossiers à valider' },
      {
        component: CNavItem,
        name: 'Dossiers en attente',
        to: '/demandes',
        icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
      },
    ]
  }
  if (role === 'comptable') {
    return [
      { component: CNavTitle, name: 'Vérification financière' },
      {
        component: CNavItem,
        name: 'Dossiers à vérifier',
        to: '/demandes',
        icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
      },
    ]
  }
  if (role === 'chef-cap') {
    return [
      { component: CNavTitle, name: 'Signature / Paraphe' },
      {
        component: CNavItem,
        name: 'Documents à traiter',
        to: '/demandes',
        icon: <CIcon icon={cilPen} customClassName="nav-icon" />,
      },
    ]
  }
  if ((role as string) === 'directeur-adjoint' || (role as string) === 'directeur') {
    return [
      { component: CNavTitle, name: 'Signature' },
      {
        component: CNavItem,
        name: 'Documents à signer',
        to: '/demandes',
        icon: <CIcon icon={cilCheckAlt} customClassName="nav-icon" />,
      },
    ]
  }
  return []
}

export default getDemandesNavigation
