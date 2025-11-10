import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const presenceNavigation = [
  {
    component: CNavTitle,
    name: 'Presence',
  },
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/presence/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
]

export default presenceNavigation