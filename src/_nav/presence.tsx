import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilSpeedometer, cilEducation, cilFingerprint } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const presenceNavigation = [
  {
    component: CNavTitle,
    name: 'ADMINISTRATION',
  },
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/presence/admin/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Management',
    to: '/presence/admin/management',
    icon: <CIcon icon={cilEducation} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Fingerprint',
    to: '/presence/admin/fingerprint',
    icon: <CIcon icon={cilFingerprint} customClassName="nav-icon" />,
  },
  
]

export default presenceNavigation