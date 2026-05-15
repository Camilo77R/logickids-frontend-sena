import { request } from "./httpClient";

const recomendacionesService = {
  async listarPorEstudiante(estudianteId) {
    const payload = await request(`/recomendaciones/estudiante/${estudianteId}`);
    return payload?.data ?? [];
  },

  async listarPorGrupo(grupoId) {
    const payload = await request(`/recomendaciones/grupo/${grupoId}`);
    return payload?.data ?? [];
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
    };
  },

  async archivar(recomendacionId) {
    await request(`/recomendaciones/${recomendacionId}/archivar`, {
      method: "PATCH",
    });
  },
};

export default recomendacionesService;
