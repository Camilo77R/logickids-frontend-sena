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

export default function InstitucionesPage() {
  const [institutions, setInstitutions] = useState([]);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInstitutions = institutions.filter(inst =>
    inst.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.ciudad?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const loadInstitutions = async () => {
    setIsLoading(true);

    try {
      const data = await adminService.listInstitutions();
      setInstitutions(data);
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
      await adminService.createInstitution({
        nombre: form.nombre.trim(),
        ciudad: form.ciudad.trim(),
        direccion: form.direccion.trim(),
        telefono: form.telefono.trim(),
      });
      setForm(INITIAL_FORM);
      setFeedback({ type: "success", message: "Institución creada correctamente." });
      await loadInstitutions();
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
      title="Instituciones"
      description="Consulta, registra y elimina instituciones."
      actions={
        <button type="button" className="lk-btn lk-btn--secondary" onClick={loadInstitutions}>
          Recargar
        </button>
      }
    >
      <div className="lk-admin-grid">
        <section className="lk-panel-card lk-span-5">
          <h2>Nueva institución</h2>

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

        <section className="lk-table-card lk-span-7">
          <h2>Instituciones registradas</h2>

          {feedback ? (
            <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div>
          ) : null}

          <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <input
              type="text"
              placeholder="🔍 Search by name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "0.5rem",
                border: "1px solid #ccc",
                width: "280px",
                fontSize: "0.9rem"
              }}
            />
            <span className="lk-muted">{filteredInstitutions.length} of {institutions.length} institutions</span>
          </div>

          {!isLoading && !filteredInstitutions.length ? (
            searchTerm ? (
              <EmptyState
                title="No results found"
                description={`No institutions match "${searchTerm}"`}
              />
            ) : (
              <EmptyState
                title="Aún no hay instituciones"
                description="Registra la primera desde el formulario lateral."
              />
            )
          ) : null}

          {!!filteredInstitutions.length ? (
            <div className="lk-table-wrap">
              <table className="lk-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Ciudad</th>
                    <th>Dirección</th>
                    <th>Teléfono</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstitutions.map((institution) => (
                    <tr key={institution.id}>
                      <td>
                        <strong>{institution.nombre}</strong>
                      </td>
                      <td>{institution.ciudad || "Sin ciudad"}</td>
                      <td>{institution.direccion || "Sin dirección"}</td>
                      <td>{institution.telefono || "Sin teléfono"}</td>
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