import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CButton,
  CBadge,
  CSpinner,
  CAlert,
  CListGroup,
  CListGroupItem,
  CFormTextarea,
} from '@coreui/react'
import {
  cilArrowLeft,
  cilPencil,
  cilCheckAlt,
  cilTrash,
  cilCommentSquare,
} from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import CahierService from '@/services/cahier.service'
import type { TextbookEntry, TextbookComment, TextbookEntryStatus } from '@/types/cahier-texte.types'
import Swal from 'sweetalert2'

const EntryDetail: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [entry, setEntry] = useState<TextbookEntry | null>(null)
  const [comments, setComments] = useState<TextbookComment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  useEffect(() => {
    if (id) {
      loadEntry()
      loadComments()
    }
  }, [id])

  const loadEntry = async () => {
    if (!id) return
    try {
      setLoading(true)
      const data = await CahierService.getEntry(parseInt(id))
      setEntry(data)
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger l\'entrée',
      })
      navigate('/cahier-texte/list')
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async () => {
    if (!id) return
    try {
      const data = await CahierService.getComments(parseInt(id))
      setComments(data)
    } catch (error) {
      console.error('Erreur chargement commentaires:', error)
    }
  }

  const handlePublish = async () => {
    if (!id) return
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Publier cette entrée ?',
      text: 'Elle sera visible par tous',
      showCancelButton: true,
      confirmButtonText: 'Oui, publier',
      cancelButtonText: 'Annuler',
    })

    if (confirm.isConfirmed) {
      try {
        await CahierService.publishEntry(parseInt(id))
        Swal.fire({
          icon: 'success',
          title: 'Publié',
          text: 'L\'entrée a été publiée avec succès',
          timer: 2000,
        })
        loadEntry()
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur lors de la publication',
        })
      }
    }
  }

  const handleValidate = async () => {
    if (!id) return
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'Valider cette entrée ?',
      text: 'Cette action confirme que le contenu est correct',
      showCancelButton: true,
      confirmButtonText: 'Oui, valider',
      cancelButtonText: 'Annuler',
    })

    if (confirm.isConfirmed) {
      try {
        await CahierService.validateEntry(parseInt(id))
        Swal.fire({
          icon: 'success',
          title: 'Validé',
          text: 'L\'entrée a été validée avec succès',
          timer: 2000,
        })
        loadEntry()
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur lors de la validation',
        })
      }
    }
  }

  const handleDelete = async () => {
    if (!id) return
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'Supprimer cette entrée ?',
      text: 'Cette action est irréversible',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#d33',
    })

    if (confirm.isConfirmed) {
      try {
        await CahierService.deleteEntry(parseInt(id))
        Swal.fire({
          icon: 'success',
          title: 'Supprimé',
          text: 'L\'entrée a été supprimée',
          timer: 2000,
        })
        navigate('/cahier-texte/list')
      } catch (error: any) {
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: 'Erreur lors de la suppression',
        })
      }
    }
  }

  const handleAddComment = async () => {
    if (!id || !newComment.trim()) return

    setSubmittingComment(true)
    try {
      await CahierService.createComment(parseInt(id), {
        comment: newComment,
        type: 'comment',
      })
      setNewComment('')
      loadComments()
      Swal.fire({
        icon: 'success',
        title: 'Commentaire ajouté',
        timer: 1500,
        showConfirmButton: false,
      })
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Erreur lors de l\'ajout du commentaire',
      })
    } finally {
      setSubmittingComment(false)
    }
  }

  const getStatusBadge = (status: TextbookEntryStatus) => {
    const badges = {
      draft: { color: 'warning', text: 'Brouillon' },
      published: { color: 'info', text: 'Publié' },
      validated: { color: 'success', text: 'Validé' },
    }
    const badge = badges[status] || badges.draft
    return <CBadge color={badge.color}>{badge.text}</CBadge>
  }

  if (loading) {
    return (
      <div className="text-center p-5">
        <CSpinner color="primary" />
      </div>
    )
  }

  if (!entry) {
    return (
      <CAlert color="danger">
        Entrée non trouvée
      </CAlert>
    )
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Détail de l'Entrée</strong>
                <span className="ms-3">{getStatusBadge(entry.status)}</span>
              </div>
              <div>
                <CButton
                  color="secondary"
                  size="sm"
                  className="me-2"
                  onClick={() => navigate('/cahier-texte/list')}
                >
                  <CIcon icon={cilArrowLeft} className="me-2" />
                  Retour
                </CButton>
                <CButton
                  color="info"
                  size="sm"
                  className="me-2"
                  onClick={() => navigate(`/cahier-texte/edit/${entry.id}`)}
                >
                  <CIcon icon={cilPencil} className="me-2" />
                  Modifier
                </CButton>
                {entry.status === 'draft' && (
                  <CButton
                    color="success"
                    size="sm"
                    className="me-2"
                    onClick={handlePublish}
                  >
                    <CIcon icon={cilCheckAlt} className="me-2" />
                    Publier
                  </CButton>
                )}
                {entry.status === 'published' && (
                  <CButton
                    color="success"
                    size="sm"
                    className="me-2"
                    onClick={handleValidate}
                  >
                    <CIcon icon={cilCheckAlt} className="me-2" />
                    Valider
                  </CButton>
                )}
                <CButton color="danger" size="sm" onClick={handleDelete}>
                  <CIcon icon={cilTrash} className="me-2" />
                  Supprimer
                </CButton>
              </div>
            </CCardHeader>
            <CCardBody>
              <CRow className="mb-3">
                <CCol md={6}>
                  <strong>Date de la séance:</strong> {new Date(entry.session_date).toLocaleDateString('fr-FR')}
                </CCol>
                <CCol md={6}>
                  <strong>Horaire:</strong> {entry.start_time} - {entry.end_time} ({entry.hours_taught}h)
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <strong>Cours:</strong> {entry.course_element?.name || '-'}
                </CCol>
                <CCol md={6}>
                  <strong>Classe:</strong> {entry.class_group?.group_name || '-'}
                </CCol>
              </CRow>

              <CRow className="mb-3">
                <CCol md={6}>
                  <strong>Professeur:</strong>{' '}
                  {entry.professor
                    ? `${entry.professor.first_name} ${entry.professor.last_name}`
                    : '-'}
                </CCol>
                <CCol md={6}>
                  <strong>Présence:</strong> {entry.students_present || 0} présents,{' '}
                  {entry.students_absent || 0} absents
                </CCol>
              </CRow>

              <hr />

              <div className="mb-3">
                <h5>Titre de la séance</h5>
                <p>{entry.session_title}</p>
              </div>

              <div className="mb-3">
                <h5>Contenu couvert</h5>
                <p style={{ whiteSpace: 'pre-wrap' }}>{entry.content_covered}</p>
              </div>

              {entry.objectives && (
                <div className="mb-3">
                  <h5>Objectifs pédagogiques</h5>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{entry.objectives}</p>
                </div>
              )}

              {entry.teaching_methods && (
                <div className="mb-3">
                  <h5>Méthodes pédagogiques</h5>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{entry.teaching_methods}</p>
                </div>
              )}

              {entry.homework && (
                <div className="mb-3">
                  <h5>Devoirs à faire</h5>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{entry.homework}</p>
                  {entry.homework_due_date && (
                    <p>
                      <strong>Date limite:</strong>{' '}
                      {new Date(entry.homework_due_date).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
              )}

              {entry.observations && (
                <div className="mb-3">
                  <h5>Observations</h5>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{entry.observations}</p>
                </div>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <CIcon icon={cilCommentSquare} className="me-2" />
              <strong>Commentaires ({comments.length})</strong>
            </CCardHeader>
            <CCardBody>
              <div className="mb-3">
                <CFormTextarea
                  rows={3}
                  placeholder="Ajouter un commentaire..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <CButton
                  color="primary"
                  size="sm"
                  className="mt-2"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submittingComment}
                >
                  {submittingComment ? <CSpinner size="sm" className="me-2" /> : null}
                  Ajouter un commentaire
                </CButton>
              </div>

              {comments.length === 0 ? (
                <p className="text-muted">Aucun commentaire pour le moment</p>
              ) : (
                <CListGroup>
                  {comments.map((comment) => (
                    <CListGroupItem key={comment.id}>
                      <div className="d-flex justify-content-between">
                        <strong>{comment.user?.name || 'Utilisateur'}</strong>
                        <small className="text-muted">
                          {new Date(comment.created_at).toLocaleString('fr-FR')}
                        </small>
                      </div>
                      <p className="mb-0 mt-2">{comment.comment}</p>
                    </CListGroupItem>
                  ))}
                </CListGroup>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default EntryDetail
