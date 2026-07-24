// src/views/pages/demandes/components/workflow/FlaggedValidationAction.tsx

import { useState } from 'react'
import { cilWarning } from '@coreui/icons'
import { ActionButton } from '../../components'
import { MotifModal } from '@/components/document-request'

type Props = {
  action: string
  loading?: boolean
  disabled?: boolean           // ← AJOUT
  run: (action: string, payload?: { motif?: string }) => Promise<void>
  onSuccess?: () => Promise<void> | void
  label?: string
}

export default function FlaggedValidationAction({
  action,
  loading = false,
  disabled = false,            // ← AJOUT
  run,
  onSuccess,
  label = 'Valider sous réserve',
}: Props) {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <ActionButton
        label={label}
        icon={cilWarning}
        color="warning"
        variant="outline"
        disabled={loading || disabled}   // ← MODIFIÉ
        onClick={() => setVisible(true)}
      />

      <MotifModal
        visible={visible}
        title="Validation sous réserve"
        confirmLabel="Valider"
        confirmColor="warning"
        placeholder="Entrez le commentaire de réserve..."
        onClose={() => setVisible(false)}
        onConfirm={async (motif) => {
          setVisible(false)
          await run(action, { motif })
          await onSuccess?.()
        }}
      />
    </>
  )
}
