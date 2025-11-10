import { describe, it, expect } from 'vitest'
import {
  formatStudentName,
  formatDate,
  formatDateTime,
  formatAcademicYear,
  parseAcademicYear,
  formatPhoneNumber,
  formatEmail,
  formatAmount,
  formatPercentage,
  formatDuration,
  capitalize,
  capitalizeWords,
  truncate,
  formatStudentStatus,
  formatGender,
  getInitials,
  padNumber,
} from '../formatting.utils'

describe('formatting.utils', () => {
  describe('formatStudentName', () => {
    it('devrait formater le nom avec ordre lastFirst', () => {
      expect(formatStudentName('Jean', 'Dupont')).toBe('Dupont Jean')
    })

    it('devrait formater le nom avec ordre firstLast', () => {
      expect(formatStudentName('Jean', 'Dupont', 'firstLast')).toBe('Jean Dupont')
    })

    it('devrait gérer les noms vides', () => {
      expect(formatStudentName('', '')).toBe('')
      expect(formatStudentName('Jean', '')).toBe('Jean')
      expect(formatStudentName('', 'Dupont')).toBe('Dupont')
    })

    it('devrait supprimer les espaces superflus', () => {
      expect(formatStudentName('  Jean  ', '  Dupont  ')).toBe('Dupont Jean')
    })
  })

  describe('formatDate', () => {
    it('devrait formater une date ISO', () => {
      expect(formatDate('2024-01-15')).toBe('15/01/2024')
    })

    it('devrait formater un objet Date', () => {
      const date = new Date('2024-01-15')
      expect(formatDate(date)).toBe('15/01/2024')
    })

    it('devrait retourner - pour une date nulle', () => {
      expect(formatDate(null)).toBe('-')
    })

    it('devrait retourner - pour une date invalide', () => {
      expect(formatDate('invalid')).toBe('-')
    })
  })

  describe('formatDateTime', () => {
    it('devrait formater une date et heure', () => {
      const result = formatDateTime('2024-01-15T14:30:00')
      expect(result).toContain('15/01/2024')
      expect(result).toContain('14:30')
    })

    it('devrait retourner - pour null', () => {
      expect(formatDateTime(null)).toBe('-')
    })
  })

  describe('formatAcademicYear', () => {
    it('devrait formater une année académique', () => {
      expect(formatAcademicYear(2023)).toBe('2023-2024')
      expect(formatAcademicYear(2024)).toBe('2024-2025')
    })
  })

  describe('parseAcademicYear', () => {
    it('devrait parser une année académique', () => {
      expect(parseAcademicYear('2023-2024')).toBe(2023)
      expect(parseAcademicYear('2024-2025')).toBe(2024)
    })

    it('devrait retourner null pour un format invalide', () => {
      expect(parseAcademicYear('2023')).toBeNull()
      expect(parseAcademicYear('invalid')).toBeNull()
    })
  })

  describe('formatPhoneNumber', () => {
    it('devrait formater un numéro français', () => {
      expect(formatPhoneNumber('0612345678')).toBe('06 12 34 56 78')
    })

    it('devrait conserver le format international', () => {
      expect(formatPhoneNumber('+33612345678')).toBe('+33612345678')
    })

    it('devrait retourner - pour vide', () => {
      expect(formatPhoneNumber('')).toBe('-')
    })
  })

  describe('formatEmail', () => {
    it('devrait retourner l\'email si court', () => {
      expect(formatEmail('test@test.com')).toBe('test@test.com')
    })

    it('devrait tronquer un email long', () => {
      const longEmail = 'verylongemailaddress@example.com'
      expect(formatEmail(longEmail, 20)).toContain('...')
    })

    it('devrait retourner - pour vide', () => {
      expect(formatEmail('')).toBe('-')
    })
  })

  describe('formatAmount', () => {
    it('devrait formater un montant en CFA', () => {
      const result = formatAmount(50000)
      expect(result).toContain('50')
      expect(result).toContain('000')
    })

    it('devrait gérer zéro', () => {
      expect(formatAmount(0)).toContain('0')
    })
  })

  describe('formatPercentage', () => {
    it('devrait formater un pourcentage', () => {
      expect(formatPercentage(75.5)).toBe('75.50%')
      expect(formatPercentage(100, 0)).toBe('100%')
    })
  })

  describe('formatDuration', () => {
    it('devrait formater des minutes seulement', () => {
      expect(formatDuration(45)).toBe('45min')
    })

    it('devrait formater des heures seulement', () => {
      expect(formatDuration(120)).toBe('2h')
    })

    it('devrait formater heures et minutes', () => {
      expect(formatDuration(135)).toBe('2h15')
    })
  })

  describe('capitalize', () => {
    it('devrait capitaliser la première lettre', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('WORLD')).toBe('World')
    })

    it('devrait gérer une chaîne vide', () => {
      expect(capitalize('')).toBe('')
    })
  })

  describe('capitalizeWords', () => {
    it('devrait capitaliser chaque mot', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World')
      expect(capitalizeWords('JEAN PIERRE')).toBe('Jean Pierre')
    })
  })

  describe('truncate', () => {
    it('devrait tronquer un texte long', () => {
      expect(truncate('Hello World', 8)).toBe('Hello...')
    })

    it('ne devrait pas tronquer un texte court', () => {
      expect(truncate('Hello', 10)).toBe('Hello')
    })
  })

  describe('formatStudentStatus', () => {
    it('devrait formater le statut', () => {
      expect(formatStudentStatus(true)).toBe('Redoublant')
      expect(formatStudentStatus(false)).toBe('Normal')
    })
  })

  describe('formatGender', () => {
    it('devrait formater le sexe', () => {
      expect(formatGender('M')).toBe('Masculin')
      expect(formatGender('F')).toBe('Féminin')
    })

    it('devrait retourner la valeur si inconnue', () => {
      expect(formatGender('X')).toBe('X')
    })
  })

  describe('getInitials', () => {
    it('devrait extraire les initiales', () => {
      expect(getInitials('Jean Dupont')).toBe('JD')
      expect(getInitials('Marie Claire Martin')).toBe('MC')
    })

    it('devrait limiter à maxLength', () => {
      expect(getInitials('Jean Pierre Marie', 2)).toBe('JP')
    })

    it('devrait gérer une chaîne vide', () => {
      expect(getInitials('')).toBe('')
    })
  })

  describe('padNumber', () => {
    it('devrait ajouter des zéros devant', () => {
      expect(padNumber(5)).toBe('05')
      expect(padNumber(42)).toBe('42')
      expect(padNumber(3, 4)).toBe('0003')
    })
  })
})
