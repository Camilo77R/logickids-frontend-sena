/**
 * TutorRecomendacionesPage
 *
 * Mantiene la línea visual reciente del frontend y agrega el flujo
 * complementario por archivo de datos para el tutor.
 */
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
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
import "../../styles/tutor-recommendations.css";

const SEVERIDAD_CLASS = {
  alta: "trp-badge--alta",
  media: "trp-badge--media",
  baja: "trp-badge--baja",
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
  const [recomendacionesCsv, setRecomendacionesCsv] = useState([]);
  const [csvError, setCsvError] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isGeneratingCsv, setIsGeneratingCsv] = useState(false);

  const hookEstudiante = useRecomendacionesEstudiante(
    modo === "estudiante" ? estudianteSeleccionado : null
  );
  const hookGrupo = useRecomendacionesGrupo(modo === "grupo" ? grupoSeleccionado : null);
  const hook = modo === "estudiante" ? hookEstudiante : hookGrupo;

  const selectedCsvGroup = useMemo(
    () => csvGrupos.find((item) => String(item.id) === String(selectedCsvGrupoId)) ?? null,
    [csvGrupos, selectedCsvGrupoId]
  );

  const csvStudents = useMemo(() => {
    if (!selectedCsvGrupoId) return [];
    return selectedCsvGroup?.estudiantes ?? [];
  }, [selectedCsvGroup, selectedCsvGrupoId]);

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

  const handleGenerateCsv = async () => {
    setIsGeneratingCsv(true);
    setCsvError(null);

    try {
      const result = await recomendacionesService.generarDesdeCsvIA({
        grupoId: selectedCsvGrupoId,
        estudianteId: selectedCsvEstudianteId,
      });
      setRecomendacionesCsv(result.recomendaciones ?? []);
    } catch (error) {
      setRecomendacionesCsv([]);
      setCsvError(error.message || "No fue posible ejecutar el análisis complementario.");
    } finally {
      setIsGeneratingCsv(false);
    }
  };

  if (isBootstrapping) {
    return <LoadingState message="Cargando recomendaciones del tutor..." />;
  }

  return (
    <div className="trp-page">
      <div className="trp-page__header">
        <div className="trp-page__header-icon">
          <Users size={28} color="#7c3aed" />
        </div>
        <div>
          <h1 className="trp-page__title">Recomendaciones</h1>
          <p className="trp-page__subtitle">
            Sugerencias pedagógicas basadas en el rendimiento individual, grupal y los registros
            disponibles.
          </p>
        </div>
      </div>

      <section className="trp-section">
        <div className="trp-controls">
          <div className="trp-mode-toggle">
            <button
              className={`trp-mode-btn${modo === "estudiante" ? " is-active" : ""}`}
              onClick={() => setModo("estudiante")}
              type="button"
            >
              <User size={16} /> Por estudiante
            </button>
            <button
              className={`trp-mode-btn${modo === "grupo" ? " is-active" : ""}`}
              onClick={() => setModo("grupo")}
              type="button"
            >
              <Users size={16} /> Por grupo
            </button>
          </div>

          <select
            className="trp-select"
            value={grupoSeleccionado ?? ""}
            onChange={(event) => setGrupoSeleccionado(Number(event.target.value))}
          >
            <option value="">-- Selecciona un grupo --</option>
            {grupos.map((group) => (
              <option key={group.id_grupo ?? group.id} value={group.id_grupo ?? group.id}>
                {group.nombre}
              </option>
            ))}
          </select>

          {modo === "estudiante" ? (
            <select
              className="trp-select"
              value={estudianteSeleccionado ?? ""}
              onChange={(event) => setEstudianteSeleccionado(Number(event.target.value))}
              disabled={!grupoSeleccionado || isLoadingStudents}
            >
              <option value="">-- Selecciona un estudiante --</option>
              {estudiantes.map((student) => (
                <option key={student.id_estudiante ?? student.id} value={student.id_estudiante ?? student.id}>
                  {student.nombre}
                </option>
              ))}
            </select>
          ) : null}

          <button
            className="trp-action-btn"
            onClick={hook.generar}
            disabled={hook.generando || !canGenerate}
            type="button"
          >
            <RefreshCw
              size={16}
              className={hook.generando ? "trp-spin" : ""}
            />
            {hook.generando ? "Generando..." : "Generar recomendación"}
          </button>
        </div>

        {hook.error ? <div className="trp-alert">{hook.error}</div> : null}
        {hook.loading ? (
          <LoadingState message="Cargando recomendaciones..." />
        ) : (
          <div className="trp-list">
            {hook.recomendaciones.length === 0 ? (
              <EmptyState
                title="Sin recomendaciones activas"
                description="Genera una recomendación para comenzar el seguimiento."
              />
            ) : (
              hook.recomendaciones.map((recommendation) => (
                <RecomendacionCard
                  key={recommendation.id}
                  recomendacion={recommendation}
                  onArchivar={() => hook.archivar(recommendation.id)}
                />
              ))
            )}
          </div>
        )}
      </section>

      <section className="trp-section">
        <div className="trp-section__header">
          <div className="trp-section__title">
            <FileSpreadsheet size={20} />
            <strong>Análisis complementario</strong>
          </div>
          <p className="trp-section__subtitle">
            Genera sugerencias adicionales a partir del archivo de datos filtrando por grupo o por
            estudiante.
          </p>
        </div>

        <div className="trp-controls">
          <select
            className="trp-select"
            value={selectedCsvGrupoId}
            onChange={(event) => setSelectedCsvGrupoId(event.target.value)}
          >
            <option value="">-- Selecciona un grupo del archivo --</option>
            {csvGrupos.map((group) => (
              <option key={group.id} value={String(group.id)}>
                {group.nombre}
              </option>
            ))}
          </select>

          <select
            className="trp-select"
            value={selectedCsvEstudianteId}
            onChange={(event) => setSelectedCsvEstudianteId(event.target.value)}
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
            className="trp-action-btn trp-action-btn--gold"
            onClick={handleGenerateCsv}
            disabled={isGeneratingCsv || !selectedCsvGrupoId}
            type="button"
          >
            <FileSpreadsheet size={16} />
            {isGeneratingCsv ? "Procesando..." : "Generar análisis"}
          </button>
        </div>

        {csvError ? <div className="trp-alert">{csvError}</div> : null}

        {isGeneratingCsv ? (
          <LoadingState message="Procesando archivo de datos..." />
        ) : recomendacionesCsv.length === 0 ? (
          <EmptyState
            title="Sin resultados complementarios"
            description="Selecciona un grupo y genera sugerencias adicionales."
          />
        ) : (
          <div className="trp-list">
            {recomendacionesCsv.map((item, index) => (
              <CsvRecommendationCard
                key={`${item.estudiante_id}-${item.habilidad_critica}-${index}`}
                item={item}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function RecomendacionCard({ recomendacion, onArchivar }) {
  const severityClass = SEVERIDAD_CLASS[recomendacion.severidad] ?? "trp-badge--neutral";

  return (
    <div className="trp-card">
      <div className="trp-card__header">
        <div className="trp-card__badges">
          <span className={`trp-badge ${severityClass}`}>
            {recomendacion.severidad?.toUpperCase()}
          </span>
          <span className="trp-card__skill">{recomendacion.habilidad}</span>
        </div>
        <div className="trp-card__meta">
          <span className="trp-card__date">{formatDate(recomendacion.generado_en)}</span>
          <button
            className="trp-archive-btn"
            onClick={onArchivar}
            title="Archivar recomendación"
            type="button"
          >
            <Archive size={16} />
          </button>
        </div>
      </div>
      <p className="trp-card__message">{recomendacion.mensaje}</p>
    </div>
  );
}

function CsvRecommendationCard({ item }) {
  const severityClass = SEVERIDAD_CLASS[item.severidad] ?? "trp-badge--neutral";

  return (
    <div className="trp-card">
      <div className="trp-card__header">
        <div className="trp-card__badges trp-card__badges--wrap">
          <span className={`trp-badge ${severityClass}`}>
            {(item.severidad ?? "media").toUpperCase()}
          </span>
          <span className="trp-card__skill">{item.nombre ?? "Estudiante sin nombre"}</span>
        </div>
        <div className="trp-card__meta">
          <span className="trp-card__date">{formatDate(item.fecha_generacion)}</span>
        </div>
      </div>

      <div className="trp-card__stats">
        <p className="trp-card__meta-line">
          Habilidad crítica: <strong>{item.habilidad_critica ?? "No definida"}</strong>
        </p>
        <p className="trp-card__meta-line">
          Precisión actual: <strong>{formatPercent(item.precision_actual)}</strong>
        </p>
        <p className="trp-card__meta-line">
          Prioridad: <strong>{item.prioridad ?? "N/D"}</strong>
        </p>
      </div>

      <p className="trp-card__message">{item.recomendacion ?? "Sin recomendación generada."}</p>
    </div>
  );
}
