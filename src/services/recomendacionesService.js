/**
 * Servicio de recomendaciones pedagógicas.
 *
 * Mantiene compatibilidad con el flujo persistido histórico del backend
 * y agrega soporte para el flujo CSV + FastAPI con historial en archivo.
 */
import { request } from "./httpClient";

const recomendacionesService = {
  async porEstudiante(estudianteId) {
    const payload = await request(`/recomendaciones/estudiante/${estudianteId}`);
    return payload?.data ?? [];
  },

  async listarPorEstudiante(estudianteId) {
    return this.porEstudiante(estudianteId);
  },

  async porGrupo(grupoId) {
    const payload = await request(`/recomendaciones/grupo/${grupoId}`);
    return payload?.data ?? [];
  },

  async listarPorGrupo(grupoId) {
    return this.porGrupo(grupoId);
  },

  async generarParaEstudiante(estudianteId) {
    const payload = await request(`/recomendaciones/generar/estudiante/${estudianteId}`, {
      method: "POST",
    });
    return payload?.data ?? null;
  },

  async generarParaGrupo(grupoId) {
    const payload = await request(`/recomendaciones/generar/grupo/${grupoId}`, {
      method: "POST",
    });
    return payload?.data ?? null;
  },

  async obtenerCatalogoCsvIA() {
    const payload = await request(`/ia/recomendaciones/catalogo-csv`);
    return payload?.data ?? { grupos: [], estudiantes: [] };
  },

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
      historialActualizado: payload?.historial_actualizado ?? 0,
    };
  },

  async obtenerHistorialCsvIA({ grupoId, estudianteId } = {}) {
    const params = new URLSearchParams();

    if (grupoId) params.set("grupoId", String(grupoId));
    if (estudianteId) params.set("estudianteId", String(estudianteId));

    const query = params.toString();
    const payload = await request(
      `/ia/recomendaciones/historial-csv${query ? `?${query}` : ""}`
    );

    return payload?.data ?? [];
  },

  async borrarHistorialCsvIA({ recommendationId, grupoId, estudianteId } = {}) {
    const payload = await request(`/ia/recomendaciones/historial-csv`, {
      method: "DELETE",
      body: {
        recommendationId: recommendationId || undefined,
        grupoId: grupoId || undefined,
        estudianteId: estudianteId || undefined,
      },
    });

    return {
      deleted: payload?.deleted ?? 0,
      message: payload?.message ?? "Historial borrado correctamente.",
    };
  },

  async archivar(recomendacionId) {
    await request(`/recomendaciones/${recomendacionId}/archivar`, {
      method: "PATCH",
    });
  },
};

export default recomendacionesService;
