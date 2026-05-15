import TutorDashboardPanel from "./TutorDashboardPanel";

/**
 * TutorStatusPanel
 *
 * POR QUE: el estado general del aula es información de negocio. La página le
 * pasa el mensaje resuelto y este componente solo lo representa.
 */
export default function TutorStatusPanel({ status }) {
  return (
    <TutorDashboardPanel
      eyebrow="Radar del aula"
      title={status.title}
      subtitle={status.message}
      className={`lk-dashboard-panel--status lk-dashboard-panel--${status.tone}`.trim()}
    >
      <div className="lk-dashboard-status">
        <div className="lk-dashboard-status__dot" aria-hidden="true" />
        <p className="lk-dashboard-status__caption">
          Estado consolidado del tablero tutor
        </p>
      </div>
    </TutorDashboardPanel>
  );
}
