import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilList,
  cilDescription,
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
    component: CNavTitle,
    name: 'Gestion RH',
  },
  {
    component: CNavItem,
    name: 'Factures normalisées',
    to: '/cahier-texte/factures',
    icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
  },
]

export default cahierNavigation