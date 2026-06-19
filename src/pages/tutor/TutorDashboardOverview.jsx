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
      <strong className="tov-kpi__val">{value}</strong>
      <span className="tov-kpi__lbl">{label}</span>
      {sublabel && <span className="tov-kpi__sub">{sublabel}</span>}
    </div>
  );
}

function StudentRow({ student, rank }) {
  const active = ["pendiente", "en_progreso"].includes(student.participante_estado);
  const initials = student.nombre?.slice(0, 2).toUpperCase() || "??";
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

function PodiumSpot({ student, rank }) {
  const pts = student.puntaje ?? student.valor ?? 0;
  const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(student.nombre || student.estudiante_id || "")}`;

  return (
    <div className={`tov-podium-spot tov-podium-spot--${rank}`}>
      <div className="tov-podium-spot__icon">
        {rank === 1 ? (
          <Crown size={20} strokeWidth={2} />
        ) : (
          <Award size={16} strokeWidth={2} />
        )}
      </div>
      <img className="tov-podium-spot__avatar" src={avatarUrl} alt={student.nombre} />
      <span className="tov-podium-spot__name">{student.nombre}</span>
      <span className="tov-podium-spot__label">
        {rank === 1 ? "1" : rank === 2 ? "2" : "3"}°
      </span>
      <span className="tov-podium-spot__pts">{pts} pts</span>
    </div>
  );
}

function RankRow({ student, rank }) {
  const pts = student.puntaje ?? student.valor ?? 0;
  const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(student.nombre || student.estudiante_id || "")}`;

  return (
    <div className="tov-rank-row">
      <span className="tov-rank-row__num">
        {rank}°
      </span>
      <img className="tov-rank-row__avatar" src={avatarUrl} alt={student.nombre} />
      <span className="tov-rank-row__name">{student.nombre}</span>
      <span className="tov-rank-row__pts">{pts} pts</span>
    </div>
  );
}

function GroupCard({ group, onToggle, loading }) {
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

  const flash = (type, text) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 3500);
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
      const rankingResult = await Promise.allSettled([
        rankingService.obtenerRankingGrupo(focusGroup.id),
      ]);

      setSkills(skillsResult.status === "fulfilled" ? skillsResult.value ?? [] : []);
      setRecs(recsResult.status === "fulfilled" ? recsResult.value ?? [] : []);
      setRanking(rankingResult[0]?.status === "fulfilled" ? rankingResult[0].value ?? null : null);
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
        <div className="tov-hero__text">
          <h1 className="tov-hero__h1">Panel del Tutor</h1>
          <p className="tov-hero__sub">
            {activeGroups > 0
              ? `${activeGroups} clase${activeGroups > 1 ? "s" : ""} abierta${activeGroups > 1 ? "s" : ""} · ${liveStudents} estudiante${liveStudents !== 1 ? "s" : ""} jugando ahora mismo.`
              : "No hay clases activas. Abre una actividad pedagógica cuando quieras empezar."}
          </p>
        </div>
        <div className="tov-hero__kpis">
          <KpiCard value={totalGroups} label="Total grupos" sublabel="Creados" Icon={BookOpen} />
          <KpiCard value={activeGroups} label="Clases abiertas" sublabel="Sesión activa" Icon={PlayCircle} variant="green" />
          <KpiCard value={pausedGroups} label="Clases cerradas" sublabel="Sin sesión" Icon={PauseCircle} />
          <KpiCard value={totalStudents} label="Estudiantes" sublabel="Registrados" Icon={Users} />
          <KpiCard value={liveStudents} label="Jugando ahora" sublabel="Con sesión activa" Icon={Target} variant="purple" />
          <KpiCard value={games.length} label="Juegos activos" sublabel="Catálogo pedagógico" Icon={Zap} />
        </div>
      </div>

      {/* MODULE GRID */}
      <div className="tov-module-grid">
        <button className="tov-module-card" onClick={() => setActiveModule("groups")}>
          <div className="tov-module-card__header">
            <div className="tov-module-card__icon"><BookOpen size={18} strokeWidth={1.5} /></div>
            <div className="tov-module-card__text">
              <span className="tov-module-card__title">Grupos</span>
              <span className="tov-module-card__subtitle">{totalGroups} grupo{totalGroups !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className="tov-module-card__preview">
            {groups.length === 0 ? (
              <div className="tov-module-card__preview-empty">Sin grupos</div>
            ) : (
              <div className="tov-module-card__preview-row">
                <span className="tov-module-card__preview-label">{groups[0].nombre}</span>
                <span className={`tov-module-card__preview-dot ${isSessionActive(groups[0].sesion_activa) ? "tov-module-card__preview-dot--live" : ""}`} />
              </div>
            )}
          </div>
          <div className="tov-module-card__footer">Ver detalle <ChevronRight size={12} strokeWidth={2} /></div>
        </button>

        <button className="tov-module-card" onClick={() => setActiveModule("ranking")}>
          <div className="tov-module-card__header">
            <div className="tov-module-card__icon"><Award size={18} strokeWidth={1.5} /></div>
            <div className="tov-module-card__text">
              <span className="tov-module-card__title">Ranking</span>
              <span className="tov-module-card__subtitle">{sortedStudents.length} estudiante{sortedStudents.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className="tov-module-card__preview">
            {sortedStudents.length === 0 ? (
              <div className="tov-module-card__preview-empty">Sin estudiantes</div>
            ) : (
              <div className="tov-module-card__preview-row">
                <span className="tov-module-card__preview-name">
                  {isSessionActive(sortedStudents[0].sesion_activa) && <span className="tov-module-card__preview-dot tov-module-card__preview-dot--live" />}
                  {sortedStudents[0].nombre}
                </span>
                <span className="tov-module-card__preview-value">#1</span>
              </div>
            )}
          </div>
          <div className="tov-module-card__footer">Ver detalle <ChevronRight size={12} strokeWidth={2} /></div>
        </button>

        <button className="tov-module-card" onClick={() => setActiveModule("activity")}>
          <div className="tov-module-card__header">
            <div className="tov-module-card__icon"><Star size={18} strokeWidth={1.5} /></div>
            <div className="tov-module-card__text">
              <span className="tov-module-card__title">Actividad</span>
              <span className="tov-module-card__subtitle">{focusGroup?.nombre ?? "Clase destacada"}</span>
            </div>
          </div>
          <div className="tov-module-card__preview">
            {focusGroup ? (
              <div className="tov-module-card__preview-row">
                <span className="tov-module-card__preview-label">{getSessionModeLabel(focusGroup) || "Individual"}</span>
                <span className="tov-module-card__preview-value">{getSessionStepsLabel(focusGroup) || "1 nivel"}</span>
              </div>
            ) : (
              <div className="tov-module-card__preview-empty">Sin clase activa</div>
            )}
          </div>
          <div className="tov-module-card__footer">Ver detalle <ChevronRight size={12} strokeWidth={2} /></div>
        </button>

        <button className="tov-module-card" onClick={() => setActiveModule("skills")}>
          <div className="tov-module-card__header">
            <div className="tov-module-card__icon"><BarChart2 size={18} strokeWidth={1.5} /></div>
            <div className="tov-module-card__text">
              <span className="tov-module-card__title">Precisi&oacute;n</span>
              <span className="tov-module-card__subtitle">{skills.length > 0 ? `${skills.length} habilidad${skills.length !== 1 ? "es" : ""}` : "Sin datos"}</span>
            </div>
          </div>
          <div className="tov-module-card__preview">
            {skills.length === 0 ? (
              <div className="tov-module-card__preview-empty">Sin datos de precisi&oacute;n</div>
            ) : (
              <div className="tov-module-card__preview-skill">
                <span className="tov-module-card__preview-skill-name">{skills[0].habilidad}</span>
                <div className="tov-module-card__preview-skill-bar">
                  <div className="tov-module-card__preview-skill-fill" style={{ width: `${Math.min(100, Math.round(Number(skills[0].precision_promedio ?? 0)))}%` }} />
                </div>
                <span className="tov-module-card__preview-skill-pct">{Math.round(Number(skills[0].precision_promedio ?? 0))}%</span>
              </div>
            )}
          </div>
          <div className="tov-module-card__footer">Ver detalle <ChevronRight size={12} strokeWidth={2} /></div>
        </button>

        <button className="tov-module-card" onClick={() => setActiveModule("recs")}>
          <div className="tov-module-card__header">
            <div className="tov-module-card__icon"><Lightbulb size={18} strokeWidth={1.5} /></div>
            <div className="tov-module-card__text">
              <span className="tov-module-card__title">Recomendaciones</span>
              <span className="tov-module-card__subtitle">{recs.length} pendiente{recs.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
          <div className="tov-module-card__preview">
            {recs.length === 0 ? (
              <div className="tov-module-card__preview-empty">Sin recomendaciones</div>
            ) : (
              <div className="tov-module-card__preview-rec">
                <strong>{recs[0].habilidad ?? recs[0].skill ?? "General"}:</strong> {recs[0].mensaje ?? recs[0].message ?? recs[0].recomendacion}
              </div>
            )}
          </div>
          <div className="tov-module-card__footer">Ver detalle <ChevronRight size={12} strokeWidth={2} /></div>
        </button>

        <button className="tov-module-card" onClick={() => setMetricsModalOpen(true)}>
          <div className="tov-module-card__header">
            <div className="tov-module-card__icon"><BarChart3 size={18} strokeWidth={1.5} /></div>
            <div className="tov-module-card__text">
              <span className="tov-module-card__title">M&eacute;tricas</span>
              <span className="tov-module-card__subtitle">Resumen de sesiones</span>
            </div>
          </div>
          <div className="tov-module-card__preview">
            {students.length === 0 ? (
              <div className="tov-module-card__preview-empty">Sin datos</div>
            ) : (
              <div className="tov-module-card__preview-row">
                <span className="tov-module-card__preview-label">{totalStudents} estudiante{totalStudents !== 1 ? "s" : ""}</span>
                <span className="tov-module-card__preview-value">{liveStudents} activo{liveStudents !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
          <div className="tov-module-card__footer">Abrir <ChevronRight size={12} strokeWidth={2} /></div>
        </button>
      </div>

      {/* MODAL */}
      <RoleModal
        open={Boolean(activeModule)}
        onClose={() => setActiveModule(null)}
        eyebrow={
          activeModule === "groups" ? "Gestión de clases" :
          activeModule === "ranking" ? "Actividad de hoy" :
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
                  <GroupCard key={group.id} group={group} onToggle={handleToggle} loading={toggling} />
                ))}
              </div>
            )
          )}

          {activeModule === "ranking" && (
            sortedStudents.length === 0 ? (
              <div className="tov-empty">
                <Users size={24} />
                <strong>Sin estudiantes</strong>
                <p>No hay estudiantes registrados en tus grupos.</p>
              </div>
            ) : (
              <div className="tov-ranking">
                {sortedStudents.length >= 1 && (
                  <div className="tov-podium">
                    {sortedStudents.length >= 2 && (
                      <PodiumSpot student={sortedStudents[1]} rank={2} />
                    )}
                    <PodiumSpot student={sortedStudents[0]} rank={1} />
                    {sortedStudents.length >= 3 && (
                      <PodiumSpot student={sortedStudents[2]} rank={3} />
                    )}
                  </div>
                )}

                {sortedStudents.length > 3 && (
                  <div className="tov-rank-list">
                    {sortedStudents.slice(3).map((s, i) => (
                      <RankRow
                        key={s.estudiante_id ?? `${s.nombre}-${i}`}
                        student={s}
                        rank={i + 4}
                      />
                    ))}
                  </div>
                )}

                <p className="tov-more">
                  {ranking?.metrica?.label ?? "Puntaje oficial"} · {sortedStudents.length} participante{sortedStudents.length !== 1 ? "s" : ""}
                </p>
              </div>
            )
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
