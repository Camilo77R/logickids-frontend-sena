import { useEffect, useMemo, useState } from "react";

const PAGE_SIZE = 10;

export default function SesionesTable({
  data,
  onSelectSession,
  selectedSessionId,
  showStudentColumn = false,
}) {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
  const paginatedData = useMemo(
    () => data.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [data, currentPage]
  );

  const pages = useMemo(() => {
    const arr = [];
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [currentPage, totalPages]);

  return (
    <>
      <div className="ses-table-wrapper">
        <table className="ses-table">
          <thead>
            <tr>
              <th>Fecha</th>
              {showStudentColumn && <th>Estudiante</th>}
              <th>Actividad</th>
              <th>Minijuego</th>
              <th>Puntaje</th>
              <th>Aciertos</th>
              <th>Errores</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={showStudentColumn ? 8 : 7} className="ses-empty-row">
                  No se encontraron sesiones con los filtros actuales.
                </td>
              </tr>
            ) : (
              paginatedData.map((s) => (
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
                    <div className="ses-cell-primary">{s.actividad_titulo || "Actividad"}</div>
                    <div className="ses-cell-secondary">{s.actividad_detalle || "Sin detalle"}</div>
                  </td>

                  <td>
                    <span className="ses-tag">{s.minijuego}</span>
                    {s.habilidad ? (
                      <div className="ses-cell-secondary">Habilidad: {s.habilidad}</div>
                    ) : null}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="ses-pagination">
          <button
            className="ses-page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            ←
          </button>
          {pages[0] > 1 && <span className="ses-page-ellipsis">...</span>}
          {pages.map((p) => (
            <button
              key={p}
              className={`ses-page-btn${p === currentPage ? " is-active" : ""}`}
              onClick={() => setCurrentPage(p)}
            >
              {p}
            </button>
          ))}
          {pages[pages.length - 1] < totalPages && <span className="ses-page-ellipsis">...</span>}
          <button
            className="ses-page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            →
          </button>
        </div>
      )}
    </>
  );
}
