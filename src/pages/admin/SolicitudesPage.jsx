import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Eye,
  Mail,
  Search,
  ShieldAlert,
  X,
  XCircle,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import DashboardMetricCard from "../../components/dashboard/DashboardMetricCard";
import DashboardPanel from "../../components/dashboard/DashboardPanel";
import adminService from "../../services/adminService";

const STATUS_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobado", label: "Aprobados" },
  { value: "rechazado", label: "Rechazados" },
];

function buildRequestsSummary(requests) {
  return {
    total: requests.length,
    pending: requests.filter((request) => request.estado_solicitud === "pendiente").length,
    approved: requests.filter((request) => request.estado_solicitud === "aprobado").length,
    rejected: requests.filter((request) => request.estado_solicitud === "rechazado").length,
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
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [rechazoMotivo, setRechazoMotivo] = useState("");
  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const loadSolicitudes = async () => {
    setIsLoading(true);

    try {
      const data = await adminService.listReactivationRequests();
      setSolicitudes(data);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "No fue posible cargar las solicitudes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSolicitudes();
  }, []);

  const filteredSolicitudes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return solicitudes.filter((request) => {
      const matchesFilter =
        statusFilter === "todos" || request.estado_solicitud === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        request.tutor_nombre?.toLowerCase().includes(normalizedSearch) ||
        request.correo_contacto?.toLowerCase().includes(normalizedSearch) ||
        request.tutor_email?.toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [searchTerm, solicitudes, statusFilter]);

  const summary = useMemo(() => buildRequestsSummary(solicitudes), [solicitudes]);

  const handleAprobar = async (requestId) => {
    try {
      await adminService.approveReactivationRequest(requestId);
      setFeedback({
        type: "success",
        message: "Solicitud aprobada y tutor reactivado correctamente.",
      });
      setSelectedSolicitud(null);
      await loadSolicitudes();
    } catch (requestError) {
      setFeedback({ type: "error", message: requestError.message });
    }
  };

  const openRechazoModal = (request) => {
    setSelectedSolicitud(request);
    setRechazoMotivo("");
    setShowRechazoModal(true);
  };

  const handleRechazar = async () => {
    if (!rechazoMotivo.trim() || !selectedSolicitud) {
      setFeedback({
        type: "error",
        message: "Debes escribir un motivo antes de rechazar la solicitud.",
      });
      return;
    }

    try {
      await adminService.rejectReactivationRequest(selectedSolicitud.id, rechazoMotivo.trim());
      setFeedback({
        type: "success",
        message: "Solicitud rechazada. El tutor recibirá la respuesta correspondiente.",
      });
      setShowRechazoModal(false);
      setSelectedSolicitud(null);
      await loadSolicitudes();
    } catch (requestError) {
      setFeedback({ type: "error", message: requestError.message });
    }
  };

  const pageActions = (
    <div className="lk-role-page__toolbar">
      <div className="lk-role-page__filters">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`lk-role-page__filter${statusFilter === filter.value ? " is-active" : ""}`}
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="lk-role-search">
        <Search size={18} className="lk-role-search__icon" aria-hidden="true" />
        <input
          type="search"
          className="lk-role-search__input"
          placeholder="Buscar por tutor o correo"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        {searchTerm ? (
          <button
            type="button"
            className="lk-input-action"
            onClick={() => setSearchTerm("")}
            aria-label="Limpiar búsqueda"
          >
            <X size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );

  return (
    <AppShell
      title="Solicitudes"
      description="Aquí el admin resuelve reactivaciones de tutores suspendidos y mantiene el acceso bajo control."
      actions={pageActions}
    >
      <div className="lk-role-dashboard">
        {feedback.message ? (
          <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div>
        ) : null}

        {error ? <div className="lk-alert lk-alert--error">{error}</div> : null}

        <section className="lk-role-dashboard__metrics">
          <DashboardMetricCard
            icon={Mail}
            label="Solicitudes"
            value={isLoading ? "..." : summary.total}
            description="Reactivaciones visibles para la institución administrada."
            tone="purple"
          />
          <DashboardMetricCard
            icon={AlertCircle}
            label="Pendientes"
            value={isLoading ? "..." : summary.pending}
            description="Casos que requieren una decisión del admin."
            tone="orange"
          />
          <DashboardMetricCard
            icon={CheckCircle}
            label="Aprobadas"
            value={isLoading ? "..." : summary.approved}
            description="Tutores que recuperaron acceso vía flujo formal."
            tone="gold"
          />
          <DashboardMetricCard
            icon={XCircle}
            label="Rechazadas"
            value={isLoading ? "..." : summary.rejected}
            description="Respuestas negativas con motivo documentado."
            tone="rose"
          />
        </section>

        <section className="lk-role-section-grid">
          <DashboardPanel
            eyebrow="Bandeja institucional"
            title="Solicitudes visibles"
            subtitle="El admin revisa, aprueba o rechaza peticiones de tutores suspendidos."
            aside={<Mail size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            {!isLoading && filteredSolicitudes.length === 0 ? (
              <EmptyState
                title="No hay solicitudes para este filtro"
                description={
                  searchTerm
                    ? "Prueba con otro nombre, correo o estado."
                    : "La bandeja está vacía por ahora."
                }
              />
            ) : null}

            {filteredSolicitudes.length > 0 ? (
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
                            <StatusBadge
                              label={solicitud.estado_solicitud}
                              variant={solicitud.estado_solicitud}
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="lk-btn lk-btn--secondary"
                              onClick={() => setSelectedSolicitud(solicitud)}
                            >
                              <Eye size={16} aria-hidden="true" />
                              Ver detalle
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
            ) : null}
          </DashboardPanel>

          <DashboardPanel
            eyebrow="Revisión"
            title={selectedSolicitud ? selectedSolicitud.tutor_nombre : "Selecciona una solicitud"}
            subtitle="Cuando abras un caso verás aquí el contexto y las acciones que sí están permitidas."
            aside={<ShieldAlert size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            {!selectedSolicitud ? (
              <EmptyState
                title="Aún no hay caso abierto"
                description="Elige una fila de la bandeja para revisar motivo, estado y contacto."
              />
            ) : (
              <div className="lk-role-detail-stack">
                <div className="lk-role-info-grid">
                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Tutor</span>
                    <strong className="lk-role-info-card__value">
                      {selectedSolicitud.tutor_nombre}
                    </strong>
                    <p className="lk-role-info-card__hint">{selectedSolicitud.tutor_email}</p>
                  </article>

                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Correo de contacto</span>
                    <strong className="lk-role-info-card__value">
                      {selectedSolicitud.correo_contacto}
                    </strong>
                    <p className="lk-role-info-card__hint">
                      Canal por el que el tutor espera respuesta.
                    </p>
                  </article>

                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Estado actual</span>
                    <strong className="lk-role-info-card__value">
                      {selectedSolicitud.estado_solicitud}
                    </strong>
                    <p className="lk-role-info-card__hint">
                      Solicitada el {formatDate(selectedSolicitud.fecha_solicitud)}.
                    </p>
                  </article>
                </div>

                <article className="lk-role-info-card">
                  <span className="lk-role-info-card__label">Motivo del tutor</span>
                  <strong className="lk-role-info-card__value">{selectedSolicitud.motivo}</strong>
                  {selectedSolicitud.descripcion ? (
                    <p className="lk-role-info-card__hint">{selectedSolicitud.descripcion}</p>
                  ) : null}
                </article>

                {selectedSolicitud.respuesta_admin ? (
                  <article className="lk-role-info-card">
                    <span className="lk-role-info-card__label">Respuesta del admin</span>
                    <strong className="lk-role-info-card__value">
                      {selectedSolicitud.respuesta_admin}
                    </strong>
                    <p className="lk-role-info-card__hint">
                      Respondida el {formatDate(selectedSolicitud.fecha_respuesta)}.
                    </p>
                  </article>
                ) : null}

                {selectedSolicitud.estado_solicitud === "pendiente" ? (
                  <div className="lk-role-inline-actions">
                    <button
                      type="button"
                      className="lk-btn lk-btn--primary"
                      onClick={() => handleAprobar(selectedSolicitud.id)}
                    >
                      <CheckCircle size={16} aria-hidden="true" />
                      Aprobar
                    </button>
                    <button
                      type="button"
                      className="lk-btn lk-btn--ghost-danger"
                      onClick={() => openRechazoModal(selectedSolicitud)}
                    >
                      <XCircle size={16} aria-hidden="true" />
                      Rechazar
                    </button>
                  </div>
                ) : (
                  <p className="lk-role-text-note">
                    Esta solicitud ya tiene resolución. El detalle se conserva aquí como
                    referencia institucional.
                  </p>
                )}
              </div>
            )}
          </DashboardPanel>
        </section>

        {showRechazoModal ? (
          <div
            className="lk-role-modal-overlay"
            onClick={() => setShowRechazoModal(false)}
          >
            <div className="lk-role-modal" onClick={(event) => event.stopPropagation()}>
              <header className="lk-role-modal__header">
                <div>
                  <span className="lk-role-modal__eyebrow">Respuesta institucional</span>
                  <h3 className="lk-role-modal__title">Rechazar solicitud</h3>
                </div>
                <button
                  type="button"
                  className="lk-btn lk-btn--secondary"
                  onClick={() => setShowRechazoModal(false)}
                >
                  Cerrar
                </button>
              </header>

              <p className="lk-role-modal__warning">
                Esta acción enviará al tutor el motivo del rechazo. Procura dejar una respuesta
                clara y útil.
              </p>

              <div className="lk-role-modal__field">
                <strong>Motivo del rechazo</strong>
                <textarea
                  className="lk-role-textarea"
                  value={rechazoMotivo}
                  onChange={(event) => setRechazoMotivo(event.target.value)}
                  placeholder="Ejemplo: la solicitud no cumple todavía las condiciones para volver a activar la cuenta."
                  autoFocus
                />
                <span className="lk-role-modal__muted">
                  Este texto quedará asociado a la respuesta institucional.
                </span>
              </div>

              {selectedSolicitud ? (
                <div className="lk-role-modal__field">
                  <strong>Solicitud seleccionada</strong>
                  <p>
                    {selectedSolicitud.tutor_nombre} · {selectedSolicitud.correo_contacto}
                  </p>
                </div>
              ) : null}

              <div className="lk-role-modal__actions">
                <button
                  type="button"
                  className="lk-btn lk-btn--secondary"
                  onClick={() => setShowRechazoModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="lk-btn lk-btn--ghost-danger"
                  onClick={handleRechazar}
                >
                  Confirmar rechazo
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
