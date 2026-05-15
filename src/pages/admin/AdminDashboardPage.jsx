import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock3,
  Mail,
  ShieldAlert,
  UserCheck2,
  UserCog2,
  UserPlus2,
  UsersRound,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import DashboardMetricCard from "../../components/dashboard/DashboardMetricCard";
import DashboardPanel from "../../components/dashboard/DashboardPanel";
import QuickActionCard from "../../components/dashboard/QuickActionCard";
import adminService from "../../services/adminService";
import { useAuth } from "../../hooks/useAuth";
import { buildAdminDashboardView } from "./adminDashboard.selectors";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);

        const [usersData, requestsData] = await Promise.all([
          adminService.listUsers(),
          adminService.listReactivationRequests(),
        ]);

        setUsers(usersData);
        setRequests(requestsData);
        setPendingRequests(
          requestsData.filter((request) => request.estado_solicitud === "pendiente").length
        );
        setError("");
      } catch (loadError) {
        setError(loadError.message || "No fue posible cargar el panel institucional.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const firstName = user?.nombre?.split(" ")[0] || "Profe";

  const view = useMemo(
    () =>
      buildAdminDashboardView({
        users,
        pendingRequests,
        institutionName: user?.institucion,
      }),
    [pendingRequests, user?.institucion, users]
  );

  const requestPreview = requests.slice(0, 4);

  return (
    <AppShell
      title={`Hola, ${firstName}`}
      description="Supervisa tutores, activaciones y solicitudes dentro de tu institución."
      notificationCount={pendingRequests}
    >
      <div className="lk-role-dashboard">
        {error ? <div className="lk-alert lk-alert--error">{error}</div> : null}

        <section className="lk-role-dashboard__hero">
          <span className="lk-role-dashboard__hero-badge">Panel institucional</span>
          <h2 className="lk-role-dashboard__hero-title">Tu institución bajo control</h2>
          <p className="lk-role-dashboard__hero-subtitle">
            Aquí concentras el pulso de tutores, activaciones y reactivaciones sin salir del
            alcance que el backend permite para tu institución.
          </p>

          <div className="lk-role-dashboard__hero-tags">
            {view.heroTags.map((tag) => (
              <article key={tag.label} className="lk-role-dashboard__hero-tag">
                <strong>{isLoading ? "..." : tag.value}</strong>
                <span>{tag.label}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="lk-role-dashboard__metrics">
          <DashboardMetricCard
            icon={UsersRound}
            label={view.metrics[0].label}
            value={isLoading ? "..." : view.metrics[0].value}
            description={view.metrics[0].description}
            tone={view.metrics[0].tone}
          />
          <DashboardMetricCard
            icon={UserCheck2}
            label={view.metrics[1].label}
            value={isLoading ? "..." : view.metrics[1].value}
            description={view.metrics[1].description}
            tone={view.metrics[1].tone}
          />
          <DashboardMetricCard
            icon={UserPlus2}
            label={view.metrics[2].label}
            value={isLoading ? "..." : view.metrics[2].value}
            description={view.metrics[2].description}
            tone={view.metrics[2].tone}
          />
          <DashboardMetricCard
            icon={ShieldAlert}
            label={view.metrics[3].label}
            value={isLoading ? "..." : view.metrics[3].value}
            description={view.metrics[3].description}
            tone={view.metrics[3].tone}
          />
        </section>

        <section className="lk-role-dashboard__grid">
          <DashboardPanel
            eyebrow="Acciones rápidas"
            title="Siguientes movimientos"
            subtitle="Atajos para administrar las cuentas que hoy requieren atención."
          >
            <div className="lk-role-quick-grid">
              <QuickActionCard
                to="/admin/usuarios"
                icon={UsersRound}
                title="Gestionar tutores"
                description="Activa cuentas, revisa estados y filtra el personal de tu institución."
                tone="purple"
              />
              <QuickActionCard
                to="/admin/solicitudes"
                icon={Mail}
                title="Revisar solicitudes"
                description="Atiende reactivaciones pendientes sin salir del flujo institucional."
                tone="orange"
              />
            </div>
          </DashboardPanel>

          <DashboardPanel
            eyebrow="Pulso del tablero"
            title="Salud de accesos"
            subtitle="Indicadores clave para saber si tu institución está lista para operar."
            aside={<Activity size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            <div className="lk-role-inline-metric">
              {view.progress.map((item) => (
                <article key={item.key} className="lk-role-inline-metric__row">
                  <div className="lk-role-inline-metric__label">
                    <span>{item.label}</span>
                    <strong>{isLoading ? "..." : item.value}</strong>
                  </div>
                  <div className="lk-role-inline-metric__track">
                    <div
                      className={`lk-role-inline-metric__fill lk-role-inline-metric__fill--${item.tone}`}
                      style={{ width: `${isLoading ? 0 : item.percent}%` }}
                    />
                  </div>
                </article>
              ))}
            </div>
          </DashboardPanel>
        </section>

        <section className="lk-role-dashboard__grid">
          <DashboardPanel
            eyebrow="Visibilidad rápida"
            title="Tutores que requieren contexto"
            subtitle="Muestra breve del personal visible para el admin con el contrato actual."
            aside={<UserCog2 size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            <div className="lk-role-list">
              {view.tutorPreview.map((tutor) => (
                <article
                  key={tutor.id}
                  className={`lk-role-list__item lk-role-list__item--${resolveTutorTone(
                    tutor.estado
                  )}`}
                >
                  <div className="lk-role-list__top">
                    <span className="lk-role-list__title">{tutor.nombre}</span>
                    <span className={`lk-role-list__meta lk-role-list__meta--${resolveTutorTone(tutor.estado)}`}>
                      {tutor.estado}
                    </span>
                  </div>
                  <p className="lk-role-list__description">{tutor.email}</p>
                </article>
              ))}
            </div>
          </DashboardPanel>

          <DashboardPanel
            eyebrow="Bandeja"
            title="Solicitudes recientes"
            subtitle="Reactivaciones visibles para que no se acumulen sin respuesta."
            aside={<Clock3 size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            <div className="lk-role-list">
              {requestPreview.length ? (
                requestPreview.map((request) => (
                  <article
                    key={request.id}
                    className={`lk-role-list__item lk-role-list__item--${resolveRequestTone(
                      request.estado_solicitud
                    )}`}
                  >
                    <div className="lk-role-list__top">
                      <span className="lk-role-list__title">{request.tutor_nombre}</span>
                      <span
                        className={`lk-role-list__meta lk-role-list__meta--${resolveRequestTone(
                          request.estado_solicitud
                        )}`}
                      >
                        {request.estado_solicitud}
                      </span>
                    </div>
                    <p className="lk-role-list__description">
                      {request.correo_contacto || request.tutor_email}
                    </p>
                  </article>
                ))
              ) : (
                <p className="lk-role-note">
                  No hay solicitudes recientes en este momento.
                </p>
              )}
            </div>
          </DashboardPanel>
        </section>
      </div>
    </AppShell>
  );
}

function resolveTutorTone(estado) {
  if (estado === "activo") return "gold";
  if (estado === "inactivo") return "orange";
  return "rose";
}

function resolveRequestTone(estado) {
  if (estado === "aprobado") return "gold";
  if (estado === "rechazado") return "rose";
  return "orange";
}
