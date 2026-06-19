import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle, Clock, Layers, Loader2 } from "lucide-react";
import RoleModal from "../common/RoleModal";
import SesionesCharts from "../sesiones/SesionesCharts";
import estudianteService from "../../services/estudianteService";
import { getSesionesPorGrupo } from "../../services/sesiones.service";
import tutorGroupsService from "../../services/tutorGroupsService";

const resolveActivityKey = (s) => s?.actividad_clave || `sesion-${s?.id ?? "x"}`;

export default function SesionesMetricsModal({ show, onClose, data: externalData }) {
  const [internalData, setInternalData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show || externalData) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const groups = await tutorGroupsService.getGroups();
        const normalized = groups.map((g) => ({ ...g, id: g.id ?? g.id_grupo }));
        const allStudents = await Promise.all(
          normalized.map((g) => estudianteService.listEstudiantes(Number(g.id)).catch(() => []))
        );
        const students = allStudents.flat().map((s) => ({
          ...s,
          id: s.id ?? s.id_estudiante ?? s.estudiante_id,
          grupo_id: s.grupo_id ?? s.id_grupo,
        }));
        const sesiones = await getSesionesPorGrupo(students);
        if (!cancelled) setInternalData(sesiones);
      } catch {
        if (!cancelled) setInternalData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [show, externalData]);

  const data = externalData ?? internalData;

  const summary = useMemo(() => {
    const activityKeys = new Set();
    const totals = data.reduce(
      (acc, s) => {
        acc.sesiones += 1;
        acc.aciertos += Number(s.aciertos || 0);
        acc.errores += Number(s.errores || 0);
        activityKeys.add(resolveActivityKey(s));
        return acc;
      },
      { sesiones: 0, aciertos: 0, errores: 0 }
    );
    return { ...totals, actividades: activityKeys.size };
  }, [data]);

  return (
    <RoleModal
      open={show}
      onClose={onClose}
      eyebrow="Resumen"
      title="Métricas de sesiones"
      width={960}
      actions={
        <button type="button" className="ses-modal-close-btn" onClick={onClose}>
          Cerrar
        </button>
      }
    >
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={28} className="spin" />
        </div>
      ) : data.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--lk-text-muted)" }}>
          <p>No hay sesiones registradas para mostrar métricas.</p>
        </div>
      ) : (
        <>
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
                <span className="ses-stat-label">Sesiones / niveles</span>
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
        </>
      )}
    </RoleModal>
  );
}
