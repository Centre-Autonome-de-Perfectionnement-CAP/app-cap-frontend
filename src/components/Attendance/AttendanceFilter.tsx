import React from 'react'
import Select, { SingleValue } from 'react-select'
import { CRow, CCol, CFormInput } from '@coreui/react'

interface SelectOption {
  value: string
  label: string
}

interface AttendanceFilterProps {
  filterOptions: {
    annees?:   string[]
    filieres?: string[]
    niveaux?:  string[]
    matieres?: string[]
    salles?:   string[]
    heures?:   string[] // ← créneaux horaires
  }
  selectedYear:     string
  selectedFiliere?: string
  selectedNiveau?:  string
  selectedMatiere?: string
  selectedSalle?:   string
  selectedHeure?:   string // ← nouveau
  searchQuery?:     string
  onFilterChange:   (name: string, option: SingleValue<SelectOption>) => void
  onSearchChange?:  (e: React.ChangeEvent<HTMLInputElement>) => void
  showMatiere?:     boolean
  showSalle?:       boolean
  showHeure?:       boolean // ← nouveau
  showSearch?:      boolean
}

/**
 * AttendanceFilter - Composant de filtrage adapté de StudentsFilter (Inscription)
 * Supporte : année, filière, niveau, matière, salle, heure (créneau)
 */
const AttendanceFilter: React.FC<AttendanceFilterProps> = ({
  filterOptions,
  selectedYear,
  selectedFiliere,
  selectedNiveau,
  selectedMatiere,
  selectedSalle,
  selectedHeure,
  searchQuery,
  onFilterChange,
  onSearchChange,
  showMatiere  = false,
  showSalle    = false,
  showHeure    = false,
  showSearch   = false,
}) => {

  // Convertir tableau de strings en options react-select
  const toOptions = (items: string[] = [], allLabel: string): SelectOption[] => [
    { value: 'all', label: allLabel },
    ...items.map(item => ({ value: item, label: item })),
  ]

  const findOption = (opts: SelectOption[], val?: string) =>
    opts.find(o => o.value === val) || null

  const opts = {
    year:    toOptions(filterOptions.annees,   'Toutes les années'),
    filiere: toOptions(filterOptions.filieres, 'Toutes les filières'),
    niveau:  toOptions(filterOptions.niveaux,  'Tous les niveaux'),
    matiere: toOptions(filterOptions.matieres, 'Toutes les matières'),
    salle:   toOptions(filterOptions.salles,   'Toutes les salles'),
    heure:   toOptions(filterOptions.heures,   'Tous les créneaux'),
  }

  return (
    <>
      <CRow className="mb-3 g-3">

        {/* Année académique — toujours visible */}
        <CCol xs={12} md={3}>
          <label className="form-label fw-semibold">Année Académique</label>
          <Select
            options={opts.year}
            value={findOption(opts.year, selectedYear)}
            onChange={opt => onFilterChange('year', opt)}
            placeholder="Toutes les années"
            isClearable
          />
        </CCol>

        {/* Filière */}
        {selectedFiliere !== undefined && (
          <CCol xs={12} md={3}>
            <label className="form-label fw-semibold">Filière</label>
            <Select
              options={opts.filiere}
              value={findOption(opts.filiere, selectedFiliere)}
              onChange={opt => onFilterChange('filiere', opt)}
              placeholder="Toutes les filières"
              isClearable
            />
          </CCol>
        )}

        {/* Niveau */}
        {selectedNiveau !== undefined && (
          <CCol xs={12} md={3}>
            <label className="form-label fw-semibold">Niveau</label>
            <Select
              options={opts.niveau}
              value={findOption(opts.niveau, selectedNiveau)}
              onChange={opt => onFilterChange('niveau', opt)}
              placeholder="Tous les niveaux"
              isClearable
            />
          </CCol>
        )}

        {/* Matière */}
        {showMatiere && selectedMatiere !== undefined && (
          <CCol xs={12} md={3}>
            <label className="form-label fw-semibold">Matière</label>
            <Select
              options={opts.matiere}
              value={findOption(opts.matiere, selectedMatiere)}
              onChange={opt => onFilterChange('matiere', opt)}
              placeholder="Toutes les matières"
              isClearable
            />
          </CCol>
        )}

        {/* Salle */}
        {showSalle && selectedSalle !== undefined && (
          <CCol xs={12} md={3}>
            <label className="form-label fw-semibold">Salle</label>
            <Select
              options={opts.salle}
              value={findOption(opts.salle, selectedSalle)}
              onChange={opt => onFilterChange('salle', opt)}
              placeholder="Toutes les salles"
              isClearable
            />
          </CCol>
        )}

        {/* Heure / Créneau horaire ← nouveau */}
        {showHeure && selectedHeure !== undefined && (
          <CCol xs={12} md={3}>
            <label className="form-label fw-semibold">Heure</label>
            <Select
              options={opts.heure}
              value={findOption(opts.heure, selectedHeure)}
              onChange={opt => onFilterChange('heure', opt)}
              placeholder="Tous les créneaux"
              isClearable
            />
          </CCol>
        )}

        {/* Recherche texte */}
        {showSearch && onSearchChange && (
          <CCol xs={12} md={3}>
            <label className="form-label fw-semibold">Recherche</label>
            <CFormInput
              placeholder="Nom ou matricule..."
              value={searchQuery || ''}
              onChange={onSearchChange}
            />
          </CCol>
        )}

      </CRow>
    </>
  )
}

export default AttendanceFilter
