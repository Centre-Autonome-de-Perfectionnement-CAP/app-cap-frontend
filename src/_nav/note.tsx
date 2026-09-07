import CIcon from '@coreui/icons-react'
import {
  cilBook,
  cilPeople,
  cilClipboard,
  cilSpeedometer,
  cilCheckCircle,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const getNoteNavigation = (role: string | null) => {
  const navigation: any[] = [
    {
      component: CNavTitle,
      name: 'Notes',
    },
  ]

  // Section Professeur - visible uniquement pour les professeurs
  if (role === 'professeur') {
    navigation.push({
      component: CNavItem,
      name: 'Mes Classes',
      to: '/notes/professor/dashboard',
      icon: <CIcon icon={cilBook} customClassName="nav-icon" />,
    })
    return navigation
  }

  // Section Administration & Délibérations - visible pour l'administration (admin, chef-division, responsable, etc.)
  navigation.push(
    {
      component: CNavItem,
      name: 'Dashboard',
      to: '/notes/admin/dashboard',
      icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    },
    {
      component: CNavItem,
      name: 'Consultation Notes',
      to: '/notes/admin/consultation',
      icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
    },
    {
      component: CNavTitle,
      name: 'Délibérations',
    },
    {
      component: CNavItem,
      name: 'Délibération Semestre',
      to: '/notes/decisions/semester',
      icon: <CIcon icon={cilClipboard} customClassName="nav-icon" />,
    },
    {
      component: CNavItem,
      name: 'Délibération Année',
      to: '/notes/decisions/year',
      icon: <CIcon icon={cilCheckCircle} customClassName="nav-icon" />,
    }
  )

  return navigation
}

export default getNoteNavigation