export default function SesionesFilters({
  tipo,
  setTipo,
  grupos,
  grupoId,
  setGrupoId,
  estudiantes,
  estudianteId,
  setEstudiante,
}) {
  return (
    <div className="ses-filters-row">
      <select
        className="ses-select"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
      >
        <option value="estudiante">Estudiante</option>
        <option value="grupo">Grupo</option>
      </select>

      <select
        className="ses-select"
        value={grupoId}
        onChange={(e) => setGrupoId(e.target.value)}
      >
        <option value="">Selecciona un grupo</option>
        {grupos.map((grupo) => (
          <option key={grupo.id} value={grupo.id}>
            {grupo.nombre}
          </option>
        ))}
      </select>

      <select
        className="ses-select"
        value={estudianteId}
        onChange={(e) => setEstudiante(e.target.value)}
        disabled={tipo !== "estudiante" || !estudiantes.length}
      >
        <option value="">Selecciona un estudiante</option>
        {estudiantes.map((estudiante) => (
          <option key={estudiante.id} value={estudiante.id}>
            {estudiante.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
