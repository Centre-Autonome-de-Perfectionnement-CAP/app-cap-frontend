// src/views/pages/demandes/utils/actionFeedback.ts
//
// Textes des modals de fin d'action du circuit Demandes, rédigés pour être
// compris par tous : ce qui vient de se passer, et où se trouve le dossier.

const NEXT_STEP: Record<string, string> = {
  accounting_review:                'au Comptable',
  division_manager_review:          'au Responsable de division',
  cap_manager_review:               'au Chef CAP',
  deputy_director_secretary_review: 'au Secrétariat de la Directrice Adjointe',
  deputy_director_review:           'à la Directrice Adjointe',
  director_secretary_review:        'au Secrétariat du Directeur',
  director_review:                  'au Directeur',
  secretary_final_review:           'à la Secrétaire pour la finalisation',
  secretary_correction:             'à la Secrétaire',
}

export interface Feedback { title: string; message: string }

export function successFeedback(action: string, reference: string, newStatus?: string | null): Feedback {
  const ref     = reference ? `Le dossier ${reference}` : 'Le dossier'
  const next    = newStatus ? NEXT_STEP[newStatus] : undefined
  const flagged = action.endsWith('_flagged') ? ' sous réserve' : ''

  switch (action) {
    case 'clear_flag':
      return { title: 'Réserve levée', message: `La réserve sur ${reference ? `le dossier ${reference}` : 'le dossier'} a été levée.` }
    case 'secretaire_reject':
    case 'secretaire_reject_final':
      return { title: 'Dossier rejeté', message: `${ref} est clôturé.\nLe demandeur est informé du motif par WhatsApp et par e-mail.` }
    case 'secretaire_deliver':
      return { title: 'Document remis', message: `${ref} est enregistré comme remis au demandeur.` }
    case 'secretaire_mark_ready':
      return { title: 'Document prêt', message: `Le demandeur est prévenu qu'il peut venir retirer son document.` }
    case 'secretaire_resend':
      return { title: 'Dossier renvoyé', message: `${ref} a été renvoyé ${next ?? 'à l’étape concernée'}.` }
    case 'return_to_secretaire':
      return { title: 'Dossier renvoyé à la Secrétaire', message: `La Secrétaire a reçu ${ref.charAt(0).toLowerCase() + ref.slice(1)} avec votre commentaire.` }
  }

  if (action.endsWith('_reject')) {
    return { title: 'Dossier renvoyé à la Secrétaire', message: `La Secrétaire a reçu ${ref.charAt(0).toLowerCase() + ref.slice(1)} avec votre motif.` }
  }
  if (action.includes('_sign')) {
    return { title: `Dossier signé${flagged}`, message: `${ref} a été signé et transmis ${next ?? 'à l’étape suivante'}.` }
  }
  return { title: `Dossier validé${flagged}`, message: `${ref} a été transmis ${next ?? 'à l’étape suivante'}.` }
}

export const FAILURE_TITLE = 'Action non effectuée'
