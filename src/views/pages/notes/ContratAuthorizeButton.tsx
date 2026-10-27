/**
 * ContratAuthorizeButton.tsx
 *
 * Bouton "Autoriser" à intégrer sur la page admin de détail/liste des contrats.
 * Le contrat n'est autorisable que lorsqu'il est déjà validé par le professeur
 * (is_validated === true && status === 'signed').
 *
 * Usage:
 *   <ContratAuthorizeButton contrat={contrat} onAuthorized={handleRefresh} />
 */

import { useState } from 'react'
import {
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CAlert,
  CSpinner,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCheckAlt, cilLockUnlocked, cilWarning } from '@coreui/icons'
import RhService from '@/services/rh.service'
import type { Contrat } from '@/types/rh.types'

interface Props {
  contrat: Contrat
  onAuthorized?: (updated: Contrat) => void
}

const ContratAuthorizeButton = ({ contrat, onAuthorized }: Props) => {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Le contrat est autorisable uniquement si validé par le professeur et pas encore autorisé
  const canAuthorize =
    contrat.is_validated === true &&
    contrat.status === 'signed'   &&
    !(contrat as any).is_authorized

  const alreadyAuthorized = (contrat as any).is_authorized === true

  const handleAuthorize = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await RhService.authorizeContrat(contrat.id)
      setShowModal(false)
      onAuthorized?.(response)
    } catch (err: any) {
      setError(err?.message ?? "Une erreur est survenue lors de l'autorisation.")
    } finally {
      setLoading(false)
    }
  }

  if (alreadyAuthorized) {
    return (
      <CButton color="success" disabled size="sm" title="Contrat déjà autorisé">
        <CIcon icon={cilCheckAlt} className="me-2" />
        Autorisé
      </CButton>
    )
  }

  return (
    <>
      <CButton
        color="primary"
        size="sm"
        onClick={() => setShowModal(true)}
        disabled={!canAuthorize}
        title={
          !canAuthorize
            ? "Le contrat doit être validé par le professeur avant de pouvoir être autorisé"
            : "Autoriser ce contrat"
        }
      >
        <CIcon icon={cilLockUnlocked} className="me-2" />
        Autoriser
      </CButton>

      <CModal visible={showModal} onClose={() => { setShowModal(false); setError(null) }} alignment="center">
        <CModalHeader>
          <CModalTitle>
            <CIcon icon={cilLockUnlocked} className="me-2 text-primary" />
            Autoriser le contrat
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p>
            Vous êtes sur le point d'<strong>autoriser</strong> le contrat
            N°<strong>{contrat.contrat_number}</strong>.
          </p>
          <p className="text-muted" style={{ fontSize: 14 }}>
            Cette action marque le contrat comme autorisé et le passe en statut
            <strong> En cours</strong>. Le professeur pourra alors télécharger le PDF.
          </p>
          {error && (
            <CAlert color="danger" className="mt-3 mb-0">
              <CIcon icon={cilWarning} className="me-2" />
              {error}
            </CAlert>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="light" onClick={() => { setShowModal(false); setError(null) }} disabled={loading}>
            Annuler
          </CButton>
          <CButton color="primary" onClick={handleAuthorize} disabled={loading}>
            {loading
              ? <CSpinner size="sm" className="me-2" />
              : <CIcon icon={cilLockUnlocked} className="me-2" />
            }
            Confirmer l'autorisation
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default ContratAuthorizeButton
