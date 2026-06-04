import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Building2,
  Gamepad2,
  GraduationCap,
  Power,
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
  const [dashboardSummary, setDashboardSummary] = useState({});
  const [institutions, setInstitutions] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);

        const dashboardData = await adminService.getDashboard();
        setDashboardSummary(dashboardData?.resumen ?? {});
        setInstitutions(dashboardData?.instituciones ?? []);
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
        resumen: dashboardSummary,
        institutions,
      }),
    [dashboardSummary, institutions]
  );

  return (
    <AppShell
      title={`Hola, ${firstName}`}
      description="Monitorea la plataforma completa y entra solo a los modulos que necesitan accion."
    >
      <div className="lk-role-dashboard">
        {error ? <div className="lk-alert lk-alert--error">{error}</div> : null}

        <section className="lk-role-dashboard__hero">
          <span className="lk-role-dashboard__hero-badge">Resumen global</span>
          <h2 className="lk-role-dashboard__hero-title">Panorama ejecutivo de LogicKids</h2>
          <p className="lk-role-dashboard__hero-subtitle">
            Este panel concentra lectura global. Las acciones operativas viven en los modulos de
            Instituciones y Minijuegos para evitar duplicidad y mezclar decision con ejecucion.
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
            icon={GraduationCap}
            label={view.metrics[3].label}
            value={isLoading ? "..." : view.metrics[3].value}
            description={view.metrics[3].description}
            tone={view.metrics[3].tone}
          />
        </section>

        <section className="lk-role-dashboard__grid">
          <DashboardPanel
            eyebrow="Modulos"
            title="Entradas principales de gobierno"
            subtitle="Cada espacio tiene una responsabilidad unica para que el superadmin no repita trabajo."
          >
            <div className="lk-role-quick-grid">
              <QuickActionCard
                to="/superadmin/instituciones"
                icon={Building2}
                title="Instituciones"
                description="CRUD, congelamiento, reactivacion y directorio operativo de colegios."
                tone="purple"
              />
              <QuickActionCard
                to="/superadmin/admins"
                icon={ShieldCheck}
                title="Admins"
                description="Directorio global de administradores activos por institucion."
                tone="orange"
              />
              <QuickActionCard
                to="/superadmin/tutores"
                icon={UsersRound}
                title="Tutores"
                description="Directorio global de tutores activos con busqueda operativa."
                tone="gold"
              />
              <QuickActionCard
                to="/superadmin/estudiantes"
                icon={GraduationCap}
                title="Estudiantes"
                description="Lectura global de estudiantes activos, grupos e instituciones."
                tone="rose"
              />
              <QuickActionCard
                to="/superadmin/minijuegos"
                icon={Gamepad2}
                title="Minijuegos"
                description="Disponibilidad del catalogo y control de experiencia a nivel de plataforma."
                tone="gold"
              />
            </div>
          </DashboardPanel>

          <DashboardPanel
            eyebrow="Cobertura"
            title="Pulso operacional"
            subtitle="Lectura rapida de disponibilidad y expansion sin entrar al detalle del CRUD."
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
            eyebrow="Atencion inmediata"
            title="Instituciones que requieren seguimiento"
            subtitle="Se listan solo las que hoy estan congeladas para que esta vista no replique el directorio completo."
            aside={<Power size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            <div className="lk-role-list">
              {view.attentionInstitutions.length ? (
                view.attentionInstitutions.map((institution) => (
                  <article
                    key={institution.id ?? institution.id_institucion}
                    className="lk-role-list__item lk-role-list__item--rose"
                  >
                    <div className="lk-role-list__top">
                      <span className="lk-role-list__title">{institution.nombre}</span>
                      <span className="lk-role-list__meta lk-role-list__meta--rose">Congelada</span>
                    </div>
                    <p className="lk-role-list__description">
                      {institution.ciudad || "Sin ciudad"} · {institution.tutores_activos ?? 0} tutor(es) activos impactados
                    </p>
                  </article>
                ))
              ) : (
                <p className="lk-role-note">
                  No hay instituciones congeladas en este momento. El acceso institucional luce estable.
                </p>
              )}
            </div>
          </DashboardPanel>

          <DashboardPanel
            eyebrow="Alcance"
            title="Que debe vivir en cada pestaña"
            subtitle="Este bloque define el contrato UX del modulo para no mezclar resumen con operacion."
            aside={<ShieldCheck size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            <div className="lk-role-list">
              <article className="lk-role-list__item lk-role-list__item--gold">
                <div className="lk-role-list__top">
                  <span className="lk-role-list__title">Resumen global</span>
                  <span className="lk-role-list__meta lk-role-list__meta--gold">Leer</span>
                </div>
                <p className="lk-role-list__description">
                  KPIs, cobertura, alertas e indicadores de salud. No debe cargar formularios ni directorios completos.
                </p>
              </article>

              <article className="lk-role-list__item lk-role-list__item--orange">
                <div className="lk-role-list__top">
                  <span className="lk-role-list__title">Instituciones</span>
                  <span className="lk-role-list__meta lk-role-list__meta--orange">Gestionar</span>
                </div>
                <p className="lk-role-list__description">
                  Altas, ediciones, congelamiento, reactivacion y busqueda operativa de colegios.
                </p>
              </article>

              <article className="lk-role-list__item lk-role-list__item--orange">
                <div className="lk-role-list__top">
                  <span className="lk-role-list__title">Minijuegos</span>
                  <span className="lk-role-list__meta lk-role-list__meta--orange">Operar</span>
                </div>
                <p className="lk-role-list__description">
                  Control del catalogo y disponibilidad pedagogica sin contaminar el tablero ejecutivo.
                </p>
              </article>
            </div>
          </DashboardPanel>
        </section>
      </div>
    </AppShell>
  );
}
