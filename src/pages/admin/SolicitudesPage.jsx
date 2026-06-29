import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
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
import Pagination from "../../components/common/Pagination";
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

const PAGE_SIZE = 10;

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
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rechazoMotivo, setRechazoMotivo] = useState("");
  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    return solicitudes.filter((req) => {
      const requestDate = req.fecha_solicitud ? new Date(req.fecha_solicitud) : null;
      const matchesFilter = statusFilter === "todos" || req.estado_solicitud === statusFilter;
      const matchesDate =
        (!fromDate || (requestDate && requestDate >= fromDate)) &&
        (!toDate || (requestDate && requestDate <= toDate));
      const matchesSearch =
        !normalizedSearch ||
        req.tutor_nombre?.toLowerCase().includes(normalizedSearch) ||
        req.correo_contacto?.toLowerCase().includes(normalizedSearch) ||
        req.tutor_email?.toLowerCase().includes(normalizedSearch);
      return matchesFilter && matchesDate && matchesSearch;
    });
  }, [dateFrom, dateTo, searchTerm, solicitudes, statusFilter]);

  const summary = useMemo(() => buildRequestsSummary(solicitudes), [solicitudes]);
  const paginatedSolicitudes = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredSolicitudes.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredSolicitudes]);

  useEffect(() => {
    setCurrentPage(1);
  }, [dateFrom, dateTo, searchTerm, statusFilter]);

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

      <div className="lk-role-page__date-filter" aria-label="Filtrar solicitudes por fecha">
        <CalendarDays size={16} aria-hidden="true" />
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          title="Desde"
        />
        <span>hasta</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          title="Hasta"
        />
        {(dateFrom || dateTo) && (
          <button
            type="button"
            className="lk-date-clear"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
            title="Limpiar fechas"
          >
            <X size={14} />
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
      toolbar={toolbar}
    >
      <div className="lk-role-dashboard lk-role-dashboard--fill lk-admin-dashboard">

        {feedback.message && (
          <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div>
        )}

        {error && <div className="lk-alert lk-alert--error">{error}</div>}

        <DashboardPanel
          title="Solicitudes"
          aside={<Mail size={18} color="var(--lk-purple)" />}
          compact
        >
          {!isLoading && filteredSolicitudes.length === 0 ? (
            <EmptyState
              title="No hay solicitudes"
              description={searchTerm || dateFrom || dateTo ? "Prueba con otros filtros." : "La bandeja está vacía."}
            />
          ) : (
            <>
              <div className="lk-table-wrap lk-role-table--desktop">
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
                    {paginatedSolicitudes.map((solicitud) => (
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

              <div className="lk-role-mobile-list">
                {paginatedSolicitudes.map((solicitud) => (
                  <article key={solicitud.id} className="lk-role-mobile-card">
                    <header className="lk-role-mobile-card__header">
                      <div>
                        <h3 className="lk-role-mobile-card__title">{solicitud.tutor_nombre}</h3>
                        <p className="lk-role-mobile-card__subtitle">{solicitud.tutor_email}</p>
                      </div>
                      <StatusBadge label={solicitud.estado_solicitud} variant={solicitud.estado_solicitud} />
                    </header>
                    <dl className="lk-role-entity-card__meta">
                      <div>
                        <dt>Fecha</dt>
                        <dd>{formatDate(solicitud.fecha_solicitud)}</dd>
                      </div>
                      <div>
                        <dt>Contacto</dt>
                        <dd>{solicitud.correo_contacto}</dd>
                      </div>
                      <div>
                        <dt>Motivo</dt>
                        <dd>{solicitud.motivo}</dd>
                      </div>
                    </dl>
                    <button
                      type="button"
                      className="lk-btn lk-btn--secondary"
                      onClick={() => handleViewDetail(solicitud)}
                    >
                      <Eye size={16} /> Ver detalle
                    </button>
                  </article>
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                itemLabel="solicitud"
                itemPluralLabel="solicitudes"
                onPageChange={setCurrentPage}
                pageSize={PAGE_SIZE}
                totalItems={filteredSolicitudes.length}
              />
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
          overlayClassName="lk-admin-modal"
          actions={
            <button className="lk-btn lk-btn--primary" onClick={() => setShowMetricsModal(false)}>
              Cerrar
            </button>
          }
        >
          <div className="lk-role-dashboard__metrics">
            <DashboardMetricCard icon={Mail} label="Solicitudes" value={summary.total} description="Total de reactivaciones" tone="gray" />
            <DashboardMetricCard icon={AlertCircle} label="Pendientes" value={summary.pending} description="Casos por decidir" tone="gray" />
            <DashboardMetricCard icon={CheckCircle} label="Aprobadas" value={summary.approved} description="Tutores reactivados" tone="gray" />
            <DashboardMetricCard icon={XCircle} label="Rechazadas" value={summary.rejected} description="Respuestas negativas" tone="gray" />
          </div>
        </RoleModal>

        {/* Modal de detalle */}
        <RoleModal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          eyebrow="Detalle"
          title={selectedRequest?.tutor_nombre || "Solicitud"}
          width={540}
          overlayClassName="lk-admin-modal"
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
          overlayClassName="lk-admin-modal"
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
