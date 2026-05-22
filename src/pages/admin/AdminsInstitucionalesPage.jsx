import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShieldAlert,
  ShieldCheck,
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
import adminInstitutionalAdminsService from "../../services/adminInstitutionalAdminsService";

const STATUS_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "activo", label: "Activos" },
  { value: "inactivo", label: "Inactivos" },
  { value: "suspendido", label: "Suspendidos" },
  { value: "principal", label: "Principal" },
];

const INITIAL_ADMIN_FORM = {
  nombre: "",
  email: "",
};

function buildAdminsSummary(admins) {
  return {
    total: admins.length,
    activeAdmins: admins.filter((admin) => admin.estado === "activo").length,
    principalAdmins: admins.filter((admin) => admin.es_admin_principal === true).length,
    suspendedAdmins: admins.filter((admin) => admin.estado === "suspendido").length,
  };
}

function formatDate(value) {
  if (!value) return "Sin fecha";

  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "medium",
  });
}

function getAdminStateCopy(nextState) {
  if (nextState === "inactivo") {
    return {
      eyebrow: "Pausa administrativa",
      title: "Inactivar admin institucional",
      warning: "Esta cuenta dejará de coordinar la operación diaria hasta nueva habilitación.",
      impactTitle: "Impacto inmediato",
      impactItems: [
        "Perderá acceso al portal administrativo.",
        "Su historial y trazabilidad institucional se conservan.",
        "El admin principal podrá reactivarlo más adelante desde este mismo módulo.",
      ],
      detailsTitle: "Cuándo usarlo",
      detailsItems: [
        "Cuando el admin sale temporalmente de la operación.",
        "Cuando necesitas pausar su acceso sin elevarlo a un bloqueo formal.",
      ],
      confirmLabel: "Sí, inactivar admin",
      confirmVariant: "danger",
    };
  }

  if (nextState === "suspendido") {
    return {
      eyebrow: "Medida crítica",
      title: "Suspender admin institucional",
      warning: "Esta acción debe reservarse para situaciones delicadas. Suspender corta el acceso y deja el caso marcado para revisión.",
      impactTitle: "Lo que implica suspender",
      impactItems: [
        "La cuenta pierde acceso inmediato al portal administrativo.",
        "Conviene revisar qué responsabilidades operativas quedan sin cobertura.",
        "Debe tratarse como un bloqueo serio, no como una ausencia normal.",
      ],
      detailsTitle: "Antes de confirmar",
      detailsItems: [
        "Si solo necesitas pausar el acceso, usa “inactivo”.",
        "Confirma que la sede siga teniendo al menos un responsable operativo disponible.",
      ],
      confirmLabel: "Sí, suspender admin",
      confirmVariant: "danger",
    };
  }

  return {
    eyebrow: "Reactivación",
    title: "Reactivar admin institucional",
    warning: "La cuenta volverá a quedar disponible para coordinar la operación de la sede.",
    impactTitle: "Qué recupera",
    impactItems: [
      "Podrá entrar al portal administrativo otra vez.",
      "Recuperará sus permisos institucionales habituales.",
      "La trazabilidad previa se mantiene intacta.",
    ],
    detailsTitle: "Verificación recomendada",
    detailsItems: [
      "Confirma que siga siendo parte del equipo de gestión de la sede.",
      "Si cambió su responsabilidad, ajusta ese contexto antes de reactivarlo.",
    ],
    confirmLabel: "Sí, reactivar admin",
    confirmVariant: "primary",
  };
}

function getAdminStateFeedback(nextState) {
  if (nextState === "inactivo") {
    return "Admin institucional inactivado correctamente. La cuenta salió de la operación diaria.";
  }

  if (nextState === "suspendido") {
    return "Admin institucional suspendido correctamente. El caso queda marcado para revisión.";
  }

  return "Admin institucional reactivado correctamente. La cuenta vuelve a coordinar la sede.";
}

export default function AdminsInstitucionalesPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [createModal, setCreateModal] = useState({
    open: false,
    form: INITIAL_ADMIN_FORM,
  });
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [stateModal, setStateModal] = useState({
    open: false,
    nextState: "",
    admin: null,
  });

  const canCreateAdmins = user?.es_admin_principal === true;

  const visibleAdmins = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return admins.filter((admin) => {
      const matchesFilter =
        statusFilter === "todos" ||
        (statusFilter === "principal"
          ? admin.es_admin_principal === true
          : admin.estado === statusFilter);
      const matchesSearch =
        !normalizedSearch ||
        admin.nombre?.toLowerCase().includes(normalizedSearch) ||
        admin.email?.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [admins, searchTerm, statusFilter]);

  const selectedAdmin = useMemo(
    () => visibleAdmins.find((admin) => admin.id === selectedAdminId) || null,
    [selectedAdminId, visibleAdmins]
  );

  const summary = useMemo(() => buildAdminsSummary(admins), [admins]);

  const syncSelectedAdmin = (nextAdmins) => {
    if (nextAdmins.length === 0) {
      setSelectedAdminId(null);
      return;
    }

    const hasCurrentSelection = nextAdmins.some((admin) => admin.id === selectedAdminId);
    if (!hasCurrentSelection) {
      setSelectedAdminId(nextAdmins[0].id);
    }
  };

  const loadAdmins = async () => {
    setIsLoading(true);

    try {
      const data = await adminInstitutionalAdminsService.listAdmins();
      setAdmins(data);
      syncSelectedAdmin(data);
      setFeedback(null);
    } catch (error) {
      setAdmins([]);
      setSelectedAdminId(null);
      setFeedback({
        type: "error",
        message: error.message || "No fue posible cargar los admins institucionales.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canManageAdmin = (admin) =>
    Boolean(canCreateAdmins && admin && !admin.es_admin_principal && admin.id !== user?.id);

  const handleAdminStateChange = async (adminId, estado) => {
    try {
      await adminInstitutionalAdminsService.updateAdminState(adminId, estado);
      setFeedback({
        type: "success",
        message: getAdminStateFeedback(estado),
      });
      await loadAdmins();
      return true;
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible actualizar el estado del admin.",
      });
      return false;
    }
  };

  const openStateModal = (admin, nextState) => {
    setStateModal({
      open: true,
      nextState,
      admin,
    });
  };

  const closeStateModal = () => {
    setStateModal({
      open: false,
      nextState: "",
      admin: null,
    });
  };

  const openCreateModal = () => {
    setCreateModal({ open: true, form: INITIAL_ADMIN_FORM });
  };

  const closeCreateModal = () => {
    setCreateModal({ open: false, form: INITIAL_ADMIN_FORM });
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

  const handleCreateAdmin = async () => {
    const nombre = createModal.form.nombre.trim();
    const email = createModal.form.email.trim();

    if (!nombre || !email) {
      setFeedback({
        type: "error",
        message: "Completa nombre y correo antes de crear el admin institucional.",
      });
      return;
    }

    try {
      const createdAdmin = await adminInstitutionalAdminsService.createInstitutionalAdmin({
        nombre,
        email,
      });

      setCreatedCredentials(createdAdmin);
      setFeedback({
        type: "success",
        message: `Admin institucional ${createdAdmin?.nombre || nombre} creado correctamente.`,
      });
      closeCreateModal();
      await loadAdmins();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible crear el admin institucional.",
      });
    }
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

      <div className="lk-role-page__toolbar">
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
          <button type="button" className="lk-btn lk-btn--secondary" onClick={loadAdmins}>
            Recargar
          </button>
          {canCreateAdmins ? (
            <button type="button" className="lk-btn lk-btn--primary" onClick={openCreateModal}>
              <UserPlus2 size={16} aria-hidden="true" />
              Nuevo admin
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );

  return (
    <AppShell
      title="Admins institucionales"
      description="Consolida el equipo administrativo de tu sede y mantén claro quién puede coordinar la operación diaria."
      actions={pageActions}
    >
      <div className="lk-role-dashboard">
        {feedback ? <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div> : null}

        <section className="lk-role-dashboard__metrics">
          <DashboardMetricCard
            icon={UsersRound}
            label="Admins visibles"
            value={isLoading ? "..." : summary.total}
            description="Personal administrativo que hoy ves en esta institución."
            tone="purple"
          />
          <DashboardMetricCard
            icon={UserCheck2}
            label="Activos"
            value={isLoading ? "..." : summary.activeAdmins}
            description="Cuentas listas para coordinar la operación."
            tone="gold"
          />
          <DashboardMetricCard
            icon={ShieldCheck}
            label="Principal"
            value={isLoading ? "..." : summary.principalAdmins}
            description="Responsables con control sobre otros admins."
            tone="orange"
          />
          <DashboardMetricCard
            icon={ShieldAlert}
            label="Suspendidos"
            value={isLoading ? "..." : summary.suspendedAdmins}
            description="Casos que requieren revisión antes de volver a operar."
            tone="rose"
          />
        </section>

        <section className="lk-role-section-grid">
          <DashboardPanel
            eyebrow="Equipo administrativo"
            title="Admins de la institución"
            subtitle="Selecciona a cada responsable para ver su contexto y decidir si puede seguir operando."
            aside={<ShieldCheck size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            {!isLoading && visibleAdmins.length === 0 ? (
              <EmptyState
                title="No hay admins para este filtro"
                description="Ajusta el estado o la búsqueda para revisar otras cuentas."
              />
            ) : null}

            {visibleAdmins.length > 0 ? (
              <>
                <div className="lk-role-entity-grid">
                  {visibleAdmins.map((admin) => (
                    <article
                      key={admin.id}
                      className={`lk-role-entity-card${admin.es_admin_principal ? " lk-role-entity-card--gold" : ""}`}
                    >
                      <header className="lk-role-entity-card__header">
                        <div>
                          <h3 className="lk-role-entity-card__title">{admin.nombre}</h3>
                          <p className="lk-role-entity-card__subtitle">{admin.email}</p>
                        </div>
                        <StatusBadge
                          label={admin.es_admin_principal ? "principal" : admin.estado}
                          variant={admin.es_admin_principal ? "pendiente" : admin.estado}
                        />
                      </header>

                      <dl className="lk-role-entity-card__meta">
                        <div>
                          <dt>Estado</dt>
                          <dd>{admin.estado}</dd>
                        </div>
                        <div>
                          <dt>Institución</dt>
                          <dd>{admin.institucion || "Sin institución"}</dd>
                        </div>
                        <div>
                          <dt>Creado</dt>
                          <dd>{formatDate(admin.creado_en)}</dd>
                        </div>
                      </dl>

                      <div className="lk-role-entity-card__actions">
                        <button
                          type="button"
                          className="lk-btn lk-btn--secondary"
                          onClick={() => setSelectedAdminId(admin.id)}
                        >
                          Ver detalle
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="lk-role-table-footer">
                  Mostrando {visibleAdmins.length} de {admins.length} admin(s) en esta vista.
                </div>
              </>
            ) : null}
          </DashboardPanel>

          <DashboardPanel
            eyebrow="Gestión"
            title={selectedAdmin ? selectedAdmin.nombre : "Selecciona un admin"}
            subtitle="Revisa permisos, estado y los límites de gestión disponibles en esta institución."
            aside={<ShieldAlert size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            {!selectedAdmin ? (
              <EmptyState
                title="Aún no hay admin seleccionado"
                description="Elige un perfil para revisar su estado y las acciones disponibles."
              />
            ) : (
              <div className="lk-role-detail-stack">
                {selectedAdmin.es_admin_principal ? (
                  <div className="lk-role-banner lk-role-banner--warning">
                    <div className="lk-role-banner__content">
                      <strong>Admin principal</strong>
                      <p>Este perfil marca la referencia institucional y no se gestiona desde esta vista.</p>
                    </div>
                  </div>
                ) : null}

                {selectedAdmin.id === user?.id ? (
                  <div className="lk-role-banner lk-role-banner--warning">
                    <div className="lk-role-banner__content">
                      <strong>Tu propia cuenta</strong>
                      <p>El estado de tu perfil administrativo no se cambia desde este mismo panel.</p>
                    </div>
                  </div>
                ) : null}

                {!canCreateAdmins ? (
                  <div className="lk-role-banner lk-role-banner--warning">
                    <div className="lk-role-banner__content">
                      <strong>Vista de consulta</strong>
                      <p>Solo el admin principal puede crear o ajustar otros admins institucionales.</p>
                    </div>
                  </div>
                ) : null}

                <div className="lk-role-info-grid">
                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Admin</span>
                    <strong className="lk-role-info-card__value">{selectedAdmin.nombre}</strong>
                    <p className="lk-role-info-card__hint">{selectedAdmin.email}</p>
                  </article>

                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Rol y estado</span>
                    <strong className="lk-role-info-card__value">
                      {selectedAdmin.es_admin_principal ? "Admin principal" : "Admin institucional"} · {selectedAdmin.estado}
                    </strong>
                    <p className="lk-role-info-card__hint">
                      {selectedAdmin.institucion || "Sin institución asignada"}
                    </p>
                  </article>

                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Alta</span>
                    <strong className="lk-role-info-card__value">{formatDate(selectedAdmin.creado_en)}</strong>
                    <p className="lk-role-info-card__hint">
                      La trazabilidad queda visible para la coordinación institucional.
                    </p>
                  </article>
                </div>

                {canManageAdmin(selectedAdmin) ? (
                  <div className="lk-role-inline-actions">
                    {USER_STATE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`lk-btn ${
                          selectedAdmin.estado === option.value ? "lk-btn--primary" : "lk-btn--secondary"
                        }`}
                        disabled={selectedAdmin.estado === option.value}
                        onClick={() => openStateModal(selectedAdmin, option.value)}
                      >
                        Marcar {option.label.toLowerCase()}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="lk-role-text-note">
                    Esta cuenta permanece visible para referencia institucional, pero sus cambios de estado no se ejecutan desde aquí.
                  </p>
                )}
              </div>
            )}
          </DashboardPanel>
        </section>

        <RoleModal
          open={createModal.open}
          onClose={closeCreateModal}
          eyebrow="Alta administrativa"
          title="Crear admin institucional"
          actions={
            <>
              <button type="button" className="lk-btn lk-btn--secondary" onClick={closeCreateModal}>
                Cancelar
              </button>
              <button type="button" className="lk-btn lk-btn--primary" onClick={handleCreateAdmin}>
                Crear admin
              </button>
            </>
          }
        >
          <div className="lk-form-grid">
            <div className="lk-field">
              <label htmlFor="new-admin-name">Nombre</label>
              <input
                id="new-admin-name"
                type="text"
                value={createModal.form.nombre}
                onChange={(event) => updateCreateForm("nombre", event.target.value)}
                placeholder="Ejemplo: Laura Calderón"
              />
            </div>

            <div className="lk-field">
              <label htmlFor="new-admin-email">Correo</label>
              <input
                id="new-admin-email"
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
          warning="Comparte estas credenciales por un canal seguro. La contraseña temporal solo se muestra en este momento."
          actions={
            <button
              type="button"
              className="lk-btn lk-btn--primary"
              onClick={() => setCreatedCredentials(null)}
            >
              Entendido
            </button>
          }
        >
          {createdCredentials ? (
            <>
              <div className="lk-role-modal__field">
                <strong>Admin creado</strong>
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
          open={stateModal.open && Boolean(stateModal.admin)}
          onClose={closeStateModal}
          onConfirm={async () => {
            if (!stateModal.admin) return;
            const wasSuccessful = await handleAdminStateChange(
              stateModal.admin.id,
              stateModal.nextState
            );
            if (wasSuccessful) {
              closeStateModal();
            }
          }}
          entityLabel={stateModal.admin ? `${stateModal.admin.nombre} · ${stateModal.admin.email}` : ""}
          currentState={stateModal.admin?.estado || "activo"}
          nextState={stateModal.nextState}
          {...getAdminStateCopy(stateModal.nextState)}
        />
      </div>
    </AppShell>
  );
}
