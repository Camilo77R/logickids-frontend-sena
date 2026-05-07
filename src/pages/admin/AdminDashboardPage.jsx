import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Clock3, ShieldAlert, UsersRound } from "lucide-react";
import StatCard from "../../components/common/StatCard";
import AppShell from "../../components/layout/AppShell";
import { useAuth } from "../../hooks/useAuth";
import adminService from "../../services/adminService";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const usersData = await adminService.listUsers();
        setUsers(usersData);
        setError("");
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
    const activeTutors = tutors.filter((user) => user.estado === "activo");
    const inactiveTutors = tutors.filter((user) => user.estado === "inactivo");
    const suspendedTutors = tutors.filter((user) => user.estado === "suspendido");

    return {
      totalTutors: tutors.length,
      activeTutors: activeTutors.length,
      inactiveTutors: inactiveTutors.length,
      suspendedTutors: suspendedTutors.length,
    };
  }, [users]);

  return (
    <AppShell
      title="Dashboard Institucional"
      description="Gestiona los tutores de tu institución sin salir del scope permitido por el backend."
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
                Panel del administrador institucional
              </h2>
              <p className="lk-muted" style={{ margin: 0, fontSize: "1.05rem" }}>
                Desde aquí activas, pausas y revisas tutores de tu colegio. La gestión global
                de instituciones y minijuegos sigue siendo exclusiva del superadmin.
              </p>
            </div>
            <div style={{ color: "rgba(23, 150, 237, 0.8)" }}>
              <Activity size={48} strokeWidth={1.5} />
            </div>
          </div>
        </section>

        <div className="lk-span-3">
          <StatCard
            label="Tutores registrados"
            value={isLoading ? "..." : summary.totalTutors}
            helpText="Cuentas de tutor visibles en tu institución."
            tone="blue"
          />
        </div>
        <div className="lk-span-3">
          <StatCard
            label="Tutores activos"
            value={isLoading ? "..." : summary.activeTutors}
            helpText="Ya pueden iniciar sesión."
            tone="orange"
          />
        </div>
        <div className="lk-span-3">
          <StatCard
            label="Pendientes de activar"
            value={isLoading ? "..." : summary.inactiveTutors}
            helpText="Solicitudes nuevas o inactivas."
            tone="purple"
          />
        </div>
        <div className="lk-span-3">
          <StatCard
            label="Suspendidos"
            value={isLoading ? "..." : summary.suspendedTutors}
            helpText="Cuentas bloqueadas temporalmente."
            tone="green"
          />
        </div>

        <section className="lk-panel-card lk-span-8">
          <h2>Accesos directos</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem", marginTop: "1rem" }}>
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
                <span className="lk-muted">Activa tutores, revisa institución y controla estados.</span>
              </div>
            </button>
          </div>
        </section>

        <section className="lk-card lk-span-4" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <ShieldAlert size={20} color="var(--lk-color-text-muted)" strokeWidth={1.5} />
              <h2 style={{ margin: 0 }}>Reglas de acceso</h2>
            </div>
            <p className="lk-muted" style={{ marginBottom: "1.5rem" }}>
              Este panel respeta el multitenancy del backend: solo ves tutores de tu institución.
            </p>
          </div>
          
          <ul className="lk-list" style={{ marginTop: 0 }}>
            <li className="lk-list-item" style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "transparent", border: "none", padding: "0.5rem 0" }}>
              <span className="lk-status-dot lk-status-dot--pulse"></span>
              <strong>{user?.institucion || "Institución sin nombre"}</strong>
            </li>
            
            <li className="lk-list-item" style={{ background: "transparent", border: "none", padding: "1rem 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                <strong>Activación de tutores</strong>
                <span>{summary.activeTutors} activos</span>
              </div>
              <div className="lk-progress-bar">
                <div
                  className="lk-progress-bar-fill lk-progress-bar-fill--success"
                  style={{
                    width: `${summary.totalTutors > 0 ? (summary.activeTutors / summary.totalTutors) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </li>
            
            <li className="lk-list-item" style={{ background: "transparent", border: "none", padding: "0.5rem 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.9rem" }}>
                <strong>Solicitudes pendientes</strong>
                <span>{summary.inactiveTutors} por revisar</span>
              </div>
              <div className="lk-progress-bar">
                <div
                  className="lk-progress-bar-fill"
                  style={{
                    width: `${summary.totalTutors > 0 ? (summary.inactiveTutors / summary.totalTutors) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              {summary.inactiveTutors > 0 && (
                 <small style={{ display: "block", color: "var(--lk-color-warning)", marginTop: "0.5rem", fontWeight: "bold" }}>
                   Revisa estas cuentas antes de que queden bloqueadas en espera.
                 </small>
              )}
            </li>

            <li className="lk-list-item" style={{ background: "transparent", border: "none", padding: "0.5rem 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Clock3 size={18} color="var(--lk-color-text-muted)" strokeWidth={1.5} />
                <span className="lk-muted">
                  El alta de instituciones y la gestión global de minijuegos pertenecen al superadmin.
                </span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
