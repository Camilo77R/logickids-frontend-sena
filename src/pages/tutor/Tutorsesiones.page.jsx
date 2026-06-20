import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, BarChart3, Calendar, CheckCircle, Clock, History, Layers, Search, X } from "lucide-react";
import RoleModal from "../../components/common/RoleModal";
import SesionesCharts from "../../components/sesiones/SesionesCharts";
import SesionesFilters from "../../components/sesiones/SesionesFilters";
import SesionesTable from "../../components/sesiones/SesionesTable";
import estudianteService from "../../services/estudianteService";
import {
  getEventosSesion,
  getSesionesByEstudiante,
  getSesionesPorGrupo,
} from "../../services/sesiones.service";
import tutorGroupsService from "../../services/tutorGroupsService";

const normalizeId = (value) => String(value ?? "");
const resolveActivityKey = (session) => session?.actividad_clave || `sesion-${session?.id ?? "sin-clave"}`;
const formatPercent = (value) => {
  if (value === null || value === undefined || value === "") return "Sin dato";
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `${numeric.toFixed(1)}%` : "Sin dato";
};
const formatMetric = (value) => {
  if (value === null || value === undefined || value === "") return "Sin dato";
  return Number.isFinite(Number(value)) ? Number(value).toLocaleString("es-CO") : String(value);
};
const ADAPTATION_LABELS = {
  subir: "La dificultad subió",
  bajar: "La dificultad bajó",
  mantener: "La dificultad se mantuvo",
  inicial: "Nivel inicial asignado",
};
const EVENT_LABELS = {
  acierto: "Respuesta correcta",
  error: "Intento por mejorar",
  nivel_completado: "Misión completada",
  pista: "Pista utilizada",
};
const formatReactionTime = (value) => {
  const milliseconds = Number(value);
  if (!Number.isFinite(milliseconds) || milliseconds < 0) return "Sin registro";
  if (milliseconds < 1000) return `${milliseconds} ms`;
  return `${(milliseconds / 1000).toFixed(1).replace(".", ",")} segundos`;
};
const formatEventLabel = (value) =>
  EVENT_LABELS[value] ?? String(value ?? "Evento").replaceAll("_", " ");

export default function SesionesPage() {
  const [tipo, setTipo] = useState("estudiante");
  const [grupos, setGrupos] = useState([]);
  const [grupoId, setGrupoId] = useState("");
  const [estudiantes, setEstudiantes] = useState([]);
  const [estudianteId, setEstudiante] = useState("");
  const [data, setData] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [eventosSesion, setEventosSesion] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEventos, setIsLoadingEventos] = useState(false);
  const [error, setError] = useState("");
  const errorTimer = useRef(null);
  const clearError = useCallback(() => setError(""), []);

  useEffect(() => {
    if (error) {
      clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(clearError, 5000);
    }
    return () => clearTimeout(errorTimer.current);
  }, [error, clearError]);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  /* ── Cargar grupos ── */
  useEffect(() => {
    const cargarGrupos = async () => {
      try {
        const groups = await tutorGroupsService.getGroups();
        const normalized = groups.map((g) => ({ ...g, id: g.id ?? g.id_grupo }));
        setGrupos(normalized);
        if (normalized.length > 0) setGrupoId(normalizeId(normalized[0].id));
      } catch (e) {
        setError(e.message || "No fue posible cargar los grupos.");
      } finally {
        setIsLoading(false);
      }
    };
    cargarGrupos();
  }, []);

  /* ── Cargar estudiantes al cambiar grupo ── */
  useEffect(() => {
    const cargarEstudiantes = async () => {
      if (!grupoId) { setEstudiantes([]); setEstudiante(""); return; }
      try {
        const students = await estudianteService.listEstudiantes(Number(grupoId));
        const normalized = students.map((s) => ({ ...s, id: s.id ?? s.id_estudiante }));
        setEstudiantes(normalized);
        setEstudiante((cur) =>
          cur && normalized.some((s) => normalizeId(s.id) === cur)
            ? cur
            : normalizeId(normalized[0]?.id)
        );
      } catch (e) {
        setError(e.message || "No fue posible cargar los estudiantes del grupo.");
        setEstudiantes([]);
      }
    };
    cargarEstudiantes();
  }, [grupoId]);

  /* ── Cargar sesiones ── */
  useEffect(() => {
    const cargarSesiones = async () => {
      if (!grupoId) { setData([]); setSelectedSession(null); setEventosSesion([]); return; }
      if (tipo === "estudiante" && !estudianteId) { setData([]); setSelectedSession(null); setEventosSesion([]); return; }

      setIsLoading(true);
      setError("");
      try {
        const sesiones =
          tipo === "estudiante"
            ? await getSesionesByEstudiante(Number(estudianteId))
            : await getSesionesPorGrupo(estudiantes);
        setData(sesiones);
        setSelectedSession(null);
        setEventosSesion([]);
      } catch (e) {
        setError(e.message || "No fue posible cargar el historial de sesiones.");
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    cargarSesiones();
  }, [tipo, grupoId, estudianteId, estudiantes]);

  /* ── Seleccionar sesión → cargar eventos ── */
  const handleSelectSession = async (session) => {
    setSelectedSession(session);
    setModalOpen(true);
    setIsLoadingEventos(true);
    try {
      const eventos = await getEventosSesion(session.id);
      setEventosSesion(eventos);
    } catch (e) {
      setError(e.message || "No fue posible cargar el detalle de la sesión.");
      setEventosSesion([]);
    } finally {
      setIsLoadingEventos(false);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedSession(null);
    setEventosSesion([]);
  };

  /* ── Totales ── */
  const summary = useMemo(
    () => {
      const activityKeys = new Set();

      const totals = data.reduce(
        (acc, s) => {
          acc.sesiones += 1;
          acc.puntaje  += Number(s.puntaje  || 0);
          acc.aciertos += Number(s.aciertos || 0);
          acc.errores  += Number(s.errores  || 0);
          activityKeys.add(resolveActivityKey(s));
          return acc;
        },
        { sesiones: 0, puntaje: 0, aciertos: 0, errores: 0 }
      );

      return {
        ...totals,
        actividades: activityKeys.size,
      };
    },
    [data]
  );

  /* ── Filtrado local ── */
  const filteredData = useMemo(() => {
    return data.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        (s.actividad_titulo || "").toLowerCase().includes(q) ||
        (s.minijuego || "").toLowerCase().includes(q) ||
        (s.actividad_detalle || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "todas" ||
        (statusFilter === "completado" && s.estado === "completado") ||
        (statusFilter === "abandonado" && s.estado === "abandonado");

      let matchesDate = true;
      if (s.iniciada_en) {
        const fecha = new Date(s.iniciada_en).toISOString().slice(0, 10);
        if (dateFrom && fecha < dateFrom) matchesDate = false;
        if (dateTo && fecha > dateTo) matchesDate = false;
      } else {
        if (dateFrom || dateTo) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [data, searchQuery, statusFilter, dateFrom, dateTo]);

  const selectedActivityProgress = useMemo(() => {
    if (!selectedSession) return [];

    return data
      .filter((session) => resolveActivityKey(session) === resolveActivityKey(selectedSession))
      .sort((left, right) => Number(left.orden_en_ruta ?? 0) - Number(right.orden_en_ruta ?? 0))
      .map((session) => `Nivel ${session.dificultad}`);
  }, [data, selectedSession]);

  /* ─────────────── RENDER ─────────────── */
  return (
    <div className="tutor-page-container">

      {/* Header */}
      <div className="tutor-page-header">
        <div>
          <h1 className="tutor-page-title">
            <History size={26} />
            Sesiones
          </h1>
          <p className="tutor-page-subtitle">
            Revisa el historial real de partidas por estudiante o consolídalo por grupo.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="tutor-alert tutor-alert--error">
          <span>{error}</span>
          <button type="button" className="tutor-alert__close" onClick={clearError} aria-label="Cerrar"><X size={16} /></button>
        </div>
      )}

      {/* Sección de métricas desplegable */}
      {data.length > 0 && (
        <details className="ses-metrics-section">
          <summary>
            <BarChart3 size={18} />
            <span>Métricas de sesiones</span>
          </summary>
          <div className="ses-stats-grid">
            <div className="ses-stat-card ses-stat-card--orange">
              <div className="ses-stat-info">
                <span className="ses-stat-label">Actividades detectadas</span>
                <span className="ses-stat-value">{summary.actividades}</span>
              </div>
              <span className="ses-stat-icon"><Clock size={50} /></span>
            </div>

            <div className="ses-stat-card ses-stat-card--purple">
              <div className="ses-stat-info">
                <span className="ses-stat-label">Misiones jugadas</span>
                <span className="ses-stat-value">{summary.sesiones}</span>
              </div>
              <span className="ses-stat-icon"><Layers size={50} /></span>
            </div>

            <div className="ses-stat-card ses-stat-card--green">
              <div className="ses-stat-info">
                <span className="ses-stat-label">Aciertos</span>
                <span className="ses-stat-value">{summary.aciertos}</span>
              </div>
              <span className="ses-stat-icon"><CheckCircle size={50} /></span>
            </div>

            <div className="ses-stat-card ses-stat-card--red">
              <div className="ses-stat-info">
                <span className="ses-stat-label">Errores</span>
                <span className="ses-stat-value">{summary.errores}</span>
              </div>
              <span className="ses-stat-icon"><AlertCircle size={50} /></span>
            </div>
          </div>

          <div className="ses-charts-card">
            <SesionesCharts data={data} />
          </div>
        </details>
      )}

      {/* Filtros + Toolbar */}
      <div className="tutor-card ses-filters-card">
        <div className="ses-filters-row">
          <SesionesFilters
            tipo={tipo}
            setTipo={setTipo}
            grupos={grupos}
            grupoId={grupoId}
            setGrupoId={setGrupoId}
            estudiantes={estudiantes}
            estudianteId={estudianteId}
            setEstudiante={setEstudiante}
          />
        </div>

        {data.length > 0 && (
          <div className="ses-toolbar">
            <div className="ses-search">
              <Search size={15} className="ses-search__icon" />
              <input
                className="ses-search__input"
                type="text"
                placeholder="Buscar actividad, minijuego..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="ses-search__clear" onClick={() => setSearchQuery("")}>
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="ses-filters">
              {["todas", "completado", "abandonado"].map((f) => (
                <button
                  key={f}
                  className={`ses-filter-pill${statusFilter === f ? " is-active" : ""}`}
                  onClick={() => setStatusFilter(f)}
                >
                  {f === "todas" ? "Todas" : f === "completado" ? "Completadas" : "Abandonadas"}
                </button>
              ))}
            </div>
            <div className="ses-date-filter">
              <Calendar size={14} className="ses-date-icon" />
              <input
                type="date"
                className="ses-date-input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                title="Fecha desde"
              />
              <span className="ses-date-sep">—</span>
              <input
                type="date"
                className="ses-date-input"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                title="Fecha hasta"
              />
              {(dateFrom || dateTo) && (
                <button className="ses-date-clear" onClick={() => { setDateFrom(""); setDateTo(""); }}>
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Estado: cargando */}
      {isLoading ? (
        <div className="tutor-loading">
          <span>Cargando sesiones...</span>
        </div>
      ) : !data.length ? (
        /* Estado: sin datos */
        <div className="tutor-card tutor-empty">
          <History size={44} />
          <p>No hay sesiones registradas para el filtro actual.</p>
        </div>
      ) : (
        <>
          {/* Tabla */}
            <div className="tutor-card">
              <div className="ses-section-title">
                <History size={16} />
                Historial de misiones
              </div>

              <p className="ses-history-note">
                Cada fila muestra una misión jugada y la dificultad aplicada al estudiante.
              </p>

              <SesionesTable
                data={filteredData}
                onSelectSession={handleSelectSession}
                selectedSessionId={selectedSession?.id}
                showStudentColumn={tipo === "grupo"}
              />
            </div>

          {/* Modal de detalle de eventos */}
          <RoleModal
            open={modalOpen}
            onClose={closeModal}
            eyebrow="Detalle de la misión"
            title={selectedSession?.actividad_titulo || "Misión"}
            width={560}
            actions={
              <button type="button" className="ses-modal-close-btn" onClick={closeModal}>
                Cerrar
              </button>
            }
          >
            {selectedSession && (
              <div className="ses-eventos-list">
                <div className="ses-activity-summary">
                  <div className="ses-cell-primary">
                    {selectedSession.actividad_titulo || "Actividad seleccionada"}
                  </div>
                  <div className="ses-cell-secondary">
                    {selectedSession.actividad_detalle || "Sin detalle de actividad"}
                  </div>
                </div>
                <div className="ses-adaptation-summary">
                  <div className="ses-adaptation-head">
                    <span className={`ses-adapt-badge ses-adapt-badge--${selectedSession.ajuste_fuente || "base"}`}>
                      {selectedSession.ajuste_titulo || "Dificultad definida"}
                    </span>
                    <strong>Dificultad de esta misión: Nivel {selectedSession.dificultad}</strong>
                  </div>
                  <div className={`ses-adaptation-decision ses-adaptation-decision--${selectedSession.ajuste_decision || "mantener"}`}>
                    {ADAPTATION_LABELS[selectedSession.ajuste_decision] || ADAPTATION_LABELS.mantener}
                  </div>
                  <p>{selectedSession.ajuste_motivo}</p>
                  {selectedActivityProgress.length > 1 ? (
                    <div className="ses-adaptation-progress">
                      <span>Evolución de la actividad</span>
                      <strong>{selectedActivityProgress.join(" → ")}</strong>
                    </div>
                  ) : null}
                  <details className="ses-adaptation-details">
                    <summary>Ver detalles del progreso</summary>
                    <div className="ses-adaptation-metrics">
                      <span>Nivel anterior: {formatMetric(selectedSession.dificultad_anterior)}</span>
                      <span>Nivel máximo: {formatMetric(selectedSession.dificultad_maxima)}</span>
                      {selectedSession.ajuste_alcance === "actividad" ? (
                        <>
                          <span>Aciertos en la misión anterior: {formatMetric(selectedSession.aciertos_mision_anterior)}</span>
                          <span>Intentos por mejorar: {formatMetric(selectedSession.errores_mision_anterior)}</span>
                        </>
                      ) : (
                        <>
                          <span>Precisión histórica: {formatPercent(selectedSession.precision_historica)}</span>
                          <span>Precisión reciente: {formatPercent(selectedSession.precision_reciente)}</span>
                          <span>Intentos acumulados: {formatMetric(selectedSession.intentos_acumulados)}</span>
                        </>
                      )}
                    </div>
                  </details>
                </div>
                {isLoadingEventos ? (
                  <div className="tutor-loading">
                    <span>Cargando eventos...</span>
                  </div>
                ) : !eventosSesion.length ? (
                  <p className="ses-detalle-empty">
                    Esta misión no tiene intentos registrados.
                  </p>
                ) : (
                  eventosSesion.map((evento) => (
                    <div key={evento.id} className="ses-evento-item">
                      <div className="ses-evento-header">
                        <strong>{formatEventLabel(evento.tipo_evento)}</strong>
                        <small>
                          {new Date(evento.ocurrido_en).toLocaleTimeString("es-CO")}
                        </small>
                      </div>
                      <div className="ses-evento-meta">
                        <span>Habilidad: {evento.habilidad || "No aplica"}</span>
                        <span>Tiempo de respuesta: {formatReactionTime(evento.tiempo_reaccion_ms)}</span>
                        <span>
                          Puntos: {evento.puntos ?? 0}
                          {Number(evento.combo_en_evento) > 0
                            ? ` · Racha: ${evento.combo_en_evento}`
                            : ""}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </RoleModal>

        </>
      )}
    </div>
  );
}
