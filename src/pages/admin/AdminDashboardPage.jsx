import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Activity,
  GraduationCap,
  Mail,
  Search,
  ShieldCheck,
  UserCog2,
  X,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import StatusBadge from "../../components/common/StatusBadge";
import RoleModal from "../../components/common/RoleModal";
import Pagination from "../../components/common/Pagination";
import { useAuth } from "../../hooks/useAuth";
import adminService from "../../services/adminService";
import adminTutorsService from "../../services/adminTutorsService";
import adminInstitutionalAdminsService from "../../services/adminInstitutionalAdminsService";
import adminStudentsService from "../../services/adminStudentsService";
import { buildAdminDashboardView } from "./adminDashboard.selectors";

const PAGE_SIZE = 8;
const MODULES = [
  { key: "pulse", icon: Activity, title: "Pulso", subtitle: "Salud de accesos" },
  { key: "admins", icon: ShieldCheck, title: "Admins", subtitle: "Directorio activo" },
  { key: "tutors", icon: UserCog2, title: "Tutores", subtitle: "Directorio activo" },
  { key: "students", icon: GraduationCap, title: "Estudiantes", subtitle: "Accesos listos" },
  { key: "requests", icon: Mail, title: "Solicitudes", subtitle: "Pendientes" },
];

const normalizeSearch = (value) => value.trim().toLowerCase();
const includesSearch = (value, search) =>
  String(value || "").toLowerCase().includes(search);

function filterAdmins(admins, search) {
  if (!search) return admins;
  return admins.filter(
    (a) =>
      includesSearch(a.nombre, search) ||
      includesSearch(a.email, search) ||
      includesSearch(a.institucion, search)
  );
}

function filterTutors(tutors, search) {
  if (!search) return tutors;
  return tutors.filter(
    (t) =>
      includesSearch(t.nombre, search) ||
      includesSearch(t.email, search) ||
      includesSearch(t.institucion, search)
  );
}

function filterStudents(students, search) {
  if (!search) return students;
  return students.filter(
    (s) =>
      includesSearch(s.nombre, search) ||
      includesSearch(s.grupo_nombre, search) ||
      includesSearch(s.id, search) ||
      includesSearch(s.edad, search)
  );
}

function DataTable({ columns, data, searchValue, onSearchChange, searchPlaceholder }) {
  const [page, setPage] = useState(1);
  const start = (page - 1) * PAGE_SIZE;
  const paginated = data.slice(start, start + PAGE_SIZE);

  useEffect(() => { setPage(1); }, [searchValue]);

  return (
    <div className="lk-role-detail-stack">
      <div className="lk-datatable-search">
        <div className="lk-role-search">
          <Search size={18} className="lk-role-search__icon" aria-hidden="true" />
          <input
            type="search"
            className="lk-role-search__input"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchValue ? (
            <button type="button" className="lk-input-action" onClick={() => onSearchChange("")} aria-label="Limpiar búsqueda">
              <X size={16} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
      <div className="lk-table-wrap lk-role-table--desktop">
        <table className="lk-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length ? (
              paginated.map((row) => (
                <tr key={row.id}>
                  {columns.map((col) => (
                    <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="lk-datatable-empty">
                  No hay resultados con ese filtro
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="lk-role-mobile-list">
        {paginated.length ? (
          paginated.map((row) => (
            <article key={row.id} className="lk-role-mobile-card">
              <header className="lk-role-mobile-card__header">
                <div>
                  <h3 className="lk-role-mobile-card__title">{row.nombre}</h3>
                  <p className="lk-role-mobile-card__subtitle">{row.email || ""}</p>
                </div>
                {columns.find(c => c.key === "estado") && (
                  <div>{columns.find(c => c.key === "estado").render(row)}</div>
                )}
              </header>
              <dl className="lk-role-entity-card__meta">
                {columns.filter(c => c.key !== "nombre" && c.key !== "estado").map((col) => (
                  <div key={col.key}>
                    <dt>{col.label}</dt>
                    <dd>{col.render ? col.render(row) : row[col.key]}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))
        ) : (
          <p className="lk-datatable-empty">
            No hay resultados con ese filtro
          </p>
        )}
      </div>
      <Pagination
        currentPage={page}
        totalItems={data.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        itemLabel="registro"
      />
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [students, setStudents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [searches, setSearches] = useState({ admins: "", tutors: "", students: "" });
  const [activeModal, setActiveModal] = useState(null);
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
          requestsData.filter((r) => r.estado_solicitud === "pendiente").length
        );
        setError("");
      } catch (err) {
        setError(err.message || "No fue posible cargar el panel institucional.");
      } finally {
        setIsLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const firstName = user?.nombre?.split(" ")[0] || "Profe";
  const roleLabel = user?.rol === "superadmin" ? "Superadmin" : "Administrador";

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

  const updateSearch = useCallback((key, value) => {
    setSearches((curr) => ({ ...curr, [key]: value }));
  }, []);

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

  const pendingRequestsList = useMemo(
    () => requests.filter((r) => r.estado_solicitud === "pendiente"),
    [requests]
  );
  const currentModule = MODULES.find((m) => m.key === activeModal);
  const closeModal = () => setActiveModal(null);

  const getCount = (key) => {
    switch (key) {
      case "pulse": return view.progress.length;
      case "admins": return view.totals?.admins;
      case "tutors": return view.totals?.tutors;
      case "students": return view.totals?.students;
      case "requests": return pendingRequests;
      default: return null;
    }
  };

  const renderPreview = (key) => {
    if (isLoading) return null;

    if (key === "pulse") {
      return (
        <div className="lk-admin-module-card__preview">
          {view.progress.map((item) => (
            <div key={item.key} className="lk-admin-module-card__preview-row">
              <span className="lk-admin-module-card__preview-label">{item.label}</span>
              <span className="lk-admin-module-card__preview-value">{item.value}</span>
            </div>
          ))}
        </div>
      );
    }

    if (key === "admins") {
      const preview = view.activeAdminPreview.slice(0, 3);
      const remaining = view.activeAdminPreview.length - preview.length;
      return (
        <div className="lk-admin-module-card__preview">
          {preview.length ? preview.map((a) => (
            <div key={a.id || a.email} className="lk-admin-module-card__preview-row">
              <span className="lk-admin-module-card__preview-label">{a.nombre}</span>
              <span className="lk-admin-module-card__preview-value lk-admin-module-card__preview-value--muted">
                {a.es_admin_principal ? "Principal" : ""}
              </span>
            </div>
          )) : (
            <div className="lk-admin-module-card__preview-empty">Sin admins activos</div>
          )}
          {remaining > 0 && <div className="lk-admin-module-card__preview-extra">+{remaining} más</div>}
        </div>
      );
    }

    if (key === "tutors") {
      const preview = view.activeTutorPreview.slice(0, 3);
      const remaining = view.activeTutorPreview.length - preview.length;
      return (
        <div className="lk-admin-module-card__preview">
          {preview.length ? preview.map((t) => (
            <div key={t.id || t.email} className="lk-admin-module-card__preview-row">
              <span className="lk-admin-module-card__preview-label">{t.nombre}</span>
            </div>
          )) : (
            <div className="lk-admin-module-card__preview-empty">Sin tutores activos</div>
          )}
          {remaining > 0 && <div className="lk-admin-module-card__preview-extra">+{remaining} más</div>}
        </div>
      );
    }

    if (key === "students") {
      const preview = view.activeStudentPreview.slice(0, 3);
      const remaining = view.activeStudentPreview.length - preview.length;
      return (
        <div className="lk-admin-module-card__preview">
          {preview.length ? preview.map((s) => (
            <div key={s.id || s.email} className="lk-admin-module-card__preview-row">
              <span className="lk-admin-module-card__preview-label">{s.nombre}</span>
              <span className="lk-admin-module-card__preview-value lk-admin-module-card__preview-value--muted">
                {s.grupo_nombre || ""}
              </span>
            </div>
          )) : (
            <div className="lk-admin-module-card__preview-empty">Sin estudiantes activos</div>
          )}
          {remaining > 0 && <div className="lk-admin-module-card__preview-extra">+{remaining} más</div>}
        </div>
      );
    }

    if (key === "requests") {
      return (
        <div className="lk-admin-module-card__preview">
          {pendingRequestsList.length ? (
            pendingRequestsList.slice(0, 3).map((r) => (
              <div key={r.id} className="lk-admin-module-card__preview-row">
                <span className="lk-admin-module-card__preview-label">{r.tutor_nombre}</span>
                <span className="lk-admin-module-card__preview-value lk-admin-module-card__preview-value--warn">
                  pendiente
                </span>
              </div>
            ))
          ) : (
            <div className="lk-admin-module-card__preview-empty">No hay solicitudes pendientes</div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <AppShell
      title={`Hola, ${firstName}`}
      description={`${user?.institucion || "Panel institucional"} — ${roleLabel}`}
      tertiary="Administra tutores, estudiantes y accesos de tu institucion."
      notificationCount={pendingRequests}
    >
      <div className="lk-role-dashboard lk-admin-dashboard">
        {error ? <div className="lk-alert lk-alert--error">{error}</div> : null}

        <section className="lk-admin-module-grid">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const count = getCount(mod.key);
            return (
              <button
                key={mod.key}
                type="button"
                className="lk-admin-module-card"
                onClick={() => setActiveModal(mod.key)}
              >
                <div className="lk-admin-module-card__header">
                  <div className="lk-admin-module-card__icon">
                    <Icon size={20} />
                  </div>
                  <div className="lk-admin-module-card__text">
                    <strong className="lk-admin-module-card__title">{mod.title}</strong>
                    <span className="lk-admin-module-card__subtitle">{mod.subtitle}</span>
                  </div>
                  <span className="lk-admin-module-card__count">
                    {isLoading ? "..." : count}
                  </span>
                </div>
                {renderPreview(mod.key)}
                <div className="lk-admin-module-card__footer">Ver detalle →</div>
              </button>
            );
          })}
        </section>

        <RoleModal
          open={!!activeModal}
          onClose={closeModal}
          eyebrow="Módulo"
          title={currentModule?.title || ""}
          width={640}
          overlayClassName="lk-admin-modal"
        >
          {activeModal === "pulse" && (
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
          )}

          {activeModal === "admins" && (
            <DataTable
              columns={[
                { key: "nombre", label: "Nombre" },
                { key: "email", label: "Email" },
                { key: "rol", label: "Rol", render: (a) => a.es_admin_principal ? "Principal" : a.institucion || "Institución" },
                { key: "estado", label: "Estado", render: (a) => <StatusBadge label={a.estado} variant={a.estado === "activo" ? "activo" : a.estado} /> },
              ]}
              data={activeAdminRows}
              searchValue={searches.admins}
              searchPlaceholder="Buscar admin por nombre, correo o institución"
              onSearchChange={(v) => updateSearch("admins", v)}
            />
          )}

          {activeModal === "tutors" && (
            <DataTable
              columns={[
                { key: "nombre", label: "Nombre" },
                { key: "email", label: "Email" },
                { key: "institucion", label: "Institución", render: (t) => t.institucion || "Institución" },
                { key: "estado", label: "Estado", render: (t) => <StatusBadge label={t.estado} variant={t.estado} /> },
              ]}
              data={activeTutorRows}
              searchValue={searches.tutors}
              searchPlaceholder="Buscar tutor por nombre, correo o institución"
              onSearchChange={(v) => updateSearch("tutors", v)}
            />
          )}

          {activeModal === "students" && (
            <DataTable
              columns={[
                { key: "nombre", label: "Nombre" },
                { key: "grupo", label: "Grupo", render: (s) => s.grupo_nombre || "Sin grupo" },
                { key: "detalle", label: "Detalle", render: (s) => s.sesion_activa ? "En clase" : `${s.edad} años` },
                { key: "estado", label: "Estado", render: (s) => <StatusBadge label={s.estado || "activo"} variant={s.estado === "activo" ? "activo" : s.estado || "activo"} /> },
              ]}
              data={activeStudentRows}
              searchValue={searches.students}
              searchPlaceholder="Buscar estudiante por nombre, grupo, ID o edad"
              onSearchChange={(v) => updateSearch("students", v)}
            />
          )}

          {activeModal === "requests" && (
            <div className="lk-role-detail-stack">
              <div className="lk-table-wrap" style={{ overflowY: "auto", flex: 1 }}>
                {pendingRequestsList.length ? (
                  <div className="lk-role-list">
                    {pendingRequestsList.map((request) => (
                      <article key={request.id} className="lk-role-list__item">
                        <div className="lk-role-list__top">
                          <span className="lk-role-list__title">{request.tutor_nombre}</span>
                          <StatusBadge label="pendiente" variant="pendiente" />
                        </div>
                        <p className="lk-role-list__description">
                          {request.correo_contacto || request.tutor_email}
                        </p>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p style={{ textAlign: "center", padding: "2rem", color: "var(--lk-text-muted)" }}>
                    No hay solicitudes pendientes
                  </p>
                )}
              </div>
            </div>
          )}

        </RoleModal>
      </div>
    </AppShell>
  );
}
