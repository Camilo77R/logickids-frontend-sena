import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LogicKidsLogo from "../../components/branding/LogicKidsLogo";
import authService from "../../services/authService";

const ROLE_OPTIONS = [
  { value: "tutor", label: "Tutor" },
  { value: "admin", label: "Administrador institucional" },
  { value: "superadmin", label: "Superadmin" },
];

const INITIAL_FORM = {
  email: "",
  rol: "tutor",
  institucion_id: "",
};

const validateForm = (form) => {
  const errors = {};

  if (!form.email.trim()) {
    errors.email = "El correo es obligatorio.";
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = "El correo no tiene un formato válido.";
  }

  if (!form.rol) {
    errors.rol = "Debes seleccionar un rol.";
  }

  if (form.rol === "tutor" && !form.institucion_id) {
    errors.institucion_id = "Selecciona tu institución para orientar la recuperación.";
  }

  return errors;
};

const buildRecoveryGuide = ({ email, rol, institutionName }) => {
  if (rol === "tutor") {
    return {
      title: "Recuperación para tutor",
      summary: `Tu acceso depende del administrador institucional de ${institutionName}.`,
      steps: [
        `Confirma con ${institutionName} que tu cuenta esté activa para el correo ${email}.`,
        "Solicita al admin institucional que valide tu estado y coordine el restablecimiento interno.",
        "Si ya recuerdas tu contraseña y sí puedes entrar, usa el Centro de cuenta para cambiarla sin tocar backend.",
      ],
    };
  }

  if (rol === "admin") {
    return {
      title: "Recuperación para administrador",
      summary: "La recuperación de administradores la coordina el superadmin de plataforma.",
      steps: [
        `Conserva el correo ${email} como identificador oficial de la cuenta.`,
        "Contacta al superadmin para validar tu identidad y regenerar acceso de forma controlada.",
        "Una vez recuperes sesión, cambia la contraseña desde el Centro de cuenta para cerrar el ciclo de credenciales.",
      ],
    };
  }

  return {
    title: "Recuperación para superadmin",
    summary: "El acceso del superadmin requiere intervención técnica controlada.",
    steps: [
      `Documenta el correo ${email} y el contexto de pérdida de acceso.`,
      "Coordina la recuperación con el responsable técnico del proyecto o del despliegue.",
      "Después del reingreso, cambia la contraseña de inmediato desde el Centro de cuenta.",
    ],
  };
};

export default function RecuperarAccesoPage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [instituciones, setInstituciones] = useState([]);
  const [loadingInstituciones, setLoadingInstituciones] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const loadInstitutions = async () => {
      try {
        const data = await authService.listInstitutions();
        setInstituciones(data);
      } catch {
        setInstituciones([]);
      } finally {
        setLoadingInstituciones(false);
      }
    };

    loadInstitutions();
  }, []);

  const selectedInstitutionName = useMemo(() => {
    const selectedInstitution = instituciones.find(
      (institution) => String(institution.id_institucion ?? institution.id) === form.institucion_id
    );

    return selectedInstitution?.nombre || "tu institución";
  }, [form.institucion_id, instituciones]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "rol" && value !== "tutor" ? { institucion_id: "" } : {}),
    }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setResult(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const nextErrors = validateForm(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setResult(
      buildRecoveryGuide({
        email: form.email.trim().toLowerCase(),
        rol: form.rol,
        institutionName: selectedInstitutionName,
      })
    );
  };

  return (
    <div className="lk-auth-page">
      <div className="lk-auth-shell lk-auth-shell--single">
        <section className="lk-auth-card">
          <div className="lk-auth-brand" style={{ marginBottom: "1.25rem" }}>
            <LogicKidsLogo size={44} />
            <div className="lk-auth-brand-copy">
              <strong>LogicKids</strong>
              <span>Recuperar acceso</span>
            </div>
          </div>

          <header className="lk-auth-card-header">
            <h1>Centro de recuperación</h1>
            <p style={{ fontSize: "0.92rem", color: "#6b7280", marginBottom: 0 }}>
              Esta web no inventa un reset automático que el backend no tiene. Aquí te guiamos con
              el flujo real de negocio para recuperar acceso sin romper el sistema.
            </p>
          </header>

          <form className="lk-form-grid" onSubmit={handleSubmit} noValidate>
            <div className={`lk-field ${errors.email ? "lk-field--error" : ""}`}>
              <label htmlFor="recovery-email">Correo de la cuenta</label>
              <input
                id="recovery-email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="tu@correo.com"
              />
              {errors.email ? <span className="lk-field-error">{errors.email}</span> : null}
            </div>

            <div className={`lk-field ${errors.rol ? "lk-field--error" : ""}`}>
              <label htmlFor="recovery-role">Tipo de usuario</label>
              <select id="recovery-role" name="rol" value={form.rol} onChange={handleChange}>
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.rol ? <span className="lk-field-error">{errors.rol}</span> : null}
            </div>

            {form.rol === "tutor" ? (
              <div className={`lk-field ${errors.institucion_id ? "lk-field--error" : ""}`}>
                <label htmlFor="recovery-institution">Institución</label>
                <select
                  id="recovery-institution"
                  name="institucion_id"
                  value={form.institucion_id}
                  onChange={handleChange}
                  disabled={loadingInstituciones}
                >
                  <option value="">
                    {loadingInstituciones
                      ? "Cargando instituciones..."
                      : "-- Selecciona tu institución --"}
                  </option>
                  {instituciones.map((institution) => (
                    <option
                      key={institution.id_institucion ?? institution.id}
                      value={institution.id_institucion ?? institution.id}
                    >
                      {institution.nombre}
                    </option>
                  ))}
                </select>
                {errors.institucion_id ? (
                  <span className="lk-field-error">{errors.institucion_id}</span>
                ) : null}
              </div>
            ) : null}

            <button type="submit" className="lk-btn lk-btn--primary lk-btn--full">
              Ver pasos de recuperación
            </button>

            {result ? (
              <div className="lk-alert lk-alert--success" style={{ textAlign: "left" }}>
                <strong style={{ display: "block", marginBottom: "0.45rem" }}>{result.title}</strong>
                <p style={{ marginBottom: "0.75rem" }}>{result.summary}</p>
                <ol style={{ margin: 0, paddingLeft: "1.1rem" }}>
                  {result.steps.map((step) => (
                    <li key={step} style={{ marginBottom: "0.45rem" }}>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}

            <div className="text-center mt-2" style={{ fontSize: "0.85rem", color: "#6b7280" }}>
              <span>¿Ya recuerdas tu acceso? </span>
              <Link to="/login" style={{ color: "#1796ed", fontWeight: 700 }}>
                Volver al login
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
