import { describe, it, expect } from 'vitest'
import {
  formatDateReadable,
  formatDateTime,
  formatDate,
  isStartBeforeEnd,
  isBeforeToday,
  addMonths,
  toISOString,
  parseISODate,
  formatDateForAPI,
  formatTimeForAPI,
  formatDateTimeForAPI,
  parseFrenchDate,
} from '../date.utils'

describe('date.utils', () => {
  describe('formatDateReadable', () => {
    it('devrait formater une date ISO', () => {
      expect(formatDateReadable('2024-01-15')).toContain('janvier')
      expect(formatDateReadable('2024-01-15')).toContain('2024')
    })

    it('devrait formater une date dd/MM/yyyy', () => {
      const result = formatDateReadable('15/01/2024')
      expect(result).toContain('janvier')
      expect(result).toContain('2024')
    })

    it('devrait retourner vide pour null', () => {
      expect(formatDateReadable(null)).toBe('')
    })

    it('devrait retourner vide pour undefined', () => {
      expect(formatDateReadable(undefined)).toBe('')
    })

    it('devrait retourner la chaîne originale pour une date invalide', () => {
      expect(formatDateReadable('invalid-date')).toBe('invalid-date')
    })
  })

  describe('formatDateTime', () => {
    it('devrait formater une date et heure', () => {
      const result = formatDateTime(new Date('2024-01-15T14:30:00'))
      expect(result).toContain('15/01/2024')
      expect(result).toContain('14:30')
    })

    it('devrait formater une chaîne de date', () => {
      const result = formatDateTime('2024-01-15T14:30:00')
      expect(result).toContain('15/01/2024')
    })

    it('devrait retourner vide pour null', () => {
      expect(formatDateTime(null)).toBe('')
    })

    it('devrait retourner vide pour une date invalide', () => {
      expect(formatDateTime('invalid')).toBe('')
    })
  })

  describe('formatDate', () => {
    it('devrait formater un objet Date', () => {
      const date = new Date('2024-01-15')
      expect(formatDate(date)).toBe('15/01/2024')
    })

    it('devrait formater une chaîne de date', () => {
      expect(formatDate('2024-01-15')).toBe('15/01/2024')
    })

    it('devrait retourner vide pour null', () => {
      expect(formatDate(null)).toBe('')
    })

    it('devrait retourner vide pour undefined', () => {
      expect(formatDate(undefined)).toBe('')
    })

    it('devrait retourner vide pour une date invalide', () => {
      expect(formatDate('invalid')).toBe('')
    })
  })

  describe('isStartBeforeEnd', () => {
    it('devrait retourner true si start est avant end', () => {
      const start = new Date('2024-01-01')
      const end = new Date('2024-12-31')
      expect(isStartBeforeEnd(start, end)).toBe(true)
    })

    it('devrait retourner false si start est après end', () => {
      const start = new Date('2024-12-31')
      const end = new Date('2024-01-01')
      expect(isStartBeforeEnd(start, end)).toBe(false)
    })

    it('devrait retourner false si start égal end', () => {
      const date = new Date('2024-01-01')
      expect(isStartBeforeEnd(date, date)).toBe(false)
    })
  })

  describe('isBeforeToday', () => {
    it('devrait retourner true pour une date passée', () => {
      const pastDate = new Date('2020-01-01')
      expect(isBeforeToday(pastDate)).toBe(true)
    })

    it('devrait retourner false pour une date future', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      expect(isBeforeToday(futureDate)).toBe(false)
    })
  })

  describe('addMonths', () => {
    it('devrait ajouter des mois à la date actuelle', () => {
      const result = addMonths(3)
      const now = new Date()
      const expected = new Date()
      expected.setMonth(expected.getMonth() + 3)
      
      expect(result.getMonth()).toBe(expected.getMonth())
    })

    it('devrait soustraire des mois avec valeur négative', () => {
      const result = addMonths(-2)
      const now = new Date()
      const expected = new Date()
      expected.setMonth(expected.getMonth() - 2)
      
      expect(result.getMonth()).toBe(expected.getMonth())
    })
  })

  describe('toISOString', () => {
    it('devrait convertir une date en ISO string', () => {
      const date = new Date('2024-01-15T14:30:00')
      const result = toISOString(date)
      expect(result).toContain('2024-01-15')
    })

    it('devrait retourner null pour une date nulle', () => {
      expect(toISOString(null)).toBeNull()
    })
  })

  describe('parseISODate', () => {
    it('devrait parser une date ISO', () => {
      const result = parseISODate('2024-01-15T14:30:00')
      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2024)
    })

    it('devrait retourner null pour une chaîne nulle', () => {
      expect(parseISODate(null)).toBeNull()
    })

    it('devrait retourner null pour une date invalide', () => {
      expect(parseISODate('invalid-date')).toBeNull()
    })
  })

  describe('formatDateForAPI', () => {
    it('devrait formater une date pour l\'API', () => {
      const date = new Date('2024-01-15')
      expect(formatDateForAPI(date)).toBe('2024-01-15')
    })

    it('devrait retourner vide pour une date nulle', () => {
      expect(formatDateForAPI(null)).toBe('')
    })
  })

  describe('formatTimeForAPI', () => {
    it('devrait formater l\'heure pour l\'API', () => {
      const date = new Date('2024-01-15T14:30:45')
      expect(formatTimeForAPI(date)).toBe('14:30:45')
    })

    it('devrait retourner vide pour une date nulle', () => {
      expect(formatTimeForAPI(null)).toBe('')
    })
  })

  describe('formatDateTimeForAPI', () => {
    it('devrait combiner date et heure pour l\'API', () => {
      const dateObj = new Date('2024-01-15')
      const timeObj = new Date('2024-01-15T14:30:45')
      const result = formatDateTimeForAPI(dateObj, timeObj)
      expect(result).toContain('2024-01-15')
      expect(result).toContain('14:30:45')
    })

    it('devrait retourner vide si date est nulle', () => {
      const timeObj = new Date('2024-01-15T14:30:45')
      expect(formatDateTimeForAPI(null, timeObj)).toBe('')
    })

    it('devrait retourner vide si time est nulle', () => {
      const dateObj = new Date('2024-01-15')
      expect(formatDateTimeForAPI(dateObj, null)).toBe('')
    })

    it('devrait retourner vide si les deux sont nulles', () => {
      expect(formatDateTimeForAPI(null, null)).toBe('')
    })
  })

  describe('parseFrenchDate', () => {
    it('devrait parser une date française', () => {
      const result = parseFrenchDate('15 janvier 2024')
      expect(result).toBeInstanceOf(Date)
      expect(result?.getFullYear()).toBe(2024)
      expect(result?.getMonth()).toBe(0) // Janvier = 0
      expect(result?.getDate()).toBe(15)
    })

    it('devrait retourner null pour une chaîne vide', () => {
      expect(parseFrenchDate('')).toBeNull()
    })

    it('devrait retourner null pour undefined', () => {
      expect(parseFrenchDate(undefined)).toBeNull()
    })

    it('devrait retourner null pour null', () => {
      expect(parseFrenchDate(null)).toBeNull()
    })

    it('devrait retourner null pour un format invalide', () => {
      expect(parseFrenchDate('invalid-date')).toBeNull()
    })
  })
})
