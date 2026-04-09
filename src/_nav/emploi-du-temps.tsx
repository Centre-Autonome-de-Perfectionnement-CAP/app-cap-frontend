import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilCalendar,
  cilClock,
  cilList,
  cilBuilding,
  cilRoom,
  cilPencil,
  cilSearch,
  cilReload,
  cilLightbulb,
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
    name: 'Cours Planifiés',
    to: '/emploi-du-temps/scheduled-courses',
    icon: <CIcon icon={cilList} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Consulter Emplois',
    to: '/emploi-du-temps/schedule-views',
    icon: <CIcon icon={cilSearch} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Gestion',
  },
  {
    component: CNavItem,
    name: 'Générer Automatiquement',
    to: '/emploi-du-temps/generate-schedule',
    icon: <CIcon icon={cilLightbulb} customClassName="nav-icon" />,
    badge: {
      color: 'success',
      text: 'IA',
    },
  },
  {
    component: CNavItem,
    name: 'Reconduire Emploi',
    to: '/emploi-du-temps/renew-schedule',
    icon: <CIcon icon={cilReload} customClassName="nav-icon" />,
  },
  {
    component: CNavTitle,
    name: 'Configuration',
  },
  {
    component: CNavItem,
    name: 'Bâtiments',
    to: '/emploi-du-temps/buildings',
    icon: <CIcon icon={cilBuilding} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Salles',
    to: '/emploi-du-temps/rooms',
    icon: <CIcon icon={cilRoom} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Créneaux Horaires',
    to: '/emploi-du-temps/time-slots',
    icon: <CIcon icon={cilClock} customClassName="nav-icon" />,
  },
]

export default emploiNavigation