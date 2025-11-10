import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const biblithequeNavigation = [
  {
    component: CNavTitle,
    name: 'Bibliotheque',
  },
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/biblitheque/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
]

export default biblithequeNavigation