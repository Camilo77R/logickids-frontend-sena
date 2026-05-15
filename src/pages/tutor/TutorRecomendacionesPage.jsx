import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  Brain,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
  Users,
} from "lucide-react";
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

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "N/D";

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return String(value);

  return `${numericValue}%`;
};

const severityTone = {
  baja: { bg: "#dcfce7", fg: "#166534" },
  media: { bg: "#fef3c7", fg: "#92400e" },
  alta: { bg: "#fee2e2", fg: "#b91c1c" },
};

const initialFeedback = { type: "", message: "" };

export default function TutorRecomendacionesPage() {
  const [grupos, setGrupos] = useState([]);
  const [selectedGrupoId, setSelectedGrupoId] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [selectedEstudianteId, setSelectedEstudianteId] = useState("");
  const [csvGrupos, setCsvGrupos] = useState([]);
  const [selectedCsvGrupoId, setSelectedCsvGrupoId] = useState("");
  const [selectedCsvEstudianteId, setSelectedCsvEstudianteId] = useState("");
  const [recomendacionesEstudiante, setRecomendacionesEstudiante] = useState([]);
  const [recomendacionesGrupo, setRecomendacionesGrupo] = useState([]);
  const [recomendacionesCsvIA, setRecomendacionesCsvIA] = useState([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingStudentRecommendations, setIsLoadingStudentRecommendations] = useState(false);
  const [isLoadingGroupRecommendations, setIsLoadingGroupRecommendations] = useState(false);
  const [isGeneratingStudent, setIsGeneratingStudent] = useState(false);
  const [isGeneratingGroup, setIsGeneratingGroup] = useState(false);
  const [isGeneratingCsvIA, setIsGeneratingCsvIA] = useState(false);
  const [archivingRecommendationId, setArchivingRecommendationId] = useState(null);
  const [feedback, setFeedback] = useState(initialFeedback);

  const selectedGroup = useMemo(
    () => grupos.find((item) => String(item.id ?? item.id_grupo) === String(selectedGrupoId)) ?? null,
    [grupos, selectedGrupoId]
  );

  const selectedStudent = useMemo(
    () => estudiantes.find((item) => String(item.id) === String(selectedEstudianteId)) ?? null,
    [estudiantes, selectedEstudianteId]
  );

  const selectedCsvGroup = useMemo(
    () => csvGrupos.find((item) => String(item.id) === String(selectedCsvGrupoId)) ?? null,
    [csvGrupos, selectedCsvGrupoId]
  );

  const csvStudents = useMemo(() => {
    if (!selectedCsvGrupoId) {
      return [];
    }

    return selectedCsvGroup?.estudiantes ?? [];
  }, [selectedCsvGroup, selectedCsvGrupoId]);

  const selectedCsvStudent = useMemo(
    () => csvStudents.find((item) => String(item.id) === String(selectedCsvEstudianteId)) ?? null,
    [csvStudents, selectedCsvEstudianteId]
  );

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [groupsPayload, csvCatalog] = await Promise.all([
          tutorGroupsService.listarGrupos(),
          recomendacionesService.obtenerCatalogoCsvIA(),
        ]);
        const nextGroups = groupsPayload?.data ?? [];
        setGrupos(nextGroups);
        const nextCsvGroups = csvCatalog?.grupos ?? [];
        setCsvGrupos(nextCsvGroups);

        if (nextGroups.length > 0) {
          setSelectedGrupoId(String(nextGroups[0].id ?? nextGroups[0].id_grupo));
        }

        if (nextCsvGroups.length > 0) {
          setSelectedCsvGrupoId(String(nextCsvGroups[0].id));
        }
      } catch (error) {
        setFeedback({
          type: "error",
          message: error.message || "No fue posible cargar los grupos del tutor y del CSV.",
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
      setRecomendacionesGrupo([]);
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
    if (!selectedCsvGrupoId) {
      setSelectedCsvEstudianteId("");
      return;
    }

    const nextStudents = selectedCsvGroup?.estudiantes ?? [];
    setSelectedCsvEstudianteId((current) => {
      if (nextStudents.some((student) => String(student.id) === String(current))) {
        return current;
      }

      return nextStudents.length ? String(nextStudents[0].id) : "";
    });
  }, [selectedCsvGroup, selectedCsvGrupoId]);

  useEffect(() => {
    if (!selectedGrupoId) return;

    const loadGroupRecommendations = async () => {
      setIsLoadingGroupRecommendations(true);

      try {
        const nextRecommendations = await recomendacionesService.listarPorGrupo(
          Number(selectedGrupoId)
        );
        setRecomendacionesGrupo(nextRecommendations);
      } catch (error) {
        setRecomendacionesGrupo([]);
        setFeedback({
          type: "error",
          message: error.message || "No fue posible cargar las recomendaciones del grupo.",
        });
      } finally {
        setIsLoadingGroupRecommendations(false);
      }
    };

    loadGroupRecommendations();
  }, [selectedGrupoId]);

  useEffect(() => {
    if (!selectedEstudianteId) {
      setRecomendacionesEstudiante([]);
      return;
    }

    const loadStudentRecommendations = async () => {
      setIsLoadingStudentRecommendations(true);

      try {
        const nextRecommendations = await recomendacionesService.listarPorEstudiante(
          Number(selectedEstudianteId)
        );
        setRecomendacionesEstudiante(nextRecommendations);
      } catch (error) {
        setRecomendacionesEstudiante([]);
        setFeedback({
          type: "error",
          message: error.message || "No fue posible cargar las recomendaciones del estudiante.",
        });
      } finally {
        setIsLoadingStudentRecommendations(false);
      }
    };

    loadStudentRecommendations();
  }, [selectedEstudianteId]);

  const handleRefreshStudentHistory = async () => {
    if (!selectedEstudianteId) return;

    setIsLoadingStudentRecommendations(true);
    setFeedback(initialFeedback);

    try {
      const nextRecommendations = await recomendacionesService.listarPorEstudiante(
        Number(selectedEstudianteId)
      );
      setRecomendacionesEstudiante(nextRecommendations);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible actualizar el historial del estudiante.",
      });
    } finally {
      setIsLoadingStudentRecommendations(false);
    }
  };

  const handleRefreshGroupHistory = async () => {
    if (!selectedGrupoId) return;

    setIsLoadingGroupRecommendations(true);
    setFeedback(initialFeedback);

    try {
      const nextRecommendations = await recomendacionesService.listarPorGrupo(Number(selectedGrupoId));
      setRecomendacionesGrupo(nextRecommendations);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible actualizar el historial del grupo.",
      });
    } finally {
      setIsLoadingGroupRecommendations(false);
    }
  };

  const handleGenerateStudent = async () => {
    if (!selectedEstudianteId) return;

    setIsGeneratingStudent(true);
    setFeedback(initialFeedback);

    try {
      const recommendation = await recomendacionesService.generarParaEstudiante(
        Number(selectedEstudianteId)
      );

      setRecomendacionesEstudiante((current) =>
        recommendation
          ? [recommendation, ...current.filter((item) => item.id !== recommendation.id)]
          : current
      );

      setFeedback({
        type: "success",
        message: "Recomendacion individual generada y guardada correctamente.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible generar la recomendacion individual.",
      });
    } finally {
      setIsGeneratingStudent(false);
    }
  };

  const handleGenerateGroup = async () => {
    if (!selectedGrupoId) return;

    setIsGeneratingGroup(true);
    setFeedback(initialFeedback);

    try {
      const recommendation = await recomendacionesService.generarParaGrupo(Number(selectedGrupoId));

      setRecomendacionesGrupo((current) =>
        recommendation
          ? [recommendation, ...current.filter((item) => item.id !== recommendation.id)]
          : current
      );

      setFeedback({
        type: "success",
        message: "Recomendacion grupal generada y guardada correctamente.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible generar la recomendacion grupal.",
      });
    } finally {
      setIsGeneratingGroup(false);
    }
  };

  const handleGenerateCsvIA = async () => {
    setIsGeneratingCsvIA(true);
    setFeedback(initialFeedback);

    try {
      const result = await recomendacionesService.generarDesdeCsvIA({
        grupoId: selectedCsvGrupoId,
        estudianteId: selectedCsvEstudianteId,
      });
      setRecomendacionesCsvIA(result.recomendaciones ?? []);

      const scopeLabel = selectedCsvEstudianteId
        ? `para ${selectedCsvStudent?.nombre ?? "el estudiante seleccionado"}`
        : selectedCsvGrupoId
          ? `para ${selectedCsvGroup?.nombre ?? "el grupo seleccionado"}`
          : "para todo el CSV";

      setFeedback({
        type: "success",
        message: `Integracion CSV-FastAPI ejecutada correctamente ${scopeLabel}. ${result.total ?? 0} recomendacion(es) procesadas.`,
      });
    } catch (error) {
      setRecomendacionesCsvIA([]);
      setFeedback({
        type: "error",
        message: error.message || "No fue posible ejecutar el flujo CSV con FastAPI.",
      });
    } finally {
      setIsGeneratingCsvIA(false);
    }
  };

  const handleArchive = async (recommendationId, scope) => {
    setArchivingRecommendationId(recommendationId);
    setFeedback(initialFeedback);

    try {
      await recomendacionesService.archivar(recommendationId);

      if (scope === "student") {
        setRecomendacionesEstudiante((current) =>
          current.filter((item) => item.id !== recommendationId)
        );
      } else {
        setRecomendacionesGrupo((current) => current.filter((item) => item.id !== recommendationId));
      }

      setFeedback({
        type: "success",
        message: "La recomendacion fue archivada correctamente.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible archivar la recomendacion.",
      });
    } finally {
      setArchivingRecommendationId(null);
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
            Conecta la generacion del backend con seguimiento individual y grupal para tus cursos.
          </p>
        </div>

        <div style={headerActionsStyle}>
          <button
            type="button"
            onClick={handleRefreshStudentHistory}
            disabled={!selectedEstudianteId || isLoadingStudentRecommendations}
            style={secondaryButtonStyle}
          >
            <RefreshCw size={16} />
            Historial estudiante
          </button>
          <button
            type="button"
            onClick={handleRefreshGroupHistory}
            disabled={!selectedGrupoId || isLoadingGroupRecommendations}
            style={secondaryButtonStyle}
          >
            <RefreshCw size={16} />
            Historial grupo
          </button>
        </div>
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
          <strong>Generacion de recomendaciones</strong>
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

        <div style={actionsGridStyle}>
          <div style={actionCardStyle}>
            <div style={actionCardHeaderStyle}>
              <Sparkles size={18} />
              <strong>Individual</strong>
            </div>
            <p style={actionDescriptionStyle}>
              {selectedStudent
                ? `Genera una recomendacion para ${selectedStudent.nombre} usando su habilidad con menor precision.`
                : "Selecciona un estudiante del grupo para generar una recomendacion personalizada."}
            </p>
            <button
              type="button"
              onClick={handleGenerateStudent}
              disabled={!selectedEstudianteId || isGeneratingStudent || isLoadingStudents}
              style={primaryButtonStyle}
            >
              <Sparkles size={16} />
              {isGeneratingStudent ? "Generando..." : "Generar recomendacion"}
            </button>
          </div>

          <div style={actionCardStyle}>
            <div style={actionCardHeaderStyle}>
              <Users size={18} />
              <strong>Grupal</strong>
            </div>
            <p style={actionDescriptionStyle}>
              {selectedGroup
                ? `Genera una recomendacion consolidada para ${selectedGroup.nombre} con base en el rendimiento del grupo.`
                : "Selecciona un grupo para generar una recomendacion general de aula."}
            </p>
            <button
              type="button"
              onClick={handleGenerateGroup}
              disabled={!selectedGrupoId || isGeneratingGroup}
              style={groupButtonStyle}
            >
              <Users size={16} />
              {isGeneratingGroup ? "Generando..." : "Generar recomendacion grupal"}
            </button>
          </div>

          <div style={actionCardStyle}>
            <div style={actionCardHeaderStyle}>
              <FileSpreadsheet size={18} />
              <strong>CSV + FastAPI</strong>
            </div>
            <p style={actionDescriptionStyle}>
              Ejecuta la integracion del trabajo de tu companero: el backend exporta estadisticas a CSV,
              las envia al servicio FastAPI y devuelve recomendaciones calculadas desde ese flujo.
            </p>
            <div style={csvFiltersStyle}>
              <label style={fieldStyle}>
                <span>Grupo del CSV</span>
                <select
                  value={selectedCsvGrupoId}
                  onChange={(event) => setSelectedCsvGrupoId(event.target.value)}
                  style={inputStyle}
                  disabled={csvGrupos.length === 0}
                >
                  <option value="">Selecciona un grupo</option>
                  {csvGrupos.map((grupo) => (
                    <option key={grupo.id} value={String(grupo.id)}>
                      {grupo.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label style={fieldStyle}>
                <span>Estudiante del CSV</span>
                <select
                  value={selectedCsvEstudianteId}
                  onChange={(event) => setSelectedCsvEstudianteId(event.target.value)}
                  style={inputStyle}
                  disabled={!selectedCsvGrupoId || csvStudents.length === 0}
                >
                  <option value="">Todos los estudiantes del grupo</option>
                  {csvStudents.map((estudiante) => (
                    <option key={estudiante.id} value={String(estudiante.id)}>
                      {estudiante.nombre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              onClick={handleGenerateCsvIA}
              disabled={isGeneratingCsvIA || !selectedCsvGrupoId}
              style={csvButtonStyle}
            >
              <FileSpreadsheet size={16} />
              {isGeneratingCsvIA ? "Procesando CSV..." : "Generar desde CSV IA"}
            </button>
          </div>
        </div>
      </section>

      <section style={{ ...panelStyle, marginTop: "24px" }}>
        <div style={panelHeaderStyle}>
          <FileSpreadsheet size={20} />
          <strong>Resultado del flujo CSV</strong>
        </div>

        {isGeneratingCsvIA ? (
          <LoadingState message="Procesando archivo CSV en el servicio FastAPI..." />
        ) : recomendacionesCsvIA.length === 0 ? (
          <EmptyState
            title="Sin resultados del CSV"
            description="Usa el boton de CSV + FastAPI para validar la integracion que genera recomendaciones desde el analizador."
          />
        ) : (
          <div style={cardsGridStyle}>
            {recomendacionesCsvIA.map((item, index) => {
              const tone = severityTone[item.severidad] ?? severityTone.media;

              return (
                <article key={`${item.estudiante_id}-${item.habilidad_critica}-${index}`} style={cardStyle}>
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
                    <span style={dateStyle}>{formatDate(item.fecha_generacion)}</span>
                  </div>

                  <h3 style={cardTitleStyle}>{item.nombre ?? "Estudiante sin nombre"}</h3>

                  <p style={metaStyle}>
                    Habilidad critica: <strong>{item.habilidad_critica ?? "No definida"}</strong>
                  </p>
                  <p style={metaStyle}>
                    Precision actual: <strong>{formatPercent(item.precision_actual)}</strong>
                  </p>
                  <p style={metaStyle}>
                    Prioridad: <strong>{item.prioridad ?? "N/D"}</strong>
                  </p>
                  <p style={metaStyle}>
                    Modelo usado: <strong>{item.modelo_usado ?? "No reportado"}</strong>
                  </p>
                  <p style={metaStyle}>
                    Tipo de salida: <strong>{item.es_simulada ? "Simulada" : "IA generativa"}</strong>
                  </p>
                  {item.ia_error ? (
                    <p style={{ ...metaStyle, color: "#b91c1c" }}>
                      Detalle IA: <strong>{item.ia_error}</strong>
                    </p>
                  ) : null}

                  <p style={messageStyle}>{item.recomendacion ?? "Sin recomendacion generada."}</p>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section style={historyGridStyle}>
        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <Sparkles size={20} />
            <strong>Historial del estudiante</strong>
          </div>

          {isLoadingStudentRecommendations ? (
            <LoadingState message="Cargando historial del estudiante..." />
          ) : !selectedEstudianteId ? (
            <EmptyState
              title="Selecciona un estudiante"
              description="El historial individual aparecera cuando elijas un estudiante."
            />
          ) : recomendacionesEstudiante.length === 0 ? (
            <EmptyState
              title="Sin recomendaciones guardadas"
              description="Todavia no existe una recomendacion individual para este estudiante."
            />
          ) : (
            <div style={cardsGridStyle}>
              {recomendacionesEstudiante.map((item) => (
                <RecommendationCard
                  key={item.id}
                  item={item}
                  onArchive={() => handleArchive(item.id, "student")}
                  isArchiving={archivingRecommendationId === item.id}
                />
              ))}
            </div>
          )}
        </div>

        <div style={panelStyle}>
          <div style={panelHeaderStyle}>
            <Users size={20} />
            <strong>Historial del grupo</strong>
          </div>

          {isLoadingGroupRecommendations ? (
            <LoadingState message="Cargando historial del grupo..." />
          ) : !selectedGrupoId ? (
            <EmptyState
              title="Selecciona un grupo"
              description="El historial grupal aparecera cuando elijas uno de tus grupos."
            />
          ) : recomendacionesGrupo.length === 0 ? (
            <EmptyState
              title="Sin recomendaciones grupales"
              description="Todavia no existe una recomendacion generada para este grupo."
            />
          ) : (
            <div style={cardsGridStyle}>
              {recomendacionesGrupo.map((item) => (
                <RecommendationCard
                  key={item.id}
                  item={item}
                  onArchive={() => handleArchive(item.id, "group")}
                  isArchiving={archivingRecommendationId === item.id}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function RecommendationCard({ item, onArchive, isArchiving }) {
  const tone = severityTone[item.severidad] ?? severityTone.media;

  return (
    <article style={cardStyle}>
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
        Precision al generar: <strong>{formatPercent(item.precision_momento)}</strong>
      </p>
      <p style={metaStyle}>
        Modelo usado: <strong>{item.modelo_ia ?? "simulado"}</strong>
      </p>

      <p style={messageStyle}>{item.mensaje}</p>

      <div style={cardActionsStyle}>
        <button type="button" onClick={onArchive} disabled={isArchiving} style={archiveButtonStyle}>
          <Archive size={15} />
          {isArchiving ? "Archivando..." : "Archivar"}
        </button>
      </div>
    </article>
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

const headerActionsStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
};

const subtitleStyle = {
  marginTop: "8px",
  marginBottom: 0,
  color: "#64748b",
  maxWidth: "720px",
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

const actionsGridStyle = {
  marginTop: "20px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "16px",
};

const actionCardStyle = {
  border: "1px solid #dbeafe",
  borderRadius: "18px",
  padding: "18px",
  background: "linear-gradient(180deg, #ffffff, #f8fafc)",
};

const actionCardHeaderStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "10px",
  color: "#0f172a",
};

const actionDescriptionStyle = {
  marginTop: 0,
  marginBottom: "16px",
  color: "#475569",
  lineHeight: 1.6,
  minHeight: "72px",
};

const csvFiltersStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
  marginBottom: "16px",
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

const groupButtonStyle = {
  ...primaryButtonStyle,
  background: "linear-gradient(135deg, #1d4ed8, #38bdf8)",
};

const csvButtonStyle = {
  ...primaryButtonStyle,
  background: "linear-gradient(135deg, #b45309, #f59e0b)",
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

const historyGridStyle = {
  marginTop: "24px",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "24px",
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

const cardActionsStyle = {
  marginTop: "16px",
  display: "flex",
  justifyContent: "flex-end",
};

const archiveButtonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  borderRadius: "999px",
  border: "1px solid #fecaca",
  padding: "10px 14px",
  background: "#fff1f2",
  color: "#b91c1c",
  fontWeight: 700,
  cursor: "pointer",
};
