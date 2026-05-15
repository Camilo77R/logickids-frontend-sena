import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, CheckCircle, XCircle, Clock, Search, X } from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import { useAuth } from "../../hooks/useAuth";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";

// Filtros por estado
const STATUS_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "pendiente", label: "Pendientes" },
  { value: "aprobado", label: "Aprobados" },
  { value: "rechazado", label: "Rechazados" },
];

// Colores para los badges
const getEstadoColor = (estado) => {
  switch (estado) {
    case "pendiente":
      return "warning";
    case "aprobado":
      return "success";
    case "rechazado":
      return "danger";
    default:
      return "secondary";
  }
};

const getEstadoLabel = (estado) => {
  switch (estado) {
    case "pendiente":
      return "Pendiente";
    case "aprobado":
      return "Aprobado";
    case "rechazado":
      return "Rechazado";
    default:
      return estado;
  }
};

export default function SolicitudesPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [filteredSolicitudes, setFilteredSolicitudes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [rechazoMotivo, setRechazoMotivo] = useState("");
  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  // Cargar solicitudes
  const loadSolicitudes = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/solicitudes/admin/solicitudes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar las solicitudes");
      }

      const data = await response.json();
      // ✅ CORREGIDO: el backend devuelve data.data
      setSolicitudes(data.data || data.solicitudes || []);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSolicitudes();
  }, []);

  // Aplicar filtros y búsqueda
  useEffect(() => {
    let filtered = [...solicitudes];

    if (statusFilter !== "todos") {
      filtered = filtered.filter((s) => s.estado_solicitud === statusFilter);
    }

    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.tutor_nombre?.toLowerCase().includes(term) ||
          s.correo_contacto?.toLowerCase().includes(term)
      );
    }

    setFilteredSolicitudes(filtered);
  }, [solicitudes, statusFilter, searchTerm]);

  // Aprobar solicitud
  const handleAprobar = async (id) => {
    if (!id) {
      setFeedback({ type: "error", message: "ID de solicitud no válido" });
      return;
    }
    try {
      const response = await fetch(`http://localhost:3000/api/solicitudes/admin/solicitudes/${id}/aprobar`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al aprobar la solicitud");
      }

      setFeedback({ type: "success", message: "Solicitud aprobada y usuario reactivado ✅" });
      loadSolicitudes();
      setSelectedSolicitud(null);
      
      setTimeout(() => setFeedback({ type: "", message: "" }), 3000);
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  // Abrir modal de rechazo
  const openRechazoModal = (solicitud) => {
    setSelectedSolicitud(solicitud);
    setRechazoMotivo("");
    setShowRechazoModal(true);
  };

  // Rechazar solicitud
  const handleRechazar = async () => {
    if (!rechazoMotivo.trim()) {
      setFeedback({ type: "error", message: "Debes escribir un motivo para rechazar la solicitud" });
      return;
    }

    if (!selectedSolicitud?.id) {
      setFeedback({ type: "error", message: "ID de solicitud no válido" });
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/solicitudes/admin/solicitudes/${selectedSolicitud.id}/rechazar`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ motivo_rechazo: rechazoMotivo }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al rechazar la solicitud");
      }

      setFeedback({ type: "success", message: "Solicitud rechazada. Se ha notificado al tutor." });
      setShowRechazoModal(false);
      setSelectedSolicitud(null);
      loadSolicitudes();
      
      setTimeout(() => setFeedback({ type: "", message: "" }), 3000);
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
  };

  // Acciones del header
  const pageActions = (
    <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
      <div className="lk-actions">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`lk-btn ${
              statusFilter === filter.value ? "lk-btn--primary" : "lk-btn--secondary"
            }`}
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div style={{ position: "relative" }}>
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "0.5rem 1rem",
            paddingLeft: "2.5rem",
            paddingRight: searchTerm ? "2rem" : "1rem",
            borderRadius: "2rem",
            border: "1px solid var(--lk-color-border)",
            fontSize: "0.9rem",
            minWidth: "220px",
            outline: "none",
            transition: "all 0.2s ease",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--lk-color-primary)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--lk-color-border)")}
        />
        <span
          style={{
            position: "absolute",
            left: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--lk-color-text-muted)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Search size={18} strokeWidth={1.5} />
        </span>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            style={{
              position: "absolute",
              right: "0.5rem",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.25rem",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--lk-color-text-muted)",
            }}
            aria-label="Limpiar búsqueda"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <AppShell
      title="Solicitudes de Reactivación"
      description="Gestiona las solicitudes de reactivación de tutores suspendidos"
      actions={pageActions}
    >
      {feedback.message && (
        <div className={`lk-alert lk-alert--${feedback.type}`} style={{ marginBottom: "1rem" }}>
          {feedback.message}
        </div>
      )}

      {error && (
        <div className="lk-alert lk-alert--error" style={{ marginBottom: "1rem" }}>
          {error}
        </div>
      )}

      <div className="lk-table-card">
        <h2>Todas las solicitudes</h2>

        {isLoading ? (
          <div className="lk-loading">Cargando solicitudes...</div>
        ) : filteredSolicitudes.length === 0 ? (
          <EmptyState
            title="No hay solicitudes"
            description={searchTerm ? "No se encontraron resultados con ese filtro o búsqueda" : "No hay solicitudes de reactivación para mostrar"}
          />
        ) : (
          <>
            <div className="lk-table-wrap">
              <table className="lk-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tutor</th>
                    <th>Correo de contacto</th>
                    <th>Motivo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSolicitudes.map((solicitud) => (
                    <tr key={solicitud.id}>
                      <td>{new Date(solicitud.fecha_solicitud).toLocaleDateString()}</td>
                      <td>
                        <strong>{solicitud.tutor_nombre}</strong>
                        <p className="lk-muted" style={{ margin: 0, fontSize: "0.75rem" }}>
                          {solicitud.tutor_email}
                        </p>
                      </td>
                      <td>{solicitud.correo_contacto}</td>
                      <td>
                        <div style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {solicitud.motivo}
                        </div>
                      </td>
                      <td>
                        <span className={`lk-status-badge lk-status-badge--${getEstadoColor(solicitud.estado_solicitud)}`}>
                          {getEstadoLabel(solicitud.estado_solicitud)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="lk-btn lk-btn--small lk-btn--secondary"
                          onClick={() => setSelectedSolicitud(solicitud)}
                        >
                          <Eye size={16} /> Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="lk-table-footer">
              Mostrando {filteredSolicitudes.length} de {solicitudes.length} solicitudes
            </div>
          </>
        )}
      </div>

      {/* Modal de detalle para solicitudes pendientes */}
      {selectedSolicitud && selectedSolicitud.estado_solicitud === "pendiente" && (
        <div className="lk-modal-overlay" onClick={() => setSelectedSolicitud(null)}>
          <div className="lk-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lk-modal-header">
              <h3>Solicitud de reactivación</h3>
              <button className="lk-modal-close" onClick={() => setSelectedSolicitud(null)}>
                ✕
              </button>
            </div>
            <div className="lk-modal-body">
              <div className="lk-modal-field">
                <strong>Tutor:</strong>
                <p>{selectedSolicitud.tutor_nombre}</p>
              </div>
              <div className="lk-modal-field">
                <strong>Email del tutor:</strong>
                <p>{selectedSolicitud.tutor_email}</p>
              </div>
              <div className="lk-modal-field">
                <strong>Correo de contacto:</strong>
                <p>{selectedSolicitud.correo_contacto}</p>
              </div>
              <div className="lk-modal-field">
                <strong>Motivo:</strong>
                <p>{selectedSolicitud.motivo}</p>
              </div>
              {selectedSolicitud.descripcion && (
                <div className="lk-modal-field">
                  <strong>Descripción:</strong>
                  <p>{selectedSolicitud.descripcion}</p>
                </div>
              )}
              <div className="lk-modal-field">
                <strong>Fecha de solicitud:</strong>
                <p>{new Date(selectedSolicitud.fecha_solicitud).toLocaleString()}</p>
              </div>
            </div>
            <div className="lk-modal-footer">
              <button
                className="lk-btn lk-btn--success"
                onClick={() => handleAprobar(selectedSolicitud.id)}
              >
                <CheckCircle size={18} /> Aprobar
              </button>
              <button
                className="lk-btn lk-btn--danger"
                onClick={() => openRechazoModal(selectedSolicitud)}
              >
                <XCircle size={18} /> Rechazar
              </button>
              <button
                className="lk-btn lk-btn--secondary"
                onClick={() => setSelectedSolicitud(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de rechazo - Versión mejorada */}
      {showRechazoModal && (
        <div className="lk-modal-overlay" onClick={() => setShowRechazoModal(false)}>
          <div className="lk-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lk-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  padding: '0.5rem',
                  background: '#fee2e2',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <XCircle size={24} color="#dc2626" />
                </div>
                <h3 style={{ margin: 0 }}>Rechazar solicitud</h3>
              </div>
              <button className="lk-modal-close" onClick={() => setShowRechazoModal(false)}>
                ✕
              </button>
            </div>

            <div className="lk-modal-body">
              <div style={{
                background: '#fef3c7',
                borderLeft: '4px solid #f59e0b',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.5rem'
              }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e' }}>
                  ⚠️ Esta acción no se puede deshacer. El tutor recibirá un correo con el motivo del rechazo.
                </p>
              </div>

              <div className="lk-form-group">
                <label className="lk-label" style={{ fontWeight: 600 }}>
                  Motivo del rechazo <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  value={rechazoMotivo}
                  onChange={(e) => setRechazoMotivo(e.target.value)}
                  rows="4"
                  className="lk-input"
                  placeholder="Ej: El tutor no ha cumplido con las normas de la plataforma..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  autoFocus
                />
                <small style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.7rem', color: '#6b7280' }}>
                  Este motivo será enviado al tutor por correo electrónico
                </small>
              </div>

              {selectedSolicitud && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  fontSize: '0.8rem'
                }}>
                  <strong>Información de la solicitud:</strong>
                  <div style={{ marginTop: '0.5rem' }}>
                    <div><strong>Tutor:</strong> {selectedSolicitud.tutor_nombre}</div>
                    <div><strong>Correo de contacto:</strong> {selectedSolicitud.correo_contacto}</div>
                    <div><strong>Motivo original:</strong> {selectedSolicitud.motivo}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="lk-modal-footer" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                className="lk-btn lk-btn--secondary"
                onClick={() => setShowRechazoModal(false)}
              >
                Cancelar
              </button>
              <button
                className="lk-btn lk-btn--danger"
                onClick={handleRechazar}
                disabled={!rechazoMotivo.trim()}
                style={{
                  background: rechazoMotivo.trim() ? '#dc2626' : '#9ca3af',
                  cursor: rechazoMotivo.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                <XCircle size={16} style={{ marginRight: '0.5rem' }} />
                Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de detalle para solicitudes ya procesadas */}
      {selectedSolicitud && selectedSolicitud.estado_solicitud !== "pendiente" && (
        <div className="lk-modal-overlay" onClick={() => setSelectedSolicitud(null)}>
          <div className="lk-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lk-modal-header">
              <h3>Detalle de la solicitud</h3>
              <button className="lk-modal-close" onClick={() => setSelectedSolicitud(null)}>
                ✕
              </button>
            </div>
            <div className="lk-modal-body">
              <div className="lk-modal-field">
                <strong>Estado:</strong>
                <span className={`lk-status-badge lk-status-badge--${getEstadoColor(selectedSolicitud.estado_solicitud)}`}>
                  {getEstadoLabel(selectedSolicitud.estado_solicitud)}
                </span>
              </div>
              <div className="lk-modal-field">
                <strong>Tutor:</strong>
                <p>{selectedSolicitud.tutor_nombre}</p>
              </div>
              <div className="lk-modal-field">
                <strong>Correo de contacto:</strong>
                <p>{selectedSolicitud.correo_contacto}</p>
              </div>
              <div className="lk-modal-field">
                <strong>Motivo:</strong>
                <p>{selectedSolicitud.motivo}</p>
              </div>
              {selectedSolicitud.respuesta_admin && (
                <div className="lk-modal-field">
                  <strong>Motivo del rechazo:</strong>
                  <p className="lk-modal-rejection">{selectedSolicitud.respuesta_admin}</p>
                </div>
              )}
              <div className="lk-modal-field">
                <strong>Fecha de solicitud:</strong>
                <p>{new Date(selectedSolicitud.fecha_solicitud).toLocaleString()}</p>
              </div>
              {selectedSolicitud.fecha_respuesta && (
                <div className="lk-modal-field">
                  <strong>Fecha de respuesta:</strong>
                  <p>{new Date(selectedSolicitud.fecha_respuesta).toLocaleString()}</p>
                </div>
              )}
            </div>
            <div className="lk-modal-footer">
              <button
                className="lk-btn lk-btn--secondary"
                onClick={() => setSelectedSolicitud(null)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos CSS */}
      <style jsx>{`
        .lk-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .lk-modal {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        .lk-modal-header {
          padding: 1rem;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .lk-modal-header h3 {
          margin: 0;
        }
        .lk-modal-body {
          padding: 1rem;
        }
        .lk-modal-footer {
          padding: 1rem;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }
        .lk-modal-close {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: #6b7280;
        }
        .lk-modal-field {
          margin-bottom: 1rem;
        }
        .lk-modal-field strong {
          display: block;
          margin-bottom: 0.25rem;
          font-size: 0.85rem;
          color: #6b7280;
        }
        .lk-modal-field p {
          margin: 0;
          padding: 0.5rem;
          background: #f5f5f5;
          border-radius: 8px;
        }
        .lk-modal-warning {
          color: #dc2626;
          margin-bottom: 1rem;
        }
        .lk-modal-rejection {
          background: #fee2e2;
          color: #991b1b;
        }
        .lk-status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .lk-status-badge--warning {
          background: #fef3c7;
          color: #d97706;
        }
        .lk-status-badge--success {
          background: #d1fae5;
          color: #059669;
        }
        .lk-status-badge--danger {
          background: #fee2e2;
          color: #dc2626;
        }
        .lk-btn--small {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }
        .lk-btn--success {
          background: #10b981;
          color: white;
        }
        .lk-btn--danger {
          background: #ef4444;
          color: white;
        }
        .lk-table-footer {
          margin-top: 1rem;
          padding: 0.75rem;
          text-align: right;
          font-size: 0.85rem;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        .lk-form-group {
          margin-bottom: 1rem;
        }
        .lk-label {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
        }
      `}</style>
    </AppShell>
  );
}