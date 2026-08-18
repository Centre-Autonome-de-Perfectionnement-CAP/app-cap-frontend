import CIcon from '@coreui/icons-react'
import { cilHistory } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const legacyStudentsNavigation = [
  {
    component: CNavTitle,
    name: 'Anciens Étudiants (< 2023)',
  },
  {
    component: CNavItem,
    name: 'Tableau de bord',
    to: '/legacy-students',
    icon: <CIcon icon={cilHistory} customClassName="nav-icon" />,
  },
]

export default legacyStudentsNavigation
