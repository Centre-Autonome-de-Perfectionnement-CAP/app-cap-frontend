// src/views/pages/stages/WorkAttestationButton.tsx
// Dossier d'un ancien stagiaire venu ensuite travailler au CAP : préparer son
// attestation de travail. Deux façons : lui envoyer le lien (il complète
// diplôme, période, fonctions et tâches), ou remplir la fiche soi-même.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CButton, CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle, CSpinner } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilBadge, cilPencil, cilSend } from '@coreui/icons'
import stageService from '@/services/stage.service'
import { friendlyError, showSuccess } from '@/components/common/ActionResult'

const WorkAttestationButton = ({ stage }: { stage: { id: number; nom_complet: string; whatsapp: string | null } }) => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<'lien' | 'remplir' | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const go = async (mode: 'lien' | 'remplir') => {
    setBusy(mode); setErr(null)
    try {
      const res: any = await stageService.workAttestationFromStage(stage.id, mode)
      setOpen(false)
      navigate(`/stages/attestations?type=travail&attestation=${res.data.id}`)
      if (mode === 'lien') await showSuccess('Lien envoyé', res?.message)
    } catch (e) {
      setErr(friendlyError(e))
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <CButton color="primary" variant="outline" size="sm" onClick={() => { setErr(null); setOpen(true) }}>
        <CIcon icon={cilBadge} className="me-1" />Attestation de travail
      </CButton>
      <CModal visible={open} onClose={() => setOpen(false)} alignment="center" fullscreen="sm">
        <CModalHeader><CModalTitle style={{ fontSize: '1rem' }}>Attestation de travail : {stage.nom_complet}</CModalTitle></CModalHeader>
        <CModalBody>
          <p style={{ margin: '0 0 12px', color: '#334155' }}>
            Pour un ancien stagiaire venu ensuite travailler au CAP. Son identité est reprise de son dossier.
          </p>
          <div style={{ display: 'grid', gap: 10 }}>
            <CButton color="primary" disabled={!!busy || !stage.whatsapp} onClick={() => go('lien')} style={{ textAlign: 'left' }}>
              {busy === 'lien' ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilSend} className="me-1" />}
              Lui envoyer le lien {stage.whatsapp ? `(${stage.whatsapp})` : ''}
              <span style={{ display: 'block', fontSize: '.875rem', fontWeight: 400 }}>Il complète diplôme, période, fonctions et tâches ; vous vérifiez ensuite.</span>
            </CButton>
            <CButton color="secondary" variant="outline" disabled={!!busy} onClick={() => go('remplir')} style={{ textAlign: 'left' }}>
              {busy === 'remplir' ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilPencil} className="me-1" />}
              Remplir la fiche moi-même
              <span style={{ display: 'block', fontSize: '.875rem', fontWeight: 400 }}>Fiche préremplie, à compléter puis valider.</span>
            </CButton>
          </div>
          {err && <div className="stg-err" style={{ marginTop: 12 }}>{err}</div>}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setOpen(false)}>Fermer</CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default WorkAttestationButton
