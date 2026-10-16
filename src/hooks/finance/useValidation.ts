import { useState, useEffect, useCallback } from 'react'
import HttpService from '@/services/http.service'

export interface PaymentCounts {
  pending: number
  approved: number
  rejected: number
  all: number
}

const useValidation = () => {
  const [pendingPayments, setPendingPayments] = useState<any>(null)
  const [counts, setCounts] = useState<PaymentCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [currentSearch, setCurrentSearch] = useState<string>('')

  const fetchPendingPayments = useCallback(async (search = '', page = 1, status = activeTab) => {
    try {
      setLoading(true)
      setError(null)
      setCurrentSearch(search)
      
      const params = new URLSearchParams()
      if (search.trim()) params.append('search', search.trim())
      params.append('page', page.toString())
      params.append('status', status)
      
      const response = await HttpService.get(`finance/validation/pending?${params.toString()}`)
      setPendingPayments(response.data)
      if (response.counts) {
        setCounts(response.counts)
      }
      setPagination({
        current_page: response.data.current_page,
        last_page: response.data.last_page,
        total: response.data.total,
        per_page: response.data.per_page || 10,
      })
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des paiements')
      console.error('Erreur validation:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  const validatePayment = async (paymentId: number, data: any) => {
    try {
      await HttpService.post(`finance/validation/${paymentId}/validate`, data)
      await fetchPendingPayments(currentSearch, pagination?.current_page || 1, activeTab)
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la validation')
      throw err
    }
  }

  const rejectPayment = async (paymentId: number, data: any) => {
    try {
      await HttpService.post(`finance/validation/${paymentId}/reject`, data)
      await fetchPendingPayments(currentSearch, pagination?.current_page || 1, activeTab)
    } catch (err: any) {
      setError(err.message || 'Erreur lors du rejet')
      throw err
    }
  }

  const downloadReceipt = async (paymentId: number) => {
    try {
      const response = await HttpService.get(`finance/validation/${paymentId}/receipt`, {
        responseType: 'blob'
      })
      
      // Créer une URL pour le blob avec le type MIME correct
      const blob = new Blob([response], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      return url
    } catch (err: any) {
      setError(err.message || 'Erreur lors du téléchargement')
      throw err
    }
  }

  const searchPayments = (search: string, page = 1) => {
    fetchPendingPayments(search, page, activeTab)
  }

  const changeTab = (tab: 'pending' | 'approved' | 'rejected', search = currentSearch) => {
    setActiveTab(tab)
    fetchPendingPayments(search, 1, tab)
  }

  useEffect(() => {
    fetchPendingPayments('', 1, 'pending')
  }, [])

  return {
    pendingPayments,
    counts,
    loading,
    error,
    pagination,
    activeTab,
    currentSearch,
    validatePayment,
    rejectPayment,
    downloadReceipt,
    searchPayments,
    changeTab,
    refetch: fetchPendingPayments,
  }
}

export default useValidation