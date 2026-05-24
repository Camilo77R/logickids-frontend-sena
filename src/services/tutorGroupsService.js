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
  
  // 1. Obtener la lista de grupos del tutor autenticado
  listarGrupos: async () => {
    // request() ya envía el token por defecto (auth = true)
    return await request("/grupos");
  },

  // Devuelve la colección ya desempaquetada para páginas que solo necesitan el arreglo.
  getGroups: async () => {
    const payload = await request("/grupos");
    return unwrapCollection(payload);
  },

  // 2. Obtener un grupo específico con sus estudiantes
  obtenerGrupo: async (grupoId) => {
    return await request(`/grupos/${grupoId}`);
  },

  getGroup: async (grupoId) => {
    const payload = await request(`/grupos/${grupoId}`);
    return unwrapEntity(payload);
  },

  // 3. Crear un nuevo grupo
  crearGrupo: async (datosGrupo) => {
    return await request("/grupos", {
      method: "POST",
      body: datosGrupo
    });
  },

  // 4. Actualizar un grupo existente
  actualizarGrupo: async (grupoId, datosGrupo) => {
    return await request(`/grupos/${grupoId}`, {
      method: "PUT",
      body: datosGrupo
    });
  },

  // 5. Eliminar un grupo
  eliminarGrupo: async (grupoId) => {
    return await request(`/grupos/${grupoId}`, {
      method: "DELETE"
    });
  },

  // 6. Abrir la sesión pedagógica del grupo en modo single o path
  abrirSesionClase: async (grupoId, sessionConfig) => {
    return await request(`/grupos/${grupoId}/sesion`, {
      method: "PATCH",
      body: normalizeSessionOpenPayload(sessionConfig),
    });
  },

  // 7. Cerrar la sesión de clase
  cerrarSesionClase: async (grupoId) => {
    return await request(`/grupos/${grupoId}/sesion`, {
      method: "PATCH",
      body: { sesion_activa: false }
    });
  }
};

export default tutorGroupsService;
