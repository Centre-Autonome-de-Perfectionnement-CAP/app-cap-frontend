// src/views/pages/whatsapp/components/StatsPanel.tsx
//
// Pattern identique au Dashboard RH : CWidgetStatsA pour les compteurs,
// CTable pour la ventilation par module.

import React, { useEffect, useState } from 'react'
import {
  CBadge,
  CCol,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CWidgetStatsA,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCheckCircle,
  cilXCircle,
  cilClock,
  cilLoop,
  cilChartPie,
} from '@coreui/icons'
import whatsappService, { type WhatsAppStats } from '@/services/whatsapp.service'
import { useToast } from '@/contexts'

const WIDGETS: Array<{
  key: keyof Pick<WhatsAppStats, 'sent' | 'failed' | 'queued' | 'sending' | 'total'>
  label: string
  color: string
  icon: any
}> = [
  { key: 'sent',    label: 'Envoyés',  color: 'success',   icon: cilCheckCircle },
  { key: 'failed',  label: 'Échoués',  color: 'danger',    icon: cilXCircle     },
  { key: 'queued',  label: 'En file',  color: 'secondary', icon: cilClock       },
  { key: 'sending', label: 'En cours', color: 'warning',   icon: cilLoop        },
  { key: 'total',   label: 'Total',    color: 'primary',   icon: cilChartPie    },
]

const StatsPanel: React.FC = () => {
  const [stats,   setStats]   = useState<WhatsAppStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { error } = useToast()

  useEffect(() => {
    whatsappService.getStats()
      .then(setStats)
      .catch((e) => error(e?.message ?? 'Impossible de charger les statistiques.'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return <div className="text-center py-5"><CSpinner color="primary" /></div>
  }

  return (
    <>
      {/* Compteurs */}
      <CRow className="g-3 mb-4">
        {WIDGETS.map(({ key, label, color, icon }) => (
          <CCol key={key} xs={6} md={4} xl>
            <CWidgetStatsA
              color={color as any}
              value={(stats?.[key] ?? 0).toString()}
              title={label}
              chart={<CIcon icon={icon} size="xl" />}
            />
          </CCol>
        ))}
      </CRow>

      {/* Ventilation par module */}
      {stats?.by_module && stats.by_module.length > 0 ? (
        <>
          <p className="text-muted small mb-2">Répartition par module</p>
          {/* Téléphone : une ligne par module */}
          <div className="d-md-none d-flex flex-column gap-2">
            {stats.by_module.map((row) => {
              const rate = row.total > 0 ? Math.round((row.sent / row.total) * 100) : 0
              return (
                <div key={row.module} className="border rounded-3 p-3 bg-white d-flex align-items-center gap-2 flex-wrap">
                  <CBadge color="info">{row.module}</CBadge>
                  <span className="text-success">{row.sent} envoyé{row.sent > 1 ? 's' : ''}</span>
                  <span className="text-danger">{row.failed} échoué{row.failed > 1 ? 's' : ''}</span>
                  <CBadge className="ms-auto" color={rate >= 90 ? 'success' : rate >= 70 ? 'warning' : 'danger'}>{rate}%</CBadge>
                </div>
              )
            })}
          </div>
          <div className="d-none d-md-block">
          <CTable hover responsive small>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Module</CTableHeaderCell>
                <CTableHeaderCell>Envoyés</CTableHeaderCell>
                <CTableHeaderCell>Échoués</CTableHeaderCell>
                <CTableHeaderCell>Total</CTableHeaderCell>
                <CTableHeaderCell>Taux de succès</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {stats.by_module.map((row) => {
                const rate = row.total > 0 ? Math.round((row.sent / row.total) * 100) : 0
                return (
                  <CTableRow key={row.module}>
                    <CTableDataCell>
                      <CBadge color="info">{row.module}</CBadge>
                    </CTableDataCell>
                    <CTableDataCell className="text-success">{row.sent}</CTableDataCell>
                    <CTableDataCell className="text-danger">{row.failed}</CTableDataCell>
                    <CTableDataCell><strong>{row.total}</strong></CTableDataCell>
                    <CTableDataCell>
                      <CBadge color={rate >= 90 ? 'success' : rate >= 70 ? 'warning' : 'danger'}>
                        {rate}%
                      </CBadge>
                    </CTableDataCell>
                  </CTableRow>
                )
              })}
            </CTableBody>
          </CTable>
          </div>
        </>
      ) : (
        <p className="text-muted text-center py-3 mb-0">Aucun envoi enregistré pour l'instant.</p>
      )}
    </>
  )
}

export default StatsPanel
