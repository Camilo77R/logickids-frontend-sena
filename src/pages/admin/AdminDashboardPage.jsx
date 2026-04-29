import { useEffect, useMemo, useState } from "react";
import StatCard from "../../components/common/StatCard";
import AppShell from "../../components/layout/AppShell";
import adminService from "../../services/adminService";

export default function AdminDashboardPage() {
  const [users, setUsers] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const [usersData, institutionsData] = await Promise.all([
          adminService.listUsers(),
          adminService.listInstitutions(),
        ]);
        setUsers(usersData);
        setInstitutions(institutionsData);
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
    };
  }, [institutions.length, users]);

  return (
    <AppShell
      title="Resumen"
      description="Estado general de usuarios, instituciones y minijuegos."
    >
      {error ? <div className="lk-alert lk-alert--error">{error}</div> : null}

      <div className="lk-dashboard-grid">
        <div className="lk-span-3">
          <StatCard
            label="Usuarios web"
            value={isLoading ? "..." : summary.totalUsers}
            helpText="Cuentas disponibles en la plataforma."
            tone="purple"
          />
        </div>
        <div className="lk-span-3">
          <StatCard
            label="Tutores"
            value={isLoading ? "..." : summary.totalTutors}
            helpText="Docentes con acceso al portal."
            tone="orange"
          />
        </div>
        <div className="lk-span-3">
          <StatCard
            label="Usuarios activos"
            value={isLoading ? "..." : summary.activeUsers}
            helpText="Accesos habilitados actualmente."
            tone="blue"
          />
        </div>
        <div className="lk-span-3">
          <StatCard
            label="Instituciones"
            value={isLoading ? "..." : summary.institutions}
            helpText="Colegios registrados."
            tone="green"
          />
        </div>

        <section className="lk-card lk-span-7">
          <h2>Accesos directos</h2>
          <div className="lk-inline-list">
            <div className="lk-list-item">
              <strong>Usuarios</strong>
              <p className="lk-muted">Consulta cuentas, roles y estado.</p>
            </div>
            <div className="lk-list-item">
              <strong>Instituciones</strong>
              <p className="lk-muted">Administra el directorio institucional.</p>
            </div>
          </div>
        </section>

        <section className="lk-card lk-span-5">
          <h2>Estado actual</h2>
          <ul className="lk-list">
            <li className="lk-list-item">
              {summary.totalUsers > 0
                ? `${summary.totalUsers} cuentas registradas.`
                : "Aún no hay cuentas registradas."}
            </li>
            <li className="lk-list-item">
              {summary.institutions > 0
                ? `${summary.institutions} instituciones registradas.`
                : "Aún no hay instituciones registradas."}
            </li>
          </ul>
        </section>

        <section className="lk-table-card lk-span-12">
          <h2>Instituciones</h2>

          <div className="lk-inline-list">
            {institutions.slice(0, 4).map((institution) => (
              <div key={institution.id} className="lk-list-item">
                <strong>{institution.nombre}</strong>
                <p className="lk-muted">
                  {institution.ciudad || "Ciudad no registrada"}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
