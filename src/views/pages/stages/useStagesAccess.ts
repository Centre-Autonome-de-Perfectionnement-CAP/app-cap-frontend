// src/views/pages/stages/useStagesAccess.ts
// Qui voit le module Stages : administrateur, secrétariat (attestations),
// superviseurs, et SEULEMENT le Responsable de division de la formation
// continue (pas celui qui s'occupe des licences). Le serveur applique la
// même règle ; ici on évite d'afficher un module inaccessible.

import { useEffect, useState } from 'react'
import HttpService from '@/services/http.service'

const ALWAYS = ['admin', 'secretaire', 'superviseur']
const DIVISION_ROLES = ['responsable-division', 'chef-division']
export const STAGES_DIVISION_TYPE = 'formation_continue'

let cache: { token: string | null; type: Promise<string | null> } | null = null
const SESSION_KEY = 'cap-stages-division'

const currentToken = (): string | null => {
  try { return localStorage.getItem('token') } catch { return null }
}

/**
 * Type déjà vérifié pendant cette session (même connexion) : le module
 * s'ouvre tout de suite, sans attendre le serveur. Le serveur reste juge :
 * chaque appel du module vérifie les droits.
 */
const knownType = (): string | null | undefined => {
  try {
    const v = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null')
    return v && v.token === currentToken()?.slice(-16) ? v.type : undefined
  } catch { return undefined }
}

/** Type de division du compte connecté (lu une fois par connexion). */
const loadDivisionType = (): Promise<string | null> => {
  const token = currentToken()
  if (!cache || cache.token !== token) {
    const type = HttpService.get('auth/me')
      .then((res: any) => {
        const t = (res?.data ?? res)?.chef_division_type ?? null
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: token?.slice(-16), type: t })) } catch { /* stockage indisponible */ }
        return t
      })
      .catch(() => { cache = null; return null })
    cache = { token, type }
  }
  return cache.type
}

/** null tant que la vérification est en cours. */
export const useStagesAccess = (role: string | null): boolean | null => {
  const needsCheck = !!role && DIVISION_ROLES.includes(role)
  const [allowed, setAllowed] = useState<boolean | null>(() => {
    if (!role) return false
    if (ALWAYS.includes(role)) return true
    if (!needsCheck) return false
    const known = knownType()
    return known === undefined ? null : known === STAGES_DIVISION_TYPE
  })

  useEffect(() => {
    if (!role) { setAllowed(false); return }
    if (!needsCheck) { setAllowed(ALWAYS.includes(role)); return }
    const known = knownType()
    if (known !== undefined) { setAllowed(known === STAGES_DIVISION_TYPE); return }
    let alive = true
    loadDivisionType().then(t => { if (alive) setAllowed(t === STAGES_DIVISION_TYPE) })
    return () => { alive = false }
  }, [role, needsCheck])

  return allowed
}
