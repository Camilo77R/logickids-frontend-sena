import TutorDashboardPanel from "./TutorDashboardPanel";

/**
 * TutorGroupsSnapshotPanel
 *
 * POR QUE: presenta una lista corta de grupos sin acoplar la UI a la respuesta
 * del endpoint; recibe grupos ya normalizados.
 */
export default function TutorGroupsSnapshotPanel({ groups }) {
  return (
    <TutorDashboardPanel
      eyebrow="Tus grupos"
      title="Pulso rápido de clases"
      subtitle="Una vista ligera para saber qué grupos están listos y cuáles siguen en pausa."
    >
      {groups.length ? (
        <div className="lk-dashboard-groups">
          {groups.map((group) => (
            <article key={group.id} className="lk-dashboard-group-card">
              <div className="lk-dashboard-group-card__top">
                <div>
                  <h3 className="lk-dashboard-group-card__title">{group.nombre}</h3>
                  <p className="lk-dashboard-group-card__description">
                    {group.descripcion}
                  </p>
                </div>

                <span
                  className={`lk-dashboard-chip lk-dashboard-chip--${
                    group.sesionActiva ? "success" : "warning"
                  }`}
                >
                  {group.sesionActiva ? "Sesión abierta" : "Sesión cerrada"}
                </span>
              </div>

              <div className="lk-dashboard-group-card__footer">
                <span className="lk-dashboard-group-card__meta">
                  {group.predeterminado ? "Grupo principal" : "Grupo auxiliar"}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="lk-dashboard-empty">
          <strong>Aún no hay grupos creados.</strong>
          <p>
            Cuando registres tu primer grupo, aquí aparecerá su estado y podrás
            monitorearlo de un vistazo.
          </p>
        </div>
      )}
    </TutorDashboardPanel>
  );
}
