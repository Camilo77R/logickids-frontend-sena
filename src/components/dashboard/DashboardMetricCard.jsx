/**
 * DashboardMetricCard
 *
 * Tarjeta métrica reusable para paneles administrativos.
 * Misma estructura, distintos tonos.
 */
export default function DashboardMetricCard({
  icon: Icon,
  label,
  value,
  description,
  tone = "purple",
}) {
  return (
    <article className={`lk-role-metric lk-role-metric--${tone}`}>
      <div className="lk-role-metric__icon">
        <Icon size={20} aria-hidden="true" />
      </div>
      <span className="lk-role-metric__label">{label}</span>
      <strong className="lk-role-metric__value">{value}</strong>
      <p className="lk-role-metric__description">{description}</p>
    </article>
  );
}
