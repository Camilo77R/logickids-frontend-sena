import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Building2, Gamepad2, ShieldCheck, UsersRound } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import AppShell from "../../components/layout/AppShell";
import adminService from "../../services/adminService";

export default function SuperadminDashboardPage() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [minigames, setMinigames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setError("");

        const [institutionsData, minigamesData] = await Promise.all([
          adminService.listInstitutions(),
          adminService.listMinigames(),
        ]);

        setInstitutions(institutionsData);
        setMinigames(minigamesData);
      } catch (loadError) {
        setError(loadError.message || "No fue posible cargar el dashboard global.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const activeInstitutions = institutions.length;
    const activeTutors = institutions.reduce(
      (sum, institution) => sum + Number(institution.tutores_activos ?? 0),
      0
    );
    const activeMinigames = minigames.filter((minigame) => minigame.activo).length;

    return {
      activeInstitutions,
      activeTutors,
      totalMinigames: minigames.length,
      activeMinigames,
      pausedMinigames: minigames.length - activeMinigames,
    };
  }, [institutions, minigames]);

  const highlightedInstitutions = institutions.slice(0, 4);
  const highlightedMinigames = minigames.slice(0, 4);

  return (
    <AppShell
      eyebrow="Superadmin"
      title="Centro de control global"
      description="Visión general de la plataforma, preparada para seguir construyendo los módulos globales del superadmin."
      actions={
        <button
          type="button"
          className="lk-btn lk-btn--secondary"
          onClick={() => navigate("/admin/instituciones")}
        >
          Gestionar instituciones
        </button>
      }
    >
      {error ? <div className="lk-alert lk-alert--error">{error}</div> : null}

      <div className="lk-admin-grid">
        <section className="lk-span-12" style={{ marginBottom: "0.5rem" }}>
          <div
            style={{
              padding: "2rem",
              borderRadius: "1.5rem",
              background:
                "linear-gradient(135deg, rgba(13, 110, 253, 0.10), rgba(32, 201, 151, 0.12))",
              border: "1px solid rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
            }}
          >
            <div>
              <h2 style={{ fontSize: "1.8rem", margin: "0 0 0.5rem", color: "#1d2737" }}>
                Gobierno central de LogicKids
              </h2>
              <p className="lk-muted" style={{ margin: 0, fontSize: "1.05rem" }}>
                Este panel ya separa el alcance global del superadmin y deja listos los accesos para instituciones y catálogo.
              </p>
            </div>
            <div style={{ color: "rgba(13, 110, 253, 0.85)" }}>
              <ShieldCheck size={52} strokeWidth={1.5} />
            </div>
          </div>
        </section>

        <div className="lk-span-3">
          <StatCard
            label="Instituciones activas"
            value={isLoading ? "..." : summary.activeInstitutions}
            helpText="Tenants registrados en la plataforma."
            tone="purple"
          />
        </div>
        <div className="lk-span-3">
          <StatCard
            label="Tutores activos"
            value={isLoading ? "..." : summary.activeTutors}
            helpText="Suma global reportada por las instituciones."
            tone="orange"
          />
        </div>
        <div className="lk-span-3">
          <StatCard
            label="Minijuegos activos"
            value={isLoading ? "..." : summary.activeMinigames}
            helpText="Contenido disponible en toda la plataforma."
            tone="green"
          />
        </div>
        <div className="lk-span-3">
          <StatCard
            label="Minijuegos pausados"
            value={isLoading ? "..." : summary.pausedMinigames}
            helpText="Elementos listos para revisión o relanzamiento."
            tone="blue"
          />
        </div>

        <section className="lk-panel-card lk-span-7">
          <h2>Accesos globales</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginTop: "1rem",
            }}
          >
            <button
              onClick={() => navigate("/admin/instituciones")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1.5rem",
                background: "#fcf8ff",
                border: "1px solid var(--lk-color-border)",
                borderRadius: "1rem",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  padding: "1rem",
                  background: "white",
                  borderRadius: "50%",
                  boxShadow: "var(--lk-shadow-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--lk-color-secondary)",
                }}
              >
                <Building2 size={30} strokeWidth={1.5} />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "1.05rem", marginBottom: "0.2rem" }}>
                  Instituciones
                </strong>
                <span className="lk-muted">
                  Alta, baja y administración de tenants.
                </span>
              </div>
            </button>

            <button
              onClick={() => navigate("/admin/minijuegos")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1.5rem",
                background: "#f4fcf8",
                border: "1px solid var(--lk-color-border)",
                borderRadius: "1rem",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  padding: "1rem",
                  background: "white",
                  borderRadius: "50%",
                  boxShadow: "var(--lk-shadow-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--lk-color-success)",
                }}
              >
                <Gamepad2 size={30} strokeWidth={1.5} />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "1.05rem", marginBottom: "0.2rem" }}>
                  Catálogo de minijuegos
                </strong>
                <span className="lk-muted">
                  Control central del contenido que se publica.
                </span>
              </div>
            </button>
          </div>
        </section>

        <section className="lk-card lk-span-5" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity size={20} color="var(--lk-color-text-muted)" strokeWidth={1.5} />
            <h2 style={{ margin: 0 }}>Estado general</h2>
          </div>

          <div className="lk-inline-list">
            <div className="lk-list-item">
              <strong>Instituciones</strong>
              <p className="lk-muted">
                {isLoading ? "Cargando..." : `${summary.activeInstitutions} registradas`}
              </p>
            </div>
            <div className="lk-list-item">
              <strong>Catálogo</strong>
              <p className="lk-muted">
                {isLoading ? "Cargando..." : `${summary.totalMinigames} minijuegos totales`}
              </p>
            </div>
            <div className="lk-list-item">
              <strong>Operación</strong>
              <p className="lk-muted">Listo para seguir con módulos globales adicionales.</p>
            </div>
          </div>
        </section>

        <section className="lk-table-card lk-span-6">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <UsersRound size={20} strokeWidth={1.5} />
            <h2 style={{ margin: 0 }}>Instituciones destacadas</h2>
          </div>

          {!highlightedInstitutions.length && !isLoading ? (
            <p className="lk-muted">Aún no hay instituciones para mostrar.</p>
          ) : (
            <div className="lk-inline-list">
              {highlightedInstitutions.map((institution) => (
                <div key={institution.id} className="lk-list-item">
                  <strong>{institution.nombre}</strong>
                  <p className="lk-muted">
                    {institution.ciudad || "Ciudad sin registrar"} · {institution.tutores_activos ?? 0} tutores activos
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="lk-table-card lk-span-6">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Gamepad2 size={20} strokeWidth={1.5} />
            <h2 style={{ margin: 0 }}>Catálogo destacado</h2>
          </div>

          {!highlightedMinigames.length && !isLoading ? (
            <p className="lk-muted">Aún no hay minijuegos para mostrar.</p>
          ) : (
            <div className="lk-inline-list">
              {highlightedMinigames.map((minigame) => (
                <div key={minigame.id} className="lk-list-item">
                  <strong>{minigame.titulo}</strong>
                  <p className="lk-muted">
                    {minigame.habilidad || "Sin habilidad"} · {minigame.activo ? "Activo" : "Pausado"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
