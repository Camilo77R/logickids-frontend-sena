export default function EmptyState({ title, description }) {
  return (
    <div className="lk-empty">
      <strong>{title}</strong>
      <p className="lk-muted">{description}</p>
    </div>
  );
}
