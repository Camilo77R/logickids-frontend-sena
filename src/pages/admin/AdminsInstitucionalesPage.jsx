import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck2,
  UserPlus2,
  UsersRound,
  X,
} from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import Pagination from "../../components/common/Pagination";
import RoleModal from "../../components/common/RoleModal";
import StateChangeModal from "../../components/common/StateChangeModal";
import StatusBadge from "../../components/common/StatusBadge";
import DashboardMetricCard from "../../components/dashboard/DashboardMetricCard";
import AppShell from "../../components/layout/AppShell";
import { USER_STATE_OPTIONS } from "../../constants/roles";
import { useAuth } from "../../hooks/useAuth";
import adminInstitutionalAdminsService from "../../services/adminInstitutionalAdminsService";
import "../../styles/role-dashboard.css";

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

const PAGE_SIZE = 10;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  return new Date(value).toLocaleString("es-CO", { dateStyle: "medium" });
}

function isValidEmail(email) {
  return EMAIL_PATTERN.test(email);
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
        "Si solo necesitas pausar el acceso, usa \"inactivo\".",
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
  if (nextState === "inactivo") return "Admin institucional inactivado correctamente. La cuenta salió de la operación diaria.";
  if (nextState === "suspendido") return "Admin institucional suspendido correctamente. El caso queda marcado para revisión.";
  return "Admin institucional reactivado correctamente. La cuenta vuelve a coordinar la sede.";
}

export default function AdminsInstitucionalesPage() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [createFeedback, setCreateFeedback] = useState(null);
  const [createModal, setCreateModal] = useState({ open: false, form: INITIAL_ADMIN_FORM });
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [stateModal, setStateModal] = useState({ open: false, nextState: "", admin: null });
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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

  const summary = useMemo(() => buildAdminsSummary(admins), [admins]);
  const paginatedAdmins = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visibleAdmins.slice(start, start + PAGE_SIZE);
  }, [currentPage, visibleAdmins]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const loadAdmins = async ({ clearFeedback = true } = {}) => {
    setIsLoading(true);
    try {
      const data = await adminInstitutionalAdminsService.listAdmins();
      setAdmins(data);
      if (clearFeedback) {
        setFeedback(null);
      }
    } catch (error) {
      setAdmins([]);
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
  }, []);

  const canManageAdmin = (admin) =>
    Boolean(canCreateAdmins && admin && !admin.es_admin_principal && admin.id !== user?.id);

  const handleAdminStateChange = async (adminId, estado) => {
    try {
      await adminInstitutionalAdminsService.updateAdminState(adminId, estado);
      await loadAdmins({ clearFeedback: false });
      setFeedback({ type: "success", message: getAdminStateFeedback(estado) });
      return true;
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "No fue posible actualizar el estado del admin." });
      return false;
    }
  };

  const openStateModal = (admin, nextState) => {
    setStateModal({ open: true, nextState, admin });
  };

  const closeStateModal = () => {
    setStateModal({ open: false, nextState: "", admin: null });
  };

  const openCreateModal = () => {
    setCreateModal({ open: true, form: INITIAL_ADMIN_FORM });
    setCreateFeedback(null);
  };
  const closeCreateModal = () => {
    setCreateModal({ open: false, form: INITIAL_ADMIN_FORM });
    setCreateFeedback(null);
  };

  const updateCreateForm = (field, value) => {
    setCreateFeedback(null);
    setCreateModal((current) => ({ ...current, form: { ...current.form, [field]: value } }));
  };

  const handleCreateAdmin = async () => {
    const nombre = createModal.form.nombre.trim();
    const email = createModal.form.email.trim();
    if (!nombre || !email) {
      setCreateFeedback({ type: "error", message: "Completa nombre y correo antes de crear el admin institucional." });
      return;
    }
    const normalizedEmail = email.toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      setCreateFeedback({
        type: "error",
        message: "Escribe un correo valido antes de crear el admin institucional.",
      });
      return;
    }

    const emailAlreadyExists = admins.some((admin) => admin.email?.toLowerCase() === normalizedEmail);
    if (emailAlreadyExists) {
      setCreateFeedback({
        type: "error",
        message: "Ya existe un admin institucional con ese correo. Busca la cuenta en la lista y cambia su estado si necesitas habilitarla.",
      });
      return;
    }
    setIsCreatingAdmin(true);
    setCreateFeedback(null);
    try {
      const createdAdmin = await adminInstitutionalAdminsService.createInstitutionalAdmin({ nombre, email: normalizedEmail });
      setCreatedCredentials(createdAdmin);
      closeCreateModal();
      await loadAdmins({ clearFeedback: false });
      setFeedback({ type: "success", message: `Admin institucional ${createdAdmin?.nombre || nombre} creado correctamente.` });
    } catch (error) {
      setCreateFeedback({ type: "error", message: error.message || "No fue posible crear el admin institucional." });
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const handleViewDetails = (admin) => {
    setSelectedAdmin(admin);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAdmin(null);
  };

  // ── TOOLBAR CON BOTÓN [📊] ─────────────────────────────────────────────────
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
        <button className="lk-btn lk-btn--icon" onClick={loadAdmins} title="Recargar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>
        <button className="lk-btn lk-btn--icon" onClick={() => setShowMetricsModal(true)} title="Ver estadísticas">
          <BarChart3 size={16} />
        </button>
        {canCreateAdmins && (
          <button className="lk-btn lk-btn--primary" onClick={openCreateModal}>
            <UserPlus2 size={16} />
            <span>Nuevo admin</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <AppShell
      title="Admins institucionales"
      description="Consolida el equipo administrativo de tu sede y mantén claro quién puede coordinar la operación diaria."
    >
      <div className="lk-role-dashboard">
        {toolbar}

        {feedback && <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div>}

        {/* MÉTRICAS ELIMINADAS - AHORA EN MODAL */}

        <section className="lk-role-section-grid">
          <div className="lk-role-panel lk-role-panel--full">
            <div className="lk-role-panel__header">
              <div>
                <span className="lk-role-panel__eyebrow">Equipo administrativo</span>
                <h3 className="lk-role-panel__title">Admins de la institución</h3>
                <p className="lk-role-panel__subtitle">
                  Selecciona a cada responsable para ver su contexto y decidir si puede seguir operando.
                </p>
              </div>
            </div>

            {!isLoading && visibleAdmins.length === 0 && (
              <EmptyState
                title="No hay admins para este filtro"
                description="Ajusta el estado o la búsqueda para revisar otras cuentas."
              />
            )}

            {visibleAdmins.length > 0 && (
              <>
                <div className="lk-role-entity-grid">
                  {paginatedAdmins.map((admin) => (
                    <article
                      key={admin.id}
                      className={`lk-role-entity-card ${admin.es_admin_principal ? "lk-role-entity-card--gold" : ""}`}
                    >
                      <header className="lk-role-entity-card__header">
                        <div>
                          <h3 className="lk-role-entity-card__title">{admin.nombre}</h3>
                          <p className="lk-role-entity-card__subtitle">{admin.email}</p>
                        </div>
                        <StatusBadge
                          label={admin.es_admin_principal ? "principal" : admin.estado}
                          variant={admin.es_admin_principal ? "principal" : admin.estado}
                        />
                      </header>
                      <dl className="lk-role-entity-card__meta">
                        <div><dt>Estado</dt><dd>{admin.estado}</dd></div>
                        <div><dt>Institución</dt><dd>{admin.institucion || "Sin institución"}</dd></div>
                        <div><dt>Creado</dt><dd>{formatDate(admin.creado_en)}</dd></div>
                      </dl>
                      <div className="lk-role-entity-card__actions">
                        <button
                          type="button"
                          className="lk-btn lk-btn--secondary"
                          onClick={() => handleViewDetails(admin)}
                        >
                          Ver detalle
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <Pagination
                  currentPage={currentPage}
                  itemLabel="admin"
                  itemPluralLabel="admins"
                  onPageChange={setCurrentPage}
                  pageSize={PAGE_SIZE}
                  totalItems={visibleAdmins.length}
                />
              </>
            )}
          </div>
        </section>

        {/* MODAL DE MÉTRICAS */}
        <RoleModal
          open={showMetricsModal}
          onClose={() => setShowMetricsModal(false)}
          eyebrow="Estadísticas"
          title="Resumen de Admins"
          width={900}
          actions={
            <button className="lk-btn lk-btn--primary" onClick={() => setShowMetricsModal(false)}>
              Cerrar
            </button>
          }
        >
          <div className="lk-role-dashboard__metrics">
            <DashboardMetricCard icon={UsersRound} label="Admins visibles" value={summary.total} description="Personal administrativo" tone="purple" />
            <DashboardMetricCard icon={UserCheck2} label="Activos" value={summary.activeAdmins} description="Cuentas listas para coordinar" tone="gold" />
            <DashboardMetricCard icon={ShieldCheck} label="Principal" value={summary.principalAdmins} description="Responsables con control" tone="orange" />
            <DashboardMetricCard icon={ShieldAlert} label="Suspendidos" value={summary.suspendedAdmins} description="Casos que requieren revisión" tone="rose" />
          </div>
        </RoleModal>

        {/* Modal de detalle */}
        <RoleModal
          open={isModalOpen}
          onClose={handleCloseModal}
          eyebrow="Detalle del admin"
          title={selectedAdmin?.nombre || "Administrador"}
          width={540}
          actions={
            <div className="lk-modal-actions">
              <button className="lk-btn lk-btn--secondary" onClick={handleCloseModal}>
                Cerrar
              </button>
              {canManageAdmin(selectedAdmin) && (
                <button
                  className="lk-btn lk-btn--primary"
                  onClick={() => {
                    handleCloseModal();
                    openStateModal(selectedAdmin, selectedAdmin.estado === "activo" ? "inactivo" : "activo");
                  }}
                >
                  Cambiar estado
                </button>
              )}
            </div>
          }
        >
          {selectedAdmin && (
            <div className="lk-admin-detail-content">
              <div className="lk-detail-field"><label>Email</label><p>{selectedAdmin.email}</p></div>
              <div className="lk-detail-field">
                <label>Rol</label>
                <p>{selectedAdmin.es_admin_principal ? "Admin principal" : "Admin institucional"}</p>
              </div>
              <div className="lk-detail-field">
                <label>Estado</label>
                <StatusBadge label={selectedAdmin.estado} variant={selectedAdmin.estado} />
              </div>
              <div className="lk-detail-field">
                <label>Institución</label>
                <p>{selectedAdmin.institucion || "No asignada"}</p>
              </div>
              <div className="lk-detail-field">
                <label>Fecha de registro</label>
                <p>{formatDate(selectedAdmin.creado_en)}</p>
              </div>
              {selectedAdmin.es_admin_principal && (
                <div className="lk-role-banner lk-role-banner--warning">
                  <strong>Admin principal</strong> — No se puede modificar desde esta vista.
                </div>
              )}
            </div>
          )}
        </RoleModal>

        {/* Modal de creación */}
        <RoleModal
          open={createModal.open}
          onClose={closeCreateModal}
          eyebrow="Alta administrativa"
          title="Crear admin institucional"
          actions={
            <>
              <button className="lk-btn lk-btn--secondary" onClick={closeCreateModal}>
                Cancelar
              </button>
              <button className="lk-btn lk-btn--primary" onClick={handleCreateAdmin} disabled={isCreatingAdmin}>
                {isCreatingAdmin ? "Creando..." : "Crear admin"}
              </button>
            </>
          }
        >
          <div className="lk-form-grid">
            {createFeedback && (
              <div className={`lk-alert lk-alert--${createFeedback.type}`}>
                {createFeedback.message}
              </div>
            )}
            <div className="lk-field">
              <label htmlFor="new-admin-name">Nombre</label>
              <input
                id="new-admin-name"
                type="text"
                value={createModal.form.nombre}
                onChange={(e) => updateCreateForm("nombre", e.target.value)}
                placeholder="Ejemplo: Laura Calderón"
              />
            </div>
            <div className="lk-field">
              <label htmlFor="new-admin-email">Correo</label>
              <input
                id="new-admin-email"
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

        {/* Modal de credenciales temporales */}
        <RoleModal
          open={Boolean(createdCredentials)}
          onClose={() => setCreatedCredentials(null)}
          eyebrow="Entrega inicial"
          title="Credenciales temporales"
          warning="Comparte estas credenciales por un canal seguro. La contraseña temporal solo se muestra en este momento."
          actions={
            <button className="lk-btn lk-btn--primary" onClick={() => setCreatedCredentials(null)}>
              Entendido
            </button>
          }
        >
          {createdCredentials && (
            <>
              <div className="lk-role-modal__field"><strong>Admin creado</strong><p>{createdCredentials.nombre}</p></div>
              <div className="lk-role-modal__field"><strong>Correo</strong><p>{createdCredentials.email}</p></div>
              <div className="lk-role-modal__field"><strong>Contraseña temporal</strong><p>{createdCredentials.contrasena_temporal}</p></div>
            </>
          )}
        </RoleModal>

        {/* Modal de cambio de estado */}
        <StateChangeModal
          open={stateModal.open && Boolean(stateModal.admin)}
          onClose={closeStateModal}
          onConfirm={async () => {
            if (!stateModal.admin) return;
            const ok = await handleAdminStateChange(stateModal.admin.id, stateModal.nextState);
            if (ok) closeStateModal();
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
