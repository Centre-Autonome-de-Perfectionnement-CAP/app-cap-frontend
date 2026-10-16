import { describe, it, expect, vi } from 'vitest'
import { exportLegacyStudentsToCSV } from '../utils/exportExcel'
import { generateLegacyStudentPdf } from '../utils/generateLegacyStudentPdf'
import type { LegacyStudent } from '@/types/legacyStudent.types'

describe('Utilitaires Développeur 6 (Export & PDF)', () => {
  const mockStudents: LegacyStudent[] = [
    {
      id: 1,
      matricule: '18-0452-EPAC',
      last_name: 'DOSSA',
      first_name: 'Jean',
      email: 'jean.dossa@gmail.com',
      phone: '+229 97 00 00 00',
      enrollment_year: 2018,
      department: { id: 1, name: 'Génie Civil', cycle: 'Licence' },
      status: 'validated',
      created_at: '2026-08-10T10:00:00Z',
    },
  ]

  describe('Export CSV (exportLegacyStudentsToCSV)', () => {
    it('déclenche le téléchargement du CSV sans erreur', () => {
      // Mock des éléments DOM de téléchargement
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any)
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any)
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url')
      global.URL.revokeObjectURL = vi.fn()

      expect(() => exportLegacyStudentsToCSV(mockStudents, 'test.csv')).not.toThrow()

      expect(appendChildSpy).toHaveBeenCalled()
      expect(removeChildSpy).toHaveBeenCalled()
      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })

    it('lève une exception si la liste d\'étudiants est vide', () => {
      expect(() => exportLegacyStudentsToCSV([], 'test.csv')).toThrow('Aucune donnée à exporter')
    })
  })

  describe('Génération de Fiche PDF (generateLegacyStudentPdf)', () => {
    it('génère la fiche officielle PDF sans erreur', () => {
      expect(() => generateLegacyStudentPdf(mockStudents[0])).not.toThrow()
    })
  })
})
