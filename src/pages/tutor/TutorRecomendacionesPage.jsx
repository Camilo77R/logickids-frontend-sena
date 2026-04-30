import { MessageSquareWarning } from "lucide-react";

export default function TutorRecomendacionesPage() {
  return (
    <div className="tutor-placeholder-page">
      <div className="tutor-placeholder-icon">
        <MessageSquareWarning size={40} />
      </div>
      <h1>Recomendaciones de IA (Gemini)</h1>
      <p>Bandeja de entrada con feedback pedagógico generado por Inteligencia Artificial para el tutor.</p>
      <div className="tutor-team-badge">En construcción por el equipo de IA</div>
    </div>
  );
}
