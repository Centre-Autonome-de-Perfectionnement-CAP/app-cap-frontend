import CIcon from '@coreui/icons-react'
import { cilTask } from '@coreui/icons'
import { CNavItem, CNavTitle } from '@coreui/react'

const getLegacyPrepaNavigation = (role: string | null) => {
  // Module réservé au Chef CAP / Responsable Division (et son ancien nom)
  if (role !== 'chef-cap' && role !== 'responsable-division' && role !== 'chef-division') {
    return []
  }

  return [
    {
      component: CNavTitle,
      name: 'Rattachement Prépa',
    },
    {
      component: CNavItem,
      name: 'Historiques Prépa (< 2023)',
      to: '/legacy-prepa',
      icon: <CIcon icon={cilTask} customClassName="nav-icon" />,
    },
  ]
}

export default getLegacyPrepaNavigation