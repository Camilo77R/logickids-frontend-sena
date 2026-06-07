import { useEffect, useMemo, useState } from "react";
import { Gamepad2, Layers3, PlayCircle, PauseCircle, RefreshCcw } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import AppShell from "../../components/layout/AppShell";
import DashboardMetricCard from "../../components/dashboard/DashboardMetricCard";
import DashboardPanel from "../../components/dashboard/DashboardPanel";
import adminService from "../../services/adminService";

const toSkillLabel = (value) => {
  const labels = {
    secuencias: "Secuencias",
    clasificacion: "Clasificacion",
    espacial: "Espacial",
    logica_booleana: "Logica booleana",
    memoria: "Memoria",
  };

  return labels[value] ?? value;
};

export default function MinijuegosPage() {
  const [minigames, setMinigames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const loadMinigames = async () => {
    setIsLoading(true);

    try {
      const data = await adminService.listMinigames();
      setMinigames(data);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible cargar los minijuegos.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMinigames();
  }, []);

  const summary = useMemo(() => {
    const active = minigames.filter((minigame) => minigame.activo);
    const paused = minigames.filter((minigame) => !minigame.activo);
    const skills = new Set(minigames.map((minigame) => minigame.habilidad).filter(Boolean)).size;

    return {
      total: minigames.length,
      active: active.length,
      paused: paused.length,
      skills,
    };
  }, [minigames]);

  const handleToggle = async (minigame) => {
    try {
      await adminService.toggleMinigame(minigame.id, !minigame.activo);
      setFeedback({
        type: "success",
        message: minigame.activo
          ? `"${minigame.titulo}" fue pausado correctamente.`
          : `"${minigame.titulo}" fue activado correctamente.`,
      });
      await loadMinigames();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible actualizar el minijuego.",
      });
    }
  };

  return (
    <AppShell
      title="Minijuegos"
      description="Administra la disponibilidad del catalogo sin mezclarlo con las metricas institucionales."
      actions={
        <button type="button" className="lk-btn lk-btn--secondary" onClick={loadMinigames}>
          <RefreshCcw size={16} /> Recargar
        </button>
      }
    >
      <div className="lk-role-dashboard">
        <section className="lk-role-dashboard__hero">
          <span className="lk-role-dashboard__hero-badge">Catalogo global</span>
          <h2 className="lk-role-dashboard__hero-title">Disponibilidad de minijuegos</h2>
          <p className="lk-role-dashboard__hero-subtitle">
            Este modulo controla que experiencias estan activas para la plataforma. El foco aqui
            es disponibilidad pedagogica, no gobierno institucional.
          </p>

          <div className="lk-role-dashboard__hero-tags">
            <article className="lk-role-dashboard__hero-tag">
              <strong>{isLoading ? "..." : summary.total}</strong>
              <span>Catalogo total</span>
            </article>
            <article className="lk-role-dashboard__hero-tag">
              <strong>{isLoading ? "..." : summary.active}</strong>
              <span>Activos</span>
            </article>
            <article className="lk-role-dashboard__hero-tag">
              <strong>{isLoading ? "..." : summary.paused}</strong>
              <span>Pausados</span>
            </article>
          </div>
        </section>

        {feedback ? (
          <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div>
        ) : null}

        <section className="lk-role-dashboard__metrics">
          <DashboardMetricCard
            icon={Gamepad2}
            label="Minijuegos"
            value={isLoading ? "..." : summary.total}
            description="Experiencias registradas en el catalogo global."
            tone="purple"
          />
          <DashboardMetricCard
            icon={PlayCircle}
            label="Activos"
            value={isLoading ? "..." : summary.active}
            description="Disponibles actualmente para el flujo del estudiante."
            tone="gold"
          />
          <DashboardMetricCard
            icon={PauseCircle}
            label="Pausados"
            value={isLoading ? "..." : summary.paused}
            description="Fuera de circulacion hasta nueva activacion."
            tone="rose"
          />
          <DashboardMetricCard
            icon={Layers3}
            label="Habilidades"
            value={isLoading ? "..." : summary.skills}
            description="Cobertura de habilidades visibles en el catalogo actual."
            tone="orange"
          />
        </section>

        <section className="lk-role-dashboard__grid">
          <DashboardPanel
            eyebrow="Regla del modulo"
            title="Como leer este espacio"
            subtitle="Aqui solo se decide si un minijuego esta disponible o pausado."
          >
            <div className="lk-role-list">
              <article className="lk-role-list__item lk-role-list__item--gold">
                <div className="lk-role-list__top">
                  <span className="lk-role-list__title">Activo</span>
                  <span className="lk-role-list__meta lk-role-list__meta--gold">Visible</span>
                </div>
                <p className="lk-role-list__description">
                  El minijuego puede entrar en los flujos de uso definidos por la plataforma.
                </p>
              </article>

              <article className="lk-role-list__item lk-role-list__item--rose">
                <div className="lk-role-list__top">
                  <span className="lk-role-list__title">Pausado</span>
                  <span className="lk-role-list__meta lk-role-list__meta--rose">Oculto</span>
                </div>
                <p className="lk-role-list__description">
                  Se retira temporalmente del circuito sin mezclar esta decision con el panel institucional.
                </p>
              </article>
            </div>
          </DashboardPanel>

          <DashboardPanel
            eyebrow="Cobertura"
            title="Lectura rapida del catalogo"
            subtitle="Contexto suficiente para operar sin convertir esta pantalla en otro dashboard global."
          >
            <div className="lk-role-info-grid">
              <article className="lk-role-info-card">
                <span className="lk-role-info-card__label">Catalogo total</span>
                <strong className="lk-role-info-card__value">{isLoading ? "..." : summary.total}</strong>
                <p className="lk-role-info-card__hint">Base actual de experiencias registradas.</p>
              </article>
              <article className="lk-role-info-card">
                <span className="lk-role-info-card__label">Habilidades cubiertas</span>
                <strong className="lk-role-info-card__value">{isLoading ? "..." : summary.skills}</strong>
                <p className="lk-role-info-card__hint">Categorias visibles con el contrato disponible.</p>
              </article>
            </div>
          </DashboardPanel>
        </section>

        <DashboardPanel
          title="Minijuegos"
          compact
        >
          {!isLoading && !minigames.length ? (
            <EmptyState
              title="No hay minijuegos disponibles"
              description="Cuando el catalogo tenga registros, podras controlarlos desde aqui."
            />
          ) : null}

          {!!minigames.length ? (
            <div className="lk-role-entity-grid">
              {minigames.map((minigame) => (
                <article key={minigame.id} className="lk-role-entity-card">
                  <div className="lk-role-entity-card__header">
                    <div>
                      <h3 className="lk-role-entity-card__title">{minigame.titulo}</h3>
                      <p className="lk-role-entity-card__subtitle">
                        {minigame.descripcion || "Sin descripcion disponible."}
                      </p>
                    </div>
                    <StatusBadge
                      label={minigame.activo ? "Activo" : "Pausado"}
                      variant={minigame.activo ? "activo" : "cerrada"}
                    />
                  </div>

                  <dl className="lk-role-entity-card__meta">
                    <div>
                      <dt>Habilidad</dt>
                      <dd>{toSkillLabel(minigame.habilidad)}</dd>
                    </div>
                    <div>
                      <dt>Dificultad maxima</dt>
                      <dd>{minigame.dificultad_maxima}</dd>
                    </div>
                    <div>
                      <dt>Slug</dt>
                      <dd>{minigame.slug}</dd>
                    </div>
                  </dl>

                  <div className="lk-role-entity-card__actions">
                    <button
                      type="button"
                      className={`lk-btn ${minigame.activo ? "lk-btn--secondary" : "lk-btn--primary"}`}
                      onClick={() => handleToggle(minigame)}
                    >
                      {minigame.activo ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
                      {minigame.activo ? "Pausar" : "Activar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </DashboardPanel>
      </div>
    </AppShell>
  );
}
