// src/views/pages/demandes/dashboards/SecretaireDashboard.tsx
// Modal mis à jour : utilise DemandeModalShell avec canClearFlag
// → l'onglet "Sous réserve" apparaît automatiquement via DemandeModalShell.

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CIcon from '@coreui/icons-react'
import {
  cilInbox, cilWarning, cilFlagAlt, cilCheckAlt, cilFolder,
  cilBan, cilSend, cilSync, cilCommentBubble, cilPen,
} from '@coreui/icons'
import { MotifModal } from '@/components/document-request'
import ContactDemandeurModal from '../components/modal/ContactDemandeurModal'
import useDemandesDashboard from '../hooks/useDemandesDashboard'
import {
  DemandeTable, DemandeModalShell, DemandeDetailBase,
  ResendModal, TabBar, ActionButton, StatCard, useActionColumns,
  ReferenceCell, EtudiantCell, TypeCell, DateCell, StatutCell,
  SECRETAIRE_TABS, DemandeSearchBar, LegacyDeclarationPanel, StatusNote,
} from '../components'
import { CCard, CCardBody, CCardHeader } from '@coreui/react'
import type { DocumentRequest } from '@/types/document-request.types'
import { isLegacyDemande } from '@/types/document-request.types'
import { ROLE_LABELS } from '@/types/document-request.types'

// ─── Notes d'état (sobres) ────────────────────────────────────────────────────

const STEP_HOLDER: Record<string, string> = {
  accounting_review:                'le Comptable',
  division_manager_review:          'le Responsable de division',
  cap_manager_review:               'le Chef CAP',
  deputy_director_secretary_review: 'le Secrétariat de la Directrice Adjointe',
  deputy_director_review:           'la Directrice Adjointe',
  director_secretary_review:        'le Secrétariat du Directeur',
  director_review:                  'le Directeur',
}

const SecretaireStatusNote = ({ demande }: { demande: DocumentRequest }) => {
  const s         = demande.status
  const inCircuit = !!demande.is_in_correction_circuit
  const origin    = demande.correction_origin_role
    ? (ROLE_LABELS[demande.correction_origin_role] ?? demande.correction_origin_role)
    : null

  if (s === 'secretary_correction') {
    return (
      <StatusNote title="Dossier revenu pour correction">
        {origin ? <>{origin} a signalé un point à revoir. </> : <>Un point est à revoir. </>}
        Faites la correction, puis cliquez sur <strong>Renvoyer le dossier</strong> : le motif y est rappelé.
      </StatusNote>
    )
  }
  if (inCircuit && STEP_HOLDER[s]) {
    return (
      <StatusNote tone="waiting" title={`Dossier chez ${STEP_HOLDER[s]} pour correction`}>
        Il vous reviendra automatiquement dès que la correction sera faite. Aucune action n'est nécessaire.
      </StatusNote>
    )
  }
  if (s === 'secretary_final_review') {
    return (
      <StatusNote tone="done" title="Signé par le Directeur">
        Préparez le document, puis cliquez sur <strong>Document prêt</strong> pour prévenir l'étudiant.
      </StatusNote>
    )
  }
  return null
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
  const [contactModal,     setContactModal]     = useState(false)

  const s         = demande.status
  // Ancien étudiant : transmission bloquée tant que la déclaration n'est pas validée (D1)
  const isLegacy          = isLegacyDemande(demande)
  const legacyNotValidated = isLegacy && demande.legacy_declaration_status !== 'validated'

  const run = async (action: string, extra?: Record<string, unknown>) => {
    setLoadingAction(action)
    try { await onAction(action, extra) } catch (e) { console.error(e) }
    finally { setLoadingAction(null) }
  }

  const footer = (
    <>
      <ActionButton label="Fermer" color="secondary" variant="ghost" onClick={onClose} disabled={!!loadingAction} />

      {/* Contacter le demandeur — visible quel que soit le statut, secrétaire uniquement */}
      <ActionButton
        label="Contacter le demandeur"
        icon={cilCommentBubble}
        color="primary"
        variant="outline"
        disabled={!!loadingAction}
        onClick={() => setContactModal(true)}
      />

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
          label={legacyNotValidated ? "Transmettre au Comptable (valider d'abord la déclaration)" : 'Valider et transmettre au Comptable'}
          icon={cilCheckAlt}
          color="primary"
          loading={loadingAction === 'secretaire_validate'}
          disabled={legacyNotValidated || (!!loadingAction && loadingAction !== 'secretaire_validate')}
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
          label="Renvoyer le dossier"
          icon={cilSend}
          color="primary"
          disabled={!!loadingAction}
          onClick={() => setResendModal(true)}
        />
      </>)}

      {/* READY */}
      {s === 'ready_for_pickup' && (
        <ActionButton
          label="Document remis à l'étudiant"
          icon={cilCheckAlt}
          color="success"
          loading={loadingAction === 'secretaire_deliver'}
          disabled={!!loadingAction && loadingAction !== 'secretaire_deliver'}
          onClick={() => run('secretaire_deliver')}
        />
      )}

      {/* FINALISATION APRÈS SIGNATURE DIRECTEUR */}
      {s === 'secretary_final_review' && (
        <ActionButton
          label="Document prêt"
          icon={cilCheckAlt}
          color="success"
          loading={loadingAction === 'secretaire_mark_ready'}
          disabled={!!loadingAction && loadingAction !== 'secretaire_mark_ready'}
          onClick={() => run('secretaire_mark_ready')}
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
      <SecretaireStatusNote demande={demande} />
      {isLegacy && (
        <LegacyDeclarationPanel
          demande={demande}
          canDecide={s !== 'rejected' && s !== 'picked_up'}
          onChanged={onReload}
        />
      )}

      <DemandeDetailBase demande={demande} onRefresh={onReload}>
        {null}
      </DemandeDetailBase>
    </DemandeModalShell>

    <ResendModal
      visible={resendModal}
      demande={demande}
      onClose={() => setResendModal(false)}
      onConfirm={(resendTo) => {
        setResendModal(false)
        run('secretaire_resend', { resend_to: resendTo })
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

    <ContactDemandeurModal
      demande={demande}
      visible={contactModal}
      onClose={() => setContactModal(false)}
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

// Cartes de la secrétaire. `blink` : clignote tant qu'il y a des dossiers
// qui attendent SON action ; les cartes d'information restent fixes.
const CIRCUIT_STATUSES = [
  'accounting_review', 'division_manager_review', 'cap_manager_review',
  'deputy_director_secretary_review', 'deputy_director_review',
  'director_secretary_review', 'director_review',
]

const STAT_DEFS = [
  { key: 'submitted',              label: 'Nouvelles demandes',  blink: true,  icon: cilInbox,    color: '#d97706', bg: '#fef3c7' },
  { key: 'secretary_correction',   label: 'À corriger',          blink: true,  icon: cilWarning,  color: '#dc2626', bg: '#fee2e2' },
  { key: 'secretary_final_review', label: 'À finaliser',         blink: true,  icon: cilPen,      color: '#0d9488', bg: '#ccfbf1' },
  { key: 'ready_for_pickup',       label: 'Prêts à retirer',     blink: true,  icon: cilCheckAlt, color: '#059669', bg: '#d1fae5' },
  { key: 'flagged',                label: 'Réserves actives',    blink: true,  icon: cilFlagAlt,  color: '#b45309', bg: '#fef3c7' },
  { key: 'in_circuit',             label: 'Chez les acteurs',    blink: false, icon: cilSync,     color: '#2563eb', bg: '#dbeafe' },
  { key: 'circuit_correction',     label: 'Navette en cours',    blink: false, icon: cilSend,     color: '#7c3aed', bg: '#ede9fe' },
  { key: 'picked_up',              label: 'Archivés',            blink: false, icon: cilFolder,   color: '#475569', bg: '#f1f5f9' },
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
  counts['flagged']              = demandes.filter(d => !!(d as any).has_flag).length
  counts['in_circuit']           = demandes.filter(d => CIRCUIT_STATUSES.includes(d.status)).length
  counts['circuit_correction']   = demandes.filter(
    d => !!d.is_in_correction_circuit && d.status !== 'secretary_correction'
  ).length

  const columns = useActionColumns(BASE_COLUMNS, openDetail)

  const visibleDemandes =
    activeTab === 'flagged'
      ? demandes.filter(d => !!(d as any).has_flag)
      : activeTab === 'circuit_correction'
        ? demandes.filter(d => !!d.is_in_correction_circuit && d.status !== 'secretary_correction')
        : activeTab === 'in_circuit'
          ? demandes.filter(d => CIRCUIT_STATUSES.includes(d.status))
          : demandes.filter(d => d.status === activeTab)

  return (
    <div>
      <div className="dmd-stat-grid" style={{
        display: 'grid', gap: 14, marginBottom: 28,
        gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
      }}>
        {STAT_DEFS.map(s => (
          <StatCard
            key={s.key}
            label={s.label}
            count={counts[s.key] ?? 0}
            color={s.color}
            bg={s.bg}
            blink={s.blink}
            active={activeTab === s.key}
            icon={<CIcon icon={s.icon} style={{ width: 20, height: 20 }} />}
            onClick={() => setSearchParams({ tab: s.key })}
          />
        ))}
      </div>

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
                  : activeTab === 'in_circuit'
                    ? 'Aucun dossier chez les acteurs en ce moment'
                  : activeTab === 'secretary_final_review'
                    ? 'Aucun dossier en attente de finalisation'
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
