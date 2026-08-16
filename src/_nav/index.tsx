// src/_nav/index.tsx
import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBell, cilCalculator, cilChartPie, cilCursor, cilExternalLink,
  cilNotes, cilPencil, cilDrop, cilPuzzle, cilSpeedometer, cilStar,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

import inscriptionNavigation  from './inscription.tsx'
import alumniNavigation       from './alumni.tsx'
import getEmploiNavigation    from './emploi-du-temps.tsx'
import rhNavigation           from './rh.tsx'
import soutenanceNavigation   from './soutenance.tsx'
import coursNavigation        from './cours.tsx'
import financeNavigation      from './finance.tsx'
import bibliothequeNavigation from './bibliotheque.tsx'
import attestationNavigation  from './attestation.tsx'
import presenceNavigation     from './presence.tsx'
import getNoteNavigation      from './note.tsx'
import getCahierNavigation    from './cahier.tsx'
import getDemandesNavigation  from './demandes.tsx'   // ← remplace workflow.tsx
import whatsappNavigation     from './whatsapp.tsx'

const mainNavigationBase = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} className="nav-icon" />,
    badge: { color: 'info', text: 'NEW' },
  },
  { component: CNavTitle, name: 'Alumni' },
  { component: CNavItem, name: 'Fiches Alumni', to: '/alumni/list', icon: <CIcon icon={cilStar} className="nav-icon" /> },
  { component: CNavTitle, name: 'Theme' },
  { component: CNavItem, name: 'Colors',     to: '/theme/colors',     icon: <CIcon icon={cilDrop}   className="nav-icon" /> },
  { component: CNavItem, name: 'Typography', to: '/theme/typography', icon: <CIcon icon={cilPencil} className="nav-icon" /> },
  { component: CNavTitle, name: 'Components' },
  {
    component: CNavGroup,
    name: 'Base',
    to: '/base',
    icon: <CIcon icon={cilPuzzle} className="nav-icon" />,
    items: [
      { component: CNavItem, name: 'Accordion',    to: '/base/accordion' },
      { component: CNavItem, name: 'Breadcrumb',   to: '/base/breadcrumbs' },
      { component: CNavItem, name: 'Cards',        to: '/base/cards' },
      { component: CNavItem, name: 'Carousel',     to: '/base/carousels' },
      { component: CNavItem, name: 'Collapse',     to: '/base/collapses' },
      { component: CNavItem, name: 'List group',   to: '/base/list-groups' },
      { component: CNavItem, name: 'Navs & Tabs',  to: '/base/navs' },
      { component: CNavItem, name: 'Pagination',   to: '/base/paginations' },
      { component: CNavItem, name: 'Placeholders', to: '/base/placeholders' },
      { component: CNavItem, name: 'Popovers',     to: '/base/popovers' },
      { component: CNavItem, name: 'Progress',     to: '/base/progress' },
      { component: CNavItem, name: 'Spinners',     to: '/base/spinners' },
      { component: CNavItem, name: 'Tables',       to: '/base/tables' },
      { component: CNavItem, name: 'Tabs',         to: '/base/tabs' },
      { component: CNavItem, name: 'Tooltips',     to: '/base/tooltips' },
    ],
  },
  {
    component: CNavGroup,
    name: 'Buttons',
    to: '/buttons',
    icon: <CIcon icon={cilCursor} className="nav-icon" />,
    items: [
      { component: CNavItem, name: 'Buttons',        to: '/buttons/buttons' },
      { component: CNavItem, name: 'Buttons groups', to: '/buttons/button-groups' },
      { component: CNavItem, name: 'Dropdowns',      to: '/buttons/dropdowns' },
    ],
  },
  {
    component: CNavGroup,
    name: 'Forms',
    icon: <CIcon icon={cilNotes} className="nav-icon" />,
    items: [
      { component: CNavItem, name: 'Checks & Radios', to: '/forms/checks-radios' },
      { component: CNavItem, name: 'Floating Labels', to: '/forms/floating-labels' },
      { component: CNavItem, name: 'Form Control',    to: '/forms/form-control' },
      { component: CNavItem, name: 'Input Group',     to: '/forms/input-group' },
      { component: CNavItem, name: 'Layout',          to: '/forms/layout' },
      { component: CNavItem, name: 'Range',           to: '/forms/range' },
      { component: CNavItem, name: 'Select',          to: '/forms/select' },
      { component: CNavItem, name: 'Validation',      to: '/forms/validation' },
    ],
  },
  { component: CNavItem, name: 'Charts', to: '/charts', icon: <CIcon icon={cilChartPie} className="nav-icon" /> },
  {
    component: CNavGroup,
    name: 'Icons',
    icon: <CIcon icon={cilStar} className="nav-icon" />,
    items: [
      { component: CNavItem, name: 'CoreUI Free',   to: '/icons/coreui-icons' },
      { component: CNavItem, name: 'CoreUI Flags',  to: '/icons/flags' },
      { component: CNavItem, name: 'CoreUI Brands', to: '/icons/brands' },
    ],
  },
  {
    component: CNavGroup,
    name: 'Notifications',
    icon: <CIcon icon={cilBell} className="nav-icon" />,
    items: [
      { component: CNavItem, name: 'Alerts',  to: '/notifications/alerts' },
      { component: CNavItem, name: 'Badges',  to: '/notifications/badges' },
      { component: CNavItem, name: 'Modal',   to: '/notifications/modals' },
      { component: CNavItem, name: 'Toasts',  to: '/notifications/toasts' },
    ],
  },
  { component: CNavItem, name: 'Widgets', to: '/widgets', icon: <CIcon icon={cilCalculator} className="nav-icon" />, badge: { color: 'info', text: 'NEW' } },
  { component: CNavTitle, name: 'Extras' },
  {
    component: CNavGroup,
    name: 'Pages',
    icon: <CIcon icon={cilStar} className="nav-icon" />,
    items: [
      { component: CNavItem, name: 'Portail',   to: '/portail' },
      { component: CNavItem, name: 'Login',     to: '/login' },
      { component: CNavItem, name: 'Register',  to: '/register' },
      { component: CNavItem, name: 'Error 404', to: '/404' },
      { component: CNavItem, name: 'Error 500', to: '/500' },
    ],
  },
]

// mainNavigation conservé tel quel (nom + forme inchangés) pour ne rien
// casser côté AppSidebar si jamais réutilisé ailleurs.
const mainNavigation = mainNavigationBase

// AJOUT (15/08/2026) — entrée WhatsApp admin, visible uniquement pour le
// rôle 'admin' strict (décision utilisateur). Suit le même pattern que
// getDemandesNavigation/getNoteNavigation : une fonction du rôle plutôt
// qu'un tableau statique, pour permettre le filtrage conditionnel.
const getMainNavigation = (role: string | null) => {
  if (role !== 'admin' && role !== 'responsable-division') {
    return mainNavigationBase
  }

  return [
    ...mainNavigationBase,
    { component: CNavTitle, name: 'Administration' },
    {
      component: CNavItem,
      name: 'WhatsApp',
      to: '/whatsapp',
      icon: <CIcon icon={cilBell} className="nav-icon" />,
    },
  ]
}

export {
  mainNavigation,
  getMainNavigation,
  inscriptionNavigation,
  alumniNavigation,
  getEmploiNavigation,
  attestationNavigation,
  bibliothequeNavigation,
  financeNavigation,
  coursNavigation,
  getCahierNavigation,
  soutenanceNavigation,
  rhNavigation,
  presenceNavigation,
  getNoteNavigation,
  getDemandesNavigation,
  whatsappNavigation,
}
