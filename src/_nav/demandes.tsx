// src/_nav/demandes.tsx
// Navigation latérale du module "CAP Demandes".
// Nouveau circuit :
//   Secrétaire → Comptable → Resp. Division → Chef CAP →
//   Sec. Dir. Adjointe → Directrice Adjointe → Sec. Directeur → Directeur

import CIcon from '@coreui/icons-react'
import { cilTask, cilDescription, cilPen, cilCheckAlt, cilSend } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'
import type { UserRole } from '@/constants'

const getDemandesNavigation = (role: UserRole | null) => {
  // ── Secrétaire / Admin ────────────────────────────────────────────────────
  if (role === 'secretaire' || role === 'admin') {
    return [
      { component: CNavTitle, name: 'CAP Demandes' },
      {
        component: CNavItem,
        name: 'Tableau de bord',
        to: '/demandes',
        icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
      },
    ]
  }

  // ── Comptable ─────────────────────────────────────────────────────────────
  if (role === 'comptable') {
    return [
      { component: CNavTitle, name: 'Vérification financière' },
      {
        component: CNavItem,
        name: 'Dossiers à vérifier',
        to: '/demandes',
        icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
      },
    ]
  }

  // ── Responsable Division ──────────────────────────────────────────────────
  if (role === 'chef-division') {
    return [
      { component: CNavTitle, name: 'Dossiers à valider' },
      {
        component: CNavItem,
        name: 'Dossiers en attente',
        to: '/demandes',
        icon: <CIcon icon={cilDescription} customClassName="nav-icon" />,
      },
    ]
  }

  // ── Chef CAP ──────────────────────────────────────────────────────────────
  if (role === 'chef-cap') {
    return [
      { component: CNavTitle, name: 'Signature / Paraphe' },
      {
        component: CNavItem,
        name: 'Documents à traiter',
        to: '/demandes',
        icon: <CIcon icon={cilPen} customClassName="nav-icon" />,
      },
    ]
  }

  // ── Sec. Directrice Adjointe ──────────────────────────────────────────────
  if ((role as string) === 'sec-da') {
    return [
      { component: CNavTitle, name: 'Sec. Dir. Adjointe' },
      {
        component: CNavItem,
        name: 'Documents à transmettre',
        to: '/demandes',
        icon: <CIcon icon={cilSend} customClassName="nav-icon" />,
      },
    ]
  }

  // ── Directrice Adjointe ───────────────────────────────────────────────────
  if ((role as string) === 'directrice-adjointe') {
    return [
      { component: CNavTitle, name: 'Signature' },
      {
        component: CNavItem,
        name: 'Documents à signer',
        to: '/demandes',
        icon: <CIcon icon={cilCheckAlt} customClassName="nav-icon" />,
      },
    ]
  }

  // ── Sec. Directeur ────────────────────────────────────────────────────────
  if ((role as string) === 'sec-dir') {
    return [
      { component: CNavTitle, name: 'Sec. Directeur' },
      {
        component: CNavItem,
        name: 'Documents à transmettre',
        to: '/demandes',
        icon: <CIcon icon={cilSend} customClassName="nav-icon" />,
      },
    ]
  }

  // ── Directeur ─────────────────────────────────────────────────────────────
  if ((role as string) === 'directeur') {
    return [
      { component: CNavTitle, name: 'Signature finale' },
      {
        component: CNavItem,
        name: 'Documents à signer',
        to: '/demandes',
        icon: <CIcon icon={cilCheckAlt} customClassName="nav-icon" />,
      },
    ]
  }

  return []
}

export default getDemandesNavigation
