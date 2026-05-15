/**
 * TutorDashboardOverview — Bento profesional con ranking de estudiantes
 * Guía visual: fondo blanco/gris, amarillo SOLO como acento,
 * pink como color de marca, estilo SaaS moderno con leaderboard.
 *
 * Datos:
 *   GET /grupos           → grupos + sesion_activa
 *   GET /estudiantes      → lista completa (nombre, sesion_activa, grupo_id)
 *   GET /minijuegos       → catálogo activo
 *   GET /estadisticas/grupo/:id  → precisión por habilidad
 *   GET /recomendaciones/grupo/:id → recomendaciones IA
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, Users, PlayCircle, PauseCircle,
  TrendingUp, Award, Clock, ChevronRight,
  Zap, Lightbulb, BarChart2, Star, Target,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import tutorGroupsService from "../../services/tutorGroupsService";
import estudianteService from "../../services/estudianteService";
import estadisticasService from "../../services/estadisticasService";
import recomendacionesService from "../../services/recomendacionesService";
import { request } from "../../services/httpClient";
import "../../styles/tutor-ov.css";

const isSesion = (v) => v === true || v === "true" || v === "t" || v === 1;

const getSaludo = () => {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 18) return "Buenas tardes";
  return "Buenas noches";
};

// Colores de avatar circulares para estudiantes
const AVATAR_COLORS = ["#bc59b1","#9b4d96","#F9A825","#e8920a","#7a3575","#f0b429"];
const avatarColor = (idx) => AVATAR_COLORS[idx % AVATAR_COLORS.length];

// ─── KPI Card blanca con número grande ───────────────────────────────────────
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
      <strong className="tov-kpi__val" style={{ color: accent }}>{value}</strong>
    </div>
  );
}

// ─── Fila estudiante en ranking ────────────────────────────────────────────────
function StudentRow({ student, rank }) {
  const active = isSesion(student.sesion_activa);
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

// ─── Grupo card ─────────────────────────────────────────────────────────────
function GroupCard({ group, onToggle, loading }) {
  const navigate = useNavigate();
  const active = isSesion(group.sesion_activa);
  return (
    <div className={`tov-gcard ${active ? "tov-gcard--on" : ""}`}>
      <div className="tov-gcard__header">
        <div className={`tov-gcard__dot ${active ? "tov-gcard__dot--on" : "tov-gcard__dot--off"}`} />
        <span className="tov-gcard__status">{active ? "Clase abierta" : "Cerrada"}</span>
      </div>
      <h3 className="tov-gcard__name">{group.nombre}</h3>
      <p className="tov-gcard__desc">{group.descripcion?.slice(0, 48) || "Sin descripción"}</p>
      <div className="tov-gcard__footer">
        <button
          className={`tov-gcard__btn ${active ? "tov-gcard__btn--close" : "tov-gcard__btn--open"}`}
          disabled={loading === group.id}
          onClick={() => onToggle(group)}
        >
          {loading === group.id ? "…" : active ? "Cerrar" : "Abrir sesión"}
        </button>
        <button className="tov-gcard__arrow" onClick={() => navigate("/tutor/grupos")}>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Barra de habilidad ───────────────────────────────────────────────────────
function SkillBar({ habilidad, precision }) {
  const p = Math.min(100, Math.round(Number(precision ?? 0)));
  const level = p >= 75 ? "high" : p >= 45 ? "mid" : "low";
  return (
    <div className="tov-sbar">
      <div className="tov-sbar__info">
        <span className="tov-sbar__name">{habilidad}</span>
        <span className="tov-sbar__pct">{p}%</span>
      </div>
      <div className="tov-sbar__track">
        <div className={`tov-sbar__fill tov-sbar__fill--${level}`} style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function TutorDashboardOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.nombre?.split(" ")[0] || "Profe";

  const [groups,   setGroups]   = useState([]);
  const [students, setStudents] = useState([]);
  const [games,    setGames]    = useState([]);
  const [skills,   setSkills]   = useState([]);
  const [recs,     setRecs]     = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [toggling, setToggling] = useState(null);
  const [toast,    setToast]    = useState(null);

  useEffect(() => {
    const boot = async () => {
      try {
        const [g, s, gms] = await Promise.all([
          tutorGroupsService.getGroups(),
          estudianteService.listEstudiantes(),
          request("/minijuegos").then((p) => p?.data ?? (Array.isArray(p) ? p : [])),
        ]);
        setGroups(g);
        setStudents(s);
        setGames(gms);

        const focus = g.find((gr) => isSesion(gr.sesion_activa)) ?? g[0];
        if (focus?.id) {
          const [sk, rc] = await Promise.allSettled([
            estadisticasService.porGrupo(focus.id),
            recomendacionesService.porGrupo(focus.id),
          ]);
          if (sk.status === "fulfilled") setSkills(sk.value ?? []);
          if (rc.status === "fulfilled") setRecs(rc.value ?? []);
        }
      } catch (_) {/* silent */}
      finally { setLoading(false); }
    };
    boot();
  }, []);

  const totalGroups   = groups.length;
  const activeGroups  = groups.filter((g) => isSesion(g.sesion_activa)).length;
  const pausedGroups  = totalGroups - activeGroups;
  const totalStudents = students.length;
  const liveStudents  = students.filter((s) => isSesion(s.sesion_activa)).length;
  const focusGroup    = groups.find((g) => isSesion(g.sesion_activa)) ?? groups[0];

  // Ordenar: primero los que están jugando, luego el resto
  const sortedStudents = [...students].sort((a, b) => {
    const aL = isSesion(a.sesion_activa) ? 0 : 1;
    const bL = isSesion(b.sesion_activa) ? 0 : 1;
    return aL - bL || a.nombre.localeCompare(b.nombre);
  });

  const handleToggle = async (group) => {
    const next = !isSesion(group.sesion_activa);
    setToggling(group.id);
    try {
      if (next) await tutorGroupsService.abrirSesionClase(group.id);
      else      await tutorGroupsService.cerrarSesionClase(group.id);
      setGroups((prev) =>
        prev.map((g) => g.id === group.id ? { ...g, sesion_activa: next } : g)
      );
      flash("ok", next ? `"${group.nombre}" abierta ✓` : `"${group.nombre}" cerrada.`);
    } catch (err) {
      flash("err", err?.message ?? "Error al cambiar sesión.");
    } finally { setToggling(null); }
  };

  const flash = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3500);
  };

  if (loading) return (
    <div className="tov-loading">
      <div className="tov-loading__ring" />
      <span>Cargando panel…</span>
    </div>
  );

  return (
    <div className="tov">
      {toast && <div className={`tov-toast tov-toast--${toast.type}`}>{toast.text}</div>}

      {/* ── HERO — amarillo como acento fuerte ────────────────────────────── */}
      <div className="tov-hero">
        <div className="tov-hero__text">
          <p className="tov-hero__eye">{getSaludo()}, {firstName} 👋</p>
          <h1 className="tov-hero__h1">Panel del Tutor</h1>
          <p className="tov-hero__sub">
            {activeGroups > 0
              ? `${activeGroups} clase${activeGroups > 1 ? "s" : ""} abierta${activeGroups > 1 ? "s" : ""} · ${liveStudents} estudiante${liveStudents !== 1 ? "s" : ""} jugando ahora mismo.`
              : "No hay clases activas. Abre una sesión para que los estudiantes puedan jugar."}
          </p>
        </div>
        <div className="tov-hero__pills">
          {[
            { n: totalGroups,   l: "Grupos" },
            { n: activeGroups,  l: "Activos" },
            { n: totalStudents, l: "Estudiantes" },
            { n: liveStudents,  l: "Jugando" },
          ].map(({ n, l }) => (
            <div key={l} className="tov-hero__pill">
              <strong>{n}</strong>
              <span>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── KPIs — blancas, número grande con acento de color ─────────────── */}
      <div className="tov-kpis">
        <KpiCard value={totalGroups}   label="Total grupos"      sublabel="Creados"               Icon={BookOpen}    accent="#bc59b1" />
        <KpiCard value={activeGroups}  label="Clases abiertas"   sublabel="Sesión activa"          Icon={PlayCircle}  accent="#F9A825" />
        <KpiCard value={pausedGroups}  label="Clases cerradas"   sublabel="Sin sesión"             Icon={PauseCircle} accent="#bc59b1" />
        <KpiCard value={totalStudents} label="Estudiantes"       sublabel="Registrados"            Icon={Users}       accent="#bc59b1" />
        <KpiCard value={liveStudents}  label="Jugando ahora"     sublabel="Con sesión activa"      Icon={Target}      accent="#F9A825" />
        <KpiCard value={games.length}  label="Juegos activos"    sublabel="Código Estelar ★"      Icon={Zap}         accent="#bc59b1" />
      </div>

      {/* ── BENTO GRID ───────────────────────────────────────────────────── */}
      <div className="tov-bento">

        {/* Columna principal (2/3) */}
        <div class="tov-main">

          {/* GRUPOS */}
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
                {groups.map((g) => (
                  <GroupCard key={g.id} group={g} onToggle={handleToggle} loading={toggling} />
                ))}
              </div>
            )}
          </div>

          {/* RANKING ESTUDIANTES */}
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
                {sortedStudents.slice(0, 8).map((s, i) => (
                  <StudentRow key={s.id} student={s} rank={i + 1} />
                ))}
                {students.length > 8 && (
                  <p className="tov-more">+{students.length - 8} estudiantes más</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Columna lateral (1/3) */}
        <div className="tov-side">

          {/* Código Estelar highlight */}
          <div className="tov-spotlight">
            <div className="tov-spotlight__ico"><Star size={20} strokeWidth={2} /></div>
            <span className="tov-spotlight__tag">Juego activo</span>
            <strong className="tov-spotlight__game">Código Estelar</strong>
            <p className="tov-spotlight__desc">
              Ranking en tiempo real vía WebSocket. Puntaje, aciertos y combo en vivo mientras la clase está abierta.
            </p>
            <button className="tov-spotlight__btn" onClick={() => navigate("/tutor/sesiones")}>
              Ver sesiones <ChevronRight size={13} />
            </button>
          </div>

          {/* Habilidades del grupo activo */}
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
                {skills.map((s) => (
                  <SkillBar key={s.id_habilidad ?? s.habilidad} habilidad={s.habilidad} precision={s.precision_promedio} />
                ))}
                {skills[0]?.reaccion_promedio != null && (
                  <p className="tov-snote">⚡ Reacción prom: <strong>{Math.round(skills[0].reaccion_promedio)} ms</strong></p>
                )}
              </div>
            </div>
          )}

          {/* Recomendaciones IA */}
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
                {recs.slice(0, 3).map((r, i) => (
                  <div key={i} className="tov-rec">
                    <span className="tov-rec__tag">{r.habilidad ?? r.skill ?? "General"}</span>
                    <p className="tov-rec__msg">{r.mensaje ?? r.message ?? r.recomendacion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones rápidas */}
          <div className="tov-panel">
            <span className="tov-eye">Navegación</span>
            <h2 className="tov-ptitle" style={{ marginBottom: "0.7rem" }}>Ir a</h2>
            <div className="tov-actions">
              {[
                { Icon: BookOpen,   label: "Mis grupos",   path: "/tutor/grupos"       },
                { Icon: Users,      label: "Estudiantes",  path: "/tutor/estudiantes"  },
                { Icon: Clock,      label: "Sesiones",     path: "/tutor/sesiones"     },
                { Icon: TrendingUp, label: "Estadísticas", path: "/tutor/estadisticas" },
                { Icon: Award,      label: "Logros",       path: "/tutor/logros"       },
              ].map(({ Icon, label, path }) => (
                <button key={label} className="tov-act" onClick={() => navigate(path)}>
                  <div className="tov-act__ico"><Icon size={14} strokeWidth={2.3} /></div>
                  <span>{label}</span>
                  <ChevronRight size={13} className="tov-act__arr" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
