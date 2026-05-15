/**
 * Servicio de estadísticas de habilidades.
 *
 * Conecta con los endpoints GET /api/estadisticas/* del backend.
 * Todas las funciones requieren JWT de tutor o admin en el header
 * (lo inyecta automáticamente httpClient.js).
 *
 * @module estadisticasService
 */
import { request } from "./httpClient";

const estadisticasService = {
  /**
   * Obtiene las estadísticas acumuladas de un estudiante específico.
   * El backend valida que el tutor/admin tenga acceso al estudiante.
   *
   * @param {number} estudianteId - ID del estudiante
   * @returns {Promise<Array>} Lista de estadísticas por habilidad
   */
  async porEstudiante(estudianteId) {
    const payload = await request(`/estadisticas/estudiante/${estudianteId}`);
    return payload?.data ?? [];
  },

  /**
   * Obtiene los promedios consolidados de precisión y velocidad del grupo.
   * Útil para el dashboard del tutor (muestra qué habilidad necesita más refuerzo).
   *
   * @param {number} grupoId - ID del grupo
   * @returns {Promise<Array>} Promedios por habilidad
   */
  async porGrupo(grupoId) {
    const payload = await request(`/estadisticas/grupo/${grupoId}`);
    return payload?.data ?? [];
  },
};

export default estadisticasService;
