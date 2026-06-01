/**
 * TutorDashboardOverview
 *
 * POR QUE:
 * - muestra el pulso pedagógico del tutor sin acoplarse a un minijuego fijo
 * - usa el contrato nuevo de sesiones de clase (`single` / `path`)
 * - relee el estado desde backend después de cada cambio importante
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Users,
  PlayCircle,
  PauseCircle,
  TrendingUp,
  Award,
  Clock,
  ChevronRight,
  Zap,
  Lightbulb,
  BarChart2,
  Star,
  Target,
  Route,
} from "lucide-react";
import SessionClassModal from "../../components/tutor/SessionClassModal";
import { useAuth } from "../../hooks/useAuth";
import tutorGroupsService from "../../services/tutorGroupsService";
import estudianteService from "../../services/estudianteService";
import estadisticasService from "../../services/estadisticasService";
import recomendacionesService from "../../services/recomendacionesService";
import {
  getSessionHeadline,
  getSessionOpenSuccessMessage,
  getSessionModeLabel,
  getSessionStepsLabel,
  getSessionSummaryText,
  isSessionActive,
} from "../../utils/sessionClassUi";
import "../../styles/tutor-ov.css";

const getSaludo = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 18) return "Buenas tardes";
  return "Buenas noches";
};

const AVATAR_COLORS = ["#bc59b1", "#9b4d96", "#F9A825", "#e8920a", "#7a3575", "#f0b429"];
const avatarColor = (index) => AVATAR_COLORS[index % AVATAR_COLORS.length];

function KpiCard({ value, label, sublabel, Icon, accent }) {
  return (
    <div className="tov-kpi">
      <div className="tov-kpi__left">
        <div className="tov-kpi__ico" style={{ background: accent }}>
          <Icon size={18} strokeWidth={2.2} />
        </div>
        <div>
          <span className="tov-kpi__lbl">{label}</span>
          {sublabel && <span className="tov-kpi__sub">{sublabel}</span>}
        </div>
      </div>
      <strong className="tov-kpi__val" style={{ color: accent }}>
        {value}
      </strong>
    </div>
  );
}

function StudentRow({ student, rank }) {
  const active = isSessionActive(student.sesion_activa);
  const initials = student.nombre?.slice(0, 2).toUpperCase() || "??";

  return (
    <div className={`tov-student ${active ? "tov-student--live" : ""}`}>
      <span className="tov-student__rank">#{rank}</span>
      <div className="tov-student__avatar" style={{ background: avatarColor(rank - 1) }}>
        {initials}
      </div>
      <div className="tov-student__info">
        <span className="tov-student__name">{student.nombre}</span>
        <span className="tov-student__meta">
          {active ? "● Jugando ahora" : "Sin sesión activa"} · Edad {student.edad ?? "—"}
        </span>
      </div>
      {active && <span className="tov-student__live">Live</span>}
    </div>
  );
}

function GroupCard({ group, onToggle, loading }) {
  const navigate = useNavigate();
  const active = isSessionActive(group.sesion_activa);

  return (
    <div className={`tov-gcard ${active ? "tov-gcard--on" : ""}`}>
      <div className="tov-gcard__header">
        <div className={`tov-gcard__dot ${active ? "tov-gcard__dot--on" : "tov-gcard__dot--off"}`} />
        <span className="tov-gcard__status">{active ? "Clase abierta" : "Cerrada"}</span>
      </div>

      <h3 className="tov-gcard__name">{group.nombre}</h3>
      <p className="tov-gcard__desc">{group.descripcion?.slice(0, 56) || "Sin descripción"}</p>
      <div className="d-flex flex-wrap gap-2 mb-2">
        <span className="badge bg-light text-dark border">{getSessionModeLabel(group)}</span>
        <span className="badge bg-light text-dark border">{getSessionStepsLabel(group)}</span>
      </div>
      <p className="tov-gcard__desc">{getSessionSummaryText(group)}</p>

      <div className="tov-gcard__footer">
        <button
          className={`tov-gcard__btn ${active ? "tov-gcard__btn--close" : "tov-gcard__btn--open"}`}
          disabled={loading === group.id}
          onClick={() => onToggle(group)}
        >
          {loading === group.id ? "…" : active ? "Cerrar" : "Abrir actividad"}
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.nombre?.split(" ")[0] || "Profe";

  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [games, setGames] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [skills, setSkills] = useState([]);
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [toast, setToast] = useState(null);
  const [sessionModal, setSessionModal] = useState({
    open: false,
    group: null,
    error: "",
  });

  const flash = (type, text) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 3500);
  };

  const loadOverview = async () => {
    try {
      setLoading(true);

      const [loadedGroups, loadedStudents, loadedGames, loadedRoutes] = await Promise.all([
        tutorGroupsService.getGroups(),
        estudianteService.listEstudiantes(),
        tutorGroupsService.listarMinijuegosActivos(),
        tutorGroupsService.listarRutasPedagogicas(),
      ]);

      setGroups(loadedGroups);
      setStudents(loadedStudents);
      setGames(loadedGames);
      setRoutes(loadedRoutes);

      const focusGroup = loadedGroups.find((group) => isSessionActive(group.sesion_activa)) ?? loadedGroups[0];
      if (!focusGroup?.id) {
        setSkills([]);
        setRecs([]);
        return;
      }

      const [skillsResult, recsResult] = await Promise.allSettled([
        estadisticasService.porGrupo(focusGroup.id),
        recomendacionesService.porGrupo(focusGroup.id),
      ]);

      setSkills(skillsResult.status === "fulfilled" ? skillsResult.value ?? [] : []);
      setRecs(recsResult.status === "fulfilled" ? recsResult.value ?? [] : []);
    } catch (error) {
      flash("err", error?.message ?? "No fue posible cargar el panel del tutor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const totalGroups = groups.length;
  const activeGroups = groups.filter((group) => isSessionActive(group.sesion_activa)).length;
  const pausedGroups = totalGroups - activeGroups;
  const totalStudents = students.length;
  const liveStudents = students.filter((student) => isSessionActive(student.sesion_activa)).length;

  const focusGroup = useMemo(
    () => groups.find((group) => isSessionActive(group.sesion_activa)) ?? groups[0] ?? null,
    [groups]
  );

  const sortedStudents = useMemo(
    () =>
      [...students].sort((a, b) => {
        const aLive = isSessionActive(a.sesion_activa) ? 0 : 1;
        const bLive = isSessionActive(b.sesion_activa) ? 0 : 1;
        return aLive - bLive || a.nombre.localeCompare(b.nombre);
      }),
    [students]
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

  const spotlightTitle = getSessionHeadline(focusGroup);

  const spotlightDescription = isSessionActive(focusGroup?.sesion_activa)
    ? getSessionSummaryText(focusGroup)
    : "Abre una clase individual o construye una ruta pedagógica para que el estudiante avance paso a paso sin saltarse actividades.";

  return (
    <div className="tov">
      {toast && <div className={`tov-toast tov-toast--${toast.type}`}>{toast.text}</div>}

      <div className="tov-hero">
        <div className="tov-hero__text">
          <p className="tov-hero__eye">
            {getSaludo()}, {firstName} 👋
          </p>
          <h1 className="tov-hero__h1">Panel del Tutor</h1>
          <p className="tov-hero__sub">
            {activeGroups > 0
              ? `${activeGroups} clase${activeGroups > 1 ? "s" : ""} abierta${activeGroups > 1 ? "s" : ""} · ${liveStudents} estudiante${liveStudents !== 1 ? "s" : ""} jugando ahora mismo.`
              : "No hay clases activas. Abre una actividad pedagógica cuando quieras empezar."}
          </p>
        </div>
        <div className="tov-hero__pills">
          {[
            { n: totalGroups, l: "Grupos" },
            { n: activeGroups, l: "Activos" },
            { n: totalStudents, l: "Estudiantes" },
            { n: liveStudents, l: "Jugando" },
          ].map(({ n, l }) => (
            <div key={l} className="tov-hero__pill">
              <strong>{n}</strong>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="tov-kpis">
        <KpiCard value={totalGroups} label="Total grupos" sublabel="Creados" Icon={BookOpen} accent="#bc59b1" />
        <KpiCard value={activeGroups} label="Clases abiertas" sublabel="Sesión activa" Icon={PlayCircle} accent="#F9A825" />
        <KpiCard value={pausedGroups} label="Clases cerradas" sublabel="Sin sesión" Icon={PauseCircle} accent="#bc59b1" />
        <KpiCard value={totalStudents} label="Estudiantes" sublabel="Registrados" Icon={Users} accent="#bc59b1" />
        <KpiCard value={liveStudents} label="Jugando ahora" sublabel="Con sesión activa" Icon={Target} accent="#F9A825" />
        <KpiCard value={games.length} label="Juegos activos" sublabel="Catálogo pedagógico" Icon={Zap} accent="#bc59b1" />
      </div>

      <div className="tov-bento">
        <div className="tov-main">
          <div className="tov-panel">
            <div className="tov-ph">
              <div>
                <span className="tov-eye">Gestión de clases</span>
                <h2 className="tov-ptitle">Tus grupos</h2>
              </div>
              <button className="tov-ilink" onClick={() => navigate("/tutor/grupos")}>
                Ver todos <ChevronRight size={13} />
              </button>
            </div>
            {groups.length === 0 ? (
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
            )}
          </div>

          {students.length > 0 && (
            <div className="tov-panel">
              <div className="tov-ph">
                <div>
                  <span className="tov-eye">Actividad de hoy</span>
                  <h2 className="tov-ptitle">Ranking de estudiantes</h2>
                </div>
                <button className="tov-ilink" onClick={() => navigate("/tutor/estudiantes")}>
                  Ver todos <ChevronRight size={13} />
                </button>
              </div>
              <div className="tov-students">
                {sortedStudents.slice(0, 8).map((student, index) => (
                  <StudentRow key={student.id} student={student} rank={index + 1} />
                ))}
                {students.length > 8 && <p className="tov-more">+{students.length - 8} estudiantes más</p>}
              </div>
            </div>
          )}
        </div>

        <div className="tov-side">
          <div className="tov-spotlight">
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
            <strong className="tov-spotlight__game">{spotlightTitle}</strong>
            <p className="tov-spotlight__desc">{spotlightDescription}</p>
            <button className="tov-spotlight__btn" onClick={() => navigate("/tutor/grupos")}>
              Configurar clases <ChevronRight size={13} />
            </button>
          </div>

          {skills.length > 0 && (
            <div className="tov-panel">
              <div className="tov-ph">
                <div>
                  <span className="tov-eye">{focusGroup?.nombre ?? "Grupo"}</span>
                  <h2 className="tov-ptitle">Precisión por habilidad</h2>
                </div>
                <button className="tov-ilink" onClick={() => navigate("/tutor/estadisticas")}>
                  <BarChart2 size={14} />
                </button>
              </div>
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
                    ⚡ Reacción prom: <strong>{Math.round(skills[0].reaccion_promedio)} ms</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {recs.length > 0 && (
            <div className="tov-panel">
              <div className="tov-ph">
                <div>
                  <span className="tov-eye">IA · Gemini</span>
                  <h2 className="tov-ptitle">Recomendaciones</h2>
                </div>
                <Lightbulb size={15} color="#bc59b1" />
              </div>
              <div className="tov-recs">
                {recs.slice(0, 3).map((rec, index) => (
                  <div key={index} className="tov-rec">
                    <span className="tov-rec__tag">{rec.habilidad ?? rec.skill ?? "General"}</span>
                    <p className="tov-rec__msg">{rec.mensaje ?? rec.message ?? rec.recomendacion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="tov-panel">
            <span className="tov-eye">Navegación</span>
            <h2 className="tov-ptitle" style={{ marginBottom: "0.7rem" }}>
              Ir a
            </h2>
            <div className="tov-actions">
              {[
                { Icon: BookOpen, label: "Mis grupos", path: "/tutor/grupos" },
                { Icon: Users, label: "Estudiantes", path: "/tutor/estudiantes" },
                { Icon: Clock, label: "Sesiones", path: "/tutor/sesiones" },
                { Icon: TrendingUp, label: "Estadísticas", path: "/tutor/estadisticas" },
                { Icon: Award, label: "Logros", path: "/tutor/logros" },
              ].map(({ Icon, label, path }) => (
                <button key={label} className="tov-act" onClick={() => navigate(path)}>
                  <div className="tov-act__ico">
                    <Icon size={14} strokeWidth={2.3} />
                  </div>
                  <span>{label}</span>
                  <ChevronRight size={13} className="tov-act__arr" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

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
    </div>
  );
}
