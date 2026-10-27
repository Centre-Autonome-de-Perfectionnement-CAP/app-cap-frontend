import axios from "axios"

const API_URL = "http://localhost:8000/api"

const PresenceService = {

  // =============================
  // STATISTIQUES PRESENCE
  // =============================
  getPresenceStats() {
    return axios.get(`${API_URL}/presence/stats`)
  },

  // =============================
  // LISTE DES PRESENCES
  // =============================
  getPresences() {
    return axios.get(`${API_URL}/presences`)
  },

  // =============================
  // LISTE DES ABSENCES
  // =============================
  getAbsences() {
    return axios.get(`${API_URL}/absences`)
  },

  // =============================
  // ENREGISTRER EMPREINTE
  // =============================
  registerFingerprint(data: any) {
    return axios.post(`${API_URL}/fingerprint/register`, data)
  },

  // =============================
  // CHECK-IN
  // =============================
  checkIn(data: any) {
    return axios.post(`${API_URL}/presence/checkin`, data)
  },

  // =============================
  // CHECK-OUT
  // =============================
  checkOut(data: any) {
    return axios.post(`${API_URL}/presence/checkout`, data)
  },

  // =============================
  // RAPPORT PRESENCE
  // =============================
  getPresenceReport() {
    return axios.get(`${API_URL}/presence/report`)
  }

}

export default PresenceService