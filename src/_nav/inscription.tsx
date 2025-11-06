import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilUserPlus,
  cilCalendar,
  cilList,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const inscriptionNavigation = [
  {
    component: CNavTitle,
    name: 'Inscription',
  },
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/inscription/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Étudiants en attente',
    to: '/inscription/pending-students',
    icon: <CIcon icon={cilUserPlus} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Années académiques',
    to: '/inscription/academics-years',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Liste des étudiants',
    to: '/inscription/students-list',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
  },
]

export default inscriptionNavigation