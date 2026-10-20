// src/_nav/stages.tsx
// Navigation latérale du module Stages.
import CIcon from '@coreui/icons-react'
import { cilBriefcase } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const stagesNavigation = [
  { component: CNavTitle, name: 'CAP Stages' },
  {
    component: CNavItem,
    name: 'Demandes de stage',
    to: '/stages',
    icon: <CIcon icon={cilBriefcase} customClassName="nav-icon" />,
  },
]

export default stagesNavigation
