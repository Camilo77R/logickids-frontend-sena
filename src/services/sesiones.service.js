const API = "http://localhost:3000/api/sesiones";

//  POR NIÑO
export const getSesionesByEstudiante = async (id) => {
  const res = await fetch(`${API}/estudiante/${id}`);
  const data = await res.json();
  return data.data || data; 
};

// POR GRUPO 
export const getSesionesPorGrupo = async (estudiantes) => {
  const promesas = estudiantes.map(e =>
    getSesionesByEstudiante(e.id)
  );

  const resultados = await Promise.all(promesas);

  return resultados.flat();
};