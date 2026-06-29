export default function DashboardMetricCard({
  icon: Icon,
  label,
  value,
  description,
  tone = "purple",
  compact = false,  // ← nueva prop
}) {
  if (compact) {
    return (
      <div className="lk-metric-compact">
        <div className="lk-metric-compact__icon">
          <Icon size={16} />
        </div>
        <div className="lk-metric-compact__info">
          <span className="lk-metric-compact__label">{label}</span>
          <strong className="lk-metric-compact__value">{value}</strong>
        </div>
      </div>
    );
  }

  return (
    <article className={`lk-role-metric lk-role-metric--${tone}`}>
      <div className="lk-role-metric__icon">
        <Icon size={20} />
      </div>
      <span className="lk-role-metric__label">{label}</span>
      <strong className="lk-role-metric__value">{value}</strong>
      <p className="lk-role-metric__description">{description}</p>
    </article>
  );
}