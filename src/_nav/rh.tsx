import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilUser,
  cilPeople,
  cilFile,
  cilCommentSquare,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const rhNavigation = [
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

export default rhNavigation