/**
 * TutorEstadisticasPage
 *
 * Panel de estadísticas de habilidades cognitivas.
 * Muestra precisión y velocidad de reacción por habilidad,
 * tanto a nivel individual (estudiante) como grupal (grupo).
 *
 * Flujo de datos:
 *  useEstadisticas → estadisticasService → GET /api/estadisticas/*
 */
import { useState, useEffect } from "react";
import { BarChart2, User, Users } from "lucide-react";
import { useEstadisticasEstudiante, useEstadisticasGrupo } from "../../hooks/useEstadisticas";
import tutorGroupsService from "../../services/tutorGroupsService";
import estudianteService from "../../services/estudianteService";

/** Color según el porcentaje de precisión */
const getPrecisionColor = (pct) => {
  const val = Number(pct);
  if (val >= 75) return "#22c55e";
  if (val >= 50) return "#f59e0b";
  return "#ef4444";
};

export default function TutorEstadisticasPage() {
  const [modo, setModo] = useState("estudiante");
  const [grupos, setGrupos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [grupoId, setGrupoId] = useState(null);
  const [estudianteId, setEstudianteId] = useState(null);

  // Cargar grupos al montar
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await tutorGroupsService.getGroups();
        setGrupos(data ?? []);

        if (data?.length > 0) {
          const id = data[0].id_grupo ?? data[0].id;
          setGrupoId(id);
        }
      } catch {
        setGrupos([]);
      }
    };

    loadGroups();
  }, []);

  // Cargar estudiantes del grupo seleccionado
  useEffect(() => {
    if (!grupoId) return;
    estudianteService.listEstudiantes(grupoId).then((data) => {
      setEstudiantes(data ?? []);
      if (data?.length > 0) {
        const id = data[0].id_estudiante ?? data[0].id;
        setEstudianteId(id);
      } else {
        setEstudianteId(null);
      }
    });
  }, [grupoId]);

  // Hooks que cargan los datos según el modo
  const { stats: statsEstudiante, loading: loadingEst, error: errorEst } =
    useEstadisticasEstudiante(modo === "estudiante" ? estudianteId : null);

  const { stats: statsGrupo, loading: loadingGrupo, error: errorGrupo } =
    useEstadisticasGrupo(modo === "grupo" ? grupoId : null);

  const stats = modo === "estudiante" ? statsEstudiante : statsGrupo;
  const loading = modo === "estudiante" ? loadingEst : loadingGrupo;
  const error = modo === "estudiante" ? errorEst : errorGrupo;

  return (
    <div style={styles.container}>
      {/* Encabezado */}
      <div style={styles.header}>
        <div style={styles.headerIcon}><BarChart2 size={28} color="#2563eb" /></div>
        <div>
          <h1 style={styles.title}>Estadísticas de Habilidades</h1>
          <p style={styles.subtitle}>Precisión y velocidad de reacción por habilidad cognitiva</p>
        </div>
      </div>

      {/* Controles */}
      <div style={styles.controls}>
        <div style={styles.modeToggle}>
          <button
            style={{ ...styles.modeBtn, ...(modo === "estudiante" ? styles.modeBtnActive : {}) }}
            onClick={() => setModo("estudiante")}
          >
            <User size={16} /> Por Estudiante
          </button>
          <button
            style={{ ...styles.modeBtn, ...(modo === "grupo" ? styles.modeBtnActive : {}) }}
            onClick={() => setModo("grupo")}
          >
            <Users size={16} /> Por Grupo
          </button>
        </div>

        <select style={styles.select} value={grupoId ?? ""} onChange={(e) => setGrupoId(Number(e.target.value))}>
          <option value="">-- Selecciona grupo --</option>
          {grupos.map((g) => (
            <option key={g.id_grupo ?? g.id} value={g.id_grupo ?? g.id}>{g.nombre}</option>
          ))}
        </select>

        {modo === "estudiante" && (
          <select style={styles.select} value={estudianteId ?? ""} onChange={(e) => setEstudianteId(Number(e.target.value))}>
            <option value="">-- Selecciona estudiante --</option>
            {estudiantes.map((e) => (
              <option key={e.id_estudiante ?? e.id} value={e.id_estudiante ?? e.id}>{e.nombre}</option>
            ))}
          </select>
        )}
      </div>

      {/* Estados de carga y error */}
      {error && <div style={styles.error}>{error}</div>}
      {loading && <div style={styles.loading}>Cargando estadísticas...</div>}

      {/* Tabla de estadísticas */}
      {!loading && !error && (
        <>
          {stats.length === 0 ? (
            <div style={styles.empty}>
              <BarChart2 size={48} color="#d1d5db" />
              <p>Sin estadísticas aún. El estudiante debe completar partidas primero.</p>
            </div>
          ) : (
            <div style={styles.grid}>
              {stats.map((stat, idx) => (
                <HabilidadCard key={idx} stat={stat} modo={modo} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Tarjeta de estadísticas por habilidad.
 * Muestra una barra de progreso de precisión y los datos numéricos.
 */
function HabilidadCard({ stat, modo }) {
  const precision = modo === "estudiante"
    ? Number(stat.precision_pct)
    : Number(stat.precision_promedio);

  const color = getPrecisionColor(precision);

  return (
    <div style={styles.card}>
      <div style={styles.cardTop}>
        <span style={styles.habilidadNombre}>{stat.habilidad}</span>
        <span style={{ ...styles.precisionBadge, background: color }}>
          {precision.toFixed(1)}%
        </span>
      </div>

      {/* Barra de progreso */}
      <div style={styles.barBg}>
        <div style={{ ...styles.barFill, width: `${precision}%`, background: color }} />
      </div>

      {/* Métricas */}
      <div style={styles.metricas}>
        {modo === "estudiante" ? (
          <>
            <Metrica label="Intentos" value={stat.total_intentos ?? 0} />
            <Metrica label="Aciertos" value={stat.aciertos ?? 0} />
            <Metrica label="Errores" value={stat.errores ?? 0} />
            <Metrica label="Reacción" value={stat.promedio_reaccion_ms ? `${stat.promedio_reaccion_ms}ms` : "—"} />
          </>
        ) : (
          <>
            <Metrica label="Precisión prom." value={`${precision.toFixed(1)}%`} />
            <Metrica label="Reacción prom." value={stat.reaccion_promedio ? `${stat.reaccion_promedio}ms` : "—"} />
            <Metrica label="Evaluados" value={stat.estudiantes_evaluados ?? 0} />
          </>
        )}
      </div>
    </div>
  );
}

/** Componente atómico para mostrar una métrica con su etiqueta */
function Metrica({ label, value }) {
  return (
    <div style={styles.metrica}>
      <span style={styles.metricaLabel}>{label}</span>
      <span style={styles.metricaValue}>{value}</span>
    </div>
  );
}

const styles = {
  container: { padding: "32px", maxWidth: "1000px", margin: "0 auto" },
  header: { display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "28px" },
  headerIcon: { background: "#eff6ff", borderRadius: "12px", padding: "12px", display: "flex" },
  title: { fontSize: "24px", fontWeight: 700, color: "#1e1b4b", margin: 0 },
  subtitle: { fontSize: "14px", color: "#6b7280", marginTop: "4px" },
  controls: { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "28px" },
  modeToggle: { display: "flex", background: "#f3f4f6", borderRadius: "8px", padding: "4px" },
  modeBtn: { display: "flex", gap: "6px", alignItems: "center", padding: "8px 14px", border: "none", borderRadius: "6px", cursor: "pointer", background: "transparent", fontSize: "14px", color: "#6b7280" },
  modeBtnActive: { background: "white", color: "#2563eb", fontWeight: 600, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  select: { padding: "8px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px" },
  error: { background: "#fee2e2", color: "#dc2626", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" },
  loading: { textAlign: "center", color: "#6b7280", padding: "40px" },
  empty: { textAlign: "center", color: "#9ca3af", padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" },
  card: { background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  habilidadNombre: { fontWeight: 700, color: "#1e1b4b", fontSize: "15px" },
  precisionBadge: { color: "white", padding: "2px 10px", borderRadius: "999px", fontSize: "13px", fontWeight: 700 },
  barBg: { background: "#f3f4f6", borderRadius: "999px", height: "8px", marginBottom: "16px", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: "999px", transition: "width 0.5s ease" },
  metricas: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
  metrica: { display: "flex", flexDirection: "column" },
  metricaLabel: { fontSize: "11px", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" },
  metricaValue: { fontSize: "16px", fontWeight: 700, color: "#374151" },
};
