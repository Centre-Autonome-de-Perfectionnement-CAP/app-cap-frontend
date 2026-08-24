import React from 'react'
import {
  CButton,
  CListGroup,
  CListGroupItem,
  CBadge,
  CAlert,
} from '@coreui/react'
import { LoadingSpinner } from '../common'
import type { Period } from '../../types/inscription.types'
import { BaseModal } from '../modals/index'
interface PeriodsModalProps {
  visible: boolean
  onClose: () => void
  selectedYear: any
  periods: Period[]
  loading: boolean
  onEditPeriod?: (period: any) => void
  onDeletePeriod?: (period: any) => void
}

/**
 * PeriodsModal - Modal d'affichage des périodes d'une année académique
 */
const PeriodsModal: React.FC<PeriodsModalProps> = ({
  visible,
  onClose,
  selectedYear,
  periods,
  loading,
  onEditPeriod,
  onDeletePeriod,
}) => {
  const footer = (
    <CButton color="secondary" onClick={onClose}>
      Fermer
    </CButton>
  )

  const getPeriodTypeLabel = (type: string) => {
    return type === 'depot' ? 'Dépôt de dossiers' : 'Réclamation'
  }

  const getPeriodTypeBadge = (type: string) => {
    return type === 'depot' ? (
      <CBadge color="primary">Dépôt</CBadge>
    ) : (
      <CBadge color="warning">Réclamation</CBadge>
    )
  }

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title={`Périodes - ${selectedYear?.libelle || ''}`}
      footer={footer}
      size="lg"
    >
      {loading && <LoadingSpinner message="Chargement des périodes..." />}

      {!loading && selectedYear && (
        <>
          <CAlert color="info" className="mb-3">
            <strong>Année académique:</strong> {selectedYear.libelle}
            <br />
            <strong>Du:</strong> {selectedYear.date_debut} <strong>au:</strong>{' '}
            {selectedYear.date_fin}
          </CAlert>

          {periods.length === 0 ? (
            <CAlert color="warning">
              Aucune période définie pour cette année académique.
            </CAlert>
          ) : (
            <CListGroup>
              {periods.map((period, index) => (
                <CListGroupItem key={index} className="p-3">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div className="flex-grow-1">
                      <div className="mb-2">
                        {getPeriodTypeBadge(period.type)}
                        <span className="ms-2 fw-bold">
                          {getPeriodTypeLabel(period.type)}
                        </span>
                      </div>
                      <div className="text-muted small">
                        <strong>Début:</strong> {period.start}
                        <br />
                        <strong>Fin:</strong> {period.end}
                        <br />
                        {period.filieres && period.filieres.length > 0 && (
                          <>
                            <strong>Filières:</strong>{' '}
                            {period.filieres.map((f: any) => f.name || f.title || f).join(', ')}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      {onEditPeriod && (
                        <CButton
                          color="primary"
                          variant="outline"
                          size="sm"
                          onClick={() => onEditPeriod(period)}
                        >
                          <span className="me-1">✏️</span> Modifier
                        </CButton>
                      )}
                      {onDeletePeriod && (
                        <CButton
                          color="danger"
                          variant="outline"
                          size="sm"
                          onClick={() => onDeletePeriod(period)}
                        >
                          <span className="me-1">🗑️</span> Supprimer
                        </CButton>
                      )}
                    </div>
                  </div>
                </CListGroupItem>
              ))}
            </CListGroup>
          )}
        </>
      )}
    </BaseModal>
  )
}

export default PeriodsModal
