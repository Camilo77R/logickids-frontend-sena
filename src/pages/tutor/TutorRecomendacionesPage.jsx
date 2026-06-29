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
      /^(Hallazgo principal|Interpretacion|InterpretaciÃ³n|Acciones sugeridas|Seguimiento)\s*:\s*(.*)$/i
    );

    if (headingMatch) {
      pushCurrent();
      const rawTitle = headingMatch[1].toLowerCase();
      const title =
        rawTitle.startsWith("hallazgo")
          ? "QuÃ© estÃ¡ pasando"
          : rawTitle.startsWith("interpret")
            ? "CÃ³mo entenderlo"
            : rawTitle.startsWith("acciones")
              ? "QuÃ© puede hacer el tutor"
              : "CÃ³mo darle seguimiento";

      current = {
        title,
        content: headingMatch[2] ?? "",
      };
      continue;
    }

    if (!current) {
      current = {
        title: "RecomendaciÃ³n",
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
    return <p className="lk-rec-copy">{text || "Sin recomendaciÃ³n disponible."}</p>;
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
            Enfoque principal: {item.habilidad ?? "AcompaÃ±amiento general"}
          </h3>
        </div>
        <div className="lk-rec-card__actions">
          <span className="lk-rec-card__date">{formatDate(item.generado_en)}</span>
          <button
            className="lk-rec-icon-button"
            onClick={onDelete}
            type="button"
            title="Archivar esta recomendaciÃ³n"
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
            : "AnÃ¡lisis automÃ¡tico local"}
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
          ? "Listo: creamos una recomendaciÃ³n nueva con los datos reales del juego."
          : "Listo: actualizamos las recomendaciones."
      );
    } catch (error) {
      setPageError(
        error.message ||
          "No fue posible crear la recomendaciÃ³n. Revisa que existan estadÃ­sticas del juego."
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
      setNotice("RecomendaciÃ³n archivada correctamente.");
    } catch (error) {
      setPageError(error.message || "No fue posible archivar esta recomendaciÃ³n.");
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
      {/* Header */}
      <div className="lk-rec-page-header">
        <h1>Recomendaciones Pedagógicas</h1>
        <p>Sugerencias generadas por IA Gemini</p>
      </div>

      {/* Alertas */}
      {pageError && (
        <div className="lk-rec-alert lk-rec-alert--error">
          <span>{pageError}</span>
          <button type="button" className="tutor-alert__close" onClick={clearPageError} aria-label="Cerrar"><X size={16} /></button>
        </div>
      )}
      {notice && (
        <div className="lk-rec-alert lk-rec-alert--success">
          <span>{notice}</span>
          <button type="button" className="tutor-alert__close" onClick={clearNotice} aria-label="Cerrar"><X size={16} /></button>
        </div>
      )}

      {/* Filtros */}
      <div className="lk-rec-filter-row">
        <label className="lk-rec-filter-row">
          <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "#1A1A2E" }}>Grupo:</span>
          <select className="lk-rec-filter-select" value={grupoId} onChange={(e) => setGrupoId(e.target.value)}>
            <option value="">Todos los Grupos</option>
            {grupos.map((g) => <option key={g.id} value={String(g.id)}>{g.nombre}</option>)}
          </select>
          {grupoId && (
            <select className="lk-rec-filter-select" value={estudianteId} onChange={(e) => setEstudianteId(e.target.value)} disabled={!grupoId || isLoadingStudents}>
              <option value="">Todo el grupo</option>
              {estudiantes.map((s) => <option key={s.id} value={String(s.id)}>{s.nombre}</option>)}
            </select>
          )}
          <button className="lk-rec-button lk-rec-button--primary" onClick={handleGenerate} disabled={isGenerating || !grupoId} type="button" style={{ padding: "0.5rem 1rem", background: "#5B2D8E", color: "#fff", border: "none", borderRadius: "0.75rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <RefreshCw size={15} />{isGenerating ? "Creando..." : "Crear recomendación"}
          </button>
        </label>
      </div>

      {/* Lista de cards estilo mockup */}
      {isLoadingRecommendations ? (
        <LoadingState message="Buscando recomendaciones..." />
      ) : recomendaciones.length === 0 ? (
        <div className="lk-rec-empty">
          <Brain size={48} style={{ color: "#C4AEE0", marginBottom: "1rem" }} />
          <strong style={{ display: "block", fontSize: "1rem", fontWeight: 700, color: "#1A1A2E", marginBottom: "0.4rem" }}>No hay recomendaciones generadas por el momento.</strong>
          <p style={{ fontSize: "0.85rem", color: "#6B6B8A" }}>Selecciona un grupo y genera recomendaciones con estadísticas reales.</p>
        </div>
      ) : (
        <div className="lk-rec-list">
          {recomendaciones.map((item, index) => {
            const isYellow = index % 2 === 0;
            const habilidad = item.habilidad || item.skill || item.area || "General";
            const studentName = item.nombre_estudiante || item.estudiante?.nombre || subjectName || "Grupo";
            return (
              <div key={item.id} className={`lk-rec-card ${isYellow ? "lk-rec-card--yellow" : "lk-rec-card--purple"}`}>
                <div className={`lk-rec-card__icon ${isYellow ? "lk-rec-card__icon--yellow" : "lk-rec-card__icon--purple"}`}>
                  {isYellow ? <Sparkles size={22} /> : <Brain size={22} />}
                </div>
                <div className="lk-rec-card__body">
                  <span className="lk-rec-skill-badge">{habilidad}</span>
                  <p className="lk-rec-card__text">{item.contenido || item.recomendacion || item.texto}</p>
                  <span className="lk-rec-card__student">{studentName}</span>
                </div>
                <button type="button" className="lk-rec-btn-detail" onClick={() => handleDeleteRecommendation(item.id)} title="Archivar">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
