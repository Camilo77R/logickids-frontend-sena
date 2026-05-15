import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Check,
  Copy,
  Pencil,
  Power,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";
import AppShell from "../../components/layout/AppShell";
import DashboardMetricCard from "../../components/dashboard/DashboardMetricCard";
import DashboardPanel from "../../components/dashboard/DashboardPanel";
import EmptyState from "../../components/common/EmptyState";
import adminService from "../../services/adminService";

const EMPTY_FORM = {
  nombre: "",
  ciudad: "",
  direccion: "",
  telefono: "",
};

const validateForm = (form) => {
  const errors = {};

  if (!form.nombre.trim()) {
    errors.nombre = "El nombre es obligatorio.";
  }

  return errors;
};

export default function InstitucionesPage() {
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [credentials, setCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadInstitutions = async () => {
    try {
      setIsLoading(true);
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

  const filteredInstitutions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) return institutions;

    return institutions.filter((institution) =>
      [institution.nombre, institution.ciudad, institution.direccion, institution.telefono]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch))
    );
  }, [institutions, searchTerm]);

  const summary = useMemo(() => {
    const activeInstitutions = institutions.filter((institution) => institution.activo);
    const inactiveInstitutions = institutions.filter((institution) => !institution.activo);
    const activeTutors = institutions.reduce(
      (sum, institution) => sum + Number(institution.tutores_activos ?? 0),
      0
    );

    return {
      total: institutions.length,
      active: activeInstitutions.length,
      inactive: inactiveInstitutions.length,
      activeTutors,
    };
  }, [institutions]);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });

    window.setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleStartEdit = (institution) => {
    setEditingId(institution.id ?? institution.id_institucion);
    setForm({
      nombre: institution.nombre ?? "",
      ciudad: institution.ciudad ?? "",
      direccion: institution.direccion ?? "",
      telefono: institution.telefono ?? "",
    });
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = validateForm(form);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      ciudad: form.ciudad.trim() || undefined,
      direccion: form.direccion.trim() || undefined,
      telefono: form.telefono.trim() || undefined,
    };

    try {
      setIsSaving(true);

      if (editingId) {
        await adminService.updateInstitution(editingId, payload);
        showFeedback("success", "Institución actualizada correctamente.");
        handleCancelEdit();
      } else {
        const result = await adminService.createInstitution(payload);
        setCredentials(result?.admin ?? null);
        setForm(EMPTY_FORM);
        showFeedback(
          "success",
          "Institución creada. Guarda las credenciales del administrador antes de cerrar el modal."
        );
      }

      await loadInstitutions();
    } catch (error) {
      showFeedback("error", error.message || "No fue posible guardar la institución.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (institution) => {
    const confirmed = window.confirm(
      `¿Eliminar la institución "${institution.nombre}"? Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      await adminService.deleteInstitution(institution.id ?? institution.id_institucion);
      showFeedback("success", `Institución "${institution.nombre}" eliminada.`);
      await loadInstitutions();
    } catch (error) {
      showFeedback(
        "error",
        error.message || "No fue posible eliminar la institución. Verifica que no tenga usuarios asociados."
      );
    }
  };

  const handleToggleInstitution = async (institution) => {
    const isActive = Boolean(institution.activo);
    const confirmed = window.confirm(
      isActive
        ? `¿Desactivar "${institution.nombre}"? Esto congela el acceso institucional y cierra sesiones activas de estudiantes.`
        : `¿Reactivar "${institution.nombre}"? Esto vuelve a habilitar el acceso de la institución.`
    );

    if (!confirmed) return;

    try {
      if (isActive) {
        await adminService.deactivateInstitution(institution.id ?? institution.id_institucion);
        showFeedback(
          "success",
          `Institución "${institution.nombre}" desactivada. El acceso quedó congelado.`
        );
      } else {
        await adminService.reactivateInstitution(institution.id ?? institution.id_institucion);
        showFeedback("success", `Institución "${institution.nombre}" reactivada.`);
      }

      await loadInstitutions();
    } catch (error) {
      showFeedback(
        "error",
        error.message || "No fue posible actualizar el estado de la institución."
      );
    }
  };

  const handleCopyCredentials = async () => {
    const content = `Email: ${credentials.email}\nContraseña temporal: ${credentials.contrasena_temporal}`;
    await navigator.clipboard.writeText(content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <AppShell
      title="Instituciones"
      description="Controla el estado global de los colegios y congela o reactiva acceso cuando sea necesario."
    >
      <div className="lk-role-dashboard">
        {feedback ? <div className={`lk-alert lk-alert--${feedback.type}`}>{feedback.message}</div> : null}

        <section className="lk-role-dashboard__hero">
          <span className="lk-role-dashboard__hero-badge">Gobierno institucional</span>
          <h2 className="lk-role-dashboard__hero-title">Mapa completo de colegios</h2>
          <p className="lk-role-dashboard__hero-subtitle">
            El superadmin crea, corrige, congela o reactiva instituciones. Cuando una institución
            se desactiva, el backend corta sesiones activas de estudiantes y bloquea el acceso
            institucional.
          </p>

          <div className="lk-role-dashboard__hero-tags">
            <article className="lk-role-dashboard__hero-tag">
              <strong>{summary.total}</strong>
              <span>Instituciones</span>
            </article>
            <article className="lk-role-dashboard__hero-tag">
              <strong>{summary.active}</strong>
              <span>Activas</span>
            </article>
            <article className="lk-role-dashboard__hero-tag">
              <strong>{summary.inactive}</strong>
              <span>Congeladas</span>
            </article>
          </div>
        </section>

        <section className="lk-role-dashboard__metrics">
          <DashboardMetricCard
            icon={Building2}
            label="Instituciones"
            value={isLoading ? "..." : summary.total}
            description="Total de colegios visibles en la plataforma."
            tone="purple"
          />
          <DashboardMetricCard
            icon={ShieldCheck}
            label="Activas"
            value={isLoading ? "..." : summary.active}
            description="Hoy pueden operar con normalidad."
            tone="gold"
          />
          <DashboardMetricCard
            icon={Power}
            label="Congeladas"
            value={isLoading ? "..." : summary.inactive}
            description="Acceso institucional bloqueado temporalmente."
            tone="rose"
          />
          <DashboardMetricCard
            icon={UsersRound}
            label="Tutores activos"
            value={isLoading ? "..." : summary.activeTutors}
            description="Suma global de docentes activos en la red."
            tone="orange"
          />
        </section>

        <section className="lk-role-dashboard__grid">
          <DashboardPanel
            eyebrow={editingId ? "Editar" : "Crear"}
            title={editingId ? "Actualizar institución" : "Nueva institución"}
            subtitle="Formulario limpio para crear o corregir el registro global del colegio."
          >
            <form className="lk-role-form" onSubmit={handleSubmit}>
              <div className={`lk-field${formErrors.nombre ? " lk-field--error" : ""}`}>
                <label htmlFor="institution-name">Nombre</label>
                <input
                  id="institution-name"
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Colegio San José"
                />
                {formErrors.nombre ? <span className="lk-field-error">{formErrors.nombre}</span> : null}
              </div>

              <div className="lk-form-row">
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
                  <label htmlFor="institution-phone">Teléfono</label>
                  <input
                    id="institution-phone"
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                    placeholder="601 555 0000"
                  />
                </div>
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

              <div className="lk-role-form__actions">
                <button type="submit" className="lk-btn lk-btn--primary" disabled={isSaving}>
                  {isSaving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear institución"}
                </button>

                {editingId ? (
                  <button type="button" className="lk-btn lk-btn--secondary" onClick={handleCancelEdit}>
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>
          </DashboardPanel>

          <DashboardPanel
            eyebrow="Regla crítica"
            title="Qué significa congelar una institución"
            subtitle="Aquí no estamos decorando: esta pantalla debe comunicar el impacto real del backend."
            aside={<ShieldCheck size={18} color="var(--lk-purple)" aria-hidden="true" />}
          >
            <div className="lk-role-list">
              <article className="lk-role-list__item lk-role-list__item--gold">
                <div className="lk-role-list__top">
                  <span className="lk-role-list__title">Institución activa</span>
                  <span className="lk-role-list__meta lk-role-list__meta--gold">Operando</span>
                </div>
                <p className="lk-role-list__description">
                  Tutores y estudiantes pueden seguir trabajando bajo las reglas normales de acceso.
                </p>
              </article>

              <article className="lk-role-list__item lk-role-list__item--rose">
                <div className="lk-role-list__top">
                  <span className="lk-role-list__title">Institución congelada</span>
                  <span className="lk-role-list__meta lk-role-list__meta--rose">Acceso bloqueado</span>
                </div>
                <p className="lk-role-list__description">
                  El backend desactiva la institución y cierra sesiones activas de estudiantes. Es una acción de impacto global.
                </p>
              </article>
            </div>
          </DashboardPanel>
        </section>

        <DashboardPanel
          eyebrow="Directorio global"
          title="Instituciones registradas"
          subtitle="Bento institucional con búsqueda rápida y acciones reales sobre cada colegio."
          aside={
            <div className="lk-role-search">
              <Search size={16} className="lk-role-search__icon" aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nombre, ciudad o dirección..."
                className="lk-role-search__input"
              />
            </div>
          }
        >
          {!isLoading && !filteredInstitutions.length ? (
            <EmptyState
              title="No hay instituciones para esta búsqueda"
              description={
                searchTerm
                  ? "Ajusta el término de búsqueda para explorar mejor el directorio."
                  : "Crea la primera institución para comenzar a poblar la plataforma."
              }
            />
          ) : (
            <div className="lk-role-entity-grid">
              {filteredInstitutions.map((institution) => {
                const tone = institution.activo ? "gold" : "rose";
                const institutionId = institution.id ?? institution.id_institucion;
                const isEditing = editingId === institutionId;

                return (
                  <article
                    key={institutionId}
                    className={`lk-role-entity-card lk-role-entity-card--${tone}${isEditing ? " is-editing" : ""}`}
                  >
                    <div className="lk-role-entity-card__header">
                      <div>
                        <h3 className="lk-role-entity-card__title">{institution.nombre}</h3>
                        <p className="lk-role-entity-card__subtitle">
                          {institution.ciudad || "Sin ciudad registrada"}
                        </p>
                      </div>
                      <span className={`lk-role-list__meta lk-role-list__meta--${tone}`}>
                        {institution.activo ? "Activa" : "Congelada"}
                      </span>
                    </div>

                    <dl className="lk-role-entity-card__meta">
                      <div>
                        <dt>Dirección</dt>
                        <dd>{institution.direccion || "Sin dirección"}</dd>
                      </div>
                      <div>
                        <dt>Teléfono</dt>
                        <dd>{institution.telefono || "Sin teléfono"}</dd>
                      </div>
                      <div>
                        <dt>Tutores activos</dt>
                        <dd>{institution.tutores_activos ?? 0}</dd>
                      </div>
                    </dl>

                    <div className="lk-role-entity-card__actions">
                      <button
                        type="button"
                        className="lk-btn lk-btn--secondary"
                        onClick={() => handleStartEdit(institution)}
                      >
                        <Pencil size={16} /> Editar
                      </button>

                      <button
                        type="button"
                        className={`lk-btn ${institution.activo ? "lk-btn--secondary" : "lk-btn--primary"}`}
                        onClick={() => handleToggleInstitution(institution)}
                      >
                        {institution.activo ? <Power size={16} /> : <RotateCcw size={16} />}
                        {institution.activo ? "Congelar" : "Reactivar"}
                      </button>

                      <button
                        type="button"
                        className="lk-btn lk-btn--ghost-danger"
                        onClick={() => handleDelete(institution)}
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </DashboardPanel>
      </div>

      {credentials ? (
        <div className="lk-role-modal-overlay" onClick={() => setCredentials(null)}>
          <div className="lk-role-modal" onClick={(event) => event.stopPropagation()}>
            <div className="lk-role-modal__header">
              <div>
                <span className="lk-role-modal__eyebrow">Acceso inicial</span>
                <h3 className="lk-role-modal__title">Credenciales del administrador</h3>
              </div>
            </div>

            <p className="lk-role-modal__warning">
              Guarda estas credenciales ahora. El backend solo las devuelve una vez al crear la institución.
            </p>

            <div className="lk-role-list">
              <article className="lk-role-list__item">
                <div className="lk-role-list__top">
                  <span className="lk-role-list__title">Email del administrador</span>
                </div>
                <p className="lk-role-list__description">{credentials.email}</p>
              </article>

              <article className="lk-role-list__item">
                <div className="lk-role-list__top">
                  <span className="lk-role-list__title">Contraseña temporal</span>
                </div>
                <p className="lk-role-list__description">{credentials.contrasena_temporal}</p>
              </article>
            </div>

            <div className="lk-role-modal__actions">
              <button type="button" className="lk-btn lk-btn--secondary" onClick={handleCopyCredentials}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "Copiado" : "Copiar credenciales"}
              </button>
              <button type="button" className="lk-btn lk-btn--primary" onClick={() => setCredentials(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
