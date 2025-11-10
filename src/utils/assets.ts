/**
 * Utilitaire pour obtenir l'URL correcte des assets statiques
 * en tenant compte du BASE_URL configuré dans Vite
 */

/**
 * Retourne l'URL complète d'un asset en ajoutant le BASE_URL
 * @param path - Chemin relatif de l'asset (ex: 'images/cap.png')
 * @returns URL complète de l'asset
 */
export function getAssetUrl(path: string): string {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  return `${cleanBase}${cleanPath}`;
}
