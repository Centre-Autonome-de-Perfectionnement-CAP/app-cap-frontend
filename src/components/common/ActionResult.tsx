// src/components/common/ActionResult.tsx
//
// Petit modal central de fin d'action : succès, échec ou avertissement.
// Il reste affiché jusqu'au clic sur « OK » (ou Entrée), pour que l'acteur
// sache toujours, clairement, si ce qu'il vient de faire a fonctionné.
//
// API impérative, utilisable partout (hooks, services, composants) sans
// provider ni état à câbler :
//
//   await showSuccess('Dossier transmis', 'Le dossier a été envoyé au Comptable.')
//   await showError('Envoi impossible', friendlyError(err))
//
// Le modal est rendu dans sa propre racine React, au-dessus de tout le reste
// (modals CoreUI et visualiseur de documents compris). Les appels successifs
// sont mis en file : un seul modal à la fois.

import { useEffect, useRef } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import CIcon from '@coreui/icons-react'
import { cilCheckAlt, cilX, cilWarning } from '@coreui/icons'

export type ActionResultType = 'success' | 'error' | 'warning'

export interface ActionResultOptions {
  type: ActionResultType
  title: string
  message?: string
  okLabel?: string
}

const THEME: Record<ActionResultType, { ring: string; bg: string; color: string; icon: any; button: string }> = {
  success: { ring: '#bbf7d0', bg: '#f0fdf4', color: '#15803d', icon: cilCheckAlt, button: '#15803d' },
  error:   { ring: '#fecaca', bg: '#fef2f2', color: '#b91c1c', icon: cilX,        button: '#334155' },
  warning: { ring: '#fde68a', bg: '#fffbeb', color: '#b45309', icon: cilWarning,  button: '#334155' },
}

// ─── Vue ────────────────────────────────────────────────────────────────────────

const ActionResultView = ({ opts, onOk }: { opts: ActionResultOptions; onOk: () => void }) => {
  const okRef = useRef<HTMLButtonElement>(null)
  const t = THEME[opts.type]

  useEffect(() => {
    okRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onOk()
      }
    }
    // capture : passe avant les raccourcis des modals ouverts en dessous
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onOk])

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="action-result-title"
      style={{
        position: 'fixed', inset: 0, zIndex: 10060,
        background: 'rgba(15, 23, 42, 0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        animation: 'arFade 0.15s ease-out',
      }}
    >
      <style>{`
        @keyframes arFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes arPop  { from { opacity: 0; transform: translateY(8px) scale(0.98) } to { opacity: 1; transform: none } }
      `}</style>
      <div style={{
        width: '100%', maxWidth: 400,
        background: '#fff', borderRadius: 16,
        boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
        padding: '28px 24px 20px',
        textAlign: 'center',
        animation: 'arPop 0.18s ease-out',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          margin: '0 auto 16px',
          background: t.bg, border: `2px solid ${t.ring}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <CIcon icon={t.icon} style={{ width: 26, height: 26, color: t.color }} />
        </div>

        <div id="action-result-title" style={{
          fontWeight: 800, fontSize: '1.08rem', color: '#0f172a',
          lineHeight: 1.35, marginBottom: opts.message ? 8 : 20,
        }}>
          {opts.title}
        </div>

        {opts.message && (
          <div style={{
            fontSize: '0.92rem', color: '#475569', lineHeight: 1.55,
            marginBottom: 22, whiteSpace: 'pre-line',
          }}>
            {opts.message}
          </div>
        )}

        <button
          ref={okRef}
          type="button"
          onClick={onOk}
          style={{
            minWidth: 140, padding: '10px 28px',
            border: 'none', borderRadius: 10,
            background: t.button, color: '#fff',
            fontWeight: 700, fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          {opts.okLabel ?? 'OK'}
        </button>
      </div>
    </div>
  )
}

// ─── Moteur impératif ──────────────────────────────────────────────────────────

let host: HTMLDivElement | null = null
let root: Root | null = null
let queue: Promise<void> = Promise.resolve()

function ensureRoot(): Root {
  if (!host || !document.body.contains(host)) {
    host = document.createElement('div')
    host.setAttribute('data-action-result', '')
    document.body.appendChild(host)
    root = createRoot(host)
  }
  return root!
}

function display(opts: ActionResultOptions): Promise<void> {
  return new Promise<void>(resolve => {
    const r = ensureRoot()
    const done = () => {
      r.render(<></>)
      resolve()
    }
    r.render(<ActionResultView opts={opts} onOk={done} />)
  })
}

/** Affiche le modal ; la promesse se résout quand l'acteur clique sur OK. */
export function showActionResult(opts: ActionResultOptions): Promise<void> {
  const next = queue.then(() => display(opts))
  queue = next.catch(() => undefined)
  return next
}

export const showSuccess = (title: string, message?: string) =>
  showActionResult({ type: 'success', title, message })

export const showError = (title: string, message?: string) =>
  showActionResult({ type: 'error', title, message })

export const showWarning = (title: string, message?: string) =>
  showActionResult({ type: 'warning', title, message })

// ─── Message d'erreur compréhensible par tous ──────────────────────────────────

const TECHNICAL = /SQLSTATE|Exception|stack|undefined|null|Network Error|timeout|status code|Unauthenticated|<\/?[a-z]/i

/**
 * Traduit une erreur technique en phrase simple.
 * Le message du serveur est repris quand il est déjà rédigé pour l'utilisateur.
 */
export function friendlyError(err: any): string {
  const status: number | undefined = err?.status ?? err?.response?.status
  const raw: string = String(err?.response?.data?.message ?? err?.message ?? '').trim()

  // Validation : première erreur de champ, souvent la plus parlante
  const fieldErrors = err?.errors ?? err?.response?.data?.errors
  if (status === 422 && fieldErrors && typeof fieldErrors === 'object') {
    const first = Object.values(fieldErrors).flat()[0]
    if (typeof first === 'string' && first.trim()) return first
  }

  const usable = raw !== '' && raw.length <= 220 && !TECHNICAL.test(raw)

  if (!navigator.onLine || /Network Error|timeout/i.test(raw)) {
    return 'La connexion au serveur a échoué. Vérifiez votre connexion internet puis réessayez.'
  }
  if (status === 401) return 'Votre session a expiré. Reconnectez-vous puis recommencez.'
  if (usable) return raw
  if (status === 403) return "Vous n'avez pas l'autorisation de faire cette action sur ce dossier."
  if (status === 404) return "Cet élément n'existe plus. Actualisez la page puis réessayez."
  if (status === 413) return 'Le fichier est trop volumineux (10 Mo au maximum).'
  if (status === 422) return 'Certaines informations sont incomplètes ou incorrectes. Vérifiez puis réessayez.'
  if (status === 429) return 'Trop de tentatives en peu de temps. Patientez une minute puis réessayez.'
  return "L'opération n'a pas pu aboutir. Réessayez dans un instant ; si le problème persiste, prévenez l'administrateur."
}
