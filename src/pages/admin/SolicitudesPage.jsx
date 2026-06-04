import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CheckCircle,
  Eye,
  Mail,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
  XCircle,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import EmptyState from "../../components/common/EmptyState";
import RoleModal from "../../components/common/RoleModal";
import StatusBadge from "../../components/common/StatusBadge";
import DashboardMetricCard from "../../components/dashboard/DashboardMetricCard";
import DashboardPanel from "../../components/dashboard/DashboardPanel";
import adminService from "../../services/adminService";
import "../../styles/role-dashboard.css";

const STATUS_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobado", label: "Aprobados" },
  { value: "rechazado", label: "Rechazados" },
];

function buildRequestsSummary(requests) {
  return {
    total: requests.length,
    pending: requests.filter((r) => r.estado_solicitud === "pendiente").length,
    approved: requests.filter((r) => r.estado_solicitud === "aprobado").length,
    rejected: requests.filter((r) => r.estado_solicitud === "rechazado").length,
  };
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rechazoMotivo, setRechazoMotivo] = useState("");
  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadSolicitudes = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.listReactivationRequests();
      setSolicitudes(data);
      setError("");
    } catch (err) {
      setError(err.message || "No fue posible cargar las solicitudes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSolicitudes();
  }, []);

  const filteredSolicitudes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return solicitudes.filter((req) => {
      const matchesFilter = statusFilter === "todos" || req.estado_solicitud === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        req.tutor_nombre?.toLowerCase().includes(normalizedSearch) ||
        req.correo_contacto?.toLowerCase().includes(normalizedSearch) ||
        req.tutor_email?.toLowerCase().includes(normalizedSearch);
      return matchesFilter && matchesSearch;
    });
  }, [searchTerm, solicitudes, statusFilter]);

  const summary = useMemo(() => buildRequestsSummary(solicitudes), [solicitudes]);

  const handleAprobar = async (requestId) => {
    try {
      await adminService.approveReactivationRequest(requestId);
      setFeedback({ type: "success", message: "Solicitud aprobada correctamente." });
      setSelectedRequest(null);
      await loadSolicitudes();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const openRechazoModal = (request) => {
    setSelectedRequest(request);
    setRechazoMotivo("");
    setShowRechazoModal(true);
  };

  const handleRechazar = async () => {
    if (!rechazoMotivo.trim() || !selectedRequest) {
      setFeedback({ type: "error", message: "Debes escribir un motivo antes de rechazar." });
      return;
    }
    try {
      await adminService.rejectReactivationRequest(selectedRequest.id, rechazoMotivo.trim());
      setFeedback({ type: "success", message: "Solicitud rechazada correctamente." });
      setShowRechazoModal(false);
      setSelectedRequest(null);
      await loadSolicitudes();
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  const handleViewDetail = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const toolbar = (
    <div className="lk-role-page__toolbar lk-role-page__toolbar--solicitudes">
      <div className="lk-role-page__filters">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`lk-role-page__filter ${statusFilter === filter.value ? "is-active" : ""}`}
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="lk-role-page__search">
        <Search size={18} className="lk-search-icon" />
        <input
          type="search"
          className="lk-search-input"
          placeholder="Buscar por tutor o correo"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="lk-search-clear" onClick={() => setSearchTerm("")}>
            <X size={16} />
          </button>
        )}
      </div>

      <div className="lk-role-page__actions">
        <button className="lk-btn lk-btn--icon" onClick={loadSolicitudes} title="Recargar">
          <RefreshCw size={16} />
        </button>
        <button className="lk-btn lk-btn--icon" onClick={() => setShowMetricsModal(true)} title="Ver estadísticas">
          <BarChart3 size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <AppShell
      title="Solicitudes"
      description="Aquí el admin resuelve reactivaciones de tutores suspendidos."
    >
      <div className="lk-role-dashboard">
        {toolbar}

        {feedback.message && (
          <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div>
        )}

        {error && <div className="lk-alert lk-alert--error">{error}</div>}

        <DashboardPanel
          eyebrow="Bandeja institucional"
          title="Solicitudes visibles"
          subtitle="Revisa, aprueba o rechaza peticiones de tutores suspendidos."
          aside={<Mail size={18} color="var(--lk-purple)" />}
        >
          {!isLoading && filteredSolicitudes.length === 0 ? (
            <EmptyState
              title="No hay solicitudes"
              description={searchTerm ? "Prueba con otro término." : "La bandeja está vacía."}
            />
          ) : (
            <>
              <div className="lk-table-wrap">
                <table className="lk-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tutor</th>
                      <th>Contacto</th>
                      <th>Motivo</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSolicitudes.map((solicitud) => (
                      <tr key={solicitud.id}>
                        <td>{formatDate(solicitud.fecha_solicitud)}</td>
                        <td>
                          <strong>{solicitud.tutor_nombre}</strong>
                          <p className="lk-muted">{solicitud.tutor_email}</p>
                        </td>
                        <td>{solicitud.correo_contacto}</td>
                        <td>{solicitud.motivo}</td>
                        <td>
                          <StatusBadge label={solicitud.estado_solicitud} variant={solicitud.estado_solicitud} />
                        </td>
                        <td>
                          <button className="lk-btn lk-btn--secondary" onClick={() => handleViewDetail(solicitud)}>
                            <Eye size={16} /> Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="lk-role-table-footer">
                Mostrando {filteredSolicitudes.length} de {solicitudes.length} solicitud(es).
              </div>
            </>
          )}
        </DashboardPanel>

        {/* Modal de métricas */}
        <RoleModal
          open={showMetricsModal}
          onClose={() => setShowMetricsModal(false)}
          eyebrow="Estadísticas"
          title="Resumen de Solicitudes"
          width={900}
          actions={
            <button className="lk-btn lk-btn--primary" onClick={() => setShowMetricsModal(false)}>
              Cerrar
            </button>
          }
        >
          <div className="lk-role-dashboard__metrics">
            <DashboardMetricCard icon={Mail} label="Solicitudes" value={summary.total} description="Total de reactivaciones" tone="purple" />
            <DashboardMetricCard icon={AlertCircle} label="Pendientes" value={summary.pending} description="Casos por decidir" tone="orange" />
            <DashboardMetricCard icon={CheckCircle} label="Aprobadas" value={summary.approved} description="Tutores reactivados" tone="gold" />
            <DashboardMetricCard icon={XCircle} label="Rechazadas" value={summary.rejected} description="Respuestas negativas" tone="rose" />
          </div>
        </RoleModal>

        {/* Modal de detalle */}
        <RoleModal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          eyebrow="Detalle"
          title={selectedRequest?.tutor_nombre || "Solicitud"}
          width={540}
          actions={
            <div className="lk-modal-actions">
              <button className="lk-btn lk-btn--secondary" onClick={() => setShowDetailModal(false)}>
                Cerrar
              </button>
              {selectedRequest?.estado_solicitud === "pendiente" && (
                <>
                  <button className="lk-btn lk-btn--primary" onClick={() => {
                    handleAprobar(selectedRequest.id);
                    setShowDetailModal(false);
                  }}>
                    <CheckCircle size={16} /> Aprobar
                  </button>
                  <button className="lk-btn lk-btn--ghost-danger" onClick={() => {
                    openRechazoModal(selectedRequest);
                    setShowDetailModal(false);
                  }}>
                    <XCircle size={16} /> Rechazar
                  </button>
                </>
              )}
            </div>
          }
        >
          {selectedRequest && (
            <div className="lk-admin-detail-content">
              <div className="lk-detail-field">
                <label>Tutor</label>
                <p><strong>{selectedRequest.tutor_nombre}</strong></p>
                <p className="lk-muted">{selectedRequest.tutor_email}</p>
              </div>
              <div className="lk-detail-field">
                <label>Contacto</label>
                <p>{selectedRequest.correo_contacto}</p>
              </div>
              <div className="lk-detail-field">
                <label>Estado</label>
                <StatusBadge label={selectedRequest.estado_solicitud} variant={selectedRequest.estado_solicitud} />
              </div>
              <div className="lk-detail-field">
                <label>Fecha</label>
                <p>{formatDate(selectedRequest.fecha_solicitud)}</p>
              </div>
              <div className="lk-detail-field">
                <label>Motivo</label>
                <p>{selectedRequest.motivo}</p>
              </div>
              {selectedRequest.descripcion && (
                <div className="lk-detail-field">
                  <label>Descripción</label>
                  <p>{selectedRequest.descripcion}</p>
                </div>
              )}
              {selectedRequest.respuesta_admin && (
                <div className="lk-detail-field">
                  <label>Respuesta</label>
                  <p>{selectedRequest.respuesta_admin}</p>
                </div>
              )}
            </div>
          )}
        </RoleModal>

        {/* Modal de rechazo */}
        <RoleModal
          open={showRechazoModal}
          onClose={() => setShowRechazoModal(false)}
          eyebrow="Rechazar"
          title="Motivo del rechazo"
          warning="Esta acción enviará al tutor el motivo."
          actions={
            <>
              <button className="lk-btn lk-btn--secondary" onClick={() => setShowRechazoModal(false)}>Cancelar</button>
              <button className="lk-btn lk-btn--ghost-danger" onClick={handleRechazar}>Rechazar</button>
            </>
          }
        >
          <textarea
            className="lk-role-textarea"
            value={rechazoMotivo}
            onChange={(e) => setRechazoMotivo(e.target.value)}
            placeholder="Ejemplo: la solicitud no cumple las condiciones..."
            rows={4}
          />
        </RoleModal>
      </div>
    </AppShell>
  );
}