import React, { useEffect, useState, useCallback } from 'react'
import {
  CCard,
  CCardBody,
  CButton,
  CBadge,
  CSpinner,
  CAlert,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilCloudUpload,
  cilFile,
  cilExternalLink,
  cilDescription,
  cilCreditCard,
} from '@coreui/icons'
import RhService from '@/services/rh.service'
import FacturesModal from '@/components/rh/FacturesModal'
import type { FactureEntry, FactureFile } from '@/types/rh.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: 'success' | 'info' | 'warning' | 'secondary' | 'primary' | 'danger' }> = {
  signed:     { label: 'Signé',      color: 'success'   },
  ongoing:    { label: 'En cours',   color: 'info'      },
  pending:    { label: 'En attente', color: 'warning'   },
  completed:  { label: 'Terminé',   color: 'secondary' },
  transfered: { label: 'Transféré', color: 'primary'   },
  cancelled:  { label: 'Rejeté',    color: 'danger'    },
}

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  facture: { label: 'Facture normalisée', icon: cilDescription, color: '#321fdb' },
  rib:     { label: 'RIB',               icon: cilCreditCard,  color: '#2eb85c' },
  autre:   { label: 'Autre',             icon: cilFile,        color: '#768192' },
}

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount)

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

// ─── Composant fichier ────────────────────────────────────────────────────────

const FichierBadge: React.FC<{ fichier: FactureFile }> = ({ fichier }) => {
  const cfg = TYPE_CONFIG[fichier.type] ?? TYPE_CONFIG.autre
  return (
    <a
      href={fichier.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 20,
        background: `${cfg.color}15`,
        border: `1px solid ${cfg.color}40`,
        color: cfg.color,
        fontSize: 12,
        fontWeight: 600,
        textDecoration: 'none',
        transition: 'all .15s',
        marginRight: 6,
        marginBottom: 4,
      }}
      title={fichier.name}
    >
      <CIcon icon={cfg.icon} style={{ width: 13, height: 13 }} />
      {cfg.label}
      <CIcon icon={cilExternalLink} style={{ width: 11, height: 11, opacity: 0.7 }} />
    </a>
  )
}

// ─── Page principale ──────────────────────────────────────────────────────────

const MesFactures: React.FC = () => {
  const [entries, setEntries]       = useState<FactureEntry[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  const loadFactures = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await RhService.getMyFactures()
      setEntries(res.data || [])
    } catch {
      setError('Impossible de charger vos factures. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadFactures() }, [loadFactures])

  // Recharger après un upload réussi
  const handleModalClose = () => {
    setModalVisible(false)
    loadFactures()
  }

  const totalFichiers = entries.reduce((acc, e) => acc + e.factures.length, 0)

  return (
    <div style={{ padding: '24px 0' }}>

      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', flexWrap: 'wrap',
        gap: 16, marginBottom: 28,
      }}>
        <div>
          <h4 style={{ fontWeight: 800, margin: 0, color: '#1a1a2e', fontSize: 22 }}>
            Mes Factures Normalisées
          </h4>
          <p style={{ color: '#718096', margin: '4px 0 0', fontSize: 14 }}>
            {loading ? '…' : `${entries.length} contrat${entries.length > 1 ? 's' : ''} — ${totalFichiers} fichier${totalFichiers > 1 ? 's' : ''} déposé${totalFichiers > 1 ? 's' : ''}`}
          </p>
        </div>
        <CButton
          color="primary"
          onClick={() => setModalVisible(true)}
          style={{ borderRadius: 9, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <CIcon icon={cilCloudUpload} />
          Ajouter une facture
        </CButton>
      </div>

      {/* ── Erreur ───────────────────────────────────────────────────────── */}
      {error && (
        <CAlert color="danger" className="mb-4" style={{ borderRadius: 10 }}>
          {error}
        </CAlert>
      )}

      {/* ── Chargement ───────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <CSpinner color="primary" />
          <p className="mt-3 text-medium-emphasis">Chargement de vos factures…</p>
        </div>
      ) : entries.length === 0 ? (

        /* ── État vide ─────────────────────────────────────────────────── */
        <CCard style={{ borderRadius: 14, border: '2px dashed #e2e8f0' }}>
          <CCardBody style={{ textAlign: 'center', padding: '60px 32px' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#f0f1ff', margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CIcon icon={cilDescription} style={{ color: '#321fdb', width: 32, height: 32 }} />
            </div>
            <h5 style={{ fontWeight: 700, color: '#2d3748', marginBottom: 8 }}>
              Aucune facture déposée
            </h5>
            <p style={{ color: '#718096', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
              Vous n'avez encore déposé aucune facture normalisée.
              Cliquez sur le bouton ci-dessous pour commencer.
            </p>
            <CButton
              color="primary"
              variant="outline"
              onClick={() => setModalVisible(true)}
              style={{ borderRadius: 9, fontWeight: 600 }}
            >
              <CIcon icon={cilCloudUpload} className="me-2" />
              Déposer ma première facture
            </CButton>
          </CCardBody>
        </CCard>

      ) : (

        /* ── Tableau ───────────────────────────────────────────────────── */
        <CCard style={{ borderRadius: 14, border: '1px solid #e9ecef', overflow: 'hidden' }}>
          <CCardBody style={{ padding: 0 }}>
            <CTable hover responsive style={{ margin: 0 }}>
              <CTableHead style={{ background: '#f8f9ff' }}>
                <CTableRow>
                  <CTableHeaderCell style={{ fontWeight: 700, fontSize: 12, color: '#4a5568', textTransform: 'uppercase', letterSpacing: .5, padding: '14px 20px' }}>
                    Contrat
                  </CTableHeaderCell>
                  <CTableHeaderCell style={{ fontWeight: 700, fontSize: 12, color: '#4a5568', textTransform: 'uppercase', letterSpacing: .5 }}>
                    Année / Cycle
                  </CTableHeaderCell>
                  <CTableHeaderCell style={{ fontWeight: 700, fontSize: 12, color: '#4a5568', textTransform: 'uppercase', letterSpacing: .5 }}>
                    Montant
                  </CTableHeaderCell>
                  <CTableHeaderCell style={{ fontWeight: 700, fontSize: 12, color: '#4a5568', textTransform: 'uppercase', letterSpacing: .5 }}>
                    Statut
                  </CTableHeaderCell>
                  <CTableHeaderCell style={{ fontWeight: 700, fontSize: 12, color: '#4a5568', textTransform: 'uppercase', letterSpacing: .5 }}>
                    Fichiers déposés
                  </CTableHeaderCell>
                  <CTableHeaderCell style={{ fontWeight: 700, fontSize: 12, color: '#4a5568', textTransform: 'uppercase', letterSpacing: .5 }}>
                    Déposé le
                  </CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {entries.map((entry) => {
                  const statusCfg = STATUS_CONFIG[entry.status] ?? { label: entry.status, color: 'secondary' as const }
                  return (
                    <CTableRow key={entry.id} style={{ verticalAlign: 'middle' }}>

                      {/* Numéro de contrat */}
                      <CTableDataCell style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: 14 }}>
                          N° {entry.contrat_number}
                        </div>
                        {entry.start_date && (
                          <div style={{ fontSize: 12, color: '#a0aec0', marginTop: 2 }}>
                            {formatDate(entry.start_date)}
                            {entry.end_date ? ` → ${formatDate(entry.end_date)}` : ''}
                          </div>
                        )}
                      </CTableDataCell>

                      {/* Année / Cycle */}
                      <CTableDataCell>
                        <div style={{ fontSize: 13, color: '#4a5568' }}>
                          {entry.academic_year ?? '—'}
                        </div>
                        {entry.cycle && (
                          <div style={{ fontSize: 12, color: '#a0aec0' }}>{entry.cycle}</div>
                        )}
                      </CTableDataCell>

                      {/* Montant */}
                      <CTableDataCell>
                        <span style={{ fontWeight: 700, color: '#2d3748', fontSize: 14 }}>
                          {formatAmount(entry.amount)}
                        </span>
                      </CTableDataCell>

                      {/* Statut */}
                      <CTableDataCell>
                        <CBadge color={statusCfg.color} style={{ borderRadius: 20, padding: '4px 10px', fontSize: 11 }}>
                          {statusCfg.label}
                        </CBadge>
                      </CTableDataCell>

                      {/* Fichiers */}
                      <CTableDataCell style={{ maxWidth: 280 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0 }}>
                          {entry.factures.map((f, i) => (
                            <FichierBadge key={i} fichier={f} />
                          ))}
                        </div>
                      </CTableDataCell>

                      {/* Date dépôt */}
                      <CTableDataCell>
                        <span style={{ fontSize: 13, color: '#718096' }}>
                          {formatDate(entry.uploaded_at)}
                        </span>
                      </CTableDataCell>

                    </CTableRow>
                  )
                })}
              </CTableBody>
            </CTable>
          </CCardBody>
        </CCard>
      )}

      {/* ── Modal upload ─────────────────────────────────────────────────── */}
      <FacturesModal
        visible={modalVisible}
        onClose={handleModalClose}
      />
    </div>
  )
}

export default MesFactures