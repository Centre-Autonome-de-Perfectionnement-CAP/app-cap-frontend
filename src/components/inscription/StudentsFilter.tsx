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
    niveaux?: Array<{ value: string; label: string }>
    cohorts?: Array<{ value: string; label: string }>
    statuts?: any[]
  }
  selectedYear: string
  setSelectedYear?: (value: string) => void  // ← Make optional
  selectedFiliere?: string
  setSelectedFiliere?: (value: string) => void  // ← Optional
  selectedNiveau?: string
  setSelectedNiveau?: (value: string) => void
  selectedCohort?: string
  setSelectedCohort?: (value: string) => void
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
  showCohort?: boolean
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
  selectedCohort,
  selectedEntryDiploma,
  selectedRedoublant,
  selectedStatut,
  searchQuery,
  onFilterChange,
  onSearchChange,
  showSearch = true,
  showNiveau = false,
  showCohort = false,
  showRedoublant = false,
  showStatut = false,
}) => {
  // Helper pour convertir les années académiques (objets) en options Select
  const mapYearsToOptions = (years: any[]): SelectOption[] => {
    return years.map((y) => {
      if (typeof y === 'object' && y.id) {
        return { value: String(y.id), label: y.libelle || y.academic_year || String(y.id) }
      }
      return { value: String(y), label: String(y) }
    })
  }

  // Helper pour convertir les filières en options Select
  const mapFilieresToOptions = (filieres: any[]): SelectOption[] => {
    return filieres.map((f) => {
      if (typeof f === 'object' && f.id) {
        return { value: String(f.id), label: f.title || f.name || f.libelle || String(f.id) }
      }
      return { value: String(f), label: String(f) }
    })
  }

  // Helper pour convertir les diplômes d'entrée en options Select
  const mapDiplomasToOptions = (diplomas: any[]): SelectOption[] => {
    return diplomas.map((d) => {
      if (typeof d === 'object' && d.id) {
        return { value: String(d.id), label: d.name || d.libelle || String(d.id) }
      }
      return { value: String(d), label: String(d) }
    })
  }

  // Helper pour convertir les niveaux en options Select
  const mapNiveauxToOptions = (niveaux: any[]): SelectOption[] => {
    if (!niveaux || !Array.isArray(niveaux)) return []
    
    return niveaux.map((n) => {
      // Le backend renvoie déjà {value: "1", label: "Niveau 1"}
      if (typeof n === 'object' && n !== null && n.value && n.label) {
        return { value: String(n.value), label: String(n.label) }
      }
      // Fallback pour strings
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
    niveau: [
      { value: 'all', label: 'Tous les niveaux' },
      ...mapNiveauxToOptions(Array.isArray(filterOptions.niveaux) ? filterOptions.niveaux : []),
    ],
    cohort: [
      { value: 'all', label: 'Toutes les cohortes' },
      ...(Array.isArray(filterOptions.cohorts) ? filterOptions.cohorts : []),
    ],
  }

  return (
    <>
      <CRow className="mb-3">
        <CCol xs={12} md={3}>
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
          <CCol xs={12} md={3}>
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

        {selectedEntryDiploma !== undefined && (
          <CCol xs={12} md={3}>
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

        {showCohort && selectedCohort !== undefined && (
          <CCol xs={12} md={3}>
            <label className="form-label fw-semibold">Cohorte</label>
            <Select
              options={selectOptions.cohort}
              value={selectOptions.cohort.find((opt) => opt.value === selectedCohort)}
              onChange={(option) => onFilterChange?.('cohort', option)}
              placeholder="Sélectionner une cohorte..."
              isClearable
            />
          </CCol>
        )}
      </CRow>

      <CRow className="mb-3">
        {showStatut && selectedStatut !== undefined && (
          <CCol xs={12} md={3}>
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

        {showNiveau && selectedNiveau !== undefined && (
          <CCol xs={12} md={3}>
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

        {showRedoublant && selectedRedoublant !== undefined && (
          <CCol xs={12} md={3}>
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

        {showSearch && onSearchChange && (
          <CCol xs={12} md={6}>
            <label className="form-label fw-semibold">Recherche</label>
            <CInputGroup>
              <CFormInput
                placeholder="Exemple : AGOSSOU ou un matricule"
                value={searchQuery || ''}
                onChange={onSearchChange}
              />
            </CInputGroup>
          </CCol>
        )}
      </CRow>
    </>
  )
}

export default StudentsFilter
