import CIcon from '@coreui/icons-react'
import {
  cilCalendar,
  cilList,
  cilPeople,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const soutenanceNavigation = [
  {
    component: CNavTitle,
    name: 'Soutenance',
  },
  {
    component: CNavItem,
    name: 'Périodes de Soumission',
    to: '/soutenance/periods',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Liste des Soumissions',
    to: '/soutenance/submissions',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Constitution des Jurys',
    to: '/soutenance/jury',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
]

export default soutenanceNavigation