import { useEffect, useMemo, useState } from "react";
import { Alert, Spinner } from "react-bootstrap";
import {
  Award,
  Download,
  Lock,
  Medal,
  Rocket,
  Search,
  Share2,
  Star,
  Trophy,
  Zap,
} from "lucide-react";
import estudianteService from "../../services/estudianteService";
import logrosService from "../../services/logrosService";
import tutorGroupsService from "../../services/tutorGroupsService";
import "../../styles/tutor-logros.css";

const normalizeId = (value) => String(value ?? "");

const ACHIEVEMENT_FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "completados", label: "Completados" },
  { id: "pendientes", label: "Pendientes" },
];

const formatDate = (value) => {
  if (!value) {
    return "Fecha pendiente";
  }

  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const resolveAchievementXp = (achievement) =>
  achievement?.xp ?? achievement?.puntos_xp ?? achievement?.puntos ?? null;

const resolveCatalogKey = (achievement) =>
  achievement?.clave ?? achievement?.clave_logro ?? achievement?.id_catalogo_logro;

const resolveIcon = (achievement, unlocked) => {
  return unlocked ? "star" : "lock";
};

const buildInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "LK";

export default function TutorLogrosPage() {
  const [grupos, setGrupos] = useState([]);
  const [grupoId, setGrupoId] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [estudianteId, setEstudianteId] = useState("");
  const [catalogo, setCatalogo] = useState([]);
  const [logros, setLogros] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    const cargarGrupos = async () => {
      try {
        const groups = await tutorGroupsService.getGroups();
        const normalizedGroups = groups.map((grupo) => ({
          ...grupo,
          id: grupo.id ?? grupo.id_grupo,
        }));

        setGrupos(normalizedGroups);
        setGrupoId(normalizeId(normalizedGroups[0]?.id));
      } catch (loadError) {
        setError(loadError.message || "No fue posible cargar los grupos.");
      } finally {
        setIsLoading(false);
      }
    };

    cargarGrupos();
  }, []);

  useEffect(() => {
    const cargarEstudiantes = async () => {
      if (!grupoId) {
        setEstudiantes([]);
        setEstudianteId("");
        return;
      }

      try {
        const students = await estudianteService.listEstudiantes(Number(grupoId));
        const normalizedStudents = students.map((student) => ({
          ...student,
          id: student.id ?? student.id_estudiante,
        }));

        setEstudiantes(normalizedStudents);
        setEstudianteId((current) =>
          current && normalizedStudents.some((student) => normalizeId(student.id) === current)
            ? current
            : normalizeId(normalizedStudents[0]?.id),
        );
      } catch (loadError) {
        setError(loadError.message || "No fue posible cargar los estudiantes.");
        setEstudiantes([]);
      }
    };

    cargarEstudiantes();
  }, [grupoId]);

  useEffect(() => {
    const cargarLogros = async () => {
      if (!estudianteId) {
        setCatalogo([]);
        setLogros([]);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        const [catalogData, unlockedData] = await Promise.all([
          logrosService.listCatalog(Number(estudianteId)),
          logrosService.listByStudent(Number(estudianteId)),
        ]);

        setCatalogo(catalogData);
        setLogros(unlockedData);
      } catch (loadError) {
        setError(loadError.message || "No fue posible cargar los logros.");
        setCatalogo([]);
        setLogros([]);
      } finally {
        setIsLoading(false);
      }
    };

    cargarLogros();
  }, [estudianteId]);

  const grupoActual = useMemo(
    () => grupos.find((grupo) => normalizeId(grupo.id) === grupoId),
    [grupoId, grupos],
  );

  const estudianteActual = useMemo(
    () => estudiantes.find((student) => normalizeId(student.id) === estudianteId),
    [estudianteId, estudiantes],
  );

  const studentName = estudianteActual?.nombre ?? "";

  const logrosByKey = useMemo(
    () => new Map(logros.map((logro) => [logro.clave_logro, logro])),
    [logros],
  );

  const catalogoEnriquecido = useMemo(
    () =>
      catalogo.map((item, index) => {
        const key = resolveCatalogKey(item);
        const unlocked = logrosByKey.get(key) ?? null;
        const desbloqueado = Boolean(item.desbloqueado || unlocked);

        return {
          ...item,
          key,
          desbloqueado,
          unlocked,
          xp: resolveAchievementXp(item),
          iconoFinal: resolveIcon(item, desbloqueado),
        };
      }),
    [catalogo, logrosByKey],
  );

  const resumen = useMemo(() => {
    const desbloqueados = catalogoEnriquecido.filter((logro) => logro.desbloqueado).length;

    return {
      total: catalogoEnriquecido.length,
      desbloqueados,
      pendientes: Math.max(catalogoEnriquecido.length - desbloqueados, 0),
      progreso: catalogoEnriquecido.length
        ? Math.round((desbloqueados / catalogoEnriquecido.length) * 100)
        : 0,
    };
  }, [catalogoEnriquecido]);

  const catalogoFiltrado = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return catalogoEnriquecido.filter((item) => {
      const coincideFiltro =
        filtro === "todos" ||
        (filtro === "completados" && item.desbloqueado) ||
        (filtro === "pendientes" && !item.desbloqueado);

      const coincideBusqueda =
        !texto ||
        item.nombre?.toLowerCase().includes(texto) ||
        item.descripcion?.toLowerCase().includes(texto);

      return coincideFiltro && coincideBusqueda;
    });
  }, [busqueda, catalogoEnriquecido, filtro]);

  const actividadReciente = useMemo(
    () =>
      [...logros]
        .sort((a, b) => new Date(b.desbloqueado_en ?? 0) - new Date(a.desbloqueado_en ?? 0))
        .slice(0, 4),
    [logros],
  );

  return (
    <section className="lk-achievements-page">

      {/* Header */}
      <div className="lk-ach-page-header">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap" }}>
          <h1>Logros de Estudiantes</h1>
          <select className="lk-ach-filter-select" value={grupoId} onChange={(e) => { setGrupoId(e.target.value); setEstudianteId(""); }}>
            <option value="">Grupo A, Grupo B, Todos</option>
            {grupos.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>
        </div>
        {estudianteId === "" && grupoId && (
          <div style={{ marginTop:"0.5rem" }}>
            <select className="lk-ach-filter-select" value={estudianteId} onChange={(e) => setEstudianteId(e.target.value)}>
              <option value="">Seleccionar estudiante</option>
              {estudiantes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
        )}
      </div>

      {error && <div className="tutor-alert tutor-alert--error" style={{ marginBottom:"1rem" }}><span>{error}</span></div>}

      {isLoading ? (
        <div style={{ textAlign:"center", padding:"3rem", color:"#6B6B8A" }}>Cargando logros...</div>
      ) : !estudianteId ? (
        <div style={{ background:"#fff", borderRadius:"1.25rem", padding:"3rem", textAlign:"center", border:"1px solid #E2DCF0" }}>
          <Trophy size={48} style={{ color:"#C4AEE0" }} />
          <strong style={{ display:"block", marginTop:"0.75rem", color:"#1A1A2E" }}>Selecciona un grupo y un estudiante</strong>
          <span style={{ color:"#6B6B8A", fontSize:"0.85rem" }}>El catálogo de logros aparecerá aquí.</span>
        </div>
      ) : (
        <>
          {/* TOP 3 Podio */}
          <div className="lk-ach-podium-card">
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"1.25rem" }}>
              <div style={{ fontWeight:800, fontSize:"1rem", color:"#1A1A2E" }}>TOP 3</div>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.2rem", fontSize:"0.72rem", color:"#6B6B8A" }}>
                <span style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}><span style={{ width:10, height:10, borderRadius:"50%", background:"#F5A623", display:"inline-block" }} /> #F9A825</span>
                <span style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}><span style={{ width:10, height:10, borderRadius:"50%", background:"#D1D5DB", display:"inline-block" }} /> #Silver</span>
                <span style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}><span style={{ width:10, height:10, borderRadius:"50%", background:"#CD7C2F", display:"inline-block" }} /> #Bronze</span>
              </div>
            </div>

            <div className="lk-ach-podium">
              {/* 2do lugar */}
              <div className="lk-ach-podium-slot lk-ach-podium-slot--2">
                <div className="lk-ach-avatar" style={{ background:"#9CA3AF", width:48, height:48, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:"0.85rem", marginBottom:"0.35rem" }}>
                  {(actividadReciente[1]?.nombre || "??").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <div className="lk-ach-podium-name">{actividadReciente[1]?.nombre || studentName || "Estudiante"}</div>
                <div className="lk-ach-podium-pts">Score: {actividadReciente[1]?.xp != null ? `${actividadReciente[1].xp} pts` : `${(resumen.desbloqueados || 0) * 20 + 10} pts`}</div>
                <div className="lk-ach-platform lk-ach-platform--2">2</div>
              </div>

              {/* 1er lugar */}
              <div className="lk-ach-podium-slot lk-ach-podium-slot--1">
                <div style={{ fontSize:"1.5rem", marginBottom:"0.2rem" }}>👑</div>
                <div className="lk-ach-avatar" style={{ background:"#F5A623", width:62, height:62, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:"1rem", marginBottom:"0.35rem" }}>
                  {(studentName || "??").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <div className="lk-ach-podium-name" style={{ fontWeight:800, fontSize:"0.9rem" }}>{studentName || "Estudiante"}</div>
                <div className="lk-ach-podium-pts">Score: {(resumen.desbloqueados || 0) * 25 + 50} pts</div>
                <div className="lk-ach-platform lk-ach-platform--1">1</div>
              </div>

              {/* 3er lugar */}
              <div className="lk-ach-podium-slot lk-ach-podium-slot--3">
                <div className="lk-ach-avatar" style={{ background:"#CD7C2F", width:48, height:48, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:"0.85rem", marginBottom:"0.35rem" }}>
                  {(actividadReciente[2]?.nombre || "??").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <div className="lk-ach-podium-name">{actividadReciente[2]?.nombre || "—"}</div>
                <div className="lk-ach-podium-pts">Score: {actividadReciente[2]?.xp != null ? `${actividadReciente[2].xp} pts` : `${(resumen.desbloqueados || 0) * 15} pts`}</div>
                <div className="lk-ach-platform lk-ach-platform--3">3</div>
              </div>
            </div>
          </div>

          {/* Grid 2 columnas — cards horizontales como en mockup */}
          {!catalogoFiltrado.length ? (
            <div style={{ textAlign:"center", padding:"2rem", color:"#6B6B8A" }}>
              <Star size={30} style={{ color:"#C4AEE0" }} /><strong style={{ display:"block", marginTop:"0.5rem" }}>No hay logros con ese filtro</strong>
            </div>
          ) : (
            <div className="lk-ach-grid">
              {catalogoFiltrado.map((item, index) => {
                const colorKeys = ["green","blue","orange","cyan"];
                const color = item.desbloqueado ? colorKeys[index % 4] : "locked";
                const iconBg = { green:"#DCFCE7", blue:"#DBEAFE", orange:"#FFEDD5", cyan:"#CFFAFE", locked:"#F3F4F6" }[color];
                const icons = { green:"🏆", blue:"⭐", orange:"🔥", cyan:"⚡", locked:"🚀" };
                const studentCount = item.desbloqueado ? (item.total_estudiantes ?? item.estudiantes_count ?? 1) : 0;
                return (
                  <div key={item.id_catalogo_logro ?? item.key ?? index} className={`lk-ach-item lk-ach-item--${color}`}>
                    {/* Icono circular */}
                    <div className="lk-ach-item__icon" style={{ background: iconBg }}>
                      <span style={{ fontSize:"1.4rem" }}>{icons[color]}</span>
                    </div>
                    {/* Cuerpo */}
                    <div className="lk-ach-item__body">
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
                        <h4 className="lk-ach-item__name">{item.nombre}</h4>
                        {!item.desbloqueado && <Lock size={14} className="lk-ach-item__lock" style={{ color:"#9CA3AF", marginLeft:"0.5rem", flexShrink:0 }} />}
                      </div>
                      <p className="lk-ach-item__desc">{item.descripcion}</p>
                      <div className="lk-ach-item__count">
                        <span style={{ fontSize:"0.85rem" }}>👤</span>
                        <span>{studentCount} Estudiantes</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
