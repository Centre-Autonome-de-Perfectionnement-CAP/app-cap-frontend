import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const noteNavigation = [
  {
    component: CNavTitle,
    name: 'Notes',
  },
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/notes/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
]

export default noteNavigation