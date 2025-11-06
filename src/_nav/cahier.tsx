import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilUserPlus,
  cilCalendar,
  cilList,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const cahierNavigation = [
  {
    component: CNavTitle,
    name: 'Cahier',
  },
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/cahier/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
]

export default cahierNavigation