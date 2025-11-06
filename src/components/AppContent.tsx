import React, { Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { CContainer } from '@coreui/react'
import { FRONTEND_ROUTES, MODULES } from '@/constants'
import routes from '../routes.ts'
import type { RouteConfig } from '../types'
import LoadingSpinner from './common/LoadingSpinner.tsx'


const AppContent: React.FC = () => {
  const location = useLocation()
  
  const modulePrefixes = [
    `/${MODULES.INSCRIPTION}`,
    `/${MODULES.ATTESTATIONS}`,
    `/${MODULES.NOTES}`,
    `/${MODULES.RH}`,
    `/${MODULES.SOUTENANCES}`,
    `/${MODULES.EMPLOI_DU_TEMPS}`,
    `/${MODULES.CAHIER_TEXTE}`,
    `/${MODULES.PRESENCE}`,
    `/${MODULES.FINANCE}`,
    `/${MODULES.BIBLIOTHEQUE}`,
  ]
  
  const isModuleRoute = modulePrefixes.some((prefix: string) => location.pathname.startsWith(prefix))
  return (
    <CContainer style={{ maxWidth: '1600px' }}>
      <Suspense fallback={<LoadingSpinner message="Chargement de la page..." />}>
        {!isModuleRoute && (
          <Routes>
            {routes.map((route: RouteConfig, idx: number) => {
              return (
                route.element && (
                  <Route
                    key={idx}
                    path={route.path}
                    element={<route.element />}
                  />
                )
              )
            })}
            <Route path="/" element={<Navigate to={FRONTEND_ROUTES.PORTAIL} replace />} />
          </Routes>
        )}
      </Suspense>
    </CContainer>
  )
}

export default React.memo(AppContent)
