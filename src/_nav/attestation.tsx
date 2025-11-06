import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilUserPlus,
  cilCalendar,
  cilList,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const attestationNavigation = [
  {
    component: CNavTitle,
    name: 'Attestation',
  },
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/attestation/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
]

export default attestationNavigation