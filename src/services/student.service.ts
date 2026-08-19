// src/services/student.service.ts
const studentService = {
  // Récupérer les présences de l'étudiant connecté
  getMyPresences: async () => {
    // Exemple de données mock
    return [
      { id: 1, date: '12/03/2026', entree: '08:00', sortie: '16:00', status: 'Présent' },
      { id: 2, date: '13/03/2026', entree: '08:15', sortie: '16:00', status: 'Présent' },
      { id: 3, date: '14/03/2026', entree: '08:00', sortie: '16:00', status: 'Absent' },
    ]

    // Plus tard, tu pourras remplacer par un appel HTTP :
    // const response = await axios.get('/api/student/presences')
    // return response.data
  }
}

export default studentService