import React from 'react'
import Select, { SingleValue } from 'react-select'
import { CRow, CCol, CInputGroup, CFormInput } from '@coreui/react'

interface SelectOption {
  value: string
  label: string
}

interface StudentsFilterProps {
  filterOptions: {
    years?: any[]
    filieres?: any[]
    entryDiplomas?: any[]
    niveaux?: any
    statuts?: any[]
  }
  selectedYear: string
  setSelectedYear?: (value: string) => void  // ← Make optional
  selectedFiliere?: string
  setSelectedFiliere?: (value: string) => void  // ← Optional
  selectedNiveau?: string
  setSelectedNiveau?: (value: string) => void
  selectedEntryDiploma?: string
  setSelectedEntryDiploma?: (value: string) => void  // ← Optional
  selectedRedoublant?: string
  setSelectedRedoublant?: (value: string) => void
  selectedStatut?: string
  setSelectedStatut?: (value: string) => void  // ← Optional
  searchQuery?: string
  setSearchQuery?: (value: string) => void
  onFilterChange?: (name: string, option: SingleValue<SelectOption>) => void
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  showSearch?: boolean
  showNiveau?: boolean
  showRedoublant?: boolean
  showStatut?: boolean
}

/**
 * Composant de filtrage réutilisable pour les listes d'étudiants
 * Gère correctement le mapping des objets complexes (AcademicYear, etc.)
 */
const StudentsFilter: React.FC<StudentsFilterProps> = ({
  filterOptions,
  selectedYear,
  selectedFiliere,
  selectedNiveau,
  selectedEntryDiploma,
  selectedRedoublant,
  selectedStatut,
  searchQuery,
  onFilterChange,
  onSearchChange,
  showSearch = true,
  showNiveau = false,
  showRedoublant = false,
  showStatut = false,
}) => {
  // Helper pour convertir les années académiques (objets) en options Select
  const mapYearsToOptions = (years: any[]): SelectOption[] => {
    return years.map((y) => {
      // Si c'est un objet AcademicYear avec {id, libelle, date_debut, date_fin}
      if (typeof y === 'object' && y.libelle) {
        return { value: y.libelle, label: y.libelle }
      }
      // Si c'est déjà une chaîne
      return { value: String(y), label: String(y) }
    })
  }

  // Helper pour convertir les filières en options Select
  const mapFilieresToOptions = (filieres: any[]): SelectOption[] => {
    return filieres.map((f) => {
      if (typeof f === 'object' && f.title) {
        return { value: f.title, label: f.title }
      }
      if (typeof f === 'object' && f.libelle) {
        return { value: f.libelle, label: f.libelle }
      }
      if (typeof f === 'object' && f.name) {
        return { value: f.name, label: f.name }
      }
      return { value: String(f), label: String(f) }
    })
  }

  // Helper pour convertir les diplômes d'entrée en options Select
  const mapDiplomasToOptions = (diplomas: any[]): SelectOption[] => {
    return diplomas.map((d) => {
      if (typeof d === 'object' && d.name) {
        return { value: d.name, label: d.name }
      }
      if (typeof d === 'object' && d.libelle) {
        return { value: d.libelle, label: d.libelle }
      }
      return { value: String(d), label: String(d) }
    })
  }

  // Helper pour convertir les niveaux en options Select
  const mapNiveauxToOptions = (niveaux: any[]): SelectOption[] => {
    if (!niveaux) return []
    return niveaux.map((n) => {
      if (typeof n === 'object' && n.label) {
        return { value: String(n.value), label: n.label }
      }
      return { value: String(n), label: String(n) }
    })
  }

  // Préparer les options pour les selects
  const selectOptions = {
    year: [
      { value: 'all', label: 'Toutes les années' },
      ...mapYearsToOptions(filterOptions.years || []),
    ],
    filiere: [
      { value: 'all', label: 'Toutes les filières' },
      ...mapFilieresToOptions(filterOptions.filieres || []),
    ],
    entryDiploma: [
      { value: 'all', label: 'Tous les diplômes' },
      ...mapDiplomasToOptions(filterOptions.entryDiplomas || []),
    ],
    redoublant: [
      { value: 'all', label: 'Tous' },
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
    ],
    statut: [
      { value: 'all', label: 'Tous les statuts' },
      ...(filterOptions.statuts || []).map((s: any) => 
        typeof s === 'object' && s.value && s.label
          ? { value: s.value, label: s.label }
          : { value: String(s), label: String(s) }
      ),
    ],
    niveau:
      selectedFiliere === 'all' || !selectedFiliere
        ? [{ value: 'all', label: 'Tous les niveaux' }]
        : [
            { value: 'all', label: 'Tous les niveaux' },
            ...mapNiveauxToOptions(filterOptions.niveaux?.[selectedFiliere] || []),
          ],
  }

  return (
    <>
      <CRow className="mb-3">
        <CCol xs={12} md={showNiveau || showRedoublant ? 2 : 3}>
          <label className="form-label fw-semibold">Année Académique</label>
          <Select
            options={selectOptions.year}
            value={selectOptions.year.find((opt) => opt.value === selectedYear)}
            onChange={(option) => onFilterChange?.('year', option)}
            placeholder="Sélectionner une année..."
            isClearable
          />
        </CCol>

        {selectedFiliere !== undefined && (
          <CCol xs={12} md={showNiveau || showRedoublant ? 2 : 3}>
            <label className="form-label fw-semibold">Filière</label>
            <Select
              options={selectOptions.filiere}
              value={selectOptions.filiere.find((opt) => opt.value === selectedFiliere)}
              onChange={(option) => onFilterChange?.('filiere', option)}
              placeholder="Sélectionner une filière..."
              isClearable
            />
          </CCol>
        )}

        {showNiveau && selectedNiveau !== undefined && (
          <CCol xs={12} md={2}>
            <label className="form-label fw-semibold">Niveau d'études</label>
            <Select
              options={selectOptions.niveau}
              value={selectOptions.niveau.find((opt) => opt.value === selectedNiveau)}
              onChange={(option) => onFilterChange?.('niveau', option)}
              placeholder="Sélectionner un niveau..."
              isClearable
            />
          </CCol>
        )}

        {selectedEntryDiploma !== undefined && (
          <CCol xs={12} md={showNiveau || showRedoublant ? 2 : 3}>
            <label className="form-label fw-semibold">Diplôme d'entrée</label>
            <Select
              options={selectOptions.entryDiploma}
              value={selectOptions.entryDiploma.find((opt) => opt.value === selectedEntryDiploma)}
              onChange={(option) => onFilterChange?.('entryDiploma', option)}
              placeholder="Sélectionner un diplôme..."
              isClearable
            />
          </CCol>
        )}

        {showRedoublant && selectedRedoublant !== undefined && (
          <CCol xs={12} md={2}>
            <label className="form-label fw-semibold">Redoublant</label>
            <Select
              options={selectOptions.redoublant}
              value={selectOptions.redoublant.find((opt) => opt.value === selectedRedoublant)}
              onChange={(option) => onFilterChange?.('redoublant', option)}
              placeholder="Sélectionner oui/non..."
              isClearable
            />
          </CCol>
        )}

        {showStatut && selectedStatut !== undefined && (
          <CCol xs={12} md={showNiveau || showRedoublant ? 2 : 3}>
            <label className="form-label fw-semibold">Statut</label>
            <Select
              options={selectOptions.statut}
              value={selectOptions.statut.find((opt) => opt.value === selectedStatut)}
              onChange={(option) => onFilterChange?.('statut', option)}
              placeholder="Sélectionner un statut..."
              isClearable
            />
          </CCol>
        )}
      </CRow>

      {showSearch && onSearchChange && (
        <CRow className="mb-3">
          <CCol xs={12} md={6}>
            <CInputGroup>
              <CFormInput
                placeholder="Rechercher..."
                value={searchQuery || ''}
                onChange={onSearchChange}
              />
            </CInputGroup>
          </CCol>
        </CRow>
      )}
    </>
  )
}

export default StudentsFilter
