import React from 'react'
import Select, { SingleValue } from 'react-select'
import { CRow, CCol, CInputGroup, CFormInput, CButton } from '@coreui/react'

interface SelectOption {
  value: string
  label: string
}

interface AttestationFiltersProps {
  filterOptions: {
    years?: any[]
    filieres?: any[]
    cohorts?: any[]
  }
  selectedYear: string
  selectedFiliere: string
  selectedCohort: string
  searchQuery?: string
  onFilterChange: (name: string, option: SingleValue<SelectOption>) => void
  onSearchChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  showSearch?: boolean
}

const AttestationFilters: React.FC<AttestationFiltersProps> = ({
  filterOptions,
  selectedYear,
  selectedFiliere,
  selectedCohort,
  searchQuery,
  onFilterChange,
  onSearchChange,
  showSearch = true,
}) => {
  const mapYearsToOptions = (years: any[]): SelectOption[] => {
    return years.map((y) => ({
      value: String(y.id),
      label: y.libelle || `${y.year_start}-${y.year_end}`,
    }))
  }

  const mapFilieresToOptions = (filieres: any[]): SelectOption[] => {
    return filieres.map((f) => ({
      value: String(f.id),
      label: f.name || f.title,
    }))
  }

  const mapCohortsToOptions = (cohorts: any[]): SelectOption[] => {
    return cohorts.map((c) => {
      const cohortValue = typeof c === 'string' ? c : (c.cohort || c.value || String(c))
      return { value: cohortValue, label: cohortValue }
    })
  }

  const selectOptions = {
    year: [
      { value: 'all', label: 'Toutes les années' },
      ...mapYearsToOptions(filterOptions.years || []),
    ],
    filiere: [
      { value: 'all', label: 'Toutes les filières' },
      ...mapFilieresToOptions(filterOptions.filieres || []),
    ],
    cohort: [
      { value: 'all', label: 'Toutes les cohortes' },
      ...mapCohortsToOptions(filterOptions.cohorts || []),
    ],
  }

  return (
    <>
      <CRow className="mb-3">
        <CCol xs={12} md={showSearch ? 3 : 4}>
          <label className="form-label fw-semibold">Année Académique</label>
          <Select
            options={selectOptions.year}
            value={selectOptions.year.find((opt) => opt.value === selectedYear)}
            onChange={(option) => onFilterChange('year', option)}
            placeholder="Sélectionner une année..."
            isClearable
          />
        </CCol>

        <CCol xs={12} md={showSearch ? 3 : 4}>
          <label className="form-label fw-semibold">Filière</label>
          <Select
            options={selectOptions.filiere}
            value={selectOptions.filiere.find((opt) => opt.value === selectedFiliere)}
            onChange={(option) => onFilterChange('filiere', option)}
            placeholder="Sélectionner une filière..."
            isClearable
          />
        </CCol>

        <CCol xs={12} md={showSearch ? 3 : 4}>
          <label className="form-label fw-semibold">Cohorte</label>
          <Select
            options={selectOptions.cohort}
            value={selectOptions.cohort.find((opt) => opt.value === selectedCohort)}
            onChange={(option) => onFilterChange('cohort', option)}
            placeholder="Sélectionner une cohorte..."
            isClearable
          />
        </CCol>

        {showSearch && onSearchChange && (
          <CCol xs={12} md={3}>
            <label className="form-label fw-semibold">Recherche</label>
            <CInputGroup>
              <CFormInput
                placeholder="Rechercher..."
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

export default AttestationFilters
