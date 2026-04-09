import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilList,
  cilBook,
  cilPlus,
  cilSearch,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const cahierNavigation = [
  {
    component: CNavTitle,
    name: 'Cahier de Texte',
  },
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/cahier-texte/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Liste des entrées',
    to: '/cahier-texte/list',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Nouvelle entrée',
    to: '/cahier-texte/new',
    icon: <CIcon icon={cilPlus} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Consultation',
  },
  {
    component: CNavItem,
    name: 'Par classe',
    to: '/cahier-texte/by-class',
    icon: <CIcon icon={cilSearch} customClassName="nav-icon" />,
  },
]

export default cahierNavigation