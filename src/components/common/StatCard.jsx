export default function StatCard({ label, value, helpText, tone = "blue" }) {
  return (
    <article className={`lk-stat-card lk-stat-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helpText}</small>
    </article>
  );
}
