import { useEffect, useMemo, useState } from "react";
import { History, MousePointerClick, Search, X } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");

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
      const matchesStatus = statusFilter === "todas" || s.estado === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, searchQuery, statusFilter]);

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
      {error && <div className="tutor-alert tutor-alert--error">{error}</div>}

      {/* Filtros */}
      <div className="tutor-card ses-filters-card">
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

      {/* Stat Cards */}
      <div className="ses-stats-grid">
        <div className="ses-stat-card ses-stat-card--orange">
          <div className="ses-stat-info">
            <span className="ses-stat-label">Actividades detectadas</span>
            <span className="ses-stat-value">{summary.actividades}</span>
          </div>
          <span className="ses-stat-icon">⏱️</span>
        </div>

        <div className="ses-stat-card ses-stat-card--purple">
          <div className="ses-stat-info">
            <span className="ses-stat-label">Sesiones / niveles</span>
            <span className="ses-stat-value">{summary.sesiones}</span>
          </div>
          <span className="ses-stat-icon">🏆</span>
        </div>

        <div className="ses-stat-card ses-stat-card--green">
          <div className="ses-stat-info">
            <span className="ses-stat-label">Aciertos</span>
            <span className="ses-stat-value">{summary.aciertos}</span>
          </div>
          <span className="ses-stat-icon">⚡</span>
        </div>

        <div className="ses-stat-card ses-stat-card--red">
          <div className="ses-stat-info">
            <span className="ses-stat-label">Errores</span>
            <span className="ses-stat-value">{summary.errores}</span>
          </div>
          <span className="ses-stat-icon">⚠️</span>
        </div>
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
          {/* Charts */}
          <div className="tutor-card ses-charts-card">
            <SesionesCharts data={data} />
          </div>

          {/* Tabla + Detalle */}
          <div className="ses-bottom-grid">

            {/* Historial */}
            <div className="tutor-card">
              <div className="ses-section-title">
                <History size={16} />
                Historial de sesiones
              </div>

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
                  {["todas", "completado", "en_progreso"].map((f) => (
                    <button
                      key={f}
                      className={`ses-filter-pill${statusFilter === f ? " is-active" : ""}`}
                      onClick={() => setStatusFilter(f)}
                    >
                      {f === "todas" ? "Todas" : f === "completado" ? "Completadas" : "En progreso"}
                    </button>
                  ))}
                </div>
              </div>

              <SesionesTable
                data={filteredData}
                onSelectSession={handleSelectSession}
                selectedSessionId={selectedSession?.id}
                showStudentColumn={tipo === "grupo"}
              />
            </div>

            {/* Detalle de eventos */}
            <div className="tutor-card ses-detalle-card">
              <div className="ses-section-title">
                <MousePointerClick size={16} />
                Detalle de eventos
              </div>

              {!selectedSession ? (
                <p className="ses-detalle-empty">
                  Selecciona una sesión de la tabla para ver sus eventos.
                </p>
              ) : isLoadingEventos ? (
                <div className="tutor-loading">
                  <span>Cargando eventos...</span>
                </div>
              ) : !eventosSesion.length ? (
                <p className="ses-detalle-empty">
                  Esta sesión no tiene eventos registrados.
                </p>
              ) : (
                <div className="ses-eventos-list">
                  <div className="ses-activity-summary">
                    <div className="ses-cell-primary">
                      {selectedSession.actividad_titulo || "Actividad seleccionada"}
                    </div>
                    <div className="ses-cell-secondary">
                      {selectedSession.actividad_detalle || "Sin detalle de actividad"}
                    </div>
                  </div>
                  {eventosSesion.map((evento) => (
                    <div key={evento.id} className="ses-evento-item">
                      <div className="ses-evento-header">
                        <strong>{evento.tipo_evento}</strong>
                        <small>
                          {new Date(evento.ocurrido_en).toLocaleTimeString("es-CO")}
                        </small>
                      </div>
                      <div className="ses-evento-meta">
                        <span>Habilidad: {evento.habilidad || "No aplica"}</span>
                        <span>Reacción: {evento.tiempo_reaccion_ms ?? "—"} ms</span>
                        <span>
                          Puntos: {evento.puntos ?? 0} · Combo: {evento.combo_en_evento ?? 0}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
}
