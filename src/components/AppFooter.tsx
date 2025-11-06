import React from 'react'
import { CFooter } from '@coreui/react'

const AppFooter = () => {
  return (
    <CFooter className="px-4">
      <div>
        <a href="https://cap-epac.online" target="_blank" rel="noopener noreferrer">
          CAP
        </a>
        <span className="ms-1">&copy; {new Date().getFullYear()} Cellule Informatique.</span>
      </div>
      <div className="ms-auto">
        <span className="me-1">Developpé par</span>
        <a href="https://cap-epac.online" target="_blank" rel="noopener noreferrer">
          Centre Autonome de Perfectionnement - EPAC
        </a>
      </div>
    </CFooter>
  )
}

export default React.memo(AppFooter)
