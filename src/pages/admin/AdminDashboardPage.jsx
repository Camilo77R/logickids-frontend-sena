import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Building2, Database, Gamepad2, Users, UsersRound } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import AppShell from "../../components/layout/AppShell";
import adminService from "../../services/adminService";
import Notifications from "../../components/Notifications";

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
            <div style={{ color: "rgba(23, 150, 237, 0.8)" }}>
              <Activity size={48} strokeWidth={1.5} />
            </div>
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
              <div style={{ padding: "1rem", background: "white", borderRadius: "50%", boxShadow: "var(--lk-shadow-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--lk-color-primary)" }}>
                <UsersRound size={32} strokeWidth={1.5} />
              </div>
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
              <div style={{ padding: "1rem", background: "white", borderRadius: "50%", boxShadow: "var(--lk-shadow-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--lk-color-secondary)" }}>
                <Building2 size={32} strokeWidth={1.5} />
              </div>
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
              <div style={{ padding: "1rem", background: "white", borderRadius: "50%", boxShadow: "var(--lk-shadow-soft)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--lk-color-success)" }}>
                <Gamepad2 size={32} strokeWidth={1.5} />
              </div>
              <div>
                <strong style={{ display: "block", fontSize: "1.1rem", marginBottom: "0.2rem" }}>Catálogo de Minijuegos</strong>
                <span className="lk-muted">Activa o pausa los juegos para los estudiantes.</span>
              </div>
            </button>
          </div>
        </section>

        <section className="lk-card lk-span-4" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <Database size={20} color="var(--lk-color-text-muted)" strokeWidth={1.5} />
              <h2 style={{ margin: 0 }}>Salud del Servidor</h2>
            </div>
            <p className="lk-muted" style={{ marginBottom: "1.5rem" }}>Métricas operativas en tiempo real.</p>
          </div>
          
          <ul className="lk-list" style={{ marginTop: 0 }}>
            <li className="lk-list-item" style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "transparent", border: "none", padding: "0.5rem 0" }}>
              <span className="lk-status-dot lk-status-dot--pulse"></span>
              <strong>PostgreSQL 13 Conectado</strong>
            </li>
            
            <li className="lk-list-item" style={{ background: "transparent", border: "none", padding: "1rem 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                <strong>Instituciones en línea</strong>
                <span>{summary.institutions} activas</span>
              </div>
              <div className="lk-progress-bar">
                <div className="lk-progress-bar-fill lk-progress-bar-fill--success" style={{ width: summary.institutions > 0 ? "100%" : "0%" }}></div>
              </div>
            </li>
            
            <li className="lk-list-item" style={{ background: "transparent", border: "none", padding: "0.5rem 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                <strong>Disponibilidad Minijuegos</strong>
                <span>{summary.activeMinigames} de {minigames.length}</span>
              </div>
              <div className="lk-progress-bar">
                <div className="lk-progress-bar-fill lk-progress-bar-fill--success" style={{ width: `${minigames.length > 0 ? (summary.activeMinigames / minigames.length) * 100 : 0}%` }}></div>
              </div>
              {minigames.length > summary.activeMinigames && (
                 <small style={{ display: "block", color: "var(--lk-color-warning)", marginTop: "0.5rem", fontWeight: "bold" }}>
                   ⚠️ {minigames.length - summary.activeMinigames} minijuegos pausados
                 </small>
              )}
            </li>
          </ul>
        </section>

        <section className="lk-panel-card lk-span-12" style={{ marginTop: "1rem" }}>
          <Notifications />
        </section>
      </div>
    </AppShell>
  );
}