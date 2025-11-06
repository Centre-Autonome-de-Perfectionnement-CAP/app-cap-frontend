import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilUserPlus,
  cilCalendar,
  cilList,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const financeNavigation = [
  {
    component: CNavTitle,
    name: 'Finance',
  },
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/finance/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
]

export default financeNavigation