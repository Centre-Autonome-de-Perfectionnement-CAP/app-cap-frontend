import React from 'react'
import {
  CContainer,
  CHeader,
  CHeaderBrand,
  CHeaderNav,
  CAvatar,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CDropdownDivider,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilAccountLogout, cilUser } from '@coreui/icons'
import { useAuth } from '@/contexts/AuthContext'
import { getAssetUrl } from '@/utils/assets'

interface ResponsableLayoutProps {
  children: React.ReactNode
}

/**
 * Layout minimal réservé au responsable de classe.
 * Pas de sidebar admin — juste un header propre + contenu + footer.
 */
const ResponsableLayout: React.FC<ResponsableLayoutProps> = ({ children }) => {
  const { nom, prenoms, logout } = useAuth()

  const fullName = [prenoms, nom].filter(Boolean).join(' ') || 'Responsable'
  const initiale = fullName.charAt(0).toUpperCase()

  return (
    <div className="wrapper d-flex flex-column min-vh-100 bg-body-tertiary">

      {/* ── Header ── */}
      <CHeader position="sticky" className="mb-4 p-0 shadow-sm">
        <CContainer fluid className="px-4 d-flex align-items-center justify-content-between">

          {/* Logo + titre */}
          <CHeaderBrand className="d-flex align-items-center gap-2 text-decoration-none">
            <img
              src={getAssetUrl('images/cap-1.png')}
              alt="CAP"
              style={{ height: 38 }}
            />
            <span className="fw-bold text-primary d-none d-sm-inline">
              Espace Responsable de Classe
            </span>
          </CHeaderBrand>

          {/* Dropdown utilisateur */}
          <CHeaderNav>
            <CDropdown variant="nav-item" placement="bottom-end">
              <CDropdownToggle className="d-flex align-items-center gap-2 py-2" caret={false}>
                <CAvatar color="primary" textColor="white" size="sm">
                  {initiale}
                </CAvatar>
                <span className="fw-semibold d-none d-md-inline">{fullName}</span>
              </CDropdownToggle>
              <CDropdownMenu className="pt-0">
                <CDropdownItem className="fw-semibold py-2 text-muted" style={{ cursor: 'default' }}>
                  <CIcon icon={cilUser} className="me-2" />
                  {fullName}
                </CDropdownItem>
                <CDropdownDivider />
                <CDropdownItem
                  onClick={() => logout()}
                  className="text-danger"
                  style={{ cursor: 'pointer' }}
                >
                  <CIcon icon={cilAccountLogout} className="me-2" />
                  Se déconnecter
                </CDropdownItem>
              </CDropdownMenu>
            </CDropdown>
          </CHeaderNav>
        </CContainer>
      </CHeader>

      {/* ── Contenu principal ── */}
      <div className="body flex-grow-1">
        <CContainer lg className="px-4 py-3">
          {children}
        </CContainer>
      </div>

      {/* ── Footer ── */}
      <footer className="footer py-3 border-top text-center text-muted small">
        © {new Date().getFullYear()} Centre Autonome de Perfectionnement — École Polytechnique d'Abomey-Calavi
      </footer>
    </div>
  )
}

export default ResponsableLayout