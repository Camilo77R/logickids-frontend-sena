import { UserPlus } from "lucide-react";

export default function TutorEstudiantesPage() {
  return (
    <div className="tutor-placeholder-page">
      <div className="tutor-placeholder-icon">
        <UserPlus size={40} />
      </div>
      <h1>Directorio de Estudiantes</h1>
      <p>Aquí el tutor podrá agregar, editar o mover estudiantes entre grupos. Se podrá imprimir el QR para cada estudiante.</p>
      <div className="tutor-team-badge">En construcción por el equipo Asignado</div>
    </div>
  );
}
