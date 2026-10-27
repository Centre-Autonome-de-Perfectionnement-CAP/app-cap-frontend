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

/** Type de division du compte connecté (lu une fois par connexion). */
const loadDivisionType = (): Promise<string | null> => {
  let token: string | null = null
  try { token = localStorage.getItem('token') } catch { /* stockage indisponible */ }
  if (!cache || cache.token !== token) {
    const type = HttpService.get('auth/me')
      .then((res: any) => (res?.data ?? res)?.chef_division_type ?? null)
      .catch(() => { cache = null; return null })
    cache = { token, type }
  }
  return cache.type
}

/** null tant que la vérification est en cours. */
export const useStagesAccess = (role: string | null): boolean | null => {
  const needsCheck = !!role && DIVISION_ROLES.includes(role)
  const [allowed, setAllowed] = useState<boolean | null>(() =>
    !role ? false : ALWAYS.includes(role) ? true : needsCheck ? null : false)

  useEffect(() => {
    if (!role) { setAllowed(false); return }
    if (!needsCheck) { setAllowed(ALWAYS.includes(role)); return }
    let alive = true
    loadDivisionType().then(t => { if (alive) setAllowed(t === STAGES_DIVISION_TYPE) })
    return () => { alive = false }
  }, [role, needsCheck])

  return allowed
}
