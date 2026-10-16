import React from 'react'
import {
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CBadge,
  CButton,
} from '@coreui/react'
import { LoadingSpinner, EmptyState } from '../common'

interface AcademicYear {
  id: number
  libelle: string
  date_debut: string
  date_fin: string
  is_current: boolean
}

interface AcademicYearListProps {
  academicYears: AcademicYear[]
  loading: boolean
  onViewPeriods: (year: AcademicYear) => void
  onAddPeriod: (year: AcademicYear) => void
}

/**
 * AcademicYearList - Liste des années académiques
 */
const AcademicYearList: React.FC<AcademicYearListProps> = ({
  academicYears,
  loading,
  onViewPeriods,
  onAddPeriod,
}) => {
  if (loading) {
    return <LoadingSpinner message="Chargement des années académiques..." />
  }

  if (!academicYears || academicYears.length === 0) {
    return (
      <EmptyState
        title="Aucune année académique"
        message="Créez votre première année académique pour commencer."
      />
    )
  }

  return (
    <CTable hover responsive bordered>
      <CTableHead className="table-light">
        <CTableRow>
          <CTableHeaderCell className="text-center">Année académique</CTableHeaderCell>
          <CTableHeaderCell className="text-center">Date de début</CTableHeaderCell>
          <CTableHeaderCell className="text-center">Date de fin</CTableHeaderCell>
          <CTableHeaderCell className="text-center">Statut</CTableHeaderCell>
          <CTableHeaderCell className="text-center">Actions</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {academicYears.map((year) => (
          <CTableRow key={year.id}>
            <CTableDataCell className="text-center fw-bold">
              {year.libelle}
            </CTableDataCell>
            <CTableDataCell className="text-center">
              {year.date_debut}
            </CTableDataCell>
            <CTableDataCell className="text-center">
              {year.date_fin}
            </CTableDataCell>
            <CTableDataCell className="text-center">
              {(() => {
                const s = (year as any).status
                if (s === 'active' || year.is_current) {
                  return <CBadge color="success">Active</CBadge>
                }
                if (s === 'upcoming') {
                  return <CBadge color="info">À venir</CBadge>
                }
                return <CBadge color="secondary">Terminée</CBadge>
              })()}
            </CTableDataCell>
            <CTableDataCell className="text-center">
              <CButton
                color="primary"
                variant="outline"
                size="sm"
                className="me-2"
                onClick={() => onViewPeriods(year)}
              >
                Voir les périodes
              </CButton>
              <CButton
                color="success"
                variant="outline"
                size="sm"
                onClick={() => onAddPeriod(year)}
              >
                Ajouter une période
              </CButton>
            </CTableDataCell>
          </CTableRow>
        ))}
      </CTableBody>
    </CTable>
  )
}

export default AcademicYearList
