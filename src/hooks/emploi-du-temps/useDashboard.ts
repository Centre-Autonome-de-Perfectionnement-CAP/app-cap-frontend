import { useState, useEffect, useCallback } from 'react'
import EmploiDuTempsService from '@/services/emploi-du-temps.service'
import type { EmploiDuTempsStats } from '@/types/emploi-du-temps.types'
import Swal from 'sweetalert2'

export const useDashboard = () => {
  const [stats, setStats] = useState<EmploiDuTempsStats>({
    total_buildings: 0,
    total_rooms: 0,
    available_rooms: 0,
    total_time_slots: 0,
    total_scheduled_courses: 0,
    active_courses: 0,
    completed_courses: 0,
    cancelled_courses: 0,
    rooms_utilization_rate: 0,
    professors_utilization_rate: 0,
    conflicts_detected: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Fetch data from different endpoints and combine them
      const [
        buildingsResponse,
        roomsResponse,
        timeSlotsResponse,
        scheduledCoursesResponse,
      ] = await Promise.all([
        EmploiDuTempsService.getBuildings({ per_page: 1 }),
        EmploiDuTempsService.getRooms({ per_page: 1 }),
        EmploiDuTempsService.getTimeSlots({ per_page: 1 }),
        EmploiDuTempsService.getScheduledCourses({ per_page: 1 }),
      ])

      // Get available rooms count
      const availableRoomsResponse = await EmploiDuTempsService.getRooms({ 
        is_available: true,
        per_page: 1 
      })

      // Get cancelled courses count
      const cancelledCoursesResponse = await EmploiDuTempsService.getScheduledCourses({ 
        is_cancelled: true,
        per_page: 1 
      })

      const totalScheduledCourses = scheduledCoursesResponse.meta?.total || 0
      const cancelledCourses = cancelledCoursesResponse.meta?.total || 0
      const activeCourses = totalScheduledCourses - cancelledCourses

      setStats({
        total_buildings: buildingsResponse.meta?.total || 0,
        total_rooms: roomsResponse.meta?.total || 0,
        available_rooms: availableRoomsResponse.meta?.total || 0,
        total_time_slots: timeSlotsResponse.meta?.total || 0,
        total_scheduled_courses: totalScheduledCourses,
        active_courses: activeCourses,
        completed_courses: 0, // TODO: Calculate based on date/completion status
        cancelled_courses: cancelledCourses,
        rooms_utilization_rate: roomsResponse.meta?.total > 0 ? 
          Math.round(((roomsResponse.meta.total - (availableRoomsResponse.meta?.total || 0)) / roomsResponse.meta.total) * 100) : 0,
        professors_utilization_rate: 0, // TODO: Calculate based on professor schedules
        conflicts_detected: 0, // TODO: Add conflicts detection endpoint
      })
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des statistiques')
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Impossible de charger les statistiques',
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}
