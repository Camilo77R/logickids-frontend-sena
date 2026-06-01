import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
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
  const { user } = useAuth();
  const [tutors, setTutors] = useState([]);
  const [selectedTutorId, setSelectedTutorId] = useState(null);
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

  const selectedTutor = useMemo(
    () => tutors.find((userItem) => userItem.id === selectedTutorId) || null,
    [selectedTutorId, tutors]
  );

  const summary = useMemo(() => buildUsersSummary(tutors), [tutors]);

  const syncSelectedTutor = (nextTutors, preferredTutorId = null) => {
    if (nextTutors.length === 0) {
      setSelectedTutorId(null);
      return;
    }

    const targetTutorId = preferredTutorId ?? selectedTutorId ?? nextTutors[0]?.id;
    const hasTargetTutor = nextTutors.some((tutor) => tutor.id === targetTutorId);

    setSelectedTutorId(hasTargetTutor ? targetTutorId : nextTutors[0].id);
  };

  const loadTutors = async (preferredTutorId = null) => {
    setIsLoading(true);

    try {
      const data = await adminTutorsService.listTutors();
      setTutors(data);
      syncSelectedTutor(data, preferredTutorId);
      setFeedback(null);
    } catch (error) {
      setTutors([]);
      setSelectedTutorId(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (visibleTutors.length === 0) {
      if (selectedTutorId !== null) {
        setSelectedTutorId(null);
      }
      return;
    }

    const hasVisibleSelection = visibleTutors.some((tutor) => tutor.id === selectedTutorId);
    if (!hasVisibleSelection) {
      setSelectedTutorId(visibleTutors[0].id);
    }
  }, [selectedTutorId, visibleTutors]);

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
      await loadTutors(tutor.id);
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
      await loadTutors(createdTutor?.id);
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

  const pageActions = (
    <div className="lk-role-page__toolbar lk-role-page__toolbar--stacked">
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

      <div className="lk-role-page__toolbar-group">
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

        <div className="lk-role-inline-actions">
          <button type="button" className="lk-btn lk-btn--secondary" onClick={() => loadTutors(selectedTutorId)}>
            Recargar
          </button>
          <button type="button" className="lk-btn lk-btn--primary" onClick={openCreateModal}>
            <UserPlus2 size={16} aria-hidden="true" />
            Nuevo tutor
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <AppShell
      title="Tutores"
      description="Da de alta al equipo tutor, entrega credenciales temporales y ajusta accesos desde el portal institucional."
      actions={pageActions}
    >
      <div className="lk-role-dashboard">
        {feedback ? <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div> : null}

        <section className="lk-role-dashboard__metrics">
          <DashboardMetricCard
            icon={UsersRound}
            label="Tutores visibles"
            value={isLoading ? "..." : summary.total}
            description="Cuentas docentes que pertenecen a la institución administrada."
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
            description="Cuentas pausadas que aún pueden reactivarse desde este mismo panel."
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
                        <tr
                          key={tutor.id}
                          className={`lk-role-table-row${selectedTutor?.id === tutor.id ? " is-selected" : ""}`}
                        >
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
                              onClick={() => setSelectedTutorId(tutor.id)}
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
                      className={`lk-role-mobile-card${selectedTutor?.id === tutor.id ? " is-selected" : ""}`}
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
                        onClick={() => setSelectedTutorId(tutor.id)}
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

          <DashboardPanel
            eyebrow="Gestión"
            title={selectedTutor ? selectedTutor.nombre : "Selecciona un tutor"}
            subtitle="Consulta identidad, estado y la trazabilidad básica del acceso docente."
            aside={<ShieldAlert size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            {!selectedTutor ? (
              <EmptyState
                title="Selecciona un tutor"
                description="Cuando elijas una cuenta verás aquí su contexto y las acciones permitidas."
              />
            ) : (
              <div className="lk-role-detail-stack">
                {selectedTutor.estado === "suspendido" ? (
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
                    <strong className="lk-role-info-card__value">{selectedTutor.nombre}</strong>
                    <p className="lk-role-info-card__hint">{selectedTutor.email}</p>
                  </article>

                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Rol y estado</span>
                    <strong className="lk-role-info-card__value">
                      {selectedTutor.rol} · {selectedTutor.estado}
                    </strong>
                    <p className="lk-role-info-card__hint">
                      {selectedTutor.estado === "activo"
                        ? "La cuenta puede operar normalmente."
                        : "Revisa si el acceso debe mantenerse así."}
                    </p>
                  </article>

                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Institución</span>
                    <strong className="lk-role-info-card__value">
                      {selectedTutor.institucion || "No asignada"}
                    </strong>
                    <p className="lk-role-info-card__hint">
                      {selectedTutor.institucion_ciudad
                        ? `${selectedTutor.institucion_ciudad} · Contexto institucional`
                        : "Sin ciudad registrada para esta cuenta."}
                    </p>
                  </article>

                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Alta</span>
                    <strong className="lk-role-info-card__value">{formatDate(selectedTutor.creado_en)}</strong>
                    <p className="lk-role-info-card__hint">
                      El tutor puede cambiar su clave luego desde su propio portal.
                    </p>
                  </article>
                </div>

                <div className="lk-role-inline-actions">
                  {selectedTutor.estado === "suspendido" ? (
                    <button type="button" className="lk-btn lk-btn--secondary" disabled>
                      Cuenta suspendida
                    </button>
                  ) : (
                    USER_STATE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`lk-btn ${
                          selectedTutor.estado === option.value
                            ? "lk-btn--primary"
                            : "lk-btn--secondary"
                        }`}
                        disabled={selectedTutor.estado === option.value}
                        onClick={() => openStateModal(selectedTutor, option.value)}
                      >
                        Marcar {option.label.toLowerCase()}
                      </button>
                    ))
                  )}
                </div>

                <p className="lk-role-text-note">
                  El alta institucional entrega una contraseña temporal. Compártala por un canal
                  seguro y pídale al tutor cambiarla en el primer ingreso.
                </p>
              </div>
            )}
          </DashboardPanel>
        </section>

        <RoleModal
          open={createModal.open}
          onClose={closeCreateModal}
          eyebrow="Alta institucional"
          title="Crear tutor institucional"
          warning="Se generará una contraseña temporal para este tutor. Compártela por un canal seguro y pídale cambiarla apenas entre al portal."
          actions={
            <>
              <button type="button" className="lk-btn lk-btn--secondary" onClick={closeCreateModal}>
                Cancelar
              </button>
              <button type="button" className="lk-btn lk-btn--primary" onClick={handleCreateTutor}>
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
                onChange={(event) => updateCreateForm("nombre", event.target.value)}
                placeholder="Ejemplo: Laura Calderón"
              />
            </div>

            <div className="lk-field">
              <label htmlFor="new-tutor-email">Correo</label>
              <input
                id="new-tutor-email"
                type="email"
                value={createModal.form.email}
                onChange={(event) => updateCreateForm("email", event.target.value)}
                placeholder="laura@colegio.edu.co"
              />
            </div>

            <div className="lk-role-modal__field">
              <strong>Institución de destino</strong>
              <p>{user?.institucion || "Tu institución actual"}</p>
            </div>
          </div>
        </RoleModal>

        <RoleModal
          open={Boolean(createdCredentials)}
          onClose={() => setCreatedCredentials(null)}
          eyebrow="Entrega inicial"
          title="Credenciales temporales"
          warning="La contraseña temporal solo se muestra en este momento. Guárdala y compártela por un canal seguro."
          actions={
            <>
              <button
                type="button"
                className="lk-btn lk-btn--secondary"
                onClick={handleCopyCredentials}
              >
                Copiar credenciales
              </button>
              <button
                type="button"
                className="lk-btn lk-btn--primary"
                onClick={() => setCreatedCredentials(null)}
              >
                Entendido
              </button>
            </>
          }
        >
          {createdCredentials ? (
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
          ) : null}
        </RoleModal>

        <StateChangeModal
          open={stateModal.open && Boolean(stateModal.user)}
          onClose={closeStateModal}
          onConfirm={async () => {
            if (!stateModal.user) return;
            const wasSuccessful = await handleStateChange(stateModal.user, stateModal.nextState);
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
