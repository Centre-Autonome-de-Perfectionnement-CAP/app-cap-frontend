import React, { ReactNode } from 'react'
import { AppSidebar, AppFooter, AppHeader } from '../components/index.ts'

interface DefaultLayoutProps {
  children?: ReactNode;
}

const DefaultLayout: React.FC<DefaultLayoutProps> = ({ children }) => {
  return (
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1" style={{ width: '100%', padding: '20px' }}>
          {children}
        </div>
        <AppFooter />
      </div>
    </div>
  )
}

export default DefaultLayout
