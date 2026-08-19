/**
 * useRedirectAfterLogin.ts
 *
 * Hook utilitaire pour gérer la redirection après connexion.
 *
 * Fonctionnement :
 *   1. NoteRoutes (et toute route protégée) redirige vers :
 *        /login?redirectTo=/notes/professor/contrats/{uuid}
 *   2. La page Login appelle `getRedirectPath()` après connexion réussie
 *   3. L'utilisateur est renvoyé vers l'URL d'origine
 *
 * Usage dans la page Login :
 *   const { getRedirectPath } = useRedirectAfterLogin()
 *   // Après login réussi :
 *   navigate(getRedirectPath(role), { replace: true })
 */
import { useSearchParams } from 'react-router-dom'

const DEFAULT_ROUTES: Record<string, string> = {
  professeur:  '/notes/professor/dashboard',
  admin:       '/notes/admin/dashboard',
  scolarite:   '/notes/admin/dashboard',
  direction:   '/notes/admin/dashboard',
}

const useRedirectAfterLogin = () => {
  const [searchParams] = useSearchParams()

  /**
   * Retourne le chemin vers lequel naviguer après login.
   * Priorité : paramètre `redirectTo` dans l'URL > route par défaut du rôle.
   *
   * @param role  - Rôle de l'utilisateur connecté ('professeur', 'admin', etc.)
   */
  const getRedirectPath = (role: string | null): string => {
    const redirectTo = searchParams.get('redirectTo')

    // Sécurité : n'accepter que les chemins internes (commençant par /)
    if (redirectTo && redirectTo.startsWith('/')) {
      return decodeURIComponent(redirectTo)
    }

    return DEFAULT_ROUTES[role ?? ''] ?? '/portail'
  }

  return { getRedirectPath }
}

export default useRedirectAfterLogin
