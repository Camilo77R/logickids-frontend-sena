/**
 * TutorDashboardOverview
 *
 * POR QUE:
 * - muestra el pulso pedagógico del tutor sin acoplarse a un minijuego fijo
 * - usa el contrato nuevo de sesiones de clase (`single` / `path`)
 * - relee el estado desde backend después de cada cambio importante
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  PlayCircle,
  PauseCircle,
  TrendingUp,
  Award,
  Crown,
  Clock,
  ChevronRight,
  ChevronDown,
  Zap,
  Lightbulb,
  BarChart2,
  BarChart3,
  Star,
  Target,
  Route,
  Gamepad2,
  Layers,
} from "lucide-react";
import SessionClassModal from "../../components/tutor/SessionClassModal";
import SesionesMetricsModal from "../../components/tutor/SesionesMetricsModal";
import RoleModal from "../../components/common/RoleModal";
import { useAuth } from "../../hooks/useAuth";
import tutorGroupsService from "../../services/tutorGroupsService";
import estudianteService from "../../services/estudianteService";
import estadisticasService from "../../services/estadisticasService";
import recomendacionesService from "../../services/recomendacionesService";
import rankingService from "../../services/rankingService";
import realtimeService from "../../services/realtimeService";
import {
  getSessionHeadline,
  getSessionOpenSuccessMessage,
  getSessionModeLabel,
  getSessionStepsLabel,
  getSessionSummaryText,
  isSessionActive,
} from "../../utils/sessionClassUi";
import "../../styles/tutor-ov.css";

const AVATAR_COLORS = ["#8E35D5", "#2B173D", "#F9A825", "#e8920a", "#7a3575", "#f0b429"];
const avatarColor = (index) => AVATAR_COLORS[index % AVATAR_COLORS.length];
const resolveStudentInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase() || "??";

const resolveStudentAvatarColor = (student, index = 0) =>
  student?.color_avatar || avatarColor(index);

const resolveGroupId = (group) => group?.id ?? group?.id_grupo;
const resolveStudentId = (student) => student?.id ?? student?.id_estudiante ?? student?.estudiante_id;

const normalizeGroup = (group) => ({
  ...group,
  id: resolveGroupId(group),
});

const normalizeStudent = (student, groupId) => ({
  ...student,
  id: resolveStudentId(student),
  grupo_id: student?.grupo_id ?? student?.id_grupo ?? groupId,
});

const loadStudentsForTutorGroups = async (groups) => {
  const requests = await Promise.allSettled(
    groups.map(async (group) => {
      if (!group.id) return [];
      const students = await estudianteService.listEstudiantes(Number(group.id));
      return (students ?? []).map((student) => normalizeStudent(student, group.id));
    })
  );

  const uniqueStudents = new Map();

  requests.forEach((request) => {
    if (request.status !== "fulfilled") return;

    request.value.forEach((student) => {
      if (!student.id) return;
      uniqueStudents.set(String(student.id), student);
    });
  });

  return [...uniqueStudents.values()];
};

function KpiCard({ value, label, sublabel, Icon, variant }) {
  return (
    <div className={`tov-kpi ${variant ? `tov-kpi--${variant}` : ""}`}>
      <div className="tov-kpi__ico">
        <Icon size={16} strokeWidth={1.5} />
      </div>
      <div className="tov-kpi__info">
        <span className="tov-kpi__lbl">{label}</span>
        <strong className="tov-kpi__val">{value}</strong>
        {sublabel && <span className="tov-kpi__sub">{sublabel}</span>}
      </div>
    </div>
  );
}

function StudentRow({ student, rank }) {
  const active = ["pendiente", "en_progreso"].includes(student.participante_estado);
  const initials = resolveStudentInitials(student.nombre);
  const pts = student.puntaje ?? student.valor ?? 0;

  return (
    <div className={`tov-student ${active ? "tov-student--live" : ""}`}>
      <span className="tov-student__rank">#{student.posicion ?? rank}</span>
      <div className="tov-student__avatar" style={{ background: avatarColor(rank - 1) }}>
        {initials}
      </div>
      <div className="tov-student__info">
        <span className="tov-student__name">{student.nombre}</span>
        <span className="tov-student__meta">
          {active ? "● Participando ahora" : "Resultado oficial"} · {pts} pts ·{" "}
          {student.aciertos ?? 0} aciertos
        </span>
      </div>
      <span className="tov-student__live">{pts} pts</span>
    </div>
  );
}

function StudentAvatar({ student, className, fallbackIndex = 0 }) {
  return (
    <div
      className={className}
      style={{ backgroundColor: resolveStudentAvatarColor(student, fallbackIndex) }}
      aria-hidden="true"
    >
      {resolveStudentInitials(student?.nombre)}
    </div>
  );
}

function PodiumSpot({ student, rank }) {
  const pts = student.puntaje ?? student.valor ?? 0;

  return (
    <div className={`tov-podium-spot tov-podium-spot--${rank}`}>
      <div className="tov-podium-spot__icon">
        {rank === 1 ? (
          <Crown size={20} strokeWidth={2} />
        ) : (
          <Award size={16} strokeWidth={2} />
        )}
      </div>
      <StudentAvatar student={student} className="tov-podium-spot__avatar" fallbackIndex={rank - 1} />
      <span className="tov-podium-spot__name">{student.nombre}</span>
      <span className="tov-podium-spot__label">
        {student.posicion ?? rank}°
      </span>
      <span className="tov-podium-spot__pts">{pts} pts</span>
    </div>
  );
}

function PodiumSpotEmpty({ rank }) {
  return (
    <div className={`tov-podium-spot tov-podium-spot--${rank} tov-podium-spot--empty`}>
      <div className="tov-podium-spot__icon tov-podium-spot__icon--empty">
        {rank === 1 ? <Crown size={20} strokeWidth={2} /> : <Award size={16} strokeWidth={2} />}
      </div>
      <div className="tov-podium-spot__avatar tov-podium-spot__avatar--empty" />
      <span className="tov-podium-spot__label">{rank}°</span>
    </div>
  );
}

function RankRow({ student, rank }) {
  const pts = student.puntaje ?? student.valor ?? 0;
  const active = student.participacion !== false;

  return (
    <div className={`tov-rank-row ${!active ? "tov-rank-row--inactive" : ""}`}>
      <span className="tov-rank-row__num">
        {active ? `${student.posicion ?? rank}°` : "\u2014"}
      </span>
      <StudentAvatar student={student} className="tov-rank-row__avatar" fallbackIndex={rank - 1} />
      <span className="tov-rank-row__name">{student.nombre}</span>
      {active ? (
        <span className="tov-rank-row__pts">{pts} pts</span>
      ) : (
        <span className="tov-rank-row__badge">Sin jugar</span>
      )}
    </div>
  );
}

function GroupCard({ group, onToggle, loading, readonly }) {
  const navigate = useNavigate();
  const active = isSessionActive(group.sesion_activa);

  return (
    <div className={`tov-gcard ${active ? "tov-gcard--on" : ""}`}>
      <div className="tov-gcard__header">
        <span className={`tov-gcard__badge ${active ? "tov-gcard__badge--on" : "tov-gcard__badge--off"}`}>
          {active ? "Clase abierta" : "Cerrada"}
        </span>
      </div>

      <h3 className="tov-gcard__name">{group.nombre}</h3>
      <p className="tov-gcard__desc">{group.descripcion?.slice(0, 56) || "Sin descripción"}</p>
      <div className="tov-gcard__meta">
        <span className="tov-gcard__meta-item">
          <Gamepad2 size={11} strokeWidth={1.5} /> {getSessionModeLabel(group) || "Actividad de un juego"}
        </span>
        <span className="tov-gcard__meta-item">
          <Layers size={11} strokeWidth={1.5} /> {getSessionStepsLabel(group) || "2 niveles"}
        </span>
      </div>
      <p className="tov-gcard__desc">{getSessionSummaryText(group)}</p>

      {!readonly && (
        <div className="tov-gcard__footer">
          <button
            className={`tov-gcard__btn ${active ? "tov-gcard__btn--close" : "tov-gcard__btn--open"}`}
            disabled={loading === group.id}
            onClick={() => onToggle(group)}
          >
            {loading === group.id ? "\u2026" : active ? "Cerrar" : "Abrir actividad"}
          </button>
          <button className="tov-gcard__arrow" onClick={() => navigate("/tutor/grupos")}>
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

function SkillBar({ habilidad, precision }) {
  const percent = Math.min(100, Math.round(Number(precision ?? 0)));
  const level = percent >= 75 ? "high" : percent >= 45 ? "mid" : "low";

  return (
    <div className="tov-sbar">
      <div className="tov-sbar__info">
        <span className="tov-sbar__name">{habilidad}</span>
        <span className="tov-sbar__pct">{percent}%</span>
      </div>
      <div className="tov-sbar__track">
        <div className={`tov-sbar__fill tov-sbar__fill--${level}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export default function TutorDashboardOverview() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.nombre?.split(" ")[0] || "Profe";

  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [games, setGames] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [skills, setSkills] = useState([]);
  const [recs, setRecs] = useState([]);
  const [ranking, setRanking] = useState(null);
  const [rankingGroupId, setRankingGroupId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [toast, setToast] = useState(null);
  const loadOverviewRef = useRef(null);
  const [sessionModal, setSessionModal] = useState({
    open: false,
    group: null,
    error: "",
  });
  const [activeModule, setActiveModule] = useState(null);
  const [metricsModalOpen, setMetricsModalOpen] = useState(false);
  const [showClassif, setShowClassif] = useState(false);
  const [showNonPart, setShowNonPart] = useState(false);

  const flash = (type, text) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 3500);
  };

  const fetchRankingForGroup = async (groupId) => {
    if (!groupId) { setRanking(null); return; }
    try {
      const result = await rankingService.obtenerRankingGrupo(groupId);
      setRanking(result ?? null);
    } catch {
      setRanking(null);
    }
  };

  const loadOverview = async () => {
    try {
      setLoading(true);

      const [loadedGroupsRaw, loadedGames, loadedRoutes] = await Promise.all([
        tutorGroupsService.getGroups(),
        tutorGroupsService.listarMinijuegosActivos(),
        tutorGroupsService.listarRutasPedagogicas(),
      ]);

      const loadedGroups = (loadedGroupsRaw ?? []).map(normalizeGroup);
      const loadedStudents = await loadStudentsForTutorGroups(loadedGroups);

      setGroups(loadedGroups);
      setStudents(loadedStudents);
      setGames(loadedGames);
      setRoutes(loadedRoutes);

      const focusGroup = loadedGroups.find((group) => isSessionActive(group.sesion_activa)) ?? loadedGroups[0];
      if (!focusGroup?.id) {
        setSkills([]);
        setRecs([]);
        setRanking(null);
        return;
      }

      const [skillsResult, recsResult] = await Promise.allSettled([
        estadisticasService.porGrupo(focusGroup.id),
        recomendacionesService.porGrupo(focusGroup.id),
      ]);

      setSkills(skillsResult.status === "fulfilled" ? skillsResult.value ?? [] : []);
      setRecs(recsResult.status === "fulfilled" ? recsResult.value ?? [] : []);
      if (rankingGroupId) {
        await fetchRankingForGroup(rankingGroupId);
      } else {
        setRankingGroupId(focusGroup.id);
        await fetchRankingForGroup(focusGroup.id);
      }
    } catch (error) {
      flash("err", error?.message ?? "No fue posible cargar el panel del tutor.");
    } finally {
      setLoading(false);
    }
  };

  loadOverviewRef.current = loadOverview;

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    return realtimeService.subscribe({
      token,
      onClassSessionChanged: () => {
        void loadOverviewRef.current?.();
      },
      onRankingUpdated: () => {
        void loadOverviewRef.current?.();
      },
      onStudentAccessChanged: () => {
        void loadOverviewRef.current?.();
      },
    });
  }, [token, user?.id]);

  const totalGroups = groups.length;
  const activeGroups = groups.filter((group) => isSessionActive(group.sesion_activa)).length;
  const pausedGroups = totalGroups - activeGroups;
  const totalStudents = students.length;
  const liveStudents = students.filter((student) => isSessionActive(student.sesion_activa)).length;

  const focusGroup = useMemo(
    () => groups.find((group) => isSessionActive(group.sesion_activa)) ?? groups[0] ?? null,
    [groups]
  );

  const sortedStudents = useMemo(() => ranking?.ranking ?? [], [ranking]);
  const podiumStudents = useMemo(() => sortedStudents.filter((s) => s.participacion !== false), [sortedStudents]);
  const listStudents = useMemo(() => {
    const podiumIds = new Set(podiumStudents.slice(0, 3).map((s) => s.estudiante_id));
    return sortedStudents.filter((s) => !podiumIds.has(s.estudiante_id));
  }, [sortedStudents, podiumStudents]);
  const listParticipants = useMemo(() => listStudents.filter((s) => s.participacion !== false), [listStudents]);
  const listNonParticipants = useMemo(() => listStudents.filter((s) => s.participacion === false), [listStudents]);

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === rankingGroupId) ?? focusGroup ?? null,
    [groups, rankingGroupId, focusGroup]
  );

  const closeSessionModal = () => {
    setSessionModal({
      open: false,
      group: null,
      error: "",
    });
  };

  const handleToggle = async (group) => {
    if (!isSessionActive(group.sesion_activa)) {
      if (!games.length && !routes.length) {
        flash("err", "No hay actividades pedagógicas disponibles para abrir la clase.");
        return;
      }

      setSessionModal({
        open: true,
        group,
        error: "",
      });
      return;
    }

    try {
      setToggling(group.id);
      await tutorGroupsService.cerrarSesionClase(group.id);
      await loadOverview();
      flash("ok", `La actividad pedagógica de "${group.nombre}" quedó cerrada.`);
    } catch (error) {
      flash("err", error?.message ?? "No fue posible cerrar la clase.");
    } finally {
      setToggling(null);
    }
  };

  const handleConfirmOpenSession = async (sessionPlan) => {
    if (!sessionModal.group) {
      closeSessionModal();
      return;
    }

    try {
      setToggling(sessionModal.group.id);
      await tutorGroupsService.abrirSesionClase(sessionModal.group.id, sessionPlan);
      await loadOverview();

      flash(
        "ok",
        getSessionOpenSuccessMessage(sessionModal.group.nombre, sessionPlan)
      );
      closeSessionModal();
    } catch (error) {
      setSessionModal((prev) => ({
        ...prev,
        error: error?.message ?? "No fue posible abrir la clase.",
      }));
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="tov-loading">
        <div className="tov-loading__ring" />
        <span>Cargando panel…</span>
      </div>
    );
  }

  const navLinks = { groups: "/tutor/grupos", ranking: "/tutor/estudiantes", activity: "/tutor/grupos", skills: "/tutor/estadisticas", recs: "/tutor/recomendaciones" };

  return (
    <div className="tov">
      {toast && <div className={`tov-toast tov-toast--${toast.type}`}>{toast.text}</div>}

      <div className="tov-hero">
        <div className="tov-hero__decor"><span /><span /><span /></div>
        <div className="tov-hero__text">
          <h1 className="tov-hero__h1">¡Bienvenido, profesor {firstName}!</h1>
          <p className="tov-hero__sub">Crea, administra actividades y acompaña el avance de tus estudiantes.</p>
        </div>
      </div>

      <div className="tov-kpi-strip">
        <KpiCard value={games.length} label="Juegos activos" sublabel="Catálogo pedagógico" Icon={Zap} variant="blue" />
        <KpiCard value={totalStudents} label="Estudiantes" sublabel="Registrados" Icon={Users} variant="green" />
        <KpiCard value={activeGroups} label="Clases abiertas" sublabel="Sesión activa" Icon={PlayCircle} variant="purple" />
        <KpiCard value={liveStudents} label="Jugando ahora" sublabel="Con sesión activa" Icon={Target} variant="yellow" />
        <KpiCard value={pausedGroups} label="Clases cerradas" sublabel="Sin sesión" Icon={PauseCircle} variant="orange" />
        <KpiCard value={totalGroups} label="Total grupos" sublabel="Creados" Icon={BookOpen} variant="neutral" />
      </div>

      <div className="tov-dashboard-grid">

        {/* COL 1: Juegos */}
        <div className="tov-dash-panel">
          <div className="tov-dash-panel__head">
            <div>
              <span className="tov-dash-panel__eyebrow">AULA</span>
              <h3 className="tov-dash-panel__title">Juegos activos</h3>
            </div>
            <button className="tov-panel-link" onClick={() => setActiveModule("groups")}>
              Ver actividad <ChevronRight size={10} />
            </button>
          </div>
          <div className="tov-games-list">
            {games.length === 0 ? (
              <div className="tov-empty tov-empty--compact">
                <Gamepad2 size={20} />
                <strong>Sin juegos</strong>
                <p>No hay juegos activos en el catálogo.</p>
              </div>
            ) : (
              games.map((game) => (
                <div key={game.id ?? game.slug} className="tov-game-card">
                  <div className="tov-game-card__icon"><Gamepad2 size={16} /></div>
                  <div className="tov-game-card__copy">
                    <strong>{game.nombre}</strong>
                    <small>{game.descripcion?.slice(0, 60) || "Juego educativo"}</small>
                  </div>
                  <span className="tov-game-card__tag">Juego</span>
                </div>
              ))
            )}
          </div>
          <div className="tov-mini-actions">
            <button onClick={() => setActiveModule("activity")}><Star size={11} /> Actividad</button>
            <button onClick={() => setMetricsModalOpen(true)}><BarChart3 size={11} /> Métricas</button>
          </div>
        </div>

        {/* COL 2: Progreso */}
        <div className="tov-dash-panel">
          <div className="tov-dash-panel__head">
            <div>
              <span className="tov-dash-panel__eyebrow">PROGRESO</span>
              <h3 className="tov-dash-panel__title">Precisión por habilidad</h3>
            </div>
            <button className="tov-panel-link" onClick={() => setActiveModule("skills")}>
              Ver detalle <ChevronRight size={10} />
            </button>
          </div>
          {skills.length === 0 ? (
            <div className="tov-empty tov-empty--compact">
              <BarChart2 size={20} />
              <strong>Sin datos</strong>
              <p>Abre una clase para ver la precisión por habilidad.</p>
            </div>
          ) : (
            <div className="tov-progress-bars">
              {skills.slice(0, 5).map((skill) => {
                const pct = Math.min(100, Math.round(Number(skill.precision_promedio ?? 0)));
                return (
                  <div key={skill.id_habilidad ?? skill.habilidad} className="tov-progress-row">
                    <div className="tov-progress-row__track">
                      <div className="tov-progress-row__fill" style={{ height: `${Math.max(8, pct)}%` }} />
                    </div>
                    <div className="tov-progress-row__meta">
                      <span>{skill.habilidad}</span>
                      <strong>{pct}%</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="tov-activity-summary" onClick={() => setActiveModule("activity")}>
            <div className="tov-activity-summary__icon"><Layers size={16} /></div>
            <div className="tov-activity-summary__copy">
              <small>Actividad pedagógica</small>
              <strong>{focusGroup ? getSessionHeadline(focusGroup) : "Diseña la próxima actividad"}</strong>
              <em>{focusGroup && isSessionActive(focusGroup?.sesion_activa) ? getSessionSummaryText(focusGroup) : "No hay actividad pedagógica abierta en este momento."}</em>
            </div>
            <ChevronRight size={14} color="var(--tov-muted)" />
          </div>
          <div className="tov-recs-preview">
            <div className="tov-recs-preview__head">
              <span>Recomendaciones</span>
              <button onClick={() => setActiveModule("recs")}>Ver</button>
            </div>
            <p>{recs.length > 0 ? (recs[0].mensaje ?? recs[0].message ?? recs[0].recomendacion) : "Sin recomendaciones pendientes."}</p>
          </div>
        </div>

        {/* COL 3: Ranking */}
        <div className="tov-dash-panel tov-dash-panel--ranking">
          <div className="tov-dash-panel__head">
            <div>
              <span className="tov-dash-panel__eyebrow">RANKING</span>
              <h3 className="tov-dash-panel__title">Ranking de estudiantes</h3>
            </div>
            <button className="tov-panel-link" onClick={() => setActiveModule("ranking")}>
              Ver ranking <ChevronRight size={10} />
            </button>
          </div>
          {sortedStudents.length === 0 ? (
            <div className="tov-empty tov-empty--compact">
              <Users size={20} />
              <strong>Sin estudiantes</strong>
              <p>No hay datos de ranking para este grupo.</p>
            </div>
          ) : (
            <>
              <div className="tov-ranking-top">
                {[0, 1, 2].map((i) => {
                  const student = podiumStudents[i];
                  const rank = i + 1;
                  const colors = ["#f4c21f", "#28bd5f", "#0b84f3"];
                  return (
                    <div key={rank} className={`tov-ranking-podium tov-ranking-podium--${rank}`}>
                      <div className="tov-ranking-podium__avatar" style={{ backgroundColor: colors[i] }}>
                        {student ? resolveStudentInitials(student.nombre) : ""}
                      </div>
                      <strong>{student?.nombre ?? `#${rank}`}</strong>
                      <small>{student ? `${student.puntaje ?? student.valor ?? 0} pts` : `#${rank}: 0 pts`}</small>
                    </div>
                  );
                })}
              </div>
              <div className="tov-ranking-list">
                {listStudents.slice(0, 6).map((student, i) => {
                  const pts = student.puntaje ?? student.valor ?? 0;
                  return (
                    <div key={student.estudiante_id ?? `r-${i}`} className="tov-ranking-row">
                      <span>{student.posicion ?? podiumStudents.length + i + 1}°</span>
                      <strong>{student.nombre}</strong>
                      <em>{pts} pts</em>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

      </div>

      {/* MODAL */}
      <RoleModal
        open={Boolean(activeModule)}
        onClose={() => setActiveModule(null)}
        eyebrow={
          activeModule === "groups" ? "Gestión de clases" :
          activeModule === "ranking" ? (selectedGroup?.nombre ?? "Grupo") :
          activeModule === "activity" ? "Clase destacada" :
          activeModule === "skills" ? (focusGroup?.nombre ?? "Grupo") :
          "IA · Gemini"
        }
        title={
          activeModule === "groups" ? "Tus grupos" :
          activeModule === "ranking" ? "Ranking de estudiantes" :
          activeModule === "activity" ? (getSessionHeadline(focusGroup) || "Clase activa") :
          activeModule === "skills" ? "Precisión por habilidad" :
          "Recomendaciones"
        }
        width={640}
        actions={
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "space-between", width: "100%" }}>
            <button className="tov-modal-action" onClick={() => { const k = activeModule; setActiveModule(null); navigate(navLinks[k]); }}>
              Ir a {activeModule === "groups" ? "Grupos" : activeModule === "ranking" ? "Estudiantes" : activeModule === "activity" ? "Grupos" : activeModule === "skills" ? "Estadísticas" : "Recomendaciones"} <ChevronRight size={14} />
            </button>
            <button className="tov-modal-close" onClick={() => setActiveModule(null)}>Cerrar</button>
          </div>
        }
      >
        <div className="tov-modal-inner">
          {activeModule === "groups" && (
            groups.length === 0 ? (
              <div className="tov-empty">
                <BookOpen size={24} />
                <strong>Sin grupos</strong>
                <p>Crea tu primer grupo desde "Mis Grupos".</p>
              </div>
            ) : (
              <div className="tov-gcards">
                  {groups.map((group) => (
                    <GroupCard key={group.id} group={group} onToggle={handleToggle} loading={toggling} readonly />
                ))}
              </div>
            )
          )}

          {activeModule === "ranking" && (
            <div className="tov-ranking">
              {groups.length > 1 && (
                <div className="tov-ranking-group-select">
                  <label className="tov-ranking-group-select__label">Grupo:</label>
                  <select
                    className="tov-ranking-group-select__select"
                    value={rankingGroupId ?? ""}
                    onChange={(e) => {
                      const id = Number(e.target.value);
                      setRankingGroupId(id);
                      setShowClassif(false);
                      setShowNonPart(false);
                      void fetchRankingForGroup(id);
                    }}
                  >
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.nombre}</option>
                    ))}
                  </select>
                </div>
              )}

              {sortedStudents.length === 0 ? (
                <div className="tov-empty">
                  <Users size={24} />
                  <strong>Sin estudiantes</strong>
                  <p>No hay estudiantes registrados en este grupo.</p>
                </div>
              ) : (
                <>
                <div className="tov-podium">
                  {podiumStudents[1]
                    ? <PodiumSpot student={podiumStudents[1]} rank={2} />
                    : <PodiumSpotEmpty rank={2} />}
                  {podiumStudents[0]
                    ? <PodiumSpot student={podiumStudents[0]} rank={1} />
                    : <PodiumSpotEmpty rank={1} />}
                  {podiumStudents[2]
                    ? <PodiumSpot student={podiumStudents[2]} rank={3} />
                    : <PodiumSpotEmpty rank={3} />}
                </div>

                {listParticipants.length > 0 && (
                  <>
                    <button
                      className="tov-rank-toggle"
                      onClick={() => setShowClassif((v) => !v)}
                    >
                      <span className="tov-rank-toggle__left">
                        <Award size={14} strokeWidth={1.5} />
                        Clasificación
                      </span>
                      <span className="tov-rank-toggle__right">
                        <span className="tov-rank-toggle__badge">{listParticipants.length} más</span>
                        <ChevronDown size={16} className={`tov-rank-toggle__chevron ${showClassif ? "tov-rank-toggle__chevron--open" : ""}`} />
                      </span>
                    </button>
                    {showClassif && (
                      <div className="tov-rank-toggle__list">
                        {listParticipants.map((s, i) => (
                          <RankRow
                            key={s.estudiante_id ?? `p-${i}`}
                            student={s}
                            rank={podiumStudents.length + i + 1}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {listNonParticipants.length > 0 && (
                  <>
                    <button
                      className="tov-rank-toggle tov-rank-toggle--muted"
                      onClick={() => setShowNonPart((v) => !v)}
                    >
                      <span className="tov-rank-toggle__left">
                        <Clock size={14} strokeWidth={1.5} />
                        Sin participación
                      </span>
                      <span className="tov-rank-toggle__right">
                        <span className="tov-rank-toggle__badge tov-rank-toggle__badge--muted">{listNonParticipants.length}</span>
                        <ChevronDown size={16} className={`tov-rank-toggle__chevron ${showNonPart ? "tov-rank-toggle__chevron--open" : ""}`} />
                      </span>
                    </button>
                    {showNonPart && (
                      <div className="tov-rank-toggle__list">
                        {listNonParticipants.map((s, i) => (
                          <RankRow
                            key={s.estudiante_id ?? `np-${i}`}
                            student={s}
                            rank={podiumStudents.length + listParticipants.length + i + 1}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                <p className="tov-rank-footer">
                  {ranking?.metrica?.label ?? "Puntaje oficial"} · {sortedStudents.length} inscrito{sortedStudents.length !== 1 ? "s" : ""} · {podiumStudents.length} con participación
                </p>
                </>
              )}
            </div>
          )}

          {activeModule === "activity" && (
            <div className="tov-spotlight" style={{ border: "none", padding: 0, margin: 0, background: "transparent", boxShadow: "none" }}>
              <div className="tov-spotlight__ico">
                {isSessionActive(focusGroup?.sesion_activa) ? (
                  <Star size={20} strokeWidth={2} />
                ) : (
                  <Route size={20} strokeWidth={2} />
                )}
              </div>
              <span className="tov-spotlight__tag">
                {isSessionActive(focusGroup?.sesion_activa) ? getSessionModeLabel(focusGroup) : "Ruta pedagógica"}
              </span>
              <strong className="tov-spotlight__game">{getSessionHeadline(focusGroup)}</strong>
              <p className="tov-spotlight__desc">
                {isSessionActive(focusGroup?.sesion_activa)
                  ? getSessionSummaryText(focusGroup)
                  : "Abre una clase individual o construye una ruta pedagógica para que el estudiante avance paso a paso sin saltarse actividades."}
              </p>
            </div>
          )}

          {activeModule === "skills" && (
            skills.length === 0 ? (
              <div className="tov-empty">
                <BarChart2 size={24} />
                <strong>Sin datos</strong>
                <p>Abre una clase para ver la precisi&oacute;n por habilidad.</p>
              </div>
            ) : (
              <div className="tov-sbars">
                {skills.map((skill) => (
                  <SkillBar
                    key={skill.id_habilidad ?? skill.habilidad}
                    habilidad={skill.habilidad}
                    precision={skill.precision_promedio}
                  />
                ))}
                {skills[0]?.reaccion_promedio != null && (
                  <p className="tov-snote">
                    &#9889; Reacci&oacute;n prom: <strong>{Math.round(skills[0].reaccion_promedio)} ms</strong>
                  </p>
                )}
              </div>
            )
          )}

          {activeModule === "recs" && (
            recs.length === 0 ? (
              <div className="tov-empty">
                <Lightbulb size={24} />
                <strong>Sin recomendaciones</strong>
                <p>Abre una clase para recibir recomendaciones pedag&oacute;gicas.</p>
              </div>
            ) : (
              <div className="tov-recs">
                {recs.map((rec, index) => (
                  <div key={index} className="tov-rec">
                    <span className="tov-rec__tag">{rec.habilidad ?? rec.skill ?? "General"}</span>
                    <p className="tov-rec__msg">{rec.mensaje ?? rec.message ?? rec.recomendacion}</p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </RoleModal>

      <SessionClassModal
        show={sessionModal.open}
        groupName={sessionModal.group?.nombre ?? "grupo"}
        minijuegos={games}
        rutasPedagogicas={routes}
        onClose={closeSessionModal}
        onConfirm={handleConfirmOpenSession}
        isSubmitting={Boolean(toggling)}
        errorMessage={sessionModal.error}
      />

      <SesionesMetricsModal
        show={metricsModalOpen}
        onClose={() => setMetricsModalOpen(false)}
      />
    </div>
  );
}
