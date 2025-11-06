import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilUserPlus,
  cilCalendar,
  cilList,
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
]

export default rhNavigation