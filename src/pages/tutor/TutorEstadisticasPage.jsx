import { BarChart3 } from "lucide-react";

export default function TutorEstadisticasPage() {
  return (
    <div className="tutor-placeholder-page">
      <div className="tutor-placeholder-icon">
        <BarChart3 size={40} />
      </div>
      <h1>Estadísticas de Rendimiento</h1>
      <p>Vista de gráficos detallados sobre la precisión y tiempo de reacción por estudiante o grupo entero.</p>
      <div className="tutor-team-badge">En construcción por el equipo Asignado</div>
    </div>
  );
}
