import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilList,
  cilPlus,
  cilSearch,
  cilNotes,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const getCahierNavigation = (role: string | null) => {
  const isProfesseur = role === 'professeur'

  if (isProfesseur) {
    return [
      {
        component: CNavTitle,
        name: 'Cahier de Texte',
      },
      {
        component: CNavItem,
        name: 'Tableau de bord',
        to: '/cahier-texte/dashboard',
        icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Mes entrées',
        to: '/cahier-texte/mes-entrees',
        icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Nouvelle entrée',
        to: '/cahier-texte/new',
        icon: <CIcon icon={cilPlus} customClassName="nav-icon" />,
      },
    ]
  }

  // Navigation complète pour admin / chef-division
  return [
    {
      component: CNavTitle,
      name: 'Cahier de Texte',
    },
    {
      component: CNavItem,
      name: 'Tableau de bord',
      to: '/cahier-texte/dashboard',
      icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    },
    {
      component: CNavItem,
      name: 'Toutes les entrées',
      to: '/cahier-texte/list',
      icon: <CIcon icon={cilList} customClassName="nav-icon" />,
    },
    {
      component: CNavItem,
      name: 'Nouvelle entrée',
      to: '/cahier-texte/new',
      icon: <CIcon icon={cilPlus} customClassName="nav-icon" />,
    },
    {
      component: CNavTitle,
      name: 'Consultation',
    },
    {
      component: CNavItem,
      name: 'Par classe',
      to: '/cahier-texte/by-class',
      icon: <CIcon icon={cilSearch} customClassName="nav-icon" />,
    },
  ]
}

export default getCahierNavigation
