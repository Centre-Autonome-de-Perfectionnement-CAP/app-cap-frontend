// src/views/pages/stages/WhatsAppGroupPanel.tsx
// Groupe WhatsApp des stagiaires (page Réglages) : un seul par année ; les
// responsables de division en sont administrateurs.

import { useCallback, useEffect, useState } from 'react'
import {
  CButton, CCard, CCardBody, CFormInput, CSpinner,
  CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilChatBubble, cilLink, cilSync, cilTrash, cilPlus } from '@coreui/icons'
import stageService, { type WhatsAppGroupOverview } from '@/services/stage.service'
import { showSuccess, showError, friendlyError } from '@/components/common/ActionResult'
import { Pill } from './StagesUi'
import { frDate } from './stageUtils'

const WhatsAppGroupPanel = () => {
  const [data, setData] = useState<WhatsAppGroupOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [link, setLink] = useState('')
  const [dissolveOpen, setDissolveOpen] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try { setData(await stageService.whatsappGroup()) } catch (e) { setError(friendlyError(e)) }
  }, [])
  useEffect(() => { load() }, [load])

  const run = async (key: string, fn: () => Promise<any>, title: string) => {
    setBusy(key)
    try {
      const res = await fn()
      if (res?.data) setData(res.data)
      setLinkOpen(false); setDissolveOpen(false)
      await showSuccess(title, res?.message)
    } catch (e) {
      await showError('Opération impossible', friendlyError(e))
    } finally {
      setBusy(null)
    }
  }

  const g = data?.group

  return (
    <div className="stg-page">
      {error && <div className="stg-err">{error}</div>}
      {!data && !error && <div style={{ padding: 40, textAlign: 'center' }}><CSpinner size="sm" color="primary" /></div>}

      {data && (
        <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <CCardBody>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <span style={{ width: 48, height: 48, borderRadius: 14, background: g ? '#dcfce7' : '#f1f5f9', color: g ? '#15803d' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CIcon icon={cilChatBubble} style={{ width: 24 }} />
              </span>
              <div style={{ flex: 1, minWidth: 220 }}>
                {g ? (
                  <>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1.05rem' }}>{g.name}</strong>
                      <Pill color="#15803d" bg="#dcfce7">Actif</Pill>
                      <span className="stg-chip">{g.origin === 'created' ? 'Créé par la plateforme' : 'Groupe existant'}</span>
                    </div>
                    <div className="stg-muted" style={{ marginTop: 4 }}>
                      {g.members} stagiaire(s) ajouté(s) · depuis le {frDate(g.created_at)}
                      {data.waiting > 0 && ` · ${data.waiting} stagiaire(s) en cours pas encore ajouté(s)`}
                    </div>
                  </>
                ) : (
                  <>
                    <strong style={{ fontSize: '1.05rem' }}>Pas encore de groupe pour {data.year}</strong>
                    <div className="stg-muted" style={{ marginTop: 4 }}>
                      Il sera créé automatiquement à l'arrivée du premier stagiaire de l'année. Vous pouvez aussi le créer maintenant
                      ou utiliser un groupe existant.
                      {data.waiting > 0 && ` ${data.waiting} stagiaire(s) en cours attendent le groupe.`}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
              {!g && (
                <>
                  <CButton color="success" style={{ color: '#fff' }} disabled={!!busy}
                    onClick={() => run('create', () => stageService.createWhatsappGroup(), 'Groupe créé')}>
                    {busy === 'create' ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilPlus} className="me-1" />}Créer le groupe {data.year}
                  </CButton>
                  <CButton color="primary" variant="outline" disabled={!!busy} onClick={() => { setLink(''); setLinkOpen(true) }}>
                    <CIcon icon={cilLink} className="me-1" />Utiliser un groupe existant
                  </CButton>
                </>
              )}
              {g && (
                <>
                  <CButton color="primary" variant="outline" disabled={!!busy}
                    onClick={() => run('sync', () => stageService.syncWhatsappGroup(), 'Groupe mis à jour')}>
                    {busy === 'sync' ? <CSpinner size="sm" className="me-1" /> : <CIcon icon={cilSync} className="me-1" />}Mettre à jour maintenant
                  </CButton>
                  <CButton color="danger" variant="outline" disabled={!!busy} onClick={() => setDissolveOpen(true)}>
                    <CIcon icon={cilTrash} className="me-1" />Dissoudre le groupe
                  </CButton>
                </>
              )}
            </div>

            <div style={{ marginTop: 16, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px', fontSize: '.875rem', color: '#475569' }}>
              Chaque stagiaire est ajouté le jour où son stage commence ; si ses réglages WhatsApp l'empêchent, il reçoit le lien du groupe en privé.
              Il en est retiré une semaine après la fin de son stage. La mise à jour se fait automatiquement chaque jour.
            </div>
          </CCardBody>
        </CCard>
      )}

      {data && data.history.length > 0 && (
        <CCard className="border-0 shadow-sm" style={{ borderRadius: 14 }}>
          <CCardBody>
            <strong>Historique</strong>
            <div className="stg-list" style={{ marginTop: 10 }}>
              {data.history.map(h => (
                <div key={h.id} className="stg-card stg-row2">
                  <span style={{ flex: 1 }}>{h.name} <span className="stg-muted">({h.year})</span></span>
                  <span className="stg-muted">créé le {frDate(h.created_at)}</span>
                  {h.dissolved_at ? <Pill color="#64748b" bg="#f1f5f9">Dissous le {frDate(h.dissolved_at)}</Pill> : <Pill color="#15803d" bg="#dcfce7">Actif</Pill>}
                </div>
              ))}
            </div>
          </CCardBody>
        </CCard>
      )}

      <CModal visible={linkOpen} onClose={() => setLinkOpen(false)} alignment="center">
        <CModalHeader><CModalTitle style={{ fontSize: '1rem' }}>Utiliser un groupe existant</CModalTitle></CModalHeader>
        <CModalBody>
          <CFormInput value={link} maxLength={200} onChange={e => setLink(e.target.value)} placeholder="Exemple : https://chat.whatsapp.com/…" />
          <div className="stg-muted" style={{ marginTop: 8 }}>
            Collez le lien d'invitation du groupe. Le numéro du CAP le rejoindra ; nommez-le ensuite administrateur pour qu'il puisse y ajouter les stagiaires.
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setLinkOpen(false)}>Annuler</CButton>
          <CButton color="primary" disabled={!!busy || !link.trim()} onClick={() => run('link', () => stageService.linkWhatsappGroup(link.trim()), 'Groupe enregistré')}>
            {busy === 'link' && <CSpinner size="sm" className="me-1" />}Utiliser ce groupe
          </CButton>
        </CModalFooter>
      </CModal>

      <CModal visible={dissolveOpen} onClose={() => setDissolveOpen(false)} alignment="center">
        <CModalHeader><CModalTitle style={{ fontSize: '1rem' }}>Dissoudre « {g?.name} » ?</CModalTitle></CModalHeader>
        <CModalBody>
          Tous les membres seront retirés du groupe, puis le numéro du CAP le quittera. Cette action est définitive.
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="ghost" onClick={() => setDissolveOpen(false)}>Annuler</CButton>
          <CButton color="danger" style={{ color: '#fff' }} disabled={!!busy || !g}
            onClick={() => g && run('dissolve', () => stageService.dissolveWhatsappGroup(g.id), 'Groupe dissous')}>
            {busy === 'dissolve' && <CSpinner size="sm" className="me-1" />}Dissoudre
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default WhatsAppGroupPanel
