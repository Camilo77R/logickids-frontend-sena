import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Eye, Gamepad2, Play, Route, Search, Sparkles, Square, UserCheck, X } from "lucide-react";
import SessionClassModal from "../../components/tutor/SessionClassModal";
import RoleModal from "../../components/common/RoleModal";
import tutorGroupsService from "../../services/tutorGroupsService";
import groupsMascot from "../../assets/imgs/tutor-groups-team-mascot.png";
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

function GroupListItem({ grupo, selected, onSelect, onOpenDetail }) {
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
        <button type="button" className="tg-link-btn" onClick={() => onOpenDetail(groupId)}>
          <Eye size={14} />
          Ver detalle
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
  const feedbackTimer = useRef(null);
  const errorTimer = useRef(null);

  const clearFeedback = useCallback(() => { setFeedback(null); }, []);
  const clearError = useCallback(() => { setError(null); }, []);

  useEffect(() => {
    if (feedback) {
      clearTimeout(feedbackTimer.current);
      feedbackTimer.current = setTimeout(clearFeedback, 5000);
    }
    return () => clearTimeout(feedbackTimer.current);
  }, [feedback, clearFeedback]);

  useEffect(() => {
    if (error) {
      clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(clearError, 5000);
    }
    return () => clearTimeout(errorTimer.current);
  }, [error, clearError]);

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

  const openGroupsCount = useMemo(
    () => grupos.filter((grupo) => isSessionActive(grupo?.sesion_activa)).length,
    [grupos]
  );

  const availableActivitiesCount = minijuegos.length + rutasPedagogicas.length;

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

  const handleSelectGroup = (groupId) => {
    setSelectedGroupId(groupId);
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
      {feedback ? (
        <div className={`tutor-alert ${feedback.type === "success" ? "tutor-alert--success" : "tutor-alert--error"}`}>
          <span>{feedback.message}</span>
          <button type="button" className="tutor-alert__close" onClick={clearFeedback} aria-label="Cerrar"><X size={16} /></button>
        </div>
      ) : null}

      {error ? (
        <div className="tutor-alert tutor-alert--error">
          <span>{error}</span>
          <button type="button" className="tutor-alert__close" onClick={clearError} aria-label="Cerrar"><X size={16} /></button>
        </div>
      ) : null}

      <div className="tg-main-column">
      {cargando || grupos.length ? (
        <section className="tg-hero-panel">
          <div className="tg-hero-panel__content">
            <span className={`tg-hero-panel__status${openGroupsCount ? " is-active" : ""}`}>
              <span />
              {openGroupsCount ? `${openGroupsCount} actividad${openGroupsCount === 1 ? "" : "es"} abierta${openGroupsCount === 1 ? "" : "s"}` : "Listo para organizar"}
            </span>
            <h1 className="tg-hero-panel__title">Mis grupos</h1>
            <p>
              Administra tus grupos, abre una actividad pedagógica y acompaña a tus estudiantes desde un solo tablero.
            </p>

            <div className="tg-hero-panel__activity">
              <span className="tg-hero-panel__activity-icon">
                <Gamepad2 size={22} />
              </span>
              <span>
                <small>Actividad actual</small>
                <strong>{selectedGroup ? getSessionSummaryText(selectedGroup) : "Selecciona un grupo para preparar la clase"}</strong>
              </span>
            </div>

            <div className="tg-hero-panel__metrics">
              <DetailMetric label="Grupos asignados" value={grupos.length} />
              <DetailMetric label="Actividades abiertas" value={openGroupsCount} />
              <DetailMetric label="Catálogo disponible" value={availableActivitiesCount} helper="Juegos y rutas" />
            </div>
          </div>

          <img src={groupsMascot} alt="" className="tg-hero-panel__mascot" aria-hidden="true" />
        </section>
      ) : null}

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
                      onSelect={handleSelectGroup}
                      onOpenDetail={handleOpenDetail}
                    />
                  );
                })}
              </div>
            )}
        </div>
      )}
      </div>

      {selectedGroup ? (
        <aside className="tutor-card tg-selected-panel">
          <div className="tg-selected-panel__head">
            <span className="tg-selected-panel__icon">
              <Sparkles size={20} />
            </span>
            <div>
              <span className="tg-section-head__eyebrow">Grupo seleccionado</span>
              <h2 className="tutor-card-title">{selectedGroup.nombre}</h2>
            </div>
          </div>

          <p className="tg-selected-panel__copy">
            {selectedGroup.descripcion || "Revisa el estado del grupo y decide la próxima actividad pedagógica."}
          </p>

          <div className="tg-selected-panel__metrics">
            <DetailMetric
              label="Estado"
              value={isSessionActive(selectedGroup.sesion_activa) ? "Clase abierta" : "Sin actividad"}
              helper={getSessionModeLabel(selectedGroup)}
            />
            <DetailMetric
              label="Estudiantes"
              value={cargandoDetalle ? "..." : selectedStudents.length}
              helper={`${activeStudentsCount} en juego o con sesión activa`}
            />
          </div>

          <div className="tg-selected-panel__actions">
            <button
              type="button"
              className={`tg-primary-btn${isSessionActive(selectedGroup.sesion_activa) ? " tg-primary-btn--danger" : ""}`}
              onClick={() => handleToggleSesion(selectedGroup)}
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
            <button type="button" className="tg-primary-btn tg-primary-btn--ghost" onClick={() => handleOpenDetail(normalizeGroupId(selectedGroup))}>
              <UserCheck size={15} />
              Ver estudiantes
            </button>
          </div>

          <div className="tg-mini-students">
            <div className="tg-students-panel__head">
              <strong>Vista rápida</strong>
              <span>{cargandoDetalle ? "..." : selectedStudents.length}</span>
            </div>
            {cargandoDetalle ? (
              <div className="tutor-loading">Cargando estudiantes...</div>
            ) : selectedStudents.slice(0, 4).length ? (
              <div className="tg-students-list">
                {selectedStudents.slice(0, 4).map((student) => {
                  const badge = getStudentSessionBadge(student);

                  return (
                    <div key={student.id ?? student.id_estudiante} className="tg-student-row">
                      <div className="tg-student-row__identity">
                        <div
                          className="tg-student-row__avatar"
                          style={{ backgroundColor: student.color_avatar || "var(--lk-brand)" }}
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
              <p className="tg-empty-copy">Aún no hay estudiantes visibles en este grupo.</p>
            )}
          </div>
        </aside>
      ) : null}

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
