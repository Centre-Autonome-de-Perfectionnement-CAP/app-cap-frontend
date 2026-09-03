import React, { useState } from 'react'
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormSelect,
  CFormLabel,
  CFormTextarea,
  CAlert,
  CBadge,
} from '@coreui/react'
import type { PendingStudentData } from '../../types/inscription.types'

interface TransferWaveModalProps {
  visible: boolean
  onClose: () => void
  onTransfer: (studentId: number, toWave: number, reason: string) => Promise<void>
  student: PendingStudentData | null
}

const TransferWaveModal: React.FC<TransferWaveModalProps> = ({
  visible,
  onClose,
  onTransfer,
  student,
}) => {
  const currentWave = student?.initial_wave || 1
  const [targetWave, setTargetWave] = useState<number>(currentWave === 1 ? 2 : currentWave + 1)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mettre à jour la vague cible par défaut quand l'étudiant change
  React.useEffect(() => {
    if (student) {
      const cw = student.initial_wave || 1
      setTargetWave(cw === 1 ? 2 : cw === 2 ? 3 : 1)
      setReason('')
      setError(null)
    }
  }, [student])

  if (!student) return null

  const handleTransfer = async () => {
    if (targetWave === currentWave) {
      setError(`Le dossier est déjà affecté à la Vague ${currentWave}.`)
      return
    }

    setLoading(true)
    setError(null)
    try {
      await onTransfer(student.id, targetWave, reason)
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Erreur lors du transfert de vague.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <CModal visible={visible} onClose={onClose} backdrop="static">
      <CModalHeader>
        <CModalTitle className="d-flex align-items-center gap-2">
          <span>Transférer de Vague</span>
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {error && (
          <CAlert color="danger" dismissible onClose={() => setError(null)}>
            {error}
          </CAlert>
        )}

        <div className="p-3 bg-light rounded mb-3">
          <div className="fw-bold fs-6">
            {student.last_name} {student.first_name}
          </div>
          <div className="text-muted small">
            Filière : {student.department || 'N/A'} | Email : {student.email}
          </div>
          <div className="mt-2 d-flex align-items-center gap-2">
            <span className="small text-muted">Vague actuelle :</span>
            <CBadge color="primary">Vague {currentWave}</CBadge>
            {student.transferred_from_wave && (
              <span className="small text-muted fst-italic">
                (Transféré depuis Vague {student.transferred_from_wave})
              </span>
            )}
          </div>
        </div>

        <div className="mb-3">
          <CFormLabel className="fw-semibold">Nouvelle Vague de destination *</CFormLabel>
          <CFormSelect
            value={targetWave}
            onChange={(e) => setTargetWave(parseInt(e.target.value))}
            disabled={loading}
          >
            {[1, 2, 3, 4].map((waveNum) => (
              <option key={waveNum} value={waveNum} disabled={waveNum === currentWave}>
                Vague {waveNum} {waveNum === currentWave ? '(Actuelle)' : ''}
              </option>
            ))}
          </CFormSelect>
        </div>

        <div className="mb-3">
          <CFormLabel className="fw-semibold">Motif du transfert (Optionnel)</CFormLabel>
          <CFormTextarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ex: Demande de report en vague 2, réexamen suite à complément de dossier..."
            disabled={loading}
          />
          <div className="form-text">
            Ce motif sera consigné dans l'historique d'audit du dossier.
          </div>
        </div>
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onClose} disabled={loading}>
          Annuler
        </CButton>
        <CButton
          color="primary"
          onClick={handleTransfer}
          disabled={loading || targetWave === currentWave}
        >
          {loading ? 'Transfert en cours...' : `Transférer vers Vague ${targetWave}`}
        </CButton>
      </CModalFooter>
    </CModal>
  )
}

export default TransferWaveModal
