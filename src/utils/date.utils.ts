import { format, parse, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

/**
 * Formate une chaîne de date (ISO ou dd/MM/yyyy) en format lisible 'dd MMMM yyyy'
 * @param dateStr - La date en format string (ISO: YYYY-MM-DD ou dd/MM/yyyy)
 * @returns Date formatée ou la chaîne originale en cas d'erreur
 */
export const formatDateReadable = (dateStr: string | undefined | null): string => {
  if (!dateStr) {
    return ''
  }
  try {
    // Essayer de parser comme ISO d'abord (format: 2026-08-01)
    let parsedDate: Date
    if (dateStr.includes('-')) {
      parsedDate = parseISO(dateStr)
    } else {
      // Sinon parser comme dd/MM/yyyy
      parsedDate = parse(dateStr, 'dd/MM/yyyy', new Date())
    }
    
    if (isNaN(parsedDate.getTime())) {
      return dateStr
    }
    
    return format(parsedDate, 'd MMMM yyyy', { locale: fr })
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', dateStr, error)
    return dateStr
  }
}

/**
 * Formate un objet Date ou une chaîne de date en format 'dd/MM/yyyy HH:mm'
 * @param dateStr - L'objet Date ou la chaîne de date
 * @returns Date formatée ou chaîne vide si invalide
 */
export const formatDateTime = (dateStr: Date | string | undefined | null): string => {
  if (!dateStr) {
    return ''
  }
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? '' : format(date, 'dd/MM/yyyy HH:mm', { locale: fr })
}

/**
 * Formate un objet Date ou une chaîne de date en format 'dd/MM/yyyy'
 * @param dateStr - L'objet Date ou la chaîne de date
 * @returns Date formatée ou chaîne vide si invalide
 */
export const formatDate = (dateStr: Date | string | undefined | null): string => {
  if (!dateStr) {
    return ''
  }
  const date = new Date(dateStr)
  return isNaN(date.getTime()) ? '' : format(date, 'dd/MM/yyyy', { locale: fr })
}

/**
 * Compare deux dates et vérifie que la date de début est antérieure à la date de fin
 * @param startDate - Date de début
 * @param endDate - Date de fin
 * @returns true si la date de début est antérieure à la date de fin
 */
export const isStartBeforeEnd = (startDate: Date, endDate: Date): boolean => {
  return startDate < endDate
}

/**
 * Vérifie si une date est antérieure à aujourd'hui (en ignorant l'heure)
 * @param date - Date à vérifier
 * @returns true si la date est antérieure à aujourd'hui
 */
export const isBeforeToday = (date: Date): boolean => {
  const today = new Date()
  const dateOnly = new Date(date.setHours(0, 0, 0, 0))
  const todayOnly = new Date(today.setHours(0, 0, 0, 0))
  return dateOnly < todayOnly
}

/**
 * Retourne une date avec un nombre de mois ajoutés
 * @param months - Nombre de mois à ajouter
 * @returns Nouvelle date
 */
export const addMonths = (months: number): Date => {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date
}

/**
 * Formate un objet Date en format ISO pour l'API backend
 * @param date - Date à formater
 * @returns Date au format ISO ou null si invalide
 */
export const toISOString = (date: Date | null): string | null => {
  if (!date) return null
  return date.toISOString()
}

/**
 * Parse une date ISO du backend et retourne un objet Date
 * @param isoString - Date au format ISO
 * @returns Objet Date ou null si invalide
 */
export const parseISODate = (isoString: string | null): Date | null => {
  if (!isoString) return null
  const date = new Date(isoString)
  return isNaN(date.getTime()) ? null : date
}

/**
 * Formate un objet Date au format attendu par l'API backend (YYYY-MM-DD)
 * @param date - Date à formater
 * @returns Date au format YYYY-MM-DD ou chaîne vide si invalide
 */
export const formatDateForAPI = (date: Date | null): string => {
  if (!date) return ''
  return format(date, 'yyyy-MM-dd')
}

/**
 * Formate un objet Date au format heure attendu par l'API backend (HH:mm:ss)
 * @param date - Date à formater
 * @returns Heure au format HH:mm:ss ou chaîne vide si invalide
 */
export const formatTimeForAPI = (date: Date | null): string => {
  if (!date) return ''
  return format(date, 'HH:mm:ss')
}

/**
 * Combine une date et une heure au format attendu par l'API backend
 * @param dateObj - Objet Date pour la date
 * @param timeObj - Objet Date pour l'heure
 * @returns DateTime au format YYYY-MM-DD HH:mm:ss
 */
export const formatDateTimeForAPI = (dateObj: Date | null, timeObj: Date | null): string => {
  if (!dateObj || !timeObj) return ''
  const datePart = formatDateForAPI(dateObj)
  const timePart = formatTimeForAPI(timeObj)
  return `${datePart} ${timePart}`
}

/**
 * Parse une date au format français (ex: "20 août 2026") en objet Date
 * @param dateStr - Date au format "d MMMM yyyy"
 * @returns Objet Date ou null si invalide
 */
export const parseFrenchDate = (dateStr: string | undefined | null): Date | null => {
  if (!dateStr) return null
  try {
    const parsedDate = parse(dateStr, 'd MMMM yyyy', new Date(), { locale: fr })
    return isNaN(parsedDate.getTime()) ? null : parsedDate
  } catch (error) {
    console.error('Erreur lors du parsing de la date française:', dateStr, error)
    return null
  }
}
