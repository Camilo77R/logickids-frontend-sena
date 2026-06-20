import { request } from "./httpClient";

const API = "/sesiones";

const unwrapCollection = (payload) => payload?.data ?? (Array.isArray(payload) ? payload : []);

const toPositiveInt = (value, fallback = null) => {
  const numeric = Number(value);
  return Number.isInteger(numeric) && numeric > 0 ? numeric : fallback;
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
    actividad_titulo: session?.minijuego
      ? `Práctica de ${session.minijuego}`
      : "Práctica de juego",
    actividad_detalle: `Misión ${nivelEnBloque} de ${totalPasos}`,
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

const buildAdaptationContext = (session) => {
  const config = getSessionConfig(session);
  const adaptacion = config?.adaptacion ?? null;
  const fuente = session?.fuente_adaptacion ?? adaptacion?.fuente ?? "base";
  const dificultad = Number(session?.dificultad ?? config?.dificultad ?? 1);
  const metricas = adaptacion?.metricas ?? {};

  return {
    dificultad,
    ajuste_fuente: fuente,
    ajuste_titulo:
      fuente === "reglas" || fuente === "ia"
        ? "Dificultad personalizada"
        : "Dificultad definida",
    ajuste_motivo:
      adaptacion?.motivo ??
      (fuente === "base"
        ? "La partida uso un nivel definido manualmente."
        : "El sistema ajusto el nivel con el historial disponible."),
    ajuste_metricas: metricas,
    ajuste_decision: metricas?.decision ?? "mantener",
    dificultad_anterior: metricas?.ultima_dificultad ?? null,
    dificultad_maxima: metricas?.dificultad_maxima ?? null,
    precision_historica: metricas?.precision_historica ?? null,
    precision_reciente: metricas?.precision_reciente ?? null,
    intentos_acumulados: metricas?.total_intentos ?? null,
    ajuste_alcance: metricas?.alcance ?? "historico",
    aciertos_mision_anterior: metricas?.aciertos_mision_anterior ?? null,
    errores_mision_anterior: metricas?.errores_mision_anterior ?? null,
    intentos_mision_anterior: metricas?.intentos_mision_anterior ?? null,
    estado_mision_anterior: metricas?.estado_mision_anterior ?? null,
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
