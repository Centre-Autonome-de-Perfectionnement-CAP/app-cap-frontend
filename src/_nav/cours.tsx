import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const coursNavigation = [
  {
    component: CNavTitle,
    name: 'Cours',
  },
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/cours/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
]

export default coursNavigation