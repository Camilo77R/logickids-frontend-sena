/**
 * TutorDashboardPanel
 *
 * POR QUE: encapsula la estructura visual de paneles del dashboard para
 * evitar repetir wrappers, títulos y subtítulos en cada sección.
 */
export default function TutorDashboardPanel({
  title,
  subtitle,
  eyebrow,
  actions,
  children,
  className = "",
}) {
  return (
    <section className={`lk-dashboard-panel ${className}`.trim()}>
      {(eyebrow || title || subtitle || actions) && (
        <header className="lk-dashboard-panel__header">
          <div>
            {eyebrow ? (
              <span className="lk-dashboard-panel__eyebrow">{eyebrow}</span>
            ) : null}
            {title ? <h2 className="lk-dashboard-panel__title">{title}</h2> : null}
            {subtitle ? (
              <p className="lk-dashboard-panel__subtitle">{subtitle}</p>
            ) : null}
          </div>
          {actions ? (
            <div className="lk-dashboard-panel__actions">{actions}</div>
          ) : null}
        </header>
      )}

      {children}
    </section>
  );
}
