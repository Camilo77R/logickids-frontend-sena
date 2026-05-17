/**
 * TutorRecomendacionesPage
 *
 * Mantiene la línea visual reciente del frontend y agrega el flujo
 * CSV + FastAPI para generar recomendaciones filtradas por grupo o estudiante.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Brain,
  FileSpreadsheet,
  RefreshCw,
  User,
  Users,
} from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import { useRecomendacionesEstudiante, useRecomendacionesGrupo } from "../../hooks/useRecomendaciones";
import estudianteService from "../../services/estudianteService";
import recomendacionesService from "../../services/recomendacionesService";
import tutorGroupsService from "../../services/tutorGroupsService";

const SEVERIDAD_COLOR = {
  alta: "#ef4444",
  media: "#f59e0b",
  baja: "#22c55e",
};

const formatDate = (value) => {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "N/D";
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? String(value) : `${numericValue}%`;
};

export default function TutorRecomendacionesPage() {
  const [modo, setModo] = useState("estudiante");
  const [grupos, setGrupos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);

  const [csvGrupos, setCsvGrupos] = useState([]);
  const [selectedCsvGrupoId, setSelectedCsvGrupoId] = useState("");
  const [selectedCsvEstudianteId, setSelectedCsvEstudianteId] = useState("");
  const [recomendacionesCsvIA, setRecomendacionesCsvIA] = useState([]);
  const [csvError, setCsvError] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isGeneratingCsvIA, setIsGeneratingCsvIA] = useState(false);

  const hookEstudiante = useRecomendacionesEstudiante(
    modo === "estudiante" ? estudianteSeleccionado : null
  );
  const hookGrupo = useRecomendacionesGrupo(
    modo === "grupo" ? grupoSeleccionado : null
  );
  const hook = modo === "estudiante" ? hookEstudiante : hookGrupo;

  const selectedCsvGroup = useMemo(
    () => csvGrupos.find((item) => String(item.id) === String(selectedCsvGrupoId)) ?? null,
    [csvGrupos, selectedCsvGrupoId]
  );

  const csvStudents = useMemo(() => {
    if (!selectedCsvGrupoId) return [];
    return selectedCsvGroup?.estudiantes ?? [];
  }, [selectedCsvGroup, selectedCsvGrupoId]);

  const selectedCsvStudent = useMemo(
    () => csvStudents.find((item) => String(item.id) === String(selectedCsvEstudianteId)) ?? null,
    [csvStudents, selectedCsvEstudianteId]
  );

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [groupsData, csvCatalog] = await Promise.all([
          tutorGroupsService.getGroups(),
          recomendacionesService.obtenerCatalogoCsvIA(),
        ]);

        setGrupos(groupsData ?? []);
        setCsvGrupos(csvCatalog?.grupos ?? []);

        if (groupsData?.length > 0) {
          setGrupoSeleccionado(groupsData[0].id_grupo ?? groupsData[0].id);
        }

        if (csvCatalog?.grupos?.length > 0) {
          setSelectedCsvGrupoId(String(csvCatalog.grupos[0].id));
        }
      } catch (error) {
        setCsvError(error.message || "No fue posible cargar la configuración inicial.");
      } finally {
        setIsBootstrapping(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!grupoSeleccionado) {
      setEstudiantes([]);
      setEstudianteSeleccionado(null);
      return;
    }

    const loadStudents = async () => {
      setIsLoadingStudents(true);

      try {
        const data = await estudianteService.listEstudiantes(grupoSeleccionado);
        setEstudiantes(data ?? []);

        if (data?.length > 0) {
          setEstudianteSeleccionado(data[0].id_estudiante ?? data[0].id);
        } else {
          setEstudianteSeleccionado(null);
        }
      } catch {
        setEstudiantes([]);
        setEstudianteSeleccionado(null);
      } finally {
        setIsLoadingStudents(false);
      }
    };

    loadStudents();
  }, [grupoSeleccionado]);

  useEffect(() => {
    if (!selectedCsvGrupoId) {
      setSelectedCsvEstudianteId("");
      return;
    }

    const nextStudents = selectedCsvGroup?.estudiantes ?? [];
    setSelectedCsvEstudianteId((current) => {
      if (nextStudents.some((student) => String(student.id) === String(current))) {
        return current;
      }

      return "";
    });
  }, [selectedCsvGroup, selectedCsvGrupoId]);

  const canGenerate =
    modo === "estudiante" ? Boolean(estudianteSeleccionado) : Boolean(grupoSeleccionado);

  const handleGenerateCsvIA = async () => {
    setIsGeneratingCsvIA(true);
    setCsvError(null);

    try {
      const result = await recomendacionesService.generarDesdeCsvIA({
        grupoId: selectedCsvGrupoId,
        estudianteId: selectedCsvEstudianteId,
      });
      setRecomendacionesCsvIA(result.recomendaciones ?? []);
    } catch (error) {
      setRecomendacionesCsvIA([]);
      setCsvError(error.message || "No fue posible ejecutar el flujo CSV con FastAPI.");
    } finally {
      setIsGeneratingCsvIA(false);
    }
  };

  if (isBootstrapping) {
    return <LoadingState message="Cargando recomendaciones del tutor..." />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerIcon}>
          <Brain size={28} color="#7c3aed" />
        </div>
        <div>
          <h1 style={styles.title}>Recomendaciones IA</h1>
          <p style={styles.subtitle}>
            Feedback pedagógico generado por IA según el rendimiento individual, grupal y el flujo CSV + FastAPI.
          </p>
        </div>
      </div>

      <section style={styles.section}>
        <div style={styles.controls}>
          <div style={styles.modeToggle}>
            <button
              style={{ ...styles.modeBtn, ...(modo === "estudiante" ? styles.modeBtnActive : {}) }}
              onClick={() => setModo("estudiante")}
              type="button"
            >
              <User size={16} /> Por Estudiante
            </button>
            <button
              style={{ ...styles.modeBtn, ...(modo === "grupo" ? styles.modeBtnActive : {}) }}
              onClick={() => setModo("grupo")}
              type="button"
            >
              <Users size={16} /> Por Grupo
            </button>
          </div>

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

          {modo === "estudiante" && (
            <select
              style={styles.select}
              value={estudianteSeleccionado ?? ""}
              onChange={(e) => setEstudianteSeleccionado(Number(e.target.value))}
              disabled={!grupoSeleccionado || isLoadingStudents}
            >
              <option value="">-- Selecciona un estudiante --</option>
              {estudiantes.map((e) => (
                <option key={e.id_estudiante ?? e.id} value={e.id_estudiante ?? e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          )}

          <button
            style={{ ...styles.btnGenerar, opacity: hook.generando || !canGenerate ? 0.7 : 1 }}
            onClick={hook.generar}
            disabled={hook.generando || !canGenerate}
            type="button"
          >
            <RefreshCw
              size={16}
              style={{ animation: hook.generando ? "spin 1s linear infinite" : "none" }}
            />
            {hook.generando ? "Generando con IA..." : "Generar Recomendación"}
          </button>
        </div>

        {hook.error && <div style={styles.error}>{hook.error}</div>}
        {hook.loading ? (
          <LoadingState message="Cargando recomendaciones..." />
        ) : (
          <div style={styles.list}>
            {hook.recomendaciones.length === 0 ? (
              <EmptyState
                title="Sin recomendaciones activas"
                description="Genera una recomendación con IA para comenzar el seguimiento."
              />
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
      </section>

      <section style={styles.section}>
        <div style={styles.csvHeader}>
          <div style={styles.csvHeaderTitle}>
            <FileSpreadsheet size={20} />
            <strong>CSV + FastAPI</strong>
          </div>
          <p style={styles.csvSubtitle}>
            Ejecuta recomendaciones desde el archivo `datos_estudiantes.csv`, filtrando por grupo o por estudiante.
          </p>
        </div>

        <div style={styles.csvFilters}>
          <select
            style={styles.select}
            value={selectedCsvGrupoId}
            onChange={(e) => setSelectedCsvGrupoId(e.target.value)}
          >
            <option value="">-- Selecciona un grupo del CSV --</option>
            {csvGrupos.map((grupo) => (
              <option key={grupo.id} value={String(grupo.id)}>
                {grupo.nombre}
              </option>
            ))}
          </select>

          <select
            style={styles.select}
            value={selectedCsvEstudianteId}
            onChange={(e) => setSelectedCsvEstudianteId(e.target.value)}
            disabled={!selectedCsvGrupoId}
          >
            <option value="">-- Todos los estudiantes del grupo --</option>
            {csvStudents.map((student) => (
              <option key={student.id} value={String(student.id)}>
                {student.nombre}
              </option>
            ))}
          </select>

          <button
            style={{ ...styles.btnCsv, opacity: isGeneratingCsvIA || !selectedCsvGrupoId ? 0.7 : 1 }}
            onClick={handleGenerateCsvIA}
            disabled={isGeneratingCsvIA || !selectedCsvGrupoId}
            type="button"
          >
            <FileSpreadsheet size={16} />
            {isGeneratingCsvIA ? "Procesando CSV..." : "Generar desde CSV IA"}
          </button>
        </div>

        {csvError && <div style={styles.error}>{csvError}</div>}

        {isGeneratingCsvIA ? (
          <LoadingState message="Procesando archivo CSV en el servicio FastAPI..." />
        ) : recomendacionesCsvIA.length === 0 ? (
          <EmptyState
            title="Sin resultados del flujo CSV"
            description="Selecciona un grupo del CSV y genera recomendaciones desde FastAPI."
          />
        ) : (
          <div style={styles.list}>
            {recomendacionesCsvIA.map((item, index) => (
              <CsvRecommendationCard
                key={`${item.estudiante_id}-${item.habilidad_critica}-${index}`}
                item={item}
                groupName={selectedCsvGroup?.nombre}
                studentName={selectedCsvStudent?.nombre}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

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
          <span style={styles.modelo}>{recomendacion.modelo_ia ?? "IA"}</span>
          <span style={styles.fecha}>{formatDate(recomendacion.generado_en)}</span>
          <button style={styles.btnArchivar} onClick={onArchivar} title="Archivar recomendación" type="button">
            <Archive size={16} />
          </button>
        </div>
      </div>
      <p style={styles.mensaje}>{recomendacion.mensaje}</p>
    </div>
  );
}

function CsvRecommendationCard({ item }) {
  const color = SEVERIDAD_COLOR[item.severidad] ?? "#6b7280";

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ ...styles.badge, background: color }}>
            {(item.severidad ?? "media").toUpperCase()}
          </span>
          <span style={styles.habilidad}>{item.nombre ?? "Estudiante sin nombre"}</span>
        </div>
        <div style={styles.cardMeta}>
          <span style={styles.modelo}>{item.modelo_usado ?? "IA"}</span>
          <span style={styles.fecha}>{formatDate(item.fecha_generacion)}</span>
        </div>
      </div>

      <div style={styles.csvMetaGrid}>
        <p style={styles.metaLine}>
          Habilidad crítica: <strong>{item.habilidad_critica ?? "No definida"}</strong>
        </p>
        <p style={styles.metaLine}>
          Precisión actual: <strong>{formatPercent(item.precision_actual)}</strong>
        </p>
        <p style={styles.metaLine}>
          Prioridad: <strong>{item.prioridad ?? "N/D"}</strong>
        </p>
        <p style={styles.metaLine}>
          Tipo de salida: <strong>{item.es_simulada ? "Simulada" : "IA generativa"}</strong>
        </p>
      </div>

      {item.ia_error ? (
        <p style={{ ...styles.metaLine, color: "#dc2626", marginTop: "8px" }}>
          Detalle IA: <strong>{item.ia_error}</strong>
        </p>
      ) : null}

      <p style={styles.mensaje}>{item.recomendacion ?? "Sin recomendación generada."}</p>
    </div>
  );
}

const styles = {
  container: { padding: "32px", maxWidth: "960px", margin: "0 auto" },
  header: { display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "28px" },
  headerIcon: { background: "#f3e8ff", borderRadius: "12px", padding: "12px", display: "flex" },
  title: { fontSize: "24px", fontWeight: 700, color: "#1e1b4b", margin: 0 },
  subtitle: { fontSize: "14px", color: "#6b7280", marginTop: "4px", lineHeight: 1.6 },
  section: {
    background: "white",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #f3f4f6",
    marginBottom: "24px",
  },
  controls: { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "24px" },
  modeToggle: { display: "flex", background: "#f3f4f6", borderRadius: "8px", padding: "4px" },
  modeBtn: {
    display: "flex",
    gap: "6px",
    alignItems: "center",
    padding: "8px 14px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    background: "transparent",
    fontSize: "14px",
    color: "#6b7280",
  },
  modeBtnActive: {
    background: "white",
    color: "#7c3aed",
    fontWeight: 600,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  select: {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    fontSize: "14px",
    minWidth: "220px",
  },
  btnGenerar: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    padding: "10px 18px",
    background: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    marginLeft: "auto",
  },
  btnCsv: {
    display: "inline-flex",
    gap: "8px",
    alignItems: "center",
    padding: "10px 18px",
    background: "#b45309",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
  },
  csvHeader: { marginBottom: "18px" },
  csvHeaderTitle: { display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px", color: "#1f2937" },
  csvSubtitle: { margin: 0, color: "#6b7280", fontSize: "14px", lineHeight: 1.6 },
  csvFilters: { display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center", marginBottom: "18px" },
  error: { background: "#fee2e2", color: "#dc2626", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" },
  list: { display: "flex", flexDirection: "column", gap: "16px" },
  card: {
    background: "white",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #f3f4f6",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "12px",
    flexWrap: "wrap",
    gap: "8px",
  },
  badge: { padding: "2px 10px", borderRadius: "999px", color: "white", fontSize: "11px", fontWeight: 700 },
  habilidad: { fontSize: "14px", fontWeight: 600, color: "#374151" },
  cardMeta: { display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" },
  modelo: { fontSize: "12px", color: "#9ca3af", background: "#f3f4f6", padding: "2px 8px", borderRadius: "6px" },
  fecha: { fontSize: "12px", color: "#9ca3af" },
  btnArchivar: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#9ca3af",
    display: "flex",
    alignItems: "center",
  },
  mensaje: { fontSize: "14px", color: "#4b5563", lineHeight: 1.7, whiteSpace: "pre-wrap", marginBottom: 0 },
  csvMetaGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "8px 16px",
    marginBottom: "8px",
  },
  metaLine: { fontSize: "13px", color: "#4b5563", margin: 0 },
};
