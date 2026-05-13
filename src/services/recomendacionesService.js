/**
 * Servicio de recomendaciones pedagógicas (IA Gemini).
 *
 * Conecta con los endpoints /api/recomendaciones/* del backend.
 * La generación llama a Google Gemini internamente en el servidor.
 * Si no hay API key configurada, el backend devuelve una respuesta simulada.
 *
 * @module recomendacionesService
 */
import { request } from "./httpClient";

const recomendacionesService = {
  /**
   * Obtiene el historial de recomendaciones activas de un estudiante.
   *
   * @param {number} estudianteId
   * @returns {Promise<Array>} Lista de recomendaciones
   */
  async porEstudiante(estudianteId) {
    const payload = await request(`/recomendaciones/estudiante/${estudianteId}`);
    return payload?.data ?? [];
  },

  /**
   * Obtiene el historial de recomendaciones activas de un grupo.
   *
   * @param {number} grupoId
   * @returns {Promise<Array>} Lista de recomendaciones
   */
  async porGrupo(grupoId) {
    const payload = await request(`/recomendaciones/grupo/${grupoId}`);
    return payload?.data ?? [];
  },

  /**
   * Genera una recomendación pedagógica personalizada para un estudiante usando IA.
   * El backend analiza las estadísticas del estudiante y llama a Gemini.
   *
   * @param {number} estudianteId
   * @returns {Promise<object>} Recomendación generada con mensaje, habilidad y severidad
   */
  async generarParaEstudiante(estudianteId) {
    const payload = await request(`/recomendaciones/generar/estudiante/${estudianteId}`, {
      method: "POST",
    });
    return payload?.data ?? null;
  },

  /**
   * Genera una recomendación pedagógica grupal usando IA.
   *
   * @param {number} grupoId
   * @returns {Promise<object>} Recomendación generada para el grupo
   */
  async generarParaGrupo(grupoId) {
    const payload = await request(`/recomendaciones/generar/grupo/${grupoId}`, {
      method: "POST",
    });
    return payload?.data ?? null;
  },

  /**
   * Archiva una recomendación para ocultarla del dashboard del tutor.
   * No se elimina de la base de datos, solo se marca como inactiva.
   *
   * @param {number} recomendacionId
   * @returns {Promise<void>}
   */
  async archivar(recomendacionId) {
    await request(`/recomendaciones/${recomendacionId}/archivar`, {
      method: "PATCH",
    });
  },
};

export default recomendacionesService;
