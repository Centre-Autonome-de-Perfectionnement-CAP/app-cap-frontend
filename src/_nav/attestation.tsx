// src/_nav/attestation.tsx
// Navigation du module Attestation — génération de documents uniquement.
// La gestion des demandes (workflow) est dans _nav/demandes.tsx

import CIcon from '@coreui/icons-react'
import { cilCheckAlt, cilEducation, cilNotes, cilFile, cilDescription, cilCreditCard } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const attestationNavigation = [
  { component: CNavTitle, name: 'Attestations' },
  {
    component: CNavItem,
    name: 'Attestation de passage',
    to: '/attestations/passage',
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
  {
    component: CNavItem,
    name: 'Attestation de fin de cycle',
    to: '/attestations/definitive',
    icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
  },
  {
    component: CNavItem,
    name: "Attestation d'inscription",
    to: '/attestations/inscription',
    icon: <CIcon icon={cilCreditCard} customClassName="nav-icon" />,
  },
]

export default attestationNavigation
