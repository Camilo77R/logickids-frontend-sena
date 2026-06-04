import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Archive,
  BarChart3,
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
import adminTutorsService from "../../services/adminTutorsService";
import "../../styles/role-dashboard.css";

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
  
  const [statusFilter, setStatusFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedGroupForModal, setSelectedGroupForModal] = useState(null);
  
  const [groupFormModal, setGroupFormModal] = useState({
    open: false,
    mode: "create",
    form: INITIAL_GROUP_FORM,
  });
  const [stateModal, setStateModal] = useState({
    open: false,
    nextState: "",
    group: null,
  });
  const [tutorModal, setTutorModal] = useState({
    open: false,
    tutorId: "",
  });
  const [unassignModalOpen, setUnassignModalOpen] = useState(false);
  const hasLoaded = useRef(false);
  
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
  
  const activeTutors = useMemo(() => {
    return tutors.filter((t) => t.estado === "activo");
  }, [tutors]);
  
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
  
  const loadData = async (shouldKeepSelection = false) => {
    setIsLoading(true);
    try {
      const [groupsData, studentsData, tutorsData] = await Promise.all([
        adminGroupsService.listGroups(),
        adminStudentsService.listStudents({ includeInactive: true }),
        adminTutorsService.listTutors(),
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
  
  const handleViewDetail = (group) => {
    setSelectedGroupForModal(group);
    setShowDetailModal(true);
  };
  
  const openCreateModal = () => {
    setGroupFormModal({
      open: true,
      mode: "create",
      form: INITIAL_GROUP_FORM,
    });
  };
  
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
  
  const handleUnassignTutor = async () => {
    try {
      await adminGroupsService.unassignTutor(selectedGroupId);
      setFeedback({
        type: "success",
        message: "Tutor desasignado correctamente.",
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
          placeholder="Buscar por nombre, descripción o tutor..."
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
        <button className="lk-btn lk-btn--icon" onClick={() => loadData(true)} title="Recargar">
          <RefreshCw size={16} />
        </button>
        <button className="lk-btn lk-btn--icon" onClick={() => setShowMetricsModal(true)} title="Ver estadísticas">
          <BarChart3 size={16} />
        </button>
        <button className="lk-btn lk-btn--primary" onClick={openCreateModal}>
          <FolderPlus size={16} />
          <span>Nuevo grupo</span>
        </button>
      </div>
    </div>
  );
  
  return (
    <AppShell
      title="Grupos"
      description="Organiza los grupos de tu institución, asigna tutores y supervisa la operación de clases."
    >
      <div className="lk-role-dashboard">
        {toolbar}
        
        {feedback && <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div>}
        
        {/* Panel único que ocupa todo el ancho */}
        <DashboardPanel
          eyebrow="Directorio pedagógico"
          title="Lista de grupos"
          subtitle="Explora los grupos institucionales y selecciona uno para administrarlo."
          aside={<FolderClosed size={18} color="var(--lk-purple)" />}
        >
          {!isLoading && visibleGroups.length === 0 ? (
            <EmptyState
              title="No hay grupos para mostrar"
              description="Intenta cambiar los filtros de estado o el término de búsqueda."
            />
          ) : null}
          {visibleGroups.length > 0 ? (
            <>
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
                            <span className="lk-muted">Sin tutor</span>
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
                            onClick={() => handleViewDetail(group)}
                          >
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="lk-role-table-footer">
                Mostrando {visibleGroups.length} de {groups.length} grupo(s).
              </div>
            </>
          ) : null}
        </DashboardPanel>
        
        {/* MODAL DE MÉTRICAS */}
        <RoleModal
          open={showMetricsModal}
          onClose={() => setShowMetricsModal(false)}
          eyebrow="Estadísticas"
          title="Resumen de Grupos"
          width={900}
          actions={
            <button className="lk-btn lk-btn--primary" onClick={() => setShowMetricsModal(false)}>
              Cerrar
            </button>
          }
        >
          <div className="lk-role-dashboard__metrics">
            <DashboardMetricCard icon={FolderClosed} label="Total de grupos" value={summary.total} description="Cantidad de grupos" tone="purple" />
            <DashboardMetricCard icon={UserCheck2} label="Grupos activos" value={summary.activeGroups} description="Aulas operativas" tone="gold" />
            <DashboardMetricCard icon={UsersRound} label="Sin tutor" value={summary.withoutTutor} description="Necesitan tutor" tone="orange" />
            <DashboardMetricCard icon={Activity} label="Clases activas" value={summary.activeSessions} description="En juego" tone="rose" />
          </div>
        </RoleModal>
        
        {/* MODAL DE DETALLE DEL GRUPO */}
        <RoleModal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          eyebrow="Detalle del grupo"
          title={selectedGroupForModal?.nombre || "Grupo"}
          width={540}
          actions={
            <div className="lk-modal-actions">
              <button className="lk-btn lk-btn--secondary" onClick={() => setShowDetailModal(false)}>
                Cerrar
              </button>
              {selectedGroupForModal?.activo ? (
                <>
                  <button className="lk-btn lk-btn--secondary" onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(selectedGroupForModal);
                  }}>
                    <Pencil size={16} /> Editar
                  </button>
                  <button className="lk-btn lk-btn--ghost-danger" onClick={() => {
                    setShowDetailModal(false);
                    openStateModal(selectedGroupForModal, "inactivo");
                  }}>
                    <Archive size={16} /> Archivar
                  </button>
                </>
              ) : (
                <button className="lk-btn lk-btn--primary" onClick={() => {
                  setShowDetailModal(false);
                  openStateModal(selectedGroupForModal, "activo");
                }}>
                  <CheckCircle size={16} /> Reactivar
                </button>
              )}
            </div>
          }
        >
          {selectedGroupForModal && (
            <div className="lk-admin-detail-content">
              <div className="lk-detail-field">
                <label>Nombre</label>
                <p><strong>{selectedGroupForModal.nombre}</strong></p>
              </div>
              <div className="lk-detail-field">
                <label>ID</label>
                <p>#{selectedGroupForModal.id}</p>
              </div>
              <div className="lk-detail-field">
                <label>Descripción</label>
                <p>{selectedGroupForModal.descripcion || "Sin descripción"}</p>
              </div>
              <div className="lk-detail-field">
                <label>Tutor asignado</label>
                <p>{selectedGroupForModal.tutor_nombre || "Sin tutor"}</p>
                {selectedGroupForModal.tutor_email && (
                  <p className="lk-muted">{selectedGroupForModal.tutor_email}</p>
                )}
              </div>
              <div className="lk-detail-field">
                <label>Estado</label>
                <StatusBadge
                  label={selectedGroupForModal.activo ? "activo" : "archivado"}
                  variant={selectedGroupForModal.activo ? "activo" : "inactivo"}
                />
              </div>
              <div className="lk-detail-field">
                <label>Clase</label>
                <StatusBadge
                  label={selectedGroupForModal.sesion_activa ? "jugando" : "cerrada"}
                  variant={selectedGroupForModal.sesion_activa ? "activo" : "inactivo"}
                />
              </div>
              <div className="lk-detail-field">
                <label>Estudiantes</label>
                <p>{studentCountMap[selectedGroupForModal.id] || 0} estudiantes</p>
              </div>
            </div>
          )}
        </RoleModal>
        
        <RoleModal
          open={groupFormModal.open}
          onClose={closeGroupFormModal}
          eyebrow={groupFormModal.mode === "create" ? "Alta pedagógica" : "Ajuste de grupo"}
          title={groupFormModal.mode === "create" ? "Nuevo grupo" : "Editar grupo"}
          actions={
            <>
              <button className="lk-btn lk-btn--secondary" onClick={closeGroupFormModal}>Cancelar</button>
              <button className="lk-btn lk-btn--primary" onClick={handleGroupFormSubmit}>Guardar</button>
            </>
          }
        >
          <div className="lk-form-grid">
            <div className="lk-field">
              <label>Nombre del grupo</label>
              <input type="text" value={groupFormModal.form.nombre} onChange={(e) => updateGroupForm("nombre", e.target.value)} />
            </div>
            <div className="lk-field">
              <label>Descripción</label>
              <textarea value={groupFormModal.form.descripcion} onChange={(e) => updateGroupForm("descripcion", e.target.value)} />
            </div>
          </div>
        </RoleModal>
        
        <RoleModal
          open={tutorModal.open}
          onClose={() => setTutorModal({ open: false, tutorId: "" })}
          eyebrow="Operación escolar"
          title="Asignar tutor"
          actions={
            <>
              <button className="lk-btn lk-btn--secondary" onClick={() => setTutorModal({ open: false, tutorId: "" })}>Cancelar</button>
              <button className="lk-btn lk-btn--primary" onClick={handleAssignTutorSubmit}>Guardar</button>
            </>
          }
        >
          <select value={tutorModal.tutorId} onChange={(e) => setTutorModal((prev) => ({ ...prev, tutorId: e.target.value }))}>
            <option value="">-- Seleccionar tutor --</option>
            {activeTutors.map((tutor) => (
              <option key={tutor.id} value={tutor.id}>{tutor.nombre} ({tutor.email})</option>
            ))}
          </select>
        </RoleModal>
        
        <RoleModal
          open={unassignModalOpen}
          onClose={() => setUnassignModalOpen(false)}
          eyebrow="Operación docente"
          title="Quitar tutor"
          warning="¿Estás seguro de que deseas desasignar al tutor actual?"
          actions={
            <>
              <button className="lk-btn lk-btn--secondary" onClick={() => setUnassignModalOpen(false)}>Cancelar</button>
              <button className="lk-btn lk-btn--ghost-danger" onClick={handleUnassignTutor}>Sí, quitar</button>
            </>
          }
        >
          <p>El grupo quedará sin tutor temporalmente.</p>
        </RoleModal>
        
        <StateChangeModal
          open={stateModal.open && Boolean(stateModal.group)}
          onClose={closeStateModal}
          onConfirm={async () => {
            if (!stateModal.group) return;
            const success = await handleStateChange(stateModal.group.id, stateModal.nextState);
            if (success) closeStateModal();
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