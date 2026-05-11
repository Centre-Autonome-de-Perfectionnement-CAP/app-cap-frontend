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
    name: "Dashboard",
    to: "/presence/admin/dashboard",
    icon: <CIcon icon={cilSpeedometer} className="nav-icon" />,
  },

  {
    component: CNavItem,
    name: "Management",
    to: "/presence/admin/management",
    icon: <CIcon icon={cilEducation} className="nav-icon" />,
  },

  {
    component: CNavItem,
    name: "Fingerprint",
    to: "/presence/admin/Fingerprint",
    icon: <CIcon icon={cilFingerprint} className="nav-icon" />,
  },
  {
  component: CNavItem,
  name: "Course Attendance",
  to: "/presence/admin/course-attendance",
  icon: <CIcon icon={cilEducation} className="nav-icon" />,
},

]

export default presenceNavigation