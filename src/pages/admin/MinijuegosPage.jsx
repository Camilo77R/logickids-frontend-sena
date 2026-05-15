import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import AppShell from "../../components/layout/AppShell";
import adminService from "../../services/adminService";

const toSkillLabel = (value) => {
  const labels = {
    secuencias: "Secuencias",
    clasificacion: "Clasificación",
    espacial: "Espacial",
    logica_booleana: "Lógica booleana",
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

  const summary = useMemo(
    () => ({
      total: minigames.length,
      activos: minigames.filter((minigame) => minigame.activo).length,
      pausados: minigames.filter((minigame) => !minigame.activo).length,
    }),
    [minigames]
  );

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
      description="Gestiona la disponibilidad del catálogo."
      actions={
        <button type="button" className="lk-btn lk-btn--secondary" onClick={loadMinigames}>
          Recargar
        </button>
      }
    >
      <div className="lk-dashboard-grid">
        <div className="lk-span-4">
          <div className="lk-stat-card lk-stat-card--blue">
            <span>Catálogo total</span>
            <strong>{isLoading ? "..." : summary.total}</strong>
            <small>Minijuegos registrados en la plataforma.</small>
          </div>
        </div>
        <div className="lk-span-4">
          <div className="lk-stat-card lk-stat-card--green">
            <span>Activos</span>
            <strong>{isLoading ? "..." : summary.activos}</strong>
            <small>Disponibles para la experiencia del niño.</small>
          </div>
        </div>
        <div className="lk-span-4">
          <div className="lk-stat-card lk-stat-card--orange">
            <span>Pausados</span>
            <strong>{isLoading ? "..." : summary.pausados}</strong>
            <small>Actualmente fuera de circulación.</small>
          </div>
        </div>

        <section className="lk-table-card lk-span-12">
          <h2>Catálogo de minijuegos</h2>

          {feedback ? (
            <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div>
          ) : null}

          {!isLoading && !minigames.length ? (
            <EmptyState
              title="No hay minijuegos disponibles"
              description="Cuando el catálogo tenga registros, podrás controlarlos desde aquí."
            />
          ) : null}

          {!!minigames.length ? (
            <div className="lk-page-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              {minigames.map((minigame) => (
                <article key={minigame.id} className="lk-switch-card">
                  <div className="lk-switch-card__head">
                    <div className="lk-switch-card__title">
                      <h3>{minigame.titulo}</h3>
                      <p className="lk-muted">{minigame.descripcion || "Sin descripción disponible."}</p>
                    </div>
                    <StatusBadge
                      label={minigame.activo ? "Activo" : "Pausado"}
                      variant={minigame.activo ? "activo" : "cerrada"}
                    />
                  </div>

                  <div className="lk-chip-row">
                    <span className="lk-chip">Habilidad: {toSkillLabel(minigame.habilidad)}</span>
                    <span className="lk-chip">Dificultad: {minigame.dificultad_maxima}</span>
                    <span className="lk-chip">{minigame.slug}</span>
                  </div>

                  <div className="lk-switch-card__actions">
                    <button
                      type="button"
                      className={`lk-mini-switch ${
                        minigame.activo ? "lk-mini-switch--off" : "lk-mini-switch--on"
                      }`}
                      onClick={() => handleToggle(minigame)}
                    >
                      {minigame.activo ? "Pausar" : "Activar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
