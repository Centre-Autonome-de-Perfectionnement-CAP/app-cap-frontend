import React, { useState } from 'react'
import {
  CTableRow,
  CTableDataCell,
  CFormCheck,
  CFormInput,
  CFormSwitch,
  CBadge,
  CButton,
  CTooltip,
} from '@coreui/react'
import { CIcon } from '@coreui/icons-react'
import { cilCheckCircle, cilXCircle, cilPencil, cilTransfer } from '@coreui/icons'
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
  onTransferWave?: (student: PendingStudentData) => void
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
  onTransferWave,
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
        <CTableDataCell>
          {/* Ligne 1 : Nom + badges de statut */}
          <div className="d-flex align-items-center flex-wrap gap-1">
            <span className="fw-semibold">{student.first_name + ' ' + student.last_name}</span>
            {/* Badge Vague */}
            {student.initial_wave && (
              <CBadge
                color="info"
                style={{ fontSize: '0.68rem', fontFamily: 'monospace', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}
                title={`Dossier affecté à la Vague ${student.initial_wave}`}
              >
                VAGUE {student.initial_wave}
              </CBadge>
            )}
            {/* Badge Transféré avec historique */}
            {student.transfer_history && student.transfer_history.length > 0 && (
              <CTooltip
                content={
                  <div style={{ textAlign: 'left', minWidth: '220px' }}>
                    <strong>Historique des transferts :</strong>
                    {student.transfer_history.map((t, i) => (
                      <div key={i} style={{ marginTop: '4px', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.2)' : 'none', paddingTop: i > 0 ? '4px' : 0 }}>
                        <div>V{t.from_wave} ➔ V{t.to_wave}</div>
                        <div style={{ opacity: 0.8, fontSize: '0.85em' }}>{new Date(t.transferred_at).toLocaleString('fr-FR')}</div>
                        <div style={{ opacity: 0.8, fontSize: '0.85em' }}>Par : {t.transferred_by}</div>
                        {t.reason && <div style={{ opacity: 0.7, fontSize: '0.82em', fontStyle: 'italic' }}>{t.reason}</div>}
                      </div>
                    ))}
                  </div>
                }
                placement="top"
              >
                <CBadge
                  color="secondary"
                  style={{ fontSize: '0.68rem', whiteSpace: 'nowrap', cursor: 'help' }}
                >
                  🔄 Transféré ×{student.transfer_history.length}
                </CBadge>
              </CTooltip>
            )}
            {/* Badge Modifié par l'étudiant */}
            {student.is_updated_by_student && student.last_student_update_at && (
              <CBadge
                color="warning"
                style={{ fontSize: '0.68rem', whiteSpace: 'nowrap', cursor: 'help' }}
                title={
                  Array.isArray(student.student_update_summary) && student.student_update_summary.length > 0
                    ? 'Modifications : ' + student.student_update_summary.flatMap((item: any) => item.changes || []).join(' | ')
                    : (student.student_update_summary && typeof student.student_update_summary === 'object'
                        ? 'Champs modifiés : ' + Object.keys(student.student_update_summary).join(', ')
                        : "Dossier modifié par l'étudiant")
                }
              >
                🟡 Modifié le {new Date(student.last_student_update_at).toLocaleDateString('fr-FR')}
              </CBadge>
            )}
          </div>
          {/* Ligne 2 : Bouton de transfert — toujours visible */}
          {onTransferWave && (
            <div className="mt-1">
              <CButton
                size="sm"
                color="warning"
                className="py-0 px-2 d-flex align-items-center gap-1"
                style={{ fontSize: '0.72rem', fontWeight: 600 }}
                onClick={() => onTransferWave(student)}
              >
                <CIcon icon={cilTransfer} size="sm" />
                Changer de vague
              </CButton>
            </div>
          )}
        </CTableDataCell>

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
