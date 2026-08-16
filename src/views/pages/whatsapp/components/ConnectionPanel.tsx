// src/views/pages/whatsapp/components/ConnectionPanel.tsx
//
// Statut + QR + déconnexion — polling adaptatif (3s si déconnecté, 10s si connecté).
// Pas de sous-cartes — layout simple en lignes, conforme au style du projet.

import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  CAlert,
  CButton,
  CBadge,
  CCol,
  CRow,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilReload } from '@coreui/icons'
import whatsappService, { type WhatsAppStatus } from '@/services/whatsapp.service'
import { useToast } from '@/contexts'
import { STATUS_POLL_INTERVAL_MS } from '../constants'

const POLL_CONNECTED_MS = 10_000

const STATUS_CONFIG: Record<string, { label: string; color: 'success' | 'warning' | 'secondary' | 'danger' }> = {
  connected:    { label: 'Connecté',            color: 'success'   },
  connecting:   { label: 'Connexion en cours…', color: 'warning'   },
  disconnected: { label: 'Déconnecté',          color: 'secondary' },
  unreachable:  { label: 'Service injoignable', color: 'danger'    },
}

const ConnectionPanel: React.FC = () => {
  const [status,     setStatus]     = useState<WhatsAppStatus | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { success, error } = useToast()

  const fetchStatus = useCallback(async () => {
    try {
      const data = await whatsappService.getStatus()
      setStatus(data)
    } catch {
      setStatus(prev => prev ?? {
        node_running: false, status: 'unreachable',
        phone: null, display_name: null, connected_at: null, qr: null,
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const startPolling = useCallback((connected: boolean) => {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(fetchStatus, connected ? POLL_CONNECTED_MS : STATUS_POLL_INTERVAL_MS)
  }, [fetchStatus])

  useEffect(() => {
    fetchStatus()
    startPolling(false)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status) startPolling(status.status === 'connected')
  }, [status?.status]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    if (!window.confirm('Déconnecter la session WhatsApp active ?\nUn nouveau QR code sera requis.')) return
    setLoggingOut(true)
    try {
      const res = await whatsappService.logout()
      if (res.success) { success('Session déconnectée.'); fetchStatus() }
      else error('Impossible de déconnecter la session.')
    } catch (e: any) {
      error(e?.message ?? 'Erreur lors de la déconnexion.')
    } finally {
      setLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <CSpinner color="primary" />
        <p className="text-muted mt-2 mb-0 small">Chargement du statut…</p>
      </div>
    )
  }

  const cfg         = STATUS_CONFIG[status?.status ?? 'unreachable'] ?? STATUS_CONFIG.unreachable
  const isConnected = status?.status === 'connected'

  return (
    <>
      {/* Alerte service down */}
      {!status?.node_running && (
        <CAlert color="danger" className="mb-4">
          Le service WhatsApp (Node) ne répond pas.
          Démarrez-le avec <code>php artisan whatsapp:node:start</code> ou via Supervisor.
        </CAlert>
      )}

      <CRow className="g-4">
        {/* Colonne gauche — statut et infos */}
        <CCol xs={12} md={isConnected ? 5 : 12} lg={isConnected ? 4 : 12}>

          {/* Statut */}
          <div className="mb-4">
            <small className="text-muted text-uppercase fw-semibold d-block mb-2">État</small>
            <CBadge color={cfg.color} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
              {cfg.label}
            </CBadge>
          </div>

          {/* Infos si connecté */}
          {isConnected && (
            <div className="mb-4">
              <table className="table table-sm table-borderless mb-0">
                <tbody>
                  <tr>
                    <td className="text-muted ps-0" style={{ width: 130 }}>Numéro</td>
                    <td className="fw-semibold">
                      {status?.phone
                        ? status.phone.replace(/(\d{3})(\d{2})(\d{2})(\d{2})(\d{2})/, '+$1 $2 $3 $4 $5')
                        : <span className="text-muted fst-italic">Non renseigné</span>}
                    </td>
                  </tr>
                  <tr>
                    <td className="text-muted ps-0">Nom affiché</td>
                    <td className="fw-semibold">
                      {status?.display_name || <span className="text-muted fst-italic">Non renseigné</span>}
                    </td>
                  </tr>
                  {status?.connected_at && (
                    <tr>
                      <td className="text-muted ps-0">Connecté le</td>
                      <td className="fw-semibold">
                        {new Date(status.connected_at).toLocaleString('fr-FR')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Message si en attente de QR */}
          {!isConnected && status?.node_running && !status?.qr && (
            <p className="text-muted mb-4">
              En attente du QR code…
            </p>
          )}

          {/* Actions */}
          <div className="d-flex gap-2 flex-wrap">
            <CButton
              color="outline-secondary"
              size="sm"
              onClick={fetchStatus}
            >
              <CIcon icon={cilReload} className="me-1" />
              Actualiser
            </CButton>

            {isConnected && (
              <CButton
                color="danger"
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={loggingOut}
              >
                {loggingOut
                  ? <><CSpinner size="sm" className="me-1" />Déconnexion…</>
                  : 'Déconnecter la session'
                }
              </CButton>
            )}
          </div>
        </CCol>

        {/* Colonne droite — QR code */}
        {!isConnected && status?.qr && (
          <CCol xs={12} md={7} lg={8}>
            <div className="text-center">
              <small className="text-muted text-uppercase fw-semibold d-block mb-3">
                QR Code — à scanner avec WhatsApp
              </small>
              <img
                src={status.qr}
                alt="QR code WhatsApp"
                style={{
                  maxWidth: 240,
                  width: '100%',
                  border: '1px solid #dee2e6',
                  borderRadius: 8,
                  padding: 8,
                  background: '#fff',
                  display: 'block',
                  margin: '0 auto',
                }}
              />
              <p className="text-muted small mt-3 mb-0">
                WhatsApp → Paramètres → Appareils liés → Lier un appareil
                <br />
                Le QR se renouvelle automatiquement.
              </p>
            </div>
          </CCol>
        )}
      </CRow>
    </>
  )
}

export default ConnectionPanel
