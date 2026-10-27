// src/services/teacher.service.ts
import httpService from './http.service'

const teacherService = {
  getPresences: () => httpService.get('teacher/presences'),
  generateReport: () => httpService.get('teacher/report'),
}

export default teacherService
