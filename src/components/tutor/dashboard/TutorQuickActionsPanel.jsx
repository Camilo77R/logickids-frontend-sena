import { Link } from "react-router-dom";
import TutorDashboardPanel from "./TutorDashboardPanel";

/**
 * TutorQuickActionsPanel
 *
 * POR QUE: deja accesos consistentes y reutilizables para el shell tutor, sin
 * meter rutas y estilos de CTA dispersos por toda la página.
 */
export default function TutorQuickActionsPanel({ actions }) {
  return (
    <TutorDashboardPanel
      eyebrow="Acciones rápidas"
      title="Siguientes pasos"
      subtitle="El cascarón queda listo para que el tutor se mueva rápido por sus flujos principales."
    >
      <div className="lk-dashboard-actions">
        {actions.map(({ to, label, description, Icon, tone }) => (
          <Link
            key={to}
            to={to}
            className={`lk-dashboard-action lk-dashboard-action--${tone}`.trim()}
          >
            <span className="lk-dashboard-action__icon" aria-hidden="true">
              <Icon size={18} strokeWidth={2.3} />
            </span>
            <div>
              <strong className="lk-dashboard-action__title">{label}</strong>
              <p className="lk-dashboard-action__description">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </TutorDashboardPanel>
  );
}
