import { request } from "./httpClient";

const unwrapCollection = (payload) => payload?.data ?? (Array.isArray(payload) ? payload : []);
const unwrapEntity = (payload) => payload?.data ?? payload ?? null;

const normalizeSessionOpenPayload = ({ modo, minijuegoId, pasos }) => {
  const normalizedMode = modo === "path" ? "path" : "single";

  if (normalizedMode === "path") {
    const normalizedSteps = Array.isArray(pasos)
      ? pasos
          .map((paso) => ({
            minijuego_id: Number(paso.minijuegoId),
            configuracion_base: {},
          }))
          .filter((paso) => Number.isInteger(paso.minijuego_id) && paso.minijuego_id > 0)
      : [];

    return {
      sesion_activa: true,
      modo: "path",
      pasos: normalizedSteps,
    };
  }

  return {
    sesion_activa: true,
    modo: "single",
    minijuego_id: Number(minijuegoId),
  };
};

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

  crearGrupo: async (datosGrupo) => {
    return await request("/grupos", {
      method: "POST",
      body: datosGrupo,
    });
  },

  actualizarGrupo: async (grupoId, datosGrupo) => {
    return await request(`/grupos/${grupoId}`, {
      method: "PUT",
      body: datosGrupo,
    });
  },

  eliminarGrupo: async (grupoId) => {
    return await request(`/grupos/${grupoId}`, {
      method: "DELETE",
    });
  },

  listarMinijuegosActivos: async () => {
    const payload = await request("/minijuegos", { auth: false });
    return unwrapCollection(payload);
  },

  abrirSesionClase: async (grupoId, sessionConfig) => {
    return await request(`/grupos/${grupoId}/sesion`, {
      method: "PATCH",
      body: normalizeSessionOpenPayload(sessionConfig),
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
