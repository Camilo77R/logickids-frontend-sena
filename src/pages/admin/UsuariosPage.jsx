import { useEffect, useMemo, useState } from "react";
import { Search, X, AlertCircle } from "lucide-react";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import AppShell from "../../components/layout/AppShell";
import { USER_STATE_OPTIONS } from "../../constants/roles";
import adminService from "../../services/adminService";

// Filtros combinados: "Todos" + filtros por estado
const STATUS_FILTERS = [
  { value: "todos", label: "Todos", estado: null },
  { value: "activos", label: "Activos", estado: "activo" },
  { value: "inactivos", label: "Inactivos", estado: "inactivo" },
  { value: "suspendidos", label: "Suspendidos", estado: "suspendido" },
];

export default function UsuariosPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [statusFilter, setStatusFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const loadUsers = async (nextSelectedUserId) => {
    setIsLoading(true);

    try {
      const data = await adminService.listUsers();
      setUsers(data);

      const targetUserId = nextSelectedUserId ?? selectedUser?.id ?? data[0]?.id;

      if (targetUserId) {
        const detail = await adminService.getUser(targetUserId);
        setSelectedUser(detail);
      } else {
        setSelectedUser(null);
      }
    } catch (error) {
      setFeedback({ type: "error", message: error.message || "No fue posible cargar los usuarios." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleUsers = useMemo(() => {
    const activeFilter = STATUS_FILTERS.find(filter => filter.value === statusFilter);
    
    let filtered = [...users];

    if (activeFilter && activeFilter.estado !== null) {
      filtered = filtered.filter((user) => user.estado === activeFilter.estado);
    }

    if (searchTerm.trim() !== "") {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.nombre?.toLowerCase().includes(lowerSearchTerm) ||
          user.email?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    return filtered;
  }, [statusFilter, searchTerm, users]);

  const handleStateChange = async (userId, estado) => {
    // Prevenir cambios manuales desde suspendido
    if (selectedUser?.estado === "suspendido" && estado !== "suspendido") {
      setFeedback({
        type: "error",
        message: "⚠️ No puedes cambiar manualmente el estado de un tutor suspendido. Para reactivarlo, usa la sección 'Solicitudes de Reactivación' en el menú lateral.",
      });
      setTimeout(() => setFeedback(null), 5000);
      return;
    }

    try {
      await adminService.updateUserState(userId, estado);
      setFeedback({ type: "success", message: `Estado actualizado a "${estado}".` });
      await loadUsers(userId);
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible actualizar el estado del usuario.",
      });
    }
  };

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
            transition: "all 0.2s ease"
          }}
          onFocus={(e) => e.target.style.borderColor = "var(--lk-color-primary)"}
          onBlur={(e) => e.target.style.borderColor = "var(--lk-color-border)"}
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
            justifyContent: "center"
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
              color: "var(--lk-color-text-muted)"
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
      title="Usuarios"
      description="Consulta cuentas y gestiona su estado."
      actions={pageActions}
    >
      <div className="lk-admin-grid">
        <section className="lk-table-card lk-span-7">
          <h2>Listado de usuarios</h2>

          {feedback ? (
            <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div>
          ) : null}

          {!isLoading && !visibleUsers.length ? (
            <EmptyState
              title="No hay usuarios para este filtro"
              description="Ajusta el filtro o el término de búsqueda para explorar las cuentas disponibles."
            />
          ) : null}

          {!!visibleUsers.length ? (
            <div className="lk-table-wrap">
              <table className="lk-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Institución</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.nombre}</strong>
                        <p className="lk-muted">{user.email}</p>
                      </td>
                      <td>{user.rol}</td>
                      <td>
                        <StatusBadge label={user.estado} variant={user.estado} />
                      </td>
                      <td>{user.institucion || "Sin institución"}</td>
                      <td>
                        <button
                          type="button"
                          className="lk-btn lk-btn--secondary"
                          onClick={async () => {
                            const detail = await adminService.getUser(user.id);
                            setSelectedUser(detail);
                          }}
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <section className="lk-panel-card lk-span-5">
          <h2>Detalle del usuario</h2>

          {!selectedUser ? (
            <EmptyState
              title="Selecciona un usuario"
              description="Al hacerlo, podrás ver más información y gestionar su estado."
            />
          ) : (
            <>
            {selectedUser.estado === "suspendido" && (
  <div style={{
    marginBottom: "1rem",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    background: "#fef3c7",
    borderLeft: "4px solid #f59e0b",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem"
  }}>
    <AlertCircle size={18} color="#d97706" />
    <span style={{ fontSize: "0.85rem", color: "#92400e" }}>
      <strong>Usuario suspendido</strong> – Para reactivarlo, usa la sección{" "}
      <strong>"Solicitudes de Reactivación"</strong> en el menú lateral.
    </span>
  </div>
)}

              <div className="lk-inline-list" style={{ marginBottom: "1rem" }}>
                <div className="lk-list-item">
                  <strong>{selectedUser.nombre}</strong>
                  <p className="lk-muted">{selectedUser.email}</p>
                </div>
                <div className="lk-list-item">
                  <strong>Rol</strong>
                  <p className="lk-muted">{selectedUser.rol}</p>
                </div>
                <div className="lk-list-item">
                  <strong>Institución</strong>
                  <p className="lk-muted">
                    {selectedUser.institucion || "No asignada"}
                    {selectedUser.institucion_ciudad
                      ? ` · ${selectedUser.institucion_ciudad}`
                      : ""}
                  </p>
                </div>
              </div>

              <div className="lk-chip-row" style={{ marginBottom: "1rem" }}>
                <span className="lk-chip">Rol: {selectedUser.rol}</span>
                <span className="lk-chip">Estado: {selectedUser.estado}</span>
              </div>

              <div className="lk-card-actions">
                {USER_STATE_OPTIONS.map((option) => {
                  // Si el usuario está suspendido, solo mostrar botón de suspender (deshabilitado)
                  if (selectedUser.estado === "suspendido" && option.value === "suspendido") {
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className="lk-btn lk-btn--primary"
                        disabled
                        style={{ opacity: 0.6, cursor: "not-allowed" }}
                      >
                        Marcar {option.label.toLowerCase()} (actual)
                      </button>
                    );
                  }
                  
                  // Ocultar opción de suspender si el usuario ya está suspendido
                  if (selectedUser.estado === "suspendido" && option.value !== "suspendido") {
                    return null;
                  }
                  
                  // Ocultar opción de activar/inactivar si el usuario está suspendido
                  if (selectedUser.estado === "suspendido" && (option.value === "activo" || option.value === "inactivo")) {
                    return null;
                  }

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`lk-btn ${
                        selectedUser.estado === option.value
                          ? "lk-btn--primary"
                          : "lk-btn--secondary"
                      }`}
                      onClick={() => handleStateChange(selectedUser.id, option.value)}
                    >
                      Marcar {option.label.toLowerCase()}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}