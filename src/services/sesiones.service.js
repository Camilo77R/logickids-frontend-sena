import { request } from "./httpClient";

const API = "/sesiones";

const unwrapCollection = (payload) => payload?.data ?? (Array.isArray(payload) ? payload : []);

const toPositiveInt = (value, fallback = null) => {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : fallback;
};

const toNonNegativeInt = (value) => {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric >= 0 ? numeric : null;
};

const toFiniteNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const buildActivityContext = (session) => {
  const sesionClaseId = toPositiveInt(session?.sesion_clase_id);

  if (!sesionClaseId) {
    return {
      actividad_clave: `sesion-${session?.id ?? "sin-clave"}`,
      actividad_titulo: "Sesión independiente",
      actividad_detalle: "No pertenece a una actividad pedagógica agrupada.",
    };
  }

  const totalPasos = toPositiveInt(session?.sesion_total_pasos, 1);
  const ordenEnRuta = toPositiveInt(session?.orden_en_ruta, 1);
  const nivelEnBloque = toPositiveInt(session?.nivel_en_bloque, ordenEnRuta);

  if (session?.sesion_modo === "path") {
    return {
      actividad_clave: `sesion-clase-${sesionClaseId}`,
      actividad_titulo: session?.sesion_ruta_nombre
        ? `Ruta · ${session.sesion_ruta_nombre}`
        : "Ruta pedagógica",
      actividad_detalle: `Actividad #${sesionClaseId} · Paso ${ordenEnRuta} de ${totalPasos}`,
    };
  }

  return {
    actividad_clave: `sesion-clase-${sesionClaseId}`,
    actividad_titulo: "Actividad single",
    actividad_detalle: `Actividad #${sesionClaseId} · Nivel ${nivelEnBloque} de ${totalPasos}`,
  };
};

const getSessionConfig = (session) => {
  const config = session?.configuracion_aplicada;

  if (!config) return {};
  if (typeof config === "object") return config;

  try {
    return JSON.parse(config);
  } catch {
    return {};
  }
};

const normalizeAdaptationSource = (value) => {
  if (typeof value !== "string") return null;

  const normalized = value.trim().toLowerCase();
  return normalized || null;
};

const buildAdaptationContext = (session) => {
  const config = getSessionConfig(session);
  const adaptacion =
    config?.adaptacion && typeof config.adaptacion === "object" ? config.adaptacion : null;
  const metricas =
    adaptacion?.metricas && typeof adaptacion.metricas === "object" ? adaptacion.metricas : {};
  const fuente =
    normalizeAdaptationSource(session?.fuente_adaptacion) ??
    normalizeAdaptationSource(adaptacion?.fuente);
  const dificultad = toPositiveInt(session?.dificultad ?? config?.dificultad);
  const hasAdaptationPayload =
    dificultad !== null ||
    Boolean(fuente) ||
    typeof adaptacion?.motivo === "string" ||
    Object.keys(metricas).length > 0;

  let ajusteTitulo = null;
  if (fuente === "reglas" || fuente === "ia") {
    ajusteTitulo = "Dificultad personalizada";
  } else if (fuente === "base") {
    ajusteTitulo = "Dificultad definida";
  } else if (dificultad !== null) {
    ajusteTitulo = "Fuente no informada";
  }

  return {
    dificultad,
    ajuste_visible: hasAdaptationPayload,
    ajuste_fuente: fuente,
    ajuste_titulo: ajusteTitulo,
    ajuste_motivo: typeof adaptacion?.motivo === "string" ? adaptacion.motivo : null,
    ajuste_decision:
      typeof adaptacion?.decision === "string"
        ? adaptacion.decision.trim().toLowerCase()
        : typeof metricas?.decision === "string"
          ? metricas.decision.trim().toLowerCase()
          : null,
    dificultad_anterior: toPositiveInt(metricas?.ultima_dificultad),
    dificultad_maxima: toPositiveInt(metricas?.dificultad_maxima),
    precision_historica: toFiniteNumber(metricas?.precision_historica),
    precision_reciente: toFiniteNumber(metricas?.precision_reciente),
    intentos_acumulados: toNonNegativeInt(metricas?.total_intentos),
    ajuste_alcance:
      typeof metricas?.alcance === "string" ? metricas.alcance.trim().toLowerCase() : null,
    aciertos_mision_anterior: toNonNegativeInt(metricas?.aciertos_mision_anterior),
    errores_mision_anterior: toNonNegativeInt(metricas?.errores_mision_anterior),
    intentos_mision_anterior: toNonNegativeInt(metricas?.intentos_mision_anterior),
    estado_mision_anterior:
      typeof metricas?.estado_mision_anterior === "string"
        ? metricas.estado_mision_anterior.trim().toLowerCase()
        : null,
  };
};

const decorateSession = (session) => ({
  ...session,
  ...buildActivityContext(session),
  ...buildAdaptationContext(session),
});

export const getSesionesByEstudiante = async (id) => {
  const payload = await request(`${API}/estudiante/${id}`);
  return unwrapCollection(payload).map(decorateSession);
};

export const getSesionesPorGrupo = async (estudiantes) => {
  const resultados = await Promise.all(
    estudiantes.map(async (estudiante) => {
      const sesiones = await getSesionesByEstudiante(estudiante.id);

      return sesiones.map((sesion) => ({
        ...sesion,
        estudiante_id: estudiante.id,
        estudiante_nombre: estudiante.nombre,
      }));
    })
  );

  return resultados.flat().sort((left, right) =>
    new Date(right.iniciada_en).getTime() - new Date(left.iniciada_en).getTime()
  );
};

export const getEventosSesion = async (sesionId) => {
  const payload = await request(`${API}/${sesionId}/eventos`);
  return unwrapCollection(payload);
};
