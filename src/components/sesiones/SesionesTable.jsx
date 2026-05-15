export default function SesionesTable({
  data,
  onSelectSession,
  selectedSessionId,
  showStudentColumn = false,
}) {
  return (
    <div className="ses-table-wrapper">
      <table className="ses-table">
        <thead>
          <tr>
            <th>Fecha</th>
            {showStudentColumn && <th>Estudiante</th>}
            <th>Minijuego</th>
            <th>Puntaje</th>
            <th>Aciertos</th>
            <th>Errores</th>
            <th>Estado</th>
          </tr>
        </thead>

        <tbody>
          {data.map((s) => (
            <tr
              key={s.id}
              className={`ses-table-row${selectedSessionId === s.id ? " ses-table-row--selected" : ""}`}
              onClick={() => onSelectSession?.(s)}
            >
              <td className="ses-td-bold">
                {new Date(s.iniciada_en).toLocaleDateString("es-CO")}
              </td>

              {showStudentColumn && (
                <td style={{ color: "var(--lk-tutor-primary)", fontWeight: 600 }}>
                  {s.estudiante_nombre || "Sin nombre"}
                </td>
              )}

              <td>
                <span className="ses-tag">{s.minijuego}</span>
              </td>

              <td className="ses-td-bold">{s.puntaje}</td>
              <td className="ses-td-green">{s.aciertos}</td>
              <td className="ses-td-red">{s.errores}</td>

              <td>
                <span
                  className={`ses-badge ${
                    s.estado === "completado" ? "ses-badge--green" : "ses-badge--blue"
                  }`}
                >
                  {s.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
