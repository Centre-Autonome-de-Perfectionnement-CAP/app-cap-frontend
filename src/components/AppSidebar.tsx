// src/components/AppSidebar.tsx
// MODIFICATION : suppression du bouton "Retour au Portail" pour les 4 rôles direction
// (sec-da, directrice-adjointe, sec-dir, directeur)
// Ces acteurs n'ont pas accès au portail et ne doivent pas savoir qu'il existe.

import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation, Link } from 'react-router-dom'
import { getAssetUrl } from '@/utils/assets'
import { useAuth } from '@/contexts'
import {
  CCloseButton, CSidebar, CSidebarBrand, CSidebarFooter,
  CSidebarHeader, CSidebarToggler, CNavItem,
} from '@coreui/react'
import { cilHome } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { AppSidebarNav } from './AppSidebarNav.tsx'
import {
  mainNavigation, emploiNavigation, inscriptionNavigation,
  attestationNavigation, getNoteNavigation, rhNavigation,
  soutenanceNavigation, coursNavigation, bibliothequeNavigation,
  financeNavigation, presenceNavigation, cahierNavigation,
  getDemandesNavigation,
} from '../_nav/index.tsx'

// Rôles qui n'ont pas accès au portail — pas de bouton "Retour au Portail"
const DIRECTION_ROLES_NO_PORTAL = ['sec-da', 'directrice-adjointe', 'sec-dir', 'directeur']

const AppSidebar = () => {
  const dispatch    = useDispatch()
  const location    = useLocation()
  const { role }    = useAuth()
  const unfoldable  = useSelector((state: any) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state: any) => state.sidebarShow)

  const getNavigationForPath = () => {
    const path = location.pathname
    if (path.startsWith('/inscription'))  return inscriptionNavigation
    if (path.startsWith('/demandes'))     return getDemandesNavigation(role)
    if (path.startsWith('/attestations')) return attestationNavigation
    if (path.startsWith('/notes'))        return getNoteNavigation(role)
    if (path.startsWith('/rh'))           return rhNavigation
    if (path.startsWith('/soutenance'))   return soutenanceNavigation
    if (path.startsWith('/emploi'))       return emploiNavigation
    if (path.startsWith('/cahier'))       return cahierNavigation
    if (path.startsWith('/presence'))     return presenceNavigation
    if (path.startsWith('/finance'))      return financeNavigation
    if (path.startsWith('/bibliotheque')) return bibliothequeNavigation
    if (path.startsWith('/cours'))        return coursNavigation
    return mainNavigation
  }

  const currentNavigation = getNavigationForPath()

  const isModule =
    location.pathname !== '/' &&
    !location.pathname.startsWith('/dashboard') &&
    !location.pathname.startsWith('/portail') &&
    location.pathname !== '/login' &&
    location.pathname !== '/register' &&
    location.pathname !== '/404' &&
    location.pathname !== '/500'

  // Pas de bouton "Retour au Portail" pour les rôles direction
  const isDirectionRole = DIRECTION_ROLES_NO_PORTAL.includes(role as string)

  const navigationWithHomeLink = isModule && !isDirectionRole
    ? [...currentNavigation, {
        component: CNavItem,
        name: 'Retour au Portail',
        to: '/portail',
        icon: <CIcon icon={cilHome} className="nav-icon" />,
      }]
    : currentNavigation

  return (
    <CSidebar
      className="border-end" colorScheme="dark" position="fixed"
      unfoldable={unfoldable} visible={sidebarShow}
      onVisibleChange={(visible: any) => dispatch({ type: 'set', sidebarShow: visible })}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand as={Link} to="/">
          <img className="sidebar-brand-full"   src={getAssetUrl('images/cap.png')} alt="logo-cap" height={70} />
          <img className="sidebar-brand-narrow" src={getAssetUrl('images/cap.png')} alt="logo-cap" height={70} />
        </CSidebarBrand>
        <CCloseButton className="d-lg-none" dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })} />
      </CSidebarHeader>
      <AppSidebarNav items={navigationWithHomeLink} />
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })} />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
