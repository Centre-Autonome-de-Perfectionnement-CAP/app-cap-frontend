// src/services/teacher.service.ts
import axios from 'axios'

const API_URL = 'http://localhost:8000/api/teacher' // URL de ton backend

const teacherService = {
  // Récupérer les présences des étudiants
  getPresences: async () => {
    // Si tu n'as pas encore de backend, tu peux retourner des données mock
    // return [
    //   { id: 1, studentName: 'Alice', status: 'Présent' },
    //   { id: 2, studentName: 'Bob', status: 'Absent' },
    // ]
    const response = await axios.get(`${API_URL}/presences`)
    return response.data
  },

  // Générer un rapport PDF
  generateReport: async () => {
    const response = await axios.get(`${API_URL}/report`, { responseType: 'blob' })
    return response.data
  }
}

export default teacherService