// src/_nav/stages.tsx
// Navigation latérale du module Stages. Les superviseurs ne voient pas
// les pages réservées au responsable (attestations, superviseurs, groupe
// WhatsApp) ; le secrétariat ne voit que les attestations.
import CIcon from '@coreui/icons-react'
import { cilBriefcase, cilPeople, cilUserFollow, cilGroup, cilChatBubble, cilTask, cilDescription, cilBadge, cilSpeedometer, cilChartLine } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const getStagesNavigation = (role: string | null) => {
  const attestations = { component: CNavItem, name: 'Attestations', to: '/stages/attestations', icon: <CIcon icon={cilBadge} customClassName="nav-icon" /> }
  if (role === 'secretaire') return [{ component: CNavTitle, name: 'CAP Stages' }, attestations]
  const lead = role !== 'superviseur'
  return [
    { component: CNavTitle, name: 'CAP Stages' },
    { component: CNavItem, name: 'Tableau de bord', to: '/stages/tableau-de-bord', icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" /> },
    { component: CNavItem, name: 'Demandes de stage', to: '/stages/demandes', icon: <CIcon icon={cilBriefcase} customClassName="nav-icon" /> },
    { component: CNavItem, name: 'Stagiaires', to: '/stages/stagiaires', icon: <CIcon icon={cilPeople} customClassName="nav-icon" /> },
    { component: CNavItem, name: 'Suivi', to: '/stages/suivi', icon: <CIcon icon={cilChartLine} customClassName="nav-icon" /> },
    { component: CNavItem, name: 'Rapports', to: '/stages/rapports', icon: <CIcon icon={cilDescription} customClassName="nav-icon" /> },
    { component: CNavItem, name: 'Demandes des stagiaires', to: '/stages/demandes-stagiaires', icon: <CIcon icon={cilTask} customClassName="nav-icon" /> },
    { component: CNavItem, name: 'Binômes et groupes', to: '/stages/binomes', icon: <CIcon icon={cilGroup} customClassName="nav-icon" /> },
    ...(lead ? [
      attestations,
      { component: CNavItem, name: 'Superviseurs', to: '/stages/superviseurs', icon: <CIcon icon={cilUserFollow} customClassName="nav-icon" /> },
      { component: CNavItem, name: 'Groupe WhatsApp', to: '/stages/groupe-whatsapp', icon: <CIcon icon={cilChatBubble} customClassName="nav-icon" /> },
    ] : []),
  ]
}

export default getStagesNavigation
