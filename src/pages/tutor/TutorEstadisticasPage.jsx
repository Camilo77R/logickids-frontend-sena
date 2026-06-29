import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BarChart2, RefreshCw, Users, ChevronRight } from "lucide-react";
import { useEstadisticasEstudiante, useEstadisticasGrupo } from "../../hooks/useEstadisticas";
import estudianteService from "../../services/estudianteService";
import tutorGroupsService from "../../services/tutorGroupsService";
import "../../styles/tutor-ov.css";
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
  if (value === null || value === undefined || value === "") return "—";
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString("es-CO") : String(value);
};

const panelStyle = {
  background: "var(--lk-brand-soft)",
  border: "1px solid var(--lk-border)",
  borderRadius: "var(--lk-radius-xl)",
  padding: "1.5rem",
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
        const normalizedGroups = (data ?? []).map((group) => ({ ...group, id: group.id_grupo ?? group.id }));
        setGrupos(normalizedGroups);
        setMinijuegosActivos(gamesCatalog ?? []);
        setGrupoId((current) =>
          current && normalizedGroups.some((group) => normalizeId(group.id) === current)
            ? current : normalizeId(normalizedGroups[0]?.id)
        );
      } catch (error) {
        if (!cancelled) { setGrupos([]); setMinijuegosActivos([]); setGrupoId(""); setCatalogError(error?.message ?? "No fue posible cargar los grupos."); }
      } finally { if (!cancelled) setLoadingCatalog(false); }
    };
    loadGroups();
    return () => { cancelled = true; };
  }, [refreshKey]);

  useEffect(() => {
    let cancelled = false;
    const loadStudents = async () => {
      if (!grupoId) { setEstudiantes([]); setEstudianteId(""); return; }
      try {
        const data = await estudianteService.listEstudiantes(Number(grupoId));
        if (cancelled) return;
        const normalizedStudents = (data ?? []).map((student) => ({ ...student, id: student.id_estudiante ?? student.id }));
        setEstudiantes(normalizedStudents);
        setEstudianteId((current) =>
          current && normalizedStudents.some((student) => normalizeId(student.id) === current)
            ? current : normalizeId(normalizedStudents[0]?.id)
        );
      } catch (error) {
        if (!cancelled) { setEstudiantes([]); setEstudianteId(""); setCatalogError(error?.message ?? "No fue posible cargar los estudiantes del grupo."); }
      }
    };
    loadStudents();
    return () => { cancelled = true; };
  }, [grupoId, refreshKey]);

  const { stats: statsEstudiante, loading: loadingEst, error: errorEst } = useEstadisticasEstudiante(modo === "estudiante" ? estudianteId : null, refreshKey);
  const { stats: statsGrupo, loading: loadingGrupo, error: errorGrupo } = useEstadisticasGrupo(modo === "grupo" ? grupoId : null, refreshKey);
  const stats = modo === "estudiante" ? statsEstudiante : statsGrupo;
  const loadingStats = modo === "estudiante" ? loadingEst : loadingGrupo;
  const statsError = modo === "estudiante" ? errorEst : errorGrupo;
  const pageError = catalogError || statsError;
  const loading = loadingCatalog || loadingStats;

  const selectedGroup = useMemo(() => grupos.find((group) => normalizeId(group.id) === grupoId), [grupoId, grupos]);
  const selectedStudent = useMemo(() => estudiantes.find((student) => normalizeId(student.id) === estudianteId), [estudianteId, estudiantes]);

  const habilidadesOficiales = useMemo(() => {
    const bySkill = new Map();
    minijuegosActivos.forEach((game) => {
      const habilidad = game.habilidad ?? game.habilidad_nombre ?? game.nombre_habilidad;
      const catalogKey = normalizeSkillKey(habilidad);
      if (!catalogKey || bySkill.has(catalogKey)) return;
      bySkill.set(catalogKey, { catalogKey, id_habilidad: game.id_habilidad ?? game.habilidad_id, habilidad, juego: resolveGameTitle(game) });
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
      return { ...habilidadOficial, ...(savedStat ?? {}), catalogKey: habilidadOficial.catalogKey, id_habilidad: savedStat?.id_habilidad ?? savedStat?.id ?? habilidadOficial.id_habilidad, habilidad: savedStat?.habilidad ?? habilidadOficial.habilidad, juego: habilidadOficial.juego, sin_datos: !savedStat };
    });
  }, [habilidadesOficiales, stats]);

  const averagePrecision = useMemo(() => {
    const valid = statsVisibles.filter((s) => !s.sin_datos && s.precision_promedio != null);
    if (!valid.length) return 0;
    const total = valid.reduce((sum, s) => sum + Number(s.precision_promedio), 0);
    return Math.round(total / valid.length);
  }, [statsVisibles]);

  const totalStudents = estudiantes.length;

  return (
    <div className="tov">
      <section className="tov-hero">
        <div className="tov-hero__text">
          <span className="tov-hero__status">
            <span className="tov-hero__status-dot" />
            {grupoId ? `Rendimiento: ${selectedGroup?.nombre || "Grupo seleccionado"}` : "Reportes académicos"}
          </span>
          <h1 className="tov-hero__h1">Reportes de rendimiento</h1>
          <div className="tov-hero__summary">
            <div><span>Precisión general</span><strong>{averagePrecision}%</strong></div>
            <div><span>Habilidades</span><strong>{statsVisibles.filter((s) => !s.sin_datos).length}</strong></div>
            <div><span>Estudiantes</span><strong>{totalStudents}</strong></div>
          </div>
          <div className="tov-hero__actions">
            <button className="tov-hero__primary" onClick={() => setRefreshKey((k) => k + 1)}><RefreshCw size={16} /> Actualizar datos <ChevronRight size={17} /></button>
            <button className="tov-hero__secondary">Ver grupos</button>
          </div>
        </div>
      </section>

      <div style={panelStyle}>
        <div className="tov-board-head">
          <h2><BarChart2 size={18} /> Estadísticas por habilidad</h2>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
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
          </div>
        </div>

        {catalogError && <div style={{ color: "#DC2626", fontSize: "0.8rem", marginBottom: "0.75rem" }}>{catalogError}</div>}

        {!grupoId ? (
          <div className="tov-board-empty">
            <BarChart2 size={32} />
            <strong>Selecciona un grupo</strong>
            <span>Las estadísticas aparecerán cuando elijas un grupo.</span>
          </div>
        ) : loading ? (
          <div className="tov-loading">
            <div className="tov-loading__ring" />
            <span>Cargando estadísticas...</span>
          </div>
        ) : statsVisibles.length === 0 ? (
          <div className="tov-board-empty">
            <BarChart2 size={32} />
            <strong>Sin datos de estadísticas</strong>
            <span>Abre una clase para empezar a registrar estadísticas.</span>
          </div>
        ) : (
          <div className="lk-stats-charts-grid">
            {statsVisibles.map((stat, i) => {
              const pct = Math.min(100, Math.round(Number(stat.precision_promedio ?? stat.aciertos ?? 0)));
              const colors = ["#7B4BB8", "#16A34A", "#F5A623", "#2563EB"];
              const color = colors[i % colors.length];
              return (
                <div key={stat.catalogKey ?? stat.id_habilidad ?? i} className="lk-stats-chart-card">
                  <h3 className="lk-stats-chart-card__title">{stat.habilidad}</h3>
                  <p className="lk-stats-chart-card__subtitle">{stat.juego || "Juego pedagógico"}</p>
                  {stat.sin_datos ? (
                    <p style={{ color: "var(--lk-text-muted)", fontSize: "0.82rem", marginTop: "0.5rem" }}>Sin partidas registradas aún.</p>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", margin: "0.75rem 0" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--lk-text-muted)", fontWeight: 600 }}>Precisión</span>
                            <span style={{ fontSize: "1rem", fontWeight: 800, color }}>{pct}%</span>
                          </div>
                          <div style={{ height: 8, background: "var(--lk-surface-soft)", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99 }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        {stat.total_intentos != null && <span style={{ fontSize: "0.78rem", color: "var(--lk-text-muted)" }}>🎯 {stat.total_intentos} intentos</span>}
                        {stat.aciertos != null && <span style={{ fontSize: "0.78rem", color: "var(--lk-green)", fontWeight: 600 }}>✓ {stat.aciertos} aciertos</span>}
                        {stat.promedio_reaccion_ms != null && <span style={{ fontSize: "0.78rem", color: "var(--lk-text-muted)" }}>⚡ {Math.round(stat.promedio_reaccion_ms)}ms</span>}
                        {stat.reaccion_promedio != null && <span style={{ fontSize: "0.78rem", color: "var(--lk-text-muted)" }}>⚡ {Math.round(stat.reaccion_promedio)}ms</span>}
                        {stat.estudiantes_evaluados != null && <span style={{ fontSize: "0.78rem", color: "var(--lk-text-muted)" }}>👤 {stat.estudiantes_evaluados} evaluados</span>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
