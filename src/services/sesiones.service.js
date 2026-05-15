import { request } from "./httpClient";

const API = "/sesiones";

const unwrapCollection = (payload) => payload?.data ?? (Array.isArray(payload) ? payload : []);

export const getSesionesByEstudiante = async (id) => {
  const payload = await request(`${API}/estudiante/${id}`);
  return unwrapCollection(payload);
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
