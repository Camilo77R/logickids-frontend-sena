import { request } from "./httpClient";

const unwrapCollection = (payload) => payload?.data ?? (Array.isArray(payload) ? payload : []);
const unwrapEntity = (payload) => payload?.data ?? payload ?? null;

/**
 * Servicio para manejar la lógica de grupos del Tutor
 */
const tutorGroupsService = {
  listarGrupos: async () => {
    return await request("/grupos");
  },

  getGroups: async () => {
    const payload = await request("/grupos");
    return unwrapCollection(payload);
  },

  obtenerGrupo: async (grupoId) => {
    return await request(`/grupos/${grupoId}`);
  },

  getGroup: async (grupoId) => {
    const payload = await request(`/grupos/${grupoId}`);
    return unwrapEntity(payload);
  },

  listarMinijuegosActivos: async () => {
    const payload = await request("/minijuegos", { auth: false });
    return unwrapCollection(payload);
  },

  abrirSesionClase: async (grupoId, minijuegoId) => {
    return await request(`/grupos/${grupoId}/sesion`, {
      method: "PATCH",
      body: {
        sesion_activa: true,
        minijuego_id: minijuegoId,
      },
    });
  },

  cerrarSesionClase: async (grupoId) => {
    return await request(`/grupos/${grupoId}/sesion`, {
      method: "PATCH",
      body: { sesion_activa: false },
    });
  },
};

export default tutorGroupsService;
