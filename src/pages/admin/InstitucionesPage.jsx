import { useEffect, useState } from "react";
import EmptyState from "../../components/common/EmptyState";
import AppShell from "../../components/layout/AppShell";
import adminService from "../../services/adminService";

const INITIAL_FORM = {
  nombre: "",
  ciudad: "",
  direccion: "",
  telefono: "",
};

const validateInstitutionForm = (form) => {
  const nextErrors = {};

  if (!form.nombre.trim()) {
    nextErrors.nombre = "El nombre de la institución es obligatorio.";
  }

  return nextErrors;
};

const normalizeInstitutions = (rows) =>
  [...rows].sort((left, right) => left.nombre.localeCompare(right.nombre, "es", { sensitivity: "base" }));

const toInstitutionRow = (tenant) => ({
  id: tenant?.institucion?.id,
  nombre: tenant?.institucion?.nombre ?? "Institución sin nombre",
  ciudad: tenant?.institucion?.ciudad ?? "",
  direccion: "",
  telefono: "",
  tutores_activos: 0,
});

export default function InstitucionesPage() {
  const [institutions, setInstitutions] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [createdTenant, setCreatedTenant] = useState(null);

  const loadInstitutions = async ({ preserveFeedback = false } = {}) => {
    setIsLoading(true);

    try {
      const data = await adminService.listInstitutions();
      setInstitutions(normalizeInstitutions(data));
      if (!preserveFeedback) {
        setFeedback(null);
      }
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible cargar las instituciones.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInstitutions();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setFeedback(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validateInstitutionForm(form);

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSaving(true);
      setFeedback(null);

      const created = await adminService.createInstitution({
        nombre: form.nombre.trim(),
        ciudad: form.ciudad.trim(),
        direccion: form.direccion.trim(),
        telefono: form.telefono.trim(),
      });

      setCreatedTenant(created);
      setInstitutions((current) => {
        const nextRow = toInstitutionRow(created);
        const withoutDuplicate = current.filter((institution) => institution.id !== nextRow.id);
        return normalizeInstitutions([...withoutDuplicate, nextRow]);
      });
      setForm(INITIAL_FORM);
      setFeedback({
        type: "success",
        message: "Institución creada correctamente. Guarda las credenciales del admin generado.",
      });
      await loadInstitutions({ preserveFeedback: true });
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible crear la institución.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (institution) => {
    const confirmDelete = window.confirm(
      `¿Seguro que quieres eliminar la institución "${institution.nombre}"?`
    );

    if (!confirmDelete) return;

    try {
      await adminService.deleteInstitution(institution.id);
      setFeedback({ type: "success", message: "Institución eliminada correctamente." });
      await loadInstitutions();
    } catch (error) {
      setFeedback({
        type: "error",
        message: error.message || "No fue posible eliminar la institución.",
      });
    }
  };

  return (
    <AppShell
      eyebrow="Superadmin"
      title="Instituciones"
      description="Crea tenants nuevos y consulta el directorio global de instituciones."
      actions={
        <button type="button" className="lk-btn lk-btn--secondary" onClick={loadInstitutions}>
          Recargar
        </button>
      }
    >
      <div className="lk-admin-grid">
        <section className="lk-panel-card lk-span-5">
          <h2>Nueva institución</h2>
          <p className="lk-muted" style={{ marginTop: 0 }}>
            Al crearla se generará automáticamente un usuario administrador inicial para ese tenant.
          </p>

          <form className="lk-form-grid" onSubmit={handleSubmit} noValidate>
            <div className={`lk-field ${errors.nombre ? "lk-field--error" : ""}`}>
              <label htmlFor="institution-name">Nombre</label>
              <input
                id="institution-name"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Colegio San José"
              />
              {errors.nombre ? <span className="lk-field-error">{errors.nombre}</span> : null}
            </div>

            <div className="lk-field">
              <label htmlFor="institution-city">Ciudad</label>
              <input
                id="institution-city"
                name="ciudad"
                value={form.ciudad}
                onChange={handleChange}
                placeholder="Bogotá"
              />
            </div>

            <div className="lk-field">
              <label htmlFor="institution-address">Dirección</label>
              <input
                id="institution-address"
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                placeholder="Cra 10 # 25-30"
              />
            </div>

            <div className="lk-field">
              <label htmlFor="institution-phone">Teléfono</label>
              <input
                id="institution-phone"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="601 555 0000"
              />
            </div>

            <button type="submit" className="lk-btn lk-btn--primary" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Crear institución"}
            </button>
          </form>
        </section>

        <section className="lk-panel-card lk-span-7">
          <h2>Admin generado</h2>

          {feedback ? (
            <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div>
          ) : null}

          {!createdTenant ? (
            <EmptyState
              title="Sin credenciales recientes"
              description="Cuando crees una institución, aquí aparecerán el correo y la contraseña temporal del admin inicial."
            />
          ) : (
            <div
              style={{
                display: "grid",
                gap: "1rem",
              }}
            >
              <div className="lk-list-item">
                <strong>Institución creada</strong>
                <p className="lk-muted" style={{ marginBottom: 0 }}>
                  {createdTenant.institucion?.nombre}
                  {createdTenant.institucion?.ciudad
                    ? ` · ${createdTenant.institucion.ciudad}`
                    : ""}
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="lk-list-item">
                  <strong>Correo del admin</strong>
                  <p className="lk-muted" style={{ marginBottom: 0 }}>
                    {createdTenant.admin?.email || "No disponible"}
                  </p>
                </div>
                <div className="lk-list-item">
                  <strong>Contraseña temporal</strong>
                  <p className="lk-muted" style={{ marginBottom: 0 }}>
                    {createdTenant.admin?.contrasena_temporal || "No disponible"}
                  </p>
                </div>
              </div>

              <div className="lk-alert lk-alert--success">
                Comparte estas credenciales de forma segura. Esta contraseña solo se muestra en este momento de creación.
              </div>
            </div>
          )}
        </section>

        <section className="lk-table-card lk-span-12">
          <h2>Instituciones registradas</h2>

          {isLoading ? (
            <p className="lk-muted">Cargando instituciones...</p>
          ) : null}

          {!isLoading && !institutions.length ? (
            <EmptyState
              title="Aún no hay instituciones"
              description="Registra la primera desde el formulario superior."
            />
          ) : null}

          {!!institutions.length ? (
            <div className="lk-table-wrap">
              <table className="lk-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Ciudad</th>
                    <th>Dirección</th>
                    <th>Teléfono</th>
                    <th>Tutores activos</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map((institution) => (
                    <tr key={institution.id}>
                      <td>
                        <strong>{institution.nombre}</strong>
                      </td>
                      <td>{institution.ciudad || "Sin ciudad"}</td>
                      <td>{institution.direccion || "Sin dirección"}</td>
                      <td>{institution.telefono || "Sin teléfono"}</td>
                      <td>{institution.tutores_activos ?? 0}</td>
                      <td>
                        <button
                          type="button"
                          className="lk-btn lk-btn--danger"
                          onClick={() => handleDelete(institution)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
