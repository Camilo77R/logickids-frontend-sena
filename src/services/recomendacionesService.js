import { request } from "./httpClient";

const recomendacionesService = {
  async listarPorEstudiante(estudianteId) {
    const payload = await request(`/recomendaciones/estudiante/${estudianteId}`);
    return payload?.data ?? [];
  },

  async generarParaEstudiante(estudianteId) {
    const payload = await request(`/recomendaciones/generar/estudiante/${estudianteId}`, {
      method: "POST",
    });
    return payload?.data ?? null;
  },
};

export default recomendacionesService;
