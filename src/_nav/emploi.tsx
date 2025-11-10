import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const emploiNavigation = [
  {
    component: CNavTitle,
    name: 'Emploi du Temps',
  },
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/emploi/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
]

export default emploiNavigation