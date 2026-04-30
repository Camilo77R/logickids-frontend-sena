export default function SesionesFilters({ tipo, setTipo, estudiantes, setEstudiante }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Tipo */}
      <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
        <option value="estudiante">Estudiante</option>
        <option value="grupo">Grupo</option>
      </select>

      {/* Lista estudiantes */}
      <select onChange={(e) => setEstudiante(e.target.value)}>
        {estudiantes.map(e => (
          <option key={e.id} value={e.id}>{e.nombre}</option>
        ))}
      </select>
    </div>
  );
}