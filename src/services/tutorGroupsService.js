import { request } from "./httpClient";

const unwrapCollection = (payload) => payload?.data ?? (Array.isArray(payload) ? payload : []);
const unwrapEntity = (payload) => payload?.data ?? payload ?? null;
const resolveCatalogOrder = (item) => {
  const value = Number(item?.orden_catalogo ?? item?.orden ?? Number.MAX_SAFE_INTEGER);
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER;
};

const sortCatalogByOrder = (items) =>
  [...items].sort((left, right) => resolveCatalogOrder(left) - resolveCatalogOrder(right));

const normalizePositiveInt = (value, fallback = null) => {
  const normalized = Number(value);
  return Number.isInteger(normalized) && normalized > 0 ? normalized : fallback;
};

const normalizeSessionOpenPayload = ({ modo, minijuegoId, niveles, rutaId }) => {
  const normalizedMode = modo === "path" ? "path" : "single";

  if (normalizedMode === "path") {
    return {
      sesion_activa: true,
      modo: "path",
      ruta_id: normalizePositiveInt(rutaId),
    };
  }

  return {
    sesion_activa: true,
    modo: "single",
    minijuego_id: normalizePositiveInt(minijuegoId),
    niveles: normalizePositiveInt(niveles, 1),
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

  listarMinijuegosActivos: async () => {
    const payload = await request("/minijuegos");
    return sortCatalogByOrder(unwrapCollection(payload));
  },

  listarRutasPedagogicas: async () => {
    const payload = await request("/rutas-pedagogicas");
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
