// src/views/pages/stages/ReglagesPage.tsx
// Réglages du module Stages (responsable) : réglages généraux et groupe
// WhatsApp des stagiaires, chacun dans son onglet.

import { useSearchParams } from 'react-router-dom'
import StageSettingsForm from './StageSettingsForm'
import WhatsAppGroupPanel from './WhatsAppGroupPanel'
import { FilterTabs, PageHead, StagesStyles } from './StagesUi'

type Tab = 'general' | 'whatsapp'
const TABS: { key: Tab; label: string }[] = [
  { key: 'general', label: 'Général' },
  { key: 'whatsapp', label: 'Groupe WhatsApp' },
]

const ReglagesPage = () => {
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('onglet') === 'whatsapp' ? 'whatsapp' : 'general'

  return (
    <div className="stg-page">
      <StagesStyles />
      <PageHead
        title={`Réglages · ${TABS.find(t => t.key === tab)!.label}`}
        subtitle={tab === 'general'
          ? 'Demandes, pointage, rapports, attestations, documents PDF et règlement intérieur.'
          : 'Un seul groupe par année. Les responsables de division en sont administrateurs.'}
      />
      <FilterTabs options={TABS} value={tab} onChange={t => setParams(t === 'general' ? {} : { onglet: t }, { replace: true })} />
      {tab === 'general' ? <StageSettingsForm /> : <WhatsAppGroupPanel />}
    </div>
  )
}

export default ReglagesPage
