import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  GraduationCap,
  PencilLine,
  QrCode,
  RefreshCw,
  Search,
  Shuffle,
  UserCheck2,
  UserPlus2,
  UserRoundX,
  UsersRound,
  X,
} from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import AdminSelect from "../../components/common/AdminSelect";
import Pagination from "../../components/common/Pagination";
import RoleModal from "../../components/common/RoleModal";
import StateChangeModal from "../../components/common/StateChangeModal";
import StatusBadge from "../../components/common/StatusBadge";
import DashboardMetricCard from "../../components/dashboard/DashboardMetricCard";
import DashboardPanel from "../../components/dashboard/DashboardPanel";
import AppShell from "../../components/layout/AppShell";
import StudentQrPreview from "../../components/account/StudentQrPreview";
import adminStudentsService from "../../services/adminStudentsService";
import "../../styles/role-dashboard.css";

const STATUS_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "activo", label: "Activos" },
  { value: "inactivo", label: "Inactivos" },
];

const INITIAL_STUDENT_FORM = {
  nombre: "",
  edad: "",
  grupo_id: "",
};

const PAGE_SIZE = 10;
const GROUP_FILTER_ALL = "";
const GROUP_FILTER_WITHOUT_GROUP = "__without_group";

const getStudentState = (student) => student?.estado || "activo";
const getStudentGroupId = (student) => String(student?.grupo_id ?? "");

function buildStudentsSummary(students) {
  const activeStudents = students.filter((student) => getStudentState(student) === "activo").length;
  const inactiveStudents = students.filter((student) => getStudentState(student) === "inactivo").length;
  const openSessions = students.filter((student) => student.sesion_activa === true).length;
  const withoutGroup = students.filter((student) => !student.grupo_id).length;

  return {
    total: students.length,
    activeStudents,
    inactiveStudents,
    openSessions,
    withoutGroup,
  };
}

function normalizeStudentPayload(form) {
  return {
    nombre: form.nombre.trim(),
    edad: Number(form.edad),
    ...(form.grupo_id ? { grupo_id: Number(form.grupo_id) } : {}),
  };
}

function resolveGroupName(student, groupsById) {
  return student?.grupo_nombre || groupsById.get(getStudentGroupId(student))?.nombre || "Sin grupo";
}

function matchesStudentSearch(student, normalizedSearch, groupsById) {
  if (!normalizedSearch) {
    return true;
  }

  const groupName = resolveGroupName(student, groupsById).toLowerCase();
  const isNumericSearch = /^\d+$/.test(normalizedSearch);

  if (isNumericSearch) {
    return (
      String(student.id ?? "") === normalizedSearch ||
      String(student.edad ?? "") === normalizedSearch
    );
  }

  return (
    student.nombre?.toLowerCase().includes(normalizedSearch) ||
    groupName.includes(normalizedSearch)
  );
}

function getStudentStateCopy(nextState) {
  if (nextState === "inactivo") {
    return {
      eyebrow: "Cambio de estado",
      title: "Desactivar estudiante",
      warning: "Esta acción saca al estudiante de la operación diaria del portal.",
      impactTitle: "Impacto inmediato",
      impactItems: [
        "No podrá entrar a nuevas actividades mientras permanezca inactivo.",
        "Si tiene una sesión abierta, se cerrará para evitar resultados fuera de contexto.",
        "Su historial académico se conserva y el grupo asignado no se pierde.",
      ],
      detailsTitle: "Cuándo conviene usarlo",
      detailsItems: [
        "Cuando el estudiante salió temporalmente de la institución.",
        "Cuando necesitas pausar su acceso sin borrar su información.",
      ],
      confirmLabel: "Sí, desactivar estudiante",
      confirmVariant: "danger",
    };
  }

  return {
    eyebrow: "Reactivación",
    title: "Reactivar estudiante",
    warning: "La cuenta volverá a quedar disponible para el contexto institucional actual.",
    impactTitle: "Qué recupera",
    impactItems: [
      "Podrá volver a entrar a actividades cuando el tutor abra la clase.",
      "Conserva su grupo y el historial previo dentro de la institución.",
      "No reabre sesiones viejas; solo vuelve a quedar habilitado para las próximas.",
    ],
    detailsTitle: "Antes de confirmar",
    detailsItems: [
      "Verifica que el estudiante siga en el grupo correcto.",
      "Si cambió de salón o sede, ajusta primero su grupo antes de reactivarlo.",
    ],
    confirmLabel: "Sí, reactivar estudiante",
    confirmVariant: "primary",
  };
}

export default function EstudiantesPage() {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingStudent, setIsSavingStudent] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);
  const [studentModal, setStudentModal] = useState({
    open: false,
    mode: "create",
    form: INITIAL_STUDENT_FORM,
  });
  const [moveModal, setMoveModal] = useState({ open: false, groupId: "" });
  const [qrModal, setQrModal] = useState({
    open: false,
    token: "",
    studentName: "",
    isLoading: false,
  });
  const [stateModal, setStateModal] = useState({
    open: false,
    nextState: "",
    student: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const hasLoadedFilters = useRef(false);

  const groupsById = useMemo(
    () => new Map(groups.map((group) => [String(group.id_grupo ?? group.id ?? ""), group])),
    [groups]
  );
  const groupOptions = useMemo(
    () =>
      groups.map((group) => ({
        value: String(group.id_grupo ?? group.id),
        label: group.nombre,
      })),
    [groups]
  );
  const assignableGroupOptions = useMemo(
    () =>
      groups.map((group) => {
        const isArchived = group.activo === false;
        return {
          value: String(group.id_grupo ?? group.id),
          label: group.nombre,
          description: isArchived ? "Archivado - no disponible para estudiantes" : undefined,
          disabled: isArchived,
        };
      }),
    [groups]
  );

  const visibleStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return students.filter((student) => {
      const state = getStudentState(student);
      const matchesFilter = statusFilter === "todos" || state === statusFilter;
      const matchesGroup =
        selectedGroupId === GROUP_FILTER_ALL ||
        (selectedGroupId === GROUP_FILTER_WITHOUT_GROUP
          ? !student.grupo_id
          : getStudentGroupId(student) === selectedGroupId);
      const matchesSearch = matchesStudentSearch(student, normalizedSearch, groupsById);
      return matchesFilter && matchesGroup && matchesSearch;
    });
  }, [groupsById, searchTerm, selectedGroupId, statusFilter, students]);

  const summary = useMemo(() => buildStudentsSummary(students), [students]);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return visibleStudents.slice(start, start + PAGE_SIZE);
  }, [currentPage, visibleStudents]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedGroupId, statusFilter]);

  const loadStudents = async (groupId = selectedGroupId, { clearFeedback = true } = {}) => {
    setIsLoading(true);
    try {
      const shouldFilterByGroup =
        groupId && groupId !== GROUP_FILTER_WITHOUT_GROUP;
      const data = await adminStudentsService.listStudents({
        groupId: shouldFilterByGroup ? Number(groupId) : undefined,
        includeInactive: true,
      });
      setStudents(data);
      if (clearFeedback) {
        setFeedback(null);
      }
    } catch (error) {
      setStudents([]);
      setFeedback({
        type: "error",
        message: error.message || "No fue posible cargar los estudiantes de la institución.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [groupsData, studentsData] = await Promise.all([
        adminStudentsService.listGroups(),
        adminStudentsService.listStudents({ includeInactive: true }),
      ]);
      setGroups(groupsData);
      setStudents(studentsData);
      setFeedback(null);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible preparar el módulo de estudiantes.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!hasLoadedFilters.current) {
      hasLoadedFilters.current = true;
      return;
    }
    loadStudents(selectedGroupId);
  }, [selectedGroupId]);

  const openCreateModal = () => {
    setStudentModal({
      open: true,
      mode: "create",
      form: {
        ...INITIAL_STUDENT_FORM,
        grupo_id:
          selectedGroupId && selectedGroupId !== GROUP_FILTER_WITHOUT_GROUP
            ? selectedGroupId
            : "",
      },
    });
  };

  const openEditModal = (student) => {
    setStudentModal({
      open: true,
      mode: "edit",
      form: {
        nombre: student.nombre || "",
        edad: String(student.edad ?? ""),
        grupo_id: getStudentGroupId(student),
      },
    });
  };

  const closeStudentModal = () => {
    setStudentModal({ open: false, mode: "create", form: INITIAL_STUDENT_FORM });
  };

  const updateStudentForm = (field, value) => {
    setStudentModal((current) => ({
      ...current,
      form: {
        ...current.form,
        [field]: value,
      },
    }));
  };

  const handleStudentSubmit = async () => {
    const { nombre, edad } = studentModal.form;
    if (!nombre.trim() || !edad) {
      setFeedback({
        type: "error",
        message: "Completa nombre y edad antes de guardar el estudiante.",
      });
      return;
    }
    const parsedAge = Number(edad);
    if (!Number.isInteger(parsedAge) || parsedAge <= 0) {
      setFeedback({
        type: "error",
        message: "La edad debe ser un numero entero mayor que cero.",
      });
      return;
    }
    if (studentModal.mode === "edit" && !selectedStudentDetail) {
      setFeedback({
        type: "error",
        message: "Selecciona un estudiante antes de guardar cambios.",
      });
      return;
    }
    setIsSavingStudent(true);
    try {
      if (studentModal.mode === "create") {
        const createdStudent = await adminStudentsService.createStudent(
          normalizeStudentPayload(studentModal.form)
        );
        closeStudentModal();
        await loadStudents(selectedGroupId, { clearFeedback: false });
        setFeedback({
          type: "success",
          message: `Estudiante ${createdStudent?.nombre || nombre.trim()} creado correctamente.`,
        });
      } else {
        const currentGroupId = getStudentGroupId(selectedStudentDetail);
        const nextGroupId = studentModal.form.grupo_id;
        await adminStudentsService.updateStudent(selectedStudentDetail.id, {
          nombre: nombre.trim(),
          edad: parsedAge,
        });
        if (nextGroupId && nextGroupId !== currentGroupId) {
          await adminStudentsService.changeStudentGroup(selectedStudentDetail.id, Number(nextGroupId));
        }
        closeStudentModal();
        await loadStudents(selectedGroupId, { clearFeedback: false });
        setFeedback({
          type: "success",
          message:
            nextGroupId && nextGroupId !== currentGroupId
              ? "Datos y grupo del estudiante actualizados correctamente."
              : "Datos del estudiante actualizados correctamente.",
        });
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible guardar el estudiante.",
      });
    } finally {
      setIsSavingStudent(false);
    }
  };

  const openMoveModal = (student) => {
    setMoveModal({
      open: true,
      groupId: getStudentGroupId(student),
    });
  };

  const closeMoveModal = () => {
    setMoveModal({ open: false, groupId: "" });
  };

  const handleMoveStudent = async () => {
    if (!selectedStudentDetail) return;
    if (!moveModal.groupId) {
      setFeedback({
        type: "error",
        message: "Selecciona el grupo destino antes de mover al estudiante.",
      });
      return;
    }
    try {
      await adminStudentsService.changeStudentGroup(selectedStudentDetail.id, Number(moveModal.groupId));
      setFeedback({
        type: "success",
        message: "El estudiante fue movido al nuevo grupo.",
      });
      closeMoveModal();
      await loadStudents(selectedGroupId, { clearFeedback: false });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible cambiar el grupo del estudiante.",
      });
    }
  };

  const handleStudentStateChange = async (student, nextState) => {
    try {
      const shouldResetFilter = statusFilter !== "todos" && statusFilter !== nextState;
      if (nextState === "activo") {
        await adminStudentsService.reactivateStudent(student.id);
      } else if (nextState === "inactivo") {
        await adminStudentsService.deactivateStudent(student.id);
      } else {
        setFeedback({
          type: "error",
          message: "El módulo de estudiantes solo permite activar o desactivar cuentas.",
        });
        return false;
      }
      if (shouldResetFilter) {
        setStatusFilter("todos");
      }
      setFeedback({
        type: "success",
        message: nextState === "activo"
          ? "Estudiante reactivado correctamente."
          : "Estudiante desactivado correctamente.",
      });
      await loadStudents(selectedGroupId, { clearFeedback: false });
      return true;
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible actualizar el estado del estudiante.",
      });
      return false;
    }
  };

  const openStateModal = (student, nextState) => {
    setStateModal({ open: true, nextState, student });
  };

  const closeStateModal = () => {
    setStateModal({ open: false, nextState: "", student: null });
  };

  const handleOpenQr = async (student) => {
    setQrModal({
      open: true,
      token: "",
      studentName: student.nombre || "estudiante",
      isLoading: true,
    });
    try {
      const qrData = await adminStudentsService.getStudentQr(student.id);
      setQrModal((current) => ({
        ...current,
        token: qrData?.qr_token || "",
        isLoading: false,
      }));
    } catch (error) {
      setQrModal((current) => ({
        ...current,
        token: "",
        isLoading: false,
      }));
      setFeedback({
        type: "error",
        message: error.message || "No fue posible generar el código QR del estudiante.",
      });
    }
  };

  const handleViewDetail = (student) => {
    setSelectedStudentDetail(student);
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

      <div className="lk-role-page__select">
        <AdminSelect
          value={selectedGroupId}
          onChange={setSelectedGroupId}
          options={[
            { value: GROUP_FILTER_ALL, label: "Todos los grupos" },
            { value: GROUP_FILTER_WITHOUT_GROUP, label: "Sin grupo" },
            ...groupOptions,
          ]}
          placeholder="Todos los grupos"
        />
      </div>

      <div className="lk-role-page__search">
        <Search size={18} className="lk-search-icon" />
        <input
          type="search"
          className="lk-search-input"
          placeholder="Buscar por nombre o grupo. ID/edad exactos."
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
        <button className="lk-btn lk-btn--icon" onClick={() => loadStudents()} title="Recargar">
          <RefreshCw size={16} />
        </button>
        <button className="lk-btn lk-btn--icon" onClick={() => setShowMetricsModal(true)} title="Ver estadísticas">
          <BarChart3 size={16} />
        </button>
        <button className="lk-btn lk-btn--primary" onClick={openCreateModal}>
          <UserPlus2 size={16} />
          <span>Nuevo estudiante</span>
        </button>
      </div>
    </div>
  );

  return (
    <AppShell
      title="Estudiantes"
      description="Organiza el alumnado de tu institución, mueve grupos cuando haga falta y comparte QR sin salir del portal."
      toolbar={toolbar}
    >
      <div className="lk-role-dashboard lk-role-dashboard--fill lk-admin-dashboard">

        {feedback && <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div>}

        <DashboardPanel
          title="Estudiantes"
          aside={<UsersRound size={18} color="var(--lk-purple)" />}
          compact
        >
          {!isLoading && visibleStudents.length === 0 ? (
            <EmptyState
              title="No hay estudiantes para esta vista"
              description="Ajusta el estado, la búsqueda o el grupo para encontrar otros casos."
            />
          ) : null}

          {visibleStudents.length > 0 && (
            <>
              <div className="lk-table-wrap lk-role-table--desktop">
                <table className="lk-table">
                  <thead>
                    <tr>
                      <th>Estudiante</th>
                      <th>Grupo</th>
                      <th>Edad</th>
                      <th>Estado</th>
                      <th>Clase</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <strong>{student.nombre}</strong>
                          <p className="lk-muted">ID #{student.id}</p>
                        </td>
                        <td>{resolveGroupName(student, groupsById)}</td>
                        <td>{student.edad} años</td>
                        <td>
                          <StatusBadge label={getStudentState(student)} variant={getStudentState(student)} />
                        </td>
                        <td>
                          <StatusBadge
                            label={student.sesion_activa ? "abierta" : "cerrada"}
                            variant={student.sesion_activa ? "activo" : "inactivo"}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="lk-btn lk-btn--secondary"
                            onClick={() => handleViewDetail(student)}
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
                {paginatedStudents.map((student) => (
                  <article key={student.id} className="lk-role-mobile-card">
                    <header className="lk-role-mobile-card__header">
                      <div>
                        <h3 className="lk-role-mobile-card__title">{student.nombre}</h3>
                        <p className="lk-role-mobile-card__subtitle">
                          {student.edad} años · {resolveGroupName(student, groupsById)}
                        </p>
                      </div>
                      <StatusBadge label={getStudentState(student)} variant={getStudentState(student)} />
                    </header>

                    <dl className="lk-role-entity-card__meta">
                      <div>
                        <dt>Clase</dt>
                        <dd>{student.sesion_activa ? "Abierta" : "Cerrada"}</dd>
                      </div>
                      <div>
                        <dt>ID</dt>
                        <dd>#{student.id}</dd>
                      </div>
                    </dl>

                    <button
                      type="button"
                      className="lk-btn lk-btn--secondary"
                      onClick={() => handleViewDetail(student)}
                    >
                      Ver detalle
                    </button>
                  </article>
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                itemLabel="estudiante"
                itemPluralLabel="estudiantes"
                onPageChange={setCurrentPage}
                pageSize={PAGE_SIZE}
                totalItems={visibleStudents.length}
              />
            </>
          )}
        </DashboardPanel>

        <RoleModal
          open={showMetricsModal}
          onClose={() => setShowMetricsModal(false)}
          eyebrow="Estadísticas"
          title="Resumen de Estudiantes"
          width={900}
          overlayClassName="lk-admin-modal"
          actions={
            <button className="lk-btn lk-btn--primary" onClick={() => setShowMetricsModal(false)}>
              Cerrar
            </button>
          }
        >
          <div className="lk-role-dashboard__metrics">
            <DashboardMetricCard icon={UsersRound} label="Total del contexto" value={summary.total} description="Cuenta total" tone="gray" />
            <DashboardMetricCard icon={UserCheck2} label="Activos" value={summary.activeStudents} description="Listos para jugar" tone="gray" />
            <DashboardMetricCard icon={UserRoundX} label="Sin grupo" value={summary.withoutGroup} description="Ubicarlos pronto" tone="gray" />
            <DashboardMetricCard icon={GraduationCap} label="En clase" value={summary.openSessions} description="Sesión habilitada" tone="gray" />
          </div>
        </RoleModal>

        <RoleModal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          eyebrow="Detalle del estudiante"
          title={selectedStudentDetail?.nombre || "Estudiante"}
          width={540}
          overlayClassName="lk-admin-modal"
          actions={
            <div className="lk-modal-actions">
              <button className="lk-btn lk-btn--secondary" onClick={() => setShowDetailModal(false)}>
                Cerrar
              </button>
              <button className="lk-btn lk-btn--secondary" onClick={() => {
                setShowDetailModal(false);
                openEditModal(selectedStudentDetail);
              }}>
                <PencilLine size={16} /> Editar
              </button>
              <button className="lk-btn lk-btn--secondary" onClick={() => {
                setShowDetailModal(false);
                openMoveModal(selectedStudentDetail);
              }}>
                <Shuffle size={16} /> Cambiar grupo
              </button>
              <button className="lk-btn lk-btn--secondary" onClick={() => {
                setShowDetailModal(false);
                handleOpenQr(selectedStudentDetail);
              }}>
                <QrCode size={16} /> Ver QR
              </button>
              {getStudentState(selectedStudentDetail) === "activo" ? (
                <button className="lk-btn lk-btn--ghost-danger" onClick={() => {
                  setShowDetailModal(false);
                  openStateModal(selectedStudentDetail, "inactivo");
                }}>
                  <UserRoundX size={16} /> Desactivar
                </button>
              ) : (
                <button className="lk-btn lk-btn--primary" onClick={() => {
                  setShowDetailModal(false);
                  openStateModal(selectedStudentDetail, "activo");
                }}>
                  <UserCheck2 size={16} /> Reactivar
                </button>
              )}
            </div>
          }
        >
          {selectedStudentDetail && (
            <div className="lk-admin-detail-content">
              <div className="lk-detail-field">
                <label>Nombre</label>
                <p><strong>{selectedStudentDetail.nombre}</strong></p>
              </div>
              <div className="lk-detail-field">
                <label>ID</label>
                <p>#{selectedStudentDetail.id}</p>
              </div>
              <div className="lk-detail-field">
                <label>Edad</label>
                <p>{selectedStudentDetail.edad} años</p>
              </div>
              <div className="lk-detail-field">
                <label>Grupo</label>
                <p>{resolveGroupName(selectedStudentDetail, groupsById)}</p>
              </div>
              <div className="lk-detail-field">
                <label>Estado</label>
                <StatusBadge label={getStudentState(selectedStudentDetail)} variant={getStudentState(selectedStudentDetail)} />
              </div>
              <div className="lk-detail-field">
                <label>Clase</label>
                <StatusBadge
                  label={selectedStudentDetail.sesion_activa ? "abierta" : "cerrada"}
                  variant={selectedStudentDetail.sesion_activa ? "activo" : "inactivo"}
                />
              </div>
            </div>
          )}
        </RoleModal>

        <RoleModal
          open={studentModal.open}
          onClose={closeStudentModal}
          eyebrow={studentModal.mode === "create" ? "Alta institucional" : "Ajuste de perfil"}
          title={studentModal.mode === "create" ? "Nuevo estudiante" : "Editar estudiante"}
          overlayClassName="lk-admin-modal"
          actions={
            <>
              <button className="lk-btn lk-btn--secondary" onClick={closeStudentModal}>Cancelar</button>
              <button className="lk-btn lk-btn--primary" onClick={handleStudentSubmit} disabled={isSavingStudent}>
                {isSavingStudent ? "Guardando..." : "Guardar"}
              </button>
            </>
          }
        >
          <div className="lk-form-grid">
            <div className="lk-form-row">
              <div className="lk-field">
                <label>Nombre</label>
                <input type="text" value={studentModal.form.nombre} onChange={(e) => updateStudentForm("nombre", e.target.value)} />
              </div>
              <div className="lk-field">
                <label>Edad</label>
                <input type="number" min="1" value={studentModal.form.edad} onChange={(e) => updateStudentForm("edad", e.target.value)} />
              </div>
            </div>
            {studentModal.mode === "create" && (
              <div className="lk-field">
                <label>Grupo inicial</label>
                <AdminSelect
                  value={studentModal.form.grupo_id}
                  onChange={(value) => updateStudentForm("grupo_id", value)}
                  options={[{ value: "", label: "Sin grupo" }, ...assignableGroupOptions]}
                  placeholder="Sin grupo"
                />
              </div>
            )}
            {studentModal.mode === "edit" && (
              <div className="lk-field">
                <label>Grupo</label>
                <AdminSelect
                  value={studentModal.form.grupo_id}
                  onChange={(value) => updateStudentForm("grupo_id", value)}
                  options={assignableGroupOptions}
                  placeholder="Selecciona un grupo"
                  emptyText="No hay grupos activos disponibles"
                />
              </div>
            )}
          </div>
        </RoleModal>

        <RoleModal
          open={moveModal.open && Boolean(selectedStudentDetail)}
          onClose={closeMoveModal}
          eyebrow="Reasignación"
          title="Mover estudiante de grupo"
          width={640}
          warning="Cambiar de grupo cerrará cualquier sesión activa."
          overlayClassName="lk-admin-modal"
          actions={
            <>
              <button className="lk-btn lk-btn--secondary" onClick={closeMoveModal}>Cancelar</button>
              <button className="lk-btn lk-btn--primary" onClick={handleMoveStudent}>Confirmar</button>
            </>
          }
        >
          {selectedStudentDetail && (
            <>
              <div className="lk-field">
                <label>Estudiante</label>
                <p>{selectedStudentDetail.nombre}</p>
              </div>
              <div className="lk-field">
                <label>Nuevo grupo</label>
                <AdminSelect
                  value={moveModal.groupId}
                  onChange={(value) => setMoveModal((prev) => ({ ...prev, groupId: value }))}
                  options={assignableGroupOptions}
                  placeholder="Selecciona un grupo"
                />
              </div>
            </>
          )}
        </RoleModal>

        <StateChangeModal
          open={stateModal.open && Boolean(stateModal.student)}
          onClose={closeStateModal}
          onConfirm={async () => {
            if (!stateModal.student) return;
            const ok = await handleStudentStateChange(stateModal.student, stateModal.nextState);
            if (ok) closeStateModal();
          }}
          entityLabel={stateModal.student ? `${stateModal.student.nombre}` : ""}
          currentState={stateModal.student ? getStudentState(stateModal.student) : "activo"}
          nextState={stateModal.nextState}
          overlayClassName="lk-admin-modal"
          {...getStudentStateCopy(stateModal.nextState)}
        />

        <RoleModal
          open={qrModal.open}
          onClose={() => setQrModal({ open: false, token: "", studentName: "", isLoading: false })}
          eyebrow="Acceso del estudiante"
          title="Código QR"
          overlayClassName="lk-admin-modal"
        >
          {qrModal.isLoading ? (
            <p>Cargando...</p>
          ) : qrModal.token ? (
            <StudentQrPreview token={qrModal.token} studentName={qrModal.studentName} />
          ) : (
            <p>No fue posible cargar el código QR.</p>
          )}
        </RoleModal>
      </div>
    </AppShell>
  );
}
