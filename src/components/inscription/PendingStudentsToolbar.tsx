import React from 'react'
import { CButton } from '@coreui/react'

interface PendingStudentsToolbarProps {
  selectedStudentsCount: number
  isSpecialFiliere: boolean
  onSendMail: (type: string) => void
  onExport: (format: string) => void
  onShowValidatedStudentsModal: () => void
}

/**
 * PendingStudentsToolbar - Barre d'outils avec boutons d'action
 */
const PendingStudentsToolbar: React.FC<PendingStudentsToolbarProps> = ({
  selectedStudentsCount,
  isSpecialFiliere,
  onSendMail,
  onExport,
  onShowValidatedStudentsModal,
}) => {
  return (
    <div className="mb-3 d-flex justify-content-between align-items-center">
      {/* Boutons Export */}
      <div>
        <CButton
          color="primary"
          variant="outline"
          size="sm"
          className="me-2"
          onClick={() => onExport('pdf')}
        >
          Exporter PDF
        </CButton>
        <CButton
          color="primary"
          variant="outline"
          size="sm"
          className="me-2"
          onClick={() => onExport('excel')}
        >
          Exporter Excel
        </CButton>
        <CButton
          color="primary"
          variant="outline"
          size="sm"
          className="me-2"
          onClick={() => onExport('word')}
        >
          Exporter Word
        </CButton>
        <CButton
          color="success"
          variant="outline"
          size="sm"
          className="me-2"
          onClick={() => onExport('emails')}
        >
          Exporter Emails
        </CButton>
        <CButton
          color="warning"
          variant="outline"
          size="sm"
          onClick={onShowValidatedStudentsModal}
        >
          Étudiants Validés
        </CButton>
      </div>

      {/* Boutons Mail (visible si sélection) */}
      {selectedStudentsCount > 0 && (
        <div className="d-flex">
          <CButton
            color="primary"
            size="sm"
            className="me-2"
            onClick={() => onSendMail('CUCA')}
          >
            Envoyer Mail CUCA ({selectedStudentsCount})
          </CButton>
          {!isSpecialFiliere && (
            <CButton color="primary" size="sm" onClick={() => onSendMail('CUO')}>
              Envoyer Mail CUO ({selectedStudentsCount})
            </CButton>
          )}
        </div>
      )}
    </div>
  )
}

export default PendingStudentsToolbar
