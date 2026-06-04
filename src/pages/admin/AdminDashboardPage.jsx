import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Clock3,
  GraduationCap,
  Mail,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck2,
  UserCog2,
  UsersRound,
  X,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import DashboardMetricCard from "../../components/dashboard/DashboardMetricCard";
import DashboardPanel from "../../components/dashboard/DashboardPanel";
import QuickActionCard from "../../components/dashboard/QuickActionCard";
import StatusBadge from "../../components/common/StatusBadge";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../hooks/useAuth";
import adminService from "../../services/adminService";
import adminTutorsService from "../../services/adminTutorsService";
import adminInstitutionalAdminsService from "../../services/adminInstitutionalAdminsService";
import adminStudentsService from "../../services/adminStudentsService";
import { buildAdminDashboardView } from "./adminDashboard.selectors";

const normalizeSearch = (value) => value.trim().toLowerCase();

const includesSearch = (value, search) =>
  String(value || "").toLowerCase().includes(search);

function filterAdmins(admins, search) {
  if (!search) return admins;

  return admins.filter(
    (admin) =>
      includesSearch(admin.nombre, search) ||
      includesSearch(admin.email, search) ||
      includesSearch(admin.institucion, search)
  );
}

function filterTutors(tutors, search) {
  if (!search) return tutors;

  return tutors.filter(
    (tutor) =>
      includesSearch(tutor.nombre, search) ||
      includesSearch(tutor.email, search) ||
      includesSearch(tutor.institucion, search)
  );
}

function filterStudents(students, search) {
  if (!search) return students;

  return students.filter(
    (student) =>
      includesSearch(student.nombre, search) ||
      includesSearch(student.grupo_nombre, search) ||
      includesSearch(student.id, search) ||
      includesSearch(student.edad, search)
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [students, setStudents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [searches, setSearches] = useState({
    admins: "",
    tutors: "",
    students: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);

        const [adminsData, tutorsData, studentsData, requestsData] = await Promise.all([
          adminInstitutionalAdminsService.listAdmins(),
          adminTutorsService.listTutors(),
          adminStudentsService.listStudents({ includeInactive: true }),
          adminService.listReactivationRequests(),
        ]);

        setAdmins(adminsData);
        setTutors(tutorsData);
        setStudents(studentsData);
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
        admins,
        tutors,
        students,
        pendingRequests,
        institutionName: user?.institucion,
      }),
    [admins, pendingRequests, students, tutors, user?.institucion]
  );

  const activeAdminRows = useMemo(
    () => filterAdmins(view.activeAdminPreview, normalizeSearch(searches.admins)),
    [searches.admins, view.activeAdminPreview]
  );
  const activeTutorRows = useMemo(
    () => filterTutors(view.activeTutorPreview, normalizeSearch(searches.tutors)),
    [searches.tutors, view.activeTutorPreview]
  );
  const activeStudentRows = useMemo(
    () => filterStudents(view.activeStudentPreview, normalizeSearch(searches.students)),
    [searches.students, view.activeStudentPreview]
  );

  const requestPreview = requests.slice(0, 4);

  const updateSearch = (key, value) => {
    setSearches((current) => ({ ...current, [key]: value }));
  };

  return (
    <AppShell
      title={`Hola, ${firstName}`}
      description="Coordina admins, tutores, estudiantes y accesos desde un solo punto de control institucional."
      notificationCount={pendingRequests}
    >
      <div className="lk-role-dashboard">
        {error ? <div className="lk-alert lk-alert--error">{error}</div> : null}

        <section className="lk-role-dashboard__hero">
          <span className="lk-role-dashboard__hero-badge">Panel institucional</span>
          <h2 className="lk-role-dashboard__hero-title">Tu institucion bajo control</h2>
          <p className="lk-role-dashboard__hero-subtitle">
            Aqui concentras el pulso de administradores, tutores, estudiantes y solicitudes para
            que la operacion diaria avance de forma ordenada.
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
            icon={ShieldCheck}
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
            icon={GraduationCap}
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
            eyebrow="Acciones rapidas"
            title="Siguientes movimientos"
            subtitle="Atajos para entrar directo al modulo que hoy necesita tu atencion."
          >
            <div className="lk-role-quick-grid">
              <QuickActionCard
                to="/admin/admins"
                icon={ShieldCheck}
                title="Gestionar admins"
                description="Revisa responsables activos y permisos institucionales."
                tone="purple"
              />
              <QuickActionCard
                to="/admin/usuarios"
                icon={UsersRound}
                title="Gestionar tutores"
                description="Activa cuentas, revisa estados y ordena el equipo docente."
                tone="gold"
              />
              <QuickActionCard
                to="/admin/estudiantes"
                icon={GraduationCap}
                title="Gestionar estudiantes"
                description="Mueve grupos, revisa estado y comparte el acceso QR cuando haga falta."
                tone="orange"
              />
              <QuickActionCard
                to="/admin/solicitudes"
                icon={Mail}
                title="Revisar solicitudes"
                description="Atiende reactivaciones pendientes sin perder el contexto del dia."
                tone="rose"
              />
            </div>
          </DashboardPanel>

          <DashboardPanel
            eyebrow="Pulso del tablero"
            title="Salud de accesos"
            subtitle="Indicadores clave para saber si tu institucion esta lista para operar hoy."
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
          <ActiveDirectoryPanel
            title="Admins activos"
            subtitle={`${view.activeAdminPreview.length} de ${view.totals.admins} admin(s) con acceso activo.`}
            searchValue={searches.admins}
            searchPlaceholder="Buscar admin por nombre, correo o institucion"
            onSearchChange={(value) => updateSearch("admins", value)}
            rows={activeAdminRows}
            emptyTitle="No hay admins activos con ese filtro"
            renderRow={(admin) => (
              <ActivePersonRow
                key={admin.id}
                title={admin.nombre}
                description={admin.email}
                meta={admin.es_admin_principal ? "Principal" : admin.institucion || "Institucion"}
                badge={admin.estado}
                tone={admin.es_admin_principal ? "pendiente" : admin.estado}
              />
            )}
            icon={ShieldCheck}
          />

          <ActiveDirectoryPanel
            title="Tutores activos"
            subtitle={`${view.activeTutorPreview.length} de ${view.totals.tutors} tutor(es) con acceso activo.`}
            searchValue={searches.tutors}
            searchPlaceholder="Buscar tutor por nombre, correo o institucion"
            onSearchChange={(value) => updateSearch("tutors", value)}
            rows={activeTutorRows}
            emptyTitle="No hay tutores activos con ese filtro"
            renderRow={(tutor) => (
              <ActivePersonRow
                key={tutor.id}
                title={tutor.nombre}
                description={tutor.email}
                meta={tutor.institucion || "Institucion"}
                badge={tutor.estado}
                tone={tutor.estado}
              />
            )}
            icon={UserCog2}
          />
        </section>

        <section className="lk-role-dashboard__grid">
          <ActiveDirectoryPanel
            title="Estudiantes activos"
            subtitle={`${view.activeStudentPreview.length} de ${view.totals.students} estudiante(s) listos para clase.`}
            searchValue={searches.students}
            searchPlaceholder="Buscar estudiante por nombre, grupo, ID o edad"
            onSearchChange={(value) => updateSearch("students", value)}
            rows={activeStudentRows}
            emptyTitle="No hay estudiantes activos con ese filtro"
            renderRow={(student) => (
              <ActivePersonRow
                key={student.id}
                title={student.nombre}
                description={`${student.grupo_nombre || "Sin grupo"} - ID #${student.id}`}
                meta={student.sesion_activa ? "En clase" : `${student.edad} anos`}
                badge={student.estado || "activo"}
                tone={student.sesion_activa ? "activo" : student.estado || "activo"}
              />
            )}
            icon={GraduationCap}
          />

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
                <p className="lk-role-note">No hay solicitudes recientes en este momento.</p>
              )}
            </div>
          </DashboardPanel>
        </section>
      </div>
    </AppShell>
  );
}

function ActiveDirectoryPanel({
  title,
  subtitle,
  searchValue,
  searchPlaceholder,
  onSearchChange,
  rows,
  emptyTitle,
  renderRow,
  icon: Icon,
}) {
  return (
    <DashboardPanel
      eyebrow="Directorio activo"
      title={title}
      subtitle={subtitle}
      aside={<Icon size={18} color="var(--lk-purple)" aria-hidden="true" />}
    >
      <div className="lk-role-detail-stack">
        <div className="lk-role-search">
          <Search size={18} className="lk-role-search__icon" aria-hidden="true" />
          <input
            type="search"
            className="lk-role-search__input"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {searchValue ? (
            <button
              type="button"
              className="lk-input-action"
              onClick={() => onSearchChange("")}
              aria-label="Limpiar busqueda"
            >
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {rows.length ? (
          <div className="lk-role-list">{rows.map(renderRow)}</div>
        ) : (
          <EmptyState
            title={emptyTitle}
            description="Ajusta la busqueda o abre el modulo completo para revisar mas estados."
          />
        )}
      </div>
    </DashboardPanel>
  );
}

function ActivePersonRow({ title, description, meta, badge, tone }) {
  return (
    <article className={`lk-role-list__item lk-role-list__item--${resolveListTone(tone)}`}>
      <div className="lk-role-list__top">
        <span className="lk-role-list__title">{title}</span>
        <StatusBadge label={badge} variant={tone} />
      </div>
      <p className="lk-role-list__description">{description}</p>
      <p className="lk-role-list__description">{meta}</p>
    </article>
  );
}

function resolveListTone(estado) {
  if (estado === "activo") return "gold";
  if (estado === "inactivo") return "orange";
  if (estado === "pendiente") return "orange";
  return "rose";
}

function resolveRequestTone(estado) {
  if (estado === "aprobado") return "gold";
  if (estado === "rechazado") return "rose";
  return "orange";
}
