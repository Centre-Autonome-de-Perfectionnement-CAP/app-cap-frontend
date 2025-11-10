import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePhone,
  validateDate,
  validateDateNotFuture,
  validateMatricule,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  validateNumberRange,
  getValidationError,
  validateForm,
} from '../validation.utils'

describe('validation.utils', () => {
  describe('validateEmail', () => {
    it('devrait valider un email correct', () => {
      expect(validateEmail('test@example.com')).toBe(true)
      expect(validateEmail('user.name@domain.co.uk')).toBe(true)
    })

    it('devrait invalider un email incorrect', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('test@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('')).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('devrait valider un numéro correct', () => {
      expect(validatePhone('0612345678')).toBe(true)
      expect(validatePhone('+33612345678')).toBe(true)
      expect(validatePhone('06 12 34 56 78')).toBe(true)
    })

    it('devrait invalider un numéro trop court', () => {
      expect(validatePhone('123')).toBe(false)
      expect(validatePhone('')).toBe(false)
    })
  })

  describe('validateDate', () => {
    it('devrait valider une date correcte', () => {
      expect(validateDate('2024-01-15')).toBe(true)
      expect(validateDate('2024-12-31')).toBe(true)
    })

    it('devrait invalider une date incorrecte', () => {
      expect(validateDate('invalid')).toBe(false)
      expect(validateDate('2024-13-01')).toBe(false)
      expect(validateDate('')).toBe(false)
    })
  })

  describe('validateDateNotFuture', () => {
    it('devrait valider une date passée', () => {
      expect(validateDateNotFuture('2020-01-01')).toBe(true)
    })

    it('devrait invalider une date future', () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      expect(validateDateNotFuture(futureDate.toISOString())).toBe(false)
    })
  })

  describe('validateMatricule', () => {
    it('devrait valider un matricule correct', () => {
      expect(validateMatricule('CAP2024')).toBe(true)
      expect(validateMatricule('A1B2C3D4')).toBe(true)
    })

    it('devrait invalider un matricule incorrect', () => {
      expect(validateMatricule('abc')).toBe(false) // trop court
      expect(validateMatricule('CAP-2024')).toBe(false) // caractère invalide
      expect(validateMatricule('')).toBe(false)
    })
  })

  describe('validateRequired', () => {
    it('devrait valider une valeur présente', () => {
      expect(validateRequired('test')).toBe(true)
      expect(validateRequired('  test  ')).toBe(true)
    })

    it('devrait invalider une valeur vide', () => {
      expect(validateRequired('')).toBe(false)
      expect(validateRequired('   ')).toBe(false)
    })
  })

  describe('validateMinLength', () => {
    it('devrait valider une longueur suffisante', () => {
      expect(validateMinLength('hello', 3)).toBe(true)
      expect(validateMinLength('hello', 5)).toBe(true)
    })

    it('devrait invalider une longueur insuffisante', () => {
      expect(validateMinLength('hi', 5)).toBe(false)
    })
  })

  describe('validateMaxLength', () => {
    it('devrait valider une longueur acceptable', () => {
      expect(validateMaxLength('hello', 10)).toBe(true)
      expect(validateMaxLength('hello', 5)).toBe(true)
    })

    it('devrait invalider une longueur excessive', () => {
      expect(validateMaxLength('hello world', 5)).toBe(false)
    })
  })

  describe('validateNumberRange', () => {
    it('devrait valider un nombre dans la plage', () => {
      expect(validateNumberRange(5, 0, 10)).toBe(true)
      expect(validateNumberRange(0, 0, 10)).toBe(true)
      expect(validateNumberRange(10, 0, 10)).toBe(true)
    })

    it('devrait invalider un nombre hors plage', () => {
      expect(validateNumberRange(-1, 0, 10)).toBe(false)
      expect(validateNumberRange(11, 0, 10)).toBe(false)
    })
  })

  describe('getValidationError', () => {
    it('devrait retourner le message d\'erreur approprié', () => {
      expect(getValidationError('Email', 'required')).toContain('requis')
      expect(getValidationError('Email', 'email')).toContain('email valide')
      expect(getValidationError('Téléphone', 'phone')).toContain('téléphone valide')
    })

    it('devrait inclure les options dans le message', () => {
      const error = getValidationError('Nom', 'minLength', { minLength: 3 })
      expect(error).toContain('3')
    })
  })

  describe('validateForm', () => {
    it('devrait valider un formulaire valide', () => {
      const result = validateForm([
        {
          field: 'email',
          value: 'test@example.com',
          rules: [{ type: 'required' }, { type: 'email' }],
        },
        {
          field: 'nom',
          value: 'Dupont',
          rules: [{ type: 'required' }, { type: 'minLength', options: { minLength: 3 } }],
        },
      ])

      expect(result.isValid).toBe(true)
      expect(Object.keys(result.errors).length).toBe(0)
    })

    it('devrait détecter les erreurs', () => {
      const result = validateForm([
        {
          field: 'email',
          value: 'invalid',
          rules: [{ type: 'email' }],
        },
        {
          field: 'nom',
          value: 'ab',
          rules: [{ type: 'minLength', options: { minLength: 3 } }],
        },
      ])

      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveProperty('email')
      expect(result.errors).toHaveProperty('nom')
    })

    it('devrait s\'arrêter à la première erreur par champ', () => {
      const result = validateForm([
        {
          field: 'password',
          value: '',
          rules: [
            { type: 'required' },
            { type: 'minLength', options: { minLength: 8 } },
          ],
        },
      ])

      expect(result.isValid).toBe(false)
      expect(result.errors.password).toContain('requis')
    })
  })
})
