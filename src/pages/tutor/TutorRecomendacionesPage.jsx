import { useEffect, useMemo, useState } from "react";
import {
  Eraser,
  FileSpreadsheet,
  History,
  Sparkles,
  Target,
  Trash2,
  Users,
  Wand2,
} from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import recomendacionesService from "../../services/recomendacionesService";
import "../../styles/tutor-recomendaciones.css";

const SEVERIDAD_META = {
  alta: {
    label: "Apoyo urgente",
    className: "lk-rec-badge--danger",
  },
  media: {
    label: "Apoyo importante",
    className: "lk-rec-badge--warning",
  },
  baja: {
    label: "Seguimiento ligero",
    className: "lk-rec-badge--success",
  },
};

const formatDate = (value) => {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "No disponible";
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? String(value) : `${numericValue}%`;
};

const parseRecommendationSections = (text) => {
  if (!text) return [];

  const normalized = String(text).replace(/\r/g, "").trim();
  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const sections = [];
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    current.content = current.content.trim();
    sections.push(current);
  };

  for (const line of lines) {
    const headingMatch = line.match(
      /^(Hallazgo principal|Interpretacion|Interpretación|Acciones sugeridas|Seguimiento)\s*:\s*(.*)$/i
    );

    if (headingMatch) {
      pushCurrent();
      const rawTitle = headingMatch[1].toLowerCase();
      const title =
        rawTitle.startsWith("hallazgo")
          ? "Qué está pasando"
          : rawTitle.startsWith("interpret")
            ? "Cómo entenderlo"
            : rawTitle.startsWith("acciones")
              ? "Qué puede hacer el tutor"
              : "Cómo darle seguimiento";

      current = {
        title,
        content: headingMatch[2] ?? "",
      };
      continue;
    }

    if (!current) {
      current = {
        title: "Recomendación",
        content: line,
      };
      continue;
    }

    current.content += `${current.content ? "\n" : ""}${line}`;
  }

  pushCurrent();
  return sections;
};

function StatCard({ icon: Icon, label, value, tone = "purple" }) {
  return (
    <div className={`lk-rec-stat lk-rec-stat--${tone}`}>
      <div className="lk-rec-stat__icon">
        <Icon size={18} strokeWidth={2.2} />
      </div>
      <div className="lk-rec-stat__copy">
        <span className="lk-rec-stat__label">{label}</span>
        <strong className="lk-rec-stat__value">{value}</strong>
      </div>
    </div>
  );
}

function RecommendationSections({ text }) {
  const sections = parseRecommendationSections(text);

  if (sections.length === 0) {
    return <p className="lk-rec-copy">{text || "Sin recomendación disponible."}</p>;
  }

  return (
    <div className="lk-rec-sections">
      {sections.map((section) => (
        <div key={`${section.title}-${section.content.slice(0, 24)}`} className="lk-rec-section">
          <strong className="lk-rec-section__title">{section.title}</strong>
          <p className="lk-rec-section__content">{section.content}</p>
        </div>
      ))}
    </div>
  );
}

function RecommendationCard({ item }) {
  const severity = SEVERIDAD_META[item.severidad] ?? SEVERIDAD_META.media;

  return (
    <article className="lk-rec-card">
      <div className="lk-rec-card__header">
        <div>
          <div className="lk-rec-card__eyebrow">
            <span className={`lk-rec-badge ${severity.className}`}>{severity.label}</span>
            <span className="lk-rec-card__student">{item.nombre ?? "Estudiante"}</span>
          </div>
          <h3 className="lk-rec-card__title">
            Enfoque principal: {item.habilidad_critica ?? "Acompañamiento general"}
          </h3>
        </div>
        <span className="lk-rec-card__date">{formatDate(item.fecha_generacion)}</span>
      </div>

      <div className="lk-rec-meta">
        <span className="lk-rec-chip">
          <Target size={14} />
          Nivel de aciertos: {formatPercent(item.precision_actual)}
        </span>
        <span className="lk-rec-chip">
          <Sparkles size={14} />
          Nivel de apoyo: {item.prioridad ?? "Por definir"}
        </span>
      </div>

      <RecommendationSections text={item.recomendacion} />
    </article>
  );
}

function HistoryCard({ item, onDelete }) {
  const severity = SEVERIDAD_META[item.severidad] ?? SEVERIDAD_META.media;

  return (
    <article className="lk-rec-card lk-rec-card--history">
      <div className="lk-rec-card__header">
        <div>
          <div className="lk-rec-card__eyebrow">
            <span className={`lk-rec-badge ${severity.className}`}>{severity.label}</span>
            <span className="lk-rec-card__student">
              {item.nombre_estudiante ?? "Estudiante"}
            </span>
          </div>
          <h3 className="lk-rec-card__title">
            Seguimiento en {item.habilidad ?? "habilidad general"}
          </h3>
        </div>
        <div className="lk-rec-card__actions">
          <span className="lk-rec-card__date">{formatDate(item.generado_en)}</span>
          <button
            className="lk-rec-icon-button"
            onClick={onDelete}
            type="button"
            title="Borrar este registro"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="lk-rec-meta">
        <span className="lk-rec-chip">
          <Users size={14} />
          Grupo: {item.nombre_grupo ?? "Sin grupo"}
        </span>
        <span className="lk-rec-chip">
          <Target size={14} />
          Acierto al momento: {formatPercent(item.precision_momento)}
        </span>
      </div>

      <p className="lk-rec-copy">{item.mensaje_objetivo ?? "Sin texto de seguimiento."}</p>
    </article>
  );
}

export default function TutorRecomendacionesPage() {
  const [csvGrupos, setCsvGrupos] = useState([]);
  const [selectedCsvGrupoId, setSelectedCsvGrupoId] = useState("");
  const [selectedCsvEstudianteId, setSelectedCsvEstudianteId] = useState("");
  const [recomendacionesCsv, setRecomendacionesCsv] = useState([]);
  const [historialCsv, setHistorialCsv] = useState([]);
  const [csvError, setCsvError] = useState(null);
  const [historyError, setHistoryError] = useState(null);
  const [historyNotice, setHistoryNotice] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isGeneratingCsv, setIsGeneratingCsv] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isClearingHistory, setIsClearingHistory] = useState(false);

  const selectedCsvGroup = useMemo(
    () => csvGrupos.find((item) => String(item.id) === String(selectedCsvGrupoId)) ?? null,
    [csvGrupos, selectedCsvGrupoId]
  );

  const csvStudents = useMemo(() => {
    if (!selectedCsvGrupoId) return [];
    return selectedCsvGroup?.estudiantes ?? [];
  }, [selectedCsvGroup, selectedCsvGrupoId]);

  const selectedStudentName =
    csvStudents.find((student) => String(student.id) === String(selectedCsvEstudianteId))?.nombre ??
    "";

  const loadHistory = async (grupoId, estudianteId) => {
    setIsLoadingHistory(true);
    setHistoryError(null);

    try {
      const data = await recomendacionesService.obtenerHistorialCsvIA({
        grupoId,
        estudianteId,
      });
      setHistorialCsv(data);
    } catch (error) {
      setHistorialCsv([]);
      setHistoryError(error.message || "No fue posible cargar el seguimiento.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const csvCatalog = await recomendacionesService.obtenerCatalogoCsvIA();
        setCsvGrupos(csvCatalog?.grupos ?? []);

        if (csvCatalog?.grupos?.length > 0) {
          setSelectedCsvGrupoId(String(csvCatalog.grupos[0].id));
        }
      } catch (error) {
        setCsvError(error.message || "No fue posible cargar la información de recomendaciones.");
      } finally {
        setIsBootstrapping(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedCsvGrupoId) {
      setSelectedCsvEstudianteId("");
      setHistorialCsv([]);
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

  useEffect(() => {
    if (!selectedCsvGrupoId) return;
    loadHistory(selectedCsvGrupoId, selectedCsvEstudianteId);
  }, [selectedCsvGrupoId, selectedCsvEstudianteId]);

  const handleGenerateCsv = async () => {
    setIsGeneratingCsv(true);
    setCsvError(null);
    setHistoryNotice(null);

    try {
      const result = await recomendacionesService.generarDesdeCsvIA({
        grupoId: selectedCsvGrupoId,
        estudianteId: selectedCsvEstudianteId,
      });
      setRecomendacionesCsv(result.recomendaciones ?? []);
      await loadHistory(selectedCsvGrupoId, selectedCsvEstudianteId);

      if (result.historialActualizado) {
        setHistoryNotice(
          `Listo: guardamos ${result.historialActualizado} recomendación(es) en el seguimiento.`
        );
      }
    } catch (error) {
      setRecomendacionesCsv([]);
      setCsvError(error.message || "No fue posible crear la recomendación.");
    } finally {
      setIsGeneratingCsv(false);
    }
  };

  const handleDeleteHistoryEntry = async (recommendationId) => {
    setHistoryError(null);
    setHistoryNotice(null);

    try {
      const result = await recomendacionesService.borrarHistorialCsvIA({ recommendationId });
      await loadHistory(selectedCsvGrupoId, selectedCsvEstudianteId);
      setHistoryNotice(result.message);
    } catch (error) {
      setHistoryError(error.message || "No fue posible borrar este registro.");
    }
  };

  const handleClearFilteredHistory = async () => {
    setIsClearingHistory(true);
    setHistoryError(null);
    setHistoryNotice(null);

    try {
      const result = await recomendacionesService.borrarHistorialCsvIA({
        grupoId: selectedCsvGrupoId,
        estudianteId: selectedCsvEstudianteId || undefined,
      });
      await loadHistory(selectedCsvGrupoId, selectedCsvEstudianteId);
      setHistoryNotice(result.message);
    } catch (error) {
      setHistoryError(error.message || "No fue posible borrar el seguimiento actual.");
    } finally {
      setIsClearingHistory(false);
    }
  };

  if (isBootstrapping) {
    return <LoadingState message="Preparando las recomendaciones para tu grupo..." />;
  }

  return (
    <div className="lk-rec-page">
      <section className="lk-rec-hero">
        <div className="lk-rec-hero__glow" />
        <div className="lk-rec-hero__copy">
          <span className="lk-rec-hero__eyebrow">
            <Sparkles size={15} />
            Acompañamiento pedagógico
          </span>
          <h1 className="lk-rec-hero__title">Recomendaciones para acompañar a tus estudiantes</h1>
          <p className="lk-rec-hero__subtitle">
            Elige un grupo, revisa las señales de aprendizaje y crea sugerencias prácticas para dar
            apoyo en clase sin perder el seguimiento de cada avance.
          </p>
        </div>

        <div className="lk-rec-hero__summary">
          <StatCard
            icon={Users}
            label="Grupo elegido"
            value={selectedCsvGroup?.nombre ?? "Sin grupo"}
            tone="purple"
          />
          <StatCard
            icon={Target}
            label="Estudiante"
            value={selectedStudentName || "Todo el grupo"}
            tone="orange"
          />
          <StatCard
            icon={History}
            label="Registros guardados"
            value={historialCsv.length}
            tone="green"
          />
        </div>
      </section>

      <section className="lk-rec-panel lk-rec-panel--builder">
        <div className="lk-rec-panel__header">
          <div>
            <span className="lk-rec-panel__eyebrow">Paso 1</span>
            <h2 className="lk-rec-panel__title">Crear una recomendación</h2>
            <p className="lk-rec-panel__subtitle">
              Escoge el grupo y, si quieres, enfócate en un estudiante puntual para recibir una
              orientación más precisa.
            </p>
          </div>
          <div className="lk-rec-callout">
            <Wand2 size={18} />
            <span>Consejos claros y listos para aplicar</span>
          </div>
        </div>

        <div className="lk-rec-form">
          <label className="lk-rec-field">
            <span className="lk-rec-field__label">Grupo del curso</span>
            <select
              className="lk-rec-select"
              value={selectedCsvGrupoId}
              onChange={(event) => setSelectedCsvGrupoId(event.target.value)}
            >
              <option value="">Selecciona un grupo</option>
              {csvGrupos.map((group) => (
                <option key={group.id} value={String(group.id)}>
                  {group.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="lk-rec-field">
            <span className="lk-rec-field__label">Estudiante</span>
            <select
              className="lk-rec-select"
              value={selectedCsvEstudianteId}
              onChange={(event) => setSelectedCsvEstudianteId(event.target.value)}
              disabled={!selectedCsvGrupoId}
            >
              <option value="">Todo el grupo</option>
              {csvStudents.map((student) => (
                <option key={student.id} value={String(student.id)}>
                  {student.nombre}
                </option>
              ))}
            </select>
          </label>

          <button
            className="lk-rec-button lk-rec-button--primary"
            onClick={handleGenerateCsv}
            disabled={isGeneratingCsv || !selectedCsvGrupoId}
            type="button"
          >
            <FileSpreadsheet size={16} />
            {isGeneratingCsv ? "Creando recomendación..." : "Crear recomendación"}
          </button>
        </div>

        {csvError ? <div className="lk-rec-alert lk-rec-alert--error">{csvError}</div> : null}
        {historyNotice ? <div className="lk-rec-alert lk-rec-alert--success">{historyNotice}</div> : null}

        {isGeneratingCsv ? (
          <LoadingState message="Estamos preparando una recomendación para ti..." />
        ) : recomendacionesCsv.length === 0 ? (
          <div className="lk-rec-empty-wrap">
            <EmptyState
              title="Todavía no has creado una recomendación"
              description="Selecciona un grupo y presiona el botón para recibir orientaciones pedagógicas."
            />
          </div>
        ) : (
          <div className="lk-rec-results">
            {recomendacionesCsv.map((item, index) => (
              <RecommendationCard
                key={`${item.estudiante_id}-${item.habilidad_critica}-${index}`}
                item={item}
              />
            ))}
          </div>
        )}
      </section>

      <section className="lk-rec-panel lk-rec-panel--history">
        <div className="lk-rec-panel__header">
          <div>
            <span className="lk-rec-panel__eyebrow">Paso 2</span>
            <h2 className="lk-rec-panel__title">Seguimiento de recomendaciones</h2>
            <p className="lk-rec-panel__subtitle">
              Aquí ves lo que ya se sugirió antes para este grupo o estudiante, así es más fácil
              continuar el acompañamiento sin empezar de cero.
            </p>
          </div>

          <button
            className="lk-rec-button lk-rec-button--ghost"
            onClick={handleClearFilteredHistory}
            disabled={isClearingHistory || !selectedCsvGrupoId}
            type="button"
          >
            <Eraser size={16} />
            {isClearingHistory ? "Borrando..." : "Limpiar seguimiento actual"}
          </button>
        </div>

        {historyError ? (
          <div className="lk-rec-alert lk-rec-alert--error">{historyError}</div>
        ) : null}

        {isLoadingHistory ? (
          <LoadingState message="Buscando el seguimiento guardado..." />
        ) : historialCsv.length === 0 ? (
          <div className="lk-rec-empty-wrap">
            <EmptyState
              title="Aún no hay seguimiento guardado"
              description="Cuando crees recomendaciones, irán apareciendo aquí para ayudarte a recordar qué se sugirió antes."
            />
          </div>
        ) : (
          <div className="lk-rec-results">
            {historialCsv.map((item) => (
              <HistoryCard
                key={item.recomendacion_id}
                item={item}
                onDelete={() => handleDeleteHistoryEntry(item.recomendacion_id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
