/**
 * TutorEstadisticasPage
 *
 * POR QUE:
 * - la DB es la fuente de verdad para intentos, aciertos, errores y reacciÃ³n
 * - la UI no debe inventar estadÃ­sticas cuando el backend no trae datos
 * - separa presentaciÃ³n de lectura de datos para que la pantalla sea mantenible
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BarChart2, RefreshCw, User, Users, X } from "lucide-react";
import { useEstadisticasEstudiante, useEstadisticasGrupo } from "../../hooks/useEstadisticas";
import estudianteService from "../../services/estudianteService";
import tutorGroupsService from "../../services/tutorGroupsService";
import "../../styles/tutor-estadisticas.css";

const normalizeId = (value) => String(value ?? "");
const normalizeSkillKey = (value) => String(value ?? "").trim().toLowerCase();

const resolveGameTitle = (game) =>
  game?.titulo ?? game?.nombre ?? game?.nombre_minijuego ?? game?.slug ?? "";

const clampPercent = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.min(100, Math.max(0, numeric));
};

const formatPercent = (value) => {
  const percent = clampPercent(value);
  return percent === null ? "Sin dato" : `${percent.toFixed(1)}%`;
};

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") return "â€”";
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString("es-CO") : String(value);
};

const formatReaction = (value) => {
  if (value === null || value === undefined || value === "") return "â€”";
  return `${formatNumber(value)} ms`;
};

const getPrecisionTone = (value) => {
  const percent = clampPercent(value);
  if (percent === null) return "muted";
  if (percent >= 75) return "success";
  if (percent >= 50) return "warning";
  return "danger";
};

export default function TutorEstadisticasPage() {
  const [modo, setModo] = useState("estudiante");
  const [grupos, setGrupos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [minijuegosActivos, setMinijuegosActivos] = useState([]);
  const [grupoId, setGrupoId] = useState("");
  const [estudianteId, setEstudianteId] = useState("");
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const catalogErrorTimer = useRef(null);
  const clearCatalogError = useCallback(() => setCatalogError(""), []);

  useEffect(() => {
    if (catalogError) {
      clearTimeout(catalogErrorTimer.current);
      catalogErrorTimer.current = setTimeout(clearCatalogError, 5000);
    }
    return () => clearTimeout(catalogErrorTimer.current);
  }, [catalogError, clearCatalogError]);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadGroups = async () => {
      setLoadingCatalog(true);
      setCatalogError("");

      try {
        const [data, gamesCatalog] = await Promise.all([
          tutorGroupsService.getGroups(),
          tutorGroupsService.listarMinijuegosActivos(),
        ]);
        if (cancelled) return;

        const normalizedGroups = (data ?? []).map((group) => ({
          ...group,
          id: group.id_grupo ?? group.id,
        }));

        setGrupos(normalizedGroups);
        setMinijuegosActivos(gamesCatalog ?? []);
        setGrupoId((current) =>
          current && normalizedGroups.some((group) => normalizeId(group.id) === current)
            ? current
            : normalizeId(normalizedGroups[0]?.id)
        );
      } catch (error) {
        if (!cancelled) {
          setGrupos([]);
          setMinijuegosActivos([]);
          setGrupoId("");
          setCatalogError(error?.message ?? "No fue posible cargar los grupos.");
        }
      } finally {
        if (!cancelled) setLoadingCatalog(false);
      }
    };

    loadGroups();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    let cancelled = false;

    const loadStudents = async () => {
      if (!grupoId) {
        setEstudiantes([]);
        setEstudianteId("");
        return;
      }

      try {
        const data = await estudianteService.listEstudiantes(Number(grupoId));
        if (cancelled) return;

        const normalizedStudents = (data ?? []).map((student) => ({
          ...student,
          id: student.id_estudiante ?? student.id,
        }));

        setEstudiantes(normalizedStudents);
        setEstudianteId((current) =>
          current && normalizedStudents.some((student) => normalizeId(student.id) === current)
            ? current
            : normalizeId(normalizedStudents[0]?.id)
        );
      } catch (error) {
        if (!cancelled) {
          setEstudiantes([]);
          setEstudianteId("");
          setCatalogError(error?.message ?? "No fue posible cargar los estudiantes del grupo.");
        }
      }
    };

    loadStudents();

    return () => {
      cancelled = true;
    };
  }, [grupoId, refreshKey]);

  const { stats: statsEstudiante, loading: loadingEst, error: errorEst } =
    useEstadisticasEstudiante(modo === "estudiante" ? estudianteId : null, refreshKey);

  const { stats: statsGrupo, loading: loadingGrupo, error: errorGrupo } =
    useEstadisticasGrupo(modo === "grupo" ? grupoId : null, refreshKey);

  const stats = modo === "estudiante" ? statsEstudiante : statsGrupo;
  const loadingStats = modo === "estudiante" ? loadingEst : loadingGrupo;
  const statsError = modo === "estudiante" ? errorEst : errorGrupo;
  const pageError = catalogError || statsError;
  const selectedGroup = useMemo(
    () => grupos.find((group) => normalizeId(group.id) === grupoId),
    [grupoId, grupos]
  );
  const selectedStudent = useMemo(
    () => estudiantes.find((student) => normalizeId(student.id) === estudianteId),
    [estudianteId, estudiantes]
  );

  const loading = loadingCatalog || loadingStats;
  const habilidadesOficiales = useMemo(() => {
    const bySkill = new Map();

    minijuegosActivos.forEach((game) => {
      const habilidad = game.habilidad ?? game.habilidad_nombre ?? game.nombre_habilidad;
      const catalogKey = normalizeSkillKey(habilidad);

      if (!catalogKey || bySkill.has(catalogKey)) return;

      bySkill.set(catalogKey, {
        catalogKey,
        id_habilidad: game.id_habilidad ?? game.habilidad_id,
        habilidad,
        juego: resolveGameTitle(game),
      });
    });

    return [...bySkill.values()];
  }, [minijuegosActivos]);

  const statsVisibles = useMemo(() => {
    if (!habilidadesOficiales.length) return [];

    const statsBySkill = new Map();
    (stats ?? []).forEach((stat) => {
      const statKey = normalizeSkillKey(stat.habilidad);
      if (statKey) statsBySkill.set(statKey, stat);
    });

    return habilidadesOficiales.map((habilidadOficial) => {
      const savedStat = statsBySkill.get(habilidadOficial.catalogKey);

      return {
        ...habilidadOficial,
        ...(savedStat ?? {}),
        catalogKey: habilidadOficial.catalogKey,
        id_habilidad: savedStat?.id_habilidad ?? savedStat?.id ?? habilidadOficial.id_habilidad,
        habilidad: savedStat?.habilidad ?? habilidadOficial.habilidad,
        juego: habilidadOficial.juego,
        sin_datos: !savedStat,
      };
    });
  }, [habilidadesOficiales, stats]);

  return (
    <div className="lk-stats-page">
      <div className="lk-stats-page-header">
        <h1>Estadísticas</h1>
        <div className="lk-stats-controls">
          <select className="lk-stats-group-select" value={grupoId} onChange={(e) => setGrupoId(e.target.value)} disabled={loadingCatalog}>
            <option value="">Seleccionar Grupo</option>
            {grupos.map((g) => <option key={g.id} value={normalizeId(g.id)}>{g.nombre}</option>)}
          </select>
          {grupoId && (
            <select className="lk-stats-group-select" value={estudianteId} onChange={(e) => { setEstudianteId(e.target.value); setModo(e.target.value ? "estudiante" : "grupo"); }}>
              <option value="">Todo el grupo</option>
              {estudiantes.map((s) => <option key={s.id} value={normalizeId(s.id)}>{s.nombre}</option>)}
            </select>
          )}
          {catalogError && <span style={{ color:"#DC2626", fontSize:"0.8rem" }}>{catalogError}</span>}
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            style={{ display:"flex", alignItems:"center", gap:"0.4rem", padding:"0.5rem 1rem", background:"#5B2D8E", color:"#fff", border:"none", borderRadius:"0.75rem", fontWeight:700, cursor:"pointer", fontSize:"0.82rem" }}
          >
            <RefreshCw size={15} /> Actualizar
          </button>
        </div>
      </div>

      {!grupoId ? (
        <div style={{ background:"#fff", borderRadius:"1.25rem", padding:"3rem", textAlign:"center", border:"1px solid #E2DCF0" }}>
          <BarChart2 size={48} style={{ color:"#C4AEE0", marginBottom:"0.75rem" }} />
          <h3 style={{ margin:"0 0 0.4rem", color:"#1A1A2E" }}>Selecciona un grupo</h3>
          <p style={{ color:"#6B6B8A", margin:0 }}>Las estadísticas aparecerán cuando elijas un grupo.</p>
        </div>
      ) : loading ? (
        <div style={{ background:"#fff", borderRadius:"1.25rem", padding:"3rem", textAlign:"center", border:"1px solid #E2DCF0", color:"#6B6B8A" }}>
          Cargando estadísticas...
        </div>
      ) : (
        <div className="lk-stats-charts-grid">
          {statsVisibles.length === 0 ? (
            <div style={{ gridColumn:"1/-1", background:"#fff", borderRadius:"1.25rem", padding:"3rem", textAlign:"center", border:"1px solid #E2DCF0" }}>
              <BarChart2 size={40} style={{ color:"#C4AEE0", marginBottom:"0.75rem" }} />
              <strong style={{ display:"block", color:"#1A1A2E", marginBottom:"0.4rem" }}>Sin datos de estadísticas</strong>
              <p style={{ color:"#6B6B8A", margin:0, fontSize:"0.85rem" }}>Abre una clase para empezar a registrar estadísticas.</p>
            </div>
          ) : (
            statsVisibles.map((stat, i) => {
              const pct = Math.min(100, Math.round(Number(stat.precision_promedio ?? stat.aciertos ?? 0)));
              const colors = ["#5B2D8E", "#16A34A", "#F5A623", "#2563EB"];
              const color = colors[i % colors.length];
              return (
                <div key={stat.catalogKey ?? stat.id_habilidad ?? i} className="lk-stats-chart-card">
                  <h3 className="lk-stats-chart-card__title">{stat.habilidad}</h3>
                  <p className="lk-stats-chart-card__subtitle">{stat.juego || "Juego pedagógico"}</p>
                  {stat.sin_datos ? (
                    <p style={{ color:"#6B6B8A", fontSize:"0.82rem", marginTop:"0.5rem" }}>Sin partidas registradas aún.</p>
                  ) : (
                    <>
                      <div style={{ display:"flex", alignItems:"flex-end", gap:"0.75rem", margin:"0.75rem 0" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.4rem" }}>
                            <span style={{ fontSize:"0.75rem", color:"#6B6B8A", fontWeight:600 }}>Precisión</span>
                            <span style={{ fontSize:"1rem", fontWeight:800, color }}>{pct}%</span>
                          </div>
                          <div style={{ height:8, background:"#EDE8F5", borderRadius:99, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${pct}%`, background:color, borderRadius:99 }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap" }}>
                        {stat.total_intentos != null && <span style={{ fontSize:"0.78rem", color:"#6B6B8A" }}>🎯 {stat.total_intentos} intentos</span>}
                        {stat.aciertos != null && <span style={{ fontSize:"0.78rem", color:"#16A34A", fontWeight:600 }}>✓ {stat.aciertos} aciertos</span>}
                        {stat.promedio_reaccion_ms != null && <span style={{ fontSize:"0.78rem", color:"#6B6B8A" }}>⚡ {Math.round(stat.promedio_reaccion_ms)}ms</span>}
                        {stat.reaccion_promedio != null && <span style={{ fontSize:"0.78rem", color:"#6B6B8A" }}>⚡ {Math.round(stat.reaccion_promedio)}ms</span>}
                        {stat.estudiantes_evaluados != null && <span style={{ fontSize:"0.78rem", color:"#6B6B8A" }}>👤 {stat.estudiantes_evaluados} evaluados</span>}
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
