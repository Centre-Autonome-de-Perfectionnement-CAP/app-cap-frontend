// src/views/pages/whatsapp/WhatsAppDashboard.tsx
//
// Pattern conforme au reste du projet :
//   - Un seul CCard avec CCardHeader (like Professors, AdminUsers, WhatsAppGroups)
//   - Navigation entre sections via CButtonGroup dans le header (pattern natif CoreUI)
//   - Pas de CNav/CTabContent qui génèrent des styles parasites dans ce template

import React, { useState } from 'react'
import {
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilPhone,
  cilCheckCircle,
  cilXCircle,
  cilChartPie,
} from '@coreui/icons'
import ConnectionPanel from './components/ConnectionPanel'
import MessagesTable   from './components/MessagesTable'
import StatsPanel      from './components/StatsPanel'

type Section = 'connexion' | 'envoyes' | 'echoues' | 'statistiques'

const SECTIONS: Array<{ key: Section; label: string; icon: any }> = [
  { key: 'connexion',     label: 'Connexion',        icon: cilPhone        },
  { key: 'envoyes',      label: 'Envoyés',           icon: cilCheckCircle  },
  { key: 'echoues',      label: 'Échoués',           icon: cilXCircle      },
  { key: 'statistiques', label: 'Statistiques',      icon: cilChartPie     },
]

const WhatsAppDashboard: React.FC = () => {
  const [active, setActive] = useState<Section>('connexion')

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <strong>Administration WhatsApp</strong>
              <CButtonGroup role="group">
                {SECTIONS.map(({ key, label, icon }) => (
                  <CButton
                    key={key}
                    color={active === key ? 'primary' : 'outline-primary'}
                    onClick={() => setActive(key)}
                    size="sm"
                  >
                    <CIcon icon={icon} className="me-1" />
                    {label}
                  </CButton>
                ))}
              </CButtonGroup>
            </CCardHeader>

            <CCardBody>
              {active === 'connexion'     && <ConnectionPanel />}
              {active === 'envoyes'       && <MessagesTable status="sent" />}
              {active === 'echoues'       && <MessagesTable status="failed" />}
              {active === 'statistiques'  && <StatsPanel />}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default WhatsAppDashboard
