/**
 * DashboardPanel
 *
 * Superficie secundaria reusable para bento dashboards.
 */
export default function DashboardPanel({
  eyebrow,
  title,
  subtitle,
  aside,
  children,
}) {
  return (
    <section className="lk-role-panel">
      <header className="lk-role-panel__header">
        <div>
          {eyebrow ? <span className="lk-role-panel__eyebrow">{eyebrow}</span> : null}
          <h2 className="lk-role-panel__title">{title}</h2>
          {subtitle ? <p className="lk-role-panel__subtitle">{subtitle}</p> : null}
        </div>
        {aside}
      </header>

      {children}
    </section>
  );
}
