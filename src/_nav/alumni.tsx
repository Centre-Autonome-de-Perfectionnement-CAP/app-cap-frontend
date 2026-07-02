import CIcon from '@coreui/icons-react'
import { cilSpeedometer, cilPeople, cilList } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const alumniNavigation = [
  {
    component: CNavTitle,
    name: 'Alumni',
  },
  {
    component: CNavItem,
    name: 'Dashboard KPI',
    to: '/alumni/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Liste des Alumni',
    to: '/alumni/list',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
  },
]

export default alumniNavigation
