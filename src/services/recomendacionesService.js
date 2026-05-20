/**
 * Servicio de recomendaciones pedagógicas (IA Gemini).
 *
 * Conecta con los endpoints /api/recomendaciones/* del backend.
 * La generación llama a Google Gemini internamente en el servidor.
 * Si no hay API key configurada, el backend devuelve una respuesta simulada.
 *
 * Además integra el flujo complementario CSV + FastAPI.
 *
 * @module recomendacionesService
 */
import { request } from "./httpClient";

const recomendacionesService = {
  /**
   * Obtiene el historial de recomendaciones activas de un estudiante.
   *
   * @param {number} estudianteId
   * @returns {Promise<Array>}
   */
  async porEstudiante(estudianteId) {
    const payload = await request(`/recomendaciones/estudiante/${estudianteId}`);
    return payload?.data ?? [];
  },

  /**
   * Alias compatible con implementaciones anteriores.
   *
   * @param {number} estudianteId
   * @returns {Promise<Array>}
   */
  async listarPorEstudiante(estudianteId) {
    return this.porEstudiante(estudianteId);
  },

  /**
   * Obtiene el historial de recomendaciones activas de un grupo.
   *
   * @param {number} grupoId
   * @returns {Promise<Array>}
   */
  async porGrupo(grupoId) {
    const payload = await request(`/recomendaciones/grupo/${grupoId}`);
    return payload?.data ?? [];
  },

  /**
   * Alias compatible con implementaciones anteriores.
   *
   * @param {number} grupoId
   * @returns {Promise<Array>}
   */
  async listarPorGrupo(grupoId) {
    return this.porGrupo(grupoId);
  },

  /**
   * Genera una recomendación pedagógica personalizada para un estudiante usando IA.
   *
   * @param {number} estudianteId
   * @returns {Promise<object|null>}
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
   * @returns {Promise<object|null>}
   */
  async generarParaGrupo(grupoId) {
    const payload = await request(`/recomendaciones/generar/grupo/${grupoId}`, {
      method: "POST",
    });
    return payload?.data ?? null;
  },

  /**
   * Obtiene los grupos y estudiantes detectados en el CSV local.
   *
   * @returns {Promise<{grupos: Array, estudiantes: Array}>}
   */
  async obtenerCatalogoCsvIA() {
    const payload = await request(`/ia/recomendaciones/catalogo-csv`);
    return payload?.data ?? { grupos: [], estudiantes: [] };
  },

  /**
   * Ejecuta el flujo CSV + FastAPI con filtros opcionales.
   *
   * @param {{ grupoId?: string|number, estudianteId?: string|number }} filters
   * @returns {Promise<{success: boolean, total: number, recomendaciones: Array}>}
   */
  async generarDesdeCsvIA({ grupoId, estudianteId } = {}) {
    const payload = await request(`/ia/recomendaciones/generar-desde-archivo`, {
      method: "POST",
      body: {
        grupoId: grupoId || undefined,
        estudianteId: estudianteId || undefined,
      },
    });

    return {
      success: payload?.success ?? false,
      total: payload?.total ?? 0,
      recomendaciones: payload?.recomendaciones ?? [],
    };
  },

  /**
   * Archiva una recomendación para ocultarla del dashboard del tutor.
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
