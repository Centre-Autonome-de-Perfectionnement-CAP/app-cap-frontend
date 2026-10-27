import CIcon from '@coreui/icons-react'
import {
  cilNotes,
  cilSpeedometer,
  cilUser,
  cilPeople,
  cilFile,
  cilCommentSquare,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const getRhNavigation = (role: string | null = null) => {
  const isResponsableDivision =
    role === 'responsable-division' ||
    role === 'chef-division' ||
    role === 'responsable'

  if (isResponsableDivision) {
    return [
      {
        component: CNavTitle,
        name: 'Ressources Humaines',
      },
      {
        component: CNavItem,
        name: 'Dashboard',
        to: '/rh/dashboard',
        icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Professeurs',
        to: '/rh/professors',
        icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Contrats & Monographies',
        to: '/rh/contrats',
        icon: <CIcon icon={cilNotes} className="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Gestion de Contenu',
        to: '/rh/content',
        icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
      },
    ]
  }

  return [
    {
      component: CNavTitle,
      name: 'Ressources Humaines',
    },
    {
      component: CNavItem,
      name: 'Dashboard',
      to: '/rh/dashboard',
      icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    },
    {
      component: CNavItem,
      name: 'Professeurs',
      to: '/rh/professors',
      icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
    },
    {
      component: CNavItem,
      name: 'Contrats',
      to: '/rh/contrats',
      icon: <CIcon icon={cilNotes} className="nav-icon" />,
    },
    {
      component: CNavItem,
      name: 'Signataires',
      to: '/rh/signataires',
      icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
    },
    {
      component: CNavItem,
      name: 'Utilisateurs Admin',
      to: '/rh/admin-users',
      icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
    },
    {
      component: CNavItem,
      name: 'Gestion de Contenu',
      to: '/rh/content',
      icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
    },
    {
      component: CNavItem,
      name: 'Groupes WhatsApp',
      to: '/rh/whatsapp-groups',
      icon: <CIcon icon={cilCommentSquare} customClassName="nav-icon" />,
    },
  ]
}

const rhNavigation = getRhNavigation(null)

export { getRhNavigation, rhNavigation }
export default getRhNavigation
