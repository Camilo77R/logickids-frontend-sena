import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Brain,
  Eraser,
  History,
  RefreshCw,
  Sparkles,
  Target,
  Trash2,
  Users,
  X,
  Wand2,
} from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import LoadingState from "../../components/common/LoadingState";
import estudianteService from "../../services/estudianteService";
import recomendacionesService from "../../services/recomendacionesService";
import tutorGroupsService from "../../services/tutorGroupsService";
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

const normalizeId = (value) => String(value ?? "");

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

function RecommendationCard({ item, subjectName, onDelete }) {
  const severity = SEVERIDAD_META[item.severidad] ?? SEVERIDAD_META.media;

  return (
    <article className="lk-rec-card">
      <div className="lk-rec-card__header">
        <div>
          <div className="lk-rec-card__eyebrow">
            <span className={`lk-rec-badge ${severity.className}`}>{severity.label}</span>
            <span className="lk-rec-card__student">{subjectName}</span>
          </div>
          <h3 className="lk-rec-card__title">
            Enfoque principal: {item.habilidad ?? "Acompañamiento general"}
          </h3>
        </div>
        <div className="lk-rec-card__actions">
          <span className="lk-rec-card__date">{formatDate(item.generado_en)}</span>
          <button
            className="lk-rec-icon-button"
            onClick={onDelete}
            type="button"
            title="Archivar esta recomendación"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="lk-rec-meta">
        <span className="lk-rec-chip">
          <Target size={14} />
          Nivel de aciertos: {formatPercent(item.precision_momento)}
        </span>
        <span className="lk-rec-chip">
          <Brain size={14} />
          {item.modelo_ia
            ? `Generado con IA: ${item.modelo_ia}`
            : "Análisis automático local"}
        </span>
      </div>

      <RecommendationSections text={item.mensaje} />
    </article>
  );
}

export default function TutorRecomendacionesPage() {
  const [grupos, setGrupos] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [grupoId, setGrupoId] = useState("");
  const [estudianteId, setEstudianteId] = useState("");
  const [recomendaciones, setRecomendaciones] = useState([]);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const pageErrorTimer = useRef(null);
  const noticeTimer = useRef(null);
  const clearPageError = useCallback(() => setPageError(""), []);
  const clearNotice = useCallback(() => setNotice(""), []);

  useEffect(() => {
    if (pageError) {
      clearTimeout(pageErrorTimer.current);
      pageErrorTimer.current = setTimeout(clearPageError, 5000);
    }
    return () => clearTimeout(pageErrorTimer.current);
  }, [pageError, clearPageError]);

  useEffect(() => {
    if (notice) {
      clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(clearNotice, 5000);
    }
    return () => clearTimeout(noticeTimer.current);
  }, [notice, clearNotice]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const selectedGroup = useMemo(
    () => grupos.find((item) => normalizeId(item.id) === grupoId) ?? null,
    [grupos, grupoId]
  );

  const selectedStudent = useMemo(
    () => estudiantes.find((student) => normalizeId(student.id) === estudianteId) ?? null,
    [estudiantes, estudianteId]
  );

  const subjectName = selectedStudent?.nombre ?? selectedGroup?.nombre ?? "Grupo seleccionado";
  const targetMode = estudianteId ? "estudiante" : "grupo";

  const loadRecommendations = async ({ groupId, studentId } = {}) => {
    if (!groupId) {
      setRecomendaciones([]);
      return;
    }

    setIsLoadingRecommendations(true);
    setPageError("");

    try {
      const data = studentId
        ? await recomendacionesService.porEstudiante(studentId)
        : await recomendacionesService.porGrupo(groupId);
      setRecomendaciones(data ?? []);
    } catch (error) {
      setRecomendaciones([]);
      setPageError(error.message || "No fue posible cargar el seguimiento de recomendaciones.");
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const loadGroups = async () => {
      setIsBootstrapping(true);
      setPageError("");

      try {
        const data = await tutorGroupsService.getGroups();
        if (cancelled) return;

        const normalizedGroups = (data ?? []).map((group) => ({
          ...group,
          id: group.id_grupo ?? group.id,
        }));

        setGrupos(normalizedGroups);
        setGrupoId((current) =>
          current && normalizedGroups.some((group) => normalizeId(group.id) === current)
            ? current
            : normalizeId(normalizedGroups[0]?.id)
        );
      } catch (error) {
        if (!cancelled) {
          setGrupos([]);
          setGrupoId("");
          setPageError(error.message || "No fue posible cargar tus grupos.");
        }
      } finally {
        if (!cancelled) setIsBootstrapping(false);
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

      setIsLoadingStudents(true);

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
            : ""
        );
      } catch (error) {
        if (!cancelled) {
          setEstudiantes([]);
          setEstudianteId("");
          setPageError(error.message || "No fue posible cargar los estudiantes del grupo.");
        }
      } finally {
        if (!cancelled) setIsLoadingStudents(false);
      }
    };

    loadStudents();

    return () => {
      cancelled = true;
    };
  }, [grupoId]);

  useEffect(() => {
    loadRecommendations({ groupId: grupoId, studentId: estudianteId });
  }, [grupoId, estudianteId]);

  const handleGenerate = async () => {
    if (!grupoId) return;

    setIsGenerating(true);
    setPageError("");
    setNotice("");

    try {
      const generated = estudianteId
        ? await recomendacionesService.generarParaEstudiante(estudianteId)
        : await recomendacionesService.generarParaGrupo(grupoId);

      await loadRecommendations({ groupId: grupoId, studentId: estudianteId });
      setNotice(
        generated
          ? "Listo: creamos una recomendación nueva con los datos reales del juego."
          : "Listo: actualizamos las recomendaciones."
      );
    } catch (error) {
      setPageError(
        error.message ||
          "No fue posible crear la recomendación. Revisa que existan estadísticas del juego."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteRecommendation = async (recommendationId) => {
    setPageError("");
    setNotice("");

    try {
      await recomendacionesService.archivar(recommendationId);
      await loadRecommendations({ groupId: grupoId, studentId: estudianteId });
      setNotice("Recomendación archivada correctamente.");
    } catch (error) {
      setPageError(error.message || "No fue posible archivar esta recomendación.");
    }
  };

  const handleClearCurrent = async () => {
    if (!recomendaciones.length) return;

    setIsClearing(true);
    setPageError("");
    setNotice("");

    try {
      await Promise.all(recomendaciones.map((item) => recomendacionesService.archivar(item.id)));
      await loadRecommendations({ groupId: grupoId, studentId: estudianteId });
      setNotice("Seguimiento actual archivado correctamente.");
    } catch (error) {
      setPageError(error.message || "No fue posible limpiar el seguimiento actual.");
    } finally {
      setIsClearing(false);
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
            Usa los resultados reales de los juegos para crear sugerencias prácticas, revisar el
            seguimiento y decidir el próximo apoyo en clase.
          </p>
        </div>

        <div className="lk-rec-hero__summary">
          <StatCard
            icon={Users}
            label="Grupo elegido"
            value={selectedGroup?.nombre ?? "Sin grupo"}
            tone="purple"
          />
          <StatCard
            icon={Target}
            label="Enfoque"
            value={selectedStudent?.nombre || "Todo el grupo"}
            tone="orange"
          />
          <StatCard
            icon={History}
            label="Recomendaciones activas"
            value={recomendaciones.length}
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
              Escoge un grupo y, si quieres, enfócate en un estudiante puntual. La recomendación se
              genera con estadísticas reales guardadas por los juegos.
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
              value={grupoId}
              onChange={(event) => setGrupoId(event.target.value)}
            >
              <option value="">Selecciona un grupo</option>
              {grupos.map((group) => (
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
              value={estudianteId}
              onChange={(event) => setEstudianteId(event.target.value)}
              disabled={!grupoId || isLoadingStudents}
            >
              <option value="">Todo el grupo</option>
              {estudiantes.map((student) => (
                <option key={student.id} value={String(student.id)}>
                  {student.nombre}
                </option>
              ))}
            </select>
          </label>

          <button
            className="lk-rec-button lk-rec-button--primary"
            onClick={handleGenerate}
            disabled={isGenerating || !grupoId}
            type="button"
          >
            <RefreshCw size={16} />
            {isGenerating ? "Creando recomendación..." : "Crear recomendación"}
          </button>
        </div>

        {pageError ? (
          <div className="lk-rec-alert lk-rec-alert--error">
            <span>{pageError}</span>
            <button type="button" className="tutor-alert__close" onClick={clearPageError} aria-label="Cerrar"><X size={16} /></button>
          </div>
        ) : null}
        {notice ? (
          <div className="lk-rec-alert lk-rec-alert--success">
            <span>{notice}</span>
            <button type="button" className="tutor-alert__close" onClick={clearNotice} aria-label="Cerrar"><X size={16} /></button>
          </div>
        ) : null}

        <div className="lk-rec-source-note">
          <Brain size={16} />
          <span>
            Fuente actual: resultados guardados por los juegos en sesiones y estadísticas del
            estudiante.
          </span>
        </div>
      </section>

      <section className="lk-rec-panel lk-rec-panel--history">
        <div className="lk-rec-panel__header">
          <div>
            <span className="lk-rec-panel__eyebrow">Paso 2</span>
            <h2 className="lk-rec-panel__title">
              Seguimiento de recomendaciones {targetMode === "estudiante" ? "del estudiante" : "del grupo"}
            </h2>
            <p className="lk-rec-panel__subtitle">
              Aquí ves las recomendaciones activas guardadas en la base de datos. Puedes archivarlas
              cuando ya no sean necesarias.
            </p>
          </div>

          <button
            className="lk-rec-button lk-rec-button--ghost"
            onClick={handleClearCurrent}
            disabled={isClearing || !recomendaciones.length}
            type="button"
          >
            <Eraser size={16} />
            {isClearing ? "Archivando..." : "Archivar seguimiento actual"}
          </button>
        </div>

        {isLoadingRecommendations ? (
          <LoadingState message="Buscando el seguimiento guardado..." />
        ) : recomendaciones.length === 0 ? (
          <div className="lk-rec-empty-wrap">
            <EmptyState
              title="Aún no hay recomendaciones activas"
              description="Cuando existan partidas con estadísticas, podrás crear recomendaciones y verlas aquí."
            />
          </div>
        ) : (
          <div className="lk-rec-results">
            {recomendaciones.map((item) => (
              <RecommendationCard
                key={item.id}
                item={item}
                subjectName={subjectName}
                onDelete={() => handleDeleteRecommendation(item.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
