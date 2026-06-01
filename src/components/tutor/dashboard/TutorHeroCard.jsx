import { Sparkles } from "lucide-react";

/**
 * TutorHeroCard
 *
 * POR QUE: concentra la bienvenida y el tono del portal sin repartir esa
 * narrativa entre topbar y widgets pequeños.
 */
export default function TutorHeroCard({
  firstName,
  totalGroups,
  activeGroups,
  readinessRate,
  heroTags,
}) {
  return (
    <section className="lk-dashboard-hero">
      <div className="lk-dashboard-hero__glow" aria-hidden="true" />

      <div className="lk-dashboard-hero__copy">
        <span className="lk-dashboard-hero__eyebrow">
          <Sparkles size={16} strokeWidth={2.4} aria-hidden="true" />
          Portal Tutor LogicKids
        </span>

        <h1 className="lk-dashboard-hero__title">
          ¡Hola, Profe {firstName}!
        </h1>

        <p className="lk-dashboard-hero__subtitle">
          Aquí tienes un panorama rápido de tus grupos, sesiones y el ritmo de
          juego de hoy.
        </p>

        <div className="lk-dashboard-hero__tags" aria-label="Resumen rápido">
          {heroTags.map((tag) => (
            <div key={tag.helper} className="lk-dashboard-hero__tag">
              <strong>{tag.label}</strong>
              <span>{tag.helper}</span>
            </div>
          ))}
        </div>
      </div>

      <aside className="lk-dashboard-hero__aside">
        <div className="lk-dashboard-hero__meter">
          <div className="lk-dashboard-hero__meter-ring" aria-hidden="true">
            <span>{readinessRate}%</span>
          </div>
          <div className="lk-dashboard-hero__meter-copy">
            <span className="lk-dashboard-hero__meter-label">Tablero listo</span>
            <strong>{activeGroups} sesiones activas</strong>
            <p>
              {totalGroups > 0
                ? "Tu dashboard ya está preparado para acompañar a los grupos en tiempo real."
                : "Crea tu primer grupo para empezar a usar este panel de acompañamiento."}
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
}
