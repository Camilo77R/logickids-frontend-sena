import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import StatCard from "../../components/common/StatCard";
import AppShell from "../../components/layout/AppShell";
import adminService from "../../services/adminService";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [minigames, setMinigames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const [usersData, institutionsData, minigamesData] = await Promise.all([
          adminService.listUsers(),
          adminService.listInstitutions(),
          adminService.listMinigames(),
        ]);
        setUsers(usersData);
        setInstitutions(institutionsData);
        setMinigames(minigamesData);
      } catch (loadError) {
        setError(loadError.message || "No fue posible cargar el dashboard del administrador.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const summary = useMemo(() => {
    const tutors = users.filter((user) => user.rol === "tutor");
    const activeUsers = users.filter((user) => user.estado === "activo");

    return {
      totalUsers: users.length,
      totalTutors: tutors.length,
      activeUsers: activeUsers.length,
      institutions: institutions.length,
      activeMinigames: minigames.filter((minigame) => minigame.activo).length,
    };
  }, [institutions.length, minigames, users]);

  return (
    <AppShell
      title="Dashboard General"
      description="Monitoreo y administración de la plataforma"
    >
      {error ? <div className="lk-alert lk-alert--error">{error}</div> : null}

      <div className="lk-admin-grid">
        <section className="lk-span-12" style={{ marginBottom: "0.5rem" }}>
          <div
            style={{
              padding: "2rem",
              borderRadius: "1.5rem",
              background: "linear-gradient(135deg, rgba(23, 150, 237, 0.1), rgba(154, 79, 211, 0.12))",
              border: "1px solid rgba(255, 255, 255, 0.7)",
              backdropFilter: "blur(12px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h2 style={{ fontSize: "1.8rem", margin: "0 0 0.5rem", color: "#1d2737" }}>
                Sistema operativo y en línea
              </h2>
              <p className="lk-muted" style={{ margin: 0, fontSize: "1.05rem" }}>
                Revisa el flujo de usuarios, administra instituciones y controla el catálogo de minijuegos.
              </p>
            </div>
            <div style={{ fontSize: "3rem" }}>🚀</div>
          </div>
        </section>

        <div className="lk-span-3">
          <StatCard
            label="Usuarios registrados"
            value={isLoading ? "..." : summary.totalUsers}
            helpText="Cuentas web creadas."
            tone="blue"
          />
        </div>
        <div className="lk-span-3">
          <StatCard
            label="Tutores activos"
            value={isLoading ? "..." : summary.totalTutors}
            helpText="Educadores en el sistema."
            tone="orange"
          />
        </div>
        <div className="lk-span-3">
          <StatCard
            label="Instituciones"
            value={isLoading ? "..." : summary.institutions}
            helpText="Colegios afiliados."
            tone="purple"
          />
        </div>
        <div className="lk-span-3">
          <StatCard
            label="Minijuegos"
            value={isLoading ? "..." : summary.activeMinigames}
            helpText="Catálogo disponible."
            tone="green"
          />
        </div>

        <section className="lk-panel-card lk-span-8">
          <h2>Accesos directos</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
            <button
              onClick={() => navigate("/admin/usuarios")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1.5rem",
                background: "#f8faff",
                border: "1px solid var(--lk-color-border)",
                borderRadius: "1rem",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--lk-color-primary)")}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--lk-color-border)")}
            >
              <div style={{ fontSize: "2rem", padding: "1rem", background: "white", borderRadius: "50%", boxShadow: "var(--lk-shadow-soft)" }}>👥</div>
              <div>
                <strong style={{ display: "block", fontSize: "1.1rem", marginBottom: "0.2rem" }}>Gestión de Usuarios</strong>
                <span className="lk-muted">Controla cuentas, roles y estados.</span>
              </div>
            </button>

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
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--lk-color-secondary)")}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--lk-color-border)")}
            >
              <div style={{ fontSize: "2rem", padding: "1rem", background: "white", borderRadius: "50%", boxShadow: "var(--lk-shadow-soft)" }}>🏫</div>
              <div>
                <strong style={{ display: "block", fontSize: "1.1rem", marginBottom: "0.2rem" }}>Directorio Institucional</strong>
                <span className="lk-muted">Añade o elimina colegios.</span>
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
                gridColumn: "1 / -1",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--lk-color-success)")}
              onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--lk-color-border)")}
            >
              <div style={{ fontSize: "2rem", padding: "1rem", background: "white", borderRadius: "50%", boxShadow: "var(--lk-shadow-soft)" }}>🎮</div>
              <div>
                <strong style={{ display: "block", fontSize: "1.1rem", marginBottom: "0.2rem" }}>Catálogo de Minijuegos</strong>
                <span className="lk-muted">Activa o pausa los juegos para los estudiantes.</span>
              </div>
            </button>
          </div>
        </section>

        <section className="lk-card lk-span-4">
          <h2>Estado del sistema</h2>
          <ul className="lk-list">
            <li className="lk-list-item" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: "10px", height: "10px", background: "var(--lk-color-success)", borderRadius: "50%" }}></span>
              Conexión DB estable
            </li>
            <li className="lk-list-item" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: "10px", height: "10px", background: "var(--lk-color-success)", borderRadius: "50%" }}></span>
              {summary.institutions} Instituciones en línea
            </li>
            <li className="lk-list-item" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ width: "10px", height: "10px", background: "var(--lk-color-warning)", borderRadius: "50%" }}></span>
              {minigames.length - summary.activeMinigames} Minijuegos pausados
            </li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
