import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Archive,
  CheckCircle,
  FolderClosed,
  FolderPlus,
  GraduationCap,
  Pencil,
  RefreshCw,
  Search,
  Shield,
  UserCheck2,
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
import { useAuth } from "../../hooks/useAuth";
import adminGroupsService from "../../services/adminGroupsService";
import adminStudentsService from "../../services/adminStudentsService";
import adminService from "../../services/adminService";
const STATUS_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "activo", label: "Activos" },
  { value: "inactivo", label: "Archivados" },
];
const INITIAL_GROUP_FORM = {
  nombre: "",
  descripcion: "",
};
function buildGroupsSummary(groups, studentCountMap) {
  const total = groups.length;
  const activeGroups = groups.filter((g) => g.activo).length;
  const withoutTutor = groups.filter((g) => g.activo && !g.tutor_asignado_id).length;
  const activeSessions = groups.filter((g) => g.activo && g.sesion_activa).length;
  return {
    total,
    activeGroups,
    withoutTutor,
    activeSessions,
  };
}
function getGroupStateCopy(nextState) {
  if (nextState === "inactivo") {
    return {
      eyebrow: "Pausa operativa",
      title: "Archivar grupo",
      warning: "El grupo saldrá de la operación activa y no podrá usarse en nuevas clases.",
      impactTitle: "Impacto inmediato",
      impactItems: [
        "El grupo dejará de ser visible para los tutores y estudiantes activos.",
        "Si el grupo tiene una sesión de clase abierta en este momento, se cerrará automáticamente.",
        "Los estudiantes asociados quedarán sin salón operativo pero conservarán su historial académico.",
        "La cuenta del tutor asignado ya no tendrá acceso a la operación de este grupo.",
      ],
      detailsTitle: "Cuándo conviene usarlo",
      detailsItems: [
        "Al finalizar el año lectivo o un periodo escolar.",
        "Cuando el grupo se disuelve o se reestructuran las aulas.",
      ],
      confirmLabel: "Sí, archivar grupo",
      confirmVariant: "danger",
    };
  }
  return {
    eyebrow: "Reactivación",
    title: "Reactivar grupo",
    warning: "El grupo volverá a quedar habilitado para recibir estudiantes y operar clases.",
    impactTitle: "Qué recupera",
    impactItems: [
      "El grupo vuelve al directorio activo del portal institucional.",
      "El tutor asignado (si lo tenía) podrá abrir sesiones de clase de inmediato.",
      "Se pueden volver a agregar estudiantes o trasladarlos a este grupo.",
    ],
    detailsTitle: "Revisión recomendada",
    detailsItems: [
      "Asegúrate de que el tutor asignado siga siendo el correcto.",
      "Verifica la lista de estudiantes para este nuevo ciclo.",
    ],
    confirmLabel: "Sí, reactivar grupo",
    confirmVariant: "primary",
  };
}
export default function GruposPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroupDetail, setSelectedGroupDetail] = useState(null);
  
  // Filtros y búsquedas
  const [statusFilter, setStatusFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados de UI
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  // Modales
  const [groupFormModal, setGroupFormModal] = useState({
    open: false,
    mode: "create", // "create" | "edit"
    form: INITIAL_GROUP_FORM,
  });
  const [stateModal, setStateModal] = useState({
    open: false,
    nextState: "", // "activo" | "inactivo"
    group: null,
  });
  const [tutorModal, setTutorModal] = useState({
    open: false,
    tutorId: "",
  });
  const [unassignModalOpen, setUnassignModalOpen] = useState(false);
  const hasLoaded = useRef(false);
  // Mapear estudiantes por grupo
  const studentCountMap = useMemo(() => {
    const map = {};
    students.forEach((student) => {
      const gId = student.grupo_id;
      if (gId) {
        map[gId] = (map[gId] || 0) + 1;
      }
    });
    return map;
  }, [students]);
  // Lista de tutores activos
  const activeTutors = useMemo(() => {
    return tutors.filter((t) => t.estado === "activo");
  }, [tutors]);
  // Grupos filtrados
  const visibleGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return groups.filter((group) => {
      const state = group.activo ? "activo" : "inactivo";
      const matchesFilter = statusFilter === "todos" || state === statusFilter;
      const matchesSearch =
        !query ||
        group.nombre?.toLowerCase().includes(query) ||
        group.descripcion?.toLowerCase().includes(query) ||
        (group.tutor_nombre && group.tutor_nombre.toLowerCase().includes(query));
      return matchesFilter && matchesSearch;
    });
  }, [groups, searchTerm, statusFilter]);
  const selectedGroup = useMemo(() => {
    return groups.find((g) => g.id === selectedGroupId) || null;
  }, [groups, selectedGroupId]);
  const summary = useMemo(() => buildGroupsSummary(groups, studentCountMap), [groups, studentCountMap]);
  // Cargar lista de grupos y datos iniciales
  const loadData = async (shouldKeepSelection = false) => {
    setIsLoading(true);
    try {
      const [groupsData, studentsData, tutorsData] = await Promise.all([
        adminGroupsService.listGroups(),
        adminStudentsService.listStudents({ includeInactive: true }),
        adminService.listUsers(), // Trae los usuarios con rol tutor de la institución
      ]);
      setGroups(groupsData);
      setStudents(studentsData);
      setTutors(tutorsData);
      if (groupsData.length > 0) {
        if (shouldKeepSelection && selectedGroupId) {
          const exists = groupsData.some((g) => g.id === selectedGroupId);
          if (exists) {
            loadGroupDetail(selectedGroupId);
          } else {
            setSelectedGroupId(groupsData[0].id);
          }
        } else {
          setSelectedGroupId(groupsData[0].id);
        }
      } else {
        setSelectedGroupId(null);
        setSelectedGroupDetail(null);
      }
      setFeedback(null);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible cargar los grupos de la institución.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  // Cargar detalles de un grupo específico
  const loadGroupDetail = async (groupId) => {
    if (!groupId) return;
    setIsDetailLoading(true);
    try {
      const detail = await adminGroupsService.getGroup(groupId);
      setSelectedGroupDetail(detail);
    } catch (error) {
      console.error("Error al cargar detalles de grupo:", error);
    } finally {
      setIsDetailLoading(false);
    }
  };
  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    if (selectedGroupId) {
      loadGroupDetail(selectedGroupId);
    } else {
      setSelectedGroupDetail(null);
    }
  }, [selectedGroupId]);
  // Abrir modal de creación
  const openCreateModal = () => {
    setGroupFormModal({
      open: true,
      mode: "create",
      form: INITIAL_GROUP_FORM,
    });
  };
  // Abrir modal de edición
  const openEditModal = (group) => {
    setGroupFormModal({
      open: true,
      mode: "edit",
      form: {
        nombre: group.nombre || "",
        descripcion: group.descripcion || "",
      },
    });
  };
  const closeGroupFormModal = () => {
    setGroupFormModal({
      open: false,
      mode: "create",
      form: INITIAL_GROUP_FORM,
    });
  };
  const updateGroupForm = (field, value) => {
    setGroupFormModal((prev) => ({
      ...prev,
      form: {
        ...prev.form,
        [field]: value,
      },
    }));
  };
  // Guardar creación o edición
  const handleGroupFormSubmit = async () => {
    const { nombre, descripcion } = groupFormModal.form;
    if (!nombre.trim()) {
      setFeedback({
        type: "error",
        message: "El nombre del grupo es obligatorio.",
      });
      return;
    }
    try {
      if (groupFormModal.mode === "create") {
        const newGroup = await adminGroupsService.createGroup({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
        });
        setFeedback({
          type: "success",
          message: `Grupo "${newGroup.nombre}" creado correctamente.`,
        });
        closeGroupFormModal();
        await loadData(false);
        if (newGroup?.id) {
          setSelectedGroupId(newGroup.id);
        }
      } else {
        await adminGroupsService.updateGroup(selectedGroupId, {
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
        });
        setFeedback({
          type: "success",
          message: "Grupo actualizado correctamente.",
        });
        closeGroupFormModal();
        await loadData(true);
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "Ocurrió un error al guardar el grupo.",
      });
    }
  };
  // Archivar/Reactivar grupo
  const handleStateChange = async (groupId, nextState) => {
    try {
      if (nextState === "activo") {
        await adminGroupsService.reactivateGroup(groupId);
        setFeedback({
          type: "success",
          message: "El grupo ha sido reactivado correctamente.",
        });
      } else {
        await adminGroupsService.archiveGroup(groupId);
        setFeedback({
          type: "success",
          message: "El grupo ha sido archivado correctamente. Las sesiones activas fueron cerradas.",
        });
      }
      await loadData(true);
      return true;
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible actualizar el estado del grupo.",
      });
      return false;
    }
  };
  const openStateModal = (group, nextState) => {
    setStateModal({
      open: true,
      nextState,
      group,
    });
  };
  const closeStateModal = () => {
    setStateModal({
      open: false,
      nextState: "",
      group: null,
    });
  };
  // Asignar Tutor
  const openTutorModal = () => {
    setTutorModal({
      open: true,
      tutorId: selectedGroup?.tutor_asignado_id ? String(selectedGroup.tutor_asignado_id) : "",
    });
  };
  const handleAssignTutorSubmit = async () => {
    if (!tutorModal.tutorId) {
      setFeedback({
        type: "error",
        message: "Selecciona un tutor válido antes de guardar.",
      });
      return;
    }
    try {
      await adminGroupsService.assignTutor(selectedGroupId, Number(tutorModal.tutorId));
      setFeedback({
        type: "success",
        message: "Tutor asignado al grupo correctamente.",
      });
      setTutorModal({ open: false, tutorId: "" });
      await loadData(true);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible asignar el tutor al grupo.",
      });
    }
  };
  // Quitar tutor
  const handleUnassignTutor = async () => {
    try {
      await adminGroupsService.unassignTutor(selectedGroupId);
      setFeedback({
        type: "success",
        message: "Tutor desasignado correctamente. El grupo queda temporalmente sin operador pedagógico.",
      });
      setUnassignModalOpen(false);
      await loadData(true);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible quitar el tutor del grupo.",
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
            placeholder="Buscar por nombre, descripción o tutor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          <button type="button" className="lk-btn lk-btn--secondary" onClick={() => loadData(true)}>
            <RefreshCw size={16} aria-hidden="true" />
            Recargar
          </button>
          <button type="button" className="lk-btn lk-btn--primary" onClick={openCreateModal}>
            <FolderPlus size={16} aria-hidden="true" />
            Nuevo grupo
          </button>
        </div>
      </div>
    </div>
  );
  return (
    <AppShell
      title="Grupos"
      description="Organiza los grupos de tu institución, asigna tutores y supervisa la operación de clases."
      actions={pageActions}
    >
      <div className="lk-role-dashboard">
        {feedback ? <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div> : null}
        {/* Métricas */}
        <section className="lk-role-dashboard__metrics">
          <DashboardMetricCard
            icon={FolderClosed}
            label="Total de grupos"
            value={isLoading ? "..." : summary.total}
            description="Cantidad de grupos registrados en esta institución."
            tone="purple"
          />
          <DashboardMetricCard
            icon={UserCheck2}
            label="Grupos activos"
            value={isLoading ? "..." : summary.activeGroups}
            description="Aulas que operan actualmente en el portal."
            tone="gold"
          />
          <DashboardMetricCard
            icon={UsersRound}
            label="Sin tutor"
            value={isLoading ? "..." : summary.withoutTutor}
            description="Grupos activos que necesitan un tutor docente."
            tone="orange"
          />
          <DashboardMetricCard
            icon={Activity}
            label="Clases activas"
            value={isLoading ? "..." : summary.activeSessions}
            description="Grupos que se encuentran jugando en este momento."
            tone="rose"
          />
        </section>
        {/* Layout a dos columnas */}
        <section className="lk-role-section-grid">
          {/* Lista de Grupos */}
          <DashboardPanel
            eyebrow="Directorio pedagógico"
            title="Lista de grupos"
            subtitle="Explora los grupos institucionales y selecciona uno para administrarlo."
            aside={<FolderClosed size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            {!isLoading && visibleGroups.length === 0 ? (
              <EmptyState
                title="No hay grupos para mostrar"
                description="Intenta cambiar los filtros de estado o el término de búsqueda."
              />
            ) : null}
            {visibleGroups.length > 0 ? (
              <>
                {/* Escritorio */}
                <div className="lk-table-wrap lk-role-table--desktop">
                  <table className="lk-table">
                    <thead>
                      <tr>
                        <th>Grupo</th>
                        <th>Tutor</th>
                        <th>Estudiantes</th>
                        <th>Estado</th>
                        <th>Clase</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleGroups.map((group) => (
                        <tr key={group.id}>
                          <td>
                            <strong>{group.nombre}</strong>
                            <p className="lk-muted">ID #{group.id}</p>
                          </td>
                          <td>
                            {group.tutor_nombre ? (
                              <span>{group.tutor_nombre}</span>
                            ) : (
                              <span className="lk-muted lk-group-text-italic">Sin tutor</span>
                            )}
                          </td>
                          <td>{studentCountMap[group.id] || 0} estudiantes</td>
                          <td>
                            <StatusBadge
                              label={group.activo ? "activo" : "archivado"}
                              variant={group.activo ? "activo" : "inactivo"}
                            />
                          </td>
                          <td>
                            <StatusBadge
                              label={group.sesion_activa ? "jugando" : "cerrada"}
                              variant={group.sesion_activa ? "activo" : "inactivo"}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="lk-btn lk-btn--secondary"
                              onClick={() => setSelectedGroupId(group.id)}
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Móvil */}
                <div className="lk-role-mobile-list">
                  {visibleGroups.map((group) => (
                    <article
                      key={group.id}
                      className={`lk-role-mobile-card${selectedGroupId === group.id ? " is-selected" : ""}`}
                    >
                      <header className="lk-role-mobile-card__header">
                        <div>
                          <h3 className="lk-role-mobile-card__title">{group.nombre}</h3>
                          <p className="lk-role-mobile-card__subtitle">
                            Tutor: {group.tutor_nombre || "Sin tutor asignado"}
                          </p>
                        </div>
                        <StatusBadge
                          label={group.activo ? "activo" : "archivado"}
                          variant={group.activo ? "activo" : "inactivo"}
                        />
                      </header>
                      <dl className="lk-role-entity-card__meta">
                        <div>
                          <dt>Estudiantes</dt>
                          <dd>{studentCountMap[group.id] || 0} activos</dd>
                        </div>
                        <div>
                          <dt>Sesión de clase</dt>
                          <dd>{group.sesion_activa ? "Jugando" : "Cerrada"}</dd>
                        </div>
                      </dl>
                      <button
                        type="button"
                        className="lk-btn lk-btn--secondary"
                        onClick={() => setSelectedGroupId(group.id)}
                      >
                        Ver detalle
                      </button>
                    </article>
                  ))}
                </div>
                <div className="lk-role-table-footer">
                  Mostrando {visibleGroups.length} de {groups.length} grupo(s).
                </div>
              </>
            ) : null}
          </DashboardPanel>
          {/* Detalle y Operaciones del Grupo */}
          <DashboardPanel
            eyebrow="Operaciones del aula"
            title={selectedGroup ? selectedGroup.nombre : "Detalle del grupo"}
            subtitle="Consulta información detallada, gestiona el tutor asignado y revisa los estudiantes."
            aside={<Shield size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            {!selectedGroup ? (
              <EmptyState
                title="Aún no hay grupo seleccionado"
                description="Elige una fila de la lista para ver el contexto y las acciones de control."
              />
            ) : (
              <div className="lk-role-detail-stack">
                
                {/* Banner de Advertencia si está Archivado */}
                {!selectedGroup.activo ? (
                  <div className="lk-role-banner lk-role-banner--warning">
                    <div className="lk-role-banner__content">
                      <strong>Grupo Archivado</strong>
                      <p>Este grupo no está operativo. Para usarlo en clases o asignar tutores, debes reactivarlo primero.</p>
                    </div>
                  </div>
                ) : null}
                {/* Banner si no tiene tutor */}
                {selectedGroup.activo && !selectedGroup.tutor_asignado_id ? (
                  <div className="lk-role-banner lk-role-banner--warning">
                    <div className="lk-role-banner__content">
                      <strong>Sin tutor asignado</strong>
                      <p>Los estudiantes no podrán ingresar a clase hasta que asigne un docente responsable de abrir la sesión.</p>
                    </div>
                  </div>
                ) : null}
                {/* Fichas de Información */}
                <div className="lk-role-info-grid">
                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Grupo</span>
                    <strong className="lk-role-info-card__value">{selectedGroup.nombre}</strong>
                    <p className="lk-role-info-card__hint">
                      {selectedGroup.descripcion || "Sin descripción registrada."}
                    </p>
                  </article>
                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Tutor asignado</span>
                    {selectedGroup.tutor_asignado_id ? (
                      <div>
                        <strong className="lk-role-info-card__value">{selectedGroup.tutor_nombre}</strong>
                        <p className="lk-role-info-card__hint">{selectedGroup.tutor_email}</p>
                        {selectedGroup.activo ? (
                          <div className="lk-group-tutor-actions">
                            <button
                              type="button"
                              className="lk-tutor-unassign-btn"
                              onClick={() => setUnassignModalOpen(true)}
                            >
                              Quitar tutor
                            </button>
                            <span className="lk-group-divider">|</span>
                            <button
                              type="button"
                              className="lk-group-link-btn"
                              onClick={openTutorModal}
                            >
                              Reasignar tutor
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div>
                        <strong className="lk-role-info-card__value lk-group-empty-tutor">
                          Sin tutor asignado
                        </strong>
                        {selectedGroup.activo ? (
                          <div className="lk-group-tutor-assign-wrap">
                            <button
                              type="button"
                              className="lk-btn lk-btn--secondary lk-group-assign-btn"
                              onClick={openTutorModal}
                            >
                              Asignar tutor
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </article>
                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Estado del aula</span>
                    <strong className="lk-role-info-card__value">
                      Clase {selectedGroup.sesion_activa ? "Abierta (jugando)" : "Cerrada"}
                    </strong>
                    <p className="lk-role-info-card__hint">
                      {selectedGroup.sesion_activa
                        ? `Minijuego en curso: ${selectedGroup.sesion_minijuego_titulo || "Actividad asignada"}`
                        : "No hay actividades de juego ejecutándose en este momento."}
                    </p>
                  </article>
                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Contexto institucional</span>
                    <strong className="lk-role-info-card__value">{user?.institucion || "LogicKids Institución"}</strong>
                    <p className="lk-role-info-card__hint">
                      Administrador: {user?.nombre || "Coordinador"}
                    </p>
                  </article>
                </div>
                {/* Sección de estudiantes del grupo */}
                <div className="lk-group-students-header">
                  <h4 className="lk-group-students-title">Estudiantes en el grupo</h4>
                  <span className="lk-group-students-count">
                    {isDetailLoading ? "..." : selectedGroupDetail?.estudiantes?.length || 0}
                  </span>
                </div>
                {isDetailLoading ? (
                  <p className="lk-role-text-note lk-group-text-italic">Cargando lista de estudiantes...</p>
                ) : selectedGroupDetail?.estudiantes?.length > 0 ? (
                  <div className="lk-group-students-list">
                    {selectedGroupDetail.estudiantes.map((student) => (
                      <div key={student.id} className="lk-group-student-item">
                        <div className="lk-group-student-info">
                          <span
                            className="lk-group-student-avatar-dot"
                            style={{ backgroundColor: student.color_avatar || "#3B82F6" }}
                          />
                          <div>
                            <span className="lk-group-student-name">{student.nombre}</span>
                            <span className="lk-group-student-age"> · {student.edad} años</span>
                          </div>
                        </div>
                        <StatusBadge
                          label={student.sesion_activa ? "en juego" : "inactivo"}
                          variant={student.sesion_activa ? "activo" : "inactivo"}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="lk-role-text-note lk-group-text-italic">
                    No hay estudiantes activos en este grupo. Asigna estudiantes en el módulo de Estudiantes.
                  </p>
                )}
                {/* Acciones principales de grupo */}
                <div className="lk-role-inline-actions lk-group-inline-actions">
                  {selectedGroup.activo ? (
                    <>
                      <button
                        type="button"
                        className="lk-btn lk-btn--secondary"
                        onClick={() => openEditModal(selectedGroup)}
                      >
                        <Pencil size={16} aria-hidden="true" />
                        Editar datos
                      </button>
                      <button
                        type="button"
                        className="lk-btn lk-btn--ghost-danger"
                        onClick={() => openStateModal(selectedGroup, "inactivo")}
                      >
                        <Archive size={16} aria-hidden="true" />
                        Archivar grupo
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="lk-btn lk-btn--primary"
                      onClick={() => openStateModal(selectedGroup, "activo")}
                    >
                      <CheckCircle size={16} aria-hidden="true" />
                      Reactivar grupo
                    </button>
                  )}
                </div>
              </div>
            )}
          </DashboardPanel>
        </section>
        {/* Modal de Crear / Editar Grupo */}
        <RoleModal
          open={groupFormModal.open}
          onClose={closeGroupFormModal}
          eyebrow={groupFormModal.mode === "create" ? "Alta pedagógica" : "Ajuste de grupo"}
          title={groupFormModal.mode === "create" ? "Nuevo grupo" : "Editar grupo"}
          actions={
            <>
              <button type="button" className="lk-btn lk-btn--secondary" onClick={closeGroupFormModal}>
                Cancelar
              </button>
              <button type="button" className="lk-btn lk-btn--primary" onClick={handleGroupFormSubmit}>
                Guardar
              </button>
            </>
          }
        >
          <div className="lk-form-grid">
            <div className="lk-field">
              <label htmlFor="group-name">Nombre del grupo</label>
              <input
                id="group-name"
                type="text"
                value={groupFormModal.form.nombre}
                onChange={(e) => updateGroupForm("nombre", e.target.value)}
                placeholder="Ejemplo: Quinto Grado B"
              />
            </div>
            <div className="lk-field">
              <label htmlFor="group-description">Descripción (Opcional)</label>
              <textarea
                id="group-description"
                className="lk-role-textarea"
                value={groupFormModal.form.descripcion}
                onChange={(e) => updateGroupForm("descripcion", e.target.value)}
                placeholder="Detalla observaciones sobre el grupo de estudiantes..."
              />
            </div>
          </div>
        </RoleModal>
        {/* Modal de Asignar / Cambiar Tutor */}
        <RoleModal
          open={tutorModal.open}
          onClose={() => setTutorModal({ open: false, tutorId: "" })}
          eyebrow="Operación escolar"
          title="Asignar tutor al grupo"
          actions={
            <>
              <button
                type="button"
                className="lk-btn lk-btn--secondary"
                onClick={() => setTutorModal({ open: false, tutorId: "" })}
              >
                Cancelar
              </button>
              <button type="button" className="lk-btn lk-btn--primary" onClick={handleAssignTutorSubmit}>
                Guardar tutor
              </button>
            </>
          }
        >
          <div className="lk-form-grid">
            <div className="lk-field">
              <label htmlFor="tutor-selection">Selecciona un tutor activo</label>
              <select
                id="tutor-selection"
                value={tutorModal.tutorId}
                onChange={(e) => setTutorModal((prev) => ({ ...prev, tutorId: e.target.value }))}
              >
                <option value="">-- Seleccionar tutor --</option>
                {activeTutors.map((tutor) => (
                  <option key={tutor.id} value={tutor.id}>
                    {tutor.nombre} ({tutor.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </RoleModal>
        {/* Modal de Confirmar Desasignación de Tutor */}
        <RoleModal
          open={unassignModalOpen}
          onClose={() => setUnassignModalOpen(false)}
          eyebrow="Operación docente"
          title="Quitar tutor del grupo"
          warning="¿Estás seguro de que deseas desasignar al tutor actual de este grupo?"
          actions={
            <>
              <button type="button" className="lk-btn lk-btn--secondary" onClick={() => setUnassignModalOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="lk-btn lk-btn--ghost-danger" onClick={handleUnassignTutor}>
                Sí, quitar tutor
              </button>
            </>
          }
        >
          <div className="lk-role-impact-card">
            <strong className="lk-role-impact-card__title">Impacto inmediato</strong>
            <ul className="lk-role-impact-list">
              <li>El grupo quedará sin operador pedagógico docente temporalmente.</li>
              <li>El tutor desvinculado no podrá abrir nuevas sesiones de juego para este grupo.</li>
              <li>Los estudiantes no se eliminan y su historial académico se conserva intacto.</li>
            </ul>
          </div>
        </RoleModal>
        {/* Modal de Archivar / Reactivar Grupo */}
        <StateChangeModal
          open={stateModal.open && Boolean(stateModal.group)}
          onClose={closeStateModal}
          onConfirm={async () => {
            if (!stateModal.group) return;
            const success = await handleStateChange(stateModal.group.id, stateModal.nextState);
            if (success) {
              closeStateModal();
            }
          }}
          entityLabel={stateModal.group ? `${stateModal.group.nombre}` : ""}
          currentState={stateModal.group?.activo ? "activo" : "inactivo"}
          nextState={stateModal.nextState}
          {...getGroupStateCopy(stateModal.nextState)}
        />
      </div>
    </AppShell>
  );
}
