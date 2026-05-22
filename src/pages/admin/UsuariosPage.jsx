import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Search,
  ShieldAlert,
  UserCheck2,
  UsersRound,
  X,
} from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import StateChangeModal from "../../components/common/StateChangeModal";
import StatusBadge from "../../components/common/StatusBadge";
import DashboardMetricCard from "../../components/dashboard/DashboardMetricCard";
import DashboardPanel from "../../components/dashboard/DashboardPanel";
import AppShell from "../../components/layout/AppShell";
import { USER_STATE_OPTIONS } from "../../constants/roles";
import adminService from "../../services/adminService";

const STATUS_FILTERS = [
  { value: "todos", label: "Todos", estado: null },
  { value: "activos", label: "Activos", estado: "activo" },
  { value: "inactivos", label: "Inactivos", estado: "inactivo" },
  { value: "suspendidos", label: "Suspendidos", estado: "suspendido" },
];

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
        "Si el caso no es crítico, usa “inactivo” en lugar de “suspendido”.",
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
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [stateModal, setStateModal] = useState({
    open: false,
    nextState: "",
    user: null,
  });

  const loadUsers = async (nextSelectedUserId) => {
    setIsLoading(true);

    try {
      const data = await adminService.listUsers();
      setUsers(data);

      const targetUserId = nextSelectedUserId ?? selectedUser?.id ?? data[0]?.id;

      if (!targetUserId) {
        setSelectedUser(null);
        return;
      }

      const detail = await adminService.getUser(targetUserId);
      setSelectedUser(detail);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible cargar los tutores de la institución.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleUsers = useMemo(() => {
    const activeFilter = STATUS_FILTERS.find((filter) => filter.value === statusFilter);
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesFilter = !activeFilter?.estado || user.estado === activeFilter.estado;
      const matchesSearch =
        !normalizedSearch ||
        user.nombre?.toLowerCase().includes(normalizedSearch) ||
        user.email?.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [searchTerm, statusFilter, users]);

  const summary = useMemo(() => buildUsersSummary(users), [users]);

  const handleStateChange = async (userId, estado) => {
    if (selectedUser?.estado === "suspendido" && estado !== "suspendido") {
      setFeedback({
        type: "error",
        message:
          "Un tutor suspendido solo puede volver por la ruta de solicitudes de reactivación.",
      });
      return false;
    }

    try {
      await adminService.updateUserState(userId, estado);
      setFeedback({ type: "success", message: getTutorStateFeedback(estado) });
      await loadUsers(userId);
      return true;
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible actualizar el estado del tutor.",
      });
      return false;
    }
  };

  const openStateModal = (user, nextState) => {
    setStateModal({
      open: true,
      nextState,
      user,
    });
  };

  const closeStateModal = () => {
    setStateModal({
      open: false,
      nextState: "",
      user: null,
    });
  };

  const pageActions = (
    <div className="lk-role-page__toolbar">
      <div className="lk-role-page__filters">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`lk-role-page__filter${statusFilter === filter.value ? " is-active" : ""}`}
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="lk-role-search">
        <Search size={18} className="lk-role-search__icon" aria-hidden="true" />
        <input
          type="search"
          className="lk-role-search__input"
          placeholder="Buscar por nombre o correo"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        {searchTerm ? (
          <button
            type="button"
            className="lk-input-action"
            onClick={() => setSearchTerm("")}
            aria-label="Limpiar búsqueda"
          >
            <X size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <AppShell
      title="Tutores"
      description="Revisa el estado del equipo tutor y ajusta accesos desde el portal institucional."
      actions={pageActions}
    >
      <div className="lk-role-dashboard">
        {feedback ? <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div> : null}

        <section className="lk-role-dashboard__metrics">
          <DashboardMetricCard
            icon={UsersRound}
            label="Tutores visibles"
            value={isLoading ? "..." : summary.total}
            description="Cuentas que pertenecen a la institución administrada."
            tone="purple"
          />
          <DashboardMetricCard
            icon={UserCheck2}
            label="Activos"
            value={isLoading ? "..." : summary.activeUsers}
            description="Tutores listos para operar con acceso habilitado."
            tone="gold"
          />
          <DashboardMetricCard
            icon={AlertCircle}
            label="Inactivos"
            value={isLoading ? "..." : summary.inactiveUsers}
            description="Cuentas que aún no están usando la plataforma."
            tone="orange"
          />
          <DashboardMetricCard
            icon={ShieldAlert}
            label="Suspendidos"
            value={isLoading ? "..." : summary.suspendedUsers}
            description="Casos que deben resolverse desde solicitudes de reactivación."
            tone="rose"
          />
        </section>

        <section className="lk-role-section-grid">
          <DashboardPanel
            eyebrow="Directorio institucional"
            title="Tutores filtrados"
            subtitle="Mantén a la vista el equipo docente de tu institución y abre cada ficha cuando necesites actuar."
            aside={<UsersRound size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            {!isLoading && visibleUsers.length === 0 ? (
              <EmptyState
                title="No hay tutores para este filtro"
                description="Ajusta el estado o el término de búsqueda para explorar otras cuentas."
              />
            ) : null}

            {visibleUsers.length > 0 ? (
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
                      {visibleUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <strong>{user.nombre}</strong>
                            <p className="lk-muted">{user.email}</p>
                          </td>
                          <td>{user.rol}</td>
                          <td>
                            <StatusBadge label={user.estado} variant={user.estado} />
                          </td>
                          <td>{user.institucion || "Sin institución"}</td>
                          <td>
                            <button
                              type="button"
                              className="lk-btn lk-btn--secondary"
                              onClick={async () => {
                                const detail = await adminService.getUser(user.id);
                                setSelectedUser(detail);
                              }}
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
                  {visibleUsers.map((user) => (
                    <article
                      key={user.id}
                      className={`lk-role-mobile-card${selectedUser?.id === user.id ? " is-selected" : ""}`}
                    >
                      <header className="lk-role-mobile-card__header">
                        <div>
                          <h3 className="lk-role-mobile-card__title">{user.nombre}</h3>
                          <p className="lk-role-mobile-card__subtitle">{user.email}</p>
                        </div>
                        <StatusBadge label={user.estado} variant={user.estado} />
                      </header>

                      <dl className="lk-role-entity-card__meta">
                        <div>
                          <dt>Rol</dt>
                          <dd>{user.rol}</dd>
                        </div>
                        <div>
                          <dt>Institución</dt>
                          <dd>{user.institucion || "Sin institución"}</dd>
                        </div>
                      </dl>

                      <button
                        type="button"
                        className="lk-btn lk-btn--secondary"
                        onClick={async () => {
                          const detail = await adminService.getUser(user.id);
                          setSelectedUser(detail);
                        }}
                      >
                        Ver detalle
                      </button>
                    </article>
                  ))}
                </div>

                <div className="lk-role-table-footer">
                  Mostrando {visibleUsers.length} de {users.length} tutor(es).
                </div>
              </>
            ) : null}
          </DashboardPanel>

          <DashboardPanel
            eyebrow="Gestión"
            title="Detalle del tutor"
            subtitle="Consulta identidad, estado y decide si la cuenta debe seguir activa o inactiva."
            aside={<ShieldAlert size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            {!selectedUser ? (
              <EmptyState
                title="Selecciona un tutor"
                description="Cuando elijas una cuenta verás aquí su contexto y las acciones permitidas."
              />
            ) : (
              <div className="lk-role-detail-stack">
                {selectedUser.estado === "suspendido" ? (
                  <div className="lk-role-banner lk-role-banner--warning">
                    <AlertCircle
                      size={18}
                      className="lk-role-banner__icon"
                      aria-hidden="true"
                    />
                    <div className="lk-role-banner__content">
                      <strong>Cuenta suspendida</strong>
                      <p>
                        El admin no debe reactivar esta cuenta a mano. La ruta correcta es
                        revisar la solicitud de reactivación del tutor.
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="lk-role-info-grid">
                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Tutor</span>
                    <strong className="lk-role-info-card__value">{selectedUser.nombre}</strong>
                    <p className="lk-role-info-card__hint">{selectedUser.email}</p>
                  </article>

                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Rol y estado</span>
                    <strong className="lk-role-info-card__value">
                      {selectedUser.rol} · {selectedUser.estado}
                    </strong>
                    <p className="lk-role-info-card__hint">
                      {selectedUser.estado === "activo"
                        ? "La cuenta puede operar normalmente."
                        : "Revisa si el acceso debe mantenerse así."}
                    </p>
                  </article>

                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Institución</span>
                    <strong className="lk-role-info-card__value">
                      {selectedUser.institucion || "No asignada"}
                    </strong>
                    <p className="lk-role-info-card__hint">
                      {selectedUser.institucion_ciudad
                        ? `${selectedUser.institucion_ciudad} · Contexto institucional`
                        : "Sin ciudad registrada para esta cuenta."}
                    </p>
                  </article>
                </div>

                <div className="lk-role-inline-actions">
                  {selectedUser.estado === "suspendido" ? (
                    <button type="button" className="lk-btn lk-btn--secondary" disabled>
                      Cuenta suspendida
                    </button>
                  ) : (
                    USER_STATE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`lk-btn ${
                          selectedUser.estado === option.value
                            ? "lk-btn--primary"
                            : "lk-btn--secondary"
                        }`}
                        disabled={selectedUser.estado === option.value}
                        onClick={() => openStateModal(selectedUser, option.value)}
                      >
                        Marcar {option.label.toLowerCase()}
                      </button>
                    ))
                  )}
                </div>

                <p className="lk-role-text-note">
                  Los cambios de acceso se reflejan de inmediato en el portal del tutor. Si una
                  cuenta está suspendida, la resolución se gestiona desde solicitudes.
                </p>
              </div>
            )}
          </DashboardPanel>
        </section>

        <StateChangeModal
          open={stateModal.open && Boolean(stateModal.user)}
          onClose={closeStateModal}
          onConfirm={async () => {
            if (!stateModal.user) return;
            const wasSuccessful = await handleStateChange(stateModal.user.id, stateModal.nextState);
            if (wasSuccessful) {
              closeStateModal();
            }
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
