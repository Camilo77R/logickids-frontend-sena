/**
 * TutorMetricCard
 *
 * POR QUE: una métrica del dashboard debe ser un componente puro y reusable,
 * no un bloque inline repetido dentro de la página.
 */
export default function TutorMetricCard({
  label,
  value,
  description,
  Icon,
  tone = "purple",
}) {
  return (
    <article className={`lk-metric-card lk-metric-card--${tone}`.trim()}>
      <div className="lk-metric-card__icon" aria-hidden="true">
        <Icon size={20} strokeWidth={2.2} />
      </div>
      <span className="lk-metric-card__label">{label}</span>
      <strong className="lk-metric-card__value">{value}</strong>
      <p className="lk-metric-card__description">{description}</p>
    </article>
  );
}
