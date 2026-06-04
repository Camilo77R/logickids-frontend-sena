import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck2,
  UserPlus2,
  UsersRound,
  X,
} from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import RoleModal from "../../components/common/RoleModal";
import StateChangeModal from "../../components/common/StateChangeModal";
import StatusBadge from "../../components/common/StatusBadge";
import DashboardMetricCard from "../../components/dashboard/DashboardMetricCard";
import DashboardPanel from "../../components/dashboard/DashboardPanel";
import AppShell from "../../components/layout/AppShell";
import { USER_STATE_OPTIONS } from "../../constants/roles";
import { useAuth } from "../../hooks/useAuth";
import adminTutorsService from "../../services/adminTutorsService";
import "../../styles/role-dashboard.css";

const STATUS_FILTERS = [
  { value: "todos", label: "Todos", estado: null },
  { value: "activos", label: "Activos", estado: "activo" },
  { value: "inactivos", label: "Inactivos", estado: "inactivo" },
  { value: "suspendidos", label: "Suspendidos", estado: "suspendido" },
];

const INITIAL_TUTOR_FORM = {
  nombre: "",
  email: "",
};

function buildUsersSummary(users) {
  const activeUsers = users.filter((user) => user.estado === "activo").length;
  const inactiveUsers = users.filter((user) => user.estado === "inactivo").length;
  const suspendedUsers = users.filter((user) => user.estado === "suspendido").length;

  return {
    total: users.length,
    activeUsers,
    inactiveUsers,
    suspendedUsers,
  };
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "medium",
  });
}

function getTutorStateCopy(nextState) {
  if (nextState === "inactivo") {
    return {
      eyebrow: "Pausa operativa",
      title: "Inactivar tutor",
      warning: "El tutor dejará de entrar al portal hasta nueva habilitación.",
      impactTitle: "Impacto inmediato",
      impactItems: [
        "No podrá iniciar sesión ni abrir nuevas clases.",
        "Sus grupos siguen asignados, pero quedan sin operación hasta que vuelva o se reasigne otro tutor.",
        "Podrás reactivarlo de nuevo desde este mismo panel cuando corresponda.",
      ],
      confirmLabel: "Sí, inactivar tutor",
      confirmVariant: "primary",
    };
  }

  if (nextState === "suspendido") {
    return {
      eyebrow: "Medida sensible",
      title: "Suspender tutor",
      warning: "Esta acción bloquea la cuenta y la devuelve al flujo de reactivación.",
      impactTitle: "Lo que implica suspender",
      impactItems: [
        "No podrá volver por reactivación manual desde este panel.",
        "Para recuperar acceso tendrá que solicitar reactivación y pasar revisión administrativa.",
        "Si el caso no es crítico, usa \"inactivo\" en lugar de \"suspendido\".",
      ],
      confirmLabel: "Sí, suspender tutor",
      confirmVariant: "danger",
    };
  }

  return {
    eyebrow: "Reactivación",
    title: "Reactivar tutor",
    warning: "La cuenta volverá a quedar disponible para operar clases.",
    impactTitle: "Qué recupera",
    impactItems: [
      "Podrá iniciar sesión nuevamente.",
      "Volverá a operar los grupos que tenga asignados.",
    ],
    confirmLabel: "Sí, reactivar tutor",
    confirmVariant: "primary",
  };
}

function getTutorStateFeedback(nextState) {
  if (nextState === "inactivo") {
    return "Tutor inactivado correctamente. Ya no podrá operar clases hasta nueva habilitación.";
  }

  if (nextState === "suspendido") {
    return "Tutor suspendido correctamente. Si necesita volver, deberá pasar por la ruta de reactivación.";
  }

  return "Tutor reactivado correctamente. La cuenta vuelve a quedar disponible para operar.";
}

export default function UsuariosPage() {
  const { user } = useAuth();
  const [tutors, setTutors] = useState([]);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [createModal, setCreateModal] = useState({
    open: false,
    form: INITIAL_TUTOR_FORM,
  });
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [stateModal, setStateModal] = useState({
    open: false,
    nextState: "",
    user: null,
  });
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTutorDetail, setSelectedTutorDetail] = useState(null);

  const visibleTutors = useMemo(() => {
    const activeFilter = STATUS_FILTERS.find((filter) => filter.value === statusFilter);
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tutors.filter((userItem) => {
      const matchesFilter = !activeFilter?.estado || userItem.estado === activeFilter.estado;
      const matchesSearch =
        !normalizedSearch ||
        userItem.nombre?.toLowerCase().includes(normalizedSearch) ||
        userItem.email?.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [searchTerm, statusFilter, tutors]);

  const summary = useMemo(() => buildUsersSummary(tutors), [tutors]);

  const loadTutors = async () => {
    setIsLoading(true);
    try {
      const data = await adminTutorsService.listTutors();
      setTutors(data);
      setFeedback(null);
    } catch (error) {
      setTutors([]);
      setFeedback({
        type: "error",
        message: error.message || "No fue posible cargar los tutores de la institución.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTutors();
  }, []);

  const handleStateChange = async (tutor, estado) => {
    if (tutor?.estado === "suspendido" && estado !== "suspendido") {
      setFeedback({
        type: "error",
        message:
          "Un tutor suspendido solo puede volver por la ruta de solicitudes de reactivación.",
      });
      return false;
    }

    try {
      await adminTutorsService.updateTutorState(tutor.id, estado);
      await loadTutors();
      setFeedback({ type: "success", message: getTutorStateFeedback(estado) });
      return true;
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible actualizar el estado del tutor.",
      });
      return false;
    }
  };

  const openStateModal = (tutor, nextState) => {
    setStateModal({
      open: true,
      nextState,
      user: tutor,
    });
  };

  const closeStateModal = () => {
    setStateModal({
      open: false,
      nextState: "",
      user: null,
    });
  };

  const openCreateModal = () => {
    setCreateModal({
      open: true,
      form: INITIAL_TUTOR_FORM,
    });
  };

  const closeCreateModal = () => {
    setCreateModal({
      open: false,
      form: INITIAL_TUTOR_FORM,
    });
  };

  const updateCreateForm = (field, value) => {
    setCreateModal((current) => ({
      ...current,
      form: {
        ...current.form,
        [field]: value,
      },
    }));
  };

  const handleCreateTutor = async () => {
    const nombre = createModal.form.nombre.trim();
    const email = createModal.form.email.trim();

    if (!nombre || !email) {
      setFeedback({
        type: "error",
        message: "Completa nombre y correo antes de crear el tutor institucional.",
      });
      return;
    }

    try {
      const createdTutor = await adminTutorsService.createTutor({
        nombre,
        email,
      });

      setCreatedCredentials(createdTutor);
      closeCreateModal();
      await loadTutors();
      setFeedback({
        type: "success",
        message: `Tutor ${createdTutor?.nombre || nombre} creado correctamente.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible crear el tutor institucional.",
      });
    }
  };

  const handleCopyCredentials = async () => {
    if (!createdCredentials) return;

    const content = `Correo: ${createdCredentials.email}\nContraseña temporal: ${createdCredentials.contrasena_temporal}`;

    try {
      await navigator.clipboard.writeText(content);
      setFeedback({
        type: "success",
        message: "Credenciales temporales copiadas. Compártalas por un canal seguro.",
      });
    } catch {
      setFeedback({
        type: "error",
        message: "No fue posible copiar las credenciales. Compártalas manualmente.",
      });
    }
  };

  const handleViewDetail = (tutor) => {
    setSelectedTutorDetail(tutor);
    setShowDetailModal(true);
  };

  const toolbar = (
    <div className="lk-role-page__toolbar">
      <div className="lk-role-page__filters">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`lk-role-page__filter ${statusFilter === filter.value ? "is-active" : ""}`}
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="lk-role-page__search">
        <Search size={18} className="lk-search-icon" />
        <input
          type="search"
          className="lk-search-input"
          placeholder="Buscar por nombre o correo"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="lk-search-clear" onClick={() => setSearchTerm("")}>
            <X size={16} />
          </button>
        )}
      </div>

      <div className="lk-role-page__actions">
        <button className="lk-btn lk-btn--icon" onClick={loadTutors} title="Recargar">
          <RefreshCw size={16} />
        </button>
        <button className="lk-btn lk-btn--icon" onClick={() => setShowMetricsModal(true)} title="Ver estadísticas">
          <BarChart3 size={16} />
        </button>
        <button className="lk-btn lk-btn--primary" onClick={openCreateModal}>
          <UserPlus2 size={16} />
          <span>Nuevo tutor</span>
        </button>
      </div>
    </div>
  );

  return (
    <AppShell
      title="Tutores"
      description="Da de alta al equipo tutor, entrega credenciales temporales y ajusta accesos desde el portal institucional."
    >
      <div className="lk-role-dashboard">
        {toolbar}

        {feedback && <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div>}

        {/* Panel único que ocupa TODO el ancho */}
        <DashboardPanel
          eyebrow="Directorio institucional"
          title="Tutores filtrados"
          subtitle="Mantén a la vista el equipo docente de tu institución y abre cada ficha cuando necesites actuar."
          aside={<UsersRound size={18} color="var(--lk-purple)" />}
        >
          {!isLoading && visibleTutors.length === 0 ? (
            <EmptyState
              title="No hay tutores para este filtro"
              description="Ajusta el estado o el término de búsqueda para explorar otras cuentas."
            />
          ) : null}

          {visibleTutors.length > 0 ? (
            <>
              <div className="lk-table-wrap lk-role-table--desktop">
                <table className="lk-table">
                  <thead>
                    <tr>
                      <th>Tutor</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Institución</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleTutors.map((tutor) => (
                      <tr key={tutor.id}>
                        <td>
                          <strong>{tutor.nombre}</strong>
                          <p className="lk-muted">{tutor.email}</p>
                        </td>
                        <td>{tutor.rol}</td>
                        <td>
                          <StatusBadge label={tutor.estado} variant={tutor.estado} />
                        </td>
                        <td>{tutor.institucion || "Sin institución"}</td>
                        <td>
                          <button
                            type="button"
                            className="lk-btn lk-btn--secondary"
                            onClick={() => handleViewDetail(tutor)}
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lk-role-mobile-list">
                {visibleTutors.map((tutor) => (
                  <article
                    key={tutor.id}
                    className={`lk-role-mobile-card`}
                  >
                    <header className="lk-role-mobile-card__header">
                      <div>
                        <h3 className="lk-role-mobile-card__title">{tutor.nombre}</h3>
                        <p className="lk-role-mobile-card__subtitle">{tutor.email}</p>
                      </div>
                      <StatusBadge label={tutor.estado} variant={tutor.estado} />
                    </header>

                    <dl className="lk-role-entity-card__meta">
                      <div>
                        <dt>Rol</dt>
                        <dd>{tutor.rol}</dd>
                      </div>
                      <div>
                        <dt>Institución</dt>
                        <dd>{tutor.institucion || "Sin institución"}</dd>
                      </div>
                    </dl>

                    <button
                      type="button"
                      className="lk-btn lk-btn--secondary"
                      onClick={() => handleViewDetail(tutor)}
                    >
                      Ver detalle
                    </button>
                  </article>
                ))}
              </div>

              <div className="lk-role-table-footer">
                Mostrando {visibleTutors.length} de {tutors.length} tutor(es).
              </div>
            </>
          ) : null}
        </DashboardPanel>

        {/* MODAL DE MÉTRICAS */}
        <RoleModal
          open={showMetricsModal}
          onClose={() => setShowMetricsModal(false)}
          eyebrow="Estadísticas"
          title="Resumen de Tutores"
          width={900}
          actions={
            <button className="lk-btn lk-btn--primary" onClick={() => setShowMetricsModal(false)}>
              Cerrar
            </button>
          }
        >
          <div className="lk-role-dashboard__metrics">
            <DashboardMetricCard icon={UsersRound} label="Tutores visibles" value={summary.total} description="Cuentas docentes" tone="purple" />
            <DashboardMetricCard icon={UserCheck2} label="Activos" value={summary.activeUsers} description="Tutores habilitados" tone="gold" />
            <DashboardMetricCard icon={AlertCircle} label="Inactivos" value={summary.inactiveUsers} description="Cuentas pausadas" tone="orange" />
            <DashboardMetricCard icon={ShieldAlert} label="Suspendidos" value={summary.suspendedUsers} description="Requieren revisión" tone="rose" />
          </div>
        </RoleModal>

        {/* MODAL DE DETALLE - CORREGIDO */}
        <RoleModal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          eyebrow="Detalle del tutor"
          title={selectedTutorDetail?.nombre || "Tutor"}
          width={540}
          actions={
            <div className="lk-modal-actions">
              <button className="lk-btn lk-btn--secondary" onClick={() => setShowDetailModal(false)}>
                Cerrar
              </button>
              {selectedTutorDetail?.estado !== "suspendido" && (
                <button 
                  className="lk-btn lk-btn--primary" 
                  onClick={() => {
                    const nextState = selectedTutorDetail.estado === "activo" ? "inactivo" : "activo";
                    openStateModal(selectedTutorDetail, nextState);
                    setShowDetailModal(false);
                  }}
                >
                  {selectedTutorDetail?.estado === "activo" ? "Desactivar" : "Reactivar"}
                </button>
              )}
            </div>
          }
        >
          {selectedTutorDetail && (
            <div className="lk-admin-detail-content">
              <div className="lk-detail-field">
                <label>Nombre</label>
                <p><strong>{selectedTutorDetail.nombre}</strong></p>
              </div>
              <div className="lk-detail-field">
                <label>Email</label>
                <p>{selectedTutorDetail.email}</p>
              </div>
              <div className="lk-detail-field">
                <label>Rol</label>
                <p>{selectedTutorDetail.rol}</p>
              </div>
              <div className="lk-detail-field">
                <label>Estado</label>
                <StatusBadge label={selectedTutorDetail.estado} variant={selectedTutorDetail.estado} />
              </div>
              <div className="lk-detail-field">
                <label>Institución</label>
                <p>{selectedTutorDetail.institucion || "No asignada"}</p>
              </div>
              <div className="lk-detail-field">
                <label>Fecha de registro</label>
                <p>{formatDate(selectedTutorDetail.creado_en)}</p>
              </div>
            </div>
          )}
        </RoleModal>

        {/* MODAL DE CREACIÓN */}
        <RoleModal
          open={createModal.open}
          onClose={closeCreateModal}
          eyebrow="Alta institucional"
          title="Crear tutor institucional"
          warning="Se generará una contraseña temporal para este tutor. Compártela por un canal seguro y pídale cambiarla apenas entre al portal."
          actions={
            <>
              <button className="lk-btn lk-btn--secondary" onClick={closeCreateModal}>
                Cancelar
              </button>
              <button className="lk-btn lk-btn--primary" onClick={handleCreateTutor}>
                Crear tutor
              </button>
            </>
          }
        >
          <div className="lk-form-grid">
            <div className="lk-field">
              <label htmlFor="new-tutor-name">Nombre</label>
              <input
                id="new-tutor-name"
                type="text"
                value={createModal.form.nombre}
                onChange={(e) => updateCreateForm("nombre", e.target.value)}
                placeholder="Ejemplo: Laura Calderón"
              />
            </div>

            <div className="lk-field">
              <label htmlFor="new-tutor-email">Correo</label>
              <input
                id="new-tutor-email"
                type="email"
                value={createModal.form.email}
                onChange={(e) => updateCreateForm("email", e.target.value)}
                placeholder="laura@colegio.edu.co"
              />
            </div>

            <div className="lk-role-modal__field">
              <strong>Institución de destino</strong>
              <p>{user?.institucion || "Tu institución actual"}</p>
            </div>
          </div>
        </RoleModal>

        {/* MODAL CREDENCIALES */}
        <RoleModal
          open={Boolean(createdCredentials)}
          onClose={() => setCreatedCredentials(null)}
          eyebrow="Entrega inicial"
          title="Credenciales temporales"
          warning="La contraseña temporal solo se muestra en este momento. Guárdala y compártela por un canal seguro."
          actions={
            <>
              <button className="lk-btn lk-btn--secondary" onClick={handleCopyCredentials}>
                Copiar credenciales
              </button>
              <button className="lk-btn lk-btn--primary" onClick={() => setCreatedCredentials(null)}>
                Entendido
              </button>
            </>
          }
        >
          {createdCredentials && (
            <>
              <div className="lk-role-modal__field">
                <strong>Tutor creado</strong>
                <p>{createdCredentials.nombre}</p>
              </div>
              <div className="lk-role-modal__field">
                <strong>Correo</strong>
                <p>{createdCredentials.email}</p>
              </div>
              <div className="lk-role-modal__field">
                <strong>Contraseña temporal</strong>
                <p>{createdCredentials.contrasena_temporal}</p>
              </div>
            </>
          )}
        </RoleModal>

        {/* MODAL CAMBIO DE ESTADO */}
        <StateChangeModal
          open={stateModal.open && Boolean(stateModal.user)}
          onClose={closeStateModal}
          onConfirm={async () => {
            if (!stateModal.user) return;
            const ok = await handleStateChange(stateModal.user, stateModal.nextState);
            if (ok) closeStateModal();
          }}
          entityLabel={stateModal.user ? `${stateModal.user.nombre} · ${stateModal.user.email}` : ""}
          currentState={stateModal.user?.estado || "activo"}
          nextState={stateModal.nextState}
          {...getTutorStateCopy(stateModal.nextState)}
        />
      </div>
    </AppShell>
  );
}