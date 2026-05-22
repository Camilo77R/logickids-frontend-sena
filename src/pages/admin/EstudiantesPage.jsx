import { useEffect, useMemo, useRef, useState } from "react";
import {
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
import RoleModal from "../../components/common/RoleModal";
import StateChangeModal from "../../components/common/StateChangeModal";
import StatusBadge from "../../components/common/StatusBadge";
import DashboardMetricCard from "../../components/dashboard/DashboardMetricCard";
import DashboardPanel from "../../components/dashboard/DashboardPanel";
import AppShell from "../../components/layout/AppShell";
import StudentQrPreview from "../../components/account/StudentQrPreview";
import adminStudentsService from "../../services/adminStudentsService";

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
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
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
  const hasLoadedFilters = useRef(false);

  const groupsById = useMemo(
    () =>
      new Map(groups.map((group) => [String(group.id_grupo ?? group.id ?? ""), group])),
    [groups]
  );

  const visibleStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const state = getStudentState(student);
      const matchesFilter = statusFilter === "todos" || state === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        student.nombre?.toLowerCase().includes(normalizedSearch) ||
        String(student.edad ?? "").includes(normalizedSearch) ||
        resolveGroupName(student, groupsById).toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [groupsById, searchTerm, statusFilter, students]);

  const selectedStudent = useMemo(
    () => visibleStudents.find((student) => student.id === selectedStudentId) || null,
    [selectedStudentId, visibleStudents]
  );

  const summary = useMemo(() => buildStudentsSummary(students), [students]);

  const syncSelectedStudent = (nextStudents) => {
    if (nextStudents.length === 0) {
      setSelectedStudentId(null);
      return;
    }

    const hasCurrentSelection = nextStudents.some((student) => student.id === selectedStudentId);
    if (!hasCurrentSelection) {
      setSelectedStudentId(nextStudents[0].id);
    }
  };

  const loadStudents = async (groupId = selectedGroupId) => {
    setIsLoading(true);

    try {
      const data = await adminStudentsService.listStudents({
        groupId: groupId ? Number(groupId) : undefined,
        includeInactive: true,
      });

      setStudents(data);
      syncSelectedStudent(data);
      setFeedback(null);
    } catch (error) {
      setStudents([]);
      setSelectedStudentId(null);
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
      if (studentsData.length > 0) {
        setSelectedStudentId(studentsData[0].id);
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId]);

  const openCreateModal = () => {
    setStudentModal({
      open: true,
      mode: "create",
      form: {
        ...INITIAL_STUDENT_FORM,
        grupo_id: selectedGroupId || "",
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

    try {
      if (studentModal.mode === "create") {
        const createdStudent = await adminStudentsService.createStudent(
          normalizeStudentPayload(studentModal.form)
        );
        setFeedback({
          type: "success",
          message: `Estudiante ${createdStudent?.nombre || nombre.trim()} creado correctamente.`,
        });
      } else if (selectedStudent) {
        await adminStudentsService.updateStudent(selectedStudent.id, {
          nombre: nombre.trim(),
          edad: Number(edad),
        });
        setFeedback({
          type: "success",
          message: "Datos del estudiante actualizados correctamente.",
        });
      }

      closeStudentModal();
      await loadStudents();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible guardar el estudiante.",
      });
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
    if (!selectedStudent) return;

    if (!moveModal.groupId) {
      setFeedback({
        type: "error",
        message: "Selecciona el grupo destino antes de mover al estudiante.",
      });
      return;
    }

    try {
      await adminStudentsService.changeStudentGroup(selectedStudent.id, Number(moveModal.groupId));
      setFeedback({
        type: "success",
        message: "El estudiante fue movido al nuevo grupo.",
      });
      closeMoveModal();
      await loadStudents();
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
        message:
          nextState === "activo"
            ? "Estudiante reactivado correctamente."
            : shouldResetFilter
              ? "Estudiante desactivado correctamente. La vista volvió a “Todos” para que sigas viendo el cambio."
              : "Estudiante desactivado correctamente.",
      });

      await loadStudents();
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
    setStateModal({
      open: true,
      nextState,
      student,
    });
  };

  const closeStateModal = () => {
    setStateModal({
      open: false,
      nextState: "",
      student: null,
    });
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
            placeholder="Buscar por nombre, edad o grupo"
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
          <button type="button" className="lk-btn lk-btn--secondary" onClick={() => loadStudents()}>
            <RefreshCw size={16} aria-hidden="true" />
            Recargar
          </button>
          <button type="button" className="lk-btn lk-btn--primary" onClick={openCreateModal}>
            <UserPlus2 size={16} aria-hidden="true" />
            Nuevo estudiante
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <AppShell
      title="Estudiantes"
      description="Organiza el alumnado de tu institución, mueve grupos cuando haga falta y comparte QR sin salir del portal."
      actions={pageActions}
    >
      <div className="lk-role-dashboard">
        {feedback ? <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div> : null}

        <section className="lk-role-dashboard__metrics">
          <DashboardMetricCard
            icon={UsersRound}
            label="Total del contexto"
            value={isLoading ? "..." : summary.total}
            description="Cuenta total del grupo o institución cargada, sin perder de vista a los inactivos."
            tone="purple"
          />
          <DashboardMetricCard
            icon={UserCheck2}
            label="Activos"
            value={isLoading ? "..." : summary.activeStudents}
            description="Listos para entrar al juego cuando la clase se abra."
            tone="gold"
          />
          <DashboardMetricCard
            icon={UserRoundX}
            label="Sin grupo"
            value={isLoading ? "..." : summary.withoutGroup}
            description="Conviene ubicarlos antes de la próxima sesión."
            tone="orange"
          />
          <DashboardMetricCard
            icon={GraduationCap}
            label="En clase"
            value={isLoading ? "..." : summary.openSessions}
            description="Tienen sesión habilitada desde el contexto actual."
            tone="rose"
          />
        </section>

        <section className="lk-role-section-grid">
          <DashboardPanel
            eyebrow="Directorio estudiantil"
            title="Lista institucional"
            subtitle="Explora el grupo actual de cada estudiante y abre su detalle cuando necesites actuar."
            aside={<UsersRound size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            <div className="lk-role-page__toolbar">
              <div>
                <span className="lk-role-panel__eyebrow">
                  {selectedGroupId
                    ? groupsById.get(String(selectedGroupId))?.nombre || "Grupo seleccionado"
                    : "Todos los grupos"}
                </span>
                <h3 className="lk-role-panel__title">Filtros por grupo</h3>
              </div>

              <div className="lk-field" style={{ minWidth: "min(260px, 100%)" }}>
                <label htmlFor="admin-students-group-filter">Grupo</label>
                <select
                  id="admin-students-group-filter"
                  value={selectedGroupId}
                  onChange={(event) => setSelectedGroupId(event.target.value)}
                >
                  <option value="">Todos los grupos</option>
                  {groups.map((group) => (
                    <option key={String(group.id_grupo ?? group.id)} value={String(group.id_grupo ?? group.id)}>
                      {group.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {!isLoading && visibleStudents.length === 0 ? (
              <EmptyState
                title="No hay estudiantes para esta vista"
                description="Ajusta el estado, la búsqueda o el grupo para encontrar otros casos."
              />
            ) : null}

            {visibleStudents.length > 0 ? (
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
                      {visibleStudents.map((student) => (
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
                              onClick={() => setSelectedStudentId(student.id)}
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
                  {visibleStudents.map((student) => (
                    <article
                      key={student.id}
                      className={`lk-role-mobile-card${selectedStudentId === student.id ? " is-selected" : ""}`}
                    >
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
                        onClick={() => setSelectedStudentId(student.id)}
                      >
                        Ver detalle
                      </button>
                    </article>
                  ))}
                </div>

                <div className="lk-role-table-footer">
                  Mostrando {visibleStudents.length} de {students.length} estudiante(s) en esta vista.
                </div>
              </>
            ) : null}
          </DashboardPanel>

          <DashboardPanel
            eyebrow="Gestión"
            title={selectedStudent ? selectedStudent.nombre : "Selecciona un estudiante"}
            subtitle="Desde aquí puedes ajustar datos básicos, moverlo de grupo o compartir su acceso QR."
            aside={<GraduationCap size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            {!selectedStudent ? (
              <EmptyState
                title="Aún no hay estudiante seleccionado"
                description="Elige una fila de la lista para ver contexto y acciones disponibles."
              />
            ) : (
              <div className="lk-role-detail-stack">
                {!selectedStudent.grupo_id ? (
                  <div className="lk-role-banner lk-role-banner--warning">
                    <div className="lk-role-banner__content">
                      <strong>Estudiante sin grupo</strong>
                      <p>Asigna un grupo antes de preparar su próxima sesión de clase.</p>
                    </div>
                  </div>
                ) : null}

                <div className="lk-role-info-grid">
                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Estudiante</span>
                    <strong className="lk-role-info-card__value">{selectedStudent.nombre}</strong>
                    <p className="lk-role-info-card__hint">ID #{selectedStudent.id}</p>
                  </article>

                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Edad y estado</span>
                    <strong className="lk-role-info-card__value">
                      {selectedStudent.edad} años · {getStudentState(selectedStudent)}
                    </strong>
                    <p className="lk-role-info-card__hint">
                      {selectedStudent.sesion_activa
                        ? "Tiene sesión habilitada en este momento."
                        : "Su sesión está cerrada por ahora."}
                    </p>
                  </article>

                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Grupo actual</span>
                    <strong className="lk-role-info-card__value">
                      {resolveGroupName(selectedStudent, groupsById)}
                    </strong>
                    <p className="lk-role-info-card__hint">
                      Los movimientos quedan reflejados en el historial institucional.
                    </p>
                  </article>
                </div>

                <div className="lk-role-inline-actions">
                  <button
                    type="button"
                    className="lk-btn lk-btn--secondary"
                    onClick={() => handleOpenQr(selectedStudent)}
                  >
                    <QrCode size={16} aria-hidden="true" />
                    Ver QR
                  </button>
                  <button
                    type="button"
                    className="lk-btn lk-btn--secondary"
                    onClick={() => openEditModal(selectedStudent)}
                  >
                    <PencilLine size={16} aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="lk-btn lk-btn--secondary"
                    onClick={() => openMoveModal(selectedStudent)}
                  >
                    <Shuffle size={16} aria-hidden="true" />
                    Cambiar grupo
                  </button>
                  {getStudentState(selectedStudent) === "activo" ? (
                    <button
                      type="button"
                      className="lk-btn lk-btn--ghost-danger"
                      onClick={() => openStateModal(selectedStudent, "inactivo")}
                    >
                      <UserRoundX size={16} aria-hidden="true" />
                      Desactivar
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="lk-btn lk-btn--primary"
                      onClick={() => openStateModal(selectedStudent, "activo")}
                    >
                      <UserCheck2 size={16} aria-hidden="true" />
                      Reactivar
                    </button>
                  )}
                </div>
              </div>
            )}
          </DashboardPanel>
        </section>

        <RoleModal
          open={studentModal.open}
          onClose={closeStudentModal}
          eyebrow={studentModal.mode === "create" ? "Alta institucional" : "Ajuste de perfil"}
          title={studentModal.mode === "create" ? "Nuevo estudiante" : "Editar estudiante"}
          actions={
            <>
              <button type="button" className="lk-btn lk-btn--secondary" onClick={closeStudentModal}>
                Cancelar
              </button>
              <button type="button" className="lk-btn lk-btn--primary" onClick={handleStudentSubmit}>
                Guardar
              </button>
            </>
          }
        >
          <div className="lk-form-grid">
            <div className="lk-form-row">
              <div className="lk-field">
                <label htmlFor="student-name">Nombre</label>
                <input
                  id="student-name"
                  type="text"
                  value={studentModal.form.nombre}
                  onChange={(event) => updateStudentForm("nombre", event.target.value)}
                  placeholder="Ejemplo: Sara Gómez"
                />
              </div>

              <div className="lk-field">
                <label htmlFor="student-age">Edad</label>
                <input
                  id="student-age"
                  type="number"
                  min="1"
                  value={studentModal.form.edad}
                  onChange={(event) => updateStudentForm("edad", event.target.value)}
                  placeholder="7"
                />
              </div>
            </div>

            {studentModal.mode === "create" ? (
              <div className="lk-field">
                <label htmlFor="student-group">Grupo inicial</label>
                <select
                  id="student-group"
                  value={studentModal.form.grupo_id}
                  onChange={(event) => updateStudentForm("grupo_id", event.target.value)}
                >
                  <option value="">Sin grupo por ahora</option>
                  {groups.map((group) => (
                    <option key={String(group.id_grupo ?? group.id)} value={String(group.id_grupo ?? group.id)}>
                      {group.nombre}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>
        </RoleModal>

        <RoleModal
          open={moveModal.open && Boolean(selectedStudent)}
          onClose={closeMoveModal}
          eyebrow="Reasignación"
          title="Mover estudiante de grupo"
          warning="Cambiar de grupo cerrará cualquier sesión activa, moverá el contexto del estudiante y dejará trazabilidad en el historial institucional."
          actions={
            <>
              <button type="button" className="lk-btn lk-btn--secondary" onClick={closeMoveModal}>
                Cancelar
              </button>
              <button type="button" className="lk-btn lk-btn--primary" onClick={handleMoveStudent}>
                Confirmar movimiento
              </button>
            </>
          }
        >
          {selectedStudent ? (
            <>
              <div className="lk-role-modal__field">
                <strong>Estudiante seleccionado</strong>
                <p>{selectedStudent.nombre}</p>
              </div>

              <div className="lk-field">
                <label htmlFor="move-student-group">Nuevo grupo</label>
                <select
                  id="move-student-group"
                  value={moveModal.groupId}
                  onChange={(event) =>
                    setMoveModal((current) => ({ ...current, groupId: event.target.value }))
                  }
                >
                  <option value="">Selecciona un grupo</option>
                  {groups.map((group) => (
                    <option key={String(group.id_grupo ?? group.id)} value={String(group.id_grupo ?? group.id)}>
                      {group.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <p className="lk-role-modal__muted">
                El movimiento deja trazabilidad y reinicia la sesión activa del estudiante.
              </p>
            </>
          ) : null}
        </RoleModal>

        <StateChangeModal
          open={stateModal.open && Boolean(stateModal.student)}
          onClose={closeStateModal}
          onConfirm={async () => {
            if (!stateModal.student) return;
            const wasSuccessful = await handleStudentStateChange(
              stateModal.student,
              stateModal.nextState
            );
            if (wasSuccessful) {
              closeStateModal();
            }
          }}
          entityLabel={
            stateModal.student
              ? `${stateModal.student.nombre} · ${resolveGroupName(stateModal.student, groupsById)}`
              : ""
          }
          currentState={stateModal.student ? getStudentState(stateModal.student) : "activo"}
          nextState={stateModal.nextState}
          {...getStudentStateCopy(stateModal.nextState)}
        />

        <RoleModal
          open={qrModal.open}
          onClose={() => setQrModal({ open: false, token: "", studentName: "", isLoading: false })}
          eyebrow="Acceso del estudiante"
          title="Código QR"
        >
          {qrModal.isLoading ? (
            <p className="lk-role-note">Generando el acceso del estudiante...</p>
          ) : qrModal.token ? (
            <StudentQrPreview token={qrModal.token} studentName={qrModal.studentName} />
          ) : (
            <p className="lk-role-note">No fue posible cargar el código QR en este momento.</p>
          )}
        </RoleModal>
      </div>
    </AppShell>
  );
}
