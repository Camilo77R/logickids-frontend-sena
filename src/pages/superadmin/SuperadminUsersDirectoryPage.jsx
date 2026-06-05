import { useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  RefreshCw,
  Search,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import DashboardPanel from "../../components/dashboard/DashboardPanel";
import adminService from "../../services/adminService";
import adminStudentsService from "../../services/adminStudentsService";

const DIRECTORY_CONFIG = {
  admins: {
    title: "Admins",
    description: "Consulta administradores institucionales activos y ubica responsables por institucion.",
    role: "admin",
    icon: ShieldCheck,
    entityLabel: "admin",
    singularLabel: "Admin",
    searchPlaceholder: "Buscar admin por nombre, correo, institucion o ciudad",
    emptyTitle: "No hay admins activos con ese filtro",
  },
  tutors: {
    title: "Tutores",
    description: "Consulta tutores activos en toda la plataforma y filtra por colegio o correo.",
    role: "tutor",
    icon: UsersRound,
    entityLabel: "tutor",
    singularLabel: "Tutor",
    searchPlaceholder: "Buscar tutor por nombre, correo, institucion o ciudad",
    emptyTitle: "No hay tutores activos con ese filtro",
  },
  students: {
    title: "Estudiantes",
    description: "Consulta estudiantes activos globales y localiza su institucion o grupo actual.",
    icon: GraduationCap,
    entityLabel: "estudiante",
    singularLabel: "Estudiante",
    searchPlaceholder: "Buscar estudiante por nombre, institucion, grupo, ID o edad",
    emptyTitle: "No hay estudiantes activos con ese filtro",
  },
};

const normalizeSearch = (value) => value.trim().toLowerCase();
const includesSearch = (value, search) =>
  String(value || "").toLowerCase().includes(search);

function isActive(entity) {
  return (entity.estado || "activo") === "activo";
}

function searchUsers(user, search) {
  if (!search) return true;

  return (
    includesSearch(user.nombre, search) ||
    includesSearch(user.email, search) ||
    includesSearch(user.institucion, search) ||
    includesSearch(user.institucion_ciudad, search)
  );
}

function searchStudents(student, search) {
  if (!search) return true;

  return (
    includesSearch(student.nombre, search) ||
    includesSearch(student.institucion, search) ||
    includesSearch(student.institucion_ciudad, search) ||
    includesSearch(student.grupo_nombre, search) ||
    includesSearch(student.id, search) ||
    includesSearch(student.edad, search)
  );
}

function sortDirectory(left, right) {
  return (left.nombre || "").localeCompare(right.nombre || "", "es");
}

export default function SuperadminUsersDirectoryPage({ type }) {
  const config = DIRECTORY_CONFIG[type] || DIRECTORY_CONFIG.admins;
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const loadDirectory = async () => {
    setIsLoading(true);

    try {
      const data =
        type === "students"
          ? await adminStudentsService.listStudents({ includeInactive: true })
          : await adminService.listUsers({ rol: config.role });

      setItems(data);
      setFeedback(null);
    } catch (error) {
      setItems([]);
      setFeedback({
        type: "error",
        message: error.message || `No fue posible cargar el panel de ${config.title.toLowerCase()}.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const normalizedSearch = normalizeSearch(searchTerm);
  const visibleItems = useMemo(() => {
    const matcher = type === "students" ? searchStudents : searchUsers;

    return items
      .filter(isActive)
      .filter((item) => matcher(item, normalizedSearch))
      .sort(sortDirectory);
  }, [items, normalizedSearch, type]);

  const Icon = config.icon;

  return (
    <AppShell
      title={config.title}
      description={config.description}
    >
      <div className="lk-role-dashboard">
        {feedback ? <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div> : null}

        <section className="lk-role-dashboard__grid">
          <DashboardPanel
            eyebrow="Directorio activo"
            title={`${config.title} activos`}
            subtitle={`Mostrando ${visibleItems.length} ${config.entityLabel}(s) activo(s) segun la busqueda actual.`}
            aside={<Icon size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            <div className="lk-role-page__toolbar lk-role-page__toolbar--stacked">
              <div className="lk-role-page__toolbar-group">
                <div className="lk-role-search">
                  <Search size={18} className="lk-role-search__icon" aria-hidden="true" />
                  <input
                    type="search"
                    className="lk-role-search__input"
                    placeholder={config.searchPlaceholder}
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                  {searchTerm ? (
                    <button
                      type="button"
                      className="lk-input-action"
                      onClick={() => setSearchTerm("")}
                      aria-label="Limpiar busqueda"
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  ) : null}
                </div>

                <button type="button" className="lk-btn lk-btn--secondary" onClick={loadDirectory}>
                  <RefreshCw size={16} aria-hidden="true" />
                  Recargar
                </button>
              </div>
            </div>

            {!isLoading && visibleItems.length === 0 ? (
              <EmptyState
                title={config.emptyTitle}
                description="Ajusta la busqueda para encontrar otros registros activos."
              />
            ) : null}

            {visibleItems.length > 0 ? (
              <>
                <div className="lk-table-wrap lk-role-table--desktop">
                  <table className="lk-table">
                    <thead>
                      <tr>
                        <th>{config.singularLabel}</th>
                        <th>Institucion</th>
                        <th>{type === "students" ? "Grupo" : "Rol"}</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleItems.map((item) => (
                        <tr key={item.id} className="lk-role-table-row">
                          <td>
                            <strong>{item.nombre}</strong>
                            <p className="lk-muted">
                              {type === "students" ? `ID #${item.id} - ${item.edad} anos` : item.email}
                            </p>
                          </td>
                          <td>
                            <strong>{item.institucion || "Sin institucion"}</strong>
                            <p className="lk-muted">{item.institucion_ciudad || "Sin ciudad"}</p>
                          </td>
                          <td>
                            {type === "students"
                              ? item.grupo_nombre || "Sin grupo"
                              : item.es_admin_principal
                                ? "Admin principal"
                                : item.rol}
                          </td>
                          <td>
                            <StatusBadge label={item.estado || "activo"} variant={item.estado || "activo"} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="lk-role-mobile-list">
                  {visibleItems.map((item) => (
                    <article key={item.id} className="lk-role-mobile-card">
                      <header className="lk-role-mobile-card__header">
                        <div>
                          <h3 className="lk-role-mobile-card__title">{item.nombre}</h3>
                          <p className="lk-role-mobile-card__subtitle">
                            {type === "students" ? item.grupo_nombre || "Sin grupo" : item.email}
                          </p>
                        </div>
                        <StatusBadge label={item.estado || "activo"} variant={item.estado || "activo"} />
                      </header>

                      <dl className="lk-role-entity-card__meta">
                        <div>
                          <dt>Institucion</dt>
                          <dd>{item.institucion || "Sin institucion"}</dd>
                        </div>
                        <div>
                          <dt>{type === "students" ? "Edad" : "Rol"}</dt>
                          <dd>{type === "students" ? `${item.edad} anos` : item.rol}</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              </>
            ) : null}
          </DashboardPanel>
        </section>
      </div>
    </AppShell>
  );
}
