import { request } from "./httpClient";

const unwrapCollection = (payload) => payload?.data ?? (Array.isArray(payload) ? payload : []);

const logrosService = {
  async listCatalog(estudianteId) {
    const query = estudianteId ? `?estudiante_id=${estudianteId}` : "";
    const payload = await request(`/logros/catalogo${query}`);
    return unwrapCollection(payload);
  },

  async listByStudent(estudianteId) {
    const payload = await request(`/logros/estudiante/${estudianteId}`);
    return unwrapCollection(payload);
  },
};

export default logrosService;
