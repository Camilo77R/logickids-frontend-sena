import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/common/EmptyState";
import StatusBadge from "../../components/common/StatusBadge";
import AppShell from "../../components/layout/AppShell";
import { USER_STATE_OPTIONS } from "../../constants/roles";
import adminService from "../../services/adminService";

const USER_FILTERS = [
  { value: "todos", label: "Todos" },
  { value: "tutor", label: "Tutores" },
  { value: "admin", label: "Admins" },
];

export default function UsuariosPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState("todos");
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
    if (roleFilter === "todos") return users;
    return users.filter((user) => user.rol === roleFilter);
  }, [roleFilter, users]);

  const handleStateChange = async (userId, estado) => {
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
    <div className="lk-actions">
      {USER_FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          className={`lk-btn ${
            roleFilter === filter.value ? "lk-btn--primary" : "lk-btn--secondary"
          }`}
          onClick={() => setRoleFilter(filter.value)}
        >
          {filter.label}
        </button>
      ))}
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
              description="Ajusta el filtro para explorar las cuentas disponibles."
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
                {USER_STATE_OPTIONS.map((option) => (
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
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </AppShell>
  );
}
