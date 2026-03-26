import { useState, useCallback } from 'react'
import CahierService from '@/services/cahier.service'
import type {
  TextbookEntry,
  CreateTextbookEntryRequest,
  UpdateTextbookEntryRequest,
  TextbookEntryFilters,
} from '@/types/cahier-texte.types'
import Swal from 'sweetalert2'

export const useTextbookEntries = () => {
  const [entries, setEntries] = useState<TextbookEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<any>(null)

  const fetchEntries = useCallback(async (filters?: TextbookEntryFilters) => {
    try {
      setLoading(true)
      const { data, meta } = await CahierService.getEntries(filters)
      setEntries(data)
      setPagination(meta)
    } catch (error: any) {
      console.error('Erreur lors du chargement des entrées:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message || 'Impossible de charger les entrées',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchEntry = useCallback(async (id: number): Promise<TextbookEntry | null> => {
    try {
      setLoading(true)
      const entry = await CahierService.getEntry(id)
      return entry
    } catch (error: any) {
      console.error('Erreur lors du chargement de l\'entrée:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message || 'Impossible de charger l\'entrée',
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const createEntry = useCallback(async (data: CreateTextbookEntryRequest): Promise<boolean> => {
    try {
      setLoading(true)
      await CahierService.createEntry(data)
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Entrée créée avec succès',
        timer: 2000,
      })
      return true
    } catch (error: any) {
      console.error('Erreur lors de la création de l\'entrée:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message || 'Impossible de créer l\'entrée',
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const updateEntry = useCallback(
    async (id: number, data: UpdateTextbookEntryRequest): Promise<boolean> => {
      try {
        setLoading(true)
        await CahierService.updateEntry(id, data)
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Entrée mise à jour avec succès',
          timer: 2000,
        })
        return true
      } catch (error: any) {
        console.error('Erreur lors de la mise à jour de l\'entrée:', error)
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.message || 'Impossible de mettre à jour l\'entrée',
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const deleteEntry = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true)
      await CahierService.deleteEntry(id)
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Entrée supprimée avec succès',
        timer: 2000,
      })
      return true
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'entrée:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message || 'Impossible de supprimer l\'entrée',
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const publishEntry = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true)
      await CahierService.publishEntry(id)
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Entrée publiée avec succès',
        timer: 2000,
      })
      return true
    } catch (error: any) {
      console.error('Erreur lors de la publication de l\'entrée:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message || 'Impossible de publier l\'entrée',
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  const validateEntry = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true)
      await CahierService.validateEntry(id)
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Entrée validée avec succès',
        timer: 2000,
      })
      return true
    } catch (error: any) {
      console.error('Erreur lors de la validation de l\'entrée:', error)
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: error.message || 'Impossible de valider l\'entrée',
      })
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    entries,
    loading,
    pagination,
    fetchEntries,
    fetchEntry,
    createEntry,
    updateEntry,
    deleteEntry,
    publishEntry,
    validateEntry,
  }
}
