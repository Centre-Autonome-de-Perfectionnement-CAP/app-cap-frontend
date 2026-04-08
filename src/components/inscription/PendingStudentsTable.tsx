import React from 'react'
import {
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CFormCheck,
} from '@coreui/react'
import PendingStudentRow from './PendingStudentRow'
import { EmptyState } from '../common'
import type { PendingStudentData } from '../../types/inscription.types'

interface SelectOption {
  value: string | number
  label: string
}

interface PendingStudentsTableProps {
  students: PendingStudentData[]
  currentPage: number
  selectedStudents: number[]
  isSpecialFiliere: boolean
  opinionOptions: SelectOption[]
  onSelectAll: (checked: boolean) => void
  onSelectStudent: (studentId: number) => void
  onOpenDocument: (documentUrl: string) => void
  onOpinionChange: (studentId: number, type: string, value: string) => void
  onCommentChange: (studentId: number, type: string, value: string) => void
  onStatusChange: (
    studentId: number,
    field: 'exonere' | 'sponsorise',
    checked: boolean
  ) => void
  onLevelChange: (studentId: number, level: string) => void
  onRenamePiece: (studentId: number, pieceKey: string, customName: string) => Promise<void | { success: boolean }>;
}

/**
 * PendingStudentsTable - Tableau des étudiants en attente
 */
const PendingStudentsTable: React.FC<PendingStudentsTableProps> = ({
  students,
  currentPage,
  selectedStudents,
  isSpecialFiliere,
  opinionOptions,
  onSelectAll,
  onSelectStudent,
  onOpenDocument,
  onOpinionChange,
  onCommentChange,
  onStatusChange,
  onLevelChange,
  onRenamePiece,
}) => {
  if (students.length === 0) {
    return (
      <EmptyState
        title="Aucun étudiant en attente"
        message="Aucun étudiant ne correspond aux critères de recherche."
      />
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <CTable
        className="table table-bordered table-striped table-hover"
        style={{ fontSize: '0.9rem', minWidth: '1500px' }}
        align="middle"
      >
      <CTableHead className="text-nowrap">
        <CTableRow>
          {/* Checkbox select all */}
          <CTableHeaderCell>
            <CFormCheck
              id="selectAll"
              checked={selectedStudents.length === students.length && students.length > 0}
              onChange={(e) => onSelectAll(e.target.checked)}
            />
          </CTableHeaderCell>

          {/* Headers */}
          <CTableHeaderCell>N°</CTableHeaderCell>
          <CTableHeaderCell>Nom et Prénoms</CTableHeaderCell>
          <CTableHeaderCell>Contact Téléphonique</CTableHeaderCell>
          <CTableHeaderCell>Niveau</CTableHeaderCell>
          <CTableHeaderCell>Pièces</CTableHeaderCell>
          <CTableHeaderCell>
            {isSpecialFiliere
              ? "Avis de la commission d'études"
              : 'Opinion Cuca'}
          </CTableHeaderCell>
          <CTableHeaderCell>
            {isSpecialFiliere
              ? "Commentaires de la commission d'études"
              : 'Commentaire Cuca'}
          </CTableHeaderCell>
          {!isSpecialFiliere && <CTableHeaderCell>Opinion CUO</CTableHeaderCell>}
          {!isSpecialFiliere && <CTableHeaderCell>Commentaire CUO</CTableHeaderCell>}
          <CTableHeaderCell>Mail CUCA envoyé</CTableHeaderCell>
          {!isSpecialFiliere && <CTableHeaderCell>Mail CUO envoyé</CTableHeaderCell>}
          <CTableHeaderCell>Exonéré</CTableHeaderCell>
          <CTableHeaderCell>Sponsorisé</CTableHeaderCell>
          <CTableHeaderCell>Statut</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {students.map((student, index) => (
          <PendingStudentRow
            key={student.id}
            student={student}
            index={index}
            currentPage={currentPage}
            isSelected={selectedStudents.includes(student.id)}
            isSpecialFiliere={isSpecialFiliere}
            opinionOptions={opinionOptions}
            onSelectStudent={onSelectStudent}
            onOpenDocument={onOpenDocument}
            onOpinionChange={onOpinionChange}
            onCommentChange={onCommentChange}
            onStatusChange={onStatusChange}
            onLevelChange={onLevelChange}
            onRenamePiece={onRenamePiece}
          />
        ))}
      </CTableBody>
    </CTable>
    </div>
  )
}

export default PendingStudentsTable
