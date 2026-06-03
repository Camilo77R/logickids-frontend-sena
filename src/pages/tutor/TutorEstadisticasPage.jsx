/**
 * TutorEstadisticasPage
 *
 * POR QUE:
 * - la DB es la fuente de verdad para intentos, aciertos, errores y reacción
 * - la UI no debe inventar estadísticas cuando el backend no trae datos
 * - separa presentación de lectura de datos para que la pantalla sea mantenible
 */
import { useEffect, useMemo, useState } from "react";
import { BarChart2, RefreshCw, User, Users } from "lucide-react";
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
  if (value === null || value === undefined || value === "") return "—";
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString("es-CO") : String(value);
};

const formatReaction = (value) => {
  if (value === null || value === undefined || value === "") return "—";
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
    <section className="lk-stats-page">
      <header className="lk-stats-hero">
        <div className="lk-stats-hero__icon">
          <BarChart2 size={28} aria-hidden="true" />
        </div>
        <div className="lk-stats-hero__copy">
          <span>Progreso pedagógico</span>
          <h1>Estadísticas de habilidades</h1>
          <p>
            Lectura real de precisión, intentos y reacción según los resultados guardados en la
            base de datos.
          </p>
        </div>
        <button
          className="lk-stats-refresh"
          type="button"
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loading}
        >
          <RefreshCw size={16} aria-hidden="true" />
          Actualizar
        </button>
      </header>

      <section className="lk-stats-controls" aria-label="Filtros de estadísticas">
        <div className="lk-stats-toggle" role="tablist" aria-label="Modo de consulta">
          <button
            type="button"
            className={modo === "estudiante" ? "active" : ""}
            onClick={() => setModo("estudiante")}
          >
            <User size={16} aria-hidden="true" />
            Por estudiante
          </button>
          <button
            type="button"
            className={modo === "grupo" ? "active" : ""}
            onClick={() => setModo("grupo")}
          >
            <Users size={16} aria-hidden="true" />
            Por grupo
          </button>
        </div>

        <label className="lk-stats-field">
          <span>Grupo</span>
          <select value={grupoId} onChange={(event) => setGrupoId(event.target.value)}>
            <option value="">Selecciona grupo</option>
            {grupos.map((group) => (
              <option key={group.id} value={group.id}>
                {group.nombre}
              </option>
            ))}
          </select>
        </label>

        {modo === "estudiante" ? (
          <label className="lk-stats-field">
            <span>Estudiante</span>
            <select
              value={estudianteId}
              onChange={(event) => setEstudianteId(event.target.value)}
              disabled={!estudiantes.length}
            >
              <option value="">Selecciona estudiante</option>
              {estudiantes.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.nombre}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </section>

      <div className="lk-stats-context">
        <span>{selectedGroup?.nombre ?? "Sin grupo seleccionado"}</span>
        <strong>
          {modo === "estudiante"
            ? selectedStudent?.nombre ?? "Selecciona un estudiante"
            : "Promedio del grupo"}
        </strong>
      </div>

      {pageError ? <div className="lk-stats-alert">{pageError}</div> : null}

      {loading ? (
        <div className="lk-stats-state">
          <div className="lk-stats-spinner" />
          <p>Cargando estadísticas reales...</p>
        </div>
      ) : statsVisibles.length === 0 ? (
        <div className="lk-stats-empty">
          <BarChart2 size={42} aria-hidden="true" />
          <strong>Sin estadísticas todavía</strong>
          <p>
            Cuando el estudiante complete partidas de los minijuegos oficiales, aquí aparecerán sus
            resultados por habilidad.
          </p>
        </div>
      ) : (
        <div className="lk-stats-grid">
          {statsVisibles.map((stat) => (
            <SkillStatsCard
              key={stat.catalogKey ?? stat.id ?? stat.id_habilidad ?? stat.habilidad}
              stat={stat}
              modo={modo}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function SkillStatsCard({ stat, modo }) {
  const rawPrecision = modo === "estudiante" ? stat.precision_pct : stat.precision_promedio;
  const precision = clampPercent(rawPrecision);
  const tone = getPrecisionTone(rawPrecision);

  return (
    <article className={`lk-stats-card lk-stats-card--${tone} ${stat.sin_datos ? "lk-stats-card--empty" : ""}`}>
      <div className="lk-stats-card__head">
        <div>
          <span>Habilidad</span>
          <h2>{stat.habilidad ?? "Habilidad sin nombre"}</h2>
          {stat.juego ? <small>Juego: {stat.juego}</small> : null}
        </div>
        <strong>{formatPercent(rawPrecision)}</strong>
      </div>

      <div className="lk-stats-progress" aria-hidden="true">
        <i style={{ width: `${precision ?? 0}%` }} />
      </div>

      <div className="lk-stats-metrics">
        {modo === "estudiante" ? (
          <>
            <Metric label="Intentos" value={formatNumber(stat.total_intentos)} />
            <Metric label="Aciertos" value={formatNumber(stat.aciertos)} />
            <Metric label="Errores" value={formatNumber(stat.errores)} />
            <Metric label="Reacción" value={formatReaction(stat.promedio_reaccion_ms)} />
          </>
        ) : (
          <>
            <Metric label="Precisión prom." value={formatPercent(stat.precision_promedio)} />
            <Metric label="Reacción prom." value={formatReaction(stat.reaccion_promedio)} />
            <Metric label="Evaluados" value={formatNumber(stat.estudiantes_evaluados)} />
          </>
        )}
      </div>
    </article>
  );
}

function Metric({ label, value }) {
  return (
    <div className="lk-stats-metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
