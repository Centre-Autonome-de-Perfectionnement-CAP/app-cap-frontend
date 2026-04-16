// src/views/pages/demandes/components/layout/DirectionHeader.tsx
// Header institutionnel pour les 4 rôles de la direction.
// Logos CAP (gauche) + EPAC (droite encadré), nom/photo/déconnexion à droite.

import { useContext } from 'react'
import { AuthContext } from '@/contexts'
import capLogo  from '@/assets/images/cap.png'

interface Props {
  title: string
  subtitle: string
}

// Initiales depuis un nom complet
const getInitials = (name: string) =>
  name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

const DirectionHeader = ({ title, subtitle }: Props) => {
  const auth = useContext(AuthContext)
  const fullName = (auth as any)?.user?.name ?? (auth as any)?.name ?? 'Utilisateur'
  const avatarUrl = (auth as any)?.user?.avatar ?? null

  const handleLogout = () => {
    if ((auth as any)?.logout) (auth as any).logout()
    else window.location.href = '/logout'
  }

  return (
    <>
      <style>{`
        @keyframes dir-header-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dir-header-logout:hover {
          background: #dc2626 !important;
          color: #fff !important;
          border-color: #dc2626 !important;
        }
      `}</style>

      <header style={{
        background: 'linear-gradient(135deg, #0c1e3e 0%, #1a3a6b 60%, #0f4c8a 100%)',
        borderBottom: '3px solid #d4a843',
        padding: '0 32px',
        height: 76,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        animation: 'dir-header-in 0.3s ease',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      }}>

        {/* ── Gauche : logos CAP + EPAC ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          {/* Logo CAP */}
          <div style={{
            background: '#fff',
            borderRadius: 10,
            padding: '5px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            height: 50,
          }}>
            <img
              src={capLogo}
              alt="CAP"
              style={{ height: 38, width: 'auto', objectFit: 'contain', display: 'block' }}
            />
          </div>

          {/* Séparateur */}
          <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.2)' }} />

          {/* Logo EPAC (texte institutionnel stylisé) */}
          <div style={{
            border: '1.5px solid rgba(212,168,67,0.7)',
            borderRadius: 8,
            padding: '5px 12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 1,
          }}>
            <span style={{
              fontSize: '1.05rem', fontWeight: 900,
              color: '#d4a843', letterSpacing: '0.12em',
              lineHeight: 1,
            }}>
              EPAC
            </span>
            <span style={{
              fontSize: '0.53rem', color: 'rgba(212,168,67,0.75)',
              letterSpacing: '0.05em', textTransform: 'uppercase',
              lineHeight: 1, textAlign: 'center',
            }}>
              École Polytechnique
            </span>
          </div>
        </div>

        {/* ── Centre : titre ── */}
        <div style={{ flex: 1, textAlign: 'center', minWidth: 0 }}>
          <div style={{
            fontSize: '1rem', fontWeight: 800,
            color: '#fff', letterSpacing: '-0.01em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {title}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>
            {subtitle}
          </div>
        </div>

        {/* ── Droite : profil + déconnexion ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          {/* Avatar + nom */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                style={{
                  width: 38, height: 38, borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(212,168,67,0.6)',
                }}
              />
            ) : (
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                border: '2px solid rgba(212,168,67,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.78rem', fontWeight: 800, color: '#fff',
                flexShrink: 0,
              }}>
                {getInitials(fullName)}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.82rem', fontWeight: 700, color: '#fff',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: 160,
              }}>
                {fullName}
              </div>
              <div style={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>
                {subtitle}
              </div>
            </div>
          </div>

          {/* Bouton déconnexion */}
          <button
            className="dir-header-logout"
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1.5px solid rgba(255,255,255,0.3)',
              color: 'rgba(255,255,255,0.75)',
              borderRadius: 7,
              padding: '6px 14px',
              fontSize: '0.76rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            Déconnexion
          </button>
        </div>
      </header>
    </>
  )
}

export default DirectionHeader
