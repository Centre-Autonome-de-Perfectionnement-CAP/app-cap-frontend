// src/views/pages/demandes/dashboards/SecretaireDashboard.tsx
// Modal mis à jour : utilise DemandeModalShell avec canClearFlag
// → l'onglet "Sous réserve" apparaît automatiquement via DemandeModalShell.

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CRow, CCol, CBadge } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilInbox, cilWarning, cilFlagAlt, cilCheckAlt, cilFolder,
  cilX, cilArrowCircleRight, cilBan, cilSend, cilSync,
} from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DemandeTable, DemandeModalShell, DemandeDetailBase,
  ResendModal, TabBar, ActionButton, StatCard, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell, StatutCell,
  SECRETAIRE_TABS, DemandeSearchBar,
} from '../components'
import { SecretaryFileUploader } from '@/components/document-request'
import { STATUS_COLORS } from '../constants/workflow'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import type { DocumentRequest } from '@/types/document-request.types'
import { ROLE_LABELS } from '@/types/document-request.types'

// ─── Bannière circuit de correction ───────────────────────────────────────────

const CorrectionCircuitBanner = ({ demande }: { demande: DocumentRequest }) => {
  const originLabel = demande.correction_origin_role
    ? (ROLE_LABELS[demande.correction_origin_role] ?? demande.correction_origin_role)
    : null

  return (
    <div style={{
      background: '#fef2f2',
      border: '1.5px solid #fca5a5',
      borderLeft: '5px solid #dc2626',
      borderRadius: 12,
      padding: '16px 18px',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: '50%',
          background: '#dc2626', color: '#fff',
          fontSize: '0.95rem', fontWeight: 900, flexShrink: 0,
        }}>⟳</span>
        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#7f1d1d' }}>
          Circuit de correction actif
        </span>
        <CBadge color="danger" style={{ fontSize: '0.8rem', marginLeft: 'auto', padding: '4px 10px' }}>
          Mode navette
        </CBadge>
      </div>

      <div style={{ fontSize: '0.875rem', color: '#991b1b', lineHeight: 1.65 }}>
        Utilisez <strong>«&nbsp;Gérer la navette&nbsp;»</strong> pour envoyer le dossier à un acteur,
        ou <strong>«&nbsp;Sortir du circuit&nbsp;»</strong> pour reprendre le workflow normal.
      </div>

      {originLabel && (
        <div style={{
          marginTop: 10, padding: '9px 14px', borderRadius: 8,
          background: 'rgba(255,255,255,0.75)', border: '1px solid #fecaca',
          fontSize: '0.875rem', color: '#7f1d1d',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CIcon icon={cilArrowCircleRight} style={{ width: 14, color: '#dc2626', flexShrink: 0 }} />
          En sortant du circuit, le dossier retourne chez <strong style={{ marginLeft: 4 }}>{originLabel}</strong>.
        </div>
      )}
    </div>
  )
}

// ─── Bannière navette en cours ────────────────────────────────────────────────

const NavetteEnCoursBanner = ({ demande }: { demande: DocumentRequest }) => {
  const { status, correction_origin_role } = demande
  const originLabel = correction_origin_role
    ? (ROLE_LABELS[correction_origin_role] ?? correction_origin_role)
    : null

  const statusLabels: Record<string, string> = {
    accounting_review:                 'Comptable',
    division_manager_review:           'Responsable Division',
    cap_manager_review:                'Chef CAP',
    deputy_director_secretary_review:  'Sec. Dir. Adjointe',
    deputy_director_review:            'Directrice Adjointe',
    director_secretary_review:         'Sec. Directeur',
    director_review:                   'Directeur',
  }

  return (
    <div style={{
      background: '#fff7ed',
      border: '1.5px solid #fed7aa',
      borderLeft: '5px solid #f97316',
      borderRadius: 12,
      padding: '16px 18px',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 28, height: 28, borderRadius: '50%',
          background: '#f97316', color: '#fff',
          fontSize: '0.95rem', fontWeight: 900, flexShrink: 0,
        }}>↺</span>
        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#7c2d12' }}>
          Navette active — dossier chez {statusLabels[status] ?? status}
        </span>
        <CBadge color="warning" style={{ fontSize: '0.8rem', marginLeft: 'auto', padding: '4px 10px', color: '#fff' }}>
          En attente
        </CBadge>
      </div>

      <div style={{ fontSize: '0.875rem', color: '#92400e', lineHeight: 1.65 }}>
        Ce dossier a été envoyé à <strong>{statusLabels[status] ?? status}</strong> pour correction.
        Il vous reviendra dès que l'acteur aura terminé.
        {originLabel && (
          <> Le problème initial a été signalé par <strong>{originLabel}</strong>.</>
        )}
      </div>
    </div>
  )
}

// ─── Modal de détail ──────────────────────────────────────────────────────────

const DetailModal = ({ demande, visible, onClose, onAction, onReload }: {
  demande: DocumentRequest
  visible: boolean
  onClose: () => void
  onAction: (action: string, extra?: Record<string, unknown>) => Promise<void>
  onReload: () => Promise<void>
}) => {
  const [loadingAction,    setLoadingAction]    = useState<string | null>(null)
  const [resendModal,      setResendModal]      = useState(false)
  const [rejectModal,      setRejectModal]      = useState(false)
  const [rejectFinalModal, setRejectFinalModal] = useState(false)

  const s         = demande.status
  const inCircuit = !!demande.is_in_correction_circuit
  // Navette active = circuit actif ET dossier PAS chez la secrétaire
  const navetteActive = inCircuit && s !== 'secretary_correction'

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoadingAction(action)
    try { await onAction(action, extra) } catch (e) { console.error(e) }
    finally { setLoadingAction(null) }
  }

  const footer = (
    <>
      <ActionButton label="Fermer" color="secondary" variant="ghost" onClick={onClose} disabled={!!loadingAction} />

      {/* SUBMITTED */}
      {s === 'submitted' && (<>
        <ActionButton
          label="Rejeter la demande"
          icon={cilBan}
          color="danger"
          variant="outline"
          disabled={!!loadingAction}
          onClick={() => setRejectModal(true)}
        />
        <ActionButton
          label="Valider → Comptable"
          icon={cilCheckAlt}
          color="primary"
          loading={loadingAction === 'secretaire_validate'}
          disabled={!!loadingAction && loadingAction !== 'secretaire_validate'}
          onClick={() => run('secretaire_validate')}
        />
      </>)}

      {/* CORRECTION */}
      {s === 'secretary_correction' && (<>
        <ActionButton
          label="Rejeter définitivement"
          icon={cilBan}
          color="danger"
          variant="outline"
          disabled={!!loadingAction}
          onClick={() => setRejectFinalModal(true)}
        />
        <ActionButton
          label={inCircuit ? 'Gérer la navette' : 'Renvoyer'}
          icon={cilSend}
          color={inCircuit ? 'warning' : 'info'}
          disabled={!!loadingAction}
          onClick={() => setResendModal(true)}
        />
      </>)}

      {/* READY */}
      {s === 'ready_for_pickup' && (
        <ActionButton
          label="Marquer comme retiré"
          icon={cilCheckAlt}
          color="success"
          loading={loadingAction === 'secretaire_deliver'}
          disabled={!!loadingAction && loadingAction !== 'secretaire_deliver'}
          onClick={() => run('secretaire_deliver')}
        />
      )}
    </>
  )

  return (<>
    {/* DemandeModalShell gère automatiquement l'onglet "Sous réserve" via has_flag */}
    <DemandeModalShell
      demande={demande}
      visible={visible}
      onClose={onClose}
      footer={footer}
      canClearFlag
      onFlagCleared={async () => { await onReload() }}
      onRefresh={onReload}
    >
      {navetteActive && <NavetteEnCoursBanner demande={demande} />}
      {inCircuit && s === 'secretary_correction' && <CorrectionCircuitBanner demande={demande} />}

      <DemandeDetailBase demande={demande} onRefresh={onReload}>
        {(s === 'submitted' || s === 'secretary_correction') && (
          <SecretaryFileUploader demandeId={demande.id} onSuccess={onReload} />
        )}
      </DemandeDetailBase>
    </DemandeModalShell>

    <ResendModal
      demande={demande}
      visible={resendModal}
      onClose={() => setResendModal(false)}
      onConfirm={(resendTo, chefDivType) => {
        setResendModal(false)
        run('secretaire_resend', { resend_to: resendTo, chef_division_type: chefDivType })
      }}
    />

    <MotifModal
      visible={rejectModal}
      title="Rejeter la demande"
      confirmLabel="Rejeter"
      confirmColor="danger"
      onClose={() => setRejectModal(false)}
      onConfirm={async motif => { setRejectModal(false); await run('secretaire_reject', { motif }) }}
    />
    <MotifModal
      visible={rejectFinalModal}
      title="Rejeter définitivement"
      confirmLabel="Rejeter définitivement"
      confirmColor="danger"
      onClose={() => setRejectFinalModal(false)}
      onConfirm={async motif => { setRejectFinalModal(false); await run('secretaire_reject_final', { motif }) }}
    />
  </>)
}

// ─── Vue principale ───────────────────────────────────────────────────────────

const BASE_COLUMNS = [
  { header: 'Référence', render: (d: DocumentRequest) => <ReferenceCell d={d} /> },
  { header: 'Étudiant',  render: (d: DocumentRequest) => <EtudiantCell d={d} /> },
  { header: 'Type',      render: (d: DocumentRequest) => <TypeCell d={d} /> },
  { header: 'Date',      render: (d: DocumentRequest) => <DateCell d={d} /> },
  { header: 'Statut',    render: (d: DocumentRequest) => <StatutCell d={d} /> },
]

const STAT_DEFS = [
  { key: 'submitted',            label: 'Nouvelles demandes', urgent: true,  icon: cilInbox    },
  { key: 'secretary_correction', label: 'À corriger',         urgent: true,  icon: cilWarning  },
  { key: 'circuit_correction',   label: 'Navette active',     urgent: true,  icon: cilSync     },
  { key: 'flagged',              label: 'Réserves actives',   urgent: true,  icon: cilFlagAlt  },
  { key: 'ready_for_pickup',     label: 'Prêts à retirer',    urgent: false, icon: cilCheckAlt },
  { key: 'picked_up',            label: 'Archivés',           urgent: false, icon: cilFolder   },
]

const SecretaireDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'submitted'

  const { demandes, loading, filters, setFilters, selected, detailOpen, openDetail, closeDetail, handleAction, reload } =
    useDemandesDashboard()

  const counts = SECRETAIRE_TABS.reduce((acc, tab) => {
    acc[tab.key] = demandes.filter(d => d.status === tab.key).length
    return acc
  }, {} as Record<string, number>)
  counts['flagged']            = demandes.filter(d => !!(d as any).has_flag).length
  counts['circuit_correction'] = demandes.filter(
    d => !!d.is_in_correction_circuit && d.status !== 'secretary_correction'
  ).length

  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  const visibleDemandes =
    activeTab === 'flagged'
      ? demandes.filter(d => !!(d as any).has_flag)
      : activeTab === 'circuit_correction'
        ? demandes.filter(d => !!d.is_in_correction_circuit && d.status !== 'secretary_correction')
        : demandes.filter(d => d.status === activeTab)

  return (
    <div>
      <CRow className="mb-4 g-3">
        {STAT_DEFS.map(s => {
          const palette = STATUS_COLORS[s.key] ?? STATUS_COLORS['submitted']
          return (
            <CCol key={s.key} md={2} sm={4}>
              <StatCard
                label={s.label}
                count={counts[s.key] ?? 0}
                color={palette.color}
                bg={palette.bg}
                text={palette.text}
                urgent={s.urgent}
                icon={<CIcon icon={s.icon} style={{ width: 14 }} />}
                onClick={() => setSearchParams({ tab: s.key })}
              />
            </CCol>
          )
        })}
      </CRow>

      <CCard className="border-0" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.07)', borderRadius: 14 }}>
        <CCardHeader className="bg-white" style={{
          borderBottom: '1px solid #f1f5f9', borderRadius: '14px 14px 0 0', padding: '18px 22px 14px',
        }}>
          <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.45rem', color: '#0f172a', letterSpacing: '-0.025em' }}>
                Gestion des demandes
              </div>
              <div style={{ fontSize: '1rem', color: '#64748b', marginTop: 2, fontWeight: 500 }}>
                Tableau de bord — Secrétariat
              </div>
            </div>
            <DemandeSearchBar
              search={filters.search ?? ''}
              onSearchChange={v => setFilters({ ...filters, search: v })}
              typeFilter={filters.type}
              onTypeChange={v => setFilters({ ...filters, type: v })}
              showTypeFilter
            />
          </div>
          <TabBar
            tabs={SECRETAIRE_TABS}
            activeKey={activeTab}
            counts={counts}
            onSelect={key => setSearchParams({ tab: key })}
          />
        </CCardHeader>

        <CCardBody style={{ padding: 0 }}>
          <DemandeTable
            demandes={visibleDemandes}
            loading={loading}
            columns={columns}
            emptyMessage={
              activeTab === 'flagged'
                ? 'Aucun dossier avec réserve active'
                : activeTab === 'circuit_correction'
                  ? 'Aucune navette active en ce moment'
                  : 'Aucune demande dans cette catégorie'
            }
            onRowClick={openDetail}
          />
        </CCardBody>
      </CCard>

      {selected && (
        <DetailModal
          demande={selected}
          visible={detailOpen}
          onClose={closeDetail}
          onAction={handleAction}
          onReload={reload}
        />
      )}
    </div>
  )
}

export default SecretaireDashboard
