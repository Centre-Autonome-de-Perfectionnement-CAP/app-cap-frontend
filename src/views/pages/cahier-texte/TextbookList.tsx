import { useState, useEffect, useRef } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CButton,
  CBadge,
  CFormInput,
  CFormSelect,
  CPagination,
  CPaginationItem,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CSpinner,
  CFormLabel,
} from '@coreui/react'
import { cilCheckCircle, cilTrash, cilCheckAlt, cilInfo, cilCloudDownload, cilCalendar } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import CahierService from '@/services/cahier.service'
import { TextbookEntryStatus } from '@/types/cahier-texte.types'
import type { TextbookEntry } from '@/types/cahier-texte.types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfessorPaymentSummary {
  professor_id: number
  full_name: string
  phone: string
  email: string
  rib_number: string
  total_hours_done: number
  quota_hours: number
  billable_hours: number
  amount: number
}

// ─── PDF Generation (client-side, no external deps) ───────────────────────────

const generatePaymentPDF = (
  professors: ProfessorPaymentSummary[],
  startDate: string,
  endDate: string
) => {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  const rows = professors
    .map(
      (p, i) => `
      <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#fff'}">
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${p.full_name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${p.phone || '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb">${p.email || '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-family:monospace">${p.rib_number || '—'}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${p.total_hours_done}h</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${p.quota_hours}h</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:600;color:${p.total_hours_done > p.quota_hours ? '#dc2626' : '#16a34a'}">${p.billable_hours}h</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:700">${p.amount.toLocaleString('fr-FR')} FCFA</td>
      </tr>`
    )
    .join('')

  const totalAmount = professors.reduce((s, p) => s + p.amount, 0)

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>État de paiement des enseignants</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', sans-serif; color: #1f2937; background: #fff; }
  .page { padding: 40px 48px; max-width: 1100px; margin: auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid #1e40af; padding-bottom: 24px; }
  .header-left h1 { font-size: 22px; font-weight: 700; color: #1e40af; letter-spacing: -0.5px; }
  .header-left p { font-size: 13px; color: #6b7280; margin-top: 4px; }
  .header-right { text-align: right; font-size: 13px; color: #374151; }
  .header-right strong { display: block; font-size: 15px; color: #1f2937; margin-bottom: 2px; }
  .period-badge { display: inline-block; background: #dbeafe; color: #1e40af; border-radius: 6px; padding: 6px 14px; font-size: 13px; font-weight: 600; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead tr { background: #1e40af; color: #fff; }
  thead th { padding: 12px; text-align: left; font-weight: 600; letter-spacing: 0.3px; }
  thead th:nth-child(n+5) { text-align: center; }
  thead th:last-child { text-align: right; }
  tfoot tr { background: #1e3a8a; color: #fff; }
  tfoot td { padding: 12px; font-weight: 700; font-size: 14px; }
  .note { margin-top: 28px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 14px; }
  .generated { margin-top: 8px; font-size: 11px; color: #9ca3af; }
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>État de Paiement des Enseignants</h1>
      <p>Cahier de Texte — Heures effectuées &amp; Rémunération</p>
    </div>
    <div class="header-right">
      <strong>Édité le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
      Document confidentiel
    </div>
  </div>

  <div class="period-badge">
    📅 Période : ${formatDate(startDate)} — ${formatDate(endDate)}
  </div>

  <table>
    <thead>
      <tr>
        <th>Nom complet</th>
        <th>Téléphone</th>
        <th>Email</th>
        <th>N° RIB</th>
        <th>Heures effectuées</th>
        <th>Quota horaire</th>
        <th>Heures facturables</th>
        <th>Montant</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr>
        <td colspan="7">TOTAL GÉNÉRAL</td>
        <td style="text-align:right">${totalAmount.toLocaleString('fr-FR')} FCFA</td>
      </tr>
    </tfoot>
  </table>

  <p class="note">
    ⚠️ Les heures facturables correspondent au minimum entre les heures effectuées et le quota horaire du programme.
    Toute heure effectuée au-delà du quota n'est pas rémunérée selon les règles en vigueur.
  </p>
  <p class="generated">Document généré automatiquement par le système de gestion académique.</p>
</div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `etat-paiement-${startDate}-${endDate}.html`
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TextbookList = () => {
  // List state
  const [entries, setEntries] = useState<TextbookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Detail modal
  const [detailModal, setDetailModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<TextbookEntry | null>(null)

  // Download modal
  const [downloadModal, setDownloadModal] = useState(false)
  const [downloadStartDate, setDownloadStartDate] = useState('')
  const [downloadEndDate, setDownloadEndDate] = useState('')
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [downloadError, setDownloadError] = useState('')

  useEffect(() => {
    loadEntries()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, search, statusFilter])

  // Pre-fill download dates to current month
  useEffect(() => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setDownloadStartDate(firstDay.toISOString().slice(0, 10))
    setDownloadEndDate(lastDay.toISOString().slice(0, 10))
  }, [])

  const loadEntries = async () => {
    try {
      setLoading(true)
      const { data, meta } = await CahierService.getEntries({
        page: currentPage,
        per_page: 15,
        search: search || undefined,
        status: statusFilter || undefined,
      })
      setEntries(data)
      setTotalPages(meta.last_page)
    } catch (error) {
      console.error('Erreur chargement entrées:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: TextbookEntryStatus) => {
    const badges: Record<TextbookEntryStatus, { color: string; text: string }> = {
      [TextbookEntryStatus.DRAFT]:     { color: 'warning', text: 'Brouillon' },
      [TextbookEntryStatus.PUBLISHED]: { color: 'info',    text: 'Signé' },
      [TextbookEntryStatus.VALIDATED]: { color: 'success', text: 'Validé' },
    }
    const badge = badges[status] ?? badges[TextbookEntryStatus.DRAFT]
    return <CBadge color={badge.color}>{badge.text}</CBadge>
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette entrée ?')) {
      try {
        await CahierService.deleteEntry(id)
        loadEntries()
      } catch (error) {
        console.error('Erreur suppression:', error)
      }
    }
  }

  const handlePublish = async (id: number) => {
    try {
      await CahierService.publishEntry(id)
      loadEntries()
    } catch (error) {
      console.error('Erreur publication:', error)
    }
  }

  const handleValidate = async (id: number) => {
    if (window.confirm('Confirmer la validation de cette entrée ?')) {
      try {
        await CahierService.validateEntry(id)
        loadEntries()
      } catch (error) {
        console.error('Erreur validation:', error)
      }
    }
  }

  const openDetail = (entry: TextbookEntry) => {
    setSelectedEntry(entry)
    setDetailModal(true)
  }

  // ── Payment PDF download ───────────────────────────────────────────────────

  const handleDownloadPDF = async () => {
    if (!downloadStartDate || !downloadEndDate) {
      setDownloadError('Veuillez sélectionner une période valide.')
      return
    }
    if (downloadStartDate > downloadEndDate) {
      setDownloadError('La date de début doit être antérieure à la date de fin.')
      return
    }

    setDownloadError('')
    setDownloadLoading(true)

    try {
      // Fetch all validated entries in the period
      const { data: allEntries } = await CahierService.getEntries({
        start_date: downloadStartDate,
        end_date: downloadEndDate,
        status: 'validated',
        per_page: 1000,
      })

      // Group by professor
      const professorMap: Record<
        number,
        {
          professor: any
          entries: TextbookEntry[]
          totalHoursDone: number
          quotaHours: number
        }
      > = {}

      for (const entry of allEntries) {
        const prof = entry.professor
        if (!prof) continue
        const pid = prof.id

        if (!professorMap[pid]) {
          // Fetch professor's program quota for the period
          // quota_hours comes from program.weighting or a dedicated endpoint
          // We use what's already on the entry (program relation)
          const quotaHours = entry.program?.quota_hours ?? entry.program?.total_hours ?? 0

          professorMap[pid] = {
            professor: prof,
            entries: [],
            totalHoursDone: 0,
            quotaHours,
          }
        }

        professorMap[pid].entries.push(entry)
        professorMap[pid].totalHoursDone += Number(entry.hours_taught ?? 0)

        // Update quota to maximum found across entries (programs may differ)
        const entryQuota = entry.program?.quota_hours ?? entry.program?.total_hours ?? 0
        if (entryQuota > professorMap[pid].quotaHours) {
          professorMap[pid].quotaHours = entryQuota
        }
      }

      const summaries: ProfessorPaymentSummary[] = Object.values(professorMap).map((item) => {
        const billable = item.quotaHours > 0
          ? Math.min(item.totalHoursDone, item.quotaHours)
          : item.totalHoursDone

        // Amount: based on contract — fallback to hours × hourly_rate if available
        const hourlyRate = item.professor?.hourly_rate ?? item.entries[0]?.hourly_rate ?? 0
        const amount = hourlyRate > 0
          ? billable * hourlyRate
          : item.entries.reduce((s: number, e: TextbookEntry) => s + Number(e.amount ?? 0), 0)

        return {
          professor_id:    item.professor.id,
          full_name:       item.professor.full_name ?? `${item.professor.first_name} ${item.professor.last_name}`,
          phone:           item.professor.phone ?? '',
          email:           item.professor.email ?? '',
          rib_number:      item.professor.rib_number ?? '',
          total_hours_done: Math.round(item.totalHoursDone * 10) / 10,
          quota_hours:     item.quotaHours,
          billable_hours:  Math.round(billable * 10) / 10,
          amount,
        }
      })

      // Sort by name
      summaries.sort((a, b) => a.full_name.localeCompare(b.full_name, 'fr'))

      if (summaries.length === 0) {
        setDownloadError('Aucune entrée validée trouvée pour cette période.')
        setDownloadLoading(false)
        return
      }

      generatePaymentPDF(summaries, downloadStartDate, downloadEndDate)
      setDownloadModal(false)
    } catch (err) {
      console.error('Erreur génération PDF:', err)
      setDownloadError('Une erreur est survenue lors de la génération. Veuillez réessayer.')
    } finally {
      setDownloadLoading(false)
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <CCardHeader className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <strong>Liste des entrées du cahier de texte</strong>
              <CButton
                color="primary"
                size="sm"
                onClick={() => setDownloadModal(true)}
                className="d-flex align-items-center gap-2"
              >
                <CIcon icon={cilCloudDownload} />
                Télécharger état de paiement
              </CButton>
            </CCardHeader>

            <CCardBody>
              {/* ── Filters ──────────────────────────────────────────────── */}
              <CRow className="mb-3">
                <CCol md={6}>
                  <CFormInput
                    type="text"
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
                  >
                    <option value="">Signé &amp; Validé (défaut)</option>
                    <option value="published">Signé</option>
                    <option value="validated">Validé</option>
                    <option value="draft">Brouillon</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              {/* ── Table ────────────────────────────────────────────────── */}
              {loading ? (
                <div className="text-center py-4"><CSpinner /></div>
              ) : entries.length === 0 ? (
                <div className="text-center text-muted py-4">Aucune entrée trouvée.</div>
              ) : (
                <>
                  <CTable hover responsive>
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Date</CTableHeaderCell>
                        <CTableHeaderCell>Titre</CTableHeaderCell>
                        <CTableHeaderCell>Cours (ECUE)</CTableHeaderCell>
                        <CTableHeaderCell>Classe</CTableHeaderCell>
                        <CTableHeaderCell>Heures</CTableHeaderCell>
                        <CTableHeaderCell>Statut</CTableHeaderCell>
                        <CTableHeaderCell>Actions</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {entries.map((entry) => (
                        <CTableRow key={entry.id}>
                          <CTableDataCell>{entry.session_date}</CTableDataCell>
                          <CTableDataCell>{entry.session_title}</CTableDataCell>
                          <CTableDataCell>{entry.course_element?.name ?? '—'}</CTableDataCell>
                          <CTableDataCell>{entry.class_group?.group_name ?? '—'}</CTableDataCell>
                          <CTableDataCell>{entry.hours_taught}h</CTableDataCell>
                          <CTableDataCell>{getStatusBadge(entry.status)}</CTableDataCell>
                          <CTableDataCell>
                            {/* Détail */}
                            <CButton
                              color="secondary"
                              variant="outline"
                              size="sm"
                              className="me-1"
                              title="Voir le détail"
                              onClick={() => openDetail(entry)}
                            >
                              <CIcon icon={cilInfo} />
                            </CButton>

                            {/* Valider */}
                            {entry.status === TextbookEntryStatus.PUBLISHED && (
                              <CButton
                                color="info"
                                size="sm"
                                className="me-1"
                                title="Valider"
                                onClick={() => handleValidate(entry.id)}
                              >
                                <CIcon icon={cilCheckCircle} />
                              </CButton>
                            )}

                            {/* Publier */}
                            {entry.status === TextbookEntryStatus.DRAFT && (
                              <CButton
                                color="success"
                                size="sm"
                                className="me-1"
                                title="Signer / Publier"
                                onClick={() => handlePublish(entry.id)}
                              >
                                <CIcon icon={cilCheckAlt} />
                              </CButton>
                            )}

                            {/* Supprimer */}
                            {entry.status === TextbookEntryStatus.DRAFT && (
                              <CButton
                                color="danger"
                                size="sm"
                                title="Supprimer"
                                onClick={() => handleDelete(entry.id)}
                              >
                                <CIcon icon={cilTrash} />
                              </CButton>
                            )}
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>

                  {totalPages > 1 && (
                    <CPagination className="justify-content-center">
                      <CPaginationItem
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                      >
                        Précédent
                      </CPaginationItem>
                      {[...Array(totalPages)].map((_, i) => (
                        <CPaginationItem
                          key={i + 1}
                          active={currentPage === i + 1}
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </CPaginationItem>
                      ))}
                      <CPaginationItem
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                      >
                        Suivant
                      </CPaginationItem>
                    </CPagination>
                  )}
                </>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL — Détail d'une entrée
      ════════════════════════════════════════════════════════════════════ */}
      <CModal
        visible={detailModal}
        onClose={() => setDetailModal(false)}
        size="lg"
        scrollable
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>
            Détail de l'entrée —{' '}
            <span className="text-muted fw-normal">
              {selectedEntry?.session_date}
            </span>
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {selectedEntry && (
            <div className="row g-3">
              {/* Bloc identité */}
              <div className="col-12">
                <div
                  className="p-3 rounded"
                  style={{ background: 'var(--cui-tertiary-bg, #f8f9fa)', borderLeft: '4px solid var(--cui-primary)' }}
                >
                  <h6 className="mb-1 fw-bold">{selectedEntry.session_title}</h6>
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {getStatusBadge(selectedEntry.status)}
                    <CBadge color="light" textColor="dark">
                      <CIcon icon={cilCalendar} className="me-1" size="sm" />
                      {selectedEntry.session_date}
                    </CBadge>
                    {selectedEntry.start_time && selectedEntry.end_time && (
                      <CBadge color="light" textColor="dark">
                        {selectedEntry.start_time} — {selectedEntry.end_time}
                      </CBadge>
                    )}
                    <CBadge color="primary">{selectedEntry.hours_taught}h dispensées</CBadge>
                  </div>
                </div>
              </div>

              {/* Cours & Classe */}
              <div className="col-md-6">
                <DetailField label="Cours (ECUE)" value={selectedEntry.course_element?.name} />
              </div>
              <div className="col-md-6">
                <DetailField label="Classe / Groupe" value={selectedEntry.class_group?.group_name} />
              </div>

              {/* Professeur */}
              {selectedEntry.professor && (
                <>
                  <div className="col-md-6">
                    <DetailField
                      label="Enseignant"
                      value={selectedEntry.professor.full_name ?? `${selectedEntry.professor.first_name} ${selectedEntry.professor.last_name}`}
                    />
                  </div>
                  <div className="col-md-6">
                    <DetailField label="Email" value={selectedEntry.professor.email} />
                  </div>
                </>
              )}

              {/* Contenu pédagogique */}
              <div className="col-12">
                <DetailField label="Contenu dispensé" value={selectedEntry.content_covered} multiline />
              </div>

              {selectedEntry.objectives && (
                <div className="col-12">
                  <DetailField label="Objectifs" value={selectedEntry.objectives} multiline />
                </div>
              )}

              {selectedEntry.teaching_methods && (
                <div className="col-md-6">
                  <DetailField label="Méthodes pédagogiques" value={selectedEntry.teaching_methods} />
                </div>
              )}

              {/* Présence */}
              {(selectedEntry.students_present !== undefined || selectedEntry.students_absent !== undefined) && (
                <>
                  <div className="col-md-3">
                    <DetailField label="Étudiants présents" value={selectedEntry.students_present?.toString()} />
                  </div>
                  <div className="col-md-3">
                    <DetailField label="Étudiants absents" value={selectedEntry.students_absent?.toString()} />
                  </div>
                </>
              )}

              {/* Devoir */}
              {selectedEntry.homework && (
                <div className="col-md-8">
                  <DetailField label="Devoir / Exercice" value={selectedEntry.homework} multiline />
                </div>
              )}
              {selectedEntry.homework_due_date && (
                <div className="col-md-4">
                  <DetailField label="Date de rendu" value={selectedEntry.homework_due_date} />
                </div>
              )}

              {/* Observations */}
              {selectedEntry.observations && (
                <div className="col-12">
                  <DetailField label="Observations" value={selectedEntry.observations} multiline />
                </div>
              )}

              {/* Validation info */}
              {selectedEntry.status === TextbookEntryStatus.VALIDATED && selectedEntry.validated_at && (
                <div className="col-12">
                  <div
                    className="p-2 rounded d-flex align-items-center gap-2"
                    style={{ background: '#d1fae5', color: '#065f46', fontSize: '0.85rem' }}
                  >
                    <CIcon icon={cilCheckCircle} />
                    <span>
                      Validé le <strong>{selectedEntry.validated_at}</strong>
                      {selectedEntry.validated_by && ` par ${selectedEntry.validated_by}`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" onClick={() => setDetailModal(false)}>
            Fermer
          </CButton>
        </CModalFooter>
      </CModal>

      {/* ════════════════════════════════════════════════════════════════════
          MODAL — Télécharger état de paiement
      ════════════════════════════════════════════════════════════════════ */}
      <CModal
        visible={downloadModal}
        onClose={() => { setDownloadModal(false); setDownloadError('') }}
        size="md"
        alignment="center"
      >
        <CModalHeader style={{ borderBottom: '2px solid var(--cui-primary)' }}>
          <CModalTitle className="d-flex align-items-center gap-2">
            <CIcon icon={cilCloudDownload} />
            Télécharger l'état de paiement
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>
            Sélectionnez la période pour laquelle vous souhaitez générer l'état de paiement
            des enseignants ayant effectué des cours validés. Les heures facturables sont
            plafonnées au quota horaire de chaque programme.
          </p>

          <CRow className="g-3">
            <CCol xs={12} sm={6}>
              <CFormLabel htmlFor="dl-start" className="fw-semibold">
                Date de début
              </CFormLabel>
              <CFormInput
                id="dl-start"
                type="date"
                value={downloadStartDate}
                onChange={(e) => setDownloadStartDate(e.target.value)}
                max={downloadEndDate || undefined}
              />
            </CCol>
            <CCol xs={12} sm={6}>
              <CFormLabel htmlFor="dl-end" className="fw-semibold">
                Date de fin
              </CFormLabel>
              <CFormInput
                id="dl-end"
                type="date"
                value={downloadEndDate}
                onChange={(e) => setDownloadEndDate(e.target.value)}
                min={downloadStartDate || undefined}
              />
            </CCol>
          </CRow>

          {downloadError && (
            <div
              className="mt-3 p-3 rounded"
              style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.875rem' }}
            >
              ⚠️ {downloadError}
            </div>
          )}

          <div
            className="mt-4 p-3 rounded"
            style={{ background: '#eff6ff', color: '#1e40af', fontSize: '0.8rem', lineHeight: '1.5' }}
          >
            <strong>Règle de calcul des heures facturables :</strong>
            <br />
            Si <em>heures effectuées &gt; quota horaire</em> → on retient le <strong>quota horaire</strong>.
            <br />
            Sinon → on retient les <strong>heures effectuées</strong>.
          </div>
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => { setDownloadModal(false); setDownloadError('') }}
            disabled={downloadLoading}
          >
            Annuler
          </CButton>
          <CButton
            color="primary"
            onClick={handleDownloadPDF}
            disabled={downloadLoading}
            className="d-flex align-items-center gap-2"
          >
            {downloadLoading ? (
              <>
                <CSpinner size="sm" />
                Génération…
              </>
            ) : (
              <>
                <CIcon icon={cilCloudDownload} />
                Générer &amp; Télécharger
              </>
            )}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

// ─── Helper sub-component ─────────────────────────────────────────────────────

interface DetailFieldProps {
  label: string
  value?: string | null
  multiline?: boolean
}

const DetailField = ({ label, value, multiline }: DetailFieldProps) => {
  if (!value && value !== 0) return null
  return (
    <div>
      <div
        style={{
          fontSize: '0.72rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--cui-secondary-color, #6c757d)',
          marginBottom: '4px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '0.9rem',
          color: 'var(--cui-body-color)',
          whiteSpace: multiline ? 'pre-wrap' : 'normal',
          lineHeight: '1.5',
        }}
      >
        {value}
      </div>
    </div>
  )
}

export default TextbookList