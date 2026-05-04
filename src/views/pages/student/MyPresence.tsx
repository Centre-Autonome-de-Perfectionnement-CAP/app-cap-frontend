import React from "react"
import {
  CCard,
  CCardBody,
  CCardTitle,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell
} from "@coreui/react"
import studentService from "../../../services/student.service"
const MyPresence = () => {
  return (
    <CCard>
      <CCardBody>
        <CCardTitle>Mes Présences</CCardTitle>

        <CTable>
          <CTableHead>
            <CTableRow>
              <CTableHeaderCell>Date</CTableHeaderCell>
              <CTableHeaderCell>Entrée</CTableHeaderCell>
              <CTableHeaderCell>Sortie</CTableHeaderCell>
              <CTableHeaderCell>Status</CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            <CTableRow>
              <CTableDataCell>12/03/2026</CTableDataCell>
              <CTableDataCell>08:00</CTableDataCell>
              <CTableDataCell>16:00</CTableDataCell>
              <CTableDataCell>Présent</CTableDataCell>
            </CTableRow>
          </CTableBody>
        </CTable>
      </CCardBody>
    </CCard>
  )
}

export default MyPresence