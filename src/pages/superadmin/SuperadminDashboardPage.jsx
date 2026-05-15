import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Building2,
  Globe2,
  MapPinned,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import DashboardMetricCard from "../../components/dashboard/DashboardMetricCard";
import DashboardPanel from "../../components/dashboard/DashboardPanel";
import QuickActionCard from "../../components/dashboard/QuickActionCard";
import adminService from "../../services/adminService";
import { useAuth } from "../../hooks/useAuth";
import { buildSuperadminDashboardView } from "./superadminDashboard.selectors";

export default function SuperadminDashboardPage() {
  const { user } = useAuth();
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);

        const institutionsData = await adminService.listInstitutions();
        setInstitutions(institutionsData);
        setError("");
      } catch (loadError) {
        setError(loadError.message || "No fue posible cargar el panel global.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const firstName = user?.nombre?.split(" ")[0] || "Profe";

  const view = useMemo(
    () =>
      buildSuperadminDashboardView({
        institutions,
      }),
    [institutions]
  );

  return (
    <AppShell
      title={`Hola, ${firstName}`}
      description="Supervisa instituciones, tutores activos y salud operativa de toda la plataforma."
    >
      <div className="lk-role-dashboard">
        {error ? <div className="lk-alert lk-alert--error">{error}</div> : null}

        <section className="lk-role-dashboard__hero">
          <span className="lk-role-dashboard__hero-badge">Centro global</span>
          <h2 className="lk-role-dashboard__hero-title">Salud completa de la plataforma</h2>
          <p className="lk-role-dashboard__hero-subtitle">
            Desde aquí controlas presencia territorial, instituciones activas y el pulso global
            de la red LogicKids sin salirte de lo que hoy entrega el backend.
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
            icon={Building2}
            label={view.metrics[0].label}
            value={isLoading ? "..." : view.metrics[0].value}
            description={view.metrics[0].description}
            tone={view.metrics[0].tone}
          />
          <DashboardMetricCard
            icon={ShieldCheck}
            label={view.metrics[1].label}
            value={isLoading ? "..." : view.metrics[1].value}
            description={view.metrics[1].description}
            tone={view.metrics[1].tone}
          />
          <DashboardMetricCard
            icon={UsersRound}
            label={view.metrics[2].label}
            value={isLoading ? "..." : view.metrics[2].value}
            description={view.metrics[2].description}
            tone={view.metrics[2].tone}
          />
          <DashboardMetricCard
            icon={MapPinned}
            label={view.metrics[3].label}
            value={isLoading ? "..." : view.metrics[3].value}
            description={view.metrics[3].description}
            tone={view.metrics[3].tone}
          />
        </section>

        <section className="lk-role-dashboard__grid">
          <DashboardPanel
            eyebrow="Acciones rápidas"
            title="Gobierno de plataforma"
            subtitle="Los puntos de entrada principales para operar a nivel global."
          >
            <div className="lk-role-quick-grid">
              <QuickActionCard
                to="/superadmin/instituciones"
                icon={Building2}
                title="Gestionar instituciones"
                description="Crea, ajusta, desactiva o reactiva colegios desde un solo lugar."
                tone="purple"
              />
              <QuickActionCard
                to="/superadmin/instituciones"
                icon={ShieldCheck}
                title="Congelar o reactivar acceso"
                description="Desactivar una institución congela el acceso y corta sesiones activas de estudiantes."
                tone="gold"
              />
            </div>
          </DashboardPanel>

          <DashboardPanel
            eyebrow="Monitoreo"
            title="Pulso operacional"
            subtitle="Indicadores para ver si la plataforma está balanceada y disponible."
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
            eyebrow="Vista rápida"
            title="Instituciones recientes"
            subtitle="Muestra corta para revisar presencia sin ir aún al CRUD completo."
            aside={<Globe2 size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            <div className="lk-role-list">
              {view.institutionsPreview.length ? (
                view.institutionsPreview.map((institution) => {
                  const tone = institution.activo ? "gold" : "rose";

                  return (
                    <article
                      key={institution.id ?? institution.id_institucion}
                      className={`lk-role-list__item lk-role-list__item--${tone}`}
                    >
                      <div className="lk-role-list__top">
                        <span className="lk-role-list__title">{institution.nombre}</span>
                        <span className={`lk-role-list__meta lk-role-list__meta--${tone}`}>
                          {institution.activo ? "Activa" : "Desactivada"}
                        </span>
                      </div>
                      <p className="lk-role-list__description">
                        {institution.ciudad || "Sin ciudad"} · {institution.tutores_activos ?? 0} tutor(es) activos
                      </p>
                    </article>
                  );
                })
              ) : (
                <p className="lk-role-note">
                  Aún no hay instituciones visibles para construir esta vista global.
                </p>
              )}
            </div>
          </DashboardPanel>

          <DashboardPanel
            eyebrow="Gobierno"
            title="Qué puede hacer realmente el superadmin"
            subtitle="Este panel se mantiene pegado al contrato actual del backend, sin inventar acciones ni datos."
            aside={<ShieldCheck size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            <div className="lk-role-list">
              <article className="lk-role-list__item lk-role-list__item--gold">
                <div className="lk-role-list__top">
                  <span className="lk-role-list__title">Instituciones activas o congeladas</span>
                  <span className="lk-role-list__meta lk-role-list__meta--gold">Control real</span>
                </div>
                <p className="lk-role-list__description">
                  Puede activar, desactivar, editar o eliminar instituciones desde la plataforma global.
                </p>
              </article>

              <article className="lk-role-list__item lk-role-list__item--rose">
                <div className="lk-role-list__top">
                  <span className="lk-role-list__title">Sin listado global de admins</span>
                  <span className="lk-role-list__meta lk-role-list__meta--rose">Contrato pendiente</span>
                </div>
                <p className="lk-role-list__description">
                  El backend actual no expone todavía un endpoint para listar a todos los admins institucionales.
                </p>
              </article>
            </div>
          </DashboardPanel>
        </section>
      </div>
    </AppShell>
  );
}
