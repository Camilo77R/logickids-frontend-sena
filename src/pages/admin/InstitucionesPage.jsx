/**
 * InstitucionesPage — Panel de gestión de instituciones (Superadmin)
 *
 * Funcionalidades:
 *  - Listar todas las instituciones con conteo de tutores
 *  - Crear institución → muestra modal con credenciales del admin generado (RN-06)
 *  - Editar institución (nombre, ciudad, dirección, teléfono)
 *  - Eliminar institución (solo si no tiene usuarios — RN-07)
 *
 * IMPORTANTE (RN-06): Las credenciales del admin se muestran UNA SOLA VEZ
 * en el modal tras crear la institución. No se pueden recuperar luego.
 * El superadmin debe anotarlas o copiarlas antes de cerrar el modal.
 */
import { useEffect, useState } from "react";
import { Building2, Pencil, Trash2, Copy, Check, X, Search } from "lucide-react";
import adminService from "../../services/adminService";
import EmptyState from "../../components/common/EmptyState";

/** Formulario vacío reutilizable */
const EMPTY_FORM = { nombre: "", ciudad: "", direccion: "", telefono: "" };

/** Valida que el nombre no esté vacío */
const validateForm = (form) => {
  const errors = {};
  if (!form.nombre.trim()) errors.nombre = "El nombre es obligatorio.";
  return errors;
};

export default function InstitucionesPage() {
  const [institutions, setInstitutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInstitutions = institutions.filter(inst =>
    inst.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inst.ciudad?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estado del formulario (crear o editar)
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = modo crear

  // Modal de credenciales (RN-06: se muestran solo una vez)
  const [credenciales, setCredenciales] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadInstitutions = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.listInstitutions();
      setInstitutions(data);
    } catch (err) {
      showFeedback("error", err.message || "No se pudieron cargar las instituciones.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadInstitutions(); }, []);

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /** Inicia el modo edición llenando el formulario con los datos actuales */
  const handleStartEdit = (inst) => {
    setEditingId(inst.id ?? inst.id_institucion);
    setForm({
      nombre: inst.nombre ?? "",
      ciudad: inst.ciudad ?? "",
      direccion: inst.direccion ?? "",
      telefono: inst.telefono ?? "",
    });
    setFormErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /** Cancela la edición y vuelve al modo crear */
  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm(form);
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    const payload = {
      nombre: form.nombre.trim(),
      ciudad: form.ciudad.trim() || undefined,
      direccion: form.direccion.trim() || undefined,
      telefono: form.telefono.trim() || undefined,
    };

    setIsSaving(true);
    try {
      if (editingId) {
        // ── MODO EDITAR ──
        await adminService.updateInstitution(editingId, payload);
        showFeedback("success", "Institución actualizada correctamente.");
        handleCancelEdit();
      } else {
        // ── MODO CREAR ── Guarda las credenciales para mostrarlas en el modal (RN-06)
        const result = await adminService.createInstitution(payload);
        setCredenciales(result?.admin ?? null);
        setForm(EMPTY_FORM);
        showFeedback("success", "Institución creada. Guarda las credenciales del administrador.");
      }
      await loadInstitutions();
    } catch (err) {
      showFeedback("error", err.message || "No se pudo guardar la institución.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (inst) => {
    const nombre = inst.nombre;
    if (!window.confirm(`¿Eliminar la institución "${nombre}"?\nEsta acción no se puede deshacer.`)) return;

    try {
      await adminService.deleteInstitution(inst.id ?? inst.id_institucion);
      showFeedback("success", `Institución "${nombre}" eliminada.`);
      await loadInstitutions();
    } catch (err) {
      showFeedback("error", err.message || "No se pudo eliminar. Verifica que no tenga usuarios.");
    }
  };

  const handleCopyCredentials = () => {
    const texto = `Email: ${credenciales.email}\nContraseña temporal: ${credenciales.contrasena_temporal}`;
    navigator.clipboard.writeText(texto).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={styleWrapper.page}>
      {/* ── Encabezado ── */}
      <div style={styleWrapper.pageHeader}>
        <div style={styleWrapper.pageHeaderIcon}><Building2 size={26} color="#4f46e5" /></div>
        <div>
          <h1 style={styleWrapper.pageTitle}>Instituciones</h1>
          <p style={styleWrapper.pageSubtitle}>Crea, edita y elimina colegios registrados en la plataforma</p>
        </div>
      </div>

      {/* ── Feedback ── */}
      {feedback && (
        <div style={{ ...styleWrapper.alert, ...(feedback.type === "error" ? styleWrapper.alertError : styleWrapper.alertSuccess) }}>
          {feedback.message}
        </div>
      )}

      <div style={styleWrapper.grid}>
        {/* ── Formulario crear / editar ── */}
        <section style={styleWrapper.formCard}>
          <h2 style={styleWrapper.cardTitle}>
            {editingId ? "✏️ Editar institución" : "➕ Nueva institución"}
          </h2>

          <form onSubmit={handleSubmit} style={styleWrapper.form}>
            <Field label="Nombre *" error={formErrors.nombre}>
              <input name="nombre" value={form.nombre} onChange={handleChange}
                placeholder="Colegio San José" style={styleWrapper.input} />
            </Field>
            <Field label="Ciudad">
              <input name="ciudad" value={form.ciudad} onChange={handleChange}
                placeholder="Bogotá" style={styleWrapper.input} />
            </Field>
            <Field label="Dirección">
              <input name="direccion" value={form.direccion} onChange={handleChange}
                placeholder="Cra 10 # 25-30" style={styleWrapper.input} />
            </Field>
            <Field label="Teléfono">
              <input name="telefono" value={form.telefono} onChange={handleChange}
                placeholder="601 555 0000" style={styleWrapper.input} />
            </Field>

            <div style={{ display: "flex", gap: "8px" }}>
              <button type="submit" style={styleWrapper.btnPrimary} disabled={isSaving}>
                {isSaving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear institución"}
              </button>
              {editingId && (
                <button type="button" style={styleWrapper.btnSecondary} onClick={handleCancelEdit}>
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* ── Tabla de instituciones ── */}
        <section style={styleWrapper.tableCard}>
          <h2 style={styleWrapper.cardTitle}>Instituciones registradas ({institutions.length})</h2>

          {isLoading ? (
            <p style={styleWrapper.loading}>Cargando...</p>
          ) : (
            <>
              <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="🔍 Buscar por nombre o ciudad..."
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
                <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>{filteredInstitutions.length} de {institutions.length} instituciones</span>
              </div>

              {filteredInstitutions.length === 0 ? (
                searchTerm ? (
                  <EmptyState
                    title="No se encontraron resultados"
                    description={`No hay instituciones que coincidan con "${searchTerm}"`}
                  />
                ) : (
                  <div style={styleWrapper.empty}>
                    <Building2 size={40} color="#d1d5db" />
                    <p>No hay instituciones aún. Crea la primera.</p>
                  </div>
                )
              ) : (
                <div style={styleWrapper.tableWrap}>
                  <table style={styleWrapper.table}>
                    <thead>
                      <tr>
                        <th style={styleWrapper.th}>Nombre</th>
                        <th style={styleWrapper.th}>Ciudad</th>
                        <th style={styleWrapper.th}>Dirección</th>
                        <th style={styleWrapper.th}>Teléfono</th>
                        <th style={styleWrapper.th}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInstitutions.map((inst) => {
                        const id = inst.id ?? inst.id_institucion;
                        const isEditing = editingId === id;
                        return (
                          <tr key={id} style={isEditing ? styleWrapper.rowEditing : {}}>
                            <td style={styleWrapper.td}>
                              <strong>{inst.nombre}</strong>
                              {inst.ciudad && <div style={styleWrapper.tdSub}>{inst.ciudad}</div>}
                            </td>
                            <td style={styleWrapper.td}>{inst.ciudad || "—"}</td>
                            <td style={styleWrapper.td}>{inst.direccion || "—"}</td>
                            <td style={styleWrapper.td}>{inst.telefono || "—"}</td>
                            <td style={styleWrapper.td}>
                              <div style={{ display: "flex", gap: "6px" }}>
                                <button style={styleWrapper.btnEdit} onClick={() => handleStartEdit(inst)} title="Editar">
                                  <Pencil size={15} />
                                </button>
                                <button style={styleWrapper.btnDelete} onClick={() => handleDelete(inst)} title="Eliminar">
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* ── Modal de credenciales (RN-06) ── */}
      {credenciales && (
        <div style={styleWrapper.overlay}>
          <div style={styleWrapper.modal}>
            <div style={styleWrapper.modalHeader}>
              <h3 style={styleWrapper.modalTitle}>🔑 Credenciales del administrador</h3>
              <button style={styleWrapper.modalClose} onClick={() => setCredenciales(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={styleWrapper.modalWarning}>
              ⚠️ <strong>Guarda estas credenciales ahora.</strong> No podrás verlas de nuevo.
              El administrador debe usarlas para su primer acceso y luego cambiar la contraseña.
            </div>

            <div style={styleWrapper.credField}>
              <span style={styleWrapper.credLabel}>Email del administrador</span>
              <code style={styleWrapper.credValue}>{credenciales.email}</code>
            </div>

            <div style={styleWrapper.credField}>
              <span style={styleWrapper.credLabel}>Contraseña temporal</span>
              <code style={styleWrapper.credValue}>{credenciales.contrasena_temporal}</code>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button style={styleWrapper.btnCopy} onClick={handleCopyCredentials}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? "¡Copiado!" : "Copiar credenciales"}
              </button>
              <button style={styleWrapper.btnPrimary} onClick={() => setCredenciales(null)}>
                Ya las guardé, cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Componente auxiliar para campos de formulario con label y error */
function Field({ label, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
      <label style={{ fontSize: "13px", fontWeight: 600, color: "#374151" }}>{label}</label>
      {children}
      {error && <span style={{ color: "#ef4444", fontSize: "12px" }}>{error}</span>}
    </div>
  );
}

const styleWrapper = {
  page: { maxWidth: "1100px", margin: "0 auto" },
  pageHeader: { display: "flex", gap: "14px", alignItems: "center", marginBottom: "24px" },
  pageHeaderIcon: { background: "#ede9fe", borderRadius: "12px", padding: "12px", display: "flex" },
  pageTitle: { fontSize: "22px", fontWeight: 700, color: "#1e1b4b", margin: 0 },
  pageSubtitle: { fontSize: "13px", color: "#6b7280", marginTop: "2px" },
  alert: { padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" },
  alertSuccess: { background: "#dcfce7", color: "#166534" },
  alertError: { background: "#fee2e2", color: "#991b1b" },
  grid: { display: "grid", gridTemplateColumns: "320px 1fr", gap: "20px" },
  formCard: { background: "white", borderRadius: "14px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9", alignSelf: "start" },
  tableCard: { background: "white", borderRadius: "14px", padding: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", border: "1px solid #f1f5f9" },
  cardTitle: { fontSize: "16px", fontWeight: 700, color: "#1e1b4b", marginBottom: "16px", marginTop: 0 },
  form: { display: "flex", flexDirection: "column" },
  input: { padding: "9px 12px", borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "14px", width: "100%", boxSizing: "border-box" },
  btnPrimary: { flex: 1, padding: "10px 16px", background: "#4f46e5", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" },
  btnSecondary: { padding: "10px 16px", background: "#f3f4f6", color: "#374151", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px" },
  btnEdit: { padding: "6px 10px", background: "#eff6ff", color: "#2563eb", border: "none", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center" },
  btnDelete: { padding: "6px 10px", background: "#fef2f2", color: "#dc2626", border: "none", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center" },
  btnCopy: { padding: "10px 16px", background: "#f3f4f6", color: "#374151", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", display: "flex", gap: "6px", alignItems: "center", fontSize: "14px", fontWeight: 600 },
  loading: { textAlign: "center", color: "#9ca3af", padding: "30px" },
  empty: { textAlign: "center", color: "#9ca3af", padding: "40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "10px 12px", fontSize: "12px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left", borderBottom: "2px solid #f3f4f6" },
  td: { padding: "12px", fontSize: "14px", color: "#374151", borderBottom: "1px solid #f9fafb", verticalAlign: "middle" },
  tdSub: { fontSize: "12px", color: "#9ca3af", marginTop: "2px" },
  badge: { background: "#ede9fe", color: "#6d28d9", padding: "2px 10px", borderRadius: "999px", fontSize: "13px", fontWeight: 700 },
  rowEditing: { background: "#fef9c3" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" },
  modal: { background: "white", borderRadius: "16px", padding: "28px", maxWidth: "480px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  modalTitle: { fontSize: "18px", fontWeight: 700, color: "#1e1b4b", margin: 0 },
  modalClose: { background: "transparent", border: "none", cursor: "pointer", color: "#6b7280", display: "flex" },
  modalWarning: { background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "10px", padding: "12px 14px", fontSize: "13px", color: "#92400e", marginBottom: "20px", lineHeight: 1.6 },
  credField: { display: "flex", flexDirection: "column", gap: "4px", marginBottom: "14px" },
  credLabel: { fontSize: "12px", fontWeight: 600, color: "#6b7280", textTransform: "uppercase" },
  credValue: { background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "10px 14px", fontSize: "15px", color: "#1e1b4b", fontFamily: "monospace" },
};