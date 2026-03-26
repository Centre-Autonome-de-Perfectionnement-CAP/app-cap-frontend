import React, { useState } from 'react'
import {
  CTableRow,
  CTableDataCell,
  CFormCheck,
  CFormInput,
  CFormSwitch,
  CBadge,
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'
import { cilCheckCircle, cilXCircle, cilPencil } from '@coreui/icons'
import Select from 'react-select'
import type { PendingStudentData } from '../../types/inscription.types'
import RenamePieceModal from './RenamePieceModal'


interface SelectOption {
  value: string | number
  label: string
}

interface PendingStudentRowProps {
  student: PendingStudentData
  index: number
  currentPage: number
  isSelected: boolean
  isSpecialFiliere: boolean
  opinionOptions: SelectOption[]
  onSelectStudent: (studentId: number) => void
  onOpenDocument: (documentUrl: string) => void
  onOpinionChange: (studentId: number, type: string, value: string) => void
  onCommentChange: (studentId: number, type: string, value: string) => void
  onStatusChange: (studentId: number, field: 'exonere' | 'sponsorise', checked: boolean) => void
  onLevelChange: (studentId: number, level: string) => void
  onRenamePiece: (studentId: number, pieceKey: string, customName: string) => Promise<void | { success: boolean }>
}

/**
 * PendingStudentRow - Ligne de tableau pour un étudiant en attente
 */
const PendingStudentRow: React.FC<PendingStudentRowProps> = ({
  student,
  index,
  currentPage,
  isSelected,
  isSpecialFiliere,
  opinionOptions,
  onSelectStudent,
  onOpenDocument,
  onOpinionChange,
  onCommentChange,
  onStatusChange,
  onLevelChange,
  onRenamePiece,
}) => {
  const getStatusColor = (status: string) => {
    if (status === 'approved') return 'success'
    if (status === 'rejected') return 'danger'
    return 'warning'
  }

  const [showRenameModal, setShowRenameModal] = useState(false)
  const [selectedPiece, setSelectedPiece] = useState<{key: string, name: string} | null>(null)

  const getStatusLabel = (status: string) => {
    if (status === 'approved') return 'Validé'
    if (status === 'rejected') return 'Rejeté'
    return 'En attente'
  }

  return (
    <>
      <CTableRow>
        {/* Checkbox Sélection */}
        <CTableDataCell>
          <CFormCheck 
            checked={isSelected} 
            onChange={() => onSelectStudent(student.id)}
            disabled={!student.opinionCuca && !student.opinionCuo}
          />
        </CTableDataCell>

        {/* Numéro */}
        <CTableDataCell>{(currentPage - 1) * 10 + index + 1}</CTableDataCell>

        {/* Nom et Prénoms */}
        <CTableDataCell>{student.first_name + ' ' + student.last_name}</CTableDataCell>

        {/* Contact Téléphonique */}
        <CTableDataCell>
          {student.phone || '-'}
        </CTableDataCell>

        {/* Niveau */}
        <CTableDataCell>
          <CFormInput
            value={(student as any).level || ''}
            onChange={(e) => onLevelChange(student.id, e.target.value)}
            onBlur={(e) => onLevelChange(student.id, e.target.value)}
            style={{ minWidth: '80px' }}
          />
        </CTableDataCell>

        {/* Pièces */}
        <CTableDataCell style={{ minWidth: '250px' }}>
          <div>
            {student.documents && Object.keys(student.documents).length > 0 ? (
              Object.entries(student.documents).map(([name, path], pieceIndex) => {
                const pieceData = typeof path === 'object' ? path : { url: path };
                const displayName = (pieceData as any).custom_name || name;
                
                return (
                  <div key={pieceIndex} className="mb-1 d-flex align-items-center">
                    <CBadge
                      color="primary"
                      className="cursor-pointer text-decoration-underline"
                      onClick={() => onOpenDocument(String((pieceData as any).url || path))}
                      style={{ cursor: 'pointer', whiteSpace: 'normal', textAlign: 'left' }}
                    >
                      {displayName}
                    </CBadge>
                    <CIcon 
                      icon={cilPencil} 
                      size="sm" 
                      className="ms-2 cursor-pointer text-primary"
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedPiece({ key: name, name: displayName });
                        setShowRenameModal(true);
                      }}
                    />
                  </div>
                );
              })
            ) : (
              <span className="text-muted">Aucune pièce</span>
            )}
          </div>
        </CTableDataCell>

      {/* Opinion CUCA / Commission */}
      <CTableDataCell>
        <Select
          options={opinionOptions}
          value={opinionOptions.find((opt) => opt.value === student.opinionCuca)}
          onChange={(option) =>
            onOpinionChange(student.id, 'opinionCuca', String(option?.value || ''))
          }
          isClearable={false}
        />
      </CTableDataCell>

      {/* Commentaire CUCA / Commission */}
      <CTableDataCell>
        <CFormInput
          value={student.commentaireCuca || ''}
          onChange={(e) =>
            onCommentChange(student.id, 'commentaireCuca', e.target.value)
          }
        />
      </CTableDataCell>

      {/* Opinion CUO (non spécial) */}
      {!isSpecialFiliere && (
        <CTableDataCell>
          <Select
            options={opinionOptions}
            value={opinionOptions.find((opt) => opt.value === student.opinionCuo)}
            onChange={(option) =>
              onOpinionChange(student.id, 'opinionCuo', String(option?.value || ''))
            }
            isClearable={false}
          />
        </CTableDataCell>
      )}

      {/* Commentaire CUO (non spécial) */}
      {!isSpecialFiliere && (
        <CTableDataCell>
          <CFormInput
            value={student.commentaireCuo || ''}
            onChange={(e) =>
              onCommentChange(student.id, 'commentaireCuo', e.target.value)
            }
          />
        </CTableDataCell>
      )}

      {/* Mail CUCA envoyé */}
      <CTableDataCell>
        <CIcon
          icon={student.mailCucaEnvoye === 'Oui' ? cilCheckCircle : cilXCircle}
          className={
            student.mailCucaEnvoye === 'Oui' ? 'text-success' : 'text-danger'
          }
        />
        ({student.mailCucaCount || 0})
      </CTableDataCell>

      {/* Mail CUO envoyé (non spécial) */}
      {!isSpecialFiliere && (
        <CTableDataCell>
          <CIcon
            icon={student.mailCuoEnvoye === 'Oui' ? cilCheckCircle : cilXCircle}
            className={
              student.mailCuoEnvoye === 'Oui' ? 'text-success' : 'text-danger'
            }
          />
          ({student.mailCuoCount || 0})
        </CTableDataCell>
      )}

      {/* Exonéré */}
      <CTableDataCell>
        <CFormSwitch
          id={`exonere-${student.id}`}
          checked={student.exonere === 'Oui'}
          onChange={(e) => onStatusChange(student.id, 'exonere', e.target.checked)}
          label=""
        />
      </CTableDataCell>

      {/* Sponsorisé */}
      <CTableDataCell>
        <CFormSwitch
          id={`sponsorise-${student.id}`}
          checked={student.sponsorise === 'Oui'}
          onChange={(e) => onStatusChange(student.id, 'sponsorise', e.target.checked)}
          label=""
        />
      </CTableDataCell>

      {/* Statut */}
      <CTableDataCell>
        <CBadge color={getStatusColor(student.status)}>
          {getStatusLabel(student.status)}
        </CBadge>
      </CTableDataCell>
    </CTableRow>

    {selectedPiece && (
      <RenamePieceModal
        visible={showRenameModal}
        onClose={() => {
          setShowRenameModal(false);
          setSelectedPiece(null);
        }}
        onSave={async (newName) => {
          await onRenamePiece(student.id, selectedPiece.key, newName);
        }}
        currentName={selectedPiece.name}
        pieceKey={selectedPiece.key}
      />
    )}
    </>
  )
}

export default PendingStudentRow
