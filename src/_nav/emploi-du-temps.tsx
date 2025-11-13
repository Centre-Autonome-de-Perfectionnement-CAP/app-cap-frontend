import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilCalendar,
  cilClock,
  cilList,
  cilPlus,
  cilPeople,
  cilHome,
  cilSettings,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const emploiNavigation = [
  {
    component: CNavTitle,
    name: 'Emploi du Temps',
  },
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/emploi-du-temps/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Calendrier',
    to: '/emploi-du-temps/calendar',
    icon: <CIcon icon={cilCalendar} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Créneaux Horaires',
    to: '/emploi-du-temps/time-slots',
    icon: <CIcon icon={cilClock} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Cours Programmés',
    to: '/emploi-du-temps/scheduled-courses',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Nouveau Cours',
    to: '/emploi-du-temps/new-course',
    icon: <CIcon icon={cilPlus} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Gestion',
  },
  {
    component: CNavItem,
    name: 'Professeurs',
    to: '/emploi/professors',
    icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Salles',
    to: '/emploi/rooms',
    icon: <CIcon icon={cilHome} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Configuration',
    to: '/emploi/settings',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
  },
]

export default emploiNavigation