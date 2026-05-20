/**
 * ProfessorContratsList.tsx
 *
 * Liste des contrats du professeur connecté.
 *
 * Nouvelles fonctionnalités :
 * - Bouton "Supports" dans la colonne Action pour ouvrir CourseSupportModal
 * - Après la validation d'un contrat : dialog demandant si le professeur souhaite
 *   ajouter les supports de cours immédiatement ou plus tard.
 * - Si le professeur répond "plus tard", une alerte rappelle qu'il n'a pas encore
 *   ajouté les supports pour ce contrat.
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CBadge,
  CButton,
  CAlert,
  CSpinner,
  CInputGroup,
  CInputGroupText,
  CFormInput,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import {
  cilFile,
  cilSearch,
  cilWarning,
  cilCheckCircle,
  cilXCircle,
  cilClock,
  cilBook,
  cilInfo,
} from '@coreui/icons'
import HttpService from '@/services/http.service'
import type { Contrat } from '@/types/rh.types'
import CourseSupportModal from './CourseSupportModal'

// ─── Config statuts ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending:    { label: 'En attente',  color: 'warning', icon: cilClock        },
  transfered: { label: 'Transféré',  color: 'info',    icon: cilFile         },
  signed:     { label: 'Signé',      color: 'success', icon: cilCheckCircle  },
  ongoing:    { label: 'En cours',   color: 'primary', icon: cilFile         },
  completed:  { label: 'Complété',   color: 'dark',    icon: cilCheckCircle  },
  cancelled:  { label: 'Rejeté',     color: 'danger',  icon: cilXCircle      },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatDate = (date?: string) =>
  date
    ? new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—'

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'

// ─── Composant principal ──────────────────────────────────────────────────────

const ProfessorContratsList = () => {
  const navigate                              = useNavigate()
  const location                              = useLocation()
  const [searchParams, setSearchParams]       = useSearchParams()

  const [contrats, setContrats]               = useState<Contrat[]>([])
  const [loading, setLoading]                 = useState(true)
  const [error, setError]                     = useState<string | null>(null)
  const [search, setSearch]                   = useState('')

  // ── Modal support de cours ──────────────────────────────────────────────
  const [supportModalVisible, setSupportModalVisible] = useState(false)
  const [selectedContrat, setSelectedContrat]         = useState<Contrat | null>(null)

  // ── Dialog post-validation : "Voulez-vous ajouter les supports ?" ──────
  const [postValidationModal, setPostValidationModal]       = useState(false)
  const [postValidationContrat, setPostValidationContrat]   = useState<Contrat | null>(null)

  // ── Contrats dont le professeur a différé l'ajout des supports ─────────
  const [pendingSupportContrats, setPendingSupportContrats] = useState<Contrat[]>([])

  // Filtre de statut via URL (?status=pending | signed | all)
  const statusFilter = searchParams.get('status') ?? 'all'

  // ─── Chargement des contrats ──────────────────────────────────────────────
  const fetchContrats = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await HttpService.get<{ success: boolean; data: Contrat[] }>(
        'rh/professor/my-contrats',
      )
      setContrats(response.data ?? [])
    } catch (err: any) {
      setError(err.message || 'Impossible de charger vos contrats. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContrats()

    // Lire les contrats "en attente de supports" depuis le sessionStorage
    try {
      const stored = sessionStorage.getItem('pendingSupportContrats')
      if (stored) setPendingSupportContrats(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  // Lire le state passé par navigate() depuis ProfessorContratDetail
  // quand le professeur clique "Plus tard" dans le dialog post-validation
  useEffect(() => {
    const state = location.state as { pendingSupportContrat?: { id: number; uuid?: string; contrat_number: string } } | null
    if (!state?.pendingSupportContrat) return

    const incoming = state.pendingSupportContrat
    setPendingSupportContrats((prev) => {
      // Éviter les doublons
      if (prev.some((c) => c.id === incoming.id)) return prev
      const updated = [...prev, incoming as Contrat]
      try { sessionStorage.setItem('pendingSupportContrats', JSON.stringify(updated)) } catch { /* ignore */ }
      return updated
    })
    // Effacer le state pour ne pas réappliquer si le composant se remonte
    window.history.replaceState({}, '')
  }, [location.state])

  // ─── Filtrage ─────────────────────────────────────────────────────────────
  const filtered = contrats.filter((c) => {
    if (statusFilter === 'pending') {
      if (!['pending', 'transfered'].includes(c.status)) return false
    } else if (statusFilter === 'signed') {
      if (!['signed', 'ongoing', 'completed'].includes(c.status)) return false
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        c.contrat_number?.toLowerCase().includes(q) ||
        c.academicYear?.academic_year?.toLowerCase().includes(q) ||
        c.cycle?.name?.toLowerCase().includes(q) ||
        (c.status && STATUS_CONFIG[c.status]?.label.toLowerCase().includes(q))
      )
    }
    return true
  })

  const pendingCount = contrats.filter((c) =>
    ['pending', 'transfered'].includes(c.status),
  ).length

  // ─── Navigation ───────────────────────────────────────────────────────────
  const goToDashboard = () => navigate('/notes/professor/dashboard')
  const goToContrat   = (uuid?: string) => uuid && navigate(`/notes/professor/contrats/${uuid}`)

  const setStatusFilter = (status: string) => {
    if (status === 'all') {
      searchParams.delete('status')
    } else {
      searchParams.set('status', status)
    }
    setSearchParams(searchParams, { replace: true })
  }

  const filterLabel =
    statusFilter === 'pending'
      ? 'Contrats en attente'
      : statusFilter === 'signed'
      ? 'Contrats signés / en cours'
      : 'Tous les contrats'

  // ─── Ouverture du modal support de cours ─────────────────────────────────
  const openSupportModal = (contrat: Contrat, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedContrat(contrat)
    setSupportModalVisible(true)
  }

  const closeSupportModal = () => {
    setSupportModalVisible(false)
    setSelectedContrat(null)
  }

  // ─── Appelé depuis ContratDetail (page de signature) après validation ────
  // La page parente peut déclencher ce dialog via un événement custom ou via
  // un query param ?just_signed=<uuid>. On le détecte ici au montage.
  useEffect(() => {
    const justSigned = searchParams.get('just_signed')
    if (justSigned && contrats.length > 0) {
      const contrat = contrats.find((c) => c.uuid === justSigned)
      if (contrat) {
        // Retirer le param de l'URL
        searchParams.delete('just_signed')
        setSearchParams(searchParams, { replace: true })
        // Afficher le dialog post-validation
        setPostValidationContrat(contrat)
        setPostValidationModal(true)
      }
    }
  }, [contrats])

  // ─── Actions du dialog post-validation ───────────────────────────────────

  /** L'utilisateur veut ajouter les supports maintenant */
  const handlePostValidationContinue = () => {
    setPostValidationModal(false)
    if (postValidationContrat) {
      // Retirer de la liste "en attente de supports" si présent
      removePendingSupport(postValidationContrat)
      // Ouvrir le modal supports
      setSelectedContrat(postValidationContrat)
      setSupportModalVisible(true)
    }
  }

  /** L'utilisateur décide d'ajouter les supports plus tard */
  const handlePostValidationLater = () => {
    setPostValidationModal(false)
    if (postValidationContrat) {
      // Mémoriser que ce contrat est en attente d'ajout de supports
      const updated = [
        ...pendingSupportContrats.filter((c) => c.id !== postValidationContrat.id),
        postValidationContrat,
      ]
      setPendingSupportContrats(updated)
      try {
        sessionStorage.setItem('pendingSupportContrats', JSON.stringify(updated))
      } catch { /* ignore */ }
    }
    setPostValidationContrat(null)
  }

  const removePendingSupport = (contrat: Contrat) => {
    const updated = pendingSupportContrats.filter((c) => c.id !== contrat.id)
    setPendingSupportContrats(updated)
    try {
      sessionStorage.setItem('pendingSupportContrats', JSON.stringify(updated))
    } catch { /* ignore */ }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Mes contrats</h1>
          <p className="text-muted">
            Consultez et gérez l'ensemble de vos contrats d'enseignement.
          </p>
        </div>
        <CButton color="secondary" onClick={goToDashboard}>
          Tableau de bord
        </CButton>
      </div>

      {/* ── Alerte contrats en attente de signature ──────────────────────── */}
      {pendingCount > 0 && (
        <CAlert color="warning" className="mb-3">
          <CIcon icon={cilWarning} className="me-2" />
          Vous avez {pendingCount} contrat{pendingCount > 1 ? 's' : ''} en attente de votre
          signature.
        </CAlert>
      )}

     

      {/* ── Filtres rapides ──────────────────────────────────────────────── */}
      <div className="mb-3 d-flex gap-2 flex-wrap">
        <CButton
          color={statusFilter === 'all' ? 'primary' : 'outline-primary'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          Tous
        </CButton>
        <CButton
          color={statusFilter === 'pending' ? 'warning' : 'outline-warning'}
          size="sm"
          onClick={() => setStatusFilter('pending')}
        >
          <CIcon icon={cilClock} className="me-1" />
          En attente
          {pendingCount > 0 && (
            <CBadge color="dark" className="ms-1">{pendingCount}</CBadge>
          )}
        </CButton>
        <CButton
          color={statusFilter === 'signed' ? 'success' : 'outline-success'}
          size="sm"
          onClick={() => setStatusFilter('signed')}
        >
          <CIcon icon={cilCheckCircle} className="me-1" />
          Signés / En cours
        </CButton>
      </div>

      {/* ── Tableau des contrats ─────────────────────────────────────────── */}
      <CCard>
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{filterLabel}</h5>
            <CInputGroup style={{ width: '300px' }}>
              <CInputGroupText>
                <CIcon icon={cilSearch} />
              </CInputGroupText>
              <CFormInput
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </CInputGroup>
          </div>
        </CCardHeader>

        <CCardBody>
          {loading ? (
            <div className="text-center py-5">
              <CSpinner />
              <p className="mt-2">Chargement…</p>
            </div>
          ) : error ? (
            <CAlert color="danger">{error}</CAlert>
          ) : filtered.length === 0 ? (
            <CAlert color="info">
              {search
                ? 'Aucun contrat ne correspond à votre recherche.'
                : statusFilter !== 'all'
                ? 'Aucun contrat dans cette catégorie.'
                : "Vous n'avez pas encore de contrat."}
            </CAlert>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Numéro</th>
                    <th>Année académique</th>
                    <th>Cycle</th>
                    <th>Montant</th>
                    <th>Date de début</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contrat) => {
                    const statusCfg = STATUS_CONFIG[contrat.status] ?? {
                      label: contrat.status,
                      color: 'secondary',
                      icon: cilFile,
                    }
                    const isPending = ['pending', 'transfered'].includes(contrat.status)
                    // Le bouton "Supports" n'est visible que si le contrat a des programmes
                    const hasPrograms =
                      (contrat.course_element_professors?.length ?? 0) > 0

                    return (
                      <tr
                        key={contrat.uuid ?? contrat.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => goToContrat(contrat.uuid)}
                      >
                        <td>
                          <strong>N° {contrat.contrat_number}</strong>
                          {isPending && (
                            <CBadge color="warning" className="ms-2">
                              Signature requise
                            </CBadge>
                          )}
                          
                        </td>
                        <td>{contrat.academic_year?.academic_year ?? contrat.academicYear?.academic_year ?? '—'}</td>
                        <td>{contrat.cycle?.name ?? '—'}</td>
                        <td>{formatAmount(contrat.amount)}</td>
                        <td>{formatDate(contrat.start_date)}</td>
                        <td>
                          <CBadge color={statusCfg.color}>{statusCfg.label}</CBadge>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div className="d-flex gap-1 flex-wrap">
                            {/* Bouton Consulter / Voir le contrat */}
                            <CButton
                              size="sm"
                              color={isPending ? 'warning' : 'primary'}
                              onClick={() => goToContrat(contrat.uuid)}
                            >
                              {isPending ? 'Consulter' : 'Voir'}
                            </CButton>

                            {/* ── Bouton Supports de cours ─────────────── */}
                            <CButton
                              size="sm"
                              color="info"
                              variant="outline"
                              onClick={(e) => openSupportModal(contrat, e)}
                              title="Gérer les supports de cours"
                            >
                              <CIcon icon={cilBook} className="me-1" />
                              Supports
                            </CButton>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CCardBody>
      </CCard>

      {/* ── Modal supports de cours ──────────────────────────────────────── */}
      {selectedContrat && (
        <CourseSupportModal
          visible={supportModalVisible}
          onClose={closeSupportModal}
          contrat={selectedContrat}
        />
      )}

      {/* ── Dialog post-validation ───────────────────────────────────────── */}
      <CModal
        visible={postValidationModal}
        onClose={handlePostValidationLater}
        backdrop="static"
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>
            <CIcon icon={cilBook} className="me-2 text-primary" />
            Supports de cours
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Souhaitez-vous ajouter les supports de cours des programmes issus du contrat{' '}
            <strong>N° {postValidationContrat?.contrat_number}</strong> que vous venez de
            valider ?
          </p>
          <p className="text-muted small mb-0">
            Vous pouvez le faire maintenant ou revenir le faire plus tard depuis la liste de
            vos contrats.
          </p>
        </CModalBody>
        <CModalFooter className="d-flex justify-content-end gap-2">
          <CButton color="secondary" variant="outline" onClick={handlePostValidationLater}>
            Plus tard
          </CButton>
          <CButton color="primary" onClick={handlePostValidationContinue}>
            <CIcon icon={cilBook} className="me-2" />
            Continuer — Ajouter les supports
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default ProfessorContratsList