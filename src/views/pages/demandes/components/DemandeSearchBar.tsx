// src/views/pages/demandes/components/DemandeSearchBar.tsx
// Barre de recherche + filtre par type, partagée par tous les dashboards.

import { CFormInput, CFormSelect, CInputGroup, CInputGroupText } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import { TYPE_LABELS } from '@/types/document-request.types'

interface Props {
  search: string
  onSearchChange: (v: string) => void
  typeFilter?: string
  onTypeChange?: (v: string) => void
  showTypeFilter?: boolean
}

const DemandeSearchBar = ({
  search, onSearchChange,
  typeFilter = '', onTypeChange,
  showTypeFilter = false,
}: Props) => (
  <div className="d-flex gap-2 flex-wrap">
    <CInputGroup size="sm" style={{ width: 200 }}>
      <CInputGroupText><CIcon icon={cilSearch} /></CInputGroupText>
      <CFormInput
        placeholder="Référence, nom…"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
      />
    </CInputGroup>
    {showTypeFilter && onTypeChange && (
      <CFormSelect size="sm" style={{ width: 170 }} value={typeFilter}
        onChange={e => onTypeChange(e.target.value)}>
        <option value="">Tous les types</option>
        {Object.entries(TYPE_LABELS).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </CFormSelect>
    )}
  </div>
)

export default DemandeSearchBar
