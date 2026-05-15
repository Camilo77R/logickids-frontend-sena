import { Link } from "react-router-dom";

/**
 * QuickActionCard
 *
 * Enlace de acción rápida para dashboards administrativos.
 */
export default function QuickActionCard({
  to,
  icon: Icon,
  title,
  description,
  tone = "purple",
}) {
  return (
    <Link to={to} className={`lk-role-quick-link lk-role-quick-link--${tone}`}>
      <span className={`lk-role-quick-link__icon lk-role-quick-link__icon--${tone}`}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <span>
        <strong className="lk-role-quick-link__title">{title}</strong>
        <span className="lk-role-quick-link__description">{description}</span>
      </span>
    </Link>
  );
}
