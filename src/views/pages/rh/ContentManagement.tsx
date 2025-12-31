import React, { useState } from 'react'
import { CCard, CCardBody, CNav, CNavItem, CNavLink, CTabContent, CTabPane } from '@coreui/react'
import DocumentsManagement from './DocumentsManagement'
import InformationsManagement from './InformationsManagement'

const ContentManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'informations'>('documents')

  return (
    <CCard>
      <CCardBody>
        <CNav variant="tabs" role="tablist">
          <CNavItem>
            <CNavLink
              active={activeTab === 'documents'}
              onClick={() => setActiveTab('documents')}
              style={{ cursor: 'pointer' }}
            >
              <i className="bi bi-file-earmark-text me-2"></i>
              Documents Utiles
            </CNavLink>
          </CNavItem>
          <CNavItem>
            <CNavLink
              active={activeTab === 'informations'}
              onClick={() => setActiveTab('informations')}
              style={{ cursor: 'pointer' }}
            >
              <i className="bi bi-info-circle me-2"></i>
              Informations Importantes
            </CNavLink>
          </CNavItem>
        </CNav>
        <CTabContent className="mt-3">
          <CTabPane visible={activeTab === 'documents'}>
            <DocumentsManagement />
          </CTabPane>
          <CTabPane visible={activeTab === 'informations'}>
            <InformationsManagement />
          </CTabPane>
        </CTabContent>
      </CCardBody>
    </CCard>
  )
}

export default ContentManagement
