import { request } from "./httpClient";

const API = "/sesiones";

//  POR ESTUDIANTE
export const getSesionesByEstudiante = async (id) => {
  try {
    const res = await request(`${API}/estudiante/${id}`);

    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error("Error sesiones:", error);
    return [];
  }
};

//  POR GRUPO
export const getSesionesPorGrupo = async (estudiantes) => {
  try {
    const promesas = estudiantes.map((e) =>
      getSesionesByEstudiante(e.id)
    );

    const resultados = await Promise.all(promesas);

    return resultados.flat();
  } catch (error) {
    console.error("Error grupo:", error);
    return [];
  }
};