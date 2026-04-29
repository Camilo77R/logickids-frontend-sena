import { LayoutDashboard } from "lucide-react";

export default function TutorDashboardOverview() {
  return (
    <div className="tutor-placeholder-page">
      <div className="tutor-placeholder-icon">
        <LayoutDashboard size={40} />
      </div>
      <h1>Bienvenido al Panel del Tutor</h1>
      <p>Este será el resumen de actividad. Aquí se mostrarán KPIs generales, alertas recientes y atajos rápidos.</p>
      <div className="tutor-team-badge">En construcción por el equipo de Frontend</div>
    </div>
  );
}
