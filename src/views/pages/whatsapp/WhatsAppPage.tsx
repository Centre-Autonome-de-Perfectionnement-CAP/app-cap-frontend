// src/views/pages/whatsapp/WhatsAppPage.tsx
//
// Shell commun à toutes les vues WhatsApp.
// Reçoit la vue active en prop depuis WhatsAppRoutes — c'est la sidebar
// qui gère la navigation, pas des boutons internes.

import React, { Suspense } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
} from '@coreui/react'
import ConnectionPanel   from './components/ConnectionPanel'
import MessagesTable     from './components/MessagesTable'
import StatsPanel        from './components/StatsPanel'

type View = 'connexion' | 'envoyes' | 'echoues' | 'statistiques'

const VIEW_LABELS: Record<View, string> = {
  connexion:     'Connexion WhatsApp',
  envoyes:       'Messages envoyés',
  echoues:       'Messages échoués',
  statistiques:  'Statistiques d\'envoi',
}

const VIEW_DESCRIPTIONS: Record<View, string> = {
  connexion:    'Gérez la connexion du compte WhatsApp et scannez le QR code.',
  envoyes:      'Historique de tous les messages envoyés avec succès, filtrables par module.',
  echoues:      'Messages non délivrés — consultez les erreurs et relancez les envois.',
  statistiques: 'Vue d\'ensemble des envois par statut et par module.',
}

interface Props {
  view: View
}

const WhatsAppPage: React.FC<Props> = ({ view }) => (
  <CRow>
    <CCol xs={12}>
      <CCard className="mb-4">
        <CCardHeader>
          <strong>{VIEW_LABELS[view]}</strong>
          <p className="text-muted mb-0 mt-1 small">{VIEW_DESCRIPTIONS[view]}</p>
        </CCardHeader>
        <CCardBody>
          {view === 'connexion'    && <ConnectionPanel />}
          {view === 'envoyes'      && <MessagesTable status="sent" />}
          {view === 'echoues'      && <MessagesTable status="failed" />}
          {view === 'statistiques' && <StatsPanel />}
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>
)

export default WhatsAppPage
