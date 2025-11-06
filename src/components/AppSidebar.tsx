import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation, Link } from 'react-router-dom'

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
  CNavItem
} from '@coreui/react'
import { cilHome } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { AppSidebarNav } from './AppSidebarNav.tsx'
import {
  mainNavigation,
  emploiNavigation,
  inscriptionNavigation,
  attestationNavigation,
  noteNavigation,
  rhNavigation,
  soutenanceNavigation,
  coursNavigation,
  bibliothequeNavigation,
  financeNavigation,
  presenceNavigation,
  cahierNavigation,
} from '../_nav/index.tsx'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const unfoldable = useSelector((state: any) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state: any) => state.sidebarShow)

  const getNavigationForPath = () => {
    const path = location.pathname

    if (path.startsWith('/inscription')) return inscriptionNavigation
    if (path.startsWith('/attestations')) return attestationNavigation
    if (path.startsWith('/notes')) return noteNavigation
    if (path.startsWith('/rh')) return rhNavigation
    if (path.startsWith('/soutenance')) return soutenanceNavigation
    if (path.startsWith('/emploi')) return emploiNavigation
    if (path.startsWith('/cahier')) return cahierNavigation
    if (path.startsWith('/presence')) return presenceNavigation
    if (path.startsWith('/finance')) return financeNavigation
    if (path.startsWith('/bibliotheque')) return bibliothequeNavigation
    if (path.startsWith('/cours')) return coursNavigation

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

  const navigationWithHomeLink = isModule
    ? [
        ...currentNavigation,
        {
          component: CNavItem,
          name: 'Retour au Portail',
          to: '/portail',
          icon: <CIcon icon={cilHome} className="nav-icon" />,
        },
      ]
    : currentNavigation

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible: any) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand as={Link} to="/">
          <img className="sidebar-brand-full" src='/public/images/cap.png' alt='logo-cap' height={70}/>
          <img className="sidebar-brand-narrow" src='/public/images/cap.png' alt='logo-cap' height={70}/>
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        />
      </CSidebarHeader>
      <AppSidebarNav items={navigationWithHomeLink} />
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
