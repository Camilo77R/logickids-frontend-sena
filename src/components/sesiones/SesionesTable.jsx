export default function SesionesTable({
  data,
  onSelectSession,
  selectedSessionId,
  showStudentColumn = false,
}) {
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        textAlign: "center",
        fontSize: "18px" 
      }}
    >
      <thead>
        <tr style={{ background: "#f3f4f6" }}>
          <th style={th}>Fecha</th>
          {showStudentColumn ? <th style={th}>Estudiante</th> : null}
          <th style={th}>Minijuego</th>
          <th style={th}>Puntaje</th>
          <th style={th}>Aciertos</th>
          <th style={th}>Errores</th>
          <th style={th}>Estado</th>
        </tr>
      </thead>

      <tbody>
        {data.map((s) => (
          <tr
            key={s.id}
            onClick={() => onSelectSession?.(s)}
            style={{
              cursor: onSelectSession ? "pointer" : "default",
              backgroundColor: selectedSessionId === s.id ? "#eff6ff" : "transparent",
            }}
          >
            <td style={td}>
              {new Date(s.iniciada_en).toLocaleDateString()}
            </td>
            {showStudentColumn ? <td style={td}>{s.estudiante_nombre || "Sin nombre"}</td> : null}
            <td style={td}>{s.minijuego}</td>
            <td style={td}>{s.puntaje}</td>
            <td style={td}>{s.aciertos}</td>
            <td style={td}>{s.errores}</td>
            <td style={td}>{s.estado}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const th = {
  border: "1px solid #ddd",
  padding: "16px", 
  fontWeight: "bold",
  fontSize: "18px"
};

const td = {
  border: "1px solid #ddd",
  padding: "14px", 
  fontSize: "17px"
};
