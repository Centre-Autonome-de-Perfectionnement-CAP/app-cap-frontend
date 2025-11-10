import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const soutenanceNavigation = [
  {
    component: CNavTitle,
    name: 'Soutenance',
  },
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/soutenance/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
]

export default soutenanceNavigation