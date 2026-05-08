import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Brain, RefreshCw, Sparkles } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import estudianteService from "../../services/estudianteService";
import recomendacionesService from "../../services/recomendacionesService";
import tutorGroupsService from "../../services/tutorGroupsService";

const formatDate = (value) => {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const severityTone = {
  baja: { bg: "#dcfce7", fg: "#166534" },
  media: { bg: "#fef3c7", fg: "#92400e" },
  alta: { bg: "#fee2e2", fg: "#b91c1c" },
};

export default function TutorRecomendacionesPage() {
  const [grupos, setGrupos] = useState([]);
  const [selectedGrupoId, setSelectedGrupoId] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [selectedEstudianteId, setSelectedEstudianteId] = useState("");
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const selectedStudent = useMemo(
    () => estudiantes.find((item) => String(item.id) === String(selectedEstudianteId)) ?? null,
    [estudiantes, selectedEstudianteId]
  );

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const payload = await tutorGroupsService.listarGrupos();
        const nextGroups = payload?.data ?? [];
        setGrupos(nextGroups);

        if (nextGroups.length > 0) {
          const firstGroupId = String(nextGroups[0].id ?? nextGroups[0].id_grupo);
          setSelectedGrupoId(firstGroupId);
        }
      } catch (error) {
        setFeedback({
          type: "error",
          message: error.message || "No fue posible cargar los grupos del tutor.",
        });
      } finally {
        setIsBootstrapping(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedGrupoId) {
      setEstudiantes([]);
      setSelectedEstudianteId("");
      return;
    }

    const loadStudents = async () => {
      setIsLoadingStudents(true);

      try {
        const nextStudents = await estudianteService.listEstudiantes(Number(selectedGrupoId));
        setEstudiantes(nextStudents);
        setSelectedEstudianteId(nextStudents.length ? String(nextStudents[0].id) : "");
      } catch (error) {
        setEstudiantes([]);
        setSelectedEstudianteId("");
        setFeedback({
          type: "error",
          message: error.message || "No fue posible cargar los estudiantes del grupo.",
        });
      } finally {
        setIsLoadingStudents(false);
      }
    };

    loadStudents();
  }, [selectedGrupoId]);

  useEffect(() => {
    if (!selectedEstudianteId) {
      setRecomendaciones([]);
      return;
    }

    const loadRecommendations = async () => {
      setIsLoadingRecommendations(true);

      try {
        const nextRecommendations = await recomendacionesService.listarPorEstudiante(
          Number(selectedEstudianteId)
        );
        setRecomendaciones(nextRecommendations);
      } catch (error) {
        setRecomendaciones([]);
        setFeedback({
          type: "error",
          message: error.message || "No fue posible cargar las recomendaciones.",
        });
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    loadRecommendations();
  }, [selectedEstudianteId]);

  const handleGenerate = async () => {
    if (!selectedEstudianteId) return;

    setIsGenerating(true);
    setFeedback({ type: "", message: "" });

    try {
      const recommendation = await recomendacionesService.generarParaEstudiante(
        Number(selectedEstudianteId)
      );

      setRecomendaciones((current) =>
        recommendation ? [recommendation, ...current.filter((item) => item.id !== recommendation.id)] : current
      );

      setFeedback({
        type: "success",
        message: "Recomendacion generada y guardada correctamente.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible generar la recomendacion individual.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefreshHistory = async () => {
    if (!selectedEstudianteId) return;

    setIsLoadingRecommendations(true);
    try {
      const nextRecommendations = await recomendacionesService.listarPorEstudiante(
        Number(selectedEstudianteId)
      );
      setRecomendaciones(nextRecommendations);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible actualizar el historial de recomendaciones.",
      });
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  if (isBootstrapping) {
    return <LoadingState message="Cargando recomendaciones del tutor..." />;
  }

  return (
    <div style={{ padding: "30px" }}>
      <div style={headerStyle}>
        <div>
          <h1 style={{ margin: 0 }}>Recomendaciones IA</h1>
          <p style={subtitleStyle}>
            Genera una recomendacion individual para un estudiante segun sus estadisticas actuales.
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefreshHistory}
          disabled={!selectedEstudianteId || isLoadingRecommendations}
          style={secondaryButtonStyle}
        >
          <RefreshCw size={16} />
          Actualizar historial
        </button>
      </div>

      {feedback.message ? (
        <div
          style={{
            ...alertStyle,
            background: feedback.type === "error" ? "#fef2f2" : "#ecfdf5",
            color: feedback.type === "error" ? "#991b1b" : "#166534",
            borderColor: feedback.type === "error" ? "#fecaca" : "#bbf7d0",
          }}
        >
          <AlertCircle size={18} />
          <span>{feedback.message}</span>
        </div>
      ) : null}

      <section style={panelStyle}>
        <div style={panelHeaderStyle}>
          <Brain size={20} />
          <strong>Generacion individual</strong>
        </div>

        <div style={filtersGridStyle}>
          <label style={fieldStyle}>
            <span>Grupo</span>
            <select
              value={selectedGrupoId}
              onChange={(event) => setSelectedGrupoId(event.target.value)}
              style={inputStyle}
            >
              <option value="">Selecciona un grupo</option>
              {grupos.map((grupo) => {
                const id = grupo.id ?? grupo.id_grupo;
                return (
                  <option key={id} value={String(id)}>
                    {grupo.nombre}
                  </option>
                );
              })}
            </select>
          </label>

          <label style={fieldStyle}>
            <span>Estudiante</span>
            <select
              value={selectedEstudianteId}
              onChange={(event) => setSelectedEstudianteId(event.target.value)}
              style={inputStyle}
              disabled={!selectedGrupoId || isLoadingStudents || estudiantes.length === 0}
            >
              <option value="">Selecciona un estudiante</option>
              {estudiantes.map((estudiante) => (
                <option key={estudiante.id} value={String(estudiante.id)}>
                  {estudiante.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={actionRowStyle}>
          <div>
            <strong style={{ display: "block", marginBottom: "4px" }}>
              {selectedStudent ? selectedStudent.nombre : "Sin estudiante seleccionado"}
            </strong>
            <span style={{ color: "#64748b", fontSize: "0.95rem" }}>
              {selectedStudent
                ? "La recomendacion se calcula con la habilidad de menor precision del estudiante."
                : "Selecciona un grupo y un estudiante para continuar."}
            </span>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!selectedEstudianteId || isGenerating || isLoadingStudents}
            style={primaryButtonStyle}
          >
            <Sparkles size={16} />
            {isGenerating ? "Generando..." : "Generar recomendacion"}
          </button>
        </div>
      </section>

      <section style={{ ...panelStyle, marginTop: "24px" }}>
        <div style={panelHeaderStyle}>
          <Sparkles size={20} />
          <strong>Historial del estudiante</strong>
        </div>

        {isLoadingRecommendations ? (
          <LoadingState message="Cargando historial de recomendaciones..." />
        ) : !selectedEstudianteId ? (
          <EmptyState
            title="Selecciona un estudiante"
            description="El historial aparecera cuando elijas un estudiante de tus grupos."
          />
        ) : recomendaciones.length === 0 ? (
          <EmptyState
            title="Sin recomendaciones guardadas"
            description="Todavia no existe una recomendacion individual para este estudiante."
          />
        ) : (
          <div style={cardsGridStyle}>
            {recomendaciones.map((item) => {
              const tone = severityTone[item.severidad] ?? severityTone.media;

              return (
                <article key={item.id} style={cardStyle}>
                  <div style={cardTopRowStyle}>
                    <span
                      style={{
                        ...badgeStyle,
                        background: tone.bg,
                        color: tone.fg,
                      }}
                    >
                      {item.severidad ?? "sin severidad"}
                    </span>
                    <span style={dateStyle}>{formatDate(item.generado_en)}</span>
                  </div>

                  <h3 style={cardTitleStyle}>{item.habilidad ?? "Habilidad no definida"}</h3>

                  <p style={metaStyle}>
                    Precision al generar: <strong>{item.precision_momento}%</strong>
                  </p>
                  <p style={metaStyle}>
                    Modelo usado: <strong>{item.modelo_ia ?? "simulado"}</strong>
                  </p>

                  <p style={messageStyle}>{item.mensaje}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "16px",
  marginBottom: "24px",
  flexWrap: "wrap",
};

const subtitleStyle = {
  marginTop: "8px",
  marginBottom: 0,
  color: "#64748b",
};

const panelStyle = {
  background: "#ffffff",
  borderRadius: "20px",
  border: "1px solid #e2e8f0",
  boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
  padding: "24px",
};

const panelHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "18px",
};

const filtersGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: "16px",
};

const fieldStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  color: "#334155",
  fontWeight: 600,
};

const inputStyle = {
  borderRadius: "12px",
  border: "1px solid #cbd5e1",
  padding: "12px 14px",
  fontSize: "0.95rem",
  background: "#fff",
};

const actionRowStyle = {
  marginTop: "20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "16px",
  flexWrap: "wrap",
};

const primaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  border: "none",
  borderRadius: "999px",
  padding: "12px 18px",
  background: "linear-gradient(135deg, #0f766e, #14b8a6)",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  borderRadius: "999px",
  border: "1px solid #cbd5e1",
  padding: "10px 16px",
  background: "#fff",
  color: "#334155",
  fontWeight: 600,
  cursor: "pointer",
};

const alertStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "14px 16px",
  borderRadius: "14px",
  border: "1px solid",
  marginBottom: "20px",
};

const cardsGridStyle = {
  display: "grid",
  gap: "16px",
};

const cardStyle = {
  border: "1px solid #e2e8f0",
  borderRadius: "16px",
  padding: "18px",
  background: "linear-gradient(180deg, #ffffff, #f8fafc)",
};

const cardTopRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
};

const badgeStyle = {
  borderRadius: "999px",
  padding: "6px 10px",
  fontSize: "0.78rem",
  fontWeight: 700,
  textTransform: "capitalize",
};

const dateStyle = {
  color: "#64748b",
  fontSize: "0.85rem",
};

const cardTitleStyle = {
  marginTop: "12px",
  marginBottom: "8px",
  fontSize: "1.05rem",
  color: "#0f172a",
};

const metaStyle = {
  margin: "4px 0",
  color: "#475569",
  fontSize: "0.92rem",
};

const messageStyle = {
  marginTop: "14px",
  marginBottom: 0,
  color: "#1e293b",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
};
