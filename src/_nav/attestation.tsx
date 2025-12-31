import CIcon from '@coreui/icons-react'
import {
  cilCheckAlt,
  cilEducation,
  cilNotes,
  cilFile,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const attestationNavigation = [
  {
    component: CNavTitle,
    name: 'Attestations',
  },
  {
    component: CNavItem,
    name: 'Attestation de succès',
    to: '/attestations/success',
    icon: <CIcon icon={cilCheckAlt} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Certificat classes préparatoires',
    to: '/attestations/preparatory',
    icon: <CIcon icon={cilEducation} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Bulletins',
    to: '/attestations/bulletins',
    icon: <CIcon icon={cilNotes} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Attestation de Licence',
    to: '/attestations/licence',
    icon: <CIcon icon={cilFile} customClassName="nav-icon" />,
  },
]

export default attestationNavigation
