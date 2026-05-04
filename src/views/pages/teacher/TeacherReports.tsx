import React, { useState } from "react"
import {
  CCard,
  CCardBody,
  CCardTitle,
  CRow,
  CCol,
  CButton,
  CForm,
  CFormLabel,
  CFormInput,
  CAlert,
  CSpinner
} from "@coreui/react"
import CIcon from "@coreui/icons-react"
import teacherService from '@/services/teacher.service'
import { cilDescription, cilCloudDownload } from "@coreui/icons"

const MOCK_PRESENCES = [
  { matricule: 'ETU001', nom: 'AGBODJI Koffi',  seance: '10/01/2025', statut: 'Présent' },
  { matricule: 'ETU002', nom: 'BELLO Fatima',   seance: '10/01/2025', statut: 'Absent'  },
  { matricule: 'ETU003', nom: 'DOSSOU Marc',    seance: '10/01/2025', statut: 'Présent' },
  { matricule: 'ETU004', nom: 'KPADE Sylvie',   seance: '17/01/2025', statut: 'Absent'  },
  { matricule: 'ETU005', nom: 'HOUNSOU Désiré', seance: '17/01/2025', statut: 'Présent' },
  { matricule: 'ETU006', nom: 'TOSSOU Aline',   seance: '17/01/2025', statut: 'Présent' },
]

const TeacherReports = () => {

  const [filiere,      setFiliere]      = useState("")
  const [startDate,    setStartDate]    = useState("")
  const [endDate,      setEndDate]      = useState("")
  const [error,        setError]        = useState("")
  const [loadingPDF,   setLoadingPDF]   = useState(false)
  const [loadingExcel, setLoadingExcel] = useState(false)

  // Validation
  const validate = () => {
    if (!filiere)            { setError("Veuillez renseigner la filière.");                          return false }
    if (!startDate)          { setError("Veuillez renseigner la date de début.");                    return false }
    if (!endDate)            { setError("Veuillez renseigner la date de fin.");                      return false }
    if (startDate > endDate) { setError("La date de début ne peut pas être supérieure à la date de fin."); return false }
    setError("")
    return true
  }

  // Téléchargement PDF automatique
  const generatePDF = () => {
    if (!validate()) return
    setLoadingPDF(true)

    // TODO: remplacer par → presenceService.generatePDF({ filiere, startDate, endDate })
    setTimeout(() => {
      setLoadingPDF(false)

      const content = [
        `RAPPORT DE PRÉSENCE`,
        `Filière  : ${filiere}`,
        `Période  : ${startDate} au ${endDate}`,
        ``,
        `Matricule | Nom et Prénoms       | Date séance | Statut`,
        `--------------------------------------------------------------`,
        ...MOCK_PRESENCES.map(p =>
          `${p.matricule} | ${p.nom.padEnd(20)} | ${p.seance}  | ${p.statut}`
        )
      ].join('\n')

      const blob = new Blob([content], { type: 'application/pdf' })
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = `rapport_presence_${filiere}_${startDate}_${endDate}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 1000)
  }

  // Téléchargement Excel (CSV) automatique
  const generateExcel = () => {
    if (!validate()) return
    setLoadingExcel(true)

    // TODO: remplacer par → presenceService.generateExcel({ filiere, startDate, endDate })
    setTimeout(() => {
      setLoadingExcel(false)

      const rows = [
        [`Rapport de présence - Filière: ${filiere} - Période: ${startDate} au ${endDate}`],
        [],
        ['Matricule', 'Nom et Prénoms', 'Date séance', 'Statut'],
        ...MOCK_PRESENCES.map(p => [p.matricule, p.nom, p.seance, p.statut])
      ]

      const csvContent = rows.map(r => r.join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url  = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href     = url
      link.download = `rapport_presence_${filiere}_${startDate}_${endDate}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 1000)
  }

  return (
    <div className="container mt-4">

      <h2 className="mb-4">📄 Rapports de présence</h2>

      <CRow>
        <CCol md={8}>
          <CCard className="shadow border-0">
            <CCardBody>

              <div className="text-center mb-4">
                <CIcon icon={cilDescription} size="3xl" className="text-success"/>
                <CCardTitle className="mt-3">
                  Générer un rapport de présence
                </CCardTitle>
              </div>

              {error && (
                <CAlert color="danger" dismissible onClose={() => setError("")}>
                  {error}
                </CAlert>
              )}

              <CForm>

                {/* FILIÈRE */}
                <CRow className="mb-3">
                  <CCol md={12}>
                    <CFormLabel className="fw-semibold">
                      Filière <span className="text-danger">*</span>
                    </CFormLabel>
                    <CFormInput
                      type="text"
                      placeholder="Ex: Génie Logiciel"
                      value={filiere}
                      onChange={(e) => setFiliere(e.target.value)}
                    />
                  </CCol>
                </CRow>

                {/* DATES */}
                <CRow className="mb-3">
                  <CCol md={6}>
                    <CFormLabel className="fw-semibold">
                      Date début <span className="text-danger">*</span>
                    </CFormLabel>
                    <CFormInput
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </CCol>

                  <CCol md={6}>
                    <CFormLabel className="fw-semibold">
                      Date fin <span className="text-danger">*</span>
                    </CFormLabel>
                    <CFormInput
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </CCol>
                </CRow>

                {/* BOUTONS */}
                <div className="text-center mt-4 d-flex justify-content-center gap-3">

                  <CButton
                    color="danger"
                    onClick={generatePDF}
                    disabled={loadingPDF || loadingExcel}
                  >
                    {loadingPDF
                      ? <><CSpinner size="sm" className="me-2"/>Génération...</>
                      : <><CIcon icon={cilCloudDownload} className="me-2"/>Générer PDF</>
                    }
                  </CButton>

                  <CButton
                    color="success"
                    onClick={generateExcel}
                    disabled={loadingPDF || loadingExcel}
                  >
                    {loadingExcel
                      ? <><CSpinner size="sm" className="me-2"/>Génération...</>
                      : <><CIcon icon={cilCloudDownload} className="me-2"/>Générer Excel</>
                    }
                  </CButton>

                </div>

              </CForm>

            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

    </div>
  )
}

export default TeacherReports