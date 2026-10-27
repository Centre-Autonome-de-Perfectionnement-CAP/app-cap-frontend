// src/_nav/whatsapp.tsx
// Navigation de la sidebar pour le module Administration WhatsApp.
// Minimaliste : titre du module + 4 sections + retour au portail.

import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilPhone,
  cilCheckCircle,
  cilXCircle,
  cilChartPie,
  cilHome,
} from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const whatsappNavigation = [
  { component: CNavTitle, name: 'WhatsApp' },
  {
    component: CNavItem,
    name: 'Connexion',
    to: '/whatsapp',
    icon: <CIcon icon={cilPhone} className="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Messages envoyés',
    to: '/whatsapp/messages/sent',
    icon: <CIcon icon={cilCheckCircle} className="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Messages échoués',
    to: '/whatsapp/messages/failed',
    icon: <CIcon icon={cilXCircle} className="nav-icon" />,
  },
  {
    component: CNavItem,
    name: 'Statistiques',
    to: '/whatsapp/stats',
    icon: <CIcon icon={cilChartPie} className="nav-icon" />,
  },
  { component: CNavTitle, name: '' },
  {
    component: CNavItem,
    name: 'Retour au Portail',
    to: '/portail',
    icon: <CIcon icon={cilHome} className="nav-icon" />,
  },
]

export default whatsappNavigation
