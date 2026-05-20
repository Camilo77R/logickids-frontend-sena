/**
 * TutorRecomendacionesPage
 *
 * Panel de recomendaciones pedagógicas para estudiantes y grupos.
 * El tutor puede:
 *  - Ver las recomendaciones activas por estudiante o por grupo
 *  - Generar una nueva recomendación
 *  - Archivar recomendaciones que ya no son relevantes
 *
 * Flujo de datos:
 *  useRecomendaciones → recomendacionesService → GET/POST /api/recomendaciones/*
 */
import { useState } from "react";
import { Archive, RefreshCw, Users, User } from "lucide-react";
import { useRecomendacionesEstudiante, useRecomendacionesGrupo } from "../../hooks/useRecomendaciones";
import tutorGroupsService from "../../services/tutorGroupsService";
import estudianteService from "../../services/estudianteService";
import { useEffect } from "react";

/** Mapeo de severidad a colores visuales */
const SEVERIDAD_COLOR = {
  alta: "#ef4444",
  media: "#f59e0b",
  baja: "#22c55e",
};

export default function TutorRecomendacionesPage() {
  const [modo, setModo] = useState("estudiante"); // "estudiante" | "grupo"
  const [grupos, setGrupos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);

  // Cargamos los grupos del tutor al montar la página
  useEffect(() => {
    const loadGroups = async () => {
      try {
        const data = await tutorGroupsService.getGroups();
        setGrupos(data ?? []);

        if (data?.length > 0) {
          setGrupoSeleccionado(data[0].id_grupo ?? data[0].id);
        }
      } catch {
        setGrupos([]);
      }
    };

    loadGroups();
  }, []);

  // Cuando cambia el grupo, cargamos sus estudiantes
  useEffect(() => {
    if (!grupoSeleccionado) return;
    estudianteService.listEstudiantes(grupoSeleccionado).then((data) => {
      setEstudiantes(data ?? []);
      if (data?.length > 0) {
        setEstudianteSeleccionado(data[0].id_estudiante ?? data[0].id);
      } else {
        setEstudianteSeleccionado(null);
      }
    });
  }, [grupoSeleccionado]);

  // Hooks de recomendaciones según el modo seleccionado
  const hookEstudiante = useRecomendacionesEstudiante(
    modo === "estudiante" ? estudianteSeleccionado : null
  );
  const hookGrupo = useRecomendacionesGrupo(
    modo === "grupo" ? grupoSeleccionado : null
  );

  const hook = modo === "estudiante" ? hookEstudiante : hookGrupo;
  const canGenerate =
    modo === "estudiante" ? Boolean(estudianteSeleccionado) : Boolean(grupoSeleccionado);

  return (
    <div style={styles.container}>
      {/* Encabezado */}
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <Users size={28} color="#7c3aed" />
        </div>
        <div>
          <h1 style={styles.title}>Recomendaciones</h1>
          <p style={styles.subtitle}>
            Sugerencias pedagógicas basadas en las estadísticas reales de tus estudiantes
          </p>
        </div>
      </div>

      {/* Controles de selección */}
      <div style={styles.controls}>
        {/* Selector de modo */}
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

        {/* Selector de grupo */}
        <select
          style={styles.select}
          value={grupoSeleccionado ?? ""}
          onChange={(e) => setGrupoSeleccionado(Number(e.target.value))}
        >
          <option value="">-- Selecciona un grupo --</option>
          {grupos.map((g) => (
            <option key={g.id_grupo ?? g.id} value={g.id_grupo ?? g.id}>
              {g.nombre}
            </option>
          ))}
        </select>

        {/* Selector de estudiante (solo en modo estudiante) */}
        {modo === "estudiante" && (
          <select
            style={styles.select}
            value={estudianteSeleccionado ?? ""}
            onChange={(e) => setEstudianteSeleccionado(Number(e.target.value))}
          >
            <option value="">-- Selecciona un estudiante --</option>
            {estudiantes.map((e) => (
              <option key={e.id_estudiante ?? e.id} value={e.id_estudiante ?? e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        )}

        {/* Botón para generar recomendaciones */}
        <button
          style={{ ...styles.btnGenerar, opacity: hook.generando || !canGenerate ? 0.7 : 1 }}
          onClick={hook.generar}
          disabled={hook.generando || !canGenerate}
        >
          <RefreshCw size={16} style={{ animation: hook.generando ? "spin 1s linear infinite" : "none" }} />
          {hook.generando ? "Generando..." : "Generar recomendación"}
        </button>
      </div>

      {/* Mensajes de estado */}
      {hook.error && <div style={styles.error}>{hook.error}</div>}
      {hook.loading && <div style={styles.loading}>Cargando recomendaciones...</div>}

      {/* Lista de recomendaciones */}
      {!hook.loading && !hook.error && (
        <div style={styles.list}>
          {hook.recomendaciones.length === 0 ? (
            <div style={styles.empty}>
              <Users size={48} color="#d1d5db" />
              <p>No hay recomendaciones activas. Genera una con el botón de arriba.</p>
            </div>
          ) : (
            hook.recomendaciones.map((rec) => (
              <RecomendacionCard
                key={rec.id}
                recomendacion={rec}
                onArchivar={() => hook.archivar(rec.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Componente de tarjeta para una recomendación individual.
 * Separado para mantener la página limpia y reutilizable.
 */
function RecomendacionCard({ recomendacion, onArchivar }) {
  const color = SEVERIDAD_COLOR[recomendacion.severidad] ?? "#6b7280";

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ ...styles.badge, background: color }}>
            {recomendacion.severidad?.toUpperCase()}
          </span>
          <span style={styles.habilidad}>{recomendacion.habilidad}</span>
        </div>
        <div style={styles.cardMeta}>
          <span style={styles.fecha}>
            {new Date(recomendacion.generado_en).toLocaleDateString("es-CO")}
          </span>
          <button style={styles.btnArchivar} onClick={onArchivar} title="Archivar recomendación">
            <Archive size={16} />
          </button>
        </div>
      </div>
      <p style={styles.mensaje}>{recomendacion.mensaje}</p>
    </div>
  );
}

const styles = {
  container: { padding: "32px", maxWidth: "900px", margin: "0 auto" },
  header: { display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "28px" },
  headerIcon: { background: "#f3e8ff", borderRadius: "12px", padding: "12px", display: "flex" },
  title: { fontSize: "24px", fontWeight: 700, color: "#1e1b4b", margin: 0 },
  subtitle: { fontSize: "14px", color: "#6b7280", marginTop: "4px" },
  controls: { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "24px" },
  modeToggle: { display: "flex", background: "#f3f4f6", borderRadius: "8px", padding: "4px" },
  modeBtn: { display: "flex", gap: "6px", alignItems: "center", padding: "8px 14px", border: "none", borderRadius: "6px", cursor: "pointer", background: "transparent", fontSize: "14px", color: "#6b7280" },
  modeBtnActive: { background: "white", color: "#7c3aed", fontWeight: 600, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
  select: { padding: "8px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", minWidth: "180px" },
  btnGenerar: { display: "flex", gap: "8px", alignItems: "center", padding: "10px 18px", background: "#7c3aed", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px", marginLeft: "auto" },
  error: { background: "#fee2e2", color: "#dc2626", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" },
  loading: { textAlign: "center", color: "#6b7280", padding: "40px" },
  list: { display: "flex", flexDirection: "column", gap: "16px" },
  empty: { textAlign: "center", color: "#9ca3af", padding: "60px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  card: { background: "white", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" },
  badge: { padding: "2px 10px", borderRadius: "999px", color: "white", fontSize: "11px", fontWeight: 700 },
  habilidad: { fontSize: "14px", fontWeight: 600, color: "#374151" },
  cardMeta: { display: "flex", gap: "10px", alignItems: "center" },
  modelo: { fontSize: "12px", color: "#9ca3af", background: "#f3f4f6", padding: "2px 8px", borderRadius: "6px" },
  fecha: { fontSize: "12px", color: "#9ca3af" },
  btnArchivar: { background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex", alignItems: "center" },
  mensaje: { fontSize: "14px", color: "#4b5563", lineHeight: 1.7, whiteSpace: "pre-wrap" },
};
