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
    actividad_titulo: "Actividad single",
    actividad_detalle: `Actividad #${sesionClaseId} · Nivel ${nivelEnBloque} de ${totalPasos}`,
  };
};

const decorateSession = (session) => ({
  ...session,
  ...buildActivityContext(session),
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
