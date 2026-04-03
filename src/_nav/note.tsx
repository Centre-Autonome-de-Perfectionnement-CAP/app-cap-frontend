import CIcon from '@coreui/icons-react'
import {
  cilBook,
  cilPeople,
  cilClipboard,
  cilFile,
  cilUser,
  cilList,
  cilDescription,
  cilCheckCircle,
  cilClock,
} from '@coreui/icons'
import { CNavItem, CNavTitle, CNavGroup } from '@coreui/react'

const getNoteNavigation = (role: string | null) => {
  const navigation: any[] = []

  // Navigation pour les professeurs
  if (role === 'professeur') {
    navigation.push(
      {
        component: CNavTitle,
        name: 'Enseignement',
      },
      {
        component: CNavItem,
        name: 'Mes Classes',
        to: '/notes/professor/dashboard',
        icon: <CIcon icon={cilBook} />,
      },
      {
        component: CNavTitle,
        name: 'Gestion RH',
      },
      {
        component: CNavItem,
        name: 'Mes Contrats',
        to: '/professor/contrats',
        icon: <CIcon icon={cilFile} />,
      },
      {
        component: CNavItem,
        name: 'Contrats en attente',
        to: '/professor/contrats?status=pending',
        icon: <CIcon icon={cilClock} />,
      },
      {
        component: CNavItem,
        name: 'Contrats signés',
        to: '/professor/contrats?status=signed',
        icon: <CIcon icon={cilCheckCircle} />,
      }
    )
  }

  // Navigation pour les administrateurs (chef-division, admin, scolarite, direction)
  if (role === 'chef-division' || role === 'admin' || role === 'scolarite' || role === 'direction') {
    navigation.push(
      {
        component: CNavTitle,
        name: 'Notes et Évaluations',
      },
      {
        component: CNavItem,
        name: 'Dashboard Notes',
        to: '/notes/admin/dashboard',
        icon: <CIcon icon={cilClipboard} />,
      },
      {
        component: CNavItem,
        name: 'Consultation Notes',
        to: '/notes/admin/consultation',
        icon: <CIcon icon={cilPeople} />,
      },
      {
        component: CNavGroup,
        name: 'Décisions',
        icon: <CIcon icon={cilDescription} />,
        items: [
          {
            component: CNavItem,
            name: 'Décisions Semestre',
            to: '/notes/decisions/semester',
          },
          {
            component: CNavItem,
            name: 'Décisions Année',
            to: '/notes/decisions/year',
          },
        ],
      },
      {
        component: CNavTitle,
        name: 'Gestion des Contrats RH',
      },
      {
        component: CNavItem,
        name: 'Tous les contrats',
        to: '/rh/contrats',
        icon: <CIcon icon={cilList} />,
      },
      {
        component: CNavItem,
        name: 'Contrats en attente',
        to: '/rh/contrats?status=pending',
        icon: <CIcon icon={cilClock} />,
      },
      {
        component: CNavItem,
        name: 'Contrats validés',
        to: '/rh/contrats?status=signed',
        icon: <CIcon icon={cilCheckCircle} />,
      }
    )
  }

  return navigation
}

export default getNoteNavigation
