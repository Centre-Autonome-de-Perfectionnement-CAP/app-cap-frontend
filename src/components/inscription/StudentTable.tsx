// ============================================================
// FICHIER : src/components/inscription/StudentTable.tsx
// ACTION  : REMPLACER tout le contenu du fichier par ceci
// ============================================================

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
  CSpinner,
} from '@coreui/react'
import { Avatar, LoadingSpinner, EmptyState } from '../common'

interface Student {
  id: number                       // pending_students.id  (pour onRowClick)
  personal_information_id?: number // ✅ ID utilisé pour assign/remove côté API
  matricule?: string
  nomPrenoms: string
  email: string
  filiere: string
  niveau: string
  sexe: string
  redoublant: string
  photo?: string | null
  // Champs responsable
  role_id?: number
  isClassResponsible?: boolean
  classGroupName?: string          // ex: "A", "B"
}

interface StudentTableProps {
  students: Student[]
  loading: boolean
  onRowClick: (studentId: number) => void
  // Callback responsable — reçoit personal_information_id et l'état actuel
  onAssignResponsible?: (personalInfoId: number, isCurrently: boolean) => Promise<void>
  // Map groupName → personal_information_id du responsable actuel
  groupResponsibleMap?: Record<string, number>
  // personal_information_id en cours de traitement (spinner)
  assigningId?: number | null
}

const StudentTable: React.FC<StudentTableProps> = ({
  students,
  loading,
  onRowClick,
  onAssignResponsible,
  groupResponsibleMap = {},
  assigningId = null,
}) => {
  if (loading) {
    return <LoadingSpinner message="Chargement des étudiants..." />
  }

  if (!students || students.length === 0) {
    return (
      <EmptyState
        title="Aucun étudiant trouvé"
        message="Aucun étudiant ne correspond aux critères de recherche."
      />
    )
  }

  const showResponsableColumn = !!onAssignResponsible

  return (
    <CTable hover responsive>
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>Photo</CTableHeaderCell>
          <CTableHeaderCell>Matricule</CTableHeaderCell>
          <CTableHeaderCell>Nom et Prénoms</CTableHeaderCell>
          <CTableHeaderCell>Email</CTableHeaderCell>
          <CTableHeaderCell>Filière</CTableHeaderCell>
          <CTableHeaderCell>Niveau</CTableHeaderCell>
          <CTableHeaderCell>Sexe</CTableHeaderCell>
          <CTableHeaderCell>Statut</CTableHeaderCell>
          {showResponsableColumn && (
            <CTableHeaderCell>Responsable</CTableHeaderCell>
          )}
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {students.map((student) => {
          // ✅ ID correct pour l'API (personal_information.id)
          const piId = student.personal_information_id ?? student.id

          const isResponsible =
            student.isClassResponsible === true || student.role_id === 9

          const group = student.classGroupName ?? ''
          // Un AUTRE étudiant du même groupe est-il déjà responsable ?
          const groupHasOtherResponsible =
            group !== '' &&
            groupResponsibleMap[group] !== undefined &&
            groupResponsibleMap[group] !== piId

          const isAssigning = assigningId === piId

          return (
            <CTableRow
              key={student.id}
              onClick={() => onRowClick(student.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* Photo */}
              <CTableDataCell>
                <Avatar src={student.photo} alt={student.nomPrenoms} size="sm" />
              </CTableDataCell>

              {/* Matricule */}
              <CTableDataCell>{student.matricule || 'N/A'}</CTableDataCell>

              {/* Nom + étoile si responsable */}
              <CTableDataCell>
                {student.nomPrenoms}
                {isResponsible && (
                  <span
                    title="Responsable de classe"
                    style={{ marginLeft: 6, color: '#f9a825', fontSize: '1.1rem' }}
                  >
                    ★
                  </span>
                )}
              </CTableDataCell>

              <CTableDataCell>{student.email}</CTableDataCell>
              <CTableDataCell>{student.filiere}</CTableDataCell>
              <CTableDataCell>{student.niveau}</CTableDataCell>
              <CTableDataCell>
                {student.sexe === 'M' ? 'Masculin' : 'Féminin'}
              </CTableDataCell>
              <CTableDataCell>
                {student.redoublant === 'Oui' ? (
                  <CBadge color="warning">Redoublant</CBadge>
                ) : (
                  <CBadge color="success">Normal</CBadge>
                )}
              </CTableDataCell>

              {/* ── Colonne Responsable ── */}
              {showResponsableColumn && (
                <CTableDataCell onClick={(e) => e.stopPropagation()}>
                  {isResponsible ? (
                    // Cet étudiant est responsable → bouton Retirer
                    <CButton
                      color="warning"
                      size="sm"
                      variant="outline"
                      disabled={isAssigning}
                      onClick={() => onAssignResponsible!(piId, true)}
                    >
                      {isAssigning ? <CSpinner size="sm" /> : '★ Retirer'}
                    </CButton>
                  ) : groupHasOtherResponsible ? (
                    // Un autre du même groupe est responsable → verrouillé
                    <CButton color="secondary" size="sm" variant="outline" disabled>
                      Indisponible
                    </CButton>
                  ) : (
                    // Aucun responsable dans ce groupe → bouton Nommer
                    <CButton
                      color="info"
                      size="sm"
                      variant="outline"
                      disabled={isAssigning}
                      onClick={() => onAssignResponsible!(piId, false)}
                    >
                      {isAssigning ? <CSpinner size="sm" /> : 'Nommer'}
                    </CButton>
                  )}
                </CTableDataCell>
              )}
            </CTableRow>
          )
        })}
      </CTableBody>
    </CTable>
  )
}

export default StudentTable