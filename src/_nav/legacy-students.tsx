import CIcon from '@coreui/icons-react'
import { cilFolderOpen, cilList, cilUserPlus } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const legacyStudentsNavigation = [
  {
    component: CNavTitle,
    name: 'Archives & Anciens Étudiants',
  },
  {
    component: CNavItem,
    name: 'Anciens Étudiants (< 2023)',
    to: '/legacy-students',
    icon: <CIcon icon={cilFolderOpen} customClassName="nav-icon" />,
    badge: { color: 'warning', text: 'Archives' },
  },
]

export default legacyStudentsNavigation
