import CIcon from '@coreui/icons-react'
import {
  cilBook,
  cilPeople,
  cilClipboard,
} from '@coreui/icons'
import { CNavItem, CNavTitle, CNavGroup } from '@coreui/react'

const getNoteNavigation = (role: string | null) => {
  const navigation = [
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
    } as any)
  }

  // Section Administration - visible uniquement pour responsable-division
  if (role === 'responsable-division') {
    navigation.push(
      {
        component: CNavItem,
        name: 'Dashboard',
        to: '/notes/admin/dashboard',
      } as any,
      {
        component: CNavItem,
        name: 'Consultation Notes',
        to: '/notes/admin/consultation',
      } as any,
      {
        component: CNavItem,
        name: 'Décisions Semestre',
        to: '/notes/decisions/semester',
      } as any,
      {
        component: CNavItem,
        name: 'Décisions Année',
        to: '/notes/decisions/year',
      } as any
    )
  }

  return navigation
}

export default getNoteNavigation