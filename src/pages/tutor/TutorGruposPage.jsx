import { useEffect, useMemo, useState } from "react";
import { BookOpen, Eye, Play, Route, Search, Square, Users } from "lucide-react";
import SessionClassModal from "../../components/tutor/SessionClassModal";
import RoleModal from "../../components/common/RoleModal";
import tutorGroupsService from "../../services/tutorGroupsService";
import {
  getSessionOpenSuccessMessage,
  getSessionModeLabel,
  getSessionStepsLabel,
  getSessionSummaryText,
  isSessionActive,
} from "../../utils/sessionClassUi";
import "../../styles/tutor-groups.css";

const normalizeGroupId = (grupo) => grupo?.id ?? grupo?.id_grupo ?? null;
const normalizeStudents = (grupoDetail) => grupoDetail?.estudiantes ?? [];

const getStudentSessionBadge = (student) =>
  isSessionActive(student?.sesion_activa)
    ? { label: "en juego", tone: "active" }
    : { label: "en espera", tone: "waiting" };

function StatusChip({ label, tone = "neutral" }) {
  return <span className={`tg-status-chip is-${tone}`}>{label}</span>;
}

function GroupListItem({ grupo, selected, onSelect }) {
  const groupId = normalizeGroupId(grupo);
  const sessionOpen = isSessionActive(grupo?.sesion_activa);

  return (
    <article className={`tg-group-item${selected ? " is-selected" : ""}`}>
      <button type="button" className="tg-group-item__body" onClick={() => onSelect(groupId)}>
        <div className="tg-group-item__header">
          <div>
            <h3 className="tg-group-item__title">{grupo.nombre}</h3>
            <p className="tg-group-item__description">
              {grupo.descripcion || "Grupo asignado para operación pedagógica."}
            </p>
          </div>
          <span className={`tg-group-item__status${sessionOpen ? " is-open" : ""}`}>
            {sessionOpen ? "Clase abierta" : "Sin actividad"}
          </span>
        </div>

        <div className="tg-group-item__badges">
          <span className="tg-pill">
            <Route size={14} />
            {getSessionModeLabel(grupo)}
          </span>
          <span className="tg-pill">{getSessionStepsLabel(grupo)}</span>
        </div>

        <p className="tg-group-item__summary">{getSessionSummaryText(grupo)}</p>
      </button>

      <div className="tg-group-item__footer">
        <button type="button" className="tg-link-btn" onClick={() => onSelect(groupId)}>
          <Eye size={14} />
          {selected ? "Grupo seleccionado" : "Ver detalle"}
        </button>
      </div>
    </article>
  );
}

function DetailMetric({ label, value, helper }) {
  return (
    <article className="tg-detail-metric">
      <span className="tg-detail-metric__label">{label}</span>
      <strong className="tg-detail-metric__value">{value}</strong>
      {helper ? <p className="tg-detail-metric__helper">{helper}</p> : null}
    </article>
  );
}

export default function TutorGruposPage() {
  const [grupos, setGrupos] = useState([]);
  const [minijuegos, setMinijuegos] = useState([]);
  const [rutasPedagogicas, setRutasPedagogicas] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [selectedGroupDetail, setSelectedGroupDetail] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [cargandoAccion, setCargandoAccion] = useState(null);
  const [sessionModal, setSessionModal] = useState({
    open: false,
    group: null,
    error: "",
  });
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const selectedGroup = useMemo(
    () => grupos.find((grupo) => normalizeGroupId(grupo) === selectedGroupId) ?? null,
    [grupos, selectedGroupId]
  );

  const selectedStudents = useMemo(
    () => normalizeStudents(selectedGroupDetail),
    [selectedGroupDetail]
  );

  const activeStudentsCount = useMemo(
    () => selectedStudents.filter((student) => isSessionActive(student?.sesion_activa)).length,
    [selectedStudents]
  );

  const filteredGroups = useMemo(() => {
    let result = grupos;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((g) => (g.nombre || "").toLowerCase().includes(q));
    }
    if (statusFilter === "open") {
      result = result.filter((g) => isSessionActive(g.sesion_activa));
    } else if (statusFilter === "closed") {
      result = result.filter((g) => !isSessionActive(g.sesion_activa));
    }
    return result;
  }, [grupos, searchQuery, statusFilter]);

  const loadGroupsAndCatalog = async (nextSelectedGroupId = selectedGroupId) => {
    try {
      setCargando(true);
      const [loadedGroups, loadedGames, loadedRoutes] = await Promise.all([
        tutorGroupsService.getGroups(),
        tutorGroupsService.listarMinijuegosActivos(),
        tutorGroupsService.listarRutasPedagogicas(),
      ]);

      setGrupos(loadedGroups);
      setMinijuegos(loadedGames);
      setRutasPedagogicas(loadedRoutes);
      setError(null);

      if (!loadedGroups.length) {
        setSelectedGroupId(null);
        setSelectedGroupDetail(null);
        return;
      }

      const resolvedGroupId =
        nextSelectedGroupId && loadedGroups.some((grupo) => normalizeGroupId(grupo) === nextSelectedGroupId)
          ? nextSelectedGroupId
          : normalizeGroupId(loadedGroups[0]);

      setSelectedGroupId(resolvedGroupId);
    } catch (loadError) {
      setError(loadError.message || "No fue posible cargar los grupos asignados.");
    } finally {
      setCargando(false);
    }
  };

  const loadSelectedGroupDetail = async (groupId) => {
    if (!groupId) {
      setSelectedGroupDetail(null);
      return;
    }

    try {
      setCargandoDetalle(true);
      const detail = await tutorGroupsService.getGroup(groupId);
      setSelectedGroupDetail(detail);
    } catch (detailError) {
      setFeedback({
        type: "danger",
        message: detailError.message || "No fue posible cargar el detalle del grupo.",
      });
      setSelectedGroupDetail(null);
    } finally {
      setCargandoDetalle(false);
    }
  };

  useEffect(() => {
    loadGroupsAndCatalog();
  }, []);

  useEffect(() => {
    loadSelectedGroupDetail(selectedGroupId);
  }, [selectedGroupId]);

  const closeSessionModal = () => {
    setSessionModal({
      open: false,
      group: null,
      error: "",
    });
  };

  const openSessionModal = (grupo) => {
    if (!minijuegos.length && !rutasPedagogicas.length) {
      setFeedback({
        type: "danger",
        message: "No hay actividades pedagógicas disponibles para abrir la clase.",
      });
      return;
    }

    setSessionModal({
      open: true,
      group: grupo,
      error: "",
    });
  };

  const handleOpenDetail = (groupId) => {
    setSelectedGroupId(groupId);
    setDetailModalOpen(true);
  };

  const handleToggleSesion = async (grupo) => {
    const groupId = normalizeGroupId(grupo);

    if (!isSessionActive(grupo?.sesion_activa)) {
      openSessionModal(grupo);
      return;
    }

    try {
      setCargandoAccion(groupId);
      await tutorGroupsService.cerrarSesionClase(groupId);
      await loadGroupsAndCatalog(groupId);
      await loadSelectedGroupDetail(groupId);
      setFeedback({
        type: "success",
        message: `La actividad pedagógica de "${grupo.nombre}" quedó cerrada.`,
      });
    } catch (toggleError) {
      setFeedback({
        type: "danger",
        message: toggleError.message || "No fue posible cerrar la clase.",
      });
    } finally {
      setCargandoAccion(null);
    }
  };

  const handleConfirmOpenSession = async (sessionPlan) => {
    const groupId = normalizeGroupId(sessionModal.group);

    if (!groupId) {
      closeSessionModal();
      return;
    }

    try {
      setCargandoAccion(groupId);
      await tutorGroupsService.abrirSesionClase(groupId, sessionPlan);
      await loadGroupsAndCatalog(groupId);
      await loadSelectedGroupDetail(groupId);

      setFeedback({
        type: "success",
        message: getSessionOpenSuccessMessage(sessionModal.group.nombre, sessionPlan),
      });
      closeSessionModal();
    } catch (openError) {
      setSessionModal((prev) => ({
        ...prev,
        error: openError.message || "No fue posible abrir la clase.",
      }));
    } finally {
      setCargandoAccion(null);
    }
  };

  return (
    <div className="tutor-page-container">
      <div className="tutor-page-header">
        <div>
          <h1 className="tutor-page-title tg-page-title">
            <Users size={26} />
            Mis grupos
          </h1>
          <p className="tutor-page-subtitle tg-page-subtitle">
            Consulta tus grupos asignados, revisa a tus estudiantes y prepara la próxima actividad pedagógica.
          </p>
        </div>
      </div>

      {feedback ? (
        <div className={`tutor-alert ${feedback.type === "success" ? "tutor-alert--success" : "tutor-alert--error"}`}>
          {feedback.message}
        </div>
      ) : null}

      {error ? <div className="tutor-alert tutor-alert--error">{error}</div> : null}

      {!cargando && !grupos.length ? (
        <div className="tutor-card tutor-empty">
          <BookOpen size={42} />
          <strong>Aún no tienes grupos asignados</strong>
          <p>Cuando la institución te asigne grupos, aquí podrás abrir actividades y revisar a tus estudiantes.</p>
        </div>
      ) : (
        <div className="tutor-card">
            <div className="tg-section-head">
              <div>
                <span className="tg-section-head__eyebrow">Operación pedagógica</span>
                <h2 className="tutor-card-title">
                  <Route size={18} />
                  Grupos asignados
                </h2>
              </div>
              <div className="tg-toolbar">
                <div className="tg-search">
                  <Search size={15} className="tg-search__icon" />
                  <input
                    type="text"
                    className="tg-search__input"
                    placeholder="Buscar grupo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button type="button" className="tg-search__clear" onClick={() => setSearchQuery("")}>
                      &times;
                    </button>
                  )}
                </div>
                <div className="tg-filters">
                  {[
                    { key: "all", label: "Todos" },
                    { key: "open", label: "Abiertas" },
                    { key: "closed", label: "Cerradas" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      className={`tg-filter-pill${statusFilter === f.key ? " is-active" : ""}`}
                      onClick={() => setStatusFilter(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {cargando ? (
              <div className="tutor-loading">Cargando grupos...</div>
            ) : filteredGroups.length === 0 ? (
              <div className="tutor-empty">
                <Search size={30} />
                <p>No se encontraron grupos con esos criterios.</p>
              </div>
            ) : (
              <div className="tg-group-list">
                {filteredGroups.map((grupo) => {
                  const groupId = normalizeGroupId(grupo);

                  return (
                    <GroupListItem
                      key={groupId}
                      grupo={grupo}
                      selected={groupId === selectedGroupId}
                      onSelect={handleOpenDetail}
                    />
                  );
                })}
              </div>
            )}
        </div>
      )}

      <SessionClassModal
        show={sessionModal.open}
        groupName={sessionModal.group?.nombre ?? "grupo"}
        minijuegos={minijuegos}
        rutasPedagogicas={rutasPedagogicas}
        onClose={closeSessionModal}
        onConfirm={handleConfirmOpenSession}
        isSubmitting={Boolean(cargandoAccion)}
        errorMessage={sessionModal.error}
      />

      <RoleModal
        open={detailModalOpen && Boolean(selectedGroup)}
        onClose={() => setDetailModalOpen(false)}
        eyebrow="Contexto del aula"
        title="Detalle del grupo"
        width={640}
        actions={
          selectedGroup ? (
            <>
              <button
                type="button"
                className={`tg-primary-btn${isSessionActive(selectedGroup.sesion_activa) ? " tg-primary-btn--danger" : ""}`}
                onClick={() => { handleToggleSesion(selectedGroup); setDetailModalOpen(false); }}
                disabled={cargandoAccion === normalizeGroupId(selectedGroup)}
              >
                {cargandoAccion === normalizeGroupId(selectedGroup) ? (
                  "Procesando..."
                ) : isSessionActive(selectedGroup.sesion_activa) ? (
                  <><Square size={15} /> Cerrar clase</>
                ) : (
                  <><Play size={15} /> Abrir actividad</>
                )}
              </button>
              <button type="button" className="tg-primary-btn tg-primary-btn--ghost" onClick={() => setDetailModalOpen(false)}>
                Cerrar
              </button>
            </>
          ) : null
        }
      >
        {selectedGroup && (
          <div className="tg-detail-stack">
            <div className="tg-detail-hero">
              <div>
                <h3>{selectedGroup.nombre}</h3>
                <p>{selectedGroup.descripcion || "Sin descripción institucional registrada."}</p>
              </div>
              <StatusChip
                label={isSessionActive(selectedGroup.sesion_activa) ? "clase abierta" : "clase cerrada"}
                tone={isSessionActive(selectedGroup.sesion_activa) ? "active" : "closed"}
              />
            </div>

            <div className="tg-detail-metrics">
              <DetailMetric
                label="Modo"
                value={getSessionModeLabel(selectedGroup)}
                helper={getSessionSummaryText(selectedGroup)}
              />
              <DetailMetric
                label="Estudiantes"
                value={cargandoDetalle ? "..." : selectedStudents.length}
                helper={`${activeStudentsCount} con actividad reciente o sesión abierta`}
              />
            </div>

            <div className="tg-students-panel">
              <div className="tg-students-panel__head">
                <strong>Estudiantes del grupo</strong>
                <span>{cargandoDetalle ? "..." : selectedStudents.length}</span>
              </div>

              {cargandoDetalle ? (
                <div className="tutor-loading">Cargando detalle del grupo...</div>
              ) : selectedStudents.length ? (
                <div className="tg-students-list">
                  {selectedStudents.map((student) => {
                    const badge = getStudentSessionBadge(student);

                    return (
                      <div key={student.id ?? student.id_estudiante} className="tg-student-row">
                        <div className="tg-student-row__identity">
                          <div
                            className="tg-student-row__avatar"
                            style={{ backgroundColor: student.color_avatar || "var(--lk-tutor-primary)" }}
                          >
                            {(student.nombre || "?").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong>{student.nombre}</strong>
                            <p>{student.edad ? `${student.edad} años` : "Edad no disponible"}</p>
                          </div>
                        </div>
                        <StatusChip label={badge.label} tone={badge.tone} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="tg-empty-copy">
                  Este grupo aún no tiene estudiantes activos visibles para el tutor.
                </p>
              )}
            </div>
          </div>
        )}
      </RoleModal>
    </div>
  );
}
